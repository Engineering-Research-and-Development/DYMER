angular.module('queryBCtrl', [])
    .controller('queryBController', function($scope, $http, $rootScope) {
        var baseContextPath = $rootScope.globals.contextpath;
        $scope.$on('$viewContentLoaded', function() {
            var myQueryModel = { "query": { "instance._index": { $ne: "entity_relation" } } };
            $http.get(baseContextPath + '/api/forms/api/v1/form/', { data: myQueryModel }).then(function(ret) {
                // Vvveb.listResources.setModels(ret.data.data);
                var indexWithModel = ret.data.data;
                var listIndex = [];
                indexWithModel.forEach(element => {
                    element.instance.forEach(el => {
                        if (el._index != 'general' && el._index != 'entity_relation')
                            listIndex.push(el._index);
                    });
                });
                $http.get(baseContextPath + '/api/entities/api/v1/entity/allindex', this.entData).then(function(rt) {
                    var allindex = rt.data.data;
                    for (const [key, value] of Object.entries(allindex)) {
                        if (!listIndex.includes(key)) {
                            var obj = {
                                title: key + " / No Model ",
                                instance: [{ _index: key }]
                            };
                            if (key != 'general')
                                indexWithModel.push(obj);
                        }
                    }

                    var inexListQuery = {};
                    indexWithModel.forEach(element => {
                        inexListQuery[element.instance[0]._index] = element.title;
                    });
                    var qbconfig = {};
                    qbconfig.filers = {};
                    qbconfig.filers["_index"] = inexListQuery;
                    addBindQueryBuilder(qbconfig);
                }).catch(function(response) {
                    console.log(response.status);
                })
            }).catch(function(response) {
                console.log(response.status);
            })


        });
    });