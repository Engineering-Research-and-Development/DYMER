var util = require('../utility');
var jsonResponse = require('../jsonResponse');
require("../models/eaggregation/EaggregationConfigRule");
var http = require('http');
var express = require('express');
var router = express.Router();
const bodyParser = require("body-parser");
const path = require('path');
const nameFile = path.basename(__filename);
const logger = require('./dymerlogger');
const axios = require('axios');
const multer = require('multer');
const mongoose = require("mongoose");
require('./mongodb.js');
const EaggregationConfigRule = mongoose.model("EaggregationConfigRule");
var storageEngine = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, './uploads');
    },
    filename: function(req, file, fn) {
        fn(null, new Date().getTime().toString() + '-__-' + file.originalname);
    }
});
var upload = multer({ storage: storageEngine }).any();
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: false,
    limit: '100MB'
}));
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
        //console.log(x.connections[0].db);
    })
    .catch(err => {
        console.error("ERROR | " + nameFile + ` | Error connecting to mongo! Database name: "${x.connections[0].name}"`, err);
    });*/
/*
router.post('/setConfig', function(req, res) {
    console.log("aggiungo un mapping per onenness search");
    let callData = util.getAllQuery(req);
    let data = callData.data;
    var copiaData = Object.assign({}, data);
    var ret = new jsonResponse();
    var obj = data;
    var id = obj.id;
    delete obj.id;
    console.log("aggiungo un mapping per onenness search id=", id);
    var mod = new EaggregationConfig(obj);
    if (id != '' && id != undefined) {
        var myfilter = { "_id": mongoose.Types.ObjectId(id) };
        EaggregationConfig.updateOne(myfilter, obj,
            function(err, raw) {
                if (err) {
                    ret.setSuccess(false);
                    console.log('Error log: ' + err)
                    ret.setMessages("Model Error");
                    return res.send(ret);
                } else {
                    ret.addData(copiaData);
                    ret.setMessages("Config Updated");
                    return res.send(ret);
                }
            }
        );
 
    } else
        mod.save().then((el) => {
            ret.setMessages("Config created successfully");
            ret.addData(el);
            return res.send(ret);
        }).catch((err) => {
            if (err) {
                console.error(err);
                ret.setMessages("Post error");
                ret.setSuccess(false);
                ret.setExtraData({ "log": err.stack });
                return res.send(ret);
            }
        })
});

router.get('/configs', (req, res) => {
    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let data = callData.data;
    let queryFind = callData.query;
 
    console.log('data', data);

    OpnSearchConfig.find(queryFind).then((els) => {
            ret.setMessages("List");
            ret.setData(els);
            return res.send(ret);
        }).catch((err) => {
            if (err) {
                ret.setMessages("Get error");
                ret.setSuccess(false);
                ret.setExtraData({ "log": err.stack });
                return res.send(ret);
            }
        })
 
});*/
router.post('/addrule', function(req, res) {
    console.log("aggiungo un mapping per onenness search");
    let callData = util.getAllQuery(req);
    let data = callData.data;
    console.log('data', data);
    var ret = new jsonResponse();
    /* var newObj = {
         _index: data.op_index,
         _type: data.op_type,
         mapping: data.op_mapping,
         servicetype: data.servicetype,
         configuration: data.configuration
     }*/
    var newObj = data;
    var mod = new EaggregationConfigRule(newObj);
    mod.save().then((el) => {
        ret.setMessages("Rule uploaded successfully");
        ret.addData(el);
        return res.send(ret);

    }).catch((err) => {
        if (err) {
            console.error(err);
            ret.setMessages("Post error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })

});
router.get('/rules/', (req, res) => {

    let callData = util.getAllQuery(req);
    let queryFind = callData.query;
    //return res.send(ret);
    return findRule(queryFind, res);

});

function findRule(queryFind, res) {
    var ret = new jsonResponse();
    EaggregationConfigRule.find(queryFind).then((els) => {
        console.log('EaggregationConfigRule', els);
        ret.setMessages("List");
        ret.setData(els);
        console.log('ret', ret);
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            ret.setMessages("Get error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
}
router.delete('/rule/:id', (req, res) => {
    var ret = new jsonResponse();
    var id = req.params.id;
    var myfilter = { "_id": id };

    EaggregationConfigRule.findOneAndDelete(myfilter).then((el) => {

        ret.setMessages("Element deleted");
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            ret.setMessages("Delete Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});


router.post('/addToCart', function(req, res) {
    //controllo se esiste ordine di mia proprietà
    //esiste: faccio un put
    //non esiste: creo 
    var ret = new jsonResponse();
    let callData1 = util.getAllQuery(req);
    //  console.log("1-arrivata carrello1", callData1);
    upload(req, res, function(err) {
        let callData = util.getAllQuery(req);
        //console.log("2-arrivata carrello da", callData);
        // console.log("3-arrivata carrello da", callData.data[0].properties);
        var id_el = callData.data[0].id;
        // console.log("4-arrivata carrello id", id_el);
        // console.log("5-arrivata carrello id", callData.authdata.properties.owner);
        /*//salvo la lista delle entità non sincronizzate
                        postObj
                        error.code */
        //const resTolen = await axios.post('http://localhost:8080/api/auth/userinfo', { token: req.headers.dymertoken });
        var wbsUrl = util.getServiceUrl('webserver');
        var posturl = wbsUrl + "/api/entities/api/v1/entity";
        var order_id = 0;
        var geturl = wbsUrl + "/api/entities/api/v1/entity/_search";
        var getObjEntity = {
            query: {
                "bool": {
                    "must": [{
                        "term": {
                            "_id": id_el
                        }

                    }]
                }
            }
        };
        console.log('getturl', geturl);
        axios.post(geturl, { query: getObjEntity }).then(function(resp_entity) {
                console.log('resp_entity', resp_entity.data.data[0]);

                var entityDet = resp_entity.data.data[0];

                var entityDetail = resp_entity.data.data[0]["_source"];
                var getObjOrder = {
                    query: {
                        "bool": {
                            "must": [{
                                "term": {
                                    "_index": "orders"
                                }
                            }, {
                                "term": {
                                    "properties.status": "1"
                                }
                            }]
                        }
                    }
                };
                var entityToAdd = {
                    title: entityDetail.title,
                    description: entityDetail.description,
                    type: entityDet['_index'],
                    id: entityDet['_id'],
                    code: "",
                    price: 0,
                    qt: 1
                };
                //    console.log('entityDet', entityDet);

                axios.post(geturl, { query: getObjOrder, authdata: callData.authdata }).then(function(listorders) {
                        //console.log('getresponse1', listorders.data.data[0]["_source"], listorders.data.data.length);
                        // return res.send(ret);
                        if (listorders.data.data.length > 0) {
                            var myOrder = listorders.data.data[0]["_source"];
                            // console.log('esiste');
                            var order_id = listorders.data.data[0]["_id"];
                            var exsist = false;
                            myOrder.entities.forEach((element) => {
                                //console.log('el', element.id);
                                if (element.id == entityDet['_id']) {
                                    element.qt = element.qt + 1;
                                    exsist = true;
                                }
                            });
                            var propert_ = callData.authdata.properties;
                            propert_.status = "1";
                            propert_.visibility = "2";
                            var postObj = {
                                "instance": {
                                    "index": "orders",
                                    "type": "orders"
                                },
                                "data": {
                                    title: "My Order",
                                    entities: [entityToAdd],
                                    amount: "",
                                    properties: propert_
                                }

                            };
                            if (!exsist) {

                                myOrder.entities.push(entityToAdd);
                            }
                            //console.log("FATTO");
                            axios.put(posturl + "/" + order_id, { "data": myOrder, authdata: callData.authdata }).then(function(updatedEl) {
                                //console.log("FATTO");

                                ret.setMessages("Added to cart");
                                ret.addData({});
                                return res.send(ret);
                            }).catch(function(error) {
                                console.log('error1', error);
                            });
                        } else {
                            // console.log('vuoto');
                            var propert_ = callData.authdata.properties;
                            propert_.status = "1";
                            propert_.visibility = "2";
                            var postObj = {
                                "instance": {
                                    "index": "orders",
                                    "type": "orders"
                                },
                                "data": {
                                    title: "My Order",
                                    entities: [entityToAdd],
                                    amount: "",
                                    properties: propert_
                                }

                            };
                            console.log("postObj", postObj);

                            axios.post(posturl, postObj, {}).then(function(response) {
                                    console.log("FATTO");

                                    ret.setMessages("Added to cart");
                                    ret.addData({});
                                    return res.send(ret);
                                })
                                .catch(function(error) {

                                    ret.setSuccess(false);
                                    ret.setMessages("Error In Cart ");
                                    ret.setExtraData({ "log": error.stack });
                                    return res.send(ret);
                                });
                        }

                    })
                    .catch(function(error) {
                        console.log('error1', error);
                        ret.setSuccess(false);
                        ret.setMessages("Error In Cart ");
                        ret.setExtraData({ "log": error.stack });
                        return res.send(ret);
                    });

            })
            .catch(function(error) {
                console.log('error', error);
                ret.setSuccess(false);
                ret.setMessages("Error In Cart ");
                ret.setExtraData({ "log": error.stack });
                return res.send(ret);
            });
    });
});
router.post('/removeFromCart', function(req, res) {
    //controllo se esiste ordine di mia proprietà
    //esiste: faccio un put
    //non esiste: creo 
    var ret = new jsonResponse();
    let callData1 = util.getAllQuery(req);
    //  console.log("arrivata carrello1", callData1);
    upload(req, res, function(err) {
        let callData = util.getAllQuery(req);
        //  console.log("arrivata carrello da", callData);
        //   console.log("arrivata carrello da", callData.data[0].properties);
        var id_el = callData.data[0].id;
        var id_cartel = callData.data[0].cartid;

        var wbsUrl = util.getServiceUrl('webserver');
        var posturl = wbsUrl + "/api/entities/api/v1/entity";
        var order_id = 0;
        var geturl = wbsUrl + "/api/entities/api/v1/entity/_search";
        var getObjEntity = {
            query: {
                "bool": {
                    "must": [{
                        "term": {
                            "_id": id_cartel
                        }

                    }]
                }
            }
        };




        axios.post(geturl, { query: getObjEntity, authdata: callData.authdata }).then(function(listorders) {
                //console.log('getresponse1', listorders.data.data[0]["_source"], listorders.data.data.length);
                //return res.send(ret);
                if (listorders.data.data.length > 0) {
                    var myOrder = listorders.data.data[0]["_source"];
                    // console.log('esiste');

                    var exsist = false;
                    var newList = [];
                    myOrder.entities.forEach((element) => {
                        //console.log('el', element.id);
                        if (element.id == id_el) {

                            exsist = true;
                        } else
                            newList.push(element);
                    });
                    var propert_ = callData.authdata.properties;
                    propert_.status = "1";
                    propert_.visibility = "2";

                    if (exsist) {
                        myOrder.entities = newList;

                        axios.put(posturl + "/" + id_cartel, { "data": myOrder, authdata: callData.authdata }).then(function(updatedEl) {


                            ret.setMessages("Removed cart");
                            ret.addData({});
                            return res.send(ret);
                        }).catch(function(error) {
                            ret.setSuccess(false);
                            ret.setMessages("Error In remove ");
                            ret.setExtraData({ "log": error.stack });
                            return res.send(ret);
                        });
                    } else {
                        console.log('vuoto');
                        ret.setMessages("Prod not exsist");
                        ret.addData({});
                        return res.send(ret);
                    }

                } else {
                    console.log('vuoto');
                    ret.setMessages("Cart not exsist");
                    ret.addData({});
                    return res.send(ret);
                }

            })
            .catch(function(error) {
                console.log('error1', error);
                ret.setSuccess(false);
                ret.setMessages("Error In Cart ");
                ret.setExtraData({ "log": error.stack });
                return res.send(ret);
            });


    });
});
router.post('/checkout', function(req, res) {
    //faccio il put ordine con il set di deleted
    //inoltro al servizio
    var ret = new jsonResponse();
    var wbsUrl = util.getServiceUrl('webserver');
    var geturl = wbsUrl + "/api/entities/api/v1/entity/_search";
    var posturl = wbsUrl + "/api/entities/api/v1/entity";
    upload(req, res, function(err) {
        let callData = util.getAllQuery(req);
        console.log("arriva checkout", callData, callData.data[0].id);
        var order_id = callData.data[0].id;

        var getObjEntity = {
            query: {
                "bool": {
                    "must": [{
                        "term": {
                            "_id": order_id
                        }

                    }]
                }
            }
        };

        //  axios.post(geturl, { query: getObjEntity, authdata: callData.authdata }).then(function(listorders) {
        axios.post(geturl, { query: getObjEntity, authdata: callData.authdata }).then(function(resp_entity) {
                // console.log('resp_entity', resp_entity.data);
                //return res.send(ret);
                var myOrder = resp_entity.data.data[0]["_source"];
                myOrder.properties.status = "10";
                //  console.log('faccio put', myOrder);
                // return res.send(ret);
                axios.put(posturl + "/" + order_id, { "data": myOrder, authdata: callData.authdata }).then(function(updatedEl) {
                    //    console.log("FATTO");

                    ret.setMessages("Checkout completato");
                    ret.addData({});
                    return res.send(ret);
                }).catch(function(error) {
                    console.log('error1', error);
                    ret.setSuccess(false);
                    ret.setMessages("Error In Checkout ");
                    ret.setExtraData({ "log": error.stack });
                    return res.send(ret);
                });
            })
            .catch(function(error) {
                console.log('error', error);
                ret.setSuccess(false);
                ret.setMessages("Error In Checkout ");
                ret.setExtraData({ "log": error.stack });
                return res.send(ret);
            });

    });
});


router.post('/listener', function(req, res) {
    // console.log("arrivato listener");
    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let data = callData.data;
    // console.log('data', data);
    res.send(ret);
    //eventSource:
    //console.log("proseguo");
    var eventSource = (data.eventSource).split('_');;

    var queryFind = {
        "_index": data.obj._index,
        "_type": data.obj._type,
        "servicetype": eventSource[1]
    };
    //  console.log('queryFind', queryFind);
    EaggregationConfigRule.find(queryFind).then((els) => {
        //    console.log('Regole del richiesto Aggr', els);
        ret.setMessages("List");
        ret.setData(els);
        //    console.log('ret', ret, els.length > 0);
        //   return res.send(ret);
        //  if (eventSource[1] == 'insert')
        //  if (els.length > 0)
        callEaggregationJsw(els[0], data.obj);
        // postOrder(eventSource[1], data.obj, els[0] ); 
    }).catch((err) => {
        if (err) {
            ret.setMessages("Get error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            //     return res.send(ret);
        }
    });

    //query se esiste una rule
    //se esiste eseguo il mapping
    //prendo i parametri di config ed inoltro la chiamata
    //fatto in addassett
});


function callEaggregationJsw(conf, postObj) {
    // console.log('callEaggregationJsw conf ', conf);
    // console.log('callEaggregationJsw postObj', postObj);
    //  var opnConfUtil = util.getServiceConfig("opnsearch");
    var callurl = conf.configuration.host;
    if (!((callurl.indexOf("http://") == 0) || (callurl.indexOf("http://") == 0))) {
        callurl = "http://" + callurl;
    }
    if (conf.configuration.port != undefined)
        if (conf.configuration.port != '')
            callurl += ":" + conf.configuration.port;
    callurl += "/api/jsonws/invoke";
    /* if (conf.configuration.path != undefined)
         if (conf.configuration.path != '')
             callurl += conf.configuration.path;*/
    var objectData = postObj._source;
    objectData["id"] = postObj["_id"];
    // console.log('conf.servicetype ==  update ', conf.servicetype == 'update');
    //  console.log('postObj.properties.status ==  10 ', objectData.properties.status == '10');
    //  console.log('conf.configuration.method ==  POST  ', conf.configuration.method == "POST");

    if (conf.servicetype == 'update') {
        if (objectData.properties.status == '10') {
            if (conf.configuration.method == "POST") {
                var mapRules = conf.mapping;
                //   console.log('mapRules ', mapRules);
                Object.keys(mapRules).forEach(function(key) {
                    console.log('mapRules[key] in objectData ', mapRules[key] in objectData);
                    if (mapRules[key] in objectData)
                        mapRules[key] = objectData[key];


                });

                postObj = mapRules;
                // console.log('Eaggregation Inoltro Post a ', callurl);
                // console.log('Eaggregation Inoltro Post a ', postObj);

                var configqq = {
                    //mr   "headers": {
                    //mr       "Authorization": "Basic " + authorizationBasic
                    //mr   }
                };

                //mr      console.log('configqq ', configqq);
                axios.post(callurl, postObj, configqq)
                    .then(function(response) {
                        //  console.log("FATTO");
                        console.log(response);
                    })
                    .catch(function(error) {

                        console.log("ORRORE", error);

                    });
            } else {
                console.log('Inoltro GET a ', callurl);
                console.log('Inoltro GET a ', postObj);
                axios.get(callurl, { params: postObj });
            }

        }
    }


}
module.exports = router;