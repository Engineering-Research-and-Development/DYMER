var express = require('express');
var router = express.Router();
//var proxy = require("http-proxy-middleware");
const {createProxyMiddleware} = require('http-proxy-middleware');
const util = require("../utility");

const jsonPlaceholderProxy = createProxyMiddleware({
													   target:       util.getServiceUrl("template"),
													   changeOrigin: true, // proxy websockets
													   ws:           true,
													   pathRewrite:  function (path, req) {
														   path = path.replace(util.getContextPath('webserver'), util.getContextPath('template'));
														   path = path.replace("/api/templates", "");
														   return path;
													   }

												   });

/*

router.get('*', (req, res, next) => {
	// #swagger.tags = ['Webserver']

	next();
});

router.post('*', (req, res, next) => {
	// #swagger.tags = ['Webserver']

	next();
});

router.put('*', (req, res, next) => {
	// #swagger.tags = ['Webserver']

	next();
});

router.delete('*', (req, res, next) => {
	// #swagger.tags = ['Webserver']

	next();
});
*/


router.use(jsonPlaceholderProxy);

module.exports = router;