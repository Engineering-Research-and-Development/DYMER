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
let fs = require('fs')
const axios = require('axios');

const flatnest = require("flatnest")
exports.getDymerUuid = function() {
    return global.dymer_uuid;
};


exports.format = function(seconds){
  function pad(s){
    return (s < 10 ? '0' : '') + s;
  }
  var hours = Math.floor(seconds / (60*60));
  var minutes = Math.floor(seconds % (60*60) / 60);
  var seconds = Math.floor(seconds % 60);

  return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
}


const stringToUuid = (str) => {
    str = str.replace('-', '');
    return 'xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx'.replace(/[x]/g, function(c, p) {
        return str[p % str.length];
    });
}
exports.generateDymerUuid = function() {
    let ddta = new Date().getTime();
    let ddta2 = new Date().getTime();
    let input = global.dymer_uuid + ddta.toString(36).concat(ddta2.toString(), ddta.toString()).replace(/\./g, "");
    let uuidtoret = stringToUuid(input);
    return uuidtoret;
}

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
exports.mongoUrlForms = function(el) {
    let url = "mongodb://" + global.configService.repository.forms.ip + ':' + global.configService.repository.forms.port + "/" + global.configService.repository.forms.index_ref;
    return url;
};
exports.getServiceConfig = function(typeServ) {
    let cnf = global.gConfig.services[typeServ];
    return cnf;
};
exports.getCacheUrl = function(typeServ) {
    let url = global.gConfig.services[typeServ].cache.protocol + "://" + global.gConfig.services[typeServ].cache.ip + ':' + global.gConfig.services[typeServ].cache.port;
    return url;
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
    const dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
    //console.log("==> checkIsAdmin dymeruser:", dymeruser);
    if ((dymeruser.roles.indexOf("app-admin") > -1)) {
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

exports.checkIsAdminRun = function(req, res, next) {
    const hdymeruser = req.headers.dymeruser;
    const dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
    
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
        //console.log("==> getDymerUser hdymeruser is undefined");
        return null;
    } else {
        const dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
        //console.log("==> getDymerUser dymeruser:", dymeruser);
        return dymeruser;
    }
}

function jsonValueClean(valore) {
    if (typeof valore === 'string') {
        return valore.replace(/[\n\t\r\\,]/g, '');
    } else if (Array.isArray(valore)) {
        return valore.map(jsonValueClean);
    } else if (typeof valore === 'object') {
        for (const chiave in valore) {
            valore[chiave] = jsonValueClean(valore[chiave]);
        }
        return valore;
    } else {
        return valore;
    }
}

exports.flatJSON = function (nestedJSONArray) {
    let flattedJSONArray = []
    for(let element of nestedJSONArray) {
        element._source.logo = this.getImgLink(element._id, element._source.logo?.id)

        let newElem = jsonValueClean(flatnest.flatten(element))
        flattedJSONArray.push(newElem)
    }
    return flattedJSONArray
}

exports.getImgLink = function(resourceId, logoId) {
    return logoId ? `${this.getServiceUrl("entity")}/api/entities/api/v1/entity/contentfile/${resourceId}/${logoId}` : ""
	
}

// AC prendere le immagini nell'export

function checkFilesFormdata(arr, data, name) {
    var name = name || '';
    if (typeof data === 'object' && data != null) {
        var index = 0
        if (data.hasOwnProperty("filename") && data.hasOwnProperty("bucketName")) {
            arr.push(data);
        }
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                if (name === '') {
                    checkFilesFormdata(arr, data[key], key);
                } else {
                    checkFilesFormdata(arr, data[key], name + '[' + key + ']');
                }
            }
            index++;
        }
    }
}

exports.checkFilesFormdata = checkFilesFormdata

// function downloadFile(url, dest, filename, dymeruser) {
//     return axios({
//         method: "get",
//         url,
//         responseType: "arraybuffer",
//         headers: {
//             dymeruser: dymeruser
//         }
//     }).then(response => {
//         const path = `${dest}/${filename}`;
//         fs.writeFileSync(path, response.data);
//     });
// }
function downloadFileStream(url, dymeruser) {
    return axios({
        method: "get",
        url,
        responseType: "stream",
        headers: {
            dymeruser: dymeruser
        }
    }).then(res => res.data); // ← stream
}

exports.downloadFileStream = downloadFileStream

function removeDir(path) {
    if (fs.existsSync(path)) {
        const files = fs.readdirSync(path)
        if (files.length > 0) {
            files.forEach(function(filename) {
                if (fs.statSync(path + "/" + filename).isDirectory()) {
                    removeDir(path + "/" + filename)
                } else {
                    fs.unlinkSync(path + "/" + filename)
                }
            })
            fs.rmdirSync(path)
        } else {
            fs.rmdirSync(path)
        }
    } else {
        console.error("ERROR | " + nameFile + " | Directory path not found ", path);
        logger.error(nameFile + ' | removeDir | Directory path not found  : ' + path);
    }
}

exports.removeDir = removeDir

