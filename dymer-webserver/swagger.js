const swaggerAutogen = require('swagger-autogen')({openapi: '3.0.0'})

const doc = {
    info: {
        version    : "1.0.0",
        title      : "DYMER API",
        // description: "<a href=http://localhost:8080/dymergui/api/doc/> Webserver Documentation </a><br>" +
        //     "<a href=http://localhost:4545/api/doc/> Template Documentation </a><br>" +
        //     "<a href=http://localhost:5050/api/doc/> Service Documentation </a><br>" +
        //     "<a href=http://localhost:4747/api/doc/> Form Documentation </a><br>" +
        //     "<a href=http://localhost:1358/api/doc/> Entity Documentation </a><br>" +
        //     "<script>console.log('pippo')</script>"

        description: "Dymer API Documentation"

    },
    /*host               : "localhost:8080",
    basePath           : "/dymergui",
    schemes            : ['http'],*/

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
            // "description": "<a href=http://localhost:8080/dymergui/api/doc/> Webserver Documentation</a>"
            // "description": '<button onclick=\'document.querySelector("div.scheme-container select").selectedIndex=0;\'> Webserver Documentation </button>'
            "description": "Select Webserver"
        }, {
            "name"       : "Templates",
            // "description": "<div onclick='document.querySelector(\"div.scheme-container select\").selectedIndex=0;'" +
            //     " href=#/Templates> Template Documentation       </>"
            "description": "Select Template server"
        }, {
            "name": "Services",
            // "description": "<a href=http://localhost:5050/api/doc/> Service Documentation        </a>"
            // "description": "<a href='http://localhost:8080/dymergui/api/doc/'> Service Documentation        </a>"
            "description": "Select Service server"
        }, {
            "name"       : "Forms",
            // "description": "<a onclick='' href=http://localhost:4747/api/doc/> Form Documentation               </a>"
            "description": "Select Form server"
        }, {
            "name"       : "Entities",
            // "description": "<a href=http://localhost:1358/api/doc/> Entity Documentation           </a>"
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
    /*definitions        : {
        User      : {
            name       : "Jhon Doe", age: 29, parents: {
                father: "Simon Doe", mother: "Marie Doe"
            }, diplomas: [
                {
                    school: "XYZ University", year: 2020, completed: true, internship: {
                        hours: 290, location: "XYZ Company"
                    }
                }
            ]
        }, AddUser: {
            $name: "Jhon Doe", $age: 29, about: ""
        }
    }*/
};


const outputFile = './swagger_webserver.json';

//Get all the *.js files in ./routes
const routesFolder = './routes/';
const fs = require('fs');

// const endpointsFiles = ['./server.js'];

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