require("./config/config.js");
/*let esUrl="http://192.168.99.100:9200/";
let serviceTemplateUrl="http://localhost:4545/";
let serviceFormUrl="http://localhost:4747/";
let serviceEntityUrl="http://localhost:1358/";
let mongoUrlForm="mongodb://192.168.99.100:27017/form";*/
//let mongoUrlFormFile = "mongodb://192.168.99.100:27017/formsFile";
var jsonResponse = require('./jsonResponse');
exports.getContextPath = function(typeServ) {
    let cpath = global.globConfig.services[typeServ]["context-path"];
    if (cpath == undefined)
        cpath = "";
    return cpath;
};
exports.elastichUrl = function(el) {
    let url =
        global.gConfig.repository.ip_port + "/" + el.index + "/" + el.type;
    return url;
};
/*exports.mongoUrlFormFile = function(el) {
    let url = mongoUrlFormFile + "";
    return url;
};*/
exports.mongoUrlBase = function(el) {
    let url = "mongodb://" + global.gConfig.repository.ip + ':' + global.gConfig.repository.port + "/";
    return url;
};
exports.mongoUrlForm = function(el) {
    let url = "mongodb://" + global.gConfig.repository.ip + ':' + global.gConfig.repository.port + "/" + global.gConfig.repository.index_ref;
    return url;
};
exports.getServiceUrl = function(typeServ) {
    let url = global.globConfig.services[typeServ].protocol + "://" + global.globConfig.services[typeServ].ip + ':' + global.globConfig.services[typeServ].port;

    return url;
};
exports.getServiceConfig = function(typeServ) {

    var cnf = global.globConfig.services[typeServ];

    return cnf;
};
/*function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}*/
function isEmpty(obj) {
    //console.log('isEmpty(obj)', obj);
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
        console.log('checkUser | No permission:', req.originalUrl, req.method, req.url);
        var ret = new jsonResponse();
        ret.setMessages("No permission");
        // res.status(200);
        ret.setSuccess(false);
        return res.send(ret);
    } else {
        next();
    }
}
exports.checkIsAdmin = function(req, res, next) {
    const hdymeruser = req.headers.dymeruser;
    const dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
    console.log("dymeruser", dymeruser);
    if ((dymeruser.roles.indexOf("app-admin") > -1)) {
        next();
    } else {
        console.log('checkIsAdmin | No permission:', dymeruser.id, req.originalUrl, req.method, req.url);
        var ret = new jsonResponse();
        ret.setMessages("No permission");
        // res.status(200);
        ret.setSuccess(false);
        return res.send(ret);
    }
}