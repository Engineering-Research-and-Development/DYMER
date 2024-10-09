var util = require('../utility');
var jsonResponse = require('../jsonResponse');
var http = require('http');
var https = require('https');
var express = require('express');
const FormData = require('form-data')
const bodyParser = require("body-parser");
const path = require('path');
const nameFile = path.basename(__filename);
const mongoose = require("mongoose");
const logger = require('./dymerlogger');
require('./mongodb.js');
const axios = require('axios');
const fs = require('fs');
var router = express.Router();
const cheerio = require('cheerio');
//const cron = require("node-cron");
//const schedule = require('node-schedule');
//https://www.npmjs.com/package/cron-job-manager
var CronJobManager = require('cron-job-manager');
const multer = require('multer');
const { json } = require('body-parser');
//DymerCronJobRule
require("../models/permission/DymerCronJobRule");
const DymRule = mongoose.model("DymerCronJobRule");
router.use(bodyParser.json({ limit: '50mb', extended: true }))
router.use(bodyParser.urlencoded({ limit: '100mb', extended: true }))

// TODO lfr companyId and groupId customization

router.get('/cronjob', util.checkIsAdmin, (req, res) => {
    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let data = callData.data;
    //return res.send(ret);
    //  console.log('data', data);
    // console.log('test');
    var queryFind = {};
    DymRule.find(queryFind).then((els) => {
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
var loblist = [];
/*const job = nodeCron.schedule("* * * * * *", function jobYouNeedToExecute() {
    // Do whatever you want in here. Send email, Make  database backup or download data.
    console.log("a", new Date().toLocaleString());
}, {
    scheduled: false
});
const job2 = nodeCron.schedule("* * * * * *", function jobYouNeedToExecute() {
    // Do whatever you want in here. Send email, Make  database backup or download data.
    console.log("a2", new Date().toLocaleString());
}, {
    scheduled: false
});
*/
pushrunJobs();
var countstop = 0;

var manager = new CronJobManager();

function pushrunJobs() {
    var queryFind = { active: true };
    DymRule.find(queryFind).then((els) => {
        els.forEach(element => {
            var key = (element._id).toString();
            manager.add(key, element.time, () => {
                countstop++;
                logger.info(nameFile + ' | pushrunJobs | countstop :' + countstop + " " + element.title);
                //console.log("countstop", countstop);
                //console.log("a2", element.title, new Date().toLocaleString());
                let urlToInvocke = util.getServiceUrl('webserver') + util.getContextPath('webserver') + '/api/dservice/api/v1/import/fromdymer/' + key
                axios.get(urlToInvocke).then(resp => {
                    logger.info(nameFile + ' | invoco super :' + key);
                    //console.log("invoco super", key);
                });
            });
            manager.start(key);
        });
    }).catch((err) => {})
}

function stopAndRestartAll() {
    manager.stopAll();
    manager = new CronJobManager();
    pushrunJobs();
}

function stopJob(campaignId) {
    // console.log("provo a terminare");
    /*loblist[index].stop();*/
    manager.stop(campaignId)
        /* job.stop();*/
        // console.log("ho terminato il processo");
    logger.info(nameFile + ' | stopJob :' + campaignId);
}

router.post('/cronjob/:id?', util.checkIsAdmin, function(req, res) {
    let id = req.params.id;
    let callData = util.getAllQuery(req);
    // let data = callData.data;
    let data = req.body;
    var copiaData = Object.assign({}, data);
    var ret = new jsonResponse();
    if (id != undefined) {
        var myfilter = { "_id": mongoose.Types.ObjectId(id) };
        DymRule.updateOne(myfilter, data,
            function(err, raw) {
                if (err) {
                    ret.setSuccess(false);
                    logger.error(nameFile + ' | post/cronjob/:id? | updateOne :' + err);
                    console.error("ERROR | " + nameFile + " | post/cronjob/:id? | updateOne :", err);
                    ret.setMessages("Model Error");
                    return res.send(ret);
                } else {
                    ret.addData(copiaData);
                    ret.setMessages("Config Updated");
                    stopAndRestartAll();
                    return res.send(ret);
                }
            }
        );
    } else {
        var mod = new DymRule(data);
        mod.save().then((el) => {
            ret.setMessages("Config created successfully");
            ret.addData(el);
            stopAndRestartAll();
            return res.send(ret);
        }).catch((err) => {
            if (err) {
                logger.error(nameFile + ' | post/cronjob/:id? | create: ' + err);
                console.error("ERROR | " + nameFile + " | post/cronjob/:id? | create: ", err);
                ret.setMessages("Post error");
                ret.setSuccess(false);
                ret.setExtraData({ "log": err.stack });
                return res.send(ret);
            }
        })

    }
});
router.put('/cronjob/:id', util.checkIsAdmin, (req, res) => {
    //console.log("Put cronjob Roles");
    let id = req.params.id;
    logger.info(nameFile + ' | put/cronjob/:id   :' + id);
    let callData = util.getAllQuery(req);
    //let data = callData.data;
    let data = req.body;
    var copiaData = Object.assign({}, data);
    var ret = new jsonResponse();
    var myfilter = { "_id": mongoose.Types.ObjectId(id) };
    var myquery = {
        "$set": req.body
    };
    DymRule.updateOne(myfilter, req.body,
        function(err, raw) {
            if (err) {
                ret.setSuccess(false);
                console.error("ERROR | " + nameFile + " | put/cronjob/:id? | updateOne :", err);
                logger.error(nameFile + ' | put/cronjob/:id? | updateOne : ' + err);
                ret.setMessages("Element Error");
                return res.send(ret);
            } else {
                ret.addData(copiaData);
                ret.setMessages("Element Updated");
                stopAndRestartAll();
                return res.send(ret);
            }
        }
    );
});
router.delete('/cronjob/:id', util.checkIsAdmin, (req, res) => {
    var ret = new jsonResponse();
    var id = req.params.id;
    var myfilter = { "_id": id };
    DymRule.findOneAndDelete(myfilter).then((el) => {
        ret.setMessages("Element deleted");
        stopAndRestartAll();
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | delete/cronjob/:id? | findOneAndDelete :", err);
            logger.error(nameFile + ' | delete/cronjob/:id? | findOneAndDelete : ' + err);
            ret.setMessages("Delete Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


router.post('/test-csv', upload.single('file'), async (req, res) => {
    if(req.file) {

        let fileBuffer = req.file.buffer.toString("utf8")
        let records = fileBuffer.split("\n")

        res.status(200).send(records);
    } else {
        res.status(400).send("Missing File")
    }
})

router.post('/fromcsv/:enttype', util.checkIsAdmin, (req, res) => {
    let ret = new jsonResponse();
    let listTopost = [];
    let newentityType = req.params.enttype

    let lista = req.body.dataToImport
    logger.info(nameFile + '| post/fromcsv | import :' + newentityType);

    var pt = util.getServiceUrl('webserver') + util.getContextPath('webserver') + "/api/entities/api/v1/entity/_search";
    const originalrelquery = req.body.indtorel //"dih";
    var query = {
        "query": {
            "query": {
                "bool": {
                    "must": [{
                        "term": {
                            "_index": originalrelquery
                        }
                    }]
                }
            }
        }
    };

    console.log("QUERY:", JSON.stringify(query))
    axios.post(pt, query).then(response => {
        const listaRel = response.data.data;
        //////////////
        // console.log("listaRel", listaRel)
        lista.forEach(element => {
            var propert_ = {
                owner: {
                    uid: element["properties.owner"],  //0
                    gid: 20121 //0
                },
                "grant": {
                    "update": {
                        "uid": [
                            ""
                        ],
                        "gid": [
                            ""
                        ]
                    },
                    "delete": {
                        "uid": [
                            ""
                        ],
                        "gid": [
                            ""
                        ]
                    },
                    "managegrant": {
                        "uid": [
                            ""
                        ],
                        "gid": [
                            ""
                        ]
                    }
                },
                ipsource: util.getServiceUrl('webserver') + util.getContextPath('webserver') //"airegio" //url web server
            };
            propert_.status = "1";
            propert_.visibility = "0";
            propert_.extrainfo = {
                lastupdate: {
                    uid: element["properties.owner"], //"admin@dymer.it", // mail owner
                    origin: util.getServiceUrl('webserver') + util.getContextPath('webserver') //"http://localhost:8080/listentities"  // url web server
                }
            }
            propert_.changed = (new Date()).toISOString(); //"2024-02-28T11:15:17.650Z"  // vuoto
            
            let elrel = listaRel.find((el) => el["_source"].title == element["DIH"]); //DIHNAME era DIH
            // let elrel = listaRel.find((el) => el["_source"].title == element["url"]); //DIHNAME era DIH
            let rel_id = undefined;
            if (elrel != undefined) rel_id = elrel["_id"];
            
            var singleEntity = {
                "instance": {
                    "index": newentityType
                    //"type": newentityType
                },

                "data": buildNestedObj(element)
            };

            console.log("==>singleEntity ", singleEntity);
            
            singleEntity.data.properties = propert_
            /* Code for relation from Service to DIH - TO TEST */
            if(newentityType.toLocaleLowerCase() == "service") {
                     if (rel_id != undefined)
                            singleEntity.data.relation = { dih: [{ to: rel_id }] };
             }
            /* custom code for DIH4INDUSTRY - Mandatory */
            if(newentityType.toLocaleLowerCase() == "dih") {
                const initiativesArray = singleEntity.data.initiatives?.replace(/\r/g, '').split(",").map(el => { return {"to": el}})
                const projectArray = singleEntity.data.project?.replace(/\r/g, '').split(",").map(el => { return {"to": el}})

                // initialize if I need
                singleEntity.data.relation = singleEntity.data.relation || {};
                singleEntity.data.relation.initiatives = singleEntity.data.relation.initiatives || [];
                singleEntity.data.relation.project = singleEntity.data.relation.project || [];

                for(let itv of initiativesArray) {
                    singleEntity.data.relation.initiatives.push(itv);
                }

                for(let prj of projectArray) {
                    singleEntity.data.relation.project.push(prj);
                }
            }
            

            console.log(JSON.stringify(singleEntity))
            var extrainfo = {
                "extrainfo": {
                    "companyId": "20097",
                    "groupId": "20121",
                    "cms": "lfr",
                    "userId": element["email"],
                    "virtualhost": "localhost"
                }
            };
            let extrainfo_objJsonStr = JSON.stringify(extrainfo);
            let extrainfo_objJsonB64 = Buffer.from(extrainfo_objJsonStr).toString("base64");
            var userinfo = {
                "isGravatarEnabled": false,
                "authorization_decision": "",
                "roles": [{
                    "role": "User",
                    "id": "20109"
                },
                {
                    "role": "app-admin",
                    "id": "20110"
                }
                ],
                "app_azf_domain": "",
                "id": element["email"],
                "app_id": "",
                "email": element["email"],
                "username": element["email"]
            };
            let userinfo_objJsonStr = JSON.stringify(userinfo);
            let userinfo_objJsonB64 = Buffer.from(userinfo_objJsonStr).toString("base64");
            var objToPost = { 'data': singleEntity, 'DYM': userinfo_objJsonB64, 'DYM_EXTRA': extrainfo_objJsonB64 };
            listTopost.push(objToPost);
        });
        listTopost.forEach(function (obj, index) {
            setTimeout(function () {
                logger.info(nameFile + ' get/fromjson | import timeout axios :' + index + " " + JSON.stringify(obj.data));
                postMyData(obj.data, newentityType, obj.DYM, obj.DYM_EXTRA);
            }, 1000 * (index + 1));
        });
        return res.send(ret);

    })
        .catch(error => {
            console.error("ERROR | " + nameFile + " | get/fromjson ", error);
            logger.error(nameFile + ' | get/fromjson : ' + error);
        });

});

function buildNestedObj(dottedObj) {
    const result = {};
    for (const key in dottedObj) {
        if (dottedObj.hasOwnProperty(key)) {
            const keys = key.split('.');
            let currentLevel = result;
            
            for (let i = 0; i < keys.length; i++) {
                const nestedKey = keys[i];
                if (i === keys.length - 1) {
                    currentLevel[nestedKey] = dottedObj[key];
                } else {
                    currentLevel[nestedKey] = currentLevel[nestedKey] || {};
                    currentLevel = currentLevel[nestedKey];
                }
            }
        }
    }
    /**/
    if(result["representatives"]) {
        let representatives = JSON.stringify(result["representatives"]);
        delete result["representatives"]
        result["representatives"] = [JSON.parse(representatives)]
    }
    /**/
    // if(!result.properties) result.properties = {}
    // if(result.properties?.owner) result.properties.owner = {owner: result.properties.owner}

    return result;
}
/******************************************/

// '/api/dservice/api/v1/import/fromjson'
router.get('/fromjson', util.checkIsAdmin, (req, res) => {
    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let data = callData.data;
    let queryFind = callData.query;
    var filename = callData.filename;
    var entityType = callData.type;
    var listTopost = [];
    //console.log(nameFile + ' | get/fromjson | import : ', filename);
    logger.info(nameFile + '| get/fromjson | import :' + filename);
    //http://localhost:8080/api/dservice/api/v1/import/fromjson?filename=AIREGIO_ServicePortfolio_onlinePortal.json.js&type=organization
    fs.readFile('importfile/' + filename, (err, data) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | get/fromjson  :", err);
            logger.error(nameFile + ' | get/fromjson | get/fromjson  : ' + err);
            return res.send(ret);
        } //throw err;
        let list = JSON.parse(data);
        let lista = list["Portfolio"];
        var pt = util.getServiceUrl('webserver') + util.getContextPath('webserver') + "/api/entities/api/v1/entity/_search";
        const originalrelquery = "dih";
        const newentityType = "service";
        var query = {
            "query": {
                "query": {
                    "bool": {
                        "must": [{
                            "term": {
                                "_index": originalrelquery
                            }
                        }]
                    }
                }
            }
        };
        axios.post(pt, query).then(response => {
                const listaRel = response.data.data;
                lista.forEach(element => {
                    var propert_ = {
                        owner: {
                            uid: 0,
                            gid: 0
                        },
                        "grant": {
                            "update": {
                                "uid": [
                                    ""
                                ],
                                "gid": [
                                    ""
                                ]
                            },
                            "delete": {
                                "uid": [
                                    ""
                                ],
                                "gid": [
                                    ""
                                ]
                            },
                            "managegrant": {
                                "uid": [
                                    ""
                                ],
                                "gid": [
                                    ""
                                ]
                            }
                        },
                        ipsource: "airegio"
                    };
                    propert_.status = "1";
                    propert_.visibility = "0";
                    let elrel = listaRel.find((el) => el["_source"].title == element["DIH"]);
                    let rel_id = undefined;
                    if (elrel != undefined) rel_id = elrel["_id"];
                    var singleEntity = {
                        "instance": {
                            "index": newentityType
                            //"type": newentityType
                        },
                        "data": {
                            title: element["TITLE"],
                            "description": element["DESCRIPTION_FULL"],
                            "category": element["CLASS"],
                            "service": element["SERVICE"],
                            "type": element["TYPE"],
                            properties: propert_
                        }
                    };
                    if (rel_id != undefined)
                        singleEntity.data.relation = { dih: [{ to: rel_id }] };
                    var extrainfo = {
                        "extrainfo": {
                            "companyId": "20097",
                            "groupId": "20121",
                            "cms": "lfr",
                            "userId": element["userid"],
                            "virtualhost": "localhost"
                        }
                    };
                    let extrainfo_objJsonStr = JSON.stringify(extrainfo);
                    let extrainfo_objJsonB64 = Buffer.from(extrainfo_objJsonStr).toString("base64");
                    var userinfo = {
                        "isGravatarEnabled": false,
                        "authorization_decision": "",
                        "roles": [{
                                "role": "User",
                                "id": "20109"
                            },
                            {
                                "role": "app-teter",
                                "id": "20110"
                            }
                        ],
                        "app_azf_domain": "",
                        "id": element["owner"],
                        "app_id": "",
                        "email": element["owner"],
                        "username": element["owner"]
                    };
                    let userinfo_objJsonStr = JSON.stringify(userinfo);
                    let userinfo_objJsonB64 = Buffer.from(userinfo_objJsonStr).toString("base64");
                    var objToPost = { 'data': singleEntity, 'DYM': userinfo_objJsonB64, 'DYM_EXTRA': extrainfo_objJsonB64 };
                    listTopost.push(objToPost);
                });
                listTopost.forEach(function(obj, index) {
                    setTimeout(function() {
                        //  console.log("import timeout axios", index);
                        logger.info(nameFile + ' get/fromjson | import timeout axios :' + index + " " + JSON.stringify(obj.data));
                        postMyData(obj.data, newentityType, obj.DYM, obj.DYM_EXTRA);
                    }, 1000 * (index + 1));
                });
                return res.send(ret);
            })
            .catch(error => {
                console.error("ERROR | " + nameFile + " | get/fromjson ", error);
                logger.error(nameFile + ' | get/fromjson : ' + error);
            });
    });
});

function appendFormdata(FormData, data, name) {
    var name = name || '';
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

function appendFormdataFiles(FormData, data, name, folder) {
    var name = name || '';
    if (typeof data === 'object' && data != null) {
        var index = 0
        if (data.hasOwnProperty("filename") && data.hasOwnProperty("bucketName")) {
            let fnametotal = folder + data.filename;

            FormData.append(name, fs.createReadStream(fnametotal));
        } else {
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    if (name === '') {
                        appendFormdataFiles(FormData, data[key], key, folder);
                    } else {
                        appendFormdataFiles(FormData, data[key], name + '[' + key + ']', folder);
                    }
                }
                index++;
            }
        }
    } else {
        FormData.append(name, data);
    }
}

function checkFilesFormdata(arr, data, name) {
    var name = name || '';
    if (typeof data === 'object' && data != null) {
        var index = 0
        if (data.hasOwnProperty("filename") && data.hasOwnProperty("bucketName")) {
            arr.push(data);
        }
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                if (name === '') {
                    checkFilesFormdata(arr, data[key], key);
                } else {
                    checkFilesFormdata(arr, data[key], name + '[' + key + ']');
                }
            }
            index++;
        }
    }
}

function postMyData(el, index, DYM, DYM_EXTRA) {
    console.log("==>postMyData");
    // var posturl = "http://localhost:8080/api/entities/api/v1/entity/" + index;
    var posturl = util.getServiceUrl('webserver') + util.getContextPath('webserver') + "/api/entities/api/v1/entity/" + index;
    var formdata = new FormData();
    appendFormdata(formdata, el);
    var config = {
        method: 'post',
        url: posturl,
        headers: {
            ...formdata.getHeaders(),
            'Authorization': `Bearer ${DYM}`,
            'extrainfo': `${DYM_EXTRA}`,
	    'dymeruser':`${DYM}`
        },
        data: formdata
    };
    console.log("==>postMyData config ", config);
    axios(config)
        .then(function(updatedEl) {}).catch(function(error) {
            console.log("Error__________", error);
            logger.error(nameFile + ' | postMyData : ' + error);
        });

}
var downloadFile = function(url, dest, filename) {
    return new Promise(function(resolve, reject) {
        if (url.startsWith("https")) {
            https.get(url, (res) => {
                // Image will be stored at this path
                //const path = `${__dirname}../importfile/img.jpeg`;
                const path = `${dest}/${filename}`;
                const filePath = fs.createWriteStream(path);
                res.pipe(filePath);
                filePath.on('finish', () => {
                    filePath.close();
                    resolve();
                })
            }).on('error', err => {
                console.log('Error: | downloadFile ', err.message);
            });
        } else {
            http.get(url, (res) => {
                // Image will be stored at this path
                //const path = `${__dirname}../importfile/img.jpeg`;
                const path = `${dest}/${filename}`;
                const filePath = fs.createWriteStream(path);
                res.pipe(filePath);
                filePath.on('finish', () => {
                    filePath.close();
                    resolve();
                })
            }).on('error', err => {
                console.log('Error: | downloadFile ', err.message);
            });
        }

    }).catch(function(err) {
        console.error("ERROR | " + nameFile + " | downloadFile ", err);
        logger.error(nameFile + ' | downloadFile : ' + err);
    });
}
const removeDir = function(path) {
    if (fs.existsSync(path)) {
        const files = fs.readdirSync(path)
        if (files.length > 0) {
            files.forEach(function(filename) {
                if (fs.statSync(path + "/" + filename).isDirectory()) {
                    removeDir(path + "/" + filename)
                } else {
                    fs.unlinkSync(path + "/" + filename)
                }
            })
            fs.rmdirSync(path)
        } else {
            fs.rmdirSync(path)
        }
    } else {
        console.error("ERROR | " + nameFile + " | Directory path not found ", path);
        logger.error(nameFile + ' | removeDir | Directory path not found  : ' + path);
    }
}


function postMyDataAndFiles(el, index, DYM, DYM_EXTRA, action, fileurl) {
    console.log("==>postMyDataAndFiles");
    var posturl = util.getServiceUrl('webserver') + util.getContextPath('webserver') + "/api/entities/api/v1/entity/" + index;
    console.log("==>posturl ",posturl);
    console.log("==>action ",action);
    if (action == "put")
        posturl = util.getServiceUrl('webserver') + util.getContextPath('webserver') + "/api/entities/api/v1/entity/" + el.instance.id;
    console.log("==>posturl ",posturl);
    var formdata = new FormData();
    let arrlistFiles = [];
    let dest = 'tempfolder';
    const dir = dest + "/" + el.instance.id;
    checkFilesFormdata(arrlistFiles, el);
    let requests = arrlistFiles.map((fl) => {
        let url = fileurl + "/api/entities/api/v1/entity/contentfile/" + el.instance.id + "/" + fl.id;
        url += "?tkdym=" + DYM;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        let fname = fl.filename;
        // console.log('fname', el.instance.id, fname);
        //    console.log('url', url);
        return downloadFile(url, dir, fname).then(function(result) {
            //logger.error(nameFile + ' test | postMyDataAndFiles | downloadFile : ');
            console.log('downloadFile', fname);
            // form.append('file', fs.readFileSync(dest), fname);
        }).catch(function(err) {
            console.log("err_a");
            console.log(err);
            logger.error(nameFile + ' | postMyDataAndFiles | downloadFile : ' + err);
        });
    })
    Promise.all(requests).then(() => {
        appendFormdataFiles(formdata, el, '', dir + "/");
        //console.log("Promesse tutte eseguite");
        logger.info(nameFile + ' | postMyDataAndFiles | Promesse tutte eseguite  ');
        var config = {
            method: action,
            url: posturl,
            headers: {
                ...formdata.getHeaders(),
                /*MG - Inizio*/
                'dymeruser': `Bearer ${DYM}`,
                'Referer': 'http://localhost/',
                /*MG - Fine*/
                'Authorization': `Bearer ${DYM}`,
                'extrainfo': `${DYM_EXTRA}`,
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            data: formdata

        };
        // console.log(nameFile + ' | callFwAdapter | invio, ad adapter | conf : ' + JSON.stringify(conf));
        //console.log(nameFile + ' | callFwAdapter | invio, ad adapter | el : ' + action + "-" + posturl + "-" + JSON.stringify(el));
        console.log("==>removeDir ",config);
        axios(config, { withCredentials: true })
            .then(function(updatedEl) {
                if (fs.existsSync(dir)) {
                    removeDir(dir);
                    //  fs.rm(dir);
                    // fs.rmdirSync(dir, { recursive: true });
                }
            }).catch(function(error) {
                logger.error(nameFile + ' | postMyDataAndFiles | axios post : ' + error);
                console.log("Error__________", error);
            });
    });
}

/*MG - Funzione di import MODEL e TEMPLATES - Inizio*/
function modelTemplatesImport(formTemplate, forceimport, sourcepath, userinfo_objJsonB64_admin, extrainfo_objJsonB64_admin, originalrelquery, newentityType){
    let localApiUrl = util.getServiceUrl('webserver') + util.getContextPath('webserver') + '/api/' + formTemplate + 's/api/v1/' + formTemplate + "/";
    let externalApiUrl = sourcepath +'/api/' + formTemplate + 's/api/v1/' + formTemplate + "/";
    console.log("localApiUrl ",localApiUrl);
    console.log("externalApiUrl ",externalApiUrl);
    /*Verifico se i moduli da importare sono già presenti nella destinazione*/
    let modulesIds = [];
    let titleId = {};
    let formdata_admin = new FormData();
    let postData = new FormData();

    //TODO params per modelli e per template
    let modelTemplateParameters ="";
    if (formTemplate==="form")
        modelTemplateParameters = { "query": { "instance._index": { "$eq": newentityType } } };
    if (formTemplate==="template")
        modelTemplateParameters = { "query": { "query": { "instance._index": { "$eq": newentityType } } } };

    console.log("==> modelTemplateParameters ", modelTemplateParameters);
    let config = {
        method: 'GET',
        url: localApiUrl,
        params: modelTemplateParameters,
        headers: {
            ...formdata_admin.getHeaders(),
            'dymeruser': userinfo_objJsonB64_admin,
            'Referer': 'http://localhost/',
            'Authorization': `Bearer ${userinfo_objJsonB64_admin}`,
            'extrainfo': `${extrainfo_objJsonB64_admin}`,
        } 
    };
    console.log("modelTemplatesImport config ", config);
    axios(config).then(response => {
        /*Se sono presenti ne acquisisco id e titolo*/
        response.data.data.forEach(data => {
            //if (data.instance[0]._index == newentityType){
                console.log("ROUTES-D-IMPORTS.JS - Import " + formTemplate + " - " + formTemplate + " Id", data._id);
                titleId.id = data._id;
                titleId.title = data.title;
				/*DA RIPRISTINARE DOPO AVER AGGIORNATO LA MACCHINA VIRTUALE*/
                //titleId.changed = data.properties.changed;
                modulesIds.push(titleId);
                titleId = {};
            //}
        }); 
    });
    /*Recupero i moduli dalla sorgente*/
    config = {
        method: 'GET',
        url: externalApiUrl,
        params: { "query": { "instance._index": { "$eq": originalrelquery } }  },
        headers: {
            ...formdata_admin.getHeaders(),
            'Authorization': `Bearer ${userinfo_objJsonB64_admin}`,
            'extrainfo': `${extrainfo_objJsonB64_admin}`,
        }
    };
    console.log("Recupero i moduli dalla sorgente ", config);
    axios(config).then(response => {
        response.data.data.forEach(data => {
            if (data.instance[0]._index == originalrelquery){
                data.files.forEach(element => {
                    if (element.contentType == "text/html"){
                        /*Se i moduli HTML sono già presenti nella destinazione, li elimino*/
                        if (modulesIds.length > 0){
                            modulesIds.forEach(titleId => {    
								/*DA RIPRISTINARE DOPO AVER AGGIORNATO LA MACCHINA VIRTUALE*/
                                //if (data.title == titleId.title && (data.properties.changed > titleId.changed || forceimport)){ 
								if (data.title == titleId.title){  									 
                                    var config = {
                                        method: 'delete',
                                        url: localApiUrl + titleId.id,
                                        headers: {
                                            ...postData.getHeaders(),
                                            'dymeruser': userinfo_objJsonB64_admin,
                                            "Referer": "http://localhost/",
                                            'Authorization': `Bearer ${userinfo_objJsonB64_admin}`,
                                            'extrainfo': `${extrainfo_objJsonB64_admin}`,
                                        }
                                    };
                                    console.log("Se i moduli HTML sono già presenti nella destinazione, li elimino ", config);
                                    axios(config).then(response1 => {
                                        console.log("ROUTES-D-IMPORTS.JS - Import " + formTemplate + " - HTML DELETE - response ===>", response1);   
                                        data.files.forEach(element => {
                                            /*Elimino js e css*/
                                            if (element.contentType != "text/html"){
                                                var config = {
                                                    method: 'delete',
                                                    url: localApiUrl + titleId.id,
                                                    headers: {
                                                        ...postData.getHeaders(),
                                                        'dymeruser': userinfo_objJsonB64_admin,
                                                        "Referer": "http://localhost/",
                                                        'Authorization': `Bearer ${userinfo_objJsonB64_admin}`,
                                                        'extrainfo': `${extrainfo_objJsonB64_admin}`,
                                                    }
                                                };

                                                console.log("Elimino js e css ", config);
                                                axios(config).then(response3 => {
                                                    console.log("ROUTES-D-IMPORTS.JS - Import " + formTemplate + " - " +element.contentType+" DELETE response ===>", response3);
                                                })   
                                                .catch(error => {
                                                    console.error("ROUTES-D-IMPORTS.JS - Import " + formTemplate + " - " +element.contentType+" DELETE error ===>", error);
                                                }) 
                                            }  
                                        });
                                    })
                                    .catch(error => {
                                        console.error("ROUTES-D-IMPORTS.JS - Import " + formTemplate + " - HTML DELETE - error ===>", error);
                                    })       
                                    /*Creazione HTML, JS e CSS*/
                                    console.log("==>Creazione HTML, JS e CSS 1");
                                    createModules(formTemplate, userinfo_objJsonB64_admin, extrainfo_objJsonB64_admin, 
                                                  originalrelquery, newentityType, data, element, localApiUrl);
                                }   
                            });
                        }else{
                            /*Creazione HTML, JS e CSS*/
                            console.log("==>Creazione HTML, JS e CSS 2");
                            createModules(formTemplate, userinfo_objJsonB64_admin, extrainfo_objJsonB64_admin, 
                                          originalrelquery, newentityType, data, element, localApiUrl);
                        }
                    }
                });
            }
        });      
    });   
} 

/*Creazione HTML, JS e CSS*/
function createModules(formTemplate, userinfo_objJsonB64_admin, extrainfo_objJsonB64_admin, 
                       originalrelquery, newentityType, data, element, localApiUrl){
    console.log("dymer-services | routes-d-import.js | createModules");
    /*Creazione HTML*/
    var infoData = "";
    data.name = data.title;
    infoData = data;
    infoData.instance._index = newentityType;
    infoData.instance._type = newentityType;
    //TODO check
    //infoData.instance._type = newentityType;
    delete delete infoData._id;
    var formdata_admin = new FormData();
    var postData = new FormData();
    appendFormdata(postData, { "data": infoData});
    element.data = element.data.replace(new RegExp(originalrelquery, 'g'), newentityType);   
    postData.append('data[file]', element.data, element.filename, { type: element.contentType });
    config = {
        method: 'post',
        url: localApiUrl,
        headers: {
            ...postData.getHeaders(),
            'dymeruser': userinfo_objJsonB64_admin,
            "Referer": "http://localhost/",
            'Authorization': `Bearer ${userinfo_objJsonB64_admin}`,
            'extrainfo': `${extrainfo_objJsonB64_admin}`,
        },
        data: postData
    };
    console.log("==>localApiUrl" ,localApiUrl);
    console.log("==>config " ,config);
    axios(config).then(response1 => {
        console.log("==>Import " + formTemplate + " - HTML - response: ", response1);   
        /*Recupero gli id dei moduli appena creati*/
        config = {
            method: 'GET',
            url: localApiUrl,
            headers: {
                ...formdata_admin.getHeaders(),
                'dymeruser': userinfo_objJsonB64_admin,
                "Referer": "http://localhost/",
                'Authorization': `Bearer ${userinfo_objJsonB64_admin}`,
                'extrainfo': `${extrainfo_objJsonB64_admin}`,
            }
        };

        console.log("==>id dei moduli appena creati ", config);
        axios(config).then(response2 => {
            console.log("R==>Import " + formTemplate + " - Read " + formTemplate + " Id - response ===>", response2);
            data.files.forEach(element => {
                /*Aggiungo js e css*/
                postData = new FormData();
                response2.data.data.forEach(data1 => {
                    if (element.contentType != "text/html" && data1.title == data.title){
                        infoData.pageId = data1._id;
                        appendFormdata(postData, { "data": infoData});
                        postData.append('data[file]', element.data, element.filename, { type: element.contentType });
                        config = {
                            method: 'post',
                            url: localApiUrl + "addAsset",
                            headers: {
                                ...postData.getHeaders(),
                                'dymeruser': userinfo_objJsonB64_admin,
                                "Referer": "http://localhost/",
                                'Authorization': `Bearer ${userinfo_objJsonB64_admin}`,
                                'extrainfo': `${extrainfo_objJsonB64_admin}`,
                            },
                            data: postData
                        };
                        console.log("Aggiungo js e css ", config);
                        axios(config).then(response3 => {
                            console.log("==>Import " + formTemplate + " - " +element.contentType+" response: ", response3);
                        })   
                        .catch(error => {
                            console.error("==>Import " + formTemplate + " - " +element.contentType+" error: ", error);
                        })
                    }
                });
            });
        })      
        .catch(error => {
            console.error("==>Import " + formTemplate + " - Read Id - error: ", error);
        })
    })      
    .catch(error => {
            console.error("==>Import " + formTemplate + " - HTML - error: ", error);
    })  
}
/*MG - Funzione di import MODEL e TEMPLATES - Fine*/

async function latLongFromCountry(list, el) {
    return new Promise((resolve, reject) => {
        var exsist = false;
        list.forEach(element => {
            if (element.name == el) {
                exsist = true;
                resolve({ type: "Point", coordinates: element.latlng });
                // return { type: "Point", coordinates: element.latlng };
            }
        });
        if (!exsist)
            resolve(undefined);
    });
}


// takes a {} object and returns a FormData object
var objectToFormData = function(obj, form, namespace) {
    var fd = form || new FormData();
    var formKey;
    for (var property in obj) {
        if (obj.hasOwnProperty(property)) {
            if (namespace) {
                formKey = namespace + '[' + property + ']';
            } else {
                formKey = property;
            }
            // if the property is an object, but not a File,
            // use recursivity.
            //     if (typeof obj[property] === 'object' && !(obj[property] instanceof File)) {
            if (typeof obj[property] === 'object') {
                objectToFormData(obj[property], fd, property);
            } else {
                // if it's a string or a File object
                fd.append(formKey, obj[property]);
            }
        }
    }
    return fd;
};
//router.get('/updategeo/:entype', util.checkIsAdmin, (req, res) => {
router.get('/updategeo/:entype', (req, res) => {
    logger.info(nameFile + '| get/updategeo');
    var entype = req.params.entype;
    var ret = new jsonResponse();
    const originalrelquery = entype;
    var pt = util.getServiceUrl('webserver') + util.getContextPath('webserver') + "/api/entities/api/v1/entity/_search";
    var listGeo = [];
    var query = {
        "query": {
            "query": {
                "bool": {
                    "must": [{
                        "term": {
                            "_index": originalrelquery
                        }
                    }]
                }
            }
        },
        "qoptions": { "relations": "false" }
    };
    var extrainfo_admin = {
        "extrainfo": {
            "companyId": "20097",
            "groupId": "20121",
            "cms": "lfr",
            "userId": 1,
            "virtualhost": "localhost"
        }
    };
    let extrainfo_objJsonStr_admin = JSON.stringify(extrainfo_admin);
    let extrainfo_objJsonB64_admin = Buffer.from(extrainfo_objJsonStr_admin).toString("base64");
    var userinfo_admin = {
        "isGravatarEnabled": false,
        "authorization_decision": "",
        "roles": [{
                "role": "User",
                "id": "20109"
            },
            {
                "role": "app-admin",
                "id": "20110"
            }
        ],
        "app_azf_domain": "",
        "id": 1,
        "app_id": "",
        "email": "admin@dymer.it",
        "username": "admin@dymer.it"
    };
    let userinfo_objJsonStr_admin = JSON.stringify(userinfo_admin);
    let userinfo_objJsonB64_admin = Buffer.from(userinfo_objJsonStr_admin).toString("base64");
    var formdata_admin = new FormData();
    appendFormdata(formdata_admin, query);
    var config = {
        method: 'post',
        url: pt,
        headers: {
            ...formdata_admin.getHeaders(),
            'Authorization': `Bearer ${userinfo_objJsonB64_admin}`,
            'extrainfo': `${extrainfo_objJsonB64_admin}`,
        },
        data: formdata_admin
    };
    //  axios(config)
    // axios.post(pt, query)
    axios(config).then(response => {
            const listaRel = response.data.data;
            console.log("listaRelswap", JSON.stringify(listaRel));
            listaRel.forEach(element => {
                if (element.hasOwnProperty("location")) {
                    if (element.location.hasOwnProperty("coordinates")) {
                        if (element.location.coordinates.length == 2 && (element.location.coordinates[0] != "" && element.location.coordinates[1] != "")) {
                            let tmpcoord0 = element.location.coordinates[1];
                            let tmpcoord1 = element.location.coordinates[0];
                            var singleEntity = {
                                "data": {
                                    "location": {
                                        "coordinates": [tmpcoord0, tmpcoord1]
                                    }
                                }
                            };
                            var extrainfo = {
                                "extrainfo": {
                                    "companyId": "20097",
                                    "groupId": "20121",
                                    "cms": "lfr",
                                    "userId": element.properties.owner["uid"],
                                    "virtualhost": "localhost"
                                }
                            };
                            let extrainfo_objJsonStr = JSON.stringify(extrainfo);
                            let extrainfo_objJsonB64 = Buffer.from(extrainfo_objJsonStr).toString("base64");
                            var userinfo = {
                                "isGravatarEnabled": false,
                                "authorization_decision": "",
                                "roles": [{
                                        "role": "User",
                                        "id": "20109"
                                    },
                                    {
                                        "role": "app-admin",
                                        "id": "20110"
                                    }
                                ],
                                "app_azf_domain": "",
                                "id": element.properties.owner["uid"],
                                "app_id": "",
                                "email": element.properties.owner["uid"],
                                "username": element.properties.owner["uid"]
                            };
                            let userinfo_objJsonStr = JSON.stringify(userinfo);
                            let userinfo_objJsonB64 = Buffer.from(userinfo_objJsonStr).toString("base64");
                            var objToPost = { 'id': element._id, 'data': singleEntity, 'DYM': userinfo_objJsonB64, 'DYM_EXTRA': extrainfo_objJsonB64 };
                            listGeo.push(objToPost);
                        }
                    }
                }
            });
            const basepatchurl = util.getServiceUrl('webserver') + util.getContextPath('webserver') + "/api/entities/api/v1/entity/";
            logger.info(nameFile + ' | /updategeo/:entype | listGeo :' + JSON.stringify(listGeo));
            listGeo.forEach(function(obj, index) {
                setTimeout(function() {
                    var formdata = new FormData();
                    appendFormdata(formdata, obj.data);
                    var patchurl = basepatchurl + obj.id;
                    //  console.log("import timeout axios", index);
                    logger.info(nameFile + ' | /updategeo/:entype | import timeout axios :' + index + " " + JSON.stringify(obj.data));
                    var config = {
                        method: 'patch',
                        url: patchurl,
                        headers: {
                            ...formdata.getHeaders(),
                            'Authorization': `Bearer ${obj.DYM}`,
                            'extrainfo': `${obj.DYM_EXTRA}`,
                        },
                        data: formdata
                    };
                    axios(config)
                        .then(function(updatedEl) {}).catch(function(error) {
                            console.log("Error__________", error);
                            logger.error(nameFile + '| /updategeo/:entype | postMyData : ' + error);
                        });
                }, 1000 * (index + 1));
            });
            return res.send(ret);
        })
        .catch(error => {
            console.error("ERROR | " + nameFile + " | get/updategeo ", error);
            logger.error(nameFile + ' | get/updategeo : ' + error);
        });
});

router.get('/generateuser', util.checkIsAdmin, (req, res) => {
    let urltoken = "http://xxx/v1/auth/tokens";
    let urluser = "http://xxx/v1/users";
    let urluserput = "http://xxx/v1/applications/ba14334c-cd76-4050-a569-66ac36d4360d/users/";
    let formdata_admin = { "name": "xxx", "password": "xxx" };
    let role = "xxx";
    let role1 = "xxx";
    let role2 = "xxx";
    let list_prom = [];
    let list_user = [{
        "userId": 0,
        "groupId": 0,
        "companyId": 0,
        "firstName": "x",
        "lastName": "x",
        "emailAddress": "x@x.x"
    }];

    // var ret = new jsonResponse();
    //   return res.send(ret);

    let formdata_user = {
        "user": {
            "email": "x",
            "username": "x",
            "password": "x",
            "enabled": true,
            "admin": false
        }
    };
    var config = {
        method: 'post',
        url: urltoken,
        headers: {
            'Content-Type': 'application/json'
        },
        data: formdata_admin
    };
    axios(config).then(response => {

            console.log("response.headers", JSON.stringify(response.headers));
            let mytoken = response.headers["x-subject-token"];
            let config_user = {
                method: 'post',
                url: urluser,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-token': mytoken
                },
                data: formdata_user
            };
            list_user.forEach((element, index) => {
                config_user.data.user.email = element.emailAddress;
                config_user.data.user.username = (element.firstName + "." + element.lastName).toLowerCase();
                config_user.data.user.password = (element.emailAddress).charAt(0) + (element.emailAddress).charAt(1).toUpperCase() + Math.random().toString(36).slice(-5) + index + (element.emailAddress).charAt(3).toUpperCase();
                console.log("user config_user", config_user.data.user);
                list_prom.push(
                    axios(config_user).then(responseuser => {
                        console.log("user created username|id|email", responseuser.data.user.username, responseuser.data.user.id, responseuser.data.user.email);
                        let url_pur_role = urluserput + responseuser.data.user.id + "/roles/" + role;
                        let url_pur_role1 = urluserput + responseuser.data.user.id + "/roles/" + role1;
                        let url_pur_role2 = urluserput + responseuser.data.user.id + "/roles/" + role2;
                        let config_user_put = {
                            method: 'put',
                            url: url_pur_role,
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Auth-token': mytoken
                            }
                        };
                        axios(config_user_put).then(responseuser => {
                            console.log("user updated role", responseuser.data.role_user_assignments.user_id, responseuser.data.role_user_assignments.role_id);
                            let config_user_put1 = {
                                method: 'put',
                                url: url_pur_role1,
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-Auth-token': mytoken
                                }
                            };
                            axios(config_user_put1).then(responseuser1 => {
                                console.log("user updated role1", responseuser1.data.role_user_assignments.user_id, responseuser1.data.role_user_assignments.role_id);
                                let config_user_put2 = {
                                    method: 'put',
                                    url: url_pur_role2,
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-Auth-token': mytoken
                                    }
                                };
                                axios(config_user_put2).then(responseuser2 => {
                                    console.log("user updated role2", responseuser2.data.role_user_assignments.user_id, responseuser2.data.role_user_assignments.role_id);
                                }).catch(error => {
                                    console.error("ERROR | " + nameFile + " | generateuser/user role2  ", error);
                                });
                            }).catch(error => {
                                console.error("ERROR | " + nameFile + " | generateuser/user role1  ", error);
                            });
                        }).catch(error => {
                            console.error("ERROR | " + nameFile + " | generateuser/user role  ", error);
                        });
                    })
                    .catch(error => {
                        console.error("ERROR | " + nameFile + " | generateuser/user  ", error);
                    })

                );
            });
            Promise.all(list_prom).then(responses => {
                    console.log("all users are created!");
                })
                // console.log("mytoken", JSON.stringify(mytoken));

        })
        .catch(error => {
            console.error("ERROR | " + nameFile + " | generateuser/token  ", error);
        });
    var ret = new jsonResponse();
    return res.send(ret);
});
router.get('/updategid/:entype/:gid/:forceall?', util.checkIsAdmin, (req, res) => {
    logger.info(nameFile + '| get/updategid');
    var entype = req.params.entype;
    let forceall = (!req.params.key) ? false : true;
    let gid = req.params.gid;
    var ret = new jsonResponse();
    const originalrelquery = entype;
    var pt = util.getServiceUrl('webserver') + util.getContextPath('webserver') + "/api/entities/api/v1/entity/_search";
    var list = [];
    var query = {
        "query": {
            "query": {
                "bool": {
                    "must": [{
                        "term": {
                            "_index": originalrelquery
                        }
                    }]
                }
            }
        },
        "qoptions": { "relations": "false" }
    };
    var extrainfo_admin = {
        "extrainfo": {
            "companyId": "20097",
            "groupId": "20121",
            "cms": "lfr",
            "userId": 1,
            "virtualhost": "localhost"
        }
    };
    let extrainfo_objJsonStr_admin = JSON.stringify(extrainfo_admin);
    let extrainfo_objJsonB64_admin = Buffer.from(extrainfo_objJsonStr_admin).toString("base64");
    var userinfo_admin = {
        "isGravatarEnabled": false,
        "authorization_decision": "",
        "roles": [{
                "role": "User",
                "id": "20109"
            },
            {
                "role": "app-admin",
                "id": "20110"
            }
        ],
        "app_azf_domain": "",
        "id": 1,
        "app_id": "",
        "email": "admin@dymer.it",
        "username": "admin@dymer.it"
    };

    let userinfo_objJsonStr_admin = JSON.stringify(userinfo_admin);
    let userinfo_objJsonB64_admin = Buffer.from(userinfo_objJsonStr_admin).toString("base64");
    var formdata_admin = new FormData();
    appendFormdata(formdata_admin, query);
    var config = {
        method: 'post',
        url: pt,
        headers: {
            ...formdata_admin.getHeaders(),
            'Authorization': `Bearer ${userinfo_objJsonB64_admin}`,
            'extrainfo': `${extrainfo_objJsonB64_admin}`,
        },
        data: formdata_admin
    };
    //  axios(config)
    // axios.post(pt, query)
    axios(config).then(response => {
            const listaRel = response.data.data;
            console.log("listaRelswap", JSON.stringify(listaRel));
            listaRel.forEach(element => {
                let updategid = false;
                updategid = (!element.properties.owner.hasOwnProperty("gid") || forceall) ? true : false;
                if (!updategid)
                    if (element.properties.owner.hasOwnProperty("gid")) {
                        updategid = (element.properties.owner.gid == "1" || element.properties.owner.gid == 1 || element.properties.owner.gid == 0 || element.properties.owner.gid == "0" || element.properties.owner.gid == "") ? true : false;
                    }
                if (updategid) {

                    var singleEntity = {
                        "data": {
                            "properties": {
                                "owner": {
                                    "gid": gid
                                }
                            }
                        }
                    };
                    var extrainfo = {
                        "extrainfo": {
                            "companyId": "20097",
                            "groupId": "20121",
                            "cms": "lfr",
                            "userId": element.properties.owner["uid"],
                            "virtualhost": "localhost"
                        }
                    };
                    let extrainfo_objJsonStr = JSON.stringify(extrainfo);
                    let extrainfo_objJsonB64 = Buffer.from(extrainfo_objJsonStr).toString("base64");
                    var userinfo = {
                        "isGravatarEnabled": false,
                        "authorization_decision": "",
                        "roles": [{
                                "role": "User",
                                "id": "20109"
                            },
                            {
                                "role": "app-admin",
                                "id": "20110"
                            }
                        ],
                        "app_azf_domain": "",
                        "id": element.properties.owner["uid"],
                        "app_id": "",
                        "email": element.properties.owner["uid"],
                        "username": element.properties.owner["uid"]
                    };
                    let userinfo_objJsonStr = JSON.stringify(userinfo);
                    let userinfo_objJsonB64 = Buffer.from(userinfo_objJsonStr).toString("base64");
                    var objToPost = { 'id': element._id, 'data': singleEntity, 'DYM': userinfo_objJsonB64, 'DYM_EXTRA': extrainfo_objJsonB64 };
                    list.push(objToPost);
                }


            });
            const basepatchurl = util.getServiceUrl('webserver') + util.getContextPath('webserver') + "/api/entities/api/v1/entity/";
            logger.info(nameFile + ' | /updategid/:entype | list :' + JSON.stringify(list));
            list.forEach(function(obj, index) {
                setTimeout(function() {
                    var formdata = new FormData();
                    appendFormdata(formdata, obj.data);
                    var patchurl = basepatchurl + obj.id;
                    //  console.log("import timeout axios", index);
                    logger.info(nameFile + ' | /updategid/:entype | import timeout axios :' + index + " " + JSON.stringify(obj.data));
                    var config = {
                        method: 'patch',
                        url: patchurl,
                        headers: {
                            ...formdata.getHeaders(),
                            'Authorization': `Bearer ${obj.DYM}`,
                            'extrainfo': `${obj.DYM_EXTRA}`,
                        },
                        data: formdata
                    };
                    axios(config)
                        .then(function(updatedEl) {}).catch(function(error) {
                            console.log("Error__________", error);
                            logger.error(nameFile + '| /updategid/:entype | postMyData : ' + error);
                        });


                }, 1500 * (index + 1));
            });
            return res.send(ret);
        })
        .catch(error => {
            console.error("ERROR | " + nameFile + " | get/updategid ", error);
            logger.error(nameFile + ' | get/updategid : ' + error);
        });
});
// '/api/dservice/api/v1/import/fromdymer'
//RECUPERATO DA DEV
router.get('/fromdymer/:id', util.checkIsAdmin, (req, res) => {
    console.log("routes-d-import.js | /fromdymer/:id");
    var ret = new jsonResponse();
    var id = req.params.id;
    var myfilter = { "_id": id };
    DymRule.find(myfilter).then((els) => {
        let crnrule = els[0];
        var pt_external = crnrule.sourcepath + crnrule.apisearchpath; //"http://localhost:8080/api/entities/api/v1/entity/_search";
        var pt_internal = util.getServiceUrl('webserver') + util.getContextPath('webserver') + "/api/entities/api/v1/entity/_search";
        
        console.log("==> pt_external ", pt_external);
        console.log("==> pt_internal ", pt_internal);

        const fileurl = crnrule.sourcepath; //"http://195.201.83.104"
        const originalrelquery = crnrule.sourceindex; //."";
        const crnruletitle = crnrule.title; //."";
        const newentityType = crnrule.targetindex; //"";
        const targetprefix = (crnrule.targetprefix == undefined) ? "" : crnrule.targetprefix;
        let importentities = (crnrule.importentities == undefined) ? false : crnrule.importentities;
        let importmodel = (crnrule.importmodel == undefined) ? false : crnrule.importmodel;
        let importtemplates = (crnrule.importtemplates == undefined) ? false : crnrule.importtemplates;
        let forceimportmodel = (crnrule.forceimportmodel == undefined) ? false : crnrule.forceimportmodel;
        let forceimporttemplates = (crnrule.forceimporttemplates == undefined) ? false : crnrule.forceimporttemplates;
        let importRelations = (crnrule.importrelation == undefined) ? false : crnrule.importrelation;
        let listRelationsImports = (crnrule.typerelations == undefined || crnrule.typerelations == "") ? [] : crnrule.typerelations.split(",");
        let sameid = (crnrule.sameid == undefined) ? false : crnrule.sameid;
        var query = {
            "query": {
                "query": {
                    "bool": {
                        "must": [{
                            "term": {
                                "_index": originalrelquery
                            }
                        }]
                    }
                }
            }
        };
        var queryInternal = {
            "query": {
                "query": {
                    "bool": {
                        "must": [{
                            "term": {
                                "_index": newentityType
                            }
                        }, {
                            "ids": {
                                "values": []
                            }
                        }]
                    }
                }
            }
        };
        let listTopost = [];
        let listToput = [];
        var extrainfo_admin = {
            "extrainfo": {
                "companyId": "20097",
                "groupId": "20121",
                "cms": "lfr",
                "userId": 1,
                "virtualhost": "localhost"
            }
        };
        let extrainfo_objJsonStr_admin = JSON.stringify(extrainfo_admin);
        let extrainfo_objJsonB64_admin = Buffer.from(extrainfo_objJsonStr_admin).toString("base64");
        var userinfo_admin = {
            "isGravatarEnabled": false,
            "authorization_decision": "",
            "roles": [{
                    "role": "User",
                    "id": "20109"
                },
                {
                    "role": "app-admin",
                    "id": "20110"
                }
            ],
            "app_azf_domain": "",
            "id": 1,
            "app_id": "",
            "email": "admin@dymer.it",
            "username": "admin@dymer.it"
        };


        let userinfo_objJsonStr_admin = JSON.stringify(userinfo_admin);
        let userinfo_objJsonB64_admin = Buffer.from(userinfo_objJsonStr_admin).toString("base64");
        var formdata_admin = new FormData();
        appendFormdata(formdata_admin, query);
        var config = {
            method: 'post',
            url: pt_external,
            headers: {
                ...formdata_admin.getHeaders(),
                'Authorization': `Bearer ${userinfo_objJsonB64_admin}`,
                'extrainfo': `${extrainfo_objJsonB64_admin}`,
            },
           data: formdata_admin
        };
        console.log(nameFile + ' | pt_external :' + pt_external);
        console.log('config pt_external :' + JSON.stringify(config));
        axios(config).then(response => {
                const listaRel = response.data.data;
                listaRel.forEach(element => { queryInternal.query.query.bool.must[1].ids.values.push(targetprefix + element._id); });
                console.log("==>listaRel ",listaRel);
                logger.info("==>listaRel ",listaRel);
                formdata_admin = new FormData();
                logger.info(nameFile + ' | Cron Job Import | external entities :' + crnruletitle + "," + listaRel.length);
                appendFormdata(formdata_admin, queryInternal);
                config = {
                    method: 'post',
                    url: pt_internal,
                    headers: {
                        ...formdata_admin.getHeaders(),
                        'dymeruser': userinfo_objJsonB64_admin,
                        'Referer': 'http://localhost/',
                        'Authorization': `Bearer ${userinfo_objJsonB64_admin}`,
                        'extrainfo': `${extrainfo_objJsonB64_admin}`,
                    },
                    data: formdata_admin
                };
                console.log('config pt_internal :' + JSON.stringify(config));
                
                axios(config).then(respInt => {
                        const listaInt = respInt.data.data;
                        console.log('listaInt:' + listaInt);
                        logger.info('listaInt:' + listaInt);
                        listaRel.forEach(element => {
                            element._source.properties.ipsource = pt_external;
                            let elfinded = listaInt.find((el) => el._id == targetprefix + element._id);
                            if (importRelations) {
                                if (element.hasOwnProperty("relations")) {
                                    if (element.relations.length > 0)
                                        element._source.relation = {};
                                    element.relations.forEach(entityrelation => {
                                        let indexentrel = entityrelation._index;
                                        let identrel = entityrelation._id;
                                        if (listRelationsImports.length == 0 || listRelationsImports.includes(indexentrel)) {
                                            if (element._source.relation.hasOwnProperty(indexentrel)) {
                                                element._source.relation[indexentrel].push({
                                                    "to": identrel
                                                });
                                            } else {
                                                element._source.relation[indexentrel] = [{
                                                    "to": identrel
                                                }];
                                            }
                                        }


                                    });
                                }
                            }
                            //  console.log('element aftewr rel', element);
                            /* dih add relation to initiatives */
                            /*if (isdih) {
                                if (!element.hasOwnProperty("relation")) {
                                    element.relation = {};
                                }
                                var indice_;
                                var valore_;
                                var query_s = { "query": { "query": { "match": { "_id": id_R } } } };
                                axios.post(pt_internal, query_s).then(respIntRel => {
                                    let elSingleRelfinded = respIntRel.data.data[0].relations.find((el) => el._index == "initiatives");
                                    indice_ = elSingleRelfinded._index;
                                    valore_ = elSingleRelfinded._id;
                                    if (element.relation.hasOwnProperty(indice_)) {
                                        element.relation[indice_].push({
                                            "to": valore_
                                        });
                                    } else {
                                        element.relation[indice_] = [{
                                            "to": valore_
                                        }];
                                    }
                                    element._source.relation = element.relation;
                                    //continuo il flusso da qua 
                                }).catch(error => {
                                    console.error("ERROR | " + nameFile + " | get/fromdymer/:id ", id, error);
                                    logger.error(nameFile + " | get/fromdymer/:id " + id + " " + error);
                                    ret.setSuccess(false);
                                    ret.setMessages("ax error");
                                    return res.send(ret);
                                });
                            }*/
                            /*fine dih end rel initiatives */
                            var singleEntity = {
                                "instance": {
                                    "index": newentityType
                                    //"type": newentityType
                                },
                                "data": element._source
                            };
                            //  singleEntity.data.
                            var extrainfo = {
                                "extrainfo": {
                                    //"companyId": "37504",
                                    //"groupId": "37623",
                                    "companyId": "20097",
                                    "groupId": "20121",
                                    "cms": "lfr",
                                    "userId": element._source.properties.owner["uid"],
                                    "virtualhost": "localhost"
                                }
                            };
                            let extrainfo_objJsonStr = JSON.stringify(extrainfo);
                            let extrainfo_objJsonB64 = Buffer.from(extrainfo_objJsonStr).toString("base64");
                            let userinfo = {
                                "isGravatarEnabled": false,
                                "authorization_decision": "",
                                "roles": [{
                                        "role": "User",
                                        "id": "20109"
                                    },
                                    {
                                        "role": "app-teter",
                                        "id": "20110"
                                    },
                                    {
                                        "role": "app-admin",
                                        "id": "20112"
                                    }
                                ],
                                "app_azf_domain": "",
                                "id": element._source.properties.owner["uid"],
                                "app_id": "",
                                "email": element._source.properties.owner["uid"],
                                "username": element._source.properties.owner["uid"]
                            };


                            let userinfo_objJsonStr = JSON.stringify(userinfo);
                            let userinfo_objJsonB64 = Buffer.from(userinfo_objJsonStr).toString("base64");
                            
                            var objToPost = { 'data': singleEntity, 'DYM': userinfo_objJsonB64, 'DYM_EXTRA': extrainfo_objJsonB64 };
                            console.log('==>objToPost ',objToPost);
                            if (elfinded == undefined) {
                                //add post
                                if (sameid) {
                                    objToPost.data.instance.id = targetprefix + element._id;
                                }
                                // console.log(nameFile + " | get/fromdymer/:id | dateExt > dateInt,aggiungo", JSON.stringify(objToPost));
                                logger.info(nameFile + ' | Cron Job Import | dateExt > dateInt,aggiungo :' + crnruletitle);
                                listTopost.push(objToPost);
                            } else {
                                let dateExt = new Date(element._source.properties.changed);
                                let dateInt = new Date(elfinded._source.properties.changed);
                                if (dateExt > dateInt) {
                                    objToPost.data.instance.id = targetprefix + element._id;
                                    //add put
                                    //console.log(nameFile + " | get/fromdymer/:id | dateExt > dateInt,aggiorno", JSON.stringify(objToPost));
                                    logger.info(nameFile + ' | Cron Job Import | dateExt > dateInt,aggiorno :' + element._source.title + "|" + dateExt + ">" + dateInt);
                                    listToput.push(objToPost);
                                }
                            }
                        });

                        /*MG - Gestione import di MODEL e TEMPLATES - Inizio*/
                        if (importmodel){
                            modelTemplatesImport("form", forceimportmodel, crnrule.sourcepath, userinfo_objJsonB64_admin, extrainfo_objJsonB64_admin, originalrelquery, newentityType);
                        }
                        if (importtemplates){
                            modelTemplatesImport("template", forceimporttemplates, crnrule.sourcepath, userinfo_objJsonB64_admin, extrainfo_objJsonB64_admin, originalrelquery, newentityType);
                        }
                        /*MG - Gestione import di MODEL e TEMPLATES - Fine*/

                        /*MG - Import delle ENTITIES - Inizio*/
                        if (importentities){
                            console.log("==>importentities started");
                            /*MG - Verifica della CONDITION - Inizio*/
                            if (crnrule.condition != undefined) {
                                var mfunc = crnrule['condition'];
                                try {
                                    var fnCond = ("function (obj, extraInfo, fnaction) {  " + mfunc + " }").parseFunction();
                                    var condition = "";
                                    listTopost.forEach(function(obj, index) {
                                        condition = fnCond(obj.data, obj.DYM_EXTRA, "post");
                                        if (condition) {
                                            setTimeout(function() {
                                                logger.info(nameFile + ' | Cron Job Import  | import timeout axios post ' + crnruletitle + "," + index);
                                                postMyDataAndFiles(obj.data, newentityType, obj.DYM, obj.DYM_EXTRA, "post", fileurl);
                                            }, 2500 * (index + 1));
                                        }
                                    });
                                    listToput.forEach(function(obj, index) {
                                        condition = fnCond(obj.data, obj.DYM_EXTRA, "put");
                                        if (condition) {
                                            setTimeout(function() {
                                                logger.info(nameFile + ' | Cron Job Import  | import timeout axios put ' + crnruletitle + "," + index);
                                                postMyDataAndFiles(obj.data, newentityType, obj.DYM, obj.DYM_EXTRA, "put", fileurl);
                                            }, 3500 * (index + 1));
                                        }
                                    });
                                } catch (error) {
                                    console.log("error: ", error);
                                }    
                            }else{
                                listTopost.forEach(function(obj, index) {
                                    setTimeout(function() {
                                        logger.info(nameFile + ' | Cron Job Import  | import timeout axios post ' + crnruletitle + "," + index);
                                        postMyDataAndFiles(obj.data, newentityType, obj.DYM, obj.DYM_EXTRA, "post", fileurl);
                                    }, 2500 * (index + 1));
                                });
                                listToput.forEach(function(obj, index) {
                                    setTimeout(function() {
                                        logger.info(nameFile + ' | Cron Job Import  | import timeout axios put ' + crnruletitle + "," + index);
                                        postMyDataAndFiles(obj.data, newentityType, obj.DYM, obj.DYM_EXTRA, "put", fileurl);
                                    }, 3500 * (index + 1));
                                });
                            }
                            /*MG - Verifica della CONDITION - Fine*/
                        }
                       /* listTopost.forEach(function(obj, index) {
                            setTimeout(function() {
                                //console.log(nameFile + " | get/fromdymer/:id | import timeout axios post ", index);
                                // logger.info(nameFile + ' | Cron Job Import  | import timeout axios post' + crnruletitle + "," + index + " " + JSON.stringify(obj.data));
                                logger.info(nameFile + ' | Cron Job Import  | import timeout axios post ' + crnruletitle + "," + index);
                                postMyDataAndFiles(obj.data, newentityType, obj.DYM, obj.DYM_EXTRA, "post", fileurl);
                            }, 2500 * (index + 1));
                        });
                        listToput.forEach(function(obj, index) {
                            setTimeout(function() {
                                //console.log(nameFile + " | get/fromdymer/:id | import timeout axios put ", index);
                                //   logger.info(nameFile + ' | Cron Job Import  | import timeout axios put' + crnruletitle + "," + index + " " + JSON.stringify(obj.data));
                                logger.info(nameFile + ' | Cron Job Import  | import timeout axios put ' + crnruletitle + "," + index);
                                postMyDataAndFiles(obj.data, newentityType, obj.DYM, obj.DYM_EXTRA, "put", fileurl);
                            }, 3500 * (index + 1));
                        }); */
                        /*MG - Import delle ENTITIES - Fine*/
                    })
                    .catch(error => {
                        console.error("ERROR | " + nameFile + " | Cron Job Import  | post ", error);
                        logger.error(nameFile + ' | Cron Job Import  | post ' + error);
                        ret.setSuccess(false);
                        ret.setMessages("ax error");
                        return res.send(ret);
                    });
                return res.send(ret);
            })
            .catch(error => {
                console.error("ERROR | " + nameFile + "| Cron Job Import  | post axios", error);
                logger.error(nameFile + '| Cron Job Import  | post axios ' + error);
                ret.setSuccess(false);
                ret.setMessages("ax error");
                return res.send(ret);
            });
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + "| Cron Job Import  | find", err);
            logger.error(nameFile + '| Cron Job Import  | find ' + err);
            ret.setMessages("find Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

router.get('/fromdymer_original/:id', util.checkIsAdmin, (req, res) => {
    var ret = new jsonResponse();
    var id = req.params.id;
    var myfilter = { "_id": id };
    DymRule.find(myfilter).then((els) => {
        let crnrule = els[0];
        var pt_external = crnrule.sourcepath + crnrule.apisearchpath; //"http://localhost:8080/api/entities/api/v1/entity/_search";
        var pt_internal = util.getServiceUrl('webserver') + util.getContextPath('webserver') + "/api/entities/api/v1/entity/_search";
        const fileurl = crnrule.sourcepath; //"http://195.201.83.104"
        const originalrelquery = crnrule.sourceindex; //."";
        const newentityType = crnrule.targetindex; //"";
        const targetprefix = (crnrule.targetprefix == undefined) ? "" : crnrule.targetprefix;
        let importRelations = (crnrule.importrelation == undefined) ? false : crnrule.importrelation;
        let importentities = (crnrule.importentities == undefined) ? false : crnrule.importentities;
        let importmodel = (crnrule.importmodel == undefined) ? false : crnrule.importmodel;
        let importtemplates = (crnrule.importtemplates == undefined) ? false : crnrule.importtemplates;

        let sameid = (crnrule.sameid == undefined) ? false : crnrule.sameid;
        var query = {
            "query": {
                "query": {
                    "bool": {
                        "must": [{
                            "term": {
                                "_index": originalrelquery
                            }
                        }]
                    }
                }
            }
        };
        var queryInternal = {
            "query": {
                "query": {
                    "bool": {
                        "must": [{
                            "term": {
                                "_index": newentityType
                            }
                        }, {
                            "ids": {
                                "values": []
                            }
                        }]
                    }
                }
            }
        };
        let listTopost = [];
        let listToput = [];
        axios.post(pt_external, query).then(response => {
                const listaRel = response.data.data;
                listaRel.forEach(element => { queryInternal.query.query.bool.must[1].ids.values.push(targetprefix + element._id); });
                axios.post(pt_internal, queryInternal).then(respInt => {
                        const listaInt = respInt.data.data;
                        listaRel.forEach(element => {
                            element._source.properties.ipsource = pt_external;
                            //dih
                            /*  let isdih = false;
                              if (originalrelquery == "businessservice") {
                                  element._source.category = "Business";
                                  isdih = true;
                              }
                              if (originalrelquery == "dataservices") {
                                  element._source.category = "Data";
                                  isdih = true;
                              }
                              if (originalrelquery == "ecosystemservice") {
                                  element._source.category = "Ecosystem";
                                  isdih = true;
                              }
                              if (originalrelquery == "skillservice") {
                                  element._source.category = "Skill";
                                  isdih = true;
                              }
                              if (originalrelquery == "technologyservices") {
                                  element._source.category = "Technology";
                                  isdih = true;
                              }
                              if (isdih) {
                                  var relToSearch = element.relations;
                                  let elRelfinded = relToSearch.find((el) => el._index == "project");
                                  let id_R = elRelfinded._id;
                              }*/
                            //fine dih
                            let elfinded = listaInt.find((el) => el._id == targetprefix + element._id);
                            console.log('importRelations', importRelations);
                            console.log('element', element);
                            console.log('elfinded', elfinded);
                            if (importRelations) {
                                if (element.hasOwnProperty("relations")) {
                                    if (element.relations.length > 0)
                                        element._source.relation = {};
                                    element.relations.forEach(entityrelation => {
                                        let indexentrel = entityrelation._index;
                                        let identrel = entityrelation._id;
                                        if (element._source.relation.hasOwnProperty(indexentrel)) {
                                            element._source.relation[indexentrel].push({
                                                "to": identrel
                                            });
                                        } else {
                                            element._source.relation[indexentrel] = [{
                                                "to": identrel
                                            }];
                                        }
                                    });
                                }
                            }
                            console.log('element aftewr rel', element);
                            /* dih add relation to initiatives */
                            /*if (isdih) {
                                if (!element.hasOwnProperty("relation")) {
                                    element.relation = {};
                                }
                                var indice_;
                                var valore_;
                                var query_s = { "query": { "query": { "match": { "_id": id_R } } } };
                                axios.post(pt_internal, query_s).then(respIntRel => {
                                    let elSingleRelfinded = respIntRel.data.data[0].relations.find((el) => el._index == "initiatives");
                                    indice_ = elSingleRelfinded._index;
                                    valore_ = elSingleRelfinded._id;
                                    if (element.relation.hasOwnProperty(indice_)) {
                                        element.relation[indice_].push({
                                            "to": valore_
                                        });
                                    } else {
                                        element.relation[indice_] = [{
                                            "to": valore_
                                        }];
                                    }
                                    element._source.relation = element.relation;
                                    //continuo il flusso da qua 
                                }).catch(error => {
                                    console.error("ERROR | " + nameFile + " | get/fromdymer/:id ", id, error);
                                    logger.error(nameFile + " | get/fromdymer/:id " + id + " " + error);
                                    ret.setSuccess(false);
                                    ret.setMessages("ax error");
                                    return res.send(ret);
                                });
                            }*/
                            /*fine dih end rel initiatives */
                            var singleEntity = {
                                "instance": {
                                    "index": newentityType,
                                    "type": newentityType
                                },
                                "data": element._source
                            };
                            //  singleEntity.data.
                            var extrainfo = {
                                "extrainfo": {
                                    "companyId": "20097",
                                    "groupId": "20121",
                                    "cms": "lfr",
                                    "userId": element._source.properties.owner["uid"],
                                    "virtualhost": "localhost"
                                }
                            };
                            let extrainfo_objJsonStr = JSON.stringify(extrainfo);
                            let extrainfo_objJsonB64 = Buffer.from(extrainfo_objJsonStr).toString("base64");
                            var userinfo = {
                                "isGravatarEnabled": false,
                                "authorization_decision": "",
                                "roles": [{
                                        "role": "User",
                                        "id": "20109"
                                    },
                                    {
                                        "role": "app-teter",
                                        "id": "20110"
                                    },
                                    {
                                        "role": "app-admin",
                                        "id": "20112"
                                    }
                                ],
                                "app_azf_domain": "",
                                "id": element._source.properties.owner["uid"],
                                "app_id": "",
                                "email": element._source.properties.owner["uid"],
                                "username": element._source.properties.owner["uid"]
                            };
                            let userinfo_objJsonStr = JSON.stringify(userinfo);
                            let userinfo_objJsonB64 = Buffer.from(userinfo_objJsonStr).toString("base64");
                            var objToPost = { 'data': singleEntity, 'DYM': userinfo_objJsonB64, 'DYM_EXTRA': extrainfo_objJsonB64 };
                            if (elfinded == undefined) {
                                //add post
                                if (sameid) {
                                    objToPost.data.instance.id = targetprefix + element._id;
                                }
                                // console.log(nameFile + " | get/fromdymer/:id | dateExt > dateInt,aggiungo", JSON.stringify(objToPost));
                                logger.info(nameFile + ' | get/fromdymer/:id | dateExt > dateInt,aggiungo :' + JSON.stringify(objToPost));
                                listTopost.push(objToPost);
                            } else {
                                let dateExt = new Date(element._source.properties.changed);
                                let dateInt = new Date(elfinded._source.properties.changed);
                                if (dateExt > dateInt) {
                                    //add put
                                    //console.log(nameFile + " | get/fromdymer/:id | dateExt > dateInt,aggiorno", JSON.stringify(objToPost));
                                    logger.info(nameFile + ' | get/fromdymer/:id | dateExt > dateInt,aggiorno :' + JSON.stringify(objToPost));
                                    listToput.push(objToPost);
                                }
                            }
                        });
                        listTopost.forEach(function(obj, index) {
                            setTimeout(function() {
                                //console.log(nameFile + " | get/fromdymer/:id | import timeout axios post ", index);
                                logger.info(nameFile + ' | get/fromdymer/:id | import timeout axios post' + index + " " + JSON.stringify(obj.data));
                                postMyDataAndFiles(obj.data, newentityType, obj.DYM, obj.DYM_EXTRA, "post", fileurl);
                            }, 2000 * (index + 1));
                        });
                        listToput.forEach(function(obj, index) {
                            setTimeout(function() {
                                //console.log(nameFile + " | get/fromdymer/:id | import timeout axios put ", index);
                                logger.info(nameFile + ' | get/fromdymer/:id | import timeout axios put' + index + " " + JSON.stringify(obj.data));
                                postMyDataAndFiles(obj.data, newentityType, obj.DYM, obj.DYM_EXTRA, "put", fileurl);
                            }, 1500 * (index + 1));
                        });
                        //    return res.send(ret);
                    })
                    .catch(error => {
                        console.error("ERROR | " + nameFile + " | get/fromdymer/:id | post ", error);
                        logger.error(nameFile + ' | get/fromdymer/:id | post ' + error);
                        ret.setSuccess(false);
                        ret.setMessages("ax error");
                        return res.send(ret);
                    });
                return res.send(ret);
            })
            .catch(error => {
                console.error("ERROR | " + nameFile + "| get/fromdymer/:id | post axios", error);
                logger.error(nameFile + '| get/fromdymer/:id | post axios ' + error);
                ret.setSuccess(false);
                ret.setMessages("ax error");
                return res.send(ret);
            });
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + "| get/fromdymer/:id | find", error);
            logger.error(nameFile + '| get/fromdymer/:id | find ' + error);
            ret.setMessages("find Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

router.get('/scrap/:url', (req, res) => {

    var ret = new jsonResponse();
    var urlreq = req.params.url;
    console.log("urlreq da endpoint",urlreq);
    

    var url=req.params.url;
    scrapingDih(url).then(data => {
        return res.send(data);
    })
        .catch(error => {
            console.error("ERROR | " + nameFile + " | get/scrap/:id | get ", error);
            logger.error(nameFile + ' | get/scrap/:id | get ' + error);
            ret.setSuccess(false);
            ret.setMessages("ax error");
            return res.send(ret);
        });
});

function getBeneficiaries($) {
    const table = $('table');
    const records = [];
    const rows = table.find('tr').slice(1);
    const headers = table.find('th').map((i, el) => $(el).text().trim()).get();

    rows.each((i, row) => {
        const record = {};

        $(row).find('td').each((j, cell) => {
            record[headers[j]] = $(cell).text().trim();
        });
        records.push(record);
    });
    return records;
}

async function scrapingDih(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        let dihInfo = []
        logger.info(nameFile + '| get/scrap | Scraping started...');

        const title = $('.ecl-page-header__title').text();
        const edihTitle = $('.field--name-field-title').text();
        const description = $('div.ecl p').text();
        const information = {
            website: $('.field--name-field-website').text(),
            email: $('.field--name-field-email').text()
        };
        const contractualRepresentatives = [$('.field--name-field-contractual-contact-name').text(), $('.field--name-field-contractual-contact-phone').text(), $('.field--name-field-contractual-contact-email').text()]
        const coordinatorAddress = [$('.field--name-field-co-location').text()]
        const beneficiaries = getBeneficiaries($)

        dihInfo.push({
            title: title,
            description: description,
            edihTitle: edihTitle,
            information: information,
            representatives: {contractualRepresentatives, coordinatorAddress},
            beneficiaries
        });
        logger.info(nameFile + '| get/scrap | Scraping ended...');
	     return dihInfo;
    } catch (error) {
        throw new Error('Errore durante lo scraping:', error);
    }
}

module.exports = router;
