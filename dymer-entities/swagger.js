const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        version: "1.0.0",
        title: "DYMER API",
        description: "Documentation of <b>Entities</b> module."
    },
    host: "localhost:0000",
    basePath: "/",
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: []
};


const outputFile = './swagger_entities.json';

//Get all the *.js files in ./routes
const routesFolder = './routes/';
const fs = require('fs');
const endpointsFiles = fs.readdirSync(routesFolder)
    .filter(file => file.endsWith('.js'))
    .map(file => routesFolder.concat(file));

//adds one server.js to the beginning of an array
endpointsFiles.unshift('./server.js');

console.log("Searching endpoints in: ", endpointsFiles);

swaggerAutogen(outputFile, endpointsFiles, doc);