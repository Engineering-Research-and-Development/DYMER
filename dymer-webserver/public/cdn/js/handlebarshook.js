Handlebars.registerHelper('setVariable', function(varName, varValue, options) {
    if (!options.data.root) {
        options.data.root = {};
    }
    options.data.root[varName] = varValue;
});
Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});
Handlebars.registerHelper('ifNotEquals', function(arg1, arg2, options) {
    return (arg1 != arg2) ? options.fn(this) : options.inverse(this);
});
Handlebars.registerHelper('loadfile', function(eid, fid, options) {
    if(fid==undefined)
    return "#";
    var ret = (kmsconfig.cdn).replace('public/cdn/', "") + "api/entities/api/v1/entity/contentfile/" + eid + "/" + fid;
    var tk = localStorage.getItem('DYMAT');
    var tk_extra = localStorage.getItem('DYM_EXTRA');
    //bugfix docs if (tk != null)
    //    return ret += "?tkdymat=" + tk + "&tkextra=" + tk_extra;
    tk = localStorage.getItem('DYM');
    if (tk != null)
        return ret += "?tkdym=" + tk + "&tkextra=" + tk_extra;
    return ret;
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

Handlebars.registerHelper('isEven', function(index) {
    return index % 2 === 0;
});

Handlebars.registerHelper('colorByIndex', function(index) {
    const colors = ['primary', 'success', 'info', 'warning', 'danger'];
    // Usa l'operatore modulo per ricominciare da capo se l'indice supera la lunghezza dell'array
    return colors[index % colors.length];
});

Handlebars.registerHelper('and', function() {
    return Array.prototype.slice.call(arguments, 0, -1).every(Boolean);
});

Handlebars.registerHelper('truncate', function(str, len) {
    if (str.length > len && str.length > 0) {
        return str.substring(0, len) + '...';
    }
    return str;
});

Handlebars.registerHelper('limit', function(arr, limit) {
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, limit);
});



Handlebars.registerHelper('toCSV', function (context, options) {

  let data = [];

  if (context?.actualitem) {
    data = context.actualitem;
  } else if (context?.kmsrenderdetail) {
    data = context.kmsrenderdetail;
  } else if (context?.kmsdataset) {
    data = context.kmsdataset;
  } else if (Array.isArray(context)) {
    data = context;
  } else if (context) {
    data = [context];
  }

  if (!Array.isArray(data)) data = [data];
  if (data.length === 0) return "";

  const exclude = (options.hash.exclude || "")
    .split(",")
    .map(f => f.trim())
    .filter(Boolean);

  const filename = options.hash.filename || "export.csv";
  const download = options.hash.download === true;

  const flattenObject = (obj, prefix = "", res = {}) => {
    for (let key in obj) {
      if (!obj.hasOwnProperty(key)) continue;

      const newKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        flattenObject(value, newKey, res);
      } else {
        res[newKey] = value;
      }
    }
    return res;
  };

  const flatData = data.map(item => flattenObject(item));

  const stripHtml = (html) => {
    if (!html) return "";
    return html
      .replace(/<[^>]*>?/gm, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const escapeCSV = (value) => {
    if (value === null || value === undefined) return "";

    let v = value;

    if (typeof v === "object") {
      v = Array.isArray(v) ? v.join(" | ") : JSON.stringify(v);
    }

    v = stripHtml(String(v));
    v = v.replace(/"/g, '""');

    return `"${v}"`;
  };

  const headersSet = new Set();

  flatData.forEach(item => {
    Object.keys(item).forEach(k => {
      if (!exclude.includes(k)) {
        headersSet.add(k);
      }
    });
  });

  const headers = Array.from(headersSet);

  let csv = headers.join(",") + "\n";

  // =========================
  // 7. righe
  // =========================
  flatData.forEach(item => {
    const row = headers.map(key => escapeCSV(item[key]));
    csv += row.join(",") + "\n";
  });

  // =========================
  // 8. download browser
  // =========================
  if (download && typeof window !== "undefined") {
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return new Handlebars.SafeString(csv);
});


Handlebars.registerHelper('DymerPagination', function(arr, options) {
    let translation = {
        first: "First",
        prev: "Previous",
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

const serviceCardTemplate = `
  <div class="card shadow-sm">
    <div class="card-body">
      <h5 class="card-title">{{title}}</h5>
      <span class="badge bg-primary">{{category}}</span>
    </div>
     <span class="pull-right text-info " style="padding-top: 10px;cursor:pointer" title="{{name}}" onclick="kmsrenderdetail('{{_id}}')"><i class="fa fa-info-circle" aria-hidden="true"></i></span>
  </div>
`;


Handlebars.registerPartial('serviceCard', serviceCardTemplate);


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


Handlebars.registerHelper('EntityStatusPdf', function(obj, hookCheckSatusconf, obj2) {
    var ret = '';
    var args = [],
        options = arguments[arguments.length - 1];
    if (hookCheckSatusconf != undefined) {
        if (hookCheckSatusconf.name == "EntityStatusPdf")
            hookCheckSatusconf = undefined;
    }
     
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
                editBtn += '<span id="deleteBtn" class="text-danger  " style="cursor:pointer" onclick="deleteEntity(\'' + obj._id + '\', \'' + obj._index + '\'  )"><i class="fa fa-trash" aria-hidden="true"></i> Delete </span>   ';
            if (perm.edit) {
                  editBtn += '&nbsp;&nbsp;<span id="editBtn" class="text-info  " style="cursor:pointer" onclick="editEntity(\'' + obj._id + '\')"><i class="fa fa-pencil" aria-hidden="true"></i> Edit </span>   ';
            }
            editBtn += '&nbsp;&nbsp;<span id="exportBtn" class="text-warning  " style="cursor:pointer" onclick="exportPDFEntity(\'' + obj._id + '\',\'' + obj.title + '\')"> <b> <i class="fa fa-download" aria-hidden="true"></i></b> <span> PDF Export </span> </span>';
            editBtn += '</div>';

        }

    }

    
    if (owner != '' || visibility != '')
        owner = '<div id="entityStatus" class="col-12 text-right">' + owner + "&nbsp;" + visibility + '</div>';
    ret = status + owner + editBtn;

    
    return ret;
});


Handlebars.registerHelper('EntityView', function(obj, hookCheckSatusconf, obj2) {
    var ret = '';
    var count = (obj.viewsCounter===undefined) ? 0 : obj.viewsCounter;

    ret = '<a class="viewCount" aria-hidden="true" href="#" id="viewCount'+obj._id+'"><i class="fa fa-eye" aria-hidden="true"></i> '+count+'</a>';

    if (hookCheckSatusconf != undefined) {
        if (hookCheckSatusconf.name == "EntityView"){
            hookCheckSatusconf = undefined;
        }else{
            /*Se il secondo parametro dell'helper è TRUE allora attivo il controllo sul ruolo
              per fare in modo che solo l'ADMIN possa vedere il contatore*/
            if (hookCheckSatusconf){
                var perm = checkPermission(obj);
                if (perm.isadmin){
                    return ret;
                }else{
                    return '';
                }
            }else{
                return ret;
            }
        }    
    }
    return ret;

});

Handlebars.registerHelper('EntityLike', function (obj, hookCheckSatusconf,iconup,icondown) {
    let ret = ''
    let likes=[];

    if(obj.likes != undefined) {
          likes = JSON.parse(obj.likes);
    }
    if(iconup == undefined){
        iconup="fa-heart";
    }
    if(icondown == undefined){
        icondown="fa-heart-o";
    }
    let nLikes = likes.length
    let likeBtn = '';
    let userDYM64 = localStorage.getItem('DYM')
    //let userDYM = JSON.parse(atob(userDYM64))

    let likesList = "";
    if(likes != undefined) {
        likes.forEach(function (user) {
            likesList += user.split("@")[0] + '<br>';
        });
    }
	//VL 0 day start
	let email = localStorage.getItem('d_uid')
    let roles = [];										 
    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    })
	
    if (likes.includes(email)) {
        
        likeBtn += '<a href="#" class="likeCount" id="viewlike'+obj._id+'"> <span id="likeBtn-' + obj._id + '" class="fa '+iconup+' active" style="cursor:pointer" data-toggle="tooltip" data-placement="bottom" data-html="true" title="' + likesList + '" ' + ' onclick="like(\'' + obj._id + '\',\'' + obj.title.replace(/['"]/g, '') + '\', \'' + obj._index + '\', \'' + email + '\', \'' + roles + '\', \'' + iconup + '\', \'' + icondown + '\')"> ' + nLikes + ' </a>'
    } else {
        likeBtn += '<a href="#" class="likeCount" id="viewlike'+obj._id+'"> <span id="likeBtn-' + obj._id + '" class="fa '+icondown+'" style="cursor:pointer" data-toggle="tooltip" data-placement="bottom" data-html="true" title="' + likesList + '" ' + ' onclick="like(\'' + obj._id + '\',\'' + obj.title.replace(/['"]/g, '') + '\', \'' + obj._index + '\', \'' + email + '\', \'' + roles + '\', \'' + iconup + '\',\'' + icondown + '\')"> ' + nLikes + ' </a>'
    }
	//VL 0 day end
    ret = likeBtn;
    return ret
});

Handlebars.registerHelper('EntityStatusTwo', function(obj, hookCheckSatusconf, obj2) {
    var ret = '';
    var args = [],
        options = arguments[arguments.length - 1];
    if (hookCheckSatusconf != undefined) {
        if (hookCheckSatusconf.name == "EntityStatusTwo")
            hookCheckSatusconf = undefined;
    }

    var perm = checkPermission(obj);
    var status = checkSatus(obj, hookCheckSatusconf);
    var visibility = checkVisibility(obj);
    var getrole = getrendRole(perm);
    var editBtn = '';
    var owner = getrole;

    //  console.log('options perm', perm);

    if (perm.delete || perm.edit) {
        if (actualTemplateType == 'fullcontent') {
            //editBtn += '<div class="col-12 text-right" >';
            // editBtn +='';
            if (perm.delete)
                editBtn += '<a href="#" class="actionDymerItem fixedDelete" style="cursor:pointer" onclick="deleteEntity(\'' + obj._id + '\', \'' + obj._index + '\'  )"><b><i class="fa fa-trash" aria-hidden="true"></i></b> <span>Delete </span></a> ';
            if (perm.edit) {
                editBtn += '<a href="#" class="actionDymerItem fixedEdit" style="cursor:pointer" onclick="editEntity(\'' + obj._id + '\')"> <b> <i class="fa fa-pencil" aria-hidden="true"></i></b> <span>Edit </span> </a>';
            }
            //editBtn += '<span id="closeButtonItem" style="cursor:pointer" class="closeButton  btn-listdymer " onclick="drawEntities(jsonConfig)"> <i class="fa fa-window-close-o" aria-hidden="true"></i> Close </span>';

        }

    }


    if (perm.view) {
        if (actualTemplateType == 'fullcontent') {
            editBtn += '<a href="#" class="actionDymerItem fixedClose" style="cursor:pointer" id="closeButtonItem" onclick="showDatasetContainer();drawEntities(jsonConfig);" > <b><i class="fa fa-window-close-o" aria-hidden="true"></i> </b>  <span> Close </span></a>';
        }
    }

    var closeBtn = '<span id="closeButtonItem" class="actionDymerItem  btn-listdymer " onclick="drawEntities(jsonConfig)"> <i class="fa fa-times-circle" aria-hidden="true"></i> Close </span></a>';

    if (owner != '' || visibility != '')
        owner = '<a href="#" class="fixOwner"><b>' + owner + "&nbsp;" + visibility + '</b><span>Ownership</span></a>';
    ret = '<div class=" text-right dotItems">' + status + owner + editBtn + '</div>';

    return ret;
});


Handlebars.registerHelper('cdnpath', function(block) {
    return (kmsconfig.cdn).replace('public/cdn/', "");; //just return global variable value
});

Handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context);
});



/**
 * Helper Handlebars per generare il DataSpace Badge
 * Utilizzo nel template: {{{ds_badge this.interoperability}}}
 */
Handlebars.registerHelper('ds_badge', function(interoperability) {
// || !interoperability.enabled


    if (!interoperability || !interoperability.enabled) {
        return '';
    }

    const { dcat_type, ids_type, publisher, mappings } = interoperability;
    const license = mappings?.dcat?.['dct:license'] || 'Licenza non specificata';
    
    const containerStyle = "border: 1px solid #0056b3; background-color: #f0f7ff; border-radius: 6px; padding: 12px; margin: 10px 0; display: flex; align-items: center; gap: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);";
    const iconCircleStyle = "min-width: 40px; height: 40px; background: #0056b3; color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: 800; font-size: 14px;";
    
   
    let html = `
        <div class="dymer-ds-badge" style="${containerStyle}">
            <div style="${iconCircleStyle}">DS</div>
            <div style="flex-grow: 1;">
                <div style="font-weight: 700; color: #0056b3; margin-bottom: 3px; display: flex; align-items: center; gap: 5px;">
                    <span style="font-size: 1.1em;">🛡️</span> Sovranità Dati Attiva
                </div>
                <div style="font-size: 0.85rem; color: #333; line-height: 1.4;">
                    <strong>Editore:</strong> ${publisher || 'N/D'} | 
                    <strong>Licenza:</strong> <span style="color: #0056b3; font-weight: 600;">${license}</span>
                </div>
                <div style="margin-top: 6px; display: flex; gap: 5px;">
                    <span style="background: #e1ecf4; color: #39739d; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; border: 1px solid #7aa7c7;">IDSA COMPLIANT</span>
                    <span style="background: #e1f4e5; color: #2e7d32; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; border: 1px solid #81c784;">GAIA-X READY</span>
                </div>
            </div>
        </div>
    `;
    return new Handlebars.SafeString(html);
});

/**
 * Helper Handlebars per lo Scudo DataSpace con varianti di qualità
 * Utilizzo: {{{ds_badge_short interoperability}}}
 */
/**
 * Helper Handlebars per lo Scudo DataSpace con qualità automatica
 * Oro: se sono presenti sia mapping DCAT che IDS
 * Blu: se è presente solo uno dei due (o nessuno)
 */
Handlebars.registerHelper('ds_badge_short', function(interoperability) {
    if (!interoperability || !interoperability.enabled) {
        return '';
    }

    // --- LOGICA DI QUALITÀ AUTOMATICA ---
    // const hasDcat = interoperability.profiles?.dcat?.mappings && Object.keys(interoperability.profiles.dcat.mappings).length > 0;
    // const hasIds = interoperability.profiles?.ids?.mappings && Object.keys(interoperability.profiles.ids.mappings).length > 0;
    const dcatMappings = interoperability.mappings?.dcat || {};
    const idsMappings = interoperability.mappings?.ids || {};

    const hasDcat = Object.keys(dcatMappings).length > 0;
    const hasIds = Object.keys(idsMappings).length > 0;

    // Qualità 'high' solo se entrambi gli standard sono mappati
    const quality = (hasDcat && hasIds) ? 'high' : 'standard';
    
    const publisher = interoperability.metadata?.publisher || 'Certificato DataSpace';
    
    // Configurazione Colori Muted
    const colors = {
        high: {
            bg: 'linear-gradient(135deg, #bf953f, #e2c07d, #b38728)', // Oro satinato
            border: '#8a6d3b',
            text: '#3a2d15',
            label: 'FULL COMPLIANT'
        },
        standard: {
            bg: 'linear-gradient(135deg, #2c3e50, #4ca1af)', // Blu-Grigio professionale
            border: '#1c2833',
            text: '#ffffff',
            label: 'STANDARD'
        }
    };

    const config = colors[quality];

    const shieldStyle = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 34px;
        background: ${config.bg};
        color: ${config.text};
        clip-path: polygon(0% 0%, 100% 0%, 100% 70%, 50% 100%, 0% 70%);
        font-family: 'Segoe UI', sans-serif;
        font-size: 10px;
        font-weight: 900;
        cursor: help;
        border: 1px solid ${config.border};
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        vertical-align: middle;
        margin-right: 8px;
    `;

    const tooltip = `Livello: ${config.label}\nDCAT: ${hasDcat ? '✅' : '❌'}\nIDS: ${hasIds ? '✅' : '❌'}\nPublisher: ${publisher}`;

    return new Handlebars.SafeString(`
        <div class="dymer-ds-shield" style="${shieldStyle}" title="${tooltip}">
            <span style="margin-top: -3px;">DS</span>
        </div>
    `);
});

/**
 * Helper Handlebars per mostrare badge distinti per ogni profilo attivo
 * DCAT: Sigillo Verde (Discovery)
 * IDS: Sigillo Blu (Sovereignty)
 */
Handlebars.registerHelper('ds_profiles_badges', function(interoperability) {
    if (!interoperability || !interoperability.enabled) {
        return '';
    }

    const dcatMappings = interoperability.mappings?.dcat || {};
    const idsMappings = interoperability.mappings?.ids || {};
    
    let html = '<div class="dymer-ds-badges-wrapper" style="display: inline-flex; gap: 6px; vertical-align: middle; margin-right: 8px;">';

    // --- BADGE DCAT (Discovery) ---
    if (Object.keys(dcatMappings).length > 0) {
        const dcatStyle = `
            display: flex; align-items: center; justify-content: center;
            width: 24px; height: 24px; 
            background: linear-gradient(135deg, #43a047, #2e7d32);
            color: white; border-radius: 4px; 
            font-size: 10px; font-weight: 900;
            border: 1px solid #1b5e20; box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            cursor: help;
        `;
        html += `<div style="${dcatStyle}" title="Profilo Discovery (DCAT-AP) Attivo: Il dato è indicizzato nei cataloghi federati.">D</div>`;
    }

    // --- BADGE IDS (Sovereignty) ---
    if (Object.keys(idsMappings).length > 0) {
        const idsStyle = `
            display: flex; align-items: center; justify-content: center;
            width: 24px; height: 24px; 
            background: linear-gradient(135deg, #1976d2, #0d47a1);
            color: white; border-radius: 50%; /* Forma circolare per IDS */
            font-size: 10px; font-weight: 900;
            border: 1px solid #0a2142; box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            cursor: help;
        `;
        html += `<div style="${idsStyle}" title="Profilo Sovranità (IDS) Attivo: Scambio sicuro e sovrano abilitato tramite Connector.">S</div>`;
    }

    html += '</div>';

    return new Handlebars.SafeString(html);
});

/**
 * Helper Handlebars per Badge Premium DataSpace
 * Design unico con estetica Cyber-Tech
 */
Handlebars.registerHelper('ds_badges_premium_v0', function(interoperability) {
    if (!interoperability || !interoperability.enabled) return '';

    const hasDcat = Object.keys(interoperability.mappings?.dcat || {}).length > 0;
    const hasIds = Object.keys(interoperability.mappings?.ids || {}).length > 0;
    
    // Stile CSS iniettato (puoi anche spostarlo in un file .css separato)
    const styleTag = `
    <style>
        .ds-badge-container {
            display: inline-flex;
            gap: 6px;
            align-items: center;
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        .ds-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 6px;
            color: white;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease-in-out;
            border: 1px solid rgba(0,0,0,0.1);
        }
        .ds-badge:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            filter: brightness(1.1);
        }
        .ds-badge-dcat {
            background-color: #004494; /* Blue istituzionale EU */
            background: linear-gradient(135deg, #004494 0%, #005cc5 100%);
        }
        .ds-badge-ids {
            background-color: #28a745; /* Green sicurezza */
            background: linear-gradient(135deg, #1e7e34 0%, #28a745 100%);
        }
        .ds-badge i {
            pointer-events: none;
        }
    </style>
    `;

    let html = styleTag + '<div class="ds-badge-container">';

    // --- BADGE DCAT: DISCOVERABILITY ---
    if (hasDcat) {
        html += `
            <div class="ds-badge ds-badge-dcat" 
                 title="DCAT-AP COMPLIANT: Il servizio è catalogato e semanticamente ricercabile a livello Europeo.">
                <i class="fas fa-search-plus"></i>
            </div>`;
    }

    // --- BADGE IDS: DATA SOVEREIGNTY ---
    if (hasIds) {
        html += `
            <div class="ds-badge ds-badge-ids" 
                 title="IDS ENABLED: Sovranità dei dati garantita. Scambio protetto da connettore International Data Spaces.">
                <i class="fas fa-shield-alt"></i>
            </div>`;
    }

    html += '</div>';
    return new Handlebars.SafeString(html);
});

Handlebars.registerHelper('ds_badges_premium_v1', function(interoperability) {

    if (!interoperability || !interoperability.enabled) return '';

    const hasDcat = Object.keys(interoperability.mappings?.dcat || {}).length > 0;
    const hasIds = Object.keys(interoperability.mappings?.ids || {}).length > 0;

    const styleTag = `
    <style>

        .ds-badge-wrapper{
            display:flex;
            align-items:center;
            gap:10px;
            flex-wrap:wrap;
        }

        .ds-badge-modern{
            position:relative;
            display:inline-flex;
            align-items:center;
            gap:8px;

            padding:8px 14px;

            border-radius:14px;

            font-family:'Inter','Segoe UI',sans-serif;
            font-size:12px;
            font-weight:600;
            letter-spacing:.3px;

            color:#fff;

            backdrop-filter:blur(12px);
            -webkit-backdrop-filter:blur(12px);

            border:1px solid rgba(255,255,255,.15);

            overflow:hidden;

            transition:all .25s ease;

            cursor:pointer;

            box-shadow:
                0 4px 12px rgba(0,0,0,.12),
                inset 0 1px 0 rgba(255,255,255,.08);
        }

        .ds-badge-modern:hover{
            transform:translateY(-3px) scale(1.03);

            box-shadow:
                0 10px 25px rgba(0,0,0,.22),
                0 0 18px rgba(255,255,255,.08);

            filter:brightness(1.05);
        }

        .ds-badge-modern::before{
            content:'';
            position:absolute;
            inset:0;

            background:
                linear-gradient(
                    120deg,
                    rgba(255,255,255,.15),
                    rgba(255,255,255,0)
                );

            opacity:.7;
            pointer-events:none;
        }

        .ds-badge-modern i{
            font-size:14px;
        }

        /* DCAT */
        .ds-badge-dcat{
            background:
                linear-gradient(
                    135deg,
                    #003b8e 0%,
                    #005fcc 45%,
                    #3d8bff 100%
                );

            box-shadow:
                0 0 12px rgba(0,95,204,.35);
        }

        /* IDS */
        .ds-badge-ids{
            background:
                linear-gradient(
                    135deg,
                    #136d38 0%,
                    #18a957 45%,
                    #41d98a 100%
                );

            box-shadow:
                0 0 12px rgba(24,169,87,.35);
        }

        /* Tooltip custom */
        .ds-badge-modern[data-tooltip]::after{
            content:attr(data-tooltip);

            position:absolute;

            bottom:calc(100% + 12px);
            left:50%;

            transform:translateX(-50%) translateY(5px);

            background:#111827;
            color:#fff;

            padding:10px 12px;

            border-radius:10px;

            font-size:11px;
            font-weight:500;
            line-height:1.4;

            width:max-content;
            max-width:260px;

            opacity:0;
            visibility:hidden;

            transition:all .2s ease;

            pointer-events:none;

            z-index:999;
        }

        .ds-badge-modern:hover::after{
            opacity:1;
            visibility:visible;
            transform:translateX(-50%) translateY(0);
        }

        /* Pulse animation */
        .ds-badge-modern::before{
            animation:shine 4s linear infinite;
        }

        @keyframes shine{
            0%{
                transform:translateX(-100%);
            }
            100%{
                transform:translateX(100%);
            }
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark){

            .ds-badge-modern{
                border:1px solid rgba(255,255,255,.08);
            }

        }

    </style>
    `;

    let html = styleTag;
    html += `<div class="ds-badge-wrapper">`;

    // DCAT
    if (hasDcat) {

        html += `
        <div 
            class="ds-badge-modern ds-badge-dcat"
            data-tooltip="DCAT-AP COMPLIANT · Il servizio è semanticamente interoperabile e ricercabile nei cataloghi europei."
        >
            <i class="fas fa-diagram-project"></i>
            <span>DCAT-AP</span>
        </div>
        `;
    }

    // IDS
    if (hasIds) {

        html += `
        <div 
            class="ds-badge-modern ds-badge-ids"
            data-tooltip="IDS ENABLED · Scambio dati sicuro e governance garantita tramite International Data Spaces."
        >
            <i class="fas fa-shield-halved"></i>
            <span>IDS</span>
        </div>
        `;
    }

    html += `</div>`;

    return new Handlebars.SafeString(html);

});

Handlebars.registerHelper('ds_badges_premium_v2', function(interoperability) {
    if (!interoperability || !interoperability.enabled) return '';

    const hasDcat = Object.keys(interoperability.mappings?.dcat || {}).length > 0;
    const hasIds = Object.keys(interoperability.mappings?.ids || {}).length > 0;

    // Stile avanzato con animazioni, gradienti e glassmorphism
    const styleTag = `
    <style>
        .ds-badge-container {
            display: inline-flex;
            gap: 12px;
            align-items: center;
            font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        }
        .ds-badge {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 14px;
            color: white;
            font-size: 18px;
            cursor: pointer;
            background-size: 200% auto;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            border: none;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
            backdrop-filter: blur(2px);
        }
        /* Badge DCAT */
        .ds-badge-dcat {
            background: linear-gradient(135deg, #0b3b6b, #1e5a9e, #2b7bcb);
            background-size: 200% 200%;
            animation: subtleGlow 3s infinite alternate;
        }
        /* Badge IDS */
        .ds-badge-ids {
            background: linear-gradient(135deg, #0f5c2f, #1f8a4c, #2ecc71);
            background-size: 200% 200%;
            animation: subtleGlow 3s infinite alternate;
        }
        /* Effetto hover: sollevamento + espansione + bagliore */
        .ds-badge:hover {
            transform: translateY(-4px) scale(1.08);
            box-shadow: 0 12px 20px rgba(0, 0, 0, 0.25);
            filter: brightness(1.05);
            animation-play-state: paused;
        }
        /* Tooltip personalizzato che appare sotto il badge */
        .ds-badge::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: 110%;
            left: 50%;
            transform: translateX(-50%) translateY(8px);
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            color: #fff;
            font-size: 12px;
            font-weight: 500;
            padding: 6px 12px;
            border-radius: 20px;
            white-space: nowrap;
            z-index: 1000;
            opacity: 0;
            pointer-events: none;
            transition: all 0.2s ease;
            letter-spacing: 0.3px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-family: inherit;
        }
        .ds-badge:hover::after {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        /* Leggera animazione di respiro */
        @keyframes subtleGlow {
            0% {
                background-position: 0% 50%;
                box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            }
            100% {
                background-position: 100% 50%;
                box-shadow: 0 4px 18px rgba(0,0,0,0.25), 0 0 6px rgba(255,255,255,0.3);
            }
        }
        /* Aggiunta di un effetto "pulse" iniziale per attrarre l'attenzione (solo primo badge) */
        .ds-badge:first-child {
            animation: fadeInScale 0.4s ease-out, subtleGlow 3s infinite alternate;
        }
        @keyframes fadeInScale {
            0% { opacity: 0; transform: scale(0.8); }
            100% { opacity: 1; transform: scale(1); }
        }
        /* Responsive: su schermi piccoli riduci leggermente le dimensioni */
        @media (max-width: 480px) {
            .ds-badge {
                width: 30px;
                height: 30px;
                font-size: 14px;
                border-radius: 10px;
            }
            .ds-badge::after {
                font-size: 10px;
                white-space: normal;
                width: max-content;
                max-width: 180px;
                text-align: center;
            }
        }
        /* Rimuovo il bordo extra, aggiungo un'icona più chiara */
        .ds-badge i {
            pointer-events: none;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
    </style>
    `;

    let html = styleTag + '<div class="ds-badge-container">';

    // Badge DCAT (Discoverability) – tooltip più affascinante e informativo
    if (hasDcat) {
        html += `
            <div class="ds-badge ds-badge-dcat" 
                 data-tooltip="⭐ DCAT-AP Compliant • Ricerca semantica europea • Alta interoperabilità dei cataloghi"
                 title="DCAT-AP Compliant: il servizio è catalogato e semanticamente ricercabile a livello Europeo.">
                <i class="fas fa-search-plus"></i>
            </div>`;
    }

    // Badge IDS (Data Sovereignty) – tooltip valorizzante
    if (hasIds) {
        html += `
            <div class="ds-badge ds-badge-ids" 
                 data-tooltip="🔒 IDS Certified • Sovranità dei dati • Connettore International Data Spaces"
                 title="IDS Enabled: sovranità dei dati garantita. Scambio protetto da connettore International Data Spaces.">
                <i class="fas fa-shield-alt"></i>
            </div>`;
    }

    html += '</div>';
    return new Handlebars.SafeString(html);
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