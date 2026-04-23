var express = require('express');
var router = express.Router();
//var proxy = require("http-proxy-middleware");
const { createProxyMiddleware } = require('http-proxy-middleware');
const util = require("../utility");

let allowedOrigins =util.getAllowedOrigins("dymer-templates")//VL new gui
const jsonPlaceholderProxy = createProxyMiddleware({
         target: util.getServiceUrl("template"),
        changeOrigin: true, // proxy websockets
        ws: true,
        pathRewrite: function(path, req) {
            path = path.replace(util.getContextPath('webserver'), util.getContextPath('template'));
            path = path.replace("/api/templates", "");
            return path;
        },
		//VL new gui
        onProxyRes: function(proxyRes, req, res) {
            const origin = req.headers.origin;
            if (allowedOrigins.includes(origin)) {
                proxyRes.headers['Access-Control-Allow-Origin'] = origin;
                proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
            }
        }
        //VL new gui

});
router.use(
jsonPlaceholderProxy
);
 
module.exports = router;