const swaggerAutogen = require('swagger-autogen')();

const doc = {
	info:                {
		version:     "1.0.0",
		title:       "DYMER API",
		description: "Documentation of <b>Webserver</b> module."
	},
	host:                "localhost:0000",
	basePath:            "/",
	schemes:             ['http', 'https'],
	consumes:            ['application/json'],
	produces:            ['application/json'],
	tags:                [
		{
			"name":        "Webserver",
			"description": "Test Endpoints"
		},
		{
			"name":        "Templates",
			"description": "Test Endpoints"
		},
		{
			"name":        "Services",
			"description": "Test Endpoints"
		},
		{
			"name":        "Forms",
			"description": "Test Endpoints"
		},
		{
			"name":        "Entities",
			"description": "Test Endpoints"
		},
	],
	securityDefinitions: {
		api_key:       {
			type: "apiKey",
			name: "api_key",
			in:   "header"
		},
		petstore_auth: {
			type:             "oauth2",
			authorizationUrl: "https://petstore.swagger.io/oauth/authorize",
			flow:             "implicit",
			scopes:           {
				read_pets:  "read your pets",
				write_pets: "modify pets in your account"
			}
		}
	},
	/*definitions        : {
		User   : {
			name    : "Jhon Doe",
			age     : 29,
			parents : {
				father: "Simon Doe",
				mother: "Marie Doe"
			},
			diplomas: [
				{
					school    : "XYZ University",
					year      : 2020,
					completed : true,
					internship: {
						hours   : 290,
						location: "XYZ Company"
					}
				}
			]
		},
		AddUser: {
			$name: "Jhon Doe",
			$age : 29,
			about: ""
		}
	}*/
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