var util = require('../utility');
var jsonResponse = require('../jsonResponse');
var fs = require('fs');
var mv = require('mv');
require("../models/Template");
var express = require('express');
const multer = require('multer');
const bodyParser = require("body-parser");
const path = require('path');
const mongoose = require("mongoose");
const ObjectId = require('mongoose').Types.ObjectId;
var router = express.Router();
//var GridFsStorage = require("multer-gridfs-storage");
const { GridFsStorage } = require('multer-gridfs-storage');
const nameFile = path.basename(__filename);
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
const logger = require('./dymerlogger');
const Template = mongoose.model("Template");
var gridFSBucket;
var db;
const mongoURI = util.mongoUrl();
console.log(nameFile + ' | mongoURI :', JSON.stringify(mongoURI));
logger.info(nameFile + " | mongoURI: " + JSON.stringify(mongoURI));
mongoose.connect(mongoURI, {
        //  useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(x => {
        console.log(nameFile + ` | Connected to Mongo! Database name: "${x.connections[0].name}"`);
        logger.info(nameFile + ` | Connected to Mongo! Database name: "${x.connections[0].name}"`);
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
        console.error("ERROR | " + nameFile + ` | Error connecting to mongo! Database  : "${mongoURI}"`, err);
        logger.error(nameFile + ` | Error connecting to mongo! Database name: "${mongoURI}" ` + err);
    });

