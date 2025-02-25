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
    OpnUserModel.find().then(el => {
        let user = el[0]
        let openSearchUser = {
            cid: user["cid"],
            gid: user["gid"],
            uid: user["uid"],
            email: user["d_mail"],
            password: util.decrypt("", user["d_pwd"])
        }

        /*Recupero i dati dell'utente Openness dai cookies*/
        let list = {};
        let cookieHeader = req.headers?.cookie;
        cookieHeader.split(`;`).forEach(function (cookie) {
            let [name, ...rest] = cookie.split(`=`);
            name = name?.trim();
            let value = rest.join(`=`).trim();
            list[name] = decodeURIComponent(value);
        });
        let dymeruser = JSON.parse(Buffer.from(list["DYM"], 'base64').toString('utf-8'));
        let ret = new jsonResponse();
        /*Id dell'indice selezionato*/
        let id = req.params.id;
        let myfilter = {"_id": id};
        /*Acquisisco la regola relativa all'indice*/
        OpnSearchRule.find(myfilter).then((el) => {
            /*Acquisisco tutte le entità relative all'indice*/
            let query = {
                "query": {
                    "query": {
                        "bool": {
                            "must": [{
                                "term": {
                                    "_index": el[0]._index
                                }
                            }]
                        }
                    }
                }
            };
            let formdata_admin = new FormData();
            appendFormdata(formdata_admin, query);
            let entityConfig = {
                method: 'GET',
                url: util.getServiceUrl('webserver') + util.getContextPath('webserver') + '/api/entities/api/v1/entity/',
                params: query,
                headers: {
                    ...formdata_admin.getHeaders()
                }
            };
            axios(entityConfig).then(response => {
                logger.info(nameFile + ' | run/:id | get entities by index ' + el[0]._index + ' : ' +
                    response.data.data.map(obj =>
                        (JSON.stringify({
                            id: obj._id,
                            title: obj._source.title,
                            changed: obj._source.properties.changed
                        }))));
                /*Acquisisco tutti gli assets relativi all'indice*/
                let dymerentries = [];
                /*let dymerentries = [{
                    index_ : 'pipeline_from_import',
                    id_: 'vmtestle-6hdm-4678-8913-2061678189131',
                    modifiedDate: '2023-09-15T15:04:06.846Z'
                },
                {
                    index_ : 'pipeline_from_import',
                    id_: 'vmtestlm-q8zj-4694-9007-268169479007',
                    modifiedDate: '2023-09-14T15:00:13.066Z'
                }];*/
                /*Recupero host, porta e path del servizio di Get Dymer Entries di Openness*/

                OpnSearchConfig.find({'servicetype': 'get'}).then((els) => {
                    if (els.length > 0) {
                        // let credentials = util.getServiceConfig("opnsearch").user.d_mail + ":" + util.getServiceConfig("opnsearch").user.d_pwd;
                        let credentials = openSearchUser.email + ":" + openSearchUser.password;
                        let dymerConfig = {
                            method: 'GET',
                            url: els[0].configuration.host + ":" + els[0].configuration.port + "/api/jsonws/" + els[0].configuration.path,
                            params: {"index": el[0]._index},
                            headers: {
                                ...formdata_admin.getHeaders(),
                                'Authorization': `Basic ` + Buffer.from(credentials, 'utf-8').toString('base64')
                            }
                        };
                        axios(dymerConfig).then(dymerResponse => {
                            dymerentries = dymerResponse.data;
                            /*Verifo la presenza degli hooks*/
                            let queryFind = {
                                "_index": el[0]._index,
                                "service.serviceType": "openness_search"
                            };
                            HookModel.find(queryFind).then((hooks) => {
                                if (hooks.length > 0) {
                                    (hooks).forEach(hook => {
                                        let extraInfo = {
                                            companyId: dymeruser.extrainfo.companyId,
                                            groupId: dymeruser.extrainfo.groupId,
                                            cms: dymeruser.extrainfo.cms,
                                            userId: dymeruser.extrainfo.userId,
                                            emailAddress: dymeruser.email,
                                            virtualhost: dymeruser.extrainfo.virtualHost
                                        }
                                        manageFunctions(el[0], response, dymerentries, hook, extraInfo, dymeruser);
                                    });
                                    if (hooks.length < 3) {
                                        ret.setMessages("Start of execution of the Run Rule successful but be careful : one or more hooks are missing !!!");
                                    } else {
                                        ret.setMessages("Start of execution of the Run Rule successful");
                                    }
                                    ret.setSuccess(true);
                                    return res.send(ret);

                                } else {
                                    ret.setSuccess(false);
                                    ret.setMessages("No hooks associated with the rule !");
                                    return res.send(ret);
                                }
                            });
                        }).catch(error => {
                            if (error) {
                                console.error("ERROR | " + nameFile + " | dym.dymerentry/getDymerEntries ", error);
                                logger.error(nameFile + " | dym.dymerentry/getDymerEntries " + error);
                                ret.setMessages("Get DymerEntries Error");
                                ret.setSuccess(false);
                                ret.setExtraData({"log": error.stack});
                                return res.send(ret);
                            }
                        });
                    }
                });
                //error per le credential
            });
        }).catch((error) => {
            if (error) {
                console.error("ERROR | " + nameFile + " | run/:id :", id, error);
                logger.error(nameFile + ' | run/:id : ' + id + " " + error);
                ret.setMessages("Run rule Error");
                ret.setSuccess(false);
                ret.setExtraData({"log": error.stack});
                return res.send(ret);
            }
        })
    }).catch((e) => {
        console.error("ERROR | " + nameFile + " | dym.dymerentry/OpenSearch User ", error);
        logger.error(nameFile + " | dym.dymerentry/OpenSearch User " + error);
        ret.setMessages("Get OpenSearch User Error");
        ret.setSuccess(false);
        ret.setExtraData({"log": error.stack});
        return res.send(ret);
    })
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
            callOpennessJsw(openSearchConfig, asset);
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
    OpnUserModel.find().then(el => {
        let user = el[0]
        let openSearchUser = {
            cid: user["cid"],
            gid: user["gid"],
            uid: user["uid"],
            email: user["d_mail"],
            password: util.decrypt("", user["d_pwd"])
        }
        //console.log(nameFile + ' | postAssettOpenness | extraInfo', JSON.stringify(extraInfo));
        var queryFind = {'servicetype': typeaction};
        OpnSearchConfig.find(queryFind).then((els) => {
            //console.log('postAssettOpenness els', els);
            if (els.length > 0) {
                try {
                    let notify = true;
                    if (rule.sendnotification === false)
                        notify = rule.sendnotification;
                    var el = els[0];
                    var companyId = (extraInfo != undefined) ? extraInfo.companyId : openSearchUser.gid;
                    var userId = (extraInfo != undefined) ? extraInfo.userId : openSearchUser.uid;
                    // var groupId = (obj._source.properties.owner.uid == "admin@dymer.it") ? opnConfUtil.user.d_gid : obj._source.properties.owner.gid;
                    // var emailAddress = (obj._source.properties.owner.uid == "admin@dymer.it") ? opnConfUtil.user.d_mail : obj._source.properties.owner.uid;
                    var groupId = (obj._source.properties.owner.uid == "admin@dymer.it") ? openSearchUser.gid : extraInfo.groupId;
                    var emailAddress = (obj._source.properties.owner.uid == "admin@dymer.it") ? openSearchUser.email : extraInfo.emailAddress;
                    if (el.servicetype == 'insert' || el.servicetype == 'update') {
                        var assetTitle = obj._source[rule.mapping.title];
                        var assetextContent = "";
                        (rule.mapping.extContent).forEach(element => {
                            assetextContent += obj._source[element] + "+";
                        });
                        assetextContent = assetextContent.substring(0, assetextContent.length - 1);
                        if (obj._source.properties.owner.gid == undefined || obj._source.properties.owner.gid == "")
                            obj._source.properties.owner.gid = openSearchUser.gid;
                        if (obj._source.properties.owner.uid == undefined || obj._source.properties.owner.uid == "")
                            obj._source.properties.owner.uid = openSearchUser.uid;
                        let url_base_entity = ""; //https://dym.dih4industry.eu
                        // url_base_entity = obj._source.properties.ipsource;
                        url_base_entity = (el.configuration.dymerpath == undefined) ? "" : el.configuration.dymerpath;
                        if (url_base_entity.endsWith("/")) {
                            url_base_entity = url_base_entity.slice(0, -1);
                        }
                        var objToAssett = {
                            //"elasticSearchResourceId": -1,
                            "dymerDomainName": "",
                            "emailAddress": emailAddress,
                            "companyId": Number(companyId),
                            "groupId": Number(groupId), //20121
                            "userId": Number(userId),
                            "index": obj._index,
                            "type": obj._type,
                            "id": obj._id,
                            "url": url_base_entity, //url del dymer
                            "title": assetTitle,
                            "extContent": assetextContent,
                            "notify": notify
                        };
                        logger.info(nameFile + ' | postAssettOpenness | insert/update Json openness: ' + JSON.stringify(objToAssett));
                        // console.log(nameFile + ' | postAssettOpenness | insert/update Json openness', JSON.stringify(objToAssett));
                        callOpennessJsw(el, objToAssett);
                    }
                    if (el.servicetype == 'delete') {
                        var objToAssett = {
                            "emailAddress": emailAddress,
                            "companyId": Number(companyId),
                            "index": obj._index,
                            "type": obj._type,
                            "id": obj._id,
                            "notify": notify
                        };
                        logger.info(nameFile + ' | postAssettOpenness | delete Json openness: ' + JSON.stringify(objToAssett));
                        // console.log(nameFile + ' | postAssettOpenness | delete Json openness', JSON.stringify(objToAssett));
                        callOpennessJsw(el, objToAssett);
                    }
                } catch (error) {
                    logger.error(nameFile + ' | postAssettOpenness | find obj,extraInfo: ' + JSON.stringify(obj) + ',' + JSON.stringify(extraInfo) + ',' + error);
                }
            }
        }).catch((err) => {
            logger.error(nameFile + ' | postAssettOpenness | find obj,extraInfo: ' + JSON.stringify(obj) + ',' + JSON.stringify(extraInfo) + ',' + err);
            console.error("ERROR | " + nameFile + " | postAssettOpenness | find : ", err);
        })
    }).catch((error) => {
        console.error("ERROR | " + nameFile + " | dym.dymerentry/OpenSearch User ", error);
        logger.error(nameFile + " | dym.dymerentry/OpenSearch User " + error);
        ret.setMessages("Get OpenSearch User Error");
        ret.setSuccess(false);
        ret.setExtraData({"log": error.stack});
        return res.send(ret);
    })
}

