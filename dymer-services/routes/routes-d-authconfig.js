var jsonResponse = require("../jsonResponse");
var util = require("../utility");
//var FormData = require('form-data');
var http = require("http");
var express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const nameFile = path.basename(__filename);
const mongoose = require("mongoose");
require("./mongodb.js");
var router = express.Router();
var jsonParser = bodyParser.json();
//var GridFsStorage = require("multer-gridfs-storage");
require("../models/permission/DymerAuthenticationRule");
const DymRule = mongoose.model("DymerAuthenticationRule");
const axios = require("axios");
const session = require("express-session");

const logger = require("./dymerlogger");
router.use(bodyParser.json());
router.use(
  bodyParser.urlencoded({
    extended: false,
    limit: "100MB",
  })
);

const acsServer =
  process.env.ACS_SERVER || "https://acs.bse.h2020-demeter-cloud.eu:3030";
const rrmApi = process.env.RRM_API || "https://deh-demeter.eng.it/pep-proxy";

/*
const mongoURI = util.mongoUrlForm();
console.log(nameFile + ' | mongoURI :', JSON.stringify(mongoURI));
var db;
mongoose
    .connect(mongoURI, {
        // useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(x => {
        console.log(nameFile + ` | Connected to Mongo! Database name: "${x.connections[0].name}"`);
        db = x.connections[0].db;
    })
    .catch(err => {
        console.error("ERROR | " + nameFile + ` | Error connecting to mongo! Database name: "${x.connections[0].name}"`, err);
    });
*/
router.get("/", util.checkIsAdmin, (req, res) => {
  var ret = new jsonResponse();
  let callData = util.getAllQuery(req);
  let data = callData.data;
  var queryFind = {};
  DymRule.find(queryFind)
    .then((els) => {
      ret.setMessages("List");
      ret.setData(els);
      return res.send(ret);
    })
    .catch((err) => {
      if (err) {
        console.error(err);
        logger.error(nameFile + " | get/ | : " + err);
        ret.setMessages("Get error");
        ret.setSuccess(false);
        ret.setExtraData({ log: err.stack });
        return res.send(ret);
      }
    });
});