// Validator function
function isValidObjectId(id) {
    if (ObjectId.isValid(id)) {
        if ((String)(new ObjectId(id)) === id)
            return true;
        return false;
    }
    return false;
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

router.get('/mongostate', (req, res) => {
    //

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

var getfilesArrays = function(er) {
    return new Promise(function(resolve, reject) {
        var attachments = [];
        var actions = (er.files).map(recFile);
        var results = Promise.all(actions);
        results.then(function(dt) {
            var ret_json = {
                "title": er.title,
                "author": er.author,
                "description": er.description,
                "posturl": er.posturl,
                "instance": er.instance,
                "created": er.created,
                "files": dt,
                "_id": er._id,
                "viewtype": er.viewtype
            }
            resolve(ret_json);
        });
    });
}

var recFile = function(file_id) {
    return new Promise(function(resolve, reject) {
        //console.log('file_id', file_id);
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
        logger.error(nameFile + ' | recFile  : ' + err);
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

router.get('/', (req, res) => {
    //

    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let queryFind = callData.query;
    //console.log(nameFile + ' | get | queryFind:', JSON.stringify(queryFind));
    logger.info(nameFile + '  | get  | queryFind:' + JSON.stringify(queryFind));
    Template.find(queryFind, {}).collation({ locale: "en" }).sort({ title: +1 }).then((templates) => {
        //Template.find(queryFind).then((templates) => {
        // console.log('dat', JSON.stringify(templates));
        var actions = templates.map(getfilesArrays);
        var results = Promise.all(actions); // pass array of promises
        results.then(function(dat) {
            ret.setMessages("List");
            ret.setData(dat);
            //  console.log('dat', JSON.stringify(dat));
            return res.send(ret);
        })
    }).catch(function(err) {
        console.error("ERROR | " + nameFile + ' | get | queryFind : ', err);
        logger.error(nameFile + ' | get | queryFind : ' + err);
    });
});

router.get('/content/:fileid', function(req, res, next) {
    //

    var file_id = req.params.fileid;
    //console.log(nameFile + ' | get/content/:fileid |  fileid :', file_id);
    logger.info(nameFile + '  | get/content/:fileid |  fileid :' + file_id);
    if (!isValidObjectId(file_id)) {
        res.write('');
        res.end();
        return;
    }
    recFile(mongoose.Types.ObjectId(file_id))
        .then(function(result) {
            // console.log(nameFile + ' | get/content/:fileid |  fileid :', result);
            // logger.info(nameFile + '  | get/content/:fileid |  fileid :' + JSON.stringify(queryFind));
            res.setHeader('Content-type', result.contentType);
            res.setHeader('Content-disposition', 'filename=' + result.filename);
            res.charset = 'utf-8';
            res.write(result.data);
            res.end();
            return;
        })
        .catch(function(err) {
            console.error("ERROR | " + nameFile + ' | get/content/:fileid  : ', err);
            logger.error(nameFile + ' | get/content/:fileid : ' + err);
        });
});

router.post('/', util.checkIsAdmin, function(req, res) {
    //

    var ret = new jsonResponse();
    upload(req, res, function(err) {
        if (err) {
            console.error("ERROR | " + nameFile + ' | post | upload  : ', err);
            logger.error(nameFile + ' | post | upload  : ' + err);
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
            files: files_arr,
            viewtype: data.viewtype
        }
        var template = new Template(newObj);
        template.save().then((el) => {
            //console.log(nameFile + ' | post |  saved successfully :', JSON.stringify(newObj));
            logger.info(nameFile + ' | post |  saved successfully :' + JSON.stringify(newObj));
            ret.setMessages("Template uploaded successfully");
            let queryFind = { '_id': mongoose.Types.ObjectId(el._id) };
            Template.find(queryFind).then((Models) => {
                var actions = Models.map(getfilesArrays);
                var results = Promise.all(actions);
                results.then(function(dat) {
                    ret.setMessages("List");
                    ret.setData(dat);
                    return res.send(ret);
                })
            });
        }).catch((err) => {
            if (err) {
                console.error("ERROR | " + nameFile + ' | post | save  : ', err);
                logger.error(nameFile + ' | post | save  :' + err);
                ret.setMessages("Post error");
                ret.setSuccess(false);
                ret.setExtraData({ "log": err.stack });
                return res.send(ret);
            }
        })
    });
});

router.post('/create', util.checkIsAdmin, function(req, res) {
    //

    var ret = new jsonResponse();
    upload(req, res, function(err) {
        if (err) {
            console.error("ERROR | " + nameFile + ' | post/create | upload  : ', err);
            logger.error(nameFile + ' | post/create | upload  : ' + err);
            ret.setMessages("Upload Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
        let callData = util.getAllQuery(req);
        let data = callData.data;
        var template = new Template(data);
        template.save().then((el) => {
            // console.log(nameFile + ' | post/create  |  saved successfully :', JSON.stringify(data));
            logger.info(nameFile + ' | post/create  |  saved successfully :' + JSON.stringify(data));
            ret.setMessages("Template uploaded successfully");
            ret.addData(el);
            return res.send(ret);
        }).catch((err) => {
            if (err) {
                console.error("ERROR | " + nameFile + ' | post/create | save  : ', err);
                logger.error(nameFile + ' | post/create | save  : ' + err);
                ret.setMessages("Post error");
                ret.setSuccess(false);
                ret.setExtraData({ "log": err.stack });
                return res.send(ret);
            }
        })
    });
});

router.post('/addAsset', util.checkIsAdmin, function(req, res) {
    //

    var ret = new jsonResponse();
    upload(req, res, function(err) {
        if (err) {
            console.error("ERROR | " + nameFile + ' | post/addAsset | upload  : ', err);
            logger.error(nameFile + ' | post/addAsset | upload  : ' + err);
            ret.setMessages("Upload Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": error.stack });
            return res.send(ret);
        }
        let callData = util.getAllQuery(req);
        let data = callData.data;
        var element = req.files[0];
        //  console.log('addAsset', data);
        var myfilter = { "_id": data.pageId };
        var updateData = { "files": element.id };
        var myquery = { "$push": updateData };
        Template.updateOne(myfilter, myquery,
            function(err, raw) {
                if (err) {
                    ret.setSuccess(false);
                    console.error("ERROR | " + nameFile + ' | post/addAsset | updateOne  : ', err);
                    logger.error(nameFile + ' | post/addAsset | updateOne  : ' + err);
                    ret.setMessages("Template Error");
                    return res.send(ret);
                } else {
                    ret.addData(updateData);
                    //console.log(nameFile + ' | post/addAsset  |  updateOne successfully :', JSON.stringify(updateData));
                    logger.info(nameFile + ' | post/addAsset  |  updateOne successfully :' + JSON.stringify(updateData));
                    ret.setMessages("Template Updated");
                    return res.send(ret);
                }
            }
        );
    });
});

router.post('/update', util.checkIsAdmin, function(req, res) {
    //

    var ret = new jsonResponse();
    upload(req, res, function(err) {
        if (err) {
            console.error("ERROR | " + nameFile + ' | post/update | upload  : ', err);
            logger.error(nameFile + ' | post/update | upload  : ' + err);
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
                'description': data.description,
                'viewtype': data.viewtype,
                'instance': data.instance
            }
        };
        Template.updateOne(myfilter, myquery,
            function(err, raw) {
                if (err) {
                    ret.setSuccess(false);
                    console.error("ERROR | " + nameFile + ' | post/update | updateOne  : ', err);
                    logger.error(nameFile + ' | post/update | updateOne  : ' + err);
                    ret.setMessages("Template Error");
                    return res.send(ret);
                } else {
                    // console.log(nameFile + ' | post/update  |  updateOne successfully :', data.title);
                    logger.info(nameFile + ' | post/update  |  updateOne successfully :' + data.title);
                    ret.setMessages("Template Updated");
                    return res.send(ret);
                }
            }
        );
    });
});

router.post('/updateAsset', util.checkIsAdmin, function(req, res) {
    //

    var ret = new jsonResponse();
    upload(req, res, function(err) {
        if (err) {
            console.error("ERROR | " + nameFile + ' | post/updateAsset | upload  : ', err);
            logger.error(nameFile + ' | post/updateAsset | upload  : ' + err);
            ret.setMessages("Upload Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": error.stack });
            return res.send(ret);
        }
        let callData = util.getAllQuery(req);
        let data = callData.data;
        var element = req.files[0];
        var myfilter = { "_id": mongoose.Types.ObjectId(data.pageId) };
        var bulk = Template.collection.initializeOrderedBulkOp();
        bulk.find(myfilter).updateOne({ "$pull": { "files": mongoose.Types.ObjectId(data.assetId) } });
        bulk.find(myfilter).updateOne({ "$push": { "files": mongoose.Types.ObjectId(element.id) } });
        bulk.execute(function(err, result) {
            if (err) {
                ret.setSuccess(false);
                console.error("ERROR | " + nameFile + ' | post/updateAsset | execute  : ', err);
                logger.error(nameFile + ' | post/updateAsset | execute  : ' + err);
                ret.setMessages("Template Error");
                return res.send(ret);
            } else {
                // console.log(nameFile + ' | post/updateAsset  |  execute :', data.assetId);
                logger.info(nameFile + '| post/updateAsset | execute :' + data.assetId);
                gridFSBucket.delete(mongoose.Types.ObjectId(data.assetId)).then(() => {
                    ret.setMessages("Template Updated");
                    ret.setExtraData({ newAssetId: element.id });
                    return res.send(ret);
                }).catch(function(err) {
                   /* ret.setSuccess(false);
                    console.error("ERROR | " + nameFile + ' | post/updateAsset | delete  : ', err);
                    logger.error(nameFile + ' | post/updateAsset | delete  : ' + err);
                    ret.setMessages("Template Error");*/
                     /*MG - Se l'asset non viene trovato, accedo per recuperare il suo id aggiornato,
                           in modo da poterlo eliminare
                    INIZIO MODIFICHE*/
                    //ret.setSuccess(false);
                    //console.error("ERROR | " + nameFile + ' | post/updateAsset | delete  : ', err);
                    //logger.error(nameFile + ' | post/updateAsset | delete  : ' + err);
                    //ret.setMessages("Template Error");
                    Template.find(myfilter).then((Models) => {
                        var actions = Models.map(getfilesArrays);
                        var results = Promise.all(actions);
                        results.then(function(data) {
                            data.forEach(d => {
                                var found = false;
                                d.files.forEach(file => {
                                    if (file.filename == element.filename && !found){
                                        found = true;
                                        var myquery = { "$pull": { "files": mongoose.Types.ObjectId(file._id) } };
                                        Template.updateOne(myfilter, myquery,
                                            function(err, raw) {
                                                if (err) {
                                                    cconsole.error("ERROR | " + nameFile + ' | post/updateAsset | delete  : ', err);
                                                    logger.error(nameFile + ' | post/updateAsset | delete  : ' + err);
                                                } else {
                                                    gridFSBucket.delete(mongoose.Types.ObjectId(file._id)).then(() => {
                                                        logger.info(nameFile + ' | post/updateAsset  | Template Updated file._id :' + file._id);
                                                    });
                                                }
                                            }
                                        );
                                    }
                                });
                            });
                        })
                    }).catch(function(err) {
                        console.error("ERROR | " + nameFile + ' | post/updateAsset | delete  : ', err);
                        logger.error(nameFile + ' | post/updateAsset | delete  : ' + err);
                    });
                    /*MG - FINE MODIFICHE*/
                    return res.send(ret);
                });
            }
        });
    });
});

router.delete('/:id', util.checkIsAdmin, (req, res) => {
    //

    var ret = new jsonResponse();
    var id = req.params.id;
    var myfilter = { "_id": id };
    // console.log("Eliminando template", id);
    Template.findOneAndDelete(myfilter).then((el) => {
        el["files"].forEach(file => {
            gridFSBucket.delete(mongoose.Types.ObjectId(file._id));
        });
        ret.setMessages("Element deleted");
        // console.log(nameFile + ' | delete/:id  | findOneAndDelete successfully :', JSON.stringify(myfilter));
        logger.info(nameFile + ' | delete/:id  | findOneAndDelete successfully :' + JSON.stringify(myfilter));
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + ' | delete/:id  : ', err);
            logger.error(nameFile + ' | delete/:id  : ' + err);
            ret.setMessages("Delete Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

router.delete('/:id/:fid', util.checkIsAdmin, (req, res) => {
    //

    var ret = new jsonResponse();
    var id = req.params.id;
    var fid = req.params.fid;
    var myfilter = { "_id": id };
    var myquery = { "$pull": { "files": mongoose.Types.ObjectId(fid) } };
    //console.log("Eliminando asset:", fid, "dal template", id);
    Template.updateOne(myfilter, myquery,
        function(err, raw) {
            if (err) {
                ret.setSuccess(false);
                console.error("ERROR | " + nameFile + ' | delete/:id/:fid | updateOne : ', err);
                logger.error(nameFile + ' | delete/:id/:fid | updateOne : ' + err);
                ret.setMessages("Template Error");
                return res.send(ret);
            } else {
                gridFSBucket.delete(mongoose.Types.ObjectId(fid)).then(() => {
                    //console.log(nameFile + ' | delete/:id/:fid  | delete successfully :', fid);
                    logger.info(nameFile + ' | delete/:id/:fid  | deleted successfully :' + fid);
                    return res.send(ret);
                });
            }
        }
    );
});

module.exports = router;