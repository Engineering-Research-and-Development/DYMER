var util = require('../utility');
var jsonResponse = require('../jsonResponse');
var http = require('http');
var https = require('https');
var express = require('express');
const FormData = require('form-data')
const bodyParser = require("body-parser");
const path = require('path');
const nameFile = path.basename(__filename);
const mongoose = require("mongoose");
const logger = require('./dymerlogger');
require('./mongodb.js');
const axios = require('axios');
const fs = require('fs');
var router = express.Router();
const multer = require('multer');
const {json} = require('body-parser');
//DymerSyncRule
require("../models/sync/DymerSyncRule");
const DymRule = mongoose.model("DymerSyncRule");
router.use(bodyParser.json({limit: '50mb', extended: true}))
router.use(bodyParser.urlencoded({limit: '100mb', extended: true}))
/*router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
	extended: false,
	limit: '100MB'
}));*/

router.get('/listrules', util.checkIsAdmin, (req, res) => {
	//

	var ret = new jsonResponse();
	let callData = util.getAllQuery(req);
	let data = callData.data;
	//return res.send(ret);
	//  console.log('data', data);
	// console.log('test');
	var queryFind = {};
	DymRule.find(queryFind).then((els) => {
		ret.setMessages("List");
		ret.setData(els);
		return res.send(ret);
	}).catch((err) => {
		if (err) {
			ret.setMessages("Get error");
			ret.setSuccess(false);
			ret.setExtraData({"log": err.stack});
			return res.send(ret);
		}
	})
});

router.post('/listener', function (req, res) {
	//

	var ret = new jsonResponse();
	let callData = util.getAllQuery(req);
	let data = callData.data;
	let extraInfo = callData.extraInfo;
	//res.send(ret);
	var eventSource = (data.eventSource).split('_')[1];
	//console.log("INFO | " + nameFile + " | callData :", callData);
	//console.log("INFO | " + nameFile + " | obj :", data.obj);
	logger.info(nameFile + ' | post/listener    :' + JSON.stringify(data.obj));
	//console.log("INFO | " + nameFile + " | extraInfo :", extraInfo);
	let rfrom = (req.headers["reqfrom"]).replace("http://", "").replace("https://", "").replace("/", "");
	let element = data.obj;
	var singleEntity = {
		"instance": {
			"index": element._index,
			"type":  element._index,
			"id":    element._id
		},
		"data":     element._source
	};
	//  singleEntity.data.
	let action = "post";
	switch (eventSource) {
		case "update":
			action = "put";
			break;
		case "delete":
			action = "delete";
			break;
		default:
			break;
	}
	let extrainfo_objJsonStr = JSON.stringify(extraInfo);
	let extrainfo_objJsonB64 = Buffer.from(extrainfo_objJsonStr).toString("base64");
	let userinfo = {
		"isGravatarEnabled":      false,
		"authorization_decision": "",
		"roles":                  [{
			"role": "User",
			"id":   "20109"
		},
			{
				"role": "app-admin",
				"id":   "admin@dymer.it"
			}
		],
		"extrainfo":              extraInfo,
		"app_azf_domain":         "",
		"id":                     element._source.properties.owner["uid"],
		"app_id":                 "",
		"email":                  element._source.properties.owner["uid"],
		"username":               element._source.properties.owner["uid"]
	};
	//console.log("INFO | " + nameFile + " | userinfo :", userinfo);
	let userinfo_objJsonStr = JSON.stringify(userinfo);
	let userinfo_objJsonB64 = Buffer.from(userinfo_objJsonStr).toString("base64");
	var objToPost = {
		'data':          singleEntity,
		'DYM_b64':       userinfo_objJsonB64,
		'DYM_EXTRA_b64': extrainfo_objJsonB64,
		'DYM':           userinfo,
		'DYM_EXTRA':     extraInfo
	};
	var queryFind = {'sourceindex': element._index, 'active': true};
	DymRule.find(queryFind).then((els) => {
		ret.setMessages("List");
		ret.setData(els);
		logger.info(nameFile + ' | post/listener    :' + JSON.stringify(els));
		let rules = els;
		postSYNC(action, objToPost, rfrom, rules);
		return res.send(ret);
	}).catch((err) => {
		if (err) {
			console.error("ERROR | " + nameFile + " | post/listener :", err);
			logger.error(nameFile + ' | post/listener :' + err);
			ret.setMessages("Get error");
			ret.setSuccess(false);
			ret.setExtraData({"log": err.stack});
			return res.send(ret);
		}
	});

});

