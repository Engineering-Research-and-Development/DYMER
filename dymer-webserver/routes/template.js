var express = require('express');
var router = express.Router();
//var proxy = require("http-proxy-middleware");
const { createProxyMiddleware } = require('http-proxy-middleware');
const util = require("../utility");

const jsonPlaceholderProxy = createProxyMiddleware({
         target: util.getServiceUrl("template"),
        changeOrigin: true, // proxy websockets
        ws: true,
        pathRewrite: function(path, req) {
            path = path.replace(util.getContextPath('webserver'), util.getContextPath('template'));
            path = path.replace("/api/templates", "");
            return path;
        }

});
router.use(
jsonPlaceholderProxy
);
 
module.exports = router;