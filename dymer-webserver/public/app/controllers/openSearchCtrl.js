angular.module('openSearchCtrl', [])
    .controller('openSearchController', function($scope, $http, $rootScope) {
        var baseContextPath = $rootScope.globals.contextpath;
        $scope.copyPastIndType = function(el) {

            $scope.rule.op_index = el._index;//VL
            $scope.rule.op_type = el._index;
        }
        $scope.clearString = function() {
            $scope.rule.op_index = (($scope.rule.op_index.replace(/[^a-z]/g, "")).trim()).toLowerCase();
            $scope.rule.op_type = (($scope.rule.op_index.replace(/[^a-z]/g, "")).trim()).toLowerCase();//VL
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
                            _type: el._index//VL
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
                delete: { servicetype: "delete", id: '' },
                get: { servicetype: "get", id: '' }
            }
        };

        $http.get(baseContextPath + '/api/dservice/api/v1/opn/rules', {}).then(function(retE) {
            $scope.ListRules = retE.data.data;
            //return $scope.listEntity = templ_data.arr;
        });
        $http.get(baseContextPath + '/api/dservice/api/v1/opn/configs', {}).then(function(retE) {
            var listconf = retE.data.data; 
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

            //console.log("opnconf", opnconf);
            var dapaPost = opnconf;
            $http({

                method: 'POST',
                url: baseContextPath + '/api/dservice/api/v1/opn/setConfig',
                data: { data: dapaPost }

            }).then(function successCallback(response) {

                    //console.log('saveOpnSearchConfig ', response);
                    //console.log("User has update Successfully")
                    response.data.data.forEach(el => {
                        // console.log(">>>>>ellllll ", el);
                        $scope.opnsearch.config[el.servicetype].id = el.id;
                    });
                    if (response.data.success) {
                        useGritterTool("<b><i class='fa fa-map-signs  '></i> Openness Search Configuration </b>", "[" + opnconf.servicetype +
                            "] " + response.data.message);
                    } else {
                        useGritterTool("<b><i class='fa fa-map-signs  '></i> Openness Search Configuration</b>", response.data.message, "danger");
                    }
                },
                function errorCallback(response) {

                    console.log("Error. while created user Try Again!", response);
                    useGritterTool("<b><i class='fa fa-map-signs  '></i> Openness Search Configuration</b>", "we are sorry but an error has occurred", "danger");

                });
        }
        $scope.createOpnSearchRule = function(rule) {
            var dapaPost = rule; 
            dapaPost.op_mapping = JSON.parse(dapaPost.op_mapping);
            if(dapaPost.sendnotification==undefined)
            dapaPost.sendnotification=false 
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
                    if (response.data.success) {
                        useGritterTool("<b><i class='fa fa-map-signs  '></i> Openness Search Mapping Rule</b>", response.data.message);
                    } else {
                        useGritterTool("<b><i class='fa fa-map-signs  '></i> Openness Search Mapping Rule</b>", response.data.message, "danger");
                    }
                },
                function errorCallback(response) {

                    console.log("Error. while created user Try Again!", response);
                    useGritterTool("<b><i class='fa fa-map-signs  '></i> Openness Search Mapping Rule</b>", "we are sorry but an error has occurred", "danger");
                });




            resetRule();
        }
        $scope.removeOpnSearchRule = function(index) {
            var el_id = $scope.ListRules[index];
            if (confirm("Are you sure to delete the rule for the" + el_id._index + "?")) {


                console.log("el_id", el_id);
                $http({

                    method: 'DELETE',
                    url: baseContextPath + '/api/dservice/api/v1/opn/rule/' + el_id._id

                }).then(function successCallback(response) {

                        console.log(response.data);
                        console.log("User has created Successfully", response.data)
                        if (response.data.success) {
                            useGritterTool("<b><i class='fa fa-map-signs  '></i> Openness Search Mapping Rule</b>", response.data.message);
                        } else {
                            useGritterTool("<b><i class='fa fa-map-signs  '></i> Openness Search Mapping Rule</b>", response.data.message, "danger");
                        }
                        $scope.ListRules.splice(index, 1);
                    },
                    function errorCallback(response) {

                        console.log("Error. while created user Try Again!", response);
                        useGritterTool("<b><i class='fa fa-map-signs  '></i> Openness Search Mapping Rule</b>", "we are sorry but an error has occurred", "danger");

                    });
            }
        }

        $scope.opnUser = {
            "_id": "",
            "d_cid": "",
            "d_uid": "",
            "d_gid": "",
            "d_mail": "",
            "d_pwd": "",
            "d_isEncrypted": false
        }

        $http.get(baseContextPath + '/api/dservice/api/v1/opn/users', {}).then(function(retE) {
            var listusers = retE.data.data;
            listusers.forEach(el => {
                $scope.opnUser._id = el._id
                $scope.opnUser.d_cid = el.d_cid
                $scope.opnUser.d_uid = el.d_uid
                $scope.opnUser.d_gid = el.d_gid
                $scope.opnUser.d_mail = el.d_mail
                $scope.opnUser.d_pwd = el.d_pwd
                $scope.opnUser.d_isEncrypted = el.d_isEncrypted

                $scope.actualuser = {...$scope.opnUser}
                console.log("actualuser: ", $scope.actualuser)
            })
        });

        $scope.openUserConfig = function () {
            const dataPost = $scope.opnUser;
            if(dataPost?.d_pwd != $scope.actualuser?.d_pwd) {
                dataPost.d_isEncrypted = false
            }
            $http({
                method: 'POST',
                url: baseContextPath + '/api/dservice/api/v1/opn/setuser',
                data: {user: dataPost}
            }).then(function successCallback(response) {
                    response.data.data.forEach(el => {
                        console.log(el)
                        $scope.opnUser._id = el._id;
                        $scope.opnUser.d_isEncrypted = el.d_isEncrypted
                    });
                    if (response.data.success) {
                        useGritterTool("<b><i class='fa fa-map-signs'></i> Openness Search User</b>", "[" + $scope.opnUser.d_mail +
                            "] " + response.data.message);
                    } else {
                        useGritterTool("<b><i class='fa fa-map-signs'></i> Openness Search User</b>", response.data.message, "danger");
                    }
                },
                function errorCallback(response) {
                    console.log("Error. while created user Try Again!", response);
                    useGritterTool("<b><i class='fa fa-map-signs  '></i> Openness Search User</b>", "we are sorry but an error has occurred", "danger");

                });
        }

        
    });
