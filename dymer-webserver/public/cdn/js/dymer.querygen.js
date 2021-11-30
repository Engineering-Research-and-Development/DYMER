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

function compactQuery(tqueryElast) {
    var rt = {
        query: {
            "query": tqueryElast

        }
    }
    return rt;
}

function runQueryTest() {
    var result = $('#builder').queryBuilder('getRules');


    if ($.isEmptyObject(result)) {
        return;
    }

    tqueryElast = $('#builder').queryBuilder('getESBool');
    tquery = compactQuery(tqueryElast);
    var tablerend = '<table id="example" class="display" style="width:100%">' +
        '<thead>' +
        '<tr>' +
        '<th>Title</th>' +
        '<th>Created</th>' +
        '<th>Updated</th>' +
        '<th>Status</th>' +
        '<th>Visibility/th>' +
        '<th>Your Role</th>' +
        '</tr>' +
        '</thead> ' +
        '</table>';

    tablerend = '<table id="dynamicDT" class="display" style="width:100%"></table>';
    $('#renderqueryResult #contres').empty().html(tablerend);

    var actconf = getbaseEntityConfig();
    d_uid = $('#tempuid').val();
    d_gid = $('#tempgid').val();
    var ret = actionPostMultipartForm('entity.search', undefined, tquery, undefined, undefined, undefined, false);
    console.log("ricarico e manage template", ret.data);
    var templ_data = flatEsArray(ret.data);
    //    console.log(templ_data.arr);

    $('#dynamicDT').DataTable({
        data: templ_data.arr,
        "columns": [{
            title: "Title",
            data: "title"
        }, {
            title: "Type",
            data: "_index",
            render: function(data, type, row) {
                if (data == undefined)
                    return data;
                var rt = data.split("T");
                return rt[0];
            },
            className: 'text-center'
        }, {
            title: "Created",
            data: "properties.created",
            render: function(data, type, row) {
                if (data == undefined)
                    return data;
                var rt = data.split("T");
                return rt[0];
            },
            className: 'text-center'
        }, {
            title: "Updated",
            data: "properties.changed",
            render: function(data, type, row) {
                var rt = data.split("T");
                return rt[0];
            },
            className: 'text-center'
        }, {
            title: "Status",
            data: null,
            render: function(data, type, row) {

                var rt = checkSatus(data, '{"allstatus": true,"style":"text" }');
                return rt;
            },
            className: 'text-center'
        }, {
            title: "Visibility",
            data: null,
            render: function(data, type, row) {

                var rt = checkVisibility(data, '{"allstatus": true  }');
                return rt;
            },
            className: 'text-center'
        }, {
            title: "Uid/Gid",
            data: null,
            render: function(data, type, row) {

                var rt = data.properties.owner.uid + "/" + data.properties.owner.gid;
                return rt;
            },
            className: 'text-center'
        }, {
            title: "Your Role",
            data: null,
            render: function(data, type, row) {
                var perm = checkPermission(data);
                var rt = getrendRole(perm);
                if (rt == '')
                    rt = '<i class="fa fa-users icon-action" title="Viewer" ></i>';

                return rt;
            },
            className: 'text-center'
        }]
    });

    //  var stone = Handlebars.compile(mytemplate)(templ_data.arr);
    //   $('#renderqueryResult #contres').html(stone);
    d_uid = actconf.properties.owner.uid;
    d_gid = actconf.properties.owner.gid;
}
/*{
                        'product': 'Prodotto',
                        'project': 'Project',
                        'geopoint': 'Web Content Geo Point',
                        'multir': 'MultiRelation'
                    } */
