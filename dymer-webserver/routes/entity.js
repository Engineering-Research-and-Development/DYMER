var express = require("express");
var router = express.Router();
var bodyParser = require("body-parser");
const multer = require('multer');
const axios = require('axios');
var cookieParser = require('cookie-parser');
var session = require('express-session');
const jwt = require('jsonwebtoken');
//var proxy = require("express-http-proxy");
/*const keycloak = require('../config/keycloak-config.js').initKeycloak({
    onLoad: 'login-required'
});*/
//const keycloak = require('../config/keycloak-config.js').getKeycloak();
//var proxy = require("http-proxy-middleware");

const {createProxyMiddleware} = require('http-proxy-middleware');

const SESSION_LIFETIME = 3600 * 1000 * 2;
const SESSION_NAME = 'dymersid';
const SESSION_SECRET = 'keyboard cat';
const users = [];
//require("../config/config.js");
//router.use(proxy(global.gConfig.services.entity.ip_port));
const util = require("../utility");
router.use(cookieParser());
router.use(session({
					   name:              SESSION_NAME,
					   secret:            SESSION_SECRET,
					   resave:            false,
					   saveUninitialized: false,
					   cookie:            {
						   httpOnly: false,
						   maxAge:   SESSION_LIFETIME
						   /*,
								   secure: true*/
					   }
				   }));

//var upload = multer({ storage: multer.memoryStorage() }).any();
//console.log(" util.getServiceUrl", util.getServiceUrl("entity"));
/*router.get('*', (req, res, next) => {
    // console.log("router.get");
    next();
    //res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
});*/
router.get('*', (req, res, next) => {
	// #swagger.tags = ['Webserver']

	// console.log("router.get");
	next();
	//res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
});

/*router.post('*', (req, res, next) => {
    //* console.log("router.post");
    upload(req, res, function(err) {
        let callData = util.getAllQuery(req);

        console.log("bb.authdata", callData.authdata);
        //next();

        //next();
    });
});*/

router.post('*', (req, res, next) => {
	// #swagger.tags = ['Webserver']


	next();
});
/*router.post('*', upload.any(), (req, res, next) => {
    let callData = util.getAllQuery(req);

    console.log("bb.authdata", callData.authdata);
    // next();
    res.send(req);
});*/
/*router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));*/
var test = function (proxyReq, req, res) {
	return new Promise(resolve => {

		upload(req, res, function (err) {
			if (req.body) {
				let bodyData = req.body;
				qq = bodyData;
				console.log("bodyData1", bodyData);
				// incase if content-type is application/x-www-form-urlencoded -> we need to change to application/json
				//    proxyReq.setHeader('Content-Type','application/json');
				//   proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
				// stream the content
				// proxyReq.write(bodyData);
				//   var contentType = proxyReq.getHeader('Content-Type');
				// proxyReq.setHeader('x-added', 'foobar')
				// proxyReq.headers["x-totto"] = 'titto';
				bodyData.authdata.properties["sasa"] = 2;
				console.log("bodyData2", bodyData);
				/*  if (contentType === 'application/json') {
					  bodyData = JSON.stringify(req.body);
				  }

				  if (contentType === 'application/x-www-form-urlencoded') {
					  bodyData = queryString.stringify(req.body);
				  }*/
				req.body.authdata.properties["sasa"] = 2;
				if (bodyData) {
					//     proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
					//    proxyReq.write(bodyData);
				}
				//   proxyReq.write(bodyData);
				//   proxyReq.write(bodyData);
				//    return proxyReq.end();
			}
			resolve(qq);
		});


	});
}
/*router.post('*', function(req, res, next) {
	let callData = util.getAllQuery(req);
	test(null, req, res).then(function(data) {
		console.log("bb.authdata", data);
		//
	});

	next();
});*/
router.use((req, res, next) => {
	// console.log('***----------');
	const {userId} = req.session;
	if (userId) {
		//  console.log('userId', userId);
		next();
	} else {
		//  console.log('userId no userId');
		next();
	}
})

