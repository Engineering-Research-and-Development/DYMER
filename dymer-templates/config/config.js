// requires
const _ = require('lodash');

// module variables
const config = require('./config.json');
const defaultConfig = config.development;
const environment = process.env.NODE_ENV || 'development';
const typeService = "template"; //process.env.TYPE_SERV;
//const environmentConfig = (typeService != undefined) ? config[environment]['services'][typeService] : config[environment];
const environmentConfig = config[environment];
const finalConfig = _.merge(defaultConfig, environmentConfig);
global.gConfig = finalConfig;
global.configService = finalConfig['services'][typeService];
//global.totalConfig = config[environment];
//global.globConfig = finalConfig;
//global.gConfig = environmentConfig;
console.log('config.js | config :', JSON.stringify(finalConfig));