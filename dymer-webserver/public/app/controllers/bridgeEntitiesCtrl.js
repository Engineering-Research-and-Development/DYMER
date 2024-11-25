angular.module('bridgeEntitiesCtrl', [])
    .controller('bridgeEntitiesController', function($scope, $http, $rootScope) {
        var baseContextPath = $rootScope.globals.contextpath;
        loadAllConfig();
        console.log("bridgeEntitiesCtrl");

        function loadAllConfig() {
            $http.get(baseContextPath + '/api/entities/api/v1/entity/entitiesbridge/false', {}).then(function(retE) {
                console.log("rere", retE.data);
                //   retE.data.data[0].mapping.dentity["_source"] = JSON.parse(retE.data.data[0].mapping.dentity["_source"]);
                $scope.ListbridgeEntities = retE.data.data;
                //return $scope.listEntity = templ_data.arr;
            });
        }

        $scope.saveConfigBridge = function(dataPost) {
            // console.log('dataPost', dataPost);
            /* dataPost.mapping.extentity = JSON.parse(dataPost.mapping.extentity);
             dataPost.mapping.dentity["_source"] = JSON.parse(dataPost.mapping.dentity["_source"]);
             dataPost.mapping.dentity["properties"] = JSON.parse(dataPost.mapping.dentity["properties"]);*/
            dataPost.mapping.dentity["_index"] = (dataPost.mapping.dentity["_index"]).replace(/(\r\n|\n|\r)/gm, "").replace(/(^[ \t]*\n)/gm, "");
            dataPost.mapping.dentity["_type"] = (dataPost.mapping.dentity["_type"]).replace(/(\r\n|\n|\r)/gm, "").replace(/(^[ \t]*\n)/gm, "");
            dataPost.mapping.dentity["_id"] = (dataPost.mapping.dentity["_id"]).replace(/(\r\n|\n|\r)/gm, "").replace(/(^[ \t]*\n)/gm, "");
            dataPost.mapping.dentity["_source"] = (dataPost.mapping.dentity["_source"]).replace(/(\r\n|\n|\r)/gm, "").replace(/(^[ \t]*\n)/gm, "");
            dataPost.mapping.dentity["properties"] = (dataPost.mapping.dentity["properties"]).replace(/(\r\n|\n|\r)/gm, "").replace(/(^[ \t]*\n)/gm, "");
            dataPost.mapping.extentity = (dataPost.mapping.extentity).replace(/(\r\n|\n|\r)/gm, "").replace(/(^[ \t]*\n)/gm, "");
            //dataPost.api.create.mapping={};
            if (dataPost.api.hasOwnProperty("create"))
                dataPost.api.create.mapping.extentity = (dataPost.api.create.mapping.extentity).replace(/(\r\n|\n|\r)/gm, "").replace(/(^[ \t]*\n)/gm, "");
            dataPost.api.search.mapping.query = (dataPost.api.search.mapping.query).replace(/(\r\n|\n|\r)/gm, "").replace(/(^[ \t]*\n)/gm, "");
            if (dataPost.api.hasOwnProperty("update"))
                dataPost.api.update.mapping.extentity = (dataPost.api.update.mapping.extentity).replace(/(\r\n|\n|\r)/gm, "").replace(/(^[ \t]*\n)/gm, "");
            if (dataPost.api.hasOwnProperty("patch"))
                dataPost.api.patch.mapping.extentity = (dataPost.api.patch.mapping.extentity).replace(/(\r\n|\n|\r)/gm, "").replace(/(^[ \t]*\n)/gm, "");
            if (dataPost.api.hasOwnProperty("delete"))
                dataPost.api.delete.mapping.extentity = (dataPost.api.delete.mapping.extentity).replace(/(\r\n|\n|\r)/gm, "").replace(/(^[ \t]*\n)/gm, "");
            console.log('dataPostAfter', dataPost);
            console.log('dataPostAfter id', dataPost["_id"]);
            let uri = baseContextPath + '/api/entities/api/v1/entity/entitiesbridge';
            let operation = "POST";
            if (dataPost["_id"] != "") {
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
                        useGritterTool("<b><i class='nc-icon nc-vector'></i> Bridge Config</b>", response.data.message);
                        $scope.configBridge = {};
                        $scope.ListbridgeEntities = [];
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
        $scope.setupdateConfigBridge = function(index, tp) {
            //  console.log("setupdateConfigBridge", $scope.ListbridgeEntities[index], tp, tp == 'clone');
            $scope.showConfigBridgeEntities = true;
            var tmpConf = angular.copy($scope.ListbridgeEntities[index]);

            tmpConf.mapping.extentity = JSON.stringify(tmpConf.mapping.extentity, null, "");
            tmpConf.mapping.dentity["_index"] = JSON.stringify(tmpConf.mapping.dentity["_index"], null, "");
            tmpConf.mapping.dentity["_type"] = JSON.stringify(tmpConf.mapping.dentity["_type"], null, "");
            if (tp == 'clone') {
                tmpConf["_id"] = "";
                tmpConf["title"] = tmpConf["title"] + " Copy";
            }
            tmpConf.mapping.dentity["_id"] = JSON.stringify(tmpConf.mapping.dentity["_id"], null, "");
            tmpConf.mapping.dentity["_source"] = JSON.stringify(tmpConf.mapping.dentity["_source"], null, "");
            tmpConf.mapping.dentity["properties"] = JSON.stringify(tmpConf.mapping.dentity["properties"], null, "");
            if (tmpConf.api.hasOwnProperty("create"))
                tmpConf.api.create.mapping.extentity = JSON.stringify(tmpConf.api.create.mapping.extentity, null, "");
            if (tmpConf.api.hasOwnProperty("update"))
                tmpConf.api.update.mapping.extentity = JSON.stringify(tmpConf.api.update.mapping.extentity, null, "");
            if (tmpConf.api.hasOwnProperty("delete"))
                tmpConf.api.delete.mapping.extentity = JSON.stringify(tmpConf.api.delete.mapping.extentity, null, "");
            if (tmpConf.api.hasOwnProperty("patch"))
                tmpConf.api.patch.mapping.extentity = JSON.stringify(tmpConf.api.patch.mapping.extentity, null, "");
            tmpConf.api.search.mapping.query = JSON.stringify(tmpConf.api.search.mapping.query, null, "");
            // delete tmpConf._id;
            $scope.configBridge = tmpConf;
        }
        $scope.removeConfigBridge = function(index) {
            var el_id = $scope.ListbridgeEntities[index];
            console.log("DELETE!", index);
            $http({
                method: 'DELETE',
                url: baseContextPath + '/api/entities/api/v1/entity/entitiesbridge/' + el_id._id
            }).then(function successCallback(response) {
                    //console.log('response delete', response);
                    $scope.ListbridgeEntities.splice(index, 1);
                },
                function errorCallback(response) {
                    console.log("Error. while delete Try Again!", response);

                });
        }
    });