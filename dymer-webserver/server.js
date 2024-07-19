// Load express
//const Keycloak = require('keycloak-connect');
const express = require("express");
var url = require("url");
require("./config/config.js");
const util = require("./utility");
const app = express();
const bodyParser = require("body-parser");
const path = require('path');
const fs = require('fs');
const https = require('https');
const morgan = require('morgan');
const cors = require('cors');
const nameFile = path.basename(__filename);
const logger = require('./routes/dymerlogger');
var jsonResponse = require('./jsonResponse');
//USO OIDC  
//var passport = require('passport')
const router=express.Router();
//const appRoutes=require('./app/routes/api')(router);
const jwt = require('jsonwebtoken');
var axios = require('axios');
var qs = require('qs');
var dserviceRoutes = require('./routes/dservice');
var templateRoutes = require('./routes/template');
var formRoutes = require('./routes/form');
var entityRoutes = require('./routes/entity');
var system = require('./routes/routes-v1');
var publicRoutes = require('./routes/publicfiles');
var appRoutes = require('./routes/appRoutes');
//var dauthRoutes = require('./routes/dauth');
var authenticateRoutes = require('./routes/authenticate');
var dohtmlpage = require('./routes/dohtmlpage');
//const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
const session = require('express-session');
var cookieParser = require('cookie-parser');
var memoryStore = new session.MemoryStore();

const gblConfigService = global.configService;
const portExpress = gblConfigService.port;
const protocol = gblConfigService.protocol;
const appName = gblConfigService.app_name;
const contextPath = util.getContextPath( 'webserver' );

const swaggerUi = require( 'swagger-ui-express' )
const swaggerFile = require( './swagger_webserver.json' )

const host = gblConfigService.ip + ":" + portExpress;
const serverUrl = protocol + "://" + host + contextPath
const docPath = '/api/doc';

const options = {
	swaggerOptions : {
		docExpansion : 'none'
	}
};

app.use(cookieParser());
app.use(session({
    secret: 'thisShouldBeLongAndSecret',
    resave: false,
    saveUninitialized: true,
    store: memoryStore,
    name: "nodejscookie",
    cookie: {
        path: '/'
    },
}));


var recoverForms = require("./routes/formfiles");

var publicdemoDonwlonad = require("./routes/demodownloads");
const swaggerAutogen = require( "swagger-autogen" );

app.use( docPath, [loadUserInfo, util.checkIsAdmin], swaggerUi.serve, swaggerUi.setup( swaggerFile, options ) );
//senza controllo utente loggato
//app.use( docPath, [loadUserInfo], swaggerUi.serve, swaggerUi.setup( swaggerFile, options ) );

/*app.get( '/swaggerdoc', [ loadUserInfo, util.checkIsAdmin ], ( req, res ) => {
    const data = {swaggerDocUrl : serverUrl + docPath};
    res.json( data );
} );*/

/*
app.get( '/swaggerdoc', [ loadUserInfo, util.checkIsAdmin ], ( req, res ) => {
   
   let originalRef = req.get('host');
   var serverUrl_ = protocol + "://" + originalRef + contextPath
   const data = {swaggerDocUrl : serverUrl_ + docPath};
   res.json( data );
} );*/
var updatejson=false;
 app.get( '/swaggerdoc', [ loadUserInfo, util.checkIsAdmin ], ( req, res ) => {
   
    let originalRef = req.get('host');
    var serverUrl_ = protocol + "://" + originalRef + contextPath
    if(!updatejson){
        let content = JSON.parse(fs.readFileSync('swagger_webserver.json', 'utf8'));
       
        content.servers[0].url = serverUrl_;
        content.servers[1].url = serverUrl_+'/api/templates';
        content.servers[2].url = serverUrl_+'/api/dservice';
        content.servers[3].url = serverUrl_+'/api/forms';
        content.servers[4].url = serverUrl_+'/api/entities';
       
        fs.writeFileSync('swagger_webserver.json', JSON.stringify(content));
       
        updatejson=true;
    }
 
    const data = {swaggerDocUrl : serverUrl_ + docPath};
    res.json( data );
} );

app.get('/deletelog/:filetype', [loadUserInfo, util.checkIsAdmin], (req, res) => {
    // #swagger.tags = ['Webserver']

    var ret = new jsonResponse();
    var filetype = req.params.filetype;
    // const dymeruser = util.getDymerUser(req, res);
    // const dymerextrainfo = dymeruser.extrainfo;
    logger.flushfile(filetype);
    // logger.i
    ret.setSuccess(true);
    ret.setMessages("Deleted");
    return res.send(ret);
});

