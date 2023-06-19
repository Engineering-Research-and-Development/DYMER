var util = require('../utility');
var jsonResponse = require('../jsonResponse');
const multer = require('multer');
var fs = require('fs');
var mv = require('mv');
//var FormData = require('form-data');
var http = require('http');
require("../models/opnSearch/OpnSearchRule");
require("../models/opnSearch/OpnSearchConfig");
var express = require('express');
//const multer = require('multer');
const bodyParser = require("body-parser");
const path = require('path');
const nameFile = path.basename(__filename);
const mongoose = require("mongoose");
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
    destination: function(req, file, callback) {
        callback(null, './uploads');
    },
    filename: function(req, file, fn) {
        fn(null, new Date().getTime().toString() + '-__-' + file.originalname);
    }
});
var upload = multer({ storage: storageEngine }).any(); // .single('file');
router.post('/setConfig', util.checkIsAdmin, function(req, res) {
    let callData = util.getAllQuery(req);
    let data = callData.data;
    var copiaData = Object.assign({}, data);
    var ret = new jsonResponse();
    var obj = data;
    var id = obj.id;
    delete obj.id;
    var mod = new OpnSearchConfig(obj);
    if (id != '' && id != undefined) {
        var myfilter = { "_id": mongoose.Types.ObjectId(id) };
        OpnSearchConfig.updateOne(myfilter, obj,
            function(err, raw) {
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
                ret.setExtraData({ "log": err.stack });
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
                ret.setExtraData({ "log": err.stack });
                return res.send(ret);
            }
        })
        //res.send("this is  dd our main andpoint");
});
router.post('/addrule', util.checkIsAdmin, function(req, res) {
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
            ret.setExtraData({ "log": err.stack });
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
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
}
router.delete('/rule/:id', util.checkIsAdmin, (req, res) => {
    var ret = new jsonResponse();
    var id = req.params.id;
    var myfilter = { "_id": id };
    OpnSearchRule.findOneAndDelete(myfilter).then((el) => {
        ret.setMessages("Element deleted");
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | delete/rule/:id :", id, err);
            logger.error(nameFile + ' | delete/rule/:id : ' + id + " " + err);
            ret.setMessages("Delete Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

router.post('/listener', function(req, res) {
    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let data = callData.data;
    let extraInfo = callData.extraInfo;
    //res.send(ret);
    var eventSource = (data.eventSource).split('_');;
    var queryFind = {
        "_index": data.obj._index,
        "_type": data.obj._type
    };
    OpnSearchRule.find(queryFind).then((els) => {
        ret.setMessages("List");
        ret.setData(els);
        let singleRule= els[0]
        postAssettOpenness(eventSource[1], data.obj, singleRule, extraInfo);
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | post/listener :", err);
            logger.error(nameFile + ' | post/listener :' + err);
            ret.setMessages("Get error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    });
});

function postAssettOpenness(typeaction, obj, rule, extraInfo) {
    //console.log(nameFile + ' | postAssettOpenness | extraInfo', JSON.stringify(extraInfo));
    var opnConfUtil = util.getServiceConfig("opnsearch");
    var queryFind = { 'servicetype': typeaction };
    OpnSearchConfig.find(queryFind).then((els) => {
        //console.log('postAssettOpenness els', els);
        if (els.length > 0) {
            try {
                let notify=true;
                if(rule.sendnotification===false)
                notify= rule.sendnotification ;
                var el = els[0];
                var companyId = (extraInfo != undefined) ? extraInfo.companyId : opnConfUtil.user.d_gid;
                var userId = (extraInfo != undefined) ? extraInfo.userId : opnConfUtil.user.d_uid;
                // var groupId = (obj._source.properties.owner.uid == "admin@dymer.it") ? opnConfUtil.user.d_gid : obj._source.properties.owner.gid;
                // var emailAddress = (obj._source.properties.owner.uid == "admin@dymer.it") ? opnConfUtil.user.d_mail : obj._source.properties.owner.uid;
                var groupId = (obj._source.properties.owner.uid == "admin@dymer.it") ? opnConfUtil.user.d_gid : extraInfo.groupId;
                var emailAddress = (obj._source.properties.owner.uid == "admin@dymer.it") ? opnConfUtil.user.d_mail : extraInfo.emailAddress;
                if (el.servicetype == 'insert' || el.servicetype == 'update') {
                    var assetTitle = obj._source[rule.mapping.title];
                    var assetextContent = "";
                    (rule.mapping.extContent).forEach(element => {
                        assetextContent += obj._source[element] + "+";
                    });
                    assetextContent = assetextContent.substring(0, assetextContent.length - 1);
                    if (obj._source.properties.owner.gid == undefined || obj._source.properties.owner.gid == "")
                        obj._source.properties.owner.gid = opnConfUtil.user.d_gid;
                    if (obj._source.properties.owner.uid == undefined || obj._source.properties.owner.uid == "")
                        obj._source.properties.owner.uid = opnConfUtil.user.d_uid;
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
                        "notify":notify
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
                        "notify":notify
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
}

function callOpennessJsw(conf, postObj) {
    var opnConfUtil = util.getServiceConfig("opnsearch");
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
        var creden = opnConfUtil.user.d_mail + ":" + opnConfUtil.user.d_pwd;
        // console.log('creden->', opnConfUtil.user.d_mail);
        logger.info(nameFile + ' | callOpennessJsw  | creden->:' + opnConfUtil.user.d_mail);
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
            .then(function(response) {
                logger.info(nameFile + ' | callOpennessJsw | POST | callurl, postObj, configqq' + callurl + " , " + JSON.stringify(postObj) + " , " + JSON.stringify(configqq));
                logger.info(nameFile + ' | callOpennessJsw | POST | response ' + callurl + " , " + response);
            })
            .catch(function(error) {
                console.log(nameFile + ' | callOpennessJsw | POST', error);
                logger.error(nameFile + ' | callOpennessJsw | POST : ' + error);
            });
    } else {
        logger.info(nameFile + ' | callOpennessJsw | GET | callurl, postObj, configqq' + callurl + " , " + JSON.stringify(postObj));;
        axios.get(callurl, { params: postObj }).catch(function(error) {
            console.log(nameFile + ' | callOpennessJsw | GET', error);
            logger.error(nameFile + ' | callOpennessJsw | GET : ' + error);
        });
    }
}
module.exports = router;