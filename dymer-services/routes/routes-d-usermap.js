var util = require('../utility');
var jsonResponse = require('../jsonResponse');
const multer = require('multer');
var http = require('http');
require("../models/userMap/userMap");
var express = require('express');
const bodyParser = require("body-parser");
const path = require('path');
const nameFile = path.basename(__filename);
const mongoose = require("mongoose");
require('./mongodb.js');
var router = express.Router();
var jsonParser = bodyParser.json();
const userMap = mongoose.model("userMap");
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
									 extended: false,
									 limit:    '100MB'
								 }));
//   /api/v1/opn/
/*
const mongoURI = util.mongoUrlForm();
console.log(nameFile + ' | mongoURI :', JSON.stringify(mongoURI));
var db;
mongoose
    .connect(mongoURI, {
        //  useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(x => {
        console.log(nameFile + ` | Connected to Mongo! Database name: "${x.connections[0].name}"`);
        db = x.connections[0].db;
        //console.log(x.connections[0].db);
    })
    .catch(err => {
        console.error("ERROR | " + nameFile + ` | Error connecting to mongo! Database name: "${x.connections[0].name}"`, err);
    });
*/
var storageEngine = multer.diskStorage({
										   destination: function (req, file, callback) {
											   callback(null, './uploads');
										   },
										   filename:    function (req, file, fn) {
											   fn(null, new Date().getTime().toString() + '-__-' + file.originalname);
										   }
									   });
var upload = multer({storage: storageEngine}).any(); // .single('file');


router.post('/setusermap', function (req, res) {
	// #swagger.tags = ['Services']
	// #swagger.path = '/api/dservice/api/v1/usermap/setusermap'

	console.log("aggiungo un mapping l'utente");
	let callData = util.getAllQuery(req);

	let data = callData.data;
	var copiaData = Object.assign({}, data);
	var ret = new jsonResponse();
	var obj = data;
	var id = obj.id;
	delete obj.id;
	console.log("aggiungo/modifico un mapping per onenness search id=", id);
	var mod = new userMap(obj);
	if (id != '' && id != undefined) {
		var myfilter = {"_id": mongoose.Types.ObjectId(id)};
		userMap.updateOne(myfilter, obj,
						  function (err, raw) {
							  if (err) {
								  ret.setSuccess(false);
								  console.log('Error log: ' + err)
								  ret.setMessages("Model Error");
								  return res.send(ret);
							  } else {
								  ret.addData(copiaData);
								  ret.setMessages("Config Updated");
								  return res.send(ret);
							  }
						  }
		);
		/*  Model.updateOne
		  mod.update({ _id: id }, obj, { upsert: true }, function(err) {});*/
	} else
		mod.save().then((el) => {
			ret.setMessages("Config created successfully");
			ret.addData(el);
			return res.send(ret);
		}).catch((err) => {
			if (err) {
				console.error(err);
				ret.setMessages("Post error");
				ret.setSuccess(false);
				ret.setExtraData({"log": err.stack});
				return res.send(ret);
			}
		})
});


router.post('/addusermap', function (req, res) {
	// #swagger.tags = ['Services']
	// #swagger.path = '/api/dservice/api/v1/usermap/addusermap'

	console.log("aggiungo un mapping per onenness search");
	let callData = util.getAllQuery(req);
	//console.log(callData);

	let username = callData.username;
	let email = callData.email;
	let extrainfo = callData.extrainfo;
	let role = callData.roles;
	console.log(callData);


	var ret = new jsonResponse();
	var newObj = {
		username:  username,
		email:     email,
		extrainfo: extrainfo,
		role:      role
	}

	var mod = new usermap(newObj);
	mod.save().then((el) => {
		ret.setMessages("Configuration uploaded successfully");
		ret.addData(el);
		return res.send(ret);

	}).catch((err) => {
		if (err) {
			console.error(err);
			ret.setMessages("Post error");
			ret.setSuccess(false);
			ret.setExtraData({"log": err.stack});
			return res.send(ret);
		}
	})

});


router.get('/findbyemail/:email', function (req, res) {
	// #swagger.tags = ['Services']
	// #swagger.path = '/api/dservice/api/v1/usermap/{email}'


	const _email = req.params.email;
	console.log("ricevo chiamata per find email");
	var grpUsr = [];
	userMap.findOne({email: _email}).then((els) => {
		console.log(els);
		if (els.length > 0) {
			ret.setMessages("utente esiste,");
			ret.addData(el);
			return res.send(ret);
		} else {
			ret.setMessages("utente non esiste");
			ret.addData(grpUsr);
			return res.send(ret);
		}

	}).catch((err) => {
		if (err) {
			console.error(err);
			ret.setMessages("Post error");
			ret.setSuccess(false);
			ret.setExtraData({"log": err.stack});
			return res.send(ret);
		}
	});


});


module.exports = router;