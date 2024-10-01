function activeLeftMenu(el) {
    $(".sidebar-wrapper li").removeClass("active");
    el.addClass("active");
}



function startConfetti(){

    var text = document.getElementById("text")
    text.textContent="Start deploy";
    text.className="text hidden";
     
    var icon = document.getElementById("icon")
    icon.className="fa-solid fa-spinner animate-spin";
    
    var button = document.getElementById("button-conf")
    button.className = "loading"
    const rect = button.getBoundingClientRect();
    const center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
    const origin = {
        x: center.x / window.innerWidth,
        y: center.y / window.innerHeight
    };  
    
    // Canvas && confetti settings
    var myCanvas = document.createElement('canvas');
    document.body.appendChild(myCanvas);
    const defaults = {
      disableForReducedMotion: true
    };
    var colors = ['#757AE9', '#28224B', '#EBF4FF'];
    var myConfetti = confetti.create(myCanvas, {});
      
    // Confetti function to be more realistic
    function fire(particleRatio, opts) {
      confetti(
        Object.assign({}, defaults, opts, {
          particleCount: Math.floor(100 * particleRatio)
        })
      );
    }
    // Finished state confetti
    setTimeout(() => {
     icon.className="";
     button.className = "success"
     fire(0.25, {
        spread: 26,
        startVelocity: 10,
        origin,
        colors,
      });
      fire(0.2, {
        spread: 60,
        startVelocity: 20,
        origin,
        colors,
      });
      fire(0.35, {
        spread: 100,
        startVelocity: 15,
        decay: 0.91,
        origin,
        colors,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 10,
        decay: 0.92,
        origin,
        colors,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 20,
        origin,
        colors,
      })
    
    }, "3000")
    // Finished state text
    setTimeout(() => { 
      text.textContent="Finished";
      text.className="text";
      icon.className="fa-solid fa-check";
    }, 3500)
    // Reset animation
    setTimeout(() => { 
      text.textContent="Start deploy";
      icon.className="fa-solid fa-play";
      button.className = ""
      }, 6000)
    }


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