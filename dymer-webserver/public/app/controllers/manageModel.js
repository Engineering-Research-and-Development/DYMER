angular.module('formBuilderControllers', [])

.controller('manageModel', function($scope, $http, $window, $route, $rootScope) {
    var baseContextPath = $rootScope.globals.contextpath;
    //  console.log("UNO", $scope.listaForms);
    //listTempl
    // $scope.listaForms = [];
    // console.log('get my list');

   // $('.tab-content').perfectScrollbar();
 new PerfectScrollbar(".tab-content"),
    $scope.$on("$destroy", function() {
        /*Vvveb.baseUrl = document.currentScript ? document.currentScript.src.replace(/[^\/]*?\.js$/, '') : '';
            
                Vvveb.ComponentsGroup = {};
                Vvveb.BlocksGroup = {};
                Vvveb.listResources._structures = [];
                Vvveb.listResources._models = [];
                Vvveb.listResources._templates = [];
                Vvveb.Components._components = {};
            
                Vvveb.Components._nodesLookup = {};
            
                Vvveb.Components._attributesLookup = {};
            
                Vvveb.Components._classesLookup = {};
            
                Vvveb.Components._classesRegexLookup = {};
            
                Vvveb.Blocks._blocks = {};
            
                Vvveb.Builder.component = {};*/
    });
    $scope.$on('$viewContentLoaded', function() {
        // console.log("DUE");
        //  console.log('te');
        //{ "query": { "instance._index": { $ne: "general" } } }
        let listpages = [];
        var serviceurl = baseContextPath + '/api/forms/api/v1/form';
        var par = { "query": { "instance._index": { "$ne": "general" } } };
        //  par = {};
        $http({
            url: serviceurl,
            method: "GET",
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            params: par,
        }).then(function(ret) {
            //$http.get(serviceurl, this.entData).then(function(ret) {
            //	   $http.get(serviceurl, this.entData).then(function(ret) {
            //console.log('Data controller lists', ret);
            var arrLIst = ret.data.data;
            arrLIst.forEach(function(element) {

                // console.log("element x", element);
                var singlePage = {
                    name: element._id,
                    title: element.title,
                    html: {
                        id: "",
                        content: "",
                        url: serviceurl + "/content/"
                    },
                    instance: element.instance[0]._index,
                    url: serviceurl + "/content/" + element._id,
                    assets: [],
                    description: element.description
                };

                (element.files).forEach(function(elfiles) {

                    if (elfiles.contentType == "text/html") {
                        singlePage.url = serviceurl + "/content/" + element.instance[0]._index + "/" + elfiles._id
                        singlePage.html.id = elfiles._id;
                        singlePage.html.content = elfiles.data;
                        singlePage.html.name = elfiles._id + ".html";
                        //  singlePage.url = serviceurl + "/content/" + elfiles._id + ".html";
                    }
                    //singlePage.url = "/api/forms/api/v1/form/" + elfiles.path;
                    else {
                        var newFile = {
                            id: "",
                            name: "",
                            type: "",
                            content: "",
                            url: serviceurl + "/content/" + element.instance[0]._index + "/"
                        };
                        newFile.id = elfiles._id;
                        newFile.name = elfiles.filename;
                        newFile.type = elfiles.contentType;
                        newFile.content = elfiles.data;
                        singlePage.assets.push(newFile);
                    }

                    //singlePage.assets.push("/api/forms/api/v1/form/" + elfiles.path);
                });
                // console.log("singlePage", singlePage);
                listpages.push(singlePage);

                //    if (window.location.hash.indexOf("no-right-panel") != -1) {
            });

            // start old dymer - codice che potrebbe essere superfluo
            Vvveb.CodeEditor.codemirror = false;
            Vvveb.Components.componentPropertiesElement = "#left-panel .component-properties";
            Vvveb.editorType = "models";
            Vvveb.pathservice = baseContextPath + "/api/forms/api/v1/form/";
            // end old dymer 


            //start vvvebjs 203
            let defaultPages = {
                "index": {
                    name: "model",
                    filename: "model.html",
                    file: "public/assets/wsbuilder/pages/default/model.html",
                    url: "public/assets/wsbuilder/pages/default/model.html",
                    title: "Default model",
                    folder: null,
                    description: "Default model",
                    instance: "temp"
                }
            };      	
                                  
            let pages = defaultPages;

            if (listpages.length>0){
                pages = listpages;
            }
                      
            let firstPage = Object.keys(pages)[0];
            Vvveb.Builder.init(pages[firstPage]["url"], function() {
                //load code after page is loaded here
            });
            
            Vvveb.Gui.init();
            Vvveb.FileManager.init();
            Vvveb.SectionList.init();
            Vvveb.TreeList.init(); 
            Vvveb.Breadcrumb.init();
            Vvveb.CssEditor.init();
            console.log("pages",pages);
            Vvveb.FileManager.addPages(pages);
            Vvveb.FileManager.loadPage(pages[firstPage]["name"]);
            Vvveb.Gui.toggleRightColumn(false);
            Vvveb.Breadcrumb.init();
            //Vvveb.Gui.collapse();
            //end vvvebjs 203

            var myQueryModel = { "query": { "instance._index": { $ne: "xssxxsxxs" } } };
            $http.get(baseContextPath + '/api/forms/api/v1/form/', { data: myQueryModel }).then(function(ret) {
                var indexWithModel = ret.data.data;
                var listIndex = [];
                if(indexWithModel.length>0){
                    indexWithModel.forEach(element => {
                        element.instance.forEach(el => {
    																		
                            listIndex.push(el._index);
                        });
                    });
                }
                
                $http.get(baseContextPath + '/api/entities/api/v1/entity/allstats', this.entData).then(function(rt) {
                    var allindex = rt.data.data.indices;
                    for (const [key, value] of Object.entries(allindex)) {
                        //  console.log("errr", key, value);
                        if (!listIndex.includes(value.index)) {
                            if (value.index > 0)
                                listIndex.push(key);
                        }
                    }
														   
                    Vvveb.FileManager.listIndexExsist = listIndex;
                }).catch(function(response) {
                    console.log("****************ERROR manageModel.js ", response);
                    console.log("****************ERROR manageModel.js ", response.status);
                })
            }).catch(function(response) {
                console.log(">>>>>>>>>>>>>ManageModel.js response1 ", response);
                console.log(">>>>>>>>>>>>>ManageModel.js status1 ", response.status);
            })

        }).catch(function(response) {
            console.log(">>>>>>>>>>>>>ManageModel.js response2... ", response);
            console.log(">>>>>>>>>>>>>ManageModel.js response.status2 ", response.status);
        });


    });
    console.log('testing controller' );
    $scope.initbuilder = function() {
        // check if there is query in url
    };
    $window.reloadMe = function() {

        $window.location.reload();

    };
});

function loadAllForms() {


}