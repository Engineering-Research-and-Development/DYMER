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
const helmet = require('helmet');
const axios = require('axios');
const mongoose = require("mongoose");
const swaggerUi = require('swagger-ui-express');
const jwt = require('jsonwebtoken');
const readline = require('readline');

// ===========================================================================
// LOCAL IMPORTS & CONFIG
// ===========================================================================
require("./config/config.js"); // Populates global.configService (Legacy approach)
const util = require("./utility.js");
const logger = require('./routes/dymerlogger.js');
const jsonResponse = require('./jsonResponse.js');

// Models
require("./models/DymerUser.js");
const DymerUser = mongoose.model("DymerUser");

// Routes Import
const dserviceRoutes = require('./routes/dservice.js');
const templateRoutes = require('./routes/template.js');
const formRoutes = require('./routes/form.js');
const entityRoutes = require('./routes/entity.js');
const system = require('./routes/routes-v1.js');
const publicRoutes = require('./routes/publicfiles.js');
const appRoutes = require('./routes/appRoutes.js');
const authenticateRoutes = require('./routes/authenticate.js');
const dohtmlpage = require('./routes/dohtmlpage.js');
const publicdemoDonwlonad = require("./routes/demodownloads.js");
// const recoverForms = require("./routes/formfiles"); // present in the legacy server

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
  contentSecurityPolicy: false, // Disable default CSP (configure via reverse-proxy or templates if needed)
  crossOriginEmbedderPolicy: false,
  /*AC - Cross Origin*/
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// 2. CORS Configuration (prefer allow-list if available)
const allowedOrigins = (util.getAllowedOrigins && util.getAllowedOrigins("dymer-websever")) || ["*"]; // fallback
const useOpenCors = process.env.OPEN_CORS === 'true' || allowedOrigins.includes("*");
if (useOpenCors) {
  app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE","PATCH", "OPTIONS"],
  }));
  app.options('*', cors());
} else {
  // const corsOptions = {
  //   origin: (origin, callback) => {
  //     if (!origin || allowedOrigins.indexOf(origin) !== -1) {
  //       callback(null, true);
  //     } else {
  //       logger.warn(`CORS blocked request from: ${origin}`);
  //       callback(new Error('Not allowed by CORS'));
  //     }
  //   },
  //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  //   allowedHeaders: ['Content-Type', 'Authorization', 'x-xsrf-token', 'extrainfo', 'dymertoken', 'requestjsonpath', 'reqfrom'],
  //   credentials: true,
  // };
  // app.use(cors(corsOptions));
  // app.options('*', cors(corsOptions));
  const corsOptions = { // CAMBIATO QUESTO
  origin: (origin, cb) => cb(null, true),
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-xsrf-token',
    'extrainfo',
    'dymertoken',
    'requestjsonpath',
    'reqfrom'
  ]
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

}

// 3. Parsers
app.use(cookieParser());
// app.use(bodyParser.json({ limit: '50mb' }));
// app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// 4. Session (NOTE: MemoryStore is NOT for production)
const memoryStore = new session.MemoryStore();
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: memoryStore,
  name: "nodejscookie",
  cookie: {
    httpOnly: true,
    secure: protocol === 'https',
    path: '/',
    sameSite: 'Lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
}));
app.set('trust proxy', true); // behind Nginx/Docker proxy

// 5. Static Files (Angular & Public)
const angularDistPath = path.join(__dirname, "public");
app.use("/public/", express.static(path.join(__dirname.replace(contextPath, ""), "public/")));
app.use("/app/", express.static(path.join(__dirname.replace(contextPath, ""), "app/")));
app.use(express.static(angularDistPath));

// ===========================================================================
// API ROUTES
// ===========================================================================
// Swagger Documentation (Dynamic URL injection - No FS Write)
app.get('/swaggerdoc', [loadUserInfo, util.checkIsAdmin], (req, res) => {
  const originalRef = req.get('host');
  const currentServerUrl = protocol + "://" + originalRef + contextPath;
  const content = JSON.parse(JSON.stringify(swaggerFileOriginal)); // deep copy
  content.servers[0].url = currentServerUrl;
  content.servers[1].url = currentServerUrl + '/api/templates';
  content.servers[2].url = currentServerUrl + '/api/dservice';
  content.servers[3].url = currentServerUrl + '/api/forms';
  content.servers[4].url = currentServerUrl + '/api/entities';
  // Return UI base URL; swagger-ui-express setup below serves static JSON
  res.json({ swaggerDocUrl: currentServerUrl + docPath });
});
app.use(docPath, [loadUserInfo, util.checkIsAdmin], swaggerUi.serve, swaggerUi.setup(swaggerFileOriginal));

