//site_prefix = '/';
//var site_prefix = '/d4ptest';
angular
    .module("appRoutes", ["ngRoute", 'ngCookies'])
    .config(config)
    .run(run);


config.$inject = ['$routeProvider', '$locationProvider'];

function config($routeProvider, $locationProvider) {

    // console.log("trtr", site_prefix);
    // $rootScope.site_prefix = site_prefix;
    $routeProvider

        .when(site_prefix + "/", {
            templateUrl: site_prefix + "/public/app/views/pages/dashboard.html",
            controller: "dashController"
        })
        .when(site_prefix + "/tester", {
            templateUrl: site_prefix + "/public/app/views/pages/tester/test.html"
        })
        .when(site_prefix + "/about", {
            templateUrl: site_prefix + "/public/app/views/pages/about.html"
        })
        .when(site_prefix + "/addentity", {
            templateUrl: site_prefix + "/public/app/views/pages/entities/addentity.html",
            controller: "addEntity"
        })
        .when(site_prefix + "/listentities", {
            templateUrl: site_prefix + "/public/app/views/pages/entities/entities.html",
            controller: "listEntities"
        })
        .when(site_prefix + "/bridge-entities-conf", {
            templateUrl: site_prefix + "/public/app/views/pages/entities/external/configuration.html",
            controller: "bridgeEntitiesController"
        })
        .when(site_prefix + "/importfromfile", {
            templateUrl: site_prefix + "/public/app/views/pages/entities/import_file.html",
            controller: "entitiesImport_ff"
        })
        .when(site_prefix + "/configurator", {
            templateUrl: site_prefix + "/public/app/views/pages/configtool/configurator.html",
            controller: "confController"
        })
        .when(site_prefix + "/listconfig", {
            templateUrl: site_prefix + "/public/app/views/pages/configtool/listconfig.html",
            controller: "confListController"
        })
        .when(site_prefix + "/templates", {
            templateUrl: site_prefix + "/public/app/views/pages/templates/templates.html",
            controller: "listTempl"

        })
        .when(site_prefix + "/hooks", {
            templateUrl: site_prefix + "/public/app/views/pages/entities/hooks.html",
            controller: "dymerHooksController"
        })
        .when(site_prefix + "/opennessearch", {
            templateUrl: site_prefix + "/public/app/views/pages/services/opsearch.html",
            controller: "openSearchController"
        })
        .when(site_prefix + "/fwadapter", {
            templateUrl: site_prefix + "/public/app/views/pages/services/fwadapter.html",
            controller: "fwadapterController"
        })
        .when(site_prefix + "/eaggregation", {
            templateUrl: site_prefix + "/public/app/views/pages/services/eaggregation.html",
            controller: "eaggregationController"
        })
        .when(site_prefix + "/managetemplate", {
            templateUrl: site_prefix + "/public/app/views/pages/templates/managetemplate.html",
            controller: "manageTemplate"
        })
        .when(site_prefix + "/models", {
            templateUrl: site_prefix + "/public/app/views/pages/forms/forms.html",
            controller: "listForm"
        })
        .when(site_prefix + "/managemodel", {
            templateUrl: site_prefix + "/public/app/views/pages/forms/managemodels.html",
            controller: "manageModel"
        })

    .when(site_prefix + "/modeldoc", {
            templateUrl: site_prefix + "/public/app/views/pages/forms/documentation.html",

        })
        .when(site_prefix + "/demolist", {
            templateUrl: site_prefix + "/public/app/views/pages/demos/list.html"
        })
        .when(site_prefix + "/demosearchbar", {
            templateUrl: site_prefix + "/public/app/views/pages/demos/searchbar.html"
        })
        .when(site_prefix + "/demosingle", {
            templateUrl: site_prefix + "/public/app/views/pages/demos/single.html"
        })
        .when(site_prefix + "/singlebyurl", {
            templateUrl: site_prefix + "/public/app/views/pages/demos/singlebyurl.html"
        })
        .when(site_prefix + "/demomap", {
            templateUrl: site_prefix + "/public/app/views/pages/demos/mapdt.html",
            authorize: true
        })
        .when(site_prefix + "/demomanager", {
            templateUrl: site_prefix + "/public/app/views/pages/demos/manager.html"
        })
        .when(site_prefix + "/fixproblems", {
            templateUrl: site_prefix + "/public/app/views/pages/demos/fixproblems.html"
        })
        .when(site_prefix + "/templatesdoc", {
            templateUrl: site_prefix + "/public/app/views/pages/demos/templates.html"
        })
        .when(site_prefix + "/modelsdoc", {
            templateUrl: site_prefix + "/public/app/views/pages/demos/models.html"
        })
        .when(site_prefix + "/dashboard", {
            templateUrl: site_prefix + "/public/app/views/pages/dashboard.html",
            controller: "dashController"
        })
        .when(site_prefix + "/login", {
            templateUrl: site_prefix + "/public/app/views/authentication/views/login.html",
            controller: "loginController"
        })
        .when(site_prefix + "/querybuilder", {
            templateUrl: site_prefix + "/public/app/views/pages/services/querybuilder.html",
            controller: "queryBController"
        })
        .when(site_prefix + "/logout", {
            templateUrl: site_prefix + "/public/app/views/authentication/views/login.html",
            controller: "logoutController"
        })
        .when(site_prefix + "/taxonomy", {
            templateUrl: site_prefix + "/public/app/views/pages/taxonomy/taxonomy.html",
            controller: "taxController"
        })
        .when(site_prefix + "/permissionmanage", {
            templateUrl: site_prefix + "/public/app/views/pages/administration/permissionmanage.html",
            controller: "permissionController"
        })
        .when(site_prefix + "/authenticationconfig", {
            templateUrl: site_prefix + "/public/app/views/pages/administration/configuration/authentication.html",
            controller: "authenticationConfigController"
        })
        .when(site_prefix + "/importcronjob", {
            templateUrl: site_prefix + "/public/app/views/pages/services/importcronjob.html",
            controller: "importcronjobController"
        })
        /*   .when(site_prefix + "/authenticate", {
               templateUrl: site_prefix + "/authenticate"
           })*/
        //.otherwise({ redirectTo: site_prefix + "/app/views/pages/dashboard.html" });
        //  .otherwise({ redirectTo: site_prefix + "/dashboard" });
        .otherwise({ redirectTo: site_prefix + "/" });
    /*.otherwise({
        templateUrl: site_prefix + "/app/views/pages/dashboard.html",
        controller: "dashController"
    });*/

    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });

}

