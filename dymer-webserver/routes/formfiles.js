var express = require("express");
var router = express.Router();
var proxy = require("express-http-proxy");
const util = require("../utility");
router.use(proxy(util.getServiceUrl("form")));
module.exports = router;
