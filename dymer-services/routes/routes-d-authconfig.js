var jsonResponse = require('../jsonResponse');
var util = require('../utility');
//var FormData = require('form-data');
var http = require('http');
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
    var queryFind = { host: data.referer, active: true };
    // console.log('infouse', queryFind);
    DymRule.find(queryFind).then((els) => {

        if (els.length || data.idsadm) {
            var el = els[0];
            // console.log('el', el);
            let authtype = (el == undefined) ? "" : el.authtype;
            if (authtype == "jwtparent" || data.idsadm) {
                var token = data.DYM;
                if (token != undefined && token != "null" && token != null) {
                    var decoded = JSON.parse(Buffer.from(token, 'base64').toString());
                    // console.log('decoded', decoded);
                    objuser.email = decoded.email;
                    objuser.id = decoded.email;
                    objuser.extrainfo.emailAddress = decoded.email;
                    if (decoded.hasOwnProperty("extrainfo")) {
                        objuser.gid = decoded.extrainfo.groupId;
                        //objuser.extrainfo = decoded.extrainfo;
                        objuser.extrainfo = {...decoded.extrainfo, ...objuser.extrainfo };
                    }
                    if (!(Object.entries(extradata).length === 0)) {
                        objuser.extrainfo = {...extradata, ...objuser.extrainfo };
                    }
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
                // console.log('objuser', objuser);
                return res.send(ret);
            }
            if (authtype == "oidc") {
                var urlIDM = el.prop.dymer.userInfoURL;
                var token = data.DYMAT;
                var config = {
                    method: 'get',
                    url: urlIDM,
                    headers: {
                        'Authorization': token,
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
                            objuser.extrainfo.emailAddress = response.data.email;
                            if (!(Object.entries(extradata).length === 0)) {
                                objuser.extrainfo = {...extradata, ...objuser.extrainfo };
                            }
                            ret.setMessages("User detail");
                            ret.setData(objuser);
                            return res.send(ret);
                        })
                        .catch(function(error) {
                            console.error(error);
                            var token = data.DYM;
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
                            return res.send(ret);
                        });
                } else {
                    ret.setMessages("User detail");
                    ret.setData(objuser);
                    return res.send(ret);
                }
            }
        } else {
            ret.setMessages("User detail");
            ret.setData(objuser);
            // console.log('objuser', objuser);
            return res.send(ret);
        }
    }).catch((err) => {
        if (err) {
            console.error(err);
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
    console.log(nameFile + ' | post | create : ', JSON.stringify(req.body));
    mod.save().then((el) => {
        ret.setMessages("Element created successfully");
        ret.addData(el);
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error(err);
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
    console.log(nameFile + ' | put/:id | id,query : ', id, JSON.stringify(req.body));
    DymRule.updateOne(myfilter, req.body,
        function(err, raw) {
            if (err) {
                ret.setSuccess(false);
                console.error(err);
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
    console.log(nameFile + ' | delete/:id | id : ', id);
    DymRule.findOneAndDelete(myfilter).then((el) => {
        ret.setMessages("Element deleted");
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error(err);
            ret.setMessages("Delete Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});
module.exports = router;