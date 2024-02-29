var util = require('../utility');
var jsonResponse = require('../jsonResponse');
const multer = require('multer');
var fs = require('fs');
var mv = require('mv');
var http = require('http');
require("../models/configTool/configTool");
var express = require('express');
const bodyParser = require("body-parser");
const path = require('path');
const nameFile = path.basename(__filename);
const logger = require('./dymerlogger')
const mongoose = require("mongoose");
require('./mongodb.js');
var router = express.Router();
var jsonParser = bodyParser.json();
const configTool = mongoose.model("configTool");
const axios = require('axios');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: false,
    limit: '100MB'
}));
//   /api/v1/opn/
/*const mongoURI = util.mongoUrlForm();
console.log(nameFile + ' | mongoURI :', JSON.stringify(mongoURI));
var db;
mongoose
    .connect(mongoURI, {
        //useCreateIndex: true,
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
    });
*/
var storageEngine = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, './uploads');
    },
    filename: function(req, file, fn) {
        fn(null, new Date().getTime().toString() + '-__-' + file.originalname);
    }
});
var upload = multer({ storage: storageEngine }).any(); // .single('file');
router.post('/setConfig', util.checkIsAdmin, function(req, res) {

    let callData = util.getAllQuery(req);
    let data = callData.data;
    var copiaData = Object.assign({}, data);
    var ret = new jsonResponse();
    var obj = data;
    var id = obj.id;
    delete obj.id;
    //console.log(nameFile + ' | post/setConfig | create obj : ', JSON.stringify(obj));
    var mod = new configTool(obj);
    if (id != '' && id != undefined) {
        var myfilter = { "_id": mongoose.Types.ObjectId(id) };
        configTool.updateOne(myfilter, obj,
            function(err, raw) {
                if (err) {
                    ret.setSuccess(false);
                    logger.error(nameFile + ' | post/setConfig | update : ' + err);
                    console.error("ERROR | " + nameFile + " | post/setConfig | update ", err);
                    ret.setMessages("Model Error");
                    return res.send(ret);
                } else {
                    ret.addData(copiaData);
                    ret.setMessages("Config Updated");
                    return res.send(ret);
                }
            }
        );
        /*  Model.updateOne
          mod.update({ _id: id }, obj, { upsert: true }, function(err) {});*/
    } else
        mod.save().then((el) => {
            ret.setMessages("Config created successfully");
            ret.addData(el);
            return res.send(ret);
        }).catch((err) => {
            if (err) {
                console.error("ERROR | " + nameFile + " | post/setConfig | create ", err);
                logger.error(nameFile + ' | post/setConfig | create : ' + err);
                ret.setMessages("Post error");
                ret.setSuccess(false);
                ret.setExtraData({ "log": err.stack });
                return res.send(ret);
            }
        })
});

