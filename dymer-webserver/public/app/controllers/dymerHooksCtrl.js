angular.module('dymerHooksCtrl', [])
    .controller('dymerHooksController', function($scope, $http, $rootScope) {
        var baseContextPath = $rootScope.globals.contextpath;
        $scope.hook = {
            _type: "",
            _index: "",
            eventType: 'after_insert',
            service: 'openness_search'
        };

        $scope.copyPastIndType = function(el) {
            $scope.hook._type = el._type;
            $scope.hook._index = el._index;
        }
        $scope.clearString = function() {
            $scope.hook._type = (($scope.hook._type.replace(/[^a-z]/g, "")).trim()).toLowerCase();
            $scope.hook._index = (($scope.hook._index.replace(/[^a-z]/g, "")).trim()).toLowerCase();
        }
        $http.get(baseContextPath + '/api/dservice/api/v1/servicehook/hooks/', {}).then(function(retE) {
            $scope.ListHooks = retE.data.data;
            //return $scope.listEntity = templ_data.arr;
        });
        $scope.sort = {
            column: '',
            descending: false
        };

        $scope.changeSorting = function(column) {

            var sort = $scope.sort;

            if (sort.column == column) {
                sort.descending = !sort.descending;
            } else {
                sort.column = column;
                sort.descending = false;
            }
        };

        $scope.selectedCls = function(column) {
            return column == $scope.sort.column && 'sort-' + $scope.sort.descending;
        };
        $http.get(baseContextPath + '/api/entities/api/v1/entity/allindex', this.entData).then(function(rt) {
            var allindex = rt.data.data;
            $scope.listEntitiesAvailable = [];
            for (const [key, value] of Object.entries(allindex)) {
                var newObj = {
                    _index: key,
                    _type: Object.keys(value.mappings)[0]
                };
                if (key != "entity_relation")
                    $scope.listEntitiesAvailable.push(newObj);
            }
            $http.get(baseContextPath + '/api/forms/api/v1/form/', {}).then(function(rtf) {
                    // Vvveb.listResources.setModels(ret.data.data);
                    var listmodels = rtf.data.data;
                    $scope.listModelsAvailable = [];
                    listmodels.forEach(element => {
                        element.instance.forEach(el => {
                            var newObj = {
                                _index: el._index,
                                _type: el._type
                            };
                            if (el._index != 'general' && el._index != 'entity_relation') {
                                if (!$scope.listEntitiesAvailable.filter(obj => obj._index == el._index).length)
                                    $scope.listModelsAvailable.push(newObj);
                            }
                        });
                    });
                }).catch(function(response) {
                    console.log(response.status);
                })
                // $scope.listEntitiesAvailable = ret.data.data;
        }).catch(function(response) {
            console.log(response.status);
        });
        $scope.createDymerHook = function(dataPost) {
                dataPost.microserviceType = "entity";
                var modService = dataPost.service;
                /* dataPost.service = {
                     serviceType: modService,
                     servicePath: baseContextPath + "/api/dservice/api/v1/opn/listener"
                 }*/
                if (modService == "openness_search") {
                    dataPost.service = {
                        serviceType: modService,
                        servicePath: "/api/dservice/api/v1/opn/listener"
                    }
                }
                if (modService == "eaggregation_hook") {
                    dataPost.service = {
                        serviceType: modService,
                        servicePath: "/api/dservice/api/v1/eaggregation/listener"
                    }
                }
                if (modService == "fwadapter") {
                    dataPost.service = {
                        serviceType: modService,
                        servicePath: "/api/dservice/api/v1/fwadapter/listener"
                    }
                }
                if (modService == "sync") {
                    dataPost.service = {
                        serviceType: modService,
                        servicePath: "/api/dservice/api/v1/sync/listener"
                    }
                }
                if (modService == "workflow") {
                    dataPost.service = {
                        serviceType: modService,
                        servicePath: "/api/dservice/api/v1/workflow/listener"
                    }
                }
                $http({
                    method: 'POST',
                    url: baseContextPath + '/api/dservice/api/v1/servicehook/addhook',
                    data: { data: dataPost }
                }).then(function successCallback(response) {

                        if (response.data.success) {
                            useGritterTool("<b><i class='fa fa-toggle-on'></i> HOOK</b>", response.data.message);
                            response.data.data.forEach(element => {
                                $scope.ListHooks.push(element);
                            });
                        } else {
                            useGritterTool("<b><i class='fa fa-toggle-on'></i> HOOK</b>", response.data.message, "warning");
                        }

                    },
                    function errorCallback(response) {
                        useGritterTool("<b><i class='fa fa-toggle-on'></i> HOOK</b>", response.data.message, "warning");
                        console.log("Error. HOOK Try Again!", response);
                    });
            }
            // $scope.removeDymerHook = function(index) {
        $scope.removeDymerHook = function(id) {
            //  var el_id = $scope.ListHooks[index];
            $http({
                method: 'DELETE',
                url: baseContextPath + '/api/dservice/api/v1/servicehook/hook/' + id
            }).then(function successCallback(response) {
                    if (response.data.success) {
                        useGritterTool("<b><i class='fa fa-toggle-on'></i> HOOK</b>", response.data.message);
                        var index = $scope.ListHooks.findIndex(function(o) {
                            return o._id === id;
                        })
                        if (index !== -1) $scope.ListHooks.splice(index, 1);
                    } else {
                        useGritterTool("<b><i class='fa fa-toggle-on'></i> HOOK</b>", response.data.message, "warning");
                    }
                    //$scope.ListHooks.splice(index, 1);
                },
                function errorCallback(response) {
                    useGritterTool("<b><i class='fa fa-toggle-on'></i> HOOK</b>", response.data.message, "warning");
                    console.log("Error. delete hook Try Again!", response);
                });
        }
    });