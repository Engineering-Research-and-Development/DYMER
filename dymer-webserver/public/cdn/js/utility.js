var templateslist, kmsdataset, kmsconf, actualItem, actualTemplateType;
var dymodalmode = "";
var dymphases = new dymerphases();

function resetDymerStart() {
    templateslist = undefined;
    kmsdataset = undefined;
    kmsconf = undefined;
    actualItem = undefined;
    actualTemplateType = undefined;
    markers = undefined;
    map = undefined;
    elFullScreen = undefined;
    elPageScreen = undefined;
    sidebar = undefined;
    kmsDT = undefined;
}
const kmsconfig = {
    cdn: cdnurl,
    endpoints: [{
            type: "form",
            endpoint: serverUrl + "/api/forms/api/v1/form",
            post: {
                create: ""
            }
        },
        {
            type: "entity",
            endpoint: serverUrl + "/api/entities/api/v1/entity",
            post: {
                search: "/_search",
                create: ""
            },
            get: {
                getbyid: "/:id"
            },
            put: {
                id: "/:id"
            },
            patch: {
                id: "/:id"
            },
            delete: {
                id: "/:id"
            }
        },
        {
            type: "template",
            endpoint: serverUrl + "/api/templates/api/v1/template"
        },
        {
            type: "order",
            endpoint: serverUrl + "/api/dservice/api/v1/eaggregation",
            post: {
                search: "/_search",
                create: "/addToCart",
                checkout: "/checkout",
                remove: "/removeFromCart"
            },
            get: {
                getbyid: "/:id"
            },
            put: {
                id: "/checkout/:id"
            },
            delete: {
                id: "/:id"
            }
        },
        {
            type: "taxonomy",
            endpoint: serverUrl + "/api/dservice/api/v1/taxonomy",
            post: {
                search: "/_search"
            }
        }

    ]
};

function setCheck(senderForm) {
    $(senderForm + ' [type="checkbox"] ').each(function() {
        checkvalue($(this));
    });
    return;
}

function checkvalue(el) {
    if (el.is(":checked"))
        el.val("true");
    else
        el.val("false");
}

function useGritterTool(title, text, type_) {
    //type; danger|info|success|warning
    if (type_ == undefined)
        type_ = 'info';
    $.notify({ 'title': title, 'message': text }, {
        type: type_,
        animate: {
            enter: 'animated fadeInDown',
            exit: 'animated fadeOutUp'
        },
        allow_dismiss: true,
        offset: 20,
        spacing: 10,
        z_index: 1031,
        delay: 5000,
        timer: 1000,
    });
}

function useGritter(title, text) {
    if ($.gritter) {
        $.gritter.add({
            title: title,
            text: text,
            image: '/img/cosmo/basic/023_white.png',
            time: 5000,
            class_name: 'gritter-success'
        });
    }
}

function useAlert(id, title_msg, msg_text, success) {
    var el = $(id + ' .alertaction');
    el.removeClass("alert-success alert-danger");
    (success) ? el.addClass("alert-success"): el.addClass("alert-danger");
    (!title_msg) ? el.find('.msg_title').hide(): el.find('.msg_title').text(title_msg).show();
    (!msg_text) ? el.find('.msg_txt').hide(): el.find('.msg_txt').text(msg_text).show();
    el.slideDown();
}

function check_dymer_validform(senderForm) { //aaaaa
    //console.log("inizia validazionesenderForm", senderForm);
    var valid = false;
    if (!senderForm[0].startsWith("#"))
        senderForm[0] = "#" + senderForm[0];
    let formid = senderForm[0].replace("#", "");
    // var forms = document.getElementById(formid).querySelectorAll('.needs-validation');
    var form = document.getElementById(formid);
    //var forms = document.querySelectorAll('.needs-validation')
    // Loop over them and prevent submission
    let firstFocusEl = undefined;
    let customvalid = true;
    $(senderForm[0]).find("[dymer-element-validation]").each(function() {
        let call_fn = $(this).attr("dymer-element-validation");
        let elvalid = window[call_fn]($(this));
        if (!elvalid) {
            $(this).addClass("is-invalid");
            customvalid = false;
            firstFocusEl = (firstFocusEl == undefined) ? $(this) : firstFocusEl;
        } else {
            $(this).removeClass("is-invalid");
        }

    });
    if (!form.checkValidity()) {
        valid = false;


        /*   if (firstFocusEl != undefined) {
           firstFocusEl.focus();
       }*/
        // console.log("first", $(form).find(":invalid").first());
        // console.log("form", $($(form).find(":invalid").first()).index());
        $(form).find(":invalid").first().focus();
        event.preventDefault()
        event.stopPropagation()
            //return false;
    } else {
        valid = true;
        valid = customvalid;
        /*  $(senderForm[0]).find("[dymer-element-validation]").each(function() {
              let call_fn = $(this).attr("dymer-element-validation");
              let elvalid = window[call_fn]($(this));
              valid = (elvalid == true && valid == true);
              if (!elvalid) {
                  firstFocusEl = (firstFocusEl == undefined) ? $(this) : firstFocusEl;
                  $(this).addClass("is-invalid");
                  if (firstFocusEl != undefined) {
                      firstFocusEl.focus();
                  }
                  return false;
              } else {
                  $(this).removeClass("is-invalid");
              }
          });*/
    }

    form.classList.add('was-validated')
    return valid;
}

function check_required(senderForm) {
    var valid = true;
    $(senderForm + " [required]").each(function() {
        let val = "";
        if ($(this).hasClass("selectpicker")) {
            val = $(this).selectpicker('val');
            if (!(val.length > 0)) {
                $(this).closest(".bootstrap-select").children('.dropdown-toggle').addClass("error_border");
                valid = false;
            } else
                $(this).closest(".bootstrap-select").children('.dropdown-toggle').removeClass("error_border");
        } else {

            val = ($(this).val()).trim();
            if (!(val.length > 0)) {
                $(this).addClass("error_border");
                valid = false;
            } else
                $(this).removeClass("error_border");
        }


    });
    return valid;
}

function check_validation(senderForm) {
    var valid = true;
    $(senderForm + " [validation-unique]").each(function() {
        var val = ($(this).val()).trim();
        if (!(val.length > 0)) {
            $(this).addClass("error_border");
            valid = false;
        } else
            $(this).removeClass("error_border");
    });
    return valid;
}

function checkSession() { //active - warned -expired
    //return true;
    try {
        if (Liferay.Session != undefined) {
            if (Liferay.Session.get('sessionState') == "active")
                return true;
            else
                $(".continerSandS").html('<div class="alert alert-error">Sessione scaduta!!! Effettuare il login</div>');
        } else
            return true;
    } catch (err) {
        console.error(err);
    } finally {}
    return false;
}

function resetContainer(el) {
    $(el)[0].reset();

    $(el).find('.alertaction').slideUp();
    $(el).removeClass('was-validated');
    $(el).find('.is-invalid').removeClass('is-invalid');
    $(el).find(".selectpicker").each(function() {
        $(this).val('').selectpicker("refresh");
    });
    $(el).find(".repeatable:not(.first-repeatable) .act-remove").each(function() {
        removeRepeatable($(this));
    });
    /*	var par = $(el).find(
                "input[type!='hidden']");
        $(par).each(function() {
            $(this).val('');
        });*/
}

function appendFormdata(FormData, data, name) {
    //console.log("typeof data", typeof data, FormData, data, name);
    name = name || '';
    if (typeof data === 'object') {
        $.each(data, function(index, value) {
            if (name == '') {
                appendFormdata(FormData, value, index);
            } else {
                appendFormdata(FormData, value, name + '[' + index + ']');
            }
        })
    } else {
        FormData.append(name, data);
    }
}

function appendFormdata2(formData, data, previousKey) {
    if (data instanceof Object) {
        Object.keys(data).forEach(key => {
            const value = data[key];
            if (value instanceof Object && !Array.isArray(value)) {
                return this.appendFormdata(formData, value, key);
            }
            if (previousKey) {
                key = `${previousKey}[${key}]`;
            }
            if (Array.isArray(value)) {
                value.forEach(val => {
                    formData.append(`${key}[]`, val);
                });
            } else {
                formData.append(key, value);
            }
        });
    }
}

function cloneRepeatable(elToClone) {
    var firstGroup = elToClone.closest('.repeatable');
    //firstGroup.addClass("first-repeatable");
    var newGroup = (firstGroup).clone();
    newGroup.removeClass("first-repeatable");
    var firtEl = (firstGroup).find('[name^="data["]').attr('name');
    var lastIndex = 0;
    var ark = replaceAll(firtEl, '[', '@@');
    ark = replaceAll(ark, ']', '');
    ark = ark.split("@@");
    var matchname = ark[0];
    ark.shift();
    $.each(ark, function(i, val) {
        var cast = parseInt(val);
        if (!isNaN(cast)) {
            lastIndex = i;
            //  ark[i] = cast + 1;
        }
    });
    for (let index = 0; index < lastIndex; index++) {
        matchname += '[' + ark[index] + ']';
    }
    (newGroup).attr("grp", matchname);
    $.each(newGroup.find('[name^="data["]'), function(index, value) {
        var name = $(this).attr("name");
        var ark = replaceAll(name, '[', '@@');
        ark = replaceAll(ark, ']', '');
        ark = ark.split("@@");
        var newName = ark[0];
        ark.shift();
        $.each(ark, function(i, val) {
            var cast = parseInt(val);
            if (!isNaN(cast))
                ark[i] = cast + 1;
            newName += '[' + ark[i] + ']';
        });
        $(this).attr("name", newName);
        if ($(this).hasClass("summernote")) {
            $(this).val('');
            if ($(this).next() != undefined) {
                if ($(this).next().hasClass("note-editor")) {
                    $(this).next().remove();
                    $(this).summernote({ dialogsInBody: true });
                }
            }
        } else {
            $(this).val('')
                .prop('checked', false)
                .prop('selected', false);
        }
        var attr_oldval = $(this).attr('oldval');
        if ($(this).attr('type') == 'file')
            $(this).removeAttr("onchange");
        // For some browsers, `attr` is undefined; for others,
        // `attr` is false.  Check for both.
        if (typeof attr_oldval !== typeof undefined && attr_oldval !== false) {
            $(this).removeAttr('oldval');
        }

    });
    newGroup.find('[fileid][attachref]').remove();
    newGroup.find('div[id^="contattach_data"]').remove();
    newGroup.insertAfter(elToClone.closest('.repeatable'));
    setTimeout(function() {
        reindexRepeatable(matchname);
    }, 2000);
}

function removeRepeatable(elToClone) {
    var toRem = elToClone.closest('.repeatable');
    var matchname = (toRem).attr('grp');
    $(toRem.find("[fileid]")).each(function() {
        appendTodeleteId($(this).attr('fileid'), $(this).attr('attachref'));
    });
    $(toRem.find('[name^="data[relation]"]')).each(function() {
        relChngd($(this));
    });
    (toRem).remove();
    setTimeout(function() {
        reindexRepeatable(matchname);
    }, 2000);
}

function reindexRepeatable(matchname) {
    $.each($("#entityForm").find('[grp="' + matchname + '"].repeatable '), function(index, value) {
        var act = $(this);
        $.each((act).find('[name^="' + matchname + '"]'), function(index2, value2) {
            var oldname = $(this).attr('name');
            var endname = (oldname).replace(matchname, '');
            var f1 = (endname.indexOf("]")) + 1;
            var res = endname.substring(f1);
            var updtname = matchname + '[' + (index + 1) + ']' + res;
            if ($(this).attr('type') == 'file')
                if ($(this).attr('onchange')) {
                    var newChange = ($(this).attr('onchange')).replace(oldname, updtname)
                    $(this).attr('onchange', newChange);
                }
            $(this).attr('name', updtname);
        });
        $.each((act).find('[attachref^="' + matchname + '"]'), function(index2, value2) {
            var oldname = $(this).attr('attachref');
            var endname = (oldname).replace(matchname, '');
            var f1 = (endname.indexOf("]")) + 1;
            var res = endname.substring(f1);
            var updtname = matchname + '[' + (index + 1) + ']' + res;
            $(this).attr('attachref', updtname);
            var oldclik = $(this).find('.deleteItemSub');
            if (oldclik) {
                var newclick = ((oldclik).attr('onclick')).replace(oldname, updtname);
                (oldclik).attr('onclick', newclick);
            }
        });
        $.each((act).find('[id^="contattach_' + matchname + '"]'), function(index2, value2) {
            var endname = ($(this).attr('id')).replace(matchname, '');
            var f1 = (endname.indexOf("]")) + 1;
            var res = endname.substring(f1);
            var updtname = 'contattach_' + matchname + '[' + (index + 1) + ']' + res;
            $(this).attr('id', updtname);
        });
    });
}

function replaceAll(str, cerca, sostituisci) {
    return str.split(cerca).join(sostituisci);
}

//----------START Dynamic loader---------------
var removeTempImport = function(attr) {
        return new Promise(function(resolve, reject) {
            document.querySelectorAll(`[${attr}]`).forEach(async function(e, i) {
                var panel_link = e.getAttribute(attr);
                let onremovefct = "onremove" + panel_link;
                //console.log("invocata onremovefct panel_link--", panel_link);
                //console.log("invocata onremovefct onremovefct--", actualTemplateType);
                //console.log("invocata onremovefct onremovefct--", onremovefct, typeof window[onremovefct] === 'function');
                if (panel_link != actualTemplateType) {

                    if (typeof window[onremovefct] === 'function') {
                        let rrs = await window[onremovefct]();
                        //console.log("invocata onremovefct per", panel_link, onremovefct);
                    }
                    e.parentNode.removeChild(e);
                }

            });
            resolve("ok");
        });
    }
    /*
    var removeTempImport = function(attr) {
        return new Promise(function(resolve, reject) {
            document.querySelectorAll(`[${attr}]`).forEach(function(e, i) {
                var panel_link = e.getAttribute(attr);
                if (panel_link != actualTemplateType){
                    ///kkkk
                     e.parentNode.removeChild(e);
                }

            });
            resolve("ok");
        });
    } */
async function prePopulateFormEdit_Promise(item) {
    if (typeof dymprepopulate === 'function') {
        let rrs = await dymprepopulate(item);
        //console.log("utility prePopulateFormEdit_Promise fatta");
        return rrs;
    } else {
        return item;
       /* return new Promise(function(resolve, reject) {
             console.log("non esiste dymprepopulate");
            setTimeout(function() {
                 console.log("aspetto 5 sec");
                resolve(item);

            }, 5000);
        });*/
    }
}
async function postPopulatedFormEdit_Promise(item) {
    if (typeof dympostpopulated === 'function') {
        let rrs = await dympostpopulated(item);
        //console.log("utility postPopulatedFormEdit_Promise fatta");
        return rrs;
    } else {
        //console.log("non esiste postPopulatedFormEdit_Promise");
        return item;
    }
}
class Elfile {
    constructor(domtype, filename, callback, useonload, group) {
        this.domtype = domtype;
        if (this.domtype == "js")
            this.domtype = 'script';
        if (this.domtype == "css")
            this.domtype = 'link';
        this.filename = filename;
        this.callback = callback;
        this.useonload = useonload;
        this.extrattr = [];
        this.group = group;
    }
    setExtrattr(k, v) {
        var _this = this;
        _this.extrattr.push({ key: k, value: v });
    }
}
class ElTemplate {
    constructor(_index, _type) {
        this._index = _index;
        this._type = _type;
        this.viewtype = {
            fullcontent: "",
            teaserlist: "",
            teaser: "",
            teasermap: ""
        };
        this.files = {
            fullcontent: [],
            teaserlist: [],
            teaser: [],
            teasermap: []
        }
    }
    loadAllTemplate() {
        var _this = this;
        var sourceUrl = getendpoint('template');
        var temp_config_call = {
            url: sourceUrl,
            type: 'GET',
            addDataBody: false
        };
        var ajax_temp_call = new Ajaxcall(temp_config_call);
        ajax_temp_call.flush();
        var tempQuery = { "query": { "query": { "instance._index": this._index, "instance._type": this._type } } };
        ajax_temp_call.addparams(tempQuery);
        var ret = ajax_temp_call.send();
        //	var appendfiles = new Array();
        if (ret.success) {
            (ret.data).forEach(function(el, i) {
                var dom_to_render = undefined;
                var t_ar = [];
                var indport = sourceUrl + "/";
                //var indport = sourceUrl.substring(0, sourceUrl.indexOf('api'));
                (el.files).forEach(function(fl, l) {
                    //dom_to_render = (fl.mimetype == "text/html") ? fl.path : dom_to_render;
                    //MArco da valutare
                    //console.log("fl",fl);
                    var lkpath = indport + "content/" + fl._id;
                    var splmime = (fl.contentType).split("/");
                    var ftype = splmime[1];
                    if (ftype == "html")
                        dom_to_render = fl.data;
                    else {
                        ftype = (ftype == "css") ? "link" : ftype;
                        if (ftype != "octet-stream"){
let eltopush={ domtype: ftype, filename: lkpath, extrattr: [],data:{} ,name:fl.filename};

                             if(fl.filename=="language.json")
                             eltopush.data.language=fl.data;
                             t_ar.push(eltopush);

                        }

                    }
                });
                var ret2 = dom_to_render;
                for (var s = 0; s < el.viewtype.length; s++) {
                    var rt = (el.viewtype[s].rendertype).slice();
                    _this.setTemplate(rt, ret2);
                    for (var j = 0; j < t_ar.length; j++) {
                        (t_ar[j]).extrattr.push({ key: 'tftemp', value: rt });
                    }
                    _this.setAppendfiles(rt, t_ar);
                }

            });
        }
    }
    setTemplate(type, scriptTemplate) {
        var _this = this;
        _this.viewtype[type] = scriptTemplate;
        return true;
    }
    setAppendfiles(type, apf) {
        //   arr.push(new Elfile(domtype, filename, callback, useonload, group));
        //  filename = kmsconfig.cdn + "leaflet/plugin/markercluster/leaflet.markercluster.js";;
        this.files[type] = apf;
        return true;
    }
    getAppendfiles(type) {
        var _this = this;
        return _this.files[type];
    }
}

function scriptExists(domtype, attr, value) {
    return document.querySelectorAll(`${domtype}[${attr}="${value}"]`).length > 0;
}

async function onloadFiles2(arr) {
    let tk = localStorage.getItem('DYMAT');
    let tk_extra = localStorage.getItem('DYM_EXTRA');
    let toperm = "";
    if (tk != null)
        toperm = "?tkdymat=" + tk + "&tkextra=" + tk_extra;
    tk = localStorage.getItem('DYM');
    if (tk != null)
        toperm = "?tkdym=" + tk + "&tkextra=" + tk_extra;

    let promlist = arr.map((obj) => {
        return new Promise(function(resolve, reject) {
            //console.log('onloadFiles2', obj);
            var attr = "";
            var script = null;
            //  var filename = obj.filename + "?dmts=1";
            var filename = obj.filename;
            // filename += "?dmts=1";
            if (!filename.includes('cdn'))
                filename += toperm;
            script = document.createElement(obj.domtype);
            if (obj.domtype == "script" || obj.domtype == 'javascript') { //if filename is a external JavaScript file
                script = document.createElement("script");
                attr = "src";
                script.setAttribute("type", "text/javascript");
            } else if (obj.domtype == "link") { //if filename is an external CSS file
                attr = "href";
                script.setAttribute("rel", "stylesheet");
                script.setAttribute("type", "text/css");
            }
            if (obj.extrattr != undefined) {
                (obj.extrattr).forEach(function(af, j) {
                    script.setAttribute(af.key, af.value);
                });
            }
            script.setAttribute(attr, filename);
            script.onerror = () => {
                reject('cannot load script ' + url)
            }
            var exsist = scriptExists(obj.domtype, attr, filename);
            if (exsist) {
                if (obj.callback != null) {
                    obj.callback();
                }
                resolve();
            }
            if (obj.useonload) {
                script.onload = function() {
                    if (obj.callback != null) {
                        obj.callback();
                        //window[obj.callback];
                    }
                    resolve();
                };
                document.head.appendChild(script);
                //  resolve();
            } else {
                document.head.appendChild(script);
                //resolve();
                script.onload = () => {
                    resolve()
                }
            }
        });
    })

    return Promise.all(promlist).then(mappedlist => { /*console.log("tutti i files sono stati caricati", mappedlist);*/ });
}


async function onloadFiles(arr) {

    let tk = localStorage.getItem('DYMAT');
    let tk_extra = localStorage.getItem('DYM_EXTRA');
    let toperm = "";
    if (tk != null)
        toperm = "?tkdymat=" + tk + "&tkextra=" + tk_extra;
    tk = localStorage.getItem('DYM');
    if (tk != null)
        toperm = "?tkdym=" + tk + "&tkextra=" + tk_extra;
    if (arr.length > 0) {
        var obj = arr[0];
        arr.shift();
        if(obj.domtype=="json")
        return onloadFiles(arr);
        var attr = "";
        var script = null;
        //  var filename = obj.filename + "?dmts=1";
        var filename = obj.filename;
        //    filename += "?dmts=1";
        if (!filename.includes('cdn'))
            filename += toperm;
        script = document.createElement(obj.domtype);
        if (obj.domtype == "script" || obj.domtype == 'javascript') { //if filename is a external JavaScript file
            script = document.createElement("script");
            attr = "src";
            script.setAttribute("type", "text/javascript");
        } else if (obj.domtype == "link") { //if filename is an external CSS file
            attr = "href";
            script.setAttribute("rel", "stylesheet");
            script.setAttribute("type", "text/css");
        }
        if (obj.extrattr != undefined) {
            (obj.extrattr).forEach(function(af, j) {
                script.setAttribute(af.key, af.value);
            });
        }
        script.setAttribute(attr, filename);
        var exsist = scriptExists(obj.domtype, attr, filename);
        if (exsist) {
            if (obj.callback != null) {
                obj.callback();
            }
            return onloadFiles(arr);
        }
        if (obj.useonload) {
            script.onload = function() {
                if (obj.callback != null) {
                    obj.callback();
                    //window[obj.callback];
                }
                return onloadFiles(arr);
            };
            document.head.appendChild(script);
            /*	caches.open(cacheName).then(cache => {
                    cache.add(filename).then(() => {
                        //done!
                    })
                });*/
        } else {
            document.head.appendChild(script);
            return onloadFiles(arr);
        }
    } else
        return true;
}
//-----------END Dynamic loader---------------

//-----------------START FORM-----------------
async function loadRequireForm() {
    var ckaddimport = [];
    if (typeof dymerconf !== 'undefined')
        ckaddimport = dymerconf.notImport;
    var arr = [];
    var domtype = "link";
    var filename = "";
    var callback = null;
    var useonload = false;
    var group = "mandatory";
    group = "bootstrap";
    filename = kmsconfig.cdn + "css/lib/bootstrap/4.1.3/bootstrap.min.css";
    if (!(ckaddimport.indexOf(group) > -1))
        arr.push(new Elfile(domtype, filename, callback, useonload, group));
    group = "font-awesome";
    filename = kmsconfig.cdn + "css/lib/font-awesome/4.7/font-awesome.min.css";
    if (!(ckaddimport.indexOf(group) > -1))
        arr.push(new Elfile(domtype, filename, callback, useonload, group));
    group = "mandatory";
    filename = kmsconfig.cdn + "css/dymer.base.css";
    if (!(ckaddimport.indexOf(group) > -1))
        arr.push(new Elfile(domtype, filename, callback, useonload, group));
    domtype = "script";
    callback = null;
    useonload = true;
    group = "jquery";
    filename = kmsconfig.cdn + "js/lib/jquery/jquery-3.3.1.min.js";
    if (!(ckaddimport.indexOf(group) > -1))
        arr.push(new Elfile(domtype, filename, callback, useonload, group));
    group = "mandatory";
    filename = kmsconfig.cdn + "js/lib/jquery/jquery.serializejson.js";
    if (!(ckaddimport.indexOf(group) > -1))
        arr.push(new Elfile(domtype, filename, callback, useonload, group));
    group = "bootstrap";
    filename = kmsconfig.cdn + "js/lib/bootstrap/4.1.3/bootstrap.min.js";
    if (!(ckaddimport.indexOf(group) > -1))
        arr.push(new Elfile("link", filename, callback, useonload, group));

    group = "summernote";
    if (!(ckaddimport.indexOf(group) > -1)) {
        filename = kmsconfig.cdn + "lib/summernote/0.8.18/summernote.min.css";
        arr.push(new Elfile("link", filename, callback, useonload, group));
        filename = kmsconfig.cdn + "lib/summernote/0.8.18/summernote.min.js";
        arr.push(new Elfile(domtype, filename, callback, useonload, group));
    }
    filename = kmsconfig.cdn + "js/ajaxcall.js";
    var mycallback = function() { // Method which will display type of Animal
        try {
            /*	config_postForm = {
                    url: serviceFormUrl,
                    processData: false,
                    enctype: "multipart/form-data; boundary=----------------------------4ebf00fbcf09",
                    contentType: false,
                    cache: false
                };
                ajaxcall_postForm = new Ajaxcall(config_postForm);*/
            mainDymerModel();
        } catch (e) {
            console.error(e);
        }
    };
    group = "mandatory";
    arr.push(new Elfile(domtype, filename, mycallback, useonload, group));
    await onloadFiles(arr);
}

