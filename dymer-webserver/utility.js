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