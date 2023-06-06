/******
//----Config
    //parametri_manuali - set di parametri manuali
        var parametri_manuali=new Object();
        parametri_manuali['nameparametro1']="valore parametro1";
        parametri_manuali['nameparametro2']="valore parametro2";
    //container_ids 
        // singolo form da inviare
        var container_ids="id_del_mio_form";
        //alternativa
        var container_ids=["id_del_mio_form"];
        //invio di più form
        var container_ids=["id_del_mio_form1","id_del_mio_form2","id_del_mio_form3"];
    	
    var config=
        {
            url:"stringa contente url della chiamata",
            params:parametri_manuali,//opzionale
            type:"",//opzionale valori: "POST"|"GET" di default "POST"
            mimeType:"",//opzionale di default 'application/json'
            namespace:"",//opzionale di default '', aggiurgere il namespace della portlet nel caso in cui vengano aggiunti i parametri manuali e nella key del parametro non venga aggiunto il namespace della portlet manualmente
            container_ids:container_ids,// array di stringhe contenente gli id o stringa dell'id dei form/elementi Dom contenitori dei dati da inviare
        };	
//-------	
// Istanza Ajaxcall con config 	//String[] x = request.getParameterValues("array[]") ;
    var esempioCall= new Ajaxcall(config);
    esempioCall.send();//serializza sia i form che i parametri aggiunti

******/
//console.log("ajax call caricata");
function Ajaxcall(objurl_, namespace_, params_, type_, mimeType_, container_ids_) {
    var obj = objurl_;
    var objurl_isObj = (this.whatIsIt(obj) == "Object") ? true : false;
    this.url = window.location.href;
    this.type = "POST";
    this.mimeType = 'application/json';
    this.namespace = '';
    this.container_ids = [];
    this.datapost = new Object();
    this.params = new Object();
    this.addDataBody = false;
    this.serializedata = true;
    this.processData = true;
    this.serializeJSON = true;
    //this.contentType ='application/x-www-form-urlencoded; charset=UTF-8';
    this.contentType = 'application/json';
    this.enctype = undefined;
    this.cache = false;
    if (!objurl_isObj) {
        obj = {
            url: objurl_,
            params: params_,
            namespace: namespace_,
            mimeType: mimeType_,
            type: type_,
            container_ids: container_ids_
        };
    }
    this.setconfig(obj);
}
Ajaxcall.prototype = {
    constructor: Ajaxcall,
    setnamespace: function(namespace) { this.namespace = namespace; },
    getnamespace: function() { return this.namespace; },
    checknamespace: function() { return this.namespace.length; },
    setmimeType: function(mimeType) { this.mimeType = mimeType; },
    getmimeType: function() { return this.mimeType; },
    setserializedata: function(serializedata) { this.serializedata = serializedata; },
    setdatapost: function(datapost) { this.datapost = datapost; },
    getdatapost: function() { return this.datapost; },
    setaddDataBody: function(addDataBody) { this.addDataBody = addDataBody; },
    setcontainer_ids: function(container_ids) {
        var is_array_ids = this.whatIsIt(container_ids) == "Array" ? true : false;
        if (is_array_ids)
            this.container_ids = container_ids;
        else
            this.container_ids.push(container_ids);
    },
    addcontainer_ids: function(c) {
        var is_array_c = this.whatIsIt(c) == "Array" ? true : false;
        if (is_array_c) {
            var newArr = this.container_ids.concat(c);
            this.container_ids = newArr;
        } else
            this.container_ids.push(c);
    },
    getcontainer_ids: function() { return this.container_ids; },
    extractAllDataSend: function() {
        var self_ = this;
        var datret = {};
        if (this.container_ids.length) {
            for (var k in self_.container_ids) {
                var els = $(self_.container_ids[k]).find(':input').get();
                $.each(els, function() {
                    if (this.name /*&& !this.disabled*/ && (this.checked || /select|input|textarea/i.test(this.nodeName) || /text|hidden|password/i.test(this.type)) && (!/file/i.test(this.type))) {
                        var val = $(this).val();

                        self_.addparam(this.name, val);
                    }
                });
            }
        }
        return this.getparams();
    },
    send: function(callbackfunction) {
        var self_ = this;
        //  console.log('a', this.params);
        //  console.log('b', self_.serializeAnything(self_.container_ids[k]));
        if (!self_.serializedata)
            return this.ajaxsend(callbackfunction);
        if (this.enctype) {
            //	console.log('enctype', this.enctype, (this.enctype).indexOf('multipart/form-data') !== -1);
            if ((this.enctype).indexOf('multipart/form-data') !== -1) {
                var formdata = new FormData();
                for (var k in self_.container_ids) {
                    jQuery.each(jQuery(self_.container_ids[k] + ' input[type="file"]'), function(i, file) {
                        //var f=$(this).prop('files')[0];
                        var c = $(this)[0].files[0];
                        var fname = $(this).attr("name");
                        if (c != undefined)
                            formdata.append(fname, c);
                    });
                }
                if (self_.container_ids[0] != undefined) {
                  let a = $(self_.container_ids[0]).serializeJSON();
                  //   let a = $(self_.container_ids[0]).serializeJSON({parseBooleans: true, parseNumbers: true,skipFalsyValuesForTypes: ["string"]});
                   
                  //       console.log('appendFormdataxxxx', self_.container_ids[0], a);
                            console.log("a2", a);
                    appendFormdata(formdata, a);
                    let els = $(self_.container_ids[0]).find(':input').get();
                    //console.log("els",els);
                    $.each(els, function() {
                        if (this.name && (/select/i.test(this.nodeName))) {
                            let vals = $(this).val();
                            let isPicker = $(this).hasClass('selectpicker');
                            let ismulti = $(this).attr('multiple');
                            let nm = $(this).attr("name");
                            let ind = 0;
                            if (isPicker && ismulti) {
                                formdata.delete(nm);
                                vals.forEach(elvalue => {
                                    let nnm = nm + "[" + ind + "]";
                                    formdata.append(nnm, elvalue);
                                    ind++;
                                });
                            }
                            //    console.log("a1", a);
                            //delete a[nm];
                        }
                    });
                    /*  for (var pair of formdata.entries()) {
                 console.log("a", pair[0] + ", " + pair[1]);
}*/
                }
                var b = self_.getparams();
                //console.log("b",b);
                // console.log('this.getparams',b);
                appendFormdata(formdata, b);
                this.datapost = formdata;
                /*    for (var pair of this.datapost.entries()) {
                            console.log("this.datapost", pair[0] + ", " + pair[1]);
                    }*/
            }
        } else {
            if (this.container_ids.length) {
                for (var k in self_.container_ids) {
                    //	console.log("k", k, self_.container_ids[k]);
                    self_.serializeAnything(self_.container_ids[k]);
                }
            }
            if (this.datapost.length) {
                var type_obj = self_.whatIsIt(self_.datapost);
                if (type_obj == "Array") {
                    jQuery.extend(self_.params, self_.datapost);
                }
            }
            this.datapost = this.params;
        }
        //return false;
        return this.ajaxsend(callbackfunction);
    },
    getdatapost: function() { return this.datapost; },
    setparams: function(obj) {
        this.params = new Object();
        this.addparams(obj);
    },
    setparam: function(k, v) {
        this.addparam(k, v);
    },
    getparams: function() { return this.params; },
    addparams: function(name_obj) {
        var t_array = new Array();
        var type_obj = this.whatIsIt(name_obj);
        //console.log('addparams',name_obj,type_obj);
        if (type_obj == "Array") {
            t_array = name_obj;
        } else {
            t_array.push(name_obj);
        }
        for (var t_key in t_array) {
            var obj = t_array[t_key];
            for (var key in obj) {
                this.addparam(key, obj[key]);
            }
        }
    },
    addparam: function(name_obj, value) {
        var namespace_ = this.getnamespace();
        if (name_obj.indexOf(this.namespace) > -1)
            namespace_ = "";
        if (name_obj.indexOf('.') >= 0) {
            var dotSplit = name_obj.split('.');
            var firstLevel = dotSplit[0];
            var secondLevel = dotSplit[1];
            if (this.params.hasOwnProperty(firstLevel))
                this.params[firstLevel][secondLevel] = value;
            else {
                this.params[firstLevel] = {
                    [secondLevel]: value
                };
            }
            return;
        } else {
            var exsist = this.check_param_exsist(name_obj);
            if (!exsist)
                this.params[namespace_ + name_obj] = value;
            else { //esiste e devo strasformare in array, se non lo è già
                var old_value = this.params[namespace_ + name_obj];
                var old_valu_isArray = (this.whatIsIt(old_value) == "Array") ? true : false;
                var value_isArray = (this.whatIsIt(value) == "Array") ? true : false;
                if (old_valu_isArray) { //old è array
                    if (value_isArray) {
                        var newArr = this.params[namespace_ + name_obj].concat(value);
                        this.params[namespace_ + name_obj] = newArr;
                    } else {
                        this.params[namespace_ + name_obj].push(value);
                    }
                } else {
                    if (value_isArray) {
                        var newArr = value.push(old_value);
                        this.params[namespace_ + name_obj] = newArr;
                    } else {
                        this.params[namespace_ + name_obj] = new Array(old_value, value);
                    }
                }
            }
        }
    },
    check_param_exsist: function(key) {
        var has_prop = false;
        if (this.namespace.length) {
            if (!(key.indexOf(this.namespace) > -1))
                key = this.namespace + key;
        }
        if ((this.params).hasOwnProperty(key)) {
            var has_prop = true;
        }
        return has_prop;
    },
    setcalltype: function(type) { this.type = type; },
    getcalltype: function() { return this.type; },
    seturl: function(url) { this.url = url; },
    geturl: function() { return this.url; },
    flush: function() {
        this.flush_container_ids();
        this.flush_params();
        this.flush_datapost();
    },
    flush_params: function() { this.setparams(new Object()); },
    flush_datapost: function() { this.datapost = new Object(); },
    flush_container_ids: function() { this.setcontainer_ids(new Array()); },
    ajaxsend: function(callbackfunction) {
        var sData = this.datapost;
        if (this.addDataBody)
            sData = JSON.stringify(this.datapost);
        var ret = { "message": "Error", "errorMessage": "", "total": -1, "data": [], "success": false, "stackTrace": "" };
        jQuery.ajax({
            async: false,
            type: this.type,
            mimeType: this.mimeType, //'application/json' 
            data: sData,
            url: this.url,
            processData: this.processData,
            contentType: this.contentType,
            enctype: this.enctype,
            /* xhrFields: {
                 withCredentials: true
             } */
            timeout: 20000,
            crossDomain: true,
            cache: this.cache,
            /*  xhr: function() {
                  return xhr;
              },*/
            success: function(resp, textStatus, jqXHR) {
                ret = resp;
                // var prendo2 = getResponseHeaders(jqXHR);
                var prendo = jqXHR.getResponseHeader("Cookie");
                //   console.log('jqXHR', jqXHR);

            },
            error: function(jqXHR, textStatus, errorThrown) { //inserire errore ritorno
                ret.stackTrace = errorThrown;
                ret.errorMessage = textStatus;
                if (callbackfunction != undefined) {
                    if (callbackfunction.beforeSend != undefined)
                        opts.data = executeFunctionByName(callbackfunction.beforeSend, window, xhr, opts);

                } else return ret;
            },
            beforeSend: function(xhr, opts) {
                //    console.log('jqXHR1', jqXHR);
                const requestpath = getPageJsonPath();
                if (requestpath != undefined && requestpath != 'undefined' && requestpath != null && requestpath != 'null') {
                    xhr.setRequestHeader("requestjsonpath", JSON.stringify(requestpath));
                }
                //  var xtk = etctoken.toString();
                //  xhr.setRequestHeader("Authorization", "Bearer " + etctoken);
                const jwtlfr2 = localStorage.getItem('DYM'); //dymJWT
                xhr.setRequestHeader("Authorization", "Bearer " + jwtlfr2);
                const jwtextrainfo = localStorage.getItem('DYM_EXTRA'); //dymJWT
                xhr.setRequestHeader("extrainfo", jwtextrainfo);
                const authorizationtk = localStorage.getItem('DYMAT'); //dymJWT
                if (authorizationtk != undefined && authorizationtk != 'undefined' && authorizationtk != null && authorizationtk != 'null') {
                    xhr.setRequestHeader("authorizationtk", authorizationtk);
                    //xhr.setRequestHeader("authorizationtk", "Bearer " + authorizationtk);
                }
                /*
                if (authorizationtk != undefined && authorizationtk != 'undefined' && authorizationtk != null && authorizationtk != 'null')
                                    xhr.setRequestHeader("authorizationtk", "Bearer " + authorizationtk);
                                else
                                    xhr.setRequestHeader("Authorization", "Bearer " + jwtlfr2);
                */
                // xhr.setRequestHeader("Authorization", "Bearer " + etctoken.access_token);
                //   xhr.setRequestHeader("dymertoken" + etctoken.access_token);
                //    console.log(' token aggunt', xtk, etctoken);
                // console.log(' token atob(b64)', atob(b64));
                if (typeof dymerOauth !== 'undefined') {
                    var usertoken = dymerOauth.getToken();
                    xhr.setRequestHeader("dymertoken", usertoken);
                    if (typeof keycloak !== 'undefined') {
                        xhr.setRequestHeader("Authorization", "Bearer " + keycloak.token);
                        console.log(' keycloak.toke', keycloak.token);

                    }
                    //  opts.data.append("DymerToken", usertoken);
                }
                if (callbackfunction != undefined)
                    if (callbackfunction.beforeSend != undefined)
                        opts.data = executeFunctionByName(callbackfunction.beforeSend, window, xhr, opts);
                    // (callbackfunction.beforeSend).call(xhr,settings);
            },
            complete: function(jqXHR, textStatus) {
                /*  if ((xhr.responseURL).includes('auth/realms/Demo-Realm/protocol/openid-connect/auth'))
                      window.location = xhr.responseURL;
                  // var prendo2 = getResponseHeaders(jqXHR);
                  console.log('xhr.responseURL', xhr.responseURL);
                  console.log('jqXHR4', jqXHR);*/
            },
        });
        return ret;
    },
    setconfig: function(obj) {
        this.url = (obj.url != undefined) ? obj.url : this.url; //url chiamata
        this.type = (obj.type != undefined) ? obj.type : this.type; //tipo chiamata
        this.mimeType = (obj.mimeType != undefined) ? obj.mimeType : this.mimeType; //tipo ritorno
        this.namespace = (obj.namespace != undefined) ? obj.namespace : this.namespace; //namespace

        this.serializedata = (obj.serializedata != undefined) ? obj.serializedata : this.serializedata; //namespace
        this.addDataBody = (obj.addDataBody != undefined) ? obj.addDataBody : this.addDataBody; //namespace
        this.processData = (obj.processData != undefined) ? obj.processData : this.processData; //namespace
        this.contentType = (obj.contentType != undefined) ? obj.contentType : this.contentType;
        this.enctype = (obj.enctype != undefined) ? obj.enctype : this.enctype;
        this.serializeJSON = (obj.serializeJSON != undefined) ? obj.serializeJSON : this.serializeJSON;
        this.cache = (obj.cache != undefined) ? obj.cache : this.cache;
        //id dei form da serializzare
        if (obj.container_ids != undefined)
            this.setcontainer_ids(obj.container_ids)
        if (obj.params != undefined)
            this.addparams(obj.params);
    },
    whatIsIt: function(object) {
        var stringConstructor = "test".constructor;
        var arrayConstructor = [].constructor;
        var objectConstructor = {}.constructor;
        if (object === null) {
            return "null";
        } else if (object === undefined) {
            return "undefined";
        } else if (object.constructor === stringConstructor) {
            return "String";
        } else if (object.constructor === arrayConstructor) {
            return "Array";
        } else if (object.constructor === objectConstructor) {
            return "Object";
        } else {
            return "don't know";
        }
    },
    serializeAnything: function(id) {
        var self_ = this;
        if (self_.serializeJSON) {
            var a = $(id).serializeJSON();
            //	console.log('aq', a);
            self_.addparams(a);
            return this.getparams();
        }
        var els = $(id).find(':input').get();
        $.each(els, function() {
            if (this.name /*&& !this.disabled*/ && (this.checked || /select|input|textarea/i.test(this.nodeName) || /text|hidden|password/i.test(this.type)) && (!/file/i.test(this.type))) {
                var val = $(this).val();

                var val = $(this).val();
                var isPicker = $(this).hasClass('selectpicker');
                var ismulti = $(this).attr('multiple');
                var nm = $(this).attr("name");
                console.log($(this).attr("name"), val, isPicker, ismulti);
                if (isPicker && ismulti) {
                    var ind = 0;
                    val.forEach(elvalue => {
                        var nnm = nm + "[" + ind + "]";
                        console.log('addparam', nnm, elvalue);
                        self_.addparam(nnm, elvalue);
                        ind++;
                    });
                    delete self_.params[nm];
                } else {
                    self_.addparam(encodeURIComponent(this.name), val);
                }
            }
        });
        return this.getparams();
    }
}

