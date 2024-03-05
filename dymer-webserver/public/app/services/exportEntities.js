angular.module("userApp").factory('exportEntities', ['$http', function ($http) {

    return {
        exportJSONFormat: function (baseContextPath, obj) {
            console.log("JSON Exporting..")
            console.log("OBJ: ", obj)
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
        test: function() {
            console.log("chiamata la funzione di test")
        }
    }
}])