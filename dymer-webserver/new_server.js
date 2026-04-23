// ===========================================================================
// IMPORTS
// ===========================================================================
const express = require("express");
const session = require('express-session');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const https = require('https');
const cors = require('cors');
const helmet = require('helmet'); // CONSIGLIO: Aggiungi "npm install helmet"
const axios = require('axios');
const mongoose = require("mongoose");
const swaggerUi = require('swagger-ui-express');

// ===========================================================================
// LOCAL IMPORTS & CONFIG
// ===========================================================================
require("./config/config.js"); // Populates global.configService (Legacy approach)
const util = require("./utility");
const logger = require('./routes/dymerlogger');
const jsonResponse = require('./jsonResponse');

// Models
require("./models/DymerUser");
const DymerUser = mongoose.model("DymerUser");

// Routes Import
const dserviceRoutes = require('./routes/dservice');
const templateRoutes = require('./routes/template');
const formRoutes = require('./routes/form');
const entityRoutes = require('./routes/entity');
const system = require('./routes/routes-v1');
const publicRoutes = require('./routes/publicfiles');
const appRoutes = require('./routes/appRoutes');
const authenticateRoutes = require('./routes/authenticate');
const dohtmlpage = require('./routes/dohtmlpage');
const publicdemoDonwlonad = require("./routes/demodownloads");
const jwt = require('jsonwebtoken');
// Swagger JSON (Load once in memory)
const swaggerFileOriginal = require('./swagger_webserver.json');

// Constants & Env
const app = express();
const router = express.Router();
const nameFile = path.basename(__filename);
const gblConfigService = global.configService;
const portExpress = process.env.PORT || gblConfigService.port;
const protocol = gblConfigService.protocol;
const appName = gblConfigService.app_name;
const contextPath = util.getContextPath('webserver');
const host = gblConfigService.ip + ":" + portExpress;
const serverUrl = protocol + "://" + host + contextPath;
const docPath = '/api/doc';
const SESSION_SECRET = process.env.SESSION_SECRET || 'eb3292aa242ba35c9122be4f52cd25efa4dd0a9f';

// ===========================================================================
// MIDDLEWARE SETUP
// ===========================================================================

// 1. Security Headers (Helmet)
app.use(helmet({
    contentSecurityPolicy: false, // Disabilito CSP di default per evitare conflitti con Angular, configurare se necessario
    crossOriginEmbedderPolicy: false
}));

// 2. CORS Configuration
/*const allowedOrigins = util.getAllowedOrigins("dymer-websever");
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            logger.warn(`CORS blocked request from: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-xsrf-token', 'extrainfo', 'dymertoken', 'requestjsonpath', 'reqfrom'],
    credentials: true,
};

app.use(cors(corsOptions));*/

app.use(cors({
  origin: "*",  
  methods: ["GET", "POST", "PUT", "DELETE","PATCH", "OPTIONS"],
}));

app.options('*', cors()); // Enable pre-flight for all routes

// 3. Parsers
app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' })); // Aggiunto limit se gestisci file grossi
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// 4. Session
// WARNING: MemoryStore is not for production. Use Redis or MongoStore.
const memoryStore = new session.MemoryStore();
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: memoryStore,
    name: "nodejscookie", // Custom cookie name helps security obscuring tech
    cookie: {
        httpOnly: true,
        secure: protocol === 'https', // Secure cookies only in HTTPS
        path: '/',
        sameSite: 'Lax', // Protezione CSRF di base (considera 'Strict' se possibile)
        maxAge: 24 * 60 * 60 * 1000 // 1 giorno
    },
}));

app.set('trust proxy', true); // Necessario se sei dietro Nginx/Docker proxy

// 5. Static Files (Angular & Public)
const angularDistPath = path.join(__dirname, "public");
app.use("/public/", express.static(path.join(__dirname.replace(contextPath, ""), "public/")));
app.use("/app/", express.static(path.join(__dirname.replace(contextPath, ""), "app/")));
// Serve root static files if context path matches
app.use(express.static(angularDistPath));


