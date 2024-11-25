angular.module('authenticationConfigCtrl', [])
    .controller('authenticationConfigController', function($scope, $http, $rootScope) {
        var baseContextPath = $rootScope.globals.contextpath;
        loadAllConfig();
        console.log("authenticationConfigCtrl");
        $scope.configJWT = { authtype: "jwtparent" };
        $scope.configOIDC = { authtype: "oidc" };

        function loadAllConfig() {
            $http.get(baseContextPath + '/api/dservice/api/v1/authconfig', {}).then(function(retE) {
                console.log("rere", retE.data);
                //   retE.data.data[0].mapping.dentity["_source"] = JSON.parse(retE.data.data[0].mapping.dentity["_source"]);
                $scope.ListAuthentications = retE.data.data;
                //return $scope.listEntity = templ_data.arr;
            });
        }

        $scope.saveConfigAuthentication = function(dataPost) {
            // console.log('dataPost', dataPost);

            // dataPost.mapping.dentity["_index"] = (dataPost.mapping.dentity["_index"]).replace(/(\r\n|\n|\r)/gm, "").replace(/(^[ \t]*\n)/gm, "");
            console.log('dataPostAfter', dataPost);
            console.log('dataPostAfter id', dataPost["_id"]);
            if (dataPost.active == undefined)
                dataPost.active = false;
            if (dataPost.prop == undefined)
                dataPost.prop = {};

            let uri = baseContextPath + '/api/dservice/api/v1/authconfig';
            let operation = "POST";
            if (dataPost["_id"] != "" && dataPost["_id"] != undefined && dataPost["_id"] != "undefined") {
                operation = "PUT";
                uri += "/" + dataPost["_id"];
                delete dataPost["_id"];
            }
            delete dataPost["_id"];
            // return true;
            $http({
                method: operation,
                url: uri,
                data: dataPost
            }).then(function successCallback(response) {
                    console.log('post config response', response.data);
                    if (response.data.success) {
                        useGritterTool("<b><i class='nc-icon nc-vector'></i>Authentication Config</b>", response.data.message);
                        $scope.configBridge = {};
                        $scope.ListAuthentications = [];
                        loadAllConfig();
                        //  $scope.ListbridgeEntities.push(response.data.data);
                        /*  $http.get(baseContextPath + '/api/entities/api/v1/entity/entitiesbridge', {}).then(function(retE) {
                              console.log("rere", retE.data);
                              $scope.ListbridgeEntities = retE.data.data;
                              //return $scope.listEntity = templ_data.arr;
                          });*/
                    } else {
                        useGritterTool("<b><i class='fa fa-exclamation-triangle'></i> Bridge Config</b>", response.data.message, "danger");
                    }

                    /*   response.data.data.forEach(element => {
                          
                       });*/
                },
                function errorCallback(response) {
                    console.log("Error. while created user Try Again!", response);
                });
        }
        $scope.setupdateConfigAuthentication = function(index, tp) {
            //  console.log("setupdateConfigBridge", $scope.ListbridgeEntities[index], tp, tp == 'clone');
            $scope.showConfigAuthentication = true;
            var tmpConf = angular.copy($scope.ListAuthentications[index]);

            /*tmpConf.mapping.extentity = JSON.stringify(tmpConf.mapping.extentity, null, "");
            tmpConf.mapping.dentity["_index"] = JSON.stringify(tmpConf.mapping.dentity["_index"], null, "");
            tmpConf.mapping.dentity["_type"] = JSON.stringify(tmpConf.mapping.dentity["_type"], null, "");*/
            if (tmpConf.authtype == 'jwtparent') {
                $scope.configJWT = tmpConf;
            }
            if (tmpConf.authtype == 'oidc') {
                $scope.configOIDC = tmpConf;
            }

        }
        $scope.removeConfigAuthentication = function(index) {
            var el_id = $scope.ListAuthentications[index];
            console.log("DELETE!", index);
            $http({
                method: 'DELETE',
                url: baseContextPath + '/api/dservice/api/v1/authconfig/' + el_id._id
            }).then(function successCallback(response) {
                    //console.log('response delete', response);
                    $scope.ListAuthentications.splice(index, 1);
                },
                function errorCallback(response) {
                    console.log("Error. while delete Try Again!", response);

                });
        }
    });