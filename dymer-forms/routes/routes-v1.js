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
const logger = require('./dymerlogger');
const Model = mongoose.model("Form");
const cheerio = require('cheerio');

var db;
var gridFSBucket;
var storage;
var upload;
const mongoURI = util.mongoUrl();

console.log(nameFile + ' | mongoURI :', JSON.stringify(mongoURI));
logger.info(nameFile + " | mongoURI: " + JSON.stringify(mongoURI));
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

router.get('/mongostate', (req, res) => {
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
                "_id": er._id,
                "title": er.title,
                "author": er.author,
                "description": er.description,
                "posturl": er.posturl,
                "instance": er.instance,
                "files": dt,
                "created": er.created,
                /*MG - Aggiunte properties*/
                "properties": er.properties
            }

            if (er.structure != undefined)
                ret_json.structure = er.structure
            resolve(ret_json);
        });
    });
}
//VL
function convertString(input) {
    if (input.startsWith("data[") && input.endsWith("]")) {
        input = input.substring(5, input.length - 1);
    }
    const output = input.replace(/\]\[0\]\[/g, ".[0].");
    return output;
}
//VL
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
        logger.error(nameFile + ' | recFile  : ' + err);
    });
}

//router.get('/modeldetail', (req, res) => { TO check: it works in local mode
router.get('/modeldetail', [util.checkIsDymerUser], (req, res) => {
    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let queryFind = callData.query;
    console.log(nameFile + ' | get | queryFind:', JSON.stringify(queryFind));
    logger.info(nameFile + '  | get/modeldetail | queryFind:' + JSON.stringify(queryFind));
    //let queryFind = (Object.keys(callData.query).length === 0) ? {} : JSON.parse(callData.query);
    //let queryFind = (Object.keys(callData.query).length === 0) ? {} : callData.query;
    Model.find(queryFind, {}, { title: 1, instance: 1, "structure": 1 }).collation({ locale: "en" }).sort({ title: +1 }).then((Models) => {
        ret.setMessages("HTMLTemplate");
        ret.setData(Models);

        const formControlNodes = [];
        for (const item of ret.data) {
            if (item.structure) {
                const childNodes = item.structure.child || [];
                for (const node of childNodes) {
                    /*TO DO - Check attributo form-control e form-select*/
                    if (node.node === "element" && node.attr.class && node.attr.class.includes("form-control")) {
                        formControlNodes.push(node);
                    }
                }
            }
        }
        let templateNodeList = "";
        var templateHtml = "";

        formControlNodes.forEach((node) => {
            //console.log(`node: ${node.tag}, name: ${JSON.stringify(node.attr.name)}`);
            let name = node.attr.name;
            let tag = node.tag;
            let type = node.attr.type;
            name = convertString(name);
            let nodeType = "";
            if (type){
                nodeType = 'type ="' + type+ '"';
            }
            templateNodeList = templateNodeList + `<section class="container-fluid"> \n<div class="row  ">\n<div class="col-md-12 col-sx-12 col-lg-12">\n	<div class="row"><h3 class="primaryColor primaryTitlesection"><b> ${name}</b></h3></div>\n <div class="row">{{ ${name} }}  </div>\n</div>\n</div> \n</section>\n`;
            // templateNodeList = templateNodeList + `<div class="row"><div class="col-md-12 col-sx-12 col-lg-12"><label>${name}</label><${tag} ${nodeType}>${name}</div></div>\n`;
            //ret.setData(templateNodeList);
            templateHtml = `<div data-component-entitystatus="" data-vvveb-disabled="" class="row">
                            {{{EntityStatus this}}}</div> ${templateNodeList}\n`;
            ret.setMessages("HTML");
            ret.setData(templateHtml);

        });

        //TODO verificare esistenza del modello
        //TODO gestire edit
        return res.send(ret);
    }).catch(function(err) {
        console.error("ERROR | " + nameFile + ' | get | queryFind : ', err);
        logger.error(nameFile + ' | get/modeldetail | queryFind : ' + err);
    });
});


