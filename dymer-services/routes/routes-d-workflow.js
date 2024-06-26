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
const OpnSearchConfig = mongoose.model("OpnSearchConfig");
require('./mongodb.js');
const axios = require('axios');
const fs = require('fs');
var router = express.Router();
const multer = require('multer');
const { json } = require('body-parser');
const { Console } = require('console');

require("../models/workflow/DymerWorkFlow");
const WFRule = mongoose.model("DymerWorkflow");
router.use(bodyParser.json({
    limit: '50mb',
    extended: true
}))
router.use(bodyParser.urlencoded({
    limit: '100mb',
    extended: true
}))

router.post('/listener', async function (req, res) {
    console.log('listenerwf');
    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let data = callData.data;
    let extraInfo = callData.extraInfo;
    let origindata = callData.origindata;
    let originheader = callData.originheader;
    let rfrom = (req.headers["reqfrom"]).replace("http://", "").replace("https://", "").replace("/", "");
    var eventSource = (data.eventSource).split('_');;

    await new Promise(resolve => setTimeout(resolve, 5000));
    //  console.log(' | data.obj', data.obj);
    // genEntWFAction(eventSource[1], data.obj, origindata, originheader, extraInfo)
    genWFAction(eventSource[1], data.obj, rfrom, undefined, origindata, originheader, extraInfo)
});

if (typeof String.prototype.parseFunction != 'function') {
    String.prototype.parseFunction = function () {
        var funcReg = /function *\(([^()]*)\)[ \n\t]*{(.*)}/gmi;
        var match = funcReg.exec(this.replace(/\n/g, ' '));
        try {
            if (match) {
                return new Function(match[1].split(','), match[2]);
            }
        } catch (er) { logger.error(nameFile + ' | parse function | fnCond : ' + er); return null; }
        return null;
    };
}