// Log Management
app.get('/deletelog/:filetype', [loadUserInfo, util.checkIsAdmin], (req, res) => {
  const filetype = req.params.filetype;
  logger.flushfile(filetype);
  const ret = new jsonResponse();
  ret.setSuccess(true);
  ret.setMessages("Deleted");
  return res.send(ret);
});
app.get('/openLog/:filetype', [loadUserInfo, util.checkIsAdmin], (req, res) => {
  const filetype = req.params.filetype;
  // Avoid Path Traversal
  if (filetype.includes('..') || filetype.includes('/')) {
    return res.status(400).send("Invalid filename");
  }
  return res.sendFile(path.join(__dirname, "logs", filetype + ".log"));
});

app.get('/tailLog/:filetype', [loadUserInfo, util.checkIsAdmin], async (req, res) => {
  const filetype = req.params.filetype;

  // Protezione Path Traversal
  if (filetype.includes('..') || filetype.includes('/') || filetype.includes('\\')) {
    return res.status(400).send("Invalid filename");
  }

  const filePath = path.join(__dirname, "logs", `${filetype}.log`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Log file not found");
  }

  try {
    const MAX_LINES = 50;
    const lines = [];
    
    // Creiamo un'interfaccia di lettura riga per riga (Stream)
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      terminal: false
    });

    // Leggiamo tutto lo stream, ma teniamo solo le ultime N righe
    // Nota: Per file GIGANTESCHI (>1GB) si userebbe fs.read con seek finale,
    // ma readline su stream è sicura per la memoria (non carica tutto il file in RAM).
    for await (const line of rl) {
      lines.push(line);
      if (lines.length > MAX_LINES) {
        lines.shift(); // Rimuove la riga più vecchia
      }
    }

    res.json({
      file: `${filetype}.log`,
      lines: lines,
      count: lines.length
    });

  } catch (err) {
    console.error("Error reading log:", err);
    res.status(500).send("Internal Server Error during log parsing");
  }
});




// System Health Check
app.get('/checkservice', [loadUserInfo, util.checkIsPortalUser], (req, res) => {
  let ret = new jsonResponse();
  let infosize = logger.filesize("info");
  let errorsize = logger.filesize("error");
  let infomserv = JSON.parse(JSON.stringify(gblConfigService));
  // Redact sensitive info
  infomserv.adminPass = "*****";
  infomserv.adminUser = "*****";
  var uptime = process.uptime();

  ret.setData({
    info: { size: infosize },
    error: { size: errorsize },
    infomicroservice: infomserv,
    uptime: util.format(uptime)
  });
  ret.setMessages("Service is up");
  ret.setSuccess(true);
  res.status(200).send(ret);
});

// Info Endpoint (keeps legacy HTML option)
app.get('/info/:key?', (req, res) => {
  const key = req.params.key;
  const infodymer = global.gConfig.dymer;
  if (key === 'json') {
    return res.send(infodymer);
  }
  if (key === 'html') {
    const htmlcontainer = '<div class="container"> <div class="row justify-content-center">' +
      '<div class="col-xl-10 col-lg-12 col-md-9" > ' +
      '<div class="card o-hidden border-0 shadow-lg my-5">' +
      '<div class="card-body p-0">' +
      '<div class="row">' +
      '<div class="col-lg-6 d-none d-lg-block bg-login-image" style=\'background:url("public/cdn/img/bg-ver.jpg");background-position: center;background-size: cover; min-height: 280px; \'>' + '</div>' +
      '<div class="col-lg-6">' +
      '<div class="p-5">' + '<div class="row">' +
      '<div class=" col-12">' +
      '<h1 class="h4 mb-4 text-center" style="color:#023d7d;">Welcome to DYMER</h1>' +
      '<div class="text-center">' + '<img class="" src="public\\\\cdn\\\\img\\\\dymer-logo.png" style="width: 220px;" title="DYMER LOGO">' + '<div>' +
      '<br><small style="color: #8c8985;">DYnamic Information ModElling & Rendering</small>' +
      '</div>' +
      '<div class=" \tcol-12 p-2" style="color: #8c8985;">' +
      '<br> version ' + infodymer.version +
      '<br> <small style="color: #8c8985;"> updated date ' + infodymer.updated + '</small></div>' +
      '<div class="text-center col-12 p-2">' +
      '<span style=" font-size: 12px;">&copy; 2024, Powered by <a href="https://www.eng.it/" target="_blank">' +
      '<img src="https://www.eng.it/resources/images/logo%20eng.png" style="width: 20px;bottom: 3px;position: relative; "> Engineering</a>' + '</span>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>' + '</div>' + '</div>';
    return res.send(htmlcontainer);
  }
  return res.send({ version: infodymer.version, updated: infodymer.updated });
});

