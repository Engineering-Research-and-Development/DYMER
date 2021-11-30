let serverUrl = "";
let cdnurl = "";

function preloadKmsForm() {
    var libraryurl = document.getElementById("dymerurl").src;
    var parser = document.createElement('a');
    parser.href = libraryurl;
    serverUrl = parser.protocol + "//" + parser.host;
    cdnurl = serverUrl + "/public/cdn/";
    var script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", cdnurl + "js/utility.js");
    script.onload = function() {
        //	console.log("avvio callback 1");
        loadRequireForm();
    }
    document.head.appendChild(script);
}
preloadKmsForm();