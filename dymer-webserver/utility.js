/*let serviceTemplateUrl="http://127.0.0.1:4545/";
let serviceFormUrl="http://127.0.0.1:4747/";
let serviceEntityUrl ="http://127.0.0.1:1358/";
exports.serviceTemplateUrl = function ( ) {   
    return serviceTemplateUrl;
};
exports.serviceFormUrl = function ( ) {   
    return serviceFormUrl;
};
exports.serviceEntityUrl = function ( ) {   
    return serviceEntityUrl;
};
*/
const path = require("path");
const nameFile = path.basename(__filename);
const logger = require('./routes/dymerlogger');
var jsonResponse = require('./jsonResponse');
const jwt = require('jsonwebtoken');
const crypto = require('crypto')
const axios = require("axios");

const ALGORITHM = 'aes-128-ecb';
const UNICODE_FORMAT = 'utf-8';
const SHA = 'sha1';
const secrets = require("./config/Secrets.js");//VL docker secrets


exports.getServiceUrl = function(typeServ) {
    let url = global.gConfig.services[typeServ].protocol + "://" + global.gConfig.services[typeServ].ip + ':' + global.gConfig.services[typeServ].port;
    // url += this.getContextPath(typeServ);
    return url;
};
exports.ishttps = function(typeServ) {
    let prot = global.gConfig.services[typeServ].protocol;
    if (prot == "https")
        return true;
    else
        return false;

};
exports.getContextPath = function(typeServ) {
    let cpath = global.gConfig.services[typeServ]["context-path"];
    // let cpath = global.gConfig.services[typeServ]["context-path"];
    if (cpath == undefined)
        cpath = "";
    return cpath;
};

