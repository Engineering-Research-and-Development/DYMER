angular.module('dashCtrl', [])
    .controller('dashController', function($scope, $http, $location, $browser, $rootScope) {
        var baseContextPath = $rootScope.globals.contextpath; //$rootScope.site_prefix; //'/d4ptest/'; //$browser.baseHref();
        $http.get(baseContextPath + '/api2/retriveinfoidpadmin', {
            //$http.get(baseContextPath + '/api2/retriveinfoidp', {
        }).then(function(retE) {
            localStorage.setItem('DYM', retE.data["DYM"]);
            localStorage.setItem('DYMisi', retE.data["DYMisi"]);
            document.cookie = "lll=" + retE.data["DYM"];
            document.cookie = "DYMisi=" + retE.data["DYMisi"];
            localStorage.setItem('d_uid', retE.data.d_uid);
            localStorage.setItem('d_appuid', retE.data.d_appuid);
            localStorage.setItem('d_gid', retE.data.d_gid);
        })
        var listEntities = [];
        console.log('baseContextPath', baseContextPath + '/api/entities/api/v1/entity/allstats');
        $http.get(baseContextPath + '/api/entities/api/v1/entity/allstats', {

        }).then(function(retE) {
            var res = retE.data.data;
            listEntities = res.indices;

            $scope.totIndices = listEntities.length;
            $scope.totEntities = res.total;
            //return $scope.listEntity = templ_data.arr;
        }).then(function() {

            var listTemplates = [];
            par = { "query": { "instance._index": { "$ne": "general" } } };
            $http.get(baseContextPath + '/api/templates/api/v1/template/', {
                params: par
            }).then(function(retT) {
                var res = retT.data.data;
                listTemplates = res;
                $scope.totTemplates = res.length;
                listEntities.forEach(function(elEnt) {
                    elEnt.templates = {
                        "fullcontent": {
                            'title': "",
                            'exsist': false
                        },
                        "teaserlist": {
                            'title': "",
                            'exsist': false
                        },
                        "teasermap": {
                            'title': "",
                            'exsist': false
                        },
                        "teaser": {
                            'title': "",
                            'exsist': false
                        }
                    }
                    listTemplates.forEach(function(elTEm) {
                        (elTEm.instance).forEach(function(elTEmIN) {
                            if (elEnt.index == elTEmIN._index) {
                                (elTEm.viewtype).forEach(function(elVTEmIN) {
                                    elEnt.templates[elVTEmIN.rendertype].exsist = true;
                                    elEnt.templates[elVTEmIN.rendertype].title = elTEm.title;
                                });
                            }
                        });
                    });
                });
            }).then(function() {
                var listModels = [];
                var par = { "query": { "instance._index": { "$ne": "general" } } };
                $http.get(baseContextPath + '/api/forms/api/v1/form/', {
                    params: par
                }).then(function(retM) {
                    listModels = retM.data.data;
                    $scope.totModels = listModels.length;
                    listEntities.forEach(function(elEnt) {
                        elEnt.model = {
                            'title': "x",
                            'exsist': false
                        };
                        listModels.forEach(function(elTEm) {
                            (elTEm.instance).forEach(function(elTEmIN) {
                                if (elEnt.index == elTEmIN._index) {
                                    elEnt.model.title = elTEm.title;
                                    elEnt.model.exsist = true;
                                }
                            });
                        });
                    });
                    $scope.ListEntities = listEntities;
                    //  return $scope.listaModels = ret.data.data;
                }).catch(function(response) {
                    console.log(response.status);
                });
            }).catch(function(response) {
                console.log(response);
            });

        }).catch(function(response) {
            console.log(response.status);
        });

        /* giaisg */
        $scope.deleteAllEntityByIndex = function(obj, ind) {
            if (confirm("Are you sure to flush all entities with index '" + obj.index + "'?")) {
                //console.log("deleted ", obj.index);
                var par = { "index": obj.index };
                $http.get(baseContextPath + '/api/entities/api/v1/entity/deleteAllEntityByIndex', {
                    params: par
                }).then(function(rt) {
                    console.log("deleted done", rt);
                    $scope.ListEntities[ind].count = 0;
                }).catch(function(response) {
                    console.log(response.status);
                });
            }
        };

        $scope.deleteAllEntityAndIndexByIndex = function(obj, ind) {
            if (confirm("Are you sure to delete the index '" + obj.index + "' and  entities?")) {
                console.log("deleted ", obj.index);
                var par = { "index": obj.index };
                console.log(par);
                $http.get(baseContextPath + '/api/entities/api/v1/entity/deleteAllEntityAndIndexByIndex', {
                    params: par
                }).then(function(rt) {

                    console.log("deleted done", rt);
                    $scope.ListRules.splice(ind, 1);
                }).catch(function(response) {
                    console.log(response.status);
                });
            }
        };
    });