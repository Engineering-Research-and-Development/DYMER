let jsonResponse = require('../jsonResponse');
const logger = require('./dymerlogger');
require("../models/statsModel")
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const express = require("express");
const util = require("../utility");
const path = require("path");
const statsModel = mongoose.model("statsModel");
const nameFile = path.basename(__filename);
let router = express.Router();
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: false,
    limit: '100MB'
}));

router.post("/savestats", async function (req, res) {
    let ret = new jsonResponse();
    let dymeruser = JSON.parse(Buffer.from(req.headers.dymeruser, 'base64').toString('utf-8'));
    let admin = false;
    dymeruser.roles.forEach(function (value) {
        admin = dymeruser.roles.some(value => value === 'app-admin');
    });
    /*Partecipa all'incremento delle visualizzazioni l'utente NON admin*/
    if (!admin) {
        let data = util.getAllQuery(req);
        try {
            let existingDoc = await statsModel.findOne({resourceId: data.resourceId, email: dymeruser.email});
            if (existingDoc) {
                existingDoc.timestamps.push(Date.now());

                ret.setSuccess(true)
                ret.setMessages("Statistics updated successfully")
                ret.addData(await existingDoc.save());

                console.log("savestats - Statistics updated successfully ===> ", ret);
                return res.status(201).send(ret);
            } else {
                data.ip = req.ip;
                data.timestamps = [Date.now()];
                data.roles = dymeruser.roles;
                let newObj = new statsModel(data);
                newObj.email = dymeruser.email;
                console.log("savestats - newObj ===> ", newObj);

                ret.setSuccess(true)
                ret.setMessages("New statistics saved successfully")
                ret.addData(await newObj.save());

                console.log("savestats - New statistics saved successfully ===> ", ret);
                return res.status(201).send(ret);
            }
        } catch (err) {
            console.error("ERROR | " + nameFile + " | post/saveStats | save :", err);
            logger.error(nameFile + ' | post/saveStats | save : ' + err);

            ret.setMessages("Post error");
            ret.setSuccess(false);
            ret.setExtraData({"log": err.stack});

            return res.send(ret);
        }
    }
    return res.send(ret);
});

router.get("/getstats/:enttype?", async function (req, res) {
    let ret = new jsonResponse();
    const filter = req.query;
    
    let enttype = req.params.enttype ? req.params.enttype : "";
    const hdymeruser = req.headers.dymeruser;
    const dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
 
     logger.info(nameFile + '|_search| dymeruser :' + JSON.stringify(dymeruser));

     
    try {
        const query = { "type": enttype };
        const options = {
              sort: { "timestamps": -1 },
              projection: { _id: 0 },
           };


        let docs = await statsModel.find(query)
        //const documents = await statsModel.find(filter);

        ret.setSuccess(true)
        ret.setMessages("Entities retrived")
        ret.addData(docs)

        return res.status(200).send(ret)

    } catch (error) {
        console.error("ERROR | " + nameFile + " | get/getLikes | get :", error);
        logger.error(nameFile + ' | get/getLikes | get : ' + error);

        ret.setMessages("Get error");
        ret.setSuccess(false);
        ret.setExtraData({"log": error.stack});

        return res.send(ret);
    }
})


router.get("/getallstats", async function (req, res) {
    let ret = new jsonResponse();
    const filter = req.query;
    try {
        const documents = await statsModel.find(filter);
        ret.setSuccess(true)
        ret.setMessages("Entities retrived")
        ret.addData(documents)
        return res.status(200).send(ret)
    } catch (error) {
        console.error("ERROR | " + nameFile + " | get/getLikes | get :", err);
        logger.error(nameFile + ' | get/getLikes | get : ' + err);
        ret.setMessages("Get error");
        ret.setSuccess(false);
        ret.setExtraData({"log": err.stack});
        return res.send(ret);
    }
})

router.delete("/deletestats/:id", async function (req, res) {
    const id = req.params.id;

    let ret = new jsonResponse();

    try {
        if (id === "all") {
            await statsModel.deleteMany({});
        } else {
            await statsModel.findByIdAndDelete(id);
        }
        ret.setSuccess(true);
        ret.setMessages("document(s) deleted");
        ret.addData();

        return res.status(200).send(ret);
    } catch (error) {
        console.error("ERROR | " + nameFile + " | delete/getLikes | delete :", err);
        logger.error(nameFile + ' | delete/getLikes | delete : ' + err);

        ret.setMessages("delete error");
        ret.setSuccess(false);
        ret.setExtraData({"log": err.stack});

        return res.send(ret);
    }
})

router.put("/updatestats/:id", async function (req, res) {
    const idString = req.params.id;
    const act = req.body.act;
    const ip = req.ip;
    const email = req.body.email;
    const roles = req.body.roles;
    const resourceId = req.body.resourceId;
    const type = req.body.type;

    let ret = new jsonResponse();

    try {
        let updatedDocument;
        switch (act) {
            case "views":
                updatedDocument = await updateViews(idString, ip, email, roles, resourceId, type, Date.now());
                break;
            case "like":
            case "dislike":
                updatedDocument = await createOrUpdateDocument(idString, ip, email, roles, resourceId, type, act);
                break;
            default:
                ret.setMessages("Invalid action");
                ret.setSuccess(false);
                return res.status(400).send(ret);
        }

        if (updatedDocument) {
            ret.setSuccess(true);
            ret.setMessages("Document updated successfully");
            ret.addData(updatedDocument);
            return res.status(200).send(ret);
        } else {
            ret.setMessages("Document not found");
            ret.setSuccess(false);
            return res.status(404).send(ret);
        }
    } catch (error) {
        console.error("ERROR | updateStats | patch :", error);
        logger.error('updateStats | patch : ' + error);

        ret.setMessages("Update error");
        ret.setSuccess(false);
        ret.setExtraData({"log": error.stack});

        return res.status(500).send(ret);
    }
});

async function updateViews(idString, ip, email, roles, resourceId, type, timestamp) {
    try {
        let id = mongoose.Types.ObjectId(idString);
        let existingDoc = await statsModel.findOne({_id: id, email: email});

        if (existingDoc) {
            existingDoc.timestamps.push(timestamp);
            return await existingDoc.save();
        } else {
            let data = {
                email: email,
                roles: roles,
                ip: ip,
                resourceId: resourceId,
                type: type,
                act: "views",
                timestamps: [timestamp]
            };
            let newObj = new statsModel(data);
            return await newObj.save();
        }
    } catch (e) {
        throw e;
    }
}

async function createOrUpdateDocument(idString, ip, email, roles, resourceId, type, act) {
    try {
        let existingDoc = await statsModel.findOne({email: email, resourceId: idString, act: act});
        if (existingDoc) {
            existingDoc.timestamps.push(Date.now());
            return await existingDoc.save();
        } else {
            let data = {
                email: email,
                roles: roles,
                ip: ip,
                resourceId: idString,//resourceId,
                type: type,
                act: act,
                timestamps: Date.now()
            };
            let newObj = new statsModel(data);
            return await newObj.save();
        }
    } catch (e) {
        throw e;
    }
}


module.exports = router;
