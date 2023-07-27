var util = require('../utility');
var jsonResponse = require('../jsonResponse');
require("../models/ServiceEntityHooks");
var express = require('express');
//const multer = require('multer');
const bodyParser = require("body-parser");
const path = require('path');
const nameFile = path.basename(__filename);
const logger = require('./dymerlogger');
const mongoose = require("mongoose");
require('./mongodb.js');
var router = express.Router();
var jsonParser = bodyParser.json();
//var GridFsStorage = require("multer-gridfs-storage");
const HookModel = mongoose.model("ServiceEntityHooks");
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
    });
*/

router.post('/addhook', util.checkIsAdmin, function(req, res) {
    // #swagger.tags = ['Services']

    let callData = util.getAllQuery(req);
    let data = callData.data;
    var ret = new jsonResponse();
    var newObj = {
        _index: data.op_index,
        _type: data.op_type,
        microserviceType: data.op_microserviceType,
        eventType: data.op_eventType,
        service: data.op_service
    }
    var mod = new HookModel(data);
    mod.save().then((el) => {
        ret.setMessages("Hook set successfully");
        ret.addData(el);
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | post/addhook | save :", err);
            logger.error(nameFile + ' | post/addhook | save : ' + err);
            ret.setMessages("Post error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

router.get('/hooks/', (req, res) => {
    // #swagger.tags = ['Services']

    let callData = util.getAllQuery(req);
    let queryFind = callData.query;
    return findHook(queryFind, res);
});

function findHook(queryFind, res) {
    var ret = new jsonResponse();
    HookModel.find(queryFind).then((els) => {
        ret.setMessages("List");
        ret.setData(els);
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | findHook :", err);
            logger.error(nameFile + ' | findHook : ' + err);
            ret.setMessages("Get error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
}

router.delete('/hook/:id', util.checkIsAdmin, (req, res) => {
    // #swagger.tags = ['Services']

    var ret = new jsonResponse();
    var id = req.params.id;
    var myfilter = { "_id": id };
    HookModel.findOneAndDelete(myfilter).then((el) => {
        ret.setMessages("Element deleted");
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | delete/hook/:id | id :", id, err);
            logger.error(nameFile + " | delete/hook/:id | id :" + id + " , " + err);
            ret.setMessages("Delete Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

router.post('/checkhook', function(req, res) {
    // #swagger.tags = ['Services']

    let callData = util.getAllQuery(req);
    let data = callData.data;
    let extraInfo = callData.extraInfo;
    let origindata = callData.origindata;
    let originheader = callData.originheader;
    var queryFind = {};
    var eventSource = data.eventSource;
    var queryFind = {
        "_index": data.obj._index,
        "_type": data.obj._type,
        "eventType": eventSource
    };
    var wbsUrl = util.getServiceUrl('webserver');
    let contp = util.getContextPath('webserver');
    if (contp != "")
        wbsUrl += contp;
    //wbsUrl = util.getServiceUrl('dservice');
    //console.log("chekkkk", JSON.stringify(queryFind));
    logger.info(nameFile + ' | post/checkhook :' + JSON.stringify(queryFind));
    const headers = {
        'reqfrom': req.headers["reqfrom"]
    }
    HookModel.find(queryFind).then((els) => {
        els.forEach(el => {
            // console.log("chekkkk el", JSON.stringify(el));
            logger.info(nameFile + ' | post/checkhook | HookModel: chek el' + JSON.stringify(el));
            var pt = wbsUrl + el.service.servicePath;
            // pt = el.service.servicePath;
            axios.post(pt, { 'data': data, "extraInfo": extraInfo,"origindata":origindata, "originheader":  originheader }, {
                    headers: headers
                }).then(response => {
                    // console.log("checkhook resp axios ", response);
                    // console.log(nameFile + " | post/checkhook | inoltro | response :", response);
                    logger.info(nameFile + '| post/checkhook | inoltro | response ' + response);
                })
                .catch(error => {
                    console.log("ERROR | " + nameFile + " | post/checkhook | pt,data, extraInfo :", pt, data, extraInfo, error);
                    logger.error(nameFile + ' | post/checkhook | pt,data, extraInfo : ' + pt + " , " + JSON.stringify(data) + " , " + JSON.stringify(extraInfo) + " , " + error);
                });
        });
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | find | queryFind :", JSON.stringify(queryFind), err);
            logger.error(nameFile + '  | find | queryFind : ' + JSON.stringify(queryFind) + " , " + error);
        }
    })
});

module.exports = router;