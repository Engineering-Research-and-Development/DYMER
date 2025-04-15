var util = require('../utility');
var jsonResponse = require('../jsonResponse');
const multer = require('multer');
var fs = require('fs');
var mv = require('mv');
const FormData = require('form-data');
var http = require('http');
require("../models/opnSearch/OpnSearchRule");
require("../models/opnSearch/OpnSearchConfig");
var express = require('express');
//const multer = require('multer');
const bodyParser = require("body-parser");
const path = require('path');
const nameFile = path.basename(__filename);
const mongoose = require("mongoose");
require("../models/ServiceEntityHooks");
require("../models/opnSearch/OpnUserModel")
const HookModel = mongoose.model("ServiceEntityHooks");
const OpnUserModel = mongoose.model("OpnUserModel");
require('./mongodb.js');
var router = express.Router();
const logger = require('./dymerlogger');
//var GridFsStorage = require("multer-gridfs-storage");
const OpnSearchRule = mongoose.model("OpnSearchRule");
const OpnSearchConfig = mongoose.model("OpnSearchConfig");
const axios = require('axios');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: false,
    limit: '100MB'
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
    });*/
var storageEngine = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './uploads');
    },
    filename: function (req, file, fn) {
        fn(null, new Date().getTime().toString() + '-__-' + file.originalname);
    }
});

var upload = multer({storage: storageEngine}).any(); // .single('file');

router.post('/setConfig', util.checkIsAdmin, function (req, res) {

    let callData = util.getAllQuery(req);
    let data = callData.data;
    var copiaData = Object.assign({}, data);
    var ret = new jsonResponse();
    var obj = data;
    var id = obj.id;
    delete obj.id;
    var mod = new OpnSearchConfig(obj);
    if (id != '' && id != undefined) {
        var myfilter = {"_id": mongoose.Types.ObjectId(id)};
        OpnSearchConfig.updateOne(myfilter, obj,
            function (err, raw) {
                if (err) {
                    ret.setSuccess(false);
                    console.error("ERROR | " + nameFile + " | post/setConfig | updateOne :", err);
                    logger.error(nameFile + ' || post/setConfig | updateOne  : ' + err);
                    ret.setMessages("Model Error");
                    return res.send(ret);
                } else {
                    ret.addData(copiaData);
                    ret.setMessages("Config Updated");
                    return res.send(ret);
                }
            }
        );
    } else
        mod.save().then((el) => {
            ret.setMessages("Config created successfully");
            ret.addData(el);
            return res.send(ret);
        }).catch((err) => {
            if (err) {
                console.error("ERROR | " + nameFile + " | post/setConfig | save :", err);
                logger.error(nameFile + ' | post/setConfig | save : ' + err);
                ret.setMessages("Post error");
                ret.setSuccess(false);
                ret.setExtraData({"log": err.stack});
                return res.send(ret);
            }
        })
});

router.get('/configs', (req, res) => {

    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let data = callData.data;
    let queryFind = callData.query;
    OpnSearchConfig.find(queryFind).then((els) => {
        ret.setMessages("List");
        ret.setData(els);
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | get/configs :", err);
            logger.error(nameFile + ' | get/configs : ' + err);
            ret.setMessages("Get error");
            ret.setSuccess(false);
            ret.setExtraData({"log": err.stack});
            return res.send(ret);
        }
    })
    //res.send("this is  dd our main andpoint");
});

router.post('/addrule', util.checkIsAdmin, function (req, res) {

    let callData = util.getAllQuery(req);
    let data = callData.data;
    var ret = new jsonResponse();
    var newObj = {
        _index: data.op_index,
        _type: data.op_type,
        mapping: data.op_mapping,
        sendnotification: data.sendnotification
    }
    var mod = new OpnSearchRule(newObj);
    mod.save().then((el) => {
        ret.setMessages("Role successfully added");
        ret.addData(el);
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | post/addrule :", err);
            logger.error(nameFile + '  | post/addrule : ' + err);
            ret.setMessages("Post error");
            ret.setSuccess(false);
            ret.setExtraData({"log": err.stack});
            return res.send(ret);
        }
    })
});

