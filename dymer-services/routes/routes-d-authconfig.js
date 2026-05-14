var jsonResponse = require('../jsonResponse');
var util = require('../utility');
var http = require('http');
var url = require("url");
var express = require('express');
const bodyParser = require("body-parser");
const path = require('path');
const nameFile = path.basename(__filename);
const mongoose = require("mongoose");
require('./mongodb.js');
var router = express.Router();
var jsonParser = bodyParser.json();
//var GridFsStorage = require("multer-gridfs-storage");
require("../models/permission/DymerAuthenticationRule");
const DymRule = mongoose.model("DymerAuthenticationRule");
const axios = require('axios');
var crypto = require('crypto');

const logger = require('./dymerlogger')
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: false,
    limit: '100MB'
}));

router.get('/', util.checkIsAdmin, (req, res) => {
    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let data = callData.data;
    var queryFind = {};
    DymRule.find(queryFind).then((els) => {
        ret.setMessages("List");
        ret.setData(els);
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error(err);
            logger.error(nameFile + ' | get/ | : ' + err);
            ret.setMessages("Get error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

router.get('/userinfo', (req, res) => {
	//console.log(nameFile + " | userinfo | " );										  
    var ret = new jsonResponse();
    let data = req.body;
	//console.log(nameFile + " | userinfo | req.body: "+ JSON.stringify(req.body));																			 
    //logger.info(nameFile + " | userinfo | req.body: "+ JSON.stringify(req.body));
    var mygid = 0;
    let extradata = {};
    if (data.dymtoExtraInfo != undefined && data.dymtoExtraInfo != 'undefined' && data.dymtoExtraInfo != null && data.dymtoExtraInfo != 'null') {
        extradata = JSON.parse(Buffer.from(data.dymtoExtraInfo, 'base64').toString());
        // console.log("EXTRADATA", extradata);
        logger.info("EXTRADATA"+ extradata);
        if (extradata.extrainfo == undefined)
            mygid = extradata.groupId;
        else
            mygid = extradata.extrainfo.groupId;
    }
    var objuser = {
        roles: ["app-guest"],
        id: 'guest@dymer.it',
        app_id: '',
        gid: mygid,
        email: 'guest@dymer.it',
        extrainfo: {
            companyId: 'dymer',
            groupId: '1',
            cms: 'lfr',
            userId: '0',
            emailAddress: 'guest@dymer.it',
        },
        username: 'guest@dymer.it',
    };
    let myURLref;
    try {
        myURLref = new URL(data.referer);
    } catch (error) {
        myURLref = new URL("http://" + data.referer);
    }
    //console.log(nameFile + ' | userinfo | regkey myURLref.host : ', myURLref.host);
    //console.log(nameFile + ' | userinfo | regkey myURLref.origin : ', myURLref.origin);
    let regkey = (myURLref.host == "") ? (myURLref.origin) : myURLref.host;
    if (regkey == null || regkey == 'null')
        regkey = data.referer;
    var queryFind = { host: { "$regex": regkey }, active: true };
    let requestjsonpath = data.requestjsonpath;
    let myRequestBaseHost = myURLref.protocol + "//" + myURLref.host;
    let myRequestBaseUrl = myRequestBaseHost + myURLref.pathname;
    if (!myRequestBaseUrl.includes('http'))
        myRequestBaseUrl = data.referer;
    let myRequestJsonUrl = (requestjsonpath != undefined) ? requestjsonpath.protocol + "//" + requestjsonpath.host + requestjsonpath.pathname : undefined;

    DymRule.find(queryFind).then((els) => {
        if (els.length || data.idsadm) {
            //console.log(nameFile + ' | userinfo | number of hosts, els.length: ', els.length);
            //console.log(nameFile + ' | userinfo | user is admin, data.idsadm : ', data.idsadm);
            let searchObject = els[0];
            if (els.length > 1) {
                searchObject = els.find((singoleCnf) => singoleCnf.host == myRequestBaseUrl);
                if (searchObject == undefined) {
                    if (myRequestJsonUrl) {
                        searchObject = els.find((singoleCnf) => singoleCnf.host == myRequestJsonUrl);
                    }
                    if (searchObject == undefined) {
                        searchObject = els.find((singoleCnf) => (singoleCnf.host == myRequestBaseHost || singoleCnf.host == myRequestBaseHost + "/"));
                    }
                }
            }
            // var el = els[0];
            let el = searchObject;
            //console.log(nameFile + ' | userInfo | el/searchObject ', searchObject);
            //logger.info(nameFile + ' | userInfo | el/searchObject '+ searchObject);

            let authtype = (el == undefined) ? "" : el.authtype;
            if (authtype == "jwtparent" || data.idsadm) {
                /*
                console.log(nameFile + ' | userInfo | authtype ', authtype);
                console.log(nameFile + ' | userInfo | idsadm ', data.idsadm);
                logger.info(nameFile + ' | userInfo | authtype '+ authtype);
                logger.info(nameFile + ' | userInfo | idsadm '+ data.idsadm);
                */
                var token = data.DYM;
               // console.log(nameFile + ' | userinfo | data.DYM : ', data.DYM);
                //logger.info(nameFile + ' | userinfo | data.DYM : ', data.DYM);
                if (token != undefined && token != "null" && token != null) {
                    var decoded;
                    //decoded = JSON.parse(Buffer.from(token, 'base64').toString());
                     if (util.isCrypted(token)) {
                                let dymtokenDecryptedLfr = util.decryptLfr(token);
 
                                console.log(nameFile + ' | userinfo | decrypted: ', dymtokenDecryptedLfr);
                                decoded = new Buffer(dymtokenDecryptedLfr).toString("base64");
                                 console.log(nameFile + ' | userinfo | coded in base64: ', decoded);
                     }else
                     {
                        decoded = JSON.parse(Buffer.from(token, 'base64').toString());
                     }
                    console.log(nameFile + ' | userinfo | decoded DYM: ', decoded);
                    objuser.email = decoded.email;
                    objuser.id = decoded.email;
                    if (decoded.hasOwnProperty("extrainfo")) {
                        objuser.gid = decoded.extrainfo.groupId;
                        objuser.extrainfo = {...objuser.extrainfo, ...decoded.extrainfo };
                    }
                    if (!(Object.entries(extradata).length === 0)) {
                        objuser.extrainfo = {...objuser.extrainfo, ...extradata.extrainfo };
                    }
                    objuser.extrainfo.emailAddress = decoded.email;

                    let listRoles= decoded.roles ;
                    //console.log(nameFile + ' | userinfo | listRoles: ', listRoles);
                    //logger.info(nameFile + ' | userinfo | listRoles: ', JSON.stringify(listRoles));
                    listRoles.forEach(element => {
                        let trole=""
                        if(element.hasOwnProperty("role"))
                            trole=element.role;
                        else
                            trole=element  ;
                        if(! objuser.roles.includes(trole))
                            objuser.roles.push(trole);
                    });

                    objuser.username = decoded.username;
                }
                ret.setMessages("User detail");
                ret.setData(objuser);
                //console.log(nameFile + ' | userinfo | objuser', objuser);
                return res.send(ret);
            }
            if (authtype == "oidc") {
                var urlIDM = el.prop.dymer.userInfoURL;
                var token = data.DYMAT;
                var config = {
                    method: 'get',
                    url: urlIDM,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                };
                if (token != undefined && token != "null" && token != null) {
                    axios(config)
                        .then(function(response) {
                            //console.log(response.data);
                            response.data.roles.forEach(element => {
                                objuser.roles.push(element.name);
                            });
                            //console.log(obj_isi.roles);
                            objuser.email = response.data.email;
                            objuser.id = response.data.email;
                            objuser.d_appuid = response.data.app_id;
                            objuser.username = response.data.username;

                            if (!(Object.entries(extradata).length === 0)) {
                                objuser.extrainfo = {
                                    ...objuser.extrainfo,
                                    ...extradata.extrainfo
                                };
                            }
                            objuser.extrainfo.emailAddress = response.data.email;
                            ret.setMessages("User detail");
                            ret.setData(objuser);
                            return res.send(ret);
                        })
                        .catch(function(error) {
                            console.error(error);
                            logger.error(nameFile + ' | /userinfo oidc error | updateOne : ' + error);
                            ret.setMessages("User detail");
                            ret.setData(objuser);
                            return res.send(ret);
                        });
                } else {
                    ret.setMessages("User detail");
                    ret.setData(objuser);
                    return res.send(ret);
                }
            }
            //console.log("OH no ", JSON.stringify(objuser));
        } else {
            ret.setMessages("User detail");
            ret.setData(objuser);
            return res.send(ret);
        }
    }).catch((err) => {
        if (err) {
            console.error(err);
            logger.error(nameFile + ' | /userinfo | DymRule : ' + err);
            ret.setMessages("Get error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

router.post('/', util.checkIsAdmin, function(req, res) {
    //router.post('/', function(req, res) {
    let id = req.params.id;
    let callData = util.getAllQuery(req);
    let data = callData.data;
    var ret = new jsonResponse();
    var mod = new DymRule(req.body);
    //console.log(nameFile + ' | post | create : ', JSON.stringify(req.body));
    logger.info(nameFile + ' | post | create: ' + JSON.stringify(req.body));
    mod.save().then((el) => {
        ret.setMessages("Element created successfully");
        ret.addData(el);
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error(err);
            logger.error(nameFile + ' | post | create : ' + err);
            ret.setMessages("Create error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

router.put('/:id', util.checkIsAdmin, (req, res) => {
    let id = req.params.id;
    let callData = util.getAllQuery(req);
    let data = callData.data;
    var copiaData = Object.assign({}, data);
    var ret = new jsonResponse();
    var myfilter = { "_id": mongoose.Types.ObjectId(id) };
    var myquery = {
        "$set": req.body
    };
    // console.log(nameFile + ' | put/:id | id,query : ', id, JSON.stringify(req.body));
    logger.info(nameFile + ' | put/:id | id,query : ' + id + " " + JSON.stringify(req.body));
    DymRule.updateOne(myfilter, req.body,
        function(err, raw) {
            if (err) {
                ret.setSuccess(false);
                console.error(err);
                logger.error(nameFile + ' | put/:id | id,query : ' + err);
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
    //console.log(nameFile + ' | delete/:id | id : ', id);
    logger.info(nameFile + ' | delete/:id | id : ' + id);
    DymRule.findOneAndDelete(myfilter).then((el) => {
        ret.setMessages("Element deleted");
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error(err);
            logger.error(nameFile + ' | delete/:id : ' + err);
            ret.setMessages("Delete Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});
module.exports = router;
