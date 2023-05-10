// Load express
//const Keycloak = require('keycloak-connect');
const express = require("express");
var url = require("url");
require("./config/config.js");
const util = require("./utility");
const app = express();
const portExpress = global.configService.port; //context-path
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const https = require("https");
const morgan = require("morgan");
const cors = require("cors");
const nameFile = path.basename(__filename);
const logger = require("./routes/dymerlogger");
var jsonResponse = require("./jsonResponse");
//USO OIDC
//var passport = require('passport')
//const router=express.Router();
//const appRoutes=require('./app/routes/api')(router);
const jwt = require("jsonwebtoken");
var axios = require("axios");
var qs = require("qs");
var dserviceRoutes = require("./routes/dservice");
var templateRoutes = require("./routes/template");
var formRoutes = require("./routes/form");
var entityRoutes = require("./routes/entity");
var publicRoutes = require("./routes/publicfiles");
var appRoutes = require("./routes/appRoutes");
//var dauthRoutes = require('./routes/dauth');
var authenticateRoutes = require("./routes/authenticate");
var dohtmlpage = require("./routes/dohtmlpage");
//const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
const session = require("express-session");
var cookieParser = require("cookie-parser");
var memoryStore = new session.MemoryStore();
app.use(cookieParser());
app.use(
  session({
    secret: "thisShouldBeLongAndSecret",
    resave: false,
    saveUninitialized: true,
    store: memoryStore,
    name: "nodejscookie",
    cookie: {
      path: "/",
    },
  })
);

var recoverForms = require("./routes/formfiles");

const socsDomain = process.env.SOCS_DOMAIN;

/*
@Marko Change starts here
*/
var attachmentRoutes = require("./routes/attachment");
var metricsRoutes = require("./routes/metrics");
/*
@Marko chagne end here
*/

var publicdemoDonwlonad = require("./routes/demodownloads");
const { off } = require("process");
app.get(
  util.getContextPath("webserver") + "/deletelog/:filetype",
  [loadUserInfo, util.checkIsAdmin],
  (req, res) => {
    var ret = new jsonResponse();
    var filetype = req.params.filetype;
    // const dymeruser = util.getDymerUser(req, res);
    // const dymerextrainfo = dymeruser.extrainfo;
    logger.flushfile(filetype);
    // logger.i
    ret.setSuccess(true);
    ret.setMessages("Deleted");
    return res.send(ret);
  }
);

app.get(
  util.getContextPath("webserver") + "/openLog/:filetype",
  [loadUserInfo, util.checkIsAdmin],
  (req, res) => {
    var filetype = req.params.filetype;
    //console.log('openLog/:filety', path.join(__dirname + "/logs/" + filetype + ".log"));
    return res.sendFile(path.join(__dirname + "/logs/" + filetype + ".log"));
  }
);
app.get(
  util.getContextPath("webserver") + "/checkservice",
  [loadUserInfo, util.checkIsAdmin],
  (req, res) => {
    var ret = new jsonResponse();
    let infosize = logger.filesize("info");
    let errorsize = logger.filesize("error");
    ret.setData({
      info: {
        size: infosize,
      },
      error: {
        size: errorsize,
      },
    });
    ret.setMessages("Service is up");
    res.status(200);
    ret.setSuccess(true);
    return res.send(ret);
  }
);
app.use(express.static(__dirname + "/public"));
//app.use(express.static(__dirname + global.gConfig.services.webserver["context-path"] + 'public'));
//app.use(express.static(global.gConfig.services.webserver["context-path"] + 'public'));
//app.use('/public', express.static('public'));
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  //    res.header("X-Frame-Option", "allow-from http://localhost:8080/");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

app.use(cors());
app.set("trust proxy", true);

//
app.use(
  util.getContextPath("webserver") + "/public/",
  express.static(
    path.join(
      __dirname.replace(util.getContextPath("webserver"), ""),
      "public/"
    )
  )
);
app.use(
  util.getContextPath("webserver") + "/app/",
  express.static(
    path.join(__dirname.replace(util.getContextPath("webserver"), ""), "app/")
  )
);
app.use(util.getContextPath("webserver") + "/public/", publicRoutes);
app.use(util.getContextPath("webserver") + "/app/", appRoutes);
app.use(util.getContextPath("webserver") + "/api/portalwebpage/", dohtmlpage);