//VL master
router.get('/modeldetailwizard', [util.checkIsDymerUser], (req, res) => {
    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let queryFind = callData.query;
    console.log(nameFile + ' | get | queryFind:', JSON.stringify(queryFind));
    logger.info(nameFile + '  | get/modeldetail | queryFind:' + JSON.stringify(queryFind));
    //let queryFind = (Object.keys(callData.query).length === 0) ? {} : JSON.parse(callData.query);
    //let queryFind = (Object.keys(callData.query).length === 0) ? {} : callData.query;
    Model.find(queryFind, {}, { title: 1, instance: 1, "structure": 1 }).collation({ locale: "en" }).sort({ title: +1 }).then((Models) => {
        ret.setMessages("HTMLTemplate");
        ret.setData(Models);

        const formControlNodes = [];
        for (const item of ret.data) {
            if (item.structure) {
                const childNodes = item.structure.child || [];
                for (const node of childNodes) {
                    /*TO DO - Check attributo form-control e form-select*/
                    if (node.node === "element" && node.attr.class && node.attr.class.includes("form-control")) {
                        formControlNodes.push(node);     
                    }
                }
            }
        }
        let templateNodeList = "";
        var templateHtml = "";

        formControlNodes.forEach((node) => {
            //console.log(`node: ${node.tag}, name: ${JSON.stringify(node.attr.name)}`);
            let name = node.attr.name;
            let tag = node.tag;
            let type = node.attr.type;
            name = convertString(name);
            let nodeType = "";
            if (type){
                nodeType = 'type ="' + type+ '"'; 
            }
            templateNodeList = templateNodeList + `<section class="container-fluid"> \n<div class="row  ">\n<div class="col-md-12 col-sx-12 col-lg-12">\n	<div class="row"><h3 class="primaryColor primaryTitlesection"><b> ${name}</b></h3></div>\n <div class="row">{{ ${name} }}  </div>\n</div>\n</div> \n</section>\n`;
            // templateNodeList = templateNodeList + `<div class="row"><div class="col-md-12 col-sx-12 col-lg-12"><label>${name}</label><${tag} ${nodeType}>${name}</div></div>\n`;
            //ret.setData(templateNodeList);
            templateHtml = `<div data-component-entitystatus="" data-vvveb-disabled="" class="row">
                            {{{EntityStatus this}}}</div> ${templateNodeList}\n`;
            ret.setMessages("HTML");
            ret.setData(templateHtml);
            
        });

        //TODO verificare esistenza del modello
        //TODO gestire edit
        return res.send(ret);
    }).catch(function(err) {
        console.error("ERROR | " + nameFile + ' | get | queryFind : ', err);
        logger.error(nameFile + ' | get/modeldetail | queryFind : ' + err);
    });
});
//VL master

 


router.get('/dettagliomodel', [util.checkIsDymerUser], (req, res) => {
    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let queryFind = callData.query;
    //console.log(nameFile + ' | get | queryFind:', JSON.stringify(queryFind));
    logger.info(nameFile + '  | get/dettagliomodel | queryFind:' + JSON.stringify(queryFind));
    //let queryFind = (Object.keys(callData.query).length === 0) ? {} : JSON.parse(callData.query);
    //let queryFind = (Object.keys(callData.query).length === 0) ? {} : callData.query;
    Model.find(queryFind, {}, { title: 1, instance: 1, "structure": 1 }).collation({ locale: "en" }).sort({ title: +1 }).then((Models) => {
        ret.setMessages("List");
        ret.setData(Models);
        return res.send(ret);
    }).catch(function(err) {
        console.error("ERROR | " + nameFile + ' | get | queryFind : ', err);
        logger.error(nameFile + ' | get/dettagliomodel | queryFind : ' + err);
    });
});

