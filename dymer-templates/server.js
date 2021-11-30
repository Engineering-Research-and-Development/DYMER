var jsonResponse = require('./jsonResponse');
const express = require("express");
//process.env.NODE_ENV = "development";
//process.env.TYPE_SERV = "template";
require("./config/config.js");
const path = require("path");
const util = require("./utility");
const bodyParser = require("body-parser");
const app = express();
const portExpress = global.gConfig.port;
var routes = require('./routes/routes-v1');
var publicRoutes = require('./routes/publicfiles');
/*app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});*/
app.use(util.getContextPath('template') + "/api/v1/template/uploads/", publicRoutes);
app.use(util.getContextPath('template') + '/api/v1/template', routes);
app.get(util.getContextPath('template') + "/*", (req, res) => {
    var ret = new jsonResponse();
    console.error('ERROR |  /* : ', "Api error 404", req.path);
    ret.setMessages("Api error 404");
    res.status(404);
    ret.setSuccess(false);
    return res.send(ret);
});
//module.exports = app;
app.listen(portExpress, () => {
    console.log("Up and running-- this is " + global.gConfig.app_name + " service on port:" + global.gConfig.port + " context-path: " + util.getContextPath('template'));
});