app.get(
  util.getContextPath("webserver") + "/api2/retriveinfoidpadmin",
  (req, res, next) => {
    if (true) {
      //      console.log("retriveinfo.AAAAAAAAAAAAAAA", pp);
      var objuser = {
        isGravatarEnabled: false,
        authorization_decision: "",
        roles: [{ role: "app-admin" }],
        app_azf_domain: "",
        id: "admin@dymer.it",
        gid: 0,
        app_id: "dymer",
        email: "admin@dymer.it",
        username: "admin@dymer.it",
      };

      var obj_isi = {};
      obj_isi.roles = objuser.roles;
      let base64DYM = new Buffer(JSON.stringify(objuser)).toString("base64");
      let base64DYMisi = new Buffer(JSON.stringify(obj_isi)).toString("base64");
      var objtoSend = { DYM: base64DYM, DYMisi: base64DYMisi };
      objtoSend.d_uid = objuser.id;
      objtoSend.d_appuid = 0;
      objtoSend.d_gid = objuser.gid;
      res.send(objtoSend);
    } else {
      res.send({ objuser });
    }
    //   console.log("---------FINE-------------");
    // res.send(req.session.passport.user);
  }
);
app.get(
  util.getContextPath("webserver") + "/api2/retriveinfoidp",
  (req, res, next) => {
    //   console.log("--------INIZIO retriveinfoIDP--------------");
    //   console.log("retriveinfo", req.session);
    //   console.log("retriveinfo req.isAuthenticated()", req.isAuthenticated());
    const authHeader = req.headers.authorization;

    var pp = jwt.decode(req.session.passport.user.access_token);
    //   console.log("retriveinfo pp", pp);
    //var pp = jwt.decode(JSON.parse(token));
    if (pp != undefined) {
      //      console.log("retriveinfo.AAAAAAAAAAAAAAA", pp);
      var objuser = {
        isGravatarEnabled: false,
        authorization_decision: "",
        roles: [],
        app_azf_domain: "",
        id: "",
        app_id: "",
        email: "test@test.it",
        extrainfo: {
          companyId: "ccc",
          groupId: "ccc",
          cms: "lfr",
          userId: "ccc",
        },
        username: pp.email,
      };
      pp.realm_access.roles.forEach((element) => {
        objuser.roles.push({ role: element, id: "" });
      });
      var obj_isi = {};
      obj_isi.roles = objuser.roles;
      let base64DYM = new Buffer(JSON.stringify(objuser)).toString("base64");
      let base64DYMisi = new Buffer(JSON.stringify(obj_isi)).toString("base64");
      //  console.log("retriveinfo objuser", objuser);

      var objtoSend = { DYM: base64DYM, DYMisi: base64DYMisi };
      objtoSend.d_uid = pp.email;
      objtoSend.d_appuid = pp.sub;
      objtoSend.d_gid = 0;
      res.send(objtoSend);
    } else {
      res.send({ objuser });
    }
    //   console.log("---------FINE-------------");
    // res.send(req.session.passport.user);
  }
);
app.post(
  util.getContextPath("webserver") + "/api2/retriveinfo",
  loadUserInfo,
  (req, res, next) => {
    //   res.send({ "ttttttt": "rrrrrrrrr" });
    // console.log("retriveinfo", req.headers);
    // console.log("session1.userid", req.session);
    // console.log("req.originalUrl", req.originalUrl);
    // console.log("req.hostname", req.hostname);
    const hdymeruser = req.headers.dymeruser;
    const dymeruser = JSON.parse(
      Buffer.from(hdymeruser, "base64").toString("utf-8")
    );
    res.clearCookie("DYMisi");
    res.cookie("dymercookie", "value", { expire: 360000 + Date.now() });

    //   console.log("retriveinfo req.isAuthenticated()", req.isAuthenticated());
    const authHeader = req.headers.authorization;
    var obj_isi = {};
    let dr_value = new Buffer(JSON.stringify(dymeruser.roles)).toString(
      "base64"
    );
    var objuser;

    if (req.headers.referer === socsDomain) {
      getSocsDehToken()
        .then((socsDehToken) => {
          console.log("SOCS TOKEN", socsDehToken);
          objuser = {
            d_uid: dymeruser.id,
            d_appuid: dymeruser.app_id,
            d_gid: dymeruser.gid,
            d_rl: dr_value,
            socsDehToken: new Buffer(JSON.stringify(socsDehToken)).toString(
              "base64"
            ),
          };
          logger.info(
            nameFile + " | /api2/retriveinfo :" + JSON.stringify(objuser)
          );
          res.send(objuser);
        })
        .catch((error) => {
          console.log("Error retrieving socsDehToken:", error.message);
          objuser = {
            d_uid: dymeruser.id,
            d_appuid: dymeruser.app_id,
            d_gid: dymeruser.gid,
            d_rl: dr_value,
          };

          logger.info(
            nameFile + " | /api2/retriveinfo :" + JSON.stringify(objuser)
          );
          res.send(objuser);
        });
    } else {
      objuser = {
        d_uid: dymeruser.id,
        d_appuid: dymeruser.app_id,
        d_gid: dymeruser.gid,
        d_rl: dr_value,
      };

      logger.info(
        nameFile + " | /api2/retriveinfo :" + JSON.stringify(objuser)
      );
      res.send(objuser);
    }
  }
);