app.get('/openLog/:filetype', [loadUserInfo, util.checkIsAdmin], (req, res) => {
    // #swagger.tags = ['Webserver']

    var filetype = req.params.filetype;
    //console.log('openLog/:filety', path.join(__dirname + "/logs/" + filetype + ".log"));
    return res.sendFile(path.join(__dirname + "/logs/" + filetype + ".log"));
});

app.get('/checkservice', [loadUserInfo, util.checkIsPortalUser], (req, res) => {
    // #swagger.tags = ['Webserver']

    var ret = new jsonResponse();
    let infosize = logger.filesize("info");
    let errorsize = logger.filesize("error");
    let regex = /(?<!^).(?!$)/g;
    let infomserv = JSON.parse( JSON.stringify( gblConfigService ) );
    infomserv.adminPass = (infomserv.adminPass).replace(regex, '*');
    infomserv.adminUser = (infomserv.adminUser).replace(regex, '*');
    ret.setData({
        info: {
            size: infosize
        },
        error: {
            size: errorsize
        },
        infomicroservice: infomserv
    });
    ret.setMessages("Service is up");
    res.status(200);
    ret.setSuccess(true);
    return res.send(ret);
});

app.use(express.static(__dirname + '/public'));
//app.use(express.static(__dirname + global.gConfig.services.webserver["context-path"] + 'public'));
//app.use(express.static(global.gConfig.services.webserver["context-path"] + 'public'));
//app.use('/public', express.static('public'));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    //    res.header("X-Frame-Option", "allow-from http://localhost:8080/");
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Credentials', true);
    var pathname = req.url;
    //  console.log(pathname);
    /*if (pathname == ("/login")) {
       
        res.setHeader(
            'Content-Security-Policy',
            "default-src 'self'; font-src 'self' https://fonts.gstatic.com/s/montserrat/v23/ ; img-src 'self' https://raw.githubusercontent.com/Engineering-Research-and-Development/DYMER/ data:; script-src 'self'  ; style-src 'self' 'unsafe-inline' https://raw.githubusercontent.com/Engineering-Research-and-Development/DYMER/; frame-src 'self'"
        );
    }*/

    // if (pathname.includes('/app/views/authentication/views/login.html')) {
    /* if (pathname == ("/login")) {
         console.log(pathname);
         res.setHeader(
             'Content-Security-Policy',
             "default-src 'self'; font-src 'self' https://fonts.gstatic.com/s/montserrat/v23/ ; img-src 'self' https://raw.githubusercontent.com/Engineering-Research-and-Development/DYMER/ data:; script-src 'self' 'nonce-8IBTHwOdqNKAWeKl7plt8g==' ; style-src 'self' 'unsafe-inline' https://raw.githubusercontent.com/Engineering-Research-and-Development/DYMER/; frame-src 'self'"
         );
       //res.setHeader(
       //      'Content-Security-Policy',
      //       "default-src 'self'; font-src 'self' https://fonts.gstatic.com/s/montserrat/v23/ ; img-src 'self' https://raw.githubusercontent.com/Engineering-Research-and-Development/DYMER/ data:; script-src 'self'  ; style-src 'self' 'unsafe-inline' https://raw.githubusercontent.com/Engineering-Research-and-Development/DYMER/; frame-src 'self'"
       //  )
       //res.setHeader(
       //      'Content-Security-Policy',
      //       "default-src 'self'; font-src 'self' https://fonts.gstatic.com/s/montserrat/v23/ ; img-src 'self' https://raw.githubusercontent.com/Engineering-Research-and-Development/DYMER/ data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' ; style-src 'self' 'unsafe-inline' https://raw.githubusercontent.com/Engineering-Research-and-Development/DYMER/; frame-src 'self'"
       //  );
         return res.sendFile(path.join(__dirname + "/public/app/views/authentication/views/login.html"));
     }*/
    next();
});

app.use(cors());
app.set('trust proxy', true);

app.use("/public/", express.static(path.join(__dirname.replace(contextPath, ""), "public/")));
app.use("/app/", express.static(path.join(__dirname.replace(contextPath, ""), "app/")));
app.use("/public/", publicRoutes);
app.use("/app/", appRoutes);
app.use("/api/portalwebpage/", dohtmlpage);

