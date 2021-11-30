angular.module('templateBuilderControllers', [])

.controller('manageTemplate', function($scope, $http, $window, $route, $rootScope) {
    var baseContextPath = $rootScope.globals.contextpath;
    //console.log('testing controller createTemplateBuilder');
    // $scope.listaForms = [];
    // console.log('get my list');
    $('.tab-content').perfectScrollbar();
    // console.log('get my list');

    $scope.$on("$destroy", function() {
        //console.log("In destroy of: template");
        /*    Vvveb.baseUrl = document.currentScript ? document.currentScript.src.replace(/[^\/]*?\.js$/, '') : '';

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
        // $scope.listaModels = [];
        var myQueryModel = { "query": { "instance._index": { $ne: "entity_relation" } } };
        $http.get(baseContextPath + '/api/forms/api/v1/form/', { data: myQueryModel }).then(function(ret) {
            // Vvveb.listResources.setModels(ret.data.data);
            var indexWithModel = ret.data.data;
            var listIndex = [];
            indexWithModel.forEach(element => {
                element.instance.forEach(el => {
                    if (el._index != 'general' && el._index != 'entity_relation')
                        listIndex.push(el._index);
                });
            });
            //  console.log('listIndex model', listIndex);
            //Marco devo prendere tutti gli indici che non sono nei form e relation in modo tale da recuperare gli esterni non aventi un modello
            $http.get(baseContextPath + '/api/entities/api/v1/entity/allindex', this.entData).then(function(rt) {
                var allindex = rt.data.data;
                //  console.log('indexWithModel ', indexWithModel);
                for (const [key, value] of Object.entries(allindex)) {
                    // console.log(key, value);

                    if (!listIndex.includes(key)) {

                        var obj = {
                            title: key + " / No Model ",
                            instance: [{ _index: key }]
                        };
                        if (key != 'general' && key != 'entity_relation')
                            indexWithModel.push(obj);
                    }
                }
                Vvveb.listResources.setModels(indexWithModel);
                $scope.listaModels = indexWithModel;
                var listStr = extractStrElast(allindex);
                //  console.log('listStr', listStr);
                Vvveb.listResources.setStructures(listStr);
                // Vvveb.listResources.setModels(ret.data.data);
                //   $scope.listaModels = ret.data.data;

                let listpages = [];
                var serviceurl = baseContextPath + '/api/templates/api/v1/template';

                $http({
                    url: serviceurl,
                    method: "GET",
                    headers: {
                        'Content-Type': "application/json"
                    },
                    //  params: {  query : { "instance._index": {  $ne : "general" } } } ,
                }).then(function(ret) {
                    //$http.get(serviceurl, this.entData).then(function(ret) {
                    //	   $http.get(serviceurl, this.entData).then(function(ret) {
                    var arrLIst = ret.data.data;
                    Vvveb.listResources.setTemplates(arrLIst);
                    arrLIst.forEach(function(element) {
                        var singlePage = {
                            name: element._id,
                            title: element.title,
                            html: {
                                id: "",
                                name: "",
                                content: "",
                                url: serviceurl + "/content/"
                            },
                            instance: element.instance[0]._index,
                            url: serviceurl + "/content/" + element._id,
                            assets: [],
                            description: element.description,
                            viewtype: []
                        };
                        (element.viewtype).forEach(function(vw) {
                            singlePage.viewtype.push(vw.rendertype);
                        });
                        (element.files).forEach(function(elfiles) {
                            if (elfiles.contentType == "text/html") {
                                singlePage.url = serviceurl + "/content/" + elfiles._id
                                singlePage.html.id = elfiles._id;
                                singlePage.html.name = elfiles._id + ".html";
                                singlePage.html.content = elfiles.data;
                                //  singlePage.url = serviceurl + "/content/" + elfiles._id + ".html";
                            }
                            //singlePage.url = "/api/forms/api/v1/form/" + elfiles.path;
                            else {
                                var newFile = {
                                    id: "",
                                    name: "",
                                    type: "",
                                    content: "",
                                    url: serviceurl + "/content/"
                                };
                                newFile.id = elfiles._id;
                                newFile.name = elfiles.filename;
                                newFile.type = elfiles.contentType;
                                newFile.content = elfiles.data;
                                singlePage.assets.push(newFile);
                            }
                            //singlePage.assets.push("/api/forms/api/v1/form/" + elfiles.path);
                        });
                        listpages.push(singlePage);
                        //    if (window.location.hash.indexOf("no-right-panel") != -1) {
                    });
                    $("#vvveb-builder").addClass("no-right-panel");
                    $(".component-properties-tab").show();


                    //setTimeout(function(){ 

                    Vvveb.CodeEditor.codemirror = false;
                    Vvveb.editorType = "templates";
                    Vvveb.pathservice = baseContextPath + "/api/templates/api/v1/template/";
                    //Vvveb.basetemplate ="/assets/wsbuilder/libs/builder/dymer-basetemplate-template.html";
                    Vvveb.Components.componentPropertiesElement = "#left-panel .component-properties";
                    //  } else {
                    //       $(".component-properties-tab").hide();
                    //     }

                    Vvveb.Builder.init(
                        "",
                        function() {
                            //run code after page/iframe is loaded
                        }
                    );


                    Vvveb.FileManager.init();
                    Vvveb.FileManager.addPages(listpages);
                    if (listpages.length)
                        Vvveb.FileManager.loadPage(listpages[0].name);
                    Vvveb.Gui.init();


                    //  }, 3000);

                }).catch(function(response) {
                    console.log(response.status);
                });
            }).catch(function(response) {
                console.log(response.status);
            })
        }).catch(function(response) {
            console.log(response.status);
        })

        /* $http.get('/api/forms/api/v1/form/', this.entData).then(function(ret) {
            console.log('Data controller ', ret.data.data);
            Vvveb.listResources.setModels(ret.data.data);
            $scope.listaModels = ret.data.data;
        }).catch(function(response) {
            console.log(response.status);
        })
*/
        //  console.log('te');
        //{ "query": { "instance._index": { $ne: "general" } } }



    });
    //  console.log('testing controller' );
    $scope.initbuilder = function() {
        // check if there is query in url
        //   console.log('MEEEEEEEEEEEEEEEEEEEEEEEEEEEE M');

    };
    $window.reloadMe = function() {

        $window.location.reload();

    };
});

function reloadAll() {


}