const swaggerAutogen = require( 'swagger-autogen' )( {openapi : '3.0.0'} )
require( "./config/config.js" );
const util = require( "./utility" );

const gblConfigService = global.configService;
const host = gblConfigService.ip + ":" + gblConfigService.port;	//TODO check if port exist or not
const contextPath = util.getContextPath( 'webserver' );
const serverUrl = gblConfigService.protocol + "://" + host + contextPath
//const serverUrl = "http://localhost";
/*
1. set serverUrl to domain name or IP, serverURl isn't container name ex: http://localhost
2. run swagger with right serverUrl
3. in local env run node swagger.js
4. push swagger_webserver.json
5. start dymer-webserver
*/

const doc = {
	info     : {
		version     : "1.0.0",
		title       : "DYMER API",
		description : "Dymer API Documentation"
	},
	servers  : [ {
		url         : serverUrl,
		description : "Webserver"
	}, {
		url         : serverUrl + "/api/templates",
		description : "Template server"
	}, {
		url         : serverUrl + "/api/dservice",
		description : "Service server"
	}, {
		url         : serverUrl + "/api/forms",
		description : "Form server"
	}, {
		url         : serverUrl + "/api/entities",
		description : "Entity server"
	} ],
	consumes : [ 'application/json' ],
	produces : [ 'application/json' ],
	tags     : [ {
		name        : "Webserver",
		description : "Select Webserver"
	}, {
		name        : "Templates",
		description : "Select Template server"
	}, {
		name        : "Services",
		description : "Select Service server"
	}, {
		name        : "Models",
		description : "Select Model server"
	}, {
		name        : "Entities",
		description : "Select Entity server"
	} ]
};


const outputFile = './swagger_webserver.json';

// Get all the *.js files in ./routes
const routesFolder = './routes/';
const fs = require( 'fs' );

const endpointsFiles = fs.readdirSync( routesFolder )
						 .filter( file => file.endsWith( '.js' ) )
						 .map( file => routesFolder.concat( file ) );


// adds one server.js to the beginning of an array
endpointsFiles.unshift( './server.js' );
endpointsFiles.unshift( '../dymer-templates/server.js' );
endpointsFiles.unshift( '../dymer-services/server.js' );
endpointsFiles.unshift( '../dymer-forms/server.js' );
endpointsFiles.unshift( '../dymer-entities/server.js' );
//kms_entities/server.js
console.log( "Searching endpoints in: ", endpointsFiles );

swaggerAutogen( outputFile, endpointsFiles, doc )
 // Uncomment to first automatically create SwaggerDoc and immediately after run the webserver module
// .then( () => {
// 	require( './server' )
// } )
