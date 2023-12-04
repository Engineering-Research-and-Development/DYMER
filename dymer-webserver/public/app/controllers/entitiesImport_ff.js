angular.module('entitiesImportControllers', [])
    .controller('entitiesImport_ff', function($scope, $http, $rootScope, exportEntities) {
        var baseContextPath = $rootScope.globals.contextpath;
        //   console.log('testing controller entitiesImport_ff');
        
        $scope.method = "GET";
        $scope.host = "http://localhost";
        $scope.port = "8008";
        $scope.path = "/";
        var mapping = {
            "ID": "__id",
            "TYPE": "__type",
            "_index": "_index",
            "_source": "_source"
        };
        $scope.mapping = JSON.stringify(mapping, '",', '\t');

        /**/
        $http.get(baseContextPath + '/api/entities/api/v1/entity/allstatsglobal', {
        }).then(function (retE) {
             let res = retE.data.data.indices;
             $scope.listEntities = res.map((e) => e.index)
             $scope.listEntities.shift()
        }).catch(function(e){
            console.error("error: ", e)
        })
        /**/

        $scope.importEntFl = function() {
            /* console.log($scope.method);
             console.log($scope.host);
             console.log($scope.port);
             console.log($scope.path);
             console.log($scope.mapping);*/
            var pathService = $scope.host + ':' + $scope.port + $scope.path
            if ($scope.method == 'GET') {
                $http.get(pathService,
                    $scope.mapping
                ).then(function(ret) {
                    console.log('Import Resp', ret);

                    return $scope.import_result = ret;
                }).catch(function(response) {
                    console.log(response.status);
                });

            }
            if ($scope.method == 'POST') {
                $http.post(pathService, $scope.mapping).then(function(ret) {
                    console.log('Import Resp', ret);

                    $scope.import_result = ret;
                }).catch(function(response) {
                    console.log(response.status);
                });


            }
        }

        // console.log('get my list');
        /* var par = { "query": { "instance._index": { "$ne": "general" } } };
        $http.get('/api/forms/api/v1/form/', {
            params: par
        }).then(function(ret) {
            // console.log('Data controller ', ret);

            return $scope.listaModels = ret.data.data;
        }).catch(function(response) {
            console.log(response.status);
        });
        $scope.xxxx = function(obj, index) {
            //console.log('evvai', obj);
            $scope.selected = index;
            $scope.formtitle = obj.title;
            $scope.objCreated = obj.created;
            $("#cont-RenderForm #html-torender").empty();
            $("#cont-RenderForm #appendfiles").empty();
            obj.files.forEach(element => {
                if (element.contentType == "text/html") {

                    $("#cont-RenderForm #html-torender").append(element.data);
                }
                if (element.contentType == "text/css") {

                    // $("<style></style>").appendTo("#cont-RenderForm #appendfiles").html(element.data);
                }
            });
            setTimeout(function() {
                hookReleationForm();
            }, 800);
        };
*/

        $scope.ExportJSON = function () {
            console.log("Vuoi esportare un JON, quindi")
            exportEntities.exportJSONFormat(baseContextPath, {index: $scope.selectedEntity})
        }

        $scope.ExportCSV = function () {
            console.log("Esporti un CSV: ")
            let options = $scope.myDropdownOptions.map(el => (el.id))
            let selectedOptions = $scope.myDropdownModel.map(el => el.id)
            
            let excluededFields = options.filter(element => !selectedOptions.includes(element))
            
            // console.log("excluededFields: ", excluededFields)
            exportEntities.exportCSVFormat(baseContextPath, {index: $scope.selectedEntity, exclude: excluededFields})

        }

        /********************************/
        $scope.myDropdownSettings = {
            smartButtonTextProvider: [],
            smartButtonMaxItems: 3,
            smartButtonTextProvider(selectionArray) {
                if (selectionArray.length === 1) {
                    return selectionArray[0].label;
                } else {
                    return selectionArray.length + ' Selected';
                }
            }
        };

        $scope.selectOptions = function () {
            let index = $scope.selectedEntity
            let fields = []

            $http.get(baseContextPath + '/api/entities/api/v1/entity/getstructure/' + index).then(function (rt) {
                for (let el of rt.data) {
                    fields.push({ id: el, label: el })
                }
                $scope.myDropdownOptions = fields
                $scope.myDropdownModel = [$scope.myDropdownOptions[0]]
            }).catch(function (e) {
                console.log("Error: ", e)
            })

        }
        /********************************/
    });