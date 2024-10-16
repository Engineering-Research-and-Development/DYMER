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

 
});

function toggleDarkMode() {
    let isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
  }
  
  // On page load
  document.addEventListener('DOMContentLoaded', (event) => {
    if (localStorage.getItem('darkMode') === 'enabled') {
      document.body.classList.add('dark-mode');
    }
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


 
