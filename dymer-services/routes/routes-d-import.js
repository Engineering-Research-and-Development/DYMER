var util = require('../utility');
var jsonResponse = require('../jsonResponse');
var http = require('http');
var express = require('express');
const FormData = require('form-data')
const bodyParser = require("body-parser");
const path = require('path');
const nameFile = path.basename(__filename);
const mongoose = require("mongoose");
require('./mongodb.js');
const axios = require('axios');
const fs = require('fs');
var router = express.Router();
//const cron = require("node-cron");
//const schedule = require('node-schedule');
//https://www.npmjs.com/package/cron-job-manager
var CronJobManager = require('cron-job-manager');
const multer = require('multer');
//DymerCronJobRule
require("../models/permission/DymerCronJobRule");
const DymRule = mongoose.model("DymerCronJobRule");

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
    });*/
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
                console.log("countstop", countstop);
                console.log("a2", element.title, new Date().toLocaleString());
                let urlToInvocke = util.getServiceUrl('webserver') + util.getContextPath('webserver') + '/api/dservice/api/v1/import/fromdymer/' + key
                axios.get(urlToInvocke).then(resp => {

                    console.log("invoco super", key);
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
    console.log("provo a terminare");
    /*loblist[index].stop();*/
    manager.stop(campaignId)
        /* job.stop();*/
    console.log("ho terminato il processo");
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
    console.log("Put cronjob Roles");
    let id = req.params.id;
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
            ret.setMessages("Delete Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

// '/api/dservice/api/v1/import/fromjson'
router.get('/fromjson', (req, res) => {
    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let data = callData.data;
    let queryFind = callData.query;
    var filename = callData.filename;
    var entityType = callData.type;
    var listTopost = [];
    console.log(nameFile + ' | get/fromjson | import : ', filename);
    //http://localhost:8080/api/dservice/api/v1/import/fromjson?filename=AIREGIO_ServicePortfolio_onlinePortal.json.js&type=organization
    fs.readFile('importfile/' + filename, (err, data) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | get/fromjson  :", err);
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
                            "index": newentityType,
                            "type": newentityType
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
                        "username": "frastefa frastefa"
                    };
                    let userinfo_objJsonStr = JSON.stringify(userinfo);
                    let userinfo_objJsonB64 = Buffer.from(userinfo_objJsonStr).toString("base64");
                    var objToPost = { 'data': singleEntity, 'DYM': userinfo_objJsonB64, 'DYM_EXTRA': extrainfo_objJsonB64 };
                    listTopost.push(objToPost);
                });
                listTopost.forEach(function(obj, index) {
                    setTimeout(function() {
                        console.log("import timeout axios", index);
                        postMyData(obj.data, newentityType, obj.DYM, obj.DYM_EXTRA);
                    }, 1000 * (index + 1));
                });
                return res.send(ret);
            })
            .catch(error => {
                console.error("ERROR | " + nameFile + " | get/fromjson ", error);
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

function postMyData(el, index, DYM, DYM_EXTRA) {
    // var posturl = "http://localhost:8080/api/entities/api/v1/entity/" + index;
    var posturl = "";
    var formdata = new FormData();
    appendFormdata(formdata, el);
    var config = {
        method: 'post',
        url: posturl,
        headers: {
            ...formdata.getHeaders(),
            'Authorization': `Bearer ${DYM}`,
            'extrainfo': `${DYM_EXTRA}`,
        },
        data: formdata
    };
    axios(config)
        .then(function(updatedEl) {}).catch(function(error) {
            console.log("Error__________", error);
        });

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

function postMyDataAndFiles(el, index, DYM, DYM_EXTRA, action) {
    var posturl = util.getServiceUrl('webserver') + util.getContextPath('webserver') + "/api/entities/api/v1/entity/" + index;
    if (action == "put")
        posturl = util.getServiceUrl('webserver') + util.getContextPath('webserver') + "/api/entities/api/v1/entity/" + el.instance.id;
    var formdata = new FormData();
    let arrlistFiles = [];
    let dest = 'tempfolder';
    const dir = dest + "/" + el.instance.id;
    checkFilesFormdata(arrlistFiles, el);
    let requests = arrlistFiles.map((fl) => {
        let url = util.getServiceUrl('webserver') + util.getContextPath('webserver') + "/api/entities/api/v1/entity/contentfile/" + el.instance.id + "/" + fl.id;
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
        console.log("Promesse tutte eseguite");
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
// '/api/dservice/api/v1/import/fromdymer'
router.get('/fromdymer/:id', (req, res) => {
    var ret = new jsonResponse();
    var id = req.params.id;
    var myfilter = { "_id": id };
    DymRule.find(myfilter).then((els) => {
        let crnrule = els[0];
        var pt_external = crnrule.sourcepath; //"http://localhost:8080/api/entities/api/v1/entity/_search";
        var pt_internal = util.getServiceUrl('webserver') + util.getContextPath('webserver') + "/api/entities/api/v1/entity/_search";
        const originalrelquery = crnrule.sourceindex; //."";
        const newentityType = crnrule.targetindex; //"";
        const targetprefix = (crnrule.targetprefix == undefined) ? "" : crnrule.targetprefix;
        let importRelations = (crnrule.importrelation == undefined) ? false : crnrule.importrelation;
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
                            let isdih = false;
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
                            }
                            //fine dih
                            let elfinded = listaInt.find((el) => el._id == targetprefix + element._id);
                            if (importRelations) {
                                if (element.hasOwnProperty("relations")) {
                                    if (element.relations.length > 0)
                                        element.relation = {};
                                    element.relations.forEach(entityrelation => {
                                        let indexentrel = entityrelation._index;
                                        let identrel = entityrelation._id;
                                        if (element.relation.hasOwnProperty(indexentrel)) {
                                            element.relation[indexentrel].push({
                                                "to": identrel
                                            });
                                        } else {
                                            element.relation[indexentrel] = [{
                                                "to": identrel
                                            }];
                                        }
                                    });
                                }
                            }
                            /* dih add relation to initiatives */
                            if (isdih) {
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
                                    /*continuo il flusso da qua */
                                }).catch(error => {
                                    console.error("ERROR | " + nameFile + " | get/fromdymer/:id ", id, error);
                                    ret.setSuccess(false);
                                    ret.setMessages("ax error");
                                    return res.send(ret);
                                });
                            }
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
                                console.log(nameFile + " | get/fromdymer/:id | dateExt > dateInt,aggiungo", JSON.stringify(objToPost));
                                listTopost.push(objToPost);
                            } else {
                                let dateExt = new Date(element._source.properties.changed);
                                let dateInt = new Date(elfinded._source.properties.changed);
                                if (dateExt > dateInt) {
                                    //add put
                                    console.log(nameFile + " | get/fromdymer/:id | dateExt > dateInt,aggiorno", JSON.stringify(objToPost));
                                    listToput.push(objToPost);
                                }
                            }
                        });
                        listTopost.forEach(function(obj, index) {
                            setTimeout(function() {
                                console.log(nameFile + " | get/fromdymer/:id | import timeout axios post ", index);
                                postMyDataAndFiles(obj.data, newentityType, obj.DYM, obj.DYM_EXTRA, "post");
                            }, 1000 * (index + 1));
                        });
                        listToput.forEach(function(obj, index) {
                            setTimeout(function() {
                                console.log(nameFile + " | get/fromdymer/:id | import timeout axios put ", index);
                                postMyDataAndFiles(obj.data, newentityType, obj.DYM, obj.DYM_EXTRA, "put");
                            }, 1000 * (index + 1));
                        });
                        //    return res.send(ret);
                    })
                    .catch(error => {
                        console.error("ERROR | " + nameFile + " | get/fromdymer/:id | post ", error);
                        ret.setSuccess(false);
                        ret.setMessages("ax error");
                        return res.send(ret);
                    });
                return res.send(ret);
            })
            .catch(error => {
                console.error("ERROR | " + nameFile + "| get/fromdymer/:id | post axios", error);
                ret.setSuccess(false);
                ret.setMessages("ax error");
                return res.send(ret);
            });
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + "| get/fromdymer/:id | find", error);
            ret.setMessages("find Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});
module.exports = router;