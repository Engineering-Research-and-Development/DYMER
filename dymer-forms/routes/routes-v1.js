var util = require('../utility');
var jsonResponse = require('../jsonResponse');
var fs = require('fs');
var mv = require('mv');
require("../models/Form");
var express = require('express');
const multer = require('multer');
const bodyParser = require("body-parser");
const path = require('path');
const mongoose = require("mongoose");
var router = express.Router();
//var GridFsStorage = require("multer-gridfs-storage");
const { GridFsStorage } = require('multer-gridfs-storage');
const nameFile = path.basename(__filename);
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

const Model = mongoose.model("Form");

//const mongoURI = util.mongoUrlForm();
var db;
var gridFSBucket;
var storage;
var upload;
const mongoURI = util.mongoUrlForm();

console.log(nameFile + ' | mongoURI :', JSON.stringify(mongoURI));
mongoose
    .connect(mongoURI, {
        // useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(x => {
        console.log(nameFile + ` | Connected to Mongo! Database name: "${x.connections[0].name}"`);
        db = x.connections[0].db;
        //console.log(x.connections[0].db);
        gridFSBucket = new mongoose.mongo.GridFSBucket(x.connections[0].db, {
            bucketName: "fs"
        });
        storage = new GridFsStorage({
            url: mongoURI,
            file: (req, file) => {
                return new Promise((resolve, reject) => {
                    const fileInfo = {
                        filename: file.originalname,
                        bucketName: "fs"
                    };
                    resolve(fileInfo);
                });
            }
        });
        upload = multer({ storage: storage }).any();
    })
    .catch(err => {
        console.error("ERROR | " + nameFile + ` | Error connecting to mongo! Database name: "${mongoURI}"`, err);
    });

/*
 *************************************************************************************************************
 *************************************************************************************************************
 *************************************************************************************************************
 *************************************************************************************************************
 *************************************************************************************************************
 *************************************************************************************************************
 *************************************************************************************************************
 */

var getfilesArrays = function(er) {
    return new Promise(function(resolve, reject) {
        var attachments = [];
        var actions = (er.files).map(recFile);
        var results = Promise.all(actions);
        results.then(function(dt) {
            var ret_json = {
                "_id": er._id,
                "title": er.title,
                "author": er.author,
                "description": er.description,
                "posturl": er.posturl,
                "instance": er.instance,
                "files": dt,
                "created": er.created
            }
            resolve(ret_json);
        });
    });
}

var recFile = function(file_id) {
    return new Promise(function(resolve, reject) {
        //  gridFSBucket.openDownloadStream(file_id);
        db.collection('fs.files').findOne(file_id._id, function(err, filedata) {
            var chunks = [];
            var bucket = gridFSBucket.openDownloadStream(file_id);
            bucket.on('data', (chunk) => {
                chunks.push(chunk);
            });
            bucket.on('end', () => {
                var fbuf = Buffer.concat(chunks);
                if (!filedata.contentType.includes("image"))
                    fbuf = (fbuf.toString());
                var attachment = {
                    "filename": filedata.filename,
                    "contentType": filedata.contentType,
                    "data": fbuf,
                    "md5": filedata.md5,
                    "length": filedata.length,
                    "uploadDate": filedata.uploadDate,
                    "_id": filedata._id
                };
                resolve(attachment);
            });
            bucket.on('error', () => {
                reject("Error");
            });
        });
    }).catch(function(err) {
        console.error("ERROR | " + nameFile + ' | recFile  : ', err);
    });
}

/*
 *************************************************************************************************************
 *************************************************************************************************************
 *************************************************************************************************************
 *************************************************************************************************************
 *************************************************************************************************************
 *************************************************************************************************************
 *************************************************************************************************************
 */

router.get('/', [util.checkIsDymerUser], (req, res) => {
    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let queryFind = callData.query;
    //console.log(nameFile + ' | get | queryFind:', JSON.stringify(queryFind));
    //let queryFind = (Object.keys(callData.query).length === 0) ? {} : JSON.parse(callData.query);
    //let queryFind = (Object.keys(callData.query).length === 0) ? {} : callData.query;
    Model.find(queryFind).collation({ locale: "en" }).sort({ title: +1 }).then((Models) => {
        var actions = Models.map(getfilesArrays);
        var results = Promise.all(actions); // pass array of promises
        results.then(function(dat) {
            ret.setMessages("List");
            ret.setData(dat);
            return res.send(ret);
        })
    }).catch(function(err) {
        console.error("ERROR | " + nameFile + ' | get | queryFind : ', err);
    });
});

