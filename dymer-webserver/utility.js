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

exports.mongoUrlLib = function(el) {
    let url = "mongodb://" + global.configService.library.ip + ':' + global.configService.library.port + "/" + global.configService.library.index_ref;
    console.log("mongoUrlLib ", url);
    return url;
};