run.$inject = ['$rootScope', '$location', '$cookies', '$http'];

function run($rootScope, $location, $cookies, $http) { // keep user logged in after page refresh
    //  console.log("parto", development.services.webserver["context-path"]);
    //development.services.webserver["context-path"]
    /*
    $rootScope.globals = {
        currentUser: {
            username: username,
            authdata: authdata
        }
    };*/
    //  console.log("test ciao");
    $rootScope.name = 'anonymous';
    $rootScope.globals = {
        currentUser: {}
    };
    $rootScope.globals = {
        loggedIn: false
    };
    $rootScope.globals = {
        contextpath: site_prefix
    };
    var loggedIn = $rootScope.globals.loggedIn;
    //  console.log("root.scope", loggedIn);
    //  console.log("userislogged", $location.path());
    /*  $rootScope.globals = $cookies.getObject('globals') || {};
      if ($rootScope.globals.currentUser) {
          $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata;
      }

      $rootScope.$on('$locationChangeStart', function(event, next, current) {
          // redirect to login page if not logged in and trying to access a restricted page
          var restrictedPage = $.inArray($location.path(), ['/login', '/register']) === -1;
          var loggedIn = $rootScope.globals.currentUser;
          if (restrictedPage && !loggedIn) {
              $location.path('/login');
          }
      });*/
    $rootScope.$on('$locationChangeStart', function(event, next, current) {
        // redirect to login page if not logged in and trying to access a restricted page

        var loggedIn = $rootScope.globals.loggedIn;
        var userislogged = $cookies.get("dUserLogged");

        //      console.log("userislogged", userislogged);
        // $rootScope.globals.loggedIn = true;
        if (!userislogged) {
            //if (!loggedIn) {
            //        console.log("!userislogged");
            $location.path(site_prefix + '/login');
            // $location.path(site_prefix + '/authenticate');
            $rootScope.globals.loggedIn = false;
        } else {
            // console.log("si");
            $rootScope.globals.loggedIn = true;
        }
    });
}


