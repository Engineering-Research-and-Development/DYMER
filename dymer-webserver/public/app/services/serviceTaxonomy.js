angular.module("mainTax.app", []).service("serviceTaxonomy", [
    "$http",
    "$q",
    function ($http, $q) {
        var chiama = function () {
            console.log("beforeInit b");
            console.log("saluta");
            var deferred = $q.defer();

            $http.get(site_prefix +'/api/dservice/api/v1/taxonomy', this.entData).then(function (ret) {
                var vocabularies = ret.data.data;
                var listTitle = [];
                var internalNodes = [];
                vocabularies.forEach(element => {

                      listTitle.push(element);

                });
                console.log('listTitles pre', listTitle);
                console.log('internalNodes pre', internalNodes);


                     return deferred.resolve(listTitle);


            }).catch(function (response) {
                
                console.log(response);
            })

            return deferred.promise; 
        };

        return {
            chiama: chiama
        };
    }
]);