router.post('/:id?', util.checkIsAdmin, function (req, res) {
	//

	let id = req.params.id;
	let callData = util.getAllQuery(req);
	// let data = callData.data;
	let data = req.body;
	var copiaData = Object.assign({}, data);
	var ret = new jsonResponse();
	if (id != undefined) {
		var myfilter = {"_id": mongoose.Types.ObjectId(id)};
		DymRule.updateOne(myfilter, data,
						  function (err, raw) {
							  if (err) {
								  ret.setSuccess(false);
								  logger.error(nameFile + ' | post/sync/:id? | updateOne :' + err);
								  console.error("ERROR | " + nameFile + " | post/sync/:id? | updateOne :", err);
								  ret.setMessages("Model Error");
								  return res.send(ret);
							  } else {
								  ret.addData(copiaData);
								  ret.setMessages("Config Updated");
								  return res.send(ret);
							  }
						  }
		);
	} else {
		var mod = new DymRule(data);
		mod.save().then((el) => {
			ret.setMessages("Config created successfully");
			ret.addData(el);
			return res.send(ret);
		}).catch((err) => {
			if (err) {
				logger.error(nameFile + ' | post/sync/:id? | create: ' + err);
				console.error("ERROR | " + nameFile + " | post/sync/:id? | create: ", err);
				ret.setMessages("Post error");
				ret.setSuccess(false);
				ret.setExtraData({"log": err.stack});
				return res.send(ret);
			}
		})

	}
});
router.put('/:id', util.checkIsAdmin, (req, res) => {
	//

	//console.log("Put cronjob Roles");
	let id = req.params.id;
	logger.info(nameFile + ' | put/sync/:id   :' + id);
	let callData = util.getAllQuery(req);
	//let data = callData.data;
	let data = req.body;
	var copiaData = Object.assign({}, data);
	var ret = new jsonResponse();
	var myfilter = {"_id": mongoose.Types.ObjectId(id)};
	var myquery = {
		"$set": req.body
	};
	DymRule.updateOne(myfilter, req.body,
					  function (err, raw) {
						  if (err) {
							  ret.setSuccess(false);
							  console.error("ERROR | " + nameFile + " | put/sync/:id? | updateOne :", err);
							  logger.error(nameFile + ' | put/sync/:id? | updateOne : ' + err);
							  ret.setMessages("Element Error");
							  return res.send(ret);
						  } else {
							  ret.addData(copiaData);
							  ret.setMessages("Element Updated");
							  return res.send(ret);
						  }
					  }
	);
});
router.delete('/:id', util.checkIsAdmin, (req, res) => {
	//

	var ret = new jsonResponse();
	var id = req.params.id;
	var myfilter = {"_id": id};
	DymRule.findOneAndDelete(myfilter).then((el) => {
		ret.setMessages("Element deleted");
		return res.send(ret);
	}).catch((err) => {
		if (err) {
			console.error("ERROR | " + nameFile + " | delete/sync/:id? | findOneAndDelete :", err);
			logger.error(nameFile + ' | delete/sync/:id? | findOneAndDelete : ' + err);
			ret.setMessages("Delete Error");
			ret.setSuccess(false);
			ret.setExtraData({"log": err.stack});
			return res.send(ret);
		}
	})
});

if (typeof String.prototype.parseFunction != 'function') {
	String.prototype.parseFunction = function () {
		var funcReg = /function *\(([^()]*)\)[ \n\t]*{(.*)}/gmi;
		var match = funcReg.exec(this.replace(/\n/g, ' '));
		try {
			if (match) {
				return new Function(match[1].split(','), match[2]);
			}
		} catch (er) {
			logger.error(nameFile + ' | parse function | fnCond : ' + er);
			return null;
		}
		return null;
	};
}

function postSYNC(action, objToPost, rfrom, rules) {
	//console.log(nameFile + ' | typeaction', action);
	//console.log(nameFile + ' | rfrom', rfrom);
	console.log(nameFile + ' | rules', rules);
	console.log(nameFile + ' | rules', objToPost);
	rules.forEach(element => {
		let entity = {...objToPost.data};
		let extraInfo = {...objToPost.DYM_EXTRA};
		let destindex = element.targetindex;
		/*    console.log(nameFile + ' | entity', JSON.stringify(entity));
			console.log(nameFile + ' | extraInfo', JSON.stringify(extraInfo));
			console.log(nameFile + ' | element', element);
			console.log(nameFile + ' | element.cond', typeof element, element.hasOwnProperty('cond'), element.cond, element.condd);
		   */
		if (element.sendrelation == false) {
			delete entity.data.relation;
		} else {
			let listRelationsImports = (element.typerelations == undefined || element.typerelations == "") ? [] : element.typerelations.split(",");
			if (listRelationsImports.length > 0) {
				Object.keys(entity.data.relation).forEach(function (key) {
					if (!listRelationsImports.includes(key)) {
						delete entity.data.relation[key];
					}
				})
			}
		}
		if (element.cond != undefined) {
			let mfunc = element['cond'];
			try {
				var fnCond = ("function (obj, extraInfo, fnaction) {  " + mfunc + " }").parseFunction();
				let condition = fnCond(entity, extraInfo, action);
				if (condition) {
					/*  console.log("fnCond: ", condition);
									  console.log(nameFile + ' | obj2', JSON.stringify(entity));
									  console.log(nameFile + ' | extraInfo2', JSON.stringify(extraInfo));*/
					postMyDataAndFiles(entity, destindex, objToPost.DYM_b64, objToPost.DYM_EXTRA_b64, action, element)
				}
			} catch (error) {
				console.log("error: ", error);
			}
		} else {
			postMyDataAndFiles(entity, destindex, objToPost.DYM_b64, objToPost.DYM_EXTRA_b64, action, element);
		}
	});
}