// ===========================================================================
// APPLICATION ROUTES MOUNTING
// ===========================================================================
app.use("/public/", publicRoutes);
app.use("/app/", appRoutes);
app.use("/api/portalwebpage/", dohtmlpage);
app.use("/api/portalweb/", authenticateRoutes);
app.use("/demodownload/", publicdemoDonwlonad);
// app.use("/recoverForms/", recoverForms); // legacy, uncomment if route exists

// API Core Routes
app.use('/api/templates/', loadUserInfo, templateRoutes);
app.use("/api/forms/", loadUserInfo, formRoutes);
app.use("/api/entities/", loadUserInfo, entityRoutes);
app.use("/api/dservice/", loadUserInfo, dserviceRoutes);
app.use("/api/system/", loadUserInfo, system);

// Mount legacy admin pages (guarded)
function mountAdminPageRoutes() {
  const guarded = util.checkIsDymerAdmin;
  const pages = [
    '/dashboard','/mclgs','/tester','/about','/addentity','/listentities','/relations',
    '/bridge-entities-conf','/importfromfile','/configurator','/listconfig','/templates',
    '/hooks','/opennessearch','/fwadapter','/eaggregation','/managetemplate','/models',
    '/managemodel','/modeldoc','/demolist','/demosearchbar','/demosingle','/singlebyurl',
    '/demomap','/demomanager','/fixproblems','/templatesdoc','/modelsdoc','/redisdoc',
    '/querybuilder','/taxonomy','/permissionmanage','/authenticationconfig','/importcronjob',
    '/sync','/workflow','/dusernmanage','/library','/swaggerapi','/wizard','/statistics',
    '/magicAI','/agents'
  ];
  pages.forEach(p => app.get(contextPath + p, guarded, (req, res, next) => next()));
}
mountAdminPageRoutes();

