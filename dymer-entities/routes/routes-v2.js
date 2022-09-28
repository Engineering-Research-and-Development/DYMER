var util = require('../utility');

//Marco var dymerOauth = require('./dymerOauth');
var jsonResponse = require('../jsonResponse');
var express = require('express');
var router = express.Router();
var elasticsearch = require('elasticsearch');
const multer = require('multer');
const bodyParser = require("body-parser");
const path = require('path');
const mongoose = require("mongoose");
const ObjectId = require('mongoose').Types.ObjectId;
//var crypto = require('crypto')
//const redis = require("redis");
var extend = require('extend');
//var router = express.Router();
//var GridFsStorage = require("multer-gridfs-storage");
const { GridFsStorage } = require('multer-gridfs-storage');
const axios = require('axios');
const jsonMapper = require('json-mapper-json');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
var bE = require("./bridgeEntities.js");
const { nextTick } = require('process');
const { reject, forEach } = require('lodash');
var _ = require('lodash');
var FormData = require('form-data');
const jwt = require('jsonwebtoken');
const nameFile = path.basename(__filename);
var redisClient = require('./redisModule')
const logger = require('./dymerlogger');
var db;
var storage;
var upload;
const mongoURI = util.mongoUrlFiles();
console.log(nameFile + ' | mongoURI :', JSON.stringify(mongoURI));
logger.info(nameFile + " | mongoURI: " + JSON.stringify(mongoURI));
//const connection = mongoose.createConnection(mongoURI, { useNewUrlParser: true });

mongoose
    .connect(mongoURI, {
        // useCreateIndex: true,
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
        console.error("ERROR | " + nameFile + ` | Error connecting to mongo! Database name: "${mongoURI}"`, err);
        logger.error(nameFile + ` | Error connecting to mongo! Database name: "${mongoURI}" ` + err);
    });
//let redisUrl = 'redis://cache:6379'
//redisClient.init()
let redisEnabled = global.configService.cache ? global.configService.cache.isEnabled : false;
console.log("redisEnabled", redisEnabled)
redisClient.init(redisEnabled)
    /*
     *************************************************************************************************************
     *************************************************************************************************************
     *************************************************************************************************************
     *************************************************************************************************************
     *************************************************************************************************************
     *************************************************************************************************************
     *************************************************************************************************************
     */


/*
var storageEngine = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, './uploads');
    },

    filename: function(req, file, fn) {
        fn(null, new Date().getTime().toString() + '-' + file.originalname);
    }
});
var upload = multer({ storage: storageEngine }).any();
*/
function replaceAll(str, cerca, sostituisci) {
    return str.split(cerca).join(sostituisci);
}
var auth = 'elastic:changeme';
var port = global.configService.repository.entity.port;
var protocol = global.configService.repository.entity.protocol;
var hostUrls = [global.configService.repository.entity.ip];

var hosts = hostUrls.map(function(host) {
    return {
        protocol: protocol,
        host: host,
        port: port,
        auth: auth
    };
});
var elasticTimer = 3000;
var elasticStatusUp = false;
var client = undefined;
setTimeout(startElastic, elasticTimer);

function startElastic() {
    try {
        client = new elasticsearch.Client({
            hosts: hosts,
            maxRetries: 10,
            requestTimeout: 100000,
            // requestTimeout: Infinity,
            pingTimeout: 6000
        });
        client.ping({
            // ping usually has a 3000ms timeout
            requestTimeout: 10000
        }, function(error) {
            if (error) {
                console.error("ERROR | " + nameFile + " | elasticsearch cluster is down!", error);
                logger.error(nameFile + " | elasticsearch cluster is down!" + error);
            } else {
                elasticStatusUp = true;
                console.log(nameFile + ' | Connected to elasticsearch! ', elasticStatusUp);
                logger.info(nameFile + ' | Connected to elasticsearch!  :' + elasticStatusUp);
            }
            if (!elasticStatusUp) {
                console.log(nameFile + ' | Elasticsearch down!, start setTimeout A', elasticStatusUp);
                logger.info(nameFile + ' | Elasticsearch down!, start setTimeout A :' + elasticStatusUp);
                elasticTimer += 2000;
                setTimeout(startElastic, elasticTimer);
            }
        });
    } catch (error) {
        console.error("ERROR | " + nameFile + " | elasticsearch cluster is down!", error);
        logger.error(nameFile + ' | elasticsearch cluster is down! ' + error);
        if (!elasticStatusUp) {
            console.log(nameFile + ' | Elasticsearch down!, start setTimeout B ', elasticStatusUp);
            logger.error(nameFile + ' | Elasticsearch down!, start setTimeout B  ' + elasticStatusUp);
            elasticTimer += 2000;
            setTimeout(startElastic, elasticTimer);
        }
    }
}

//iterate object and update
function stringAsKey(obj, arrkey, element) {
    var key = arrkey[0];
    if (arrkey.length == 1) {
        obj[key] = element;
        return obj[key];
    }
    if (arrkey.length > 0) {
        arrkey.shift();
        return stringAsKey(obj[key], arrkey, element);
    }
}

