/*AC - MG - Wizard - Inizio*/
angular.module('wizardCtrl', [])
    .controller('wizardController', function ($scope, $http, $rootScope) {
        var baseContextPath = $rootScope.globals.contextpath;
        $scope.currentStep = 1;
        $scope.wizardObj = {
            modelName: "",
            modelIndex: "",
            modelDescription: "",
            modelFields: [
                {
                    title: "",
                    type: "text",
                    required: false,
                    repeatable: false,
                    searchable: false
                }],
            fullContentTemplateName: "",
            fullContentTemplateType: "Full content",
            previewTemplateType: "",
            previewTemplateName: ""
        }

        // Funzioni per la navigazione nel wizard
        $scope.nextStep = function () {
            if ($scope.currentStep < 3) {
                $scope.currentStep++;
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
        $scope.cloneRepeatable = function (title, type, required, repeatable, searchable ) {
            let newField = {
                title: title ? title : "",
                type: type ? type : "text",
                required: required ? required : false,
                repeatable: repeatable ? repeatable : false,
                searchable: searchable ? searchable: false
            }
            $scope.wizardObj.modelFields.push(newField);
            console.log($scope.wizardObj);
        };

        $scope.removeRepeatable = function () {
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
            
            /*Acquisico l'html del modello*/
            $http({
                url: "public/assets/wsbuilder/libs/builder/dymer-basetemplate-form.html",
                method: "GET",
                data: {}
            }).then(function (getModelHtmlRet) {
                console.log("fillTmplNamesAndSubmit - Template del modello ===>", getModelHtmlRet);
                let modelTemplate = replaceAll(getModelHtmlRet.data, "{{titolo}}", $scope.wizardObj.modelName);
                modelTemplate = replaceAll(modelTemplate, "{{instance}}", $scope.wizardObj.modelIndex);
                
                /*Aggiungo al template del modello i nuovi campi*/
                let newFields ="";
                let title = "";
                let repeatable = "";
                let required = "";
                let searchable = "";
                $($scope.wizardObj.modelFields).each(function() {
                    title = this.title.replace(/\W+/g, '-').toLowerCase();
                    title = title.replace(/[^A-Za-z0-9\.\/]+/g, '-').toLowerCase();
                    repeatable = "";
                    required = "";
                    searchable = "";
                    if (this.required){
                        required = "required";
                    }
                    if (this.repeatable){
                        repeatable = "repeatable first-repeatable";
                    }
                    if(this.searchable) {
                        searchable = 'searchable-override="data['+title+']" searchable-label="'+title+'" searchable-element="true"'
                    }
                    if (this.type == "string" || this.type == "text"){
                        newFields+= '<div class="form-group '+repeatable+'"><label class="kms-title-label">'+this.title+'</label><input type="text" dymer-model-element="" class="form-control col-12 span12" '+searchable+' name="data['+title+']" '+required+'></div>\n';
                    }
                    if (this.type == "textarea"){
                        newFields+= '<div class="form-group '+repeatable+'"><label class="kms-title-label">'+this.title+'</label><textarea type="textarea" dymer-model-element="" class="form-control  col-12 span12" '+searchable+' name="data['+title+']" '+required+'></textarea></div>\n';
                    }
                    if (this.type == "selectlist"){
                        newFields+= '<div class="form-group '+repeatable+'"><label class="kms-title-label">'+this.title+'</label><select class="form-select" dymer-model-element="" '+searchable+' name="data['+title+']" '+required+'></select></div>\n';
                    }
                    if (this.type == "email"){
                        newFields+= '<div class="form-group '+repeatable+'"><label class="kms-title-label">'+this.title+'</label><input type="email" dymer-model-element="" class="form-control col-12 span12" '+searchable+' name="data['+title+']" '+required+'></div>\n';
                    }
                });
                modelTemplate = replaceAll(modelTemplate, "{{newFields}}", newFields);
                console.log("fillTmplNamesAndSubmit - Template del modello con i nuovi campi ===>", modelTemplate);

                /*Creo il modello con il template aggiornato*/
                let modelData = {
                    title: $scope.wizardObj.modelName,
                    description: $scope.wizardObj.modelDescription,
                    name: modelName,
                    author: "Dymer Administrator",
                    instance: [{
                        "_index": $scope.wizardObj.modelIndex,
                        "_type": $scope.wizardObj.modelIndex
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
                        $(modelTemplate).find("[dymer-model-element]").each(function() {
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
                                            params: {query: `{"instance._index":"${$scope.wizardObj.modelIndex}"}`},
                                        }).then(function (getFullContentTemplateHtmlRet) {
                                            
                                            /*Eseguo la creazione del template Full Content*/
                                            let fullContentTemplateData = {
                                                title: $scope.wizardObj.modelName+'_templateFull',
                                                description: $scope.wizardObj.modelDescription,
                                                name: modelName+'_templateFull',
                                                author: "Dymer Administrator",
                                                instance: [{
                                                    "_index": $scope.wizardObj.modelIndex,
                                                    "_type": $scope.wizardObj.modelIndex
                                                }],
                                                file: {
                                                    originalname: modelName + "_fullTemplate.html",
                                                    src: getFullContentTemplateHtmlRet.data,
                                                    ctype: "text/html"
                                                },
                                                posturl: "",
                                                viewtype:[{"rendertype":"fullcontent"}]
                                            };
                                            let postFullContentTemplateData = new FormData();
                                            delete delete fullContentTemplateData.file;
                                            appendFormdata(postFullContentTemplateData, {"data": fullContentTemplateData});
                                            postFullContentTemplateData.append('data[file]', new File([new Blob([getFullContentTemplateHtmlRet.data])], modelName + "_fullTemplate" + ".html", {type: "text/html"}));
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

                                            /*Acquisico l'html del template Teaser List*/
                                            $http({
                                                url: "public/assets/wsbuilder/libs/builder/dymer-basetemplate-template-teaserlist.html",
                                                method: "GET",
                                                data: {}
                                            }).then(function (getTeaserListTemplateHtmlRet) {

                                                /*Eseguo la creazione del template Teaser List*/
                                                let teaserListTemplateData = {
                                                    title: $scope.wizardObj.modelName+'_templateTeaserList',
                                                    description: $scope.wizardObj.modelDescription,
                                                    name: modelName+'_templateTeaserList',
                                                    author: "Dymer Administrator",
                                                    instance: [{
                                                        "_index": $scope.wizardObj.modelIndex,
                                                        "_type": $scope.wizardObj.modelIndex
                                                    }],
                                                    file: {
                                                        originalname: modelName + "_templateTeaserList.html",
                                                        src: getTeaserListTemplateHtmlRet.data,
                                                        ctype: "text/html"
                                                    },
                                                    posturl: "",
                                                    viewtype:[{"rendertype":"teaserlist"}]
                                                };
                                                let postTeaserListTemplateData = new FormData();
                                                delete delete teaserListTemplateData.file;
                                                appendFormdata(postTeaserListTemplateData, {"data": teaserListTemplateData});
                                                postTeaserListTemplateData.append('data[file]', new File([new Blob([getTeaserListTemplateHtmlRet.data])], modelName + "_templateTeaserList" + ".html", {type: "text/html"}));
                                                $http({
                                                    url: baseContextPath + 'api/templates/api/v1/template/',
                                                    method: "POST",
                                                    headers: {
                                                        'Content-Type': undefined
                                                    },
                                                    data: postTeaserListTemplateData
                                                }).then((postTeaserListTemplateRet) => {
                                                        console.log("fillTmplNamesAndSubmit - Creazione del template Teaser List eseguita con successo ====>", postTeaserListTemplateRet);
                                                        useGritterTool("<b><i class='nc-icon nc-vector'></i>Teaser List Template successfully generated. </b>", "");
                                                        $("#resultwiz").slideToggle();
                                                        startConfetti();

                                                        $("#loadwiz").hide();
                                                        
                                                }).catch((postTeaserListTemplateErr) => {
                                                        console.log("fillTmplNamesAndSubmit - ERRORE nella creazione del template Teaser List ====>", postTeaserListTemplateErr);
                                                        useGritterTool("<b><i class='fa fa-exclamation-triangle'></i>ERROR while creating Teaser List template !</b>", "", "danger");
                                                })
                                            }).catch(function (getTeaserListTemplateHtmlErr) {
                                                console.log("fillTmplNamesAndSubmit - ERRORE nell'acquisizione dell'html del template Teaser List ===>", getTeaserListTemplateHtmlErr);
                                                useGritterTool("<b><i class='fa fa-exclamation-triangle'></i>ERROR while reading the html of the Teaser List template !</b>", "", "danger");
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






    });

     
    /*AC - MG - Wizard - Fine*/