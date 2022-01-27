let serverUrl = "";
let cdnurl = "";
//let serverUrl = "http://localhost:8080/public/cdn/";
//var markers, map, elFullScreen, elPageScreen, kmsconf,  sidebar, kmsdataset, kmsDT, templateslist;
var markers, map, elFullScreen, elPageScreen, sidebar, kmsDT;

function preloadKmsMap() {
    var libraryurl = document.getElementById("dymerurl").src;
    //console.log("libraryurl", libraryurl);
    // var parser = document.createElement('a');
    // parser.href = libraryurl;
    //var n = libraryurl.indexOf("/public/cdn/");
    var n = libraryurl.indexOf("/public/cdn/");
    serverUrl = libraryurl.substring(0, n);
    //serverUrl = parser.protocol + "//" + parser.host;
    // cdnurl = serverUrl + "/public/cdn/";
    cdnurl = serverUrl + "/public/cdn/";
    //getBaseurl().then(function(baseu) {
    var script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", cdnurl + "js/utility.js");
    script.onload = function() {
        //console.log("avvio callback 1");
        loadRequireMap();
    };
    document.head.appendChild(script);
    // });	
}
preloadKmsMap();


//funzione invocata dopo l'ultimo load
function mainMapOnLoad() {
    $(document).ready(function() {
        //invoco il main page
        mainDymerMap();
    });
}

function generateMapDT(conf) {
    // console.log('generateMapDT', conf);
    actualTemplateType = conf.viewtype;
    loadMarkers(conf).then(function(ars) {
        //  console.log("ars", ars);

        // if ($("#cont-Map").length) {
        if ($(retriveIfIsType('map')).length) {
            generateMap(ars);
        }

        // if ($('#cont-Dt').length) {
        if ($(retriveTargetId('dt')).length) {
            generateDT();
        }

    });
}
//Marco
function refreshMapDT() {


    // actualTemplateType = conf.viewtype;
    reloadMarker(undefined).then(function(ars) {
        console.log("ars", ars);

        //   if ($("#cont-Map").length) {
        if ($(retriveIfIsType('map')).length) {
            populateMap(ars);
        }

        // if ($('#cont-Dt').length) {
        if ($(retriveTargetId('dt')).length) {
            populateDT(ars);
            afterTableInitialization();
        }

    });
}
let mapJsonArrayToGeoJson = function(arr) {
    return new Promise(function(resolve, reject) {
        var newArr = [];
        for (var i = 0; i < arr.length; i++) {
            let el = arr[i];
            if (el.location != undefined) {

                /* if (el.location.type == "Point") {
                     var tmp = el.location.coordinates[0];
                     el.location.coordinates = [el.location.coordinates[1], tmp];
                 }*/
                if (el.location.coordinates[0] != "" && el.location.coordinates[1] != "") {
                    el = mapJsonToGeoJson(el);
                    newArr.push(el);
                }
            }
        }
        resolve(newArr);
    });
}

function mapJsonToGeoJson(el) {
    var outGeoJson = {}
    let geometry = el.location;
    // delete el.location;
    outGeoJson['properties'] = el;
    outGeoJson['type'] = "Feature";
    outGeoJson['geometry'] = geometry;
    //	console.log('outGeoJson', outGeoJson);
    return outGeoJson;
}

function toggleWiewNext(el) {
    //  console.log('has', $(el), $(el).hasClass("hide_el"), $(el).next().hasClass("hide_el"));
    //  console.log('next', $(el).next(), $(el).next().hasClass("hide_el"));
    var contr = (el.children('i').first().attr('class')).indexOf('hide_el');
    //   console.log('contr', contr, el.children('i').first());
    //   if (contr == -1) {
    if (contr == -1) {
        (el.children('i').last()).removeClass("hide_el");
        (el.children('i').first()).addClass("hide_el");

    } else {
        (el.children('i').last()).addClass("hide_el");
        (el.children('i').first()).removeClass("hide_el");

    }

}

let reloadMarker = function(el) {
    return new Promise(function(resolve, reject) {
        //kmsconf = conf;

        //  var ret = actionPostMultipartForm(kmsconf.endpoint, el, undefined, undefined, undefined, undefined, false);
        var ret = actionPostMultipartForm(kmsconf.endpoint, el, kmsconf.query, undefined, undefined, undefined, false);
        var dataDt = ret.data;
        var templ_data = flatEsArray(dataDt);
        kmsdataset = templ_data.arr;
        var dataMp = ret.data;
        //	manageTamplateList(templ_data.templates);
        //	console.log("getEntities2 ret", ret);
        //	console.log("getEntities2 templ_data", templ_data);
        //	console.log("getEntities2 kmsdataset", kmsdataset);
        if (kmsconf.swapgeop)
            dataMp = mapJsonArrayToGeoJson(ret.data);
        //	console.log("confLoad", conf, ret);
        populateDT(kmsdataset);
        resolve(dataMp);

    });
};

