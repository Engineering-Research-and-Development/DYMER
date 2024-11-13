/*
Copyright 2017 Ziadin Givan

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

https://github.com/givanz/Vvvebjs
*/

Vvveb.Gui.download =
function () {
    let assets = [];
    
    function addUrl(url, href, binary) {
        assets.push({url, href, binary});
    }

    let html = Vvveb.Builder.frameHtml;

    //stylesheets
    html.querySelectorAll("link[href$='.css']", html).forEach(function(e, i) {
        addUrl(e.href, e.getAttribute("href"), false);
    });

    //javascripts
     html.querySelectorAll("script[src$='.js']", html).forEach(function(e, i) {
        addUrl(e.src, e.getAttribute("src"), false);
    });
    
    //images
     html.querySelectorAll("img[src]", html).forEach(function(e, i) {
        addUrl(e.src, e.getAttribute("src"), true);
    });


    let zip = new JSZip();
    let promises = [];
    
    for (i in assets) {
        let asset = assets[i];
        let url = asset.url;
        let href = asset.href;
        let binary = asset.binary;
        
        let filename = href.substring(href.lastIndexOf('/')+1);
        let path = href.substring(0, href.lastIndexOf('/')).replace(/\.\.\//g, "");
        if (href.indexOf("://") > 0) {
			//ignore path for external assets
			path = "";
		}

        promises.push(new Promise((resolve, reject) => {

          let request = new XMLHttpRequest();
          request.open('GET', url);
          if (binary) {
            request.responseType = 'blob';
          } else {
            request.responseType = 'text';
          }

          request.onload = function() {
            if (request.status === 200) {
              resolve({url, href, filename, path, binary, data:request.response, status:request.status});
            } else {
              //reject(Error('Error code:' + request.statusText));
              console.error('Error code:' + request.statusText);
              resolve({status:request.status});
            }
          };

          request.onerror = function() {
              reject(Error('There was a network error.'));
          };

          // Send the request
          try {
			request.send();          
		 } catch (error) {
			  console.error(error);
		 }
     }));
    }
    
    Promise.all(promises).then((data) => {
        let html = Vvveb.Builder.getHtml();
        
        for (i in data) {
            let file = data[i];
            let folder = zip;
            
            if (file.status == 200) {
				if (file.path) {
					file.path = file.path.replace(/^\//, "");
					folder = zip.folder(file.path);
				} else {
					folder = zip;
				}
				
				let url =  (file.path ? file.path + "/" : "") + file.filename.trim().replace(/^\//, "");
				html = html.replace(file.href, url);
								
				folder.file(file.filename, file.data, {base64: file.binary});
			}
        }
        
        zip.file("index.html", html);
        zip.generateAsync({type:"blob"})
        .then(function(content) {
            saveAs(content, Vvveb.FileManager.getCurrentPage());
        });
    }).catch((error) => {
        console.log(error)
  })
};