function genWFAction(action, objToPost, rfrom, rules, origindata, originheader, extraInfo) {
    let hdymeruser = originheader.dymeruser;
    let du = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));

    //console.log("genWFAction hdymeruser ", hdymeruser);
    //console.log("genWFAction du ", du);
    let isAppAdmin  = false;
    let isAppEditor  = false;
    let isOwner = false;

    if ((du.roles.indexOf("app-admin") > -1)){
        isAppAdmin=true;
    } 
    if ((du.roles.indexOf("app-editor") > -1)){
        isAppEditor=true;
    }
    /*if ((du.email==objToPost._source.properties.owner.uid)){
        isOwner=true;
    }*/
    //let indexchek="workflow";
    logger.info(nameFile + '| genWFAction' ); 
    origindata=(origindata==undefined)?objToPost:origindata;
    var opnConfUtil = util.getServiceConfig("opnsearch");
    // let base_admin=["francesco.stefanelli@eng.it"];//set app-admin role in Liferay
    let wfindexes=["sps","spd","smd","repository"];
    //console.log("wfindexes ", wfindexes);
    
    let old_wflevel = (origindata._index == "repository") ? origindata._source.wflevelrepo : origindata._source.wflevel;
    let new_wflevel = (origindata._index == "repository") ? objToPost._source.wflevelrepo : objToPost._source.wflevel;  
    let resource_name = (origindata._index == "repository") ? "candidatura" : "risorsa";  
	let base_admin=  (origindata._index == "repository") ? ["servizipride@edih-pride.eu"] : ["enzocaputo@meditech4.com"];
    let titleEntity = objToPost._source.title;
    /*
    console.log("_index ",origindata._index);
    console.log("old_wflevel ", old_wflevel);
    console.log("new_wflevel ", new_wflevel);
    */
    let index=origindata._index;
    let id=objToPost._id; 
    let orignalOwner=objToPost._source.properties.owner.uid;
    let updateUser=objToPost._source.properties.extrainfo.lastupdate.uid;
    let dymeruser = JSON.parse(Buffer.from(originheader.dymeruser, 'base64').toString('utf-8'));
    let sendNot=false;
    //TODO NEW var companyId = (extraInfo != undefined) ? extraInfo.companyId : opnConfUtil.user.d_cid;
    var companyId = (extraInfo != undefined) ? extraInfo.companyId : opnConfUtil.user.d_gid;
    //var companyId =opnConfUtil.user.d_gid;
   //action=update,delete,insert
   let notifObj=  {
    "companyId": Number(companyId) ,
    "title": "",
    "description": "",
    "resourceId": id,
    "index": index,
    "type": index,
    "resourceLink": "",
    "sender": "",
   // "role": "Notificationv2"
     "recipients":[]
  };
  if(wfindexes.includes(index) ){
    //console.log("wfindexes includes index ", index);
    let levels=["In compilazione","Da approvare","Incompleta","Approvato"];
    if( action=="insert"){
        
        if(isAppEditor && new_wflevel==levels[0]){
            //console.log("==>insert, state: In compilazione");
            notifObj.title="L'utente "+dymeruser.username+" ha inserito la seguente "+resource_name+" in bozza:" ;
            notifObj.description=titleEntity;
            notifObj.sender=orignalOwner;
            notifObj.recipients=base_admin
            sendNot=true;
        }
        if(isAppEditor && old_wflevel==levels[1] && new_wflevel==levels[1]){
            //console.log("==>insert, state: In compilazione --> Da approvare");
            notifObj.title="L'utente "+dymeruser.username+" ha inserito la seguente "+resource_name+":" ;
            notifObj.description=titleEntity+". <br> La "+resource_name+" deve essere approvata o messa in revisione ";
            notifObj.sender=orignalOwner;
            notifObj.recipients=base_admin
            sendNot=true;
        }      
   }
   if( action=="delete"){    
        notifObj.title="L'utente "+dymeruser.username+" ha eliminato la seguente "+resource_name+":" ;
        notifObj.description=titleEntity; 
        notifObj.recipients=base_admin
        sendNot=true;
   }
   if( action=="update" ){
        
         notifObj.title="L'utente "+dymeruser.username+" ha aggiornato la seguente "+resource_name+":" ;       
        if(isAppEditor && old_wflevel==levels[0] && new_wflevel==levels[1]){
            //send notification to app-admin
            //console.log("send notification to ADMIN, state: In compilazione --> Da approvare");
            notifObj.description=titleEntity+". <br> La "+resource_name+" deve essere approvata o messa in revisione ";
            notifObj.sender=orignalOwner;
            notifObj.recipients=base_admin
            sendNot=true;
        }
        if(isAppAdmin && old_wflevel==levels[1] && new_wflevel==levels[2]){
            //send notification to app-editor
            //console.log("send notification to OWNER, state: Da approvare --> Incompleta");
            notifObj.description=titleEntity+". <br> La "+resource_name+", dopo essere stata revisionata, deve essere messa in approvazione";
            notifObj.sender=updateUser;
            notifObj.recipients.push(orignalOwner);
            sendNot=true;
        }
        if(isAppEditor && old_wflevel==levels[2] && new_wflevel==levels[1]){
            //send notification to app-admin
            //console.log("send notification to ADMIN, state: Incompleta --> Da approvare");
            notifObj.description=titleEntity+". <br> La "+resource_name+" deve essere approvata o messa in revisione ";
            notifObj.sender=orignalOwner;
            notifObj.recipients=base_admin;
            sendNot=true;
        }
        if(isAppAdmin && old_wflevel==levels[1] && new_wflevel==levels[3]){
            //send notification to app-editor
            //console.log("send notification to OWNER, state: Da approvare --> Approvato");
            notifObj.title="L'utente "+dymeruser.username+" ha approvato la seguente "+resource_name+": " ;
            notifObj.description=titleEntity;
            notifObj.sender=updateUser;
            notifObj.recipients.push(orignalOwner);
            sendNot=true;
        }
   }
   let notBody={
    "/dym.dymerentry/sendPersonalNotification":notifObj
   }
   if(sendNot)
   oPNnotify(action,notBody,undefined,extraInfo,opnConfUtil )
   else{
    logger.info(nameFile + '| condizione non invio' ); 
   }
}
if(!sendNot) logger.info(nameFile + '| condizione non invio' ); 
   
}