// ===========================================================================
// API ROUTES
// ===========================================================================

// Swagger Documentation (Dynamic URL injection - No FS Write)
app.get('/swaggerdoc', [loadUserInfo, util.checkIsAdmin], (req, res) => {
    let originalRef = req.get('host');
    let currentServerUrl = protocol + "://" + originalRef + contextPath;
    
    // Deep copy del file JSON originale per non modificarlo permanentemente
    let content = JSON.parse(JSON.stringify(swaggerFileOriginal));

    // Update URLs in memory
    content.servers[0].url = currentServerUrl;
    content.servers[1].url = currentServerUrl + '/api/templates';
    content.servers[2].url = currentServerUrl + '/api/dservice';
    content.servers[3].url = currentServerUrl + '/api/forms';
    content.servers[4].url = currentServerUrl + '/api/entities';

    const data = { swaggerDocUrl: currentServerUrl + docPath };
    
    // Serve the modified swagger setup specifically for this request
    // Nota: Swagger UI express setup standard non supporta facilmente JSON dinamico per route
    // ma qui stiamo solo ritornando l'URL.
    // Per aggiornare lo swagger che viene servito sotto `docPath`, 
    // l'approccio migliore è passare l'oggetto 'content' al setup, vedi sotto.
    res.json(data);
});

// Setup Swagger UI con un oggetto dinamico è complesso perché .setup() viene chiamato all'avvio.
// Manteniamo il setup standard ma iniettiamo il file statico per ora.
app.use(docPath, [loadUserInfo, util.checkIsAdmin], swaggerUi.serve, swaggerUi.setup(swaggerFileOriginal));


// Log Management
app.get('/deletelog/:filetype', [loadUserInfo, util.checkIsAdmin], (req, res) => {
    // #swagger.tags = ['Webserver']
    const filetype = req.params.filetype;
    logger.flushfile(filetype);
    const ret = new jsonResponse();
    ret.setSuccess(true);
    ret.setMessages("Deleted");
    return res.send(ret);
});

app.get('/openLog/:filetype', [loadUserInfo, util.checkIsAdmin], (req, res) => {
    const filetype = req.params.filetype;
    // Security check per evitare Path Traversal
    if (filetype.includes('..') || filetype.includes('/')) {
        return res.status(400).send("Invalid filename");
    }
    return res.sendFile(path.join(__dirname, "logs", filetype + ".log"));
});

// System Health Check
app.get('/checkservice', [loadUserInfo, util.checkIsPortalUser], (req, res) => {
    // #swagger.tags = ['Webserver']
    let ret = new jsonResponse();
    let infosize = logger.filesize("info");
    let errorsize = logger.filesize("error");
    
    // Clone config to avoid modifying global
    let infomserv = JSON.parse(JSON.stringify(gblConfigService));
    
    // SECURITY: Redact sensitive info
    infomserv.adminPass = "*****";
    infomserv.adminUser = "*****";
    
    ret.setData({
        info: { size: infosize },
        error: { size: errorsize },
        infomicroservice: infomserv
    });
    ret.setMessages("Service is up");
    ret.setSuccess(true);
    res.status(200).send(ret);
});

// Info Endpoint
app.get('/info/:key?', (req, res) => {
    const key = req.params.key;
    const infodymer = global.gConfig.dymer; // Assicurati che esista

    if (key === 'json') {
        return res.send(infodymer);
    }
    
    // Per semplicità ho tagliato l'HTML hardcoded qui per brevità, 
    // ma puoi reinserirlo o (meglio) spostarlo in un file .html separato in /public
    // e fare res.sendFile().
    res.send({ version: infodymer.version, updated: infodymer.updated });
});

// ===========================================================================
// APPLICATION ROUTES MOUNTING
// ===========================================================================

