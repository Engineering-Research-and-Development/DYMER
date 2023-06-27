angular.module('dusernmanageCtrl', [])
    .controller('dusernmanageController', function($scope, $http, $rootScope) {
        var baseContextPath = $rootScope.globals.contextpath; $rootScope.showConfigUser=false
        
let usrApi='/api/dservice/api/v1/duser';
let apiPath=baseContextPath+usrApi;
loadAllConfig();  
        function loadAllConfig() {
            $http.get(apiPath, {}).then(function(retE) {
                console.log("rere", retE.data);
                //   retE.data.data[0].mapping.dentity["_source"] = JSON.parse(retE.data.data[0].mapping.dentity["_source"]);
                $scope.ListUsers = retE.data.data;
                //return $scope.listEntity = templ_data.arr;
            });
        }

        $scope.saveConfigDUser = function(dataPost) {
                
            if (dataPost.active == undefined)
                dataPost.active = false; 
 console.log('dataPostAfter', dataPost); 
 let role=dataPost.roles;
 dataPost.roles=[{"role": role}];

              
            let uri =apiPath;
            let operation = "POST"; 
            delete dataPost["_id"];
            // return true;
            $http({
                method: operation,
                url: uri,
                data: dataPost
            }).then(function successCallback(response) {
                    console.log('post config response', response.data);
                    if (response.data.success) {
                        useGritterTool("<b><i class='nc-icon nc-single-02'></i>Dymer User</b>", response.data.message);
                        $scope.configUrs={};
                        $scope.ListUsers = [];
                        loadAllConfig();
                    } else {
                        useGritterTool("<b><i class='fa fa-exclamation-triangle'></i>Dymer User</b>", response.data.message, "danger");
                    } 
                },
                function errorCallback(response) {
                    console.log("Error. while created user Try Again!", response);
                });
        }
       
        $scope.removeConfigDUser = function(index) {
            var el_id = $scope.ListUsers[index];
            console.log("DELETE!", index);
            $http({
                method: 'DELETE',
                url:apiPath + '/' + el_id._id
            }).then(function successCallback(response) {
                    console.log('response delete', response);
                    $scope.ListUsers.splice(index, 1);
                },
                function errorCallback(response) {
                    console.log("Error. while delete Try Again!", response);

                });
        }
    });