function executeFunctionByName(functionName, context /*, args */ ) {
    var args = Array.prototype.slice.call(arguments, 2);
    var namespaces = functionName.split(".");
    var func = namespaces.pop();
    for (var i = 0; i < namespaces.length; i++) {
        context = context[namespaces[i]];
    }
    return context[func].apply(context, args);
}

function getResponseHeaders(jqXHR) {
    jqXHR.responseHeaders = {};
    var headers = jqXHR.getAllResponseHeaders();
    headers = headers.split("\n");
    headers.forEach(function(header) {
        header = header.split(": ");
        var key = header.shift();
        if (key.length == 0) return
            // chrome60+ force lowercase, other browsers can be different
        key = key.toLowerCase();
        jqXHR.responseHeaders[key] = header.join(": ");
    });
}
(function($) {
    $.fn.showLoader = function(option) {
        this.append('<div class="loading-animation-ajax" ><div class="spinner-border" style="width: 3rem; height: 3rem;" role="status">' +
            '<span class="sr-only">Loading...</span>' +
            '	</div></div>');
        if (option != undefined) {
            if (option.cssclass != undefined)
                this.find('.loading-animation-ajax').addClass(option.cssclass);
            if (option.css != undefined)
                this.find('.loading-animation-ajax').css(option.css);
        }
    };
    $.fn.hideLoader = function() {
        this.find('.loading-animation-ajax').remove();
    };
    $.fn.extend({
        trackChanges: function() {
            this.removeAttr("tarckchanged");
            $("input, textarea, select", this).change(function() {
                $(this).closest('.dymermodal').attr("tarckchanged", true);
            });
        },
        trackisChanged: function() {
            return this.attr("tarckchanged");
        }
    });
})(jQuery);