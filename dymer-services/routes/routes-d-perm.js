var util = require('../utility');
var jsonResponse = require('../jsonResponse');
const multer = require('multer');
var fs = require('fs');
var mv = require('mv');
//var FormData = require('form-data');
var http = require('http');
var express = require('express');
const bodyParser = require("body-parser");
const path = require('path');
const nameFile = path.basename(__filename);
const logger = require('./dymerlogger');
const mongoose = require("mongoose");
require('./mongodb.js');
var router = express.Router();
var jsonParser = bodyParser.json();
//var GridFsStorage = require("multer-gridfs-storage");
require("../models/permission/DymerPermissionRule");
const DymRule = mongoose.model("DymerPermissionRule");
const axios = require('axios');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: false,
    limit: '100MB'
}));
//   /api/v1/opn/
/*const mongoURI = util.mongoUrlForm();
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
//esempio/api/dservice/api/v1/perm/entityrole/create/topic?role[]=app-user&role[]=aa1
// data un action, indice e lista ruoli, ritorna tru o flase se esiste il permesso
/*
{
    "success": true,
    "message": "Permission denied",
    "data": {
        "result": false
    },
    "extraData": {}
}
{
    "success": true,
    "message": "Permission approved",
    "data": {
        "result": true
    },
    "extraData": {}
}
*/

router.get('/mongostate', [util.checkIsDymerUser], (req, res) => {

    let ret = new jsonResponse();
    let dbState = [{
            value: 0,
            label: "Disconnected",
            css: "text-danger"
        },
        {
            value: 1,
            label: "Connected",
            css: "text-success"
        },
        {
            value: 2,
            label: "Connecting",
            css: "text-info"
        },
        {
            value: 3,
            label: "Disconnecting",
            css: "text-warning"
        }
    ];
    let mongostate = mongoose.connection.readyState;
    ret.setMessages("Mongodb state");
    ret.setData(dbState.find(f => f.value == mongostate));
    res.status(200);
    ret.setSuccess(true);
    return res.send(ret);
});

router.get('/entityrole/:act/:index', (req, res) => {

    let act = req.params.act; //azione da passare
    let index = req.params.index; //indice per cercare
    //console.log(req.query.role); //lista dei miei ruoli
    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let data = callData.data;
    var retData = { result: false };
    var message = "Permission denied";
    var queryFind = { role: { $in: req.query.role } };

    DymRule.find(queryFind).then((els) => {
        //logger.info(nameFile + ' | get/entityrole/:act/:index | DymRule : ' + JSON.stringify(els));
        if (els.length > 0) {
            els.forEach(el => {
                if ((el.perms.entities[act]) != undefined) {
                    if ((el.perms.entities[act]).includes(index)) {
                        retData.result = true;
                        message = "Permission approved";
                    }
                }
            });
        }
        //logger.info(nameFile + ' | get/entityrole/:act/:index | queryFind : ' + act + " , " + index + " , " + JSON.stringify(queryFind) + "," + retData.result);
        ret.setMessages(message);
        ret.setData(retData);
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | get/entityrole/:act/:index|find  ", JSON.stringify(queryFind), err);
            logger.error(nameFile + ' | get/entityrole/:act/:index|find   : ' + JSON.stringify(queryFind) + " " + err);
            ret.setMessages("Get error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

router.get('/permbyroles', (req, res) => {

    //role[]
    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let data = callData.data;
    var retData = { result: false };
    var message = "LIst permission";
    var queryFind = { role: { $in: req.query.role } };
    var grpPermEnt = [];
    //console.log(nameFile + ' | get/permbyroles | queryFind : ', JSON.stringify(queryFind));
    DymRule.find(queryFind).then((els) => {
        if (els.length > 0) {
            grpPermEnt = els[0].perms.entities;
            els.forEach(el => {
                for (const [key, value] of Object.entries(grpPermEnt)) {
                    //console.log('property', key, el, el.perms.entities[key], value);
                    grpPermEnt[key] = [...new Set([...el.perms.entities[key], ...value])];
                    //  grpPermEnt[key]
                }
            });
            ret.setMessages(message);
            ret.setData(grpPermEnt);
            return res.send(ret);
        } else {
            ret.setMessages(message);
           // ret.setData(grpPermEnt);
           ret.setData({});
           return res.send(ret);
        }
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | get/permbyroles  ", err);
            logger.error(nameFile + ' | get/permbyroles ' + err);
            ret.setMessages("Get error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

router.get('/', (req, res) => {

    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let data = callData.data;
    var queryFind = {};
    DymRule.find(queryFind).then((els) => {
        ret.setMessages("List");
        ret.setData(els);
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | get  ", err);
            logger.error(nameFile + ' | get : ' + err);
            ret.setMessages("Get error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

router.post('/:id?', util.checkIsAdmin, async function(req, res) {

    let id = req.params.id;
    let callData = util.getAllQuery(req);
    let data = callData.data;
    var copiaData = Object.assign({}, data);
    var ret = new jsonResponse();
    let exRole = await DymRule.findOne({ "role": callData.data.role })
    if (exRole) {
        let oldPerms = exRole.perms.entities;
        let newPerms = callData.data.perms.entities
        if (JSON.stringify(oldPerms) !== JSON.stringify(newPerms)) { //se non hai cambiato nulla, non fare la query
            const EntitiesURL = util.getServiceUrl("entity") + "/api/v1/entity/redisroleupdate";
            try {
                await axios.post(EntitiesURL, { updated: callData.data.role });
            } catch (err) {
                console.error("ERROR | " + nameFile + " | post | updateOne ", err);
                logger.error(nameFile + ' | post | updateOne  : ' + err);
                ret.setSuccess(false);
                ret.setMessages("Model Error");
                return res.send(ret);
            }
        }
    }
    if (id != undefined) {
        var myfilter = { "_id": mongoose.Types.ObjectId(id) };
        logger.info(nameFile + ' | post | updateOne : ' + JSON.stringify(myfilter));
        DymRule.updateOne(myfilter, data,
            function(err, raw) {
                if (err) {
                    console.error("ERROR | " + nameFile + " | post | updateOne ", err);
                    logger.error(nameFile + ' | post | updateOne  : ' + err);
                    ret.setSuccess(false);
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
        logger.info(nameFile + ' | post | create : ' + JSON.stringify(data));
        mod.save().then((el) => {
            ret.setMessages("Config created successfully");
            ret.addData(el);
            return res.send(ret);
        }).catch((err) => {
            if (err) {
                console.error("ERROR | " + nameFile + " | post | create ", err);
                logger.error(nameFile + ' | post | create  : ' + err);
                ret.setMessages("Post error");
                ret.setSuccess(false);
                ret.setExtraData({ "log": err.stack });
                return res.send(ret);
            }
        })
    }
});

router.delete('/:id', util.checkIsAdmin, (req, res) => {

    var ret = new jsonResponse();
    var id = req.params.id;
    var myfilter = { "_id": id };
    DymRule.findOneAndDelete(myfilter).then((el) => {
        ret.setMessages("Element deleted");
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | delete ", id, err);
            logger.error(nameFile + ' | delete : ' + id + " " + err);
            ret.setMessages("Delete Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

module.exports = router;
