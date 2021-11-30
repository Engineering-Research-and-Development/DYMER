var jsonResponse = require('./jsonResponse');
const express = require("express");
//process.env.NODE_ENV = "development";
//process.env.TYPE_SERV = "form";
const util = require("./utility");
const path = require("path");
var cors = require('cors');
const bodyParser = require("body-parser");
const app = express();
const jwt = require('jsonwebtoken');
const axios = require('axios');
var cookieParser = require('cookie-parser');
const nameFile = path.basename(__filename);
require("./config/config.js");
/*app.all('/', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});*/
const portExpress = global.gConfig.port;
var routes = require('./routes/routes-v1');
var publicRoutes = require('./routes/publicfiles');
//app.use(cors());
app.use(cookieParser());
app.use(function(req, res, next) {
    /* res.header("Access-Control-Allow-Origin", "*");
     res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
     res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type,Cache-Control");*/
    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        return res.end();
    } else {
        return next();
    }
});

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
    //console.log("req.header", req.headers);
    // let cookie = req.cookies['ilmiocookie2'];
    // console.log("cookieMIO", req.headers);
    const hdymeruser = req.headers.dymeruser;
    var dymeruser;
    if (hdymeruser == undefined)
        dymeruser = JSON.parse(Buffer.from(req.cookies["lll"], 'base64').toString());
    else
        dymeruser = JSON.parse(Buffer.from(hdymeruser, 'base64').toString('utf-8'));
    var urs_uid = dymeruser.id;
    var urs_gid = dymeruser.gid;
    //console.log(nameFile + ' | detectPermission | dymeruser:', JSON.stringify(dymeruser));
    /*  console.log("req.cookies", req.cookies);
      const authHeader = req.headers.authorization;
      console.log("super authHeader", authHeader); //lll
      var token = authHeader && authHeader.split(' ')[1]
      var isKL = false;
      var maybenous = false;
      console.log("PRE.tokenAAA", token);
      if (token == undefined || req.cookies != {}) {
          if (req.cookies["lll"] != undefined) {
              token = req.cookies["lll"];
              // isKL = true;
          }
      }
      if (token == undefined || token == 'null')
          maybenous = true;
      console.log("PRE.token", token);
      console.log("maybenous", maybenous);
      console.log("isKL", isKL);*/
    /*if (req.cookies["lll"] != undefined) {
        token = req.cookies["lll"];
        isKL = true;
    }*/
    //var pp = jwt.decode(JSON.parse(token));
    var ret = new jsonResponse();
    /*  var pp = undefined;
      if (maybenous == false) {
          if (isKL) { pp = jwt.decode(token); } else {
              if (token != undefined) {
                  pp = JSON.parse(Buffer.from(token, 'base64').toString());
  
              }
  
          }
  
      }
  */
    // console.log("req.path", req.path);
    //console.log("req.method", req.method);

    //console.log("req.params", req.params);

    /*  console.log("req.token", pp);*/
    //console.log("------------------");
    /*axios.post('http://localhost:8080/api/dservice/api/v1/perm/entityrole/view/index1?role[]=app-user&role[]=app-admin', {
            firstName: 'Finn',
            lastName: 'Williams'
        }) */
    var act = "";
    var index = "";
    var roles = dymeruser.roles;
    var queryString = "";

    // if (pp) {
    var method = req.method;
    //  act = (method == "GET") ? "create" : (method == "POST") ? "val2" : (method == "PUT") ? "val2" : (method == "DELETE") ? "val2" : "";

    /*  if (pp) {
          if (isKL) {
              roles = pp.realm_access.roles;
          } else {
              pp.roles.forEach(element => {
                  roles.push(element.role);
              });
          }
  
          //   if (roles.indexOf("app-admin"))
          //        roles.push("app-admin");
      }
      roles.push("app-guest");*/
    var tocont = false;
    if (req.query.dmts != undefined)
        tocont = true;
    if (roles.indexOf("app-admin") > -1 || tocont) {
        next();
    } else {
        act = "create";
        if ((req.path).includes("/content/")) {
            var tmpSplit = (req.path).split("/");;
            index = tmpSplit[2];
        } else {
            if (req.query.query != undefined) {
                index = req.query.query["instance._index"];
            }

        }
        queryString = "?role[]=" + roles.join("&role[]=");
        // var url = 'http://localhost:5050/api/v1/perm/entityrole/';
        //    url = 'http://kms_services:5050/api/v1/perm/entityrole/';
        var url = util.getServiceUrl("dservice") + "/api/v1/perm/entityrole/";
        url += act + "/";
        url += index + "/";
        url += queryString;
        if (index == "") {
            ret.setMessages("No permission");
            res.status(200);
            ret.setSuccess(false);
            return res.send(ret);
        }
        axios.get(url)
            .then((response) => {
                //console.log(nameFile + ' | detectPermission | permission ' + act + ':', dymeruser.id, JSON.stringify(roles), JSON.stringify(response.data.data.result));
                if (response.data.data.result || req.query.act == "update") {
                    next();
                } else {
                    console.log(nameFile + ' | detectPermission | permission ' + act + ':', dymeruser.id, JSON.stringify(roles), JSON.stringify(response.data.data.result));
                    //console.log("stop", req.path);
                    ret.setMessages("No permission");
                    res.status(200);
                    ret.setSuccess(false);
                    return res.send(ret);
                }
            }, (error) => {
                console.error("ERROR | " + nameFile + ' | detectPermission : ', error);
                ret.setMessages("No permission");
                res.status(200);
                ret.setSuccess(false);
                return res.send(ret);
            });
    }
}

app.use(util.getContextPath('form') + "/api/v1/form/uploads/", publicRoutes);
app.use(util.getContextPath('form') + '/api/v1/form', detectPermission, routes);
app.get(util.getContextPath('form') + "/*", (req, res) => {
    var ret = new jsonResponse();
    console.error('ERROR | /* : ', "Api error 404", req.path);
    ret.setMessages("Api error 404");
    res.status(404);
    ret.setSuccess(false);
    return res.send(ret);
});
//module.exports = app;
app.listen(portExpress, () => {
    console.log("Up and running-- this is " + global.gConfig.app_name + " service on port:" + global.gConfig.port + " context-path :" + util.getContextPath('form'));
});