function oPNnotify(typeaction, obj, rule, extraInfo,opnConfUtil) {
    //console.log(nameFile + ' | postAssettOpenness | extraInfo', JSON.stringify(extraInfo)); 
    logger.info(nameFile + '|oPNnotify', typeaction);
    var queryFind = { 'servicetype': typeaction };
    OpnSearchConfig.find(queryFind).then((els) => { 
         logger.info(nameFile + '|oPNnotify', JSON.stringify(els));
        if (els.length > 0) {
            try {
                var el = els[0]; 
                postNotification(el, obj,opnConfUtil);
              
            } catch (error) {
                logger.error(nameFile + ' | oPNnotify | find obj,extraInfo: ' + JSON.stringify(obj) + ',' + JSON.stringify(extraInfo) + ',' + error);
            }
        }
    }).catch((err) => {

        logger.error(nameFile + ' | oPNnotify | find obj,extraInfo: ' + JSON.stringify(obj) + ',' + JSON.stringify(extraInfo) + ',' + err);
        console.error("ERROR | " + nameFile + " | oPNnotify | find : ", err);
    })
}

function postNotification(conf, postObj,opnConfUtil) { 
    var callurl = conf.configuration.host;
    if (conf.configuration.port != undefined)
        if (conf.configuration.port != '')
            callurl += ":" + conf.configuration.port;
    callurl += "/api/jsonws/invoke"; 
    logger.info(nameFile + ' | postNotification  | chiamata callur X :' + callurl);
    if (conf.configuration.method == "POST") {
        logger.info(nameFile + ' | postNotification  | with postObj :' + JSON.stringify(postObj)); 
        var creden = opnConfUtil.user.d_mail + ":" + opnConfUtil.user.d_pwd; 
        logger.info(nameFile + ' | postNotification  | creden->:' + opnConfUtil.user.d_mail);
        const buff = Buffer.from(creden, 'utf-8'); 
        let authorizationBasic = buff.toString('base64'); 
        var configqq = {
            "headers": {
                "Authorization": "Basic " + authorizationBasic
            }
        }; 

        console.log("Provo ad inviare NOTIFICA",callurl, postObj, configqq)
        
        axios.post(callurl, postObj, configqq)
            .then(function(response) {
                logger.info(nameFile + ' | postNotification | POST | response ' + callurl + " , " + response);
                  console.log(" NOTIFICA inviata",callurl, postObj, configqq)
            })
            .catch(function(error) {
                console.log(nameFile + ' | postNotification | POST', error);
                logger.error(nameFile + ' | postNotification | POST : ' + error);
            });
    } else {
        logger.info(nameFile + ' | postNotification | GET | callurl, postObj, configqq' + callurl + " , " + JSON.stringify(postObj));;
       
        axios.get(callurl, { params: postObj }).catch(function(error) {
            console.log(nameFile + ' | postNotification | GET', error);
            logger.error(nameFile + ' | postNotification | GET : ' + error);
        });
    }
}

