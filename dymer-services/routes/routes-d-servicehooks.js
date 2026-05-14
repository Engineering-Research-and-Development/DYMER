var util = require('../utility');
var jsonResponse = require('../jsonResponse');
require("../models/ServiceEntityHooks");
var express = require('express');
//const multer = require('multer');
const bodyParser = require("body-parser");
const path = require('path');
const nameFile = path.basename(__filename);
const logger = require('./dymerlogger');
const mongoose = require("mongoose");
require('./mongodb.js');
var router = express.Router();
var jsonParser = bodyParser.json();
//var GridFsStorage = require("multer-gridfs-storage");
const HookModel = mongoose.model("ServiceEntityHooks");
const axios = require('axios');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: false,
    limit: '100MB'
}));
//   /api/v1/opn/
/*
const mongoURI = util.mongoUrlForm();
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
router.post('/addhook', util.checkIsAdmin, function(req, res) {
    let callData = util.getAllQuery(req);
    let data = callData.data;
    var ret = new jsonResponse();
    var newObj = {
        _index: data.op_index,
        _type: data.op_index,
        microserviceType: data.op_microserviceType,
        eventType: data.op_eventType,
        service: data.op_service,
        
        webhookUrl: data.op_webhookUrl,
        httpMethod: data.op_httpMethod || "POST",
        headers: data.op_headers || {},
        payloadTemplate: data.op_payloadTemplate || "",
        isActive: typeof data.op_isActive === 'boolean' ? data.op_isActive : true
    }
    var mod = new HookModel(data);
    mod.save().then((el) => {
        ret.setMessages("Hook set successfully");
        ret.addData(el);
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | post/addhook | save :", err);
            logger.error(nameFile + ' | post/addhook | save : ' + err);
            ret.setMessages("Post error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});
router.get('/hooks/', (req, res) => {
    let callData = util.getAllQuery(req);
    let queryFind = callData.query;
    return findHook(queryFind, res);
});

function findHook(queryFind, res) {
    var ret = new jsonResponse();
    HookModel.find(queryFind).then((els) => {
        ret.setMessages("List");
        ret.setData(els);
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | findHook :", err);
            logger.error(nameFile + ' | findHook : ' + err);
            ret.setMessages("Get error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
}
router.delete('/hook/:id', util.checkIsAdmin, (req, res) => {
    var ret = new jsonResponse();
    var id = req.params.id;
    var myfilter = { "_id": id };
    HookModel.findOneAndDelete(myfilter).then((el) => {
        ret.setMessages("Element deleted");
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | delete/hook/:id | id :", id, err);
            logger.error(nameFile + " | delete/hook/:id | id :" + id + " , " + err);
            ret.setMessages("Delete Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

router.post('/checkhook', async function(req, res) {
    console.log("routes-d-servicehooks.js | checkhook");
    
    let callData = util.getAllQuery(req);
    let data = callData.data;
    let extraInfo = callData.extraInfo;
    let origindata = callData.origindata;
    let originheader = callData.originheader; 
    var queryFind = {};
    var eventSource = data.eventSource;

    
    var queryFind = {
        "_index": data.obj._index,
       // "_type": data.obj._index, //VL
        "eventType": eventSource,
         "isActive": true
    };
    var wbsUrl = util.getServiceUrl('webserver');
    let contp = util.getContextPath('webserver');
    if (contp != "")
        wbsUrl += contp;
    //wbsUrl = util.getServiceUrl('dservice');
    console.log(nameFile + ' | post/checkhook :' + JSON.stringify(queryFind));
    logger.info(nameFile + ' | post/checkhook :' + JSON.stringify(queryFind));

    const headers = {
        'reqfrom': req.headers["reqfrom"]
    }
    // HookModel.find(queryFind).then((els) => {
    //     els.forEach(el => {
            
    //         console.log(nameFile + ' | post/checkhook | HookModel: chek el' + JSON.stringify(el));
    //         logger.info(nameFile + ' | post/checkhook | HookModel: chek el' + JSON.stringify(el));
    //         var pt = wbsUrl + el.service.servicePath;
           
    //         console.log("==>checkhook pt ", pt);
    //         axios.post(pt, { 'data': data, "extraInfo": extraInfo,"origindata":origindata, "originheader":  originheader }, {
    //                 headers: headers
    //             }).then(response => {
    //                 console.log(nameFile + " | post/checkhook | inoltro | response :", response);
    //                 logger.info(nameFile + '| post/checkhook | inoltro | response ' + response);
    //             })
    //             .catch(error => {
    //                 console.log("ERROR | " + nameFile + " | post/checkhook | pt,data, extraInfo :", pt, data, extraInfo, error);
    //                 logger.error(nameFile + ' | post/checkhook | pt,data, extraInfo : ' + pt + " , " + JSON.stringify(data) + " , " + JSON.stringify(extraInfo) + " , " + error);
    //             });
    //     });
    // }).catch((err) => {
    //     if (err) {
    //         console.error("ERROR | " + nameFile + " | find | queryFind :", JSON.stringify(queryFind), err);
    //         logger.error(nameFile + '  | find | queryFind : ' + JSON.stringify(queryFind) + " , " + error);
    //     }
    // })
    try {
        const activeHooks = await HookModel.find(queryFind);

        if (activeHooks.length === 0) {
            logger.info(nameFile + ` | No active webhooks found for index '${entityIndex}' and event '${eventType}'.`);
            return res.status(200).send({ message: "No active webhooks found." });
        }

        for (const hook of activeHooks) {

                if (hook.expertMode) {
                            logger.info(nameFile + ` | Invoking webhook ${hook._id} because it's in expert mode.`);

                                let payload = data; // Default payload is the full entity data
                                let requestHeaders = { ...hook.headers }; // Copy custom headers

                            // If a payload template is defined, render it
                            if (hook.payloadTemplate) {
                                try {
                                    const template = Handlebars.compile(hook.payloadTemplate);
                                    payload = JSON.parse(template(data)); // Render with entity data
                                } catch (templateErr) {
                                    logger.error(nameFile + ` | Error rendering payload template for hook ${hook._id}:`, templateErr);
                                    continue; // Skip this hook if template rendering fails
                                }
                            }

                        // Ensure Content-Type header is set for POST/PUT requests if not already specified
                        if ((hook.httpMethod === "POST" || hook.httpMethod === "PUT" ) && !requestHeaders["Content-Type"]) {
                            requestHeaders["Content-Type"] = "application/json";
                        }

                        console.log(`==> Invoking webhook: ${hook.webhookUrl} with method ${hook.httpMethod}` );
                        logger.info(`Invoking webhook: ${hook.webhookUrl} with method ${hook.httpMethod}` );

                        try {
                            const response = await axios({
                                method: hook.httpMethod.toLowerCase( ),
                                url: hook.webhookUrl,
                                headers: requestHeaders,
                                data: payload // For POST/PUT, data is the body
                            });
                            logger.info(`Webhook ${hook._id} invoked successfully. Status: ${response.status}`);
                        } catch (error) {
                            logger.error(`ERROR | Webhook ${hook._id} invocation failed for ${hook.webhookUrl}:`, error.message);
                            // Log full error response if available
                            if (error.response) {
                                logger.error(`Webhook error response data:`, error.response.data);
                                logger.error(`Webhook error response status:`, error.response.status);
                                logger.error(`Webhook error response headers:`, error.response.headers);
                            } else if (error.request) {
                                logger.error(`Webhook error request: No response received.`);
                            } else {
                                logger.error(`Webhook error:`, error.message);
                            }
                        }
             } else {
                logger.info(nameFile + ` | Skipping webhook ${hook._id} because it's not in expert mode.`);


                    try {                    
                        
                                console.log(nameFile + ' | post/checkhook | HookModel: chek el' + JSON.stringify(hook));
                                logger.info(nameFile + ' | post/checkhook | HookModel: chek el' + JSON.stringify(hook));
                                var pt = wbsUrl + hook.service.servicePath;

                                console.log("==>checkhook pt ", pt);
                                axios.post(pt, { 'data': data, "extraInfo": extraInfo,"origindata":origindata, "originheader":  originheader }, {
                                        headers: headers
                                    }).then(response => {
                                        console.log(nameFile + " | post/checkhook | inoltro | response :", response);
                                        logger.info(nameFile + '| post/checkhook | inoltro | response ' + response);
                                    })
                                    .catch(error => {
                                        console.log("ERROR | " + nameFile + " | post/checkhook | pt,data, extraInfo :", pt, data, extraInfo, error);
                                        logger.error(nameFile + ' | post/checkhook | pt,data, extraInfo : ' + pt + " , " + JSON.stringify(data) + " , " + JSON.stringify(extraInfo) + " , " + error);
                                    });
                                logger.info(`Webhook ${hook._id} invoked successfully. Status: ${response.status}`);
                    } catch (error) {
                        logger.error(`ERROR | Webhook ${hook._id} invocation failed for ${hook.webhookUrl}:`, error.message);
                        // Log full error response if available
                        if (error.response) {
                            logger.error(`Webhook error response data:`, error.response.data);
                            logger.error(`Webhook error response status:`, error.response.status);
                            logger.error(`Webhook error response headers:`, error.response.headers);
                        } else if (error.request) {
                            logger.error(`Webhook error request: No response received.`);
                        } else {
                            logger.error(`Webhook error:`, error.message);
                        }   
                 }

        }
        return res.status(200).send({ message: "Webhook checks completed." });

    }
    } catch (err) {
        logger.error(nameFile + ` | Error in /checkhook processing:`, err);
        return res.status(500).send({ message: "Internal server error during webhook check." });
    }
});
module.exports = router;