angular.module('entitiesControllers', [])
    .controller('addEntity', function($scope, $http, $rootScope) {
        var baseContextPath = $rootScope.globals.contextpath;
        //   console.log('testing controller addEntity');
        $scope.listaModels = [];
        // console.log('get my list');
        var par = { "query": { "instance._index": { "$ne": "general" } } };
        $http.get(baseContextPath + '/api/forms/api/v1/form/', {
            params: par
        }).then(function(ret) {
            // console.log('Data controller ', ret);

            return $scope.listaModels = ret.data.data;
        }).catch(function(response) {
            console.log(response.status);
        });
        $scope.loadHtmlForm = function(obj, index) {
            //  console.log('index', index);
            $scope.selected = index;
            $scope.formtitle = obj.title;
            $scope.objCreated = obj.created;
            $("#cont-RenderForm #html-torender").empty();
            $("#cont-RenderForm #appendfiles").empty();
            obj.files.forEach(element => {
                if (element.contentType == "text/html") {
                    const perm = checkPermission({}, 'create');
                    const grtHtml = grantHtml(perm);
                    $("#cont-RenderForm #html-torender").append(element.data);
                    $(grtHtml).insertBefore($('#entityForm .rendered-form .alert.alertaction'));
                }
                if (element.contentType == "text/css") {

                    // $("<style></style>").appendTo("#cont-RenderForm #appendfiles").html(element.data);
                }
            });
            setTimeout(function() {
                hookReleationForm();
                $('.selectpicker').selectpicker();
            }, 800);
        };
    })
    .controller('listEntities', function($scope, $http, $rootScope) {
        var baseContextPath = $rootScope.globals.contextpath;
        //  console.log('testing controller listEntities');
        $scope.indexEntities = []; // $scope.indexEntities = ["project", "geopoint"];
        $scope.listEntity = [];

        $scope.currentPage = 0;
        $scope.pageSize = 10;

        //das console.log('get my list');
        //var par = { "query": { "instance._index": { "$ne": "general" } } };
        var par = {

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
            }

        };

        $http.get(baseContextPath + '/api/entities/api/v1/entity/', {
            params: par
        }).then(function(ret) {
            //    console.log('Data controller ', ret.data.data);
            var templ_data = flatEsArray(ret.data.data);
            //       console.log('templ_data ', templ_data);
            var lst = [];
            ret.data.data.forEach(element => {
                var n_el = element._index;
                lst.indexOf(n_el) === -1 ? lst.push(n_el) : "";


            });
            //   console.log('lst ', lst);
            $scope.indexEntities = lst;
            $scope.listEntity = templ_data.arr;
        }).catch(function(response) {
            console.log(response.status);
        });
        $scope.RenderEntity = function(el, index) {
            //console.log('el.properties', el.properties.owner.uid, el.properties.owner.gid);


            document.getElementsByName("data[id]")[0].value = el._id;
            document.getElementsByName("data[properties][owner][uid]")[0].value = el.properties.owner.uid;
            document.getElementsByName("data[properties][owner][gid]")[0].value = el.properties.owner.gid;
            $scope.entityuid = el.properties.owner.uid;
            $scope.entitygid = el.properties.owner.gid;
            $scope.entityEid = el._id;
            $scope.selected = index;
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
            //el.created = new Date();
            drawEntities(callconf);
            $scope.objChanged = el.properties.changed;
            $scope.detailObj = el;

        };
        $scope.numberOfPages = function() {
            return Math.ceil($scope.listEntity.length / $scope.pageSize);
        }
        $scope.EditEntity = function(el) {
            //  console.log('elel', el);
            actualItem = el;
            editEntity(el._id);
            /*   kmsdataset = undefined;
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
*/
        };
        $scope.DeleteEntity = function(el) {
            //  console.log('Del', el);
            actualItem = el;
            deleteEntity(el._id);
        };


    }).filter('startFrom', function() {
        return function(input, start) {
            start = +start; //parse to int
            return input.slice(start);
        }
    });