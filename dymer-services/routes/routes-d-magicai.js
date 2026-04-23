const util = require('../utility');
const jsonResponse = require('../jsonResponse');
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const express = require("express");
const path = require("path");
const logger = require('./dymerlogger');

require("../models/magicAI/message.js");
const messageModel = mongoose.model("messageModel");

const nameFile = path.basename(__filename);
let router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: false,
    limit: '100MB'
}));

router.post("/save-message", async function (req, res) {
    let ret = new jsonResponse();
    const dymeruser = util.getDymerUser(req, res);
    const data = util.getAllQuery(req);

    if (!data.message || !data.streamId) {
        ret.setSuccess(false);
        ret.setMessages("Missing message or streamId.");
        return res.status(400).send(ret);
    }

    try {
        const newMessage = new messageModel({
            email: dymeruser.email,
            roles: dymeruser.roles,
            ip: req.ip,
            streamId: data.streamId,
            message: data.message,
            timestamps: [new Date().toISOString()]
        });

        const savedMessage = await newMessage.save();
        ret.setSuccess(true);
        ret.setMessages("Message saved successfully.");
        ret.addData(savedMessage);
        return res.status(201).send(ret);
    } catch (err) {
        logger.error(`${nameFile} | /save-message | Error saving message: ${err}`);
        ret.setSuccess(false);
        ret.setMessages("Error saving message.");
        ret.setExtraData({ "log": err.stack });
        return res.status(500).send(ret);
    }
});

router.get("/get-streams", util.checkIsDymerUser, async function (req, res) {
    let ret = new jsonResponse();
    const dymeruser = util.getDymerUser(req, res);
    if (!dymeruser || !dymeruser.email) {
        ret.setSuccess(false);
        ret.setMessages("User not authenticated or email not found.");
        return res.status(401).send(ret);
    }
    try {
        const streams = await messageModel.aggregate([
            { $match: { email: dymeruser.email } }, 
            { $unwind: "$timestamps" },
            { $group: { // Raggruppa per streamId
                _id: "$streamId", 
                latest_timestamp: { $max: "$timestamps" } 
            }},
            { $sort: { latest_timestamp: -1 } } // Ordina gli stream dal più recente al più vecchio
        ]);

        ret.setSuccess(true);
        ret.setMessages("Streams retrieved successfully.");
        ret.setData(streams.map(s => s._id));
        return res.status(200).send(ret);
    } catch (err) {
        logger.error(`${nameFile} | /get-streams | Error retrieving streams: ${err}`);
        ret.setSuccess(false);
        ret.setMessages("Error retrieving streams.");
        ret.setExtraData({ "log": err.stack });
        return res.status(500).send(ret);
    }
});

router.get("/get-messages/:streamId", util.checkIsDymerUser, async function (req, res) {
    let ret = new jsonResponse();
    const { streamId } = req.params;
    const dymeruser = util.getDymerUser(req, res);
    if (!dymeruser || !dymeruser.email) {
        ret.setSuccess(false);
        ret.setMessages("User not authenticated or email not found.");
        return res.status(401).send(ret);
    }

    try {
        const messages = await messageModel.find({ streamId: streamId, email: dymeruser.email }).sort({ _id: 1 });
        ret.setSuccess(true);
        ret.setMessages("Messages retrieved successfully.");
        ret.setData(messages);
        return res.status(200).send(ret);
    } catch (err) {
        logger.error(`${nameFile} | /get-messages | Error retrieving messages: ${err}`);
        ret.setSuccess(false);
        ret.setMessages("Error retrieving messages.");
        ret.setExtraData({ "log": err.stack });
        return res.status(500).send(ret);
    }
});

router.post("/delete-all-messages", util.checkIsDymerUser, async function (req, res) {
    let ret = new jsonResponse();
    const dymeruser = util.getDymerUser(req, res);
    const { confirm } = req.body;

    if (!dymeruser || !dymeruser.email) {
        ret.setSuccess(false);
        ret.setMessages("User not authenticated or email not found.");
        return res.status(401).send(ret);
    }

    if (confirm !== true) {
        ret.setSuccess(false);
        ret.setMessages("Confirmation is required to delete all messages.");
        return res.status(400).send(ret);
    }

    try {
        await messageModel.deleteMany({ email: dymeruser.email });
        ret.setSuccess(true);
        ret.setMessages("All messages have been deleted.");
        return res.status(200).send(ret);
    } catch (err) {
        logger.error(`${nameFile} | /delete-all-messages | Error deleting messages: ${err}`);
        ret.setSuccess(false);
        ret.setMessages("Error deleting messages.");
        ret.setExtraData({ "log": err.stack });
        return res.status(500).send(ret);
    }
});

router.delete("/delete-stream/:streamId", util.checkIsDymerUser, async function (req, res) {
    let ret = new jsonResponse();
    const { streamId } = req.params;
    const dymeruser = util.getDymerUser(req, res);

    if (!dymeruser || !dymeruser.email) {
        ret.setSuccess(false);
        ret.setMessages("User not authenticated or email not found.");
        return res.status(401).send(ret);
    }

    if (!streamId) {
        ret.setSuccess(false);
        ret.setMessages("streamId is required to delete a stream.");
        return res.status(400).send(ret);
    }

    try {
        await messageModel.deleteMany({ streamId: streamId, email: dymeruser.email });
        ret.setSuccess(true);
        ret.setMessages("Stream deleted successfully.");
        return res.status(200).send(ret);
    } catch (err) {
        logger.error(`${nameFile} | /delete-stream | Error deleting stream: ${err}`);
        ret.setSuccess(false);
        ret.setMessages("Error deleting stream.");
        ret.setExtraData({ "log": err.stack });
        return res.status(500).send(ret);
    }
});

module.exports = router;