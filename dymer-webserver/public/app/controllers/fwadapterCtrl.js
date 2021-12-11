angular.module('fwadapterCtrl', [])
    .controller('fwadapterController', function($scope, $http, $rootScope) {
        var baseContextPath = $rootScope.globals.contextpath;
        $scope.fwadapter = {
            config: {
                insert: { servicetype: "insert", id: '' },
                update: { servicetype: "update", id: '' },
                delete: { servicetype: "delete", id: '' }
            }
        };
        $http.get(baseContextPath + '/api/dservice/api/v1/fwadapter/configs', {}).then(function(retE) {
            var listconf = retE.data.data;
            console.log("fwadapter.config", retE);
            listconf.forEach(el => {
                $scope.fwadapter.config[el.servicetype].id = el._id;
                $scope.fwadapter.config[el.servicetype].configuration = el.configuration;
            });
        });
        $scope.savefwadapterConfig = function(opnconf) {
            var dapaPost = opnconf;
            $http({
                method: 'POST',
                url: baseContextPath + '/api/dservice/api/v1/fwadapter/setConfig',
                data: { data: dapaPost }
            }).then(function successCallback(response) {
                    console.log('response', response);
                    if (response.data.success) {
                        useGritterTool("<b><i class='fa fa-map-signs  '></i> FIWARE ADAPTER</b>", response.data.message);
                        response.data.data.forEach(el => {
                            $scope.fwadapter.config[el.servicetype].id = el.id;
                        });
                    } else {
                        useGritterTool("<b><i class='fa fa-map-signs  '></i> FIWARE ADAPTER</b>", response.data.message, "warning");
                    }
                },
                function errorCallback(response) {
                    useGritterTool("<b><i class='fa fa-map-signs  '></i> FIWARE ADAPTER</b>", response.data.message, "warning");
                    console.log("Error. FIWARE ADAPTER Try Again!", response);
                });
        }
    });