router.get("/userinfo", (req, res) => {
  var ret = new jsonResponse();
  let data = req.body;
  var mygid = 0;
  let extradata = {};
  if (
    data.dymtoExtraInfo != undefined &&
    data.dymtoExtraInfo != "undefined" &&
    data.dymtoExtraInfo != null &&
    data.dymtoExtraInfo != "null"
  ) {
    extradata = JSON.parse(
      Buffer.from(data.dymtoExtraInfo, "base64").toString()
    );
    mygid = extradata.extrainfo.groupId;
  }
  var objuser = {
    roles: ["app-guest"],
    id: "guest@dymer.it",
    app_id: "",
    gid: mygid,
    email: "guest@dymer.it",
    extrainfo: {
      companyId: "dymer",
      groupId: "1",
      cms: "lfr",
      userId: "0",
      emailAddress: "guest@dymer.it",
    },
    username: "guest@dymer.it",
  };
  var queryFind = { host: data.referer, active: true };
  //  console.log('infouse', queryFind);
  /* DymRule.find({}).then((els) => {
         console.log('DymRule all', els);
     });*/
  DymRule.find(queryFind)
    .then((els) => {
      //   console.log('DymRule', els);
      if (els.length || data.idsadm) {
        var el = els[0];
        // console.log('el', el);
        let authtype = el == undefined ? "" : el.authtype;
        if (authtype == "jwtparent" || data.idsadm) {
          var token = data.DYM;
          if (token != undefined && token != "null" && token != null) {
            var decoded = JSON.parse(Buffer.from(token, "base64").toString());
            // console.log('decoded', decoded);
            objuser.email = decoded.email;
            objuser.id = decoded.email;
            if (decoded.hasOwnProperty("extrainfo")) {
              objuser.gid = decoded.extrainfo.groupId;
              //objuser.extrainfo = decoded.extrainfo;
              objuser.extrainfo = {
                ...objuser.extrainfo,
                ...decoded.extrainfo,
              };
            }
            if (!(Object.entries(extradata).length === 0)) {
              objuser.extrainfo = {
                ...objuser.extrainfo,
                ...extradata.extrainfo,
              };
            }
            objuser.extrainfo.emailAddress = decoded.email;
            //urs_gid = decoded.extrainfo.groupId;
            // if (decoded.extrainfo != undefined)
            //  objuser.extrainfo = decoded.extrainfo;
            decoded.roles.forEach((element) => {
              objuser.roles.push(element.role);
            });
            objuser.username = decoded.username;
          }
          ret.setMessages("User detail");
          ret.setData(objuser);
          // console.log('objuser', objuser);
          return res.send(ret);
        }
        if (authtype == "xauth") {
          logger.info(nameFile + " | userInfo | GET | XAUTH : " + req.session);

          // console.log("ISXAUTH")
          var token = data.DYM;
          if (token != undefined && token != "null" && token != null) {
            var decoded = JSON.parse(Buffer.from(token, "base64").toString());
            objuser.email = decoded.User.email;
            objuser.id = decoded.User.id;
            objuser.extrainfo.emailAddress = decoded.User.email;
            if (decoded.hasOwnProperty("extrainfo")) {
              objuser.gid = decoded.extrainfo.groupId;
              //objuser.extrainfo = decoded.extrainfo;
              objuser.extrainfo = {
                ...decoded.extrainfo,
                ...objuser.extrainfo,
              };
            }
            if (!(Object.entries(extradata).length === 0)) {
              objuser.extrainfo = { ...extradata, ...objuser.extrainfo };
            }

            //urs_gid = decoded.extrainfo.groupId;
            // if (decoded.extrainfo != undefined)
            //  objuser.extrainfo = decoded.extrainfo;
            decoded.User.roles.forEach((element) => {
              objuser.roles.push(element);
            });
            objuser.username = decoded.User.username;
            objuser.extrainfo.token = decoded.access_token;
            objuser.extrainfo.expires = decoded.expires;
            objuser.extrainfo.userId = decoded.User.id;
          }
          ret.setMessages("User detail");
          ret.setData(objuser);
          return res.send(ret);
        }
        if (authtype == "oidc") {
          var urlIDM = el.prop.dymer.userInfoURL;
          var token = data.DYMAT;
          var config = {
            method: "get",
            url: urlIDM,
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          };
          if (token != undefined && token != "null" && token != null) {
            axios(config)
              .then(function (response) {
                //console.log(response.data);
                response.data.roles.forEach((element) => {
                  objuser.roles.push(element.name);
                });
                // console.log(obj_isi.roles);
                objuser.email = response.data.email;
                objuser.id = response.data.email;
                objuser.d_appuid = response.data.app_id;
                objuser.username = response.data.username;

                if (!(Object.entries(extradata).length === 0)) {
                  objuser.extrainfo = {
                    ...objuser.extrainfo,
                    ...extradata.extrainfo,
                  };
                }
                objuser.extrainfo.emailAddress = response.data.email;
                ret.setMessages("User detail");
                ret.setData(objuser);
                return res.send(ret);
              })
              .catch(function (error) {
                console.error(error);
                logger.error(
                  nameFile + " | /userinfo oidc error | updateOne : " + error
                );
                /* var token = data.DYM;
                             var decoded = JSON.parse(Buffer.from(token, 'base64').toString());
                             objuser.email = decoded.email;
                             objuser.id = decoded.email;
                             //urs_gid = decoded.extrainfo.groupId;
                             objuser.extrainfo.emailAddress = decoded.email;
                             objuser.extrainfo = decoded.extrainfo;
                             decoded.roles.forEach(element => {
                                 objuser.roles.push(element.role);
                             });
                             objuser.username = decoded.username;
                             ret.setMessages("User detail");
                             ret.setData(objuser);
                             return res.send(ret);*/
                ret.setMessages("User detail");
                ret.setData(objuser);
                return res.send(ret);
              });
          } else {
            ret.setMessages("User detail");
            ret.setData(objuser);
            return res.send(ret);
          }
        }
      } else {
        ret.setMessages("User detail");
        ret.setData(objuser);
        // console.log('objuser', objuser);
        return res.send(ret);
      }
    })
    .catch((err) => {
      if (err) {
        console.error(err);
        logger.error(nameFile + " | /userinfo | DymRule : " + err);
        ret.setMessages("Get error");
        ret.setSuccess(false);
        ret.setExtraData({ log: err.stack });
        return res.send(ret);
      }
    });
});

