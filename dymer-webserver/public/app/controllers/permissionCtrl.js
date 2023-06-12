angular.module('permissionCtrl', [])
    .controller('permissionController', function($scope, $http, $rootScope) {
        var baseContextPath = $rootScope.globals.contextpath;
        let baseroleform = {
            role: "",
            perms: {
                "entities": {
                    view: [],
                    create: [],
                    edit: [],
                    delete: [] 
                },
                "modules" : {
                    "view" : [],
                    "create" : [],
                    "edit" : [],
                    "delete" : []
                }
            }
        };

        $scope.formData = angular.copy(baseroleform);
        $scope.typerole = angular.copy(baseroleform);

        function getListPerm() {
            /*Load permissions*/
            var listPerm = [];
            $http.get(baseContextPath + '/api/dservice/api/v1/perm', {
            }).then(function(retM) {
                /*Creazione elementi, comprendenti entità e funzioni, per tutte le entità disponibili*/
                var par = { "query": { "instance._index": { "$ne": "general" }}};
                $http.get(baseContextPath + '/api/forms/api/v1/form/', {
                    params: par
                }).then(function(availableEntities) {
                    var entities = [];
                    $.each( availableEntities.data.data, function(key, value){      
                        entities.push(value.instance[0]._index);
                    });  
                    $.each(retM.data.data, function(key, value){
                        value.entities = entities;
                    }); 
                    /*Modifica struttura dati per l'implementazione delle checkbox : 
                    associo le funzioni ad ogni entità, distinguendole fra attive (true)
                    e non attive (false) per l'entità*/
                    var functions = [];
                    var element = {};
                    var elements = [];
                    $.each(retM.data.data, function(key, value){  
                        $.each(value.entities, function(key1, value1){ 
                            angular.forEach(baseroleform.perms.entities, function(keyo, valueo) {
                                var f = {};
                                f.operations = valueo;
                                f.checked = false;
                                $.each(value.perms.entities[valueo], function(key2, value2){   
                                    f.checked = value.perms.entities[valueo].some(value2 => value2 === value1);
                                }); 
                                functions.push(f);
                            }); 
                            element.entity = value1;
                            element.functions = functions;
                            elements.push(element);
                            value.elements = elements;
                            element  = {};
                            functions  = [];
                        });  
                        elements = [];
                    });     
                }).catch(function(response) {
                    console.log(response.status);
                });
                $scope.listPerm = retM.data.data;
                $scope.listRoles = retM.data.data;
            }).catch(function(response) {
                console.log(response.status);
            });
        }

        getListPerm();

        $scope.saveconfigrules = function(formData) {
            var formData = this.formData;
            var ind = "";
            $http({
                method: 'POST',
                url: baseContextPath + '/api/dservice/api/v1/perm/' + ind,
                data: { data: formData }
            }).then(function successCallback(response) {
                    useGritterTool("<b><i class='nc-icon nc-badge'></i> Permissions Configuration</b>", response.data.message);
                    getListPerm();
            },
            function errorCallback(response) {
                console.log("Error while creating permissions. Try Again!", response);
            });
            $scope.formData = angular.copy(baseroleform);
        }

        $scope.removeRole = function(index) {
            if (confirm("Do you want to delete this role?")) {
            var el_id = $scope.listPerm[index];
            $http({
                method: 'DELETE',
                url: baseContextPath + '/api/dservice/api/v1/perm/' + el_id._id
            }).then(function successCallback(response) {
                    useGritterTool("<b><i class='nc-icon nc-badge'></i> Permissions Configuration</b>", response.data.message);
                    $scope.listPerm.splice(index, 1);
                },
                function errorCallback(response) {
                    console.log("Error while deleting index. Try Again!", response);
                });
            }
        }

        $scope.saveRole = function(index) {
            var el_ = $scope.listPerm[index];
            if (el_._id) {
                id = el_._id
            }
            $http({
                method: 'POST',
                url: baseContextPath + '/api/dservice/api/v1/perm/' + id,
                data: { data: el_ }
            }).then(function successCallback(response) {
                useGritterTool("<b><i class='nc-icon nc-badge'></i> Permissions Configuration</b>", response.data.message);
                getListPerm();
            },
            function errorCallback(response) {
                console.log("Error while creating permissions. Try Again!", response);
            });
        }

        $scope.changePermission = function(index , f, event, e) {
            var pos = $scope.listPerm.findIndex(x => x._id === index._id) ;
            if (typeof($scope.listPerm[pos].perms.entities[f]) == "undefined") {
                $scope.listPerm[pos].perms.entities[f] = [];
            }
            var indexent = $scope.listPerm[pos].perms.entities[f].indexOf(e);
            if(indexent >=0)
                $scope.listPerm[pos].perms.entities[f].splice(indexent, 1); 
            else
                $scope.listPerm[pos].perms.entities[f].push(e);
            return true;
        }
    });