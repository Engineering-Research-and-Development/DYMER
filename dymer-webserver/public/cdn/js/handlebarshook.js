Handlebars.registerHelper('setVariable', function(varName, varValue, options) {
    if (!options.data.root) {
        options.data.root = {};
    }
    options.data.root[varName] = varValue;
});
Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});
Handlebars.registerHelper('loadfile', function(eid, fid, options) {
    var ret = (kmsconfig.cdn).replace('public/cdn/', "") + "api/entities/api/v1/entity/contentfile/" + eid + "/" + fid;
    var tk = localStorage.getItem('DYMAT');
    if (tk != null)
        return ret += "?tkdymat=" + tk;
    tk = localStorage.getItem('DYM');
    if (tk != null)
        return ret += "?tkdym=" + tk;
});
Handlebars.registerHelper('formatDate', function(val, format) {
    return dymerFormatDate(val, format);
    /* var date = new Date(val);
     console.log(date.toString());
     if (!format)
         format = "MM/dd/yyyy";
     console.log('format', format);
     var month = date.getMonth() + 1;
     var year = date.getFullYear();

     format = format.replace("MM", month.toString().padL(2, "0"));

     if (format.indexOf("yyyy") > -1)
         format = format.replace("yyyy", year.toString());
     else if (format.indexOf("yy") > -1)
         format = format.replace("yy", year.toString().substr(2, 2));

     format = format.replace("dd", date.getDate().toString().padL(2, "0"));

     var hours = date.getHours();
     if (format.indexOf("t") > -1) {
         if (hours > 11)
             format = format.replace("t", "pm")
         else
             format = format.replace("t", "am")
     }
     if (format.indexOf("HH") > -1)
         format = format.replace("HH", hours.toString().padL(2, "0"));
     if (format.indexOf("hh") > -1) {
         if (hours > 12) hours - 12;
         if (hours == 0) hours = 12;
         format = format.replace("hh", hours.toString().padL(2, "0"));
     }
     if (format.indexOf("mm") > -1)
         format = format.replace("mm", date.getMinutes().toString().padL(2, "0"));
     if (format.indexOf("ss") > -1)
         format = format.replace("ss", date.getSeconds().toString().padL(2, "0"));
     return format;*/

});
Handlebars.registerHelper('DymerPaginationPageIndex', function(len, index, options) {
    var indexPage = -1;
    var maxelements = options.data.root.d_pagination_size;
    for (var i = 0; i < len; i++) {
        if (getMod(i, maxelements, 0)) {
            indexPage++;
        }
        if (i == index) {
            return (indexPage + 1);
        }
    }
    return (indexPage + 1);
});
Handlebars.registerHelper('DymerPagination', function(arr, options) {
    let translation = {
        first: "First",
        prev: "Prevous",
        next: "Next",
        last: "Last"
    };
    var maxelements = options.data.root.d_pagination_size;
    let d_pagination_label = options.data.root.d_pagination_label;
    if (d_pagination_label != undefined) {
        let d_pagination_labels = d_pagination_label.split("|");
        translation = {
            first: d_pagination_labels[0],
            prev: d_pagination_labels[1],
            next: d_pagination_labels[2],
            last: d_pagination_labels[3]
        }
    }
    var context;
    context = {
        startFromFirstPage: false,
        pages: [],
        endAtLastPage: false,
    };
    var indexPage = 0;
    for (var i = 0; i < arr.length; i++) {
        if (!(i % maxelements)) {
            indexPage++;
            context.pages.push({
                page: indexPage,
                isCurrent: indexPage === d_curpage,
            });
        }
    }
    if (indexPage < 2)
        return "";
    var pagin = '<ul class="pagination" id="dymerpaginator">';
    if (translation.first.length)
        pagin += '<li class="page-item "   onclick="dymerPaginatorChangePage(1)"><a class="page-link" href="#">' + translation.first + '</a></li>';
    if (translation.prev.length)
        pagin += '<li class="page-item " id="dprevpg" onclick="dymerPaginatorNextPrev(-1)"><a class="page-link" href="#">' + translation.prev + '</a></li>';
    let lngpages = context.pages.length;
    for (var i = 0; i < lngpages; i++) {
        if (context.pages[i].isCurrent)
            pagin += '<li class="page-item active" onclick="dymerPaginatorChangePage(' + (i + 1) + ')" d-pageref="' + (i + 1) + '"><a class="page-link" href="#">' + (i + 1) + '</a></li>';
        else
            pagin += '<li class="page-item"  onclick="dymerPaginatorChangePage(' + (i + 1) + ')" d-pageref="' + (i + 1) + '"><a class="page-link" href="#">' + (i + 1) + '</a></li>';
    }
    if (translation.next.length)
        pagin += '<li class="page-item " id="dnextpg" onclick="dymerPaginatorNextPrev(+1)"><a class="page-link" href="#">' + translation.next + '</a></li>';
    if (translation.last.length)
        pagin += '<li class="page-item "  onclick="dymerPaginatorChangePage(' + lngpages + ')"><a class="page-link" href="#">' + translation.last + '</a></li>';
    pagin += '</ul>';

    return pagin;
});
Handlebars.registerHelper('ifIsNthItem', function(options) {
    var index = options.data.index + 1,
        nth = options.hash.nth;

    if (index % nth === 0)
        return options.fn(this);
    else
        return options.inverse(this);
});
Handlebars.registerHelper('DymerViewTags', function(obj, hookCheckSatusconf, obj2) {
    var ret = '';
    // console.log('DymerViewTags', obj);
    if (obj != undefined) {
        obj.forEach(element => {
            var myqr = JSON.stringify({
                "match": {
                    "hashtags": element
                }
            });
            // ret += '<span onclick="switchQuery(\'{ \"match\": {\"_index\": \"trial\" }}\',$(this))"> #' + element + '</span>';
            if (element.length > 0)
                ret += "<span onclick='switchQuery(" + myqr + ",$(this))' class='dwtag'> #" + element + "</span>";
        });
    }
    return ret;
});
Handlebars.registerHelper('EntityStatus', function(obj, hookCheckSatusconf, obj2) {
    var ret = '';
    var args = [],
        options = arguments[arguments.length - 1];
    if (hookCheckSatusconf != undefined) {
        if (hookCheckSatusconf.name == "EntityStatus")
            hookCheckSatusconf = undefined;
    }
    // console.log('obj', obj);
    //   console.log('obj1', hookCheckSatusconf);
    //   console.log('obj2', obj2);
    //   console.log('arguments', arguments, arguments.length);
    //    console.log('options', options);
    /*      console.log('actualTemplateType', actualTemplateType);*/
    var perm = checkPermission(obj);
    var status = checkSatus(obj, hookCheckSatusconf);
    var visibility = checkVisibility(obj);
    var getrole = getrendRole(perm);
    var editBtn = '';
    var owner = getrole;

    //  console.log('options perm', perm);

    if (perm.delete || perm.edit) {
        if (actualTemplateType == 'fullcontent') {
            editBtn += '<div class="col-12 text-right" >';
            if (perm.delete)
                editBtn += '<span class="text-danger  " style="cursor:pointer" onclick="deleteEntity(\'' + obj._id + '\', \'' + obj._index + '\'  )"><i class="fa fa-trash" aria-hidden="true"></i> Delete </span>   ';
            if (perm.edit) {
                // editBtn += '&nbsp;&nbsp;<span class="text-warning  " style="cursor:pointer" onclick="cloneEntity(\'' + obj._id + '\')"><i class="fa fa-clone" aria-hidden="true"></i> Clone </span> ';
                editBtn += '&nbsp;&nbsp;<span class="text-info  " style="cursor:pointer" onclick="editEntity(\'' + obj._id + '\')"><i class="fa fa-pencil" aria-hidden="true"></i> Edit </span> ';
            }
            editBtn += '</div>';

        }

    }

    /*if (perm.view) {
        if (perm.isowner)
            owner = '<i class="fa fa-user icon-action" title="Owner" ></i>';
        else
            owner = '<i class="fa fa-user-o icon-action" title="co-editor"  ></i>';
    }*/
    if (owner != '' || visibility != '')
        owner = '<div class="col-12 text-right">' + owner + "&nbsp;" + visibility + '</div>';
    ret = status + owner + editBtn;

    /*
        if (checkPermission(obj)) {
            var status = checkSatus(obj);
            var visibility = checkVisibility(obj);
            var editBtn = '';
            var owner = '';
            if (actualTemplateType == 'fullcontent' && (perm.delete || perm.edit)) {
                editBtn += '<div class="col-12 text-right" >';
                if (perm.delete)
                    editBtn += '<span class="text-danger  " style="cursor:pointer" onclick="deleteEntity(\'' + obj._id + '\')"><i class="fa fa-trash" aria-hidden="true"></i> Delete </span>   ';
                if (perm.edit)
                    editBtn += '<span class="text-info  " style="cursor:pointer" onclick="editEntity(\'' + obj._id + '\')"><i class="fa fa-pencil" aria-hidden="true"></i> Edit </span> ';
                editBtn += '</<i>';

            } else
                owner = '<div class="col-12 text-right"><i class="fa fa-user-o" aria-hidden="true" style="fcolor:#0c5460"> Owner</i></div>';
            ret = visibility + status + owner + editBtn;
        }*/
    return ret;
});
Handlebars.registerHelper('cdnpath', function(block) {
    return (kmsconfig.cdn).replace('public/cdn/', "");; //just return global variable value
});

Handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context);
});

//plugin per abilitare e disabilitare un intero form,utilile per le chiamate ajax
(function($) {
    $.fn.extend({
        multidisable: function(options) {
            //Settings list and the default values
            var defaults = {
                disable: true,
                customdisable: 'ajax-multidisabled',
                addelement: {},
                disablemouse: false
            };
            var opts = $.extend(defaults, options);
            return this.each(function() {
                var o = opts;
                // console.log("disa", this, $(this));
                if ($(this).length) {
                    $($(this).find('input,select,button,textarea,.btn,a')).each(function() {
                        // console.log("disa", $(this));
                        if (o.disable) {
                            if ($(this).attr('disabled') !== 'disabled') {
                                $(this).addClass(o.customdisable)
                                    .attr('disabled', 'disabled');
                            }
                        } else {
                            // enable elements
                            if ($(this).hasClass(o.customdisable)) {

                                $(this).removeClass(o.customdisable)
                                    .removeAttr('disabled');
                            }
                        }
                    });
                }
            });
        }
    });

})(jQuery);