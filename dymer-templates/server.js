var jsonResponse = require('./jsonResponse');
const express = require("express");
//process.env.NODE_ENV = "development";
//process.env.TYPE_SERV = "template";
require("./config/config.js");
const path = require("path");
const util = require("./utility");
const bodyParser = require("body-parser");
const app = express();
const portExpress = global.configService.port;
const nameFile = path.basename(__filename);
const logger = require('./routes/dymerlogger');
var routes = require('./routes/routes-v1');
var publicRoutes = require('./routes/publicfiles');
const contextPath = util.getContextPath('template');

/*app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});*/
app.use(express.json())
app.get('/deletelog/:filetype', util.checkIsAdmin, (req, res) => {
	// #swagger.tags = ['Templates']

	var ret = new jsonResponse();
	var filetype = req.params.filetype;
	logger.flushfile(filetype);
	// logger.i
	ret.setSuccess(true);
	ret.setMessages("Deleted");
	return res.send(ret);
});

app.get('/openLog/:filetype', util.checkIsAdmin, (req, res) => {
	// #swagger.tags = ['Templates']

	var filetype = req.params.filetype;
	//console.log('openLog/:filety', path.join(__dirname + "/logs/" + filetype + ".log"));
	return res.sendFile(path.join(__dirname + "/logs/" + filetype + ".log"));
});
app.get('/logtypes', async (req, res) => {
	// #swagger.tags = ['Templates']

	var ret = new jsonResponse();
	ret.setSuccess(true);
	let loggerdebug = global.loggerdebug;
	ret.setData({consolelog: loggerdebug});
	ret.setMessages("logtypes");
	return res.send(ret);
});
app.post('/setlogconfig', (req, res) => {
	// #swagger.tags = ['Templates']

	var ret = new jsonResponse();
	logger.ts_infologger(req.body.consoleactive);
	ret.setMessages("Settings updated");
	ret.setData({consoleactive: req.body.consoleactive});
	return res.send(ret);
});
app.get('/checkservice', util.checkIsAdmin, (req, res) => {
	// #swagger.tags = ['Templates']

	var ret = new jsonResponse();
	let infosize = logger.filesize("info");
	let errorsize = logger.filesize("error");
	ret.setData({
					info            : {
						size: infosize
					},
					error           : {
						size: errorsize
					},
					infomicroservice: global.gConfig
				});
	ret.setMessages("Service is up");
	res.status(200);
	ret.setSuccess(true);
	return res.send(ret);
});
app.use('/api/v1/template/uploads/', publicRoutes
        // #swagger.tags = ['Templates']
);
app.use('/api/v1/template', routes
		// #swagger.tags = ['Templates']

);
app.get('/*', (req, res) => {
	// #swagger.tags = ['Templates']

	var ret = new jsonResponse();
	//console.error('ERROR |  /* : ', "Api error 404", req.path);
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
	logger.info(nameFile + " | Up and running-- this is " + global.configService.app_name + " service on port:" + global.configService.port + " context-path: " + contextPath);
	console.log("Up and running-- this is " + global.configService.app_name + " service on port:" + global.configService.port + " context-path: " + contextPath);
});
