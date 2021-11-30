var util = require('../utility');
var jsonResponse = require('../jsonResponse');
const multer = require('multer');
var fs = require('fs');
var mv = require('mv');
//var FormData = require('form-data');
var http = require('http');
//require("../models/opnSearch/OpnSearchRule");
//require("../models/opnSearch/OpnSearchConfig");
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
//const OpnSearchRule = mongoose.model("OpnSearchRule");
//const OpnSearchConfig = mongoose.model("OpnSearchConfig");
const axios = require('axios');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: false,
    limit: '100MB'
}));
//   /api/v1/opn/
/*
const mongoURI = util.mongoUrlBase() + "vocabtest";
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
/*var storageEngine = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, './uploads');
    },
    filename: function(req, file, fn) {
        fn(null, new Date().getTime().toString() + '-__-' + file.originalname);
    }
});
var upload = multer({ storage: storageEngine }).any(); // .single('file');
*/


router.get('/', (req, res) => {
    var collection = mongoose.collection('vocab');
    collection.find({}).then((els) => {
        ret.setMessages("List");
        ret.setData(els);
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            ret.setMessages("Get error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })


});


module.exports = router;