function postMyDataAndFiles(el, index, DYM, DYM_EXTRA, action, rule) {
	var query = {
		"query":    {
			"query": {
				"bool": {
					"must": [{
						"term": {
							"_id": el.instance.id
						}
					}]
				}
			}
		},
		"qoptions": {"relations": false}
	};
	// console.log('el', JSON.stringify(el));
	// console.log('query', JSON.stringify(query));
	// var formdata_admin = new FormData();
	// appendFormdata(formdata_admin, query);
	var srcurl = rule.targetpath + "/api/entities/api/v1/entity/_search";
	let fileurl = util.getServiceUrl('webserver') + util.getContextPath('webserver'); //rule.sourcepath;
	var posturl = rule.targetpath + ((rule.apis != undefined) ? ((rule.apis.insert != undefined) ? rule.apis.insert.path : "") : "") + "/" + el.instance.id; //"/api/entities/api/v1/entity/"
	var formdata = new FormData();
	let arrlistFiles = [];
	let dest = 'tempfoldersync';
	const dir = dest + "/" + el.instance.id;
	checkFilesFormdata(arrlistFiles, el);
	let srcconfig = {
		method:  'post',
		url:     srcurl,
		headers: {
			// ...formdata_admin.getHeaders(),
			'Authorization': `Bearer ${DYM}`,
			'extrainfo':     `${DYM_EXTRA}`,
		},
		data:    query
	};
	let sendreq = false;
	axios(srcconfig).then(srcres => {
		//console.log(nameFile + " | srcres", srcres.data);
		if (action == "post") {
			if (srcres.data.data.length > 0) {
				logger.info(nameFile + ' | postMyDataAndFiles | create | entity already exsist in :' + rule.targetpath + "," + el.instance.id);
			} else {
				//create
				sendreq = true;
			}
		}
		if (action == "put") {
			if (srcres.data.data.length < 0) {
				logger.info(nameFile + ' | postMyDataAndFiles | entity does not exsist in :' + rule.targetpath + "," + el.instance.id);
			} else {
				const srcel = srcres.data.data[0];
				let dateExt = new Date(srcel.properties.changed);
				let dateInt = new Date(el.data.properties.changed);
				logger.info(nameFile + ' | postMyDataAndFiles | update | entity will update (dateExt < dateInt)' + (dateExt < dateInt) + ' in :' + rule.targetpath + "," + el.instance.id);
				if (dateExt < dateInt) {
					posturl = rule.targetpath + ((rule.apis != undefined) ? ((rule.apis.update != undefined) ? rule.apis.update.path : "") : "") + "/" + el.instance.id;
					//update
					sendreq = true;
				} else {
					//crete?
				}
			}
		}
		if (action == "delete") {
			if (srcres.data.data.length < 0) {
				logger.info(nameFile + ' | postMyDataAndFiles | delete | entity does not exsist in :' + rule.targetpath + "," + el.instance.id);
			} else {
				//delete
				posturl = rule.targetpath + ((rule.apis != undefined) ? ((rule.apis.delete != undefined) ? rule.apis.delete.path : "") : "") + "/" + el.instance.id;
			}
		}
		if (sendreq) {
			let requests = arrlistFiles.map((fl) => {
				let url = fileurl + "/api/entities/api/v1/entity/contentfile/" + el.instance.id + "/" + fl.id;
				url += "?tkdym=" + DYM;
				if (!fs.existsSync(dir)) {
					fs.mkdirSync(dir, {recursive: true});
				}
				let fname = fl.filename;
				return downloadFile(url, dir, fname).then(function (result) {
					// console.log('downloadFile', fname, result);
					// form.append('file', fs.readFileSync(dest), fname);
				}).catch(function (err) {
					console.log("err_a", err);
					logger.error(nameFile + ' | postMyDataAndFiles | downloadFile : ' + err);
				});
			})
			Promise.all(requests).then(() => {
				appendFormdataFiles(formdata, el, '', dir + "/");
				//console.log("Promesse tutte eseguite");
				logger.info(nameFile + ' | postMyDataAndFiles | Promises tutte eseguite  ');
				var config = {
					method:           action,
					url:              posturl,
					headers:          {
						...formdata.getHeaders(),
						'Authorization': `Bearer ${DYM}`,
						'extrainfo':     `${DYM_EXTRA}`,
					},
					maxContentLength: Infinity,
					maxBodyLength:    Infinity,
					data:             formdata
				};
				// console.log(nameFile + ' | callFwAdapter | invio, ad adapter | conf : ' + JSON.stringify(conf));
				//console.log(nameFile + ' | callFwAdapter | invio, ad adapter | el : ' + action + "-" + posturl + "-" + JSON.stringify(el));
				axios(config)
					.then(function (updatedEl) {
						if (fs.existsSync(dir)) {
							removeDir(dir);
							//  fs.rm(dir);
							// fs.rmdirSync(dir, { recursive: true });
						}
					}).catch(function (error) {
					logger.error(nameFile + ' | postMyDataAndFiles | axios post : ' + error);
					console.log("Error__________", error);
					//    removeDir(dir);
				});
			});
		}
	}).catch(function (error) {
		logger.error(nameFile + ' | postMyDataAndFiles | check entity exsist : ' + error);
		console.log("Error__________", error);
	});
}