app.get('/api2/retriveinfoidpadmin', (req, res, next) => {
    // #swagger.tags = ['Webserver']

    if (true) {
        
        //console.log("retriveinfo.AAAAAAAAAAAAAAA", pp);
        
        var objuser = {
            isGravatarEnabled: false,
            authorization_decision: '',
            roles: [{ role: 'app-admin' }],
            app_azf_domain: '',
            id: 'admin@dymer.it',
            gid: 0,
            app_id: 'dymer',
            email: 'admin@dymer.it',
            username: 'admin@dymer.it'
        };

        var obj_isi = {};
        obj_isi.roles = objuser.roles;
        let base64DYM = new Buffer(JSON.stringify(objuser)).toString("base64")
        let base64DYMisi = new Buffer(JSON.stringify(obj_isi)).toString("base64")
        let dr_value = new Buffer(JSON.stringify(obj_isi.roles)).toString("base64");
        var objtoSend = { "DYM": base64DYM, "DYMisi": base64DYMisi, "d_rl": dr_value }
        objtoSend.d_uid = objuser.id;
        objtoSend.d_appuid = 0;
        objtoSend.d_gid = objuser.gid;
        res.send(objtoSend);

    } else {

        res.send({ objuser });
    }
    // res.send(req.session.passport.user);

});
app.get('/api2/retriveinfoidp', (req, res, next) => {
    // #swagger.tags = ['Webserver']

    // console.log("retriveinfo", req.session);
    // console.log("retriveinfo req.isAuthenticated()", req.isAuthenticated());
    const authHeader = req.headers.authorization;

    var pp = jwt.decode(req.session.passport.user.access_token);
    // console.log("retriveinfo pp", pp);
    //var pp = jwt.decode(JSON.parse(token));
    if (pp != undefined) {

        //      console.log("retriveinfo.AAAAAAAAAAAAAAA", pp);
        var objuser = {
            isGravatarEnabled: false,
            authorization_decision: '',
            roles: [],
            app_azf_domain: '',
            id: '',
            app_id: '',
            email: 'test@test.it',
            extrainfo: {
                companyId: 'ccc',
                groupId: 'ccc',
                cms: 'lfr',
                userId: 'ccc'
            },
            username: pp.email
        };
        (pp.realm_access.roles).forEach(element => {
            objuser.roles.push({ 'role': element, id: '' });
        });
        var obj_isi = {};
        obj_isi.roles = objuser.roles;
        let base64DYM = new Buffer(JSON.stringify(objuser)).toString("base64")
        let base64DYMisi = new Buffer(JSON.stringify(obj_isi)).toString("base64")
            //  console.log("retriveinfo objuser", objuser);

        var objtoSend = { "DYM": base64DYM, "DYMisi": base64DYMisi }
        objtoSend.d_uid = pp.email;
        objtoSend.d_appuid = pp.sub;
        objtoSend.d_gid = 0;
        res.send(objtoSend);

    } else {
        res.send({ objuser });
    }
    // res.send(req.session.passport.user);

});

