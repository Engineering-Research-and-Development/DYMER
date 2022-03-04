angular.module('mclgsCtrl', [])
    .controller('mclgsController', function($scope, $http, $location, $browser, $rootScope, $window) {
        var baseContextPath = $rootScope.globals.contextpath; //$rootScope.site_prefix; //'/d4ptest/'; //$browser.baseHref();
        //openLog
        // deleteLog
        /* giaisg */

        let statusStandard = "Service is down"
        let stateserv = " text-danger"
        let bdstandard = " Disconnected"
        $scope.checkservice = {
            entities: {
                state: stateserv,
                msg: statusStandard,
                db: {
                    mongo: {
                        msg: bdstandard,
                        css: stateserv
                    },
                    elastic: {
                        msg: bdstandard,
                        css: stateserv
                    }
                }
            },
            dservice: {
                state: stateserv,
                msg: statusStandard,
                db: {
                    mongo: {
                        msg: bdstandard,
                        css: stateserv
                    }
                }
            },
            forms: {
                state: stateserv,
                msg: statusStandard,
                db: {
                    mongo: {
                        msg: bdstandard,
                        css: stateserv
                    }
                }
            },
            templates: {
                state: stateserv,
                msg: statusStandard,
                db: {
                    mongo: {
                        msg: bdstandard,
                        css: stateserv
                    }
                }
            },
            webform: {
                state: " text-success",
                msg: "Service is up"
            }
        };

        $http.get(baseContextPath + "/api/entities/checkservice").then(function(rt) {
            $scope.checkservice.entities.msg = rt.data.message;
            $scope.checkservice.entities.state = " text-success";
        }).then(function() {
            $http.get(baseContextPath + "/api/entities/api/v1/entity/mongostate").then(function(rts) {
                $scope.checkservice.entities.db.mongo.css = rts.data.data.css;
                $scope.checkservice.entities.db.mongo.msg = rts.data.data.label;
            })
        }).then(function() {
            $http.get(baseContextPath + "/api/entities/api/v1/entity/elasticstate").then(function(rts) {
                $scope.checkservice.entities.db.elastic.css = rts.data.data.css;
                $scope.checkservice.entities.db.elastic.msg = rts.data.data.label;
            })
        }).catch(function(response) {
            console.log(response);
        });
        $http.get(baseContextPath + "/api/dservice/checkservice").then(function(rt) {
            $scope.checkservice.dservice.msg = rt.data.message;
            $scope.checkservice.dservice.state = " text-success";
        }).then(function() {
            $http.get(baseContextPath + "/api/dservice/api/v1/perm/mongostate").then(function(rts) {
                $scope.checkservice.dservice.db.mongo.css = rts.data.data.css;
                $scope.checkservice.dservice.db.mongo.msg = rts.data.data.label;
            })
        }).catch(function(response) {
            console.log(response);
        });
        $http.get(baseContextPath + "/api/forms/checkservice").then(function(rt) {
            $scope.checkservice.forms.msg = rt.data.message;
            $scope.checkservice.forms.state = " text-success";
        }).then(function() {
            $http.get(baseContextPath + "/api/forms/api/v1/form/mongostate").then(function(rts) {
                $scope.checkservice.forms.db.mongo.css = rts.data.data.css;
                $scope.checkservice.forms.db.mongo.msg = rts.data.data.label;
            })
        }).catch(function(response) {
            console.log(response);
        });
        $http.get(baseContextPath + "/api/templates/checkservice").then(function(rt) {
            $scope.checkservice.templates.msg = rt.data.message;
            $scope.checkservice.templates.state = " text-success";
        }).then(function() {
            $http.get(baseContextPath + "/api/templates/api/v1/template/mongostate").then(function(rts) {
                $scope.checkservice.templates.db.mongo.css = rts.data.data.css;
                $scope.checkservice.templates.db.mongo.msg = rts.data.data.label;
            })
        }).catch(function(response) {
            console.log(response);
        });
        $scope.deleteLog = function(service, typelog) {
            if (confirm("Are you sure to flush the " + service + " " + typelog + ".log?")) {
                let pathOpLog = "";
                let tpop = "deletelog/";
                switch (service) {
                    case "webform":
                        pathOpLog = "/" + tpop + typelog;
                        break;
                    default:
                        pathOpLog = "/api/" + service + "/" + tpop + typelog;
                        break;
                }

                /* switch (service) {
                     case "entity":
                         pathOpLog = "/api/entities/" + tpop + typelog;
                         break;
                     case "form":
                         pathOpLog = "/api/forms/" + tpop + typelog;
                         break;
                     case "template":
                         pathOpLog = "/api/templates/api/v1/form/deletelog/" + tpop + typelog;
                         break;
                     case "dservice":
                         pathOpLog = "/api/dservice/api/v1/form/deletelog/" + tpop + typelog;
                         break;
                     case "webform":
                         pathOpLog = "/api/dservice/api/v1/form/deletelog/" + tpop + typelog;
                         break;
                     default:
                         break;
                 }*/
                $http.get(baseContextPath + pathOpLog).then(function(rt) {
                    useGritterTool("<b><i class='nc-icon nc-paper'></i> " + service + " " + typelog + ".log deleted</b>", "");
                }).catch(function(response) {
                    console.log(response.status);
                });
            }
        };
        $scope.openLog = function(service, typelog) {
            let pathOpLog = "";
            let tpop = "openLog/";
            switch (service) {
                case "webform":
                    pathOpLog = "/" + tpop + typelog;
                    break;
                default:
                    pathOpLog = "/api/" + service + "/" + tpop + typelog;
                    break;
            }
            /* switch (service) {
                 case "entity":
                     pathOpLog = "/api/entities/api/v1/entity/" + tpop + typelog;
                     break;
                 case "form":
                     pathOpLog = "/api/forms/api/v1/form/deletelog/" + tpop + typelog;
                     break;
                 case "template":
                     pathOpLog = "/api/templates/api/v1/form/deletelog/" + tpop + typelog;
                     break;
                 case "dservice":
                     pathOpLog = "/api/dservice/api/v1/form/deletelog/" + tpop + typelog;
                     break;
                 case "webform":
                     pathOpLog = "/api/dservice/api/v1/form/deletelog/" + tpop + typelog;
                     break;
                 default:
                     break;
             }*/
            $http.get(baseContextPath + pathOpLog).then(function(rt) {
                var options = { 'year': 'numeric', 'month': '2-digit', 'day': '2-digit' };
                var date = new Date().toLocaleString('en-US', options);
                var blob = new Blob([rt.data]);
                var linkElement = document.createElement('a');
                var url = window.URL.createObjectURL(blob);
                let filename = date + "_" + service + "_" + typelog + ".log";
                linkElement.setAttribute('href', url);
                linkElement.setAttribute("download", filename);

                var clickEvent = new MouseEvent("click", {
                    "view": window,
                    "bubbles": true,
                    "cancelable": false
                });
                linkElement.dispatchEvent(clickEvent);
            }).catch(function(response) {
                console.log(response);
            });
        };




    });