router.post("/", util.checkIsAdmin, function (req, res) {
  //router.post('/', function(req, res) {
  let id = req.params.id;
  let callData = util.getAllQuery(req);
  let data = callData.data;
  var ret = new jsonResponse();
  var mod = new DymRule(req.body);
  //console.log(nameFile + ' | post | create : ', JSON.stringify(req.body));
  logger.info(nameFile + " | post | create : " + JSON.stringify(req.body));
  mod
    .save()
    .then((el) => {
      ret.setMessages("Element created successfully");
      ret.addData(el);
      return res.send(ret);
    })
    .catch((err) => {
      if (err) {
        console.error(err);
        logger.error(nameFile + " | post | create : " + err);
        ret.setMessages("Create error");
        ret.setSuccess(false);
        ret.setExtraData({ log: err.stack });
        return res.send(ret);
      }
    });
});
router.put("/:id", util.checkIsAdmin, (req, res) => {
  let id = req.params.id;
  let callData = util.getAllQuery(req);
  let data = callData.data;
  var copiaData = Object.assign({}, data);
  var ret = new jsonResponse();
  var myfilter = { _id: mongoose.Types.ObjectId(id) };
  var myquery = {
    $set: req.body,
  };
  // console.log(nameFile + ' | put/:id | id,query : ', id, JSON.stringify(req.body));
  logger.info(
    nameFile + " | put/:id | id,query : " + id + " " + JSON.stringify(req.body)
  );
  DymRule.updateOne(myfilter, req.body, function (err, raw) {
    if (err) {
      ret.setSuccess(false);
      console.error(err);
      logger.error(nameFile + " | put/:id | id,query : " + err);
      ret.setMessages("Element Error");
      return res.send(ret);
    } else {
      ret.addData(copiaData);
      ret.setMessages("Element Updated");
      return res.send(ret);
    }
  });
});
router.delete("/:id", util.checkIsAdmin, (req, res) => {
  var ret = new jsonResponse();
  var id = req.params.id;
  var myfilter = { _id: id };
  //console.log(nameFile + ' | delete/:id | id : ', id);
  logger.info(nameFile + " | delete/:id | id : " + id);
  DymRule.findOneAndDelete(myfilter)
    .then((el) => {
      ret.setMessages("Element deleted");
      return res.send(ret);
    })
    .catch((err) => {
      if (err) {
        console.error(err);
        logger.error(nameFile + " | delete/:id : " + err);
        ret.setMessages("Delete Error");
        ret.setSuccess(false);
        ret.setExtraData({ log: err.stack });
        return res.send(ret);
      }
    });
});

router.post("/cacheCapTokens", function (req, res) {
  var ret = new jsonResponse();

  let body = req.body;
  let userInfo = body.userInfo;
  getResorucesUniversalCapToken(userInfo.access_token, req)
    .then(function (resp) {
      if (req.session.extraData != undefined) {
        req.session.extraData.getResourcesUniversalCapToken = JSON.stringify(
          resp.data
        );
      } else {
        req.session.extraData = {
          getResourcesUniversalCapToken: JSON.stringify(resp.data),
        };
      }
      req.session.save();
      fetchCapTokens(userInfo, req);
      ret.setData("Obtained");
      ret.setSuccess(true);
      return res.send(ret);
    })
    .catch(function (err) {
      console.log(
        "ERROR | " + nameFile + " | Cache Cap Tokens | Get application " + err
      );
      logger.error(
        "ERROR | " + nameFile + " | Cache Cap Tokens | Get application " + err
      );
      ret.setMessages("Error with caching tokens");
      return res.send(ret);
    });

  // var ret = new jsonResponse();
  // getResorucesUniversalCapToken(userInfo.access_token, req).then(function (resp) {
  //     if (req.session.extraData != undefined) {
  //         req.session.extraData.getResourcesUniversalCapToken = JSON.stringify(resp.data);
  //     } else {
  //         req.session.extraData = { getResourcesUniversalCapToken: JSON.stringify(resp.data) };
  //     }
  //     req.session.save();
  // })
});

router.post("/login", function (req, res) {
  logger.info(nameFile + " | login | POST | ");
  authenticateUser(req, res);
});