const redirectLogin = (req, res, next) => {
	if (!req.session.userId) {
		//  console.log("controlla: no logged");
		next();
	} else {
		// console.log("controlla: is logged");
		next();
	}
}
router.use('*', redirectLogin, async (req, res, next) => {
	//console.log("session", req.session);
	//  console.log('SessionID: ', req.sessionID);
	/* const { userId } = req.session;
	 if (!req.session.count) {
		 req.session.count = 0;
	 }
	 req.session.count += 1;*/
	req.session.cicci = "sese";
	// respond with the session object


	/* console.log('----------');
	 console.log('Primo: ', req.cookies);
	 console.log('Primo url: ', req.url);*/
	/*  console.log("passa body", req.body);
	  console.log("passa param", req.params);
	  console.log("passa header", req.headers); //riesco a prendere header con il token
	  console.log("passa cookies", req.cookies);*/
	const {dymertoken} = req.headers;
	const {userId} = req.session;

	if (dymertoken != 'null' && dymertoken != 'undefined' && dymertoken != undefined) {
		//  if (req.headers.dymertoken) {
		req.session.cicci2 = "sese2";
		//m    const resTolen = await axios.post('http://localhost:8080/api/auth/userinfo', { token: req.headers.dymertoken });
		/* axios.post('http://localhost:8080/api/auth/userinfo', { token: req.headers.dymertoken }).then(function(response) {
				 console.log("FATTO");
				 console.log(response.data);
				 // return response.data.data;
				 // resolve(response.data.data);
			 })
			 .catch(function(error) {
				 console.log("ORRORE");
				 console.error("status:" + error.response.status);
				 console.error("data:" + error.response.data);
				 // resolve(myheader);
				 // console.log(error);
			 });*/

		//m  const usrlg = resTolen.data.data.user;
		//    console.log("usrlg", usrlg);
		//m  users[usrlg.id] = (usrlg);
		//m   req.session.userId = usrlg.id;
		//m   req.session.cicci3 = "sese3";
		//req.session.user = resTolen.data.data.user.id;

	}
	if (dymertoken != 'null' && dymertoken != 'undefined' && dymertoken != undefined) {
		req.headers.provaora = JSON.stringify({secondo: 'valore2'});
	} else {
		req.headers.provaora = JSON.stringify({primo: 'valore1'});
	}
	// console.log("req.dymertoken:", req.headers.dymertoken);
	/* if("req.session.token"){
		 const resTolen= await axios.post("/api/auth/userinfo",data,this.options);
		 req.session.token=resToken.data
	 }*/
	// console.log('***----------');


	// console.log('R ENT Session passport: ', req.session);


	//  console.log('R ENT Session cookie: ', req.session.cookie);
	//  console.log('R ENT  SessionID: ', req.sessionID);
	//  console.log('GETtk: ', GETtk(req.session['keycloak-token']));
	//  console.log('***----------');
	//  console.log("R ENT  users", users);
	const tk = GETtk(req.session['keycloak-token']);


	req.headers.authdata = tk;
	retriveInfoTk(tk, res);
	next();
})

const retriveInfoTk = (t, res) => {

	var decoded = jwt.decode(t);
	//console.log('R ENT  sessionPPPP', JSON.stringify(decoded));
	if (decoded != null) {
		res.cookie("d_uid", decoded.sub);
		res.cookie("g_uid", 0);
	} else {
		res.cookie("d_uid", 0);
		res.cookie("g_uid", 0);
	}

	// return t
}


const GETtk = (f, res, next) => {
	var T = {};
	if (f != undefined) {
		T = JSON.parse(f);
		T = T['access_token'];
	}
	return T;
}


const jsonPlaceholderProxy = createProxyMiddleware({
													   target:       util.getServiceUrl("entity"),
													   secure:       true,
													   changeOrigin: true, // proxy websockets
													   ws:           true,
													   onProxyReq:   (proxyReq, req) => {

														   //    console.log("proxyReq");
														   //   console.log('KKKKKKKKKK: ', req.url, req.session)
														   //     console.log('Cookies: ', req.cookies)
													   },
													   onProxyRes(proxyRes, req, res) {
														   // console.log("onProxyRes", res);
														   // res.headers['ilmio-hd'] = 'foobar'; // add new header to response
														   res.cookie("ilmiocookie", 'value', {expire: 360000 + Date.now()}); //setto correttamente un cookie
														   //      console.log('Cookies res: ', req.url)
														   var vv = req.cookies.sasa;
														   if (vv == '' || vv == undefined)
															   vv = 1;
														   var updc = parseInt(vv) + 1;
														   res.cookie("ilmiocookie2", updc, {expire: 360000 + Date.now()}); //setto correttamente un cookie
													   },
													   pathRewrite: function (path, req, res) {
														   //       let callData = util.getAllQuery(req);
														   //   console.log("AAAAAreq", req.url);
														   //if (req.url == "/api/entities/api/v1/entity/_search")
														   //     console.log("AAAAAreq2", callData);
														   //  res.cookie("ilmio", 'value', { expire: 360000 + Date.now() });
														   //  console.log("req.url 2", req.url);
														   //   console.log("path 1", path);
														   path = path.replace(util.getContextPath('webserver'), util.getContextPath('entity'));
														   // path = path.replace(global.gConfig.services["webserver"]["context-path"], global.gConfig.services["entity"]["context-path"]);
														   path = path.replace('/api/entities', '');
														   // console.log("path 2", path);
														   return path;
													   }

												   });
router.use(
	jsonPlaceholderProxy
);


module.exports = router;
/*

logout
req.session.destroy(err=>{
    if(err){
        console.log("errore");
    }
    res.clearCookie(SESSION_NAME);
})
*/