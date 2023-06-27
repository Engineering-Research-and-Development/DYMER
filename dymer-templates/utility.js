const path = require("path");
const nameFile = path.basename(__filename);
const logger = require('./routes/dymerlogger');
var jsonResponse = require('./jsonResponse');
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
    return cnf;
};

function isEmpty(obj) {
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
        Object.assign(obj, query.query);
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
        var ret = new jsonResponse();
        ret.setMessages("Sorry, something went wrong: you don't have permission or your authentication has expired");
        // res.status(200);
        ret.setSuccess(false);
        return res.send(ret);
    } else {
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