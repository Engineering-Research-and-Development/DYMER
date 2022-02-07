var util = require('../utility');
var jsonResponse = require('../jsonResponse');
var http = require('http');
require("../models/sessions/SessionsModel");
var express = require('express');
const bodyParser = require("body-parser");
const path = require('path');
const nameFile = path.basename(__filename);
const mongoose = require("mongoose");
require('./mongodb.js');
var router = express.Router();
var jsonParser = bodyParser.json();
const sessions = mongoose.model("SessionsModel");
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: false,
    limit: '100MB'
}));

router.get('/findByAccessToken/:accessToken', function (req, res) {

    const accessToken = req.params.accessToken;
    var ret = new jsonResponse();

    sessions.findOne({ 'session.accessToken': accessToken }).then((session) => {
        ret.setMessages("Session found");
        ret.setSuccess(true);
        ret.addData(session);

        return res.send(ret)
    }).catch((err) => {
        if (err) {
            console.error(err);
            ret.setMessages("Getting session error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });

            return res.send(ret);
        }
    });
});

module.exports = router;