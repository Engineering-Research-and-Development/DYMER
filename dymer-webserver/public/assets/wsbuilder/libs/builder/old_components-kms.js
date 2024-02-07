Vvveb.ComponentsGroup["Dymer Model"] = ["dymer/kmsgeopoint", "dymer/kmsrelation", "dymer/dymrelation", "html/mytextinput", "html/dmodelentitytags", "dymer/kmstaxonomy"];
Vvveb.ComponentsGroup["Dymer Template"] = ["dymer/entitystatus", "html/dentitylink", "dymer/dpagination", "html/dimage", "html/dtemplateentitytags"];
Vvveb.Components.add("dymer/entitystatus", {
    name: "Entity Status",
    attributes: ["data-component-entitystatus"],
    image: "icons/dymer/traffic-light.svg",
    dragHtml: '<img src="' + Vvveb.baseUrl + 'dymer/traffic-light.svg">',
    html: '<div data-component-entitystatus data-vvveb-disabled class="row">' +
        '{{{EntityStatus this}}}' +
        '</div>',
    reapetable: false
});
Vvveb.Components.extend("_base", "dymer/dpagination", {
    name: "Pagination",
    attributes: ["data-component-dpagination"],
    image: "icons/pagination.svg",
    dragHtml: '<img style="width:50px" src="' + Vvveb.baseUrl + 'icons/pagination.svg">',
    html: '<div data-component-dpagination   class="row" d-pagination-size="6">' +
        '{{{DymerPagination this}}}' +
        '</div>',
    properties: [{
            name: "Max Element",
            key: "d_pagination_size",
            htmlAttr: "d-pagination-size",
            inputtype: TextInput
        },
        {
            name: 'Element property',
            key: false,
            htmlAttr: false,
            inline: false,
            col: 12,

            inputtype: TextInput,
            init: function(node) {
                var str = 'd-pagegroup="{{{DymerPaginationPageIndex ../this.length @index}}}"';
                return str;
            }

        }

    ],
    onChange: function(node, property, value) {
        // $(node).css('background-image', 'url(' + value + ')');

        this[property.key] = value;
        if (this.d_pagination_size && !(isNaN(value))) {
            var prop = $(node).closest('body').find('#d_pagination_prop');
            if (prop.length) {
                prop.text('{{setVariable "d_pagination_size" ' + value + '}}');
            } else {
                $(node).closest('body').prepend('<span id="d_pagination_prop">{{setVariable "d_pagination_size" ' + value + '}}</span>');
            }
            //    $(node).closest('body').append('<span id="d_pagination_prop">{{setVariable "d_pagination_size" ' + value + '}}</span>');
        }
        return node;
    },
    reapetable: false
});
Vvveb.Components.add("dymer/kmsgeopoint", {
    name: "Geo Point",
    attributes: ["data-component-geopoint"],
    image: "icons/3d-location-graph.svg",
    dragHtml: '<img src="' + Vvveb.baseUrl + 'icons/3d-location-graph.png">',
    html: '<div class="geopointcontgrp form-group field-description ">' +
        '<label for="description" class="kms-title-label">Geo Point</label>' +
        '<div>' +
        '<div data-component-geopoint class="form-group  ">' +
        //"<div>" +
        '<input type="hidden" class= "form-control" name="data[location][type]" value="Point">' +
        '<label class="kms-title-label">Longitude</label>' +
        '<input type="number" class="form-control" name="data[location][coordinates][0]">' +
        '<label class="kms-title-label">Latitudine</label>' +
        '<input type="number" class="form-control" name="data[location][coordinates][1]">' +
        //  "</div>" +
        '</div>' +
        '</div>' +
        '</div>',
    reapetable: false,

    onChange: function(node, property, value) {
        // $(node).css('background-image', 'url(' + value + ')');

        this[property.key] = value;
        if (this.reapetable) {
            $(node).closest('.geopointcontgrp').addClass("repeatable first-repeatable");
            var act =
                '<div class="action-br">' +
                '<span class="btn  btn-outline-primary  btn-sm" onclick = "cloneRepeatable($(this))" > +</span>' +
                '<span class="btn  btn-outline-danger  btn-sm act-remove" onclick="removeRepeatable($(this))">-</span>' +
                "</div>";
            $(node).append(act);
        } else {
            $(node).closest('.geopointcontgrp').removeClass("repeatable first-repeatable");
            $(node).closest('.geopointcontgrp')
                .find(".action-br")
                .remove();
        }

        return node;
    },
    /* init: function (node) {
       return JSON.parse(node.dataset.chart).type;
     },*/
    properties: [{
        name: "Reapetable",
        key: "reapetable",
        inputtype: CheckboxInput,
        init: function(node) {

            if ($(node).closest('.geopointcontgrp').hasClass("repeatable"))
                setTimeout(function() { $('#properties [data-key="reapetable"] #reapetable_check').prop('checked', true); }, 2000);

            //  var sel= $(node).find("data-torelation").prop('checked', true);;
        }
    }]
});

