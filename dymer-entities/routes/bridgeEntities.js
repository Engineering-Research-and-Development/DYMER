var utilBridge = require('../utility');
const path = require('path');
const nameFile = path.basename(__filename);
require("../models/BridgeEntitiesModel");
const mongooseBridge = require("mongoose");
const logger = require('./dymerlogger');

mongooseBridge
    .connect(utilBridge.mongoUrlEntitiesBridge(), {
        //useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(x => {
        //  console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`);
        console.log(nameFile + ` | Connected to Mongo! Database name: "${x.connections[0].name}"`);
        logger.info(nameFile + ` | Connected to Mongo! Database name: "${x.connections[0].name}"`);
    })
    .catch(err => {
        console.error("ERROR | " + nameFile + " | Error connecting to mongo", err);
        logger.error(nameFile + ` | Error connecting to mongo! Database name:   ` + err);
    });
const bridgeModel = mongooseBridge.model("BridgeEntitiesModel");
var bridgeEntities = function bridgeEntities() {
    //defining a var instead of this (works for variable & function) will create a private definition
    var mappingList = [];
    this.add = function(obj) {
        var self = this;
        return new Promise(function(resolve, reject) {
            if (!self.exsistMapping(obj)) {
                var mod = new bridgeModel(obj);
                mod.save().then((el) => {
                    //console.log(nameFile + ' | add :', JSON.stringify(el));
                    logger.info(nameFile + ' | bridgeEntities | add:' + JSON.stringify(el));
                    self.loadFromDb();
                    resolve({ success: true, data: el, msg: "endpoint entered successfully" });
                }).catch((err) => {
                    if (err) {
                        console.error("ERROR | " + nameFile + ' | add : ', err);
                        logger.error(nameFile + ' | bridgeEntities | add : ' + err);
                        reject({ success: false, msg: "endpoint entered error" });
                    }
                })
            } else {
                resolve({ success: true, msg: "sorry endpoint already exists" });
            }
        }).catch(function(err) {
            console.error("ERROR | " + nameFile + ' | add promise : ', err);
            logger.error(nameFile + ' | bridgeEntities | add promise: ' + err);
            return { success: false, msg: "error" };
        });

    };
    this.update = (obj, id) => {
        var self = this;
        return new Promise(function(resolve, reject) {
            if (self.exsistMapping(obj)) {
                var myfilter = { "_id": id };
                var myquery = {
                    "$set": obj
                };

                bridgeModel.findOneAndUpdate(myfilter, myquery, { upsert: true },
                    function(err, raw) {
                        if (err) {
                            console.error("ERROR | " + nameFile + ' | update : ', err);
                            logger.error(nameFile + ' | bridgeEntities | update: ' + err);
                            reject({ success: false, msg: "endpoint updated error" });
                        } else {
                            //console.log(nameFile + ' | update :', JSON.stringify(raw));
                            logger.info(nameFile + ' | bridgeEntities | update:' + JSON.stringify(raw));
                            self.loadFromDb();
                            resolve({ success: true, data: obj, msg: "endpoint updated successfully" });
                        }
                    }
                );
            } else {
                resolve({ success: true, msg: "sorry endpoint not exists" });
            }
        }).catch(function(err) {
            console.error("ERROR | " + nameFile + ' | update promise: ', err);
            logger.error(nameFile + ' | bridgeEntities | update promise: ' + err);
            return { success: false, msg: "error" };
        });
    };
    this.exsistMapping = function(obj) {
        if (!mappingList.length)
            return false;
        let res = mappingList.find(el => JSON.stringify(el.indexes) == JSON.stringify(obj.indexes));
        if (res == undefined)
            return false;
        return true;
    };
    this.findByIndex = function(index, doevaljson) {
        let res = mappingList.find(el => el.indexes.includes(index));
        if (res == undefined) return res;
        try {
            if (doevaljson == undefined || doevaljson == true) {
                let temp_res = JSON.parse(JSON.stringify(res));
                temp_res.mapping.dentity["_source"] = this.evalutateJson(temp_res.mapping.dentity["_source"], false);
                temp_res.mapping.dentity["properties"] = this.evalutateJson(temp_res.mapping.dentity["properties"], false);
                temp_res.mapping.extentity = this.evalutateJson(temp_res.mapping.extentity, false);
                temp_res.api.search.mapping.query = this.evalutateJson(temp_res.api.search.mapping.query, false);
                temp_res.api.create.mapping.extentity = this.evalutateJson(temp_res.api.create.mapping.extentity, false);
                temp_res.api.update.mapping.extentity = this.evalutateJson(temp_res.api.update.mapping.extentity, false);
                return temp_res;
            }
        } catch (error) {
            console.error("ERROR | " + nameFile + ' | findByIndex: ', error);
            logger.error(nameFile + ' | bridgeEntities | findByIndex: ' + error);
        }
        return res;
    };
    this.exsistIndex = function(index) {
        let res = this.findByIndex(index);
        if (res == undefined)
            return false;
        return true;
    };
    this.findPositon = function(index) {
        let res = mappingList.findIndex(el => el.indexes.includes(index));
        return res;
    };
    this.removeByObject = function(obj) {
        var pos = mappingList.findIndex(el => JSON.stringify(el.indexes) == JSON.stringify(obj.indexes));
        if (pos) {
            delete mappingList[pos];
        }
    };
    this.removeByIndexes = function(index) {
        var pos = this.findPositon(index);
        if (pos) {
            delete mappingList[pos];
        }
    };
    this.removeById = function(id) {
        var self = this;
        return new Promise(function(resolve, reject) {
            var myfilter = { "_id": id };
            bridgeModel.findOneAndDelete(myfilter).then((ele) => {
                var pos = -1;
                for (let index = 0; index < mappingList.length; index++) {
                    if (mappingList[index]["_id"] == id)
                        pos = index;
                }
                if (pos > -1) {
                    mappingList.splice(pos, 1);
                }
                //console.log(nameFile + ' | removeById :', id);
                logger.info(nameFile + ' | bridgeEntities | removeById :' + id);
                resolve({ success: true, msg: "Element deleted" });
            }).catch((err) => {
                if (err) {
                    console.error("ERROR | " + nameFile + ' | removeById: ', err);
                    logger.error(nameFile + ' | bridgeEntities | removeById: ' + err);
                    reject({ success: false, msg: "Element delete error" });
                }
            })

        }).catch(function(err) {
            console.error("ERROR | " + nameFile + ' | removeById promise : ', err);
            logger.error(nameFile + ' | bridgeEntities | removeById promise: ' + err);
            return { success: false, msg: "error" };
        });
    };
    this.getmappingList = function(doevaljson) {
        let temp_mappingList = JSON.parse(JSON.stringify(mappingList));
        if (doevaljson == undefined || doevaljson == true) {
            temp_mappingList.forEach(element => {
                element.api.search.mapping.query = this.evalutateJson(element.api.search.mapping.query, false);
                element.api.create.mapping.extentity = this.evalutateJson(element.api.create.mapping.extentity, false);
                element.api.update.mapping.extentity = this.evalutateJson(element.api.update.mapping.extentity, false);
                element.api.patch.mapping.extentity = this.evalutateJson(element.api.patch.mapping.extentity, false);
                element.api.delete.mapping.extentity = this.evalutateJson(element.api.delete.mapping.extentity, false);

                element.mapping.extentity = this.evalutateJson(element.mapping.extentity);

                element.mapping.dentity["_index"] = this.evalutateJson(element.mapping.dentity["_index"], false);
                element.mapping.dentity["_type"] = this.evalutateJson(element.mapping.dentity["_type"], false);
                element.mapping.dentity["_id"] = this.evalutateJson(element.mapping.dentity["_id"], false);
                element.mapping.dentity["_source"] = this.evalutateJson(element.mapping.dentity["_source"], false);
                element.mapping.dentity["properties"] = this.evalutateJson(element.mapping.dentity["properties"], false);
            });
        }
        return temp_mappingList;
    };

    this.printValue = function() {
        console.log('counter', counter);
    }
    this.evalutateJson = function(qr, log) {
        if (log) console.log('qr', qr);
        Object.keys(qr).forEach(key => {
            if (log) console.log('qr-key', key);
            if (key == "formatting") {
                if (log) console.log("is-formatting1", qr[key]);
                qr[key] = eval(qr[key]);
            }
            Object.keys(qr[key]).forEach(subkey => {
                if (log) console.log('qr-subkey', qr[key], subkey);
                if (subkey == "formatting") {
                    if (log) console.log("is-formatting2", qr[key][subkey]);
                    qr[key][subkey] = eval(qr[key][subkey]);
                }
                if (log) console.log("is-nested", subkey, qr[key][subkey]);
                Object.keys(qr[key][subkey]).forEach(key2 => {
                    if (log) console.log('qr-subkey-key2', qr[key][subkey][key2], key2);
                    if (key2 == "formatting") {
                        if (log) console.log("is-formatting3", qr[key][subkey][key2]);
                        qr[key][subkey][key2] = eval(qr[key][subkey][key2]);
                    }
                    Object.keys(qr[key][subkey][key2]).forEach(subkey2 => {
                        if (subkey2 == "formatting") {
                            if (log) console.log("is formatting4", qr[key][subkey][key2][subkey2]);
                            qr[key][subkey][key2][subkey2] = eval(qr[key][subkey][key2][subkey2]);
                        }
                        Object.keys(qr[key][subkey][key2]).forEach(key3 => {
                            if (key3 == "formatting") {
                                if (log) console.log("is-formatting5", qr[key][subkey][key2][key3]);
                                qr[key][subkey][key2][key3] = eval(qr[key][subkey][key2][key3]);
                            }
                            Object.keys(qr[key][subkey][key2][key3]).forEach(subkey3 => {
                                if (subkey3 == "formatting") {
                                    if (log) console.log("is formatting6", qr[key][subkey][key2][key3][subkey3]);
                                    qr[key][subkey][key2][key3][subkey3] = eval(qr[key][subkey][key][key3][subkey3]);
                                }
                            })
                        })
                    })
                })
            })
        })
        return qr;
    };
    if (bridgeEntities.caller != bridgeEntities.getInstance) {
        throw new Error("This object cannot be instanciated");
    }
    this.loadFromDb = function() {
        mappingList = [];
        bridgeModel.find({}).then((els) => {
            els.forEach(element => {
                element.api.search.mapping.query = JSON.parse(element.api.search.mapping.query);
                if (element.api.create) {
                    element.api.create.mapping.extentity = JSON.parse(element.api.create.mapping.extentity);
                }
                if (element.api.update) {
                    element.api.update.mapping.extentity = JSON.parse(element.api.update.mapping.extentity);
                }
                if (element.api.patch) {
                    element.api.patch.mapping.extentity = JSON.parse(element.api.patch.mapping.extentity);
                }
                if (element.api.delete) {
                    element.api.delete.mapping.extentity = JSON.parse(element.api.delete.mapping.extentity);
                }
                if (element.mapping.extentity) {
                    element.mapping.extentity = JSON.parse(element.mapping.extentity);
                }
                element.mapping.dentity["_index"] = JSON.parse(element.mapping.dentity["_index"]);
                element.mapping.dentity["_type"] = JSON.parse(element.mapping.dentity["_type"]);
                element.mapping.dentity["_id"] = JSON.parse(element.mapping.dentity["_id"]);
                element.mapping.dentity["_source"] = JSON.parse(element.mapping.dentity["_source"]);
                element.mapping.dentity["properties"] = JSON.parse(element.mapping.dentity["properties"]);
            });
            mappingList = els;
        }).catch((err) => {
            if (err) {
                logger.error(nameFile + ' | loadFromDb : ' + err);
                console.error("ERROR | " + nameFile + ' | loadFromDb : ', err);
            }
        })
    }
}

/* ************************************************************************
bridgeEntities CLASS DEFINITION
************************************************************************ */
bridgeEntities.instance = null;
/**
 * bridgeEntities getInstance definition
 * @return bridgeEntities class
 */
bridgeEntities.getInstance = function() {
    if (this.instance === null) {
        this.instance = new bridgeEntities();
        this.instance.loadFromDb();
    }
    return this.instance;
}

module.exports = bridgeEntities.getInstance();