/*AC - MG - Wizard - Inizio*/
angular.module('wizardCtrl', [])
    .controller('wizardController', function ($scope, $http, $rootScope, multipartForm) {
        var baseContextPath = $rootScope.globals.contextpath;
        $scope.currentStep = 1;
        $scope.activated = "";
        $scope.activated1 = "";
        $scope.wizardObj = {
            modelName: "",
            modelIndex: "",
            modelDescription: "",
            modelFields: [
                {
                    title: "",
                    type: "text",
                    tax: "Select One",
                    required: false,
                    repeatable: false,
                    searchable: false,
                    relationto: ""
                }],
            fullContentTemplateName: "",
            fullContentTemplateType: "Full content",
            previewTemplateType: "",
            previewTemplateName: ""
        }
        $("#loadwiz").hide();
        $("#resultwiz").hide();

        // AC start
        $scope.relationalModels = []
        $http({
            method: 'GET',
            url: baseContextPath + 'api/forms/api/v1/form/',
        }).then(function successCallback(models) {
            $scope.relationalModels = models.data.data.map(element => ({ "relationalModelId": element._id, "relationalModelTitle": element.title}));
            console.log("relationalModels ", $scope.relationalModels)
        }).catch((getRelationsErr) => {
            console.log("getRelationsErr - Unable retrieve models due to: ====>", getRelationsErr);
            useGritterTool("<b><i class='fa fa-exclamation-triangle'></i>Unable retrieve models</b>", "", "danger");
        })
        // AC end

        $scope.vocabularies = [];
        $http({
            url: baseContextPath + '/api/dservice/api/v1/taxonomy',
            method: "GET",
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            params: { "query": { "instance._index": { "$eq": "general" } } },
        }).then(function(vocabularies) {
            $scope.vocabularies = vocabularies.data.data.map(element => ({ "vocabularyId": element._id, "vocabularyTitle": element.title}));
            console.log("Vocabularies ===>", $scope.vocabularies)
        }).catch((getVocabulariesErr) => {
            console.log("getVocabulariesErr - Errore nella lettura delle tassonomìe  ====>", getVocabulariesErr);
            useGritterTool("<b><i class='fa fa-exclamation-triangle'></i>Unable retrieve taxonomies</b>", "", "danger");
        })

        // Funzioni per la navigazione nel wizard
        $scope.nextStep = function () {
            if ($scope.currentStep < 3) {
                $scope.currentStep++;
            }
            if ($scope.currentStep == 2) {
                $scope.activated = "activated";
            }
            if ($scope.currentStep1 == 3) {
                $scope.activated1 = "activated";
            }
            console.log("wizard obj: ", $scope.wizardObj)
        };

        $scope.previousStep = function () {
            if ($scope.currentStep > 1) {
                $scope.currentStep--;
            }
        };

        $scope.submitForm = function () {
            console.log('Form submitted:', $scope.wizardObj);
        };

        // Funzioni per i campi ripetibili (opzionale)
        $scope.cloneRepeatable = function (title, type, tax, required, repeatable, searchable) {
            let newField = {
                title: title ? title : "",
                type: type ? type : "text",
                tax: tax ? tax : "Select One",
                required: required ? required : false,
                repeatable: repeatable ? repeatable : false,
                searchable: searchable ? searchable : false
            }
            $scope.wizardObj.modelFields.push(newField);
            console.log($scope.wizardObj);
        };

        $scope.removeRepeatable = function (index) {
            if ($scope.wizardObj.modelFields.length > 1) {
                $scope.wizardObj.modelFields.splice(index, 1);
            }
        };

        $scope.fillTmplNamesAndSubmit = function () {
            $("#wiz").slideToggle();
            $("#loadwiz").show();
            $scope.wizardObj.fullContentTemplateName = `${$scope.wizardObj.modelName}-full`
            $scope.wizardObj.previewTemplateName = `${$scope.wizardObj.modelName}-${$scope.wizardObj.previewTemplateType}`

            let modelName = $scope.wizardObj.modelName.replace(/\W+/g, '-').toLowerCase();
            modelName = modelName.replace(/[^A-Za-z0-9\.\/]+/g, '-').toLowerCase();
            let modelIndex = $scope.wizardObj.modelIndex.replace(/[^a-zA-Z]/g, "").toLowerCase();
            /*Acquisico l'html del modello*/
            $http({
                url: "public/assets/wsbuilder/libs/builder/dymer-basetemplate-form.html",
                method: "GET",
                data: {}
            }).then(function (getModelHtmlRet) {
                console.log("fillTmplNamesAndSubmit - Template del modello ===>", getModelHtmlRet);
                let modelTemplate = replaceAll(getModelHtmlRet.data, "{{titolo}}", $scope.wizardObj.modelName);
                modelTemplate = replaceAll(modelTemplate, "{{instance}}", modelIndex);

                /*Aggiungo al template del modello i nuovi campi*/
                let newFields = "";
                let title = "";
                let repeatable = "";
                let required = "";
                let searchable = "";
                let taxonomy = false;
                let relation = false;
                $($scope.wizardObj.modelFields).each(function () {
                    title = this.title.replace(/\W+/g, '-').toLowerCase();
                    title = title.replace(/[^A-Za-z0-9\.\/]+/g, '-').toLowerCase();
                    repeatable = "";
                    required = "";
                    searchable = "";
                    if (this.required) {
                        required = "required";
                    }
                    if (this.repeatable) {
                        repeatable = "repeatable first-repeatable";
                    }
                    if (this.searchable) {
                        searchable = 'searchable-override="data[' + title + ']" searchable-label="' + title + '" searchable-element="true"'
                    }

                    if (this.type == "string" || this.type == "text") {
                        newFields += '<div class="form-group ' + repeatable + '">\n<label class="kms-title-label">' + this.title + '</label>\n<input type="text" dymer-model-element="" class="form-control col-12 span12" ' + searchable + ' name="data[' + title + ']" ' + required + '>\n</div>\n';
                    }
                    if (this.type == "date") {
                        newFields += '<div class="form-group ' + repeatable + '">\n<label class="kms-title-label">' + this.title + ' (min 01-01-1900)</label>\n<input type="date" data-date="" data-date-format="DD MMMM YYYY" min="1900-01-01" dymer-model-element="" class="form-control col-12 span12" ' + searchable + ' name="data[' + title + ']" ' + required + '>\n</div>\n';
                    }
                    if (this.type == "number") {
                        newFields += '<div class="form-group ' + repeatable + '">\n<label class="kms-title-label">' + this.title + ' (min 1 - max 99)</label>\n<input type="number" min="1" max="99" dymer-model-element="" class="form-control col-12 span12" ' + searchable + ' name="data[' + title + ']" ' + required + '>\n</div>\n';
                    }
                    if (this.type == "image") {
                        newFields += '<div class="form-group ' + repeatable + '">\n<label class="kms-title-label">' + this.title + ' (.png,.jpg)</label>\n<input type="file" dymer-model-element="" class="form-control col-12 span12" ' + searchable + ' accept=".png,.jpg" name="data[' + title + ']" ' + required + '>\n</div>\n';
                    }
                    if (this.type == "file") {
                        newFields += '<div class="form-group ' + repeatable + '">\n<label class="kms-title-label">' + this.title + ' (.doc,.pdf,.xml,.csv,.txt,.ppt)</label>\n<input type="file" dymer-model-element="" class="form-control col-12 span12" ' + searchable + ' accept=".doc,.pdf,.xml,.csv,.txt,.ppt" name="data[' + title + ']" ' + required + '>\n</div>\n';
                    }
                    if (this.type == "textarea") {
                        newFields += '<div class="form-group ' + repeatable + '">\n<label class="kms-title-label">' + this.title + '</label>\n<textarea type="textarea" dymer-model-element="" class="form-control  col-12 span12" ' + searchable + ' name="data[' + title + ']" ' + required + '></textarea>\n</div>\n';
                    }
                    if (this.type == "selectlist") {
                        newFields += '<div class="form-group ' + repeatable + '">\n<label class="kms-title-label">' + this.title + '</label>\n<select class="form-control" dymer-model-element="" ' + searchable + ' name="data[' + title + ']" ' + required + '></select>\n</div>\n';
                    }
                    if (this.type == "email") {
                        newFields += '<div class="form-group ' + repeatable + '">\n<label class="kms-title-label">' + this.title + '</label>\n<input type="email" dymer-model-element="" class="form-control col-12 span12" ' + searchable + ' name="data[' + title + ']" ' + required + '>\n</div>\n';
                    }
                    if (this.type == "taxonomy") {
                        searchable = 'searchable-label="' + this.title + '" searchable-text="' + this.title + '" searchable-element="true" searchable-multiple="true"';
                        repeatable = 'multiple="multiple"';
                        newFields += '<div class="form-group collectionField" style="min-height: 100px;">\n<label for="description" class="kms-title-label">Taxonomy ' + this.title + '</label>\n<small class="form-text text-muted"><b></b> </small><div><div data-component-kmstaxonomy=""  ' + searchable + ' ' + repeatable + ' ' + required + ' class="form-group dymertaxonomy" data-totaxonomy="' + this.tax + ' " data-max-options="10" style="height:3px" searchable-element="true">\n</div>\n</div>\n</div>\n';
                        taxonomy = true;
                    }
                    if (this.type == "relation") {
                          
                        searchable = 'searchable-label="' + this.title + '" searchable-text="' + this.title + '" searchable-element="true" searchable-multiple="true"';
                        repeatable = 'multiple="multiple"';
                        newFields+='<div class="form-group">\n<label for="description" class="kms-title-label">Relation</label>\n<div><div data-component-dymrelation="" class="form-group dymerselectpicker" data-torelation="' + this.relationto + '"  ' + searchable + ' ' + repeatable + ' ' + required + '  data-actions-box="true" data-max-options=""><span class="inforelation">Relation</span>\n <i class="fa fa-code-fork rotandflip inforelation" aria-hidden="true"></i> <span contenteditable="false" class="torelation inforelation">' + this.relationto + '</span>\n</div>\n</div>\n</div>\n ';
                        relation = true;
                    }
                    if (this.type == "geo") {
                        newFields += '<div class="geopointcontgrp form-group field-description ">\n<label for="description" class="kms-title-label">Geo Point ' + this.title + '</label>\n<div>  <div data-component-geopoint class="form-group  ">\n<input type="hidden" dymer-model-element="" class= "form-control" name="data[location][type]" value="Point">\n<label class="kms-title-label">Longitude</label>\n<input type="number" dymer-model-element="" class="form-control" name="data[location][coordinates][0]" ' + required + '>\n<label class="kms-title-label">Latitudine</label>\n<input type="number" dymer-model-element="" class="form-control" name="data[location][coordinates][1]" ' + required + '>\n</div>\n</div>\n</div>';
                    }
                });
                modelTemplate = replaceAll(modelTemplate, "{{newFields}}", newFields);
                //console.log("fillTmplNamesAndSubmit - Template del modello con i nuovi campi ===>", modelTemplate);

                /*Creo il modello con il template aggiornato*/
                let modelData = {
                    title: $scope.wizardObj.modelName,
                    description: $scope.wizardObj.modelDescription,
                    name: modelName,
                    author: "Dymer Administrator",
                    instance: [{
                        "_index": modelIndex 
                     }],
                    file: {
                        originalname: modelName + ".html",
                        src: modelTemplate,
                        ctype: "text/html"
                    },
                    posturl: "",
                };
                let postModelData = new FormData();
                delete delete modelData.file;
                appendFormdata(postModelData, {"data": modelData});
                postModelData.append('data[file]', new File([new Blob([modelTemplate])], modelName + ".html", {type: "text/html"}));
                $http({
                    method: 'POST',
                    url: baseContextPath + 'api/forms/api/v1/form/',
                    headers: {
                        'Content-Type': undefined
                    },
                    data: postModelData
                }).then(function successCallback(postModelRet) {
                    console.log("fillTmplNamesAndSubmit - Modello creato con successo ===>", postModelRet);
                    useGritterTool("<b><i class='nc-icon nc-vector'></i>Model successfully generated. </b>", "");

                    /*Acquisico i campi dymer-model-element e aggiorno la struttura del modello*/
                    let modelId = postModelRet.data.data[0]._id;
                    let htmlId = postModelRet.data.data[0].files[0]._id;
                    let html = "";
                    $(modelTemplate).find("[dymer-model-element]").each(function () {
                        html += this.outerHTML;
                    });
                    let structure = JSON.stringify(html2json(html));
                    let postModelData_structure = new FormData();
                    postModelData_structure.append('data[pageId]', modelId);
                    postModelData_structure.append('data[structure]', structure);
                    $http({
                        method: 'POST',
                        url: baseContextPath + 'api/forms/api/v1/form/' + "updatestructure",
                        headers: {
                            'Content-Type': undefined
                        },
                        data: postModelData_structure
                    }).then(function successCallback(updateStructureRet) {
                        console.log("fillTmplNamesAndSubmit - Struttura del modello aggiornata con successo ===>", updateStructureRet);
                        useGritterTool("<b><i class='nc-icon nc-vector'></i>Model Structure successfully updated. </b>", "");

                        /*Eseguo l'update asset del modello*/
                        let postModelData_asset = new FormData();
                        postModelData_asset.append('data[file]', new File([new Blob([modelTemplate])], modelName + ".html", {type: "text/html"}));
                        postModelData_asset.append('data[pageId]', modelId);
                        postModelData_asset.append('data[assetId]', htmlId);
                        $http({
                            method: 'POST',
                            url: baseContextPath + 'api/forms/api/v1/form/' + "updateAsset",
                            headers: {
                                'Content-Type': undefined
                            },
                            data: postModelData_asset
                        }).then(function successCallback(updateAssetRet) {
                            console.log("fillTmplNamesAndSubmit - Asset del modello aggiornato con successo ===>", updateAssetRet);
                            useGritterTool("<b><i class='nc-icon nc-vector'></i>Model Asset successfully updated. </b>", "");

                            /*Acquisico il modello creato e aggiorno l'html del template Full Content con i campi dymer-model-element*/
                            $http({
                                url: baseContextPath + 'api/forms/api/v1/form/modeldetail',
                                method: "GET",
                                params: {query: `{"instance._index":"${modelIndex}"}`},
                            }).then(function (getFullContentTemplateHtmlRet) {
                               
                                console.log("modeldetail - html ritornato dal modeldetail ====>", getFullContentTemplateHtmlRet.data);

                                let dtReturnHTML=getFullContentTemplateHtmlRet.data.data;
                                //console.log("modeldetail - html ritornato dal getFullContentTemplateHtmlRet.data.data ====>", dtReturnHTML);
                                  
                               
                                if (taxonomy){
                                    dtReturnHTML += '<div class="card card-primary">\n<div class="card-header"></div>\n<div class="card-body"> \n<strong><i class="fas fa-pencil-alt mr-1"></i>Vocabularies</strong>\n <p class="text-muted"> {{#each taxonomy }} \n<span class="tag tag-success"> {{this}}  </span> \n    {{/each }}\n    </p> \n   </div> \n     </div> \n';
                                }
                                if (relation){
                                    dtReturnHTML += '<div class="card card-primary">\n<div class="card-header"></div>\n<div class="card-body"> \n<strong><i class="fas fa-pencil-alt mr-1"></i>Relation</strong>\n <p class="text-muted"> {{#each relations }} \n<span class="tag tag-success"> {{title}}  </span> \n    {{/each }}\n    </p> \n   </div> \n     </div> \n';
                                }
                                console.log("modeldetail - html ritornato dal modeldetail dtReturnHTML====>", dtReturnHTML);





                                /*Eseguo la creazione del template Full Content*/
                                let fullContentTemplateData = {
                                    title: $scope.wizardObj.modelName + '_templateFull',
                                    description: $scope.wizardObj.modelDescription,
                                    name: modelName + '_templateFull',
                                    author: "Dymer Administrator",
                                    instance: [{
                                        "_index":modelIndex 
                                    }],
                                    file: {
                                        originalname: modelName + "_fullTemplate.html",
                                        src: dtReturnHTML,
                                        ctype: "text/html"
                                    },
                                    posturl: "",
                                    viewtype: [{"rendertype": "fullcontent"}]
                                };
                                let postFullContentTemplateData = new FormData();
                                delete delete fullContentTemplateData.file;
                                appendFormdata(postFullContentTemplateData, {"data": fullContentTemplateData});
                                postFullContentTemplateData.append('data[file]', new File([new Blob([dtReturnHTML])], modelName + "_fullTemplate" + ".html", {type: "text/html"}));
                                $http({
                                    url: baseContextPath + 'api/templates/api/v1/template/',
                                    method: "POST",
                                    headers: {
                                        'Content-Type': undefined
                                    },
                                    data: postFullContentTemplateData
                                }).then((postFullContentTemplateRet) => {
                                    console.log("fillTmplNamesAndSubmit - Creazione del template Full Content eseguita con successo ====>", postFullContentTemplateRet);
                                    useGritterTool("<b><i class='nc-icon nc-vector'></i>Full Content Template successfully generated. </b>", "");
                                }).catch((postFullContentTemplateErr) => {
                                    console.log("fillTmplNamesAndSubmit - ERRORE nella creazione del template Full Content ====>", postFullContentTemplateErr);
                                    useGritterTool("<b><i class='fa fa-exclamation-triangle'></i>ERROR while creating Full Content template !</b>", "", "danger");
                                })

                                let templateType = "";
                                let templateName = "";
                                if ($scope.wizardObj.previewTemplateType == "card") {
                                    templateType = "teaser";
                                    templateName = "Card";
                                }
                                if ($scope.wizardObj.previewTemplateType == "list") {
                                    templateType = "teaserlist";
                                    templateName = "List";
                                }
                                if ($scope.wizardObj.previewTemplateType == "map") {
                                    templateType = "teasermap";
                                    templateName = "Map";
                                }
                                /*Acquisico l'html del template selezionato*/
                                $http({
                                    url: "public/assets/wsbuilder/libs/builder/dymer-basetemplate-template-" + templateType + '.html',
                                    method: "GET",
                                    data: {}
                                }).then(function (getTemplateHtmlRet) {

                                    /*Eseguo la creazione del template selezionato*/
                                    let templateData = {
                                        title: $scope.wizardObj.modelName + '_template' + templateName,
                                        description: $scope.wizardObj.modelDescription,
                                        name: modelName + '_template' + templateName,
                                        author: "Dymer Administrator",
                                        instance: [{
                                            "_index": modelIndex 
                                          }],
                                        file: {
                                            originalname: modelName + '_template' + templateName + '.html',
                                            src: getTemplateHtmlRet.data,
                                            ctype: "text/html"
                                        },
                                        posturl: "",
                                        viewtype: [{"rendertype": templateType}]
                                    };
                                    let postTemplateData = new FormData();
                                    delete delete templateData.file;
                                    appendFormdata(postTemplateData, {"data": templateData});
                                    postTemplateData.append('data[file]', new File([new Blob([getTemplateHtmlRet.data])], modelName + "_template" + templateName + ".html", {type: "text/html"}));
                                    $http({
                                        url: baseContextPath + 'api/templates/api/v1/template/',
                                        method: "POST",
                                        headers: {
                                            'Content-Type': undefined
                                        },
                                        data: postTemplateData
                                    }).then((postTemplateRet) => {
                                        console.log("fillTmplNamesAndSubmit - Creazione del template " + templateName + " eseguita con successo ====>", postTemplateRet);
                                        useGritterTool("<b><i class='nc-icon nc-vector'></i> " + templateName + " Template successfully generated. </b>", "");
                                        $("#loadwiz").hide();
                                        $("#resultwiz").slideToggle();
                                        $("#resultwizstring").append('<h2>Model ' + modelName + ' and template has been created successfully!!!</h2><br><a class="btn bt-outline-info" href="managemodel" target="_blank"><i class="nc-icon nc-ruler-pencil"></i> <p>Manage Models</p> </a> or <a href="managetemplate" target="_blank" class="btn bt-outline-info"><i class="nc-icon nc-ruler-pencil"></i> <p>Manage Templates</p> </a>');


                                    }).catch((postTemplateErr) => {
                                        console.log("fillTmplNamesAndSubmit - ERRORE nella creazione del template " + templateName + " ====>", postTemplateErr);
                                        useGritterTool("<b><i class='fa fa-exclamation-triangle'></i>ERROR while creating " + templateName + " template !</b>", "", "danger");
                                    })
                                }).catch(function (getTemplateHtmlErr) {
                                    console.log("fillTmplNamesAndSubmit - ERRORE nell'acquisizione dell'html del template " + templateName + " ===>", getTemplateHtmlErr);
                                    useGritterTool("<b><i class='fa fa-exclamation-triangle'></i>ERROR while reading the html of the " + templateName + " template !</b>", "", "danger");
                                });
                            }).catch(function (getFullContentTemplateHtmlErr) {
                                console.log("fillTmplNamesAndSubmit - ERRORE nella lettura del mdoello e nell'aggiornamento dell'html del template full content con i campi dymer-model-element ===>", getFullContentTemplateHtmlErr);
                                useGritterTool("<b><i class='fa fa-exclamation-triangle'></i>ERROR while reading the model and updating the html of the full content template with dymer-model-element fields !</b>", "", "danger");
                            })
                        }).catch(function (updateAssetErr) {
                            console.log("fillTmplNamesAndSubmit - ERRORE nell'update dell'asset del modello ===>", updateAssetErr);
                            useGritterTool("<b><i class='fa fa-exclamation-triangle'></i>ERROR in updating the model asset !</b>", "", "danger");
                        })
                    }).catch(function (updateStructureErr) {
                        console.log("fillTmplNamesAndSubmit - ERRORE nell'update della struttura del modello ===>", updateStructureErr);
                        useGritterTool("<b><i class='fa fa-exclamation-triangle'></i>ERROR in updating the model structure !</b>", "", "danger");
                    })
                }).catch(function (postModelErr) {
                    console.log("fillTmplNamesAndSubmit - ERRORE nella creazione del modello ===>", postModelErr);
                    useGritterTool("<b><i class='fa fa-exclamation-triangle'></i>ERROR while creating the model !</b>", "", "danger");
                });
                //useGritterTool("<b><i class='nc-icon nc-vector'></i>Model and templates successfully generated. </b>", "");
            }).catch(function (getModelHtmlErr) {
                console.log("fillTmplNamesAndSubmit - ERRORE nell'acquisizione dell'html del modello ===>", getModelHtmlErr);
                useGritterTool("<b><i class='fa fa-exclamation-triangle'></i>ERROR while reading the model html !</b>", "", "danger");
            });
        };


        $scope.getFieldByCSV = async function () {
            console.log("Fields from CSV")
            let myFile = $scope.myFile
            let url = baseContextPath + '/api/dservice/api/v1/import/test-csv'

            let data = {
                file: myFile
            }
            try {
                let multipartResp = await multipartForm.post(url, data) // call multipart function
                let csvRecords = multipartResp.data // catch array of records of CSV

                console.log("getFieldByCSV - CSV ===> ", csvRecords)

                let fieldHeaders = csvRecords[0].replace(/[^a-zA-Z0-9, ]/g, "").split(",") // array of headers

                console.log("getFieldByCSV - CSV HEADERS ===> ", fieldHeaders)

                csvRecords.shift(); // remove headers from CSV records
                if (fieldHeaders) {
                    for (let record of csvRecords) {
                        let cleanedRecord = record.replace(/[^a-zA-Z0-9, ]/g, ""); // clean special symbols
                        let recElements = cleanedRecord.split(",").map(el => el.trim());
                        $scope.cloneRepeatable(
                            recElements[fieldHeaders.indexOf("title")],
                            recElements[fieldHeaders.indexOf("type")],
                            JSON.parse(recElements[fieldHeaders.indexOf("required")]),
                            JSON.parse(recElements[fieldHeaders.indexOf("repeatable")]),
                            JSON.parse(recElements[fieldHeaders.indexOf("searchable")])
                        )
                    }
                    $scope.wizardObj.modelFields.shift() // remove first empty field
                    $scope.$apply();
                }
            } catch (err) {
                console.log("getFieldByCSV - Unable retrieve fields form CSV due to ===>", err)
            }
        }

        $scope.getVocabularies = async function () {
            $($scope.wizardObj.modelFields).each(function() {
                if (this.type == "taxonomy"){
                    var serviceurl = baseContextPath + '/api/dservice/api/v1/taxonomy';
                    var par = { "query": { "instance._index": { "$eq": "general" } } };
                    $http({
                        url: serviceurl,
                        method: "GET",
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        params: par,
                    }).then(function(ret) {
                        $scope.vocabularies = ret.data.data
                        
                        console.log('Vocabularies ===>', ret.data.data);
                        
                        //$(ret.data.data).each(function(a) {
                        //});        
                    }).catch((err) => {
                        console.log(err)
                    });
                }
            });    
        }
    });
/*AC - MG - Wizard - Fine*/
