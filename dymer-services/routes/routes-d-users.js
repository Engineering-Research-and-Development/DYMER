var jsonResponse = require('../jsonResponse');
var util = require('../utility');
//var FormData = require('form-data');
var http = require('http');
var url = require("url");
var express = require('express');
const bodyParser = require("body-parser");
const path = require('path');
const nameFile = path.basename(__filename);
const mongoose = require("mongoose");
require('./mongodb.js');
var router = express.Router();
var jsonParser = bodyParser.json(); 
 require("../models/permission/DymerUser");
const DymerUser = mongoose.model("DymerUser");
const axios = require('axios'); 
const logger = require('./dymerlogger')
var crypto = require('crypto');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: false,
    limit: '100MB'
}));
/*
const mongoURI = util.mongoUrlForm();
console.log(nameFile + ' | mongoURI :', JSON.stringify(mongoURI));
var db;
mongoose
    .connect(mongoURI, {
        // useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(x => {
        console.log(nameFile + ` | Connected to Mongo! Database name: "${x.connections[0].name}"`);
        db = x.connections[0].db;
    })
    .catch(err => {
        console.error("ERROR | " + nameFile + ` | Error connecting to mongo! Database name: "${x.connections[0].name}"`, err);
    });
*///, util.checkIsPortalUser
router.get('/', (req, res) => {

    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let data = callData.data;
    var queryFind = {};
    let regex = /(?<!^).(?!$)/g;
    DymerUser.find(queryFind).then((els) => {
        ret.setMessages("List");
      /*  els.forEach(element => {
            element.password=(  element.password).replace(regex, '*');
        });*/
        ret.setData(els);
       // console.log(ret);
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error(err);
            logger.error(nameFile + ' | get/ | : ' + err);
            ret.setMessages("Get error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

router.post('/checklogin' , function(req, res) {

    let id = req.params.id;
    let callData = util.getAllQuery(req);
    let data = callData.data;
    var ret = new jsonResponse();
    var email = req.body.email;
    var password = req.body.password;
    const secretKey = "";
    let hash = crypto.createHash('sha1')
// Generate an initialization vector 
  //  let iv = hash.update(secretKey).digest().subarray(0, 16) 
    let digest = hash.update(secretKey).digest().subarray(0, 16)
// create cipher object
const cipher = crypto.createCipheriv("aes-128-ecb", digest, null);
// encrypt the data
let encryptedText = cipher.update(password, "utf-8", "hex");
// finalize the encryption
encryptedText += cipher.final("hex");
password=encryptedText
    var queryFind ={ "email": email,"password":password,"active": true };
   // console.log('data',data);
   // console.log('queryFind',queryFind);
    DymerUser.find(queryFind).then((els) => {
        ret.setMessages("List");
    //console.log('checklogin',els);
        ret.setData(els);
      //  console.log(ret);
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error(err);
            logger.error(nameFile + ' | get/ | : ' + err);
            ret.setMessages("Get error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })

 /*   var mod = new DymerUser(req.body);
    //console.log(nameFile + ' | post | create : ', JSON.stringify(req.body));
    logger.info(nameFile + ' | post | create : ' + JSON.stringify(req.body));
    var mykey = crypto.createCipher('aes-128-cbc',mod.password);
var mystr = mykey.update('abc', 'utf8', 'hex')
mystr += mykey.final('hex');
mod.password=mystr;
    mod.save().then((el) => {
        ret.setMessages("Element created successfully");
        ret.addData(el);
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error(err);
            logger.error(nameFile + ' | post | create : ' + err);
            ret.setMessages("Create error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })*/
});
 
router.post('/', util.checkIsAdmin, function(req, res) {

    let id = req.params.id;
    let callData = util.getAllQuery(req);
    let data = callData.data;
    var ret = new jsonResponse();
    let newUser=req.body; 
    console.log( ' newUser : ', JSON.stringify(newUser));
    //console.log(nameFile + ' | post | create : ', JSON.stringify(req.body));
    logger.info(nameFile + ' | post | create : ' + JSON.stringify(req.body));
    const secretKey = "";
    let hash = crypto.createHash('sha1')
// Generate an initialization vector 
  //  let iv = hash.update(secretKey).digest().subarray(0, 16) 
    let digest = hash.update(secretKey).digest().subarray(0, 16)
// create cipher object
const cipher = crypto.createCipheriv("aes-128-ecb", digest, null);
// encrypt the data
let encryptedText = cipher.update(newUser.password, "utf-8", "hex");
// finalize the encryption
encryptedText += cipher.final("hex");
newUser.password=encryptedText
   /* let token = newUser.password.replace(/\s/g, "+")
    let hash = crypto.createHash('sha1')
    let originalKey = "";
    let digest = hash.update(originalKey).digest().subarray(0, 16)
    let cc = crypto.createDecipheriv('aes-128-ecb', digest, null);

    newUser.password =  Buffer.concat([cc.update(token, 'base64'), cc.final()]).toString() */

    
    var mod = new DymerUser(newUser);
 /*   var mykey = crypto.createCipher('aes-128-cbc',mod.password);
var mystr = mykey.update('abc', 'utf8', 'hex')
mystr += mykey.final('hex');
mod.password=mystr;*/
    mod.save().then((el) => {
        ret.setMessages("Element created successfully");
        ret.addData(el);
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error(err);
            logger.error(nameFile + ' | post | create : ' + err);
            ret.setMessages("Create error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});
 
router.delete('/:id', util.checkIsAdmin, (req, res) => {

    var ret = new jsonResponse();
    var id = req.params.id;
    var myfilter = { "_id": id };
    //console.log(nameFile + ' | delete/:id | id : ', id);
    logger.info(nameFile + ' | delete/:id | id : ' + id);
    DymerUser.findOneAndDelete(myfilter).then((el) => {
        ret.setMessages("Element deleted");
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error(err);
            logger.error(nameFile + ' | delete/:id : ' + err);
            ret.setMessages("Delete Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

module.exports = router;