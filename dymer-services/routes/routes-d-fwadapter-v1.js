var util = require('../utility');
var jsonResponse = require('../jsonResponse');
const multer = require('multer');
var fs = require('fs');
var mv = require('mv');
var FormData = require('form-data');
var http = require('http');
require("../models/fwadapter/FwadapterConfig");
var express = require('express');
//const multer = require('multer');
const bodyParser = require("body-parser");
const path = require('path');
const nameFile = path.basename(__filename);
const mongoose = require("mongoose");
require('./mongodb.js');
var router = express.Router();
const logger = require('./dymerlogger');
//var GridFsStorage = require("multer-gridfs-storage"); 
const FwadapterConfig = mongoose.model("FwadapterConfig");
const axios = require('axios');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: false,
    limit: '100MB'
}));
var storageEngine = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, './uploads');
    },
    filename: function(req, file, fn) {
        fn(null, new Date().getTime().toString() + '-__-' + file.originalname);
    }
});
var upload = multer({ storage: storageEngine }).any();
router.post('/setConfig', util.checkIsAdmin, function(req, res) {
    let callData = util.getAllQuery(req);
    let data = callData.data;
    var copiaData = Object.assign({}, data);
    var ret = new jsonResponse();
    var obj = data;
    var id = obj.id;
    delete obj.id;
    var mod = new FwadapterConfig(obj);
    if (id != '' && id != undefined) {
        var myfilter = { "_id": mongoose.Types.ObjectId(id) };
        FwadapterConfig.updateOne(myfilter, obj,
            function(err, raw) {
                if (err) {
                    ret.setSuccess(false);
                    console.error("ERROR | " + nameFile + " | post/setConfig | updateOne :", err);
                    ret.setMessages("Model Error");
                    return res.send(ret);
                } else {
                    ret.addData(copiaData);
                    ret.setMessages("Config Updated");
                    return res.send(ret);
                }
            }
        );
    } else
        mod.save().then((el) => {
            ret.setMessages("Config created successfully");
            ret.addData(el);
            return res.send(ret);
        }).catch((err) => {
            if (err) {
                console.error("ERROR | " + nameFile + " | post/setConfig | save :", err);
                ret.setMessages("Post error");
                ret.setSuccess(false);
                ret.setExtraData({ "log": err.stack });
                return res.send(ret);
            }
        })
});

router.get('/configs', (req, res) => {
    var ret = new jsonResponse();

    let callData = util.getAllQuery(req);
    let data = callData.data;
    let queryFind = callData.query;
    console.log("fwadapter | configs :", JSON.stringify(queryFind));
    FwadapterConfig.find(queryFind).then((els) => {
            ret.setMessages("List");
            ret.setData(els);
            return res.send(ret);
        }).catch((err) => {
            if (err) {
                console.error("ERROR | " + nameFile + " | get/configs :", err);
                ret.setMessages("Get error");
                ret.setSuccess(false);
                ret.setExtraData({ "log": err.stack });
                return res.send(ret);
            }
        })
        //res.send("this is  dd our main andpoint");
});

router.post('/listener', function(req, res) {
    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let data = callData.data;
    let extraInfo = callData.extraInfo;
    //res.send(ret);
    var eventSource = (data.eventSource).split('_');
    //console.log("INFO | " + nameFile + " | headers :", req.headers);
    //console.log("INFO | " + nameFile + " | typeaction :", eventSource[1]);
    console.log("INFO | " + nameFile + " | obj :", data.obj);
    //console.log("INFO | " + nameFile + " | extraInfo :", extraInfo);
    let rfrom = (req.headers["reqfrom"]).replace("http://", "").replace("https://", "").replace("/", "");
    postfwadapter(eventSource[1], data.obj, extraInfo.extrainfo, rfrom);
});

