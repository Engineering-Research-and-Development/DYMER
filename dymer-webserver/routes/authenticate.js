 var util = require('../utility');
//Marco var dymerOauth = require('./dymerOauth');
var jsonResponse = require('../jsonResponse');
var express = require('express');
var router = express.Router();
//var elasticsearch = require('elasticsearch');
const multer = require('multer');
const bodyParser = require("body-parser");
const path = require('path');
//const mongoose = require("mongoose");
//var extend = require('extend');
//var router = express.Router();
//var GridFsStorage = require("multer-gridfs-storage");
const axios = require('axios');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.post('/authenticate',async function (req, res) {
    console.log("dymer-webserver | authenticate.js | /authenticate");
    var username = req.body.username;
    var password = req.body.password;
    
    var _username = global.configService['adminUser'];
    var _password = global.configService['adminPass'];
   // var _users = global.configService['users'] || [];
    var url_dservice = util.getServiceUrl("dservice") + '/api/v1/duser/checklogin'; // Get micro-service endpoint
    
    //console.log("==>url_dservice ", url_dservice);

    /*  let listuser= await axios.get(url_dservice, {  }) 
      _users=listuser.data.data;*/
    
   // console.log("listuser",listuser.data);
   // console.log(_users);
    var loggedUser = {
        isGravatarEnabled: false,
        authorization_decision: '',
        roles: undefined,
        app_azf_domain: '',
        id: '',
        gid: 0,
        app_id: 'dymer',
        email: '',
        username: ''
    };
   // user = _users.find(usr => usr.email === username && usr.password === password );
   // if ((!user) && (username !== _username || password !== _password)) {
    
    if (username === _username && password === _password) {
        loggedUser.roles = [{ role: 'app-admin' }]
        loggedUser.id = 'admin@dymer.it'
        loggedUser.email = 'admin@dymer.it'
        loggedUser.username = 'admin@dymer.it'

    }else{
        let checklogin = await axios.post(url_dservice, { "email": username,"password":password })
        if(checklogin.data.data.length ==0){
            console.error('Error: Wrong login');
            res.status(401);
            res.send('Wrong login');
            return;
        }else{
            user=checklogin.data.data[0]
            loggedUser.roles = user.roles
            loggedUser.id = user.email
            loggedUser.email = user.email
            loggedUser.username = user.username
        }
    }
    var obj_isi = {};
    obj_isi.roles = loggedUser.roles;
    let base64DYM = new Buffer(JSON.stringify(loggedUser)).toString("base64")
    let base64DYMisi = new Buffer(JSON.stringify(obj_isi)).toString("base64")
    let dr_value = new Buffer(JSON.stringify(obj_isi.roles)).toString("base64");
    var url_dservice = util.getServiceUrl("dservice") + '/api/v1/perm/permbyroles'; // Get micro-service endpoint
   console.log(' loggedUser.roles', loggedUser.roles);
   let lsrole=[]
   loggedUser.roles.forEach(element => {
    lsrole.push(element.role)
});
    let response_perm = await axios.get(url_dservice, { params: { role: lsrole } })
    //console.log('response_perm', response_perm.data);
   
    let listprm_value= new Buffer(JSON.stringify( response_perm.data.data)).toString("base64");
  
    var objtoSend = { "DYM": base64DYM, "DYMisi": base64DYMisi, "d_rl": dr_value,"user": loggedUser,"d_lp":listprm_value }
    
    res.send(objtoSend);
    return;
});
/*
router.post('/authenticate', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var _username = global.configService['adminUser'];
    var _password = global.configService['adminPass'];
    //console.log('_username', _username, username);
    // console.log('_username', username);
   // if (_username == undefined || _password == undefined) {
  //       _username = "admin";
  //       _password = "dymer";

  //   }
  //   console.log('_username', username == _username);
 //    console.log('_password', password == _username);
    if (username == _username && password == _password) {
        res.sendStatus(200);
    } else {
        console.error('Error:Wrong login');
        //  res.cookie("testlg");
        res.status(401);
        res.send('Wrong login');
    }
});
*/
module.exports = router;