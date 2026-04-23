 
var jsonResponse = require('../jsonResponse');
var express = require('express');
var fs = require('fs');
var router = express.Router();
 
const multer = require('multer');
const bodyParser = require("body-parser");
const path = require('path');
 
const axios = require('axios');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.post('/dohtmlpage', function(req, res) {
    
     var page = req.body.page;

     var fileName =  "public/cdn/js/iframe/"+req.body.config.modeltoAdd+'_'+req.body.dview+'.html';
     var stream = fs.createWriteStream(fileName);
     
     stream.once('open', function(fd) {
                if ( stream.end(page)) {  
                      res.sendStatus(200); 
                    
                } 
                else {
                    console.error('Error:Wrong dopage');

                    res.status(401);
                    res.send('Wrong dopage');
                }
     });
});

module.exports = router;