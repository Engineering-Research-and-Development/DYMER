var util = require('../utility');
var jsonResponse = require('../jsonResponse');
var fs = require('fs');
//var mv = require('mv');
var express = require('express');
const bodyParser = require("body-parser");
const path = require('path');
var router = express.Router();
const nameFile = path.basename(__filename);
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
const logger = require('./dymerlogger');
const axios = require('axios')

router.get('/logtypes', async (req, res) => {

    let ret = new jsonResponse();
    let loggerdebug = (process.env.DYMER_LOGGER == undefined) ? false : process.env.DYMER_LOGGER;
    let msglog = "file";
    if (loggerdebug)
        msglog = "file&console";
    ret.setMessages("Logs");
    ret.setData({ msg: msglog, consoleactive: loggerdebug});
    res.status(200);
    ret.setSuccess(true);
    return res.send(ret);
});

router.post('/setlogConfig', [util.checkIsDymerUser], async (req, res) => {
    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let data = callData.data;
    process.env.DYMER_LOGGER = data.consoleactive;    
    logger.info(nameFile + '  | setlogConfig :' + data.consoleactive);

    let state = await axios.patch('http://localhost:8080/api/entities/api/v1/entity/redistoggle', {state: data.redisactive})
    console.log("STATE:", state)
   // ret.setMessages("Log settings updated");
    ret.setMessages("Settings updated");
    ret.setData({ consoleactive: process.env.DYMER_LOGGER, redisactive: state.data.data });
    console.log('setlogConfig', process.env.DYMER_LOGGER);
    return res.send(ret);
});

/*
router.post('/', util.checkIsAdmin, function(req, res) {
    var ret = new jsonResponse();
    upload(req, res, function(err) {
        if (err) {
            console.error("ERROR | " + nameFile + ' | post | upload  : ', err);
            logger.error(nameFile + ' | post | upload  : ' + err);
            ret.setMessages("Upload Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
        let callData = util.getAllQuery(req);
        let data = callData.data;
        let files_arr = [];
        req.files.forEach(element => {
            files_arr.push(element.id);
        });
        var newObj = {
            title: data.title,
            author: data.author,
            description: data.description,
            posturl: data.posturl,
            instance: data.instance,
            files: files_arr
        }
        var mod = new Model(newObj);
        mod.save().then((el) => {
            //console.log(nameFile + ' | post |  saved successfully :', JSON.stringify(newObj));
            logger.info(nameFile + ' | post |  saved successfully :' + JSON.stringify(newObj));
            ret.setMessages("Model uploaded successfully");
           
            let queryFind = { '_id': mongoose.Types.ObjectId(el._id) };
            //let queryFind = (Object.keys(callData.query).length === 0) ? {} : JSON.parse(callData.query);
            //let queryFind = (Object.keys(callData.query).length === 0) ? {} : callData.query;
            Model.find(queryFind).then((Models) => {
                var actions = Models.map(getfilesArrays);
                var results = Promise.all(actions); // pass array of promises
                results.then(function(dat) {
                    ret.setMessages("List");
                    ret.setData(dat);
                    return res.send(ret);
                })
            });
        }).catch((err) => {
            if (err) {
                console.error("ERROR | " + nameFile + ' | post | save  : ', err);
                logger.error(nameFile + ' | post | save  :' + err);
                ret.setMessages("Post error");
                ret.setSuccess(false);
                ret.setExtraData({ "log": err.stack });
                return res.send(ret);
            }
        })
    });
});
 */
module.exports = router;