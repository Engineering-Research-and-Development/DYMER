const swaggerAutogen = require( 'swagger-autogen' )( {openapi : '3.0.0'} )
require( "./config/config.js" );
const util = require( "./utility" );

const configService = global.configService;
const portExpress = configService.port;
const protocol = configService.protocol;
const contextPath = util.getContextPath( 'webserver' );
const host = configService.ip + ":" + portExpress;

const server = protocol + "://" + host + contextPath

const doc = {
	info    : {
		version     : "1.0.0",
		title       : "DYMER API",
		description : "Dymer API Documentation"
	},
	servers : [ {
		url         : server,
		description : "Webserver"
	}, {
		url         : server + "/api/templates",
		description : "Template server"
	}, {
		url         : server + "/api/dservice",
		description : "Service server"
	}, {
		url         : server + "/api/forms",
		description : "Form server"
	}, {
		url         : server + "/api/entities",
		description : "Entity server"
	} ],
	// host:                "localhost:0000",
	// basePath:            "/",
	// schemes:             ['http'],
	consumes     : [ 'application/json' ],
	produces     : [ 'application/json' ],
	docExpansion : "none",
	tags         : [ {
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

console.log( "Searching endpoints in: ", endpointsFiles );


// Manual generation of swagger documentation
swaggerAutogen( outputFile, endpointsFiles, doc );

// // Automatic generation of swagger documentation and launch of the webserver module
// swaggerAutogen( outputFile, endpointsFiles, doc ).then( () => {
// 	require( './server' )
// } )