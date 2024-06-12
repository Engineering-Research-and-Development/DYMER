angular.module('configuratorCtrl', [])
    .controller('confController', function($scope, $http, $rootScope) {


        var baseContextPath = $rootScope.globals.contextpath;

        $scope.formData = {};

        function copyToClipboard(element) {
            var $temp = $("<textarea>");
            $("body").append($temp);
            $(element).css(
                'background-color', '#6bd09833'
            );
            setTimeout(function myTimer() {
                $(element).css(
                    'background-color', 'initial'
                );
            }, 100)
            $temp.val($(element).html()).select();
            document.execCommand("copy");

            $temp.remove();
        }

        /* var $viewtype = $('#viewtype');
        $viewtype.on('change', function() {
                var dataView_= $('#viewtype option:selected').attr('data-view');
            $("#label").val(dataView_);
        });    

        var $modeltoAdd = $('#modeltoAdd');
        $modeltoAdd.on('change', function() {
            var queryText='{"bool":{ "must":[{"term":{"_index":"'+$modeltoAdd.val()+'"}}]}}';
            $("#query").val(queryText);
            $("#filtermodel").val($modeltoAdd.val());
            $("#baseFilterSearch").val(queryText);
        });*/
        $('#btn-reset').on('click', function() {

            $('#iframeResult').empty();
            $('#renderiframeResult').empty();
        });


        $scope.generatePage = function(formData) {
            var formdata = this.formData;
            console.log(formData);
            var dymerJs;
            var scriptSRC;

            var viewtype = $("#viewtype").val();
            var dataView = $('#viewtype option:selected').attr('data-view');
            var dataSearch = $('#searchType option:selected').attr('data-search');

            //var baseUrlTemp="https://dym.dih4industry.eu";
            var baseUrlTemp = location.protocol + '//' + location.hostname + ':' + location.port;




            var baseHTML = '<!DOCTYPE html>\n' +
                '<html lang="en">' +
                '<head>\n' +
                '<meta charset="utf-8">\n' +
                '<meta content="width=device-width, initial-scale=1.0" name="viewport">\n' +
                '<title> </title>\n' +
                '<meta content="" name="description">' +
                '<meta content="" name="keywords">\n' +
                '<script>';
            baseHTML += 'var dviewtype="' + dataView + '"; \n';

            baseHTML += 'var d_uid=' + formData.u_id + '; \n';

            baseHTML += 'var d_gid=' + formData.g_id + '; \n';

            baseHTML += '</script> \n';






            var queryTemp = formData.query.toString();



            if (formData.viewtype == 0) {
                dymerJs = "dymer.viewer.js";

                scriptSRC = ' <script> var dTagFilter;\n' +
                    ' var dymerQueries =[' + queryTemp + '];\n' +
                    ' var dymerconf= {\n' +
                    '      notImport:[]\n' +
                    '   };\n' +
                    'var jsonConfig = {' +
                    ' \t \tquery: { \'query\': { \'query\' : dymerQueries[0]}},\n' +
                    ' \t \tendpoint: \'entity.search\',\n' +
                    ' \t \tviewtype: \'teaserlist\',\n' +
                    ' \t \ttarget: {\n' +
                    '    teaserlist: {\n' +
                    ' \t \t \t      id: "#cont-MyList",\n' +
                    ' \t \t \t      action: "html",\n' +
                    ' \t \t \t      reload:false\n' +
                    ' \t \t },\n' +
                    '  \t \tfullcontent: {\n' +
                    ' \t \t\t \t    id: "#cont-MyList",\n' +
                    '  \t \t\t \t  action: "html"\n' +
                    '\t \t}\n' +
                    '\t \t}\n' +
                    ' \t \t};\n' +

                    'function mainDymerView() {' +

                    ' var index = \'' + formData.modeltoAdd + '\';\n' +
                    'if(index!="")\n' +
                    'loadModelListToModal($(\'#cont-addentity\'), index);\n';

                if (formData.showSearch) {
                    scriptSRC += '  setTimeout(function() {\n' +
                        'dTagFilter = $(\'#dTagFilter\');\n' +
                        'dTagFilter.dymertagsinput({\n';
                    if (formData.baseFilterSearch) {
                        scriptSRC += ' indexterms: ' + formData.baseFilterSearch + ',';
                    }
                    scriptSRC += ' allowDuplicates: true,\n';
                    if (dataSearch == 'snippets') {
                        scriptSRC += 'freeInput: false,\n' +
                            'itemValue: \'id\', \n' +
                            'itemText: \'label\'\n';
                    } else {
                        scriptSRC += 'freeInput: true\n';
                    }
                    scriptSRC += '});\n';
                    scriptSRC += ' dTagFilter.on(\'beforeItemRemove\', function(event) {\n' +
                        '$(\'#d_entityfilter [filter-rel="\' + event.item.id + \'"\').prop("checked", false);\n' +
                        '}); \n';

                    if (!formData.loadSearch) {
                        //to cehck
                    }
                    scriptSRC += ' }, 3000);\n';

                    if (!formData.filtermodel && dataSearch == 'snippets') {
                        scriptSRC += ' var indexFilter ="' + formData.filtermodel + '";\n';
                        scriptSRC += '     loadFilterModel(indexFilter, dTagFilter);\n';
                    }
                }

                if (formData.loadSearch) {
                    scriptSRC += '  drawEntities(jsonConfig);\n';

                } else {
                    scriptSRC += '   loadEntitiesTemplate(jsonConfig);\n';

                }
                scriptSRC += '    checkbreadcrumb(null, $(\'#primodfil\'));}\n';
                scriptSRC += '</script>\n';

                baseHTML += scriptSRC;

            }



            baseHTML += ' </head> <body>\n' +
                '<div class="container-fluid" id="containerDymerViewer"> \n';





            if (formData.showSearch) {
                if (formData.showSearch == 2) {
                    var filterHTMLSnippet = '<div id="dymer_filtercontent">' +
                        '<div class="row">' +
                        '<div class="col-12 span12">' +
                        '<div class="input-group" id="adv-search">' +
                        '<input id="dTagFilter" type="text" data-role="tagsinput" placeholder="Search for snippets, click on caret" class="col-6 span6">' +
                        '	<div class="input-group-btn">' +
                        '<div class="btn-group" role="group">' +
                        '<div class="dropdown dropdown-lg">' +
                        '	<button type="button" id="dFilterClearAll" class="btn   " data-autostart="' + formdata.loadSearch + '"><i class="fas fa-eraser" onclick="clearDFilter()"></i></button>' +
                        '<button type="button" id="dFilterDropdown" class="btn btn-default dropdown-toggle" data-toggle="dropdown"><span class="caret"></span></button>' +
                        '<div id="d_entityfilter" class="dropdown-menu dropdown-menu-right" role="menu">' +
                        +formData.customFilterSearch +
                        '</div>' +
                        '</div>' +
                        '<button type="button" class="btn btn-primary" onclick="switchByFilter(dTagFilter, dviewtype)"><i class="fa fa-search" aria-hidden="true"></i></button>' +
                        '</div>' +
                        ' </div>' +
                        '</div>' +
                        '</div>' +
                        '</div> ' +
                        '<br>' +
                        '</div> ';


                    baseHTML += filterHTMLSnippet;
                }
                if (formData.showSearch == 1) {
                    var filterHTMLFreeInput = '<div id="dymer_filtercontent">' +
                        '<div class="row">' +
                        '<div class="col-12 span12">' +
                        ' <div class="input-group" id="adv-search">' +
                        '<input id="dTagFilter" type="text" data-role="tagsinput" placeholder="Search" class="col-6 span6 freetext" value="">' +
                        '<div class="input-group-btn">' +
                        ' <div class="btn-group" role="group">' +
                        ' <div class="dropdown dropdown-lg">' +
                        '  <button type="button" id="dFilterClearAll" class="btn freetext  " data-autostart="' + formdata.loadSearch + '"><i class="fas fa-eraser" onclick="clearDFilter()"></i></button> ' +
                        ' </div>' +
                        '<button type="button" class="btn btn-primary" onclick="switchByFilter(dTagFilter, dviewtype)"><i class="fa fa-search" aria-hidden="true"></i></button>' +
                        '</div>' +
                        ' </div>' +
                        ' </div>' +
                        ' </div>' +
                        '</div> ' +
                        '<br>' +
                        '</div> ' +
                        '<script>' +
                        ' $("#dTagFilter").on(\'keyup\', function (e) {' +
                        ' if (e.key === \'Enter\' || e.keyCode === 13) {' +
                        '   switchByFilter(dTagFilter, dviewtype);' +
                        '}' +
                        ' });' +
                        '</script>';

                    baseHTML += filterHTMLFreeInput;
                }
            } //show search if



            baseHTML += '<div class="">\n' +
                '<div class="col-12 span12 ">\n' +
                '<span id="primodfil "  class="btn  btn-listdymer " onclick= "drawEntities(jsonConfig);" >\n' +
                '<i class="fa fa-list" aria-hidden="true"></i> ' + formData.label + '</span> <span id="cont-addentity" class="pull-right"> </span>\n' +
                '</div>\n' +
                ' </div>\n';



            if (formData.showBread) {
                baseHTML += '<br><div id="dymer_breadcrumb"></div><br>\n';
            }
            baseHTML += '<div id="cont-MyList"></div>\n';
            baseHTML += '<script id="dymerurl" src="' + baseUrlTemp + '/public/cdn/js/' + dymerJs + '"></script>\n';
            baseHTML += '</div></body></html>\n';




            var baseContextPath = $rootScope.globals.contextpath;


            /* $http.post(baseContextPath + '/api/portalweb/dohtmlpage', { page: baseHTML, config:formData, dview:dataView })
                 .then(function successCallback(response) {
                         console.log("la mia risposta" );
                         console.log( response);
                         if(response.status==200){
                                 var nameRs= response.config.data.config.modeltoAdd+"_"+response.config.data.dview+'.html';
 
                                     $('#iframeResult').empty();
                                     $('#renderiframeResult').empty();
                                
                                     
                                     var jsonPretty = ' <iframe src="'+location.protocol+'//'+location.hostname+'/public/cdn/js/iframe/'+nameRs+'" width="100%" height="100%" frameborder="0" allowfullscreen webkitallowfullscreen msallowfullscreen></iframe>';                                    
                                     $('#iframeResult').html("<div class='querybcont'><div onclick=\"copyToClipboard('#iframeResult pre')\" class='btn btn-outline-success btn-sm'><i class='fa fa-clipboard'  ></i>  Copy to clipboard</div><span onclick=\"$('#iframeResult').empty()\" class='  text-secondary  pull-right cur-p'><i class='fa fa-window-close-o'  ></i> </span><pre></pre></div>").find('pre').text(jsonPretty);
                                     $('#iframeResult').append('  <a class="btn btn-sm btn-primary" target="_blank" href="'+location.protocol+'//'+location.hostname+'/public/cdn/js/iframe/'+nameRs+'"><i class="fa fa-code" aria-hidden="true"></i>  View HTML Page</a>');     
 
                         }
                     
                 }, function errorCallback(response) {
     
                     $('#iframeResult').html("<div class='querybcont has-error'>"+response.data+"</div>");
                 });
        */
            //     console.log("opnconf", opnconf);
            var dapaPost = formData;
            console.log(formData);
            // dapaPost = JSON.parse(dapaPost);
            $http({

                method: 'POST',
                url: baseContextPath + '/api/dservice/api/v1/configtool/addconfig',
                data: { data: dapaPost, dataview: dataView, datasearch: dataSearch, _index: formData.modeltoAdd }

            }).then(function successCallback(response) {

                    console.log(response.data);

                    response.data.data.forEach(el => {
                        console.log("ellllll", el);


                        //var jsonPretty = '  <script id="dymerurl" src="'+location.protocol+'//'+location.hostname+'/public/cdn/js/'+dymerJs+' " ></script>';                                    

                        var jsonPretty = ' <iframe src="' + location.protocol + '//' + location.hostname + '/iframetool/private/page/' + el._id + '" width="100%" height="100%" frameborder="0" allowfullscreen webkitallowfullscreen msallowfullscreen></iframe>';
                        jsonPretty += ' <iframe src="' + location.protocol + '//' + location.hostname + '/iframetool/public/page/' + el._id + '" width="100%" height="100%" frameborder="0" allowfullscreen webkitallowfullscreen msallowfullscreen></iframe>';

                        $('#iframeResult').html("<div class='querybcont'><div onclick=\"copyToClipboard('#iframeResult pre')\" class='btn btn-outline-success btn-sm'><i class='fa fa-clipboard'  ></i>  Copy to clipboard</div><span onclick=\"$('#iframeResult').empty()\" class='  text-secondary  pull-right cur-p'><i class='fa fa-window-close-o'  ></i> </span><pre></pre></div>").find('pre').text(jsonPretty);
                        $('#iframeResult').append('  <a class="btn btn-sm btn-warning" target="_blank" href="' + location.protocol + '//' + location.hostname + '/iframetool/private/page/' + el._id + ' "><i class="fa fa-code" aria-hidden="true"></i>  View HTML Private Page </a>');
                        $('#iframeResult').append('  <a class="btn btn-sm btn-primary" target="_blank" href="' + location.protocol + '//' + location.hostname + '/iframetool/public/page/' + el._id + ' "><i class="fa fa-code" aria-hidden="true"></i>  View HTML Public Page</a>');


                    });

                },
                function errorCallback(response) {
                    $('#iframeResult').html("<div class='querybcont has-error'>" + response.data + "</div>");
                    console.log("Error. while created user Try Again!", response);

                });


        }










    })
    .controller('confListController', function($scope, $http, $rootScope) {
        var baseContextPath = $rootScope.globals.contextpath;
        $http.get(baseContextPath + '/api/dservice/api/v1/configtool/configrules', {}).then(function(retE) {

            console.log("rere", retE);
            $scope.ListConfigRules = retE.data.data;
            //return $scope.listEntity = templ_data.arr;
        });

        $scope.removeConfigRule = function(index) {
            var el_id = $scope.ListConfigRules[index];

            //console.log("el_id", el_id);
            $http({

                method: 'DELETE',
                url: baseContextPath + '/api/dservice/api/v1/configtool/configrule/' + el_id._id

            }).then(function successCallback(response) {

                    console.log(response.data);
                    console.log("dDelet index success", response.data)
                    $scope.ListConfigRules.splice(index, 1);
                },
                function errorCallback(response) {

                    console.log("Error. while delete index Try Again!", response);

                });
        }

        $scope.generateConfigRule = function(index) {
            var el_id = $scope.ListConfigRules[index];

            console.log("el_id", el_id);

            var jsonPretty = ' <iframe src="' + location.protocol + '//' + location.hostname + '/iframetool/private/page/' + el_id._id + '" width="100%" height="100%" frameborder="0" allowfullscreen webkitallowfullscreen msallowfullscreen></iframe>';
            jsonPretty += ' <iframe src="' + location.protocol + '//' + location.hostname + '/iframetool/public/page/' + el_id._id + '" width="100%" height="100%" frameborder="0" allowfullscreen webkitallowfullscreen msallowfullscreen></iframe>';

            $('#iframeResult').html("<div class='querybcont'><div onclick=\"copyToClipboard('#iframeResult pre')\" class='btn btn-outline-success btn-sm'><i class='fa fa-clipboard'  ></i>  Copy to clipboard</div><span onclick=\"$('#iframeResult').empty()\" class='  text-secondary  pull-right cur-p'><i class='fa fa-window-close-o'  ></i> </span><pre></pre></div>").find('pre').text(jsonPretty);
            $('#iframeResult').append('  <a class="btn btn-sm btn-warning" target="_blank" href="' + location.protocol + '//' + location.hostname + '/iframetool/private/page/' + el_id._id + ' "><i class="fa fa-code" aria-hidden="true"></i>  View HTML Private Page </a>');
            $('#iframeResult').append('  <a class="btn btn-sm btn-primary" target="_blank" href="' + location.protocol + '//' + location.hostname + '/iframetool/public/page/' + el_id._id + ' "><i class="fa fa-code" aria-hidden="true"></i>  View HTML Public Page</a>');

        }





    });