function getbaseEntityConfig(basedat) {
    var ipcall = window.location.protocol + "//" + window.location.host + "/";
    var ownerUid = 0;
    var ownerGid = 0;
    let d_uid = localStorage.getItem("d_uid");
    let d_gid = localStorage.getItem("g_uid");
    // let d_uid = retriveVarCookie("d_uid");
    if (typeof d_uid !== 'undefined')
        ownerUid = d_uid;
    if (typeof d_gid !== 'undefined')
        ownerGid = d_gid;
    var obj = {
        properties: {
            owner: {
                uid: ownerUid,
                gid: ownerGid
            },
            ipsource: ipcall
        }
    };
    return obj;
}
const retriveVarCookie = (key) => {
    var name = key + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return null;
};

function setbaseEntityConfig(target) {
    var ownerUid = 0;
    var ownerGid = 0;
    // let d_uid = retriveVarCookie("d_uid");
    let d_uid = localStorage.getItem("d_uid");
    let d_gid = localStorage.getItem("g_uid");
    if (typeof d_uid !== 'undefined')
        ownerUid = d_uid;
    $(target).find('[name="data[owner][uid]"]').val(ownerUid);
    if (typeof gid !== 'undefined')
        ownerGid = d_gid;
    $(target).find('[name="data[owner][gid]"]').val(ownerGid);
}
var listRelationForm = {};

function hookReleationForm(item) {
    var loadedList = {};
    listRelationForm = loadedList;
    $('.senderForm [data-torelation]').each(function(index) {
        var rel = $(this).attr('data-torelation');
        if (loadedList[rel] == undefined) {
            var datapost = {
                instance: { "index": rel },
                qoptions: { relations: false }
            };
            actionPostMultipartForm("entity.search", undefined, datapost, undefined, populateHookRelation, undefined, false, rel);
        }
    });
}

const hookReleationForm_Promise = function(item) {
    return new Promise(function(resolve, reject) {
        var loadedList = {};
        listRelationForm = loadedList;
        $('.senderForm [data-torelation]').each(async function(index) {
            var rel = $(this).attr('data-torelation');
            if (loadedList[rel] == undefined) {
                var datapost = {
                    instance: { "index": rel },
                    qoptions: { relations: false }
                };
                await actionPostMultipartForm_Promise("entity.search", undefined, datapost, undefined, populateHookRelation, undefined, false, rel);
            }
        });
        resolve();
    });
}

function populateHookRelation(x, y, z, w, k, a, b, arObj2, rel) {
   //mr rel fix
  // console.log('rel',rel);
   //console.log('arObj2',arObj2);
    var templ_data = flatEsArray(arObj2.data);
    arObj2.data = templ_data.arr
    //console.log('templ_data',arObj2);
    listRelationForm[rel] = arObj2.data;
    $('.senderForm [data-torelation="' + rel + '"]').each(function(inde) {
        var esxtraAttr = "";
        var isRequired = $(this).attr('required');
        var optionsText = $(this).attr('data-optiontext');
        var label = $(this).attr('searchable-label');
        if (typeof isRequired !== typeof undefined && isRequired !== false) {
            esxtraAttr += ' required ';
            $(this).removeAttr('required');
        }
        let sel = "";
        if ($(this)) {
            //  var sel = $('<select class="form-control span12 col-12" name="data[relation][' + rel + '][' + inde + '][to]" onchange="relChngd($(this))" ' + esxtraAttr + '>').appendTo($(this));
            if ($(this).hasClass("dymerselectpicker")) {
                let attrismulti = $(this).attr('multiple');
                // let ismulti = ($(this).hasAttr('data-max-options')) ? "multiple" : '';
                let ismulti = (typeof attrismulti !== 'undefined' && attrismulti !== false) ? "multiple" : '';
                //let required = ($(this).attr('required') == "true") ? ' required ' : '';
                let livesearch = ($(this).attr('data-live-search') == "true") ? 'data-live-search="true"' : '';
                let actionsbox = ($(this).attr('data-actions-box') == "true") ? 'data-actions-box="true"' : '';
                let maxoptions = '';
                let attrmaxoptions = $(this).attr('data-max-options');
                if (typeof attrmaxoptions !== 'undefined' && attrmaxoptions !== false) {
                    maxoptions = ($(this).attr('data-max-options') != "") ? 'data-max-options="' + $(this).attr('data-max-options') + '"' : '';
                }

                let selpk = '<select class="form-control span12 col-12 selectpicker" name="data[relation][' + rel + '][' + inde + '][to]" ' + '  searchable-label="' + label + '"  class="selectpicker form-control " searchable-override="data[relationdymer][' + rel + ']"    ' + ismulti + " " + actionsbox + " " + livesearch + " " + maxoptions + " " + esxtraAttr + " " + ' data-selected-text-format="count"   ></select>';
                sel = $(selpk).appendTo($(this))
            } else {
                sel = $('<select class="form-control span12 col-12" searchable-multiple="true" searchable-override="data[relationdymer][' + rel + ']" searchable="" searchable-label="' + label + '2" name="data[relation][' + rel + '][' + inde + '][to]" onchange="relChngd($(this))" ' + esxtraAttr + '>').appendTo($(this));

            }

        }
        // var sel = $('<select class="form-control span12 col-12" name="data[relation][' + rel + '][' + inde + '][to]" onchange="relChngd($(this))" ' + esxtraAttr + '>').appendTo($(this));
        sel.append($("<option>").attr('value', "").text(""));
        if (typeof optionsText !== typeof undefined && optionsText !== false) {
            var tempArrList = [];
            $.each(listRelationForm[rel], function(ind, value) {
                tempArrList.push({ "id": value._id, "txt": value[optionsText] });
            });
            var orderdList = sortByKeyAsc(tempArrList, "txt");
            $.each(orderdList, function(ind, value) {
                sel.append($("<option>").attr('value', value.id).text(value.txt));
            });
        } else {
            $.each(listRelationForm[rel], function(ind, value) {
                sel.append($("<option>").attr('value', value._id).text(value.title));
            });
        }
    });
}
var listTaxonomyForm = {};
const hookTaxonomy_Promise = function(item) {
        return new Promise(function(resolve, reject) {
            var loadedList = {};
            listTaxonomyForm = loadedList;
            $('.senderForm [data-totaxonomy]').each(async function(index) {
                var taxID = $(this).attr('data-totaxonomy');
                if (loadedList[taxID] == undefined) {

                    var datapost = {
                        id: taxID
                    };

                    await actionPostMultipartForm_Promise("taxonomy.search", undefined, datapost, undefined, populateHookTaxonomy, undefined, false, taxID);
                }
            });
            resolve();
        });
    }
    /***********/
function populateHookTaxonomy(x, y, z, w, k, a, b, arObj2, tax) {
    listTaxonomyForm[tax] = arObj2.data;
    $('.senderForm [data-totaxonomy="' + tax + '"]').each(function(inde) {
        var esxtraAttr = "";
        var taxName = $(this).attr('name');
        var isRequired = $(this).attr('required');
        var optionsText = $(this).attr('data-optiontext');
        var label = $(this).attr('searchable-label');

        console.log("LABEL: ", $(this).attr('searchable-label'))
        if (typeof isRequired !== typeof undefined && isRequired !== false) {
            esxtraAttr += ' required ';
            $(this).removeAttr('required');
        }
        let sel = "";
        if ($(this)) {

            if ($(this).hasClass("dymertaxonomy")) {
                let attrismulti = $(this).attr('multiple');
                let ismulti = (typeof attrismulti !== 'undefined' && attrismulti !== false) ? "multiple" : '';
                let livesearch = ($(this).attr('data-live-search') == "true") ? 'data-live-search="true"' : '';
                let actionsbox = ($(this).attr('data-actions-box') == "true") ? 'data-actions-box="true"' : '';
                let maxoptions = '';
                let attrmaxoptions = $(this).attr('data-max-options');
                if (typeof attrmaxoptions !== 'undefined' && attrmaxoptions !== false) {
                    maxoptions = ($(this).attr('data-max-options') != "") ? 'data-max-options="' + $(this).attr('data-max-options') + '"' : '';
                }

                //let selpk = '<select class="form-control span12 col-12 selecttaxonomy" name="data[taxonomy][' + tax + '][' + inde + '][to]" ' + '  searchable-label="' + label + '"  class="selecttaxonomy form-control " searchable-override="data[taxonomydymer][' + tax + ']"    ' + ismulti + " " + actionsbox + " " + livesearch + " " + maxoptions + " " + esxtraAttr + " " + ' data-selected-text-format="count"   ></select>';
                //let selpk = '<select class="form-control span12 col-12 selecttaxonomy" name="data[taxonomy][' + tax + '][' + inde + '][to]" ' + '  searchable-label="' + label + '"  class="selecttaxonomy form-control " searchable-override="data[taxonomydymer][' + tax + ']"    ' + ismulti + " " + actionsbox + " " + livesearch + " " + maxoptions + " " + esxtraAttr + " " + ' data-selected-text-format="count"   ></select>';
                //let selpk = '<select class="form-control span12 col-12 selectpicker" name="data[taxonomy][' + tax + '][' + inde + '][to]" ' + '  searchable-label="' + label + '"  class="selectpicker form-control " searchable-override="data[taxonomydymer][' + tax + ']"    ' + ismulti + " " + actionsbox + " " + livesearch + " " + maxoptions + " " + esxtraAttr + " " + ' data-selected-text-format="count"   ></select>';
                let selpk = '<select class="form-control span12 col-12 selectpicker" name="' + taxName + '[' + inde + ']" ' + 'data-taxonomy="' + tax + '"  searchable-label="' + label + '"  class="selectpicker form-control " searchable-override="' + taxName + '"    ' + ismulti + " " + actionsbox + " " + livesearch + " " + maxoptions + " " + esxtraAttr + " " + ' data-selected-text-format="count"   ></select>';
                sel = $(selpk).appendTo($(this))
            } else {
                //    sel = $('<select class="form-control span12 col-12" searchable-multiple="true" searchable-override="data[taxonomydymer][' + tax + ']" searchable="" searchable-label="' + label + '2" name="data[taxonomy][' + tax + '][' + inde + '][to]" onchange="taxChngd($(this))" ' + esxtraAttr + '>').appendTo($(this));
                // sel = $('<select class="form-control span12 col-12" searchable-multiple="true" searchable-override="data[taxonomydymer][' + tax + ']" searchable="" searchable-label="' + label + '2" name="data[taxonomy][' + tax + '][' + inde + '][to]" onchange="taxChngd($(this))" ' + esxtraAttr + '>').appendTo($(this));
                sel = $('<select class="form-control span12 col-12" searchable-multiple="true" searchable-override="' + taxName + '" searchable="" searchable-label="' + label + '" name="' + taxName + '[' + inde + ']" onchange="taxChngd($(this))" ' + esxtraAttr + '>').appendTo($(this));
            }

        }
        //   sel.append($("<optoption>").attr('value', "").text(""));
        //sel.append($("<option>").attr('value', "").text(""));
        if (typeof optionsText !== typeof undefined && optionsText !== false) {
            var tempArrList = [];
            $.each(listTaxonomyForm[tax], function(ind, value) {
                tempArrList.push({ "id": "value._id", "txt": "value[optionsText]" });
            });
            var orderdList = sortByKeyAsc(tempArrList, "txt");
            $.each(orderdList, function(ind, value) {
                sel.append($("<option>").attr('value', value.id).text(value.txt));
            });
        } else {
            $.each(listTaxonomyForm[tax].nodes, function(ind, value) {
                console.log("listTaxonomyForm[tax].nodes: ", listTaxonomyForm[tax].nodes)

                //sel.append($("<optgroup>").attr("label", value.value));
                // sel.append($("<option>").attr('value', value.id).text(value.locales.en.value));
                sel.append($("<option>").attr('value', value.value).text(value.locales.en.value));

                if (value.nodes.length != 0) {
                    // sel.append($("<optgroup>"));
                    for (internalValue of value.nodes) {
                        sel.append($("<option>").attr('value', internalValue.value).text("\u00A0" + "\u00A0" + internalValue.locales.en.value));
                    }
                }
                //sel.append($("<option>").attr('value', value.id).text(value.value));
                //sel.append($("<option>").attr('value', value.value).text("en"));
            });
        }
    });
}