function getSocsDehToken() {
  return new Promise((resolve, reject) => {
    const urlinv =
      util.getServiceUrl("dservice") + "/api/v1/authconfig/getSocsDehToken";
    axios
      .get(urlinv)
      .then((response) => {
        var token = {
          access_token: response.data.data.access_token.access_token,
          attachment_token: response.data.data.attachment_token,
        };
        resolve(token);
      })
      .catch((error) => {
        console.error("Error retrieving socsDehToken:", error.message);
        reject(error);
      });
  });
}
/*
app.use(session({
    secret: 'secret squirrel',
    resave: false,
    saveUninitialized: true
}))*/

/**/
function checkAuthentication(req, res, next) {
  console.log("isAuthenticated", req.isAuthenticated());
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/");
  }
}

function getTokenFromRequest(req, res, next) {
  var url = req.originalUrl;
  var splitUrl = url.split("?");
  var originalUrl = splitUrl[0];
  console.log("SPLIT", originalUrl);
  var token = url.substring(
    url.lastIndexOf("&token=") + 7,
    url.lastIndexOf("&state")
  );

  req.originalUrl = originalUrl;
  req.headers["jwtToken"] = token;

  next();
}
function loadUserInfo(req, res, next) {
  cookie = req.cookies;
  //console.log("cookiecookie", cookie);
  // console.log('TESTSESSION', req.session.cc, req.session.cc == undefined);
  // console.log('TESTSESSION req ', req);
  // console.log('TESTSESSION req referer', req);
  // console.log('TESTSESSION req referer', req.headers);
  logger.info(
    nameFile +
      " | loadUserInfo : TESTSESSION req headers" +
      JSON.stringify(req.headers)
  );
  // console.log('TESTSESSION req referer', req.headers.referer);
  // console.log('TESTSESSION req req.headers.authorization', req.headers.authorization);
  // console.log('TESTSESSION req req.headers.Authorization', req.headers.Authorization);
  //  console.log('TESTSESSION req dservice', util.getServiceUrl("dservice"));
  //  console.log('TESTSESSION  req.protocol', req.protocol);
  //console.log('TESTSESSION req host', req.get('host'));
  logger.info(
    nameFile +
      " | loadUserInfo : TESTSESSION req host, originalUrl" +
      req.get("host") +
      " , " +
      req.originalUrl
  );
  // console.log('TESTSESSION req originalUrl', req.originalUrl);
  var authuserUrl =
    util.getServiceUrl("dservice") + "/api/v1/authconfig/userinfo";
  var dymtoken =
    req.headers.authorization != undefined
      ? req.headers.authorization.split(" ")[1]
      : undefined;
  var dymtokenAT = req.headers.authorizationtk;
  var dymtoExtraInfo = req.headers.extrainfo;

  if (req.query.tkdymat != undefined) {
    dymtokenAT = req.query.tkdymat;
    dymtoExtraInfo = req.query.tkextra;
  }

  if (req.query.tkdym != undefined) dymtoken = req.query.tkdym;
  // console.log('loadUserInfo req.query.tkdymat', req.query.tkdymat);
  //  console.log('loadUserInfo req.query.tkdym', req.query.tkdym);

  //console.log('loadUserInfo authuserUrl', authuserUrl);
  // console.log('loadUserInfo dymtoken', dymtoken);
  logger.info(
    nameFile + " | loadUserInfo : dymtoken" + JSON.stringify(dymtoken)
  );
  //console.log('loadUserInfo dymtokenAT', dymtokenAT);
  var idsadm = false;
  if (req.cookies["lll"] != undefined) {
    dymtoken = req.cookies["lll"];
    idsadm = true;
  }
  //console.log('TESTSESSION req dymtoken', dymtoken);
  //if (token == undefined || token == 'null')

  var referer = req.headers.referer;
  //  console.log('loadUserInfo pre-reteret', referer);

  if (referer != undefined) {
    if (referer.includes(req.host)) referer = req.get("host");
  }
  /* else {
            referer = "testimport";
        }*/
  let originalRef =
    req.headers["reqfrom"] == undefined
      ? req.headers.referer
      : req.headers.reqfrom;
  originalRef = originalRef == undefined ? req.get("host") : originalRef;
  //console.log('loadUserInfo post-req.headers', req.headers);
  logger.info(
    nameFile + " | loadUserInfo : post-referer" + req.headers.referer
  );
  logger.info(
    nameFile + " | loadUserInfo : post-reqfrom" + req.headers["reqfrom"]
  );
  logger.info(
    nameFile +
      " | loadUserInfo : originalRef" +
      originalRef +
      " , " +
      typeof originalRef
  );
  logger.info(nameFile + " | --------------------------");

  /*console.log('loadUserInfo post-referer', req.headers.referer);
    console.log('loadUserInfo post-reqfrom', req.headers["reqfrom"]);
    console.log('loadUserInfo originalRef', originalRef, typeof originalRef);
    console.log('--------------------------');*/
  var config = {
    method: "get",
    url: authuserUrl,
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      DYM: dymtoken,
      DYMAT: dymtokenAT,
      referer: originalRef,
      dymtoExtraInfo: dymtoExtraInfo,
      idsadm: idsadm,
    },
  };
  axios(config)
    .then(function (response) {
      //console.log('dymeruser', response.data.data);
      req.headers["dymeruser"] = new Buffer(
        JSON.stringify(response.data.data)
      ).toString("base64");
      //if (req.headers["reqfrom"] == undefined || req.headers["reqfrom"] == 'undefined')
      if (req.headers["reqfrom"] == undefined)
        req.headers["reqfrom"] = originalRef;
      next();
    })
    .catch(function (error) {
      logger.error(nameFile + " |loadUserInfo | axios authuserUrl : " + error);
      console.log(error);
      next();
    });
}
app.use(
  util.getContextPath("webserver") + "/api/portalweb/",
  authenticateRoutes
);

