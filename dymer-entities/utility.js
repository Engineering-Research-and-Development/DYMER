require("./config/config.js");
/*let esUrl = "http://192.168.99.100:9200";
let serviceTemplateUrl = "http://localhost:4545/";
let serviceFormUrl = "http://localhost:4747/"; */
var jsonResponse = require('./jsonResponse');
exports.getDymerUuid = function() {
    return global.dymer_uuid;
};
exports.getServiceUrl = function(typeServ) {
    let url = global.totalConfig.services[typeServ].protocol + "://" + global.totalConfig.services[typeServ].ip + ':' + global.totalConfig.services[typeServ].port;
    return url;
};
const stringToUuid = (str) => {
    str = str.replace('-', '');
    return 'xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx'.replace(/[x]/g, function(c, p) {
        return str[p % str.length];
    });
}
exports.generateDymerUuid = function() {
    let ddta = new Date().getTime();
    let input = global.dymer_uuid + ddta.toString(36).concat(Date().getTime().toString(), ddta.toString()).replace(/\./g, "");
    let uuidtoret = stringToUuid(input);
    return uuidtoret;
}
exports.getContextPath = function(typeServ) {
    let cpath = global.globConfig.services[typeServ]["context-path"];
    if (cpath == undefined)
        cpath = "";
    return cpath;
};
exports.getbasehUrl = function(el) {
    let url = global.gConfig.repository.protocol + "://" + global.gConfig.repository.ip + ':' + global.gConfig.repository.port;
    //  console.log('url1', url);
    return url;
};
exports.mongoUrlFiles = function(el) {
    let url = "mongodb://" + global.gConfig.repository.files.ip + ':' + global.gConfig.repository.files.port + "/" + global.gConfig.repository.files.index_ref;
    return url;
};
exports.mongoUrlEntitiesBridge = function(el) {
    let url = "mongodb://" + global.gConfig.repository.entitiesbridge.ip + ':' + global.gConfig.repository.entitiesbridge.port + "/" + global.gConfig.repository.entitiesbridge.index_ref;
    return url;
};
exports.elastichUrl = function(el) {
    let url = global.gConfig.repository.entity.protocol + "://" + global.gConfig.repository.entity.ip + ':' + global.gConfig.repository.entity.port + "/" + el.index + "/" + el.type;
    //  console.log('url2', url);
    return url;
};
exports.getServiceUrl = function(typeServ) {
    let url = global.globConfig.services[typeServ].protocol + "://" + global.globConfig.services[typeServ].ip + ':' + global.globConfig.services[typeServ].port;

    return url;
};
exports.getServiceConfig = function(typeServ) {

    let cnf = global.globConfig.services[typeServ];

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
    //console.log("dymeruser", dymeruser);
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
exports.getDymerUser = function(req, res, next) {
    const hdymeruser = req.headers.dymeruser;
    if (hdymeruser == undefined) {

        return null;
    } else {
        const dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
        return dymeruser;
    }
}