router.get('/', [util.checkIsDymerUser], (req, res) => {
    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let queryFind = callData.query;
    console.log(nameFile + ' | get | queryFind:', JSON.stringify(queryFind));
    logger.info(nameFile + ' | get | queryFind: ' + JSON.stringify(queryFind));
    //let queryFind = (Object.keys(callData.query).length === 0) ? {} : JSON.parse(callData.query);
    //let queryFind = (Object.keys(callData.query).length === 0) ? {} : callData.query;
    Model.find(queryFind, {}).collation({ locale: "en" }).sort({ title: +1 }).then((Models) => {
        //console.log('Models', Models);
        var actions = Models.map(getfilesArrays);
        var results = Promise.all(actions); // pass array of promises
        results.then(function(dat) {
            //console.log(nameFile +  " | Models List: ", dat);
            ret.setMessages("List");
            ret.setData(dat);
            return res.send(ret);
        })
    }).catch(function(err) {
        console.error("ERROR | " + nameFile + ' | get | queryFind : ', err);
        logger.error(nameFile + ' | get | queryFind : ' + err);
    });
});

router.get('/content/:entype/:fileid', function(req, res, next) {
    var file_id = req.params.fileid;
    let enttype = req.params.entype;
    //   console.log("file_id", file_id);
    console.log(nameFile + ' | get/content/:entype/:fileid |  fileid: ', file_id);
    recFile(mongoose.Types.ObjectId(file_id))
        .then(function(result) {
            if (result != undefined) {
                res.writeHead(200, {
                    'Content-Type': result.contentType,
                    'Content-Length': result.length,
                    'Content-Disposition': 'filename=' + result.filename
                });
                res.end(result.data);
            } else {
                res.writeHeader(200, { "Content-Type": "text/html" });
                res.write("<b>Something went wrong :( </b> . Reload the page. <br> If the problem persists, contact support");
                res.end();
            }
        })
        .catch(function(err) {
            console.error("ERROR | " + nameFile + ' | get/content/:entype/:fileid  : ', err);
            logger.error(nameFile + ' | get/content/:entype/:fileid : ' + err);
        });
});

router.post('/', util.checkIsAdmin, function(req, res) {
    const ret = new jsonResponse();
    const endpointName = "POST / (Create Model)";
    console.log("" + nameFile + " | " + endpointName);
    logger.info(nameFile + " | " + endpointName);
    upload(req, res, function(err) {
        if (err) {
            logger.error(`${nameFile} | ${endpointName} | Upload Error: ${err.message}`);
            ret.setMessages("Errore durante l'upload dei file");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.status(500).send(ret);
        }

        const callData = util.getAllQuery(req);
        const data = callData.data;
        
        // Estrazione ID file caricati
        const files_arr = (req.files || []).map(file => file.id);

        // --- LOGICA DI ESTRAZIONE INTEROPERABILITÀ (DCAT + IDS) ---
        let dcatMappings = {};
        let idsMappings = {};
        
        if (data.structure) {
            try {
                const $ = cheerio.load(data.structure);
                // Scansione di tutti i campi che hanno mapping semantici
                $('[data-dcat-map], [data-ids-map]').each(function() {
                    const fieldName = $(this).attr('name');
                    const dcatVal = $(this).attr('data-dcat-map');
                    const idsVal = $(this).attr('data-ids-map');
                    
                    if (fieldName) {
                        if (dcatVal) dcatMappings[fieldName] = dcatVal;
                        if (idsVal) idsMappings[fieldName] = idsVal;
                    }
                });
                logger.info(`${nameFile} | ${endpointName} | Mappings estratti: DCAT(${Object.keys(dcatMappings).length}), IDS(${Object.keys(idsMappings).length})`);
            } catch (parseErr) {
                logger.warn(`${nameFile} | ${endpointName} | Errore parsing HTML structure: ${parseErr.message}`);
            }
        }

        const newObj = {
            title: data.title,
            author: data.author,
            description: data.description,
            posturl: data.posturl,
            instance: data.instance, 
            structure: data.structure,
            files: files_arr,
            // Nuova sezione Interoperabilità Multi-Standard
            interoperability: {
                enabled: (Object.keys(dcatMappings).length > 0 || Object.keys(idsMappings).length > 0),
                profiles: {
                    dcat: { mappings: dcatMappings },
                    ids: { mappings: idsMappings }
                },
                metadata: {
                    type: "dcat:Dataset",
                    ids_resource: "ids:DataResource",
                    created: new Date(),
                    publisher: data.author || "DYMER Instance"
                }
            }
        };
        console.log (newObj );
        const mod = new Model(newObj);
        mod.save().then((el) => {
            logger.info(`${nameFile} | ${endpointName} | Modello salvato con successo: ${el._id}`);
            ret.setMessages("Modello caricato con successo con mapping di interoperabilità");
            
            // Recupero e restituzione lista aggiornata
            const queryFind = { '_id': mongoose.Types.ObjectId(el._id) };
            Model.find(queryFind).then((Models) => {
                const actions = Models.map(getfilesArrays);
                Promise.all(actions).then((dat) => {
                    ret.setData(dat);
                    return res.send(ret);
                });
            });
        }).catch((err) => {
            logger.error(`${nameFile} | ${endpointName} | Save Error: ${err.message}`);
            ret.setMessages("Errore durante il salvataggio su database");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.status(500).send(ret);
        });
    });
});




