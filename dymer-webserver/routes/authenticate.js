//var util = require('../utility');
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


router.post('/authenticate', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var _username = global.configService['adminUser'];
    var _password = global.configService['adminPass'];
    //console.log('_username', _username, username);
    // console.log('_username', username);
    /* if (_username == undefined || _password == undefined) {
         _username = "admin";
         _password = "dymer";

     }
     console.log('_username', username == _username);
     console.log('_password', password == _username);*/
    if (username == _username && password == _password) {
        res.sendStatus(200);
    } else {
        console.error('Error:Wrong login');
        //  res.cookie("testlg");
        res.status(401);
        res.send('Wrong login');
    }
});

module.exports = router;