/*app.use(util.getContextPath('webserver') + "/public/", express.static(path.join(__dirname.replace('\routes', ""), "..")));
app.use(util.getContextPath('webserver') + "/app/", express.static(path.join(__dirname.replace('\routes', ""), "..")));
*/ //

//app.use('/',appRoutes);
//var index = require('./routes/index');
//app.use('/', index); // mount the index route at the / path
// mount the routers
//app.use('/portalweb/', portalwebRoutes);
//console.log('global.gConfig.services.webserver["context-path"]', util.getContextPath('webserver'));
//console.log('__dirname', __dirname);
app.use(
  util.getContextPath("webserver") + "/api/templates/",
  loadUserInfo,
  templateRoutes
);
app.use(
  util.getContextPath("webserver") + "/api/forms/",
  loadUserInfo,
  formRoutes
);
app.use(
  util.getContextPath("webserver") + "/api/entities/",
  loadUserInfo,
  entityRoutes
);
//app.use(util.getContextPath('webserver') + "/api/entities/", checkAuthentication, entityRoutes);
//app.use(util.getContextPath('webserver') + "/api/entities/", keycloak.protect('realm:app-user'), entityRoutes);
//m 2021_20_20 app.use(util.getContextPath('webserver') + "/api/private/dservice/", ensureLoggedInOpen, dserviceRoutes);
app.use(
  util.getContextPath("webserver") + "/api/dservice/",
  loadUserInfo,
  dserviceRoutes
);
app.post(
  util.getContextPath("webserver") + "/api/test/",
  loadUserInfo,
  (req, res, next) => {
    console.log("test");
    next();
    //res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
  }
);
//app.use(util.getContextPath('webserver') + "/api/auth/", dauthRoutes);

/*
@Marko Change starts here
*/
app.use(
  util.getContextPath("webserver") + "/api/xauth/cacheCapTokens",
  dserviceRoutes
);
app.use(
  util.getContextPath("webserver") + "/api/xauth/attachmentToken",
  dserviceRoutes
);
app.use(
  util.getContextPath("webserver") + "/api/attachment/",
  attachmentRoutes
);
app.use(util.getContextPath("webserver") + "/api/metrics/", metricsRoutes);
/*
@Marko chagne end here
*/