function appendFormdataFiles(FormData, data, name, folder) {
	var name = name || '';
	if (typeof data === 'object') {
		var index = 0
		if (data.hasOwnProperty("filename") && data.hasOwnProperty("bucketName")) {
			FormData.append(name, fs.createReadStream(folder + data.filename));
		} else {
			for (var key in data) {
				if (data.hasOwnProperty(key)) {
					if (name === '') {
						appendFormdataFiles(FormData, data[key], key, folder);
					} else {
						appendFormdataFiles(FormData, data[key], name + '[' + key + ']', folder);
					}
				}
				index++;
			}
		}
	} else {
		FormData.append(name, data);
	}
}

function checkFilesFormdata(arr, data, name) {
	var name = name || '';
	if (typeof data === 'object' && data != null) {
		var index = 0
		if (data.hasOwnProperty("filename") && data.hasOwnProperty("bucketName")) {
			arr.push(data);
		}
		for (var key in data) {
			if (data.hasOwnProperty(key)) {
				if (name === '') {
					checkFilesFormdata(arr, data[key], key);
				} else {
					checkFilesFormdata(arr, data[key], name + '[' + key + ']');
				}
			}
			index++;
		}
	}
}

var downloadFile = function (url, dest, filename) {
	return new Promise(function (resolve, reject) {
		if (url.startsWith("https")) {
			https.get(url, (res) => {
				// Image will be stored at this path
				//const path = `${__dirname}../importfile/img.jpeg`;
				const path = `${dest}/${filename}`;
				const filePath = fs.createWriteStream(path);
				res.pipe(filePath);
				filePath.on('finish', () => {
					filePath.close();
					resolve();
				})
			})
		} else {
			http.get(url, (res) => {
				// Image will be stored at this path
				//const path = `${__dirname}../importfile/img.jpeg`;
				const path = `${dest}/${filename}`;
				const filePath = fs.createWriteStream(path);
				res.pipe(filePath);
				filePath.on('finish', () => {
					filePath.close();
					resolve();
				})
			})
		}

	}).catch(function (err) {
		console.error("ERROR | " + nameFile + " | downloadFile ", err);
		logger.error(nameFile + ' | downloadFile : ' + err);
	});
}
const removeDir = function (path) {
	if (fs.existsSync(path)) {
		const files = fs.readdirSync(path)
		if (files.length > 0) {
			files.forEach(function (filename) {
				if (fs.statSync(path + "/" + filename).isDirectory()) {
					removeDir(path + "/" + filename)
				} else {
					fs.unlinkSync(path + "/" + filename)
				}
			})
			// fs.rmdirSync(path)
		} else {
			fs.rmdirSync(path)
		}
	} else {
		console.error("ERROR | " + nameFile + " | Directory path not found ", path);
		logger.error(nameFile + ' | removeDir | Directory path not found  : ' + path);
	}
}

function appendFormdata(FormData, data, name) {
	var name = name || '';
	if (typeof data === 'object') {
		var index = 0
		for (var key in data) {
			if (data.hasOwnProperty(key)) {
				if (name === '') {
					appendFormdata(FormData, data[key], key);
				} else {
					appendFormdata(FormData, data[key], name + '[' + key + ']');
				}
			}
			index++;
		}
	} else {
		FormData.append(name, data);
	}
}

module.exports = router;