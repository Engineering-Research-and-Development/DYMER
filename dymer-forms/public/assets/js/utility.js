
var serviceEntitiesUrl="http://127.0.0.1:1358/api/v1/entity";
function setCheck(senderForm){
	$(senderForm + ' [type="checkbox"] ').each(function() {
		checkvalue($(this));
		 
	});
	return;
}

function checkvalue(el){
	
	 if(el.is(":checked"))
		 el.val("true");
	 else
		 el.val("false");
}
function useGritter(title, text) {
	if ($.gritter) {
		$.gritter.add({
			title : title,
			text : text,
			image : '/img/cosmo/basic/023_white.png',
			time : 5000,
			class_name : 'gritter-success'
		});
	}
}

function useAlert(id, title, msg_text) {
	$(id + ' .ajaxerror .txt_msg').text(msg_text);
	$(id + ' .ajaxerror').show();

}
function check_required(senderForm) {
	var valid = true;
	$(senderForm + " [required]").each(function() {

		var type = $(this).attr("type");
		var val = ($(this).val()).trim();
		if (!(val.length > 0)) {
			$(this).addClass("error_border");
			valid = false;
		} else
			$(this).removeClass("error_border");
	});
	return valid;
}
function checkSession(){//active - warned -expired
	//return true;
	try{
		if(Liferay.Session!=undefined){
		if(Liferay.Session.get('sessionState')=="active")
			return true;
		else
			$(".continerSandS").html('<div class="alert alert-error">Sessione scaduta!!! Effettuare il login</div>');
		}else
			return true;
	}catch(err) {
		console.error(err);
	}finally{
	}
	return false;
}
 