router.post('/addconfig', util.checkIsAdmin, function(req, res) {

    let callData = util.getAllQuery(req);
    //console.log(callData);
    let data = callData.data;
    let dview = callData.dataview;
    let datasearch = callData.dataSearch;
    let _indexType = callData._index;
    var ret = new jsonResponse();
    var newObj = {
            typeView: dview,
            dataSearch: datasearch,
            _index: _indexType,
            configuration: data
        }
        //console.log(nameFile + ' | post/addconfig | create newObj : ', JSON.stringify(newObj));
    var mod = new configTool(newObj);
    mod.save().then((el) => {
        ret.setMessages("Configuration uploaded successfully");
        ret.addData(el);
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            logger.error(nameFile + ' | post/addconfig | create : ' + err);
            console.error("ERROR | " + nameFile + " | post/addconfig | create ", err);
            ret.setMessages("Post error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

router.get('/renderpage/:id', function(req, res) {

    let formData;
    let dataView;
    let dataSearch;
    //var baseUrlTemp=location.protocol+'//'+location.hostname+':'+location.port;
    var baseUrlTemp = "";
    const _Id = req.params.id;
    //console.log(nameFile + ' | get/renderpage/:id | _Id : ',_Id);
    configTool.findById(mongoose.Types.ObjectId(_Id)).then((els) => {
        //console.log(els);
        formData = els.configuration;
        dataView = els.typeView;
        dataSearch = els.dataSearch;
        // console.log(formData);
        var baseHTML = '<!DOCTYPE html>\n' +
            '<html lang="en">' +
            '<head>\n' +
            '<meta charset="utf-8">\n' +
            '<meta content="width=device-width, initial-scale=1.0" name="viewport">\n' +
            '<title> </title>\n' +
            '<meta content="" name="description">' +
            '<meta content="" name="keywords">\n' +
            '<script>';
        baseHTML += 'var dviewtype="' + dataView + '"; \n';
        baseHTML += '</script> \n';
        var queryTemp = formData.query.toString();
        //var queryTemp=formData;
        var importString = "";
        var importStringJQ;
        var importStringBT;
        if (!formData.requireJquery && !formData.requireBootstrap) {
            importStringJQ = "jquery";
            importStringBT = "bootstrap";
            importString = importStringJQ + importStringBT;
        } else {
        }
        if (formData.viewtype == 0) {
            dymerJs = "dymer.viewer.js";
            scriptSRC = ' <script> var dTagFilter;\n' +
                ' var dymerQueries =[' + queryTemp + '];\n' +
                ' var dymerconf= {\n' +
                '      notImport:[' + importString + ']\n' +
                '   };\n' +
                'var jsonConfig = {' +
                ' \t \tquery: { \'query\': { \'query\' : dymerQueries[0]}},\n' +
                ' \t \tendpoint: \'entity.search\',\n' +
                ' \t \tviewtype: \'teaserlist\',\n' +
                ' \t \ttarget: {\n' +
                '    teaserlist: {\n' +
                ' \t \t \t      id: "#cont-MyList",\n' +
                ' \t \t \t      action: "html",\n' +
                ' \t \t \t      reload:false\n' +
                ' \t \t },\n' +
                '  \t \tfullcontent: {\n' +
                ' \t \t\t \t    id: "#cont-MyList",\n' +
                '  \t \t\t \t  action: "html"\n' +
                '\t \t}\n' +
                '\t \t}\n' +
                ' \t \t};\n' +
                'function mainDymerView() {' +
                ' var index = \'' + formData.modeltoAdd + '\';\n' +
                'if(index!="")\n' +
                'loadModelListToModal($(\'#cont-addentity\'), index);\n';
            if (formData.showSearch) {
                scriptSRC += '  setTimeout(function() {\n' +
                    'dTagFilter = $(\'#dTagFilter\');\n' +
                    'dTagFilter.dymertagsinput({\n';
                if (formData.baseFilterSearch) {
                    scriptSRC += ' indexterms: ' + formData.baseFilterSearch + ',';
                }
                scriptSRC += ' allowDuplicates: true,\n';
                if (dataSearch == 'snippets') {
                    scriptSRC += 'freeInput: false,\n' +
                        'itemValue: \'id\', \n' +
                        'itemText: \'label\'\n';
                } else {
                    scriptSRC += 'freeInput: true\n';
                }
                scriptSRC += '});\n';
                scriptSRC += ' dTagFilter.on(\'beforeItemRemove\', function(event) {\n' +
                    '$(\'#d_entityfilter [filter-rel="\' + event.item.id + \'"\').prop("checked", false);\n' +
                    '}); \n';
                if (!formData.loadSearch) {
                    //to cehck
                }
                scriptSRC += ' }, 3000);\n';
                if (!formData.filtermodel && dataSearch == 'snippets') {
                    scriptSRC += ' var indexFilter ="' + formData.filtermodel + '";\n';
                    scriptSRC += '     loadFilterModel(indexFilter, dTagFilter);\n';
                }
            }
            if (formData.loadSearch) {
                scriptSRC += '  drawEntities(jsonConfig);\n';
            } else {
                scriptSRC += '   loadEntitiesTemplate(jsonConfig);\n';
            }
            scriptSRC += '    checkbreadcrumb(null, $(\'#primodfil\'));}\n';
            scriptSRC += '</script>\n';
            baseHTML += scriptSRC;
        }
        baseHTML += ' </head> <body>\n' +
            '<div class="container-fluid" id="containerDymerViewer"> \n';
        if (formData.showSearch) {
            if (formData.showSearch == 2) {
                var filterHTMLSnippet = '<div id="dymer_filtercontent">' +
                    '<div class="row">' +
                    '<div class="col-12 span12">' +
                    '<div class="input-group" id="adv-search">' +
                    '<input id="dTagFilter" type="text" data-role="tagsinput" placeholder="Search for snippets, click on caret" class="col-6 span6">' +
                    '	<div class="input-group-btn">' +
                    '<div class="btn-group" role="group">' +
                    '<div class="dropdown dropdown-lg">' +
                    '	<button type="button" id="dFilterClearAll" class="btn   " data-autostart="' + formData.loadSearch + '"><i class="fas fa-eraser" onclick="clearDFilter()"></i></button>' +
                    '<button type="button" id="dFilterDropdown" class="btn btn-default dropdown-toggle" data-toggle="dropdown"><span class="caret"></span></button>' +
                    '<div id="d_entityfilter" class="dropdown-menu dropdown-menu-right" role="menu">' +
                    +formData.customFilterSearch +
                    '</div>' +
                    '</div>' +
                    '<button type="button" class="btn btn-primary" onclick="switchByFilter(dTagFilter, dviewtype)"><i class="fa fa-search" aria-hidden="true"></i></button>' +
                    '</div>' +
                    ' </div>' +
                    '</div>' +
                    '</div>' +
                    '</div> ' +
                    '<br>' +
                    '</div> ';
                baseHTML += filterHTMLSnippet;
            }
            if (formData.showSearch == 1) {
                var filterHTMLFreeInput = '<div id="dymer_filtercontent">' +
                    '<div class="row">' +
                    '<div class="col-12 span12">' +
                    ' <div class="input-group" id="adv-search">' +
                    '<input id="dTagFilter" type="text" data-role="tagsinput" placeholder="Search" class="col-6 span6 freetext" value="">' +
                    '<div class="input-group-btn">' +
                    ' <div class="btn-group" role="group">' +
                    ' <div class="dropdown dropdown-lg">' +
                    '  <button type="button" id="dFilterClearAll" class="btn freetext  " data-autostart="' + formData.loadSearch + '"><i class="fas fa-eraser" onclick="clearDFilter()"></i></button> ' +
                    ' </div>' +
                    '<button type="button" class="btn btn-primary" onclick="switchByFilter(dTagFilter, dviewtype)"><i class="fa fa-search" aria-hidden="true"></i></button>' +
                    '</div>' +
                    ' </div>' +
                    ' </div>' +
                    ' </div>' +
                    '</div> ' +
                    '<br>' +
                    '</div> ' +
                    '<script>' +
                    ' $("#dTagFilter").on(\'keyup\', function (e) {' +
                    ' if (e.key === \'Enter\' || e.keyCode === 13) {' +
                    '   switchByFilter(dTagFilter, dviewtype);' +
                    '}' +
                    ' });' +
                    '</script>';
                baseHTML += filterHTMLFreeInput;
            }
        } //show search if
        baseHTML += '<div class="">\n' +
            '<div class="col-12 span12 ">\n' +
            '<span id="primodfil "  class="btn  btn-listdymer " onclick= "drawEntities(jsonConfig);" >\n' +
            '<i class="fa fa-list" aria-hidden="true"></i> ' + formData.label + '</span> <span id="cont-addentity" class="pull-right"> </span>\n' +
            '</div>\n' +
            ' </div>\n';
        if (formData.showBread) {
            baseHTML += '<br><div id="dymer_breadcrumb"></div><br>\n';
        }
        baseHTML += '<div id="cont-MyList"></div>\n';
        baseHTML += '<script id="dymerurl" src="' + baseUrlTemp + '/public/cdn/js/' + dymerJs + '"></script>\n';
        baseHTML += '</div></body></html>\n';
        res.send(baseHTML);
    }).catch((err) => {
        if (err) {
            logger.error(nameFile + ' |  get/renderpage/:id  : ' + err);
            console.error("ERROR | " + nameFile + " |  get/renderpage/:id ", err);
            ret.setMessages("Post error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

router.get('/renderdetail/:id', function(req, res) {

    let formData;
    let dataView;
    let dataSearch;
    var baseUrlTemp = "";
    var idParameter
    const _Id = req.params.id;
    idParameter = _Id;
    var baseHTML = '<!DOCTYPE html>\n' +
        '<html lang="en">' +
        '<head>\n' +
        '<meta charset="utf-8">\n' +
        '<meta content="width=device-width, initial-scale=1.0" name="viewport">\n' +
        '<title> </title>\n' +
        '<meta content="" name="description">' +
        '<meta content="" name="keywords">\n' +
        '<script>';
    baseHTML += 'var dviewtype="' + dataView + '"; \n';
    baseHTML += '</script> \n';
    var dymerJs = "dymer.viewer.js";
    var scriptSRC = ' <script> var dTagFilter;\n' +
        ' var dymerQueries =[ { "match": { "_id": "' + _Id + '"}} ];\n' +
        ' var dymerconf= {\n' +
        '      notImport:[]\n' +
        '   };\n' +
        'var jsonConfig = {' +
        ' \t \t query: {  \n' +
        ' \t \t  "query": {\n' +
        ' \t \t   "query": {\n' +
        ' \t \t     "match": { "_id": "' + idParameter + '" }\n' +
        ' \t \t }\n' +
        ' \t \t}\n' +
        ' \t \t  }, \n' +
        ' \t \tendpoint: \'entity.search\',\n' +
        ' \t \tviewtype: \'fullcontent\',\n' +
        ' \t \ttarget: {\n' +
        '  \t \tfullcontent: {\n' +
        ' \t \t\t \t    id: "#cont-MyList",\n' +
        '  \t \t\t \t  action: "html"\n' +
        '\t \t}\n' +
        '\t \t}\n' +
        ' \t \t};\n' +
        'function mainDymerView() {';
    scriptSRC += '  drawEntities(jsonConfig);}\n';
    scriptSRC += '</script>\n';
    baseHTML += scriptSRC;
    baseHTML += ' </head> <body>\n' +
        '<div class="container-fluid" id="containerDymerViewer"> \n';
    baseHTML += '<div id="cont-MyList"></div>\n';
    baseHTML += '<script id="dymerurl" src="' + baseUrlTemp + '/public/cdn/js/' + dymerJs + '"></script>\n';
    baseHTML += '</div></body></html>\n';
    res.send(baseHTML);
});

router.get('/configrules/', (req, res) => {

    let callData = util.getAllQuery(req);
    let queryFind = callData.query;
    return findRuleConfig(queryFind, res);
});

function findRuleConfig(queryFind, res) {
    var ret = new jsonResponse();
    configTool.find(queryFind).then((els) => {
        //console.log('configTool', els);
        ret.setMessages("List");
        ret.setData(els);
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            logger.error(nameFile + ' | findRuleConfig : ' + err);
            console.error("ERROR | " + nameFile + " | findRuleConfig ", err);
            ret.setMessages("Get error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
}

router.get('/getconfig/', (req, res) => {

    //console.log(req);
    console.log('get-d-config', "invoco config rules");
    //  let callData = util.getAllQuery(req);
    //let queryFind = callData.query;
    //return findRuleConfig(queryFind, res);
});

router.delete('/configrule/:id', util.checkIsAdmin, (req, res) => {

    var ret = new jsonResponse();
    var id = req.params.id;
    var myfilter = { "_id": id };
    configTool.findOneAndDelete(myfilter).then((el) => {
        ret.setMessages("Element deleted");
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            logger.error(nameFile + ' | delete  : ' + err);
            console.error("ERROR | " + nameFile + " | delete ", err);
            ret.setMessages("Delete Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

router.post('/listener', function(req, res) {

    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let data = callData.data;
    res.send(ret);
    //eventSource:
    var eventSource = (data.eventSource).split('_');
    var queryFind = {
        "_index": data.obj._index,
        "_type": data.obj._type
    };
    //console.log(nameFile + ' | post/listener | queryFind : ', JSON.stringify(queryFind));
    logger.info(nameFile + ' | post/listener | queryFind : :' + JSON.stringify(queryFind));
    OpnSearchRule.find(queryFind).then((els) => {
        ret.setMessages("List");
        ret.setData(els);
        //    console.log('ret', ret, els.length > 0);
        //   return res.send(ret);
        //  if (eventSource[1] == 'insert')
        //  if (els.length > 0)
        postAssettOpenness(eventSource[1], data.obj, els[0]);
    }).catch((err) => {
        if (err) {
            console.error("ERROR | " + nameFile + " | post/listener ", err);
            logger.error(nameFile + '| post/listener ' + err);
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

module.exports = router;