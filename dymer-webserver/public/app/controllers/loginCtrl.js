angular.module('loginCtrl', []).controller('loginController', function($scope, $http, $location, $rootScope, $cookies) {
    //listTempl
    //  var baseContextPath = $rootScope.globals.contextpath;
    //console.log('testing controller LoginController');

    $scope.login_ = function() {
        var _username = $scope.vm.username;
        var _password = $scope.vm.password;
        $rootScope.globals.loggedIn = false;
        $rootScope.globals.loggedUser ={}
        var baseContextPath = $rootScope.globals.contextpath;
        //$rootScope.globals.loggedIn = true;
        $http.post(baseContextPath + '/api/portalweb/authenticate', { username: _username, password: _password })
        .then(function successCallback(response) {
            console.log("response.data", response.data)
            $rootScope.globals.loggedIn = true;
            $rootScope.roles = JSON.parse(window.atob(unescape(encodeURIComponent(response.data["d_rl"])))).map(o => o.role)
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 1);
            $cookies.put("dUserLogged", true, { expires: expireDate });
            $location.path(baseContextPath + '/');  
            localStorage.setItem('DYM', response.data["DYM"]);
            localStorage.setItem('DYMisi', response.data["DYMisi"]);
            localStorage.setItem('d_rl', response.data["d_rl"]);
            document.cookie = "lll=" + response.data["DYM"];
            document.cookie = "DYMisi=" + response.data["DYMisi"];
            localStorage.setItem('d_uid', response.data.d_uid);
            localStorage.setItem('d_appuid', response.data.d_appuid);
            localStorage.setItem('d_gid', response.data.d_gid);
            //user response.data["user"]
            console.log("response.data", response.data.user)
            $rootScope.globals.loggedUser =  response.data.user ;
         //   $cookies.put("dusername",  response.data.user.username, { expires: expireDate });
        /*$http.post(baseContextPath + '/api/portalweb/authenticate', { username: _username, password: _password })
            .then(function successCallback(response) {

                $rootScope.globals.loggedIn = true;
                var expireDate = new Date();
                expireDate.setDate(expireDate.getDate() + 1);
                $cookies.put("dUserLogged", true, { expires: expireDate });
                $location.path(baseContextPath + '/');*/
            }, function errorCallback(response) {

                $rootScope.globals.loggedIn = false;
                $scope.vm.errorlogin = true;
            });


    }
}).controller('logoutController', function($scope, $http, $location, $rootScope, $cookies) {
    //listTempl
    // window.location.href = '/logout';
    //console.log('logoutController');
    $cookies.remove("dUserLogged");
    var cookies = $cookies.getAll();
    angular.forEach(cookies, function(v, k) {
        $cookies.remove(k);
    });
    localStorage.removeItem('d_appuid')
    localStorage.removeItem('d_gid')
    localStorage.removeItem('d_rl')
    localStorage.removeItem('d_uid')
    localStorage.removeItem('DYM')
    localStorage.removeItem('DYMisi')
    $rootScope.globals.loggedIn = false;
    $location.path('login');
});
/*angular
    .module('loginDCtrl')
    .controller('loginDController', LoginController);

LoginController.$inject = ['$location', '$location', '$scope', '$http'];

function LoginController($location, $scope, $http) {
    console.log('testing controller LoginController');
}*/
/*angular
    .module('loginDCtrl')
    .controller('loginDController', LoginController);

LoginController.$inject = ['$location'];

function LoginController($location, $scope, $http) {
    var vm = this;

    vm.login = login;

    (function initController() {
        // reset login status
        AuthenticationService.ClearCredentials();
    })();

    function login() {
        console.log('testing controller LoginController', vm);
*/

/*
        vm.dataLoading = true;
        AuthenticationService.Login(vm.username, vm.password, function (response) {
            if (response.success) {
                AuthenticationService.SetCredentials(vm.username, vm.password);
                $location.path('/');
            } else {
                FlashService.Error(response.message);
                vm.dataLoading = false;
            }
        });*/
/*   };
}*/