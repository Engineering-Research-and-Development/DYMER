var jsonResponse = require('./jsonResponse');
const express = require("express");
//process.env.NODE_ENV = "development";
//process.env.TYPE_SERV = "dservice";
const path = require("path");
const util = require("./utility");
var cors = require('cors');
const bodyParser = require("body-parser");
const app = express();
require("./config/config.js");
const nameFile = path.basename(__filename);
const logger = require('./routes/dymerlogger');
const portExpress = global.configService.port;

/**********************************************************************************************************************/
/*                                                   Swagger Config                                                   */
/**********************************************************************************************************************/

const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('./swagger_services.json')

const contextPath = util.getContextPath('dservice');
const host = global.configService.ip + ":" + portExpress;
const docPath = '/api/doc';

swaggerFile.basePath = contextPath;
swaggerFile.host = host;

app.use(docPath, swaggerUi.serve, swaggerUi.setup(swaggerFile))

const serverUrl = global.configService.protocol + "://" + host + contextPath + docPath
/**********************************************************************************************************************/


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false,
    limit: '100MB'
}));
/*app.all('/', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});*/
var routes = require('./routes/routes-v1');
var routes_dymer_openness = require('./routes/routes-d-opn-v1');
var routes_dymer_fwadapter = require('./routes/routes-d-fwadapter-v1');
var routes_dymer_sync = require('./routes/routes-d-sync');
var routes_dymer_hooks = require('./routes/routes-d-servicehooks');
var routes_dymer_eaggregation = require('./routes/routes-d-eaggregation');
var routes_dymer_usermap = require('./routes/routes-d-usermap');
var routes_dymer_taxonomy = require('./routes/routes-d-taxonomy');
var routes_dymer_import = require('./routes/routes-d-import');
//var routes_dymer_importsocs = require('./routes/routes-d-import_socs');
//var routes_dymer_importhb = require('./routes/routes-d-import_hb');
var routes_dymer_permission = require('./routes/routes-d-perm');
//var routes_dymer_importp4t = require('./routes/routes-d-importp4t');
var publicRoutes = require('./routes/publicfiles');
var routes_dymer_configtool = require('./routes/routes-d-configtool');
var routes_dymer_authconfig = require('./routes/routes-d-authconfig');
app.use(express.json())
    //app.use(cors());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type,Cache-Control");
    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        return res.end();
    } else {
        return next();
    }
});
app.use('/api/v1/opn', routes_dymer_openness);
app.use('/api/v1/fwadapter', routes_dymer_fwadapter);
app.use('/api/v1/sync', routes_dymer_sync);
app.use('/api/v1/servicehook', routes_dymer_hooks);
app.use('/api/v1/eaggregation', routes_dymer_eaggregation);
app.use('/api/v1/taxonomy', routes_dymer_taxonomy);
app.use('/api/v1/usermap', routes_dymer_usermap);
app.use('/api/v1/import', routes_dymer_import);
//app.use('/api/v1/import_socs', routes_dymer_importsocs);
//app.use('/api/v1/import_hb', routes_dymer_importhb);
app.use('/api/v1/perm', routes_dymer_permission);
//app.use('/api/v1/importp4t', routes_dymer_importp4t);
app.use('/api/v1/configtool', routes_dymer_configtool);
app.use('/api/v1/authconfig', routes_dymer_authconfig);
app.get('/deletelog/:filetype', util.checkIsAdmin, (req, res) => {
    // #swagger.tags = ['Services']

    var ret = new jsonResponse();
    var filetype = req.params.filetype;
    //const dymeruser = util.getDymerUser(req, res);

    logger.flushfile(filetype);
    // logger.i
    ret.setSuccess(true);
    ret.setMessages("Deleted");
    return res.send(ret);
});

app.get('/openLog/:filetype', util.checkIsAdmin, (req, res) => {
    // #swagger.tags = ['Services']

    var filetype = req.params.filetype;
    //console.log('openLog/:filety', path.join(__dirname + "/logs/" + filetype + ".log"));
    return res.sendFile(path.join(__dirname + "/logs/" + filetype + ".log"));
});
app.get('/logtypes', async(req, res) => {
    // #swagger.tags = ['Services']

    var ret = new jsonResponse();
    ret.setSuccess(true);
    let loggerdebug = global.loggerdebug;
    ret.setData({ consolelog: loggerdebug });
    ret.setMessages("logtypes");
    return res.send(ret);
});
app.post('/setlogconfig', (req, res) => {
    // #swagger.tags = ['Services']

    var ret = new jsonResponse();
    logger.ts_infologger(req.body.consoleactive);
    ret.setMessages("Settings updated");
    ret.setData({ consoleactive: req.body.consoleactive });
    return res.send(ret);
});
app.get('/checkservice', util.checkIsAdmin, (req, res) => {
    // #swagger.tags = ['Services']

    var ret = new jsonResponse();
    let infosize = logger.filesize("info");
    let errorsize = logger.filesize("error");
    let regex = /(?<!^).(?!$)/g;
let infomserv = JSON.parse(JSON.stringify(global.gConfig));
infomserv.services.opnsearch.user.d_mail = (infomserv.services.opnsearch.user.d_mail).replace(regex, '*');
infomserv.services.opnsearch.user.d_pwd  = (infomserv.services.opnsearch.user.d_pwd).replace(regex, '*');
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
app.get("/*", (req, res) => {
    // #swagger.tags = ['Services']

    var ret = new jsonResponse();
    logger.error(nameFile + ' | /* Api error 404  :' + req.path);
    ret.setMessages("Api error 404");
    res.status(404);
    ret.setSuccess(false);
    return res.send(ret);
});
//module.exports = app;

const root = express();
root.use(contextPath, app);

root.listen(portExpress, () => {
    //logger.flushAllfile();
    logger.info(nameFile + " | Up and running-- this is " + global.configService.app_name + " service on port:" + portExpress + " context-path: " + contextPath);
    console.log("Up and running-- this is " + global.configService.app_name + " service on port:" + portExpress + " context-path:" + contextPath);
    console.log("See Documentation at:", serverUrl);
});
