//const qs = require('qs');
//var util = require('./utility');
var jsonResponse = require('./jsonResponse');
const express = require("express");
//process.env.NODE_ENV = "development";
//process.env.TYPE_SERV = "entity";
require("./config/config.js");
const util = require("./utility");
//const path = require("path");
//var elastic = require('elasticsearch');  
//const bodyParser = require("body-parser");
const app = express();
const portExpress = global.configService.port; //4646;
//const axios = require("axios");
const path = require('path');
const nameFile = path.basename(__filename);
const logger = require('./routes/dymerlogger');
const contextPath = util.getContextPath('entity');

/*app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));*/
var routes = require('./routes/routes-v2');
//var routestest = require('./routes/routestest');
var publicRoutes = require('./routes/publicfiles');
//app.use("/uploads", express.static(path.join(__dirname, 'uploads')));
//app.use(express.static(__dirname+'/uploads'));
const bodyParser = require("body-parser");
app.use(express.json())
var cors = require('cors');
global.logconsole = (process.env.DYMER_LOGGER == undefined) ? false : process.env.DYMER_LOGGER;
app.use(cors());

/*app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
}); */
function detectPermission(req, res, next) {
    /* console.log("controllo", );
     console.log("req.ip", req.ip);
     console.log("req.originalurl", req.originalurl);
     console.log("req.path", req.path);
     console.log("req.query", req.query);
     console.log("req.params", req.params);
     console.log("req.method", req.method);
     console.log("req.cookies", req.cookies);
     console.log("req.session", req.session);*/
    next();
    /*   console.log("req.header", req.headers);
       const authHeader = req.headers.authorization;
       const token = authHeader && authHeader.split(' ')[1]
       //var pp = jwt.decode(JSON.parse(token));
       var ret = new jsonResponse();
       var pp = jwt.decode(token);
       console.log("req.method", req.method);
       console.log("req.query", req.query);
       console.log("req.params", req.params);
       console.log("------------------");
       console.log("req.token", pp);
    
       var act = "";
       var index = "";
       var roles = [];
       var queryString = "";
   
       // if (pp) {
       var method = req.method;
       //  act = (method == "GET") ? "create" : (method == "POST") ? "val2" : (method == "PUT") ? "val2" : (method == "DELETE") ? "val2" : "";
       act = "create";
       if ((req.path).includes("/content/")) {
           var tmpSplit = (req.path).split("/");;
           index = tmpSplit[2];
       } else {
           index = req.query.query['instance._index'];
       }
       if (pp) {
           roles = pp.realm_access.roles;
           if (roles.indexOf("app-admin"))
               roles.push("app-admin");
       }
       roles.push("app-guest");
       if (roles.indexOf("app-admin")) {
           next();
   
   
       } else {
           queryString = "?role[]=" + roles.join("&role[]=");
           var url = 'http://localhost:5050/api/v1/perm/entityrole/';
           url += act + "/";
           url += index + "/";
           url += queryString; 
           console.log("url", url);
           axios.get(url)
               .then((response) => {
                   console.log("PRM", response.data.data.result);
                   if (response.data.data.result) {
                       console.log("prosegui", req.path);
                       next();
                   } else {
                       console.log("stop", req.path);
                       ret.setMessages("No permission");
                       res.status(200);
                       ret.setSuccess(false);
                       return res.send(ret);
                   }
               }, (error) => {
                   console.log(error);
   
                   ret.setMessages("No permission");
                   res.status(200);
                   ret.setSuccess(false);
                   return res.send(ret);
               });
        
       }
   */
}

app.get('/uuid', util.checkIsPortalUser, (req, res) => {
    // #swagger.tags = ['Entities']

    var ret = new jsonResponse();
    const uuid = util.getDymerUuid();
    ret.setData({ 'uuid': uuid });
    ret.setSuccess(true);
    ret.setMessages("uuid");
    return res.send(ret);
});

app.get('/deletelog/:filetype', util.checkIsAdmin, (req, res) => {
    // #swagger.tags = ['Entities']

    var ret = new jsonResponse();
    var filetype = req.params.filetype;
    const dymeruser = util.getDymerUser(req, res);
    const dymerextrainfo = dymeruser.extrainfo;
    logger.flushfile(filetype);

    ret.setSuccess(true);
    ret.setMessages("Deleted");
    return res.send(ret);
});

app.get('/logtypes', async(req, res) => {
    // #swagger.tags = ['Entities']

    var ret = new jsonResponse();
    ret.setSuccess(true);
    let loggerdebug = global.loggerdebug;
    let redisValue = global.configService.cache ? global.configService.cache.isEnabled : false;
    ret.setData({ consolelog: loggerdebug, redisactive: redisValue});
    ret.setMessages("logtypes");
    return res.send(ret);
});

app.post('/setlogconfig', (req, res) => {
    // #swagger.tags = ['Entities']

    var ret = new jsonResponse();
    logger.ts_infologger(req.body.consoleactive);
    ret.setMessages("Settings updated");
    ret.setData({ consoleactive: req.body.consoleactive });
    return res.send(ret);
});

app.get('/openLog/:filetype', util.checkIsAdmin, (req, res) => {
    // #swagger.tags = ['Entities']

    var ret = new jsonResponse();
    var filetype = req.params.filetype;
    console.log('openLog/:filety', path.join(__dirname + "/logs/" + filetype + ".log"));
    return res.sendFile(path.join(__dirname + "/logs/" + filetype + ".log"));
});
app.get('/checkservice', util.checkIsAdmin, (req, res) => {
    // #swagger.tags = ['Entities']

    var ret = new jsonResponse();
    let infosize = logger.filesize("info");
    let errorsize = logger.filesize("error");
    let regex = /(?<!^).(?!$)/g;
    let infomserv = JSON.parse(JSON.stringify(global.gConfig));
    if (infomserv.services.entity.hasOwnProperty('cache')) {
        if (infomserv.services.entity.cache.hasOwnProperty('password'))
            infomserv.services.entity.cache.password = (infomserv.services.entity.cache.password).replace(regex, '*');
        if (infomserv.services.entity.cache.hasOwnProperty('user'))
            infomserv.services.entity.cache.user = (infomserv.services.entity.cache.user).replace(regex, '*');
    }
    ret.setData({
                    info:             {
                        size: infosize
                    },
                    error:            {
                        size: errorsize
                    },
                    infomicroservice: infomserv
                });
    ret.setMessages("Service is up");
    res.status(200);
    ret.setSuccess(true);
    return res.send(ret);
});

app.use('/api/v1/entity/uploads/', publicRoutes
        // #swagger.tags = ['Entities']
);
app.use('/api/v1/entity', routes
        // #swagger.tags = ['Entities']
);
//app.use('/api/endpointtest', routestest);
app.get('/', (req, res) => {
    // #swagger.tags = ['Entities']

	// res.sendFile(path.resolve(__dirname, "usr/share/www/html/", "index.html"));
	res.send("this is    our main andpoint Entities");
});

app.get('/*', (req, res) => {
    // #swagger.tags = ['Entities']

	var ret = new jsonResponse();
	ret.setMessages("Api error 404");
	res.status(404);
	ret.setSuccess(false);
	return res.send(ret);
});

const root = express();
root.use(contextPath, app);

root.listen(portExpress, () => {
	//logger.flushAllfile();

	logger.info(nameFile + " | Up and running-- this is " + global.configService.app_name + " service on port:" + portExpress + " context-path: " + contextPath);
	console.log("Up and running-- this is " + global.configService.app_name + " service on port:" + portExpress + " context-path: " + contextPath);
});
