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
const portExpress = global.gConfig.port;
var routes = require('./routes/routes-v1');
var routes_dymer_openness = require('./routes/routes-d-opn-v1');
var routes_dymer_fwadapter = require('./routes/routes-d-fwadapter-v1');
var routes_dymer_hooks = require('./routes/routes-d-servicehooks');
var routes_dymer_eaggregation = require('./routes/routes-d-eaggregation');
var routes_dymer_usermap = require('./routes/routes-d-usermap');
//var routes_dymer_taxonomy = require('./routes/routes-d-taxonomy');
var routes_dymer_import = require('./routes/routes-d-import');
var routes_dymer_permission = require('./routes/routes-d-perm');
//var routes_dymer_importp4t = require('./routes/routes-d-importp4t');
var publicRoutes = require('./routes/publicfiles');
var routes_dymer_configtool = require('./routes/routes-d-configtool');
var routes_dymer_authconfig = require('./routes/routes-d-authconfig');
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
app.use(util.getContextPath('dservice') + '/api/v1/opn', routes_dymer_openness);
app.use(util.getContextPath('dservice') + '/api/v1/fwadapter', routes_dymer_fwadapter);
app.use(util.getContextPath('dservice') + '/api/v1/servicehook', routes_dymer_hooks);
app.use(util.getContextPath('dservice') + '/api/v1/eaggregation', routes_dymer_eaggregation);
//app.use(util.getContextPath('dservice') + '/api/v1/taxonomy', routes_dymer_taxonomy);
app.use(util.getContextPath('dservice') + '/api/v1/usermap', routes_dymer_usermap);
app.use(util.getContextPath('dservice') + '/api/v1/import', routes_dymer_import);
app.use(util.getContextPath('dservice') + '/api/v1/perm', routes_dymer_permission);
//app.use(util.getContextPath('dservice') + '/api/v1/importp4t', routes_dymer_importp4t);
app.use(util.getContextPath('dservice') + '/api/v1/configtool', routes_dymer_configtool);
app.use(util.getContextPath('dservice') + '/api/v1/authconfig', routes_dymer_authconfig);
app.get("/*", (req, res) => {
    var ret = new jsonResponse();
    ret.setMessages("Api error 404");
    res.status(404);
    ret.setSuccess(false);
    return res.send(ret);
});
//module.exports = app;
app.listen(portExpress, () => {
    console.log("Up and running-- this is " + global.gConfig.app_name + " service on port:" + global.gConfig.port + " context-path:" + util.getContextPath('dservice'));
});