var express = require("express");
var router = express.Router();
var proxy = require("express-http-proxy");
//require("../config/config.js");
//router.use(proxy(global.gConfig.services.form.ip_port));
const util = require("../utility");
router.use(proxy(util.getServiceUrl("form")));
module.exports = router;
