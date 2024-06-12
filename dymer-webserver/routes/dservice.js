var express = require('express');
var router = express.Router();
const { createProxyMiddleware } = require('http-proxy-middleware');
const util = require("../utility");

const jsonPlaceholderProxy = createProxyMiddleware({
    target: util.getServiceUrl("dservice"),
    changeOrigin: true, // proxy websockets
    ws: true,
    pathRewrite: function(path, req) {
        path = path.replace(util.getContextPath('webserver'), util.getContextPath('dservice'));
        path = path.replace("/api/dservice", "");
        //console.log('inoltro', path);
        return path;
    }
});

router.use(
    jsonPlaceholderProxy
);

/*
router.use(proxy(util.getServiceUrl("form"), {
  proxyReqPathResolver: function (req) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {   // simulate as0ync
        console.log("ut", util.getServiceUrl("form"));
        console.log("req", req.url);

        var resolvedPathValue = util.getServiceUrl("form")+ req.url;
        console.log("resolvedPathValue", resolvedPathValue);
        resolve(resolvedPathValue);
      }, 200);
    });
  }
}));*/
//router.use(proxy("localhost:4747"));
/* 

router.post('*', function (req, res, next) {
  //"http://127.0.0.1:4747/api/v1/form"
  
  console.log("router form : POST",req);
  let url = util.serviceFormUrl() + `api/v1${req._parsedUrl.path}`;
  
  let obj = req.body;
  console.log("router url : ",url);
  console.log("router obj : ",obj);
  axios.post(url, obj, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
}).then(function (response) {
    console.log("chiamato : "+response.data);
    return res.json(response.data);
  })
    .catch(function (error) {
      var ret = new jsonResponse();
      ret.setSuccess(false);
      ret.setMessages("Errore post ");
      ret.setExtraData({ "log": error.stack });
      return res.send(JSON.stringify(ret));
    });
});
router.get('*', function (req, res, next) {
 // console.log("router form : GET",req);
  let url = util.serviceFormUrl() + `api/v1${req._parsedUrl.path}`;
  let obj = {};
  obj.params = req.body;
  axios.get(url, obj).then(function (response) {
    var pathurl=req.url;
    var conf=1;//(pathurl).indexOf('/html/');
    console.log(util.serviceFormUrl()+response.data);
   // if(conf > -1)
  // return res.sendFile(util.serviceFormUrl()+response.data);

    return   res.json(response.data);
  })
    .catch(function (error) {
      var ret = new jsonResponse();
      ret.setSuccess(false);
      ret.setMessages("Errore recupero entità");
      ret.setExtraData({ "log": error.stack });
      return   res.send(JSON.stringify(ret));
    });
});
router.put('*', function (req, res, next) {
  let url = util.serviceFormUrl() + `api/v1${req._parsedUrl.path}`;
  let obj = {};
  obj.params = req.body;
  axios.put(url, obj).then(function (response) {
    return res.json(response.data);
  })
    .catch(function (error) {
      var ret = new jsonResponse();
      ret.setSuccess(false);
      ret.setMessages("Errore inserimento entità");
      ret.setExtraData({ "log": error.stack });
      return res.send(JSON.stringify(ret));
    });
});

router.delete('*', function (req, res, next) {
  let url = util.serviceFormUrl() + `api/v1${req._parsedUrl.path}`;
  let obj = {};
  obj.data = req.body;
  axios.delete(url, obj).then(function (response) {
    return res.json(response.data);
  })
    .catch(function (error) {
      var ret = new jsonResponse();
      ret.setSuccess(false);
      ret.setMessages("Errore eliminazione entità");
      ret.setExtraData({ "log": error.stack });
      return res.send(JSON.stringify(ret));
    });
});*/
module.exports = router;