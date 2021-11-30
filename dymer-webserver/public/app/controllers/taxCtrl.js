/*angular.module('taxCtrl', [])
    .controller('taxController', function($scope, $http) {


        function Controller(ModalService) {


            vm.openModal = openModal;
            vm.closeModal = closeModal;

            initController();

            function initController() {
                vm.bodyText = 'This text can be updated in modal 1';
            }

            function openModal(id) {
                ModalService.Open(id);
            }

            function closeModal(id) {
                ModalService.Close(id);
            }
        }

    });*/
angular.module('taxCtrl', [])
    .controller('taxController', function($scope, $http, $window, $rootScope) {
        var baseContextPath = $rootScope.globals.contextpath;
        /*(function() {
            'use strict';

            angular.module('userApp')
                .controller('taxController', ['$scope', function($scope, $http, $window) {*/
        var newPageModal;
        var nodeDataVocab;
        $scope.showAddVocab = false;

        function actionShowHideAddVocab($scope) {
            $scope.showAddVocab = true;
        }
        $scope.data = [];

        $scope.actionShowHideAddVocab = function() {
            $scope.showAddVocab = !$scope.showAddVocab;
        };
        $scope.insertvocab = function(el) {
            console.log('el', el);
            var newElement = {
                id: Date.now(),
                locales: el.locales,
                nodes: []
            };
            if (nodeDataVocab == undefined)
                $scope.data.push(newElement);
            else
                nodeDataVocab.nodes.push(newElement);
            $scope.newelvocab = {};
            newPageModal.modal("hide");
            nodeDataVocab = undefined;
        };

        $scope.printdata = function(dt) {
            console.log('dt', dt);
            console.log('$scope.data', $scope.data);
        }
        $scope.openModal = function(id, scope, type) {
            console.log('ìid, scope, type', id, scope, type);
            if (scope != undefined)
                nodeDataVocab = scope.$modelValue;

            console.log('nodeDataVocab', nodeDataVocab);
            newPageModal = $('#' + id);
            if (type == 'update') {

                $scope.editvocab = {};
                $scope.editvocab.id = nodeDataVocab.id;
                $scope.editvocab.locales = nodeDataVocab.locales;

            }

            newPageModal.modal("show");



        };
        $scope.remove = function(scope) {
            scope.remove();
        };

        $scope.toggle = function(scope) {
            scope.toggle();
        };

        $scope.moveLastToTheBeginning = function() {
            var a = $scope.data.pop();
            $scope.data.splice(0, 0, a);
        };

        $scope.newSubItem = function(scope) {
            var nodeData = scope.$modelValue;
            nodeData.nodes.push({
                id: nodeData.id * 10 + nodeData.nodes.length,
                title: nodeData.title + '.' + (nodeData.nodes.length + 1),
                nodes: []
            });
        };

        $scope.collapseAll = function() {
            $scope.$broadcast('angular-ui-tree:collapse-all');
        };

        $scope.expandAll = function() {
            $scope.$broadcast('angular-ui-tree:expand-all');
        };

        $scope.saveUpdateVocab = function() {
            //    var strnotify = '<strong>Vocabulary:</strong> ';
            //      $.notify(strnotify, { type: 'warning', clickToHide: true });
            useGritterTool("Vocabulary", "updated with success")
        };
        $scope.createVocabulary = function(frm) {
            console.log('frm', frm);




        };
        $scope.selectedVocab = -1;
        $scope.selectVocab = function(index, obj) {
            $scope.selectedVocab = index;
            $scope.data = obj.nodes;
            console.log('index, obj', index, obj);
        };

        $scope.loadVocabularies = function() {
            //carito tutti i vocabolari


            /*
                        let listpages = [];
                        var serviceurl = '/api/dservice/api/v1/taxonomy';
                        var par = { "query": { "instance._index": { "$eq": "general" } } };
                        //  par = {};
                        $http({
                            url: serviceurl,
                            method: "GET",
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            params: par,
                        }).then(function(ret) {
                            //$http.get(serviceurl, this.entData).then(function(ret) {
                            //	   $http.get(serviceurl, this.entData).then(function(ret) {
                            console.log('Data controller lists', ret);

                        });
            */






            $scope.vocabularies = [{
                "_id": 1,
                title: "primo",
                nodes: [{
                    'id': 1,
                    locales: {
                        en: { value: "1 EN" },
                        fr: { value: "1 fr" },
                        it: { value: "1 it" }
                    },
                    'nodes': [{
                            'id': 11,
                            locales: {
                                en: { value: "node1.1 EN" },
                                fr: { value: "node1.1 fr" },
                                it: { value: "node1.1 it" }
                            },
                            'nodes': [{
                                'id': 111,

                                locales: {
                                    en: { value: "111 EN" },
                                    fr: { value: "111 fr" },
                                    it: { value: "111 it" }
                                },
                                'nodes': []
                            }]
                        },
                        {
                            'id': 12,

                            locales: {
                                en: { value: "12 EN" },
                                fr: { value: "12 fr" },
                                it: { value: "12 it" }
                            },
                            'nodes': []
                        }
                    ]
                }, {
                    'id': 2,

                    locales: {
                        en: { value: "2 EN" },
                        fr: { value: "2 fr" },
                        it: { value: "2 it" }
                    },
                    'nodrop': true, // An arbitrary property to check in custom template for nodrop-enabled
                    'nodes': [{
                            'id': 21,

                            locales: {
                                en: { value: "21 EN" },
                                fr: { value: "21 fr" },
                                it: { value: "21 it" }
                            },
                            'nodes': []
                        },
                        {
                            'id': 22,

                            locales: {
                                en: { value: "22 EN" },
                                fr: { value: "22 fr" },
                                it: { value: "22 it" }
                            },
                            'nodes': []
                        }
                    ]
                }, {
                    'id': 3,

                    locales: {
                        en: { value: "3 EN" },
                        fr: { value: "3 fr" },
                        it: { value: "3 it" }
                    },
                    'nodes': [{
                        'id': 31,

                        locales: {
                            en: { value: "31 EN" },
                            fr: { value: "31 fr" },
                            it: { value: "31 it" }
                        },
                        'nodes': []
                    }]
                }]
            }, {
                "_id": 2,
                title: "secondo",
                nodes: [{
                    'id': 51,
                    locales: {
                        en: { value: "51 EN" },
                        fr: { value: "51 fr" },
                        it: { value: "51 it" }
                    },
                    'nodes': [{
                            'id': 511,
                            locales: {
                                en: { value: "node51.1 EN" },
                                fr: { value: "node51.1 fr" },
                                it: { value: "node51.1 it" }
                            },
                            'nodes': [{
                                'id': 5111,

                                locales: {
                                    en: { value: "5111 EN" },
                                    fr: { value: "5111 fr" },
                                    it: { value: "5111 it" }
                                },
                                'nodes': []
                            }]
                        },
                        {
                            'id': 512,

                            locales: {
                                en: { value: "512 EN" },
                                fr: { value: "512 fr" },
                                it: { value: "512 it" }
                            },
                            'nodes': []
                        }
                    ]
                }, {
                    'id': 52,

                    locales: {
                        en: { value: "52 EN" },
                        fr: { value: "52 fr" },
                        it: { value: "52 it" }
                    },
                    'nodrop': true, // An arbitrary property to check in custom template for nodrop-enabled
                    'nodes': [{
                            'id': 521,

                            locales: {
                                en: { value: "521 EN" },
                                fr: { value: "521 fr" },
                                it: { value: "521 it" }
                            },
                            'nodes': []
                        },
                        {
                            'id': 522,

                            locales: {
                                en: { value: "522 EN" },
                                fr: { value: "522 fr" },
                                it: { value: "522 it" }
                            },
                            'nodes': []
                        }
                    ]
                }, {
                    'id': 53,

                    locales: {
                        en: { value: "53 EN" },
                        fr: { value: "53 fr" },
                        it: { value: "53 it" }
                    },
                    'nodes': [{
                        'id': 531,

                        locales: {
                            en: { value: "531 EN" },
                            fr: { value: "531 fr" },
                            it: { value: "531 it" }
                        },
                        'nodes': []
                    }]
                }]
            }]
        };

        $scope.$on('$viewContentLoaded', function() { $scope.loadVocabularies(); });

        /*   $scope.data = [{
               'id': 1,
               locales: {
                   en: { value: "1 EN" },
                   fr: { value: "1 fr" },
                   it: { value: "1 it" }
               },
               'nodes': [{
                       'id': 11,
                       locales: {
                           en: { value: "node1.1 EN" },
                           fr: { value: "node1.1 fr" },
                           it: { value: "node1.1 it" }
                       },
                       'nodes': [{
                           'id': 111,

                           locales: {
                               en: { value: "111 EN" },
                               fr: { value: "111 fr" },
                               it: { value: "111 it" }
                           },
                           'nodes': []
                       }]
                   },
                   {
                       'id': 12,

                       locales: {
                           en: { value: "12 EN" },
                           fr: { value: "12 fr" },
                           it: { value: "12 it" }
                       },
                       'nodes': []
                   }
               ]
           }, {
               'id': 2,

               locales: {
                   en: { value: "2 EN" },
                   fr: { value: "2 fr" },
                   it: { value: "2 it" }
               },
               'nodrop': true, // An arbitrary property to check in custom template for nodrop-enabled
               'nodes': [{
                       'id': 21,

                       locales: {
                           en: { value: "21 EN" },
                           fr: { value: "21 fr" },
                           it: { value: "21 it" }
                       },
                       'nodes': []
                   },
                   {
                       'id': 22,

                       locales: {
                           en: { value: "22 EN" },
                           fr: { value: "22 fr" },
                           it: { value: "22 it" }
                       },
                       'nodes': []
                   }
               ]
           }, {
               'id': 3,

               locales: {
                   en: { value: "3 EN" },
                   fr: { value: "3 fr" },
                   it: { value: "3 it" }
               },
               'nodes': [{
                   'id': 31,

                   locales: {
                       en: { value: "31 EN" },
                       fr: { value: "31 fr" },
                       it: { value: "31 it" }
                   },
                   'nodes': []
               }]
           }];*/
    });
/*  }]);

}());*/