let loadMarkers = function(conf) {
    return new Promise(function(resolve, reject) {
        //kmsconf = conf;	
        var reload = false;
        //     console.log("DATASET", kmsdataset, templateslist);
        if (kmsdataset == undefined) {
            kmsconf = conf;
            reload = true;
        } else {
            if (kmsconf.target != undefined)
                if (kmsconf.target.list != undefined)
                    reload = (kmsconf.target.list.reload != undefined) ? kmsconf.target.list.reload : false;
        }
        if (reload) {
            var ret = actionPostMultipartForm(kmsconf.endpoint, undefined, conf.query, undefined, undefined, undefined, false);
            var templ_data = flatEsArray(ret.data);
            kmsdataset = templ_data.arr;
            manageTamplateList(templ_data.templates);
            //		console.log("loadMarkers ret", ret);
            //		console.log("loadMarkers templ_data", templ_data);
            //		console.log("loadMarkers kmsdataset", kmsdataset);
            //	console.log("rr data", kmsdataset);
            if (kmsconf.swapgeop)
                ret = mapJsonArrayToGeoJson(kmsdataset);
            //		console.log("getEntities2 dataMp", ret);
            //	console.log("confLoad", conf, ret);
            resolve(ret);
        }
    });
}

let generateDTContainer = function() {
    return new Promise(function(resolve, reject) {
        var containerDT = '  <div class="row justify-content-end">' +
            '<div class="col-12 " style="padding:0">' +
            '<table id="dynamicDT" class="display aaa" style="width:100%">' +

            '</table>' +
            '</div>';
        //$('#cont-Dt').html(containerDT);
        $(retriveTargetId('dt')).html(containerDT);
        resolve('fatto');
    });
}
let generateMapContainer = function() {
    return new Promise(function(resolve, reject) {
        var containerMap = '<div id="sidebar" class="style-4"></div>' +
            '<div id="dynamicMAP" style="border:1px solid rgb(215, 221, 222)"> </div>' +
            '<div id = "leafletContribution" ></div> ';
        $('#cont-Map').html(containerMap);
        resolve('fatto');
    });
}
let generateDynamicMap = function() {
    return new Promise(function(resolve, reject) {
        //  if (!$("#dynamicMAP").length) {
        //      return resolve("non richiesta");
        //  }

        markers = L.markerClusterGroup({
            chunkedLoading: true,
            showCoverageOnHover: false,
            //animateAddingMarkers :true,
            //	zoomToBoundsOnClick: true
        });

        //	var map = new L.Map('mymap');
        //map.getCenter()
        //map.getZoom();
        const defaultMapSetting = {
            zoomSnap: 0.5,
            "background": "osmec",
            "center": [46.01222384063236, 21.401367187500004],
            "zoom": 4,
            "maxZoom": 16,
            "minZoom": 2,
            "maxBounds": [
                [-135, -270],
                [135, 270]
            ],
            fullscreenControl: true
                // 	fullscreenControlOptions: {
                //	position: 'topleft'
                // 	}
        };
        let new_mapsetting = {};
        var mapStyle = 'classic';
        if (kmsconf.map != undefined) {
            if (kmsconf.map.style != undefined) {
                mapStyle = kmsconf.map.style;
            }
            if (kmsconf.map.setting != undefined) {
                new_mapsetting = kmsconf.map.setting;
            }
        }

        const mapsetting = {
            ...defaultMapSetting,
            ...new_mapsetting,
        };
        if (kmsconf.map != undefined) {
            kmsconf.map.setting = mapsetting;
        } else {
            kmsconf["map"] = { setting: mapsetting }
        }
        map = new L.map('dynamicMAP', mapsetting);
        /* map = new L.map('dynamicMAP', {
             "background": "osmec",
             "center": [46.01222384063236, 21.401367187500004],
             "zoom": 4,
             "maxZoom": 16,
             "minZoom": 2,
             "maxBounds": [
                 [-135, -270],
                 [135, 270]
             ],
             fullscreenControl: true
                 // 	fullscreenControlOptions: {
                 //	position: 'topleft'
                 // 	}
         });*/
        L.control.fullscreen({
            position: 'topleft', // change the position of the button can be topleft, topright, bottomright or bottomleft, defaut topleft
            title: 'Show me the fullscreen !', // change the title of the button, default Full Screen
            titleCancel: 'Exit fullscreen mode', // change the title of the button when fullscreen is on, default Exit Full Screen
            content: null, // change the content of the button, can be HTML, default null
            forceSeparateButton: true, // force seperate button to detach from zoom buttons, default false
            forcePseudoFullscreen: true, // force use of pseudo full screen even if full screen API is available, default false
            fullscreenElement: false // Dom element to render in full screen, false by default, fallback to map._container
        }).addTo(map);
        elFullScreen = document.querySelector('.leaflet-top .leaflet-control-zoom.leaflet-bar.leaflet-control .leaflet-control-zoom-fullscreen'); // document.getElementsByClassName("leaflet-control-zoom-fullscreen");
        elPageScreen = document.querySelector('.leaflet-top :not(.leaflet-control-zoom) .leaflet-control-zoom-fullscreen');

        elZoomIn = document.querySelector('.leaflet-top .leaflet-control-zoom.leaflet-bar.leaflet-control .leaflet-control-zoom-in');
        elZoomOut = document.querySelector('.leaflet-top .leaflet-control-zoom.leaflet-bar.leaflet-control .leaflet-control-zoom-out');

        elFullScreen.style.display = "none";
        elPageScreen.style.display = "none";
        elZoomIn.style.display = "none";
        elZoomOut.style.display = "none";

        switch (mapStyle) {
            case 'classic':
                var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; <a target="_blank" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                    className: 'leaflet-left'
                });
                map.addLayer(OpenStreetMap_Mapnik);
                break;
            case 'light':
                var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                    maxZoom: 19,
                    attribution: '&copy; <a target="_blank" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                    className: 'leaflet-left'
                });
                map.addLayer(OpenStreetMap_Mapnik);
                break;
            case 'topo':
                var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; <a target="_blank" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                    className: 'leaflet-left'
                });
                map.addLayer(OpenStreetMap_Mapnik);
                break;
            case 'esristreet':
                var OpenStreetMap_Mapnik = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
                    maxZoom: 19,
                    attribution: '&copy; <a target="_blank" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                    className: 'leaflet-left'
                });
                map.addLayer(OpenStreetMap_Mapnik);
                break;
            case 'lightstar':
                var OpenStreetMap_Mapnik = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
                    maxZoom: 19,
                    attribution: '&copy; <a target="_blank" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                    className: 'leaflet-left'
                });
                map.addLayer(OpenStreetMap_Mapnik);
                break;
            case 'esrimap':
                var OpenStreetMap_Mapnik = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    maxZoom: 19,
                    attribution: '&copy; <a target="_blank" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                    className: 'leaflet-left'
                });
                // var positronLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png', {
                var positronLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png', {
                    attribution: ' ©CartoDB',
                    pane: 'labels'
                });
                //	map.setView([10,10],1  );
                map.createPane('labels');
                map.addLayer(OpenStreetMap_Mapnik);
                map.addLayer(positronLabels);
                break;
            default:
                var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; <a target="_blank" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                    className: 'leaflet-left'
                });
                map.addLayer(OpenStreetMap_Mapnik);
                break;
        }
        //var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {

        if (mapStyle == 10) {
            var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a target="_blank" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                className: 'leaflet-left'
            });
            var positronLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
                attribution: ' ©CartoDB',
                pane: 'labels'
            });
            //	map.setView([10,10],1  );
            map.createPane('labels');
            map.addLayer(OpenStreetMap_Mapnik);
            map.addLayer(positronLabels);
        }

        //  document.getElementById('leafletContribution').appendChild(document.querySelector('.leaflet-control-attribution'));
        document.getElementsByClassName('leaflet-bottom leaflet-left')[0].appendChild(document.querySelector('.leaflet-control-attribution'));

        var CustomActionHome = L.Toolbar2.Action.extend({
            options: {
                toolbarIcon: {
                    html: '<i class="fa fa-home"></i>',
                    tooltip: 'Home',
                    className: "leatooltip"
                },
                position: 'topleft'
            },
            addHooks: function() {
                sidebar.hide();
                map.setView(kmsconf.map.setting.center, kmsconf.map.setting.zoom);
                // map.setView([46.01222384063236, 21.401367187500004], 4);
            }
        });
        var CustomActionFullScreen = L.Toolbar2.Action.extend({
            options: {
                toolbarIcon: {
                    html: '<i class="fa fa-arrows-alt leatooltip" data-original-title="Full screen"></i><i class="fa fa-compress hide_el leatooltip" data-original-title="Exit Full screen"></i>',
                    className: "btn_full_screen "
                }
            },
            addHooks: function() {
                toggleWiewNext($(".btn_full_screen"));
                //$("#divEagleFilter").addClass("fixedmapfilter");
                elFullScreen.click(); //setAttribute("id", "id_you_like");//.click();
                let goFull = fullScreenApi.isFullScreen();
                // console.log('pre-full', fullScreenApi.isFullScreen());
                if (!goFull)
                    $('.btn_mini_screen').hide();
                else {
                    $('.btn_full_screen').show();
                    $('.btn_mini_screen').show();
                }
            }
        });

        var CustomActionZoomIn = L.Toolbar2.Action.extend({
            options: {
                toolbarIcon: {
                    html: '<i class="fa fa-plus-circle" ></i> ',
                    tooltip: 'Zoom In',
                    className: "btn_zoom_in leatooltip"
                }
            },
            addHooks: function() {
                elZoomIn.click(); //setAttribute("id", "id_you_like");//.click();
            }
        });
        var CustomActionZoomOut = L.Toolbar2.Action.extend({
            options: {
                toolbarIcon: {
                    html: '<i class="fa fa-minus-circle" ></i> ',
                    tooltip: 'Zoom Out',
                    className: "btn_zoom_out leatooltip"
                }
            },
            addHooks: function() {
                elZoomOut.click(); //setAttribute("id", "id_you_like");//.click();
            }
        });
        var CustomActionTable = L.Toolbar2.Action.extend({
            options: {
                toolbarIcon: {
                    html: '<i class="fa fa-table" aria-hidden="true"></i>',
                    tooltip: 'View Table',
                    className: "btn_zoom_out leatooltip"
                }
            },
            addHooks: function() {
                $("#dynamicDT_wrapper").clone().appendTo("#sidebar");
                $('.leaflet-sidebar').addClass("tableOpen");
                sidebar.toggle();
            }
        });

        var CustomActionMiniScreen = L.Toolbar2.Action.extend({
            options: {
                toolbarIcon: {
                    html: '<i class="fa fa-expand leatooltip" data-original-title="Full page screen"></i><i class="fa fa-compress leatooltip hide_el " data-original-title="Exit Full screen"></i>',
                    className: "btn_mini_screen "
                }
            },
            addHooks: function() {
                toggleWiewNext($(".btn_mini_screen"));
                /*  let goFull = !$('.btn_full_screen').hasClass("hide_el");
                  goFull = !fullScreenApi.isFullScreen();
                  if (goFull)
                      $('.btn_full_screen').hide(); //.addClass("hide_el");
                  else {
                      $('.btn_full_screen').show();
                      $('.btn_mini_screen').show();
                  } //.removeClass("hide_el");*/
                elPageScreen.click(); //setAttribute("id", "id_you_like");//.click();
                //  console.log('nomaxW', $('.leaflet-container').hasClass('nomaxW'));
                //     $('.leaflet-container').addClass('nomaxW');
                map.invalidateSize();
                var contr = ($('.leaflet-container').attr('class')).indexOf('nomaxW');
                // console.log('contr', contr);
                if (contr == -1) {
                    $('.btn_full_screen').hide();
                    $('.leaflet-container').addClass('nomaxW');
                } else {
                    $('.leaflet-container').removeClass('nomaxW');
                    $('.btn_full_screen').show();
                    $('.btn_mini_screen').show();
                }
            }
        });
        map.on('enterFullscreen', function() {
            //onsole.log('entered fullscreen', fullScreenApi.isFullScreen());
            //	$('.leaflet-bottom.leaflet-left').append('<div class="leaflet-control cloned_interactiveF"></div>');

            //$("#divEagleFilter").addClass("fixedmapfilter");
            $("#divEagleFilter  > form").appendTo(".leaflet-bottom.leaflet-left");
            //		var html_filter = $("#divEagleFilter > form").clone();
            //		html_filter.appendTo('.leaflet-bottom.leaflet-left .leaflet-control');
            //console.log("html_filter",html_filter.html());
            //$('.leaflet-bottom.leaflet-left').html(html_filter);

        });

        map.on('exitFullscreen', function() {
            $(".leaflet-bottom.leaflet-left  > form").appendTo("#divEagleFilter");
            //	$("#divEagleFilter").removeClass("fixedmapfilter");
            //	console.log('exited fullscreen', fullScreenApi.isFullScreen());
            //	$('.leaflet-bottom.leaflet-left').empty();
            // $('.leaflet-container').removeClass('nomaxW');
            $('.btn_full_screen').show();
            $('.btn_mini_screen').show();
            $('.btn_full_screen').children('i').first().removeClass("hide_el");
            $('.btn_full_screen').children('i').last().addClass("hide_el");
            //   toggleWiewNext($(".btn_full_screen"));
        });
        sidebar = L.control.sidebar('sidebar', {
            closeButton: true,
            position: 'right'
        });
        sidebar.on('hide', function() {
            $('.leaflet-sidebar').removeClass("tableOpen");
        });

        map.addControl(sidebar);
        sidebar.hide();
        new L.Toolbar2.Control({
            position: 'topright',
            actions: [CustomActionHome, CustomActionZoomIn, CustomActionZoomOut, CustomActionFullScreen, CustomActionMiniScreen],
            className: 'toolBarRightUl'
        }).addTo(map);
        resolve("fatto");
    });
}