router.post('/create', util.checkIsAdmin, function(req, res) {
    //console.log(">>>create");
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
        var mod = new Model(data);
        mod.save().then((el) => {
            /*console.log(nameFile + ' | post/create  |  saved successfully :', JSON.stringify(data));*/
            logger.info(nameFile + ' | post/create  |  saved successfully :' + JSON.stringify(data));
            ret.setMessages("Model uploaded successfully");
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
        var myfilter = { "_id": data.pageId };
        var updateData = { "files": element.id };
        var myquery = { "$push": updateData };
        Model.updateOne(myfilter, myquery,
            function(err, raw) {
                if (err) {
                    console.error("ERROR | " + nameFile + ' | post/addAsset | updateOne  : ', err);
                    logger.error(nameFile + ' | post/addAsset | updateOne  : ' + err);
                    ret.setSuccess(false);
                    ret.setMessages("Model Error");
                    return res.send(ret);
                } else {
                    //console.log(nameFile + ' | post/addAsset  |  updateOne successfully :', JSON.stringify(updateData));
                    logger.info(nameFile + ' | post/addAsset  |  updateOne successfully :' + JSON.stringify(updateData));
                    ret.addData(updateData);
                    ret.setMessages("Model Updated");
                    return res.send(ret);
                }
            }
        );
    });
});

router.post('/update', util.checkIsAdmin, function(req, res) {
    console.log(">>>update");
    console.log("RICEVUTO ", req.body)
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
                'description': data.description
            }
        };
        //console.log("---data ", data);
        Model.updateOne(myfilter, myquery,
            function(err, raw) {
                if (err) {
                    ret.setSuccess(false);
                    console.error("ERROR | " + nameFile + ' | post/update | updateOne  : ', err);
                    logger.error(nameFile + ' | post/update | updateOne  : ' + err);
                    ret.setMessages("Model Error");
                    return res.send(ret);
                } else {
                    //console.log(nameFile + ' | post/update  |  updateOne successfully :', data.title);
                    logger.info(nameFile + ' | post/update  |  updateOne successfully :' + data.title);
                    ret.setMessages("Model Updated");
                    /*VL*/
                    console.log(">>>data ", data);
                    ret.setData(data);
                    /*VL*/
                    return res.send(ret);
                }
            }
        );
    });
});

