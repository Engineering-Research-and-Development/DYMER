// angular.service('multipartForm', ['$http', function($http) {
//     this.post = function(uploadUrl, data) {
//         var fd = new FormData();
//         for (var key in data)
//             fd.append(key, data[key]);


//         //console.log(fd);
//         $http.post(uploadUrl, fd, {
//             transformRequest: angular.indentity,
//             headers: { 'Content-Type': undefined }
//         });
//     }
// }])

angular.module("userApp").factory('multipartForm', ['$http', function ($http) {
    return {
        post: function (uploadUrl, data) {
            var fd = new FormData();
            for (var key in data) {                
                fd.append(key, data[key]);
            }
            
            return $http.post(uploadUrl, fd, {
                transformRequest: angular.identity,
                headers: { 'Content-Type': undefined }
            });
        }
    };
}]);
