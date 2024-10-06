function activeLeftMenu(el) {
    $(".sidebar-wrapper li").removeClass("active");
    el.addClass("active");
}

 

$(document).ready(function() {
    // Javascript method's body can be found in assets/assets-for-demo/js/demo.js
    var current = location.pathname;
    // console.log("ciaco ciao", current);
    $(".sidebar-wrapper li").removeClass("active");
    $(".sidebar-wrapper li a").each(function() {
        var $this = $(this);
        // if the current path is like this link, make it active
        if ($this.attr("href") === current) {
            $this.parent('li').addClass("active");
            if (
                $(this)
                .closest(".kmssublist")
                .closest("li")
                .children("a")
                .hasClass("haschild")
            ) {
                $(this)
                    .closest(".kmssublist")
                    .closest("li")
                    .children("a")
                    .next()
                    .toggle("fade");
            }
        }
    });
    $(".sidebar-wrapper li a").on("click", function() {
        $(".sidebar-wrapper li").removeClass("active");
        $(this).parent("li").addClass("active");

        if ($(this).hasClass("haschild")) {
            $(this)
                .next()
                .toggle("fade");
        }
    });
    $(".main-panel").scroll(function() {
        if ($(this).scrollTop() > 50) {
            $('#back-to-top').fadeIn();
        } else {
            $('#back-to-top').fadeOut();
        }
    });


    $('.form-wizard-next-btn').click(function() {
		var parentFieldset = $(this).parents('.wizard-fieldset');
		var currentActiveStep = $(this).parents('.form-wizard').find('.form-wizard-steps .active');
		var next = $(this);
		var nextWizardStep = true;
		parentFieldset.find('.wizard-required').each(function(){
			var thisValue = $(this).val();

			if( thisValue == "") {
				$(this).siblings(".wizard-form-error").slideDown();
				nextWizardStep = false;
			}
			else {
				$(this).siblings(".wizard-form-error").slideUp();
			}
		});
		if( nextWizardStep) {
			next.parents('.wizard-fieldset').removeClass("show","400");
			currentActiveStep.removeClass('active').addClass('activated').next().addClass('active',"400");
			next.parents('.wizard-fieldset').next('.wizard-fieldset').addClass("show","400");
			$(document).find('.wizard-fieldset').each(function(){
				if($(this).hasClass('show')){
					var formAtrr = $(this).attr('data-tab-content');
					$(document).find('.form-wizard-steps .form-wizard-step-item').each(function(){
						if($(this).attr('data-attr') == formAtrr){
							$(this).addClass('active');
							var innerWidth = jQuery(this).innerWidth();
							var position = jQuery(this).position();
							$(document).find('.form-wizard-step-move').css({"left": position.left, "width": innerWidth});
						}else{
							$(this).removeClass('active');
						}
					});
				}
			});
		}
	});

    $('.form-wizard-previous-btn').click(function() {
		var counter = parseInt($(".wizard-counter").text());;
		var prev =$(this);
		var currentActiveStep = $(this).parents('.form-wizard').find('.form-wizard-steps .active');
		prev.parents('.wizard-fieldset').removeClass("show","400");
		prev.parents('.wizard-fieldset').prev('.wizard-fieldset').addClass("show","400");
		currentActiveStep.removeClass('active').prev().removeClass('activated').addClass('active',"400");
		$(document).find('.wizard-fieldset').each(function(){
			if($(this).hasClass('show')){
				var formAtrr = $(this).attr('data-tab-content');
				$(document).find('.form-wizard-steps .form-wizard-step-item').each(function(){
					if($(this).attr('data-attr') == formAtrr){
						$(this).addClass('active');
						var innerWidth = $(this).innerWidth();
						var position = $(this).position();
						$(document).find('.form-wizard-step-move').css({"left": position.left, "width": innerWidth});
					}else{
						$(this).removeClass('active');
					}
				});
			}
		});
	});
 
    $(".form-control").on('focus', function(){
		var tmpThis = $(this).val();
		if(tmpThis == '' ) {
			$(this).parent().addClass("focus-input");
		}
		else if(tmpThis !='' ){
			$(this).parent().addClass("focus-input");
		}
	}).on('blur', function(){
		var tmpThis = $(this).val();
		if(tmpThis == '' ) {
			$(this).parent().removeClass("focus-input");
			$(this).siblings('.wizard-form-error').slideDown("3000");
		}
		else if(tmpThis !='' ){
			$(this).parent().addClass("focus-input");
			$(this).siblings('.wizard-form-error').slideUp("3000");
		}
	});

    $(".form-control").on('focus', function(){
		var tmpThis = $(this).val();
		if(tmpThis == '' ) {
			$(this).parent().addClass("focus-input");
		}
		else if(tmpThis !='' ){
			$(this).parent().addClass("focus-input");
		}
	}).on('blur', function(){
		var tmpThis = $(this).val();
		if(tmpThis == '' ) {
			$(this).parent().removeClass("focus-input");
			$(this).siblings('.wizard-form-error').slideDown("3000");
		}
		else if(tmpThis !='' ){
			$(this).parent().addClass("focus-input");
			$(this).siblings('.wizard-form-error').slideUp("3000");
		}
	});

    document.addEventListener('DOMContentLoaded', () => {
        const output = document.querySelector('.text');
      
        const handleCheck = (event) => {
          output.textContent = event.target.value;
        };
      
        const handleSelection = (event) => {
          if (!event.defaultPrevented && event.detail > 1) {
            event.preventDefault();
          }
        };
      
        document.addEventListener('change', (event) => {
          if (event.target.matches('input[type="radio"]')) {
            handleCheck(event);
          }
        });
      
        document.addEventListener('mousedown', (event) => {
          const label = event.target.closest('label');
          if (label) {
            handleSelection(event);
          }
        });
    });

});



   
function urlToPromiseZip(url) {
    return new Promise(function(resolve, reject) {
        JSZipUtils.getBinaryContent(url, function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}


//selecting all required elements
const dropArea = document.querySelector(".drag-area"),
dragText = dropArea.querySelector("header"),
button = dropArea.querySelector("button"),
input = dropArea.querySelector("input");
let file; //this is a global variable and we'll use it inside multiple functions

button.onclick = ()=>{
  input.click(); //if user click on the button then the input also clicked
}

input.addEventListener("change", function(){
  //getting user select file and [0] this means if user select multiple files then we'll select only the first one
  file = this.files[0];
  dropArea.classList.add("active");
  showFile(); //calling function
});


//If user Drag File Over DropArea
dropArea.addEventListener("dragover", (event)=>{
  event.preventDefault(); //preventing from default behaviour
  dropArea.classList.add("active");
  dragText.textContent = "Release to Upload File";
});

//If user leave dragged File from DropArea
dropArea.addEventListener("dragleave", ()=>{
  dropArea.classList.remove("active");
  dragText.textContent = "Drag & Drop to Upload File";
});

//If user drop File on DropArea
dropArea.addEventListener("drop", (event)=>{
  event.preventDefault(); //preventing from default behaviour
  //getting user select file and [0] this means if user select multiple files then we'll select only the first one
  file = event.dataTransfer.files[0];
  showFile(); //calling function
});

function showFile(){
  let fileType = file.type; //getting selected file type
  let validExtensions = [".csv", "csv" ]; //adding some valid image extensions in array
  if(validExtensions.includes(fileType)){ //if user selected file is an image file
    let fileReader = new FileReader(); //creating new FileReader object
    fileReader.onload = ()=>{
      let fileURL = fileReader.result; //passing user file source in fileURL variable
   }
    fileReader.readAsDataURL(file);
    getFieldByCSV();
  }else{
    alert("This is not a CSV File!");
    dropArea.classList.remove("active");
    dragText.textContent = "Drag & Drop to Upload File";
  }
}