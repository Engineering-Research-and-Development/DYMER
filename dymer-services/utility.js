require("./config/config.js");
/*let esUrl="http://192.168.99.100:9200/";
let serviceTemplateUrl="http://localhost:4545/";
let serviceFormUrl="http://localhost:4747/";
let serviceEntityUrl="http://localhost:1358/";
let mongoUrlForm="mongodb://192.168.99.100:27017/form";*/
//let mongoUrlFormFile = "mongodb://192.168.99.100:27017/formsFile";
var jsonResponse = require('./jsonResponse');
const path = require("path");
const nameFile = path.basename(__filename);
const logger = require('./routes/dymerlogger');
const http = require('http');
const custumLibraries = require('./libInit');
const crypto = require("crypto")

const ALGORITHM = 'aes-128-ecb';
const UNICODE_FORMAT = 'utf-8';
const SHA = 'sha1';

const jwt = require("jsonwebtoken");
const secrets = require("./config/Secrets.js");//VL docker secrets

exports.getContextPath = function(typeServ) {
    let cpath = global.gConfig.services[typeServ]["context-path"];
    if (cpath == undefined)
        cpath = "";
    return cpath;
};
exports.getServiceUrl = function(typeServ) {
    let url = global.gConfig.services[typeServ].protocol + "://" + global.gConfig.services[typeServ].ip + ':' + global.gConfig.services[typeServ].port;
    // url += this.getContextPath(typeServ);
    return url;
};
exports.getbasehUrl = function() {
    let url = global.configService.repository.protocol + "://" + global.configService.repository.ip + ':' + global.configService.repository.port;
    //  console.log('url1', url);
    return url;
};
exports.mongoUrlFiles = function(el) {
    let url = "mongodb://" + global.configService.repository.files.ip + ':' + global.configService.repository.files.port + "/" + global.configService.repository.files.index_ref;
    return url;
};
exports.elastichUrl = function(el) {
    let url = global.configService.repository.entity.protocol + "://" + global.configService.repository.entity.ip + ':' + global.configService.repository.entity.port + "/" + el.index + "/" + el.type;
    //  console.log('url2', url);
    return url;
};
exports.mongoUrlBase = function() {
    let url = "mongodb://" + global.configService.repository.ip + ':' + global.configService.repository.port + "/";
    return url;
};
exports.mongoUrl = function(el) {
    let url = "mongodb://" + global.configService.repository.ip + ':' + global.configService.repository.port + "/" + global.configService.repository.index_ref;
    return url;
};
exports.mongoUrlEntitiesBridge = function() {
    let url = "mongodb://" + global.configService.repository.entitiesbridge.ip + ':' + global.configService.repository.entitiesbridge.port + "/" + global.configService.repository.entitiesbridge.index_ref;
    return url;
};
exports.getServiceConfig = function(typeServ) {
    let cnf = global.gConfig.services[typeServ];
    //console.log("typeServ ",typeServ);
    //console.log("cnf ",cnf);
    return cnf;
};

function isEmpty(obj) {
    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            return false;
        }
    }
    return true;
}
/*
function isEmpty(obj) {
    console.log('isEmpty(obj)', obj, typeof(obj));
    for (var key in obj) {
        console.log('key', key, obj[key]);
        if (typeof(obj[key]) == 'object')
            return false;
        else {
            if (obj.hasOwnProperty(key))
                return false;
        }
    }
    return true;
}*/

exports.getAllQuery = function(req) {

    let obj = { "query": {} };
    let body = req.body;
    let params = req.params;
    let query = req.query;
    /* console.log('body', body);
     console.log('params', params);
     console.log('query', query);*/
    if (!isEmpty(body))
        Object.assign(obj, body);
    if (!isEmpty(params)) {
        Object.assign(obj, params);
        //Object.assign(obj.query, params);
    }
    if (!isEmpty(query)) {
        if (typeof(query.query) == 'string')
            query.query = JSON.parse(query.query);
        Object.assign(obj, query);
    }
    //  console.log("obj", obj );
    return obj;
}
exports.convertBodyQuery = function(req) {
    var obj = {}
    if (!isEmpty(req.body)) {
        obj = req.body;
        //console.log("Get diretto");
    } else {
        obj["obj"] = JSON.parse(req.query["obj"]);
        obj["instance"] = JSON.parse(req.query["instance"]);
        // console.log("Get da webServer");
    }
    return obj;
}

