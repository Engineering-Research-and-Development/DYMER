// requires
const _ = require('lodash');

// module variables
const config = require('./config.json');
const defaultConfig = config.development;
const environment = process.env.NODE_ENV || 'development';
const typeService = "template"; //process.env.TYPE_SERV;
const environmentConfig = (typeService != undefined) ? config[environment]['services'][typeService] : config[environment];

const finalConfig = _.merge(defaultConfig, environmentConfig);
global.totalConfig = config[environment];
console.log('config.js | config :', JSON.stringify(global.totalConfig));

global.globConfig = finalConfig;
global.gConfig = environmentConfig;