function postfwadapter(typeaction, obj, extraInfo, rfrom) {
    //console.log(nameFile + ' | postAssettOpenness | extraInfo', JSON.stringify(extraInfo));
    //var opnConfUtil = util.getServiceConfig("opnsearch");
    var queryFind = { 'servicetype': typeaction };
    FwadapterConfig.find(queryFind).then((els) => {
        if (els.length > 0) {
            try {
                var el = els[0];
                let extrainfo_objJsonStr = {
                    extrainfo: { companyId: 'dymer', groupId: '1', cms: 'lfr', userId: 'pinocpallino@gg.it', emailAddress: 'pinocpallino@gg.it' }
                };
                // let extrainfo_objJsonStr = JSON.stringify(extraInfo);
                let DYM_EXTRA = Buffer.from(extrainfo_objJsonStr).toString("base64");
                var userinfo = {
                    "isGravatarEnabled": false,
                    "authorization_decision": "",
                    "roles": [{
                            "role": "User",
                            "id": "20109"
                        },
                        {
                            "role": "app-adapter",
                            "id": "20110"
                        }
                    ],
                    "app_azf_domain": "",
                    "id": "dymer@adapter.it",
                    "app_id": "",
                    "email": "dymer@adapter.it",
                    "username": "dymer@adapter.it"
                };
                let userinfo_objJsonStr = JSON.stringify(userinfo);
                let DYM = Buffer.from(userinfo_objJsonStr).toString("base64");
                //var objToAssett = {}
                let action = "post";
                if (el.servicetype == 'insert' || el.servicetype == 'update') {
                    if (el.servicetype == 'update')
                        action = "put";
                }
                if (el.servicetype == 'delete') {
                    action = "delete";
                }

                if ((el.configuration.host).includes(rfrom)) {
                    logger.info(nameFile + ' | postfwadapter | ' + action + ': Non inoltro , arriva da ' + rfrom);
                } else {
                    let listRel = [];
                    if (el.configuration.hasOwnProperty("relations")) {
                        listRel = el.configuration.relations.split(",");
                    }

                    let index = obj["_index"];
                    /*var objToAssett = {
                        "instance": {
                            "index": index,
                            "type": index
                        },
                        "data": obj._source
                    };*/
                    let objToAssett = obj._source;
                    objToAssett.instance = {
                        "index": index,
                        "type": index,
                        "id": obj._id
                    };

                    /* objToAssett["_index"] = index;
                     objToAssett["_type"] = index;
                     objToAssett["_id"] = obj._id;*/
                    console.log(nameFile + ' | pre postfwadapter |' + JSON.stringify(objToAssett));
                    var ref = undefined;
                    if (objToAssett.properties.status == 1) {
                        if (objToAssett.hasOwnProperty("relation")) {
                            ref = {};
                            listRel.forEach(value => {
                                    if (objToAssett.relation.hasOwnProperty(value)) {
                                        ref[value] = objToAssett.relation[value];
                                    }
                                })
                                //ref = Object.assign({}, editValues.relation);
                            objToAssett.relation = ref;
                        }
                        /*if (action == "post") {
                            objToAssett.instance.id = obj._id;
                        }*/
                        logger.info(nameFile + ' | postfwadapter |' + action + ': Inoltro, ad adapter, arriva da ' + rfrom);
                        logger.info(nameFile + ' | postfwadapter |' + JSON.stringify(objToAssett));
                        callFwAdapter(objToAssett, index, DYM, DYM_EXTRA, action, el);
                    }
                }
            } catch (error) {
                logger.error(nameFile + ' | postfwadapter | find obj,extraInfo: ' + JSON.stringify(obj) + ',' + JSON.stringify(extraInfo) + ',' + error);
            }
        }
    }).catch((err) => {
        logger.error(nameFile + ' | postfwadapter | find obj,extraInfo: ' + JSON.stringify(obj) + ',' + JSON.stringify(extraInfo) + ',' + err);
        console.error("ERROR | " + nameFile + " | postAssettOpenness | find : ", err);
    })
}