router.post('/updatestructure_NO', util.checkIsAdmin, function(req, res) {
        const ret = new jsonResponse();
    const endpointName = "POST /updatestructure (Update Model)";
    console.log(">>>updatestructure");
    upload(req, res, function(err) {
        if (err) {
            logger.error(`${nameFile} | ${endpointName} | Upload Error: ${err.message}`);
            ret.setMessages("Errore durante l'upload");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.status(500).send(ret);
        }

        const callData = util.getAllQuery(req);
        const data = callData.data;
        
        if (!data.pageId || !data.structure) {
            ret.setSuccess(false);
            ret.setMessages("Parametri mancanti: pageId o structure");
            return res.status(400).send(ret);
        }

        let strct;
        try {
            strct = (typeof data.structure === 'string') ? JSON.parse(data.structure) : data.structure;
        } catch (e) {
            strct = data.structure; // Fallback se non è una stringa JSON
        }

        // --- RICALCOLO MAPPINGS (Sincronizzazione DCAT + IDS) ---
        let dcatMappings = {};
        let idsMappings = {};
        
        try {
            const $ = cheerio.load(strct);
            $('[data-dcat-map], [data-ids-map]').each(function() {
                const fieldName = $(this).attr('name');
                const dcatVal = $(this).attr('data-dcat-map');
                const idsVal = $(this).attr('data-ids-map');
                
                if (fieldName) {
                    if (dcatVal) dcatMappings[fieldName] = dcatVal;
                    if (idsVal) idsMappings[fieldName] = idsVal;
                }
            });
        } catch (parseErr) {
            logger.error(`${nameFile} | ${endpointName} | Errore analisi struttura HTML: ${parseErr.message}`);
        }

        const myfilter = { "_id": data.pageId };
        const myquery = {
            "$set": {
                'structure': strct,
                'interoperability.profiles.dcat.mappings': dcatMappings,
                'interoperability.profiles.ids.mappings': idsMappings,
                'interoperability.enabled': (Object.keys(dcatMappings).length > 0 || Object.keys(idsMappings).length > 0),
                'interoperability.metadata.lastUpdate': new Date()
            }
        };

        Model.updateOne(myfilter, myquery, function(err, raw) {
            if (err) {
                logger.error(`${nameFile} | ${endpointName} | UpdateOne Error: ${err.message}`);
                ret.setSuccess(false);
                ret.setMessages("Errore durante l'aggiornamento del modello");
                return res.status(500).send(ret);
            } else {
                logger.info(`${nameFile} | ${endpointName} | Modello aggiornato con successo: ${data.title} (ID: ${data.pageId})`);
                ret.setMessages("Modello aggiornato con successo e mapping sincronizzati");
                return res.send(ret);
            }
        });
    });

});

