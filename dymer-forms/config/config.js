// requires
const _ = require('lodash');

// module variables
const config = require('./config.json');
const defaultConfig = config.development;
//process.env.NODE_ENV = "production";

const environment = process.env.NODE_ENV || 'development';
const typeService = 'form'; //process.env.TYPE_SERV;
//const environmentConfig = (typeService != undefined) ? config[environment]['services'][typeService] : config[environment];
const environmentConfig = config[environment];
const finalConfig = _.merge(defaultConfig, environmentConfig);
global.gConfig = finalConfig;
global.configService = finalConfig['services'][typeService];
//global.totalConfig = config[environment];
//global.globConfig = finalConfig;
//global.gConfig = environmentConfig;
// log global.gConfig
//console.log('global.globConfig:', global.globConfig); 
console.log('config.js | config :', JSON.stringify(finalConfig));
//console.log(' config[environment]:', config[environment]);
//console.log(' global.globConfig.services:', global.globConfig.services);
//console.log(' global.globConfig.services[typeServ].ip:', global.gConfig.services["dservice"].ip);