function callOpennessJsw(conf, postObj) {
    OpnUserModel.find().then(el => {
        let user = el[0]
        let openSearchUser = {
            cid: user["cid"],
            gid: user["gid"],
            uid: user["uid"],
            email: user["d_mail"],
            password: util.decrypt("", user["d_pwd"])
        }

        var callurl = conf.configuration.host;
        if (conf.configuration.port != undefined)
            if (conf.configuration.port != '')
                callurl += ":" + conf.configuration.port;
        callurl += "/api/jsonws/invoke";
        // console.log('chiamata callur X', callurl);
        logger.info(nameFile + ' | callOpennessJsw  | chiamata callur X :' + callurl);
        if (conf.configuration.method == "POST") {
            var objPOST = {};
            objPOST[conf.configuration.path] = postObj;
            postObj = objPOST;
            // console.log('with postObj ', postObj);
            logger.info(nameFile + ' | callOpennessJsw  | with postObj :' + JSON.stringify(postObj));
            //   postObj = JSON.stringify(objPOST);
            //    var configqq = { headers: { Cookie: 'JSESSIONID=C9B87F42FCF0BA612F4B59E411E908C5;' } };
            var creden =  openSearchUser.email + ":" + openSearchUser.password;
            logger.info(nameFile + ' | callOpennessJsw  | creden->:' + openSearchUser.email);
            const buff = Buffer.from(creden, 'utf-8');
            //let buff = new Buffer(creden);
            let authorizationBasic = buff.toString('base64');
            //   let authorizationBasic = Buffer.from(creden, 'base64');
            var configqq = {
                "headers": {
                    "Authorization": "Basic " + authorizationBasic
                }
            };
            // console.log('Authorization header-> ', configqq);
            axios.post(callurl, postObj, configqq)
                .then(function (response) {
                    logger.info(nameFile + ' | callOpennessJsw | POST | callurl, postObj, configqq' + callurl + " , " + JSON.stringify(postObj) + " , " + JSON.stringify(configqq));
                    logger.info(nameFile + ' | callOpennessJsw | POST | response ' + callurl + " , " + response);
                })
                .catch(function (error) {
                    console.log(nameFile + ' | callOpennessJsw | POST', error);
                    logger.error(nameFile + ' | callOpennessJsw | POST : ' + error);
                });
        } else {
            logger.info(nameFile + ' | callOpennessJsw | GET | callurl, postObj, configqq' + callurl + " , " + JSON.stringify(postObj));
            axios.get(callurl, {params: postObj}).catch(function (error) {
                console.log(nameFile + ' | callOpennessJsw | GET', error);
                logger.error(nameFile + ' | callOpennessJsw | GET : ' + error);
            });
        }
    }).catch((e) => {
        console.error("ERROR | " + nameFile + " | dym.dymerentry/OpenSearch User ", e);
        logger.error(nameFile + " | dym.dymerentry/OpenSearch User " + e);
        ret.setMessages("Get OpenSearch User Error");
        ret.setSuccess(false);
        ret.setExtraData({"log": e.stack});
        return res.send(ret);
    })
}

module.exports = router;