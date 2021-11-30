angular.module('templateControllers', [])
    .controller('templCtrl', function($scope, $http) {
        //listTempl
        var baseContextPath = $rootScope.globals.contextpath;
        //    console.log('testing controller templCtrl');


        this.postObj = function(entData) {
            //        console.log('form submit', this.entData);
            $http.post(baseContextPath + '/templates/api/v1/....', this.entData).then(function(data) {
                //      console.log('Data controller ', data);
                $scope.success = "Post created successfully";
            });;
        };
    })
    .controller('listTempl', function($scope, $http, $rootScope) {
        var baseContextPath = $rootScope.globals.contextpath;
        $scope.listaTemplates = [];
        console.log('get my list', baseContextPath);
        $http.get(baseContextPath + '/api/templates/api/v1/template/', this.entData).then(function(ret) {
            // console.log('Data controller ', ret);

            return $scope.listaTemplates = ret.data.data;
        }).catch(function(response) {
            console.log(response.status);
        });
        $scope.loadHtmlTemplate = function(obj, index) {
            //         console.log('evvai', obj);
            $scope.selected = index;
            $scope.templtitle = obj.title;
            $scope.objChanged = obj.created;
            $("#cont-RenderForm #html-torender").empty();
            $("#cont-RenderForm #appendfiles").empty();
            obj.files.forEach(element => {
                // console.log('/api/templates/api/v1/template/' + element.path);
                if (element.contentType == "text/html") {
                    /*
                    $http.get('/api/templates/api/v1/template/' + element.path, this.entData).then(function(ret) {
                        //console.log('Data controller ', ret.data);

                        $("#cont-RenderForm #html-torender").append(ret.data);
                    }).catch(function(response) {
                        console.log(response.status);
                    });
                    */
                    $("#cont-RenderForm #html-torender").append(element.data);
                }
                if (element.contentType == "text/css") {
                    /*
                    $http.get('/api/templates/api/v1/template/' + element.path, this.entData).then(function(ret) {
                        //  console.log('Data css ', ret.data);

                        $("<style></style>").appendTo("#cont-RenderForm #appendfiles").html(ret.data);
                    }).catch(function(response) {
                        console.log(response.status);
                    });
                    */
                    $("<style></style>").appendTo("#cont-RenderForm #appendfiles").html(element.data);
                }
            });
        }

        $scope.loadDetailsTemplate = function(obj, index) {
            //  console.log('evvai', obj);
            $scope.selected = index;
            $scope.templtitle = obj.title;
            var jsonPretty = JSON.stringify(obj, null, "\t");
            $("#cont-RenderForm #html-torender pre").text(jsonPretty);
            $("#cont-RenderForm #html-torender")
                .empty()
                .html("<pre></pre>");
            $("#cont-RenderForm #html-torender pre").text(jsonPretty);
            $("#cont-RenderForm #appendfiles").empty();
        };

    });