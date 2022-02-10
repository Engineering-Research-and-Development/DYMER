var serverUrl = "";
let cdnurl = "";
let csd = "";

function preloadKmsView() {

    /* var ifrm = document.createElement("iframe");
     ifrm.setAttribute("src", "http://localhost:8080");
     ifrm.style.width = "640px";
     ifrm.style.height = "480px";
     document.body.appendChild(ifrm);*/
    var libraryurl = document.getElementById("dymerurl").src;
    // var parser = document.createElement('a');
    // parser.href = libraryurl;
    var n = libraryurl.indexOf("/public/cdn/");
    serverUrl = libraryurl.substring(0, n);
    csd = serverUrl;
    //serverUrl = parser.protocol + "//" + parser.host;
    cdnurl = serverUrl + "/public/cdn/";
    var script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("data-senna-off", "true");
    script.setAttribute("src", cdnurl + "js/utility.js");
    script.onload = function() {
        //console.log("avvio callback 1");
        loadRequireView();
    }
    document.head.appendChild(script);
}
preloadKmsView();