function arrayEquals(a, b) {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
}

function settingMapIcon(obj) {
    var confIcon = [];
    if (kmsconf.map != undefined)
        if (kmsconf.map.markers != undefined)
            if (kmsconf.map.markers[obj.properties._index] != undefined) {
                confIcon = (kmsconf.map.markers[obj.properties._index]).filter(function(el) {
                    //console.log('el.value == obj.properties[el.key]', el.value, obj.properties[el.key], el.value == obj.properties[el.key]);
                    if (el.value == undefined || obj.properties[el.key] == undefined)
                        return undefined;

                    if (Array.isArray(obj.properties[el.key])) {
                        return arrayEquals((el.value).sort(), (obj.properties[el.key]).sort());
                    } else
                        return el.value == obj.properties[el.key];
                });
                if (!confIcon.length)
                    confIcon = (kmsconf.map.markers[obj.properties._index]).filter(function(el) {
                        return el.default == true;
                    });
            }

    if (!confIcon.length)
        confIcon[0] = {
            icon: 'fa-circle',
            prefix: 'fa',
            markerColor: 'blue'
        };
    return confIcon[0];
}

function populateMap(arrdata) {
    return new Promise(function(resolve, reject) {

        markers.clearLayers();
        var geoJsonLayer = L.geoJson(arrdata, {
            /*  icon: function(feature, latlng) {
                // return L.marker(latlng, { icon: L.AwesomeMarkers.icon({ icon: 'spinner', prefix: 'fa', markerColor: 'red', spin: true }) });
                return L.marker(latlng, {
                    icon: myIcon
                });
*/
            //console.log(getColor(feature.id));
            /*   return new L.circleMarker(latlng, {
                   radius: 8,
                   fillColor: "#ff0000",
                   color: "#ff0000",
                   weight: 1,
                   opacity: 1,
                   fillOpacity: 0.8

               });*/

            //    },
            /*   style: function(feature) {
                  // console.log('feature', feature);
                   return { color: '#00CC00' };
                   //   return { color: feature.properties.color };

               },*/
            pointToLayer: function(feature, latlng) {

                return L.marker(latlng, { icon: L.AwesomeMarkers.icon(settingMapIcon(feature)) });
                //return L.marker(latlng, { icon: L.AwesomeMarkers.icon({ icon: 'fa-circle', prefix: 'fa', markerColor: 'red' }) });
                /*  return L.marker(latlng, {
                      icon: new L.Icon({
                          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                          iconSize: [25, 41],
                          iconAnchor: [12, 41],
                          popupAnchor: [1, -34],
                          shadowSize: [41, 41]
                      })
                  });*/

                //console.log(getColor(feature.id));
                /*   return new L.circleMarker(latlng, {
                       radius: 8,
                       fillColor: "#ff0000",
                       color: "#ff0000",
                       weight: 1,
                       opacity: 1,
                       fillOpacity: 0.8

                   });*/

            },
            onEachFeature: function(feature, layer) {
                //		 console.log('feature', feature);

                layer.bindPopup(layer.feature.properties.title, { closeButton: false, offset: L.point(0, -20) });
                layer.on('mouseover', function() { layer.openPopup(); });
                layer.on('mouseout', function() { layer.closePopup(); });

                layer.on('click', function(e, feature) {
                    // e = event

                    var coord = e.latlng;
                    var lat = coord.lat;
                    var lng = coord.lng;
                    var latLngs = [e.target.getLatLng()];
                    var markerBounds = L.latLngBounds(latLngs);
                    //	console.log('getZoom()', map.getZoom());
                    map.fitBounds(markerBounds);
                    //	map.invalidateSize();
                    // 	 map.setView(e.target.getLatLng() );

                    //	console.log('layer.feature.properties', layer.feature.properties);
                    var arObj = new Array();
                    arObj.push(layer.feature.properties);
                    var template = "";
                    getKmsTemplateMap(arObj, "teasermap").then(function(rep) {

                        template = '<div class="container_">' + rep.template + '	</div> ';
                        var objToR = (rep.type == "teaserlist") ? arObj : layer.feature.properties;
                        var stone = Handlebars.compile(template)(objToR);
                        sidebar.setContent(stone);
                        sidebar.toggle();
                    });

                });

            }
        });

        markers.addLayer(geoJsonLayer);
        map.addLayer(markers);
        // console.log("aggiunti")
        resolve('fatto');
    });
}
let generateMap = function(arr) {
    generateMapContainer()
        .then(generateDynamicMap)
        .then(function() {
            //console.log('gJdata', arr);
            populateMap(arr);
        })
        .then(function() {
            //	console.log('possiamo uscire!');
            $('.leatooltip').tooltip({ boundary: 'window', placement: "left" });
        });
}
let generateDynamicDT = function(arr) {
    return new Promise(function(resolve, reject) {
        // console.log("arr", arr);
        var listData = arr;
        if (kmsconf.hasOwnProperty('databeforerender')) {
            listData = kmsconf.databeforerender(arr);
            // console.log("listData", listData);
        }


        // console.log("listData1", listData);
        kmsDT = $('#dynamicDT').DataTable({
            // stateSave: true,
            // "searching": true, 
            //"scrollX": true,
            // dom: 'Blfrtip',
            "oLanguage": {
                "sSearch": "<span>Filter: </span> _INPUT_" //search
            },
            dom: '<"#toolbarhdfilter"lBf>rt<"bottom"ip>',
            buttons: [{
                    extend: 'excelHtml5',
                    text: '<i class="fa fa-file-excel-o" aria-hidden="true"></i> XLS Download',
                    className: 'btn btn-sm btn-secondary export-btn-tbl',

                    exportOptions: {
                        columns: ':visible' //visible rows
                    }
                },
                {
                    extend: 'csvHtml5',
                    text: '<i class="fa fa-file-o" aria-hidden="true"></i> CSV Download',
                    className: 'btn btn-sm btn-secondary export-btn-tbl',
                    exportOptions: {
                        columns: ':visible' //visible rows
                    }

                }, {
                    extend: 'pdfHtml5',
                    text: '<i class="fa fa-file-pdf-o" aria-hidden="true"></i> PDF Download',
                    className: 'btn btn-sm btn-secondary export-btn-tbl',
                    exportOptions: {
                        columns: ':visible' //visible rows
                    }
                }
                /*, {
                                    text: '<i class="fa fa-low-vision" aria-hidden="true"></i> Column Visibility',
                                    className: 'btn btn-sm btn-secondary',
                                    action: function(e, dt, node, config) {
                                        $('#cntbtnactdeact').toggle();
                                    }
                                }*/

            ],
            data: listData,
            columns: kmsconf.dt.columns,
            orderCellsTop: true,
            /*fixedHeader: {
                header: true,
                footer: true
            },*/
            initComplete: function(settings, json) {
                afterTableInitialization(this);
                /*   $('#dynamicDT_wrapper').append('<div class="row col-12"><i id="icnsdownload" class="fas fa-download" onclick="$(\'#contDwnlBtn\').toggle();"></i><span id="contDwnlBtn" style="display: none;"></span></div>');
                   $("#dynamicDT_filter").prepend('<i id="icnsHideShow" class="fas fa-th-list" onclick="$(\'#cntbtnactdeact\').toggle();"></i>');
                   $(".export-btn-tbl").appendTo("#contDwnlBtn");

                   $('#dynamicDT_wrapper  .dt-buttons').after('<div id="cntbtnactdeact" style="display: none;"></div> ');
                   $('#dynamicDT ').append($('<tfoot><tr class="d_table_filer"></tr></tfoot>'));
                   var self_ = this;
                   $('#dynamicDT thead tr:eq(0)').after('<tr class="d_table_filer"></tr>');
                   self_.api().columns().every(function(index) {
                       $('#dynamicDT thead tr:eq(1)').append('<th dtabindex="' + index + '"></th>');
                       $('#dynamicDT tfoot tr:eq(0)').append('<th dtabindex="' + index + '"></th>');
                       var column = this;
                       var title = $(column.header()).text();
                       //   console.log('nnn', index, $('#dynamicDT thead tr:eq(0) th:nth-child(' + index + ')').attr('class'));
                       //  console.log('nnn', index, $(column.header()).attr('class'));
                       var hdclass = $(column.header()).attr('class');
                       //  var noFilt = $('#dynamicDT thead tr:eq(0) th:nth-child(' + column.index() + ')').attr('class');
                       var extfiltra = "";
                       if (hdclass != undefined) {
                           if (hdclass.indexOf("noautofilter") != -1)
                               extfiltra = " hide d-none";
                       }
                       var onlyDateSearch = false;
                       if (hdclass != undefined) {
                           if (hdclass.indexOf("onlyDateSearch") != -1)
                               onlyDateSearch = true;
                       }
                       //console.log('column().footer()', column.footer());
                       // console.log('column().header()', column.header());
                       //     console.log('column().index()', column.index());
                       //   console.log('column().visible()', column.visible());

                       //console.log('table.column( idx ).header() ', column.header());
                       var isvisible = (column.visible()) ? "checked" : "";
                       if (!column.visible()) {
                           $('[dtabindex="' + column.index() + '"]').hide();
                       }
                       var ck = '<span class="clact_deact " data-ordtitle="' + title + '"><span class="clname"> <i class="fa fa-circle small" aria-hidden="true"></i> ' +
                           title + '</span><label class="switch switchfilter " ><input type="checkbox" data-column="' + index + '" class="toggle-vis" ' + isvisible +
                           '> <span class="slider round"></span>  </label></span>';

                       if (title != "") {
                           var inpt = $('<input type="text" placeholder=" ' + title + '" class="column_search ' + extfiltra + '" />')
                               .appendTo($("#dynamicDT thead tr:eq(1) th").eq(index).empty())
                               .on('keyup', function() {
                                   var val = $(this).val();
                                   column
                                       .search(val)
                                       .draw();
                               });

                           $('#cntbtnactdeact').append(ck);
                           $("#cntbtnactdeact .clact_deact").sort(sort_li).appendTo('#cntbtnactdeact ');

                           var select = $('<select class="form-control_ select2 ' + extfiltra + ' " data-placeholder="Filter"><option value="">' + title + '</option></select>')
                               .appendTo($("#dynamicDT tfoot tr:eq(0) th").eq(index).empty())
                               .on('change', function() {
                                   var val = $(this).val();
                                   if (val === "\\(Blank\\)")
                                       column
                                       .search('^$', true, false)
                                       .draw();
                                   else
                                       column
                                       .search(val)
                                       .draw();
                               }); //.after('<div class="">' + title + '</div>');

                           column.data().unique().sort().each(function(d, j) {
                               if (typeof d_dt_functions !== "undefined") {
                                   if (d_dt_functions[title] !== undefined) {
                                       d = d_dt_functions[title](d);
                                   }
                               }
                               if (typeof d !== 'object') {
                                   if (d) {
                                       var mar_dim_f = 100;
                                       var value_sel = d.replace(/<(?:.|\n)*?>/gm, '');
                                       var value_sel_text = value_sel;
                                       if (value_sel.length > mar_dim_f) {
                                           value_sel = value_sel.substr(0, mar_dim_f - 1);
                                           value_sel_text = value_sel + ' &hellip;';

                                       }
                                       if (onlyDateSearch) {
                                           value_sel_text = (value_sel_text.split(" "))[0];
                                           value_sel = (value_sel.split(" "))[0];
                                       }

                                       if (!select.children().filter(function() { return $(this).val() == value_sel; }).length)
                                           select.append('<option value="' + value_sel + '">' + value_sel_text + '</option>');
                                   } else {
                                       select.append('<option value="\\(Blank\\)">Blank</option>');
                                   }
                               }
                           });
                       }

                   });*/
            }
        });
        $('.toggle-vis').on('change', function(e) {
            e.preventDefault();
            // Get the column API object
            var ind = $(this).attr('data-column');
            var column = kmsDT.column(ind);
            // Toggle the visibility
            column.visible(!column.visible());
            if (!column.visible()) {

                $('[dtabindex="' + ind + '"]').hide();
            } else {
                $('[dtabindex="' + ind + '"]').show();
            }
        });
        resolve("fatto");
    });
}