// Funzione helper per gestire l'upload come Promise
const runUpload = (req, res) => {
    return new Promise((resolve, reject) => {
        upload(req, res, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

// Funzione helper per estrarre i mapping dalla struttura
const extractInteroperabilityMappings = (structure) => {
    const dcatMappings = {};
    const idsMappings = {};
    try {
        const $ = cheerio.load(structure);
        console.log("cheerio loaded for mapping extraction", $.html());
        $('[data-dcat-map], [data-ids-map]').each(function() {
            const fieldName = $(this).attr('name');
            const dcatVal = $(this).attr('data-dcat-map');
            const idsVal = $(this).attr('data-ids-map');
            console.log(`Mapping found - field: ${fieldName}, DCAT: ${dcatVal}, IDS: ${idsVal}`);
            if (fieldName) {
                if (dcatVal) dcatMappings[fieldName] = dcatVal;
                if (idsVal) idsMappings[fieldName] = idsVal;
            }
        });
    } catch (e) {
        logger.error(`Errore parsing HTML per mapping: ${e.message}`);
    }
    return { dcatMappings, idsMappings };
};

// --- ROTTA REFACTORIZZATA ---
router.post('/updatestructure', util.checkIsAdmin, (req, res) => {
    const ret = new jsonResponse();
    const endpointName = "POST /updatestructure";
    upload(req, res, function (err) {
        if (err) {
            console.error("ERROR | " + nameFile + ' | ' + endpointName + ' | Upload:', err);
            logger.error(nameFile + ' | ' + endpointName + ' | Upload Error: ' + err.message);

            ret.setMessages("Errore durante l'upload");
            ret.setSuccess(false);
            ret.setExtraData({ log: err.stack });

            return res.status(500).send(ret);
        }

        let callData = util.getAllQuery(req);
        let data = callData.data;

        logger.info(nameFile + ' | ' + endpointName + ' | data: ' + JSON.stringify(data));

        if (!data || !data.pageId || !data.structure) {
            ret.setSuccess(false);
            ret.setMessages("Parametri mancanti: pageId o structure");
            return res.status(400).send(ret);
        }

        let strct;
        try {
            strct = (typeof data.structure === 'string')
                ? JSON.parse(data.structure)
                : data.structure;
        } catch (e) {
            console.warn(nameFile + ' | ' + endpointName + ' | JSON parse fallback');
            strct = data.structure;
        }

        let dcatMappings = {};
        let idsMappings = {};

        try {
            if (typeof strct === 'string') {
                const $ = cheerio.load(strct);

                $('[data-dcat-map], [data-ids-map]').each(function () {
                    const fieldName = $(this).attr('name');
                    const dcatVal = $(this).attr('data-dcat-map');
                    const idsVal = $(this).attr('data-ids-map');

                    if (fieldName) {
                        if (dcatVal) dcatMappings[fieldName] = dcatVal;
                        if (idsVal) idsMappings[fieldName] = idsVal;
                    }
                    console.log(`Mapping found - field: ${fieldName}, DCAT: ${dcatVal}, IDS: ${idsVal}`);
                });
            }
        } catch (parseErr) {
            console.error("ERROR | " + nameFile + ' | ' + endpointName + ' | Cheerio:', parseErr);
            logger.error(nameFile + ' | ' + endpointName + ' | Errore analisi HTML: ' + parseErr.message);
        }

        const myfilter = { "_id": data.pageId };

        const myquery = {
            "$set": {
                structure: strct,
                'interoperability.profiles.dcat.mappings': dcatMappings,
                'interoperability.profiles.ids.mappings': idsMappings,
                'interoperability.enabled': (
                    Object.keys(dcatMappings).length > 0 ||
                    Object.keys(idsMappings).length > 0
                ),
                'interoperability.metadata.lastUpdate': new Date()
            }
        };

        Model.updateOne(myfilter, myquery, function (err, raw) {
            if (err) {
                console.error("ERROR | " + nameFile + ' | ' + endpointName + ' | updateOne:', err);
                logger.error(nameFile + ' | ' + endpointName + ' | UpdateOne Error: ' + err.message);

                ret.setSuccess(false);
                ret.setMessages("Errore durante l'aggiornamento del modello");

                return res.status(500).send(ret);
            }

            logger.info(
                nameFile + ' | ' + endpointName +
                ' | Modello aggiornato: ' + data.title +
                ' (ID: ' + data.pageId + ')'
            );

            ret.setMessages("Modello aggiornato con successo");
            ret.setExtraData({
                dcatMappingsCount: Object.keys(dcatMappings).length,
                idsMappingsCount: Object.keys(idsMappings).length,
                interoperabilityEnabled: myquery.$set['interoperability.enabled']
            });

            return res.send(ret);
        });
    });
     
});






router.post('/updateAsset', util.checkIsAdmin, function(req, res) {
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
        var element1 = req.files[1];
        logger.info(nameFile + '| post/updateAsset | data :' + JSON.stringify(data));
        // console.log('element data', data);
        // console.log('element', req.files[0]);
        // console.log('element1', req.files[1]);
        var myfilter = { "_id": mongoose.Types.ObjectId(data.pageId) };
        var bulk = Model.collection.initializeOrderedBulkOp();
        bulk.find(myfilter).updateOne({ "$pull": { "files": mongoose.Types.ObjectId(data.assetId)},
                                        /*MG - Inserito aggiornamento data di modifica*/                                
                                         "$set":  { "properties.changed": new Date().toISOString()}
                                      });
        bulk.find(myfilter).updateOne({ "$push": { "files": mongoose.Types.ObjectId(element.id) } });

        bulk.execute(function(err, result) {
            if (err) {
                ret.setSuccess(false);
                console.error("ERROR | " + nameFile + ' | post/updateAsset | execute  : ', err);
                logger.error(nameFile + ' | post/updateAsset | execute  : ' + err);
                ret.setMessages("Model Error");
                return res.send(ret);
            } else {
                //console.log(nameFile + ' | post/updateAsset  |  execute :', data.assetId);
                logger.info(nameFile + '| post/updateAsset | execute :' + data.assetId);
                gridFSBucket.delete(mongoose.Types.ObjectId(data.assetId)).then(() => {
                    ret.setMessages("Model Updated");
                    ret.setExtraData({ newAssetId: element.id });
                    return res.send(ret);
                }).catch(function(err) {
                     /*MG - Se l'asset non viene trovato, accedo per recuperare il suo id aggiornato, 
                           in modo da poterlo eliminare
                    INIZIO MODIFICHE*/
                    //ret.setSuccess(false);
                    //console.error("ERROR | " + nameFile + ' | post/updateAsset | delete  : ', err);
                    //logger.error(nameFile + ' | post/updateAsset | delete  : ' + err);
                    //ret.setMessages("Model Error");
                    Model.find(myfilter).then((Models) => {
                        var actions = Models.map(getfilesArrays);
                        var results = Promise.all(actions);
                        results.then(function(data) {
                            data.forEach(d => {
                                var found = false;
                                d.files.forEach(file => {
                                    if (file.filename == element.filename && !found){
                                        found = true;
                                        var myquery = { "$pull": { "files": mongoose.Types.ObjectId(file._id) },
                                                         /*MG - Inserito aggiornamento data di modifica*/                                
                                                         "$set":  { "properties.changed": new Date().toISOString()}
                                                      };
                                        Model.updateOne(myfilter, myquery,
                                            function(err, raw) {
                                                if (err) {
                                                    cconsole.error("ERROR | " + nameFile + ' | post/updateAsset | delete  : ', err);
                                                    logger.error(nameFile + ' | post/updateAsset | delete  : ' + err);
                                                } else {
                                                    gridFSBucket.delete(mongoose.Types.ObjectId(file._id)).then(() => {
                                                        logger.info(nameFile + ' | post/updateAsset  | Model Updated file._id :' + file._id);
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
                  /*  ret.setSuccess(false);
                    console.error("ERROR | " + nameFile + ' | post/updateAsset | delete  : ', err);
                    logger.error(nameFile + ' | post/updateAsset | delete  : ' + err);
                    ret.setMessages("Model Error");*/
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
        //console.log(nameFile + ' | delete/:id  | findOneAndDelete successfully :', JSON.stringify(myfilter));
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
                logger.error(nameFile + ' | delete/:id/:fid | updateOne : ' + err);
                ret.setMessages("Model Error");
                return res.send(ret);
            } else {
                gridFSBucket.delete(mongoose.Types.ObjectId(fid)).then(() => {
                    // console.log(nameFile + ' | delete/:id/:fid  | delete successfully :', fid);
                    logger.info(nameFile + ' | delete/:id/:fid  | deleted successfully :' + fid);
                    return res.send(ret);
                });
            }
        }
    );
});

module.exports = router;
