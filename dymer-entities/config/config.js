// requires
const _ = require('lodash');
const path = require('path');
const nameFile = path.basename(__filename);
const logger = require('../routes/dymerlogger');
// module variables
const config = require('./config.json');
const defaultConfig = config.development;
const environment = process.env.NODE_ENV || 'development';
const dymer_uuid = (process.env.DYMER_UUID == undefined) ? 'basedym' : process.env.DYMER_UUID;
//console.log('process.env.NODE_ENV', process.env.NODE_ENV);
console.log('process.env.DYMER_UUID', dymer_uuid);
//console.log('environment', environment);
const typeService = "entity"; //process.env.TYPE_SERV;
global.dymer_uuid = dymer_uuid;
const environmentConfig = config[environment];
const finalConfig = _.merge(defaultConfig, environmentConfig);
global.gConfig = finalConfig;
global.configService = finalConfig['services'][typeService];
// as a best practice   
// all global variables should be referenced via global. syntax
// and their names should always begin with g
console.log('config.js | config :', JSON.stringify(finalConfig));
logger.info(nameFile + ' | config :' + JSON.stringify(finalConfig));
//console.log(`global.gConfig: ${JSON.stringify(global.gConfig, undefined, global.gConfig.json_indentation)}`);