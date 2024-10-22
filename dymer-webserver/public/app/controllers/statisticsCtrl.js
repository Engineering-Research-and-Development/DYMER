/*MG - Social Statistics - Inizio*/
angular.module('statisticsCtrl', [])
    .controller('statisticsController', function ($scope, $http, $rootScope, multipartForm) {
        var baseContextPath = $rootScope.globals.contextpath;
        $scope.dtStatistics = [];
        let statistics = function(size, sort, idDt, lista, types) {
            let par = {
                "query": { "instance._type": { "$eq": "" } }
            };
            $http.get(baseContextPath + '/api/dservice/api/v1/stats/getallstats', par).then(function(ret) {
                $scope[lista] = ret.data.data[0]; 
                let results = ret.data.data[0], 
                typesObject = Object.groupBy(results, ({ type }) => type);    
                $scope[types] = typesObject;
                jQuery(document).ready(function() {
                    jQuery(idDt).DataTable();

                });
            }).catch(function(response) {
                console.log(response.status);
            });
        }
        statistics(50, [], '#dtStatistics', 'dtStatistics','types');
        $scope.deleteStatisticsById = function(obj, id) {
            if (confirm("Are you sure to flush statistics ?")) {
                $http.delete(baseContextPath + '/api/dservice/api/v1/stats/deletestats/'+id, {
                }).then(function(response) {
                    statistics(50, [], '#dtStatistics', 'dtStatistics');
                    useGritterTool("<b><i class='fa fa-map-signs  '></i> Delete successfully </b>", "");
                }).catch(function(response) {
                    useGritterTool("<b><i class='fa fa-map-signs  '></i> Error ! </b>", response.data.message, "danger");
                });
            }
        };
        let manageFilter = (function() {
            let checkboxInput = ' input[type="checkbox"]', filters = {},rowData = [],values = [],key, value, show, length, divId;
            let init = function() {
              $(checkboxInput).prop('checked', false);
              $(checkboxInput).change(function() {
                let that = $(this);
                if(that.hasClass('all')) {
                  $('#' + getFilterCategoryId(that) + checkboxInput).prop('checked', that.prop('checked'));
                } else {
                  let allInput = $('#' + getFilterCategoryId(that) + checkboxInput + ':first');
                  if(allInput.is(':checked')) {
                    allInput.prop('checked', false);
                  }
                }
                poulateAndApplyFilters();
              });
            };
            let poulateAndApplyFilters = function() {
              populateFilterValues();
              applyFiltersToTable();
            };
            let getFilterCategoryId = function(elem) {
              divId = elem.parent().parent().parent()[0].id;
              return divId;
            };
            let trimAndLower = function(elem) {
              return elem.toLowerCase().trim();
            };
            let populateFilterValues = function() {
              $(checkboxInput).each(function() {
                if ($(this).is(":checked") && $(this).val() !== "all") { 
                  value = trimAndLower($(this).val());
                  key = getFilterCategoryId($(this));
                  if (filters[key] === undefined) { 
                    values.push(value);
                    filters[key] = values;
                  } else {
                    filters[key].push(value);
                  }
                  values = [];
                }
              });
            };
            let populateRowData = function(row) {
              row.find('td').each(function() {
                rowData.push(trimAndLower($(this).text()));
              });
            };
            let applyFiltersToTable = function() {
              if (filters[key] === undefined) {
                $("table tbody tr").show(); 
              } else {
                $("table tr").each(function() {
                  show = false; 
                  populateRowData($(this));
                  if (rowData.length > 0) {
                    for (var k in filters) { 
                      if (filters.hasOwnProperty(k)) {
                        length = filters[k].length;
                        for (var i = 0; i < length; i++) { 
                          value = filters[k][i];
                          if (k == "counter"){
                            if (value == "one"){
                                if (rowData[5] <= 100) { 
                                    show = true;
                                    break;
                                }   
                            }
                            if (value == "two"){
                                if (rowData[5] > 100 && rowData[5] <= 300) { 
                                    show = true;
                                    break;
                                }   
                            }      
                            if (value == "three"){
                              if (rowData[5] > 300) { 
                                  show = true;
                                  break;
                              }   
                            }      
                          }else{
                            if (rowData.indexOf(value) !== -1) { 
                                show = true;
                                break;
                            }
                          }
                        }
                        if (show) {
                          $(this).show();
                        } else {
                          $(this).hide();
                          break;
                        }
                        show = false;
                      }
                    }
                  }
                  rowData = [];
                });
                filters = {};
              }
            };
            return {
              init: init
            };
        })();
        manageFilter.init();
});
/*MG - Social Statistics - Fine*/