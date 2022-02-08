var express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
var router = express.Router();
const axios = require('axios');
const bodyParser = require("body-parser");

const rrmApi = process.env.RRM_API;

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: false,
    limit: '100MB'
}));

// // let localhost = 'http://localhost:17100';
// let engCloud = 'https://deh-demeter.eng.it/pep-proxy';
// let rrmApi = 'https://acs.bse.h2020-demeter-cloud.eu:1029';



const options = {
    target: rrmApi,
    changeOrigin: true, 
    toProxy: true,
    pathRewrite: {
        '^/api/attachment/downloadContent': '/api/v1/attachment/download',
        '^/api/attachment/getContent': '/api/v1/attachment/content',
        '^/api/attachment/count': '/api/v1/attachment/counter',
    },
    onProxyReq: function (proxyReq, req, res) {
        proxyReq.setHeader('Content-Type', 'application/json');
    }
};

const attachmentProxy = createProxyMiddleware(options);

router.use(
    attachmentProxy
);

module.exports = router;

