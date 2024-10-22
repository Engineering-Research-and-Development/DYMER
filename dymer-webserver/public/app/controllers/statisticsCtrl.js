/*MG - Social Statistics - Inizio*/
angular.module('statisticsCtrl', [])
    .controller('statisticsController', function ($scope, $http, $rootScope, multipartForm) {
        var baseContextPath = $rootScope.globals.contextpath;
        $scope.dtStatistics = [];

        $scope.deleteStatisticsById = function(obj, id) {
            if (confirm("Are you sure to flush statistics ?")) {
                $http.delete(baseContextPath + '/api/dservice/api/v1/stats/deletestats/'+id, {
                }).then(function(rt) {
                    console.log("deleted done", rt);
                    $scope.ListEntities[ind].count = 0;
                }).catch(function(response) {
                    console.log(response.status);
                });
            }
        };

        let statistics = function(size, sort, idDt, lista) {
            let par = {
                 "query": { "instance._type": { "$eq": "" } }
            };
            $http.get(baseContextPath + '/api/dservice/api/v1/stats/getallstats', par).then(function(ret) {
                $scope[lista] = ret.data.data[0]; 
                jQuery(document).ready(function() {
                    jQuery(idDt).DataTable();

                });
            }).catch(function(response) {
                console.log(response.status);
            });
        }
        statistics(50, ["properties.created:desc"], '#dtStatistics', 'dtStatistics');
});
/*MG - Social Statistics - Fine*/