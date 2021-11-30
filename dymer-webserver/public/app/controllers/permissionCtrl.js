angular.module('permissionCtrl', [])
    .controller('permissionController', function($scope, $http, $rootScope) {
        var baseContextPath = $rootScope.globals.contextpath;
        $scope.formData = {
            role: "",
                perms: {
                    "entities": {
                        view: [],
                        create: [],
                        edit: [],
                        delete: []
                    },
                    "modules": {
                        view: [],
                        create:[],
                        edit: [],
                        delete: []
                    }

                }
        };
        /*  $scope.formData.perms.entities={ view: "",update:"",edit:"", delete:""};*/
        $scope.copyAddPastIndType = function(el) {
            console.log('copyAddPastIndType', el);
            $scope.formData.perms.entities.view += el.instance[0]._index+",";
            $scope.formData.perms.entities.create += el.instance[0]._index+",";
            $scope.formData.perms.entities.edit += el.instance[0]._index+",";
            $scope.formData.perms.entities.delete += el.instance[0]._index+",";
        }

        function getListPerm() {
            console.log("permissionCtrl");
            //load permission
            var listPerm = [];
            var par = { "query": { "instance._index": { "$ne": "general" } } };
            $http.get(baseContextPath + '/api/dservice/api/v1/perm', {
                params: par
            }).then(function(retM) {
                console.log('retM_', retM.data.data);
                $scope.listPerm = retM.data.data;
                $scope.listRoles = retM.data.data;
            }).catch(function(response) {
                console.log(response.status);
            });
        }
        getListPerm();
        /*  var listRoles = [];
          var par = { "query": { "instance._index": { "$ne": "general" } } };
          $http.get(baseContextPath + '/api/dservice/api/v1/perm', {
              params: par
          }).then(function(retM) {
              console.log('retM_', retM);
              listRoles= retM.data.data;
              $scope.listRoles=listRoles;
               
  
          }).catch(function(response) {
              console.log(response.status);
          });*/


        /*  var permissionList = {
              "entities": [{
                  "type": "index1",
                  perm: {
                      r: ["app-user", "app-admin"],
                      w: ["app-admin"],
                      edit: [],
                      delete: []
                  }
              }]
          };*/
        var permissionList = [{
                role: "app-user",
                perms: {
                    "entities": {
                        view: ["proposal", "topic"],
                        create: ["topic"],
                        edit: [],
                        delete: []
                    },
                    "modules": {
                        view: ["topic", "proposal"],
                        create: ["topic"],
                        edit: [],
                        delete: []
                    }

                }
            },
            {
                role: "app-admin",
                perms: {
                    "entities": {
                        view: ["proposal", "topic"],
                        create: ["topic"],
                        edit: [],
                        delete: []
                    },
                    "modules": {
                        view: ["topic", "proposal"],
                        create: ["topic"],
                        edit: [],
                        delete: []
                    }

                }
            }

        ];

        //chiamata rest getall rules

        //creazione struttura
        /* $http.get(   'http://dihiwaredemo-dym.eng.it/auth/DymerRealm/clients/nodejs-microservice/roles', {
             
         }).then(function(retRoles) {
                console.log(retRoles);
         });
 
 */


        //$scope.listRoles=[{_id:"001", title:"app-admin"},{_id:"002", title:"app-user"}];

        $scope.listModels_ = [];
        $scope.listModelsAvailable = [];

        var listModels = [];
        var modelStr = '';
        var par = { "query": { "instance._index": { "$ne": "general" } } };
        $http.get(baseContextPath + '/api/forms/api/v1/form/', {
            params: par
        }).then(function(retM) {
            console.log('retM form', retM);

            listModels = retM.data.data;

            /*listModels.forEach(function(elTEm) {
                // elEnt.model.title = elTEm.title;
                modelStr += '' + elTEm.title + ', ';
            });
            //  console.log(modelStr);
            $scope.listModels_ = modelStr;*/
            $scope.listModels_ = listModels;

            console.log(listModels)
            $scope.listModelsAvailable = listModels;
        }).catch(function(response) {
            console.log(response.status);
        });

        $scope.copyPastIndTypeView = function(el) {

            $scope.formData.perms.entities.view = el.title;

        }




        var formdataMix = [];
        var id = "";
        $scope.saveconfigrules = function(formData) {
            var formData = this.formData;
            console.log(formData);



            formData.perms.entities.view = (formData.perms.entities.view) == undefined ? [] : (formData.perms.entities.view).split(",");
            formData.perms.entities.create = (formData.perms.entities.create) == undefined ? [] : (formData.perms.entities.create).split(",");
            formData.perms.entities.edit = (formData.perms.entities.edit) == undefined ? [] : (formData.perms.entities.edit).split(",");
            formData.perms.entities.delete = (formData.perms.entities.delete) == undefined ? [] : (formData.perms.entities.delete).split(",");

            console.log(formData.perms.entities.view);
            if (formData._id) {
                id = formData._id
            }


            /*  var permissionListData = {
                  role: formData.role,
                  perms: {
                      "entities": {
                          view: [formData.perms.entities.view],
                          create: [formData.perms.entities.create],
                          edit: [formData.perms.entities.edit],
                          delete: [formData.perms.entities.delete]
                      },
                      "modules": {
                          view: [],
                          create: [],
                          edit: [],
                          delete: []
                      }
      
                  }
              }*/


            //console.log(permissionListData);

            $http({

                method: 'POST',
                url: baseContextPath + '/api/dservice/api/v1/perm/' + id,
                data: { data: formData }

            }).then(function successCallback(response) {
                    console.log("Salvo configurazione");
                    console.log(response.data);
                    //$scope.listPerm.splice(index, 0,permissionListData);
                    useGritterTool("<b><i class='nc-icon nc-badge'></i> Permission Config</b>", response.data.message);
                    getListPerm();
                },
                function errorCallback(response) {
                    console.log("Error while create perms. Try Again!", response);

                });




        }

        $scope.removeRole = function(index) {
            var el_id = $scope.listPerm[index];

            //console.log("el_id", el_id);
            $http({

                method: 'DELETE',
                url: baseContextPath + '/api/dservice/api/v1/perm/' + el_id._id

            }).then(function successCallback(response) {

                    console.log(response.data);
                    useGritterTool("<b><i class='nc-icon nc-badge'></i> Permission Config</b>", response.data.message);
                    console.log("dDelet index success", response.data)
                    $scope.listPerm.splice(index, 1);
                },
                function errorCallback(response) {

                    console.log("Error. while delete index Try Again!", response);

                });
        }


        $scope.editRole = function(index) {
            var el_ = $scope.listPerm[index];
            console.log(el_);

            // $scope.formData.id=el_._id;

            $scope.formData = el_;
            /* var permissionListData = {
                 role: formData.role,
                 perms: {
                     "entities": {
                         view: [formData.perms.entities.view],
                         create: [formData.perms.entities.create],
                         edit: [formData.perms.entities.edit],
                         delete: [formData.perms.entities.delete]
                     },
                     "modules": {
                         view: [],
                         create: [],
                         edit: [],
                         delete: []
                     }
     
                 }
             }
            
     
             console.log(permissionListData);
     
              $http({
     
                 method: 'POST',
                 url: baseContextPath + '/api/dservice/api/v1/perm/'+el_id,
                 data: { data: permissionListData }
     
             }).then(function successCallback(response) {
                    console.log("UPDATE configurazione");
                     console.log(response.data);
                     useGritterTool("<b><i class='nc-icon nc-badge'></i> uPDATE Permission Config ROLE</b>", response.data.message);
                   },
                 function errorCallback(response) {
                       console.log("Error. while create perms. Try Again!", response);
     
                 });*/

        }


    });