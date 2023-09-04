const swaggerAutogen = require('swagger-autogen')({openapi: '3.0.0'})

const doc = {
    info: {
        version    : "1.0.0",
        title      : "DYMER API",
        description: "Dymer API Documentation"

    },

    servers: [
        {
            url        : "http://localhost:8080/dymergui",
            description: "Webserver"
        },
        {
            url        : "http://localhost:8080/dymergui/api/templates",
            description: "Template server"
        },
        {
            url        : "http://localhost:8080/dymergui/api/dservice",
            description: "Service server"
        },
        {
            url        : "http://localhost:8080/dymergui/api/forms",
            description: "Form server"
        },
        {
            url        : "http://localhost:8080/dymergui/api/entities",
            description: "Entity server"
        }
    ],

    consumes           : ['application/json'],
    produces           : ['application/json'],
    docExpansion       : "none",
    tags               : [
        {
            "name": "Webserver",
            "description": "Select Webserver"
        }, {
            "name"       : "Templates",
            "description": "Select Template server"
        }, {
            "name": "Services",
            "description": "Select Service server"
        }, {
            "name"       : "Models",
            "description": "Select Model server"
        }, {
            "name"       : "Entities",
            "description": "Select Entity server"
        },
    ],
    securityDefinitions: {
        apiKeyAuth: {
            type       : 'apiKey',
            in         : 'cookie', // can be 'header', 'query' or 'cookie'
            name       : 'lll', // name of the header, query parameter or cookie
            description: 'Cookie'
        }
    }
};


const outputFile = './swagger_webserver.json';

//Get all the *.js files in ./routes
const routesFolder = './routes/';
const fs = require('fs');

const endpointsFiles = fs.readdirSync(routesFolder)
                         .filter(file => file.endsWith('.js'))
                         .map(file => routesFolder.concat(file));


//adds one server.js to the beginning of an array
endpointsFiles.unshift('./server.js');
endpointsFiles.unshift('../dymer-templates/server.js');
endpointsFiles.unshift('../dymer-services/server.js');
endpointsFiles.unshift('../dymer-forms/server.js');
endpointsFiles.unshift('../dymer-entities/server.js');

console.log("Searching endpoints in: ", endpointsFiles);


swaggerAutogen(outputFile, endpointsFiles, doc);/*.then(() => {
    require('./server')
})*/