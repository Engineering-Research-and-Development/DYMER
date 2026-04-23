var jsonResponse = require('../jsonResponse');
var express = require('express');
const OAuth2 = require('./oauth2').OAuth2;
var router = express.Router();
//var proxy = require("http-proxy-middleware");

const util = require("../utility");
const axios = require('axios');
const bodyParser = require("body-parser");

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: false,
    limit: '100MB'
}));

const oa = new OAuth2(global.gConfig.services.webserver.idm.clientID,
    global.gConfig.services.webserver.idm.clientSecret,
    global.gConfig.services.webserver.idm.baseSite,
    global.gConfig.services.webserver.idm.internalSite,
    global.gConfig.services.webserver.idm.authorizationURL,
    global.gConfig.services.webserver.idm.tokenURL,
    global.gConfig.services.webserver.idm.callbackURL, {},
    global.gConfig.services.webserver.idm.xtokenURL
);

router.post('/login',

    function(req, res) {
        var ret = new jsonResponse();
        ret.setSuccess(false);
        // ret.setMessages("Invalid Credential. Please double-check and try again. ");
        // console.log('AAAAAAAAAAAAAAAAA');
        let body = req.body;
        let params = req.params;
        let query = req.query;
        // const path = oa.getAuthorizeUrl("code");
        oa.getOAuthPasswordCredentialsUser(body.username, body.password).then(function(ars) {
            ret.setSuccess(true);
            ret.setMessages("Valid Credential!");
            ret.setData(ars);
            console.log('ars', ars);
            return res.send(ret);
        }).catch(function(err) {
            console.log('err ars', err);
            ret.setMessages('Invalid grant: user credentials are invalid');
            return res.send(ret);
        });
        console.log('tentato login');
        console.log('body  ', body);
        console.log('params  ', params);
        console.log('query  ', query);
        // console.log('path', path);
        // console.log('res', res);

    });

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

router.post('/logout', (req, res) => {
    var ret = new jsonResponse();
    ret.setSuccess(false);
    let body = req.body;
    let params = req.params;
    let query = req.query;
    console.log('body', body);
    oa.logoutfromToken(body.token).then(function(ars) {
        ret.setSuccess(true);
        ret.setMessages("Correct Logout!");
        console.log('ars', ars);
        return res.send(ret);
    }).catch(function(err) {
        console.log('err ars', err);
        ret.setMessages('Invalid logout');
        return res.send(ret);
    });

});

router.post('/userinfo', (req, res) => {
    var ret = new jsonResponse();
    ret.setSuccess(false);
    // ret.setMessages("Invalid Credential. Please double-check and try again. ");
    console.log('userinfo');
    let body = req.body;
    let params = req.params;
    let query = req.query;
    console.log('body', body);
    oa.getUserDetailInfoByToken(body.token).then(function(ars) {
        //  oa.getUserInfoByToken(body.token).then(function(ars) {
        console.log('CHECK ars', ars);
        ret.setSuccess(true);
        ret.setData(JSON.parse(ars));
        res.send(ret);
    }).catch(function(err) {
        //    console.log('CHECK err ars', err);
        res.end();
    });
});

router.post('/refreshtoken', (req, res) => {
    var ret = new jsonResponse();
    ret.setSuccess(false);
    // ret.setMessages("Invalid Credential. Please double-check and try again. ");
    console.log('refreshtoken');
    let body = req.body;
    let params = req.params;
    let query = req.query;
    oa.refreshToken(body.token).then(function(ars) {
        console.log('CHECK ars', ars);
        ret.setSuccess(true);
        ret.setData(JSON.parse(ars));
        res.send(ret);
    }).catch(function(err) {
        console.log('CHECK err ars');
        res.end();
    });
});

router.post('/tokeninfo', (req, res) => {
    var ret = new jsonResponse();
    ret.setSuccess(false);
    // ret.setMessages("Invalid Credential. Please double-check and try again. ");
    console.log('tokeninfo');
    let body = req.body;
    let params = req.params;
    let query = req.query;
    oa.getTokenInfo(body.token).then(function(ars) {
        console.log('CHECK tokeninfo', ars);
        ret.setSuccess(true);
        ret.setData(JSON.parse(ars));
        res.send(ret);
    }).catch(function(err) {
        console.log('CHECK err tokeninfo', err);
        res.send(ret);
    });

});

router.post('/getOAuthClientCredentials', (req, res) => {
    var ret = new jsonResponse();
    ret.setSuccess(false);
    // ret.setMessages("Invalid Credential. Please double-check and try again. ");
    console.log('tokeninfo');
    let body = req.body;
    let params = req.params;
    let query = req.query;
    oa.getOAuthClientCredentials(body.token).then(function(ars) {
        console.log('CHECK getOAuthClientCredentials', ars);
        ret.setSuccess(true);
        ret.setData(JSON.parse(ars));
        res.send(ret);
    }).catch(function(err) {
        console.log('CHECK err getOAuthClientCredentials', err);
        res.send(ret);
    });

});

router.post('/userinfobyadmin', (req, res) => {
    var ret = new jsonResponse();
    ret.setSuccess(false);
    // ret.setMessages("Invalid Credential. Please double-check and try again. ");
    console.log('userinfo');
    let body = req.body;
    let params = req.params;
    let query = req.query;

    var uid = '413c7231-e03c-46e0-b86d-6326d41d9e8e';
    oa.getUserInfoByAdmin('/v1/users/', body.token, uid).then(function(ars) {
        console.log('ss ars', ars);

    }).catch(function(err) {
        console.log('CHECK err ars', err);

    });

    res.end();
});

router.post('/test1', (req, res) => {
    var ret = new jsonResponse();
    ret.setSuccess(false);
    // ret.setMessages("Invalid Credential. Please double-check and try again. ");
    console.log('organizations');
    let body = req.body;
    let params = req.params;
    let query = req.query;

    oa.getTest('/v1/organizations', body.token).then(function(ars) {
        console.log('cck', ars);

    }).catch(function(err) {
        console.log('CHECK err ars', err);

    });

    res.end();
});

router.post('/callback', (req, res) => {
    console.log('post(111example/callback');
});

router.get('/callback', (req, res) => {
    console.log('get(111example/callback');
});

router.post('/example/callback', (req, res) => {
    console.log('post(example/callback');
});

router.get('/example/callback', (req, res) => {
    console.log('get(example/callback');
});

module.exports = router;