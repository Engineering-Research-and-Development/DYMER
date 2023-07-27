var util = require('../utility');
var jsonResponse = require('../jsonResponse');
var fs = require('fs');
var mv = require('mv');
//require("../models/Form");
var express = require('express');
//const multer = require('multer');
const bodyParser = require("body-parser");
const path = require('path');
const mongoose = require("mongoose");
var router = express.Router();
const nameFile = path.basename(__filename);
//var GridFsStorage = require("multer-gridfs-storage");
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));
router.post('/checkServiceBinded', function (req, res) {
	// #swagger.tags = ['Services']

	console.log("aggiungo un mapping per onenness search");
	var ret = new jsonResponse();
	let callData = util.getAllQuery(req);
	let data = callData.data;
	//  data.
	return res.send(ret);
});

router.get('/', function (req, res) {
	// #swagger.tags = ['Services']

	console.log("recupero tutti i servizi opensearch");
	var ret = new jsonResponse();
	return res.send(ret);
});

module.exports = router;