exports.convertBodyParams = function(req) {
    var obj = {}
    if (!isEmpty(req.body.params)) {
        obj = req.body.params;
        //  console.log("Put webServer");
    } else {
        obj = req.body;
        //  console.log("Put diretto");
    }
    return obj;
}
exports.replaceAll = function(str, cerca, sostituisci) {
    return str.split(cerca).join(sostituisci);
}
exports.stringAsKey = function(obj, arrkey, element) {
    var key = arrkey[0];
    if (arrkey.length == 1) {
        obj[key] = element;
        return obj[key];
    }
    if (arrkey.length > 0) {
        arrkey.shift();
        return this.stringAsKey(obj[key], arrkey, element);
    }
}
exports.checkIsDymerUser = function(req, res, next) {
    const hdymeruser = req.headers.dymeruser;
    if (hdymeruser == undefined) {
        logger.info(nameFile + ' | checkIsDymerUser | No permission, hdymeruser=undefined :' + JSON.stringify({ "originalUrl": req.originalUrl, "method": req.method, "url": req.url }));
        //console.log('checkUser | No permission:', req.originalUrl, req.method, req.url);
        var ret = new jsonResponse();
        ret.setMessages("Sorry, something went wrong: you don't have permission or your authentication has expired");
        // res.status(200);
        ret.setSuccess(false);
        return res.send(ret);
    } else {
        const dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
        logger.info(nameFile + ' | checkIsDymerUser | Yes permission, dymeruser.id :' + dymeruser.id + " " + JSON.stringify({ "originalUrl": req.originalUrl, "method": req.method, "url": req.url }));

        next();
    }
}
exports.checkIsAdmin = function(req, res, next) {
    const hdymeruser = req.headers.dymeruser;
	console.log(">>> checkIsAdmin hdymeruser:", hdymeruser);													
    const dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
    //console.log("==> checkIsAdmin dymeruser:", dymeruser);
    if ((dymeruser.roles.indexOf("app-admin") > -1)) {
        console.log(nameFile + ' | checkIsAdmin | Yes permission, dymeruser.id: ' + dymeruser.id + " " + JSON.stringify({ "originalUrl": req.originalUrl, "method": req.method, "url": req.url }));
        logger.info(nameFile + ' | checkIsAdmin | Yes permission, dymeruser.id: ' + dymeruser.id + " " + JSON.stringify({ "originalUrl": req.originalUrl, "method": req.method, "url": req.url }));
        next();
    } else {
        console.log('checkIsAdmin | No permission:', dymeruser.id, req.originalUrl, req.method, req.url);
        logger.info(nameFile + ' | checkIsAdmin | No permission, dymeruser.id: ' + dymeruser.id + " " + JSON.stringify({ "originalUrl": req.originalUrl, "method": req.method, "url": req.url }));
        var ret = new jsonResponse();
        ret.setMessages("Sorry, something went wrong: you don't have permission or your authentication has expired");
        // res.status(200);
        ret.setSuccess(false);
        return res.send(ret);
    }
}

exports.checkIsAdminRun = function(req, res, next) {
    const hdymeruser = req.headers.dymeruser;
    const dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
    //console.log("==> checkIsAdmin dymeruser:", dymeruser);
    if ((dymeruser.roles.indexOf("app-admin") > -1)) {
        
        req.dymeruser = dymeruser;
        console.log(nameFile + ' | checkIsAdmin | Yes permission, dymeruser.id :' + dymeruser.id + " " + JSON.stringify({ "originalUrl": req.originalUrl, "method": req.method, "url": req.url }));
        logger.info(nameFile + ' | checkIsAdmin | Yes permission, dymeruser.id :' + dymeruser.id + " " + JSON.stringify({ "originalUrl": req.originalUrl, "method": req.method, "url": req.url }));
        next();
    } else {
        console.log('checkIsAdmin | No permission:', dymeruser.id, req.originalUrl, req.method, req.url);
        logger.info(nameFile + ' | checkIsAdmin | No permission, dymeruser.id :' + dymeruser.id + " " + JSON.stringify({ "originalUrl": req.originalUrl, "method": req.method, "url": req.url }));
        var ret = new jsonResponse();
        ret.setMessages("Sorry, something went wrong: you don't have permission or your authentication has expired");
        // res.status(200);
        ret.setSuccess(false);
        return res.send(ret);
    }
}

