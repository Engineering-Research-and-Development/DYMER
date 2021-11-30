var util = require('../utility');
var jsonResponse = require('../jsonResponse');
var express = require('express');
var router = express.Router();
const path = require('path');
/* GET home page. */

router.get('*', function(req, res, next) {
    var realPath = (req.originalUrl).split("?");
    //  console.log('*******************');
    //   console.log('richiesta 2', realPath[0]);
    console.log('req.originalUrl 2', req.originalUrl);
    var new__dirname = __dirname.replace('\routes', "")
        //   console.log('new__dirname', new__dirname);
        //  var fileLocationex = path.join(__dirname + "/../", realPath[0]);
        //  var temp__dirname = __dirname.replace("\routes", "");
        //   console.log('exrichiesta', fileLocationex);

    var fileLocation = path.join(new__dirname, "..", realPath[0].replace(util.getContextPath('webserver'), ""));
    //  var fileLocation = path.join(__dirname, "..", realPath[0]);
    // fileLocation = realPath[0];
    // var fileLocation = path.join(temp__dirname, realPath[0].replace(global.gConfig.services.webserver["context-path"], ""));
    //  console.log('realPath[0]', realPath[0]);
    //  fileLocation = realPath[0];
    console.log('risposta 2', fileLocation);
    res.sendFile(fileLocation);
});

module.exports = router;