function genEntWFAction(action, element, origindata, originheader, extraInfo) {
    let dymeruser = JSON.parse(Buffer.from(originheader.dymeruser, 'base64').toString('utf-8'));
    origindata = (origindata == undefined) ? element : origindata;
    let index = element._index;
    let newentityType = "dih";
    // let wfindexes = ["workflow", "sps", "spd"];
    let wfindexes = ["workflow", "sps", "spd", "dih"];
    var objToPost = {}
    if (wfindexes.includes(index)) {
        if (action == "insert") {
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
                ipsource: ""
            };
            propert_.status = "1";
            propert_.visibility = "0";
            propert_.ipsource = element._source.properties.ipsource;
            var singleEntity = {
                "instance": {
                    "index": newentityType,
                    "type": newentityType
                },
                "data": {
                    title: element._source.title + "gen",
                    "description": element._source.description,
                    properties: propert_
                }
            };
            // if (rel_id != undefined)
            //singleEntity.data.relation = { dih: [{ to: rel_id }] };
            var extrainfo = extraInfo
            let extrainfo_objJsonStr = JSON.stringify(extrainfo);
            let extrainfo_objJsonB64 = Buffer.from(extrainfo_objJsonStr).toString("base64");
            let userinfo = dymeruser;
            userinfo.roles.push({
                "role": "app-content-curator",
                "id": "20110"
            })
            let userinfo_objJsonStr = JSON.stringify(userinfo);
            let userinfo_objJsonB64 = Buffer.from(userinfo_objJsonStr).toString("base64");
            //var objToPost = {
            objToPost = {
                'data': singleEntity,
                'DYM': userinfo_objJsonB64,
                'DYM_EXTRA': extrainfo_objJsonB64
            };
            // console.log('singleEntity', singleEntity);
            //    postEntity(singleEntity, newentityType, objToPost.DYM, objToPost.DYM_EXTRA, originheader)
        }
    }
    /**********************/
    var queryFind = { 'indexes': { $in: [element._index] }, 'active': true };
    WFRule.find(queryFind).then((els) => {
        // console.log("genEntWFAction | ELS: ", els)
        let rules = els;
        postWF(action, objToPost, rules, singleEntity, origindata);
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | post/listener :", err);
            logger.error(nameFile + ' | post/listener :' + err);
        }
    });
    /**********************/
}

function postEntity(el, index, DYM, DYM_EXTRA, originheader) {
    // var posturl = util.getServiceUrl('webserver') + util.getContextPath('webserver') + "/api/entities/api/v1/entity/" + index;
    var posturl = util.getServiceUrl('entity') + "/api/v1/entity/" + index;

    var formdata = new FormData();
    appendFormdata(formdata, el);
    var config = {
        method: 'post',
        url: posturl,
        headers: {
            ...formdata.getHeaders(),
            //'dymeruser': `Bearer ${DYM}`,
            'dymeruser': `${DYM}`,
            //  'extrainfo': `${DYM_EXTRA}`,
            "reqfrom": originheader.reqfrom
        },
        data: formdata
    };
    axios(config)
        .then(function (updatedEl) { }).catch(function (error) {
            console.log("Error__________", error);
            logger.error(nameFile + ' | postMyData : ' + error);
        });
}
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