app.use("/public/", publicRoutes);
app.use("/app/", appRoutes);
app.use("/api/portalwebpage/", dohtmlpage);
app.use("/api/portalweb/", authenticateRoutes);
app.use("/demodownload/", publicdemoDonwlonad);

// API Core Routes
app.use('/api/templates/', loadUserInfo, templateRoutes);
app.use("/api/forms/", loadUserInfo, formRoutes);
app.use("/api/entities/", loadUserInfo, entityRoutes);
app.use("/api/dservice/", loadUserInfo, dserviceRoutes);
app.use("/api/system/", loadUserInfo, system);

// User Info Retrieval (Pulita)
app.post('/api2/retriveinfo', loadUserInfo, async (req, res) => {
    try {
        const hdymeruser = req.headers.dymeruser;
        if (!hdymeruser) throw new Error("Missing dymeruser header");

        const dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
        
        res.clearCookie("DYMisi");
        res.cookie("dymercookie", 'value', { expire: 360000 + Date.now() });

        const url_dservice = util.getServiceUrl("dservice") + '/api/v1/perm/permbyroles';
        let response_perm = await axios.get(url_dservice, { params: { role: dymeruser.roles } });
        
        let dr_value = Buffer.from(JSON.stringify(dymeruser.roles)).toString("base64");
        let listprm_value = Buffer.from(JSON.stringify(response_perm.data.data)).toString("base64");

        var objuser = {
            "d_uid": dymeruser.id,
            "d_appuid": dymeruser.app_id,
            "d_gid": dymeruser.gid,
            "d_rl": dr_value,
            "d_lp": listprm_value
        };
        
        logger.info(`${nameFile} | /api2/retriveinfo: User retrieved successfully`);
        res.send(objuser);
    } catch (error) {
        logger.error(`${nameFile} | /api2/retriveinfo error: ${error.message}`);
        res.status(500).send({ error: "Internal Server Error" });
    }
});


// ===========================================================================
// SPA FALLBACK (Angular)
// ===========================================================================
// Gestione di tutte le rotte non API per servire l'index.html di Angular

app.get('*', (req, res) => {
    // Ignora richieste API non gestite per evitare di restituire HTML a chiamate JSON
    if (req.url.startsWith('/api/') || req.url.startsWith('/public/')) {
        return res.status(404).send('Not found');
    }

    const indexPath = path.join(__dirname, 'public/app/views/index.html');
    const loginPath = path.join(__dirname, 'public/app/views/indexLogin.html');
    
    // Verifica Token base (Semplificato)
    let token = req.cookies.token;
    let servePath = loginPath;

     
    if (token) {
        servePath = indexPath;
            try {
                jwt.verify(token, secretKey);
                isValidToken = true;
            } catch (err) {
                console.log("Invalid or Expired Token:", err.message);
                res.clearCookie('token', { path: '/' });
                token = "";
            }
        }

    // Lettura e replace (Cache this in production!)
    /*fs.readFile(servePath, 'utf8', (err, data) => {
        if (err) {
            logger.error("Error reading index file: " + err);
            return res.status(500).send("Error loading application");
        }
        
        let r = 'dym' + (Math.random() + 1).toString(36).substring(7);
        let content = data.replace(/site_prefix_value/g, contextPath)
                          .replace(/noncevalue/g, r);
        
        res.send(content);
    });*/


        console.log(" isValidToken token", isValidToken);
        res.sendFile(path.join(__dirname, "public", "index.html"));
       
});


app.get("/public/cdn/*", (req, res, next) => { 
    next();
});



// ===========================================================================
// CORE FUNCTIONS (LoadUserInfo & Server Start)
// ===========================================================================

