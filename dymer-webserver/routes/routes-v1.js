var util = require('../utility');
var jsonResponse = require('../jsonResponse');
var fs = require('fs');
//var mv = require('mv');
var express = require('express');
const bodyParser = require("body-parser");
const path = require('path');
var router = express.Router();
const nameFile = path.basename(__filename);
const axios = require('axios');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
const logger = require('./dymerlogger');
const { Console } = require('console');

router.get('/logtypes', async(req, res) => {

    let ret = new jsonResponse();
    let loggerdebug_webserver = global.loggerdebug; // (process.env.DYMER_LOGGER == undefined) ? false : process.env.DYMER_LOGGER;
    let msglog = "file";

    let url_entity = util.getServiceUrl("entity") + "/logtypes";
    let logsType_entity = (await axios.get(url_entity))
    let loggerdebug_entity = logsType_entity.data.data.consolelog;
    let redisactive_entity = logsType_entity.data.data.redisactive;

    let url_template = util.getServiceUrl("template") + "/logtypes";
    let loggerdebug_template = (await axios.get(url_template)).data.data.consolelog;
    let url_form = util.getServiceUrl("form") + "/logtypes";
    let loggerdebug_form = (await axios.get(url_form)).data.data.consolelog;
    let url_service = util.getServiceUrl("dservice") + "/logtypes";
    let loggerdebug_service = (await axios.get(url_service)).data.data.consolelog;
    if (loggerdebug_webserver || loggerdebug_entity || loggerdebug_template || loggerdebug_form || loggerdebug_service)
        msglog = "file&console";
    ret.setMessages("Logs");
    ret.setData({
        msg: msglog,
        consoleactive: { webserver: loggerdebug_webserver, entity: loggerdebug_entity, template: loggerdebug_template, form: loggerdebug_form, service: loggerdebug_service },
        redisactive: {entity: redisactive_entity}  
    });
    res.status(200);
    ret.setSuccess(true);
    return res.send(ret);
});

router.post('/setlogConfig', [util.checkIsDymerUser], async(req, res) => {
    var ret = new jsonResponse();
    try {
        
    
    let callData = util.getAllQuery(req);
    let data = callData.data;
    //global.loggerdebug = data.consoleactive;
    // console.log('data.consoleactiv', data.consoleactive);
    logger.info(nameFile + '  | setlogConfig :' + data.consoleactive.webserver);
    logger.ts_infologger(data.consoleactive.webserver);
    let url_entity = util.getServiceUrl("entity") + "/setlogconfig";
    let loggerdebug_entity = await axios.post(url_entity, { consoleactive: data.consoleactive.entity })

    //console.log('loggerdebug_from_entity', loggerdebug_entity.data.data.consoleactive);
    let url_template = util.getServiceUrl("template") + "/setlogconfig";
    let loggerdebug_template = await axios.post(url_template, { consoleactive: data.consoleactive.template })
    let url_form = util.getServiceUrl("form") + "/setlogconfig";
    let loggerdebug_form = await axios.post(url_form, { consoleactive: data.consoleactive.form })
    let url_service = util.getServiceUrl("dservice") + "/setlogconfig";
    let loggerdebug_service = await axios.post(url_service, { consoleactive: data.consoleactive.service })

    var url = util.getServiceUrl("entity") + "/api/v1/entity/redistoggle";
    let state = await axios.patch(url, { state: data.redisactive.entity })
        // ret.setMessages("Log settings updated");
    ret.setMessages("Settings updated");
    ret.setData({ consoleactive: { webserver: data.consoleactive.webserver, entity: loggerdebug_entity.data.data.consoleactive, template: loggerdebug_template.data.data.consoleactive, form: loggerdebug_form.data.data.consoleactive, service: loggerdebug_service.data.data.consoleactive }, redisactive: { entity: state.data.data }});    //console.log('ret.setData', ret.data);
} catch (error) {
    ret.setSuccess(false)
    ret.setMessages("Error");
}
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