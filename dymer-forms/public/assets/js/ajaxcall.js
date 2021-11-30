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
	setnamespace: function (namespace) { this.namespace = namespace; },
	getnamespace: function () { return this.namespace; },
	checknamespace: function () { return this.namespace.length; },
	setmimeType: function (mimeType) { this.mimeType = mimeType; },
	getmimeType: function () { return this.mimeType; },
	setdatapost: function (datapost) { this.datapost = datapost; },
	getdatapost: function () { return this.datapost; },
	setcontainer_ids: function (container_ids) {
		var is_array_ids = this.whatIsIt(container_ids) == "Array" ? true : false;
		if (is_array_ids)
			this.container_ids = container_ids;
		else
			this.container_ids.push(container_ids);
	},
	addcontainer_ids: function (c) {
		var is_array_c = this.whatIsIt(c) == "Array" ? true : false;
		if (is_array_c) {
			var newArr = this.container_ids.concat(c);
			this.container_ids = newArr;
		}
		else
			this.container_ids.push(c);
	},
	getcontainer_ids: function () { return this.container_ids; },
	getcontainer_ids: function () { return this.container_ids; },
	send: function (callbackfunction) {
		var self_ = this;
		if (this.container_ids.length) {
			for (var k in self_.container_ids) {
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
		return this.ajaxsend(callbackfunction);
	},
	getdatapost: function () { return this.datapost; },
	setparams: function (obj) {
		this.params = new Object();
		this.addparams(obj);
	},
	setparam: function (k, v) {
		this.addparam(k, v);
	},
	getparams: function () { return this.params; },
	addparams: function (name_obj) {
		var t_array = new Array();
		var type_obj = this.whatIsIt(name_obj);
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
	addparam: function (name_obj, value) {
		var namespace_ = this.getnamespace();
		if (name_obj.indexOf(this.namespace) > -1)
			namespace_ = "";
		if (name_obj.indexOf('.')>=0) {
			var dotSplit = name_obj.split('.');
			var firstLevel = dotSplit[0];
			var secondLevel = dotSplit[1];
			if (this.params.hasOwnProperty(firstLevel))
				this.params[firstLevel][secondLevel] = value;
			else {
				this.params[firstLevel] = { [secondLevel]: value };
			}
			return;
		}
		else {
			var exsist = this.check_param_exsist(name_obj);
			if (!exsist)
				this.params[namespace_ + name_obj] = value;
			else {//esiste e devo strasformare in array, se non lo è già
				var old_value = this.params[namespace_ + name_obj];
				var old_valu_isArray = (this.whatIsIt(old_value) == "Array") ? true : false;
				var value_isArray = (this.whatIsIt(value) == "Array") ? true : false;
				if (old_valu_isArray) {//old è array
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
					}
					else {
						this.params[namespace_ + name_obj] = new Array(old_value, value);
					}
				}
			}
		}
	},
	check_param_exsist: function (key) {
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
	setcalltype: function (type) { this.type = type; },
	getcalltype: function () { return this.type; },
	seturl: function (url) { this.url = url; },
	geturl: function () { return this.url; },
	flush: function () {
		this.flush_container_ids();
		this.flush_params();
		this.flush_datapost();
	},
	flush_params: function () { this.setparams(new Object()); },
	flush_datapost: function () { this.datapost = new Object(); },
	flush_container_ids: function () { this.setcontainer_ids(new Array()); },
	ajaxsend: function (callbackfunction) {
		var ret = { "message": "Error", "errorMessage": "", "total": -1, "data": [], "success": false, "stackTrace": "" };
		jQuery.ajax({
			async: false,
			type: this.type,
			mimeType: this.mimeType,//'application/json' 
			data: this.datapost,
			url: this.url,
			success: function (resp) {
				ret = resp;
			},
			error: function (jqXHR, textStatus, errorThrown) {//inserire errore ritorno

				ret.stackTrace = errorThrown;
				ret.errorMessage = textStatus;
				return ret;
			},
			beforeSend: function (xhr, opts) {
				if (callbackfunction != undefined)
					if (callbackfunction.beforeSend != undefined)
						opts.data = executeFunctionByName(callbackfunction.beforeSend, window, xhr, opts);
				// (callbackfunction.beforeSend).call(xhr,settings);
			},
			complete: function () {

			}
		});
		return ret;
	},
	setconfig: function (obj) {
		this.url = (obj.url != undefined) ? obj.url : this.url;					//url chiamata
		this.type = (obj.type != undefined) ? obj.type : this.type;								//tipo chiamata
		this.mimeType = (obj.mimeType != undefined) ? obj.mimeType : this.mimeType;		//tipo ritorno
		this.namespace = (obj.namespace != undefined) ? obj.namespace : this.namespace;					//namespace
		//id dei form da serializzare
		if (obj.container_ids != undefined)
			this.setcontainer_ids(obj.container_ids)
		if (obj.params != undefined)
			this.addparams(obj.params);
	},
	whatIsIt: function (object) {
		var stringConstructor = "test".constructor;
		var arrayConstructor = [].constructor;
		var objectConstructor = {}.constructor;
		if (object === null) {
			return "null";
		}
		else if (object === undefined) {
			return "undefined";
		}
		else if (object.constructor === stringConstructor) {
			return "String";
		}
		else if (object.constructor === arrayConstructor) {
			return "Array";
		}
		else if (object.constructor === objectConstructor) {
			return "Object";
		}
		else {
			return "don't know";
		}
	},
	serializeAnything: function (id) {
		var self_ = this;
		var els = $(id).find(':input').get();
		$.each(els, function () {
			if (this.name /*&& !this.disabled*/ && (this.checked || /select|input|textarea/i.test(this.nodeName) || /text|hidden|password/i.test(this.type))) {
				var val = $(this).val();

				self_.addparam(encodeURIComponent(this.name), val);
			}
		});
		return this.getparams();
	}
}

function executeFunctionByName(functionName, context /*, args */) {
	var args = Array.prototype.slice.call(arguments, 2);
	var namespaces = functionName.split(".");
	var func = namespaces.pop();
	for (var i = 0; i < namespaces.length; i++) {
		context = context[namespaces[i]];
	}
	return context[func].apply(context, args);
}