function afterTableInitialization(ths) {
    var self_ = kmsDT;
    var firtCreate = false;
    if (ths != undefined) {
        self_ = ths.api();
        firtCreate = true
    }
    if (firtCreate) { //
        $('#dynamicDT_wrapper').append('<div class="row col-12"><i id="icnsdownload" title="Download" class="fa fas fa-download" onclick="$(\'#contDwnlBtn\').toggle();"></i><span id="contDwnlBtn" style="display: none;"></span></div>');
        // $("#dynamicDT_filter").prepend('<i id="icnsHideShow" title="Set Fields Visibility" class="fas fa-th-list" onclick="$(\'#cntbtnactdeact\').toggle();"></i>');
        $("#toolbarhdfilter").prepend('<div style="float:left;margin-left: 2px;"><i id="icnsHideShow" title="Set Fields Visibility" class="fa fas fa-th-list" onclick="$(\'#cntbtnactdeact\').toggle();"></i></div>');
        $(".export-btn-tbl").appendTo("#contDwnlBtn");

        $('#dynamicDT_wrapper ').prepend('<div id="cntbtnactdeact" style="display: none;"></div> ');
        // $('#dynamicDT_wrapper  .dt-buttons').after('<div id="cntbtnactdeact" style="display: none;"></div> ');
        $('#dynamicDT ').append($('<tfoot><tr class="d_table_filer"></tr></tfoot>'));

        $('#dynamicDT thead tr:eq(0)').after('<tr class="d_table_filer"></tr>');
    }
    self_.columns().every(function(index) {
        $('#dynamicDT thead tr:eq(1)').append('<th dtabindex="' + index + '"></th>');
        $('#dynamicDT tfoot tr:eq(0)').append('<th dtabindex="' + index + '"></th>');
        var column = this;
        var title = $(column.header()).text();
        //   console.log('nnn', index, $('#dynamicDT thead tr:eq(0) th:nth-child(' + index + ')').attr('class'));
        //  console.log('nnn', index, $(column.header()).attr('class'));
        var hdclass = $(column.header()).attr('class');
        //  var noFilt = $('#dynamicDT thead tr:eq(0) th:nth-child(' + column.index() + ')').attr('class');
        var selectFilter = true;
        var extfiltra = "";
        var onlyDateSearch = false;
        if (hdclass != undefined) {
            if (hdclass.indexOf("noautofilter") != -1)
                extfiltra = " hide d-none";
            if (hdclass.indexOf("noselectfilter") != -1)
                selectFilter = false;
            if (hdclass.indexOf("onlyDateSearch") != -1)
                onlyDateSearch = true;
        }
        //console.log('column().footer()', column.footer());
        // console.log('column().header()', column.header());
        //     console.log('column().index()', column.index());
        //   console.log('column().visible()', column.visible());

        //console.log('table.column( idx ).header() ', column.header());
        if (firtCreate) {
            var isvisible = (column.visible()) ? "checked" : "";
            if (!column.visible()) {
                $('[dtabindex="' + column.index() + '"]').hide();
            }
            var ck = '<span class="clact_deact " data-ordtitle="' + title + '"><span class="clname"> <i class="fa fa-circle small" aria-hidden="true"></i> ' +
                title + '</span><label class="switch switchfilter " ><input type="checkbox" data-column="' + index + '" class="toggle-vis" ' + isvisible +
                '> <span class="slider round"></span>  </label></span>';
        }
        if (title != "") {
            if (firtCreate) {
                var inpt = $('<input type="text" placeholder=" ' + title + '" class="column_search ' + extfiltra + '" />')
                    .appendTo($("#dynamicDT thead tr:eq(1) th").eq(index).empty())
                    .on('keyup', function() {
                        var val = $(this).val();
                        column
                            .search(val)
                            .draw();
                    });

                $('#cntbtnactdeact').append(ck);
                $("#cntbtnactdeact .clact_deact").sort(sort_li).appendTo('#cntbtnactdeact ');
            }
            if (selectFilter)
                var select = $('<select class="form-control_ select2 ' + extfiltra + ' " data-placeholder="Filter"><option value="">' + title + '</option></select>')
                    .appendTo($("#dynamicDT tfoot tr:eq(0) th").eq(index).empty())
                    .on('change', function() {
                        var val = $(this).val();
                        if (val === "\\(Blank\\)")
                            column
                            .search('^$', true, false)
                            .draw();
                        else
                            column
                            .search(val)
                            .draw();
                    }); //.after('<div class="">' + title + '</div>');

            column.data().unique().sort().each(function(d, j) {
                if (typeof d_dt_functions !== "undefined") {
                    if (d_dt_functions[title] !== undefined) {
                        d = d_dt_functions[title](d);
                    }
                }
                if (typeof d !== 'object') {
                    if (d) {
                        var mar_dim_f = 100;
                        var value_sel = d.replace(/<(?:.|\n)*?>/gm, '');
                        var value_sel_text = value_sel;
                        if (value_sel.length > mar_dim_f) {
                            value_sel = value_sel.substr(0, mar_dim_f - 1);
                            value_sel_text = value_sel + ' &hellip;';

                        }
                        if (onlyDateSearch) {
                            value_sel_text = (value_sel_text.split(" "))[0];
                            value_sel = (value_sel.split(" "))[0];
                        }
                        if (selectFilter)
                            if (!select.children().filter(function() { return $(this).val() == value_sel; }).length)
                                select.append('<option value="' + value_sel + '">' + value_sel_text + '</option>');
                    } else {
                        if (selectFilter)
                            select.append('<option value="\\(Blank\\)">Blank</option>');
                    }
                }
            });
        }

    });
}