/* .config(function($routeProvider, $locationProvider) {
     $routeProvider

         .when("/", {
         templateUrl: "../app/views/pages/dashboard.html",
         controller: "dashController"
     })

     .when("/about", {
             templateUrl: "../app/views/pages/about.html"
         })
         .when("/addentity", {
             templateUrl: "../app/views/pages/entities/addentity.html",
             controller: "addEntity"
         })
         .when("/listentities", {
             templateUrl: "../app/views/pages/entities/entities.html",
             controller: "listEntities"
         })
         .when("/importfromfile", {
             templateUrl: "../app/views/pages/entities/import_file.html",
             controller: "entitiesImport_ff"
         })
         .when("/templates", {
             templateUrl: "../app/views/pages/templates/templates.html",
             controller: "listTempl"

         })
         .when("/hooks", {
             templateUrl: "../app/views/pages/entities/hooks.html",
             controller: "dymerHooksController"
         })
         .when("/opennessearch", {
             templateUrl: "../app/views/pages/services/opsearch.html",
             controller: "openSearchController"
         })
         .when("/managetemplate", {
             templateUrl: "../app/views/pages/templates/managetemplate.html",
             controller: "manageTemplate"
         })
         .when("/models", {
             templateUrl: "../app/views/pages/forms/forms.html",
             controller: "listForm"
         })
         .when("/managemodel", {
             templateUrl: "../app/views/pages/forms/managemodels.html",
             controller: "manageModel"
         })
         .when("/demolist", {
             templateUrl: "../app/views/pages/demos/list.html"
         })
         .when("/demosingle", {
             templateUrl: "../app/views/pages/demos/single.html"
         })
         .when("/singlebyurl", {
             templateUrl: "../app/views/pages/demos/singlebyurl.html"
         })
         .when("/demomap", {
             templateUrl: "../app/views/pages/demos/mapdt.html",
             authorize: true
         })
         .when("/demomanager", {
             templateUrl: "../app/views/pages/demos/manager.html"
         })
         .when("/dashboard", {
             templateUrl: "../app/views/pages/dashboard.html",
             controller: "dashController"
         })
         .when("/login", {
             templateUrl: "../app/views/authentication/views/login.html",
             controller: "dashController"
         })
         .otherwise({ redirectTo: "../app/views/pages/dashboard.html" });

     $locationProvider.html5Mode({
         enabled: true,
         requireBase: false
     });
 })
 .run(function($rootScope, $location) {
     $rootScope.$on("$routeChangeStart", function(evt, to, from) {
         console.log("cambia pagina");
         console.log("evt", evt);
         console.log("to", to);
         console.log("from", from);
         if (to.authorize === true) {
             console.log("to.authorize === true", to.authorize === true);
             console.log("to.resolve", to.resolve);
             to.resolve = to.resolve || {};

           //if (!to.resolve.authorizationResolver) {
           //       to.resolve.authorizationResolver = function(authService) {
          //            return authService.authorize();
         //         };
         //     }
         }
     });

     $rootScope.$on("$routeChangeError", function(evt, to, from, error) {
         if (error instanceof AuthorizationError) {
             $location.path("/login").search("returnTo", to.originalPath);
         }
     });
 });


.run(function($rootScope, $location, $state, LoginService) {
     $rootScope.$on('$stateChangeStart',
         function(event, toState, toParams, fromState, fromParams) {
             console.log('Changed state to: ' + toState);
         });

     if (!LoginService.isAuthenticated()) {
         $state.transitionTo('login');
     }
 })*/