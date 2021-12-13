// requires
const _ = require('lodash');

// module variables
const config = require('./config.json');
const defaultConfig = config.development;
const environment = process.env.NODE_ENV || 'development';
//console.log('process.env.NODE_ENV', process.env.NODE_ENV);
//console.log('environment', environment);
const typeService = "entity"; //process.env.TYPE_SERV;
const environmentConfig = (typeService != undefined) ? config[environment]['services'][typeService] : config[environment];
const enviConfig = config[environment];
const finalConfig = _.merge(defaultConfig, enviConfig);

global.totalConfig = config[environment];
// as a best practice
// all global variables should be referenced via global. syntax
// and their names should always begin with g
//global.gConfig = finalConfig;
global.gConfig = environmentConfig;
global.globConfig = finalConfig;
console.log('config.js | config :', JSON.stringify(global.totalConfig));
// log global.gConfig
//console.log(`global.gConfig: ${JSON.stringify(global.gConfig, undefined, global.gConfig.json_indentation)}`);