router.get('/mongostate', util.checkIsAdmin, (req, res) => {
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

router.get('/elasticstate', util.checkIsAdmin, (req, res) => {
    let ret = new jsonResponse();
    let elstate = 0;
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

    client.ping({
        // ping usually has a 3000ms timeout
        requestTimeout: 300
    }, function(error) {
        if (error) {
            elstate = 0;
        } else {
            elstate = 1;
        }
        ret.setMessages("Elastic state");
        ret.setData(dbState.find(f => f.value == elstate));
        res.status(200);
        ret.setSuccess(true);
        return res.send(ret);
    });

});

router.get('/redisstate', util.checkIsAdmin, async(req, res) => {
    let ret = new jsonResponse();
    let redisstate = 0;
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
        },
        {
            value: 4,
            label: "Disabled",
            css: "text-warning"
        }
    ];
    if (!redisEnabled) {
        ret.setMessages("redis state");
        redisstate = 4;
        ret.setData(dbState.find(f => f.value == redisstate));
        res.status(200);
        ret.setSuccess(true);
        return res.send(ret);
    }
    let redisState = await redisClient.ping(redisEnabled);
    if (redisState) {
        redisstate = 1;
    } else {
        redisstate = 0;
    }

    ret.setMessages("redis state");
    ret.setData(dbState.find(f => f.value == redisstate));
    res.status(200);
    ret.setSuccess(true);
    return res.send(ret);
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
router.post('/invalidatecache/:index', util.checkIsAdmin, async(req, res) => {
    let index = req.params['index'];
    await redisClient.invalidateCacheByIndex(index, true);
    var ret = new jsonResponse();
    ret.setMessages("invalidated cache");
    ret.setSuccess(true);
    //  ret.setExtraData({ "log": err.stack });
    return res.send(ret);

});


router.post('/invalidateallcache', util.checkIsAdmin, async(req, res) => {
    await redisClient.emptyCache(true);
    var ret = new jsonResponse();
    ret.setMessages("invalidated cache");
    ret.setSuccess(true);
    //  ret.setExtraData({ "log": err.stack });
    return res.send(ret);
});

var getfilesArrays = function(files_arr) {
    return new Promise(function(resolve, reject) {
        var attachments = [];
        var actions = (files_arr).map(recFile);
        var results = Promise.all(actions);
        results.then(function(dt) {
            resolve(dt);
        });
    }).catch(function(err) {
        console.error("ERROR | " + nameFile + ' | getfilesArrays : ', err);
        logger.error(nameFile + ' | getfilesArrays : ' + err);
    });
}

var recFile = function(file_id) {
    return new Promise(function(resolve, reject) {
        // gridFSBucket.openDownloadStream(file_id);
        db.collection('fs.files').findOne(file_id._id, function(err, filedata) {
            var chunks = [];
            var bucket = gridFSBucket.openDownloadStream(file_id);
            bucket.on('data', (chunk) => {
                chunks.push(chunk);
            });
            bucket.on('end', () => {
                var fbuf = Buffer.concat(chunks);
                //var base64 = (fbuf.toString('base64'));
                /*Marco errore carcamento pdf commentato  if (!filedata.contentType.includes("image"))
                      fbuf = (fbuf.toString());*/
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
        logger.error(nameFile + ' | recFile : ' + err);
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

function checkRelation(params, elIndex, elId) {
    var _id1 = elId;
    // console.log('checkRelation', params, elIndex);
    // console.log(nameFile + ' | checkRelation | params:', JSON.stringify(params), elIndex);
    logger.info(nameFile + ' | checkRelation | params :' + JSON.stringify(params) + " , " + elIndex);
    let datasetRel = [];

    for (var myKey in params) {
        let _id2_list = [];
        for (var elre in params[myKey]) {
            // console.log('params[myKey]', params[myKey]);
            let _id2 = params[myKey][elre].to;
            if (Array.isArray(_id2)) {
                _id2_list = params[myKey][elre].to;
            } else {
                _id2_list.push(_id2);
            }
            //  console.log('_id2', _id2);
            // console.log('myKey', myKey, elre);

            _id2_list.forEach(singleId2 => {
                if (singleId2 != "")
                    datasetRel.push({
                        _index1: elIndex,
                        "_id1": _id1,
                        "_id2": singleId2,
                        _index2: myKey
                    });
                //console.log("avvio controllo", qparams, JSON.stringify(qparams)); 
            });

        }
    }
    let qparams = {};
    qparams["index"] = "entity_relation";
    qparams["type"] = "entity_relation";
    qparams["body"] = {
        "bool": {
            "should": [{
                    "bool": {
                        "must": [{
                                "match": {
                                    "_id1": _id1
                                }
                            },
                            {
                                "match": {
                                    "_index1": elIndex
                                }
                            }
                        ]
                    }
                },
                {
                    "bool": {
                        "must": [{
                                "match": {
                                    "_id2": _id1
                                }
                            },
                            {
                                "match": {
                                    "_index2": elIndex
                                }
                            }
                        ]
                    }
                }
            ]
        }
    };
    controlAndCreateRel_V2(qparams, datasetRel);
    return true;
}

function checkRelation_original(params, elIndex, elId) {
    var _id1 = elId;
    // console.log('checkRelation', params, elIndex);
    // console.log(nameFile + ' | checkRelation | params:', JSON.stringify(params), elIndex);
    logger.info(nameFile + ' | checkRelation | params :' + JSON.stringify(params) + " , " + elIndex);
    for (var myKey in params) {
        let _id2_list = [];
        for (var elre in params[myKey]) {
            // console.log('params[myKey]', params[myKey]);
            let _id2 = params[myKey][elre].to;
            if (Array.isArray(_id2)) {
                _id2_list = params[myKey][elre].to;
            } else {
                _id2_list.push(_id2);
            }
            //  console.log('_id2', _id2);
            // console.log('myKey', myKey, elre);
            let qparams = {};
            qparams["index"] = "entity_relation";
            qparams["type"] = "entity_relation";
            _id2_list.forEach(singleId2 => {
                // qparams = {}; 
                /* qparams["body"] = {
                     query: {
                         "bool": {
                             "should": [{
                                 "match": { "_id1": _id1 }
                             }, {
                                 "match": { "_id2": _id1 }
                             }]
                         }
                     }
     
                 };*/
                qparams["body"] = {
                    "bool": {
                        "should": [{
                                "bool": {
                                    "must": [{
                                            "match": {
                                                "_id1": _id1
                                            }
                                        },
                                        {
                                            "match": {
                                                "_index1": elIndex
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "bool": {
                                    "must": [{
                                            "match": {
                                                "_id2": _id1
                                            }
                                        },
                                        {
                                            "match": {
                                                "_index2": elIndex
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                };
                qparams["body"].size = 1;
                if (_id1 == "" || singleId2 == "" || singleId2 == undefined) {

                } else {
                    var newRel = {
                            _index1: elIndex,
                            "_id1": _id1,
                            "_id2": singleId2,
                            _index2: myKey
                        }
                        //console.log("avvio controllo", qparams, JSON.stringify(qparams));
                    controlAndCreateRel(qparams, newRel);

                }
            });
        }
    }
    return true;
}

/*router.use(function(req, res, next) {
    //var decoded = jwt.decode(req.headers.authdata);
    //console.log(' DECODED ALL TIME', JSON.stringify(decoded));
    next();
});*/

function controlAndCreateRel_V2(qparams, datasetRel) {
    var parm = qparams;
    // client.indices.exists({ index: "entity_relation" }, function(err_, resp_, status_) {
    //      if (status_ == 200) {
    //  client.indices.exists({ index: "entity_relation" }).then((isExists) => {
    client.indices.exists({ index: "entity_relation" }, function(err_, resp_, status_) {
        if (status_ == 200) {
            //  if (isExists) { // 
            client.search(parm, function(err, resp, status) {
                //console.log("controlAndCreateRel list", resp, JSON.stringify(qparams));
                if (resp.hits == undefined) {
                    //console.log("CREO resp.hits == undefined");
                    createRelationV2(datasetRel);
                } else {
                    //console.log("CREO resp.hits != undefined");
                    logger.info(nameFile + ' | controlAndCreateRel | CREO resp.hits != undefined  ');
                    var exs = false;
                    //console.log("controlAndCreateRel resp.hits riga 319", resp.hits);
                    var filterdatasetRel = datasetRel.filter(function(o1) {
                        // if match found return false
                        return !resp["hits"].some(function(o2) {
                            if ((o1["_id2"] == o2["_source"]["_id1"] && o1["_index2"] == o2["_source"]["_index1"]) || (o1["_id2"] == o2["_source"]["_id2"] && o1["_index2"] == o2["_source"]["_index2"])) {
                                return true;
                            } else return false;
                        });
                    });
                    createRelationV2(filterdatasetRel);
                }
            }, function(err) {
                //console.log('Error controlAndCreateRel search');
                console.trace(err.message);
                logger.error(nameFile + ' | controlAndCreateReld | search : ' + err);
            });
        } else {
            console.log('NON ESISTE');
            createRelationV2(datasetRel);
            /* let params = { index: "entity_relation", type: "entity_relation" };
             params["body"] = {};
             datasetRel.forEach(element => {
                 createRelation(element);
             });*/

        }

    });
}

function controlAndCreateRel_original(qparams, newRel) {
    var parm = qparams;
    // client.indices.exists({ index: "entity_relation" }, function(err_, resp_, status_) {
    //      if (status_ == 200) {
    //  client.indices.exists({ index: "entity_relation" }).then((isExists) => {
    client.indices.exists({ index: "entity_relation" }, function(err_, resp_, status_) {
        if (status_ == 200) {
            //  if (isExists) { // 
            client.search(parm, function(err, resp, status) {
                //console.log("controlAndCreateRel list", resp, JSON.stringify(qparams));
                if (resp.hits == undefined) {
                    //console.log("CREO resp.hits == undefined");
                    createRelation(newRel);
                } else {
                    //console.log("CREO resp.hits != undefined");
                    logger.info(nameFile + ' | controlAndCreateRel | CREO resp.hits != undefined  ');
                    var exs = false;
                    //console.log("controlAndCreateRel resp.hits riga 319", resp.hits);
                    resp["hits"].hits.forEach((element) => {
                        if ((element["_source"]["_id1"] == newRel["_id1"] && element["_source"]["_id2"] == newRel["_id2"]) || (element["_source"]["_id1"] == newRel["_id2"] && element["_source"]["_id2"] == newRel["_id1"]))
                            exs = true;
                    });
                    // console.log("controlAndCreateRel search", newRel, exs);
                    if (!exs) {
                        createRelation(newRel);
                    }
                }
            }, function(err) {
                //console.log('Error controlAndCreateRel search');
                console.trace(err.message);
                logger.error(nameFile + ' | controlAndCreateReld | search : ' + err);
            });
        } else {
            //console.log('NON ESISTE');
            createRelation(newRel);
        }

    });
    /*.catch((err) => {
            console.log("error controlAndCreateRel", err);
        });*/
    /*.catch(function(err) {
            console.log('Caught an error on controlAndCreateRel:search!', err);
        });*/
}

function deleteRelation(_id1, _id2) {
    //  console.log("-----VAI E _id1, _id2", _id1, _id2);
    client.indices.exists({ index: "entity_relation" }, function(err_, resp_, status_) {
        if (status_ == 200) {
            var params = {};
            params["index"] = "entity_relation";
            params["type"] = "entity_relation";
            // qparams = {};
            params["body"] = {

                query: {
                    "bool": {
                        "should": [{
                            "match": { "_id1": _id1 }
                        }, {
                            "match": { "_id2": _id1 }
                        }]
                    }
                }

            };
            /* var params = { index: "entity_relation" };  
             params["body"] = {
                 "query": {
                     "bool": {
                         "should": [{
                                 "bool": {
                                     "must": [{
                                             "match": {
                                                 "_id1": _id1
                                             }
                                         },
                                         {
                                             "match": {
                                                 "_id2": _id2
                                             }
                                         }
                                     ]
                                 }
                             },
                             {
                                 "bool": {
                                     "must": [{
                                             "match": {
                                                 "_id2": _id2
                                             }
                                         },
                                         {
                                             "match": {
                                                 "_id1": _id1
                                             }
                                         }
                                     ]
                                 }
                             }
                         ],
                         "minimum_should_match": 1
                     }
                 }
             };*/
            params["body"].size = 10000;
            client.search(params).then(function(resp) {
                resp["hits"].hits.forEach((element) => {

                    if ((element["_source"]["_id1"] == _id1 && element["_source"]["_id2"] == _id2) || (element["_source"]["_id1"] == _id2 && element["_source"]["_id2"] == _id1)) {
                        //  console.error("deleteRelation ELIMINA RELAZIONE ", element);
                        var delarams = {};
                        delarams["index"] = element["_index"];
                        delarams["type"] = element["_type"];
                        delarams["id"] = element["_id"];
                        delarams["refresh"] = true;
                        logger.info(nameFile + ' | deleted Relation :' + JSON.stringify(delarams));
                        //console.log(nameFile + ' | deleteRelation :', JSON.stringify(delarams));
                        client.delete(delarams).then(
                            function(resp) {
                                // console.log(resp);
                                // logger.info(nameFile + ' | deleteRelation :' + JSON.stringify(delarams));
                                logger.info(nameFile + ' | deleted Relation :' + JSON.stringify(delarams));
                                // console.log(nameFile + ' | deleteRelation | success:', JSON.stringify(element));
                            },
                            function(err) {
                                console.trace(err.message);
                                logger.error(nameFile + ' | deleteRelation :' + err);
                            }
                        );
                    }
                });
            });
        } else return true;
    });
}

function deleteRelationByIndex(index) {
    let qrdelete = {
        "query": {
            "bool": {
                "should": [{
                        "bool": {
                            "must": [{
                                "match": {
                                    "_index1": index
                                }
                            }]
                        }
                    },
                    {
                        "bool": {
                            "must": [{
                                "match": {
                                    "_index2": index
                                }
                            }]
                        }
                    }
                ],
                "minimum_should_match": 1
            }
        }
    };

    client.indices.exists({ index: "entity_relation" }, function(err_, resp_, status_) {
        if (status_ == 200) {
            client.deleteByQuery({
                index: 'entity_relation',
                body: qrdelete,
                timeout: "5m"
            }, function(err, resp, status) {
                if (err) {
                    logger.error(nameFile + ' | deleteRelationByIndex | delete index:' + index + " , " + err);
                    console.error("ERROR | " + nameFile + ' | deleteRelationByIndex | delete:', err);
                } else {
                    logger.info(nameFile + ' | deleteRelationByIndex index:' + index);
                }
            });

        } else
            return true;
    });
}

function deleteRelationByIndex_original(index) {
    let params = { index: "entity_relation" };
    params["body"] = {
        "query": {
            "bool": {
                "should": [{
                        "bool": {
                            "must": [{
                                "match": {
                                    "_index1": index
                                }
                            }]
                        }
                    },
                    {
                        "bool": {
                            "must": [{
                                "match": {
                                    "_index2": index
                                }
                            }]
                        }
                    }
                ],
                "minimum_should_match": 1
            }
        }
    };
    params["body"].size = 10000;
    client.indices.exists({ index: "entity_relation" }, function(err_, resp_, status_) {
        if (status_ == 200) {
            client.search(params).then(function(resp) {
                resp["hits"].hits.forEach((element) => {
                    var delarams = {};
                    delarams["index"] = element["_index"];
                    delarams["type"] = element["_type"];
                    delarams["id"] = element["_id"];
                    delarams["refresh"] = true;
                    //   console.log(nameFile + ' | deleteRelationByIndex :', JSON.stringify(delarams));
                    logger.info(nameFile + ' | deleteRelationByIndex :' + JSON.stringify(delarams));
                    client.delete(delarams).then(
                        function(resp) {},
                        function(err) {
                            // console.trace(err.message);
                            logger.error(nameFile + ' | deleteRelationByIndex | delete :' + JSON.stringify(delarams) + ',' + err);
                            console.error("ERROR | " + nameFile + ' | deleteRelationByIndex | delete:', err);
                        }
                    );
                });
            });
        } else
            return true;

    });


}
//toDelete
function deleteRelationOneEntity(_id1) {
    let params = { index: "entity_relation" };
    let qrdelete = {
        "query": {
            "bool": {
                "should": [{
                        "bool": {
                            "must": [{
                                "match": {
                                    "_id1": _id1
                                }
                            }]
                        }
                    },
                    {
                        "bool": {
                            "must": [{
                                "match": {
                                    "_id2": _id1
                                }
                            }]
                        }
                    }
                ],
                "minimum_should_match": 1
            }
        }
    };
    params["body"].size = 10000;
    client.indices.exists({ index: "entity_relation" }).then((isExists) => {
        if (isExists) {
            client.deleteByQuery({
                index: 'entity_relation',
                body: qrdelete,
                timeout: "5m"
            }, function(err, resp, status) {
                if (err) {
                    logger.error(nameFile + ' | deleteRelationOneEntity | delete :' + err);
                    console.error("ERROR | " + nameFile + ' | deleteRelationOneEntity | delete:', err);
                } else {
                    logger.info(nameFile + ' | deleteRelationOneEntity :' + index);
                }
            });
            return true;
        } else {

            return false;
        }
    }).catch((err) => {
        console.log(err);
        logger.error(nameFile + ' | deleteRelationOneEntity   : ' + err);
    });
}

function deleteRelationOneEntity_original(_id1) {
    let params = { index: "entity_relation" };
    params["body"] = {
        "query": {
            "bool": {
                "should": [{
                        "bool": {
                            "must": [{
                                "match": {
                                    "_id1": _id1
                                }
                            }]
                        }
                    },
                    {
                        "bool": {
                            "must": [{
                                "match": {
                                    "_id2": _id1
                                }
                            }]
                        }
                    }
                ],
                "minimum_should_match": 1
            }
        }
    };
    params["body"].size = 10000;
    client.indices.exists({ index: "entity_relation" }).then((isExists) => {
        if (isExists) {

            client.search(params).then(function(resp) {
                resp["hits"].hits.forEach((element) => {
                    //console.log(nameFile + ' | deleteRelationOneEntity | success:', JSON.stringify(element));
                    logger.info(nameFile + ' |deleteRelationOneEntity | success :' + JSON.stringify(element));
                    var delarams = {};
                    delarams["index"] = element["_index"];
                    delarams["type"] = element["_type"];
                    delarams["id"] = element["_id"];
                    delarams["refresh"] = true;
                    client.delete(delarams).then(
                        function(resp) {
                            // console.log(resp);
                            // console.error("Relation removed", delarams, resp);
                        },
                        function(err) {
                            console.error("ERROR | " + nameFile + ' | deleteRelationOneEntity | delete :', delarams, err);
                            logger.error(nameFile + ' | deleteRelationOneEntity | delete  : ' + err);
                        }
                    );

                });
            }).catch(function(error) {
                console.error("ERROR | " + nameFile + ' | deleteRelationOneEntity :', delarams, error);
                logger.error(nameFile + ' | deleteRelationOneEntity | delete search : ' + error);
                return false;
            });
            return true;
        } else {

            return false;
        }
    }).catch((err) => {
        console.log(err);
        logger.error(nameFile + ' | deleteRelationOneEntity   : ' + err);
    });


}

function deleteRelationOneEntityAndIndex(_id, _index) {
    let params = { index: "entity_relation" };
    let qrdelete = {
        "query": {
            "bool": {
                "should": [{
                        "bool": {
                            "must": [{
                                "match": {
                                    "_id1": _id
                                }
                            }, {
                                "match": {
                                    "_index1": _index
                                }
                            }]
                        }
                    },
                    {
                        "bool": {
                            "must": [{
                                "match": {
                                    "_id2": _id
                                }
                            }, {
                                "match": {
                                    "_index2": _index
                                }
                            }]
                        }
                    }
                ]
            }
        }
    };
    client.indices.exists({ index: "entity_relation" }).then((isExists) => {
        if (isExists) {
            client.deleteByQuery({
                index: 'entity_relation',
                body: qrdelete,
                timeout: "5m"
            }, function(err, resp, status) {
                if (err) {
                    logger.error(nameFile + ' | deleteRelationOneEntityAndIndex | delete :' + _index + " , " + _id + " , " + err);
                    console.error("ERROR | " + nameFile + ' | deleteRelationOneEntityAndIndex | delete _index, _id:', _index, _id, err);
                } else {
                    logger.info(nameFile + ' | deleteRelationOneEntityAndIndex :' + _index + " , " + _id);
                }
            });

            return true;
        } else {

            return false;
        }
    }).catch((err) => {
        console.log(err);
        logger.error(nameFile + ' | deleteRelationOneEntityAndIndex exists: ' + err);
    });
}

function deleteRelationOneEntityAndIndex_original(_id, _index) {
    let params = { index: "entity_relation" };
    params["body"] = {
        "query": {
            "bool": {
                "should": [{
                        "bool": {
                            "must": [{
                                "match": {
                                    "_id1": _id
                                }
                            }, {
                                "match": {
                                    "_index1": _index
                                }
                            }]
                        }
                    },
                    {
                        "bool": {
                            "must": [{
                                "match": {
                                    "_id2": _id
                                }
                            }, {
                                "match": {
                                    "_index2": _index
                                }
                            }]
                        }
                    }
                ],
                "minimum_should_match": 1
            }
        }
    };
    params["body"].size = 10000;
    client.indices.exists({ index: "entity_relation" }).then((isExists) => {
        if (isExists) {

            client.search(params).then(function(resp) {
                resp["hits"].hits.forEach((element) => {
                    //console.log(nameFile + ' | deleteRelationOneEntityAndIndex | success:', JSON.stringify(element));
                    logger.info(nameFile + ' | deleteRelationOneEntityAndIndex | success :' + JSON.stringify(element));
                    var delarams = {};
                    delarams["index"] = element["_index"];
                    delarams["type"] = element["_type"];
                    delarams["id"] = element["_id"];
                    delarams["refresh"] = true;
                    client.delete(delarams).then(
                        function(resp) {
                            // console.log(resp);
                            logger.info(nameFile + ' | deleteRelationOneEntityAndIndex : ' + JSON.stringify(delarams));
                            // console.error("Relation removed", delarams, resp);
                        },
                        function(err) {
                            logger.error(nameFile + ' | deleteRelationOneEntityAndIndex : ' + JSON.stringify(delarams) + ',' + err);
                            console.error("ERROR | " + nameFile + ' | deleteRelationOneEntityAndIndex delete:', JSON.stringify(delarams), err);
                        }
                    );

                });
            }).catch(function(error) {
                return false;

            });
            return true;
        } else {

            return false;
        }
    }).catch((err) => {
        console.log(err);
        logger.error(nameFile + ' | deleteRelationOneEntityAndIndex exists: ' + err);
    });
}

async function createRelationV2(dataset) {
    //   let params = { index: "entity_relation", type: "entity_relation" };
    //   params["body"] = newRel;
    //  params["refresh"] = true;
    if (dataset.length > 0) {


        const body = dataset.flatMap(doc => [{ index: { "_index": 'entity_relation', "_type": 'entity_relation' } }, doc])
            //const { body: bulkResponse } = await client.bulk({ refresh: true, body })
        const bulkResponse = await client.bulk({ refresh: true, body })
        if (bulkResponse.errors) {
            const erroredDocuments = []
                // The items array has the same order of the dataset we just indexed.
                // The presence of the `error` key indicates that the operation
                // that we did for the document has failed.
            bulkResponse.items.forEach((action, i) => {
                const operation = Object.keys(action)[0]
                if (action[operation].error) {
                    erroredDocuments.push({
                        // If the status is 429 it means that you can retry the document,
                        // otherwise it's very likely a mapping error, and you should
                        // fix the document before to try it again.
                        status: action[operation].status,
                        error: action[operation].error,
                        operation: body[i * 2],
                        document: body[i * 2 + 1]
                    })
                }
            })
            console.log(erroredDocuments)
            console.error("ERROR | " + nameFile + ' | createRelationV2  : ', erroredDocuments);
            logger.error(nameFile + ' | createRelationV2:' + erroredDocuments);
        } else {
            logger.info(nameFile + ' | createRelationV2 | success:' + JSON.stringify(dataset));
        }
    } else {
        logger.info(nameFile + ' | createRelationV2 | no relation deteced:');
    }
}

function createRelation(newRel) {
    let params = { index: "entity_relation", type: "entity_relation" };
    params["body"] = newRel;
    //  params["refresh"] = true;
    logger.info(nameFile + ' | createRelation | success:' + JSON.stringify(params));
    client.index(params).then(function(resp) {
        //console.log(nameFile + ' | createRelation | success:', JSON.stringify(resp));
        //console.error("Relation created", resp);
        return true;
    }).catch(function(err) {
        console.error("ERROR | " + nameFile + ' | createRelation  : ', err);
        logger.error(nameFile + ' | createRelation:' + err);
        return false;
    });
}

var checkUnionRelation = function(originalList) {
    return new Promise(function(resolve, reject) {
        var returnList = originalList;
        var res2 = Promise.all(returnList.map(fetchSingleRelation)).then(function(data) {
            resolve(returnList);
        }).catch(function(err) {
            console.error("ERROR | " + nameFile + ' | checkUnionRelation | promise.all  : ', err);
            logger.error(nameFile + ' | checkUnionRelation | promise.all : ' + err);
        });
        /*for (var i = 0, len = returnList.length; i < len; i++) {
        //returnList.forEach(function (element, index) {
          element=returnList[i];
            element["relations"] = [];
            console.log('D' );
                 fetchSingleRelation(element).then(function (relat) {
              console.log('D1',relat );
              element["relations"] = relat;
            });

            //console.log("definifive EL", element);
            console.log("++++++++");
          }//);*/
        //  console.log("returnList", returnList);
        //     console.log('G');
        //resolve(returnList); 
    }).catch(function(err) {
        console.error("ERROR | " + nameFile + ' | checkUnionRelation | promise  : ', err);
        logger.error(nameFile + ' | checkUnionRelation | promise : ' + err);
    });
}
var listSingleRelation = function(id) {
    return new Promise(function(resolve, reject) {
        let qparams = { index: "entity_relation" };
        qparams["body"] = {
            "query": {
                "bool": {
                    "should": [{
                            "bool": {
                                "must": [{
                                    "match": {
                                        "_id1": id
                                    }
                                }]
                            }
                        },
                        {
                            "bool": {
                                "must": [{
                                    "match": {
                                        "_id2": id
                                    }
                                }]
                            }
                        }
                    ]
                }
            }
        };
        qparams["body"].size = 10000;
        //entity_relation
        //qparams = { index: 'entity_relation',
        // body:{}}  ;
        client.indices.exists({ index: "entity_relation" }, function(err_, resp_, status_) {
            //   console.log("RESPENT", err_, resp_, status_);
            if (status_ == 200) {
                client.search(qparams).then(function(relresp) {
                    resolve(relresp.hits.hits);

                }, function(err) {
                    console.error("ERROR | " + nameFile + ' | listSingleRelation | search qparams : ', err);
                    logger.error(nameFile + ' | listSingleRelation | search qparams : ' + err);
                    resolve();
                });

            } else {
                resolve([]);
            }
        });
    }).catch(function(err) {
        console.error("ERROR | " + nameFile + ' | listSingleRelation | promise  : ', err);
        logger.error(nameFile + ' | listSingleRelation | promise : ' + err);
    });
};
var fetchSingleRelation = function(element) {
    return new Promise(function(resolve, reject) {
        let qparams = { index: "entity_relation" };
        qparams["body"] = {
            "query": {
                "bool": {
                    "should": [{
                            "bool": {
                                "must": [{
                                    "match": {
                                        "_id1": element["_id"]
                                    }
                                }]
                            }
                        },
                        {
                            "bool": {
                                "must": [{
                                    "match": {
                                        "_id2": element["_id"]
                                    }
                                }]
                            }
                        }
                    ]
                }
            }
        };
        qparams["body"].size = 10000;
        //entity_relation
        //qparams = { index: 'entity_relation',
        // body:{}}  ;
        client.indices.exists({ index: "entity_relation" }, function(err_, resp_, status_) {
            //   console.log("RESPENT", err_, resp_, status_);
            if (status_ == 200) {
                client.search(qparams).then(function(relresp) {
                    // console.log("Relation get query sort", relresp.hits.hits);
                    var arrlist = [];
                    relresp.hits.hits.forEach(function(relel, index) {
                        //     console.log("Relation relel", relel);
                        if (relel._source["_id1"] == element["_id"] || relel._source["_id2"] == element["_id"]) {
                            if (relel._source["_id1"] != element["_id"])
                                arrlist.push(relel._source["_id1"])
                            else
                                arrlist.push(relel._source["_id2"])
                        }
                    });
                    let relparams = {};
                    // "sort": [{ "title": { "order": "desc", "ignore_unmapped": true } }],
                    relparams["body"] = {
                        "query": {
                            "terms": {
                                "_id": arrlist
                            }
                        }
                    };
                    //  relparams["sort"] = [{ "title": { "order": "desc", "ignore_unmapped": true } }];
                    // relparams["sort"] = ["title.keyword:desc"];
                    /* relparams["sort"] = [{
                          "title.keyword": {
                              "order": "desc"
                          }
                      }];*/
                    relparams["body"].size = 10000;
                    var arrrela = [];
                    client.search(relparams).then(function(extraxctRel) {
                        // console.log('F', relparams);
                        //   console.log("extraxctRel", extraxctRel.hits.hits);
                        arrrela = extraxctRel.hits.hits;
                        /*  arrrela.sort(function(a, b) {
                              console.log("sort", a["_source"].title, b["_source"].title, a["_source"].title > b["_source"].title);
                              if (a["_source"].title > b["_source"].title) {
                                  return 1;
                              } else if (a["_source"].title < b["_source"].title) {
                                  return -1;
                              }
                              return 0;

                          });*/
                        element['relations'] = arrrela;
                        //     console.log('F1', element);
                        resolve();
                        //   resolve();
                        //   console.log('works');
                    }, function(err) {
                        console.error("ERROR | " + nameFile + ' | fetchSingleRelation | search relparams : ', err);
                        logger.error(nameFile + ' | fetchSingleRelation | search relparams : ' + err);
                        reject();
                    });

                }, function(err) {
                    console.error("ERROR | " + nameFile + ' | fetchSingleRelation | search qparams : ', err);
                    logger.error(nameFile + ' | fetchSingleRelation | search qparams : ' + err);
                    resolve();
                });

            } else {
                element['relations'] = [];
                resolve();
            }
        });
    }).catch(function(err) {
        console.error("ERROR | " + nameFile + ' | fetchSingleRelation | promise  : ', err);
        logger.error(nameFile + ' | fetchSingleRelation | promise : ' + err);
    });
};
//Marco aggiungere controllo permessi
router.get('/', (req, res) => {
    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let instance = callData.instance;
    let query = callData.query;
    let params = (instance) ? instance : {};
    params["body"] = query;
    params["sort"] = ["title.keyword:asc"];
    params["body"].size = 10000; //set max entity to return
    //console.log(nameFile + ' | GET | params:', JSON.stringify(params));
    logger.info(nameFile + ' | GET | params:' + JSON.stringify(params));
    const hdymeruser = req.headers.dymeruser;
    const dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
    //console.log(nameFile + ' | GET | dymeruser:', JSON.stringify(dymeruser));
    logger.info(nameFile + ' | GET | dymeruser:' + JSON.stringify(dymeruser));
    client.search(params, function(err, resp, status) {
        if (err) {
            console.error("ERROR | " + nameFile + ' | GET  : ', err);
            logger.error(nameFile + ' |GET: ' + err);
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.message });
            ret.setMessages("Entity " + err.displayName);
            return res.send(ret);
        }
        let msg = (resp.hits.total > 0) ? "List entities" : "Empty list";
        ret.setMessages(msg);
        ret.setData(resp.hits.hits);
        return res.send(ret);
    });
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
router.get('/contentfile/:entityid/:fileid', function(req, res, next) {
    var entityid = req.params.entityid;
    var file_id = req.params.fileid;
    if (!isValidObjectId(file_id)) {
        //console.error("ERROR | " + nameFile + ' | get/contentfile/:entityid/:fileid | fileid !isValidObjectId:');
        res.status(404).send('Not Found');
        return;
    }
    const hdymeruser = req.headers.dymeruser;
    const dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
    const urs_uid = dymeruser.id;
    var urs_gid = dymeruser.gid;
    //  console.log("file_id", file_id);
    let paramsCheck = {};
    /*   paramsCheck["body"] = {
           "query": {
               "match": {
                   "_id": entityid
               }
           },
           qoptions: { relations: false }
       };*/
    paramsCheck["body"] = {
        "query": {
            "match": {
                "_id": entityid
            }
        }
    };
    paramsCheck["body"].size = 1;
    client.search(paramsCheck).then(function(respCheck) {
        if ((respCheck["hits"].hits).length > 0) {
            var checkElemPerm = respCheck["hits"].hits[0]._source.properties;
            haspermissionGrants(dymeruser, checkElemPerm).then(function(listperm) {
                    // console.log(nameFile + ' | contentfile | permission view:', entityid, file_id, dymeruser.id, listperm.data.view);
                    //   console.log(nameFile + ' | contentfile | listpermission:', JSON.stringify(listperm), JSON.stringify(dymeruser));
                    logger.info(nameFile + ' | contentfile | permission view:' + entityid + " , " + file_id + " , " + dymeruser.id + " , " + listperm.data.view);
                    logger.info(nameFile + ' | contentfile | listpermission:' + JSON.stringify(listperm) + " , " + JSON.stringify(dymeruser));
                    if (listperm.data.view) {
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
                                console.error("ERROR | " + nameFile + ' | get/contentfile/:entityid/:fileid | recFile:', err);
                                logger.error(nameFile + ' | get/contentfile/:entityid/:fileid | recFile: ' + err);
                                res.end("");
                            });
                    } else {
                        //console.log(nameFile + ' | contentfile | permission view:', entityid, file_id, dymeruser.id, listperm.data.view);
                        logger.info(nameFile + ' | contentfile | permission view :' + entityid + " , " + file_id + " , " + dymeruser.id + " , " + listperm.data.view);
                        res.status(401).send('Unauthorized');
                    }
                })
                .catch(function(err) {
                    console.error("ERROR | " + nameFile + ' | get/contentfile/:entityid/:fileid | haspermissionGrants:', err);
                    logger.error(nameFile + ' | get/contentfile/:entityid/:fileid | haspermissionGrants: ' + err);
                    res.end("");
                });
        }
    }).catch(function(err) {
        console.error("ERROR | " + nameFile + ' | get/contentfile/:entityid/:fileid | search:', err);
        logger.error(nameFile + ' | get/contentfile/:entityid/:fileid | search: ' + err);
        res.end("");
    });
});
router.get('/content_old/:fileid', function(req, res, next) {
    //Marco console.log(" ROUTER CONTENT ");
    var file_id = req.params.fileid;
    //  console.log("file_id", file_id);
    res.end("");
    recFile(mongoose.Types.ObjectId(file_id))
        .then(function(result) {
            //  console.log("file_id", result);
            res.writeHead(200, {
                'Content-Type': result.contentType,
                'Content-Length': result.length,
                'Content-Disposition': 'filename=' + result.filename
            });
            res.end(result.data);
        })
        .catch(function(err) {
            console.error("ERROR | " + nameFile + ' | GET  : ', err);
            logger.error(nameFile + ' | /content_old/:fileid | GET: ' + err);
            res.end("");
        });
});
//Marco gestione permessi
router.get('/allstats/', (req, res) => {
    var ret = new jsonResponse();
    var params = {};
    client.indices.stats(params, function(err, resp, status) {
        if (err) {
            console.error("ERROR | " + nameFile + ' | allstats  :', err);
            logger.error(nameFile + ' | allstats : ' + err);
            ret.setSuccess(false);
            ret.setExtraData({ log: err.message });
            ret.setMessages("Entity " + err.displayName);
            return res.send(ret);
        }
        var listEl = resp.indices;
        var totEnt = 0;
        var respData = {
            total: 0,
            indices: []
        };
        for (const [key, value] of Object.entries(listEl)) {
            if (key != "entity_relation") {
                totEnt += value['primaries']['docs']['count'];
                respData.indices.push({ index: key, count: value['primaries']['docs']['count'] });
            }
        }
        respData.total = totEnt;
        ret.setData(respData);
        return res.send(ret);
    });
});
router.get('/allstatsglobal/', (req, res) => {
    var ret = new jsonResponse();
    var params = {};
    client.indices.stats(params, function(err, resp, status) {
        if (err) {
            console.error("ERROR | " + nameFile + ' | allstats  :', err);
            logger.error(nameFile + ' | allstats : ' + err);
            ret.setSuccess(false);
            ret.setExtraData({ log: err.message });
            ret.setMessages("Entity " + err.displayName);
            return res.send(ret);
        }
        var listEl = resp.indices;
        var totEnt = 0;
        var respData = {
            total: 0,
            indices: []
        };
        for (const [key, value] of Object.entries(listEl)) {
            // if (key != "entity_relation") {
            totEnt += value['primaries']['docs']['count'];
            respData.indices.push({ index: key, count: value['primaries']['docs']['count'] });
            //  }
        }
        respData.total = totEnt;
        ret.setData(respData);
        return res.send(ret);
    });
});
router.get('/relationstat/', (req, res) => {

    var ret = new jsonResponse();

    var params = {};
    params["index"] = "entity_relation";
    params["type"] = "entity_relation";
    params["body"] = {
        "aggregations": {
            "aggr": {
                "terms": {
                    "field": "_index1.keyword"
                },
                "aggregations": {
                    "_index2": {
                        "terms": {
                            "field": "_index2.keyword"
                        }
                    }
                }
            }
        }
    };
    client.indices.exists({ index: "entity_relation" }, function(err_, resp_, status_) {
        if (status_ == 200) {
            client.search(params).then(function(resp) {

                ret.setData(resp.aggregations.aggr.buckets);
                return res.send(ret);
            }).catch(function(error) {
                console.log(error);
                ret.setMessages("Search Error");
                ret.setSuccess(false);
                ret.setExtraData({ "log": error });
                return res.send(ret);
            });
        } else {

            ret.setData([]);
            return res.send(ret);
            /* let params = { index: "entity_relation", type: "entity_relation" };
             params["body"] = {};
             datasetRel.forEach(element => {
                 createRelation(element);
             });*/

        }

    });
});
//Marco gestione permessi
router.get('/allindex/', (req, res) => {
    var ret = new jsonResponse();
    let params = {};
    params["index"] = "_all";
    client.indices.get(params, function(err, resp, status) {
        if (err) {
            console.error("ERROR | " + nameFile + ' | allindex :', err);
            logger.error(nameFile + ' | allindex : ' + err);
            ret.setSuccess(false);
            ret.setExtraData({ log: err.message });
            ret.setMessages("Entity " + err.displayName);
            return res.send(ret);
        }
        ret.setMessages("Entity founded successfully");
        ret.setData(resp);
        return res.send(ret);
    });
});

let getUserCredential2 = async function(my_authdata) {
    return new Promise(function(resolve, reject) {
        //  return new Promise((resolve, reject) => {
        console.log("titit", my_authdata["accept-language"]);
        my_authdata["sasa"] = 2;
        return resolve(my_authdata);
    }).catch(function(err) {
        console.log("getUserCredential2");
    });
};
/*async function makeOtherServiceCall() {
    return axios.get('https://jsonplaceholder.typicode.com/comments');
}*/
//get with with query
//Marco router.post('/_search', async function(req, res) {

router.post('/_search', (req, res) => {
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    // console.log('TESTSESSION req originalUrl', fullUrl);
    // console.log(' req.headers.dymeruser', req.headers.dymeruser);
    // var decoded = jwt.decode(req.headers.authdata);
    //  var decoded = jwt.decode(req.headers.authdata);
    var ret = new jsonResponse();
    const hdymeruser = req.headers.dymeruser;
    const dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
    //console.log(nameFile + ' | _search | dymeruser :', JSON.stringify(dymeruser));
    logger.info(nameFile + ' | _search | dymeruser :' + JSON.stringify(dymeruser));
    //logger.info(nameFile + ' | _search | dymeruser:' + JSON.stringify(dymeruser));
    // logger.error(nameFile + ' | _search | dymeruser:' + JSON.stringify(dymeruser));
    // logger.warn(nameFile + ' | _search | dymeruser:' + JSON.stringify(dymeruser));
    // logger.debug(nameFile + ' | _search | dymeruser:' + JSON.stringify(dymeruser));

    /* 
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]
        var maybenous = false;

        console.log('test token ', token == undefined || token == 'null');
        if (token == undefined || token == 'null')
            maybenous = true;
        //JWT var decoded = jwt.decode(token);
        var decoded = {};
        var roles = [];
        var urs_uid = "nomail@nomail.it";
        var urs_gid = -1;
        if (maybenous == false) {
            console.log('supertoken', token);
            //JWT  var decoded = jwt.decode(token);
            var decoded = JSON.parse(Buffer.from(token, 'base64').toString());
            urs_uid = decoded.email;
            urs_gid = decoded.extrainfo.groupId;
            decoded.roles.forEach(element => {
                roles.push(element.role);
            });
            //roles = pp.realm_access.roles;
        }
    */
    var act = "view";
    var index = req.params.enttype;
    var queryString = "";
    var hasperm = false;
    var isadmin = false;
    if (dymeruser.roles.indexOf("app-admin") > -1) {
        hasperm = true;
        isadmin = true;
    }
    queryString = "?role[]=" + dymeruser.roles.join("&role[]=");
    var url = util.getServiceUrl("dservice") + "/api/v1/perm/entityrole/";
    url += act + "/";
    url += index + "/";
    url += queryString;
    //Marco upload(req, res,   function(err) {
    upload(req, res, async function(err) {
        if (err) {
            return res.end("Error!!!!");
        }
        let callData = util.getAllQuery(req);
        let instance = callData.instance;
        let query = callData.query;
        let source = callData.query.getfields;
        let qoptions = callData.qoptions;
        let recoverRelation = true;
        let size = 10000;
        let sort = ["title.keyword:asc"];
        if (qoptions != undefined) {
            if (qoptions.relations != undefined)
                recoverRelation = qoptions.relations;
            if (qoptions.size != undefined)
                size = qoptions.size;
            if (qoptions.sort != undefined)
                sort = qoptions.sort;
            //     console.log('********************** recoverRelation', recoverRelation);
        }
        let params = (instance) ? instance : {};
        var req_uid = 0;
        var req_gid = 0;
        req_uid = dymeruser.id;
        req_gid = dymeruser.gid;
        //console.log(nameFile + ' | _search | callData:', JSON.stringify(callData));
        logger.info(nameFile + ' | _search | callData :' + JSON.stringify(callData));
        var rr = [];
        //    console.log("indextosearch", indextosearch);
        //var bridgeConf = bE.findByIndex("e7");
        var rr = { indextosearch: [], query: [] };
        rr = retriveIndex_Query_ToSearch(rr, query.query);
        //console.log(nameFile + ' | _search | retriveIndex_Query_ToSearch:', JSON.stringify(rr));
        logger.info(nameFile + ' | _search | retriveIndex_Query_ToSearch :' + JSON.stringify(rr));
        var bridgeConf = undefined;
        if (rr != undefined)
            bridgeConf = bE.findByIndex(rr.indextosearch[0]);
        //console.log(nameFile + ' | _search | bridgeConf:', JSON.stringify(bridgeConf));
        logger.info(nameFile + ' | _search | bridgeConf :' + JSON.stringify(bridgeConf));
        if (bridgeConf != undefined) {
            bridgeEsternalEntities(bridgeConf, "search", undefined, rr).then(function(callresp) {
                jsonMappingExternalToDymerEntity(callresp.data, bridgeConf, "search").then(function(mapdata) {
                    let msg = (mapdata.length > 0) ? "List entities" : "Empty list";
                    ret.setData(mapdata);
                    ret.setMessages(msg);
                    return res.send(ret);
                }).catch(function(error) {
                    console.error("ERROR | " + nameFile + ' | _search | jsonMappingExternalToDymerEntity:', error);
                    logger.error(nameFile + ' | _search | jsonMappingExternalToDymerEntity : ' + error);
                    ret.setSuccess(false);
                    ret.setMessages("Entity Mapping Problem");
                    return res.send(ret);
                });
            }).catch(function(error) {
                console.error("ERROR | " + nameFile + ' | _search | bridgeEsternalEntities:', error);
                logger.error(nameFile + ' | _search | bridgeEsternalEntities : ' + error);
                ret.setSuccess(false);
                ret.setMessages("Entity Recovery Problem");
                return res.send(ret);
            });
        } else {
            let filterRelationDymer = {};
            //query.query.relationdymer:{"<indice_relazione":["<id_entità_relazione>"]} contiene il filtro con le relazioni
            if (query.query != undefined) {
                if (query.query.relationdymer != undefined) {
                    filterRelationDymer = query.query.relationdymer;
                    delete query.query.relationdymer;
                }
            }

            if (!isadmin) {
                var my_oldquery = query.query;
                /*
                STATUS  Published 1
                        Not Published 2
                        Draft   3
                Visibility 
                        Restricted  2
                        Public  0
                        Private 1
                */
                //query.query = {};
                query = {
                    "query": {
                        "bool": {
                            "must": [{
                                "bool": {
                                    "should": [{
                                        "bool": {
                                            "must": [{
                                                "match": {
                                                    "properties.status": "1"
                                                }
                                            }, {
                                                "match": {
                                                    "properties.visibility": "0"
                                                }
                                            }]
                                        }
                                    }, {
                                        "bool": {
                                            "must": [{
                                                "match_phrase": {
                                                    "properties.owner.uid": req_uid
                                                }
                                            }]
                                        }
                                    }, {
                                        "bool": {
                                            "must": [{
                                                "match": {
                                                    "properties.owner.gid": req_gid
                                                }
                                            }, {
                                                "match": {
                                                    "properties.visibility": "2"
                                                }
                                            }],
                                            "must_not": [{
                                                "match": {
                                                    "properties.status": "2"
                                                }
                                            }]
                                        }
                                    }, {
                                        "bool": {
                                            "should": [{
                                                "match_phrase": {
                                                    "properties.grant.view.uid": req_uid
                                                }
                                            }, {
                                                "match_phrase": {
                                                    "properties.grant.view.gid": req_gid
                                                }
                                            }]
                                        }
                                    }, {
                                        "bool": {
                                            "should": [{
                                                "match_phrase": {
                                                    "properties.grant.update.uid": req_uid
                                                }
                                            }, {
                                                "match_phrase": {
                                                    "properties.grant.update.gid": req_gid
                                                }
                                            }]
                                        }
                                    }, {
                                        "bool": {
                                            "should": [{
                                                "match_phrase": {
                                                    "properties.grant.delete.uid": req_uid
                                                }
                                            }, {
                                                "match_phrase": {
                                                    "properties.grant.delete.gid": req_gid
                                                }
                                            }]
                                        }
                                    }]
                                }
                            }]
                        }
                    }
                };
                if (my_oldquery != null) {
                    query.query.bool.must.push(my_oldquery);
                }
            }
            if (source != undefined)
                params["_source"] = source;
            params["sort"] = sort;
            params["body"] = query;
            params["body"].size = size;
            //console.log('source', source);

            //    params["_source_includes"] = ["*"];
            //   params["_source_excludes"] = ["description"];
            //console.log(nameFile + ' | _search | params:', JSON.stringify(params));
            logger.info(nameFile + ' | _search | params :' + JSON.stringify(params));
            let cachedResponse = await redisClient.readCacheByKey(query, redisEnabled)
            if (cachedResponse && Object.keys(cachedResponse).length != 0) {
                return res.send(JSON.parse(cachedResponse.response))
            }
            client.search(params).then(function(resp) {
                if (err) {
                    console.error("ERROR | " + nameFile + ' | _search | search:', err);
                    logger.error(nameFile + ' | _search | search : ' + err);
                    ret.setSuccess(false);
                    ret.setExtraData({ "log": err.message });
                    ret.setMessages("Entity " + err.displayName);
                    return res.send(ret);
                }
                let msg = (resp.hits.total > 0) ? "List entities" : "Empty list";
                ret.setMessages(msg);
                if (resp.hits.total == 0)
                    return res.send(ret);
                const unique = [...new Set((resp.hits.hits).map(item => item._index))];


                //      var urlmodel = util.getServiceUrl("form") + "/api/v1/form/dettagliomodel";
                //  var urlmodel =   "http://localhost:8080/api/v1/form/";
                //         var myQueryModel = { "query": { "instance._index": unique } };
                let minmodelist = [];
                minmodelist = unique;
                /*  var config = {
                      method: 'get',
                      url: urlmodel,
                      headers: {
                          'dymeruser': hdymeruser,
                          "Referer": "http://localhost/",
                          'Content-Type': 'application/json',
                      },
                      data: myQueryModel
                  };
                  axios(config)
                      .then((respone) => {*/
                /*   let compr_struct = respone.data.data[0].structure;
                   console.log("unique", unique);
                   console.log("compr_struct", compr_struct);
                   console.log("resp.hits", resp.hits.hits);*/
                //console.log("recoverRelation", recoverRelation);
                if (recoverRelation == 'false' || recoverRelation == false) {
                    filertEntitiesFields(resp.hits.hits, minmodelist, hdymeruser).then(async function(nlist) {
                        // console.log("prepre", nlist);
                        //  ret.setData(nlist);
                        //  return res.send(ret);

                        for (var i = 0; i < nlist.length; i++) {
                            var source = nlist[i]._source;
                            delete nlist[i]._source;
                            for (var key in source) {
                                nlist[i][key] = source[key];
                            }
                        }
                        ret.setData(nlist);
                        //console.log(nameFile + ' | _search | resp no relations:', JSON.stringify(resp.hits.hits)); 
                        logger.info(nameFile + ' | _search | resp no relations: count:' + resp.hits.hits.length);
                        let ids = await redisClient.extractIds(ret, redisEnabled)
                        let indexes = await redisClient.extractIndexes(ret, redisEnabled)
                        await redisClient.writeCacheByKey(query, dymeruser.id, req.ip, JSON.stringify(ret), ids.toString(), indexes.toString(), global.configService.app_name, redisEnabled)
                        logger.info(nameFile + ' | _search | resp no relations: response cached  ');
                        return res.send(ret);
                    }).catch(function(err) {
                        console.error("ERROR | " + nameFile + ' | _search | checkUnionRelation:', err);
                        logger.error(nameFile + ' | _search | checkUnionRelation : ' + err);
                    });

                } else {
                    checkUnionRelation(resp.hits.hits).then(function(meatch) {

                        (meatch).map(item => item.relations).filter(
                            function(thing, i, arr) {
                                let cc = [...minmodelist, ...new Set((thing).map(item => item._index))];
                                minmodelist = cc.filter((item, pos) => cc.indexOf(item) === pos)
                            }
                        );
                        //console.log("Object.keys(filterRelationDymer).length", Object.keys(filterRelationDymer).length);
                        if (Object.keys(filterRelationDymer).length > 0) {
                            var fileterdList = [];
                            meatch.forEach(element => {
                                var append = false;
                                element.relations.forEach(listelement => {
                                    if (filterRelationDymer[listelement["_index"]] != undefined) {
                                        if (filterRelationDymer[listelement["_index"]].indexOf(listelement._id) >= 0) {
                                            append = true;
                                        }
                                    }
                                });
                                if (append)
                                    fileterdList.push(element);
                            });
                            filertEntitiesFields(fileterdList, minmodelist, hdymeruser).then(async function(nlist) {
                                //  console.log("prepre", nlist);
                                //console.log(nameFile + ' | _search | resp filter relations:count ', nlist.length);
                                logger.info(nameFile + ' | _search | resp filter relations:count ' + nlist.length);
                                ret.setData(nlist);
                                let ids = await redisClient.extractIds(ret, redisEnabled)
                                let indexes = await redisClient.extractIndexes(ret, redisEnabled)

                                await redisClient.writeCacheByKey(query, dymeruser.id, req.ip, JSON.stringify(ret), ids.toString(), indexes.toString(), global.configService.app_name, redisEnabled)
                                logger.info(nameFile + ' | _search | resp filter relations: response cached  ');
                                return res.send(ret);
                            }).catch(function(err) {
                                // console.log(nameFile + ' | _search | resp filter relations:count ', resp.hits.hits.length);
                                console.error("ERROR | " + nameFile + ' | _search | resp filter relations:count:', err);
                                logger.error(nameFile + ' | _search | resp filter relations count: ' + err);
                            });
                            /* ret.setData(fileterdList);
                             console.log(nameFile + ' | _search | resp filter relations:count ', resp.hits.hits.length);
                             return res.send(ret);*/
                        } else {
                            // ret.setData(meatch);
                            // console.log("resp.hits.hits", meatch)
                            //   const uniqueRel = (meatch).map(item => item.relations);

                            //console.log(' minmodelist ', minmodelist);
                            //console.log(nameFile + ' | _search | resp no detect relations:count ', resp.hits.hits.length);
                            logger.info(nameFile + ' | _search | resp no detected relations :count ' + resp.hits.hits.length);
                            filertEntitiesFields(meatch, minmodelist, hdymeruser).then(async function(nlist) {
                                //  console.log("prepre", nlist);
                                ret.setData(nlist);
                                let ids = await redisClient.extractIds(ret, redisEnabled)
                                let indexes = await redisClient.extractIndexes(ret, redisEnabled)

                                await redisClient.writeCacheByKey(query, dymeruser.id, req.ip, JSON.stringify(ret), ids.toString(), indexes.toString(), global.configService.app_name, redisEnabled)
                                logger.info(nameFile + ' | _search | resp no detected relations: response cached  ');
                                return res.send(ret);
                            }).catch(function(err) {
                                console.error("ERROR | " + nameFile + ' | _search | checkUnionRelation:', err);
                                logger.error(nameFile + ' | _search | checkUnionRelation: ' + err);
                            });
                            //   return res.send(ret);
                        }
                    }).catch(function(err) {
                        console.error("ERROR | " + nameFile + ' | _search | checkUnionRelation:', err);
                        logger.error(nameFile + ' | _search | checkUnionRelation: ' + err);
                    });
                }

                // })



            }).catch(function(error) {
                ret.setMessages("Search Error");
                ret.setSuccess(false);
                ret.setExtraData({ "log": error });
                return res.send(ret);
            });
        }
    });
});
var filertEntitiesFields = function(originalList, minmodelist, hdymeruser) {
    return new Promise(function(resolve, reject) {
        let dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
        //  console.log('originalList', originalList);
        if (dymeruser.roles.length > 1) {
            // console.log('filertEntitiesFields resolve >1');
            return resolve(originalList);

        }
        //  console.log('filertEntitiesFields resolve >1---continua');
        var urlmodel = util.getServiceUrl("form") + "/api/v1/form/dettagliomodel";
        var myQueryModel = { "query": { "instance._index": minmodelist } };
        var config = {
            method: 'get',
            url: urlmodel,
            headers: {
                'dymeruser': hdymeruser,
                "Referer": "http://localhost/",
                'Content-Type': 'application/json',
            },
            data: myQueryModel
        };
        //var rgx = /[.][0-9][.]/gm;
        var rgx = /[0-9]/gm;
        axios(config)
            .then((respone) => {
                let total_compr_struct = respone.data.data
                    // console.log("total_compr_struct", total_compr_struct);
                Promise.all(originalList.map(function(element) {
                    return new Promise(function(resolve, reject) {
                        let single_compr_struct = ((total_compr_struct).find(x => (x.instance).find(y => y._index == element._index)));
                        if (single_compr_struct.hasOwnProperty('structure')) {
                            let single_compr_struct_visibility = (single_compr_struct.structure.child).filter(x => x.attr['dymer-model-visibility'] == "private")
                                //   console.log("single_compr_struct_visibility", single_compr_struct_visibility);
                            single_compr_struct_visibility.forEach(singlel => {
                                let ark_del = replaceAll(singlel.attr.name, '[', '["');
                                ark_del = replaceAll(ark_del, ']', '"]');
                                ark_del = ark_del.replace("data", '');
                                let indexRgx = (singlel.attr.name).split("][").find(value => rgx.test(value));
                                if (indexRgx != undefined) {
                                    let listtest = [];
                                    for (let index = 0; index < 10; index++) {
                                        listtest.push(ark_del.replace('["0"]', index));
                                    }
                                    _.omit(element["_source"], listtest);
                                } else {
                                    _.unset(element["_source"], ark_del);
                                }
                            });
                            //console.log("filertEntitiesFields 1 element", JSON.stringify(element));
                            if (element.hasOwnProperty('relations')) {
                                Promise.all((element.relations).map(function(subelement) {
                                        return new Promise(function(resolve, reject) {
                                            let single_compr_struct = ((total_compr_struct).find(x => (x.instance).find(y => y._index == subelement._index)));
                                            // console.log('subelement single_compr_struct', single_compr_struct, subelement);

                                            if (_.get(single_compr_struct, 'structure')) {
                                                let single_compr_struct_visibility = (single_compr_struct.structure.child).filter(x => x.attr['dymer-model-visibility'] == "private")
                                                single_compr_struct_visibility.forEach(singlel => {
                                                    let ark_del = replaceAll(singlel.attr.name, '[', '["');
                                                    ark_del = replaceAll(ark_del, ']', '"]');
                                                    ark_del = ark_del.replace("data", '');
                                                    let indexRgx = (singlel.attr.name).split("][").find(value => rgx.test(value));
                                                    if (indexRgx != undefined) {
                                                        let listtest = [];
                                                        for (let index = 0; index < 20; index++) {
                                                            listtest.push(ark_del.replace('["0"]', index));
                                                        }
                                                        _.omit(subelement["_source"], listtest);
                                                    } else {
                                                        _.unset(subelement["_source"], ark_del);
                                                    }
                                                    /* var ark = replaceAll(singlel.attr.name, '[', '@@');
                                                     ark = replaceAll(ark, ']', '');
                                                     ark = ark.split("@@");
                                                     ark.shift();
                                                     let keydel = ark.join('.');
                                                     // console.log('singlekey 222', keydel);
                                                     delete subelement["_source"][keydel];*/
                                                });
                                                //console.log("filertEntitiesFields 2 subelement", JSON.stringify(subelement));
                                                resolve(subelement);
                                            } else {
                                                //console.log("filertEntitiesFields 2.1 subelement", JSON.stringify(subelement));
                                                resolve(subelement);
                                            }
                                        }).catch(function(err) {
                                            reject([]);
                                            console.error("ERROR | " + nameFile + ' | filertEntitiesFields subelement | promise  : ', err);
                                            logger.error(nameFile + ' | filertEntitiesFields subelement | promise 0 : ' + err);
                                        });
                                    }))
                                    .then(function(data) {
                                        //  console.log("filertEntitiesFields 3", JSON.stringify(data));
                                        resolve(data);
                                        //   return (data)
                                        // resolve(returnList);
                                    }).catch(function(err) {
                                        reject([]);
                                        console.error("ERROR | " + nameFile + ' | filertEntitiesFields | promise.all  : ', err);
                                        logger.error(nameFile + ' | filertEntitiesFields | promise.all 0: ' + err);
                                    });
                            } else {
                                //console.log("filertEntitiesFields 2.1 subelement", JSON.stringify(subelement));
                                resolve(element);
                            }
                        } else {
                            //console.log("filertEntitiesFields 2.1 subelement", JSON.stringify(subelement));
                            resolve(element);
                        }
                    }).catch(function(err) {
                        reject([]);
                        console.error("ERROR | " + nameFile + ' | filertEntitiesFields | promise 1 : ', err);
                        logger.error(nameFile + ' | filertEntitiesFields | promise : ' + err);
                    });
                })).then(function(data) {
                    //console.log("filertEntitiesFields 4", data);
                    return resolve(originalList);
                }).catch(function(err) {
                    reject([]);
                    console.error("ERROR | " + nameFile + ' | filertEntitiesFields | promise.all 1 : ', err);
                    logger.error(nameFile + ' | filertEntitiesFields | promise.all : ' + err);
                });
            });
    }).catch(function(err) {
        reject([]);
        console.error("ERROR | " + nameFile + ' | filertEntitiesFields | promise 2 : ', err);
        logger.error(nameFile + ' | filertEntitiesFields | promise  : ' + err);
    });
}

const retriveIndex_Query_ToSearch = (rulesindexquery, obj) => {
    //  var indextosearch = (typeof indextosearch === 'undefined') ? [] : indextosearch;
    if (typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
            var element = obj[key];
            if (Array.isArray(element)) {
                //console.log('is array');
                element.forEach(el => {
                    retriveIndex_Query_ToSearch(rulesindexquery, el);
                });
            } else {
                if (key == "bool") {
                    retriveIndex_Query_ToSearch(rulesindexquery, element);
                } else {
                    if (key == "should" || key == "must") {
                        retriveIndex_Query_ToSearch(rulesindexquery, element);
                    } else {
                        if (key == "term") {
                            // if (element.hasOwnProperty("_index"))
                            if (Object.prototype.hasOwnProperty.call(element, '_index')) {
                                rulesindexquery.indextosearch.push(element["_index"]);
                                rulesindexquery.query.push(element);
                            } else rulesindexquery.query.push(element);
                            // resolve(indextosearch);
                        }
                        if (key == "terms") {
                            rulesindexquery.indextosearch = rulesindexquery.indextosearch.concat(element["_index"]);
                            rulesindexquery.query.push(element);
                            //console.log('is terms', rulesindexquery);
                            // resolve(indextosearch); 
                        }
                        if (key == "wildcard" || key == "match") { //term match
                            rulesindexquery.query.push(element);
                            // resolve(indextosearch);
                        }
                    }
                }
            }
        });
        return rulesindexquery;
    } else {
        // console.log('obj!==object');
        // retriveIndex_Query_ToSearch3(indextosearch, obj);
    }
}

const retriveIndex_Query_ToSearch2 = (obj, indextosearch) => {
    return new Promise(async resolve => {
        var indextosearch = (typeof indextosearch === 'undefined') ? [] : indextosearch;
        if (typeof obj === 'object') {
            var list = [];
            Object.keys(obj).forEach(key => {
                var element = obj[key];
                if (key == "bool") {
                    list.push(retriveIndex_Query_ToSearch2(element, indextosearch));
                } else {
                    if (key == "should" || key == "must") {
                        list.push(retriveIndex_Query_ToSearch2(element, indextosearch));
                    } else {
                        if (key == "term") {
                            indextosearch.push(element["_index"]);
                            resolve(indextosearch);
                        }
                        if (key == "terms") {
                            indextosearch = element["_index"];
                            resolve(indextosearch);
                        }
                        if (key == "wildcard") {
                            indextosearch.push(element);
                            resolve(indextosearch);
                        }
                        resolve(indextosearch);
                    }
                }
            });
            Promise.all(list.map(function(entity) {
                return retriveIndex_Query_ToSearch2(entity, indextosearch);
            })).then(function(data) {
                console.log(data);
            });
        } else {
            var list = [];
            obj.forEach(element => {
                // list.push(retriveIndex_Query_ToSearch2(element, indextosearch));
                list.push(element);
            });
            Promise.all(list.map(function(entity) {
                return retriveIndex_Query_ToSearch2(entity, indextosearch);
            })).then(function(data) {
                console.log(data);
            });
        }
        resolve(indextosearch);
    })
}

function jsonToQueryString(json) {
    return '' +
        Object.keys(json).map(function(key) {
            var rt = "";
            if (Array.isArray(json[key])) {
                //  rt=(json[key]).join("&");
                var array_in = json[key];
                var out = new Array();
                for (var key2 in array_in) {
                    out.push(key + '=' + encodeURIComponent(array_in[key2]));
                }
                rt = out.join('&');
            } else {
                rt = encodeURIComponent(key) + '=' +
                    encodeURIComponent(json[key]);
            }
            return rt;
        }).join('&');
}

function jsonToQueryStringElastcQuery(json) {
    return '' +
        Object.keys(json).map(function(key) {
            var rt = "";
            if (Array.isArray(json[key])) {
                //  rt=(json[key]).join("&");
                var array_in = json[key];
                var out = new Array();
                for (var key2 in array_in) {
                    var arrnewValue = array_in[key2];
                    arrnewValue = (arrnewValue.charAt(0) == "*" && arrnewValue.charAt(arrnewValue.length - 1) == "*") ? arrnewValue.slice(1, -1) : arrnewValue;
                    out.push(key + '=' + encodeURIComponent(arrnewValue));
                }
                rt = out.join('&');
            } else {
                var newValue = json[key];
                newValue = (newValue.charAt(0) == "*" && newValue.charAt(newValue.length - 1) == "*") ? newValue.slice(1, -1) : newValue;
                rt = encodeURIComponent(key) + '=' +
                    encodeURIComponent(newValue);
            }
            return rt;
        }).join('&');
}

function parseDotNotation(str, val, obj) {
    var currentObj = obj,
        keys = str.split("."),
        i, l = Math.max(1, keys.length - 1),
        key;
    for (i = 0; i < l; ++i) {
        key = keys[i];
        currentObj[key] = currentObj[key] || {};
        currentObj = currentObj[key];
    }
    currentObj[keys[i]] = val;
    delete obj[str];
}

Object.expand = function(obj) {
    for (var key in obj) {
        if (key.indexOf(".") !== -1) {
            parseDotNotation(key, obj[key], obj);
        }
    }
    return obj;
};
const bridgeEsternalEntities = (objconf, callkey, datatosend, reqConfig, files) => {
    return new Promise((resolve, reject) => {
        var url = objconf.api[callkey].host;
        if (objconf.api[callkey].port != '')
            url += ":" + objconf.api[callkey].port;
        url += objconf.api[callkey].path;
        url = stringTemplateParser(url, datatosend);
        if (objconf.api[callkey].method == "GET") {
            if (reqConfig != undefined) {
                if (Object.prototype.hasOwnProperty.call(objconf.api[callkey], 'mapping')) {
                    var newObjQR = {};
                    (reqConfig.query).forEach(element => {
                        //  newObjQR = Object.assign({}, element, newObjQR);
                        Object.keys(element).forEach(function(elementk) {
                            // console.log(k + ' - ' + obj[k]);
                            var exsist = false;
                            Object.keys(newObjQR).forEach(function(newObjQRk) {
                                if (elementk == newObjQRk) exsist = true;
                            });
                            if (!exsist) {
                                newObjQR[elementk] = element[elementk];
                            } else {
                                if (Array.isArray(newObjQR[elementk])) {
                                    newObjQR[elementk].push(element[elementk]);
                                } else {
                                    newObjQR[elementk] = [newObjQR[elementk], element[elementk]];
                                }
                            }
                        });
                    });
                    /*    (reqConfig.query).forEach(element => {
                            newObjQR = Object.assign({}, element, newObjQR);
                        });*/
                    //qui 
                    newObjQR = Object.expand(newObjQR);
                    /* Object.keys(newObjQR).forEach(function(elementk) {
 
                     });*/
                    //console.log(nameFile + ' | bridgeEsternalEntities | GET | newObjQR:', JSON.stringify(newObjQR));
                    logger.info(nameFile + ' | bridgeEsternalEntities | GET | newObjQR :' + JSON.stringify(newObjQR));
                    jsonMapper(newObjQR, objconf.api[callkey].mapping.query).then((querypams) => {
                        console.log(nameFile + ' | bridgeEsternalEntities,jsonMapper | GET | querypams:', JSON.stringify(querypams));
                        var querypam = "";
                        querypam = jsonToQueryStringElastcQuery(querypams);
                        if (querypam != "") {
                            if (url.indexOf('?') < 0)
                                url += "?" + querypam;
                            else
                                url += "&" + querypam
                        }
                        //console.log(nameFile + ' | bridgeEsternalEntities | GET | url:', url);
                        logger.info(nameFile + ' | bridgeEsternalEntities | GET | url :' + url);
                        axios.get(url).then(resp => {
                            resolve(resp);
                        }).catch(function(error) {
                            // handle error
                            //console.error("ERROR | " + nameFile + ' | bridgeEsternalEntities | GET | axios:', error);
                            logger.error(nameFile + ' | bridgeEsternalEntities | GET | axios: ' + error);
                            reject("ERROR:" + objconf.api[callkey].method + " external error=" + error.response.status)
                        });

                    }).catch(function(error) {
                        console.error("ERROR | " + nameFile + ' | bridgeEsternalEntities,jsonMapper | GET :', error);
                        logger.error(nameFile + ' | bridgeEsternalEntities,jsonMapper | GET : ' + error);
                    });
                } else {
                    // console.log(nameFile + ' | bridgeEsternalEntities | GET | querypam Semplice url:', url);
                    logger.info(nameFile + ' | bridgeEsternalEntities | GET | querypam Semplice url :' + url);
                    axios.get(url).then(resp => {
                        resolve(resp);
                    }).catch(function(error) {
                        // handle error
                        console.error("ERROR | " + nameFile + ' | bridgeEsternalEntities | GET | querypam Semplice axios:', error);
                        logger.error(nameFile + ' | bridgeEsternalEntities | GET | querypam Semplice axios: ' + error);
                        reject("ERROR:" + objconf.api[callkey].method + " external error=" + error.response.status)
                    });
                }
            } else { //reqConfig != undefined
                // console.log(nameFile + ' | bridgeEsternalEntities | GET | reqConfig == undefined axios url:', url);
                logger.info(nameFile + ' | bridgeEsternalEntities | GET | reqConfig == undefined axios url :' + url);
                axios.get(url).then(resp => {
                    //console.log("GET external ok", resp.stats);
                    resolve(resp);
                }).catch(function(error) {
                    console.error("ERROR | " + nameFile + ' | bridgeEsternalEntities | GET | reqConfig == undefined axios url:', error);
                    logger.error(nameFile + ' | bridgeEsternalEntities | GET | reqConfig == undefined axios url: ' + error);
                    reject("ERROR:" + objconf.api[callkey].method + " external error=" + error.response.status)
                });
            }
        }
        if (objconf.api[callkey].method == "POST") {
            //console.log(nameFile + ' | bridgeEsternalEntities | POST | datatosend:', JSON.stringify(datatosend));
            logger.info(nameFile + ' | bridgeEsternalEntities | POST | datatosend:' + JSON.stringify(datatosend));
            let formdata = new FormData();
            appendFormdata(formdata, datatosend);
            let requests = files.map((fl) => {
                return recFile(mongoose.Types.ObjectId(fl.id)).then(function(result) {
                    /* var ark = replaceAll(element.fieldname, '[', '@@');
                     // element.id = (element.id).toString();
                     var temp_el = element;
                     delete element.fieldname;
                     ark = replaceAll(ark, ']', '');
                     ark = ark.split("@@");
                     ark.shift();
                     //   eval(delete element.fieldname);
                     stringAsKey(data, ark, element);*/
                    // let { buffer, originalname: filename } = result;
                    //formdata.append('file', buffer.data, { filename });
                    formdata.append('attachments', result.data, fl.filename);
                    gridFSBucket.delete(mongoose.Types.ObjectId(fl.id)).then(() => {
                        // console.log("Deleted " + fl.filename);
                    }).catch(function(err) {
                        console.error("ERROR | " + nameFile + ' | bridgeEsternalEntities | POST | delete  : ', err);
                        logger.error(nameFile + ' | bridgeEsternalEntities | POST | delete : ' + err);
                    });
                }).catch(function(err) {
                    console.error("ERROR | " + nameFile + ' | bridgeEsternalEntities | POST | recFile  : ', err);
                    logger.error(nameFile + ' | bridgeEsternalEntities | POST | recFile : ' + err);
                });
            })
            Promise.all(requests).then(() => {
                axios.post(url, formdata, {
                    headers: {
                        'Content-Type': `multipart/form-data; boundary=${formdata._boundary}`
                    }
                }).then((resp) => {
                    // console.log(nameFile + ' | bridgeEsternalEntities | POST | Promise.all success : ');
                    logger.info(nameFile + ' | bridgeEsternalEntities | POST | Promise.all success :');
                    resolve(resp);
                }).catch((err) => {
                    console.error("ERROR | " + nameFile + ' | bridgeEsternalEntities | POST | Promise.all error : ', err);
                    logger.error(nameFile + ' | bridgeEsternalEntities | POST | Promise.all error : ' + err);
                    reject("ERROR:" + objconf.api[callkey].method + " external error=" + error.response.status)
                })
            });
        }
        if (objconf.api[callkey].method == "PATCH") {
            //console.log(nameFile + ' | bridgeEsternalEntities | PATCH | axios url,datatosend:', url, JSON.stringify(datatosend));
            logger.info(nameFile + ' | bridgeEsternalEntities | PATCH | axios url,datatosend :' + JSON.stringify(datatosend));
            axios.post(url, datatosend).then(resp => {
                resolve(resp);
            }).catch(function(error) {
                // handle error
                console.error("ERROR | " + nameFile + ' | bridgeEsternalEntities | PATCH : ', error);
                logger.error(nameFile + ' | bridgeEsternalEntities | PATCH : ' + error);
                reject("ERROR:" + objconf.api[callkey].method + " external error=" + error.response.status)
            });
        }
        if (objconf.api[callkey].method == "PUT") {
            //console.log(nameFile + ' | bridgeEsternalEntities | PUT | axios url,datatosend:', url, JSON.stringify(datatosend));
            logger.info(nameFile + ' | bridgeEsternalEntities | PUT | axios url,datatosend :' + JSON.stringify(datatosend));
            axios.put(url, datatosend).then(resp => {
                resolve(resp);
            }).catch(function(error) {
                // handle error
                console.error("ERROR | " + nameFile + ' | bridgeEsternalEntities | PUT : ', error);
                logger.error(nameFile + ' | bridgeEsternalEntities | PUT : ' + error);
                reject("ERROR:" + objconf.api[callkey].method + " external error=" + error.response.status)
            });
        }
        if (objconf.api[callkey].method == "DELETE") {
            //console.log(nameFile + ' | bridgeEsternalEntities | DELETE | axios url,datatosend:', url, JSON.stringify(datatosend));
            logger.info(nameFile + ' | bridgeEsternalEntities | DELETE | axios url,datatosend :' + JSON.stringify(datatosend));
            axios.delete(url, { data: datatosend }).then(resp => {
                resolve(resp);
            }).catch(function(error) {
                // handle error
                console.error("ERROR | " + nameFile + ' | bridgeEsternalEntities | DELETE : ', error);
                logger.error(nameFile + ' | bridgeEsternalEntities | DELETE : ' + error);
                reject("ERROR:" + objconf.api[callkey].method + " external error=" + error.response.status)
            });
        }

    })
}
const jsonMappingExternalToDymerEntity = (obj, conf, calltype) => {
    return new Promise((resolve, reject) => {
        logger.info(nameFile + ' | jsonMappingExternalToDymerEntity |  conf.mapping.dentity["_source"]  :' + JSON.stringify(conf.mapping.dentity["_source"]));
        //console.log(nameFile + ' | jsonMappingExternalToDymerEntity |  conf.mapping.dentity["_source"] :', JSON.stringify(conf.mapping.dentity["_source"]));
        if (conf.api[calltype].hasOwnProperty("containerkey")) {
            if (conf.api[calltype]["containerkey"] != "") {
                obj = obj[conf.api[calltype]["containerkey"]];
            }
        }
        jsonMapper(obj, conf.mapping.dentity).then((result) => {
            logger.info(nameFile + ' | jsonMappingExternalToDymerEntity |  jsonMapper  :' + JSON.stringify(result));
            // console.log(nameFile + ' | jsonMappingExternalToDymerEntity | jsonMapper :', JSON.stringify(result));
            resolve(result);
        }).catch(function(error) {
            // handle error
            logger.error(nameFile + ' | jsonMappingExternalToDymerEntity | jsonMapper : ' + error);
            console.error("ERROR | " + nameFile + ' | jsonMappingExternalToDymerEntity | jsonMapper : ', error);
            reject("ERROR:jsonMappingExternalToDymerEntity error")
        });
    })
}
const jsonMappingDymerEntityToExternal = (obj, conf, calltype, files) => {
    return new Promise((resolve, reject) => {
        if (conf.api[calltype].hasOwnProperty("containerkey"))
            if (conf.api[calltype]["containerkey"] != "")
                obj = obj[conf.api[calltype]["containerkey"]];
        var templateObj = conf.mapping.extentity;
        if (conf.api[calltype].mapping != undefined) {
            var temp_parse = conf.api[calltype].mapping.extentity;
            if (temp_parse != undefined) {
                if (!(JSON.stringify(temp_parse.length) === JSON.stringify({}))) {
                    //           console.log("templateObjUSo api");
                    templateObj = temp_parse;
                }
            }
        }
        jsonMapper(obj, templateObj).then((result) => {
            logger.info(nameFile + ' | jsonMappingDymerEntityToExternal | jsonMapper :' + JSON.stringify(result));
            // console.log(nameFile + ' | jsonMappingDymerEntityToExternal | jsonMapper :', JSON.stringify(result));
            //  console.log("jsonMapper result", JSON.stringify(result));
            resolve(result);
        }).catch(function(error) {
            // handle error
            console.error("ERROR | " + nameFile + ' | jsonMappingDymerEntityToExternal | jsonMapper : ', error);
            logger.error(nameFile + ' | jsonMappingDymerEntityToExternal | jsonMapper : ' + error);
            reject("ERROR:jsonMappingDymerEntityToExternal error")
        });;
    })
}

router.post('/entitiesbridge', (req, res) => {
    var ret = new jsonResponse();
    bE.add(req.body).then(function(retdata) {
        // console.log(nameFile + ' | entitiesbridge | add :', JSON.stringify(retdata));
        logger.info(nameFile + ' | entitiesbridge | add :' + JSON.stringify(retdata));
        ret.setData(retdata.data);
        ret.setSuccess(retdata.success);
        ret.setMessages(retdata.msg);
        return res.send(ret);
    }).catch(function(err) {
        console.error("ERROR | " + nameFile + ' | entitiesbridge | add : ', err);
        logger.error(nameFile + ' | entitiesbridge | add : ' + err);
        ret.setSuccess(false);
        ret.setMessages("error add");
        return res.send(ret);
    });
});
router.put('/entitiesbridge/:id', (req, res) => {
    var ret = new jsonResponse();
    const id = req.params.id;
    bE.update(req.body, id).then(function(retdata) {
        //console.log(nameFile + ' | entitiesbridge | put :', JSON.stringify(retdata));
        logger.info(nameFile + ' | entitiesbridge | put :' + JSON.stringify(retdata));
        ret.setData(retdata.data);
        ret.setSuccess(retdata.success);
        ret.setMessages(retdata.msg);
        return res.send(ret);
    }).catch(function(err) {
        console.error("ERROR | " + nameFile + ' | entitiesbridge | put : ', err);
        logger.error(nameFile + ' | entitiesbridge | put : ' + err);
        ret.setSuccess(false);
        ret.setMessages("error edit");
        return res.send(ret);
    });
});
router.get('/entitiesbridge/:doevaljson', (req, res) => {
    var ret = new jsonResponse();
    var list = bE.getmappingList(req.params.doevaljson);
    ret.setData(list);
    return res.send(ret);
});
router.delete('/entitiesbridge/:id', (req, res) => {
    let id = req.params.id;
    var ret = new jsonResponse();

    logger.info(nameFile + ' | delete | /entitiesbridge/:id :' + id);
    bE.removeById(id).then(function(retdata) {
        logger.info(nameFile + ' | entitiesbridge | delete :' + JSON.stringify(retdata));
        ret.setSuccess(retdata.success);
        ret.setMessages(retdata.msg);
        return res.send(ret);
    }).catch(function(err) {
        console.error("ERROR | " + nameFile + ' | entitiesbridge | delete : ', err);
        logger.error(nameFile + ' | entitiesbridge | delete : ' + err);
        ret.setSuccess(false);
        ret.setMessages("error delete");
        return res.send(ret);
    });
});
const toFormData = (f => f(f))(h => f => f(x => h(h)(f)(x)))(f => fd => pk => d => {
    if (d instanceof Object) {
        Object.keys(d).forEach(k => {
            const v = d[k]
            if (pk) k = `${pk}[${k}]`
            if (v instanceof Object && !(v instanceof Date) && !(v instanceof File)) {
                return f(fd)(k)(v)
            } else {
                fd.append(k, v)
            }
        })
    }
    return fd
})(new FormData())()

function appendFormdata(FormData, data, name) {
    name = name || '';
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


router.post('/:enttype', function(req, res) {

    var ret = new jsonResponse();
    const hdymeruser = req.headers.dymeruser;
    const dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
    let dymerextrainfo = dymeruser.extrainfo;
    //console.log("dymeruser", dymeruser);
    // var dymerextrainfo = req.headers.extrainfo;
    /*if (dymerextrainfo != undefined && dymerextrainfo != "null" && dymerextrainfo != null) {
        dymerextrainfo = JSON.parse(Buffer.from(req.headers.extrainfo, 'base64').toString('utf-8'));
    } else {
        dymerextrainfo = undefined;
    } */
    let urs_uid = dymeruser.id;
    let urs_gid = dymeruser.gid;
    /* if (dymerextrainfo != undefined)
         urs_gid = dymerextrainfo.extrainfo.groupId;*/
    if (dymerextrainfo != undefined)
        urs_gid = dymerextrainfo.groupId;
    var hasperm = false;
    var act = "create";
    var index = req.params.enttype;
    var queryString = "";
    let asis = false;
    if (dymeruser.roles.indexOf("app-admin") > -1) {
        hasperm = true;
    }
    if ((dymeruser.roles.indexOf("app-admin") > -1) || (dymeruser.roles.indexOf("app-adapter") > -1)) {
        asis = true;
    }
    queryString = "?role[]=" + dymeruser.roles.join("&role[]=");
    var url = util.getServiceUrl("dservice") + "/api/v1/perm/entityrole/";
    url += act + "/";
    url += index + "/";
    url += queryString;
    // console.log(nameFile + ' | /:enttype | create | dymeruser:', JSON.stringify(dymeruser));
    axios.get(url)
        .then((response) => {
            // console.log(nameFile + ' | /:enttype | create | permission create:', JSON.stringify(response.data.data.result));
            logger.info(nameFile + ' | /:enttype | create | permission create:' + JSON.stringify(response.data.data.result));
            if (response.data.data.result || hasperm) {
                upload(req, res, function(err) {
                    if (err) {
                        console.error("ERROR | " + nameFile + ' | /:enttype | create | upload:', err);
                        logger.error(nameFile + ' | /:enttype | create | upload : ' + err);
                        ret.setMessages("Upload Error");
                        ret.setSuccess(false);
                        ret.setExtraData({ "log": err.stack });
                        return res.send(ret);
                    }
                    try {
                        let callData = util.getAllQuery(req);
                        let instance = callData.instance;
                        let elIndex = instance.index;
                        let elDymerUuid = instance.id;
                        let data = callData.data;
                        //External
                        var globalData = req.body;
                        var trq = Object.assign({}, req);
                        var bridgeConf = bE.findByIndex(elIndex);
                        // console.log(nameFile + ' | /:enttype | create | bridgeConf:', JSON.stringify(bridgeConf));
                        logger.info(nameFile + ' | /:enttype | create | bridgeConf:' + JSON.stringify(bridgeConf));
                        if (bridgeConf != undefined) {
                            if (trq.files != undefined) {
                                trq.files.forEach(function(element) {
                                    var ark = replaceAll(element.fieldname, '[', '@@');
                                    delete element.fieldname;
                                    ark = replaceAll(ark, ']', '');
                                    ark = ark.split("@@");
                                    ark.shift();
                                    stringAsKey(globalData.data, ark, element);
                                });
                            }
                            jsonMappingDymerEntityToExternal(globalData, bridgeConf, "create", req.files).then(function(mapdata) {
                                bridgeEsternalEntities(bridgeConf, "create", mapdata, undefined, req.files).then(function(callresp) {
                                    //console.log(nameFile + ' | /:enttype | create | bridgeEsternalEntities: ', JSON.stringify(mapdata), JSON.stringify(callresp.data));
                                    logger.info(nameFile + ' | /:enttype | create | bridgeEsternalEntities:' + JSON.stringify(mapdata) + " , " + JSON.stringify(callresp.data));
                                    ret.setData(callresp.data);
                                    ret.setMessages("Entity Creted successfully");
                                    return res.send(ret);
                                }).catch(function(error) {
                                    console.error("ERROR | " + nameFile + ' | /:enttype | create | bridgeEsternalEntities:', error);
                                    logger.error(nameFile + ' | /:enttype | create | bridgeEsternalEntities: ' + error);
                                    ret.setSuccess(false);
                                    ret.setMessages("Entity Create Problem");
                                    return res.send(ret);
                                });
                            }).catch(function(error) {
                                console.error("ERROR | " + nameFile + ' | /:enttype | create | jsonMappingDymerEntityToExternal:', error);
                                logger.error(nameFile + ' | /:enttype | create | jsonMappingDymerEntityToExternal: ' + error);
                                ret.setSuccess(false);
                                ret.setMessages("Entity Mapping Problem");
                                return res.send(ret);
                            });
                        } else {
                            //fine externale
                            var files_arr = [];
                            var label_index = -1;
                            //  console.log('reqfile', req.files);
                            if (req.files != undefined) {
                                req.files.forEach(function(element) {
                                    var ark = replaceAll(element.fieldname, '[', '@@');
                                    var temp_el = element;
                                    delete element.fieldname;
                                    ark = replaceAll(ark, ']', '');
                                    ark = ark.split("@@");
                                    ark.shift();
                                    stringAsKey(data, ark, element);
                                });
                            }
                            //  logger.info("predata" + JSON.stringify(data));
                            logger.info(nameFile + ' | /:enttype | create | predata :' + JSON.stringify(data));
                            //       if (!((JSON.parse(data.properties)).hasOwnProperty("owner") && asis)) {
                            if (!(data.properties.owner != undefined && asis)) {
                                data.properties.owner = {};
                                data.properties.owner.uid = urs_uid;
                                data.properties.owner.gid = urs_gid;
                                data.properties.lang = "und";
                                data.properties.tid = "0";
                                data.properties.created = new Date().toISOString();
                                data.properties.changed = new Date().toISOString();
                            }
                            if (elDymerUuid == undefined) {
                                instance.id = util.generateDymerUuid();
                            }
                            let params = (instance) ? instance : {};
                            params["body"] = data;
                            // params["body"].size = 10000;
                            params["refresh"] = true;
                            let ref = Object.assign({}, data.relation);
                            if (data != undefined)
                                delete data.relation;
                            // console.log(nameFile + ' | /:enttype | create | params:', dymeruser.id, JSON.stringify(params));
                            logger.info(nameFile + ' | /:enttype | create | params :' + dymeruser.id + " , " + JSON.stringify(params));
                            client.index(params, async function(err, resp, status) {
                                if (err) {
                                    console.error("ERROR | " + nameFile + ' | /:enttype | create:', err);
                                    logger.error(nameFile + ' | /:enttype | create : ' + err);
                                    ret.setSuccess(false);
                                    ret.setExtraData({ "log": resp });
                                    ret.setMessages("Entity creation error");
                                    return res.send(ret);
                                }
                                var respResult = resp.result;
                                ret.setMessages("Entity " + respResult + " successfully");
                                ret.addData(resp);
                                //   console.log('new ent ', resp);
                                var elId = resp["_id"];
                                logger.info(nameFile + ' | /:enttype | create | dymeruser.id, params:' + dymeruser.id + ' , ' + JSON.stringify(params));
                                logger.info(nameFile + ' | /:enttype | create | ref, elIndex, elId:' + JSON.stringify(ref) + ' , ' + elIndex + ' , ' + elId);
                                try {
                                    checkRelation(ref, elIndex, elId);
                                } catch (error) {
                                    logger.error(nameFile + ' | /:enttype | create | checkRelation:' + error);
                                }

                                /* var extraInfo = dymerextrainfo;
                                 if (extraInfo != undefined)
                                     extraInfo.extrainfo.emailAddress = dymeruser.id;*/
                                // console.log(nameFile + ' | /:enttype | create | pre check hook extraInfo: ', dymerextrainfo);
                                logger.info(nameFile + ' | /:enttype | create | pre check hook| obj, extraInfo:' + JSON.stringify(resp) + ' , ' + JSON.stringify(dymerextrainfo));
                                setTimeout(() => {
                                    checkServiceHook('after_insert', resp, dymerextrainfo, req);
                                }, 3000);

                                await redisClient.invalidateCacheByIndex(ret.data[0]._index, redisEnabled)
                                return res.send(ret);
                            });
                        }
                    } catch (error) {
                        console.error("ERROR | " + nameFile + ' | /:enttype | core:', error);
                        logger.error(nameFile + ' | /:enttype | core : ' + error);
                        ret.setMessages("ERROR create");
                        res.status(200);
                        ret.setSuccess(false);
                        return res.send(ret);
                    }
                });
            } else {
                ret.setMessages("No permission");
                res.status(200);
                ret.setSuccess(false);
                return res.send(ret);
            }
        }, (error) => {
            console.error("ERROR | " + nameFile + ' | /:enttype | permission:', error);
            logger.error(nameFile + ' | /:enttype | permission : ' + error);
            ret.setMessages("No permission");
            res.status(200);
            ret.setSuccess(false);
            return res.send(ret);
        });
});
router.put('/update/:id', (req, res) => {
    var ret = new jsonResponse();
    const hdymeruser = req.headers.dymeruser
    const dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
    let dymerextrainfo = dymeruser.extrainfo;
    const urs_uid = dymeruser.id;
    let urs_gid = dymeruser.gid;
    if (dymerextrainfo != undefined)
        urs_gid = dymerextrainfo.groupId;
    let asis = false;
    if ((dymeruser.roles.indexOf("app-admin") > -1) || (dymeruser.roles.indexOf("app-adapter") > -1)) {
        asis = true;
    }
    let rfrom = (req.headers["reqfrom"]).replace("http://", "").replace("https://", "").replace("/", "");
    //var url = util.getServiceUrl("dservice") + "/api/dservice/api/v1/fwadapter/configs";
    var url = util.getServiceUrl("dservice") + "/api/v1/fwadapter/configs";
    //   '/api/dservice/api/v1/fwadapter/configs'
    // axios.post(url_dservice + '/api/v1/servicehook/checkhook', { data: postObj, "extraInfo": extraInfo }, {
    //     headers: headers
    //  })

    // let par = { "query": { "servicetype": { "$ne": "general" } } };
    let par = { "query": { "servicetype": "update" } };

    //console.log("INFO | " + nameFile + " | url :", url);
    // console.log("INFO | " + nameFile + " | par :", par, rfrom);
    logger.info(nameFile + ' | /update/:id url:' + url);
    logger.info(nameFile + ' | /update/:id par:' + par + " , " + rfrom);
    //axios.get(url, {})
    axios.get(url, {
            "params": par
        })
        .then((optresp) => {

            let entry = optresp.data.data[0];
            //console.log("INFO | " + nameFile + " | optresp :", entry);
            logger.info(nameFile + ' | /update/:id |optresp:' + JSON.stringify(entry));
            // console.log("INFO | " + nameFile + " | entry.configuration.host :", entry.configuration.host, (entry.configuration.host).includes(rfrom));
            // logger.info(nameFile + ' | /update/:id | entry.configuration.host:' + JSON.stringify(entry)); 
            //  optresp.data.data.forEach(function(entry) {
            if ((entry.configuration.host).includes(rfrom)) {
                let listRel = [];
                if (entry.configuration.hasOwnProperty("relations")) {
                    listRel = entry.configuration.relations.split(",");
                }
                //aaaaaaaaaaa
                upload(req, res, function(err) {
                    if (err) {
                        console.error("ERROR | " + nameFile + ' | /:id | put | upload:', err);
                        logger.error(nameFile + ' | /update/:id | put | upload : ' + err);
                        ret.setMessages("Upload Error");
                        ret.setSuccess(false);
                        ret.setExtraData({ "log": err.stack });
                        return res.send(ret);
                    }
                    var id = req.params.id;
                    var callData = util.getAllQuery(req);
                    var instance = callData.instance;
                    var data = callData.data;
                    var params = (instance) ? instance : {};
                    var editValues = data;
                    let elIndex = instance.index;
                    var ref = {};
                    //  console.log("INFO | " + nameFile + " | data :", JSON.stringify(editValues), listRel);
                    logger.info(nameFile + ' | /update/:id | data,listRel :' + JSON.stringify(editValues) + " , " + JSON.stringify(listRel));
                    if (editValues.relation != undefined) {
                        //  ref = {};
                        listRel.forEach(value => {
                                for (var myKey in editValues.relation) {
                                    for (var elre in editValues.relation[myKey]) {
                                        ref[myKey] = editValues.relation[myKey];
                                    }
                                }
                                /*console.log("INFO | " + nameFile + " | value :", editValues.relation.dih[0], value);
                                if ((editValues.relation).hasOwnProperty(value)) {
                                    ref[value] = editValues.relation[value];
                                }*/
                            })
                            //ref = Object.assign({}, editValues.relation);
                        delete editValues.relation;
                    }
                    let _relationtodelete = [];
                    listSingleRelation(id).then(function(oldrelation) {
                        //console.log('oldrelation', oldrelation);
                        logger.info(nameFile + ' | /update/:id | oldrelation:' + JSON.stringify(oldrelation));
                        // let oldFilteredrelation=[];
                        oldrelation.forEach(function(relel, index) {
                            //     console.log("Relation relel", relel);    
                            if (relel._source["_id1"] == id) {
                                if (listRel.includes(relel._source["_index2"])) {
                                    if (ref.hasOwnProperty([relel._source["_index2"]])) {
                                        if (!ref[relel._source["_index2"]].includes(relel._source["_id2"])) {
                                            _relationtodelete.push(relel._source["_id2"]);
                                        }
                                    }

                                    // oldFilteredrelation.push(relel._source["_id2"]);
                                }
                            }
                            if (relel._source["_id2"] == id) {
                                if (listRel.includes(relel._source["_index1"])) {
                                    if (ref.hasOwnProperty([relel._source["_index1"]])) {
                                        if (!ref[relel._source["_index1"]].includes(relel._source["_id1"])) {
                                            _relationtodelete.push(relel._source["_id1"]);
                                        }
                                    }

                                    //oldFilteredrelation.push(relel._source["_id1"]);
                                }
                            }
                        });
                        let parmquery = {};
                        parmquery["body"] = {
                            "query": {
                                "match": {
                                    "_id": id
                                }
                            }
                        };
                        parmquery["body"].size = 10000;
                        client.search(parmquery).then(function(resp) {
                            resp["hits"].hits.forEach((element) => {
                                var oldElement = element;
                                //console.log('oldElement', oldElement);
                                //console.log('_relationtodelete', _relationtodelete);
                                logger.info(nameFile + ' | /update/:id | oldElement:' + JSON.stringify(oldElement));
                                logger.info(nameFile + ' | /update/:id | _relationtodelete:' + JSON.stringify(_relationtodelete));
                                var elId = oldElement["_id"];
                                if (_relationtodelete.length > 0) {
                                    //console.log(nameFile + ' | /:id | put | id,deleted relations :', id, JSON.stringify(_relationtodelete));
                                    logger.info(nameFile + ' |  /update/:id | put | id,deleted relations :' + dymeruser.id + ' , ' + id + ' , ' + JSON.stringify(_relationtodelete));
                                    _relationtodelete.forEach(function(entry) {
                                        deleteRelation(elId, entry);
                                    });

                                }
                                if (ref != undefined) {
                                    checkRelation(ref, oldElement._index, elId);
                                }
                                var new_Temp_Entity = extend({}, oldElement);;
                                // console.log("new_Temp_Entity", new_Temp_Entity);
                                new_Temp_Entity._source = editValues;
                                // console.log("new_Temp_Entity2", new_Temp_Entity);
                                new_Temp_Entity._source.properties = extend(oldElement._source.properties, editValues.properties);
                                if (req.files != undefined)
                                    req.files.forEach(function(el) {
                                        var ark = replaceAll(el.fieldname, '[', '@@');
                                        var temp_el = el;
                                        delete el.fieldname;
                                        ark = replaceAll(ark, ']', '');
                                        ark = ark.split("@@");
                                        ark.shift();
                                        stringAsKey(new_Temp_Entity._source, ark, el);
                                    });
                                new_Temp_Entity._source.properties.changed = new Date().toISOString();
                                var params_del = {};
                                params_del["id"] = new_Temp_Entity["_id"];
                                params_del["index"] = new_Temp_Entity._index;
                                params_del["type"] = new_Temp_Entity._type;
                                // params_del["refresh"] = 'true';
                                client.delete(params_del).then(function(resp) {
                                    client.index({
                                        index: new_Temp_Entity._index,
                                        type: new_Temp_Entity._type,
                                        id: new_Temp_Entity["_id"],
                                        body: new_Temp_Entity._source,
                                        refresh: 'true'
                                    }).then(async function(resp) {
                                        //console.log(nameFile + ' | /:id | put | updated :', id, JSON.stringify(resp));
                                        logger.info(nameFile + ' | /:id | put | updated dymeruser.id, id, enity :' + dymeruser.id + ' , ' + id + ' , ' + JSON.stringify(new_Temp_Entity));
                                        logger.info(nameFile + ' | /:id | put | updated dymeruser.id, id, _relationtodeleted :' + dymeruser.id + ' , ' + id + ' , ' + JSON.stringify(_relationtodelete));
                                        ret.setMessages("Updated!");
                                        var objHook = new_Temp_Entity;
                                        /* var extraInfo = dymerextrainfo;
                                         if (extraInfo != undefined)
                                             extraInfo.extrainfo.emailAddress = dymeruser.id;*/
                                        //console.log(nameFile + ' | /:id | put | pre check hook id,extraInfo: ', id, JSON.stringify(dymerextrainfo));
                                        logger.info(nameFile + ' | /:id | put | pre check hook| obj, extraInfo:' + dymeruser.id + ' , ' + JSON.stringify(objHook) + ' , ' + JSON.stringify(dymerextrainfo));
                                        checkServiceHook('after_update', objHook, dymerextrainfo, req);
                                        await redisClient.invalidateCacheById(id, redisEnabled)
                                        return res.send(ret);
                                    }).catch(function(err) {
                                        console.error("ERROR | " + nameFile + ' | /:id | put | id: ', id, err);
                                        logger.error(nameFile + '| /:id | put | id, entity:' + dymeruser.id + ' , ' + id + ' , ' + JSON.stringify(new_Temp_Entity));
                                        ret.setSuccess(false);
                                        ret.setMessages("Error Updated!");
                                        return res.send(ret);
                                    });
                                }).catch(function(err) {
                                    console.error("ERROR | " + nameFile + ' | /:id | put | delete: ', id, err);
                                    logger.error(nameFile + '|  /:id | put | delete:' + id + ' , ' + err);
                                    ret.setSuccess(false);
                                    ret.setMessages("Error Updated!");
                                    return res.send(ret);
                                });
                            });
                        }).catch(function(err) {
                            console.error("ERROR | " + nameFile + ' | /:id | put | delete search: ', id, err);
                            logger.error(nameFile + '|  /:id | put | delete search:' + id + ' , ' + err);
                            ret.setSuccess(false);
                            ret.setMessages("Error Updated!");
                            return res.send(ret);
                        });
                    });

                    /* var _split = data.todelete;
                     var _todeleteObj = data.todeleteObj;
                     if (_split != undefined) {
                         _split.forEach(function(entry) {
                             recFile(mongoose.Types.ObjectId(entry)).then(function(result) {
                                     gridFSBucket.delete(mongoose.Types.ObjectId(entry)).then(() => {
                                             console.log(nameFile + ' | /:id | put | deleted Attachments :', entry);
                                         })
                                         .catch(function(err) {
                                             console.error("ERROR | " + nameFile + ' | /:id | put | deleted Attachments :', err);
                                         });
                                 })
                                 .catch(function(err) {
                                     console.error("ERROR | " + nameFile + ' | /:id | put | recFile :', err);
                                     //  res.end("");
                                 });
                         });
                         delete editValues.todelete;
                         delete editValues.todeleteObj;
                     }*/

                });
            } else {
                ret.setMessages("not include rule");
                ret.setSuccess(false);
                return res.send(ret)
            }
            // });
        }, (error) => {
            console.error("ERROR | " + nameFile + ' | /:enttype | permission:', error);
            logger.error(nameFile + '| /:enttype | permission:' + error);
            ret.setMessages("No permission");
            res.status(200);
            ret.setSuccess(false);
            return res.send(ret);
        });
});
router.put('/:id', (req, res) => {
    var ret = new jsonResponse();
    const hdymeruser = req.headers.dymeruser
    const dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
    //var dymerextrainfo = req.headers.extrainfo;
    const dymerextrainfo = dymeruser.extrainfo;
    /*if (dymerextrainfo != undefined && dymerextrainfo != "null" && dymerextrainfo != null) {
        dymerextrainfo = JSON.parse(Buffer.from(req.headers.extrainfo, 'base64').toString('utf-8'));
    } else {
        dymerextrainfo = undefined;
    }*/
    const urs_uid = dymeruser.id;
    let urs_gid = dymeruser.gid;
    if (dymerextrainfo != undefined)
        urs_gid = dymerextrainfo.groupId;
    /*if (dymerextrainfo != undefined)
        urs_gid = dymerextrainfo.extrainfo.groupId;*/
    upload(req, res, function(err) {
        if (err) {
            console.error("ERROR | " + nameFile + ' | /:id | put | upload:', err);
            logger.error(nameFile + '| /:id | put | upload:' + err);
            ret.setMessages("Upload Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
        var id = req.params.id;
        var callData = util.getAllQuery(req);
        var instance = callData.instance;
        var data = callData.data;
        var params = (instance) ? instance : {};
        var editValues = data;
        let elIndex = instance.index;
        var bridgeConf = bE.findByIndex(elIndex);
        //console.log(nameFile + ' | /:id | put | bridgeConf:', JSON.stringify(bridgeConf));
        logger.info(nameFile + ' | /:id | put | bridgeConf :' + JSON.stringify(bridgeConf));
        if (bridgeConf != undefined) {
            var globalData = callData;
            jsonMappingDymerEntityToExternal(globalData, bridgeConf, "update").then(function(mapdata) {
                //  console.log("jsonMapper FINALE", JSON.stringify(mapdata));
                bridgeEsternalEntities(bridgeConf, "update", mapdata).then(function(callresp) {
                    //console.log(nameFile + ' | /:id | put | bridgeEsternalEntities: ', JSON.stringify(mapdata), JSON.stringify(callresp.data));
                    logger.info(nameFile + ' | /:id | put | bridgeEsternalEntities :' + JSON.stringify(mapdata) + " , " + JSON.stringify(callresp.data));
                    ret.setData(callresp.data);
                    ret.setMessages("Entity Edited successfully");
                    return res.send(ret);
                }).catch(function(error) {
                    console.error("ERROR | " + nameFile + ' | /:id | put | bridgeEsternalEntities:', error);
                    logger.error(nameFile + ' | /:id | put | bridgeEsternalEntities: ' + error);
                    ret.setSuccess(false);
                    ret.setMessages("Entity Edit Problem");
                    return res.send(ret);
                });
            }).catch(function(error) {
                console.error("ERROR | " + nameFile + ' | /:id | put | jsonMappingDymerEntityToExternal:', error);
                logger.error(nameFile + ' | /:id | put | jsonMappingDymerEntityToExternal: ' + error);
                ret.setSuccess(false);
                ret.setMessages("Entity Edit Problem");
                return res.send(ret);
            });
        } else {
            let paramsCheck = {};
            paramsCheck["body"] = {
                "query": {
                    "match": {
                        "_id": id
                    }
                }
            };
            paramsCheck["body"].size = 10000;
            client.search(paramsCheck).then(function(respCheck) {
                if ((respCheck["hits"].hits).length > 0) {
                    var checkElemPerm = respCheck["hits"].hits[0]._source.properties;
                    let harpermEdit = false;
                    if (checkElemPerm.owner.uid == urs_uid || dymeruser.roles.indexOf("app-admin") > -1)
                        harpermEdit = true;
                    if (checkElemPerm.grant != undefined) {
                        if (checkElemPerm.grant.update != undefined) {
                            if ((checkElemPerm.grant.update.uid).find(x => x == urs_uid)) {
                                harpermEdit = true;
                            }
                        }
                    }
                    //console.log(nameFile + ' | /:id | put | permission update:', dymeruser.id, id, harpermEdit);
                    logger.info(nameFile + ' | /:id | put | permission update | dymeruser.id, id, harpermEdit:' + dymeruser.id + ' , ' + id + ' , ' + harpermEdit);
                    if (harpermEdit) {
                        var ref = undefined;
                        if (editValues.relation != undefined) {
                            ref = Object.assign({}, editValues.relation);
                            delete editValues.relation;
                        }
                        //console.log('editValues.relationtodelete', editValues.relationtodelete);
                        logger.info(nameFile + ' | /:id | put | editValues.relationtodelete :' + JSON.stringify(editValues.relationtodelete));
                        var _relationtodelete = undefined;
                        if (editValues.relationtodelete != undefined) {
                            _relationtodelete = (editValues.relationtodelete).slice();
                            //_relationtodelete = Object.assign({}, editValues.relationtodelete);
                            delete editValues.relationtodelete;
                        }
                        if (_relationtodelete == undefined) _relationtodelete = [];

                        var _split = data.todelete;
                        var _todeleteObj = data.todeleteObj;
                        if (_split != undefined) {
                            _split.forEach(function(entry) {
                                recFile(mongoose.Types.ObjectId(entry)).then(function(result) {
                                        gridFSBucket.delete(mongoose.Types.ObjectId(entry)).then(() => {
                                                //console.log(nameFile + ' | /:id | put | deleted Attachments :', entry);
                                                logger.info(nameFile + ' | /:id | put | deleted Attachments :' + entry);
                                            })
                                            .catch(function(err) {
                                                console.error("ERROR | " + nameFile + ' | /:id | put | deleted Attachments :', err);
                                                logger.error(nameFile + ' | /:id | put | deleted Attachments : ' + err);
                                            });
                                    })
                                    .catch(function(err) {
                                        console.error("ERROR | " + nameFile + ' | /:id | put | recFile :', err);
                                        logger.error(nameFile + ' | /:id | put | recFile : ' + err);
                                        //  res.end("");
                                    });
                            });
                            delete editValues.todelete;
                            delete editValues.todeleteObj;
                        }
                        params["body"] = {
                            "query": {
                                "match": {
                                    "_id": id
                                }
                            }
                        };
                        params["body"].size = 10000;
                        client.search(params).then(function(resp) {
                            resp["hits"].hits.forEach((element) => {
                                var oldElement = element;
                                listSingleRelation(id).then(function(oldrelation) {
                                    if (ref != undefined) {
                                        oldrelation.forEach(function(relel, index) {
                                            //     console.log("Relation relel", relel);    
                                            if (relel._source["_id1"] == id) {
                                                if (ref.hasOwnProperty([relel._source["_index2"]])) {
                                                    if (!ref[relel._source["_index2"]].includes(relel._source["_id2"])) {
                                                        _relationtodelete.push(relel._source["_id2"]);
                                                    }
                                                }
                                            }
                                            if (relel._source["_id2"] == id) {
                                                if (ref.hasOwnProperty([relel._source["_index1"]])) {
                                                    if (!ref[relel._source["_index1"]].includes(relel._source["_id1"])) {
                                                        _relationtodelete.push(relel._source["_id1"]);
                                                    }
                                                }
                                                //oldFilteredrelation.push(relel._source["_id1"]);
                                            }
                                        });
                                    }
                                    var elId = oldElement["_id"];
                                    if (_relationtodelete.length > 0) {
                                        // console.log(nameFile + ' | /:id | put | id,deleted relations :', id, JSON.stringify(_relationtodelete));
                                        logger.info(nameFile + ' | /:id | put | id,deleted relations :' + dymeruser.id + ' , ' + id + ' , ' + JSON.stringify(_relationtodelete));
                                        _relationtodelete.forEach(function(entry) {
                                            deleteRelation(elId, entry);
                                        });
                                    }
                                    if (ref != undefined) {
                                        checkRelation(ref, oldElement._index, elId);
                                    }
                                    var new_Temp_Entity = extend({}, oldElement);;
                                    // console.log("new_Temp_Entity", new_Temp_Entity);
                                    new_Temp_Entity._source = editValues;
                                    // console.log("new_Temp_Entity2", new_Temp_Entity);
                                    new_Temp_Entity._source.properties = extend(oldElement._source.properties, editValues.properties);
                                    if (req.files != undefined)
                                        req.files.forEach(function(el) {
                                            var ark = replaceAll(el.fieldname, '[', '@@');
                                            var temp_el = el;
                                            delete el.fieldname;
                                            ark = replaceAll(ark, ']', '');
                                            ark = ark.split("@@");
                                            ark.shift();
                                            stringAsKey(new_Temp_Entity._source, ark, el);
                                        });
                                    new_Temp_Entity._source.properties.changed = new Date().toISOString();
                                    var params_del = {};
                                    params_del["id"] = new_Temp_Entity["_id"];
                                    params_del["index"] = new_Temp_Entity._index;
                                    params_del["type"] = new_Temp_Entity._type;
                                    // params_del["refresh"] = 'true';
                                    client.delete(params_del).then(function(resp) {
                                        client.index({
                                            index: new_Temp_Entity._index,
                                            type: new_Temp_Entity._type,
                                            id: new_Temp_Entity["_id"],
                                            body: new_Temp_Entity._source,
                                            refresh: 'true'
                                        }).then(async function(resp) {
                                            // console.log(nameFile + ' | /:id | put | updated :', id, JSON.stringify(resp));
                                            logger.info(nameFile + ' | /:id | put | updated dymeruser.id, id, enity :' + dymeruser.id + ' , ' + id + ' , ' + JSON.stringify(new_Temp_Entity));
                                            logger.info(nameFile + ' | /:id | put | updated dymeruser.id, id, _relationtodelete :' + dymeruser.id + ' , ' + id + ' , ' + JSON.stringify(_relationtodelete));
                                            ret.setMessages("Updated!");
                                            var objHook = new_Temp_Entity;
                                            /* var extraInfo = dymerextrainfo;
                                             if (extraInfo != undefined)
                                                 extraInfo.extrainfo.emailAddress = dymeruser.id;*/
                                            // console.log(nameFile + ' | /:id | put | pre check hook id,extraInfo: ', id, JSON.stringify(dymerextrainfo));
                                            logger.info(nameFile + ' | /:id | put | pre check hook| obj, extraInfo:' + dymeruser.id + ' , ' + JSON.stringify(objHook) + ' , ' + JSON.stringify(dymerextrainfo));
                                            checkServiceHook('after_update', objHook, dymerextrainfo, req);
                                            await redisClient.invalidateCacheById(id, redisEnabled)
                                            return res.send(ret);
                                        }).catch(function(err) {
                                            console.error("ERROR | " + nameFile + ' | /:id | put | id: ', id, err);
                                            logger.error(nameFile + '| /:id | put | id, entity:' + dymeruser.id + ' , ' + id + ' , ' + JSON.stringify(new_Temp_Entity) + " , " + err);
                                            ret.setSuccess(false);
                                            ret.setMessages("Error Updated!");
                                            return res.send(ret);
                                        });
                                    }).catch(function(err) {
                                        console.error("ERROR | " + nameFile + ' | /:id | put | delete: ', id, err);
                                        logger.error(nameFile + ' | /:id | put | delete: ' + dymeruser.id + ' , ' + id + ' , ' + err);
                                        ret.setSuccess(false);
                                        ret.setMessages("Error Updated!");
                                        return res.send(ret);
                                    });
                                });
                            });
                        }).catch(function(err) {
                            console.error("ERROR | " + nameFile + ' | /:id | put | delete search: ', id, err);
                            logger.error(nameFile + ' | /:id | put | delete search: ' + dymeruser.id + ' , ' + id + ' , ' + err);
                            ret.setSuccess(false);
                            ret.setMessages("Error Updated!");
                            return res.send(ret);
                        });
                    } else {
                        ret.setMessages("No permission");
                        res.status(200);
                        ret.setSuccess(false);
                        return res.send(ret);
                    }
                } else {
                    ret.setMessages("No permission");
                    res.status(200);
                    ret.setSuccess(false);
                    return res.send(ret);
                }
            }).catch(function(err) {
                console.error("ERROR | " + nameFile + ' | /:id | put | delete search: ', id, err);
                logger.error(nameFile + ' | /:id | put | delete search: ' + dymeruser.id + ' , ' + id + ' , ' + err);
                ret.setSuccess(false);
                ret.setMessages("Error Updated!");
                return res.send(ret);
            });
        }
    });
});
const checklogged = function(req) {
    return new Promise(function(resolve, reject) {
        const callData = util.getAllQuery(req);
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]
        var maybenous = false;
        if (token == undefined || token == null)
            maybenous = true;
        if (!maybenous) {
            //JWT  var decoded = jwt.decode(token);
            var decoded = JSON.parse(Buffer.from(token, 'base64').toString());
            urs_uid = decoded.email;
            urs_gid = decoded.extrainfo.groupId;
            return resolve();
        }
        const my_authdata = callData.authdata;
        if (my_authdata != undefined) {
            const usr = my_authdata.properties;
            //console.log('req_uid', usr)
            return resolve(usr);
        } else {
            const ret = new jsonResponse();
            ret.setSuccess(false);
            ret.setMessages("User not logged!");
            return reject(ret);
        }
    });
};

const haspermissionGrants = function(urs, entityprop) {
    return new Promise(function(resolve, reject) {
        //controllare role permission su tipo entità
        let ret = new jsonResponse();
        let permissions = { view: false, update: false, delete: false };
        // console.log('haspermission urs', urs);
        //console.log('haspermission action', action);
        //console.log('haspermission entityprop', entityprop);
        let userid = (urs.id).toString();
        let usergid = (urs.gid).toString();
        let userroles = urs.roles;
        let entityOwner = entityprop.owner;
        let entityGrant = entityprop.grant;
        let visibility = entityprop.visibility;
        //0 Public
        //1 Private
        //2 Restricted
        let status = entityprop.status;
        //1 Published
        //2 Not Published
        //3 Draft
        //0 Deleted
        if (userroles.indexOf("app-admin") > -1) {
            permissions.view = true;
            permissions.update = true;
            permissions.delete = true;
            ret.setSuccess(true);
            ret.setData(permissions);
            ret.setMessages("Permission authorized!");
            return resolve(ret);
        }
        //console.log('entityOwner', entityOwner, entityOwner.uid, userid, entityOwner.uid == userid)
        if (entityOwner.uid == userid) {
            permissions.view = true;
            permissions.update = true;
            permissions.delete = true;
            ret.setSuccess(true);
            ret.setData(permissions);
            ret.setMessages("Permission authorized!");
            return resolve(ret);
        }
        //view
        //console.log('test', visibility == '0' && status == '1', visibility, status);
        if (visibility == '0' && status == '1') {
            permissions.view = true;
        }
        /*  if (((visibility == '2' || visibility == '3') && (status == '2' || status == '3')) && ((entityGrant.view.uid).find(userid) || (entityGrant.view.gid).find(usergid))) {
              permissions.view = true;
          }*/
        if ((visibility == '1' && status == '3') && ((entityGrant.view.uid).find(userid) || (entityGrant.view.gid).find(usergid))) {
            permissions.view = true;
        }
        //if (status == '2' && usergid == entityOwner.gid) {
        //    permissions.view = true;
        // }
        if (visibility == '2' && status == '1' && usergid == entityOwner.gid) {
            permissions.view = true;
        }
        if (visibility == '2' && status == '3' && usergid == entityOwner.gid) {
            permissions.view = true;
        }
        //update
        /*console.log('entityGrant', entityprop);
        console.log('userid', userid, typeof userid);
        console.log('usergid', usergid);
        console.log('update', entityGrant.update.uid);*/
        if (entityGrant != undefined) {
            if ((entityGrant.update.uid).includes(userid) || (entityGrant.update.gid).includes(usergid) || (entityGrant.delete.uid).includes(userid) || (entityGrant.delete.gid).includes(usergid)) {
                permissions.view = true;
                permissions.update = true;
            }
            //delete
            if ((entityGrant.delete.uid).includes(userid) || (entityGrant.delete.gid).includes(usergid) || (entityGrant.delete.uid).includes(userid) || (entityGrant.delete.gid).includes(usergid)) {
                permissions.view = true;
                permissions.delete = true;
            }
        }
        //if (entityOwner.uid == user.uid || user.uid == '99999') {
        ret.setSuccess(true);
        ret.setMessages("Permission's list!");
        ret.setData(permissions);
        return resolve(ret);
    });
};
const haspermissionGrantByAction = function(urs, action, entityprop) {
    return new Promise(function(resolve, reject) {
        const ret = new jsonResponse();
        // console.log('haspermission urs', urs);
        //console.log('haspermission action', action);
        //console.log('haspermission entityprop', entityprop);
        const userid = urs.id;
        const usergid = urs.gid;
        const userroles = urs.roles;
        const entityOwner = entityprop.owner;
        const entityGrant = entityprop.grant;
        const visibility = entityprop.visibility;
        //0 Public
        //1 Private
        //2 Restricted
        const status = entityprop.status;
        //1 Published
        //2 Not Published
        //3 Draft
        //0 Deleted

        let hasperm = false;
        if (userroles.indexOf("app-admin") > -1) {
            hasperm = true;
            ret.setSuccess(hasperm);
            ret.setMessages("Permission authorized!");
            return resolve(ret);
        }
        if (entityOwner.uid == userid) {
            hasperm = true;
            ret.setSuccess(hasperm);
            ret.setMessages("Permission authorized!");
            return resolve(ret);
        }
        switch (action) {
            case "view":
                if (visibility == 1 && status == 0) {
                    hasperm = true;
                    ret.setSuccess(hasperm);
                    ret.setMessages("Permission authorized!");
                    return resolve(ret);
                }
                if (((visibility == 2 || visibility == 3) && (status == 0 || status == 2)) && ((entityGrant.view.uid).find(userid) || (entityGrant.view.gid).find(usergid))) {
                    hasperm = true;
                    ret.setSuccess(hasperm);
                    ret.setMessages("Permission authorized!");
                    return resolve(ret);
                }
                if (status == 2 && usergid == entityOwner.gid) {
                    hasperm = true;
                    ret.setSuccess(hasperm);
                    ret.setMessages("Permission authorized!");
                    return resolve(ret);
                }
                if ((entityGrant.update.uid).includes(userid) || (entityGrant.update.gid).includes(usergid) || (entityGrant.delete.uid).includes(userid) || (entityGrant.delete.gid).includes(usergid)) {
                    hasperm = true;
                    ret.setSuccess(hasperm);
                    ret.setMessages("Permission authorized!");
                    return resolve(ret);
                }

                break;
            case "patch":
                /*  if (!hasperm && entityData.hasOwnProperty('properties')) {
                      hasperm = false;
                  }*/
                break;
            case "update":
                /*  if ((entityprop.grant.update.uid).find(userid) || (entityprop.grant.update.gid).find(user.gid)) {
                      hasperm = true;
                  }*/
                break;
            case "delete":
                /* if ((entityprop.grant.delete.uid).find(userid) || (entityprop.grant.delete.gid).find(user.gid)) {
                     hasperm = true;
                 }*/
                break;
            default:
                break;
        }
        //if (entityOwner.uid == user.uid || user.uid == '99999') {

        if (!hasperm) {
            ret.setSuccess(false);
            ret.setMessages("Permission denied!");
            return reject(ret);
        } else {
            hasperm = true;
            ret.setSuccess(hasperm);
            ret.setMessages("Permission authorized!");
            return resolve(ret);
        }

    });
};
//router.patch('/:id', [testprecall, testprecall2], (req, res) => {
router.patch('/:id', async(req, res, next) => {
    var callDatap = util.getAllQuery(req);
    var ret = new jsonResponse();
    const hdymeruser = req.headers.dymeruser
    const dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
    const urs_uid = dymeruser.id;
    const urs_gid = dymeruser.gid;
    var act = "patch";
    var hasperm = false;
    var isadmin = false;
    if (dymeruser.roles.indexOf("app-admin") > -1) {
        hasperm = true;
        isadmin = true;
    }
    //console.log(nameFile + ' | patch/:id | dymeruser:', JSON.stringify(dymeruser));
    logger.info(nameFile + ' | patch/:id | dymeruser :' + JSON.stringify(dymeruser));
    queryString = "?role[]=" + dymeruser.roles.join("&role[]=");
    var url = util.getServiceUrl("dservice") + "/api/v1/perm/entityrole/";
    url += act + "/";
    //   url += index + "/";
    url += queryString;
    upload(req, res, function(err) {
        if (err) {
            console.error("ERROR | " + nameFile + ' | patch/:id | upload:', err);
            logger.error(nameFile + ' | patch/:id | upload : ' + err);
            ret.setMessages("Upload Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
        let bridgeConf = undefined;
        let id = req.params.id;
        let callData = util.getAllQuery(req);
        const instance = callData.instance;
        const data = callData.data;
        var params = (instance) ? instance : {};
        if (id == ':id')
            id = data.id;
        if (instance != undefined) {
            bridgeConf = bE.findByIndex(instance.index);
        }
        //console.log(nameFile + ' | patch/:id | bridgeConf:', JSON.stringify(bridgeConf));
        logger.info(nameFile + ' | patch/:id | bridgeConf :' + JSON.stringify(bridgeConf));
        if (bridgeConf != undefined) {
            jsonMappingDymerEntityToExternal(callData, bridgeConf, "patch").then(function(mapdata) {
                bridgeEsternalEntities(bridgeConf, "patch", mapdata).then(function(callresp) {
                    //console.log(nameFile + ' | patch/:id | bridgeEsternalEntities: ', JSON.stringify(mapdata), JSON.stringify(callresp.data));
                    logger.info(nameFile + ' | patch/:id | bridgeEsternalEntities :' + JSON.stringify(mapdata) + " , " + JSON.stringify(callresp.data));
                    ret.setData(callresp.data);
                    ret.setMessages("Fields Edited successfully");
                    return res.send(ret);
                }).catch(function(error) {
                    console.error("ERROR | " + nameFile + ' | patch/:id | bridgeEsternalEntities:', error);
                    logger.error(nameFile + ' |  patch/:id | bridgeEsternalEntities : ' + error);
                    ret.setSuccess(false);
                    ret.setMessages("Fields Edit Problem");
                    return res.send(ret);
                });
            }).catch(function(error) {
                console.error("ERROR | " + nameFile + ' | patch/:id | jsonMappingDymerEntityToExternal:', error);
                logger.error(nameFile + ' |  patch/:id | jsonMappingDymerEntityToExternal : ' + error);
                ret.setSuccess(false);
                ret.setMessages("Fields Edit Problem");
                return res.send(ret);
            });
        } else {
            delete callData.data.id;
            params["body"] = {
                "query": {
                    "match": {
                        "_id": id
                    }
                }
            };
            params["body"].size = 1;
            client.search(params).then(function(resp) {
                resp["hits"].hits.forEach((element) => {
                    var checkElemPerm = element["_source"].properties;
                    let harpermEdit = false;
                    if (checkElemPerm.owner.uid == urs_uid || isadmin)
                        harpermEdit = true;
                    if (checkElemPerm.hasOwnProperty("grant"))
                        if ((checkElemPerm.grant.update.uid).find(x => x == urs_uid)) {
                            harpermEdit = true;
                        }
                        // console.log(nameFile + ' | patch/:id | dymeruser.id, id,permission patch:', dymeruser.id, id, harpermEdit);
                    logger.info(nameFile + ' | patch/:id | dymeruser.id, id,permission patch:' + dymeruser.id + " , " + id + " , " + harpermEdit);
                    if (harpermEdit) {
                        client.update({
                            id: id,
                            index: element["_index"],
                            type: element["_type"],
                            body: { doc: data },
                            refresh: 'true'
                        }).then(function(resp) {
                            logger.info(nameFile + ' | patch/:id | dymeruser.id, id updated :' + dymeruser.id + ' , ' + id + ' , ' + JSON.stringify(data));
                            //console.log(nameFile + ' | patch/:id | dymeruser.id, id updated :', dymeruser.id, id);
                            ret.setMessages("Updated!");
                            return res.send(ret);
                        }).catch(function(err) {
                            logger.error(nameFile + '| patch/:id | dymeruser.id, id update :' + dymeruser.id + ' , ' + id + ' , ' + err);
                            console.error("ERROR | " + nameFile + ' | patch/:id | dymeruser.id, id update :', dymeruser.id, id, err);
                            ret.setSuccess(false);
                            ret.setMessages("Error Updated!");
                            return res.send(ret);
                        });
                    } else {
                        ret.setMessages("No permission");
                        res.status(200);
                        ret.setSuccess(false);
                        return res.send(ret);
                    }
                })
            }).catch((loger) => {
                console.error("ERROR | " + nameFile + ' | patch/:id | dymeruser.id, id search :', dymeruser.id, id, loger);
                logger.error(nameFile + ' | patch/:id | dymeruser.id, id search : ' + dymeruser.id + ' , ' + id + ' , ' + loger);
                ret.setSuccess(false);
                ret.setMessages("Error Updated!");
                return res.send(ret);
            });
        }
    })
});
/*router.put('/updatevalue/:entityid/:key/:value', (req, res) => {
    console.log(" ROUTER PUT ID ");
    //relationtodelete
    var ret = new jsonResponse();
    upload(req, res, function(err) {
        if (err) {
            console.log(err);
            ret.setMessages("Upload Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
        var ientityid = req.params.entityid;
        var key = req.params.key;
        var value = req.params.value;
        var params_update = {};
        params_update["doc"]={};
        params_update["doc"][key] = value;
              //
           //    index: new_Temp_Entity._index,
          //  type: new_Temp_Entity._type,
           
        client.update({
            id: ientityid,
            body: params_update 
        }).then(function(resp) {
            //   console.log("-----ESITO", resp);
            ret.setMessages("Updated!");
             
            return res.send(ret);
        }).catch(function(err) {
            console.log('Caught an error on Edit:update param!', err);
            return res.send(ret);
        });  
    });
});*/
/*giaisg*/
router.get('/deleteAllEntityByIndex/', util.checkIsAdmin, (req, res) => {
    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let index = callData.index;
    const dymeruser = util.getDymerUser(req, res);
    const dymerextrainfo = dymeruser.extrainfo;
    /* var dymerextrainfo = req.headers.extrainfo;
     if (dymerextrainfo != undefined && dymerextrainfo != "null" && dymerextrainfo != null) {
         dymerextrainfo = JSON.parse(Buffer.from(req.headers.extrainfo, 'base64').toString('utf-8'));
     } else {
         dymerextrainfo = undefined;
     }*/
    var params_ = {
        "body": {
            "query": {
                "bool": {
                    "must": [
                        { "term": { "_index": index } }
                    ]
                }
            }
        }
    };
    params_["body"].size = 10000;
    logger.info(nameFile + ' | deleteAllEntityByIndex | dymeruser.id, index :' + dymeruser.id + ' , ' + index);
    // console.log(nameFile + ' | deleteAllEntityByIndex | dymeruser.id, index :', dymeruser.id, index);
    client.search(params_).then(function(resp) {
        if (resp.hits.total == 0) {
            ret.setSuccess(true);
            ret.setMessages("No entity founded");
            return res.send(ret);
        }
        var ind = 0;
        for (ind = 0; ind < resp.hits.total; ind++) {
            var element = resp.hits.hits[ind];
            var elToDelete = element;
            var delarams = {};
            delarams["index"] = element["_index"];
            delarams["type"] = element["_type"];
            delarams["id"] = element["_id"];
            var gridfs_delete_queue = [];
            for (var key in element._source) {
                if (element._source[key] instanceof Array) {
                    for (var subkey in element._source[key]) {
                        if (element._source[key][subkey].hasOwnProperty('bucketName'))
                            gridfs_delete_queue.push(element._source[key][subkey]["id"]);
                    }
                } else {
                    if (element._source[key].hasOwnProperty('bucketName'))
                        gridfs_delete_queue.push(element._source[key]["id"]);
                }
            }
            client.delete(delarams).then(
                async function(resp) {
                    //console.log(nameFile + ' | deleteAllEntityByIndex | dymeruser.id, entity removed :', dymeruser.id, JSON.stringify(resp));
                    logger.info(nameFile + ' | deleteAllEntityByIndex | dymeruser.id, entity removed :' + dymeruser.id + " , " + JSON.stringify(resp));
                    gridfs_delete_queue.forEach(function(element) {
                        gridFSBucket.delete(mongoose.Types.ObjectId(element))
                            .then(() => {})
                            .catch(function(err) {
                                ret.setSuccess(false);
                                console.error("ERROR | " + nameFile + ' | deleteAllEntityByIndex | dymeruser.id, gridFSBucket.delete :', dymeruser.id, err);
                                logger.error(nameFile + ' | | deleteAllEntityByIndex | dymeruser.id, gridFSBucket.delete : ' + dymeruser.id + " , " + err);
                            });
                    });
                    ret.setMessages("Entity deleted successfully");
                    ret.addData(resp);
                    //deleteRelationOneEntity(params.id);
                    logger.info(nameFile + ' | deleteAllEntityByIndex | dymeruser.id,_idm index :' + dymeruser.id + ' , ' + element["_id"] + ' , ' + element["_index"]);
                    deleteRelationOneEntityAndIndex(element["_id"], element["_index"]);
                    var objHook = elToDelete;
                    /*var extraInfo = dymerextrainfo;
                    if (extraInfo != undefined)
                        extraInfo.extrainfo.emailAddress = dymeruser.id;*/
                    // console.log(nameFile + ' | deleteAllEntityByIndex | pre check hook id,extraInfo: ', dymeruser.id, JSON.stringify(objHook), JSON.stringify(dymerextrainfo));
                    logger.info(nameFile + ' | deleteAllEntityByIndex | pre check hook id,extraInfo: ' + dymeruser.id + ' , ' + JSON.stringify(objHook) + ' , ' + JSON.stringify(dymerextrainfo));
                    checkServiceHook('after_delete', objHook, dymerextrainfo, req);
                    await redisClient.invalidateCacheById(ret.data[0]._id, redisEnabled)
                },
                function(err) {
                    logger.error(nameFile + ' | deleteAllEntityByIndex | entity remov ,index:' + dymeruser.id + ' , ' + index + ' , ' + err);
                    console.error("ERROR | " + nameFile + ' | deleteAllEntityByIndex | entity remov :', dymeruser.id, err);
                }
            );
        }
        return res.send(ret);
    }, function(err) {
        ret.setSuccess(false);
        console.error("ERROR | " + nameFile + ' | deleteAllEntityByIndex | search :', dymeruser.id, err);
        logger.error(nameFile + ' | deleteAllEntityByIndex | search dymeruser.id, err : ' + dymeruser.id + " , " + err);
        ret.setMessages("Error search deleteAllEntityByIndex");
        return res.send(ret);
    });
});

router.get('/deleteAllEntityAndIndexByIndex/', (req, res) => {
    let callData = util.getAllQuery(req);
    let index_ = callData.index;
    const dymeruser = util.getDymerUser(req, res);
    const dymerextrainfo = dymeruser.extrainfo;
    /* var dymerextrainfo = req.headers.extrainfo;
     if (dymerextrainfo != undefined && dymerextrainfo != "null" && dymerextrainfo != null) {
         dymerextrainfo = JSON.parse(Buffer.from(req.headers.extrainfo, 'base64').toString('utf-8'));
     } else {
         dymerextrainfo = undefined;
     }*/
    client.indices.delete({
        index: index_,
    }).then(function(resp) {
        //console.log(nameFile + ' | deleteAllEntityAndIndexByIndex | index :', dymeruser.id, index_);
        logger.info(nameFile + ' | deleteAllEntityAndIndexByIndex | dymeruser.id, index :' + dymeruser.id + ' , ' + index_);
        deleteRelationByIndex(index_);
    }, function(err) {
        logger.error(nameFile + ' | deleteAllEntityAndIndexByIndex :' + dymeruser.id + ' , ' + err);
        console.error("ERROR | " + nameFile + ' | deleteAllEntityAndIndexByIndex :', dymeruser.id, err);
    });
});

/**/
//delete by id
router.delete('/:id', (req, res) => {
    let id = req.params.id;
    var ret = new jsonResponse();
    const dymeruser = util.getDymerUser(req, res);
    const dymerextrainfo = dymeruser.extrainfo;
    /*const hdymeruser = req.headers.dymeruser;
    const dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
    const dymerextrainfo = dymeruser.extrainfo;
    var dymerextrainfo = req.headers.extrainfo;
    if (dymerextrainfo != undefined && dymerextrainfo != "null" && dymerextrainfo != null) {
        dymerextrainfo = JSON.parse(Buffer.from(req.headers.extrainfo, 'base64').toString('utf-8'));
    } else {
        dymerextrainfo = undefined;
    }*/
    const urs_uid = dymeruser.id;
    var urs_gid = dymeruser.gid;
    /*if (dymerextrainfo != undefined)
        urs_gid = dymerextrainfo.extrainfo.groupId;*/
    if (dymerextrainfo != undefined)
        urs_gid = dymerextrainfo.groupId;
    //console.log(nameFile + ' | delete/:id | dymeruser:', JSON.stringify(dymeruser));
    logger.info(nameFile + ' | delete/:id | dymeruser :' + JSON.stringify(dymeruser));
    upload(req, res, function(err) {
        if (err) {
            console.error("ERROR | " + nameFile + ' | delete/:id :', err);
            logger.error(nameFile + ' | delete/:id : ' + err);
            ret.setMessages("Upload Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
        let callData = util.getAllQuery(req);
        let instance = callData.instance;
        //  console.log("ESTERNA delete callData", JSON.stringify(callData));
        let params = (instance) ? instance : {};
        params["id"] = id;
        var indextosearch = [callData.indexentity];
        var bridgeConf = bE.findByIndex(indextosearch[0]); // bE.findByIndex(indextosearch[0]);
        // console.log(nameFile + ' | delete/:id | bridgeConf:', JSON.stringify(bridgeConf));
        logger.info(nameFile + ' | delete/:id | dymeruser :' + JSON.stringify(bridgeConf));
        if (bridgeConf != undefined) {
            var globalData = req.body;
            jsonMappingDymerEntityToExternal(callData, bridgeConf, "delete").then(function(mapdata) {
                bridgeEsternalEntities(bridgeConf, "delete", mapdata).then(function(callresp) {
                    //console.log(nameFile + ' | delete/:id | bridgeEsternalEntities: ', JSON.stringify(mapdata), JSON.stringify(callresp.data));
                    logger.info(nameFile + ' | delete/:id | bridgeEsternalEntities :' + JSON.stringify(mapdata) + " , " + JSON.stringify(callresp.data));
                    ret.setData(callresp.data);
                    ret.setMessages("Entity Deleted successfully");
                    return res.send(ret);
                }).catch(function(error) {
                    console.log(nameFile + ' | delete/:id | bridgeEsternalEntities: ', error);
                    logger.error(nameFile + ' | delete/:id | bridgeEsternalEntities : ' + error);
                    ret.setSuccess(false);
                    ret.setMessages("Entity Delete Problem");
                    return res.send(ret);
                });
            }).catch(function(error) {
                console.log(nameFile + ' | delete/:id | jsonMappingDymerEntityToExternal: ', error);
                logger.error(nameFile + ' | delete/:id | jsonMappingDymerEntityToExternal: ' + error);
                ret.setSuccess(false);
                ret.setMessages("Entity Delete Problem");
                return res.send(ret);
            });
        } else {
            let qparams = {}; //{ index: instance.index, type: instance.type };
            qparams["body"] = {
                "query": {
                    "bool": {
                        "should": [{
                            "bool": {
                                "must": [{
                                    "match": {
                                        "_id": id.toString()
                                    }
                                }]
                            }
                        }]
                    }
                }
            };
            qparams["body"].size = 10000;
            var gridfs_delete_queue = [];
            client.search(qparams).then(function(resp) {
                resp["hits"].hits.forEach((element) => {
                    var elToDelete = element;
                    params["index"] = element._index;
                    params["type"] = element._type;
                    for (var key in element._source) {
                        if (element._source[key] instanceof Array) {
                            for (var subkey in element._source[key]) {
                                if (element._source[key][subkey] != undefined)
                                    if (element._source[key][subkey].hasOwnProperty('bucketName'))
                                        gridfs_delete_queue.push(element._source[key][subkey]["id"]);
                            }
                        } else {
                            if (element._source[key].hasOwnProperty('bucketName'))
                                gridfs_delete_queue.push(element._source[key]["id"]);
                        }
                    }
                    client.delete(params, async function(err, resp, status) {
                        if (err) {
                            console.error("ERROR | " + nameFile + ' | delete/:id | delete :', err);
                            logger.error(nameFile + ' | delete/:id | delete: ' + err);
                            ret.setSuccess(false);
                            ret.setExtraData({ "log": err.message });
                            ret.setMessages("Error delete");
                            return res.send(ret);
                        }
                        //MARCO CONTROLLO DELETE RELATION
                        gridfs_delete_queue.forEach(function(element) {
                            gridFSBucket.delete(mongoose.Types.ObjectId(element))
                                .then(() => {})
                                .catch(function(err) {
                                    console.error("ERROR | " + nameFile + ' | delete/:id | Attachments :', err);
                                    logger.error(nameFile + ' | delete/:id | Attachments: ' + err);
                                });
                        });
                        ret.setMessages("Entity deleted successfully");
                        ret.addData(resp);
                        //console.log(nameFile + ' | delete/:id | deleted id:', dymeruser.id, id);
                        logger.info(nameFile + ' | delete/:id | deleted id :' + dymeruser.id + " , " + id);
                        // deleteRelationOneEntity(id);
                        deleteRelationOneEntityAndIndex(params.id, element["_index"]);
                        var objHook = elToDelete;
                        /* var extraInfo = dymerextrainfo;
                         if (extraInfo != undefined)
                             extraInfo.extrainfo.emailAddress = dymeruser.id;*/
                        //console.log(nameFile + ' | delete/:id | pre check hook id,extraInfo: ', dymeruser.id, id, JSON.stringify(dymerextrainfo));
                        logger.info(nameFile + ' | delete/:id | pre check hook id,extraInfo: ' + dymeruser.id + ' , ' + id + ' , ' + JSON.stringify(objHook) + ' , ' + JSON.stringify(dymerextrainfo));
                        checkServiceHook('after_delete', objHook, dymerextrainfo, req);
                        await redisClient.invalidateCacheById(ret.data[0]._id, redisEnabled)
                        return res.send(ret);
                    });
                });
            });
            /*.catch(function(err) {
                            console.error("ERROR | " + nameFile + ' | delete/:id | search', err);
                            ret.setSuccess(false);
                            ret.setMessages("Error Delete!");
                            return res.send(ret);
                        });;*/
        }
    });
});
//inoltro al microservizio dservice
function checkServiceHook(EventSource, objSend, extraInfo, req) {
    //insert non ho i dati quindi devo fare un get
    var url_dservice = util.getServiceUrl("dservice");
    logger.info(nameFile + ' | checkServiceHook | url_dservice,EventSource,objSend: ' + url_dservice + ' , ' + EventSource + ' , ' + JSON.stringify(objSend));
    logger.info(nameFile + ' | checkServiceHook | reqfrom: ' + JSON.stringify(req.headers));
    const headers = {
        'reqfrom': req.headers["reqfrom"]
    }
    if (EventSource.includes("insert") || EventSource.includes("update")) {
        var params = {
            "body": {
                "query": {
                    "match": {
                        "_id": objSend["_id"]
                    }
                }
            }
        };
        client.search(params, function(err, resp, status) {
            //marcoper adapter
            checkUnionRelation(resp.hits.hits).then(function(match) {
                let element = match[0];
                // console.log('ent match element', JSON.stringify(element));
                logger.info(nameFile + ' | checkServiceHook | ent match element: ' + JSON.stringify(element));
                //    match.forEach(element => {
                if (element.hasOwnProperty("relations")) {
                    if (element.relations.length > 0)
                        element.relations.forEach(entityrelation => {
                            let indexentrel = entityrelation._index;
                            let identrel = entityrelation._id;
                            if (!element["_source"].hasOwnProperty("relation"))
                                element["_source"].relation = {};
                            if (element["_source"].relation.hasOwnProperty(indexentrel)) {
                                element["_source"].relation[indexentrel].push({
                                    "to": identrel
                                });
                            } else {
                                element["_source"].relation[indexentrel] = [{
                                    "to": identrel
                                }];
                            }
                        });
                    delete element.relations;
                }
                // console.log('NEW match', JSON.stringify(element));
                logger.info(nameFile + ' | checkServiceHook | NEW match: ' + JSON.stringify(element));
                // objSend = resp.hits.hits[0];
                var postObj = {
                    eventSource: EventSource,
                    obj: element
                };
                axios.post(url_dservice + '/api/v1/servicehook/checkhook', { data: postObj, "extraInfo": extraInfo }, {
                        headers: headers
                    }).then(response => {
                        //console.log(nameFile + ' | checkServiceHook | insert axios.post: ', response);
                        logger.info(nameFile + ' | checkServiceHook | insert axios.post: ' + response);
                    })
                    .catch(error => {
                        logger.error("ERROR | " + nameFile + ' | checkServiceHook | insert axios.post: ' + error);
                        console.error("ERROR | " + nameFile + ' | checkServiceHook | insert axios.post: ', error);
                    });
                //   });
            }).catch(function(err) {
                console.error("ERROR | " + nameFile + ' | _search | checkUnionRelation:', err);
                logger.error(nameFile + ' | _search | checkUnionRelation : ' + err);
            });
        });
    } else {
        var postObj = {
            eventSource: EventSource,
            obj: objSend
        };
        axios.post(url_dservice + '/api/v1/servicehook/checkhook', { data: postObj, "extraInfo": extraInfo }, { headers: headers }).then(response => {
                //console.log(nameFile + ' | checkServiceHook | axios.post: ', response);
                logger.info(nameFile + ' | checkServiceHook | axios.post: ' + response);
            })
            .catch(error => {
                console.error("ERROR | " + nameFile + ' | checkServiceHook | axios.post: ', error);
                logger.error(nameFile + ' | _search | checkServiceHook | axios.post : ' + error);
            });
    }
}
Object.byString = function(o, s) {
    s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    s = s.replace(/^\./, ''); // strip a leading dot
    var a = s.split('.');
    for (var i = 0, n = a.length; i < n; ++i) {
        var k = a[i];
        if (k in o) {
            o = o[k];
        } else {
            return;
        }
    }
    return o;
}

function stringTemplateParser(expression, valueObj) {
    const templateMatcher = /{{\s?([^{}\s]*)\s?}}/g;
    let text = expression.replace(templateMatcher, (substring, value, index) => {
        value = Object.byString(valueObj, value); //valueObj[value];
        return value;
    });
    return text
}
module.exports = router;