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