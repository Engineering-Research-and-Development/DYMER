angular.module("userApp").factory('exportEntities', ['$http', function ($http) {

    return {
        exportJSONFormat: function (baseContextPath, obj) {
            console.log("JSON Exporting..")
            console.log("OBJ: ", obj)
            console.log("CONTENT PATH ", baseContextPath)
            console.log(`URL: ${baseContextPath}/api/entities/api/v1/entity/export-json-entities`)
            $http.post(`${baseContextPath}/api/entities/api/v1/entity/export-json-entities`, obj)
                .then(function (response) {
                    let d = new Date();
                    let date = d.toISOString().split('T')[0].replace(/-/g, '_');
                    let time = d.toTimeString().split(' ')[0].replace(/:/g, '_');
                    let dataFile = JSON.stringify(response.data)

                    let blob = new Blob([dataFile], { type: 'application/json' });

                    let linkElement = document.createElement('a');
                    let url = window.URL.createObjectURL(blob);

                    let filename = `${obj.index}_catalogue_${date}_${time}.json`
                    linkElement.setAttribute('href', url);
                    linkElement.setAttribute("download", filename);

                    let clickEvent = new MouseEvent("click", {
                        "view": window,
                        "bubbles": true,
                        "cancelable": false
                    });
                    linkElement.dispatchEvent(clickEvent);
                }).catch(function (response) {
                    console.log(response);
                });
        },
        exportCSVFormat: function(baseContextPath, obj) {
            console.log("CSV Exporting..")
            $http.post(`${baseContextPath}/api/entities/api/v1/entity/export-csv-entities`, obj)
                .then(function (response) {
                    let d = new Date();
                    let date = d.toISOString().split('T')[0].replace(/-/g, '_');
                    let time = d.toTimeString().split(' ')[0].replace(/:/g, '_');
                    //let dataFile = JSON.stringify(response.data)

                    let blob = new Blob([response.data], { type: 'text/csv' });

                    let linkElement = document.createElement('a');
                    let url = window.URL.createObjectURL(blob);

                    let filename = `${obj.index}_catalogue_${date}_${time}.csv`
                    linkElement.setAttribute('href', url);
                    linkElement.setAttribute("download", filename);

                    let clickEvent = new MouseEvent("click", {
                        "view": window,
                        "bubbles": true,
                        "cancelable": false
                    });
                    linkElement.dispatchEvent(clickEvent);
                }).catch(function (response) {
                    console.log(response);
                });
        },
        importJSONFormat: function(baseContextPath, obj, file) {
            console.log("chiamata la funzione importo di JSON")

            let data = {
                obj: obj,
                file: file
            };

            Upload.upload({
                url: `${baseContextPath}//api/dservice/api/v1/import/fromjson?filename=${file}&type=organization`,
                data: data
            }).then(function (response) {
                // Gestisci la risposta dal server dopo l'upload
                console.log('Upload completato con successo:', response.data);
            }).catch(function (error) {
                // Gestisci gli errori durante l'upload
                console.error('Errore durante l\'upload:', error);
            });
        
        }
    }
}])