app.post('/api2/retriveinfo', loadUserInfo, async (req, res, next) => {
    // #swagger.tags = ['Webserver']

    //   res.send({ "ttttttt": "rrrrrrrrr" });

    // console.log("retriveinfo", req.headers);
    // console.log("session1.userid", req.session);
    // console.log("req.originalUrl", req.originalUrl);
    // console.log("req.hostname", req.hostname);
    const hdymeruser = req.headers.dymeruser;
    const dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
    //console.log('hdymeruser2',hdymeruser);
    res.clearCookie("DYMisi");
    res.cookie("dymercookie", 'value', { expire: 360000 + Date.now() });

    //   console.log("retriveinfo req.isAuthenticated()", req.isAuthenticated());
    const authHeader = req.headers.authorization;
    var obj_isi = {};
    let dr_value = new Buffer(JSON.stringify(dymeruser.roles)).toString("base64");
    var url_dservice = util.getServiceUrl("dservice") + '/api/v1/perm/permbyroles'; // Get micro-service endpoint
let response_perm = await axios.get(url_dservice, { params: { role: dymeruser.roles } })
let listprm_value= new Buffer(JSON.stringify(response_perm.data.data)).toString("base64");
    var objuser = {
        "d_uid": dymeruser.id,
        "d_appuid": dymeruser.app_id,
        "d_gid": dymeruser.gid,
        "d_rl": dr_value,
        "DYM":hdymeruser,
        "d_lp":listprm_value
    };
    // console.log("api retriveinfo", JSON.stringify(objuser));
    logger.info(nameFile + ' | /api2/retriveinfo :' + JSON.stringify(objuser));
    res.send(objuser);
});
app.get('/info/:key?', (req, res, next) => {
    // #swagger.tags = ['Webserver']

    // var pjson = require('./package.json');
    var key = req.params.key;
    
    // let infodymer = { "version": global.gConfig.dymer.version };
    let infodymer =  global.gConfig.dymer ;
    let htmlsend_hd =
        '<!DOCTYPE html>' +
        '<html lang="en"><head>' +
        '<meta charset="utf-8">' +
        '<meta http-equiv="X-UA-Compatible" content="IE=edge">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">' +
        '<meta name="description" content="DYnamic Information ModElling & Rendering">' +
        '<meta name="author" content="marco romano">' +
        '<title> DYMER</title> ' +
        '<link rel="icon" type="image/png" href="public\cdn\img\dymer-logo.png"/>' +
        '<link href="https://fonts.googleapis.com/css?family=Nunito:200,200i,300,300i,400,400i,600,600i,700,700i,800,800i,900,900i" rel="stylesheet">' +
        '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.1.3/dist/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">' +
        '<script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>' +
        '<script src="https://cdn.jsdelivr.net/npm/popper.js@1.14.3/dist/umd/popper.min.js" integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous" ></script>' +
        '<script src="https://cdn.jsdelivr.net/npm/bootstrap@4.1.3/dist/js/bootstrap.min.js" integrity="sha384-ChfqqxuZUCnJSK3+MXmPNIyE6ZbWh2IMqE241rYiqJxyMiZ6OW/JmZQ5stwEULTy" crossorigin="anonymous"></script>' + '</script>' +
        ' </head > ' +
        '<body  style="background-color:#ebecf2;"> ';
    let htmlcontainer = '<div class="container"> <div class="row justify-content-center">' +
        '<div class="col-xl-10 col-lg-12 col-md-9" > ' +
        '<div class="card o-hidden border-0 shadow-lg my-5">' +
        '<div class="card-body p-0">' +
        '<div class="row">' +
        '<div class="col-lg-6 d-none d-lg-block bg-login-image" style=\'background:url("public/cdn/img/bg-ver.jpg");background-position: center;background-size: cover; min-height: 280px; \'>' + '</div>' +
        '<div class="col-lg-6">' +
        '<div class="p-5">' + '<div class="row">' +
        '<div class=" col-12">' +
        '<h1 class="h4   mb-4 text-center"  style="color:#023d7d;">Welcome to DYMER</h1>' +
        '<div class="text-center">' + '<img class="rotate-20" src="public/cdn/img/dymer-logo.png" style="width: 45px;" >' + '<div>' +
        '<br><small style="color: #8c8985;">DYnamic Information ModElling & Rendering</small>' +
        '</div>' +
        '<div class="  	col-12 p-2" style="color: #8c8985;">' +
        '<br> version ' + infodymer.version +
        '<br> <small style="color: #8c8985;"> updated date ' + infodymer.updated  + '</small></div>' +
        '<div class="text-center col-12 p-2">' +
        '<span style=" font-size: 12px;">&#169; 2024, Powered by <a href="https://www.eng.it/" target="_blank">' + '<img src="https://www.eng.it/resources/images/logo%20eng.png" style="width: 20px;bottom: 3px;position: relative; "> Engineering</a>' + '</span>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' + '</div>' + '</div>' + '</div>';
    let htmlsend_fo = '</body><link href="public/assets/css/kmsweb.css" rel="stylesheet">' + '</html>';

    switch (key) {
        case 'json':
            res.send(infodymer);
            break;
        case 'html':
            res.send(htmlcontainer);
            break;
        default:
            let htmlsend = htmlsend_hd + htmlcontainer + htmlsend_fo;
            res.send(htmlsend);
            break;
    }
});
/*
app.use(session({
    secret: 'secret squirrel',
    resave: false,
    saveUninitialized: true
}))*/

/**/
function checkAuthentication(req, res, next) {
    console.log('isAuthenticated', req.isAuthenticated());
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect("/");
    }
}

