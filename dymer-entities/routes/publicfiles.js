var express = require('express');
var router = express.Router();
const path = require('path');
/* GET home page. */


router.get('*', function(req, res, next) {
    res.sendFile((__dirname + "/../uploads" + req._parsedUrl.pathname));
});

module.exports = router;