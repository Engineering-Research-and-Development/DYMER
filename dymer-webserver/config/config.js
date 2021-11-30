// requires
const _ = require('lodash');
//require('dotenv').config();
// module variables
const config = require('./config.json');
const defaultConfig = config.development;
const environment = process.env.NODE_ENV || 'development';
//console.log('process.env.NODE_ENV', process.env.NODE_ENV);
const environmentConfig = config[environment];
const finalConfig = _.merge(defaultConfig, environmentConfig);
global.totalConfig = config[environment];
// as a best practice
// all global variables should be referenced via global. syntax
// and their names should always begin with g
global.gConfig = finalConfig;

// log global.gConfig
//console.log(`global.gConfig: ${JSON.stringify(global.gConfig, undefined, global.gConfig.json_indentation)}`);
/*
if (process.env.DYMER_CONTEXT_PATH) {
	global.gConfig.services["webserver"]["context-path"] = process.env.DYMER_CONTEXT_PATH;
	console.log('Changed webserver context-path -> ' + global.gConfig.services["webserver"]["context-path"]);
}*/