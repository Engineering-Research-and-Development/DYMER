angular.module('eaggregationCtrl', [])
    .controller('eaggregationController', function($scope, $http, $rootScope) {
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
            "entities": "entities"
        };
        /*  $http.get('/api/entities/api/v1/entity/allindex', this.entData).then(function(rt) {
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
            $http.get('/api/forms/api/v1/form/', {}).then(function(rtf) {
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
            console.log(response.status);
        });
*/



        var op_map = JSON.stringify(mapping, '",', '\t');

        function resetRule() {
            $scope.rule = {
                _index: "orders",
                _type: "orders",
                mapping: op_map
            };

        }
        resetRule();
        $scope.eaggregation = {
            config: {
                insert: { servicetype: "insert" },
                update: { servicetype: "update" },
                delete: { servicetype: "delete" }
            }
        };



        $http.get(baseContextPath + '/api/dservice/api/v1/eaggregation/rules', {

        }).then(function(retE) {

            console.log("rere", retE);
            $scope.ListRules = retE.data.data;
            //return $scope.listEntity = templ_data.arr;
        });
        /* $http.get('/api/dservice/api/v1/eaggregation/configs', {

         }).then(function(retE) {


             var listconf = retE.data.data;

             listconf.forEach(el => {
                 $scope.eaggregation.config[el.servicetype].id = el._id;
                 $scope.eaggregation.config[el.servicetype].configuration = el.configuration;

             });


         });*/
        /* $scope.saveeAggregationConfig = function(opnconf) {

             //     console.log("opnconf", opnconf);
             var dapaPost = opnconf;
             $http({

                 method: 'POST',
                 url: '/api/dservice/api/v1/eaggregation/setConfig',
                 data: { data: dapaPost }

             }).then(function successCallback(response) {

                     //           console.log(response.data);
                     //        console.log("User has update Successfully")
                     response.data.data.forEach(el => {

                         $scope.eaggregation.config[el.servicetype].id = el._id;
                     });

                 },
                 function errorCallback(response) {

                     console.log("Error. while created user Try Again!", response);

                 });
         }*/
        $scope.createEaggregationRule = function(config_, rule_) {

            console.log('config', config_);
            console.log('rule_', rule_);
            rule_.mapping = JSON.parse(rule_.mapping);


            /*var result = {
                ...config_,
                ...rule_
            };
            console.log('result', result);*/
            var dapaPost = Object.assign(config_, rule_);
            console.log('rule creato', dapaPost);
            $http({

                method: 'POST',
                url: baseContextPath + '/api/dservice/api/v1/eaggregation/addrule',
                data: { data: dapaPost }

            }).then(function successCallback(response) {

                    console.log(response.data);
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
        $scope.removeEaggregationRule = function(index) {
            var el_id = $scope.ListRules[index];

            console.log("el_id", el_id);
            $http({

                method: 'DELETE',
                url: baseContextPath + '/api/dservice/api/v1/eaggregation/rule/' + el_id._id

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