/*************************************************************************/
router.get('/listrules', util.checkIsAdmin, (req, res) => {
    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    var queryFind = {};
    WFRule.find(queryFind).then((els) => {
        console.log(els)
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

router.post('/:id?', util.checkIsAdmin, function (req, res) {
    let id = req.params.id;
    let callData = util.getAllQuery(req);
    // let data = callData.data;
    let data_ = req.body;
    let data = {
        ...data_,
        indexes: data_.indexes.map(item => item.id)
    }

    var copiaData = Object.assign({}, data);
    var ret = new jsonResponse();
    if (id != undefined) {
        var myfilter = { "_id": mongoose.Types.ObjectId(id) };
        WFRule.updateOne(myfilter, data,
            function (err, raw) {
                if (err) {
                    ret.setSuccess(false);
                    logger.error(nameFile + ' | post/workflow/:id? | updateOne :' + err);
                    console.error("ERROR | " + nameFile + " | post/workflow/:id? | updateOne :", err);
                    ret.setMessages("Model Error");
                    return res.send(ret);
                } else {
                    ret.addData(copiaData);
                    ret.setMessages("Config Updated");
                    return res.send(ret);
                }
            }
        );
    } else {
        var mod = new WFRule(data);
        mod.save().then((el) => {
            ret.setMessages("Config created successfully");
            ret.addData(el);
            return res.send(ret);
        }).catch((err) => {
            if (err) {
                logger.error(nameFile + ' | post/workflow/:id? | create: ' + err);
                console.error("ERROR | " + nameFile + " | post/workflow/:id? | create: ", err);
                ret.setMessages("Post error");
                ret.setSuccess(false);
                ret.setExtraData({ "log": err.stack });
                return res.send(ret);
            }
        })
    }
});

router.put('/:id', util.checkIsAdmin, (req, res) => {
    let id = req.params.id;
    logger.info(nameFile + ' | put/workflow/:id   :' + id);
    let callData = util.getAllQuery(req);
    // let data = req.body;
    let data_ = req.body;
    let data = {
        ...data_,
        indexes: data_.indexes.map(item => item.id)
    }
    //console.log("UPDATE | req.body: \n", req.body)
    console.log("UPDATE | req.body: \n", data)
    var copiaData = Object.assign({}, data);
    var ret = new jsonResponse();
    var myfilter = { "_id": mongoose.Types.ObjectId(id) };
    var myquery = {
        "$set": req.body
    };
    // WFRule.updateOne(myfilter, req.body,
    WFRule.updateOne(myfilter, data,
        function (err, raw) {
            if (err) {
                ret.setSuccess(false);
                console.error("ERROR | " + nameFile + " | put/sync/:id? | updateOne :", err);
                logger.error(nameFile + ' | put/sync/:id? | updateOne : ' + err);
                ret.setMessages("Element Error");
                return res.send(ret);
            } else {
                ret.addData(copiaData);
                ret.setMessages("Element Updated");
                return res.send(ret);
            }
        }
    );
});

router.delete('/:id', util.checkIsAdmin, (req, res) => {
    var ret = new jsonResponse();
    var id = req.params.id;
    var myfilter = { "_id": id };
    WFRule.findOneAndDelete(myfilter).then((el) => {
        ret.setMessages("Element deleted");
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | delete/workflow/:id? | findOneAndDelete :", err);
            logger.error(nameFile + ' | delete/workflow/:id? | findOneAndDelete : ' + err);
            ret.setMessages("Delete Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});
/*************************************************************************/
function postWF(action, objToPost, /*rfrom,*/ rules, origindata) {

    console.log(nameFile + ' | action', action);
    console.log(nameFile + ' | objToPost', objToPost);
    console.log(nameFile + ' | rules', rules);

    rules.forEach(async element => {
        let entity = { ...objToPost.data };
        let extraInfo = { ...objToPost.DYM_EXTRA };

        if (element.cond != undefined) {
            let mfunc = element['cond'];
            try {
                var fnCond = ("function (obj, extraInfo, fnaction) {  " + mfunc + " }").parseFunction();
                let condition = fnCond(entity, extraInfo, action);
                console.log("----------------------------condition ", condition)
                /**********************************************************/
                if (condition) {
                    switch (element['workflow']) {
                        case 'send-mail':
                            console.log("case mail")
                            let emailInfo = element['emailinfo']
                            //await sendMail(emailInfo, origindata)
                            await sendMail(emailInfo, objToPost)
                            break;
                        case 'notification':

                            let notifObj = {
                                "companyId": "Number(companyId)",
                                "title": "",
                                "description": "",
                                "resourceId": "id",
                                "index": "index",
                                "type": "index",
                                "resourceLink": "",
                                "sender": "",
                                // "role": "Notificationv2"
                                "recipients": []
                            };
                            var opnConfUtil = util.getServiceConfig("opnsearch");
                            let notBody = {
                                "/dym.dymerentry/sendPersonalNotification": notifObj
                            }
                            oPNnotify('insert', notBody, undefined, extraInfo, opnConfUtil)
                            break;
                    }
                    /**********************************************************/
                }
            } catch (error) {
                console.log("error: ", error);
            }
        }
    });
}


/*************************************************************************/
async function sendMail(emailInfo, origindata) {

    let payload = [];

    for (let info of emailInfo) {
        let mailInfo = {
            from: "TEST <test@demetrixtech.it>", // info.from,
            to: info.to, //"antonino.cacicia@demetrix.it",
            subject: info.object, //.slice(0, -3), // To remove "gen" ending
            lang: "it",
            mailBody: info.body // "Se tutto va per come deve andare, arriva per il workfloW",
        }
        logger.debug(nameFile + ` | post | sendMail : ${mailInfo}`)

        payload.push({
            mailInfo,
            interpolationData: origindata
        })
    }
    try {
        await axios.post("http://localhost:9292/sendemails", payload)

    } catch (err) {
        console.error("ERROR | " + nameFile + " | workflow | sendMail:", err);
        logger.error(nameFile + ' | workflow | sendMail:' + err);
    }
}
/*************************************************************************/

module.exports = router;