exports.checkIsPortalUser = function(req, res, next) {
    const hdymeruser = req.headers.dymeruser;
    const dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
    //console.log("dymeruser", dymeruser);
    if ((dymeruser.roles.indexOf("app-admin") > -1)||(dymeruser.roles.indexOf("app-content-curator") > -1)) {
        logger.info(nameFile + ' | checkIsPortalUser | Yes permission, dymeruser.id: ' + dymeruser.id + " " + JSON.stringify({ "originalUrl": req.originalUrl, "method": req.method, "url": req.url }));
        next();
    } else {
        //console.log('checkIsPortalUser | No permission:', dymeruser.id, req.originalUrl, req.method, req.url);
        logger.info(nameFile + ' | checkIsPortalUser | No permission, dymeruser.id: ' + dymeruser.id + " " + JSON.stringify({ "originalUrl": req.originalUrl, "method": req.method, "url": req.url }));
        var ret = new jsonResponse();
        ret.setMessages("Sorry, something went wrong: you don't have permission or your authentication has expired");
        // res.status(200);
        ret.setSuccess(false);
        return res.send(ret);
    }
}
exports.getDymerUser = function(req, res, next) {
    const hdymeruser = req.headers.dymeruser;
    if (hdymeruser == undefined) {
        
        return null;
    } else {
        const dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
       
        return dymeruser;
    }
}

//VL docker secrets
exports.generateJWTToken = function(encryptedPayload) {
    const secretKey = secrets.get('jwt_secret_key');
    console.log(nameFile + ' | generateJWTToken | jwt_secret_key: ' + secretKey);
    const token = jwt.sign({ data: encryptedPayload }, secretKey, { expiresIn: "2h" });
    return token;
};

//exports.encrypt = function (secretKey, message) {//VL docker secrets
exports.encrypt = function (message) {
    const secretKey = secrets.get('encryption_secret_key');//VL docker secrets
    console.log(nameFile + ' | encrypt | encryption_secret_key: ' + secretKey);
    let hash = crypto.createHash('sha1')

    let digest = hash.update(secretKey).digest().subarray(0, 16)
    const cipher = crypto.createCipheriv("aes-128-ecb", digest, null);

    let encryptedText = cipher.update(message, "utf-8", "hex");
    encryptedText += cipher.final("hex");

    return encryptedText
}
exports.format = function(seconds){
  function pad(s){
    return (s < 10 ? '0' : '') + s;
  }
  var hours = Math.floor(seconds / (60*60));
  var minutes = Math.floor(seconds % (60*60) / 60);
  var seconds = Math.floor(seconds % 60);

  return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
}
//exports.decrypt = function(secretKey, encryptedText) {
  exports.decrypt = function(encryptedText) {
    
    const secretKey = secrets.get('encryption_secret_key');//VL docker secrets
    let hash = crypto.createHash('sha1');
    let digest = hash.update(secretKey).digest().subarray(0, 16);

    const decipher = crypto.createDecipheriv("aes-128-ecb", digest, null);

    let decryptedText = decipher.update(encryptedText, "hex", "utf-8");
    decryptedText += decipher.final("utf-8");
 
    return decryptedText;
}


exports.decrypt_ = function (encryptedMessage) {
    const secretKey = secrets.get('encryption_secret_key'); // VL docker secrets
    console.log(nameFile + ' | decrypt | encryption_secret_key: ' + secretKey);

    let hash = crypto.createHash('sha1');
    let digest = hash.update(secretKey).digest().subarray(0, 16);

    const decipher = crypto.createDecipheriv("aes-128-ecb", digest, null);

    let decryptedText = decipher.update(encryptedMessage, "hex", "utf-8");
    decryptedText += decipher.final("utf-8");

    return decryptedText;
};






exports.generateHexString = function generateHexString(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += Math.floor(Math.random() * 16).toString(16);
    }
    return result;
}