function callFwAdapter(el, index, DYM, DYM_EXTRA, action, conf) {
    //if (action == "put")
    //posturl = util.getServiceUrl('webserver') + "/api/entities/api/v1/entity/" + el.instance.id;
    var posturl = conf.configuration.host;
    if (conf.configuration.port != undefined)
        if (conf.configuration.port != '')
            posturl += ":" + conf.configuration.port;
    posturl += conf.configuration.path;
    if (action == "delete")
        posturl = posturl + "/" + el["_id"];
    var formdata = new FormData();
    let arrlistFiles = [];
    let dest = 'tempfolder';
    let id = el.instance["id"];
    const dir = dest + "/" + id;
    checkFilesFormdata(arrlistFiles, el);
    let requests = arrlistFiles.map((fl) => {
        let url = util.getServiceUrl('webserver') + "/api/entities/api/v1/entity/contentfile/" + id + "/" + fl.id;
        url += "?tkdym=" + DYM;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        let fname = fl.filename;
        return downloadFile(url, dir, fname).then(function(result) {
            // form.append('file', fs.readFileSync(dest), fname);
        }).catch(function(err) {
            console.log("err_a");
            console.log(err);
        });
    })
    Promise.all(requests).then(() => {
        appendFormdataFiles(formdata, el, '', dir + "/");
        var config = {
            method: action,
            url: posturl,
            headers: {
                ...formdata.getHeaders(),
                'Authorization': `Bearer ${DYM}`,
                'extrainfo': `${DYM_EXTRA}`,
            },
            data: formdata
        };
        logger.info(nameFile + ' | callFwAdapter | invio, ad adapter | conf : ' + JSON.stringify(conf));
        logger.info(nameFile + ' | callFwAdapter | invio, ad adapter | el : ' + JSON.stringify(el));

        axios(config)
            .then(function(updatedEl) {
                if (fs.existsSync(dir)) {
                    removeDir(dir);
                    //  fs.rm(dir);
                    // fs.rmdirSync(dir, { recursive: true });
                }
            }).catch(function(error) {
                console.log("Error__________", error);
            });
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
    }
}


function appendFormdataFiles(FormData, data, name, folder) {
    var name = name || '';
    if (typeof data === 'object') {
        var index = 0
        if (data.hasOwnProperty("filename") && data.hasOwnProperty("bucketName")) {
            FormData.append(name, fs.createReadStream(folder + data.filename));
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
var downloadFile = function(url, dest, filename) {
    return new Promise(function(resolve, reject) {
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
        })
    }).catch(function(err) {
        console.error("ERROR | " + nameFile + " | downloadFile ", err);
    });
}

function callFwAdapter_no(conf, postObj) {
    var opnConfUtil = util.getServiceConfig("opnsearch");
    var callurl = conf.configuration.host;
    if (conf.configuration.port != undefined)
        if (conf.configuration.port != '')
            callurl += ":" + conf.configuration.port;
    callurl += "/api/jsonws/invoke";
    console.log('chiamata callur X', callurl);
    if (conf.configuration.method == "POST") {
        var objPOST = {};
        objPOST[conf.configuration.path] = postObj;
        postObj = objPOST;
        console.log('with postObj ', postObj);
        //   postObj = JSON.stringify(objPOST);
        //    var configqq = { headers: { Cookie: 'JSESSIONID=C9B87F42FCF0BA612F4B59E411E908C5;' } };
        var creden = opnConfUtil.user.d_mail + ":" + opnConfUtil.user.d_pwd;
        console.log('creden->', opnConfUtil.user.d_mail);
        const buff = Buffer.from(creden, 'utf-8');
        //let buff = new Buffer(creden);
        let authorizationBasic = buff.toString('base64');
        //   let authorizationBasic = Buffer.from(creden, 'base64');
        var configqq = {
            "headers": {
                "Authorization": "Basic " + authorizationBasic
            }
        };
        console.log('Authorization header-> ', configqq);
        axios.post(callurl, postObj, configqq)
            .then(function(response) {
                console.log(nameFile + ' | callOpennessJsw | POST | callurl, postObj, configqq', callurl, JSON.stringify(postObj), JSON.stringify(configqq));
                console.log(nameFile + ' | callOpennessJsw | POST | response', callurl, JSON.stringify(response));
            })
            .catch(function(error) {
                console.log(nameFile + ' | callOpennessJsw | POST', error);
            });
    } else {
        console.log(nameFile + ' | callOpennessJsw | GET | callurl, postObj, configqq', callurl, JSON.stringify(postObj));;
        axios.get(callurl, { params: postObj }).catch(function(error) {
            console.log(nameFile + ' | callOpennessJsw | GET', error);
        });
    }
}
module.exports = router;