function addBindQueryBuilder(qbconfig) {
    $('#builder').queryBuilder({
        //  plugins: ['not-group'],   //  operators: ['equal', 'not_equal', 'in']
        filters: [{
                    id: '_index',
                    label: 'Entity',
                    type: 'string',
                    input: 'select',

                    values: qbconfig.filers["_index"],
                    operators: ['equal', 'not_equal', 'in']
                },
                {
                    id: 'properties.visibility',
                    label: 'Visibility',
                    type: 'string',
                    input: 'select',
                    values: {
                        '0': 'Public',
                        '1': 'Private',
                        '2': 'Restricted'
                    },
                    operators: ['equal', 'not_equal']
                },
                {
                    id: 'properties.status',
                    label: 'Status',
                    type: 'string',
                    input: 'select',
                    values: {
                        '1': 'Published',
                        '2': 'Not Published',
                        '3': 'Draft'
                    },
                    operators: ['equal', 'not_equal']
                },
                {
                    id: 'properties.owner.uid',
                    label: 'Uid',
                    type: 'string',
                    operators: ['equal', 'not_equal']
                },
                {
                    id: 'properties.owner.gid',
                    label: 'Gid',
                    type: 'string',
                    operators: ['equal', 'not_equal']
                }
            ]
            /* filters: [{
                     id: 'name',
                     label: 'Name',
                     type: 'string'
                 }, {
                     id: 'category',
                     label: 'Category',
                     type: 'integer',
                     input: 'select',
                     values: {
                         1: 'Books',
                         2: 'Movies',
                         3: 'Music',
                         4: 'Tools',
                         5: 'Goodies',
                         6: 'Clothes'
                     },
                     operators: ['equal', 'not_equal', 'in', 'not_in', 'is_null', 'is_not_null']
                 }, {
                     id: 'in_stock',
                     label: 'In stock',
                     type: 'integer',
                     input: 'radio',
                     values: {
                         1: 'Yes',
                         0: 'No'
                     },
                     operators: ['equal']
                 }, {
                     id: 'price',
                     label: 'Price',
                     type: 'double',
                     validation: {
                         min: 0,
                         step: 0.01
                     }
                 }, {
                     id: 'id',
                     label: 'Identifier',
                     type: 'string',
                     placeholder: '____-____-____',
                     operators: ['equal', 'not_equal'],
                     validation: {
                         format: /^.{4}-.{4}-.{4}$/
                     }
                 }] */ //,
            //   rules: rules_basic
    });
    /****************************************************************
                    Triggers and Changers QueryBuilder
*****************************************************************/

    $('#btn-get').on('click', function() {
        var result = $('#builder').queryBuilder('getRules');

        $('#queryResult').empty();
        $('#renderqueryResult').empty();
        if (!$.isEmptyObject(result)) {
            result = $('#builder').queryBuilder('getESBool');
            //result = compactQuery(result);
            var jsonPretty = JSON.stringify(result, null, "\t")
            $('#queryResult').html("<div class='querybcont'><div onclick=\"copyToClipboard('#queryResult pre')\" class='btn btn-outline-success btn-sm'><i class='fa fa-clipboard'  ></i>  Copy to clipboard</div><span onclick=\"$('#queryResult').empty()\" class='  text-secondary  pull-right cur-p'><i class='fa fa-window-close-o'  ></i> </span><pre></pre></div>").find('pre').text(jsonPretty);
            //  $('#queryResult').text(JSON.stringify(result, null, "\t"));
        } else {
            console.log("invalid object :");
        }
        //  console.log(result);
    });

    $('#btn-reset').on('click', function() {
        $('#builder').queryBuilder('reset');
        $('#queryResult').empty();
        $('#renderqueryResult').empty();
    });

    $('#btn-set').on('click', function() {
        //$('#builder').queryBuilder('setRules', rules_basic);
        var result = $('#builder').queryBuilder('getRules');
        if (!$.isEmptyObject(result)) {
            rules_basic = result;
        }
    });

    $('#btn-test').on('click', function() {

        $('#queryResult').empty();
        $('#renderqueryResult').empty();
        var htmlusertest = '<div class="querybcont">' +
            "<span onclick=\"$('#renderqueryResult').empty()\" class='  text-secondary  pull-right cur-p'><i class='fa fa-window-close-o'  ></i> </span>" +

            '<div class="row runcont">' +
            ' <div class="form-group field-trial_title col-5">' +
            '<label class="kms-title-label">User Id</label>' +
            '<input type="text" class="form-control col-12 span12"  id="tempuid">' +
            '</div>' +
            ' <div class="form-group field-trial_title col-5">' +
            '<label class="kms-title-label">Goup Id</label>' +
            '<input type="text" class="form-control col-12 span12"  id="tempgid">' +

            '</div>' +
            ' <div class="form-group field-trial_title col-2 text-right">' +
            '<span class="btn btn-success  " onclick="runQueryTest()"><i class="fa fa-play" aria-hidden="true"></i> RUN</span>' +
            '</div>' +
            '</div>' +
            '<div   id="contres">' +
            '</div>' +
            '</div>';
        $('#renderqueryResult').html(htmlusertest);


    });
    //When rules changed :
    $('#builder').on('getRules.queryBuilder.filter', function(e) {
        //$log.info(e.value);
    });

}
$(document).ready(function() {
    /* var rules_basic = {
         condition: 'AND',
         rules: [{
             id: 'price',
             operator: 'less',
             value: 10.25
         }, {
             condition: 'OR',
             rules: [{
                 id: 'category',
                 operator: 'equal',
                 value: 2
             }, {
                 id: 'category',
                 operator: 'equal',
                 value: 1
             }]
         }]
     };
     rules_basic = {};*/

});