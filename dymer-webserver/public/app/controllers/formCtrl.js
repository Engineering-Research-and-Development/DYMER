 angular.module('formControllers', [])
     .directive('fileInput', ['$parse', function($parse) {
         return {
             restrict: 'A',
             link: function(scope, elm, attrs) {
                 elm.bind('change', function() {
                     $parse(attrs.fileInput)
                         .assign(scope, elm[0].files)
                     scope.$apply()
                 });
             }
         }
     }])
     .controller('formCtrl', ['$scope', '$http',
         function($scope, $http, $rootScope) {
             var baseContextPath = $rootScope.globals.contextpath;
             $scope.filesChanged = function(elm) {
                 $scope.files = elm.files;
                 $scope.$apply();
             }
             $scope.upload = function() {
                 var fd = new FormData();
                 angular.forEach($scope.files, function(file) {
                     fd.append('file', file);
                 })
                 $http.post(baseContextPath + '/forms/api/form', fd, {
                         transformRequest: angular.identity,
                         headers: {
                             'Content-Type': 'multipart/form-data'
                         }
                     })
                     .then(function(d) {
                         $scope.message = "Upload Successful!";
                         $scope.successmessagebox = true;
                         console.log(d);
                     })
             }
         }
     ])
     .controller('listForm', function($scope, $http, $rootScope) {
         var baseContextPath = $rootScope.globals.contextpath;
         $scope.listaForms = [];
         // console.log('get my list');
         var serviceurl = baseContextPath + '/api/forms/api/v1/form';
         var par = { "query": { "instance._index": { "$ne": "general" } } };
         $http({
             url: serviceurl,
             method: "GET",
             headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
             params: par,
         }).then(function(ret) {
             // console.log('Data controller ', ret);

             return $scope.listaForms = ret.data.data;
         }).catch(function(response) {
             console.log(response.status);
         });
         $scope.loadHtmlForm = function(obj, index) {
             //console.log('evvai', obj);
             $scope.selected = index;
             $scope.formtitle = obj.title;
             $scope.objChanged = obj.created;
             $("#cont-RenderForm #html-torender").empty();
             $("#cont-RenderForm #appendfiles").empty();
             var old_dupd = undefined;
             var html_el = "";
             obj.files.forEach(element => {
                 var dupd = new Date(element.uploadDate);
                 if (element.contentType == "text/html") {


                     if (old_dupd == undefined) {
                         html_el = element.data;
                     } else {
                         if (dupd > old_dupd) {
                             html_el = element.data;
                         }

                     }




                 }
                 if (element.contentType == "text/css") {
                     /*
                     $http
                       .get(
                         '/api/forms/api/v1/form/'+ element.path,
                         this.entData
                       )
                       .then(function(ret) {
                         //  console.log('Data css ', ret.data);

                         $("<style></style>")
                           .appendTo("#cont-RenderForm #appendfiles")
                           .html(ret.data);
                       })
                       .catch(function(response) {
                         console.log(response.status);
                       });
                       */
                     $("<style></style>").appendTo("#cont-RenderForm #appendfiles").html(element.data);
                 }
             });
             $("#cont-RenderForm #html-torender").append(html_el);
             $("#cont-RenderForm #html-torender").multidisable();
         };

         $scope.loadDetailsForm = function(obj, index) {
             //  console.log('evvai', obj);
             $scope.selected = index;
             $scope.formtitle = obj.title;
             var jsonPretty = JSON.stringify(obj, null, "\t");
             $("#cont-RenderForm #html-torender")
                 .empty()
                 .html("<pre></pre>");
             $("#cont-RenderForm #html-torender pre").text(jsonPretty);
             $("#cont-RenderForm #appendfiles").empty();
         };

     });