var util = require('../utility');
var jsonResponse = require('../jsonResponse');
require("../models/ServiceEntityHooks");
var express = require('express');
//const multer = require('multer');
const bodyParser = require("body-parser");
const path = require('path');
const nameFile = path.basename(__filename);
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
    });*/
router.post('/addhook', util.checkIsAdmin, function(req, res) {
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
            ret.setMessages("Post error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});
router.get('/hooks/', (req, res) => {
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
            ret.setMessages("Get error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
}
router.delete('/hook/:id', util.checkIsAdmin, (req, res) => {
    var ret = new jsonResponse();
    var id = req.params.id;
    var myfilter = { "_id": id };
    HookModel.findOneAndDelete(myfilter).then((el) => {
        ret.setMessages("Element deleted");
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | delete/hook/:id | id :", id, err);
            ret.setMessages("Delete Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

router.post('/checkhook', function(req, res) {
    let callData = util.getAllQuery(req);
    let data = callData.data;
    let extraInfo = callData.extraInfo;
    var queryFind = {};
    var eventSource = data.eventSource;
    var queryFind = {
        "_index": data.obj._index,
        "_type": data.obj._type,
        "eventType": eventSource
    };
    var wbsUrl = util.getServiceUrl('webserver');
    HookModel.find(queryFind).then((els) => {
        els.forEach(el => {
            var pt = wbsUrl + el.service.servicePath;
            axios.post(pt, { 'data': data, "extraInfo": extraInfo }).then(response => {
                    // console.log("checkhook resp axios ", response);
                    console.log(nameFile + " | post/checkhook | inoltro | response :", response);
                })
                .catch(error => {
                    console.error("ERROR | " + nameFile + " | post/checkhook | pt,data, extraInfo :", pt, data, extraInfo, error);
                });
        });
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | find | queryFind :", JSON.stringify(queryFind), err);
        }
    })
});
module.exports = router;