router.get('/content/:entype/:fileid', function(req, res, next) {
    var file_id = req.params.fileid;
    //   console.log("file_id", file_id);
    //console.log(nameFile + ' | get/content/:entype/:fileid |  fileid :', file_id);
    recFile(mongoose.Types.ObjectId(file_id))
        .then(function(result) {
            res.writeHead(200, {
                'Content-Type': result.contentType,
                'Content-Length': result.length,
                'Content-Disposition': 'filename=' + result.filename
            });
            res.end(result.data);
        })
        .catch(function(err) {
            console.error("ERROR | " + nameFile + ' | get/content/:entype/:fileid  : ', err);
        });
});

router.post('/', util.checkIsAdmin, function(req, res) {
    var ret = new jsonResponse();
    upload(req, res, function(err) {
        if (err) {
            console.error("ERROR | " + nameFile + ' | post | upload  : ', err);
            ret.setMessages("Upload Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
        let callData = util.getAllQuery(req);
        let data = callData.data;
        let files_arr = [];
        req.files.forEach(element => {
            files_arr.push(element.id);
        });
        var newObj = {
            title: data.title,
            author: data.author,
            description: data.description,
            posturl: data.posturl,
            instance: data.instance,
            files: files_arr
        }
        var mod = new Model(newObj);
        mod.save().then((el) => {
            console.log(nameFile + ' | post |  saved successfully :', JSON.stringify(newObj));
            ret.setMessages("Model uploaded successfully");
            /*  ret.addData(el);
              return res.send(ret);*/
            let queryFind = { '_id': mongoose.Types.ObjectId(el._id) };
            //let queryFind = (Object.keys(callData.query).length === 0) ? {} : JSON.parse(callData.query);
            //let queryFind = (Object.keys(callData.query).length === 0) ? {} : callData.query;
            Model.find(queryFind).then((Models) => {
                var actions = Models.map(getfilesArrays);
                var results = Promise.all(actions); // pass array of promises
                results.then(function(dat) {
                    ret.setMessages("List");
                    ret.setData(dat);
                    return res.send(ret);
                })
            });
        }).catch((err) => {
            if (err) {
                console.error("ERROR | " + nameFile + ' | post | save  : ', err);
                ret.setMessages("Post error");
                ret.setSuccess(false);
                ret.setExtraData({ "log": err.stack });
                return res.send(ret);
            }
        })
    });
});

router.post('/create', util.checkIsAdmin, function(req, res) {
    var ret = new jsonResponse();
    upload(req, res, function(err) {
        if (err) {
            console.error("ERROR | " + nameFile + ' | post/create | upload  : ', err);
            ret.setMessages("Upload Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
        let callData = util.getAllQuery(req);
        let data = callData.data;
        var mod = new Model(data);
        mod.save().then((el) => {
            console.log(nameFile + ' | post/create  |  saved successfully :', JSON.stringify(data));
            ret.setMessages("Model uploaded successfully");
            ret.addData(el);
            return res.send(ret);
        }).catch((err) => {
            if (err) {
                console.error("ERROR | " + nameFile + ' | post/create | save  : ', err);
                ret.setMessages("Post error");
                ret.setSuccess(false);
                ret.setExtraData({ "log": err.stack });
                return res.send(ret);
            }
        })
    });
});

router.post('/addAsset', util.checkIsAdmin, function(req, res) {
    var ret = new jsonResponse();
    upload(req, res, function(err) {
        if (err) {
            console.error("ERROR | " + nameFile + ' | post/addAsset | upload  : ', err);
            ret.setMessages("Upload Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": error.stack });
            return res.send(ret);
        }
        let callData = util.getAllQuery(req);
        let data = callData.data;
        var element = req.files[0];
        var myfilter = { "_id": data.pageId };
        var updateData = { "files": element.id };
        var myquery = { "$push": updateData };
        Model.updateOne(myfilter, myquery,
            function(err, raw) {
                if (err) {
                    console.error("ERROR | " + nameFile + ' | post/addAsset | updateOne  : ', err);
                    ret.setSuccess(false);
                    console.log('Error log: ' + err)
                    ret.setMessages("Model Error");
                    return res.send(ret);
                } else {
                    console.log(nameFile + ' | post/addAsset  |  updateOne successfully :', JSON.stringify(updateData));
                    ret.addData(updateData);
                    ret.setMessages("Model Updated");
                    return res.send(ret);
                }
            }
        );
    });
});

router.post('/update', util.checkIsAdmin, function(req, res) {
    var ret = new jsonResponse();
    upload(req, res, function(err) {
        if (err) {
            console.error("ERROR | " + nameFile + ' | post/update | upload  : ', err);
            ret.setMessages("Upload Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": error.stack });
            return res.send(ret);
        }
        let callData = util.getAllQuery(req);
        let data = callData.data;
        var myfilter = { "_id": data.pageId };
        var myquery = {
            "$set": {
                'title': data.title,
                'description': data.description
            }
        };
        Model.updateOne(myfilter, myquery,
            function(err, raw) {
                if (err) {
                    ret.setSuccess(false);
                    console.error("ERROR | " + nameFile + ' | post/update | updateOne  : ', err);
                    ret.setMessages("Model Error");
                    return res.send(ret);
                } else {
                    console.log(nameFile + ' | post/update  |  updateOne successfully :', data.title);
                    ret.setMessages("Model Updated");
                    return res.send(ret);
                }
            }
        );
    });
});

router.post('/updateAsset', util.checkIsAdmin, function(req, res) {
    var ret = new jsonResponse();
    upload(req, res, function(err) {
        if (err) {
            console.error("ERROR | " + nameFile + ' | post/updateAsset | upload  : ', err);
            ret.setMessages("Upload Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": error.stack });
            return res.send(ret);
        }
        let callData = util.getAllQuery(req);
        let data = callData.data;
        var element = req.files[0];
        var myfilter = { "_id": mongoose.Types.ObjectId(data.pageId) };
        var bulk = Model.collection.initializeOrderedBulkOp();
        bulk.find(myfilter).updateOne({ "$pull": { "files": mongoose.Types.ObjectId(data.assetId) } });
        bulk.find(myfilter).updateOne({ "$push": { "files": mongoose.Types.ObjectId(element.id) } });
        bulk.execute(function(err, result) {
            if (err) {
                ret.setSuccess(false);
                console.error("ERROR | " + nameFile + ' | post/updateAsset | execute  : ', err);
                ret.setMessages("Model Error");
                return res.send(ret);
            } else {
                //console.log(nameFile + ' | post/updateAsset  |  execute :', data.assetId);
                gridFSBucket.delete(mongoose.Types.ObjectId(data.assetId)).then(() => {
                    ret.setMessages("Model Updated");
                    ret.setExtraData({ newAssetId: element.id });
                    return res.send(ret);
                }).catch(function(err) {
                    ret.setSuccess(false);
                    console.error("ERROR | " + nameFile + ' | post/updateAsset | delete  : ', err);
                    ret.setMessages("Model Error");
                    return res.send(ret);
                });
            }
        });
    });
});

router.delete('/:id', util.checkIsAdmin, (req, res) => {
    var ret = new jsonResponse();
    var id = req.params.id;
    var myfilter = { "_id": id };
    Model.findOneAndDelete(myfilter).then((el) => {
        el["files"].forEach(file => {
            gridFSBucket.delete(mongoose.Types.ObjectId(file._id));
        });
        ret.setMessages("Element deleted");
        console.log(nameFile + ' | delete/:id  | findOneAndDelete successfully :', JSON.stringify(myfilter));
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + ' | delete/:id  : ', err);
            ret.setMessages("Delete Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

router.delete('/:id/:fid', util.checkIsAdmin, (req, res) => {
    var ret = new jsonResponse();
    var id = req.params.id;
    var fid = req.params.fid;
    var myfilter = { "_id": id };
    var myquery = { "$pull": { "files": mongoose.Types.ObjectId(fid) } };
    Model.updateOne(myfilter, myquery,
        function(err, raw) {
            if (err) {
                ret.setSuccess(false);
                console.error("ERROR | " + nameFile + ' | delete/:id/:fid | updateOne : ', err);
                ret.setMessages("Model Error");
                return res.send(ret);
            } else {
                gridFSBucket.delete(mongoose.Types.ObjectId(fid)).then(() => {
                    console.log(nameFile + ' | delete/:id/:fid  | delete successfully :', fid);
                    return res.send(ret);
                });
            }
        }
    );
});

module.exports = router;