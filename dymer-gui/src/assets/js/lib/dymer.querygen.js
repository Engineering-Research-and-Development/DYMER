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

function runQueryTest() {
    var result = $('#builder').queryBuilder('getRules');
    if ($.isEmptyObject(result)) {
        return;
    }
    tqueryElast = $('#builder').queryBuilder('getESBool');
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

    // Recupera la configurazione base dell'entità dall'oggetto window, impostata da Angular
    var actconf = window.dymer_base_entity_config;
    if (!actconf) {
        console.error("Dymer base entity config not found on window.dymer_base_entity_config. Using fallback.");
        actconf = { properties: { owner: { uid: 0, gid: 0 }, ipsource: "" } }; // Fallback
    }

    // Recupera l'endpoint dall'oggetto window se disponibile, altrimenti usa un fallback
    var searchUrl = window.vvveb_search_endpoint; 
                    
    // Esegui la ricerca tramite la funzione esposta da Angular
    window.dymer_searchEntities(tqueryElast).then(function(ret) {
        if (!ret.success) {
            console.error("Search failed:", ret);
            return;
        }
        // La funzione Angular `dymer_searchEntities` restituisce già l'array dei risultati.
        // Dobbiamo solo estrarre `_source` e aggiungere `_id` e `_index` a ogni elemento.
        const flattenedData = ret.data.map(item => ({
            ...item._source,
            _id: item._id,
            _index: item._index
        }));
        var templ_data = { arr: flattenedData, total: flattenedData.length };
        $('#dynamicDT').DataTable({
            data: templ_data.arr,
            // Aggiungiamo columnDefs per specificare il rendering HTML
            // per le colonne "Visibility" (indice 5) e "Your Role" (indice 7).
            "columnDefs": [
                { "targets": [5, 7], "render": function(data) { return data; } }
            ],
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

                    if (!data || !data.properties) {
                        return '';
                    }
                    var rt = checkStatus(data.properties, '{"allstatus": true,"style":"text" }');
                    return rt;
                },
                className: 'text-center'
            }, {
                title: "Visibility",
                data: null,
                render: function(data, type, row) {

                    if (!data || !data.properties) {
                        return '';
                    }
                    var iconHtml = checkVisibility(data.properties, '{}') || '<i class="fa fa-eye-slash icon-action" title="Not specified"></i>';
                    return iconHtml;
                },
                className: 'text-center'
            }, {
                title: "Uid/Gid",
                data: null,
                render: function(data, type, row) {

                    if (!data || !data.properties || !data.properties.owner) {
                        return 'N/A';
                    }
                    var rt = data.properties.owner.uid + "/" + data.properties.owner.gid;
                    return rt;
                },
                className: 'text-center'
            }, {
                title: "Your Role",
                data: null,
                render: function(data, type, row) {
                    if (!data || !data.properties) {
                        return '<i class="fa fa-users icon-action" title="Viewer" ></i>';
                    }
                    const perm = checkPermission(data);
                    var iconHtml = getrendRole(perm) || '<i class="fa fa-eye icon-action" title="Viewer"></i>';
                    return iconHtml;
                },
                className: 'text-center'
            }]
        });
    });
    d_uid = actconf.properties.owner.uid;
    d_gid = actconf.properties.owner.gid;
}

window.runQueryTest = runQueryTest;

function addBindQueryBuilder(qbconfig) {
    $('#builder').queryBuilder({
        filters: [{
                    id: '_index',
                    label: 'Entity',
                    type: 'string',
                    input: 'select',
                    values: Object.keys(qbconfig.filters["_index"]).reduce(function(acc, key) {
                        let newKey = key.split('/')[0];
                        acc[newKey] = newKey;
                        return acc;
                    }, {}),
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
    });
    
    $('#btn-get').on('click', function() {
        var result = $('#builder').queryBuilder('getRules');

        $('#queryResult').empty();
        $('#renderqueryResult').empty();
        if (!$.isEmptyObject(result)) {
            var tqueryElast = $('#builder').queryBuilder('getESBool');
            result = tqueryElast; // Passa direttamente l'oggetto bool
            var jsonPretty = JSON.stringify(result, null, "\t")
            $('#queryResult').html("<div class='querybcont'><div onclick=\"copyToClipboard('#queryResult pre')\" class='btn btn-outline-success btn-sm'><i class='fa fa-clipboard'  ></i>  Copy to clipboard</div><span onclick=\"$('#queryResult').empty()\" class='  text-secondary  pull-right cur-p'><i class='fa fa-window-close-o'  ></i> </span><pre></pre></div>").find('pre').text(jsonPretty);
        } else {
            console.log("invalid object :");
        }
    });

    $('#btn-reset').on('click', function() {
        $('#builder').queryBuilder('reset');
        $('#queryResult').empty();
        $('#renderqueryResult').empty();
    });

    $('#btn-set').on('click', function() {
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
    $('#builder').on('getRules.queryBuilder.filter', function(e) {});

}
$(document).ready(function() {});