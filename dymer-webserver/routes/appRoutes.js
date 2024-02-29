var util = require('../utility');
var jsonResponse = require('../jsonResponse');
var express = require('express');
var router = express.Router();
const path = require('path');
/* GET home page. */

router.get('*', function (req, res, next) {
	// #swagger.tags = ['Webserver']

	var realPath = (req.originalUrl).split("?");
	//   console.log('*******************');
	//    console.log('__dirname 3', __dirname);
	//   console.log('richiesta 3', realPath[0]);
	//    console.log('req.originalUrl', req.originalUrl);
	var new__dirname = __dirname.replace('\routes', "")
	//   console.log('new__dirname', new__dirname);
	//   var fileLocationex = path.join(__dirname + "/../", realPath[0]);
	//   var temp__dirname = __dirname.replace("\routes", "");
	//   console.log('exrichiesta', fileLocationex);

	var fileLocation = path.join(new__dirname, "..", realPath[0].replace(util.getContextPath('webserver'), ""));
	//  var fileLocation = path.join(__dirname, "..", realPath[0]);
	// fileLocation = realPath[0];
	// var fileLocation = path.join(temp__dirname, realPath[0].replace(global.gConfig.services.webserver["context-path"], ""));
	//  console.log('realPath[0]', realPath[0]);
	//  fileLocation = realPath[0];
	console.log('risposta 3', fileLocation);
	res.sendFile(fileLocation);
});

module.exports = router;