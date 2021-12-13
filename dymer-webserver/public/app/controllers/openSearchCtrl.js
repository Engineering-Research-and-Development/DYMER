angular.module('openSearchCtrl', [])
    .controller('openSearchController', function($scope, $http, $rootScope) {
        var baseContextPath = $rootScope.globals.contextpath;
        $scope.copyPastIndType = function(el) {

            $scope.rule.op_index = el._type;
            $scope.rule.op_type = el._index;
        }
        $scope.clearString = function() {
            $scope.rule.op_index = (($scope.rule.op_index.replace(/[^a-z]/g, "")).trim()).toLowerCase();
            $scope.rule.op_type = (($scope.rule.op_type.replace(/[^a-z]/g, "")).trim()).toLowerCase();
        }
        var mapping = {
            /* "elasticSearchResourceId": -1,
             "groupId": 10154,
             "userId": 10198,
             "index": "index",
             "type": "type",
             "id": "id",
             "url": "url",*/
            "title": "title",
            "extContent": ["description"]
        };
        $http.get(baseContextPath + '/api/entities/api/v1/entity/allindex', this.entData).then(function(rt) {
            var allindex = rt.data.data;
            $scope.listEntitiesAvailable = [];
            for (const [key, value] of Object.entries(allindex)) {
                var newObj = {
                    _index: key,
                    _type: Object.keys(value.mappings)[0]
                };
                if (key != "entity_relation") {
                    $scope.listEntitiesAvailable.push(newObj);
                }
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

        }).catch(function(response) {
            console.log("Error:::".response.status);
        });



        var op_map = JSON.stringify(mapping, '",', '\t');

        function resetRule() {
            $scope.rule = {
                op_index: "",
                op_type: "",
                op_mapping: op_map
            };

        }
        resetRule();
        $scope.opnsearch = {
            config: {
                insert: { servicetype: "insert", id: '' },
                update: { servicetype: "update", id: '' },
                delete: { servicetype: "delete", id: '' }
            }
        };



        $http.get(baseContextPath + '/api/dservice/api/v1/opn/rules', {}).then(function(retE) {

            console.log("rere", retE);
            $scope.ListRules = retE.data.data;
            //return $scope.listEntity = templ_data.arr;
        });
        $http.get(baseContextPath + '/api/dservice/api/v1/opn/configs', {}).then(function(retE) {


            var listconf = retE.data.data;
            console.log("opnsearch.config", retE);
            listconf.forEach(el => {
                $scope.opnsearch.config[el.servicetype].id = el._id;
                $scope.opnsearch.config[el.servicetype].configuration = el.configuration;
                //     console.log("scope", $scope.opnsearch.config[el.servicetype].id);
                /*  if (el.servicetype == "insert") {
                      $scope.opnsearch.config.insert.configuration = el.configuration;
                  }
                  if (el.servicetype == "update") {
                      $scope.opnsearch.config.update.configuration = el.configuration;
                  }
                  
                  if (el.servicetype == "update") {
                      $scope.opnsearch.config.update.configuration = el.configuration;
                  }*/
            });
            // $scope.opnsearch.config = retE.data.data;
            //return $scope.listEntity = templ_data.arr;

        });
        $scope.saveOpnSearchConfig = function(opnconf) {

            //     console.log("opnconf", opnconf);
            var dapaPost = opnconf;
            $http({

                method: 'POST',
                url: baseContextPath + '/api/dservice/api/v1/opn/setConfig',
                data: { data: dapaPost }

            }).then(function successCallback(response) {

                    //           console.log(response.data);
                    //        console.log("User has update Successfully")
                    response.data.data.forEach(el => {
                        // console.log("ellllll", el);
                        $scope.opnsearch.config[el.servicetype].id = el.id;
                    });

                },
                function errorCallback(response) {

                    console.log("Error. while created user Try Again!", response);

                });
        }
        $scope.createOpnSearchRule = function(rule) {
            var dapaPost = rule;
            dapaPost.op_mapping = JSON.parse(dapaPost.op_mapping);
            //    console.log('rule creato', dapaPost);
            $http({

                method: 'POST',
                url: baseContextPath + '/api/dservice/api/v1/opn/addrule',
                data: { data: dapaPost }

            }).then(function successCallback(response) {

                    //         console.log(response.data);
                    //           console.log("User has created Successfully")
                    response.data.data.forEach(element => {
                        $scope.ListRules.push(element);
                    });

                },
                function errorCallback(response) {

                    console.log("Error. while created user Try Again!", response);

                });




            resetRule();
        }
        $scope.removeOpnSearchRule = function(index) {
            var el_id = $scope.ListRules[index];

            console.log("el_id", el_id);
            $http({

                method: 'DELETE',
                url: baseContextPath + '/api/dservice/api/v1/opn/rule/' + el_id._id

            }).then(function successCallback(response) {

                    console.log(response.data);
                    console.log("User has created Successfully", response.data)
                    $scope.ListRules.splice(index, 1);
                },
                function errorCallback(response) {

                    console.log("Error. while created user Try Again!", response);

                });
        }
    });