exports.decryptLfr = function (encryptedMessage) {
    try {
        const secret = secrets.get('encryption_secret_key');
        console.log(nameFile + ' | decryptLfr | encryption_secret_key: ' + secret);
        const secretKey = setKey(secret);
        const decipher = crypto.createDecipheriv(ALGORITHM, secretKey, null);
        let decrypted = decipher.update(encryptedMessage, 'base64', UNICODE_FORMAT);
        decrypted += decipher.final(UNICODE_FORMAT);
        //console.log(nameFile + " | decryptLfr | decrypted DYM: ", decrypted)
        return decrypted;
    } catch (e) {
        console.log(nameFile + " | decryptLfr | Unable to decrypt: ", e.toString())
        logger.info(nameFile + " | decryptLfr | Unable to decrypt: "+ e.toString())
    }
    return "";
}

function setKey(secretKey) {
    const sha = crypto.createHash(SHA);
    let key = Buffer.from(secretKey, UNICODE_FORMAT);
    key = sha.update(key).digest();
    key = key.slice(0, 16);
    return key;
}

exports.isCrypted = function(dt) {
    try {
        JSON.parse(Buffer.from(dt, 'base64').toString())
        //console.log(nameFile + " | isCrypted | able to decode from base64 ")
        return false;
    } catch (error) {
        //console.log(nameFile + " | isCrypted | unable to decode from base64 ")
        logger.warn(nameFile + " | isCrypted | unable to decode from base64 ")
        return true;
    }
}

//TODO change dymer-viewer portlet to get right jwt (DYM)
//VL 0day - 0day - Lfr DYM decrypt start 
/*
exports.isCrypted = function(dt) {
    try {
        JSON.parse(Buffer.from(dt, 'base64').toString())
        //console.log(nameFile + " | isCrypted | able to decode from base64 ")
        return false;
    } catch (error) {
        //console.log(nameFile + " | isCrypted | unable to decode from base64 ")
        logger.warn(nameFile + " | isCrypted | unable to decode from base64 ")
        return true;
    }
}

function setKey(secretKey) {
    const sha = crypto.createHash(SHA);
    let key = Buffer.from(secretKey, UNICODE_FORMAT);
    key = sha.update(key).digest();
    key = key.slice(0, 16);
    return key;
}

//exports.decryptLfr = function (secret, encryptedMessage) {
exports.decryptLfr = function (encryptedMessage) {
    try {
        const secret = secrets.get('encryption_secret_key');
        console.log(nameFile + ' | decryptLfr | encryption_secret_key: ' + secret);
        const secretKey = setKey(secret);
        const decipher = crypto.createDecipheriv(ALGORITHM, secretKey, null);
        let decrypted = decipher.update(encryptedMessage, 'base64', UNICODE_FORMAT);
        decrypted += decipher.final(UNICODE_FORMAT);
        //console.log(nameFile + " | decryptLfr | decrypted DYM: ", decrypted)
        return decrypted;
    } catch (e) {
        console.log(nameFile + " | decryptLfr | Unable to decrypt: ", e.toString())
        logger.info(nameFile + " | decryptLfr | Unable to decrypt: "+ e.toString())
    }
    return "";
}

exports.generateHexString = function generateHexString(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += Math.floor(Math.random() * 16).toString(16);
    }
    return result;
}
SICURAMENTE è un refuso
*/

//TODO delete
/*const jwt = require('jsonwebtoken');
exports.getDecryptedPayloadRefreshToken = function(token) {
    const secretKey = process.env.ENCRYPTION_SECRET_KEY//REFRESH_SECRET_KEY per decriptare il refresh_token
    const encryptKey = process.env.ENCRYPTION_SECRET_KEY//per decriptare il payload
    try {
        let decoded = jwt.verify(token, secretKey)
        logger.info(nameFile + " | getDecryptedPayloadRefreshToken | refresh_token: ", token)
        logger.info(nameFile + " | getDecryptedPayloadRefreshToken | decoded: ", decoded)
        let payload = JSON.parse(exports.decrypt(encryptKey, decoded.data))
        return payload
    } catch (err) {
        console.log(nameFile + " | getDecryptedPayloadRefreshToken | Unable to verify token due to: ", err)
        logger.info(nameFile + " | getDecryptedPayloadRefreshToken | Unable to verify token due to: ", err)
        new Error(err)
    }
}*/

//VL 0day - 0day - Lfr DYM decrypt end