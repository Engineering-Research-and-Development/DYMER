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
            if (el.value != undefined && el.locales.en) {
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

                    if ($scope.editvocab.value && $scope.editvocab.locales.en) {
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
            console.log("nodeData", nodeData)
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
                useGritterTool("Vocabulary", "updated with success")
            }).catch((err) => {
                console.log(err)
            })
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
            console.log('$scope', $scope);
            var serviceurl = baseContextPath + '/api/dservice/api/v1/taxonomy';
            $http({
                url: serviceurl,
                method: "POST",
                data: frm
            }).then(function(ret) {
                $scope.vocabularies.push(ret.data.data)
                useGritterTool("Vocabulary", "new vocabulary with success")
                console.log(ret.data.data)
                /*MG - Inizio*/
                $scope.form.title = "";
                $scope.form.description = "";
                /*MG - Fine*/
            }).catch((err) => {
                console.log(err)
            });
        };

        /*MG - Implementazione import di un vocabolario - INIZIO*/ 
        $scope.importVocabulary = function(frm) {
            /*Elimino il vocabolario,se esiste già*/
            $http({
                url: baseContextPath + '/api/dservice/api/v1/taxonomy/title/'+frm.title,
                method: "GET",
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            }).then(function(vocabulary) {
                if (vocabulary.data.data != null){ 
                    $http({
                        url: baseContextPath + '/api/dservice/api/v1/taxonomy/' + vocabulary.data.data._id,
                        method: "DELETE"
                    }).then(function(del) {
                        console.log("Eliminazione vocabolario esistente in locale ===> ", del);
                    }).catch((err) => {
                        console.log(err)
                    })
                }
            });

            /*Acquisisco il vocabolario dalla sorgente*/
            $http({
                url: frm.sourcePath + '/api/dservice/api/v1/taxonomy/title/'+frm.title,
                method: "GET",
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            }).then(function(vocabulary) {
                if (vocabulary.data.data != null){ 
                    console.log('Vocabolario da importare ===> ', vocabulary.data.data);
                    found = true;
                    voc = {};
                    voc.title = vocabulary.data.data.title;
                    voc.description = vocabulary.data.data.description;
                    /*Creo il vocabolario vuoto*/
                    $http({
                        url: baseContextPath + '/api/dservice/api/v1/taxonomy',
                        method: "POST",
                        data: voc
                    }).then(function(ins) {
                        /*Aggiungo tutti i vocaboli*/
                        $http({
                            url: baseContextPath + '/api/dservice/api/v1/taxonomy',
                            method: "PUT",
                            data: {
                                id: ins.data.data._id,
                                data: vocabulary.data.data.nodes
                            }
                        }).then(function(upd) {
                            useGritterTool("Vocabulary", "import with success");
                        }).catch((err) => {
                            console.log(err)
                        })
                    }).catch((err) => {
                        console.log(err);
                    });
                }else{
                    useGritterTool("<b><i class='fa fa-exclamation-triangle'></i>There is no vocabulary !</b>", "Check the title !" , "danger");  
                };
            }).catch((err) => {
                console.log(err);
                useGritterTool("<b><i class='fa fa-exclamation-triangle'></i>Error during import. Try Again !</b>", "Check the source path !", "danger");
            });
        };
        /*MG - Implementazione import di un vocabolario - FINE*/ 

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