let populateDT = function(arr) {
    return new Promise(function(resolve, reject) {
        kmsDT.clear();
        kmsDT.rows.add(arr).draw();;
        /*  kmsDT.clear().draw();
          kmsDT.rows.add(arr); // Add new data
          kmsDT.columns.adjust().draw();*/
        resolve("fatto");
    });
}

function generateDT() {
    generateDTContainer()
        .then(function() {
            generateDynamicDT(kmsdataset);
            //populateDT(arr);
        });
}

function actionEventForm(el, senderForm, callbackfunction, callerForm, useGritter) {
    //	var check_session=checkSession();
    //	if(!check_session)
    //		return false;
    // console.log("senderForm ",senderForm);
    if (senderForm == undefined)
        senderForm = "#" + el.closest('.senderForm').attr("id");
    if (el.attr("disabled") != undefined)
        return false;

    setCheck(senderForm);
    //console.log('senderForm', senderForm);
    ajaxcall_form.flush();
    ajaxcall_form.addcontainer_ids(senderForm);
    var personalData = new Object();
    personalData["p1"] = "v1";
    //let beforeSend={"beforeSend":"beforeSendEntity"};
    ajaxcall_form.addparams(personalData);

    var personalData2 = { "data": { "p2": "v2", "p3": "v3" } };
    ajaxcall_form.addparams(personalData2);
    var personalData3 = { "p4": [1, 2, 3, 4] };
    ajaxcall_form.addparams(personalData3);
    var ret = ajaxcall_form.send();
    var gr_title = "";
    var gr_text = "";
    //console.log("ret", ret);
    var success = ret.success;
    if (useGritter) {
        gr_title = "";
        gr_text = ret.message;
        //if (!success)
        //	gr_text += " " + ret.extraData.log;
    }
    if (success) {
        if (callerForm != undefined)
            senderForm = callerForm;
        if (callbackfunction != undefined) {
            callbackfunction.call();
        }
        //resetContainer(senderForm);
        if (useGritter)
            useAlert(senderForm, gr_title, gr_text, success);
    } else {
        if (useGritter)
            useAlert(senderForm, gr_title, gr_text, success);
    }
    return false;
}