router.get("/getAttachmentToken", function (req, res) {
  var ret = new jsonResponse();
  ret.setSuccess(false);
  const nowUtc = new Date();
  logger.info(nameFile + " | getSocsDehToken | GET | ");

  if (global.socs_deh_token) {
    logger.info(nameFile + " | login | GET | There is a global token");

    if (nowUtc > global.socs_deh_token.access_token.expires) {
      logger.info(nameFile + " | login | GET | Token expired");
      authenticateUser(req, res, function (resp) {
        if (resp.success) {
          ret.setData({ attachment_token: resp.data.attachment_token });
          ret.setSuccess(resp.success);
          res.status(200).send(ret);
        } else {
          ret.setSuccess(resp.success);
          ret.setMessages(resp.messages);
          res.status(500).send(ret);
        }
      });
    } else {
      ret.setData({ attachment_token: global.socs_deh_token.attachment_token });
      ret.setSuccess(true);
      res.status(200).send(ret);
    }
  } else {
    logger.info(nameFile + " | login | GET | There is no global token");
    authenticateUser(req, res, function (resp) {
      if (resp.success) {
        ret.setData({ attachment_token: resp.data.attachment_token });
        ret.setSuccess(resp.success);
        res.status(200).send(ret);
      } else {
        ret.setSuccess(resp.success);
        ret.setMessages(resp.messages);
        res.status(500).send(ret);
      }
    });
  }
});

router.get("/getSocsDehToken", function (req, res) {
  var ret = new jsonResponse();
  ret.setSuccess(false);
  const nowUtc = new Date();
  logger.info(nameFile + " | getSocsDehToken | GET | ");

  if (global.socs_deh_token) {
    logger.info(nameFile + " | login | GET | There is a global token");

    if (nowUtc > global.socs_deh_token.access_token.expires) {
      logger.info(nameFile + " | login | GET | Token expired");
      authenticateUser(req, res, function (resp) {
        if (resp.success) {
          ret.setData(resp.data);
          ret.setSuccess(resp.success);
          res.status(200).send(ret);
        } else {
          ret.setSuccess(resp.success);
          ret.setMessages(resp.messages);
          res.status(500).send(ret);
        }
      });
    } else {
      ret.setData(global.socs_deh_token);
      ret.setSuccess(true);
      res.send(ret);
    }
  } else {
    logger.info(nameFile + " | login | GET | There is no global token");
    authenticateUser(req, res, function (resp) {
      if (resp.success) {
        ret.setData(resp.data);
        ret.setSuccess(resp.success);
        res.status(200).send(ret);
      } else {
        ret.setSuccess(resp.success);
        ret.setMessages(resp.messages);
        res.status(500).send(ret);
      }
    });
  }
});

router.delete("/logout", function (req, res) {
  logger.info(nameFile + " | logout | DELETE |");
  var ret = new jsonResponse();
  ret.setSuccess(false);
  let token = req.headers["x-auth-token"];
  xauth
    .revokeToken(token)
    .then(function (ars) {
      let statusCode = ars;
      if (statusCode === 204) ret.setSuccess(true);
      ret.setMessages("Succefully logout.");
      ret.setExtraData(statusCode);
      return res.send(ret);
    })
    .catch(function (err) {
      logger.error("ERROR | " + nameFile + " | Logout | " + err);
      ret.setMessages("Invalid grant: Auth Token not found");
      return res.send(ret);
    });
});

function fetchCapTokens(authToken, req) {
  // getCapabilityTokenDEMETER('getMyResources', req, '', authToken)
  getCapabilityTokenDEMETER("getMetrics", req, "", authToken);
  getCapabilityTokenDEMETER("createResource", req, "", authToken);
}

const getResorucesUniversalCapToken = (accessToken, req) => {
  req.session.accessToken = accessToken;
  req.session.save();
  return new Promise((resolve, reject) => {
    const postHeaders = {
      "Content-Type": "application/json",
    };

    let getAllResources = {
      token: accessToken,
      ac: "GET",
      de: rrmApi,
      re: "/api/v1/resources.*",
    };

    let body = JSON.stringify(getAllResources);

    axios
      .post(acsServer, body, postHeaders)
      .then((resp) => {
        resolve(resp);
      })
      .catch(function (error) {
        // handle error
        console.log(
          "ERROR | " + nameFile + " | getResorucesUniversalCapToken :" + error
        );
        logger.error(nameFile + " | getResorucesUniversalCapToken : " + error);
        reject("ERROR:" + " external error=" + error);
      });
  });
};