const parseToken = (raw) => {
  if (!raw || typeof raw !== "string") return null;

  try {
    raw = JSON.parse(raw);
    const token = raw.id_token ? raw.id_token : raw.access_token;
    const content = token.split(".")[1];
    return JSON.parse(Buffer.from(content, "base64").toString("utf-8"));
  } catch (e) {
    console.error("Error while parsing token: ", e);
  }
};
//app.use(global.gConfig.services.webserver["context-path"] + '/public/cdn/', publicRoutes);
//app.use(global.gConfig.services.webserver["context-path"] + 'public/cdn/', publicRoutes);
//app.use(util.getContextPath('webserver') + '/public/cdn', publicRoutes);
//app.use(util.getContextPath('webserver') + '/public/cdn', publicRoutes);
//app.use(util.getContextPath('webserver') + '/public/', publicRoutes);
app.use(
  util.getContextPath("webserver") + "/demodownload/",
  publicdemoDonwlonad
);
//app.use("/recoverForms/", recoverForms);0
/*app.get(util.getContextPath('webserver') + "/login", ensureLoggedIn, (req, res, next) => {
    // console.log("router.get");
    next();
    //res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
});
*/

app.get(
  util.getContextPath("webserver") + "/public/cdn/*",
  (req, res, next) => {
    // console.log("router.get");
    next();
    //res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
  }
);

const testRules = (req) => {
  // keycloak.get
  // var pp = jwt.decode(JSON.parse(req.session['keycloak-token'])); //['access_token']
  // console.log('pppppppppppppppppppppp', pp);
  return "realm:app-user";
  // return t
};
//app.get(util.getContextPath('webserver') + '*', keycloak.protect(testRules(req)), (req, res) => {
//app.get(util.getContextPath('webserver') + '*', keycloak.protect('realm:app-user'), (req, res) => {

//app.get(util.getContextPath('webserver') + '*', require('connect-ensure-login').ensureLoggedIn('/'), (req, res) => {
//app.get(util.getContextPath('webserver') + '*', ensureLoggedInOpen, (req, res) => {
app.get(util.getContextPath("webserver") + "*", (req, res) => {
  //app.get(util.getContextPath('webserver') + '*', passport.authenticate("oidc"), (req, res) => {
  //app.get(util.getContextPath('webserver') + '*', keycloak.protect('realm:app-user'), (req, res) => {
  /*console.log(
         "session server", req.session
     ); */
  /* const details = parseToken(req.session['keycloak-token']);
     var token = req.kauth.grant.access_token.content;
     var permissions = token.authorization ? token.authorization.permissions : undefined;
     console.log("userDT", details);
     console.log(" keycloak.token", token);
     console.log(" keycloak permissions", permissions);*/
  //+ path.join(__dirname + global.gConfig.services.webserver["context-path"]
  var realPath = req.originalUrl.split("?");
  var listdata = fs.readFileSync(
    path.join(__dirname, "/public/app/views/index.html")
  );
  if (listdata) {
    listdata = listdata.toString();
    res.send(
      listdata.replace("site_prefix_value", util.getContextPath("webserver"))
    );
  }
  //res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
  // res.sendFile(global.gConfig.services.webserver["context-path"] + '/public/app/views/index.html');
});
//global.gConfig.services.webserver["context-path"]
if (util.ishttps("webserver")) {
  const Httpsoptions = {
    key: fs.readFileSync(path.join(__dirname, "ssl", "server.key")),
    cert: fs.readFileSync(path.join(__dirname, "ssl", "server.crt")),
  };
  https.createServer(Httpsoptions, app).listen(portExpress, () => {
    logger.info(
      nameFile +
        " | Up and running-- this is " +
        global.configService.app_name +
        " service on port:" +
        global.configService.port +
        " context-path: " +
        util.getContextPath("webserver")
    );
    console.log(
      "Up and running-- this is " +
        global.configService.protocol +
        " " +
        global.configService.app_name +
        " service on port:" +
        global.configService.port +
        " context-path:" +
        util.getContextPath("webserver")
    );
    // console.log(`${global.gConfig.services.webserver.port} listening on port ${global.gConfigt}`);
  });
} else {
  app.listen(portExpress, () => {
    // logger.error("testtt");
    logger.info(
      nameFile +
        " | Up and running-- this is " +
        global.configService.protocol +
        " " +
        global.configService.app_name +
        " service on port:" +
        global.configService.port +
        " context-path:" +
        util.getContextPath("webserver")
    );
    console.log(
      "Up and running-- this is " +
        global.configService.protocol +
        " " +
        global.configService.app_name +
        " service on port:" +
        global.configService.port +
        " context-path:" +
        util.getContextPath("webserver")
    );
    // console.log(`${global.gConfig.services.webserver.port} listening on port ${global.gConfigt}`);
  });
}
