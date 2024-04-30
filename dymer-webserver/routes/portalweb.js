var express = require('express');
var router = express.Router();
const util = require("../utility");
var router = express.Router();


router.get('/login', (req, res) => {
    // #swagger.tags = ['Webserver']

    var ret = new jsonResponse();
	let callData = util.getAllQuery(req);
	let queryFind = callData.query;
	//let queryFind = (Object.keys(callData.query).length === 0) ? {} : JSON.parse(callData.query);
	//  console.log('checklogin', callData);
});