router.get('/rules/', (req, res) => {

    let callData = util.getAllQuery(req);
    let queryFind = callData.query;
    //return res.send(ret);
    return findRule(queryFind, res);
});

function findRule(queryFind, res) {
    var ret = new jsonResponse();
    OpnSearchRule.find(queryFind).then((els) => {
        ret.setMessages("List");
        ret.setData(els);
        // console.log('ret', ret);
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | findRule :", err);
            logger.error(nameFile + ' | findRule : ' + err);
            ret.setMessages("Get error");
            ret.setSuccess(false);
            ret.setExtraData({"log": err.stack});
            return res.send(ret);
        }
    })
}

router.delete('/rule/:id', util.checkIsAdmin, (req, res) => {

    var ret = new jsonResponse();
    var id = req.params.id;
    var myfilter = {"_id": id};
    OpnSearchRule.findOneAndDelete(myfilter).then((el) => {
        ret.setMessages("Element deleted");
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | delete/rule/:id :", id, err);
            logger.error(nameFile + ' | delete/rule/:id : ' + id + " " + err);
            ret.setMessages("Delete Error");
            ret.setSuccess(false);
            ret.setExtraData({"log": err.stack});
            return res.send(ret);
        }
    })
});

/*MG - Run RULE - Inizio*/
router.get('/run/:id', util.checkIsAdmin, (req, res) => {
     
	 let ret = new jsonResponse();
	 console.log("INFO | " + nameFile + " | /run/:id : DISABLED");
	    ret.setSuccess(true);
        ret.setMessages("Action disabled");
        return res.send(ret);
	 
	
});

async function manageFunctions(el, response, dymerentries, hook, extraInfo, dymeruser) {
    if (hook.eventType == "after_insert") {
        await insertFunction(response, el, dymerentries, hook, extraInfo, dymeruser);
    }
    if (hook.eventType == "after_update") {
        await updateFunction(response, el, dymerentries, hook, extraInfo, dymeruser);
    }
    if (hook.eventType == "after_delete") {
        await deleteFunction(response, el, dymerentries, hook, dymeruser);
    }
}

function insertFunction(response, el, dymerentries, hook, extraInfo, dymeruser) {
    let promises = [];
    let promisesMap = [];
    let bulk = OpnSearchRule.collection.initializeOrderedBulkOp();
    return new Promise((res, rej) => {
        response.data.data.forEach(function (rdd, ind) {
            promises.push(() => ins(rdd, ind, el, dymerentries, hook, extraInfo, dymeruser));
        });
        promisesMap = promises.map(promise => promise());
        Promise.all(promisesMap).then(function (results) {
            results = results.filter(value => Object.keys(value).length !== 0);
            console.log("Results insert ===> ", results);
            /*Aggiorno OpnSearchRule, inserendo i dati di riepilogo dell'esecuzione*/
            bulk.find({"_index": el._index}).updateOne({
                "$set": {info_insert: results, changed: new Date().toISOString()}
            });
            bulk.execute(function (error, result) {
                if (error) {
                    console.error(nameFile + ' | run/:id | Error for Update OpnSearchRule | ' + error);
                    logger.error(nameFile + ' | run/:id |  Error for Update OpnSearchRule | ' + error);
                } else {
                    logger.info(nameFile + ' | run/:id | Update OpnSearchRule | ' + result);
                }
            });
            res(promisesMap);
        });
    });
}