exports.transformToJSONLD_v0 = function(hit, formModel) {
    let entity = hit._source
    const entityIndex = hit._index
    const entityId = hit._id
    const { interoperability } = formModel;

    if (!interoperability || !interoperability.enabled) {
        return entity; // Restituisce l'entità originale se l'interoperabilità non è abilitata
    }

    const metadata = interoperability.metadata || {};

    // Contesto JSON-LD di base
    const jsonLdContext = {
        "@context": {
            "dcat": "http://www.w3.org/ns/dcat#",
            "dct": "http://purl.org/dc/terms/",
            "ids": "https://w3id.org/idsa/core/",
            "vcard": "http://www.w3.org/2006/vcard/ns#"
        }
    };

    // Costruzione dell'oggetto JSON-LD
    let jsonLdObject = { ...jsonLdContext, ...entity.interoperability.mappings.dcat, ...entity.interoperability.mappings.ids };

    // Aggiungi metadati globali del dataset
    jsonLdObject["@type"] = [metadata.type || "dcat:Dataset", metadata.ids_resource || "ids:Resource"];
    if (metadata.publisher) {
        jsonLdObject["dct:publisher"] = { "@type": "vcard:Organization", "vcard:fn": metadata.publisher };
    }
    if (metadata.theme) {
        jsonLdObject["dcat:theme"] = { "@id": metadata.theme };
    }
    // Aggiungi un riferimento all'endpoint originale di DYMER
    jsonLdObject["dcat:accessURL"] = `/${entityIndex}/${entityId}`;

    return jsonLdObject;
}

exports.transformToJSONLD = function(hit, formModel) {
    let entity = hit._source;
    const entityIndex = hit._index;
    const entityId = hit._id;
    const { interoperability } = formModel;

    if (!interoperability || !interoperability.enabled) {
        return entity; 
    }

    const metadata = interoperability.metadata || {};

    // 1. Definizione dei namespace (Context)
    const jsonLdContext = {
        "@context": {
            "dcat": "http://www.w3.org/ns/dcat#",
            "dct": "http://purl.org/dc/terms/",
            "ids": "https://w3id.org/idsa/core/",
            "foaf": "http://xmlns.com/foaf/0.1/",
            "vcard": "http://www.w3.org/2006/vcard/ns#",
            "odrl": "http://www.w3.org/ns/odrl/2/"
        }
    };

    // 2. Costruzione dell'oggetto base
    // Recuperiamo i mapping predefiniti se presenti nell'entità
    const baseMappings = (entity.interoperability && entity.interoperability.mappings) ? 
                         { ...entity.interoperability.mappings.dcat, ...entity.interoperability.mappings.ids } : {};

    let jsonLdObject = { 
        ...jsonLdContext, 
        ...baseMappings 
    };

    // 3. Identità e Tipologia
    // Usiamo un URI univoco basato sull'ID di Dymer
    const baseUri = interoperability.metadata.baseUri || "https://tuo-dominio-reale.it";
    jsonLdObject["@id"] = `${baseUri}/resource/${entityId}`;
     
    jsonLdObject["@type"] = metadata.type || "dcat:DataService";

    // 4. Mapping campi DCAT-AP core
    jsonLdObject["dct:title"] = entity.title || metadata.title;
    jsonLdObject["dct:description"] = entity.description || metadata.description;
    
    // Publisher (Il DIH che offre il servizio)
    if (metadata.publisher) {
        jsonLdObject["dct:publisher"] = {
            "@type": "dct:Agent",
            "foaf:name": metadata.publisher,
            "@id": metadata.publisherId || `https://dih.eu/agent/${metadata.publisher.replace(/\s+/g, '-').toLowerCase()}`
        };
    }

    // Temi e Parole Chiave
    if (metadata.theme) {
        jsonLdObject["dcat:theme"] = { "@id": metadata.theme };
    }
    if (entity.tags) {
        jsonLdObject["dcat:keyword"] = entity.tags;
    }

    // 5. Endpoint e Accesso (Punto di accesso al servizio DIH)
    jsonLdObject["dcat:endpointURL"] = { "@id": metadata.endpointURL || `https://dymer-platform.it/api/v1/${entityIndex}/${entityId}` };

    // 6. Licenze e Policy IDSA (Il "Contract Offer")
    // Mappiamo la licenza standard DCAT
    if (metadata.license) {
        jsonLdObject["dct:license"] = { "@id": metadata.license };
    }

    // Aggiungiamo la logica IDSA per la sovranità (Contract Offer)
    // Se non definita esplicitamente, creiamo una policy di default "USE"
    jsonLdObject["ids:contractOffer"] = {
        "@type": "ids:ContractOffer",
        "@id": `https://catalog.dih.eu/contract/${entityId}`,
        "ids:permission": [{
            "@type": "ids:Permission",
            "ids:action": [{ "@id": "ids:USE" }],
            "ids:constraint": metadata.usageConstraint ? [{
                "@type": "ids:Constraint",
                "ids:leftOperand": { "@id": "ids:PURPOSE" },
                "ids:operator": { "@id": "ids:EQUALS" },
                "ids:rightOperand": { "@value": metadata.usageConstraint } // es. "Research" o "Commercial"
            }] : []
        }]
    };

    return jsonLdObject;
}