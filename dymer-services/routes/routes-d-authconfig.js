var jsonResponse = require('../jsonResponse');
var util = require('../utility');
//var FormData = require('form-data');
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
/*
const mongoURI = util.mongoUrlForm();
console.log(nameFile + ' | mongoURI :', JSON.stringify(mongoURI));
var db;
mongoose
    .connect(mongoURI, {
        // useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(x => {
        console.log(nameFile + ` | Connected to Mongo! Database name: "${x.connections[0].name}"`);
        db = x.connections[0].db;
    })
    .catch(err => {
        console.error("ERROR | " + nameFile + ` | Error connecting to mongo! Database name: "${x.connections[0].name}"`, err);
    });
*/
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
    var ret = new jsonResponse();
    let data = req.body;;
    var mygid = 0;
    let extradata = {};
    if (data.dymtoExtraInfo != undefined && data.dymtoExtraInfo != 'undefined' && data.dymtoExtraInfo != null && data.dymtoExtraInfo != 'null') {
        extradata = JSON.parse(Buffer.from(data.dymtoExtraInfo, 'base64').toString());
        // console.log("EXTRADATA", extradata);
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
    let myURLref = new URL(data.referer);
    //console.log('myURLref', myURLref);
    //console.log('data.referer|origin|host', "1" + data.referer, "2" + myURLref.origin, "3" + myURLref.host, data.idsadm);

    let regkey = (myURLref.host == "") ? (myURLref.origin) : myURLref.host;
    if (regkey == null || regkey == 'null')
        regkey = data.referer;
    var queryFind = { host: { "$regex": regkey }, active: true };
    let requestjsonpath = data.requestjsonpath;
    //console.log('myURL requestjsonpath', requestjsonpath);
    //console.log('myURL myURLref', myURLref);
    let myRequestBaseHost = myURLref.protocol + "//" + myURLref.host;
    let myRequestBaseUrl = myRequestBaseHost + myURLref.pathname;
    if (!myRequestBaseUrl.includes('http'))
        myRequestBaseUrl = data.referer;
    let myRequestJsonUrl = (requestjsonpath != undefined) ? requestjsonpath.protocol + "//" + requestjsonpath.host + requestjsonpath.pathname : undefined;
    /*console.log('myURL protocol', myURLref.protocol);
    console.log('myURL host', myURLref.host);
    console.log('myURL href ', myURLref.href);
    console.log('myURL pathname ', myURLref.pathname);
    console.log('myURL search ', myURLref.search);
    console.log('queryFind ', queryFind);
    console.log('myRequestBaseUrl ', myRequestBaseUrl); 
    console.log('myRequestBaseHost ', myRequestBaseHost);*/
    //console.log('queryFind', queryFind);
    DymRule.find(queryFind).then((els) => {
        // console.log('DymRules', els);

        if (els.length || data.idsadm) {
            let searchObject = els[0];
            if (els.length > 1) {
                //console.log('myRequestBaseUrl', myRequestBaseUrl);
                searchObject = els.find((singoleCnf) => singoleCnf.host == myRequestBaseUrl);
                if (searchObject == undefined) {
                    if (myRequestJsonUrl) {
                        //console.log('myRequestJsonUrl', myRequestBaseUrl);
                        searchObject = els.find((singoleCnf) => singoleCnf.host == myRequestJsonUrl);
                    }
                    if (searchObject == undefined) {
                        //console.log('myRequestBaseHost', myRequestBaseHost);
                        searchObject = els.find((singoleCnf) => (singoleCnf.host == myRequestBaseHost || singoleCnf.host == myRequestBaseHost + "/"));
                    }
                }
            }
            // var el = els[0];
            let el = searchObject;
            //console.log('DymRule searchObject', searchObject);
            //console.log('data.idsadm', data.idsadm);
            let authtype = (el == undefined) ? "" : el.authtype;
            if (authtype == "jwtparent" || data.idsadm) {
                var token = data.DYM;
                if (token != undefined && token != "null" && token != null) {
                    var decoded;
                    // console.log("aaaaaaaaaaaa", token, el)
                    //  console.log("aaaaaaaaaaaa1", (el && el.prop !== undefined && el.prop.secretkey !== undefined && el.prop.secretkey != ""))
                    if (el && el.prop !== undefined && el.prop.secretkey !== undefined && el.prop.secretkey != "") {
                        // decryption
                        //console.log({ token, secret: el.prop.secretkey })
                        try {
                            token = token.replace(/\s/g, "+")
                            let hash = crypto.createHash('sha1')
                            let originalKey = el.prop.secretkey;

                            let digest = hash.update(originalKey).digest().subarray(0, 16)

                            let cc = crypto.createDecipheriv('aes-128-ecb', digest, null);

                            decoded = JSON.parse(Buffer.concat([cc.update(token, 'base64'), cc.final()]).toString())
                        } catch (error) {
                            //console.log(data)
                            throw new Error("unable to decrypt token jwtparent")
                        }
                    } else {
                        decoded = JSON.parse(Buffer.from(token, 'base64').toString());
                    }
                    //console.log('decoded', decoded);



                    //var decoded = JSON.parse(Buffer.from(token, 'base64').toString());
                    // console.log('decoded', decoded);
                    objuser.email = decoded.email;
                    objuser.id = decoded.email;
                    if (decoded.hasOwnProperty("extrainfo")) {
                        objuser.gid = decoded.extrainfo.groupId;
                        //objuser.extrainfo = decoded.extrainfo;
                        objuser.extrainfo = {...objuser.extrainfo, ...decoded.extrainfo };
                    }
                    if (!(Object.entries(extradata).length === 0)) {
                        objuser.extrainfo = {...objuser.extrainfo, ...extradata.extrainfo };
                    }
                    objuser.extrainfo.emailAddress = decoded.email;
                    //urs_gid = decoded.extrainfo.groupId;
                    // if (decoded.extrainfo != undefined)
                    //  objuser.extrainfo = decoded.extrainfo;
                    decoded.roles.forEach(element => {
                        objuser.roles.push(element.role);
                    });
                    objuser.username = decoded.username;
                }
                ret.setMessages("User detail");
                ret.setData(objuser);
                //console.log('objuser', objuser);
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
                            // console.log(obj_isi.roles);
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
                            /* var token = data.DYM;
                             var decoded = JSON.parse(Buffer.from(token, 'base64').toString());
                             objuser.email = decoded.email;
                             objuser.id = decoded.email;
                             //urs_gid = decoded.extrainfo.groupId;
                             objuser.extrainfo.emailAddress = decoded.email;
                             objuser.extrainfo = decoded.extrainfo;
                             decoded.roles.forEach(element => {
                                 objuser.roles.push(element.role);
                             });
                             objuser.username = decoded.username;
                             ret.setMessages("User detail");
                             ret.setData(objuser);
                             return res.send(ret);*/
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
            console.log("OH no ", JSON.stringify(objuser));
        } else {
            ret.setMessages("User detail");
            ret.setData(objuser);
            // console.log('objuser', objuser);
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
    logger.info(nameFile + ' | post | create : ' + JSON.stringify(req.body));
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