async function getCapabilityTokenDEMETER(capTokenName, req, url, authToken) {
  let config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  let getUniversal = {
    token: authToken.access_token,
    ac: "GET",
    de: rrmApi,
    re: "/api/v1/resources",
  };

  let getMyResources = {
    token: authToken.access_token,
    ac: "GET",
    de: rrmApi,
    re: "/api/v1/resources/search?owner=" + authToken.User.id,
  };

  let createResource = {
    token: authToken.access_token,
    ac: "POST",
    de: rrmApi,
    re: "/api/v1/resources",
  };

  let getMetrics = {
    token: authToken.access_token,
    ac: "GET",
    de: rrmApi,
    re: "/api/v1/metrics",
  };

  if (capTokenName === "getUniversal") {
    let body = JSON.stringify(getUniversal);

    axios
      .post(acsServer, body, config)
      .then((resp) => {
        console.log("GET ALL Resources Cap. Token", JSON.stringify(resp.data));
        if (req.session.extraData != undefined) {
          req.session.extraData.getResorucesUniversalCapToken = JSON.stringify(
            resp.data
          );
        } else {
          req.session.extraData = {
            getResorucesUniversalCapToken: JSON.stringify(resp.data),
          };
        }
        req.session.save();
      })
      .catch(function (error) {
        // handle error
        console.log(
          "ERROR | " +
            nameFile +
            " | getCapabilityTokenDEMETER | getAllResources :" +
            error
        );
        logger.error(
          nameFile + " | getCapabilityTokenDEMETER | getAllResources : " + error
        );
      });
  }

  if (capTokenName === "getMyResources") {
    let body = JSON.stringify(getMyResources);

    await axios
      .post(acsServer, body, config)
      .then((resp) => {
        console.log("GET MY Resources Cap. Token", JSON.stringify(resp.data));

        if (req.session.extraData != undefined) {
          req.session.extraData.getMyResourcesCapToken = JSON.stringify(
            resp.data
          );
        } else {
          req.session.extraData = {
            getMyResourcesCapToken: JSON.stringify(resp.data),
          };
        }
        req.session.save();
      })
      .catch(function (error) {
        // handle error
        console.log(
          "ERROR | " +
            nameFile +
            " | getCapabilityTokenDEMETER | getMyResources :" +
            error
        );
        logger.error(
          nameFile + " | getCapabilityTokenDEMETER | getMyResources : " + error
        );
      });
  }

  if (capTokenName === "createResource") {
    let body = JSON.stringify(createResource);

    await axios
      .post(acsServer, body, config)
      .then((resp) => {
        console.log(
          "GET Create Resources Cap. Token",
          JSON.stringify(resp.data)
        );

        if (req.session.extraData != undefined) {
          req.session.extraData.createResourceCapToken = JSON.stringify(
            resp.data
          );
        } else {
          req.session.extraData = {
            createResourceCapToken: JSON.stringify(resp.data),
          };
        }
        req.session.save();
      })
      .catch(function (error) {
        // handle error
        console.log(
          "ERROR | " +
            nameFile +
            " | getCapabilityTokenDEMETER | createResource :" +
            error
        );
        logger.error(
          nameFile + " | getCapabilityTokenDEMETER | createResource : " + error
        );
      });
  }

  if (capTokenName === "getMetrics") {
    let body = JSON.stringify(getMetrics);

    await axios
      .post(acsServer, body, config)
      .then((resp) => {
        console.log(
          "GET Metrics Resources Cap. Token",
          JSON.stringify(resp.data)
        );

        if (req.session.extraData != undefined) {
          req.session.extraData.getAllMetricsCapToken = JSON.stringify(
            resp.data
          );
        } else {
          req.session.extraData = {
            getAllMetricsCapToken: JSON.stringify(resp.data),
          };
        }
        req.session.save();
      })
      .catch(function (error) {
        // handle error
        console.log(
          "ERROR | " +
            nameFile +
            " | getCapabilityTokenDEMETER | getMetrics :" +
            error
        );
        logger.error(
          nameFile + " | getCapabilityTokenDEMETER | getMetrics : " + error
        );
      });
  }
}

