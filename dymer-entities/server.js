//const qs = require('qs');
//var util = require('./utility');
var jsonResponse = require('./jsonResponse');
const express = require("express");
//process.env.NODE_ENV = "development";
//process.env.TYPE_SERV = "entity";
require("./config/config.js");
const util = require("./utility");
//const path = require("path");
//var elastic = require('elasticsearch');  
//const bodyParser = require("body-parser");
const app = express();
const portExpress = global.configService.port; //4646;
//const axios = require("axios");

/*app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));*/
var routes = require('./routes/routes-v2');
//var routestest = require('./routes/routestest');
var publicRoutes = require('./routes/publicfiles');
//app.use("/uploads", express.static(path.join(__dirname, 'uploads')));
//app.use(express.static(__dirname+'/uploads'));

var cors = require('cors');

app.use(cors());
/*app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
}); */
function detectPermission(req, res, next) {
    /* console.log("controllo", );
     console.log("req.ip", req.ip);
     console.log("req.originalurl", req.originalurl);
     console.log("req.path", req.path);
     console.log("req.query", req.query);
     console.log("req.params", req.params);
     console.log("req.method", req.method);
     console.log("req.cookies", req.cookies);
     console.log("req.session", req.session);*/
    next();
    /*   console.log("req.header", req.headers);
       const authHeader = req.headers.authorization;
       const token = authHeader && authHeader.split(' ')[1]
       //var pp = jwt.decode(JSON.parse(token));
       var ret = new jsonResponse();
       var pp = jwt.decode(token);
       console.log("req.method", req.method);
       console.log("req.query", req.query);
       console.log("req.params", req.params);
       console.log("------------------");
       console.log("req.token", pp);
    
       var act = "";
       var index = "";
       var roles = [];
       var queryString = "";
   
       // if (pp) {
       var method = req.method;
       //  act = (method == "GET") ? "create" : (method == "POST") ? "val2" : (method == "PUT") ? "val2" : (method == "DELETE") ? "val2" : "";
       act = "create";
       if ((req.path).includes("/content/")) {
           var tmpSplit = (req.path).split("/");;
           index = tmpSplit[2];
       } else {
           index = req.query.query['instance._index'];
       }
       if (pp) {
           roles = pp.realm_access.roles;
           if (roles.indexOf("app-admin"))
               roles.push("app-admin");
       }
       roles.push("app-guest");
       if (roles.indexOf("app-admin")) {
           next();
   
   
       } else {
           queryString = "?role[]=" + roles.join("&role[]=");
           var url = 'http://localhost:5050/api/v1/perm/entityrole/';
           url += act + "/";
           url += index + "/";
           url += queryString; 
           console.log("url", url);
           axios.get(url)
               .then((response) => {
                   console.log("PRM", response.data.data.result);
                   if (response.data.data.result) {
                       console.log("prosegui", req.path);
                       next();
                   } else {
                       console.log("stop", req.path);
                       ret.setMessages("No permission");
                       res.status(200);
                       ret.setSuccess(false);
                       return res.send(ret);
                   }
               }, (error) => {
                   console.log(error);
   
                   ret.setMessages("No permission");
                   res.status(200);
                   ret.setSuccess(false);
                   return res.send(ret);
               });
        
       }
   */
}

app.use(util.getContextPath('entity') + "/api/v1/entity/uploads/", publicRoutes);
app.use(util.getContextPath('entity') + '/api/v1/entity', routes);
//app.use(util.getContextPath('entity') + '/api/endpointtest', routestest);
app.get(util.getContextPath('entity') + "/", (req, res) => {
    // res.sendFile(path.resolve(__dirname, "usr/share/www/html/", "index.html"));
    res.send("this is    our main andpoint Entities");
});

app.get(util.getContextPath('entity') + "/*", (req, res) => {
    var ret = new jsonResponse();
    ret.setMessages("Api error 404");
    res.status(404);
    ret.setSuccess(false);
    return res.send(ret);
});
app.listen(portExpress, () => {
    console.log("Up and running-- this is " + global.configService.app_name + " service on port:" + global.configService.port + " context-path: " + util.getContextPath('entity'));
});