function updateFunction(response, el, dymerentries, hook, extraInfo, dymeruser) {
    let promises = [];
    let promisesMap = [];
    let bulk = OpnSearchRule.collection.initializeOrderedBulkOp();
    return new Promise((res, rej) => {
        response.data.data.forEach(function (rdd, ind) {
            promises.push(() => upd(rdd, ind, el, dymerentries, hook, extraInfo, dymeruser));
        });
        promisesMap = promises.map(promise => promise());
        Promise.all(promisesMap).then(function (results) {
            results = results.filter(value => Object.keys(value).length !== 0);
            console.log("Results update ===> ", results);
            /*Aggiorno OpnSearchRule, inserendo i dati di riepilogo dell'esecuzione*/
            bulk.find({"_index": el._index}).updateOne({
                "$set": {info_update: results, changed: new Date().toISOString()}
            });
            bulk.execute(function (error, result) {
                if (error) {
                    console.error(nameFile + ' | run/:id | Error for Update OpnSearchRule | ' + error);
                    logger.error(nameFile + ' | run/:id |  Error for Update OpnSearchRule | ' + error);
                } else {
                    logger.info(nameFile + ' | run/:id | Update OpnSearchRule | ' + result);
                }
            });
            res(promisesMap);
        });
    });
}

function deleteFunction(response, el, dymerentries, hook, dymeruser) {
    let promises = [];
    let promisesMap = [];
    let bulk = OpnSearchRule.collection.initializeOrderedBulkOp();
    return new Promise((res, rej) => {
        dymerentries.forEach(function (dimerentry, ind) {
            let entity = response.data.data.find(value => value._id === dimerentry.id_);
            if (typeof (entity) == "undefined") {
                promises.push(() => del(ind, el, dimerentry, hook, dymeruser));
            }
        });
        promisesMap = promises.map(promise => promise());
        Promise.all(promisesMap).then(function (results) {
            results = results.filter(value => Object.keys(value).length !== 0);
            console.log("Results delete ===> ", results);
            /*Aggiorno OpnSearchRule, inserendo i dati di riepilogo dell'esecuzione*/
            bulk.find({"_index": el._index}).updateOne({
                "$set": {info_delete: results, changed: new Date().toISOString()}
            });
            bulk.execute(function (error, result) {
                if (error) {
                    console.error(nameFile + ' | run/:id | Error for Update OpnSearchRule | ' + error);
                    logger.error(nameFile + ' | run/:id |  Error for Update OpnSearchRule | ' + error);
                } else {
                    logger.info(nameFile + ' | run/:id | Update OpnSearchRule | ' + result);
                }
            });
            res(promisesMap);
        });
    });
}

function ins(rdd, ind, el, dymerentries, hook, extraInfo, dymeruser) {
    let info = {};
    let dymerentry = dymerentries.find(value => value.id_ === rdd._id);
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            /*Se l'asset manca e se è previsto l'insert, effettuo l'inserimento dell'asset*/
            if (typeof (dymerentry) == "undefined") {
                logger.info(nameFile + ' | run/:id | postAssettOpenness for ' + hook.eventType.split("after_")[1] + ' of ' + rdd._id);
                postAssettOpenness(hook.eventType.split("after_")[1], rdd, el, extraInfo);
                info.operation = "Insert";
                info.username = dymeruser.username;
                info.id = rdd._id;
                info.title = rdd._source.title;
            }
            resolve(info);
        }, 1000 * (ind + 1));
    });
}

function upd(rdd, ind, el, dymerentries, hook, extraInfo, dymeruser) {
    let info = {};
    let entityChangedDate = rdd._source.properties.changed;
    let dymerentry = dymerentries.find(value => value.id_ === rdd._id);
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            /*Se l'asset esiste, se è previsto l'update e se la data di modifica dell'entità
            è più recente di quella dell'asset, aggiorno l'asset*/
            if (typeof (dymerentry) != "undefined") {
                if (entityChangedDate > dymerentry.modifiedDate) {
                    logger.info(nameFile + ' | run/:id | postAssettOpenness for ' + hook.eventType.split("after_")[1] + ' of ' + rdd._id);
                    postAssettOpenness(hook.eventType.split("after_")[1], rdd, el, extraInfo);
                    info.operation = "Update";
                    info.username = dymeruser.username;
                    info.id = rdd._id;
                    info.title = rdd._source.title;
                }
            }
            resolve(info);
        }, 1000 * (ind + 1));
    });
}

