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


exports.mongoUrlLibInit = function(el) {
    let url = "mongodb://" + global.configService.repository.ip + ':' + global.configService.repository.port + "/" + global.configService.repository.index_ref;
    console.log("mongoUrlLibInit ", url);
    return url;
};