function loadUserInfo(req, res, next) {
    cookie = req.cookies;

    // console.log('TESTSESSION', req.session.cc, req.session.cc == undefined);
    // console.log('TESTSESSION req ', req);
    // var isLocal = (req.connection.localAddress === req.connection.remoteAddress);
    // console.log('TESTSESSION isLocal ', isLocal);
    // console.log('TESTSESSION req referer', req);
    // console.log('TESTSESSION req referer', req.headers);

    // console.log('TESTSESSION req referer', req.headers.referer);
    // console.log('TESTSESSION req req.headers.authorization', req.headers.authorization);
    // console.log('TESTSESSION req req.headers.Authorization', req.headers.Authorization);
    // console.log('TESTSESSION req dservice', util.getServiceUrl("dservice"));
    // console.log('TESTSESSION  req.protocol', req.protocol);
    // console.log('TESTSESSION req host', req.get('host'));
    // logger.info(nameFile + ' | loadUserInfo : req host, originalUrl: ' + req.get('host') + " , " + req.originalUrl);
    // logger.info(nameFile + ' | loadUserInfo : req headers' + JSON.stringify(req.headers) + " , " + req.url);

    var authuserUrl = util.getServiceUrl("dservice") + "/api/v1/authconfig/userinfo";
    var dymtoken = (req.headers.authorization != undefined) ? req.headers.authorization.split(' ')[1] : undefined;
    var dymtokenAT = req.headers.authorizationtk;
    var dymtoExtraInfo = req.headers.extrainfo;
    let requestjsonpath = (req.headers.requestjsonpath != undefined) ? JSON.parse(req.headers.requestjsonpath) : undefined;

    if (req.query.tkdymat != undefined) {
        dymtokenAT = req.query.tkdymat;
        dymtoExtraInfo = req.query.tkextra;
    }

    if (req.query.tkdym != undefined)
        dymtoken = req.query.tkdym;
    // console.log('loadUserInfo req.query.tkdymat', req.query.tkdymat);
    // console.log('loadUserInfo req.query.tkdym', req.query.tkdym);

    // console.log('loadUserInfo authuserUrl', authuserUrl);
    // console.log('loadUserInfo dymtoken', dymtoken);
    // logger.info(nameFile + ' | loadUserInfo : dymtoken' + JSON.stringify(dymtoken));
    //  console.log('loadUserInfo dymtokenAT', dymtokenAT);
    var idsadm = false;
    if (req.cookies["lll"] != undefined) {
        dymtoken = req.cookies["lll"];
        idsadm = true;
    }
    // console.log('TESTSESSION req dymtoken', dymtoken);
    //  if (token == undefined || token == 'null')

    var referer = req.headers.referer;
    //console.log('loadUserInfo referer', referer);
    //console.log('loadUserInfo referrer', req.headers.referrer);

    if (referer != undefined) {
        if ((referer).includes(req.hostname))
            referer = req.get('host');
    }
    /* else {
            referer = "testimport";
        }*/
    let originalRef = (req.headers["reqfrom"] == undefined) ? req.headers.referer : req.headers.reqfrom;
    originalRef = (originalRef == undefined) ? req.get('host') : originalRef;
    //console.log('loadUserInfo post-req.headers', req.headers);
    /* logger.info(nameFile + ' | loadUserInfo : post-referer' + req.headers.referer);
     logger.info(nameFile + ' | loadUserInfo : post-reqfrom' + req.headers["reqfrom"]);
     logger.info(nameFile + ' | loadUserInfo : originalRef' + originalRef + " , " + typeof originalRef);*/
    //logger.info(nameFile + ' | --------------------------');

    //logger.info(nameFile + ' | loadUserInfo : requestjsonpath' + requestjsonpath);
    /*console.log('loadUserInfo post-referer', req.headers.referer);
    console.log('loadUserInfo post-reqfrom', req.headers["reqfrom"]);
    console.log('loadUserInfo originalRef', originalRef, typeof originalRef);
    console.log('--------------------------');*/
    logger.info(nameFile + ' |loadUserInfo|req url :' + originalRef + "|" + req.method + req.url);
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

    //console.log(nameFile + ' | config: ', config);

    axios(config)
        .then(function(response) {
            
            //console.log('dymeruserAA', response.data.data);
            
            req.headers["dymeruser"] = new Buffer(JSON.stringify(response.data.data)).toString("base64");
            //if (req.headers["reqfrom"] == undefined || req.headers["reqfrom"] == 'undefined')
            if (req.headers["reqfrom"] == undefined)
                req.headers["reqfrom"] = originalRef;
            next();
        })
        .catch(function(error) {
            logger.error(nameFile + ' |loadUserInfo | axios authuserUrl : ' + error);
            console.log(error);
            next();
        });
}
app.use("/api/portalweb/", authenticateRoutes);

