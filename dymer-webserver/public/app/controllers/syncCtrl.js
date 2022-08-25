angular.module('syncCtrl', [])
    .controller('syncController', function($scope, $http, $rootScope) {
        var baseContextPath = $rootScope.globals.contextpath;
        loadAllConfig();
        //   console.log("syncCtrl");

        function loadAllConfig() {
            $http.get(baseContextPath + '/api/dservice/api/v1/sync/listrules', {}).then(function(retE) {
                //        console.log("rere", retE.data);
                //   retE.data.data[0].mapping.dentity["_source"] = JSON.parse(retE.data.data[0].mapping.dentity["_source"]);
                $scope.List = retE.data.data;
                //return $scope.listEntity = templ_data.arr;
            });
        }
        $scope.loadrelcont = function() {
            console.log("eccolo");
        }

        $scope.saveSYNC = function(dataPost) {
            // console.log('dataPost', dataPost);

            console.log('dataPost.cond', dataPost.cond);
            if (dataPost.active == undefined)
                dataPost.active = false;
            if (dataPost.sendrelation == undefined)
                dataPost.sendrelation = false;

            let uri = baseContextPath + '/api/dservice/api/v1/sync';
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
                        useGritterTool("<b><i class='nc-icon nc-vector'></i>SYNC Config</b>", response.data.message);
                        $scope.configSYNC = {};
                        $scope.List = [];
                        loadAllConfig();
                        //  $scope.ListbridgeEntities.push(response.data.data);
                        /*  $http.get(baseContextPath + '/api/entities/api/v1/entity/entitiesbridge', {}).then(function(retE) {
                              console.log("rere", retE.data);
                              $scope.ListbridgeEntities = retE.data.data;
                              //return $scope.listEntity = templ_data.arr;
                          });*/
                    } else {
                        useGritterTool("<b><i class='fa fa-exclamation-triangle'></i> SYNC Config</b>", response.data.message, "danger");
                    }

                    /*   response.data.data.forEach(element => {
                          
                       });*/
                },
                function errorCallback(response) {
                    console.log("Error. while create Try Again!", response);
                });
        }
        $scope.setupdateSYNC = function(index, tp) {
                //  console.log("setupdateConfigBridge", $scope.ListbridgeEntities[index], tp, tp == 'clone');
                $scope.showConfigAuthentication = true;
                var tmpConf = angular.copy($scope.List[index]);
                if (tp == 'clone') {
                    tmpConf["_id"] = "";
                    tmpConf["title"] = tmpConf["title"] + " Copy";
                }
                /*tmpConf.mapping.extentity = JSON.stringify(tmpConf.mapping.extentity, null, "");
                tmpConf.mapping.dentity["_index"] = JSON.stringify(tmpConf.mapping.dentity["_index"], null, "");
                tmpConf.mapping.dentity["_type"] = JSON.stringify(tmpConf.mapping.dentity["_type"], null, "");*/

                $scope.configSYNC = tmpConf;


            }
            /*
$scope.runSYNC = function(index) {
var el_id = $scope.List[index];
let pathRun = baseContextPath + '/api/dservice/api/v1/import/fromdymer/' + el_id._id;
$http.get(pathRun, {}).then(function(response) {
    if (response.data.success) {
        useGritterTool("<b><i class='nc-icon nc-vector'></i>Run cron invoked </b>", response.data.message);
 
 
    } else {
        useGritterTool("<b><i class='fa fa-exclamation-triangle'></i>Error.Try Again!</b>", response.data.message, "danger");
    }
});
 
 
}*/
        $scope.removeSYNC = function(index) {
            var el_id = $scope.List[index];
            //     console.log("DELETE!", index);
            $http({
                method: 'DELETE',
                url: baseContextPath + '/api/dservice/api/v1/sync/' + el_id._id
            }).then(function successCallback(response) {
                    console.log('response delete', response);
                    $scope.List.splice(index, 1);
                },
                function errorCallback(response) {
                    console.log("Error. while delete Try Again!", response);

                });
        }
    });