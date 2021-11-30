angular.module('testtologCtrl', [])
    .controller('testtologController', function($scope, $http, $rootScope) {
        var baseContextPath = $rootScope.globals.contextpath;
        // $scope.listaModels = [];
        /*    
        var par = { "query": { "instance._index": { "$ne": "general" } } };
        $http.get('/api/forms/api/v1/form/', {
            params: par
        }).then(function(ret) {
           
            var res=ret.data.data;
            console.log('Data dashListModels ', res);
            $scope.totModels=res.length;
          //  return $scope.listaModels = ret.data.data;
        }).catch(function(response) {
            console.log(response.status);
        });
        
   */

        // $scope.listaModels = [];
        /*      var listTemplates=[];
              var par = { "query": { "instance._index": { "$ne": "general" } } };
              $http.get('/api/templates/api/v1/template/', {
                  params: par
              }).then(function(ret) {
                   
                   var res=ret.data.data;
                   console.log('Data dashListTemplates ', res);
                   listTemplates=res;
                   $scope.totTemplates=res.length;
                 // return $scope.listaModels = ret.data.data;
              }).catch(function(response) {
                  console.log(response.status);
              });
              */



        var listEntities = [];
        $http.get(baseContextPath + '/api/entities/api/v1/entity/allstats', {

        }).then(function(retE) {
            var res = retE.data.data;
            listEntities = res.indices;

            $scope.totIndices = listEntities.length;
            $scope.totEntities = res.total;
            //return $scope.listEntity = templ_data.arr;
        }).then(function() {

            var listTemplates = [];
            par = { "query": { "instance._index": { "$ne": "general" } } };
            $http.get(baseContextPath + '/api/templates/api/v1/template/', {
                params: par
            }).then(function(retT) {

                var res = retT.data.data;
                // console.log('Data dashListTemplates ', res);
                listTemplates = res;
                $scope.totTemplates = res.length;
                // return $scope.listaModels = ret.data.data;
                listEntities.forEach(function(elEnt) {
                    elEnt.templates = {
                        "fullcontent": {
                            'title': "",
                            'exsist': false
                        },
                        "teaserlist": {
                            'title': "",
                            'exsist': false
                        },
                        "teasermap": {
                            'title': "",
                            'exsist': false
                        }
                    }
                    listTemplates.forEach(function(elTEm) {
                        //   console.log('elTEm.instance ',elEnt.index, elTEm.instance);
                        (elTEm.instance).forEach(function(elTEmIN) {
                            if (elEnt.index == elTEmIN._index) {
                                (elTEm.viewtype).forEach(function(elVTEmIN) {
                                    //  console.log('elVTEmIN.rendertype ', elVTEmIN.rendertype);
                                    elEnt.templates[elVTEmIN.rendertype].exsist = true;
                                    elEnt.templates[elVTEmIN.rendertype].title = elTEm.title;
                                });
                            }
                        });
                    });


                });




                // console.log('listEntities',listEntities);
            }).then(function() {

                var listModels = [];
                var par = { "query": { "instance._index": { "$ne": "general" } } };
                $http.get(baseContextPath + '/api/forms/api/v1/form/', {
                    params: par
                }).then(function(retM) {

                    listModels = retM.data.data;
                    //  console.log('Data dashListModels ', listModels);
                    $scope.totModels = listModels.length;

                    listEntities.forEach(function(elEnt) {
                        elEnt.model = {
                            'title': "x",
                            'exsist': false
                        };
                        listModels.forEach(function(elTEm) {

                            (elTEm.instance).forEach(function(elTEmIN) {

                                if (elEnt.index == elTEmIN._index) {
                                    elEnt.model.title = elTEm.title;
                                    elEnt.model.exsist = true;

                                }
                            });
                        });


                    });


                    $scope.ListEntities = listEntities;

                    //  return $scope.listaModels = ret.data.data;
                }).catch(function(response) {
                    console.log(response.status);
                });









            }).catch(function(response) {
                console.log(response);
            });



        }).catch(function(response) {
            console.log(response.status);
        });






        /* $scope.RenderEntity = function(el) {
             console.log('elel', el);
             kmsdataset = undefined;
             var callconf = {
                 query: {

                     "query": {
                         "query": {
                             "match": {
                                 "_id": el._id
                             }
                         }
                     }
                 },
                 endpoint: 'entity.search',
                 viewtype: 'fullcontent',
                 target: {
                     fullcontent: {
                         id: "#cont-RenderForm",
                         action: "html",
                         reload: true
                     }
                 }
             };
             drawEntities(callconf);

         };*/
    });