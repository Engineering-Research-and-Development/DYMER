var express = require('express');
var router = express.Router();
var mailCtrl = require("../controllers/mailsender.controller")


router.post(`${process.env.ENDPOINT}`, mailCtrl.sendMail);


module.exports = router;