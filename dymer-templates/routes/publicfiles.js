var util = require('../utility');
var jsonResponse = require('../jsonResponse');
var express = require('express');
var router = express.Router();
const path = require('path');
const nameFile = path.basename(__filename);

router.get('*', function(req, res, next) {

    console.log(nameFile + ' | get  :', req._parsedUrl.pathname);
    res.setHeader('Cache-Control', 'public, max-age=31557600');
    res.sendFile(path.join(__dirname + "/../uploads" + req._parsedUrl.pathname));
    // res.sendFile(path.resolve(  "uploads"+ req._parsedUrl.pathname));
    // res.sendFile(path.resolve(__dirname+"/../"+req.originalUrl));
});

module.exports = router;