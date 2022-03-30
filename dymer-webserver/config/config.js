// requires
const _ = require('lodash');
//require('dotenv').config();
// module variables
const config = require('./config.json');
const defaultConfig = config.development;
const environment = process.env.NODE_ENV || 'development';
const typeService = "webserver"; //process.env.TYPE_SERV;
console.log('process.env.NODE_ENV', process.env.NODE_ENV);
console.log('process.env.DYMER_CONTEXT_PATH', process.env.DYMER_CONTEXT_PATH);
if (process.env.DYMER_CONTEXT_PATH != undefined) {
    config[environment].services[typeService]["context-path"] = process.env.DYMER_CONTEXT_PATH;
    // config[environment].services[typeService]["context-path"] = "/" + process.env.DYMER_CONTEXT_PATH;
    console.log('Changed webserver context-path -> ', config[environment].services[typeService]["context-path"]);
}
const environmentConfig = config[environment];
const finalConfig = _.merge(defaultConfig, environmentConfig);

//global.totalConfig = config[environment];
//global.totalConfig = finalConfig;
// as a best practice
// all global variables should be referenced via global. syntax
// and their names should always begin with g
global.gConfig = finalConfig;
global.configService = finalConfig['services'][typeService];
//console.log('global.totalConfig', global.totalConfig);
let gConfigcloned = JSON.parse(JSON.stringify(finalConfig));
gConfigcloned['services'][typeService].adminPass = "*****";
console.log('config.js | config :', JSON.stringify(gConfigcloned));

// log global.gConfig
//console.log(`global.gConfig: ${JSON.stringify(global.gConfig, undefined, global.gConfig.json_indentation)}`);