function authenticateUser(req, res, callback) {
  var ret = new jsonResponse();
  ret.setSuccess(false);

  logger.info(nameFile + " | autheticateUser | request received");
  let config;

  const userCredentials = JSON.stringify({
    name: global.configService.socsuser.email,
    password: global.configService.socsuser.password,
  });

  const loginHeaders = {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };

  var queryFind = { host: req.headers.referer, active: true };
  DymRule.find(queryFind)
    .then((els) => {
      if (els.length) {
        config = els[0].prop;
        axios
          .post(
            config.tokenProvider + config.accessTokenPath,
            userCredentials,
            loginHeaders
          )
          .then((token) => {
            const getUserInfoHeaders = {
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-Auth-Token": token.headers["x-subject-token"],
                "X-Subject-Token": token.headers["x-subject-token"],
              },
            };

            axios
              .get(
                config.tokenProvider + config.accessTokenPath,
                getUserInfoHeaders
              )
              .then((userInfo) => {
                getResorucesUniversalCapToken(userInfo.data.access_token, req)
                  .then(function (resp) {
                    getCapabilityTokenAttachment(userInfo.data.access_token)
                      .then(function (attachmentToken) {
                        const buff = Buffer.from(
                          JSON.stringify(attachmentToken.data),
                          "utf-8"
                        );
                        const base64AttachmentToken = buff.toString("base64");
                        let response = {
                          access_token: userInfo.data,
                          universal_cap_token: resp.data,
                          attachment_token: base64AttachmentToken,
                        };
                        global.socs_deh_token = response;
                        ret.setData(response);
                        ret.setSuccess(true);
                        callback(ret);
                      })
                      .catch(function (err) {
                        console.log(
                          "ERROR | " +
                            nameFile +
                            " | authenticateUser | getCapabilityTokenAttachment | " +
                            err
                        );
                        logger.error(
                          "ERROR | " +
                            nameFile +
                            " | authenticateUser | getCapabilityTokenAttachment | " +
                            err
                        );
                        ret.setMessages("Error fetching attachment cap token");
                        callback(ret);
                      });
                  })
                  .catch((error) => {
                    // handle error
                    console.log(
                      "ERROR | " +
                        nameFile +
                        " | authenticateUser | getResorucesUniversalCapToken :" +
                        error
                    );
                    logger.error(
                      nameFile +
                        " | authenticateUser | getResorucesUniversalCapToken : " +
                        error
                    );
                    ret.setMessages(
                      "Error fetching resources universal cap token"
                    );
                    callback(ret);
                  });
              })
              .catch((error) => {
                // handle error
                console.log(
                  "ERROR | " +
                    nameFile +
                    " | authenticateUser | getResorucesUniversalCapToken | Error fetching user info: " +
                    error
                );
                logger.error(
                  nameFile +
                    " | authenticateUser | getResorucesUniversalCapToken | Error fetching user info: " +
                    error
                );
                ret.setMessages("Error fetching user info");
                callback(ret);
              });
          })
          .catch((error) => {
            // handle error
            console.log(
              "ERROR | " +
                nameFile +
                " | authenticateUser | getResorucesUniversalCapToken | Error authenticating user: " +
                error
            );
            logger.error(
              nameFile +
                " | authenticateUser | getResorucesUniversalCapToken | Error authenticating user: " +
                error
            );
            ret.setMessages("Error authenticating user");
            callback(ret);
          });
      } else {
        // handle error
        console.log(
          "ERROR | " +
            nameFile +
            " | authenticateUser | getResorucesUniversalCapToken | No matching config found "
        );
        logger.error(
          nameFile +
            " | authenticateUser | getResorucesUniversalCapToken | No matching config found "
        );
        ret.setMessages("No matching config found");
        callback(ret);
      }
    })
    .catch((error) => {
      console.error("Error finding DymRule:", error.message);
      ret.setMessages("Error finding DymRule");
      callback(ret);
    });
}

const getCapabilityTokenAttachment = (accessToken) => {
  return new Promise((resolve, reject) => {
    const postHeaders = {
      "Content-Type": "application/json",
    };

    axios
      .post(
        acsServer,
        `{"token":"${accessToken}","ac":"GET","de":"${rrmApi}","re":"/api/v1/attachment/.*"}`,
        postHeaders
      )
      .then((resp) => {
        resolve(resp);
      })
      .catch(function (error) {
        // handle error
        logger.error(nameFile + " | getCapabilityTokenAttachment " + error);
        console.log(error);
        reject("ERROR:" + " external error=" + error);
      });
  });
};

module.exports = router;
