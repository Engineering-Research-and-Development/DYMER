angular.module('taxCtrl', [])
    .controller('taxController', function($scope, $http, $window, $rootScope) {
        var baseContextPath = $rootScope.globals.contextpath;

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
            if (el.value != undefined) {
                var newElement = {
                    id: Date.now(),
                    locales: el.locales,
                    value: el.value,
                    nodes: []
                };
                if (nodeDataVocab == undefined)
                    $scope.data.push(newElement);
                else
                    nodeDataVocab.nodes.push(newElement);
                $scope.newelvocab = {};
                newPageModal.modal("hide");
                nodeDataVocab = undefined;
            }
        };

        $scope.printdata = function(dt) {
            console.log('dt', dt);
            console.log('$scope.data', $scope.data);
        }

        $scope.openModal = function(id, scope, type) {
            console.log('id, scope, type', id, scope, type);
            if (scope != undefined)
                nodeDataVocab = scope.$modelValue;

            console.log('nodeDataVocab', nodeDataVocab);
            newPageModal = $('#' + id);
            if (type == 'update') {

                $scope.editvocab = JSON.parse(JSON.stringify(nodeDataVocab))

                $scope.acceptUpdatedValues = function() {

                    if ($scope.editvocab.value) {
                        nodeDataVocab.id = $scope.editvocab.id
                        nodeDataVocab.value = $scope.editvocab.value
                        nodeDataVocab.locales = $scope.editvocab.locales
                        newPageModal.modal("hide")
                    }
                };

            }
            if (type == 'delete') {
                $scope.deleteItem = scope; //deleteItem used in html
            }
            newPageModal.modal("show");
        };

        $scope.remove = function(scope) {
            scope.remove();
            newPageModal.modal("hide")
        };

        $scope.cancel = function() {
            newPageModal.modal("hide")
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

        $scope.saveUpdateVocab = function(selectedVocabulary) {
            let vocabularyID = $scope.vocabularies[selectedVocabulary]._id
            var serviceurl = baseContextPath + '/api/dservice/api/v1/taxonomy';

            $http({
                url: serviceurl,
                method: "PUT",
                data: {
                    id: vocabularyID,
                    data: $scope.data
                }
            }).then(function(ret) {
                $scope.vocabularies[selectedVocabulary] = ret
            }).catch((err) => {
                console.log(err)
            })

            useGritterTool("Vocabulary", "updated with success")
        };

        $scope.deleteVocab = function(selectedVocabulary) {

            let vocabularyID = $scope.vocabularies[selectedVocabulary]._id
            var serviceurl = baseContextPath + '/api/dservice/api/v1/taxonomy/' + vocabularyID;

            $http({
                url: serviceurl,
                method: "DELETE"
            }).then(function(ret) {
                $scope.vocabularies.splice(selectedVocabulary, 1)
                $scope.selectVocab(0, $scope.vocabularies[0])

            }).catch((err) => {
                console.log(err)
            })

            newPageModal.modal("hide");
            useGritterTool("Vocabulary", "deleted with success")
        };


        $scope.createVocabulary = function(frm) {

            // rendering name and description form
            console.log('frm', frm);
            var serviceUrl = baseContextPath + '/api/dservice/api/v1/taxonomy';

            $http({
                url: serviceUrl,
                method: "POST",
                data: frm
            }).then(function(ret) {
                $scope.vocabularies.push(ret.data.data)
                if (ret.data.success)
                    useGritterTool("<b><i class='fa fa-database   '></i> vacabulary</b>", ret.data.message);
                else
                    useGritterTool("<b><i class='fa fa-database   '></i> vacabulary</b>", ret.data.message, "warning");
                console.log(ret)
            }).catch((err) => {
                useGritterTool("<b><i class='fa fa-database   '></i> vacabulary</b>", "Error on vacabulary", "warning");
                console.log(err)
            });
        };

        $scope.selectedVocab = -1;
        $scope.selectVocab = function(index, obj) {
            $scope.selectedVocab = index;
            $scope.data = obj.nodes;
            console.log('index, obj', index, obj);
        };

        $scope.loadVocabularies = function() {
            //retrieve all vocabularies

            var serviceurl = baseContextPath + '/api/dservice/api/v1/taxonomy';
            var par = { "query": { "instance._index": { "$eq": "general" } } };

            $http({
                url: serviceurl,
                method: "GET",
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                params: par,
            }).then(function(ret) {
                $scope.vocabularies = ret.data.data
                console.log('Data controller lists', ret.data.data);

            }).catch((err) => {
                console.log(err)
            });

        };

        $scope.$on('$viewContentLoaded', function() { $scope.loadVocabularies(); });

    });