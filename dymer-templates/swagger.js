const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info    : {
        version    : "1.0.0",
        title      : "DYMER API",
        description: "<a href=http://localhost:8080/dymergui/api/doc/> Webserver Documentation </a><br>" +
            "<a href=http://localhost:4545/api/doc/> Template Documentation </a><br>" +
            "<a href=http://localhost:5050/api/doc/> Service Documentation </a><br>" +
            "<a href=http://localhost:4747/api/doc/> Form Documentation </a><br>" +
            "<a href=http://localhost:1358/api/doc/> Entity Documentation </a><br>"
    },
    host    : "localhost:4545",
    basePath: "/",
    schemes : ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
    tags    : [
        {
            "name"       : "Webserver",
            "description": "<a href=http://localhost:8080/dymergui/api/doc/> Webserver Documentation</a>"
        }, {
            "name"       : "Templates",
            "description": "<a href=http://localhost:4545/api/doc/> Template Documentation       </a>"
        }, {
            "name"       : "Services",
            "description": "<a href=http://localhost:5050/api/doc/> Service Documentation         </a>"
        }, {
            "name"       : "Forms",
            "description": "<a href=http://localhost:4747/api/doc/> Form Documentation              </a>"
        }, {
            "name"       : "Entities",
            "description": "<a href=http://localhost:1358/api/doc/> Entity Documentation           </a>"
        },
    ]
};


const outputFile = './swagger_templates.json';

//Get all the *.js files in ./routes
const routesFolder = './routes/';
const fs = require('fs');

// const endpointsFiles = fs.readdirSync(routesFolder)
//                          .filter(file => file.endsWith('.js'))
//                          .map(file => routesFolder.concat(file))
//                          .concat('./server.js');

const endpointsFiles = ['./server.js'];

console.log("Searching endpoints in: ", endpointsFiles);

swaggerAutogen(outputFile, endpointsFiles, doc);