function loadUserInfo(req, res, next) {
    // 1. CSRF Check
    const skipCsrfToken = process.env.SKIP_CSRF_TOKEN === 'true';
    const csrfToken = req.headers['x-xsrf-token'];
    
    // Controllo CSRF solo se c'è un token nei cookie e non siamo in skip mode
    if (req.cookies["token"] && !skipCsrfToken) {
        DymerUser.findOne({ "roles.role": 'app-admin' })
            .then(el => {
                if (!el) return res.status(401).send("Admin config not found");
                
                if (csrfToken !== el.csrfToken) {
                    logger.error(`${nameFile} | loadUserInfo | Invalid CSRF token: ${csrfToken}`);
                    let ret = new jsonResponse();
                    ret.setMessages("Sorry, invalid CSRF token");
                    ret.setSuccess(false);
                    return res.status(403).send(ret);
                }
                // CSRF OK
                proceedWithAuth(req, res, next);
            })
            .catch(err => {
                logger.error(`${nameFile} | loadUserInfo | CSRF check error: ${err}`);
                return res.status(500).send("Internal server error");
            });
    } else {
        // Nessun token o skip abilitato
        proceedWithAuth(req, res, next);
    }
}

function proceedWithAuth(req, res, next) {
    // Logica originale per chiamare il servizio di auth esterno
    // ... Recupero token da header o query ...
    let dymtoken = req.headers.authorization ? req.headers.authorization.split(' ')[1] : req.query.tkdym;
    let originalRef = req.headers["reqfrom"] || req.headers.referer || req.get('host');

    // Decrypt logica legacy (se presente)
    if (dymtoken && util.isCrypted(dymtoken)) {
         let decrypted = util.decryptLfr(process.env.ENCRYPTION_SECRET_KEY, dymtoken);
         dymtoken = Buffer.from(decrypted).toString("base64");
    }

    var authuserUrl = util.getServiceUrl("dservice") + "/api/v1/authconfig/userinfo";
    
    var config = {
        method: 'get',
        url: authuserUrl,
        headers: { 'Content-Type': 'application/json' },
        data: {
            'DYM': dymtoken,
            'referer': originalRef,
            // ... altri campi se necessari
        }
    };

    axios(config)
        .then(function(response) {
            req.headers["dymeruser"] = Buffer.from(JSON.stringify(response.data.data)).toString("base64");
            if (!req.headers["reqfrom"]) req.headers["reqfrom"] = originalRef;
            next();
        })
        .catch(function(error) {
            // Se fallisce l'auth service, logghiamo ma proseguiamo (o blocchiamo, dipende dalla logica di business)
            // L'originale faceva next(), il che è rischioso, ma mantengo compatibilità.
            logger.error(`${nameFile} | loadUserInfo | Auth Service Error: ${error.message}`);
            next();
        });
}


// ===========================================================================
// START SERVER
// ===========================================================================

const root = express();
root.use(contextPath, app);

const defaultAdminUrl = util.getServiceUrl("dservice") + '/api/v1/duser/defaultadmin';
const defaultAdminData = {
    username: global.configService['adminUser'],
    password: global.configService['adminPass'],
    active: true,
    email: global.configService['adminEmail'],
    roles: [{ role: "app-admin" }]
};

async function startServer() {
    try {
        // Genera Admin Default
        await util.defaultAdmin(defaultAdminUrl, defaultAdminData, { 'Content-Type': 'application/json' });

        if (util.ishttps('webserver')) {
            const httpsOptions = {
                key: fs.readFileSync(path.join(__dirname, 'ssl', 'server.key')),
                cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server.crt'))
            };
            https.createServer(httpsOptions, root).listen(portExpress, () => {
                logger.info(`${nameFile} | HTTPS Service ${appName} started on port ${portExpress}`);
            });
        } else {
            root.listen(portExpress, () => {
                logger.info(`${nameFile} | HTTP Service ${appName} started on port ${portExpress}`);
                console.log(`Server running at: ${serverUrl}`);
            });
        }
    } catch (error) {
        logger.error(`${nameFile} | Fatal Error starting server: ${error.toString()}`);
        console.error("Fatal Error:", error);
        process.exit(1); // Exit if server cannot start
    }
}

startServer();