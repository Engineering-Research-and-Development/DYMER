angular.module("main.app", []).service("serviceEntity", [
    "$http",
    "$q",
    function($http, $q) {
        var chiama = function() {
            console.log("beforeInit b");
            console.log("saluta");
            var deferred = $q.defer();
            /*  $http({
                url: "/api/entities/api/v1/entity/allindex/"
              })
                .success(function(ret) {
                  console.log("rerere", ret.data);
                  console.log("beforeInit c");
                  deferred.resolve(ret.data);
                })
                .error(function() {
                  deferred.reject("There was an error");
                });*/

            $http.get('/api/forms/api/v1/form/', this.entData).then(function(ret) {
                console.log('indexWithModel ', ret.data.data);
                // Vvveb.listResources.setModels(ret.data.data);
                var indexWithModel = ret.data.data;
                var listIndex = [];
                indexWithModel.forEach(element => {
                    element.instance.forEach(el => {
                        var n_el = el._index;
                        ((listIndex.indexOf(n_el) === -1) && el._index != 'general' && el._index != 'entity_relation') ? listIndex.push(n_el): "";

                        // listIndex.push(el._index);
                    });
                });
                console.log('listIndex pre', listIndex);
                //Marco devo prendere tutti gli indici che non sono nei form e relation in modo tale da recuperare gli esterni non aventi un modello
                $http.get('/api/entities/api/v1/entity/allindex', this.entData).then(function(rt) {
                    console.log('allindex post', rt.data.data);
                    var allindex = rt.data.data;
                    //  console.log('indexWithModel ', indexWithModel);
                    for (const [key, value] of Object.entries(allindex)) {
                        // console.log(key, value);

                        if (!listIndex.includes(key)) {


                            listIndex.push(key);
                        }
                    }

                    //  var listStr = extractStrElast(allindex);
                    console.log('TOT indexWithModel', listIndex);
                    // Vvveb.listResources.setStructures(listStr);
                    // Vvveb.listResources.setModels(ret.data.data);
                    //   $scope.listaModels = ret.data.data;
                    return deferred.resolve(listIndex);

                }).catch(function(response) {
                    console.log(response.status);
                })
            }).catch(function(response) {
                console.log(response.status);
            })




















            /*

                        $http.get("/api/entities/api/v1/entity/allindex/").then(function(ret) {
                            console.log("rerere", ret.data);
                            console.log("beforeInit c");
                            return deferred.resolve(ret.data);
                            //return ret.data;
                        });
            */
            return deferred.promise; // Restituisco una promise
        };

        return {
            chiama: chiama
        };
    }
]);