Vvveb.Components.add("dymer/kmsrelation", {
    name: "Relation",
    attributes: ["data-component-kmsrelation"],
    image: "icons/network.svg",
    dragHtml: '<img src="' + Vvveb.baseUrl + 'icons/network.png">',
    html: '<div class="relationcontgrp form-group field-description ">' +
        '<label for="description" class="kms-title-label">Relation</label>' +
        '<div>' +
        '<div data-component-kmsrelation class="form-group" contenteditable="false" data-torelation="">' +
        // '<input type="hidden" name="data[relation][]">' +
        '<span  contenteditable="false" class="inforelation">Relation</span> <i class="fa fa-code-fork rotandflip inforelation" aria-hidden="true"></i> <span contenteditable="false" class="torelation inforelation">......</span>' +
        '</div>' +
        '</div>' +
        '</div>',
    listent: false,
    reapetable: false,
    init: function(node) {
        //this.reapetable=true;
        //$(node)
        //   .find( "input[type='hidden'][name^='data[relation]']" ).attr('name','data[relation]['+new Date().getTime()+']');

    },
    onChange: function(node, property, value) {
        if (property.key == "required") {
            if (value == true) {
                $(node)[0].attributes.required.value = ""
            } else {
                $(node).removeAttr("required")
            }
        }

        if (property.key == "listent") {
            $(node)
                .find(".torelation")
                .html(value);
        }

        if (property.key == "reapetable") {
            this[property.key] = value;
            if (this.reapetable) {
                $(node).closest('.relationcontgrp').addClass("repeatable first-repeatable");
                var act =
                    '<div class="action-br">' +
                    '<span class="btn  btn-outline-primary  btn-sm" onclick = "cloneRepeatable($(this))" > +</span>' +
                    '<span class="btn  btn-outline-danger  btn-sm act-remove" onclick="removeRepeatable($(this))">-</span>' +
                    "</div>";
                $(node).closest('.relationcontgrp').append(act);
            } else {
                $(node).closest('.relationcontgrp').removeClass("repeatable first-repeatable");
                $(node).closest('.relationcontgrp')
                    .find(".action-br")
                    .remove();
            }

        }

        return node;
    },

    properties: [{
            name: "Required",
            key: "required",
            htmlAttr: "required",
            inputtype: CheckboxInput,
            init: function(node) {
                if (node.hasAttribute('required')) {
                    setTimeout(function() { $('#required_check').prop('checked', true); }, 2000)
                }
            },
        },
        {
            name: "Reapetable",
            key: "reapetable",
            htmlAttr: "data-ddddt",
            inputtype: CheckboxInput,

            init: function(node) {

                if ($(node).closest('.relationcontgrp').hasClass("repeatable"))
                    setTimeout(function() { $('#properties [data-key="reapetable"] #reapetable_check').prop('checked', true); }, 2000);

                //  var sel= $(node).find("data-torelation").prop('checked', true);;
            }
        },
        {
            name: "List of entities",
            key: "listent",
            inputtype: SelectInput,
            htmlAttr: "data-torelation",
            beforeInit: function(node) {

                //  console.log("beforeInit a", this.data.options);
                var _l = this;

                propert = [];
                angular
                    .injector(["ng", "main.app"])
                    .get("serviceEntity")
                    .chiama()
                    .then(function(ret) {
                        var listIndexes = ret;
                        console.log("serviceEntity listIndexes", listIndexes);
                        //    console.log("beforeInit d");
                        propert.push({
                            value: "",
                            text: ""
                        });
                        for (key of listIndexes.values()) {
                            console.log("serviceEntity listIndexes", key);
                            if (key != 'entity_relation')
                                propert.push({
                                    value: key,
                                    text: key
                                });
                        }
                        //     console.log("propert", _l, propert);
                        _l.data.options = propert;
                        //    console.log("propert2", _l.data.options, node);
                        //    var sel= $(node).attr("data-torelation");
                        //     console.log("seelzionato", sel);
                        return node;
                    });

                //
            },
            data: {
                extraclass: "btn-cccc",
                options: []
            }
        }
    ]
});
Vvveb.Components.add("dymer/dymrelation", {
    name: "Relation Picker",
    attributes: ["data-component-dymrelation"],
    image: "icons/dymer/relationpicker.svg",
    dragHtml: '<img src="' + Vvveb.baseUrl + 'icons/dymer/relationpicker.svg" height="50px">',
    html: '<div class="form-group">' +
        '<label for="description" class="kms-title-label">Relation</label>' +
        '<div>' +
        '<div data-component-dymrelation class="form-group dymerselectpicker"   data-torelation="">' +
        '<span   class="inforelation">Relation</span> <i class="fa fa-code-fork rotandflip inforelation" aria-hidden="true"></i> <span contenteditable="false" class="torelation inforelation">......</span>' +
        '</div>' +
        '</div>',
    listent: false,
    reapetable: false,
    actionsbox: false,
    livesearch: false,
    maxoptions: "",
    init: function(node) {
        //this.reapetable=true;
        //$(node)
        //   .find( "input[type='hidden'][name^='data[relation]']" ).attr('name','data[relation]['+new Date().getTime()+']');

    },
    onChange: function(node, property, value) {
        console.log(' property, value ', property.key, property, value);
        if (property.key == "required") {
            if (value == true) {
                $(node)[0].attributes.required.value = ""
            } else {
                $(node).removeAttr("required")
            }
        }

        if (property.key == "listent") {
            $(node)
                .find(".torelation")
                .html(value);
        }

        if (property.key == "reapetable") {
            this[property.key] = value;
            console.log('$(node)', $(node));
            if (this.reapetable) {
                $(node).attr("multiple", "");
            } else {
                $(node).removeAttr("multiple");
            }
        }

        if (property.key == "actionsbox") {
            //   this[property.key] = value;
            if (value == true) {
                $(node).attr("data-actions-box", value);
            } else {
                $(node).removeAttr("data-actions-box")
            }
        }
        if (property.key == "livesearch") {
            //  this[property.key] = value;
            if (value == false) {
                $(node).removeAttr("data-live-search")
            }
            /* if (value == true) {
                 $(node).attr("data-live-search", value);
             } else {
                 $(node).removeAttr("data-live-search")
             }*/
        }
        /* if (property.key == "searchableelement") {
             if (value == true) {
                 $(node).attr("searchable-element", "");
             } else { $(node).removeAttr("searchable-element"); }
         }*/
        return node;
    },

    properties: [{
            name: "Live-search",
            key: "livesearch",
            htmlAttr: "data-live-search",
            inputtype: CheckboxInput,
            init: function(node) {
                if (node.hasAttribute('data-live-search') && node.getAttribute('data-live-search') == "true") {
                    setTimeout(function() { $('#properties [data-key="livesearch"] #livesearch_check').prop('checked', true); }, 1300)
                }
            }
        },
        {
            name: "Actions-box",
            key: "actionsbox",
            htmlAttr: "data-actions-box",
            inputtype: CheckboxInput,
            init: function(node) {
                if (node.hasAttribute('data-actions-box') && node.getAttribute('data-actions-box') == "true") {
                    setTimeout(function() { $('#properties [data-key="actionsbox"] #actionsbox_check').prop('checked', true); }, 1300)
                }
            }
        },
        {
            name: "Required",
            key: "required",
            htmlAttr: "required",
            inputtype: CheckboxInput,
            init: function(node) {
                if (node.hasAttribute('required')) {
                    setTimeout(function() { $('#properties [data-key="required"] #required_check').prop('checked', true); }, 1300)
                }
            }
        },
        {
            name: "Reapetable",
            key: "reapetable",
            htmlAttr: "multiple",
            inputtype: CheckboxInput,
            init: function(node) {
                var attr = $(node).attr('multiple');
                // For some browsers, `attr` is undefined; for others,
                // `attr` is false.  Check for both.
                if (typeof attr !== 'undefined' && attr !== false) {
                    setTimeout(function() { $('#properties [data-key="reapetable"] #reapetable_check').prop('checked', true); }, 2000);
                }
            }
        },
        {
            name: "Max Options",
            key: "maxoptions",
            htmlAttr: "data-max-options",
            inputtype: TextInput
        },
        {
            name: "List of entities",
            key: "listent",
            inputtype: SelectInput,
            htmlAttr: "data-torelation",
            beforeInit: function(node) {

                //  console.log("beforeInit a", this.data.options);
                var _l = this;

                propert = [];
                angular
                    .injector(["ng", "main.app"])
                    .get("serviceEntity")
                    .chiama()
                    .then(function(ret) {
                        var listIndexes = ret;
                        // console.log("serviceEntity listIndexes", listIndexes);
                        //    console.log("beforeInit d");
                        propert.push({
                            value: "",
                            text: ""
                        });
                        for (key of listIndexes.values()) {
                            // console.log("serviceEntity listIndexes", key);
                            if (key != 'entity_relation')
                                propert.push({
                                    value: key,
                                    text: key
                                });
                        }
                        //     console.log("propert", _l, propert);
                        _l.data.options = propert;
                        //    console.log("propert2", _l.data.options, node);
                        //    var sel= $(node).attr("data-torelation");
                        //     console.log("seelzionato", sel);
                        return node;
                    });

                //
            },
            data: {
                extraclass: "btn-cccc",
                options: []
            }
        }, {
            name: "Searchable Label",
            key: "searchable-label",
            htmlAttr: "searchable-label",
            inputtype: TextInput
        }, {
            name: "Searchable Text",
            key: "searchable-text",
            htmlAttr: "searchable-text",
            inputtype: TextInput
        }, {
            name: "Searchable Element",
            key: "searchable-element",
            htmlAttr: "searchable-element",
            inputtype: CheckboxInput,
            init: function(node) {
                if (node.hasAttribute('searchable-element') && node.getAttribute('searchable-element') == "true") {
                    setTimeout(function() { $('#searchable-element_check').prop('checked', true); }, 1300)
                }
            }
        }, {
            name: "Searchable Multiple",
            key: "searchable-multiple",
            htmlAttr: "searchable-multiple",
            inputtype: CheckboxInput,
            init: function(node) {
                if (node.hasAttribute('searchable-multiple') && node.getAttribute('searchable-multiple') == "true") {
                    setTimeout(function() { $('#searchable-multiple_check').prop('checked', true); }, 2000)
                }
            }
        }
    ]
});
/* giaisg */
Vvveb.Components.extend("_base", "html/mytextinput", {
    name: "Dymer Input",
    //attributes: { "type": "text" },
    attributes: ["data-component-dymerinput"],
    image: "icons/text_input.svg",
    dragHtml: '<img src="' + Vvveb.baseUrl + 'icons/text_input.png">',
    html: '<div class="form-group"><label>Text</label><input data-component-dymerinput class="form-control" type="text" ></div></div>',
    properties: [{
            name: "Value",
            key: "value",
            htmlAttr: "value",
            inputtype: TextInput
        }, {
            name: "Placeholder",
            key: "placeholder",
            htmlAttr: "placeholder",
            inputtype: TextInput
        }, {
            name: "Type",
            key: "type",
            htmlAttr: "type",
            inputtype: SelectInput,
            validValues: ["button", "checkbox", "color", "date", "datetime-local", "email", "file", "hidden", "image", "month", "number", "password", "radio", "range", "reset", "search", "submit", "tel", "text", "time", "url", "week"],
            data: {
                options: [
                    { value: "text", text: "Text" },
                    { value: "button", text: "Button" },
                    { value: "checkbox", text: "Checkbox" },
                    { value: "color", text: "Color" },
                    { value: "date", text: "Date" },
                    { value: "datetime-local", text: "Datetime-local" },
                    { value: "email", text: "Email" },
                    { value: "file", text: "File" },
                    { value: "hidden", text: "Hidden" },
                    { value: "image", text: "Image" },
                    { value: "month", text: "Month" },
                    { value: "number", text: "Number" },
                    { value: "password", text: "Password" },
                    { value: "radio", text: "Radio" },
                    { value: "range", text: "Range" },
                    { value: "reset", text: "Reset" },
                    { value: "search", text: "Search" },
                    { value: "submit", text: "Submit" },
                    { value: "tel", text: "Tel" },
                    { value: "time", text: "Time" },
                    { value: "url", text: "Url" },
                    { value: "week", text: "Week" }
                ]
            }
        }, {
            name: "Required",
            key: "required",
            inputtype: CheckboxInput,
            init: function(node) {
                if (node.hasAttribute('required')) {
                    setTimeout(function() { $('#required_check').prop('checked', true); }, 2000)
                }
            }
        }, {
            name: "Searchable Label",
            key: "searchable-label",
            htmlAttr: "searchable-label",
            inputtype: TextInput
        }, {
            name: "Searchable Override",
            key: "searchable-override",
            htmlAttr: "searchable-override",
            inputtype: TextInput
        }, {
            name: "Searchable Text",
            key: "searchable-text",
            htmlAttr: "searchable-text",
            inputtype: TextInput
        }, {

            name: "Searchable Element",
            key: "searchable-element",
            htmlAttr: "searchable-element",
            inputtype: CheckboxInput,
            init: function(node) {
                if (node.hasAttribute('searchable-element') && node.getAttribute('searchable-element') == "true") {
                    setTimeout(function() { $('#searchable-element_check').prop('checked', true); }, 1300)
                }
            }

        },
        {
            name: "Searchable Multiple",
            key: "searchable-multiple",
            htmlAttr: "searchable-multiple",
            inputtype: CheckboxInput,
            init: function(node) {
                if (node.hasAttribute('searchable-multiple')) {
                    setTimeout(function() { $('#searchable-multiple_check').prop('checked', true); }, 2000)
                }
            }
        }
    ],
    onChange: function(node, property, value) {
        /*  if (property.key == "searchable-element") {
              if (value == true) {
                  $(node).attr("searchable-element", "");
              } else { $(node).removeAttr("searchable-element"); }
          } else*/
        if (property.key == "required") {
            if (value == true) {
                $(node).prop("required", true);
            } else { $(node).removeAttr("required"); }
        }
    }
});