function del(ind, el, dymerentry, hook, dymeruser) {
    let info = {};
    let openSearchConfig = {};
    let asset = {
        "emailAddress": dymeruser.email,
        "companyId": Number(dymeruser.extrainfo.companyId),
        "index": el._index,
        "type": el._type,
        "id": dymerentry.id_,
        "notify": el.sendNotification
    };
    let queryFind = {'servicetype': hook.eventType.split("after_")[1]};
    /*Verifico se sono presenti assets in più, rispetto alle entità, 
    ed eventualmente li elimino, se il relativo hook è previsto*/
    return new Promise(function (resolve, reject) {
        OpnSearchConfig.find(queryFind).then((osc) => {
            if (osc.length > 0) {
                openSearchConfig = osc[0];
            }
        });
        setTimeout(function () {
            logger.info(nameFile + ' | run/:id | callOpennessJsw for delete of ' + dymerentry.id_);
            //callOpennessJsw(openSearchConfig, asset);
            info.operation = "Delete";
            info.username = dymeruser.username;
            info.id = dymerentry.id_;
            info.title = dymerentry.title;
            resolve(info);
        }, 1000 * (ind + 1));
    });
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

/*MG - Run RULE - Fine*/

router.post('/listener', function (req, res) {

    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let data = callData.data;
    let extraInfo = callData.extraInfo;
    //res.send(ret);
    var eventSource = (data.eventSource).split('_');
    var queryFind = {
        "_index": data.obj._index,
        "_type": data.obj._type
    };
    OpnSearchRule.find(queryFind).then((els) => {
        ret.setMessages("List");
        ret.setData(els);
        let singleRule = els[0]
        postAssettOpenness(eventSource[1], data.obj, singleRule, extraInfo);
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

router.get('/users', (req, res) => {
    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let data = callData.data;
    let queryFind = callData.query;
    OpnUserModel.find(queryFind).then((els) => {
        ret.setMessages("List");
        ret.setData(els);
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | get/users :", err);
            logger.error(nameFile + ' | get/users : ' + err);
            ret.setMessages("Get error");
            ret.setSuccess(false);
            ret.setExtraData({"log": err.stack});
            return res.send(ret);
        }
    })
});
router.post('/setuser', util.checkIsAdmin, function (req, res) {
    let callData = util.getAllQuery(req);
    let userRaw = callData.user;
    let copyUser = {...userRaw};
    let ret = new jsonResponse();

    let obj = userRaw;
    let id = obj._id;
    delete obj._id;
    let userModel = new OpnUserModel(obj);
    if (id != '' && id != undefined) {
        const objId = {"_id": mongoose.Types.ObjectId(id)};
        OpnUserModel.updateOne(objId, obj,
            function (err, raw) {
                if (err) {
                    ret.setSuccess(false);
                    console.error("ERROR | " + nameFile + " | post/ | updateOne :", err);
                    logger.error(nameFile + ' || post/ | updateOne  : ' + err);
                    ret.setMessages("Model Error");
                    return res.send(ret);
                } else {
                    ret.addData(copyUser);
                    ret.setMessages("User Updated");
                    return res.send(ret);
                }
            }
        );
    } else
        userModel.save().then((el) => {
            ret.setMessages("User created successfully");
            ret.addData(el);
            return res.send(ret);
        }).catch((err) => {
            if (err) {
                console.error("ERROR | " + nameFile + " | post/ | save :", err);
                logger.error(nameFile + ' | post/ | save : ' + err);
                ret.setMessages("Post error");
                ret.setSuccess(false);
                ret.setExtraData({"log": err.stack});
                return res.send(ret);
            }
        })
});


function postAssettOpenness(typeaction, obj, rule, extraInfo) {
	
	logger.info(nameFile + ' | postAssettOpenness | insert/update Json openness: DISABLED');
	  
}

function callOpennessJsw(conf, postObj) {
	
	 logger.info(nameFile + ' | callOpennessJsw | DISABLED');
	 
}

module.exports = router;
