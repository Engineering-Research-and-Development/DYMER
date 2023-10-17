var util = require('../utility');
var jsonResponse = require('../jsonResponse');
var express = require('express');
var router = express.Router();
var cors = require('cors');
const path = require('path');
const nameFile = path.basename(__filename);
/* GET home page. */

router.get("*", cors(), function(req, res, next) {
    //

    console.log("xxx", req._parsedUrl.pathname);

    res.sendFile(path.join(__dirname + "/../uploads" + req._parsedUrl.pathname));
    // res.sendFile(path.resolve(  "uploads"+ req._parsedUrl.pathname));

    // res.sendFile(path.resolve(__dirname+"/../"+req.originalUrl));
});

module.exports = router;