/* fine giaisg */
Vvveb.Components.extend("_base", "dymer/kmstaxonomy", {
    name: "Taxonomy",
    attributes: ["data-component-kmstaxonomy"],
    image: "icons/dymer/taxonomy.svg",
    dragHtml: '<img src="' + Vvveb.baseUrl + 'icons/dymer/taxonomy.svg" height="50px">',
    html: '<div class="form-group">' +
        '<label for="description" class="kms-title-label">Taxonomy</label>' +
        '<div>' +
        '<div data-component-kmstaxonomy class="form-group dymertaxonomy" data-totaxonomy="">' +
        '<span  class="infotaxonomy">Taxonomy</span> <i class="fa fa-code-fork rotandflip infotaxonomy" aria-hidden="true"></i> <span contenteditable="false" class="totaxonomy infotaxonomy">......</span>' +
        '</div>' +
        '</div>',
    listent: false,
    reapetable: false,
    actionsbox: false,
    livesearch: false,
    maxoptions: "",

    init: function(node) {},

    onChange: function(node, property, value) {
        console.log(' property, value ', property.key, property, value);
        if (property.key == "required") {
            if (value == true) {
                $(node)[0].attributes.required.value = ""
            } else {
                $(node).removeAttr("required")
            }
        }

        if (property.key == "listent") {
            let vocabNames = property.data.options.find(o => o.value == value)

            $(node)
                .find(".totaxonomy")
                .html(vocabNames.text);
        }

        if (property.key == "reapetable") {
            this[property.key] = value;
            console.log('$(node)', $(node));
            if (this.reapetable) {
                $(node).attr("multiple", "");
            } else {
                $(node).removeAttr("multiple");
            }

        }
        if (property.key == "actionsbox") {
            if (value == true) {
                $(node).attr("data-actions-box", value);
            } else {
                $(node).removeAttr("data-actions-box")
            }
        }
        if (property.key == "livesearch") {
            if (value == false) {
                $(node).removeAttr("data-live-search")
            }
        }
        return node;
    },

    properties: [{
            name: "Live-search",
            key: "livesearch",
            htmlAttr: "data-live-search",
            inputtype: CheckboxInput,
            init: function(node) {
                if (node.hasAttribute('data-live-search') && node.getAttribute('data-live-search') == "true") {
                    setTimeout(function() { $('#properties [data-key="livesearch"] #livesearch_check').prop('checked', true); }, 1300)
                }
            }
        },
        {
            name: "Actions-box",
            key: "actionsbox",
            htmlAttr: "data-actions-box",
            inputtype: CheckboxInput,
            init: function(node) {
                if (node.hasAttribute('data-actions-box') && node.getAttribute('data-actions-box') == "true") {
                    setTimeout(function() { $('#properties [data-key="actionsbox"] #actionsbox_check').prop('checked', true); }, 1300)
                }
            }
        },
        {
            name: "Required",
            key: "required",
            htmlAttr: "required",
            inputtype: CheckboxInput,
            init: function(node) {
                if (node.hasAttribute('required')) {
                    //setTimeout(function () { $('#required_check').prop('checked', true); }, 2000)
                    setTimeout(function() { $('#properties [data-key="required"] #required_check').prop('checked', true); }, 1300)
                }
            },
        },
        {
            name: "Reapetable",
            key: "reapetable",
            htmlAttr: "multiple",
            inputtype: CheckboxInput,
            init: function(node) {
                var attr = $(node).attr('multiple');
                // For some browsers, `attr` is undefined; for others,
                // `attr` is false.  Check for both.
                if (typeof attr !== 'undefined' && attr !== false) {
                    setTimeout(function() { $('#properties [data-key="reapetable"] #reapetable_check').prop('checked', true); }, 2000);
                }
            }
        },
        {
            name: "Max Options",
            key: "maxoptions",
            htmlAttr: "data-max-options",
            inputtype: TextInput
        },
        {
            name: "List of vocabularies",
            key: "listent",
            inputtype: SelectInput,
            htmlAttr: "data-totaxonomy",
            beforeInit: function(node) {
                var _l = this;

                propert = [];
                angular
                    .injector(["ng", "mainTax.app"])
                    .get("serviceTaxonomy")
                    .chiama()
                    .then(function(ret) {

                        var listVocabularies = ret;

                        // console.log("serviceTaxonomy listVocabularies", listVocabularies);
                        //    console.log("beforeInit d");
                        propert.push({
                            value: "",
                            text: ""
                        });
                        for (key of listVocabularies.values()) {
                            propert.push({
                                value: key._id,
                                text: key.title,
                            });
                        }
                        _l.data.options = propert;

                        return node;
                    }).catch(e => {
                        console.log("Error: ", e)
                    });

            },
            data: {
                extraclass: "btn-cccc",
                options: []
            }
        },
        {
            name: "Searchable Label",
            key: "searchable-label",
            htmlAttr: "searchable-label",
            inputtype: TextInput
        }, {
            name: "Searchable Text",
            key: "searchable-text",
            htmlAttr: "searchable-text",
            inputtype: TextInput
        }, {
            name: "Searchable Element",
            key: "searchable-element",
            htmlAttr: "searchable-element",
            inputtype: CheckboxInput,
            init: function(node) {
                if (node.hasAttribute('searchable-element') && node.getAttribute('searchable-element') == "true") {
                    setTimeout(function() { $('#searchable-element_check').prop('checked', true); }, 1300)
                }
            }
        }, {
            name: "Searchable Multiple",
            key: "searchable-multiple",
            htmlAttr: "searchable-multiple",
            inputtype: CheckboxInput,
            init: function(node) {
                if (node.hasAttribute('searchable-multiple') && node.getAttribute('searchable-multiple') == "true") {
                    setTimeout(function() { $('#searchable-multiple_check').prop('checked', true); }, 2000)
                }
            }
        }
    ]
});


