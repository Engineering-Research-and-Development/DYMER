angular.module('dashCtrl', ['nvd3'])
  .controller('dashController', function($scope, $http, $location, $browser, $rootScope, exportEntities) {      
    //.controller('dashController', function ($scope, $http, $location, $browser, $rootScope) {
        var baseContextPath = $rootScope.globals.contextpath; //$rootScope.site_prefix; //'/d4ptest/'; //$browser.baseHref();
        $scope.redison = false;
        $scope.tab = 1;
        $scope.dtlalestEntCreated = [];
        $scope.dtlalestEntUpdated = [];
        $http.get(baseContextPath + '/info/json', {}).then(function (retE) {
            $scope.version = retE.data.version;
        });
        $http.get(baseContextPath + '/api/system/logtypes', {}).then(function (retE) {
            // console.log('logtypes', retE);
            $scope.logstype = retE.data.data.msg;
        });

        /* $http.get(baseContextPath + '/api2/retriveinfoidpadmin', {
             //$http.get(baseContextPath + '/api2/retriveinfoidp', {
         }).then(function(retE) {
             localStorage.setItem('DYM', retE.data["DYM"]);
             localStorage.setItem('DYMisi', retE.data["DYMisi"]);
             document.cookie = "lll=" + retE.data["DYM"];
             document.cookie = "DYMisi=" + retE.data["DYMisi"];
             localStorage.setItem('d_uid', retE.data.d_uid);
             localStorage.setItem('d_appuid', retE.data.d_appuid);
             localStorage.setItem('d_gid', retE.data.d_gid);
         })*/
        var listEntities = [];
        //console.log('baseContextPath', baseContextPath + '/api/entities/api/v1/entity/allstats');

        $http.get(baseContextPath + '/api/entities/api/v1/entity/allstatsglobal', {
        }).then(function (retE) {
            //  console.log('retE',retE);
            var res = retE.data.data;
            let countrela = 0;
            listEntities = res.indices;
            var lisrl = listEntities.filter(function (el) {
                return el.index == "entity_relation";
            })[0];
            if (lisrl != undefined) {
                countrela = lisrl["count"];
            }
            listEntities = listEntities.filter(function (el) {
                return el.index !== "entity_relation";
            });
            $scope.totIndices = listEntities.length;
            //  console.log('listEntities.length',listEntities.length);
            $scope.totEntities = res.total - countrela;

            $scope.totRelations = countrela;
            $http.get(baseContextPath + '/api/entities/uuid', {

            }).then(function (retU) {

                $scope.uuid = retU.data.data.uuid;

                //return $scope.listEntity = templ_data.arr;
            })
            //return $scope.listEntity = templ_data.arr;
        }).then(function () {

            var listTemplates = [];
            par = { "query": { "instance._index": { "$ne": "general" } } };
            $http.get(baseContextPath + '/api/templates/api/v1/template/', {
                params: par
            }).then(function (retT) {
                var res = retT.data.data;
                listTemplates = res;
                $scope.totTemplates = res.length;
                listEntities.forEach(function (elEnt) {
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
                        },
                        "teaser": {
                            'title': "",
                            'exsist': false
                        }
                    }
                    listTemplates.forEach(function (elTEm) {
                        (elTEm.instance).forEach(function (elTEmIN) {
                            if (elEnt.index == elTEmIN._index) {
                                (elTEm.viewtype).forEach(function (elVTEmIN) {
                                    elEnt.templates[elVTEmIN.rendertype].exsist = true;
                                    elEnt.templates[elVTEmIN.rendertype].title = elTEm.title;
                                });
                            }
                        });
                    });
                });
            }).then(function () {
                var listModels = [];
                var par = { "query": { "instance._index": { "$ne": "general" } } };
                $http.get(baseContextPath + '/api/forms/api/v1/form/', {
                    params: par
                }).then(function (retM) {
                    //console.log('retM', retM);
                    listModels = retM.data.data;
                    $scope.totModels = listModels.length;
                    listEntities.forEach(function (elEnt) {
                        elEnt.model = {
                            'title': "x",
                            'exsist': false
                        };
                        listModels.forEach(function (elTEm) {
                            (elTEm.instance).forEach(function (elTEmIN) {
                                if (elEnt.index == elTEmIN._index) {
                                    elEnt.model.title = elTEm.title;
                                    elEnt.model.exsist = true;
                                }
                            });
                        });
                    });
                    $scope.ListEntities = listEntities;
                    jQuery(document).ready(function () {
                        jQuery('#dtModelsIndex').DataTable();
                        jQuery('#dtTemplateIndex').DataTable();
                    });
                    //  return $scope.listaModels = ret.data.data;
                }).catch(function (response) {
                    console.log(response.status);
                });
            }).catch(function (response) {
                console.log(response);
            });

        }).catch(function (response) {
            console.log(response.status);
        }).then(function () {
            $http.get(baseContextPath + "/api/entities/api/v1/entity/redisstate").then(function (rts) {

                if (rts.data.data.value == 1)
                    $scope.redison = true;
            })
        }).catch(function (response) {
            console.log(response);
        });

        /* giaisg */
        $scope.deleteAllEntityByIndex = function (obj, ind) {
            if (confirm("Are you sure to flush all entities with index '" + obj.index + "'?")) {
                //console.log("deleted ", obj.index);
                var par = { "index": obj.index };
                $http.get(baseContextPath + '/api/entities/api/v1/entity/deleteAllEntityByIndex', {
                    params: par
                }).then(function (rt) {
                    console.log("deleted done", rt);
                    $scope.ListEntities[ind].count = 0;
                }).catch(function (response) {
                    console.log(response.status);
                });
            }
        };

        $scope.deleteAllEntityAndIndexByIndex = function (obj, ind) {
            if (confirm("Are you sure to delete the index '" + obj.index + "' and  entities?")) {
                //console.log("deleted ", obj.index);
                var par = { "index": obj.index };
                //console.log(par);
                $http.get(baseContextPath + '/api/entities/api/v1/entity/deleteAllEntityAndIndexByIndex', {
                    params: par
                }).then(function (rt) {

                    //console.log("deleted done", rt);
                    $scope.ListRules.splice(ind, 1);
                }).catch(function (response) {
                    console.log(response.status);
                });
            }
        };
        $scope.exportent = function (obj, ind) {
          exportEntities.exportJSONFormat(baseContextPath, obj)
           
        };

        $scope.invalidateCache = function (obj) {
            if (confirm("Are you sure to invalidate the cache for index " + obj.index + "?")) {
                //console.log("deleted ", obj.index);
                var par = { "index": obj.index };
                //console.log(par);
                $http.post(`${baseContextPath}/api/entities/api/v1/entity/invalidatecache/${obj.index}`, {

                }).then(function (rt) {
                    useGritterTool("<b><i class='fa fa-database  '></i> Redis</b>", "invalidated cache for " + obj.index);
                    //  console.log("invalidated cache 111");

                }).catch(function (response) {
                    useGritterTool("<b><i class='fa fa-database   '></i> Redis</b>", "Error on invalidate chache", "warning");
                    //  console.log(response.status);
                });
            }
        };

        $scope.invalidateAllCache = function (obj, ind) {
            if (confirm("Are you sure to invalidate all cache?")) {

                $http.post(`${baseContextPath}/api/entities/api/v1/entity/invalidateallcache`, {

                }).then(function (rt) {
                    useGritterTool("<b><i class='fa fa-database   '></i> Redis</b>", "invalidated cache");
                    //  console.log("invalidated cache");

                }).catch(function (response) {
                    useGritterTool("<b><i class='fa fa-database   '></i> Redis</b>", "Error on invalidate chache", "warning");
                    //  console.log(response.status);
                });
            }
        };
        var color = d3.scale.category20()
        $http.get(baseContextPath + '/api/entities/api/v1/entity/relationstat/', {

        }).then(function (ret) {
            $scope.data = {
                "nodes": [],
                "links": []
            };
            ret.data.data.forEach(element => {
                let newitm = {
                    "name": element.key,
                    "group": element.key
                };
                // console.log('element', element);
                if ($scope.data.nodes.find(x => x.name === element.key) == undefined)
                    $scope.data.nodes.push(newitm)
                element._index2.buckets.forEach(sub => {

                    let newSitm = { "name": sub.key, "group": sub.key, "doc_count": sub.doc_count };

                    if ($scope.data.nodes.find(x => x.name === sub.key) == undefined)
                        $scope.data.nodes.push(newSitm)

                });
            });
            ret.data.data.forEach(element => {
                let sourc = $scope.data.nodes.find(x => x.name === element.key);
                element._index2.buckets.forEach(sub => {
                    //console.log('sub', sub.doc_count);
                    let targ = $scope.data.nodes.find(x => x.name === sub.key);
                    let newLk = {
                        "source": sourc,
                        "target": targ,
                        "title": sub.doc_count
                    };
                    //if ($scope.data.links.indexOf(newLk) === -1)
                    $scope.data.links.push(newLk)
                });
            });


        }).catch(function (response) {
            console.log(response);
        });

        $scope.options = {
            chart: {

                type: 'forceDirectedGraph',
                height: 250,
                width: 500,
                margin: { top: 5, right: 5, bottom: 5, left: 5 },
                color: function (d) {
                    return color(d.group)
                },
                nodeExtras: function (node) {
                    node && node
                        .append("text")
                        .attr("dx", 8)
                        .attr("dy", ".35em")
                        .text(function (d) { return d.name; })
                        .style('font-size', '10px');
                },
                //linkDist: 120,
                /*linkExtras: function(link) {
                    link && link
                        .selectAll("line")
                        .append("text")
                        .style("stroke", "#ff000")
                        .attr("stroke", "#ff0000")
                        .text(function(d) { console.log("d", d); return d.doc_count; })
                }*/
                linkExtras: function (link) {
                    d3.selectAll("line").append("title")
                        .text(function (d) { //console.log("d.target.doc_count", d.target.doc_count); 
                            return d.target.doc_count;
                        });
                }
            },


        };

        let lalestEnt = function (size, sort, idDt, lista) {

            // $scope.indexEntities = []; // $scope.indexEntities = ["project", "geopoint"];
            // $scope.listEntity = [];
            //das console.log('get my list');
            //var par = { "query": { "instance._index": { "$ne": "general" } } };

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
                    "fields": { "include": ["title", "properties"] },
                    size: size,
                    sort: sort
                }
            };
            $http.post(baseContextPath + '/api/entities/api/v1/entity/_search', par).then(function (ret) {
                $scope[lista] = ret.data.data;
                jQuery(document).ready(function () {
                    jQuery(idDt).DataTable();

                });
            }).catch(function (response) {
                console.log(response.status);
            });
        }

        lalestEnt(30, ["properties.created:desc"], '#dtlalestEntCreated', 'dtlalestEntCreated');
        lalestEnt(30, ["properties.changed:desc"], '#dtlalestEntUpdated', 'dtlalestEntUpdated');
    });