function isEmpty(obj) {
    //  console.log('isEmpty(obj)',obj);
    for (var key in obj) {
        if (typeof(obj[key]) == 'object')
            return false;
        else {
            if (obj.hasOwnProperty(key))
                return false;
        }

    }
    return true;
}
exports.getAllQuery = function(req) {

    let obj = { "query": {} };
    let body = req.body;
    let params = req.params;
    let query = req.query;
    /*console.log("req", req);
    console.log("req route", req.route );
    console.log("req get", req.route.methods.get);
    console.log("req post", req.route.methods.post);*/
    /* console.log("body", body, typeof(body), !isEmpty(body));
     console.log("params", params, typeof(params), !isEmpty(params));
     console.log("query", query, typeof(query), !isEmpty(query));*/
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
    const dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
    //console.log("dymeruser", dymeruser);
    if ((dymeruser.roles.indexOf("app-admin") > -1)) {
        logger.info(nameFile + ' | checkIsAdmin | Yes permission, dymeruser.id :' + dymeruser.id + " " + JSON.stringify({ "originalUrl": req.originalUrl, "method": req.method, "url": req.url }));
        next();
    } else {
        //console.log('checkIsAdmin | No permission:', dymeruser.id, req.originalUrl, req.method, req.url);
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
        logger.info(nameFile + ' | checkIsAdmin | Yes permission, dymeruser.id :' + dymeruser.id + " " + JSON.stringify({ "originalUrl": req.originalUrl, "method": req.method, "url": req.url }));
        next();
    } else {
        //console.log('checkIsAdmin | No permission:', dymeruser.id, req.originalUrl, req.method, req.url);
        logger.info(nameFile + ' | checkIsAdmin | No permission, dymeruser.id :' + dymeruser.id + " " + JSON.stringify({ "originalUrl": req.originalUrl, "method": req.method, "url": req.url }));
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

//AC MG VL - 0d Day START
exports.checkIsDymerAdmin = function (req, res, next) {
    //console.log("authenticates.js | checkIsDymerAdmin ");

	//VL docker secrets
    let secretKey = secrets.get('jwt_secret_key'); //process.env.JWT_SECRET_KEY
    const encryptKey = secrets.get('encryption_secret_key');//process.env.ENCRYPTION_SECRET_KEY
    console.log(nameFile + ' | checkIsDymerAdmin | jwt_secret_key: ' + secretKey);
    console.log(nameFile + ' | checkIsDymerAdmin | encryption_secret_key: ' + encryptKey);
    const token = req.cookies['token'];
    /*
    let bearer = req.headers.authorization
    let token = bearer.split(" ")[1]
    * */
    //TODO url
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="it">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="refresh" content="0; url=/login">
        <title>...</title>
    </head>
    <body>
        
    </body>
    </html>
    `;
    if (!token) return res.status(401).send(htmlContent);
    //if (!token) return res.status(401).send('dymer-webserver>>>utility.js>>>checkIsDymerAdmin>>>Access denied');

    try {

        let decoded = jwt.verify(token, secretKey);

        if (decoded)
            next()

        /*TODO decrypt to get roles
        if (decoded.roles && decoded.roles.includes("app-admin")) {
            next()
        }
        else {
            return res.status(403).send("Forbidden")
        }*/

    } catch (err) {
        logger.info(nameFile + " | checkIsDymerAdmin | Unable to verify token")
        res.status(401).send(" Error: Unauthorized")
    }
}
exports.encrypt = function (secretKey, message) {
    let hash = crypto.createHash('sha1')

    let digest = hash.update(secretKey).digest().subarray(0, 16)
    const cipher = crypto.createCipheriv("aes-128-ecb", digest, null);

    let encryptedText = cipher.update(message, "utf-8", "hex");
    encryptedText += cipher.final("hex");

    return encryptedText
}

exports.decrypt = function (secretKey, encryptedText) {
    let hash = crypto.createHash('sha1');
    let digest = hash.update(secretKey).digest().subarray(0, 16);

    const decipher = crypto.createDecipheriv("aes-128-ecb", digest, null);

    let decryptedText = decipher.update(encryptedText, "hex", "utf-8");
    decryptedText += decipher.final("utf-8");

    return decryptedText;
}

exports.getDecryptedPayload = function(token) {
    //VL doccker secrets
	const secretKey = secrets.get('jwt_secret_key'); //process.env.JWT_SECRET_KEY
    const encryptKey = secrets.get('encryption_secret_key');//process.env.ENCRYPTION_SECRET_KEY
    console.log(nameFile + ' | getDecryptedPayload | jwt_secret_key: ' + secretKey);
    console.log(nameFile + ' | getDecryptedPayload | encryption_secret_key: ' + encryptKey);
    try {
        let decoded = jwt.verify(token, secretKey)
        console.log(nameFile + " | getDecryptedPayload | token: ", token);
        console.log(nameFile + " | getDecryptedPayload | decoded: ", decoded);
		//logger.info(nameFile + " | getDecryptedPayload | token: ", token)
        //logger.info(nameFile + " | getDecryptedPayload | decoded: ", decoded)
        let payload = JSON.parse(exports.decrypt(encryptKey, decoded.data))
        console.log(nameFile + " | getDecryptedPayload | payload: ", payload);
        return payload
    } catch (err) {
		console.log(nameFile + " | getDecryptedPayload | Unable to verify token due to: ", err)
        logger.info(nameFile + " | getDecryptedPayload | Unable to verify token due to: ", err)
        new Error(err)
    }
}

function setKey(secretKey) {
    const sha = crypto.createHash(SHA);
    let key = Buffer.from(secretKey, UNICODE_FORMAT);
    key = sha.update(key).digest();
    key = key.slice(0, 16);
    return key;
}

//VL exports.decryptLfr = function (secret, encryptedMessage) {//VL docker secrets 
    exports.decryptLfr = function (encryptedMessage) {//VL docker secrets 
    try {
        const secret = secrets.get('encryption_secret_key');//VL docker secrets 
        console.log(nameFile + ' | decryptLfr | encryption_secret_key: ' + secret);
        let secretKey = setKey(secret);
        const decipher = crypto.createDecipheriv(ALGORITHM, secretKey, null); // TODO change ECB cause of vulnerability
        let decrypted = decipher.update(encryptedMessage, 'base64', UNICODE_FORMAT);
        decrypted += decipher.final(UNICODE_FORMAT);
        return decrypted;
    } catch (e) {
        logger.info(nameFile + " | decryptLfr | Unable to decrypt: "+ e.toString())
    }
    return "";
}

exports.isCrypted = function(dt) {
    try {
        JSON.parse(Buffer.from(dt, 'base64').toString())
        //console.log(nameFile + " | isCrypted | able to decode from base64 ")
        return false;
    } catch (error) {
        //console.log(nameFile + " | isCrypted | Unable to decode from base64 ")
        logger.warn(nameFile + " | isCrypted | Unable to decode from base64 ")
        return true;
    }
}
// AC MG VL - 0d Day - get payload - END
				 
exports.mongoUrlLib = function(el) {
    let url = "mongodb://" + global.configService.library.ip + ':' + global.configService.library.port + "/" + global.configService.library.index_ref;
    logger.warn(nameFile + " | mongoUrlLib | mongo lib: ", url)
    return url;
};

exports.defaultAdmin = async function(defaultUrl, data, headers) {

    axios.post(defaultUrl, JSON.stringify(data), {headers})
        .then(response => {
            console.log('Admin checked');
        })
        .catch(error => {
            if (error.response) {
                //console.error('Response error: ', error.response.status);
                logger.error(nameFile + " | defaultAdmin | Request error: " + error.response.status + ", " + error.response.data)
            } else if (error.request) {
                //console.error('Request error: ', error.request);
                logger.error(nameFile + " | defaultAdmin | Request error: " + error.request)
            } else {
                console.error('Generic error: ', error.message);
                logger.error(nameFile + " | defaultAdmin | Generic error: " + error.message)
            }
        });

    }

//VL to delete - new gui start
exports.getAllowedOrigins = function (serviceName) {
    //const envVariable = process.env.NODE_ENV === 'production' ? 'ALLOWED_ORIGINS' : 'ALLOWED_ORIGINS_DEV';
    //const origins = process.env[envVariable];
    const envVariable = process.env.NODE_ENV === 'production' ? 'allowed_origins' : 'allowed_origins_dev';
    const origins = secrets.get(envVariable);
    console.log(serviceName + ` - env: ${envVariable}`, origins);
    //logger.info( nameFile + " | " + serviceName + " | getAllowedOrigins " + origins );
    if (!origins) {
        console.error(`ERROR: ${envVariable} is empty!`);
        logger.error( 'ERROR ' + nameFile + " | configure allowed_origins");
        process.exit(1);
    }

    return origins.split(',');
};

//VL docker secrets
exports.checkToken = function (token) {
    let isValidToken = false;
    let secretKey = secrets.get('jwt_secret_key');
    console.log(nameFile + ' | checkToken | jwt_secret_key: ' + secretKey);
    if (token) {
        try {
            jwt.verify(token, secretKey);
            isValidToken = true;
        } catch (err) {
            console.log("Invalid or Expired Token:", err.message);
        }
    }

    return isValidToken;
}

/*
exports.csrfToken = function(req, res, next) {
    console.log('CSRF token check');
    const csrfToken = req.headers['x-csrf-token'];
    const storedCsrfToken = req.session.csrfToken;

    if (csrfToken !== storedCsrfToken) {
        logger.error(nameFile + ' | csrfToken | Invalid CSRF token');
        //return res.status(403).send({ message: 'Invalid CSRF token' });
        var ret = new jsonResponse();
        ret.setMessages("Sorry, invalid CSRF token");
        ret.setSuccess(false);
        return res.send(ret);
    } else {
        logger.info(nameFile + ' | csrfToken | Valid CSRF token');
        next();
    }

}*/
//VL to delete - new gui end