// User Info Retrieval (clean)
app.post('/api2/retriveinfo', loadUserInfo, async (req, res) => {
  try {
    const hdymeruser = req.headers.dymeruser;
    if (!hdymeruser) throw new Error("Missing dymeruser header");
    const dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
    res.clearCookie("DYMisi");
    res.cookie("dymercookie", 'value', { expire: 360000 + Date.now() });
    const url_dservice = util.getServiceUrl("dservice") + '/api/v1/perm/permbyroles';
    const response_perm = await axios.get(url_dservice, { params: { role: dymeruser.roles } });
    const dr_value = Buffer.from(JSON.stringify(dymeruser.roles)).toString("base64");
    const listprm_value = Buffer.from(JSON.stringify(response_perm.data.data)).toString("base64");
    const objuser = {
      d_uid: dymeruser.id,
      d_appuid: dymeruser.app_id,
      d_gid: dymeruser.gid,
      d_rl: dr_value,
      d_lp: listprm_value,
    };
    logger.info(`${nameFile} \n /api2/retriveinfo: User retrieved successfully`);
    res.send(objuser);
  } catch (error) {
    logger.error(`${nameFile} \n /api2/retriveinfo error: ${error.message}`);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// ===========================================================================
// SPA FALLBACK (Angular)
// ===========================================================================
app.get('*', (req, res) => {
  // Do not serve HTML for APIs/public static paths
  if (req.url.startsWith('/api/') || req.url.startsWith('/public/')) {
    return res.status(404).send('Not found');
  }
  const indexPath = path.join(__dirname, 'public/app/views/index.html');
  const loginPath = path.join(__dirname, 'public/app/views/indexLogin.html');
  let token = req.cookies.token;
  const secretKey = process.env.JWT_SECRET_KEY;
  let isValidToken = false;
  if (token) {
    try {
      jwt.verify(token, secretKey);
      isValidToken = true;
    } catch (err) {
      console.log("Invalid or Expired Token:", err.message);
      res.clearCookie('token', { path: '/' });
      token = "";
    }
  }
  console.log(" isValidToken token", isValidToken);
  // For now always serve index.html (legacy behaviour); switch to loginPath if needed
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.get("/public/cdn/*", (req, res, next) => next());

// ===========================================================================
// CORE FUNCTIONS (LoadUserInfo & Server Start)
// ===========================================================================


/*Funzione presa dal "vecchio server.js : questa funzione NON chiama la funzione proceedWithAuth*/
function loadUserInfo(req, res, next) {
  let skipCsrfToken = process.env.SKIP_CSRF_TOKEN === 'true';
    skipCsrfToken = true;
  console.log(nameFile + ' | loadUserInfo | skipCsrfToken: ', skipCsrfToken);
    cookie = req.cookies;
    var authuserUrl = util.getServiceUrl("dservice") + "/api/v1/authconfig/userinfo";

    //VL var dymtoken = (req.headers.authorization != undefined) ? req.headers.authorization.split(' ')[1] : undefined;
    var dymtoken = req.headers.authorization;

    //console.log(nameFile + ' | loadUserInfo | req.headers.authorization ', dymtoken);
    //logger.info(nameFile + ' | loadUserInfo | req.headers.authorization '+ dymtoken);
    let lsrole = [];//210325
    if (dymtoken != undefined) {

        dymtoken = req.headers.authorization.split(' ')[1];

        if (util.isCrypted(dymtoken)) {
            let dymtokenDecryptedLfr = util.decryptLfr(dymtoken);
            // let dymtokenDecryptedLfr = util.decryptLfr(process.env.ENCRYPTION_SECRET_KEY, dymtoken);
            logger.info(nameFile + ' | loadUserInfo | decrypted: ', dymtokenDecryptedLfr);
            dymtoken = new Buffer(dymtokenDecryptedLfr).toString("base64");
            logger.info(nameFile + ' | loadUserInfo | coded in base64: ', dymtoken);
        }
    }

    var dymtokenAT = req.headers.authorizationtk;
    var dymtoExtraInfo = req.headers.extrainfo;
    //console.log(nameFile + ' | loadUserInfo | req.headers.extrainfo '+ req.headers.extrainfo);
    //logger.info(nameFile + ' | loadUserInfo | req.headers.extrainfo '+ req.headers.extrainfo);
    let requestjsonpath = (req.headers.requestjsonpath != undefined) ? JSON.parse(req.headers.requestjsonpath) : undefined;

    //console.log(nameFile + ' | loadUserInfo | req.query ' + JSON.stringify(req.query));
    //logger.info(nameFile + ' | loadUserInfo | req.query ' + JSON.stringify(req.query));
    if (req.query.tkdymat != undefined) {
        dymtokenAT = req.query.tkdymat;
        dymtoExtraInfo = req.query.tkextra;
    }

    if (req.query.tkdym != undefined){
        dymtoken = req.query.tkdym;
        //console.log(nameFile + " | loadUserInfo | dymtoken ", dymtoken);
        //logger.info(nameFile + " | loadUserInfo | dymtoken "+ dymtoken);

        dymtoken = dymtoken.replace(/[\t\n\r]/g, '').replace(/ /g, '+');
        //console.log(nameFile + " | loadUserInfo | dymtoken after replace ", dymtoken);

        if (util.isCrypted(dymtoken)) {
            let dymtokenDecryptedLfr = util.decryptLfr(process.env.ENCRYPTION_SECRET_KEY, dymtoken);
            //console.log(nameFile + ' | loadUserInfo | decrypted: ', dymtokenDecryptedLfr);
            dymtoken = new Buffer(dymtokenDecryptedLfr).toString("base64");
            //console.log(nameFile + ' | loadUserInfo | coded in base64: ', dymtoken);
        }

    }

    var idsadm = false;
    //VL O_Day START
    //let lsrole = []; 210325
    if (req.cookies["token"] != undefined) {
    console.log(req.url)
    //VL new gui
        if (!skipCsrfToken){//set SKIP_CSRF_TOKEN
            console.log('CSRF token check');
            const csrfToken = req.headers['x-xsrf-token'];
            DymerUser.findOne({ "roles.role" : 'app-admin' }).then(el => {
                if (!el) {
                    console.log("find admin");
                    return res.status(401).send("Admin not found");
                }
                const storedCsrfToken = el.csrfToken;
                console.log(nameFile + ' | loadUserInfo | storedCsrfToken ', csrfToken);
                if (csrfToken !== storedCsrfToken) {
                    console.log(nameFile + ' | loadUserInfo | Invalid CSRF token ', csrfToken);
                    logger.error(nameFile + ' | loadUserInfo | Invalid CSRF token');
                    //return res.status(403).send({ message: 'Invalid CSRF token' });
                    var ret = new jsonResponse();
                    ret.setMessages("Sorry, invalid CSRF token");
                    ret.setSuccess(false);
                    return res.send(ret);
                } else {
                    console.log(nameFile + ' | loadUserInfo | Valid CSRF token ', csrfToken);
                    logger.info(nameFile + ' | loadUserInfo | Valid CSRF token ', csrfToken );
                }
                next() // CAMBIATO QUESTO
            }).catch(err => {
                console.error("ERROR " + nameFile + " | loadUserInfo | error :", err);
                return res.status(500).send("Internal server error");
            });
        }
        //VL new gui
    
        let jwt = req.cookies["token"];
        //console.log(nameFile + ' | loadUserInfo | Admin jwt from cookie ', jwt);
        let dymtokenDecrypted = util.getDecryptedPayload(jwt);
        //console.log(nameFile + ' | loadUserInfo | Payload of admin jwt decrypted ', dymtokenDecrypted);
        let dymtokenDecryptedBase64 = new Buffer(JSON.stringify(dymtokenDecrypted)).toString("base64")
        dymtoken = dymtokenDecryptedBase64;
        //console.log(nameFile + ' |  loadUserInfo | DYM coded in base64 ', dymtoken);
        //TODO check  invoke service to check roles?
        //let dymtokenDecoded = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString('utf-8'));
    //let dymtokenDecoded = util.getDecryptedPayload(jwt)
        let loggedUserRoles = dymtokenDecrypted.roles || [];
        //console.log("loggedUserRoles ", loggedUserRoles);
        lsrole= [loggedUserRoles[0].role];

        if(lsrole.includes("app-admin")) {
            idsadm = true;
        } else {
            idsadm = false;
        }
        //console.log(nameFile + ' |  loadUserInfo | check if is admin: ', idsadm);
    }
    //VL AC MG O_Day END

    var referer = req.headers.referer;

    if (referer != undefined) {
        if ((referer).includes(req.hostname))
            referer = req.get('host');
    }

    let originalRef = (req.headers["reqfrom"] == undefined) ? req.headers.referer : req.headers.reqfrom;
    originalRef = (originalRef == undefined) ? req.get('host') : originalRef;

  logger.info(nameFile + ' | loadUserInfo | req url: ' + originalRef + "|" + req.method + "|" + req.url);
    var config = {
        method: 'get',
        url: authuserUrl,
        headers: {
            'Content-Type': 'application/json'
        },
        data: {
            'DYM': dymtoken,
            'DYMAT': dymtokenAT,
            'referer': originalRef,
            'dymtoExtraInfo': dymtoExtraInfo,
            'requestjsonpath': requestjsonpath,
            'idsadm': idsadm
        }
    };

    //console.log(nameFile + ' | loadUserInfo | invoke userinfo service: ', config);

    axios(config)
        .then(function(response) {
            //console.log(nameFile + ' | userinfo response : ', response.data.data);
            req.headers["dymeruser"] = new Buffer(JSON.stringify(response.data.data)).toString("base64");
            //logger.info(nameFile + ' | loadUserInfo | dymeruser: ', req.headers.dymeruser);
            if (req.headers["reqfrom"] == undefined)
                req.headers["reqfrom"] = originalRef;
            next();
        })
        .catch(function(error) {
            logger.error(nameFile + ' | loadUserInfo | axios authuserUrl: ' + error);
            console.log(error);
            next();
        });
}

/*Funzione rivista, che chiama la funzione proceedWithAuth*/
/*
function loadUserInfo(req, res, next) {
    // // 1. CSRF Check
    // const skipCsrfToken = process.env.SKIP_CSRF_TOKEN === 'true';
    // const csrfToken = req.headers['x-xsrf-token'];
   
    // Controllo CSRF solo se c'è un token nei cookie e non siamo in skip mode
    // if (req.cookies["token"] && !skipCsrfToken) {
    if (req.cookies["token"]) {
        DymerUser.findOne({ "roles.role": 'app-admin' })
            .then(el => {
                if (!el) return res.status(401).send("Admin config not found");
               
                // if (csrfToken !== el.csrfToken) {
                //     logger.error(`${nameFile} | loadUserInfo | Invalid CSRF token: ${csrfToken}`);
                //     let ret = new jsonResponse();
                //     ret.setMessages("Sorry, invalid CSRF token");
                //     ret.setSuccess(false);
                //     return res.status(403).send(ret);
                // }
                // CSRF OK
                proceedWithAuth(req, res, next);
            })
            .catch(err => {
                // logger.error(`${nameFile} | loadUserInfo | CSRF check error: ${err}`);
                return res.status(500).send("Internal server error");
            });
    } else {
        // Nessun token o skip abilitato
        proceedWithAuth(req, res, next);
    }
}
*/
 
function proceedWithAuth(req, res, next) {
    // Logica originale per chiamare il servizio di auth esterno
    // ... Recupero token da header o query ...
    let dymtoken = req.headers.authorization ? req.headers.authorization.split(' ')[1] : req.query.tkdym;
    let originalRef = req.headers["reqfrom"] || req.headers.referer || req.get('host');
    let dymtoExtraInfo = req.headers.extrainfo;
   
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
            'dymtoExtraInfo': dymtoExtraInfo,
            'requestjsonpath': requestjsonpath
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
function proceedWithAuth(req, res, next) {
  // Gather tokens/headers (legacy compatible)
  // let dymtoken = req.headers.authorization ? req.headers.authorization.split(' ')[1] : req.query.tkdym;
  let jwt = req.cookies.token
  let dymtokenDecrypted = util.getDecryptedPayload(jwt);
  let dymtoken = new Buffer(JSON.stringify(dymtokenDecrypted)).toString("base64")

  let dymtokenAT = req.headers.authorizationtk || req.query.tkdymat;
  const dymtoExtraInfo = req.headers.extrainfo || req.query.tkextra;
  const requestjsonpath = req.headers.requestjsonpath ? JSON.parse(req.headers.requestjsonpath) : undefined;
  let originalRef = req.headers["reqfrom"] || req.headers.referer || req.get('host');

  // Decrypt legacy token if needed
  // if (dymtoken && util.isCrypted(dymtoken)) {
  //   const decrypted = util.decryptLfr(process.env.ENCRYPTION_SECRET_KEY, dymtoken);
  //   dymtoken = Buffer.from(decrypted).toString("base64");
  // }
  // Compute idsadm from cookie token (kept for backward compat)
  let idsadm = false;
  try {
    const jwtCookie = req.cookies["token"];
    if (jwtCookie) {
      const payload = util.getDecryptedPayload(jwtCookie);
      const roles = payload?.roles || [];
      idsadm = roles.some(r => r.role === 'app-admin');
    }
  } catch (e) {
    logger.warn(`${nameFile} \n loadUserInfo \n cannot decode cookie token: ${e}`);
  }

  const authuserUrl = util.getServiceUrl("dservice") + "/api/v1/authconfig/userinfo";
  const config = {
    method: 'get',
    url: authuserUrl,
    headers: { 'Content-Type': 'application/json' },
    data: {
      DYM: dymtoken,
      DYMAT: dymtokenAT,
      referer: originalRef,
      dymtoExtraInfo: dymtoExtraInfo,
      requestjsonpath,
      idsadm,
    }
  };
/****************************************************************************/
console.group("***** DEBUG TOKEN DOCKER START *****")
console.log("config ==>> ", config)
console.groupEnd()
/****************************************************************************/
  axios(config)
    .then(response => {
      req.headers["dymeruser"] = Buffer.from(JSON.stringify(response.data.data)).toString("base64");
      if (!req.headers["reqfrom"]) req.headers["reqfrom"] = originalRef;
      next();
    })
    .catch(error => {
      logger.error(`${nameFile} \n loadUserInfo \n Auth Service Error: ${error.message}`);
      next(); // keep legacy behaviour
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
    await util.defaultAdmin(defaultAdminUrl, defaultAdminData, { 'Content-Type': 'application/json' });
    if (util.ishttps('webserver')) {
      const httpsOptions = {
        key: fs.readFileSync(path.join(__dirname, 'ssl', 'server.key')),
        cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server.crt'))
      };
      https.createServer(httpsOptions, root).listen(portExpress, () => {
        logger.info(`${nameFile} \n HTTPS Service ${appName} started on port ${portExpress}`);
      });
    } else {
      root.listen(portExpress, () => {
        logger.info(`${nameFile} \n HTTP Service ${appName} started on port ${portExpress}`);
        console.log(`Server running at: ${serverUrl}`);
        console.log(`See Documentation at: ${serverUrl + docPath}`);
      });
    }
  } catch (error) {
    logger.error(`${nameFile} \n Fatal Error starting server: ${error.toString()}`);
    console.error("Fatal Error:", error);
    process.exit(1);
  }
}
startServer();
