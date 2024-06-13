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
const { after, values } = require('lodash');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: false,
    limit: '100MB'
}));
var upload = multer()
router.use(upload.array())

router.get('/', async(req, res) => {
    var ret = new jsonResponse();
    let els = await mongoose.connection.db.collection("vocab").find().toArray()
    ret.setMessages("List");
    ret.setData(els);
    return res.json(ret)
});
router.get('/:id', async(req, res) => {
    let newid = req.params.id;
    var ret = new jsonResponse();
    let objiD = mongoose.Types.ObjectId(newid)
    let els = await mongoose.connection.db.collection("vocab").findOne({ "_id": objiD });
    ret.setMessages("List");
    ret.setData(els);
    return res.json(ret)
});

router.get('/title/:title', async(req, res) => {
    let title = req.params.title;
    var ret = new jsonResponse();
    let els = await mongoose.connection.db.collection("vocab").findOne({ "title": title });
    ret.setMessages("List");
    ret.setData(els);
    return res.json(ret)
});
/*MG END 13/06 */
router.post('/_search', async(req, res) => {
    let id = req.body.id
    let objiD = mongoose.Types.ObjectId(id)
    var ret = new jsonResponse();
    let els = await mongoose.connection.db.collection("vocab").findOne({ "_id": objiD })
    ret.setMessages("List");
    ret.setData(els);
    return res.json(ret)
});

router.post('/', async(req, res) => {
    let newVocab = req.body;
    newVocab.nodes = [];
    await mongoose.connection.db.collection("vocab").insertOne(newVocab)
    var ret = new jsonResponse();
    ret.setMessages("Create");
    ret.setData(newVocab);
    return res.json(ret)
});

router.put("/", async(req, res) => {
    let id = req.body.id
    let objiD = mongoose.Types.ObjectId(id)
    let data = req.body.data
    var ret = new jsonResponse();
    let updateVocab = await mongoose.connection.db.collection("vocab").findOneAndUpdate({ "_id": objiD }, { $set: { "nodes": data } })
    ret.setMessages("Update");
    ret.setData(updateVocab);
    return res.json(updateVocab)
})

router.delete("/:id", async(req, res) => {
    let id = req.params.id
    let objiD = mongoose.Types.ObjectId(id)
    var ret = new jsonResponse();
    await mongoose.connection.db.collection("vocab").deleteOne({ "_id": objiD })
    ret.setMessages("Delete");
    ret.setData();
    return res.json(ret)
})

module.exports = router;
