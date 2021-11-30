var config_form_call = {};
var ajaxcall_form=null;
 $.getScript("http://localhost:4747/public/assets/js/utility.js", function() {
	try {
		  config_form_call = {
				url : serviceEntitiesUrl 
			};
			ajaxcall_form = new Ajaxcall(config_form_call);
	} catch (e) {
		// TODO: handle exception
		console.error(e);
	} 
 }); 

 

function actionEventForm(el, senderForm, callbackfunction,callerForm,useGritter) {
	//	var check_session=checkSession();
	//	if(!check_session)
	//		return false;
	// console.log("senderForm ",senderForm);

		if (senderForm == undefined)
			senderForm = "#" + el.closest('.senderForm').attr("id");
		if (el.attr("disabled") != undefined)
			return false;
		
		
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
		setCheck(senderForm);
		 
		 ajaxcall_form.flush();
		 ajaxcall_form.addcontainer_ids(senderForm);
		var instance={
			"instance":{
				"index":"webcontent",
				"type":"test_itrial"
				}};
		ajaxcall_form.addparams(instance);	
		//let beforeSend={"beforeSend":"beforeSendEntity"};
	var ret = ajaxcall_form.send();
	//	var ret = ajaxcall_form.send(beforeSend);
		console.log("sender",senderForm);
		 console.log("ajaxcall_form ",ajaxcall_form.getparams());
		 console.log("ajaxcall_form ",ajaxcall_form.getdatapost());
		 console.log("geturl ",ajaxcall_form.geturl());
		 console.log("getcalltype ",ajaxcall_form.getcalltype());
		var gr_title = "";
		var gr_text = "";
		//if(useGritter)
		//{  gr_title = ret.info_action.title;
		//  gr_text = ret.info_action.msg;
		//}
		if (ret.success) {
			if (callerForm != undefined)
				senderForm = callerForm;
			
			if (callbackfunction != undefined) {
				callbackfunction.call();
			}
			
			//Liferay.Portlet.refresh('#p_p_id'+pnamespace, data);
			//Liferay.Portlet.refresh('#p_p_id_safeandsmartproduction_event_WAR_safeandsmartproduction_eventportlet_', data);
		} else {
			
			if(useGritter)
				useAlert(senderForm, gr_title,
						gr_text);
		}
		return false;
	}

 
//-------------------

 function beforeSendEntity(xhr,settings){
console.log("xhr",xhr);
console.log("settings",settings); 
var el = {};
var pairs = (settings.data).split('&');
for(i in pairs){
	var split = pairs[i].split('=');
	var key=decodeURIComponent(split[0]);
	var value= decodeURIComponent(split[1]);
	if(key.indexOf('.'))
	{
		var dotSplit = key.split('.');
		var firstLevel=dotSplit[0];
		var secondLevel=dotSplit[1];
	
		if(el.hasOwnProperty(firstLevel))
			el[firstLevel][secondLevel]=value;
		else{
			el[firstLevel]={[secondLevel]:value};

		}
	}	
	else
	el[key] = value;
}
var obj={
"instance":{
	"index":"webcontent",
	"type":"industrialtrial"
	}};
	Object.assign(obj, el);
	console.log("obj",obj);
	return obj;
 }
/*function loadHtml(sourceUrl,target,datapost,delaytime,action){
	 if(delaytime==undefined)
		 delaytime=1;
		var check_session=checkSession();
		if(!check_session)
			return false;
		var option = {
			cssclass : 'spinnerLoader'
		};
		 
		setTimeout(function() {
		var config_call_html = {
			url : sourceUrl,
			namespace : pnamespaceAssistant,
			mimeType : "html"
		};
		var ajaxcall_html = new Ajaxcall(config_call_html);
		ajaxcall_html.flush();
		ajaxcall_html.addparams(datapost);
		var ret = ajaxcall_html.send();
		//console.log("ret",ret);
		ret=  jQuery.parseJSON(ret);
		if(ret['html']){
			console.hasOwnProperty("hasOwnProperty yes" );
			ret = $.parseHTML( ret.html );
			console.hasOwnProperty("ret2 ",ret );
			}
		
		if(action==undefined  )
		{	$(target).html("");
		$(target).html(ret);
		}
		
		if( action=="replace")
		{	$(target).html("");
		$(target).html(ret);
		}
		if(action=="append")
			$(target).append(ret);
		}, delaytime);

	 
}*/
 
 
 
 
 