/*app.use("/public/", express.static(path.join(__dirname.replace('\routes', ""), "..")));
app.use("/app/", express.static(path.join(__dirname.replace('\routes', ""), "..")));
*/ //

//app.use('/',appRoutes); 
//var index = require('./routes/index');
//app.use('/', index); // mount the index route at the / path
// mount the routers 
//app.use('/portalweb/', portalwebRoutes);
//console.log('global.gConfig.services.webserver["context-path"]', util.getContextPath('webserver'));
//console.log('__dirname', __dirname);
app.use('/api/templates/', loadUserInfo, templateRoutes);
app.use("/api/forms/", loadUserInfo, formRoutes);
app.use("/api/entities/", loadUserInfo, entityRoutes);
//app.use("/api/entities/", checkAuthentication, entityRoutes);
//app.use("/api/entities/", keycloak.protect('realm:app-user'), entityRoutes);
//m 2021_20_20 app.use("/api/private/dservice/", ensureLoggedInOpen, dserviceRoutes);
app.use("/api/dservice/", loadUserInfo, dserviceRoutes);
app.use("/api/system/", loadUserInfo, system);

app.post("/api/test/", loadUserInfo, (req, res, next) => {
    // #swagger.tags = ['Webserver']

    console.log("test");
    next();
});
//app.use("/api/auth/", dauthRoutes);

const parseToken = raw => {
    if (!raw || typeof raw !== 'string') return null;

    try {
        raw = JSON.parse(raw);
        const token = raw.id_token ? raw.id_token : raw.access_token;
        const content = token.split('.')[1];
        return JSON.parse(Buffer.from(content, 'base64').toString('utf-8'));
    } catch (e) {
        console.error('Error while parsing token: ', e);
    }
};

//app.use(global.gConfig.services.webserver["context-path"] + '/public/cdn/', publicRoutes);
//app.use(global.gConfig.services.webserver["context-path"] + 'public/cdn/', publicRoutes);
//app.use('/public/cdn', publicRoutes);
//app.use('/public/cdn', publicRoutes);
//app.use('/public/', publicRoutes);
app.use("/demodownload/", publicdemoDonwlonad);
//app.use("/recoverForms/", recoverForms);0
/*app.get("/login", ensureLoggedIn, (req, res, next) => {
    // console.log("app.get");
    next();
    //res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
});
*/

app.get("/public/cdn/*", (req, res, next) => {
    // #swagger.tags = ['Webserver']

    // console.log("app.get");
    next();
    //res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
});

const testRules = (req) => {
        // keycloak.get
        // var pp = jwt.decode(JSON.parse(req.session['keycloak-token'])); //['access_token']
        // console.log('pppppppppppppppppppppp', pp);
        return 'realm:app-user';
        // return t 
    }
    //app.get('*', keycloak.protect(testRules(req)), (req, res) => {
    //app.get('*', keycloak.protect('realm:app-user'), (req, res) => {