Vvveb.Components.extend("_base", "html/dmodelentitytags", {
    name: "Entity Tags",
    image: "icons/dymer/hashtag.svg",
    html: '<label class="kms-title-label">Tags</label>' +
        '<div class="form-group repeatable first-repeatable">' +
        '<div>' +
        '<label for="description" class=" ">Tag Name</label>' +
        '<input type="text" class="form-control col-12 span12" name="data[hashtags][0]">' +
        '<small class="form-text text-muted">Insert tag</small>' +
        '</div>' +
        '<div class="action-br">' +
        '<span class="btn  btn-outline-primary  btn-sm" onclick="cloneRepeatable($(this))">+</span>' +
        '<span class="btn  btn-outline-danger  btn-sm act-remove" onclick="removeRepeatable($(this))">-</span>' +
        '</div>' +
        '</div>'
});
Vvveb.Components.extend("_base", "html/dtemplateentitytags", {
    name: "Tags",
    image: "icons/dymer/hashtag.svg",
    html: '<div  class="row dwhashlist"> ' +
        '{{{DymerViewTags this.hashtags}}}' +
        '</div>'
});
Vvveb.Components.extend("_base", "html/dentitylink", {
    name: "Link Details",
    //attributes: { "type": "text" },
    // attributes: ["data-component-dentitylink"],
    image: "icons/dymer/eye.svg",
    html: '<span   class="pull-right text-info " style="padding-top: 10px;cursor:pointer" title="" onclick="kmsrenderdetail(&quot;{{_id}}&quot;)">' +
        'View More' +
        '</span>'
});
Vvveb.Components.extend("_base", "html/dimage", {
    nodes: ["img"],
    name: "Dymer Image",
    html: '<img src="{{cdnpath}}api/entities/api/v1/entity/content/{{<object-key>.id}}"  >',
    /*
    afterDrop: function (node)
    {
        node.attr("src", '');
        return node;
    },*/
    image: "icons/image.svg",
    properties: [{
        name: "Image",
        key: "src",
        htmlAttr: "src",
        inputtype: ImageInput
    }, {
        name: "Width",
        key: "width",
        htmlAttr: "width",
        inputtype: TextInput
    }, {
        name: "Height",
        key: "height",
        htmlAttr: "height",
        inputtype: TextInput
    }, {
        name: "Alt",
        key: "alt",
        htmlAttr: "alt",
        inputtype: TextInput
    }]
});