angular.module('entitiesImportControllers', [])
    .controller('entitiesImport_ff', function ($scope, $http, $rootScope, exportEntities, multipartForm) {
        var baseContextPath = $rootScope.globals.contextpath;
        //   console.log('testing controller entitiesImport_ff');

        $scope.method = "GET";
        $scope.host = "http://localhost";
        $scope.port = "8008";
        $scope.path = "/";
        var mapping = {
            "ID": "__id",
            "TYPE": "__type",
            "_index": "_index",
            "_source": "_source"
        };
        $scope.mapping = JSON.stringify(mapping, '",', '\t');


        $http.get(baseContextPath + '/api/entities/api/v1/entity/allstatsglobal', {}).then(function (retE) {
            let res = retE.data.data.indices;
            $scope.listEntities = res.map((e) => e.index)
            // $scope.listEntities.shift()
            let entRelIndex = $scope.listEntities.indexOf("entity_relation")
            if (entRelIndex !== -1) {
                $scope.listEntities.splice(entRelIndex, 1)
            }
        }).catch(function (e) {
            console.error("error: ", e)
        })


        $scope.importEntFl = function () {

            var pathService = $scope.host + ':' + $scope.port + $scope.path
            if ($scope.method == 'GET') {
                $http.get(pathService,
                    $scope.mapping
                ).then(function (ret) {
                    console.log('Import Resp', ret);

                    return $scope.import_result = ret;
                }).catch(function (response) {
                    console.log(response.status);
                });

            }
            if ($scope.method == 'POST') {
                $http.post(pathService, $scope.mapping).then(function (ret) {
                    console.log('Import Resp', ret);

                    $scope.import_result = ret;
                }).catch(function (response) {
                    console.log(response.status);
                });
            }
        }

        $scope.ExportJSON = function () {
            console.log("Exporting JSON")
            exportEntities.exportJSONFormat(baseContextPath, {index: $scope.selectedEntity})
        }

        $scope.ExportCSV = function () {
            console.log("Exporting CSV")
            let options = $scope.myDropdownOptions.map(el => (el.id))
            let selectedOptions = $scope.myDropdownModel.map(el => el.id)

            let excluededFields = options.filter(element => !selectedOptions.includes(element))
            exportEntities.exportCSVFormat(baseContextPath, {index: $scope.selectedEntity, exclude: excluededFields})
        }

        $scope.myDropdownSettings = {
            smartButtonTextProvider: [],
            smartButtonMaxItems: 3,
            smartButtonTextProvider(selectionArray) {
                if (selectionArray.length === 1) {
                    return selectionArray[0].label;
                } else {
                    return selectionArray.length + ' Selected';
                }
            }
        };

        $scope.myDropdownModel = [{id: "ciao_test"}]

        $scope.selectOptions = function () {
            let index = $scope.selectedEntity
            let fields = []

            $http.get(baseContextPath + '/api/entities/api/v1/entity/getstructure/' + index).then(function (rt) {
                for (let el of rt.data) {
                    fields.push({id: el, label: el})
                }
                $scope.myDropdownOptions = fields
            }).catch(function (e) {
                console.log("Error: ", e)
            })
        };

        // AC - new import start
        $scope.currentStep = 1;
        $scope.activated = "";
        $scope.activated1 = "";
        $scope.activated2 = "";

        $("#loadwiz").hide();
        $("#resultwiz").hide();

        $scope.infoDetails = {
            index: "",
            separator: "",
            relationsList: [
                { enabled: false, searchingField: '', relationTo: '' }
            ],
            fields: []
        };

        // Wizard Handling
        $scope.nextStep = function () {
            if ($scope.currentStep < 5) {
                $scope.currentStep++;
            }
            if ($scope.currentStep == 2) {
                $scope.activated = "activated";
            }
            if ($scope.currentStep == 3) {
                $scope.activated = "activated";
            }
            if ($scope.currentStep == 4) {
                $scope.selectedFields = $scope.infoDetails.fields.filter((element) => element.isSelected === true);
                $scope.activated = "activated";
            }
            if ($scope.currentStep == 5) {
                runMapping()
                $scope.activated = "activated";
            }
            console.log("wizard infoDetails: ", $scope.infoDetails)
        };

        $scope.previousStep = function () {
            if ($scope.currentStep > 1) {
                $scope.currentStep--;
            }
        };
      //  $scope.submitForm = function () {
     //       console.log('Form submitted:', $scope.infoDetails);
     //   };

        $scope.getFieldByCSV = async function () {
            Papa.parse($scope.myFile, {
                    header: true,
                    delimiter: $scope.infoDetails.separator || "", // separator or autodetect
                    complete: function (result) {
                        $scope.metadata = {
                            delimiter: result.meta.delimiter,
                            linebreak: result.meta.linebreak,
                            truncated: result.meta.truncated,
                            cursor: result.meta.cursor,
                        }

                        $scope.CSVFields = result.meta.fields
                        $scope.CSVData = result.data
                        $scope.errors = result.errors

                        $scope.$apply();
                    }
                }
            )
        }

        $scope.addHeader = function () {
            $scope.infoDetails.fields.push({
                originalName: "",
                newName: "",
                isNew: true,
                isSelected: true,
                isArrayField: false
            });
        };

        $scope.removeHeader = function (index) {
            $scope.infoDetails.fields.splice(index, 1);
        };
        
        $scope.getIndexStructure = function () {
            if (!$scope.infoDetails.index) return;

            let index = $scope.infoDetails.index
            let url = baseContextPath + '/api/entities/api/v1/entity/allindex/' + index

            $http.get(url).then(ret => {
                //let JSONStructure = ret.data.data[index].mappings[index].properties //master old elasticsearch
                let JSONStructure = ret.data.data[index].mappings.properties //elasticsearch 8.11
                let structure = []
                for (const key in JSONStructure) {
                    if (JSONStructure[key].hasOwnProperty("properties")) {
                        for (const subKey in JSONStructure[key]["properties"]) {
                            structure.push(`${key}.${subKey}`);
                        }
                    } else {
                        structure.push(key);
                    }
                }
                //  console.log("structure: ", structure)
                structure.forEach(field => {
                    $scope.infoDetails.fields.push({
                        originalName: field,
                        newName: "",
                        isNew: false,
                        isSelected: false,
                        isArrayField: false
                    })
                })
            }).catch(e => {
                console.log("Unable retrieve index fields due to: ", e)
            })
        }

       function runMapping() {
            // Get selected fields
            const selectedFields = $scope.selectedFields //$scope.infoDetails.fields.filter(field => field.isSelected);

            // header Map
            let headerMap = {};
            $scope.arrayFields = []

            selectedFields.forEach(field => {
                const originalName = field.originalName;
                const newName = field.newName;

                if(field.isArrayField) {
                    $scope.arrayFields.push(originalName)
                }

                headerMap[newName] = originalName;
            });

            // selected Data in CSV
            const filteredData = $scope.CSVData.map(row => {
                let newRow = {};
                Object.keys(row).forEach(key => {
                    if (headerMap[key]) {
                        newRow[headerMap[key]] = row[key]; // Use new name
                    }
                });
                return newRow;
            });

            // Filter headers map based
            // const filteredHeaders = $scope.CSVFields.filter(header => headerMap[header])
            //     .map(header => headerMap[header]);

            $scope.MappedData = filteredData
            console.log("arrayFields ==> ", $scope.arrayFields)

            /****/
            // Get relations fields
            $scope.infoDetails.relationsList.forEach(rel => {
                //console.log($scope.CSVData.map(headerData => headerData[rel.searchingField]))
                rel["relationData"] = $scope.CSVData.map(headerData => headerData[rel.searchingField])
            })
            /****/

            // console.log("filteredData", filteredData);
            // console.log("filteredHeaders", filteredHeaders);
            //
            // console.log("Header Map:", headerMap);
            // console.log("CSV Data:", $scope.CSVData);
            // console.log("CSV Fields:", $scope.CSVFields);
        }

        $scope.importMappedData = function () {
            // Build object
            let dataToImport = {
                index: $scope.infoDetails.index,
                data: $scope.MappedData,
                relations: $scope.infoDetails.relationsList,
                arrayFields: $scope.arrayFields
            };

            console.log("Sending to Backend ==> ", dataToImport);

            // Send to BE
            let url = baseContextPath + "/api/dservice/api/v1/import/fromcsv";
            $http.post(url, dataToImport).then(function (ret) {
                if (ret.data.success) {
                    useGritterTool("<b><i class='nc-icon nc-vector'></i>CSV Import</b>", ret.data.message);
                } else {
                    useGritterTool("<b><i class='fa fa-exclamation-triangle'></i>CSV Import</b>", ret.data.message, "danger");
                }
            }).catch(function (response) {
                console.log(response.status);
            });
        };

        $scope.addRelation = function () {
            // Add a new row already "enabled"
            $scope.infoDetails.relationsList.push({
                enabled: true,
                searchingField: '',
                relationTo: ''
            });
        };

        $scope.removeRelation = function (index) {
            if (index !== 0) {
                $scope.infoDetails.relationsList.splice(index, 1); // remove if is not the first row
            }
        };

// AC - new import end
    });