//app.get('*', require('connect-ensure-login').ensureLoggedIn('/'), (req, res) => {
//app.get('*', ensureLoggedInOpen, (req, res) => {
app.get('*', (req, res) => {
    //app.get('*', passport.authenticate("oidc"), (req, res) => {
    //app.get('*', keycloak.protect('realm:app-user'), (req, res) => {
    /*console.log(
         "session server", req.session
     ); */
    /* const details = parseToken(req.session['keycloak-token']);
     var token = req.kauth.grant.access_token.content;
     var permissions = token.authorization ? token.authorization.permissions : undefined;
     console.log("userDT", details);
     console.log(" keycloak.token", token);
     console.log(" keycloak permissions", permissions);*/
    //+ path.join(__dirname + global.gConfig.services.webserver["context-path"] 
    var realPath = (req.originalUrl).split("?");
    var listdata = fs.readFileSync(path.join(__dirname, '/public/app/views/index.html'));
    var pathname = req.url;
    //  console.log('listdatapathname', pathname, pathname == ("/login"));
    /* if (listdata) {
         listdata = listdata.toString();
         console.log('listdata', listdata, pathname);
         res.send(listdata.replace('site_prefix_value', util.getContextPath('webserver')));
     }*/
    /*if (pathname == ("/login")) {
        var listdata = fs.readFileSync(path.join(__dirname, '/public/app/views/authentication/views/login.html'));
        listdata = listdata.toString();
        res.send(listdata.replace('site_prefix_value', util.getContextPath('webserver')));
        listdata = listdata.replace('site_prefix_value', util.getContextPath('webserver'))
        res.send(listdata);
    } else {
        console.log('listdatapathname2', pathname, pathname == ("/"));
        //if (pathname == (util.getContextPath('webserver'))) {
        var listdata = fs.readFileSync(path.join(__dirname, '/public/app/views/index.html'));
        listdata = listdata.toString();
        listdata = listdata.replace('site_prefix_value', util.getContextPath('webserver'))
        res.send(listdata);
    }*/
    var listdata = fs.readFileSync(path.join(__dirname, '/public/app/views/index.html'));
    listdata = listdata.toString();
    listdata = listdata.replace('site_prefix_value', contextPath);
    let r = 'dym' + (Math.random() + 1).toString(36).substring(7);
    //  r = "dymzmpky";
    listdata = listdata.replace(/noncevalue/g, r);

    /* res.setHeader(
         'Content-Security-Policy',
         "default-src 'self'; font-src 'self' https://fonts.gstatic.com/s/montserrat/v23/ ; img-src 'self' https://raw.githubusercontent.com/Engineering-Research-and-Development/DYMER/ data:; script-src 'self' 'nonce-" + r + "'  ; style-src 'self' 'unsafe-inline' https://raw.githubusercontent.com/Engineering-Research-and-Development/DYMER/; frame-src 'self'"
     );*/
    /* if (pathname == ("/login")) {
         listdata = fs.readFileSync(path.join(__dirname, '/public/app/views/login.html'));
         listdata = listdata.toString();
         listdata = listdata.replace('site_prefix_value', util.getContextPath('webserver'))
         r = 'dym' + (Math.random() + 1).toString(36).substring(7);
         listdata = listdata.replace(/noncevalue/g, r);
         res.setHeader(
             'Content-Security-Policy',
             "default-src 'self'; font-src 'self' https://fonts.gstatic.com/s/montserrat/v23/ ; img-src 'self' https://raw.githubusercontent.com/Engineering-Research-and-Development/DYMER/ data:; script-src 'self' 'nonce-" + r + "'  ; style-src 'self' 'unsafe-inline' https://raw.githubusercontent.com/Engineering-Research-and-Development/DYMER/; frame-src 'self'"
         );/*
         /* res.setHeader(
              'Content-Security-Policy',
              "default-src 'self'; font-src 'self' https://fonts.gstatic.com/s/montserrat/v23/ ; img-src 'self' https://raw.githubusercontent.com/Engineering-Research-and-Development/DYMER/ data:;script-src 'self' 'unsafe-inline' 'unsafe-eval' ; style-src 'self' 'unsafe-inline' https://raw.githubusercontent.com/Engineering-Research-and-Development/DYMER/; frame-src 'self'"
          );*/
    /*
        }*/
    res.send(listdata);
    // }
});

const root = express();
root.use(contextPath, app);
if (util.ishttps('webserver')) {
    const Httpsoptions = {
        key: fs.readFileSync(path.join(__dirname, 'ssl', 'server.key')),
        cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server.crt'))
    };
    https.createServer(Httpsoptions, root).listen(portExpress, () => {
        logger.info( nameFile + " | Up and running-- this is " + appName + " service on port:" + portExpress + " context-path: " + contextPath );
        console.log( "Up and running-- this is " + protocol + " " + appName + " service on port:" + portExpress + " context-path:" + contextPath );
        // console.log(`${global.gConfig.services.webserver.port} listening on port ${global.gConfigt}`);
    });
} else {
    root.listen(portExpress, () => {
        // logger.error("testtt");
        logger.info( nameFile + " | Up and running-- this is " + protocol + " " + appName + " service on port:" + portExpress + " context-path:" + contextPath );
        console.log( "Up and running-- this is " + protocol + " " + appName + " service on port:" + portExpress + " context-path:" + contextPath );
        console.log("Server on :", serverUrl);
        console.log("See Documentation at:", serverUrl + docPath);
        // console.log(`${global.gConfig.services.webserver.port} listening on port ${global.gConfigt}`);
    });
}
