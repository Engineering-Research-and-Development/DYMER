angular.module('relationsCtrl', [])
    .controller('relationsController', function($scope, $http, $rootScope, $compile, $window) {
        var baseContextPath = $rootScope.globals.contextpath;
        $scope.indexEntities = []; // $scope.indexEntities = ["project", "geopoint"];
        let listEntity = [];
        var table;
        let par = {
            query: {
                "query": {
                    "bool": {
                        "must_not": {
                            "match": {
                                "_index": "entity_relation"
                            }
                        }
                    }
                }
            },
            "qoptions": {
                "relations": false,
                "fields": { "include": ["title"] }
            }
        };
        $http.post(baseContextPath + '/api/entities/api/v1/entity/_search',
            par
        ).then(function(ret) {
            listEntity = ret.data.data;
            $scope.listentities = listEntity;
            loadtable(listEntity);
        }).catch(function(response) {
            console.log(response.status);
            useGritterTool("<b><i class='fa fa-exclamation-triangle'></i> Manage Relation</b>", "Error on load entities !", "danger");
        });
        $scope.selectedEntRel = function(type) {
            if (type == "sel1") {
                $scope.configManageRel.index1 = listEntity.find(o => o._id == $scope.configManageRel.id1)._index;
                $scope.configManageRel.title1 = listEntity.find(o => o._id == $scope.configManageRel.id1).title;
            }
            if (type == "sel2") {
                $scope.configManageRel.index2 = listEntity.find(o => o._id == $scope.configManageRel.id2)._index;
                $scope.configManageRel.title2 = listEntity.find(o => o._id == $scope.configManageRel.id2).title;
            }
        }

        $scope.saveManageRel = function(dataPost) {
            let uri = baseContextPath + '/api/entities/api/v1/entity/singlerelation/';
            let operation = "POST";
            let dataPostid = dataPost["_id"];
            if (dataPost["_id"] != "" && dataPost["_id"] != undefined && dataPost["_id"] != "undefined") {
                operation = "PUT";
                uri += dataPost["_id"];
                delete dataPost["_id"];
            }
            delete dataPost["_id"];
            let elfounded = $scope.listrels.find(o => ((o._id1 == dataPost.id1 && o._id2 == dataPost.id2 && o._index1 == dataPost.index1 && o._index2 == dataPost.index2) ||
                (o._id1 == dataPost.id2 && o._id2 == dataPost.id1 && o._index1 == dataPost.index2 && o._index2 == dataPost.index1)));
            if (elfounded) {
                useGritterTool("<b><i class='fa fa-exclamation-triangle'></i> Manage Relation</b>", "already exists", "warning");
                return true;
            }
            if ($.fn.DataTable.isDataTable('#example')) {
                $('#example').DataTable().clear().destroy();
            }
            $http({
                method: operation,
                url: uri,
                data: dataPost
            }).then(function successCallback(response) {
                    if (response.data.success) {
                        useGritterTool("<b><i class='nc-icon nc-vector'></i> Manage Relation </b>", response.data.message);
                        if (operation == "POST") {
                            $scope.listrels.push({
                                "_id": response.data.extraData._id,
                                "_index1": dataPost.index1,
                                "title1": dataPost.title1,
                                "_id1": dataPost.id1,
                                "_index2": dataPost.index2,
                                "title2": dataPost.title2,
                                "_id2": dataPost.id2
                            });
                        } else {
                            let indof = $scope.listrels.findIndex(o => o._id == dataPostid);
                            $scope.listrels[indof] = {
                                "_id": dataPostid,
                                "_index1": dataPost.index1,
                                "title1": dataPost.title1,
                                "_id1": dataPost.id1,
                                "_index2": dataPost.index2,
                                "title2": dataPost.title2,
                                "_id2": dataPost.id2
                            };
                        }
                        setTimeout(function() {
                            table = jQuery('#example').DataTable().rows();
                        }, 2000);

                    } else {
                        useGritterTool("<b><i class='fa fa-exclamation-triangle'></i> Manage Relation</b>", response.data.message, "danger");
                    }
                },
                function errorCallback(response) {
                    console.log("Error. while save Try Again!", response);
                    useGritterTool("<b><i class='fa fa-exclamation-triangle'></i> Manage Relation</b>", "Error. while save Try Again!", "danger");
                });
        }

        $scope.setupdateManageRel = function(index, tp) {
            $scope.showConfigAuthentication = true;
            var tmpConf = angular.copy($scope.listrels[index]);
            $scope.configManageRel = { _id: tmpConf._id, id1: tmpConf._id1, id2: tmpConf._id2, title1: tmpConf.title1, title2: tmpConf.title2, index1: tmpConf._index1, index2: tmpConf._index2 };
        }

        function loadtable(listE) {
            let par = {
                query: {
                    "query": {
                        "bool": {
                            "must": {
                                "term": {
                                    "_index": "entity_relation"
                                }
                            }
                        }
                    }
                },
                "qoptions": {
                    "relations": false,
                    "sort": ["_index1.keyword:asc"]
                }
            };
            $http.post(baseContextPath + '/api/entities/api/v1/entity/_search', par).then(function(ret) {
                let lista = ret.data.data;
                lista.forEach(element => {
                    let objtitle1 = listE.find(o => o._id == element._id1);
                    let objtitle2 = listE.find(o => o._id == element._id2);
                    element["title1"] = (objtitle1 != undefined) ? objtitle1.title : "Entity not found";
                    element["title2"] = (objtitle2 != undefined) ? objtitle2.title : "Entity not found";
                });
                $scope.listrels = lista;
                jQuery(document).ready(function() {
                    if ($.fn.DataTable.isDataTable('#example')) {
                        $('#example').DataTable().destroy();
                    }
                    table = jQuery('#example').DataTable().rows();
                });
            }).catch(function(response) {
                console.log(response.status);
                useGritterTool("<b><i class='fa fa-exclamation-triangle'></i> Manage Relation</b>", "Error. while load table!", "danger");
            });
        }


        $scope.deleteRelationById = function(indexel, obj) {
            //console.log('obj', obj);
            if (confirm("Are you sure to delete the relation between '" + obj.title1 + "' and '" + obj.title2 + "'?")) {
                $http.delete(baseContextPath + '/api/entities/api/v1/entity/singlerelation/' + obj._id, { data: obj }).then(function(response) {
                    if (response.data.success) {
                        $scope.listrels.splice(indexel, 1);
                        let tmplist = angular.copy($scope.listrels);
                        if ($.fn.DataTable.isDataTable('#example')) {
                            $('#example').DataTable().clear().destroy();
                        }
                        $scope.listrels = tmplist;
                        useGritterTool("<b><i class='nc-icon nc-vector    '></i> Manage Relation </b>", response.data.message);
                        //  table.row($("#" + obj._id)).remove().draw();
                        setTimeout(function() {
                            table = jQuery('#example').DataTable().rows();
                        }, 2000);
                    } else {
                        useGritterTool("<b><i class='nc-icon nc-vector    '></i> Manage Relation </b>", response.data.message, "danger");
                    }
                }).catch(function(response) {
                    console.log(response.status);
                    useGritterTool("<b><i class='fa fa-exclamation-triangle'></i> Manage Relation</b>", "Error in relation delete !", "danger");
                });
            }
        };


    });