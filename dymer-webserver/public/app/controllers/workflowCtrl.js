angular.module('workflowCtrl', [])
    .controller('workflowController', function ($scope, $http, $rootScope) {
        var baseContextPath = $rootScope.globals.contextpath;
        loadAllConfig();

        function loadAllConfig() {
            console.log("workflowCtrl");
            $scope.indexesArray = [];
            $scope.configWorkflow = {};
            $scope.configWorkflow.indexes = [];

            $http.get(baseContextPath + '/api/dservice/api/v1/workflow/listrules', {}).then(function (retE) {
                $scope.List = retE.data.data;

            });

            $scope.listEntity = [];
            var par = {
                query: {
                    "query": {
                        "bool": {
                            "must_not": {
                                "match": {
                                    "_index": "entity_relation"
                                }
                            }
                        }
                    }
                }
            };
            $http.get(baseContextPath + '/api/entities/api/v1/entity/', {
                params: par
            }).then(function (ret) {
                var lst = [];
                ret.data.data.forEach(element => {
                    var n_el = element._index;
                    if (lst.findIndex(item => item.id === n_el) === -1) {
                        lst.push({ id: n_el, label: n_el });
                    }
                });
                $scope.indexesOptions = lst;
            }).catch(function (response) {
                console.log(response.status);
            });

        }
        $scope.loadrelcont = function () {
            console.log("eccolo");
        }

        $scope.saveWorkflow = function () {
            console.log("pues, me lliami")
            let dataPost = $scope.configWorkflow
            console.log('dataPost', dataPost);
            console.log('dataPost.cond', dataPost.cond);
            if (dataPost.active == undefined)
                dataPost.active = false;
            if (dataPost.workflow == 'send-mail') {
                dataPost.emailinfo = $scope.emailForms
            }

            let uri = baseContextPath + '/api/dservice/api/v1/workflow/';
            let operation = "POST";
            if (dataPost["_id"] != "" && dataPost["_id"] != undefined && dataPost["_id"] != "undefined") {
                operation = "PUT";
                uri += "/" + dataPost["_id"];
                delete dataPost["_id"];
            }
            delete dataPost["_id"];
    
            $http({
                method: operation,
                url: uri,
                data: dataPost
            }).then(function successCallback(response) {
                console.log('post config response', response.data);
                if (response.data.success) {
                    useGritterTool("<b><i class='nc-icon nc-vector'></i>Workflow Config</b>", response.data.message);
                    $scope.configWorkflow = {};
                    $scope.List = [];
                    loadAllConfig();
                } else {
                    useGritterTool("<b><i class='fa fa-exclamation-triangle'></i> Workflow Config</b>", response.data.message, "danger");
                }

            },
                function errorCallback(response) {
                    console.log("Error. while create Try Again!", response);
                });
        }

        $scope.setupdateWorkflow = function (index, tp) {            
            $scope.showConfigAuthentication = true;           
            var tmpConf = angular.copy($scope.List[index]);
            tmpConf.indexes = tmpConf.indexes.map(elem => ({ "id": elem }))

            if (tp == 'clone') {
                tmpConf["_id"] = "";
                tmpConf["title"] = tmpConf["title"] + " Copy";
            }
            //console.log("$scope.configWorkflow", $scope.configWorkflow)
            $scope.configWorkflow = tmpConf;
            console.log("tmpConf ", tmpConf)
            console.log("$scope.configWorkflow ", $scope.configWorkflow)
        }

        $scope.removeWorkflow = function (index) {
            var el_id = $scope.List[index];            
            $http({
                method: 'DELETE',
                url: baseContextPath + '/api/dservice/api/v1/workflow/' + el_id._id
            }).then(function successCallback(response) {
                //console.log('response delete', response);
                $scope.List.splice(index, 1);
            },
                function errorCallback(response) {
                    console.log("Error. while delete Try Again!", response);

                });
        }

        $scope.onWorkflowChange = function () {
            console.log($scope.configWorkflow.workflow)
        }

        $scope.phFrom = "insert sender <from@domain.it>"
        $scope.phTo = "insert recipient <to@domain.it"
        $scope.phSubject = "Insert Subject"
        $scope.phBody = "Insert Body. Use {{ variable }} to allow interpolation"

        $scope.emailForms = [
            { from: '', to: '', object: '', body: '' }
        ];

        $scope.repeatForm = function () {
            $scope.emailForms.push({ from: '', to: '', object: '', body: '' });
        };

        $scope.removeForm = function (index) {
            if ($scope.emailForms.length > 1) {
                $scope.emailForms.splice(index, 1);
            }
        };

        $scope.getTemplStructures = function () {
            console.log("tanto per cominciare mi stai chiamando")
            $("#structures-container").html("")            
            let selectedIndexes = {}
            let listTemplates = []
            let listIndexes = ($scope.configWorkflow.indexes.map(e => e.id)).join(",")
            console.log("viri ca lista è ", listIndexes)
            $http.get(baseContextPath + '/api/entities/api/v1/entity/allindex/'+listIndexes).then(function (rt) { // passa un array
                let allindex = rt.data.data; 

                $scope.configWorkflow.indexes.forEach(key => {
                    if (allindex.hasOwnProperty(key.id)) {
                        selectedIndexes[key.id] = allindex[key.id]
                    }
                })

                let listStr = extractStrElast(selectedIndexes)
                
                for (let key in listStr) {                   
                    let tmpName = `<span class="text-primary">${key}</span><br>`
                    let tmpStr = '<pre>' + convertStructToTemplate(listStr[key]) + '</pre>'
                    let tmp = '<div class="col-4">'+ tmpName + tmpStr +'</div>'
                    $("#structures-container").append(tmp)                   
                }

            })
        }
    });