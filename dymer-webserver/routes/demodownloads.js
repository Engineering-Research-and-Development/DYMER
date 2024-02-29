var util = require('../utility');
var jsonResponse = require('../jsonResponse');
var express = require('express');
var router = express.Router();
const path = require('path');
/* GET home page. */

router.get('/:file(*)', (req, res) => {
	// #swagger.tags = ['Webserver']

	var file = req.params.file;
	var fileLocationex = path.join(__dirname + "/../public/demos", file);
	// console.log('exrichiesta', fileLocationex);
	var fileLocation = path.join(__dirname, "..", "/public/demos", file);
	//  fileLocation = realPath[0];
	//   console.log('richiesta', fileLocation);
	res.download(fileLocation, file);
});
module.exports = router;