angular.module('formBuilderControllers', [])

.controller('manageModel', function($scope, $http, $window, $route, $rootScope) {
    var baseContextPath = $rootScope.globals.contextpath;
    //  console.log("UNO", $scope.listaForms);
    //listTempl
    // $scope.listaForms = [];
    // console.log('get my list');

    $('.tab-content').perfectScrollbar();

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
            // console.log('Data controller lists', ret);
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
            //   setTimeout(function(){ 
            //  $("#vvveb-builder").addClass("no-right-panel");
            // $(".component-properties-tab").show();
            Vvveb.CodeEditor.codemirror = false;
            Vvveb.Components.componentPropertiesElement = "#left-panel .component-properties";
            Vvveb.editorType = "models";
            Vvveb.pathservice = baseContextPath + "/api/forms/api/v1/form/";
            //Vvveb.basetemplate ="/assets/wsbuilder/libs/builder/dymer-basetemplate-form.html";
            //  } else {
            //       $(".component-properties-tab").hide();
            //     }

            Vvveb.Builder.init(
                "",
                function() {
                    //run code after page/iframe is loaded
                    // console.log("INIT PRIMO FORM");


                }
            );
            /*Vvveb.Builder.init(
              "assets/wsbuilder/demo/narrow-jumbotron/index.html",
              function () {
                //run code after page/iframe is loaded
                console.log("INIT PRIMO");
               
                
              }
            );*/
            console.log("pre SECcondo");


            Vvveb.FileManager.init();
            Vvveb.FileManager.addPages(listpages);
            if (listpages.length)
                Vvveb.FileManager.loadPage(listpages[0].name);
            Vvveb.Gui.init();
            //   }, 3000);


            var myQueryModel = { "query": { "instance._index": { $ne: "xssxxsxxs" } } };
            $http.get(baseContextPath + '/api/forms/api/v1/form/', { data: myQueryModel }).then(function(ret) {
                // Vvveb.listResources.setModels(ret.data.data);
                var indexWithModel = ret.data.data;
                var listIndex = [];
                indexWithModel.forEach(element => {
                    element.instance.forEach(el => {
                        listIndex.push(el._index);
                    });
                });
                $http.get(baseContextPath + '/api/entities/api/v1/entity/allstats', this.entData).then(function(rt) {
                    var allindex = rt.data.data.indices;
                    for (const [key, value] of Object.entries(allindex)) {
                        console.log("errr", key, value);
                        if (!listIndex.includes(value.index)) {
                            if (value.index > 0)
                                listIndex.push(key);
                        }
                    }
                    Vvveb.FileManager.listIndexExsist = listIndex;
                }).catch(function(response) {
                    console.log(response.status);
                })
            }).catch(function(response) {
                console.log(response.status);
            })







        }).catch(function(response) {
            console.log(response.status);
        });


    });
    //  console.log('testing controller' );
    $scope.initbuilder = function() {
        // check if there is query in url


    };
    $window.reloadMe = function() {

        $window.location.reload();

    };
});

function loadAllForms() {


}