function sortByKeyAsc(array, key) {
    return array.sort(function(a, b) {
        var x = a[key];
        var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

function relChngd(el) {
    var fid = el.attr('oldval');
    if (fid != undefined)
        if (!$('[name="data[relationtodelete][]"][value="' + fid + '"]').length)
            $('<input name="data[relationtodelete][]" style="disply:none" type="hidden" value="' + fid + '">').insertAfter('#entityEdit [name="instance[index]"]');
}

function loadFilterModel(index, tagFilterObj) {
    var datapost = { "query": { "instance._index": index }, "act": "update" };
    var sourceUrl = getendpoint('form');
    // loadFormList(geturl, $('#cont-btnadd'), myQuery);
    var temp_config_call = {
        url: sourceUrl,
        type: 'GET',
        addDataBody: false
    };
    var ajax_temp_call = new Ajaxcall(temp_config_call);
    ajax_temp_call.flush();
    var indport = sourceUrl + "/";
    if (datapost != undefined)
        ajax_temp_call.addparams(datapost);
    var ret = ajax_temp_call.send();
    if (ret.success) {
        (ret.data).forEach(function(item, i) {
            (item.files).forEach(function(fl, i) {
                if (fl.contentType == "text/html") {
                    dom_to_render = "content/" + index + "/" + fl._id + "?dmts=2";
                }
            });
        });
        dom_to_render = indport + dom_to_render;
        var temp_config_call = {
            url: dom_to_render,
            type: 'GET',
            addDataBody: false,
            mimeType: "text/html",
            contentType: "text/html"
        };
        var ajax_temp_call = new Ajaxcall(temp_config_call);
        ajax_temp_call.flush();
        ajax_temp_call.addparams(datapost);
        var itemValue = ajax_temp_call.send();
        $html = $(itemValue);
        // hookReleationFormFilter($(itemValue));
        var searchIndex = $(itemValue).find('[name="instance[index]"]');
        searchIndex.attr('name', 'data[_index]');
        $('#d_entityfilter').append(searchIndex);
        var idGen = new GeneratorId();
        let usePlaceholder = ($('#d_entityfilter').attr("useplaceholder") == "true") ? true : false;
        $(itemValue).find("[searchable-label]").each(function() {
            var newId = idGen.getId();
            let filterpos = ($(this).data('filterpos') == undefined) ? 0 : $(this).data('filterpos');
            var singleEl = "";
            if ($(this).attr("data-torelation") != undefined) {
                var rel = $(this).attr('data-torelation');
                var esxtraAttr = "";
                var datapost = {
                    instance: { "index": rel },
                    qoptions: { relations: false }
                };
                var listToselect = actionPostMultipartForm("entity.search", undefined, datapost, undefined, undefined, undefined, false, undefined);
                 //mr rel fix
                 var templ_data = flatEsArray(listToselect.data);
                 listToselect.data = templ_data.arr;
                var inde = 0;
                var ismulti = ($(this).attr('searchable-multiple') == "true") ? true : false;
                var $sel = $('<select class="form-control span12 col-12"  searchable-multiple="' + ismulti + '"  searchable-override="data[relationdymer][' + rel + ']" searchable="" searchable-label="' + $(this).attr('searchable-label') + '" name="data[relation][' + rel + '][' + inde + '][to]"  ' + esxtraAttr + '>').appendTo($(this));
                if (usePlaceholder)
                    $sel.append($('<option value="" disabled selected>').attr('value', "").text($(this).attr('searchable-label')));
                $.each(listToselect.data, function(ind, value) {
                    $sel.append($("<option>").attr('value', value._id).text(value.title));
                });
                $sel.attr("filter-id", newId);
                singleEl = $sel;
            } else {
                singleEl = $(this).attr("filter-id", newId);
            }
            var additionalText = "";
            var additTextEl = singleEl.attr('searchable-text');
            if (additTextEl != undefined) {
                additTextEl = additTextEl.trim();
                if (additTextEl != "") {
                    additionalText = additTextEl;
                }
            }
            if (singleEl.is(":checkbox")) {
                singleEl.css("display", "none");
            }
            var filterMultiple = $(singleEl).closest(".form-group").hasClass('repeatable');
            var addMultiple = $(singleEl).attr("searchable-multiple");
            var filterRel = $(singleEl).attr('name');
            var filterLabel = $(singleEl).attr('searchable-label');
            if (usePlaceholder)
                $(singleEl).attr("placeholder", $(singleEl).attr('searchable-label'));
            var basefilter = ' <i class="fa fa-refresh filterSingRefresh" aria-hidden="true" title="refresh filter value"  filter-relid="' + newId + '" filter-rel="' + filterRel + '"  filter-labeltext="' + additionalText + '" filter-label="' + filterLabel + '" filter-multiple="' + filterMultiple + '" onclick="refreshDTagFilter( $(this))"></i> ' +
                '<label class="switch switchfilter " title="active filter">' +
                '<input type="checkbox"  filter-relid="' + newId + '"  filter-rel="' + filterRel + '"  filter-label="' + filterLabel + '" filter-labeltext="' + additionalText + '" filter-multiple="' + filterMultiple + '" onclick="manageDTagFilter( $(this))">' +
                ' <span class="slider round"></span>' +
                '  </label>';
            if (addMultiple == "true") {
                basefilter = ' <i class="fa fa-plus filterSingRefresh" aria-hidden="true" title="add"  filter-relid="' + newId + '" filter-rel="' + filterRel + '"  filter-labeltext="' + additionalText + '" filter-label="' + filterLabel + '" filter-multiple="' + filterMultiple + '" onclick="manageDTagFilter( $(this),\'add\')"></i> ';
            }
            var groupEl = $('<div class="grpfilter"><div><label class="kms-title-label">' + filterLabel + '</label></div>' + additionalText + ' </div>');
            if (usePlaceholder)
                groupEl = $('<div class="grpfilter">' + additionalText + ' </div>');
            var ck = $('<div class="switch_container pull-right">' + basefilter + ' </div>');
            $(groupEl).attr('data-filterpos', filterpos);
            $(groupEl).append(singleEl).append(ck);
            $('#d_entityfilter').append(groupEl);
        });
        $('#d_entityfilter ').on('click', e => {
            e.stopPropagation();
        });
        var $wrapper = $('#d_entityfilter');
        $wrapper.find('.grpfilter').sort(function(a, b) {
            return +$(a).data('filterpos') - +$(b).data('filterpos');
        }).appendTo($wrapper);
    }
}

async function loadHtmlForm(sourceUrl, target, datapost, delaytime, action) {
    if (delaytime == undefined)
        delaytime = 1;
    var temp_config_call = {
        url: sourceUrl,
        type: 'GET',
        addDataBody: false,
        mimeType: "text/html",
        contentType: "text/html"
    };
    var ajax_temp_call = new Ajaxcall(temp_config_call);
    //	var check_session = checkSession();
    //	if (!check_session)
    //		return false;
    //	var option = {
    //		cssclass: 'spinnerLoader'
    //	};
    ajax_temp_call.flush();
    ajax_temp_call.addparams(datapost);
    var ret = ajax_temp_call.send();
    if (action == undefined) {
        $(target).html("");
        $(target).html(ret);
    }
    if (action == "replace") {
        $(target).html("");
        $(target).html(ret);
    }
    if (action == "append")
        $(target).append(ret);
    /* setTimeout(function() {
         //  hookReleationForm();
         hookReleationForm_Promise();
         setbaseEntityConfig(target);
     }, 800);*/
    dymphases.setSubPhase("create", true, "loadhookrelation");
    await hookReleationForm_Promise();
    hookTaxonomy_Promise();
    setbaseEntityConfig(target);
    return true;
}

function getendpoint(type) {
    var ret = "";
    (kmsconfig.endpoints).forEach(function(item, i) {
        if (item.type == type)
            ret = item.endpoint;
    });
    return ret;
}

function getendpointnested(type, mod) {
    var ret = "";
    var types = type.split(".");
    (kmsconfig.endpoints).forEach(function(item, i) {
        if (item.type == types[0]) {
            ret = item.endpoint;
            if (types.length > 1) {
                var c = types[1];
                ret += item[mod][c];
            }
        }
    });
    return ret;
}
var listLoadedAdm = {};

function loadModelListToModal(target, index, action) {
    var insertmodal = '<div id="entityAdd"  class="dymermodal modal fade" tabindex="-1" role="dialog"   data-backdrop="static">' +
        '<div class="modal-dialog" role="document" style="    max-width: 60%;">' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '<button type="button" class="close closeform" onclick="closeDymerModal(\'entityAdd\')" style="float: right;display: block;position: relative;"><span aria-hidden="true">&times;</span></button>' +
        '<h4 class="modal-title" style="float: left;position: absolute;    margin-top: 0;">Add Entity</h4>' +
        '</div>' +
        '<div class="modal-body" id="cont-module-addentity">' +
        '</div>' +
        //'<div class="modal-footer">' +
        //'<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
        //'<button type="button" class="btn btn-primary onputform" onclick="actionPutMultipartForm(\'entity\',undefined,undefined, \'#entityEdit form\',undefined,undefined,true)">Save changes</button>' +
        //'</div>' +
        '</div>' +
        '</div>' +
        '</div>';
    if ($('#entityEdit').length == 0)
        $('#entityEdit').remove();
    if ($('#entityAdd').length == 0)
        $('body').append(insertmodal);
    // var datapost = { "query": { "instance._index": index }, "act": "update" };
    var datapost = { "query": { "instance._index": index } };
    var sourceUrl = getendpoint('form');
    // loadFormList(geturl, $('#cont-btnadd'), myQuery);
    var temp_config_call = {
        url: sourceUrl,
        type: 'GET',
        addDataBody: false
    };
    var ajax_temp_call = new Ajaxcall(temp_config_call);
    ajax_temp_call.flush();
    if (datapost != undefined)
        ajax_temp_call.addparams(datapost);
    var ret = ajax_temp_call.send();
    var newHtml = "";
    var indport = sourceUrl + "/";
    var listClass = "listAddEntityli";
    var listIcon = '<i class="fa fa-eye listAddEntityicon" aria-hidden="true" ></i>';
    if (sourceUrl.indexOf('form') != -1) {
        listClass = 'listAddEntityli';
        listIcon = '<i class="fa fa-plus-circle listAddEntityicon" aria-hidden="true" ></i>';
    }
    var listToLoad = [];
    if (ret.success) {
        listToLoad = ret.data;
        (ret.data).forEach(function(item, i) {
            var typeIndex = item.instance[0]["_index"];
            var dom_to_render = "content/" + typeIndex + "/";
            var old_dupd = undefined;
            listLoadedAdm[item._id] = {
                tftemp: []
            };
            (item.files).forEach(function(fl, i) {
                var dupd = new Date(fl.uploadDate);
                if (fl.contentType == "text/html") {
                    if (old_dupd == undefined) {
                        old_dupd = dupd;
                        dom_to_render = "content/" + typeIndex + "/" + fl._id; //xyzmarco
                    } else {
                        if (dupd > old_dupd) {
                            dom_to_render = "content/" + typeIndex + "/" + fl._id;
                        }
                    }
                } else {
                    var splmime = (fl.contentType).split("/");
                    var ftype = splmime[1];
                    var lkpath = indport + "content/" + typeIndex + "/" + fl._id;
                    ftype = (ftype == "css") ? "link" : ftype;
                    if (ftype != "octet-stream")
                        listLoadedAdm[item._id].tftemp.push({ domtype: ftype, filename: lkpath, extrattr: [{ key: 'tftemp', value: "rt" }] });
                }
            });
            dom_to_render = indport + dom_to_render;
            newHtml += '<button id="addEntityBtn" onclick="loadAddEntityForm(\'' + dom_to_render + '\',\'' + item._id + '\');" type="button" class="btn btn-outline-secondary ' + listClass + '">' + listIcon+' '+ item.title + '</button>'
        });
        newHtml += " ";
        if (!listToLoad.length)
            newHtml = '<div  class="alert alert-info  "> No '+item.title+' data available  </div>';
        if (action == undefined) {
            $(target).html("");
            $(target).html(newHtml);
        }
        if (action == "replace") {
            $(target).html("");
            $(target).html(newHtml);
        }
        if (action == "append")
            $(target).append(newHtml);

    }
}

async function loadAddEntityForm(dom_to_render, item_id) {
    // let perm = checkPermission(actualItem);
    const perm = checkPermission({}, 'create');
    const grtHtml = grantHtml(perm);
    //xxx
    await loadHtmlForm(dom_to_render, $('#cont-module-addentity '));
    showAddEntityBindReload();
    // ldFormFiles(item_id);
    dymphases.setSubPhase("create", true, "loadattachment");
    await ldFormFiles2(item_id);
    dymphases.setSubPhase("create", true, "createForm");
    $(grtHtml).insertBefore($('#entityAdd .modal-body .alert.alertaction'));
}

function loadFormListInModal(sourceUrl, target, datapost, action) {
    var insertmodal = '<div id="entityAdd"  class="dymermodal modal fade" tabindex="-1" role="dialog"  data-backdrop="static">' +
        '<div class="modal-dialog" role="document" style="    max-width: 60%;">' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '<button type="button" class="close closeform" onclick="closeDymerModal(\'entityAdd\')"  style="float: right;display: block;position: relative;"><span aria-hidden="true">&times;</span></button>' +
        '<h4 class="modal-title" style="float: left;position: absolute;    margin-top: 0;">Add Entity</h4>' +
        '</div>' +
        '<div class="modal-body" id="cont-module-addentity">' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>';
    if ($('#entityAdd').length == 0)
        $('body').append(insertmodal);
    var temp_config_call = {
        url: sourceUrl,
        type: 'GET',
        addDataBody: false
    };
    var ajax_temp_call = new Ajaxcall(temp_config_call);
    ajax_temp_call.flush();
    if (datapost != undefined)
        ajax_temp_call.addparams(datapost);
    var ret = ajax_temp_call.send();
    var newHtml = "<ul>";
    var indport = sourceUrl + "/";
    var listClass = "listAddEntityli";
    var listIcon = '<i class="fa fa-eye listAddEntityicon" aria-hidden="true" ></i>';
    if (sourceUrl.indexOf('form') != -1) {
        listClass = 'listAddEntityli';
        listIcon = '<i class="fa fa-plus-circle listAddEntityicon" aria-hidden="true" ></i>';
    }
    var listToLoad = [];
    if (ret.success) {
        listToLoad = ret.data;
        (ret.data).forEach(function(item, i) {
            console.log("itemitemitem", item);
            var dom_to_render = "content/";
            var old_dupd = undefined;
            listLoadedAdm[item._id] = {
                tftemp: []
            }; //bbbbbb
            (item.files).forEach(function(fl, i) {
                var dupd = new Date(fl.uploadDate);
                if (fl.contentType == "text/html") {
                    if (old_dupd == undefined) {
                        old_dupd = dupd;
                        dom_to_render = "content/" + fl._id;
                    } else {
                        if (dupd > old_dupd) {
                            dom_to_render = "content/" + fl._id;
                        }
                    }
                } else {
                    var splmime = (fl.contentType).split("/");
                    var ftype = splmime[1];
                    var lkpath = indport + "content/" + fl._id;
                    ftype = (ftype == "css") ? "link" : ftype;
                    if (ftype != "octet-stream")
                        listLoadedAdm[item._id].tftemp.push({ domtype: ftype, filename: lkpath, extrattr: [{ key: 'tftemp', value: "rt" }] });
                }
            });
            dom_to_render = indport + dom_to_render;
            newHtml += '<li onclick="loadHtmlForm(\'' + dom_to_render + '\', $(\'#cont-module-addentity\'));showAddEntityBindReload();ldFormFiles(\'' + item._id + '\');" class="' + listClass + '">' + item.title + listIcon + '</li>'
        });
        newHtml += "</ul>";
        if (!listToLoad.length)
            newHtml = '<div  class="alert alert-info "> No data available  </div>';
        if (action == undefined) {
            $(target).html("");
            $(target).html(newHtml);
        }
        if (action == "replace") {
            $(target).html("");
            $(target).html(newHtml);
        }
        if (action == "append")
            $(target).append(newHtml);
    }

}

function loadFormList(sourceUrl, target, datapost, action) {
    var temp_config_call = {
        url: sourceUrl,
        type: 'GET',
        addDataBody: false
    };
    var ajax_temp_call = new Ajaxcall(temp_config_call);
    ajax_temp_call.flush();
    if (datapost != undefined)
        ajax_temp_call.addparams(datapost);
    var ret = ajax_temp_call.send();
    var newHtml = "<ul>";
    var indport = sourceUrl + "/";
    console.log('sourceUrl', sourceUrl);
    var listClass = "listAddEntityli";
    var listIcon = '<i class="fa fa-eye listAddEntityicon" aria-hidden="true" ></i>';
    if (sourceUrl.indexOf('form') != -1) {
        listClass = 'listAddEntityli';
        listIcon = '<i class="fa fa-plus-circle listAddEntityicon" aria-hidden="true" ></i>';
    }
    var listToLoad = [];
    if (ret.success) {
        listToLoad = ret.data;
        (ret.data).forEach(function(item, i) {
            var dom_to_render = "content/";
            var old_dupd = undefined;
            listLoadedAdm[item._id] = {
                tftemp: []
            };
            (item.files).forEach(function(fl, i) {
                var dupd = new Date(fl.uploadDate);
                if (fl.contentType == "text/html") {
                    if (old_dupd == undefined) {
                        old_dupd = dupd;
                        dom_to_render = "content/" + fl._id;
                    } else {
                        if (dupd > old_dupd) {
                            dom_to_render = "content/" + fl._id;
                        }
                    }
                } else {
                    var splmime = (fl.contentType).split("/");
                    var ftype = splmime[1];
                    var lkpath = indport + "content/" + fl._id;
                    ftype = (ftype == "css") ? "link" : ftype;
                    if (ftype != "octet-stream")
                        listLoadedAdm[item._id].tftemp.push({ domtype: ftype, filename: lkpath, extrattr: [{ key: 'tftemp', value: "rt" }] });
                }
                // dom_to_render = (fl.mimetype == "text/html") ? fl.path : dom_to_render;
            });
            dom_to_render = indport + dom_to_render;
            newHtml += '<li onclick="loadHtmlForm(\'' + dom_to_render + '\', $(\'#cont-RenderForm\'));ldFormFiles(\'' + item._id + '\');" class="' + listClass + '">' + item.title + listIcon + '</li>';
        });
        newHtml += "</ul>";
        if (!listToLoad.length)
            newHtml = '<div  class="alert alert-info  "> No data available  </div>';
        if (action == undefined) {
            $(target).html("");
            $(target).html(newHtml);
        }
        if (action == "replace") {
            $(target).html("");
            $(target).html(newHtml);
        }
        if (action == "append")
            $(target).append(newHtml);
    }
}

async function ldFormFiles2(id) {
    let rs = await removeTempImport('tftemp').then(async function() {
        //  console.log("inizio caricamento file");
        // return onloadFiles((listLoadedAdm[id].tftemp).slice());
        let onl2=onloadFiles2((listLoadedAdm[id].tftemp).slice());
        if (typeof afterLoadForm !== "undefined") {
        setTimeout(function() {
                afterLoadForm(); //marco after
        }, 3000);  }
        return onl2;
    });
    //  console.log("ritorno ldFormFiles2");
    return rs;
}
async function ldFormFiles(id) {
    removeTempImport('tftemp').then(function() {
        console.log("inizio caricamento file");
        onloadFiles((listLoadedAdm[id].tftemp).slice());
        setTimeout(function() {
            if (typeof afterLoadForm !== "undefined") {
                afterLoadForm(); //marco after
            }
        }, 3000);
    });
}

function actionEventPostMultipartForm(type, el, senderForm, callbackfunction, callerForm, useGritter) {
    var posturl = getendpoint(type);
    var temp_config_call = {
        url: posturl,
        processData: false,
        enctype: "multipart/form-data; boundary=----------------------------4ebf00fbcf09",
        contentType: false,
        cache: false
    };
    var ajax_temp_call = new Ajaxcall(temp_config_call);
    if (senderForm == undefined) {
        var t_id = el.closest('.senderForm').attr("id");
        if (t_id == undefined) {
            var tstamp = new Date().getTime();
            t_id = "kmstemp" + tstamp;
            el.closest('.senderForm').attr("id", t_id);
        }
        senderForm = "#" + el.closest('.senderForm').attr("id");
    }
    if (el.attr("disabled") != undefined)
        return false;
    var complete = false;
    var gr_title = "";
    var gr_text = "Please fill out all required fields";
    if (senderForm != undefined) {
        // complete = check_required(senderForm);
        complete = check_dymer_validform(senderForm);

    }

    if (!complete) {
        if (callerForm != undefined)
            $(callerForm).hideLoader();

        if (useGritter)
            useAlert(senderForm, gr_title, gr_text, success);
        return complete;
    }
    /*var checkForm=checkBeforeProduction(senderForm);
     var complete = check_required(senderForm);
     if (!complete){
         $('#p_p_id'+pnamespace).hideLoader();return complete;
     }
     if (!checkForm){
         $('#p_p_id'+pnamespace).hideLoader();
         return checkForm;
     }
        */
    //	setCheck(senderForm);
    ajax_temp_call.flush();
    ajax_temp_call.addcontainer_ids(senderForm);
    //var personalData = new Object();
    //personalData[ "p1"] = "v1";
    //var beforeSend={"beforeSend":"beforeSendEntity"};
    //ajaxcall_postForm.addparams(personalData);
    //var personalData2={"data":{"p2":"v2","p3":"v3"}};
    //ajaxcall_postForm.addparams(personalData2);
    //var personalData3={"p4":[1,2,3,4]};
    //ajaxcall_postForm.addparams(personalData3);
    var ret = ajax_temp_call.send();
    var success = ret.success;
    if (useGritter != undefined) {
        gr_title = "";
        gr_text = ret.message;
    }
    if (success) {
        if (callerForm != undefined)
            senderForm = callerForm;
        if (callbackfunction != undefined) {
            callbackfunction.call();
        }
        //resetContainer(senderForm);
        if (useGritter)
            useAlert(senderForm, gr_title, gr_text, success);
    } else {
        if (useGritter)
            useAlert(senderForm, gr_title, gr_text, success);
    }
    return false;
}
//-----------------END FORM-----------------

// -----------------START VIEW---------------
async function loadRequireView() {
    let ckaddimport = [];
    if ( typeof dymerconf !== 'undefined' ) {
        ckaddimport = dymerconf.notImport;
    }

    let arr = [];

    // Load libraries from the database
    try {
        const response = await fetch( serverUrl + '/api/dservice/api/v1/library/' );
        const libraries = await response.json();

        libraries.filter( ( { loadtype, activated  } ) => loadtype === 'view' && activated).forEach( library => {
            const { domtype, filename, callback, useonload, group, name } = library;

            // Valuta la callback solo se non è nulla (attenzione: eval può comportare rischi di sicurezza)
            const evalCallback = callback !== null ? eval(`${callback}`) : null;

            if ( !( ckaddimport.indexOf( group ) > -1 ) ) {
                arr.push(new Elfile(domtype, kmsconfig.cdn + filename, evalCallback, useonload, group));
                    console.log( `Add ${ library.name } at arr array:` )
                }

        } )

    } catch ( error ) {
        console.error( 'Error fetching and loading libraries:', error );
    }

    let filename = kmsconfig.cdn + "js/handlebarshook.js";
    var mycallback = function() { // Method which will display type of Animal

        document.cookie = "DYMisi=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
        var temp_config_call = {
            url: csd + "/api2/retriveinfo",
            type: 'POST',
            addDataBody: false
        };
        var ajax_temp_call = new Ajaxcall(temp_config_call);
        ajax_temp_call.flush();
        var ret = ajax_temp_call.send();
        for (const [key, value] of Object.entries(ret)) {
            if (key == "DYMisi")
                document.cookie = "DYMisi=" + value;
            else {
                localStorage.removeItem(key);
                localStorage.setItem(key, value);
            }
        }
        mainDymerView();
    };
    arr.push(new Elfile("script", filename, mycallback, true));


    await onloadFiles( arr );
}
//-----------------END VIEW---------------

//-----------------START MAP-----------------
function loadRequireMap() {
    var domtype = "link";
    var filename = "";
    var callback = null;
    var useonload = false;
    var arr = [];
    var ckaddimport = [];
    if (typeof dymerconf !== 'undefined')
        ckaddimport = dymerconf.notImport;
    var group = "mandatory";

    group = "bootstrap";
    filename = kmsconfig.cdn + "css/lib/bootstrap/4.1.3/bootstrap.min.css";
    if (!(ckaddimport.indexOf(group) > -1))
        arr.push(new Elfile(domtype, filename, callback, useonload, group));
    //filename = "https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.13.1/css/bootstrap-select.css";

    group = "bootstrap-select";
    filename = kmsconfig.cdn + "css/lib/bootstrap-select/bootstrap-select.css";
    if (!(ckaddimport.indexOf(group) > -1))
        arr.push(new Elfile(domtype, filename, callback, useonload, group));

    group = "font-awesome";
    filename = kmsconfig.cdn + "css/lib/font-awesome/4.7/font-awesome.min.css";
    if (!(ckaddimport.indexOf(group) > -1))
        arr.push(new Elfile(domtype, filename, callback, useonload, group));

    group = "mandatory";
    filename = kmsconfig.cdn + "leaflet/leaflet.css";
    arr.push(new Elfile(domtype, filename, callback, useonload, group));
    filename = kmsconfig.cdn + "leaflet/plugin/toolbar/leaflet.toolbar.css";
    arr.push(new Elfile(domtype, filename, callback, useonload, group));

    group = "jquery.dataTables";
    if (!(ckaddimport.indexOf(group) > -1))
        filename = kmsconfig.cdn + "css/lib/datatables/jquery.dataTables.min.css";
    arr.push(new Elfile(domtype, filename, callback, useonload, group));
    filename = kmsconfig.cdn + "leaflet/plugin/markercluster/MarkerCluster.Default.css";
    arr.push(new Elfile(domtype, filename, callback, useonload, group));
    filename = kmsconfig.cdn + "leaflet/plugin/fullscreen/Control.FullScreen.css";
    arr.push(new Elfile(domtype, filename, callback, useonload, group));
    filename = kmsconfig.cdn + "leaflet/plugin/sidebar/L.Control.Sidebar.css";
    arr.push(new Elfile(domtype, filename, callback, useonload, group));
    filename = kmsconfig.cdn + "css/kms.view.map.css";
    arr.push(new Elfile(domtype, filename, callback, useonload, group));
    filename = kmsconfig.cdn + "css/bootstrap-dymertagsinput.css";
    arr.push(new Elfile(domtype, filename, callback, useonload, group));

    group = "mandatory";
    filename = kmsconfig.cdn + "css/dymer.base.css";
    if (!(ckaddimport.indexOf(group) > -1))
        arr.push(new Elfile(domtype, filename, callback, useonload, group));
    filename = kmsconfig.cdn + "leaflet/leaflet.awesome-markers.css";
    if (!(ckaddimport.indexOf(group) > -1))
        arr.push(new Elfile(domtype, filename, callback, useonload, group));



    domtype = "script";
    callback = null;
    useonload = true;
    group = "jquery";
    filename = kmsconfig.cdn + "js/lib/jquery/jquery-3.3.1.min.js";
    if (!(ckaddimport.indexOf(group) > -1))
        arr.push(new Elfile(domtype, filename, callback, useonload, group));
    group = "mandatory";
    //Marco filename = kmsconfig.cdn + "js/dymer.oauth.js";
    //Marco arr.push(new Elfile(domtype, filename, callback, useonload, group));
    // filename = kmsconfig.cdn + "js/utility.js";
    // arr.push(new Elfile(domtype, filename, callback, useonload, group)); //controllare carico in altra
    filename = kmsconfig.cdn + "js/bootstrap-dymertagsinput.js";
    arr.push(new Elfile(domtype, filename, callback, useonload, group));
    group = "serializejson";
     filename = kmsconfig.cdn + "js/lib/jquery/jquery.serializejson.js";
     if (!(ckaddimport.indexOf(group) > -1))
    arr.push(new Elfile(domtype, filename, callback, useonload, group));
    group = "ajaxcall";
    filename = kmsconfig.cdn + "js/ajaxcall.js";
    if (!(ckaddimport.indexOf(group) > -1))
    arr.push(new Elfile(domtype, filename, callback, useonload, group));
    filename = kmsconfig.cdn + "leaflet/leaflet-src.js";
    //filename =  "http://unpkg.com/leaflet@1.3.1/dist/leaflet.js";
    arr.push(new Elfile(domtype, filename, callback, useonload, group));
    filename = kmsconfig.cdn + "leaflet/leaflet.awesome-markers.js";
    arr.push(new Elfile(domtype, filename, callback, useonload, group));

    group = "jquery.dataTables";
    if (!(ckaddimport.indexOf(group) > -1)) {
        filename = kmsconfig.cdn + "js/lib/datatables/jquery.dataTables.min.js";
        // filename = "https://cdn.datatables.net/1.10.21/js/jquery.dataTables.min.js";
        arr.push(new Elfile(domtype, filename, callback, useonload, group));
        //filename = 'https://cdn.datatables.net/buttons/1.2.2/js/buttons.print.min.js';
        filename = kmsconfig.cdn + 'js/lib/buttons/buttons.print.min.js';
        arr.push(new Elfile(domtype, filename, callback, true, group));
        //filename = 'https://cdn.datatables.net/buttons/1.6.1/js/dataTables.buttons.min.js';
        filename = kmsconfig.cdn + 'js/lib/datatables/dataTables.buttons.min.js';
        arr.push(new Elfile(domtype, filename, callback, true, group));
        //filename = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.3/jszip.min.js';
        filename = kmsconfig.cdn + 'js/lib/jszip.min.js';
        arr.push(new Elfile(domtype, filename, callback, false, group));
        //filename = 'https://cdn.datatables.net/1.10.21/css/dataTables.bootstrap4.min.css';
        filename = kmsconfig.cdn + 'css/lib/datatables/dataTables.bootstrap4.min.css';
        arr.push(new Elfile("link", filename, callback, false, group));
        //filename = 'https://cdn.datatables.net/1.10.21/js/dataTables.bootstrap4.min.js';
        filename = kmsconfig.cdn + 'js/lib/datatables/dataTables.bootstrap4.min.js';
        arr.push(new Elfile(domtype, filename, callback, false, group));
        filename = kmsconfig.cdn + "js/lib/pdfmake.min.js";
        arr.push(new Elfile(domtype, filename, callback, true, group));
        filename = kmsconfig.cdn + "js/lib/vfs_fonts.js";
        arr.push(new Elfile(domtype, filename, callback, true, group));
        //filename = 'https://cdn.datatables.net/buttons/1.6.1/js/buttons.html5.min.js';
        filename = kmsconfig.cdn + 'js/lib/buttons/buttons.html5.min.js';
        arr.push(new Elfile(domtype, filename, callback, false, group));
    }
    filename = kmsconfig.cdn + "leaflet/plugin/fullscreen/Control.FullScreen.js";
    arr.push(new Elfile(domtype, filename, callback, useonload, group));
    group = "popper";
    filename = kmsconfig.cdn + "js/lib/jquery/popper.min.js";
    if (!(ckaddimport.indexOf(group) > -1))
        arr.push(new Elfile(domtype, filename, callback, useonload, group));
    filename = kmsconfig.cdn + "js/lib/bootstrap/4.1.3/bootstrap.min.js";
    group = "bootstrap";
    if (!(ckaddimport.indexOf(group) > -1))
        arr.push(new Elfile(domtype, filename, callback, useonload, group));
    //filename = kmsconfig.cdn + "js/kms.view.js";
    //arr.push(new Elfile(domtype, filename, callback, useonload));
    group = "summernote";
    if (!(ckaddimport.indexOf(group) > -1)) {
        filename = kmsconfig.cdn + "lib/summernote/0.8.18/summernote.min.css";
        arr.push(new Elfile("link", filename, callback, useonload, group));
        filename = kmsconfig.cdn + "lib/summernote/0.8.18/summernote.min.js";
        arr.push(new Elfile(domtype, filename, callback, useonload, group));
    }
    group = "mandatory";
    filename = kmsconfig.cdn + "leaflet/plugin/toolbar/leaflet.toolbar.js";
    arr.push(new Elfile(domtype, filename, callback, useonload, group));
    filename = kmsconfig.cdn + "leaflet/plugin/sidebar/L.Control.Sidebar.js";
    arr.push(new Elfile(domtype, filename, callback, useonload, group));
    //filename = 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.13.1/js/bootstrap-select.min.js';
    group = "bootstrap-select";
    filename = kmsconfig.cdn + 'js/lib/bootstrap-select/bootstrap-select.min.js';
    arr.push(new Elfile(domtype, filename, mycallback, useonload));
    group = "mandatory";
    filename = kmsconfig.cdn + "js/handlebars.min.js";
    arr.push(new Elfile(domtype, filename, callback, useonload, group));
    filename = kmsconfig.cdn + "js/handlebarshook.js";
    arr.push(new Elfile(domtype, filename, callback, useonload));
    filename = kmsconfig.cdn + "leaflet/plugin/markercluster/leaflet.markercluster.js";
    var mycallback = function() { // Method which will display type of Animal
        var temp_config_call = {
            url: csd + "/api2/retriveinfo",
            type: 'POST',
            addDataBody: false
        };
        var ajax_temp_call = new Ajaxcall(temp_config_call);
        ajax_temp_call.flush();
        var ret = ajax_temp_call.send();
        for (const [key, value] of Object.entries(ret)) {
            if (key == "DYMisi")
                document.cookie = "DYMisi=" + value;
            else {
                localStorage.removeItem(key);
                localStorage.setItem(key, value);
            }
        }
        mainMapOnLoad();
    };
    arr.push(new Elfile(domtype, filename, mycallback, useonload, group));
    onloadFiles(arr);
    //loadAllJsCss();
}
//-----------------END MAP------------------

//-----------------START ENTITY--------------
function resetMapFiltered() {
    reloadMarker(undefined).then(function(ars) {
        // populateMap(ars);
        //populateDT(kmsdataset);
    });
}

function getEntities2(el, senderForm, callbackfunction, callerForm, useGritter) {
    reloadMarker(el).then(function(ars) {
        populateMap(ars);
        //populateDT(kmsdataset);
    });
    /*var ret = actionPostMultipartForm(kmsconf.endpoint, el, undefined, undefined, undefined, undefined, false);
    var dataDt = ret.data;
    var templ_data = flatEsArray(dataDt);
    kmsdataset = templ_data.arr;
    var dataMp = ret.data;
//	manageTamplateList(templ_data.templates);
    if (kmsconf.swapgeop)
        dataMp = mapJsonArrayToGeoJson(ret.data);
    populateMap(dataMp);
    populateDT(kmsdataset);
    console.log("getEntities2 dataMp", dataMp);
    return false;*/
}
//Marco To delete?
function searchEntity(sourceUrl, target, datapost, action) {
    var temp_config_call = {
        url: serviceEntitiesUrl,
        processData: false,
        enctype: "multipart/form-data; boundary=----------------------------4ebf00fbcf09",
        contentType: false,
        cache: false
    };
    temp_config_call.flush();
    if (senderForm == undefined)
        senderForm = "#" + el.closest('.senderForm').attr("id");
    if (el.attr("disabled") != undefined)
        return false;
    ajaxcall_getEntities.addcontainer_ids(senderForm);
    var ret = ajaxcall_getEntities.send();
    if (ret.success) {
        (ret.data).forEach(function(item, i) {
            var dom_to_render = undefined;
            (item.files).forEach(function(fl, i) {
                dom_to_render = (fl.mimetype == "text/html") ? fl.path : dom_to_render;
            });
            dom_to_render = replaceAll(dom_to_render, '\\', '/');
            console.log('dom_to_render', dom_to_render);
            dom_to_render = "http://localhost:4747/" + dom_to_render;
            newHtml += '<li onclick="loadHtmlForm(\'' + dom_to_render + '\', $(\'#cont-RenderForm\'))">' + item.title + '</li>'
        });
        newHtml += "</ul>";
        if (action == undefined) {
            $(target).html("");
            $(target).html(newHtml);
        }
        if (action == "replace") {
            $(target).html("");
            $(target).html(newHtml);
        }
        if (action == "append")
            $(target).append(newHtml);
    }
}

function loadEntitiesTemplate(conf) {
    var reload = false;
    if (kmsdataset == undefined) {
        kmsconf = conf;
        reload = true;
    } else {
        if (kmsconf.target != undefined)
            if (kmsconf.target.list != undefined)
                reload = (kmsconf.target.list.reload != undefined) ? kmsconf.target.list.reload : false;
    }
    if (reload) { //reload
        //console.log("kmsconf.query", kmsconf.query);
        var ret = actionPostMultipartForm(kmsconf.endpoint, undefined, kmsconf.query, undefined, undefined, undefined, false);
        var templ_data = flatEsArray(ret.data);
        kmsdataset = templ_data.arr;
        manageTamplateList(templ_data.templates);
    }
}

function drawEntities(conf) {
    loadEntitiesTemplate(conf);
    kmsrenderEl(kmsdataset, kmsconf.viewtype);
}

function getrendRole(perm) {
    var owner = "";
    if (perm.edit || perm.delete) {
        if (perm.isowner)
        return '<i class="fa fa-user icon-action" title="Owner" ></i>';
          if (perm.isadmin)
          return '<i class="fa fa-user-circle icon-action" title="Admin" ></i>';
          if (perm.iscurator)
          return '<i class="fa fa-user-circle-o icon-action" title="Editor" ></i>';

          return '<i class="fa fa-user-o icon-action" title="co-editor"  ></i>';
    }
    return owner;
}

function grantHtml(perm) {
    if (perm.managegrant) {
        let permStart = '<div id="grantPermission" class="form-group">';
        let permUsr = '       <div class="row  ">' +
            '           <div class="kms-title-label col-12 " style="">Co-Editor  Permission</div>' +
            '       <div   class="col-12 text-center text-info"><i class="fa fa-pencil"></i>  Edit</div>' +
            '       </div>' +
            '       <div class="row  ">' +
            '           <div class="form-group repeatable rpperm first-repeatable col-3" style="">' +
            '	            <div>' +
            //   '		            <label for="description" class=" ">Update</label>' +
            '		            <input type="mail" placeholder="portal user email" class="form-control col-12 span12" name="data[properties][grant][update][uid][0]">' +
            //  '		            <small class="form-text text-muted"> Uid co-owner</small>' +
            '	            </div>' +
            '	            <div class="action-br">' +
            '		            <span class="btn  btn-outline-primary  btn-sm" onclick="cloneRepeatable($(this))">+</span><span class="btn  btn-outline-danger  btn-sm act-remove" onclick="removeRepeatable($(this))">-</span>' +
            '	            </div>' +
            '           </div>' +
            '       </div>' +
            '       <div class="row grtgrpDelete ">' +
            '           <div   class="col-12  text-center text-danger"> <i class="fa fa-trash"></i>  Delete</div>' +
            '       </div>' +
            '       <div class="row  grtgrpDelete">' +
            '           <div class="form-group repeatable rpperm first-repeatable col-3" style="">' +
            '	            <div>' +
            //  '		            <label for="description" class=" ">Delete</label>' +
            '		            <input type="mail" placeholder="portal user email" placeholder="user email" class="form-control col-12 span12" name="data[properties][grant][delete][uid][0]">' +
            //  '		            <small class="form-text text-muted"> Uid co-owner</small>' +
            '	            </div>' +
            '	            <div class="action-br">' +
            '		            <span class="btn  btn-outline-primary  btn-sm" onclick="cloneRepeatable($(this))">+</span><span class="btn  btn-outline-danger  btn-sm act-remove" onclick="removeRepeatable($(this))">-</span>' +
            '	            </div>' +
            '           </div>' +
            '       </div>' +
            '       <div class="row  grtgrpMgrant">' +
            '           <div   class="col-12  text-center text-warning"> <i class="fa fa-lock"></i>  Manage Grant</div>' +
            '       </div>' +
            '       <div class="row  grtgrpMgrant">' +
            '           <div class="form-group repeatable rpperm first-repeatable col-3" style="">' +
            '	            <div>' +
            //  '		            <label for="description" class=" ">Delete</label>' +
            '		            <input type="text" class="form-control col-12 span12" name="data[properties][grant][managegrant][uid][0]">' +
            //  '		            <small class="form-text text-muted"> Uid co-owner</small>' +
            '	            </div>' +
            '	            <div class="action-br">' +
            '		            <span class="btn  btn-outline-primary  btn-sm" onclick="cloneRepeatable($(this))">+</span><span class="btn  btn-outline-danger  btn-sm act-remove" onclick="removeRepeatable($(this))">-</span>' +
            '	            </div>' +
            '           </div>' +
            '       </div>';
        var permGrpsr = '<div style="display:none;visibility: hidden!important;">     <hr>' +
            '       <div class="row  ">' +
            '           <div class="kms-title-label col-12 " style="">Group  Permission</div>' +
            '           <div   class="col-12 text-center text-info"><i class="fa fa-pencil"></i>  Edit</div>' +
            '       </div>' +
            '       <div class="row  ">' +
            '           <div class="form-group repeatable rpperm first-repeatable col-3" style="">' +
            '	            <div>' +
            //           '		            <label for="description" class=" ">Update</label>' +
            '		            <input type="text" class="form-control col-12 span12" name="data[properties][grant][update][gid][0]">' +
            //           '		            <small class="form-text text-muted">GroupId co-owners</small>' +
            '	            </div>' +
            '	            <div class="action-br">' +
            '		            <span class="btn  btn-outline-primary  btn-sm" onclick="cloneRepeatable($(this))">+</span><span class="btn  btn-outline-danger  btn-sm act-remove" onclick="removeRepeatable($(this))">-</span>' +
            '	            </div>' +
            '           </div>' +
            '       </div>' +
            '       <div class="row  ">' +
            '           <div   class="col-12  text-center text-danger"> <i class="fa fa-trash"></i>  Delete</div>' +
            '       </div>' +
            '       <div class="row  ">' +
            '           <div class="form-group repeatable rpperm first-repeatable col-3" style="">' +
            '	            <div>' +
            //           '		            <label for="description" class=" ">Delete</label>' +
            '		            <input type="text" class="form-control col-12 span12" name="data[properties][grant][delete][gid][0]">' +
            //            '		            <small class="form-text text-muted">GroupId co-owners</small>' +
            '	            </div>' +
            '	            <div class="action-br">' +
            '		            <span class="btn  btn-outline-primary  btn-sm" onclick="cloneRepeatable($(this))">+</span><span class="btn  btn-outline-danger  btn-sm act-remove" onclick="removeRepeatable($(this))">-</span>' +
            '	            </div>' +
            '           </div>' +
            '       </div>' +
            '       <div class="row  ">' +
            '           <div   class="col-12  text-center text-warning"> <i class="fa fa-lock"></i>  Manage grunt</div>' +
            '       </div>' +
            '       <div class="row  ">' +
            '           <div class="form-group repeatable rpperm first-repeatable col-3" style="">' +
            '	            <div>' +
            //           '		            <label for="description" class=" ">Delete</label>' +
            '		            <input type="text" class="form-control col-12 span12" name="data[properties][grant][managegrant][gid][0]">' +
            //            '		            <small class="form-text text-muted">GroupId co-owners</small>' +
            '	            </div>' +
            '	            <div class="action-br">' +
            '		            <span class="btn  btn-outline-primary  btn-sm" onclick="cloneRepeatable($(this))">+</span><span class="btn  btn-outline-danger  btn-sm act-remove" onclick="removeRepeatable($(this))">-</span>' +
            '	            </div>' +
            '           </div>' +
            '       </div></div>  ';
        let permEnd = '</div>';
        return permStart + permUsr + permGrpsr + permEnd;
    }
    return "";
}

function checkPermission(actualItem, act) {
    //let d_uid = retriveVarCookie("d_uid");
    let d_uid = localStorage.getItem("d_uid");
    let d_gid = localStorage.getItem("d_gid");
    let d_rl = localStorage.getItem("d_rl");
    let d_lp =  JSON.parse(atob( localStorage.getItem("d_lp")));
   // console.log("d_lp",d_lp);
    var entPerm = {
        isowner: false,
        view: false,
        edit: false,
        delete: false,
        managegrant: false,
        isadmin: false,
        iscurator:false
    };
    if (typeof d_uid == 'undefined') {
        entPerm.view = true;
        return entPerm;
    }
    let isiinfo = undefined;
    if (retriveVarCookie("DYMisi") != null)
        isiinfo = JSON.parse(atob(retriveVarCookie("DYMisi")));
    if (isiinfo != undefined && isiinfo != "null") {
        if ((isiinfo.roles).find(x => x.role == "app-admin")) {
            entPerm.view = true;
            entPerm.isadmin = true;
            entPerm.edit = true;
            entPerm.delete = true;
            entPerm.managegrant = true;
            return entPerm;
        }
    }
    if (d_rl != null)
        if (typeof d_rl != 'undefined') {
            d_rl = JSON.parse(atob(d_rl));
            if ((d_rl).find(x => x == "app-admin")) {
                entPerm.isadmin = true;
                entPerm.isowner = false;
                entPerm.view = true;
                entPerm.edit = true;
                entPerm.delete = true;
                entPerm.managegrant = true;
                return entPerm;
            }
        }
    if (act == 'create') {
        entPerm.view = true;
        entPerm.edit = true;
        entPerm.delete = true;
        entPerm.managegrant = true;
        return entPerm;
    }
    const entOwner = actualItem.properties.owner;
    if (d_uid == entOwner.uid) {
        entPerm.isowner = true;
        entPerm.view = true;
        entPerm.edit = true;
        entPerm.delete = true;
        entPerm.managegrant = true;
        return entPerm;
    }
    let is_spr=false;
    let actualIndex=actualItem._index;
    if(d_lp.edit.includes(actualIndex) ){
        entPerm.view = true;
        entPerm.edit = true;
        entPerm.iscurator =true;
    }
    if(d_lp.delete.includes(actualIndex) ){
        entPerm.view = true;
        entPerm.delete = true;
        entPerm.iscurator =true;

    }
    if( entPerm.iscurator ){

         return entPerm;
    }

    if (typeof actualItem.properties.grant != 'undefined') {
        var entGrant = actualItem.properties.grant;
        if (entGrant.hasOwnProperty("update"))
            if ((entGrant.update.uid).find(x => x == d_uid) || (entGrant.update.gid).find(x => x == d_gid)) {
                entPerm.edit = true;
            }
        if (entGrant.hasOwnProperty("delete"))
            if ((entGrant.delete.uid).find(x => x == d_uid) || (entGrant.delete.gid).find(x => x == d_gid)) {
                entPerm.delete = true;
            }
        if (entGrant.hasOwnProperty("managegrant")) {
            if ((entGrant.managegrant.uid).find(x => x == d_uid) || (entGrant.managegrant.gid).find(x => x == d_gid)) {
                entPerm.managegrant = true;
            }
        }
        //if ((entGrant.view.uid).find(entOwner.uid) || (entGrant.view.gid).find(entOwner.gid)) {
        entPerm.view = true;
        // }/*else{
        if (actualItem.status != 1 || actualItem.visibility) {
            return entPerm;
        }
        // }*/

    }

    if (d_uid != entOwner.uid && d_gid == entOwner.gid && !is_spr) {
        entPerm.view = true;
        entPerm.edit = false;
        entPerm.delete = false;
        return entPerm;
    }

    return entPerm;
}

function checkSatus(actualItem, hookCheckSatusconf) {
    if (hookCheckSatusconf != undefined)
        hookCheckSatusconf = JSON.parse(hookCheckSatusconf);
    var statusDiv = "";
    switch (actualItem.properties.status) {
        case '1':
            {
                if (hookCheckSatusconf == undefined) {} else {
                    if (hookCheckSatusconf.allstatus == true) {
                        statusDiv = 'PUBLISHED';
                        if (hookCheckSatusconf.style == 'text') {} else
                            statusDiv = '<div class="span12 col-12 alert alert-info" style="text-align:center" > <b>' + statusDiv + '</b> </div>';
                    }
                }
                break;
            }
        case '2':
            {
                statusDiv = 'UNPUBLISHED';
                if (hookCheckSatusconf == undefined) {
                    statusDiv = '<div class="span12 col-12 alert alert-info" style="text-align:center" > <b>' + statusDiv + '</b> </div>';
                } else {
                    if (hookCheckSatusconf.style == 'text') {} else
                        statusDiv = '<div class="span12 col-12 alert alert-info" style="text-align:center" > <b>' + statusDiv + '</b> </div>';
                }
                break;
            }
        case '3':
            {
                statusDiv = 'DRAFT';
                if (hookCheckSatusconf == undefined) {
                    statusDiv = '<div class="span12 col-12 alert alert-info" style="text-align:center"> <b>' + statusDiv + '</b> </div>';
                } else {
                    if (hookCheckSatusconf.style == 'text') {} else
                        statusDiv = '<div class="span12 col-12 alert alert-info" style="text-align:center"> <b>' + statusDiv + '</b> </div>';
                }
                break;
            }
        default:
            break;
    }
    //    console.log("chekSatus", actualItem.status, statusDiv);
    return statusDiv;
}

function checkVisibility(actualItem, rendConf) {
    if (rendConf != undefined)
        rendConf = JSON.parse(rendConf);
    var statusDiv = "";
    switch (actualItem.properties.visibility) {
        case '0':
            if (rendConf != undefined)
                if (rendConf.allstatus == true)
                    statusDiv = '<i class="fa fa-unlock icon-action" title="public" aria-hidden="true"></i>';
            break;
        case '1':
            statusDiv = '<i class="fa fa-lock icon-action" title="private"></i>';
            break;
        case '2':
            statusDiv = '<i class="fa fa-unlock-alt icon-action"  title="restricted"></i>';
            break;
        default:
            break;
    }
    return statusDiv;
}

function kmsrenderEl(ar, rendertype) {
    $('body').showLoader();
    var target = kmsconf.target;
    actualTemplateType = rendertype;
    dymphases.setSubPhase('view', true, '', rendertype);
    removeTempImport('tftemp').then(function() {
        var action = ""; // target[rendertype].action;
        var targetId = "#noexsist"; //target[rendertype].id;
        var tid = "mll";
        if (target != undefined) {
            var tstamp = new Date().getTime();
            tid = "cont-List" + tstamp;
            targetId = (target[rendertype].id != undefined) ? target[rendertype].id : '#' + tid;
            action = (target[rendertype].action != undefined) ? target[rendertype].action : "html";
        }
        if ($(targetId).length == 0) {
            $('body').append('<div id="' + tid + '"></div>');
        }
        var templcount = Object.keys(templateslist).length;
        var baseurlcd = (kmsconfig.cdn).replace('public/cdn/', "");
        var types = [];
        if (!ar.length) {
            $(targetId).html('<br>' +
                '<div class="alert alert-info  ">' +
                ' <span>' +
                '    No data available</span>' +
                ' </div>');
            $('body').hideLoader();
            return;
        }
        (ar).forEach(function(item, i) {
            // item.cdnpath = baseurlcd;
            var tmpl = item._index + "@" + item._type;
            types.indexOf(tmpl) === -1 ? types.push(tmpl) : "";
        });
        if (rendertype == 'fullcontent' || types.length == 1) {
            var item = (rendertype == 'fullcontent') ? ar[0] : ar;
            if (ar.length == 1 && rendertype == 'fullcontent')
                checkbreadcrumb(item);
            else
                $("#dymer_breadcrumb span").not(':first').remove();
            var tmpl = (rendertype == 'fullcontent') ? item._index + "@" + item._type : item[0]._index + "@" + item[0]._type;
            //   tmpl = item._index + "@" + item._type;
            var typetemplateToRender = (rendertype == 'fullcontent') ? 'fullcontent' : kmsconf.viewtype;
            var mytemplate = templateslist[tmpl]['viewtype'][typetemplateToRender];
            actualItem = item;
            if (!$.trim(mytemplate).length) {
                var itemToEdit = item;
                var sourceUrl = getendpoint('form');
                var datapost = { "query": { "instance._index": itemToEdit._index, "instance._type": itemToEdit._type }, "act": "update" };
                var temp_config_call = {
                    url: sourceUrl,
                    type: 'GET',
                    addDataBody: false
                };
                var ajax_temp_call = new Ajaxcall(temp_config_call);
                ajax_temp_call.flush();
                if (datapost != undefined)
                    ajax_temp_call.addparams(datapost);
                var ret = ajax_temp_call.send();
                if (ret.success) {
                    if (!ret.data.length) {
                        var mytemplate = '<div class="alert alert-info  "> No Template&Model available  </div>   ';
                        mytemplate += "<label>Title</label> : {{title}}"
                        var stone = Handlebars.compile(mytemplate)(itemToEdit);
                        $(targetId)[action](stone);
                    } else
                        (ret.data).forEach(function(item, i) {
                            var model_form = "";
                            (item.files).forEach(function(fl, i) {
                                if (fl.contentType == "text/html") {
                                    model_form = fl.data;
                                    var stone = '<h1 class="text-info text-left">No template exists</h1> ' + model_form;;
                                    $(targetId)[action](stone);
                                    $(targetId).multidisable();
                                    setTimeout(function() {
                                        duplicateRepeatable(targetId, itemToEdit);
                                    }, 1000);
                                    setTimeout(function() {
                                        populateFormEdit(targetId, itemToEdit, undefined, undefined, itemToEdit);
                                        $(targetId).multidisable();

                                    }, 3000);
                                }
                            });
                        });
                }
            } else {
                //   mytemplate = chekSatus(actualItem) + mytemplate;
                var stone = Handlebars.compile(mytemplate)(item);
                $(targetId)[action](stone);
                onloadFiles((templateslist[tmpl]['files'][typetemplateToRender]).slice());
            }
            $('body').hideLoader();
        } else {
            console.log("ELSE rendertype ==  ", rendertype);
            if (action == "html")
                $(targetId).empty();
            action = "append";
            (ar).forEach(function(item, i) {
                var tmpl = item._index + "@" + item._type;
                var typetemplateToRender = 'fullcontent'; // (rendertype == 'fullcontent') ? 'fullcontent' : kmsconf.viewtype;
                typetemplateToRender = 'teaser'; // (rendertype == 'fullcontent') ? 'fullcontent' : kmsconf.viewtype;
                var mytemplate = templateslist[tmpl]['viewtype'][typetemplateToRender];
                if (mytemplate == "")
                    mytemplate = getDymerTemplateMultiple();
                var stone = Handlebars.compile(mytemplate)(item);
                $(targetId)[action](stone);
                onloadFiles((templateslist[tmpl]['files'][typetemplateToRender]).slice());
            });
            $('body').hideLoader();
        }
    }).then(function(string) {
        dymerPaginatorSetReset()
    });
}

function getModelEntity(el) {
    var itemToEdit = el;
    var sourceUrl = getendpoint('form');
    var datapost = { "query": { "instance._index": itemToEdit._index, "instance._type": itemToEdit._type }, "act": "update" };
    var temp_config_call = {
        url: sourceUrl,
        type: 'GET',
        addDataBody: false
    };
    var ajax_temp_call = new Ajaxcall(temp_config_call);
    ajax_temp_call.flush();
    if (datapost != undefined)
        ajax_temp_call.addparams(datapost);
    var ret = ajax_temp_call.send();
    if (ret.success) {
        (ret.data).forEach(function(item, i) {
            var model_form = "";
            (item.files).forEach(function(fl, i) {
                if (fl.contentType == "text/html") {
                    model_form = fl.data;
                    return model_form;
                }
            });
        });
    }
}

// function editEntity(id) {
//const editEntity = async function(id) {
async function editEntity(id) {
    var itemToEdit = actualItem;
    if (actualTemplateType == "teaserlist" || actualTemplateType == "datatable") {
        (kmsdataset).forEach(function(el, i) {
            if (el._id == id) {
                itemToEdit = el;
            }
        });
    }
    const perm = checkPermission(actualItem, 'update');
    var sourceUrl = getendpoint('form');
    var datapost = { "query": { "instance._index": itemToEdit._index, "instance._type": itemToEdit._type }, "act": "update" };
    var indport = sourceUrl + "/";
    var temp_config_call = {
        url: sourceUrl,
        type: 'GET',
        addDataBody: false
    };
    var ajax_temp_call = new Ajaxcall(temp_config_call);
    ajax_temp_call.flush();
    if (datapost != undefined)
        ajax_temp_call.addparams(datapost);
    var ret = ajax_temp_call.send();
    var editmodal = '<div id="entityEdit" data-identityEdit="' + id + '" class="dymermodal modal fade" tabindex="-1" role="dialog"  data-backdrop="static">' +
        '<div class="modal-dialog" role="document" style="    max-width: 60%;">' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        //  '<button type="button" class="close" data-dismiss="modal"  style="float: right;display: block;position: relative;"><span aria-hidden="true">&times;</span></button>' +
        '<button type="button" class="close closeform" onclick="closeDymerModal(\'entityEdit\')"  style="float: right;display: block;position: relative;"><span aria-hidden="true">&times;</span></button>' +
        '<h4 class="modal-title" style="float: left;position: absolute;    margin-top: 0;">Edit</h4>' +
        '</div>' +
        '<div class="modal-body">' +
        '<div class="contbody">' +
        '<div class="alert alert-info  "> No Model available  </div>' +
        '</div>' +
        '</div>' +
        '<div class="modal-footer">' +
        //'<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
        //'<button type="button" class="btn btn-default" onclick="resetContainer(\'#entityEdit form\')">Reset</button>' +
        '<button type="button" class="btn btn-default closeform" onclick="closeDymerModal(\'entityEdit\')">Close</button>' +
        '<button type="button" class="btn btn-primary onputform" onclick="actionPutMultipartForm(\'entity\',undefined,undefined, \'#entityEdit form\',undefined,undefined,true)">Save changes</button>' +
        //'<button type="button" class="btn btn-primary onputform" onclick="actionPutMultipartForm(\'entity\',undefined,undefined, undefined,undefined,undefined,true)">Save changes</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>';
    if ($('#entityAdd').length == 0)
        $('#entityAdd').remove();
    if ($('#entityEdit').length)
        $('#entityEdit').attr('data-identityEdit', id);
    else
        $('body').append(editmodal);
    const grtHtml = grantHtml(perm);
    if (ret.success) {
        dymphases.setSubPhase("edit", true, "preloadform");

        dymodalmode = "edit";
        if (!ret.data.length) {
            $('#entityEdit').modal({
                show: true,
                keyboard: false,
                backdrop: 'static'
            });
            $('#entityEdit .onputform').hide();
        } else {
            dymphases.setModal("edit", true);
            $('#entityEdit .onputform').show();
            $('#entityEdit').on('hidden.bs.modal', function() {
                removeTempImport("tftemp");
                $('#entityEdit').unbind('hidden.bs.modal');
            });
            (ret.data).forEach(async function(item, i) {
                listLoadedAdm[item._id] = {
                    tftemp: []
                };
                var model_form = "";
                (item.files).forEach(function(fl, i) {
                    if (fl.contentType == "text/html") {
                        model_form = fl.data;
                        // dom_to_render = (fl.mimetype == "text/html") ? fl.path : dom_to_render;
                    } else {
                        var splmime = (fl.contentType).split("/");
                        var ftype = splmime[1];
                        var lkpath = indport + "content/" + itemToEdit._index + "/" + fl._id;
                        ftype = (ftype == "css") ? "link" : ftype;
                        if (ftype != "octet-stream")
                            listLoadedAdm[item._id].tftemp.push({ domtype: ftype, filename: lkpath, extrattr: [{ key: 'tftemp', value: "rt" }] });
                    }
                });
                dymphases.setSubPhase("edit", true, "loadedform");
                $('#entityEdit .modal-body .contbody').html(model_form); //.find('form').append('<input name="data[idedit]" type="hidden" value="' + id + '">');
                $(grtHtml).insertBefore($('#entityEdit .modal-body .contbody .alert.alertaction'));
                $('#entityEdit').modal({
                    show: true,
                    keyboard: false,
                    backdrop: 'static'
                });
                $('#entityEdit .modal-body').showLoader();
                // setTimeout(function() {

                dymphases.setSubPhase("edit", true, "loadattachment");
                await ldFormFiles2(item._id);
                //    console.log("dopo aver caricati tutti i files");
                // hookReleationForm(itemToEdit);
                //NOduplicateRepeatable('#entityEdit', itemToEdit);
                // }, 2000);

                dymphases.setSubPhase("edit", true, "loadhookrelation");
                await hookReleationForm_Promise(itemToEdit);
                dymphases.setSubPhase("edit", true, "loadhooktaxonomy");
                await hookTaxonomy_Promise(itemToEdit);
                dymphases.setSubPhase("edit", true, "duplicaterepeatable");
                await duplicateRepeatable_Promise('#entityEdit', itemToEdit); //.then(function() { console.log("duplicated"); });
                // setTimeout(function() {
                //  hookReleationForm(itemToEdit);
                // duplicateRepeatable('#entityEdit', itemToEdit);
                // }, 10000);
                // console.log("primo");

                dymphases.setSubPhase("edit", true, "prepopulateform");
                let resprepopulate_ = await prePopulateFormEdit_Promise(itemToEdit);

              //console.log("resprepopulate",resprepopulate_);
                //console.log("resprepopulate", resprepopulate);let filterpos = ($(this).data('filterpos') == undefined) ? 0 : $(this).data('filterpos');
                var itemToEdit_ = Object.assign({}, itemToEdit);
                /*  setTimeout(function() {
                      $('#entityEdit .selectpicker').selectpicker();
                      console.log("vado a modificare");
                      populateFormEdit('#entityEdit', itemToEdit, undefined, undefined, itemToEdit_);

                      $('#entityEdit .modal-body').hideLoader();


                  }, 2000);*/

                $('#entityEdit .selectpicker').selectpicker();
                // console.log("vado a modificare");
                //  populateFormEdit('#entityEdit', itemToEdit, undefined, undefined, itemToEdit_);
                dymphases.setSubPhase("edit", true, "populateform");
                //console.log('#entityEdit', itemToEdit, undefined, undefined, itemToEdit_);
                await populateFormEdit_await('#entityEdit', itemToEdit, undefined, undefined, itemToEdit_);
                $('#entityEdit .modal-body').hideLoader();
                //console.log("fnito!!!");
                dymphases.setSubPhase("edit", true, "dympostpopulated");
                await postPopulatedFormEdit_Promise(itemToEdit);
                dymphases.setSubPhase("edit", true, "editForm");

                /*  setTimeout(function() {
                      $('#entityEdit').trackChanges();
                  }, 7000);*/
            });
        }
    }
}

function closeDymerModal(id,r) {
    //   if ($('#' + id).trackisChanged()) {
    var r = (r==undefined)?confirm("Without saving the changes will be lost"):r;
    if (r == true) {
        $('#' + id).modal('hide');
        let typephase = dymphases.getType();
        dymphases.disablePhase(typephase);
        dymphases.setModal(typephase, false);
        $('#entityEdit .modal-body .contbody').empty();
        $('#entityAdd .modal-body').empty();
        dymodalmode = "";

        dymphases.setType('view');

    }
    //  } else {
    //      $('#' + id).modal('hide');
    //  }
}

function deleteEntity(id, indexentity) {
    var itemToEdit = actualItem;
    var nameEntity = "";
    if (itemToEdit != undefined)
        itemToEdit.title;
    if (actualTemplateType == "teaserlist") {
        if (kmsdataset != undefined)
            (kmsdataset).forEach(function(el, i) {
                if (el._id == id) {
                    nameEntity = el.title;
                }
            });
    }
    var editmodal = '<div id="deleteEdit" data-identityDelete="' + id + '" data-indexentityDelete="' + indexentity + '" class="dymermodal modal fade" tabindex="-1" role="dialog"  data-backdrop="static">' +
        '<div class="modal-dialog" role="document" style="    max-width: 60%;">' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal"  style="float: right;display: block;position: relative;"><span aria-hidden="true">&times;</span></button>' +
        '<h4 class="modal-title" style="float: left;position: absolute;    margin-top: 0;">Delete</h4>' +
        '</div>' +
        '<div class="modal-body">' +
        '<p>Click on confirm to delete <b id="nameEntity"></b> </p>' +
        '<div class="alert alertaction" role="alert" style="display: none;">' +
        '<button type="button" class="close" onclick="$(this).closest(\'.alert\').slideUp()">' +
        '            <span aria-hidden="true">×</span>      </button>' +
        '<div class="msg_title"></div>' +
        '<div class="msg_txt"></div>' +
        '</div>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
        '<button type="button" class="btn btn-primary" onclick="actionDeleteMultipartForm(\'entity\',undefined,undefined, undefined,undefined,undefined,true)">Confirm</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>';
    if ($('#deleteEdit').length)
        $('#deleteEdit').attr('data-identityDelete', id);
    else
        $('body').append(editmodal);
    dymphases.setModal("delete", true);
    $('#deleteEdit .alertaction').hide();
    $('#deleteEdit .modal-body #nameEntity').text(nameEntity);
    $('#deleteEdit').modal('show');
}

function duplicateRepeatable(frm, item, basename) {
    var listRelation = {};
    var value = item.relations;
    if (value != undefined) {
        for (var i = 0; i < value.length; i++) {
            if (listRelation[value[i]._type] == undefined)
                listRelation[value[i]._type] = [];
            listRelation[value[i]._type].push(value[i]._id);
        }
        $(frm + ' .repeatable [data-torelation]').each(function(index) {
            var rel_type = $(this).attr('data-torelation');
            if (listRelation[rel_type] != undefined) {
                var currenteDomElement = $(this).closest('.relationcontgrp.repeatable');
                for (var i = 1; i < listRelation[rel_type].length; i++) {
                    if (i == 1)
                        currenteDomElement.find('[onclick^="cloneRepeatable"]').trigger('click');
                    else {
                        currenteDomElement = currenteDomElement.next();
                        currenteDomElement.find('[onclick^="cloneRepeatable"]').trigger('click');
                    }
                }
            }
        });
    }
    $(frm + ' .repeatable').each(function(index) {
        var name = ($(this).find('[name^="data"]').prop("name"));
        if (name == undefined)
            return true;
        var rename = replaceAll(name, '[', '@@');
        rename = replaceAll(rename, ']', '');
        var splt = rename.split("@@");
        splt.shift();
        var baseSearchRp = item;
        for (var i = 0; i < splt.length; i++) {
            var el = splt[i];
            var el_nex = splt[i + 1];
            if (!isNaN(parseInt(el, 10))) {
                i = splt.length;
                var currenteDomElement = $(this).closest('.repeatable');
                if (currenteDomElement != undefined && baseSearchRp != undefined)
                    for (var j = 1; j < baseSearchRp.length; j++) {
                        if (j == 1)
                            currenteDomElement.find('[onclick^="cloneRepeatable"]').trigger('click');
                        else {
                            currenteDomElement = currenteDomElement.next();
                            currenteDomElement.find('[onclick^="cloneRepeatable"]').trigger('click');
                        }
                    }
            } else {
                var tel = baseSearchRp;
                if (el === "relation") {
                    el === "relations";
                    i++;
                }
                baseSearchRp = tel[el];
            }
        }
    });
}

const duplicateRepeatable_Promise = function(frm, item, basename) {
    return new Promise(function(resolve, reject) {
        var listRelation = {};
        var value = item.relations;
        if (value != undefined) {
            for (var i = 0; i < value.length; i++) {
                if (listRelation[value[i]._type] == undefined)
                    listRelation[value[i]._type] = [];
                listRelation[value[i]._type].push(value[i]._id);
            }
            $(frm + ' .repeatable [data-torelation]').each(function(index) {
                var rel_type = $(this).attr('data-torelation');
                if (listRelation[rel_type] != undefined) {
                    var currenteDomElement = $(this).closest('.relationcontgrp.repeatable');
                    for (var i = 1; i < listRelation[rel_type].length; i++) {
                        if (i == 1)
                            currenteDomElement.find('[onclick^="cloneRepeatable"]').trigger('click');
                        else {
                            currenteDomElement = currenteDomElement.next();
                            currenteDomElement.find('[onclick^="cloneRepeatable"]').trigger('click');
                        }
                    }
                }
            });
        }
        $(frm + ' .repeatable').each(function(index) {
            var name = ($(this).find('[name^="data"]').prop("name"));
            if (name == undefined)
                return true;
            var rename = replaceAll(name, '[', '@@');
            rename = replaceAll(rename, ']', '');
            var splt = rename.split("@@");
            splt.shift();
            var baseSearchRp = item;
            for (var i = 0; i < splt.length; i++) {
                var el = splt[i];
                var el_nex = splt[i + 1];
                if (!isNaN(parseInt(el, 10))) {
                    i = splt.length;
                    var currenteDomElement = $(this).closest('.repeatable');
                    if (currenteDomElement != undefined && baseSearchRp != undefined)
                        for (var j = 1; j < baseSearchRp.length; j++) {
                            if (j == 1)
                                currenteDomElement.find('[onclick^="cloneRepeatable"]').trigger('click');
                            else {
                                currenteDomElement = currenteDomElement.next();
                                currenteDomElement.find('[onclick^="cloneRepeatable"]').trigger('click');
                            }
                        }
                } else {
                    var tel = baseSearchRp;
                    if (el === "relation") {
                        el === "relations";
                        i++;
                    }
                    if (tel.hasOwnProperty(el))
                        baseSearchRp = tel[el];
                }
            }
        });
        resolve();
        return true;
    });
}

function bindSummernote() {
    // newGroup.find('[name="' + newName + '"]').summernote();
}

function createpathFile(eid, fid) {
    var ret = (kmsconfig.cdn).replace('public/cdn/', "") + "api/entities/api/v1/entity/contentfile/" + eid + "/" + fid;
    var tk = localStorage.getItem('DYMAT');
    if (tk != null)
        return ret += "?tkdymat=" + tk;
    tk = localStorage.getItem('DYM');
    if (tk != null)
        return ret += "?tkdym=" + tk;
}

function populateFormEdit(frm, item, basename, wasarr, origitem) {
    try {
        //  if (item != null)
        for (var [key, value] of Object.entries(item)) {
            var tmp = $(frm + ' [name^="data' + basename + '[' + key + ']' + '"]');
            var extrelPop = "";
            var actualK = "";
            if (basename == undefined) {
                actualK = '[' + key + ']';
            } else {
                if (wasarr && $(frm + ' [name^="data' + basename + '[' + key + ']' + '"]').prop("tagName") == "checkbox") {
                    actualK = basename + '[]';
                    // populateMatchByValue();
                    //  continue;
                    if ($(frm + ' [name^="data' + actualK + '"]').length) {
                        if ($(frm + ' [name^="data' + actualK + '"]').attr("type") == "checkbox")
                            extrelPop = '[value="' + value + '"]';
                    }
                } else
                    actualK = basename + '[' + key + ']';
            }
            var elPop = $(frm + ' [name="data' + actualK + '"]' + extrelPop);
            //   console.log("sele", key, value);
            //   console.log("elPop", elPop);
            //   console.log("elPop.hasClass('selectpicker')", elPop.hasClass('selectpicker'));
            if (key == 'relations') {
                let listRelation = {};
                for (var i = 0; i < value.length; i++) {
                    if (listRelation[value[i]._type] == undefined)
                        listRelation[value[i]._type] = [];
                    listRelation[value[i]._type].push(value[i]._id);
                }
                /*  Object.keys(listRelation).forEach(function(k) {
                      var r_list = listRelation[k];
                      for (var i = 0; i < r_list.length; i++) {
                          var vs = ' [name="data[relation][' + k + '][' + i + '][to]"]';
                          $(frm + vs).val(r_list[i]).attr("oldval", r_list[i]);
                      }
                  });*/
                Object.keys(listRelation).forEach(function(k) {
                    var r_list = listRelation[k];
                    let vs = '[name="data[relation][' + k + '][0][to]"]';
                    var relElement = $(vs);
                    if (relElement.hasClass('selectpicker')) {

                        // $(frm + " " + vs).val(r_list);
                        $(frm + " " + vs).selectpicker('val', r_list);
                    } else {
                        for (var i = 0; i < r_list.length; i++) {
                            vs = ' [name="data[relation][' + k + '][' + i + '][to]"]';
                            $(frm + vs).val(r_list[i]).attr("oldval", r_list[i]);
                        }
                    }
                });
                // elPop.val(value);
                continue;
            }
            if (typeof value === 'object') {
                if (Array.isArray(value)) {
                    if (value.length > 0) {
                        if (elPop.hasClass('summernote')) {
                            if (typeof elPop.summernote === 'function')
                                elPop.summernote({ dialogsInBody: true });

                        } else if (elPop.hasClass('selectpicker')) {

                            elPop.selectpicker('val', value);
                        } else {
                            var isarr = true;
                            populateFormEdit(frm, value, actualK, isarr, origitem);
                        }

                    }
                } else {
                    if (elPop.length) {
                        if ((elPop).is("input")) {
                            if ((elPop).attr("type") === 'file') {
                                var previewFile = "";
                                var baseurlcd = (kmsconfig.cdn).replace('public/cdn/', "");
                                var indport = baseurlcd + "api/entities/api/v1/entity/content/";
                                var elName = elPop.attr("name");
                                var btnDeleteFile = '<i class="fa fa-trash btn  btn-outline-danger  btn-sm  deleteItemSub" style="float: right;" aria-hidden="true" onclick="appendTodeleteId(\'' + value.id + '\',\'' + $(elPop).attr("name") + '\')"></i>';
                                var filepathauth = createpathFile(origitem._id, value.id);
                                if ((/\.(gif|jpg|jpeg|tiff|png)$/i).test(value.originalname)) {
                                    previewFile = '<img src="' + filepathauth + '"  class="img-thumbnail" style="max-width:150px;max-heigth:150px"  > ';
                                    elPop.before('<p fileid="' + value.id + '" style="text-align:center" attachref="' + elName + '">' + previewFile + btnDeleteFile + '<br><span>' + value.originalname + '</span></p>');
                                } else {
                                    previewFile = '<a href="' + filepathauth + '"  target="_blank"> <i class="fa fa-file" aria-hidden="true"></i> ' + value.originalname + '</a> ';
                                    elPop.before('<p fileid="' + value.id + '"  attachref="' + elName + '"><span> ' + previewFile + '</span>' + btnDeleteFile + '</p>');
                                }
                                elPop.attr('onchange', 'appendTodeleteId("' + value.id + '","' + $(elPop).attr("name") + '")');
                                var to_append = '<div style="display:none"  id="contattach_' + elName + '"> ';
                                Object.keys(value).forEach(function(valueObjkey) {
                                    var attrOblName = elName + '[' + valueObjkey + ']';
                                    to_append += '<input type="hidden"  name="' + attrOblName + '" value="' + value[valueObjkey] + '">';
                                });
                                to_append += ' </div>';
                                elPop.after(to_append);
                            } else {
                                console.log("non e file ");
                                if ((elPop).attr("type") == "checkbox") {
                                    if (value != null && value != "" && value != undefined)
                                        (elPop).prop('checked', true);
                                } else {
                                    console.log('(elPop)', (elPop).is("select"));
                                    elPop.val(value);
                                }
                            }
                        } else if ((elPop).is("select")) {
                            console.log("is select");
                            elPop.val(value).change();
                        }
                    } else {
                        populateFormEdit(frm, value, actualK, undefined, origitem);
                    }
                    // populateFormEdit(frm, value, actualK);
                }
            } else {
                if ((elPop).attr("type") == "checkbox") {
                    (elPop).prop('checked', true);
                } else if ((elPop).prop('nodeName') == "SELECT") {
                    elPop.val(value).trigger('change');
                } else {
                    elPop.val(value);
                    if (elPop.hasClass('summernote')) {
                        if (typeof elPop.summernote === 'function')
                            elPop.summernote({ dialogsInBody: true });
                    }
                }
            }
        }
    } catch (error) {
        console.error(error);
    }
}
async function populateFormEdit_await(frm, item, basename, wasarr, origitem) {
    try {
        //console.log('item++', frm, item, basename, wasarr);
        if (item != null)
            for await (var [key, value] of Object.entries(item)) {
                //console.log("basename  ", basename);
                var tmp = $(frm + ' [name^="data' + basename + '[' + key + ']' + '"]');
                var extrelPop = "";
                var actualK = "";
                if (basename == undefined) {
                    actualK = '[' + key + ']';
                } else {
                    if (wasarr && $(frm + ' [name^="data' + basename + '[' + key + ']' + '"]').prop("tagName") == "checkbox") {
                        actualK = basename + '[]';
                        // populateMatchByValue();
                        //  continue;
                        if ($(frm + ' [name^="data' + actualK + '"]').length) {
                            if ($(frm + ' [name^="data' + actualK + '"]').attr("type") == "checkbox")
                                extrelPop = '[value="' + value + '"]';
                        }
                    } else
                        actualK = basename + '[' + key + ']';
                }
                var elPop = $(frm + ' [name="data' + actualK + '"]' + extrelPop);
                //   console.log("sele", key, value);
                //   console.log("elPop", elPop);
                //   console.log("elPop.hasClass('selectpicker')", elPop.hasClass('selectpicker'));
                if (key == 'relations') {
                    let listRelation = {};
                    for (var i = 0; i < value.length; i++) {
                        if (listRelation[value[i]._type] == undefined)
                            listRelation[value[i]._type] = [];
                        listRelation[value[i]._type].push(value[i]._id);
                    }
                    /*  Object.keys(listRelation).forEach(function(k) {
                          var r_list = listRelation[k];
                          for (var i = 0; i < r_list.length; i++) {
                              var vs = ' [name="data[relation][' + k + '][' + i + '][to]"]';
                              $(frm + vs).val(r_list[i]).attr("oldval", r_list[i]);
                          }
                      });*/
                    Object.keys(listRelation).forEach(function(k) {
                        var r_list = listRelation[k];
                        let vs = '[name="data[relation][' + k + '][0][to]"]';
                        var relElement = $(vs);
                        if (relElement.hasClass('selectpicker')) {

                            // $(frm + " " + vs).val(r_list);
                            $(frm + " " + vs).selectpicker('val', r_list);
                        } else {
                            for (var i = 0; i < r_list.length; i++) {
                                vs = ' [name="data[relation][' + k + '][' + i + '][to]"]';
                                $(frm + vs).val(r_list[i]).attr("oldval", r_list[i]);
                            }
                        }
                    });
                    // elPop.val(value);
                    continue;
                }
                if (typeof value === 'object') {
                    if (Array.isArray(value)) {
                        if (value.length > 0) {
                            if (elPop.hasClass('summernote')) {
                                if (typeof elPop.summernote === 'function')
                                    elPop.summernote({ dialogsInBody: true });

                            } else if (elPop.hasClass('selectpicker')) {

                                elPop.selectpicker('val', value);
                            } else {
                                var isarr = true;
                                await populateFormEdit_await(frm, value, actualK, isarr, origitem);
                            }

                        }
                    } else {
                        if (elPop.length) {
                            if ((elPop).is("input")) {
                                if ((elPop).attr("type") === 'file') {
                                    var previewFile = "";
                                    var baseurlcd = (kmsconfig.cdn).replace('public/cdn/', "");
                                    var indport = baseurlcd + "api/entities/api/v1/entity/content/";
                                    var elName = elPop.attr("name");
                                    var btnDeleteFile = '<i class="fa fa-trash btn  btn-outline-danger  btn-sm  deleteItemSub" style="float: right;" aria-hidden="true" onclick="appendTodeleteId(\'' + value.id + '\',\'' + $(elPop).attr("name") + '\')"></i>';
                                    var filepathauth = createpathFile(origitem._id, value.id);
                                    if ((/\.(gif|jpg|jpeg|tiff|png)$/i).test(value.originalname)) {
                                        previewFile = '<img src="' + filepathauth + '"  class="img-thumbnail" style="max-width:150px;max-heigth:150px"  > ';
                                        elPop.before('<p fileid="' + value.id + '" style="text-align:center" attachref="' + elName + '">' + previewFile + btnDeleteFile + '<br><span>' + value.originalname + '</span></p>');
                                    } else {
                                        previewFile = '<a href="' + filepathauth + '"  target="_blank"> <i class="fa fa-file" aria-hidden="true"></i> ' + value.originalname + '</a> ';
                                        elPop.before('<p fileid="' + value.id + '"  attachref="' + elName + '"><span> ' + previewFile + '</span>' + btnDeleteFile + '</p>');
                                    }
                                    elPop.attr('onchange', 'appendTodeleteId("' + value.id + '","' + $(elPop).attr("name") + '")');
                                    var to_append = '<div style="display:none"  id="contattach_' + elName + '"> ';
                                    Object.keys(value).forEach(function(valueObjkey) {
                                        var attrOblName = elName + '[' + valueObjkey + ']';
                                        to_append += '<input type="hidden"  name="' + attrOblName + '" value="' + value[valueObjkey] + '">';
                                    });
                                    to_append += ' </div>';
                                    elPop.after(to_append);
                                } else {
                                    console.log("non e file ");
                                    if ((elPop).attr("type") == "checkbox") {
                                        if (value != null && value != "" && value != undefined)
                                            (elPop).prop('checked', true);
                                    } else {
                                        console.log('(elPop)', (elPop).is("select"));
                                        elPop.val(value);
                                    }
                                }
                            } else if ((elPop).is("select")) {
                                console.log("is select");
                                elPop.val(value).change();
                            }
                        } else {
                            await populateFormEdit_await(frm, value, actualK, undefined, origitem);
                        }
                        // populateFormEdit(frm, value, actualK);
                    }
                } else {
                    if ((elPop).attr("type") == "checkbox") {
                        (elPop).prop('checked', true);
                    } else if ((elPop).prop('nodeName') == "SELECT") {
                        elPop.val(value).trigger('change');
                    } else {
                        elPop.val(value);
                        if (elPop.hasClass('summernote')) {
                            if (typeof elPop.summernote === 'function')
                                elPop.summernote({ dialogsInBody: true });
                        }
                    }
                }
            }
            //console.log("attessssssooooo ultimo");
    } catch (error) {
        console.error(error);
    }
}
const populateFormEdit_Promise = function(frm, item, basename, wasarr) {
    return new Promise(async function(resolve, reject) {
        try {
            for (var [key, value] of Object.entries(item)) {
                var tmp = $(frm + ' [name^="data' + basename + '[' + key + ']' + '"]');
                var extrelPop = "";
                var actualK = "";
                if (basename == undefined) {
                    actualK = '[' + key + ']';
                } else {
                    if (wasarr && $(frm + ' [name^="data' + basename + '[' + key + ']' + '"]').prop("tagName") == "checkbox") {
                        actualK = basename + '[]';
                        if ($(frm + ' [name^="data' + actualK + '"]').length) {
                            if ($(frm + ' [name^="data' + actualK + '"]').attr("type") == "checkbox")
                                extrelPop = '[value="' + value + '"]';
                        }
                    } else
                        actualK = basename + '[' + key + ']';
                }
                var elPop = $(frm + ' [name="data' + actualK + '"]' + extrelPop);
                if (key == 'relations') {
                    var listRelation = {};
                    for (var i = 0; i < value.length; i++) {
                        if (listRelation[value[i]._type] == undefined)
                            listRelation[value[i]._type] = [];
                        listRelation[value[i]._type].push(value[i]._id);
                    }
                    Object.keys(listRelation).forEach(function(k) {
                        var r_list = listRelation[k];
                        for (var i = 0; i < r_list.length; i++) {
                            var vs = ' [name="data[relation][' + k + '][' + i + '][to]"]';
                            $(frm + vs).val(r_list[i]).attr("oldval", r_list[i]);
                        }
                    });
                    continue;
                }
                if (typeof value === 'object') {
                    if (Array.isArray(value)) {
                        if (value.length > 0) {
                            var isarr = true;
                            return await populateFormEdit_Promise(frm, value, actualK, isarr);
                        }
                    } else {
                        if (elPop.length) {
                            if ((elPop).is("input")) {
                                if ((elPop).attr("type") === 'file') {
                                    var previewFile = "";
                                    var baseurlcd = (kmsconfig.cdn).replace('public/cdn/', "");
                                    var indport = baseurlcd + "api/entities/api/v1/entity/content/";
                                    var elName = elPop.attr("name");
                                    var btnDeleteFile = '<i class="fa fa-trash btn  btn-outline-danger  btn-sm  deleteItemSub" style="float: right;" aria-hidden="true" onclick="appendTodeleteId(\'' + value.id + '\',\'' + $(elPop).attr("name") + '\')"></i>';
                                    //      console.log("settofile ", value);
                                    if ((/\.(gif|jpg|jpeg|tiff|png)$/i).test(value.originalname)) {
                                        previewFile = '<img src="' + indport + value.id + '"  class="img-thumbnail" style="max-width:150px;max-heigth:150px"  > ';
                                        elPop.before('<p fileid="' + value.id + '" style="text-align:center" attachref="' + elName + '">' + previewFile + btnDeleteFile + '<br><span>' + value.originalname + '</span></p>');
                                    } else {
                                        previewFile = '<a href="' + indport + value.id + '"  target="_blank"> <i class="fa fa-file" aria-hidden="true"></i> ' + value.originalname + '</a> ';
                                        elPop.before('<p fileid="' + value.id + '"  attachref="' + elName + '"><span> ' + previewFile + '</span>' + btnDeleteFile + '</p>');
                                    }
                                    elPop.attr('onchange', 'appendTodeleteId("' + value.id + '","' + $(elPop).attr("name") + '")');
                                    var to_append = '<div style="display:none"  id="contattach_' + elName + '"> ';
                                    Object.keys(value).forEach(function(valueObjkey) {
                                        var attrOblName = elName + '[' + valueObjkey + ']';
                                        to_append += '<input type="hidden"  name="' + attrOblName + '" value="' + value[valueObjkey] + '">';
                                    });
                                    to_append += ' </div>';
                                    elPop.after(to_append);
                                } else {
                                    console.log("non e file ");
                                    if ((elPop).attr("type") == "checkbox") {
                                        if (value != null && value != "" && value != undefined)
                                            (elPop).prop('checked', true);
                                    } else
                                        elPop.val(value);
                                }
                            }
                        } else {
                            return await populateFormEdit_Promise(frm, value, actualK);
                        }
                    }
                } else {
                    if ((elPop).attr("type") == "checkbox") {
                        (elPop).prop('checked', true);
                    } else {
                        elPop.val(value);
                        if (elPop.hasClass('summernote')) {
                            if (typeof elPop.summernote === 'function')
                                elPop.summernote({ dialogsInBody: true });
                        }
                    }
                }
            }
            resolve()
        } catch (error) {
            console.error(error);
        }
    });
}

function appendTodeleteId(fid, oid) {
    if (fid == 'undefined' || fid == undefined)
        return;
    document.getElementById("contattach_" + oid).remove();
    $('[fileid="' + fid + '"]').remove();
    $('<input name="data[todelete][]" type="hidden" value="' + fid + '">').insertAfter('#entityEdit [name="instance[index]"]');
    $('<input name="data[todeleteObj][]" type="hidden" value="' + oid + '">').insertAfter('#entityEdit [name="instance[index]"]');
}

function getPagePath() {
    return window.location.protocol + "/" + window.location.host + "/" + window.location.pathname
}

function getPageJsonPath() {
    return { 'protocol': window.location.protocol, 'host': window.location.host, 'pathname': window.location.pathname }
}

function getAllUrlParams(url) {
    // get query string from url (optional) or window
    var queryString = url ? url.split('?')[1] : window.location.search.slice(1);
    // we'll store the parameters here
    var obj = {};
    // if query string exists
    if (queryString) {
        // stuff after # is not part of query string, so get rid of it
        queryString = queryString.split('#')[0];
        // split our query string into its component parts
        var arr = queryString.split('&');
        for (var i = 0; i < arr.length; i++) {
            // separate the keys and the values
            var a = arr[i].split('=');
            // set parameter name and value (use 'true' if empty)
            var paramName = a[0];
            var paramValue = typeof(a[1]) === 'undefined' ? true : a[1];
            // (optional) keep case consistent
            //   paramName = paramName.toLowerCase();
            //      if (typeof paramValue === 'string') paramValue = paramValue.toLowerCase();
            // if the paramName ends with square brackets, e.g. colors[] or colors[2]
            if (paramName.match(/\[(\d+)?\]$/)) {
                // create key if it doesn't exist
                var key = paramName.replace(/\[(\d+)?\]/, '');
                if (!obj[key]) obj[key] = [];
                // if it's an indexed array e.g. colors[2]
                if (paramName.match(/\[\d+\]$/)) {
                    // get the index value and add the entry at the appropriate position
                    var index = /\[(\d+)\]/.exec(paramName)[1];
                    obj[key][index] = paramValue;
                } else {
                    // otherwise add the value to the end of the array
                    obj[key].push(paramValue);
                }
            } else {
                // we're dealing with a string
                if (!obj[paramName]) {
                    // if it doesn't exist, create property
                    obj[paramName] = paramValue;
                } else if (obj[paramName] && typeof obj[paramName] === 'string') {
                    // if property does exist and it's a string, convert it to an array
                    obj[paramName] = [obj[paramName]];
                    obj[paramName].push(paramValue);
                } else {
                    // otherwise add the property
                    obj[paramName].push(paramValue);
                }
            }
        }
    }
    return obj;
}

function drawEntityByIdUrl(target, paramid) {
    var obj = getAllUrlParams();
    var elId = obj[paramid];
    var jsonConfigById = {
        query: {
            "query": {
                "query": {
                    "match": {
                        "_id": elId
                    }
                }
            }
        },
        endpoint: 'entity.search',
        viewtype: 'fullcontent',
        target: {
            fullcontent: {
                id: target,
                action: "html",
                reload: false
            }
        }
    }
    drawEntities(jsonConfigById);
}

function kmsrenderdetail(_id) {
    if (retriveIfIsType('map') || retriveIfIsType('dt')) {
        hideDatasetContainer();
    }
    actualTemplateType = "reset";
    removeTempImport('tftemp');
    var arObj = new Array();
    //console.log("kmsrenderdetail pre", arObj, templateslist);
    (kmsdataset).forEach(function(item, i) {
        if (item._id == _id) {
            arObj.push(item);
            /*	obj = item;
                tmpl = item._index + "@" + item._type;
                mytemplate = templateslist[tmpl]['viewtype'][typetemplateToRender];*/
        }
    });
    if (arObj.length == 0) {
        var query = {
            "query": {
                "query": {
                    "match": {
                        "_id": _id
                    }
                }
            }
        };
        var arObj = actionPostMultipartForm(kmsconf.endpoint, undefined, query, undefined, undefined, undefined, false);
        // console.log('new', arObj.data[0]);
        var templ_data = flatEsArray(arObj.data);
        arObj = templ_data.arr;
        manageTamplateList(templ_data.templates);
        kmsrenderEl(arObj, 'fullcontent');
    } else {
        kmsrenderEl(arObj, 'fullcontent');
    }
}

function checkbreadcrumb(arObj, fnct, linklabel) {
    var elementExists = document.getElementById("dymer_breadcrumb");
    if (elementExists == null)
        return;
    /*if (arObj == 'undefined' || fnct == undefined || arObj == undefined)
        return;*/
    var dbrdid = '';
    var dbrdtitle = '';
    var dbrdclick = '';
    var bdrHtml = '';
    if (arObj == null) {
        //    console.log('elcl', fnct.attr('onclick'));
        if (linklabel != undefined) {
            dbrdid = 'nestedBrd';
            dbrdclick = fnct;
            dbrdtitle = linklabel;
            bdrHtml = linklabel;
        } else {
            if (fnct != undefined) {
                dbrdid = 'dbrdidlist';
                dbrdclick = fnct.attr('onclick');
                dbrdtitle = '';
                bdrHtml = '<i class="fa fa-list" aria-hidden="true"></i>';
            } else {
                return;
            }

        }

    } else {
        dbrdid = arObj._id;
        dbrdclick = 'kmsrenderdetail(\'' + arObj._id + '\')';
        dbrdtitle = arObj.title;
        bdrHtml = arObj.title;
    }
    var elBreadcrumb = '';
    elBreadcrumb = '<span data-dbrdid="' + dbrdid + '" class="dbreadcrumb" onclick="' + dbrdclick + '" title="' + dbrdtitle + '">' +
        bdrHtml + ' </span>';
    if (dbrdid == 'dbrdidlist') {
        $('#dymer_breadcrumb').empty();
    }
    if (!$('.dbreadcrumb[data-dbrdid="' + dbrdid + '"]').length) {
        $('#dymer_breadcrumb').append(elBreadcrumb);
    } else {

        $('.dbreadcrumb[data-dbrdid="' + dbrdid + '"]').nextAll().remove()
    }
    if ($('#dymer_breadcrumb span').length > 1)
        $('#dymer_breadcrumb span').show();
    else
        $('#dymer_breadcrumb span').hide();
}
//-----------------END ENTITY--------------

//-----------------START GLOBAL------------
/*
actionPostMultipartForm:POST di multipart/form-data
    - type: stringa | required | servizio da interrogare(getendpoint(type))
    - el: $(this),undefined | opzionale se aggiunto senderForm | per serializzare l'elemento dom aventente classe .senderForm
    - datapost: JsonObject | opzionale | ulteriari parametri da aggiungere alla chiamata
    - senderForm: array,undefined | opzionale | array di ID di contenitori da serializzare
    - callback: stringa,undefined | opzionale | funzione da invocare dopo la chiamata ajax
    - callerForm: stringa,undefined | opzionale | id dom iniziale per tenere traccia del padre
    - useGritter: true/false,undefined | opzionale | consente di vializzare messaggio di ritorno dei servizi all'interno del dom chiamante
*/
function actionPostMultipartForm(type, el, datapost, senderForm, callback, callerForm, useGritter, callbackEstraData) {
    var typeEnt = type.split("/");
    var posturl = getendpointnested(typeEnt[0], 'post');
    if (typeEnt.length > 1)
        posturl += "/" + typeEnt[1];
    var temp_config_call = {
        url: posturl,
        processData: false,
        enctype: "multipart/form-data; boundary=----------------------------4ebf00fbcf09",
        contentType: false,
        cache: false
    };
    var ajax_temp_call = new Ajaxcall(temp_config_call);
    ajax_temp_call.flush();
    var complete = true;
    if (senderForm == undefined && el != undefined) {
        senderForm = [];
        var t_id = el.closest('.senderForm').attr("id");
        if (t_id == undefined) {
            var tstamp = new Date().getTime();
            t_id = "kmstemp" + tstamp;
            el.closest('.senderForm').attr("id", t_id);
        }
        senderForm.push("#" + el.closest('.senderForm').attr("id"));
    }
    var gr_title = "";
    var gr_text = "Please fill out all required fields";
    if (senderForm != undefined) {
        //console.log("senderForm != undefined", senderForm != undefined);
        //  complete = check_required(senderForm);
        complete = check_dymer_validform(senderForm);
    }
    if (!complete) {
        if (useGritter) {
            if (senderForm != undefined) {
                useAlert(senderForm[0], gr_title, gr_text, success);
            } else {
                useGritterTool(gr_title, gr_text);
            }
        }
        return false;
    }
    if (senderForm != undefined)
        ajax_temp_call.addcontainer_ids(senderForm);
    if (datapost != undefined) {
        if (typeof datapost === 'string' || datapost instanceof String)
            datapost = JSON.parse(datapost);
        ajax_temp_call.addparams(datapost);
    }
    /* Marco to delete
    var personalData2 = { "data": getbaseEntityConfig(ajax_temp_call.getparams()) };
    var personalData3 = { "authdata": getbaseEntityConfig() };
    ajax_temp_call.addparams(personalData2);
    ajax_temp_call.addparams(personalData3);*/
    var ret = ajax_temp_call.send();
    var success = ret.success;
    if (useGritter != undefined) {
        gr_title = "";
        gr_text = ret.message;
        //if (!success)
        //	gr_text += " " + ret.extraData.log;
    }
    if (success) {
        if (callerForm != undefined)
            senderForm = callerForm;
        if (callback != undefined) {
            /*MG - Creazione organizzazione in LR - Inizio*/
            //callback.call(this, type, el, datapost, senderForm, callback, callerForm, useGritter, ret, callbackEstraData);
            window[callback]((ret.data[1].title),(ret.data[0]._id));
            /*MG - Creazione organizzazione in LR - Fine*/
        } else {
            if (senderForm == undefined && el != undefined) {
                resetContainer(senderForm[0]);
            }
            if (useGritter) {
                if (senderForm != undefined) {
                    resetContainer(senderForm[0]);
                    useAlert(senderForm[0], gr_title, gr_text, success);
                    setTimeout(function() {
                        $('#entityAdd').modal('hide');
                        $('#entityEdit .modal-body .contbody').empty();
                        $('#entityAdd .modal-body').empty();
                        reloadLatestRenderedList();
                    }, 1000);
                } else {
                    useGritterTool(gr_title, gr_text);
                }
            }
            return ret;
        }
    } else {
        if (callback != undefined) {
             /*MG - Creazione organizzazione in LR - Inizio*/
            //callback.call(this, type, el, datapost, senderForm, callback, callerForm, useGritter, ret, callbackEstraData);
            window[callback]((ret.data[1].title),(ret.data[0]._id));
            /*MG - Creazione organizzazione in LR - Fine*/
        } else {
            if (useGritter) {
                if (senderForm != undefined)
                    useAlert(senderForm[0], gr_title, gr_text, success);
                else
                    useGritterTool(gr_title, gr_text, "error");
            }
        }
    }
    return ret;
}
const actionPostMultipartForm_Promise = function(type, el, datapost, senderForm, callback, callerForm, useGritter, callbackEstraData) {
    return new Promise(function(resolve, reject) {
        var posturl = getendpointnested(type, 'post');
        var temp_config_call = {
            url: posturl,
            processData: false,
            enctype: "multipart/form-data; boundary=----------------------------4ebf00fbcf09",
            contentType: false,
            cache: false
        };
        var ajax_temp_call = new Ajaxcall(temp_config_call);
        ajax_temp_call.flush();
        var complete = true;
        if (senderForm == undefined && el != undefined) {
            senderForm = [];
            var t_id = el.closest('.senderForm').attr("id");
            if (t_id == undefined) {
                var tstamp = new Date().getTime();
                t_id = "kmstemp" + tstamp;
                el.closest('.senderForm').attr("id", t_id);
            }
            senderForm.push("#" + el.closest('.senderForm').attr("id"));
        }
        var gr_title = "";
        var gr_text = "Please fill out all required fields";
        if (senderForm != undefined) {
            // console.log("senderForm != undefined", senderForm != undefined);
            // complete = check_required(senderForm);
            complete = check_dymer_validform(senderForm);

        }
        if (!complete) {
            if (useGritter) {
                if (senderForm != undefined) {
                    useAlert(senderForm[0], gr_title, gr_text, success);
                } else {
                    useGritterTool(gr_title, gr_text);
                }
            }
            return false;
        }
        if (senderForm != undefined)
            ajax_temp_call.addcontainer_ids(senderForm);
        if (datapost != undefined) {
            if (typeof datapost === 'string' || datapost instanceof String)
                datapost = JSON.parse(datapost);
            ajax_temp_call.addparams(datapost);
        }
        //Marco to delete
        /*var personalData2 = { "data": getbaseEntityConfig() };
        var personalData3 = { "authdata": getbaseEntityConfig() };
        ajax_temp_call.addparams(personalData2);
        ajax_temp_call.addparams(personalData3);*/
        var ret = ajax_temp_call.send();
        var success = ret.success;
        if (useGritter != undefined) {
            gr_title = "";
            gr_text = ret.message;
            //if (!success)
            //	gr_text += " " + ret.extraData.log;
        }
        if (success) {
            if (callerForm != undefined)
                senderForm = callerForm;
            if (callback != undefined) {
                callback.call(this, type, el, datapost, senderForm, callback, callerForm, useGritter, ret, callbackEstraData);
                resolve(ret);
            } else {
                if (senderForm == undefined && el != undefined) {
                    resetContainer(senderForm[0]);
                }
                if (useGritter) {
                    if (senderForm != undefined) {
                        resetContainer(senderForm[0]);
                        useAlert(senderForm[0], gr_title, gr_text, success);
                        setTimeout(function() {
                            $('#entityAdd').modal('hide');
                            $('#entityEdit .modal-body .contbody').empty();
                            $('#entityAdd .modal-body').empty();
                            reloadLatestRenderedList();
                        }, 1000);
                    } else {
                        useGritterTool(gr_title, gr_text);
                    }
                }
                resolve(ret);
            }
        } else {
            if (callback != undefined) {
                callback.call(this, type, el, datapost, senderForm, callback, callerForm, useGritter, ret, callbackEstraData);
            } else {
                if (useGritter) {
                    if (senderForm != undefined)
                        useAlert(senderForm[0], gr_title, gr_text, success);
                    else
                        useGritterTool(gr_title, gr_text, "error");
                }
            }
            resolve(ret);
        }
    });
}

function actionPutMultipartForm(type, el, datapost, senderForm, callback, callerForm, useGritter) {
    var posturl = getendpointnested(type + ".id", 'put');
    var elid = $("#entityEdit").attr('data-identityedit');
    posturl = posturl.replace(':id', elid);
    var temp_config_call = {
        type: "PUT",
        url: posturl,
        processData: false,
        enctype: "multipart/form-data; boundary=----------------------------4ebf00fbcf09",
        contentType: false,
        cache: false
    };
    var ajax_temp_call = new Ajaxcall(temp_config_call);
    ajax_temp_call.flush();
    var complete = true;
    if (senderForm == undefined && el != undefined) {
        senderForm = [];
        var t_id = el.closest('.senderForm').attr("id");
        if (t_id == undefined) {
            var tstamp = new Date().getTime();
            t_id = "kmstemp" + tstamp;
            el.closest('.senderForm').attr("id", t_id);
        }
        senderForm.push("#" + el.closest('.senderForm').attr("id"));
    }
    var gr_title = "";
    var gr_text = "Please fill out all required fields";
    if (senderForm != undefined) {
        // complete = check_required(senderForm);
        let idformvalidate = $(senderForm).attr("id");
        complete = check_dymer_validform([idformvalidate]);
    }

    if (!complete) {
        if (callerForm != undefined)
            $(callerForm).hideLoader();
        if (useGritter)
            useAlert(senderForm, gr_title, gr_text, success);
        return complete;
    }
    if (senderForm != undefined)
        ajax_temp_call.addcontainer_ids(senderForm);
    if (datapost != undefined)
        ajax_temp_call.addparams(datapost);
    //Marco to delete
    /*var personalauthdata = { "authdata": getbaseEntityConfig() };
    ajax_temp_call.addparams(personalauthdata);*/
    var ret = ajax_temp_call.send();
    var success = ret.success;
    if (useGritter != undefined) {
        gr_title = "";
        gr_text = ret.message;
    }
    if (success) {
        if (callerForm != undefined)
            senderForm = callerForm;
        if (callback != undefined) {
            callback.call(this, type, el, datapost, senderForm, callback, callerForm, useGritter, ret);
        } else {
            if (senderForm == undefined && el != undefined) {
                resetContainer("#entityEdit");
            }
            if (useGritter) {
                useAlert("#entityEdit", gr_title, gr_text, success);
            }
            setTimeout(function() {
                $('#entityEdit').modal('hide');
                if (actualTemplateType == "fullcontent")
                    reloadEntityEdited(actualItem);
                if (actualTemplateType == "datatable") {
                    setTimeout(function() {
                        var tmp_conf = kmsconf;
                        // resetDymerStart();
                        //  generateMapDT(tmp_conf);
                        refreshMapDT(tmp_conf);
                    }, 150);
                }
            }, 1000);
            return ret;
        }
    } else {
        if (useGritter)
            useAlert("#entityEdit", gr_title, gr_text, success);
    }
    return false;
}

function actionPatchMultipartForm(type, el, datapost, senderForm, callback, callerForm, useGritter) {
    var posturl = getendpointnested(type + ".id", 'patch');
    // var elid = $("#entityEdit").attr('data-identitypath');
    var temp_config_call = {
        type: "PATCH",
        url: posturl,
        processData: false,
        enctype: "multipart/form-data; boundary=----------------------------4ebf00fbcf09",
        contentType: false,
        cache: false
    };
    var ajax_temp_call = new Ajaxcall(temp_config_call);
    ajax_temp_call.flush();
    var complete = true;
    if (senderForm == undefined && el != undefined) {
        senderForm = [];
        var t_id = el.closest('.senderForm').attr("id");
        if (t_id == undefined) {
            var tstamp = new Date().getTime();
            t_id = "kmstemp" + tstamp;
            el.closest('.senderForm').attr("id", t_id);
        }
        senderForm.push("#" + el.closest('.senderForm').attr("id"));
    }
    var gr_title = "";
    var gr_text = "Please fill out all required fields";
    if (senderForm != undefined) {
        //  complete = check_required(senderForm);
        let idformvalidate = $(senderForm).attr("id");
        complete = check_dymer_validform([idformvalidate]);
    }

    if (!complete) {
        if (callerForm != undefined)
            $(callerForm).hideLoader();
        if (useGritter)
            useAlert(senderForm, gr_title, gr_text, success);
        return complete;
    }
    if (senderForm != undefined) {
        ajax_temp_call.addcontainer_ids(senderForm);
        var tempdata = ajax_temp_call.extractAllDataSend();
        posturl = posturl.replace(':id', tempdata['data[id]']);
        ajax_temp_call.flush_params();
        ajax_temp_call.flush_datapost();
        ajax_temp_call.seturl(posturl);
    }
    if (datapost != undefined) {
        if (datapost.data != undefined)
            if (datapost.data.id != undefined) {
                posturl = posturl.replace(':id', datapost.data.id);
                ajax_temp_call.seturl(posturl);
            }
        ajax_temp_call.addparams(datapost);
    }
    /*Marco to delete
    var personalauthdata = { "authdata": getbaseEntityConfig() };
    ajax_temp_call.addparams(personalauthdata);*/
    var ret = ajax_temp_call.send();
    var success = ret.success;
    if (useGritter != undefined) {
        gr_title = "";
        gr_text = ret.message;
    }
    if (success) {
        if (callerForm != undefined)
            senderForm = callerForm;
        if (callback != undefined) {
            callback.call(this, type, el, datapost, senderForm, callback, callerForm, useGritter, ret);
        } else {
            if (senderForm == undefined && el != undefined) {
                resetContainer(senderForm);
            }
            if (useGritter) {
                useAlert(senderForm, gr_title, gr_text, success);
            }
            setTimeout(function() {
                if (actualTemplateType == "fullcontent")
                    reloadEntityEdited(actualItem);
                if (actualTemplateType == "datatable") {
                    setTimeout(function() {
                        var tmp_conf = kmsconf;
                        // resetDymerStart();
                        //  generateMapDT(tmp_conf);
                        refreshMapDT(tmp_conf);
                    }, 150);
                }
            }, 1000);
            return ret;
        }
    } else {
        if (useGritter)
            useAlert(senderForm, gr_title, gr_text, success);
    }
    return false;
}

function showAddEntityBindReload() {
    setTimeout(function() {
        $('#entityAdd').modal({
            show: true,
            keyboard: false,
            backdrop: 'static'
        });
        var oldact = $('#entityAdd').find("[onclick^='actionPostMultipartForm']").attr('onclick');
        var actToAppend = oldact;
        $('#entityAdd').find("[onclick^='actionPostMultipartForm']").attr('onclick', actToAppend);
        if ($('#entityAdd').find(".summernote").length > 0)
            $('#entityAdd').find(".summernote").summernote({ dialogsInBody: true });
            try {
        $('.selectpicker').selectpicker();
    } catch(e) {

      }
    }, 1000);
}

function reloadLatestRenderedList() {
    setTimeout(function() {
        kmsdataset = undefined;
        if ($.isFunction(window.actionReloadOnCrud)) {
            actionReloadOnCrud();
        } else {
            if (actualTemplateType == "teaserlist" && !$('#cont-Map').length)
                drawEntities(kmsconf);
            if (actualTemplateType == "datatable" || $('#cont-Map').length)
                refreshMapDT(kmsconf);
        }
    }, 800);
}

function reloadEntityEdited(actIte) {
    var ret = actionPostMultipartForm(kmsconf.endpoint, undefined, kmsconf.query, undefined, undefined, undefined, false);
    var templ_data = flatEsArray(ret.data);
    kmsdataset = templ_data.arr;
    kmsrenderdetail(actIte._id);
}

function actionDeleteMultipartForm(type, el, datapost, senderForm, callback, callerForm, useGritter) {
    var posturl = getendpointnested(type + ".id", 'delete');
    var elid = $("#deleteEdit").attr('data-identitydelete');
    var indexentityDelete = $("#deleteEdit").attr('data-indexentityDelete');
    posturl = posturl.replace(':id', elid);
    var temp_config_call = {
        type: "DELETE",
        url: posturl,
        processData: false,
        enctype: "multipart/form-data; boundary=----------------------------4ebf00fbcf09",
        contentType: false,
        cache: false
    };
    var ajax_temp_call = new Ajaxcall(temp_config_call);
    ajax_temp_call.flush();
    var complete = true;
    var styles = {
        'text-decoration': "line-through",
        color: "#808080a6!important",
        opacity: 0.5
    };
    if (senderForm == undefined && el != undefined) {
        senderForm = [];
        var t_id = el.closest('.senderForm').attr("id");
        if (t_id == undefined) {
            var tstamp = new Date().getTime();
            t_id = "kmstemp" + tstamp;
            el.closest('.senderForm').attr("id", t_id);
        }
        senderForm.push("#" + el.closest('.senderForm').attr("id"));
    }
    var gr_title = "";
    var gr_title = "";
    var gr_text = "Please fill out all required fields";
    if (senderForm != undefined) {
        //   complete = check_required(senderForm);
        complete = check_dymer_validform(senderForm);
    }

    if (!complete) {
        if (callerForm != undefined)
            $(callerForm).hideLoader();
        if (useGritter)
            useAlert(senderForm, gr_title, gr_text, success);
        return complete;
    }
    if (senderForm != undefined)
        ajax_temp_call.addcontainer_ids(senderForm);
    if (datapost != undefined)
        ajax_temp_call.addparams(datapost);
    /*Marco to delete
    var personalauthdata = { "authdata": getbaseEntityConfig() };
    ajax_temp_call.addparams(personalauthdata);
    */
    ajax_temp_call.addparams({ 'indexentity': indexentityDelete });
    var ret = ajax_temp_call.send();
    var success = ret.success;
    if (useGritter != undefined) {
        gr_title = "";
        gr_text = ret.message;
    }
    if (success) {
        useAlert('#deleteEdit', gr_title, gr_text, success);
        $('[refEntity="' + elid + '"]').remove();
        if (kmsconf != undefined) {
            $(kmsconf.target["fullcontent"].id + " > *").css(styles);
            $(kmsconf.target["fullcontent"].id + " [data-component-entitystatus]").remove(); //.multidisable();
            $('#deleteEdit').modal('hide');
            var new_kmsdataset = [];
            (kmsdataset).forEach(function(el, i) {
                if (el._id != elid)
                    new_kmsdataset.push(el);
            });
            kmsdataset = new_kmsdataset;
        }
        if (actualTemplateType == "datatable") {
            setTimeout(function() {
                var tmp_conf = kmsconf;
                //  resetDymerStart();
                //  generateMapDT(tmp_conf);
                refreshMapDT(tmp_conf);
            }, 150);
        }
    } else {
        if (useGritter)
            useAlert('#deleteEdit', gr_title, gr_text, success);
    }
    return false;
}
//-----------------END GLOBAL--------------
function manageTamplateList(ar) {
    if (templateslist == undefined)
        templateslist = {};
    for (var k in ar) {
        if (!templateslist.hasOwnProperty(k)) {
            templateslist[k] = ar[k];
        }
    }
    for (var k in templateslist) {
        templateslist[k].loadAllTemplate();
    }
}

function flatEsArray(arr, templates) {
    if (templates == undefined)
        templates = {};
    if (arr == undefined)
        arr = [];
    for (var i = 0; i < arr.length; i++) {
        var el = arr[i];
        if (el.relations != undefined) {
            if (el.relations.length >= 1) {
                var relations = flatEsArray(el.relations, templates);
            }
        }
        var source = el._source;
        delete arr[i]._source;
        for (var key in source) {
            arr[i][key] = source[key];
        }
        if (!templates.hasOwnProperty(el._index + '@' + el._type)) {
            var temp_templ = new ElTemplate(el._index, el._type);
            templates[el._index + '@' + el._type] = temp_templ;
        }
    }
    return {
        arr,
        templates
    };
}

function getHtmlFormFile(sourceUrl, datapost) {
    var temp_config_call = {
        url: sourceUrl,
        type: 'GET',
        addDataBody: false,
        mimeType: "text/html",
        contentType: "text/html"
    };
    var ajax_temp_call = new Ajaxcall(temp_config_call);
    ajax_temp_call.flush();
    ajax_temp_call.addparams(datapost);
    var ret = ajax_temp_call.send();
    return ret;
}
let getKmsTemplateMap = function(ar, rendertype) {
    var promise = new Promise(function(resolve, reject) {
        removeTempImport("tftemp").then(function() {
            var item = ar[0];
            var tmpl = item._index + "@" + item._type;
            var mytemplate = templateslist[tmpl]["viewtype"][rendertype];
            if (mytemplate == "") {
                rendertype = "teaserlist";
                mytemplate = templateslist[tmpl]["viewtype"][rendertype];
            }
            if (mytemplate == "") {
                rendertype = "fullcontent";
                mytemplate = templateslist[tmpl]["viewtype"][rendertype];
            }
            onloadFiles(templateslist[tmpl]["files"][rendertype].slice());
            var ret = { template: mytemplate, type: rendertype }
            resolve(ret);
        });
    });
    return promise;
};

function getDymerTemplateMultiple() {
    var templ = ' <div data-component-entitystatus="" data-vvveb-disabled="" class="row">{{{EntityStatus this}}}</div>' +
        ' <div class="row  ">' +
        '   <div class="col-12">' +
        '           <div>' +
        '         <h3 class="text-info">{{title}}</h3>' +
        ' <footer class="blockquote-footer">{{_index}}</footer>' +
        '       </div>' +
        '       </div>' +
        '   <div class="col-12" style="margin-top:5px">' +
        '       <div class="descrellipse">{{description}}</div>' +
        ' <div class="text-right  "> <span class=" text-info " style="padding-top: 10px;cursor:pointer" title="{{title}}" onclick="kmsrenderdetail(&quot;{{_id}}&quot;)">' +
        ' View More' +
        '</span></div>' +
        ' <div><hr></div>' +
        '    </div>';
    return templ;
}

function getKmsTemplateMapStatic(obj) {
    var geturl = getendpointnested('template');
    var myQuery = { "query": { title: "Form Pilot" } };
    myQuery = {}
    var geturl = getendpoint('form');
    loadFormList(geturl, $('#cont-FormList'), myQuery);
    var templ = '<div class="container">' +
        '	<div class="container_section listedPlant" >' +
        '<div class="row listrow" >' +
        '	<div class="span3 col-3">' +
        '		<img class="img-fluid logof" src="http://127.0.0.1:1358/{{logo.path}}" />' +
        '	</div>' +
        '	<div class="span9 col-9">' +
        '		<div><h1> {{name }}</h1></div>' +
        '		<div class="descrellipse">{{description }}</div>' +
        '		<a href="$viewURL" class="pull-right" style="    padding-top: 10px;" title="$entry.getTitle($locale)">' +
        '							View More' +
        '                       </a>' +
        '	</div> ' +
        '          </div >' +
        ' </div >';
    return templ;
}

function extractStrElast(allindex) {
    var lista = {};
    delete allindex.entity_relation;
    for (const [key, value] of Object.entries(allindex)) {
        lista[key] = [];
        var tempSchema = {};
        /*if (key == 'geopoint')
            tempSchema = allindex[key].mappings['webcontent'].properties;
        else*/
        if (allindex[key].mappings[key] == undefined)
            tempSchema = allindex[key].mappings["_doc"].properties;
        else
            tempSchema = allindex[key].mappings[key].properties;
        reCextractStrElast(tempSchema, lista, key);
    }
    return lista;
}

function reCextractStrElast(tempSchema, lista, key) {
    for (const [k, v] of Object.entries(tempSchema)) {
        var firstSchema = tempSchema[k];
        if (firstSchema.hasOwnProperty("properties")) {
            var obj = {
                "name": k,
                "title": k,
                "type": "array",
                "childs": []
            }
            var subSchema = firstSchema.properties;
            for (const [k1, v1] of Object.entries(subSchema)) {
                var subobj = {
                    "name": k1,
                    "title": k1,
                    "type": subSchema[k1].type
                }
                obj.childs.push(subobj);
            }
            lista[key].push(obj);
        } else {
            var obj = {
                "name": k,
                "title": k,
                "type": firstSchema.type
            }
            lista[key].push(obj);
        }
    }
    return lista;
}

function convertStructToTemplate(el, strRet, preconcat) {
    if (strRet == undefined)
        strRet = "";
    if (preconcat == undefined)
        preconcat = "";
    if (el == undefined) {
        strRet = "No Entity available";
    } else
        el.forEach(element => {
            strRet += preconcat + "{{" + element.name + "}}<br/>";
            if (element.type == "array") {
                strRet = convertStructToTemplate(element.childs, strRet, "     {{" + element.name + "}}");
            }
        });
    return strRet;
}

function switchQuery(jj, el, vT) {
    if (actualTemplateType == "fullcontent") {}
    var confbase_ = Object.assign({}, kmsconf);
    confbase_.query.query.query = jj;
    kmsdataset = undefined;
    //resetDymerStart();
    checkbreadcrumb(null, el);
    if (retriveIfIsType('map') || retriveIfIsType('dt')) {
        showDatasetContainer();
        generateMapDT(confbase_);
    } else {
        drawEntities(confbase_);
    }
}


function reloadTotalMap() {
    var confbase_ = kmsconf;
    /*  confbase_.query.query.query = jj;
      var a = JSON.stringify(kmsconf);
      var b = JSON.stringify(confbase_);*/
    //if (a != b) {
    resetDymerStart();
    // }
    generateMapDT(confbase_);
}

//paginator
var d_curpage = 1;

function getMod(index, mod, veq) {
    if (index % mod === veq)
        return true;
    else
        return false;
}

function dymerPaginatorNextPrev(val) {
    var newpg = d_curpage + val;
    //var lstDpage = $("#dymerpaginator .page-item:last").prev().attr('d-pageref');
    var lstDpage = $("#dymerpaginator .page-item[d-pageref]:last").attr('d-pageref');
    if (newpg > 0 && newpg <= lstDpage && d_curpage != newpg) {
        dymerPaginatorChangePage(newpg);
    }
}

function dymerPaginatorChangePage(act_page) {
    $('[d-pagegroup="' + d_curpage + '"]').hide();
    $('[d-pagegroup="' + act_page + '"]').show();
    $('#dymerpaginator .page-item[d-pageref].active').removeClass('active');
    $('#dymerpaginator .page-item[d-pageref="' + act_page + '"]').addClass("active");
    d_curpage = act_page;
}

function dymerPaginatorSetReset() {
    d_curpage = 1;
    $('[d-pagegroup]').each(function(i, el) {
        if ($(this).attr('d-pagegroup') != d_curpage)
            $(this).hide();
    });
    dymerPaginatorChangePage(d_curpage);
}

function refreshDTagFilter(el) {
    manageDTagFilter($('.switchfilter [filter-rel="' + el.attr('filter-rel') + '"] '), 'update');
}

function GeneratorId() {};
GeneratorId.prototype.rand = Math.floor(Math.random() * 26) + Date.now();
GeneratorId.prototype.getId = function() {
    return this.rand++;
};

function manageDTagFilter(el, op) {
    var isChecked = el.is(":checked");
    var filter_rel = el.attr('filter-rel');
    var filter_relid = el.attr('filter-relid');
    var filter_labeltext = el.attr('filter-labeltext');
    var filter_multiple = el.attr('filter-multiple');
    var filter = $('#d_entityfilter [filter-id="' + filter_relid + '"]');
    var filter_value = filter.val();
    var filter_label_value = filter_value;
    var filter_type = "wildcard";
    if (filter.is('select')) {
        if (filter.find('option:selected').attr("disabled") == "disabled") return false
        filter_label_value = filter.find('option:selected').text();
        filter_type = "term";
        filter_rel = filter_rel + ".keyword";
    }
    if (filter.is('input')) {
        if (filter_value.trim() === "") return false
        filter_value = "*" + filter_value.toLowerCase() + "*";
    }
    if ((filter_multiple == "true") && (filter.is('input') == true)) {
        // filter_value = "*" + filter_value.toLowerCase() + "*";
        filter_type = "term";
        filter_rel = filter_rel + ".keyword";
        filter_value = filter.val();
        console.log("mm");
    }
    if (filter.is(':checkbox')) {
        filter_type = "match";
        filter_rel = filter_rel + ".keyword";
    }
    if (filter.is('textarea')) {
        filter_value = filter_value.replace(" ", "\\");
        filter_type = "match";
    }
    /*  if (filter_type == "wildcard") {
          //filter_value = "*" + filter_value.toLowerCase() + "*";
          filter_value = filter_value.replace(" ", "\\");
          filter_type = "match";
          //   filter_value = filter_value.toLowerCase();
      }*/
    if (filter_labeltext != "")
        filter_label_value = filter_labeltext;
    var searchableOverride = filter.attr('searchable-override');
    if (searchableOverride != undefined) {
        searchableOverride = searchableOverride.trim();
        if (searchableOverride != "") {
            filter_rel = searchableOverride;
            filter_rel = filter_rel + ".keyword";
        }
    }
    var filter_label = el.attr('filter-label');
    var lbl = filter_label + ' = ' + filter_label_value;
    if (op == 'update')
        dTagFilter.dymertagsinput('update', { id: filter_relid, filterquery: filter_rel, label: lbl, value: filter_value, typeqr: filter_type, });
    else {
        if (op == 'add')
            dTagFilter.dymertagsinput('add', { id: filter_relid, filterquery: filter_rel, label: lbl, value: filter_value, typeqr: filter_type });
        else {
            if (isChecked) {
                dTagFilter.dymertagsinput('add', { id: filter_relid, filterquery: filter_rel, label: lbl, value: filter_value, typeqr: filter_type });
            } else
                dTagFilter.dymertagsinput('remove', { id: filter_relid, filterquery: filter_rel, label: lbl, value: filter_value, typeqr: filter_type });
        }
    }
}

function toggleFilter() {
    var x = document.getElementById('d_entityfilter');
    if (x.style.display === 'none' || x.style.display === '') { x.style.display = 'block'; } else { x.style.display = 'none'; }
}

function switchByGeneralText(cc) {
    var listndex = cc.dymertagsinput('getIndexTerms');
    var querycreator = {
        "bool": {
            "must": [listndex],
        }
    };
    var valToSearch = $('#dTagFilter').val();
    if (valToSearch != "") {
        valToSearch = "*" + valToSearch + "*";
        var singleFilter = { "query_string": { "query": valToSearch, "default_operator": "AND" } };
        querycreator.bool.must.push(singleFilter);
    }
    switchQuery(querycreator, $(this));
}

function getFilterQueryType(filter) {
    let filter_value = filter.val();
    let filterKey = filter.attr('name');
    let filter_type = "wildcard";
    let filter_condition = (filter.attr('filter_condition')) ? filter.attr('filter_condition') : "or";
    let filter_multiple = (filter.attr('multiple') || filter.attr('repeatable')) ? true : false;
    var searchableOverride = filter.attr('searchable-override');
    let val = filter.val();
    let addToQuery = false;
    if (val instanceof Array) {
        if (val.length) {
            addToQuery = true;
        }
    }
    if ((typeof val) === 'string') {
        val = val.trim();
        if (!!val) {
            addToQuery = true;
        }
    }
    if (addToQuery) {
        if (filter.is('select')) {
            if (filter.find('option:selected').attr("disabled") == "disabled") return false
            filter_label_value = filter.find('option:selected').text();
            filter_type = "term";
            filterKey = filterKey + ".keyword";
        }
        if (filter.is('input') && searchableOverride == undefined) {
            if (filter_value.trim() === "") return false
            filter_value = "*" + filter_value.toLowerCase() + "*";
        }
        if ((filter_multiple) && (filter.is('input') == true)) {
            // filter_value = "*" + filter_value.toLowerCase() + "*";
            filter_type = "term";
            filterKey = filterKey + ".keyword";
            filter_value = filter.val();
        }
        if (filter.is(':checkbox')) {
            filter_type = "match";
            filterKey = filterKey + ".keyword";
        }
        if (filter.is('textarea')) {
            filter_value = filter_value.replace(" ", "\\");
            filter_type = "match";
        }

        if (searchableOverride != undefined) {
            searchableOverride = searchableOverride.trim();

            if (searchableOverride != "") {
                filterKey = searchableOverride;
                filterKey = filterKey + ".keyword";
            }
            if (searchableOverride == "_all") {
                filter_value = "*" + filter_value + "*";
                filter_value = { "query": filter_value, "default_operator": "AND" };
                filterKey = "";
                filter_type = "query_string";
            }
        }
        var regex = /@@(\d*)@@/;
        filterKey = filterKey.replace("].", ".");
        if (filterKey.slice(-1) == ']')
            filterKey = filterKey.substr(0, filterKey.length - 1);
        filterKey = filterKey.replace('data[', '');
        filterKey = replaceAll(filterKey, '][', '@@');
        filterKey = filterKey.replace(regex, ".");
        filterKey = replaceAll(filterKey, '@@', '.');
        if (filterKey.substr(filterKey.length - 1) == ".")
            filterKey = filterKey.substring(0, filterKey.length - 1);
    }
    return { addtoquery: addToQuery, filterquery: filterKey, value: filter_value, typeqr: filter_type, filter_cond: filter_condition, ismultiple: filter_multiple };
}
/*
function opencloseDSAF(el) {
    basefilter
}*/
function mergeDeep(...objects) {
    const isObject = obj => obj && typeof obj === 'object';

    return objects.reduce((prev, obj) => {
        Object.keys(obj).forEach(key => {
            const pVal = prev[key];
            const oVal = obj[key];

            if (Array.isArray(pVal) && Array.isArray(oVal)) {
                prev[key] = pVal.concat(...oVal);
            } else if (isObject(pVal) && isObject(oVal)) {
                prev[key] = mergeDeep(pVal, oVal);
            } else {
                prev[key] = oVal;
            }
        });

        return prev;
    }, {});
}
/*fcnflow.edit
    preloadform
    loadedform
    loadattachment
    loadhookrelation
    duplicaterepeatable
    prepopulateform
    populateform
    editForm
     */
function dymerphases(options) {
    let _this = this;
    let defaultProperties = {
            "type": "", //view/create/edit/delete
            "modal": {
                "active": false,
                "type": "" //edit/create/delete
            },
            "edit": {
                "active": false,
                "subphase": ""
            },
            "view": {
                "active": false,
                "phase": "",
                "subphase": "",
                "type": "" //full/list/map?
            },
            "create": {
                "active": false,
                "subphase": ""
            },
            "delete": {
                "active": false,
                "subphase": ""
            }
        }
        //options = {...defaultOptions, ...options };
    options = (options == undefined || options == null) ? {} : options;
    let properties = mergeDeep(defaultProperties, options);
    this.init = function() { //console.log('tpbase', properties)
    }
    this.getAllPhases = function(type, subphase, typesubphase) {
        return properties;
    }
    this.enableSubPhase = function(type, subphase, typesubphase) {
        properties.type = type; //view/create/edit/delete
        properties[type].active = true;
        properties[type].subphase = subphase;
        if ((properties[type]).hasOwnProperty("type") && typephase != undefined)
            properties[type].type = typesubphase;
    }
    this.disablePhase = function(type) {
        properties.type = "";
        properties[type].subphase = "";
        properties[type].active = false;
        if ((properties[type]).hasOwnProperty("type"))
            properties[type].type = "";
        console.log('disablePhase', properties)
    }
    this.getPhaseDetail = function() {
        return properties[properties.type];
    }
    this.getActualSubPhase = function() {
        return properties[properties.type].subphase;
    }
    this.setSubPhase = function(type, active, subphase, typephase) {
       // console.log('setSubPhase',type, active, subphase, typephase);
        properties.type = type; //view/create/edit/delete
        properties[type].active = active;
        properties[type].subphase = subphase;
        if ((properties[type]).hasOwnProperty("type") && typephase != undefined)
            properties[type].type = typephase;

    }
    this.resetPhases = function() {
        properties = defaultProperties;
    }
    this.isActivePhase = function(type) {
        return properties[type].active;
    }
    this.setModal = function(type, active) {
        properties.modal.active = active;
        properties.modal.type = type;
    }
    this.resetModal = function() {
        properties.modal.active = false;
        properties.modal.type = "";
    }
    this.isModal = function() {
        return properties.modal.active;
    }
    this.getModalType = function() {
        return properties.modal.type;
    }
    this.setType = function(type) {
        // console.log('setType', type)
        properties.type = type;
    }
    this.getType = function() {
        // console.log('getType', properties.type)
        return properties.type;
    }
    this.getViewtSubPhase = function() {
        return properties.view.subphase;
    }
    this.getViewtType = function() {
            return properties.view.type;
        }
        /*
this.setEditPhase = function(phase, active) {
properties.edit.active = active;
properties.edit.phase = phase;
properties.phase = "edit";
}
this.disableEditPhase = function() {
properties.edit.active = false;
properties.edit.phase = "";
}
this.isEditPhase = function() {
return properties.edit.active;
}
this.getEditPhase = function() {
return properties.edit.phase;
}
this.activeEditPhase = function (phase ) {
this.setEditPhase(phase,true);
}

this.setViewPhase = function(phase, active, type) {
properties.view.active = active;
properties.view.phase = phase;
properties.view.phase = type;
properties.phase="view";
}

this.disableViewPhase = function() {
properties.view.active = false;
properties.view.phase = "";
properties.view.type = "";
}
this.isViewPhase = function() {
return properties.view.active;
}
this.getViewtPhase = function() {
return properties.view.phase;
}
this.getViewtType = function() {
return properties.view.type;
}
this.getPhase = function() {
return properties.phase;
}*/
    this.init();
}

function dymerSearch(options) {
    let _this = this;
    let defaultOptions = {
            "conditionQuery": "AND",
            "groupfilterclass": "span12 col-12",
            "addfreesearch": false,
            "showFilterBtn": false,
            "showAdvOptionBtn": false,
            "translations": {
                und: {
                    freesearch: {
                        label: "Search",
                        placeholder: "Enter any term"
                    },
                    submit: {
                        text: "SEARCH"
                    }
                }
            }
        }
        //options = {...defaultOptions, ...options };
    options = mergeDeep(defaultOptions, options);
    this.init = function() {
        //   console.log('options', options);
        if (options.showFilterBtn) {
            $("#" + options.formid).append('<i class="fa fa-filter dsearchAdvFilterBtn" aria-hidden="true" title="advanced filter" onclick="' + options.objname + '.showFilter()"></i>');
        }
        if (options.showAdvOptionBtn) {
            let clsOrlink = ((options.conditionQuery).toLowerCase() == "or") ? "active" : "";
            let clsAndlink = ((options.conditionQuery).toLowerCase() == "and") ? "active" : "";
            let dsearchAdvOptionBtn = '<div class="dropdown show dsearchAdvOptionBtn"> ' +
                '<i class="fa fa-cog" role="button" id="dropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
                '</i>' +
                '<div class="dropdown-menu optsconditionQuery" aria-labelledby="dropdownMenuLink">' +
                '<a class="dropdown-item ' + clsOrlink + '" data-value="or" href="#" onclick="' + options.objname + '.setConditioQuery(\'or\')" >OR</a>' +
                '<a class="dropdown-item ' + clsAndlink + '" data-value="and" href="#" onclick="' + options.objname + '.setConditioQuery(\'and\')"   >AND</a>' +
                '</div>' +
                ' </div>';
            $("#" + options.formid).append(dsearchAdvOptionBtn);
        }
        if (options.objname == undefined) {
            document.getElementById(options.formid).innerHTML = '<div class="alert alert-danger" role="alert">ERROR: objname param is Mandatory</div>';
            return;
        }
        if (options.formid == undefined) {
            document.getElementById(options.formid).innerHTML = '<div class="alert alert-danger" role="alert">ERROR: formid param is Mandatory</div>';
            return;
        }
        if (options.query == undefined) {
            document.getElementById(options.formid).innerHTML = '<div class="alert alert-danger" role="alert">ERROR: Query param is Mandatory</div>';
            return;
        }
        if (options.innerContainerid == undefined) {
            options.innerContainerid = options.formid;
        }
        if (options.filterModel != undefined) {
            _this.loadFilterModel(options.filterModel);

        }

        $("#" + options.formid).append('<span   class="btn btn-primary btn-block" onclick="' + options.objname + '.search()">' + options.translations.und.submit.text + '</span>');
        window[options.objname] = options.objname;
        /* document.querySelector(options.container).className += " too-slide-slider-container";
         document.querySelectorAll(options.slidesClass).forEach((slide, index) => {
             // console.log(slide);
             slides[index] = slide;
             slides[index].style = "display:none";
             slides[index].className += " too-slide-single-slide too-slide-fade";
         });

         this.goToSlide(0)
         this.prepareControls();
         this.orderElement();*/
        $('.selectpicker').selectpicker();
    }
    this.setConditioQuery = function(val) {
        options.conditionQuery = val;
        $("#" + options.formid + ' .dsearchAdvOptionBtn .optsconditionQuery a').removeClass("active");
        $("#" + options.formid + ' .dsearchAdvOptionBtn .optsconditionQuery a[data-value="' + val + '"]').addClass("active");
    }
    this.getOptions = function(val) {
        return options;
    }
    this.loadFilterModel = function() {
        let d_uid = localStorage.getItem("d_uid");

        let index = options.filterModel;
        if (index == undefined)
            return;
        let datapost = { "query": { "instance._index": index }, "act": "view" };
        let sourceUrl = getendpoint('form');
        let temp_config_call = {
            url: sourceUrl,
            type: 'GET',
            addDataBody: false
        };
        let ajax_temp_call = new Ajaxcall(temp_config_call);
        ajax_temp_call.flush();
        //  let indport = sourceUrl + "/";
        if (datapost != undefined)
            ajax_temp_call.addparams(datapost);
        let ret = ajax_temp_call.send();
        let dom_to_render = sourceUrl + "/";
        if (ret.success) {
            let idcontainerfiler = "#" + options.formid + " #" + options.innerContainerid;
            if (options.formid == options.innerContainerid) {
                idcontainerfiler = "#" + options.formid;
            }
            let myform_innerContainer = $(idcontainerfiler);

            let myform = $("#" + options.formid);
            (ret.data).forEach(function(item, i) {
                (item.files).forEach(function(fl, i) {
                    if (fl.contentType == "text/html") {
                        dom_to_render += "content/" + index + "/" + fl._id + "?dmts=2";
                    }
                });
            });
            //dom_to_render = indport + dom_to_render;
            let temp_config_call = {
                url: dom_to_render,
                type: 'GET',
                addDataBody: false,
                mimeType: "text/html",
                contentType: "text/html"
            };
            let ajax_temp_call = new Ajaxcall(temp_config_call);
            ajax_temp_call.flush();
            ajax_temp_call.addparams(datapost);
            let itemValue = ajax_temp_call.send();
            $html = $(itemValue);
            // hookReleationFormFilter($(itemValue));
            let searchIndex = $(itemValue).find('[name="instance[index]"]');
            searchIndex.attr('name', 'data[_index]');
            // myform_innerContainer.append(searchIndex);
            let idGen = new GeneratorId();
            let usePlaceholder = (myform.attr("useplaceholder") == "true") ? true : false;
            if (options.addfreesearch) {
                let groupEl = $('<div class="grpfilter ' + options.groupfilterclass + ' basefilter"><div><label class="control-label"> ' + options.translations.und.freesearch.label + ' </label></div> </div>');
                $(groupEl).attr('data-filterpos', -10);
                $(groupEl).append('<input type="text" class="form-control  " placeholder="' + options.translations.und.freesearch.placeholder + '" name="data[_all]" searchable-override="_all" >');

                //if (options.innerContainerid == options.formid) {
                myform_innerContainer.append(groupEl);
                //  } else {
                //      $(groupEl).insertBefore(myform_innerContainer);
                //  }


            }
            $(itemValue).find('[searchable-element="true"]').each(function() {
                //let newId = idGen.getId();
                let filterpos = ($(this).data('filterpos') == undefined) ? 0 : $(this).data('filterpos');
                let singleEl = "";

                if ($(this).attr("dymer-model-visibility") == "private" && d_uid == "guest@dymer.it") {
                    return;
                }
                if ($(this).attr("data-torelation") != undefined || $(this).attr("data-totaxonomy") != undefined) {
                    if ($(this).attr("data-torelation") != undefined) {
                        let rel = $(this).attr('data-torelation');
                        let esxtraAttr = "";
                        let datapost = {
                            instance: { "index": rel },
                            qoptions: { relations: false }
                        };
                        let listToselect = actionPostMultipartForm("entity.search", undefined, datapost, undefined, undefined, undefined, false, undefined);
                        let inde = 0;
                          //mr rel fix
                        var templ_data = flatEsArray(listToselect.data);
                        listToselect.data = templ_data.arr;
                        let ismulti = ($(this).attr('searchable-multiple') == "true") ? "multiple" : 'data-max-options="1"';
                        let isactionsbox = "";
                        if ($(this).attr('searchable-multiple') == "true") {
                            isactionsbox = 'data-actions-box="true"';
                        }

                        if (listToselect.data.length == 0) {
                            return;
                        }
                        //  console.log('ismulti  rel', $(this).html(), $(this).attr('searchable-multiple'), ismulti);
                        // let $sel = $('<select class="form-control span12 col-12"  searchable-multiple="' + ismulti + '"  searchable-override="data[relationdymer][' + rel + ']" searchable="" searchable-label="' + $(this).attr('searchable-label') + '" name="data[relation][' + rel + '][' + inde + '][to]"  ' + esxtraAttr + '>').appendTo($(this));
                        let $sel = $('<select name="data[relationdymer][' + rel + ']" searchable-label="' + $(this).attr('searchable-label') + '" class="selectpicker form-control"  data-live-search="true"  ' + ismulti + ' ' + isactionsbox + ' data-selected-text-format="count"  ></select>').appendTo($(this));
                        /*if (usePlaceholder)
                            $sel.append($('<option value="" disabled selected>').attr('value', "").text($(this).attr('searchable-label')));*/
                        $.each(listToselect.data, function(ind, value) {
                            // $sel.append($("<option>").attr('value', value._id).text(value.title));
                            // $sel.append($("<option>").attr('data-tokens', value._id).attr('value', value.title).text(value.title));
                            $sel.append($("<option>").attr('value', value._id).text(value.title));
                        });
                        //$sel.attr("filter-id", newId);

                        $sel.attr("searchable-text", $(this).attr("searchable-text"));

                        singleEl = $sel;
                    } else if ($(this).attr("data-totaxonomy") != undefined) {
                        let taxID = $(this).attr("data-totaxonomy")
                        let taxName = $(this).attr("name")
                        let datapost = {
                            id: taxID
                        };

                        let listToselect = actionPostMultipartForm("taxonomy.search", undefined, datapost, undefined, undefined, undefined, false, taxID);
                        // let listToselect = await actionPostMultipartForm_Promise("taxonomy.search", undefined, datapost, undefined, undefined, undefined, false, taxID);
                        console.log("listToselect", listToselect)
                        let inde = 0;
                        let ismulti = ($(this).attr('searchable-multiple') == "true") ? "multiple" : 'data-max-options="1"';
                        let isactionsbox = "";
                        if ($(this).attr('searchable-multiple') == "true") {
                            isactionsbox = 'data-actions-box="true"';
                        }

                        if (listToselect.data.length == 0) {
                            return;
                        }
                        //  let $sel = $('<select name="data[taxonomydymer][' + taxID + ']" searchable-label="' + $(this).attr('searchable-label') + '" class="selectpicker form-control"  data-live-search="true"  ' + ismulti + ' ' + isactionsbox + ' data-selected-text-format="count"  ></select>').appendTo($(this));
                        let $sel = $('<select name="' + taxName + '[' + inde + ']" searchable-label="' + $(this).attr('searchable-label') + '"  searchable-override="' + taxName + '" class="selectpicker form-control"  data-live-search="true"  ' + ismulti + ' ' + isactionsbox + ' data-selected-text-format="count"  ></select>').appendTo($(this));


                        // $sel.append($("<option>").attr('value', "").text(""));
                        $.each(listToselect.data.nodes, function(ind, value) {

                            $sel.append($("<option>").attr('value', value.value).text(value.locales.en.value));

                            if (value.nodes.length != 0) {

                                for (internalValue of value.nodes) {
                                    $sel.append($("<option>").attr('value', internalValue.value).text("\u00A0" + "\u00A0" + internalValue.locales.en.value));
                                }
                            }

                        });

                        $sel.attr("searchable-text", $(this).attr("searchable-text"));
                        singleEl = $sel;


                    }

                } else {
                    if ($(this).is("select")) {
                        if (!$(this).hasClass("selectpicker")) {
                            let nameVal = $(this).attr('name');
                            let searchableOverride_ = $(this).attr('searchable-override');

                            if (searchableOverride_ != undefined) {
                                nameVal = searchableOverride_;
                            }

                            let ismulti = ($(this).attr('searchable-multiple') == "true") ? "" : 'data-max-options="1"';
                            let $sel = $('<select name="' + nameVal + '" ' + '  searchable-label="' + $(this).attr('searchable-label') + '"  class="selectpicker form-control "  data-live-search="true" multiple ' + ismulti + ' data-selected-text-format="count"  data-actions-box="true"></select>').appendTo($(this));
                            //  $(this).addClass('selectpicker').attr('data-live-search', 'true').attr('multiple').att(ismulti);;

                            $(this).find("option").each(function() {
                                //alert(this.text + ' ' + this.value);
                                //  $sel.append($("<option>").attr('data-tokens', this.value).attr('value', this.text).text(this.text));
                                $sel.append($("<option>").attr('value', this.value).text(this.text));
                            });
                            singleEl = $sel;
                        } else { singleEl = $(this); }
                    } else {
                        singleEl = $(this); //.attr("filter-id", newId);
                    }

                }
                let additionalText = "";
                let additTextEl = singleEl.attr('searchable-text');

                singleEl.removeAttr('required');
                if (additTextEl != undefined) {
                    additTextEl = additTextEl.trim();
                    if (additTextEl != "") {
                        additionalText = additTextEl;
                    }
                }

                if (singleEl.is(":checkbox")) {
                    return;
                    // singleEl.css("display", "none");
                }
                let filterMultiple = ($(singleEl).closest(".form-group").hasClass('repeatable') || singleEl.hasClass('multiple')) ? true : false;
                let addMultiple = $(singleEl).attr("searchable-multiple");
                let filterRel = $(singleEl).attr('name');
                let filterLabel = $(singleEl).attr('searchable-label');
                if (usePlaceholder)
                    $(singleEl).attr("placeholder", $(singleEl).attr('searchable-label'));
                /*  let basefilter = ' <i class="fa fa-refresh filterSingRefresh" aria-hidden="true" title="refresh filter value"  filter-relid="' + newId + '" filter-rel="' + filterRel + '"  filter-labeltext="' + additionalText + '" filter-label="' + filterLabel + '" filter-multiple="' + filterMultiple + '" onclick="refreshDTagFilter( $(this))"></i> ' +
                      '<label class="switch switchfilter " title="active filter">' +
                      '<input type="checkbox"  filter-relid="' + newId + '"  filter-rel="' + filterRel + '"  filter-label="' + filterLabel + '" filter-labeltext="' + additionalText + '" filter-multiple="' + filterMultiple + '" onclick="manageDTagFilter( $(this))">' +
                      ' <span class="slider round"></span>' +
                      '  </label>';
                  if (addMultiple == "true") {
                      basefilter = ' <i class="fa fa-plus filterSingRefresh" aria-hidden="true" title="add"  filter-relid="' + newId + '" filter-rel="' + filterRel + '"  filter-labeltext="' + additionalText + '" filter-label="' + filterLabel + '" filter-multiple="' + filterMultiple + '" onclick="manageDTagFilter( $(this),\'add\')"></i> ';
                  }*/

                let groupEl = $('<div class="grpfilter ' + options.groupfilterclass + '"><div><label class="control-label">' + filterLabel + '</label></div>' + additionalText + ' </div>');
                if (usePlaceholder)
                    groupEl = $('<div class="grpfilter ' + options.groupfilterclass + '">' + additionalText + ' </div>');
                //  let ck = $('<div class="switch_container pull-right">' + basefilter + ' </div>');
                $(groupEl).attr('data-filterpos', filterpos);
                if (options.showFilterBtn) {
                    $(groupEl).attr('style', "display: none;");
                }
                $(groupEl).append(singleEl);
                myform_innerContainer.append(groupEl);
            });
            /*   myform.on('click', e => {
                   e.stopPropagation();
               });*/
            let $wrapper = myform_innerContainer;
            $wrapper.find('.grpfilter').sort(function(a, b) {
                return +$(a).data('filterpos') - +$(b).data('filterpos');
            }).appendTo($wrapper);
        }
    }
    this.getFilterQueryType = function(filter) {
        let filter_value = filter.val();
        let filterKey = filter.attr('name');
        let filter_type = "wildcard";
        let filter_condition = (filter.attr('filter_condition')) ? filter.attr('filter_condition') : "or";
        let filter_multiple = (filter.attr('multiple') || filter.attr('repeatable')) ? true : false;
        var searchableOverride = filter.attr('searchable-override');
        let val = filter.val();
        let isRelation = false;
        let addToQuery = false;
        if (val instanceof Array) {
            if (val.length) {
                addToQuery = true;
            }
        }
        if ((typeof val) === 'string') {
            val = val.trim();
            if (!!val) {
                addToQuery = true;
            }
        }
        if (addToQuery) {
            if (filter.is('select')) {
                if (filter.find('option:selected').attr("disabled") == "disabled") return false
                filter_label_value = filter.find('option:selected').text();
                filter_type = "term";
                filterKey = filterKey + ".keyword";
            }
            if (filter.is('input') && searchableOverride == undefined) {
                if (filter_value.trim() === "") return false
                filter_value = "*" + filter_value.toLowerCase() + "*";
            }
            if ((filter_multiple) && (filter.is('input') == true)) {
                // filter_value = "*" + filter_value.toLowerCase() + "*";
                filter_type = "term";
                filterKey = filterKey + ".keyword";
                filter_value = filter.val();
            }
            if (filter.is(':checkbox')) {
                filter_type = "match";
                filterKey = filterKey + ".keyword";
            }
            if (filter.is('textarea')) {
                filter_value = filter_value.replace(" ", "\\");
                filter_type = "match";
            }
            if (searchableOverride != undefined) {
                searchableOverride = searchableOverride.trim();
                if (searchableOverride != "") {
                    filterKey = searchableOverride;
                    filterKey = filterKey + ".keyword";
                }
                if (searchableOverride == "_all") {
                    filter_value = "*" + filter_value + "*";
                    filter_value = { "query": filter_value, "default_operator": "AND" };
                    filterKey = "";
                    filter_type = "query_string";
                }
            }
            var regex = /@@(\d*)@@/;
            filterKey = filterKey.replace("].", ".");
            if (filterKey.slice(-1) == ']')
                filterKey = filterKey.substr(0, filterKey.length - 1);
            filterKey = filterKey.replace('data[', '');
            filterKey = replaceAll(filterKey, '][', '@@');
            filterKey = filterKey.replace(regex, ".");
            filterKey = replaceAll(filterKey, '@@', '.');
            if (filterKey.substr(filterKey.length - 1) == ".")
                filterKey = filterKey.substring(0, filterKey.length - 1);

            if (filterKey.startsWith('relationdymer')) {
                isRelation = true;
                filterKey = filterKey.replace("relationdymer.", "").replace(".keyword", "");
                /* if (querycreator.hasOwnProperty('relationdymer')) {
                     querycreator['relationdymer'][temp_relkey].push(v.value);
                 } else {
                     querycreator['relationdymer'] = {};
                     querycreator['relationdymer'][temp_relkey] = [v.value];
                 }*/

            }
        }
        return { addtoquery: addToQuery, filterquery: filterKey, value: filter_value, typeqr: filter_type, filter_cond: filter_condition, ismultiple: filter_multiple, 'isRelation': isRelation };
    }
    this.search = function() {
        let myform = $("#" + options.formid + "");
        //let filterList = myform.serializeArray();
        let els = myform.find(':input').get();
        let conditionQ = ((options.conditionQuery).toLowerCase() == "or") ? "should" : "must";
        //console.log("#myfilter", filterList);
        let listindex = options.query;
        /* let listindex = {
             "bool": {
                 "must": [{
                     "terms": {
                         "_index": ["demproduct"]
                     }
                 }]
             }
         };*/
        let querycreator = {
            "bool": {
                "must": [listindex]
            }
        };
        let subquerycreator = {
            "bool": {}
        };
        subquerycreator.bool[conditionQ] = [];
        let addsubquery = false;
        $.each(els, function() {
            if (this.name /*&& !this.disabled*/ && (this.checked || /select|input|textarea/i.test(this.nodeName) || /text|hidden|password/i.test(this.type)) && (!/file/i.test(this.type))) {
                let val = $(this).val();
                let addToQuery = false;
                if (val instanceof Array) {
                    if (val.length) {
                        addToQuery = true;
                    }
                }
                if ((typeof val) === 'string') {
                    val = val.trim();
                    if (!!val) {
                        addToQuery = true;
                    }
                }
                if (addToQuery) {
                    //let isMultiple = ($(this).attr('multiple') || $(this).attr('repeatable')) ? true : false;
                    // let name = $(this).attr('name');
                    // console.log("-", name, val, isMultiple, this.nodeName, val instanceof String);
                    let sfilter = _this.getFilterQueryType($(this));
                    //    console.log('sfilter', sfilter);
                    if (sfilter.addtoquery) {
                        let listValues = [];
                        if (sfilter.ismultiple) {
                            listValues = sfilter.value;
                        } else {
                            listValues.push(sfilter.value);
                        }
                        listValues.forEach(elvalue => {
                            let typeqr_ = sfilter.typeqr;
                            let filterKey = sfilter.filterquery;
                            let singleFilter = {};
                            if (sfilter.isRelation) {
                                if (querycreator.hasOwnProperty('relationdymer')) {
                                    querycreator['relationdymer'][filterKey].push(elvalue);
                                } else {
                                    querycreator['relationdymer'] = {};
                                    querycreator['relationdymer'][filterKey] = [elvalue];
                                }
                            } else {
                                singleFilter[typeqr_] = {};
                                if (filterKey != "")
                                    singleFilter[typeqr_][filterKey] = elvalue;
                                else
                                    singleFilter[typeqr_] = elvalue;
                                subquerycreator.bool[conditionQ].push(singleFilter);
                                addsubquery = true;
                            }

                        });
                    }
                }
            }
        });
        //  console.log('subquerycreator', subquerycreator);
        if (addsubquery)
            querycreator.bool.must.push(subquerycreator);
        //  console.log('querycreator', querycreator);
        switchQuery(querycreator);
        $('#dymer_breadcrumb').empty();
    }
    this.showFilter = function() {
        let myform = $("#" + options.formid + "");
        let tp = 'base';
        let btnAdvFilter = myform.children('.dsearchAdvFilterBtn');
        if (btnAdvFilter.hasClass("active")) {
            btnAdvFilter.removeClass('active');
        } else {
            btnAdvFilter.addClass('active');
            tp = 'all';
        }
        switch (tp) {
            case 'base':

                myform.find('.grpfilter:not(.basefilter)').slideUp();
                break;
            case 'all':

                myform.find('.grpfilter').slideDown();
                break;
            default:
                break;
        }
    }
    this.init();
}

function switchByFilterBase() {
    let filterList = $("#myfilter").serializeArray();
    console.log("#myfilter", filterList);
    let listindex = {
        "bool": {
            "must": [{
                "terms": {
                    "_index": ["demproduct"]
                }
            }]
        }
    };
    let querycreator = {
        "bool": {
            "must": [listindex]
        }
    };
    var els = $("#myfilter").find(':input').get();
    let conditionQ = "must";
    /*  let subquerycreator = {
          "bool": {
              "should": []
          }
      };*/
    let subquerycreator = {
        "bool": {

        }
    };
    subquerycreator.bool[conditionQ] = [];
    let addsubquery = false;
    $.each(els, function() {
        if (this.name /*&& !this.disabled*/ && (this.checked || /select|input|textarea/i.test(this.nodeName) || /text|hidden|password/i.test(this.type)) && (!/file/i.test(this.type))) {
            let val = $(this).val();
            let addToQuery = false;
            if (val instanceof Array) {
                if (val.length) {
                    addToQuery = true;
                }
            }
            if ((typeof val) === 'string') {
                val = val.trim();
                if (!!val) {
                    addToQuery = true;
                }
            }
            if (addToQuery) {
                //let isMultiple = ($(this).attr('multiple') || $(this).attr('repeatable')) ? true : false;
                // let name = $(this).attr('name');
                // console.log("-", name, val, isMultiple, this.nodeName, val instanceof String);
                console.log(getFilterQueryType($(this)));
                let sfilter = getFilterQueryType($(this));
                console.log('sfilter', sfilter);
                if (sfilter.addtoquery) {
                    let listValues = [];
                    if (sfilter.ismultiple) {
                        listValues = sfilter.value;
                    } else {
                        listValues.push(sfilter.value);
                    }
                    listValues.forEach(elvalue => {
                        let typeqr_ = sfilter.typeqr;
                        let filterKey = sfilter.filterquery;
                        let singleFilter = {};
                        singleFilter[typeqr_] = {};
                        if (filterKey != "")
                            singleFilter[typeqr_][filterKey] = elvalue;
                        else
                            singleFilter[typeqr_] = elvalue;
                        subquerycreator.bool[conditionQ].push(singleFilter);
                        addsubquery = true;
                    });

                }
            }

        }
    });
    console.log('subquerycreator', subquerycreator);
    if (addsubquery)
        querycreator.bool.must.push(subquerycreator);

    console.log('querycreator', querycreator);
    switchQuery(querycreator);

}

function switchByFilter(cc, vType) {
    if (cc.dymertagsinput('getOptionFreeInput')) {
        switchByGeneralText(cc);
        return true;
    }
    var listndex = cc.dymertagsinput('getIndexTerms');
    var querycreator = {
        "bool": {
            "must": [listndex],
        }
    };
    var filterList = cc.dymertagsinput('items');
    console.log('listndex', listndex);
    console.log('filterList', filterList);
    $.each(filterList, function(k, v) {
        var filterKey = v.filterquery;
        var regex = /@@(\d*)@@/;
        var typeqr_ = v.typeqr;
        filterKey = filterKey.replace("].", ".");
        if (filterKey.slice(-1) == ']')
            filterKey = filterKey.substr(0, filterKey.length - 1);
        filterKey = filterKey.replace('data[', '');
        filterKey = replaceAll(filterKey, '][', '@@');
        filterKey = filterKey.replace(regex, ".");
        filterKey = replaceAll(filterKey, '@@', '.');
        if (filterKey.substr(filterKey.length - 1) == ".")
            filterKey = filterKey.substring(0, filterKey.length - 1);
        // var singleFilter = { "match": {} };
        var singleFilter = {};
        singleFilter[typeqr_] = {};
        singleFilter[typeqr_][filterKey] = v.value;
        if (filterKey.startsWith('relationdymer')) {
            var temp_relkey = filterKey.replace("relationdymer.", "").replace(".keyword", "");
            if (querycreator.hasOwnProperty('relationdymer')) {
                querycreator['relationdymer'][temp_relkey].push(v.value);
            } else {
                querycreator['relationdymer'] = {};
                querycreator['relationdymer'][temp_relkey] = [v.value];
            }
        } else {
            querycreator.bool.must.push(singleFilter);
        }
    });
    console.log('querycreator', querycreator);
    switchQuery(querycreator, $(this), vType);
}

function clearDFilter() {
    if (dTagFilter.dymertagsinput('getOptionFreeInput')) {
        $('#dTagFilter').val('');
        if ($('dFilterClearAll').attr('autostart') != undefined || $('dFilterClearAll').attr('autostart') != true)
            switchByGeneralText(dTagFilter);
        return true;
    } else {
        dTagFilter.dymertagsinput('removeAll');
        $('#d_entityfilter [filter-rel]').prop("checked", false);
        switchByFilter(dTagFilter);
    }
}

function dymerFormatDate(val, format) {
    var date = new Date(val);
    if (!format)
        format = "MM/dd/yyyy";
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
    format = format.replace("MM", month.toString().padL(2, "0"));
    if (format.indexOf("yyyy") > -1)
        format = format.replace("yyyy", year.toString());
    else if (format.indexOf("yy") > -1)
        format = format.replace("yy", year.toString().substr(2, 2));
    format = format.replace("dd", date.getDate().toString().padL(2, "0"));
    var hours = date.getHours();
    if (format.indexOf("t") > -1) {
        if (hours > 11)
            format = format.replace("t", "pm")
        else
            format = format.replace("t", "am")
    }
    if (format.indexOf("HH") > -1)
        format = format.replace("HH", hours.toString().padL(2, "0"));
    if (format.indexOf("hh") > -1) {
        if (hours > 12) hours - 12;
        if (hours == 0) hours = 12;
        format = format.replace("hh", hours.toString().padL(2, "0"));
    }
    if (format.indexOf("mm") > -1)
        format = format.replace("mm", date.getMinutes().toString().padL(2, "0"));
    if (format.indexOf("ss") > -1)
        format = format.replace("ss", date.getSeconds().toString().padL(2, "0"));
    return format;
}
String.repeat = function(chr, count) {
    var str = "";
    for (var x = 0; x < count; x++) { str += chr };
    return str;
}
String.prototype.padL = function(width, pad) {
    if (!width || width < 1)
        return this;

    if (!pad) pad = " ";
    var length = width - this.length
    if (length < 1) return this.substr(0, width);

    return (String.repeat(pad, length) + this).substr(0, width);
}
String.prototype.padR = function(width, pad) {
    if (!width || width < 1)
        return this;
    if (!pad) pad = " ";
    var length = width - this.length
    if (length < 1) this.substr(0, width);

    return (this + String.repeat(pad, length)).substr(0, width);
}

function sort_li(a, b) {
    return ($(b).data('ordtitle')) < ($(a).data('ordtitle')) ? 1 : -1;
}
Object.byString = function(o, s) {
    s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    s = s.replace(/^\./, ''); // strip a leading dot
    var a = s.split('.');
    for (var i = 0, n = a.length; i < n; ++i) {
        var k = a[i];
        if (k in o) {
            o = o[k];
        } else {
            return;
        }
    }
    return o;
}

function stringTemplateParser(expression, valueObj) {
    const templateMatcher = /{{\s?([^{}\s]*)\s?}}/g;
    let text = expression.replace(templateMatcher, (substring, value, index) => {
        value = Object.byString(valueObj, value); //valueObj[value];
        return value;
    });
    return text
}

function hideDatasetContainer() {
    if (retriveIfIsType('map') || retriveIfIsType('dt')) {
        $(retriveTargetId('map')).hide();
        $(retriveTargetId('dt')).hide();
    }
    $(retriveTargetId('list')).hide();
    $(retriveTargetId('fullcontent')).show();

}

function retriveIfIsType(type) {
    var tp = false;
    if (kmsconf.hasOwnProperty(type))
        tp = true;
    return tp;
}

function retriveTargetId(type) {
    var tgid = undefined;
    switch (type) {
        case 'map':
            tgid = '#cont-TotalMap';
            break;
        case 'dt':
            tgid = '#cont-Dt';
            break;
        case 'list':
            tgid = '#cont-MyList';
            break;
        case 'fullcontent':
            tgid = '#cont-MyEnt';
            break;
        default:
            break;
    }
    if (kmsconf.target.hasOwnProperty(type))
        if (kmsconf.target[type].hasOwnProperty('id'))
            tgid = kmsconf.target[type].id;
    return tgid;
}

function showDatasetContainer() {
    $(retriveTargetId('fullcontent')).empty();
    $(retriveTargetId('list')).show();
    dymphases.setSubPhase('view', true, '', "teaserlist");
    if (retriveIfIsType('map') || retriveIfIsType('dt')) {
        let mapElId = $(retriveTargetId('map'));
        mapElId.show();
        let dtElId = $(retriveTargetId('dt'));
        dtElId.show();
        if (mapElId.length && dtElId.length) {
            dymphases.setSubPhase('view', true, '', "map-dt");
        } else {
            if (mapElId.length)
                dymphases.setSubPhase('view', true, '', "map");
            if (dtElId.length)
                dymphases.setSubPhase('view', true, '', "dt");
        }
    }
}