/*
Copyright 2017 Ziadin Givan

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

https://github.com/givanz/VvvebJs
*/


// Simple JavaScript Templating
// John Resig - https://johnresig.com/ - MIT Licensed
(function() {
    var cache = {};

    this.tmpl = function tmpl(str, data) {

        var fn = /^[-a-zA-Z0-9]+$/.test(str) ?
            cache[str] = cache[str] ||
            tmpl(document.getElementById(str).innerHTML) :
            new Function("obj",
                "var p=[],print=function(){p.push.apply(p,arguments);};" +
                "with(obj){p.push('" +
                str
                .replace(/[\r\t\n]/g, " ")
                .split("{%").join("\t")
                .replace(/((^|%})[^\t]*)'/g, "$1\r")
                .replace(/\t=(.*?)%}/g, "',$1,'")
                .split("\t").join("');")
                .split("%}").join("p.push('")
                .split("\r").join("\\'") +
                "');}return p.join('');");
        // Provide some basic currying to the user

        return data ? fn(data) : fn;
    };
})();

var delay = (function() {
    var timer = 0;
    return function(callback, ms) {
        clearTimeout(timer);
        timer = setTimeout(callback, ms);
    };
})();

function getStyle(el, styleProp) {
    value = "";
    //var el = document.getElementById(el);
    if (el.style && el.style.length > 0 && el.style[styleProp]) //check inline
        var value = el.style[styleProp];
    else
    if (el.currentStyle) //check defined css
        var value = el.currentStyle[styleProp];
    else if (window.getComputedStyle) {
        var value = document.defaultView.getDefaultComputedStyle ?
            document.defaultView.getDefaultComputedStyle(el, null).getPropertyValue(styleProp) :
            window.getComputedStyle(el, null).getPropertyValue(styleProp);
    }

    return value;
}

function isElement(obj) {
    return (typeof obj === "object") &&
        (obj.nodeType === 1) && (typeof obj.style === "object") &&
        (typeof obj.ownerDocument === "object") /* && obj.tagName != "BODY"*/ ;
}


var isIE11 = !!window.MSInputMethodContext && !!document.documentMode;
let uuidfile = "";
$.get(serverUrl + "/api/entities/uuid", function(rtU) {
    //console.log('rtU', rtU.data);
    //console.log('rtU.uuid', rtU.data.uuid);
    uuidfile = rtU.data.uuid;
});
if (Vvveb === undefined) var Vvveb = {};

Vvveb.defaultComponent = "_base";
Vvveb.preservePropertySections = true;
Vvveb.dragIcon = 'icon'; //icon = use component icon when dragging | html = use component html to create draggable element
Vvveb.baseUrl = document.currentScript ? document.currentScript.src.replace(/[^\/]*?\.js$/, '') : '';

Vvveb.ComponentsGroup = {};
Vvveb.BlocksGroup = {};
Vvveb.listResources = {
    _structures: [],
    _models: [],
    _templates: [],
    _templatesType: {
        "en": {
            "fullcontent": {
                title: "Full content"
            },
            "teaserlist": {
                title: "Preview in List"
            },
            "teasermap": {
                title: "Preview in Map"
            },
            "teaser": {
                title: "General Preview"
            }
        }
    },
    _baseTemplates: {
        "templates": {
            "fullcontent": {
                path: "public/assets/wsbuilder/libs/builder/dymer-basetemplate-template-fullcontent.html"
            },
            "teaserlist": {
                path: "public/assets/wsbuilder/libs/builder/dymer-basetemplate-template-teaserlist.html"
            },
            "teasermap": {
                path: "public/assets/wsbuilder/libs/builder/dymer-basetemplate-template-teasermap.html"
            },
            "teaser": {
                path: "public/assets/wsbuilder/libs/builder/dymer-basetemplate-template-teaser.html"
            }
        },
        "models": {
            "standard": {
                path: "public/assets/wsbuilder/libs/builder/dymer-basetemplate-form.html"
            }
        }
    },
    getCaseTemplatesPath(type) {
        return this._baseTemplates[Vvveb.editorType][type].path;
    },
    getTitleTemplate: function(type) {
        //console.log('getTitleTemplate', type, this._templatesType["en"][type].title);
        return this._templatesType["en"][type].title;
    },
    setTemplates: function(list) {
        this._templates = list;
    },
    setModels: function(list) {
        this._models = list;
    },
    setStructures: function(list) {
        this._structures = list;
    },
    getStructures: function() {
        return this._structures;
    },
    getStructure: function(key) {
        //   console.log('la lista è', this._structures, key);
        return this._structures[key];
    },
    getTemplates: function() {
        return this._templates;
    },
    getModels: function() {
        return this._models;
    },
    getTitleModelFromIndex: function(index) {

        var list = this.getModels();
        //console.log('getTitleModelFromIndex', list, index);
        for (var i = 0; i < list.length; i++) {

            for (var j = 0; j < list[i].instance.length; j++) {

                if (list[i].instance[j]._index == index) {
                    return list[i].title;
                }

            }
        }

    }
};
Vvveb.Components = {

    _components: {},

    _nodesLookup: {},

    _attributesLookup: {},

    _classesLookup: {},

    _classesRegexLookup: {},

    componentPropertiesElement: "#right-panel .component-properties",

    get: function(type) {
        return this._components[type];
    },

    add: function(type, data) {
        data.type = type;

        this._components[type] = data;

        if (data.nodes) {
            for (var i in data.nodes) {
                this._nodesLookup[data.nodes[i]] = data;
            }
        }

        if (data.attributes) {
            if (data.attributes.constructor === Array) {
                for (var i in data.attributes) {
                    this._attributesLookup[data.attributes[i]] = data;
                }
            } else {
                for (var i in data.attributes) {
                    if (typeof this._attributesLookup[i] === 'undefined') {
                        this._attributesLookup[i] = {};
                    }

                    if (typeof this._attributesLookup[i][data.attributes[i]] === 'undefined') {
                        this._attributesLookup[i][data.attributes[i]] = {};
                    }

                    this._attributesLookup[i][data.attributes[i]] = data;
                }
            }
        }

        if (data.classes) {
            for (var i in data.classes) {
                this._classesLookup[data.classes[i]] = data;
            }
        }

        if (data.classesRegex) {
            for (var i in data.classesRegex) {
                this._classesRegexLookup[data.classesRegex[i]] = data;
            }
        }
    },

    extend: function(inheritType, type, data) {

        var newData = data;

        if (inheritData = this._components[inheritType]) {
            newData = $.extend(true, {}, inheritData, data);
            newData.properties = $.merge($.merge([], inheritData.properties ? inheritData.properties : []), data.properties ? data.properties : []);
        }

        //sort by order
        newData.properties.sort(function(a, b) {
            if (typeof a.sort === "undefined") a.sort = 0;
            if (typeof b.sort === "undefined") b.sort = 0;

            if (a.sort < b.sort)
                return -1;
            if (a.sort > b.sort)
                return 1;
            return 0;
        });
        /*		 
                var output = array.reduce(function(o, cur) {

                  // Get the index of the key-value pair.
                  var occurs = o.reduce(function(n, item, i) {
                    return (item.key === cur.key) ? i : n;
                  }, -1);

                  // If the name is found,
                  if (occurs >= 0) {

                    // append the current value to its list of values.
                    o[occurs].value = o[occurs].value.concat(cur.value);

                  // Otherwise,
                  } else {

                    // add the current item to o (but make sure the value is an array).
                    var obj = {name: cur.key, value: [cur.value]};
                    o = o.concat([obj]);
                  }

                  return o;
                }, newData.properties);		 
        */

        this.add(type, newData);
    },


    matchNode: function(node) {
        var component = {};

        if (!node || !node.tagName) return false;

        if (node.attributes && node.attributes.length) {
            //search for attributes
            for (var i in node.attributes) {
                if (node.attributes[i]) {
                    attr = node.attributes[i].name;
                    value = node.attributes[i].value;

                    if (attr in this._attributesLookup) {
                        component = this._attributesLookup[attr];

                        //currently we check that is not a component by looking at name attribute
                        //if we have a collection of objects it means that attribute value must be checked
                        if (typeof component["name"] === "undefined") {
                            if (value in component) {
                                return component[value];
                            }
                        } else
                            return component;
                    }
                }
            }

            for (var i in node.attributes) {
                attr = node.attributes[i].name;
                value = node.attributes[i].value;

                //check for node classes
                if (attr == "class") {
                    classes = value.split(" ");

                    for (j in classes) {
                        if (classes[j] in this._classesLookup)
                            return this._classesLookup[classes[j]];
                    }

                    for (regex in this._classesRegexLookup) {
                        regexObj = new RegExp(regex);
                        if (regexObj.exec(value)) {
                            return this._classesRegexLookup[regex];
                        }
                    }
                }
            }
        }

        tagName = node.tagName.toLowerCase();
        if (tagName in this._nodesLookup) return this._nodesLookup[tagName];

        return false;
        //return false;
    },

    render: function(type) {

        var component = this._components[type];

        var rightPanel = jQuery(this.componentPropertiesElement);
        var section = rightPanel.find('.section[data-section="default"]');

        if (!(Vvveb.preservePropertySections && section.length)) {
            rightPanel.html('').append(tmpl("vvveb-input-sectioninput", { key: "default", header: component.name }));
            section = rightPanel.find(".section");
        }

        rightPanel.find('[data-header="default"] span').html(component.name);
        section.html("")

        if (component.beforeInit) component.beforeInit(Vvveb.Builder.selectedEl.get(0));

        var element;

        var fn = function(component, property) {
            return property.input.on('propertyChange', function(event, value, input) {

                var element = Vvveb.Builder.selectedEl;

                if (property.child) element = element.find(property.child);
                if (property.parent) element = element.parent(property.parent);

                if (property.onChange) {
                    element = property.onChange(element, value, input, component);
                } /* else */
                if (property.htmlAttr) {
                    oldValue = element.attr(property.htmlAttr);

                    if (property.htmlAttr == "class" && property.validValues) {
                        element.removeClass(property.validValues.join(" "));
                        element = element.addClass(value);
                    } else if (property.htmlAttr == "style") {
                        element = element.css(property.key, value);
                    } else {
                        element = element.attr(property.htmlAttr, value);
                    }

                    Vvveb.Undo.addMutation({
                        type: 'attributes',
                        target: element.get(0),
                        attributeName: property.htmlAttr,
                        oldValue: oldValue,
                        newValue: element.attr(property.htmlAttr)
                    });
                }

                if (component.onChange) {
                    element = component.onChange(element, property, value, input);
                }

                if (!property.child && !property.parent) Vvveb.Builder.selectNode(element);

                return element;
            });
        };

        var nodeElement = Vvveb.Builder.selectedEl;

        for (var i in component.properties) {
            var property = component.properties[i];
            var element = nodeElement;

            if (property.beforeInit) property.beforeInit(element.get(0))

            if (property.child) element = element.find(property.child);

            if (property.data) {
                property.data["key"] = property.key;
            } else {
                property.data = { "key": property.key };
            }

            if (typeof property.group === 'undefined') property.group = null;

            property.input = property.inputtype.init(property.data);

            if (property.init) {
                property.inputtype.setValue(property.init(element.get(0)));
            } else if (property.htmlAttr) {
                if (property.htmlAttr == "style") {
                    //value = element.css(property.key);//jquery css returns computed style
                    var value = getStyle(element.get(0), property.key); //getStyle returns declared style
                } else {
                    var value = element.attr(property.htmlAttr);
                }

                //if attribute is class check if one of valid values is included as class to set the select
                if (value && property.htmlAttr == "class" && property.validValues) {
                    value = value.split(" ").filter(function(el) {
                        return property.validValues.indexOf(el) != -1
                    });
                }

                property.inputtype.setValue(value);
            }

            fn(component, property);

            if (property.inputtype == SectionInput) {
                section = rightPanel.find('.section[data-section="' + property.key + '"]');

                if (Vvveb.preservePropertySections && section.length) {
                    section.html("");
                } else {
                    rightPanel.append(property.input);
                    section = rightPanel.find('.section[data-section="' + property.key + '"]');
                }
            } else {
                var row = $(tmpl('vvveb-property', property));
                row.find('.input').append(property.input);
                section.append(row);
            }

            if (property.inputtype.afterInit) {
                property.inputtype.afterInit(property.input);
            }

        }

        if (component.init) component.init(Vvveb.Builder.selectedEl.get(0));
    }
};


Vvveb.Blocks = {

    _blocks: {},

    get: function(type) {
        return this._blocks[type];
    },

    add: function(type, data) {
        data.type = type;
        this._blocks[type] = data;
    },
};



Vvveb.WysiwygEditor = {

    isActive: false,
    oldValue: '',
    doc: false,

    init: function(doc) {
        this.doc = doc;
        $("#bold-btn").on("click", function(e) {
            doc.execCommand('bold', false, null);
            e.preventDefault();
            return false;
        });

        $("#italic-btn").on("click", function(e) {
            doc.execCommand('italic', false, null);
            e.preventDefault();
            return false;
        });

        $("#underline-btn").on("click", function(e) {
            doc.execCommand('underline', false, null);
            e.preventDefault();
            return false;
        });

        $("#strike-btn").on("click", function(e) {
            doc.execCommand('strikeThrough', false, null);
            e.preventDefault();
            return false;
        });

        $("#link-btn").on("click", function(e) {
            doc.execCommand('createLink', false, "#");
            e.preventDefault();
            return false;
        });
    },

    undo: function(element) {
        this.doc.execCommand('undo', false, null);
    },

    redo: function(element) {
        this.doc.execCommand('redo', false, null);
    },

    edit: function(element) {
        element.attr({ 'contenteditable': true, 'spellcheckker': false });
        $("#wysiwyg-editor").show();

        this.element = element;
        this.isActive = true;
        this.oldValue = element.html();
    },

    destroy: function(element) {
        element.removeAttr('contenteditable spellcheckker');
        $("#wysiwyg-editor").hide();
        this.isActive = false;


        node = this.element.get(0);
        Vvveb.Undo.addMutation({
            type: 'characterData',
            target: node,
            oldValue: this.oldValue,
            newValue: node.innerHTML
        });
    }
}

Vvveb.Builder = {

    component: {},
    dragMoveMutation: false,
    isPreview: false,
    runJsOnSetHtml: false,
    designerMode: false,

    init: function(url, callback, actualPage) {

        var self = this;

        self.loadControlGroups();
        self.loadBlockGroups();

        self.selectedEl = null;
        self.highlightEl = null;
        self.initCallback = callback;

        self.documentFrame = $("#iframe-wrapper > iframe");
        self.canvas = $("#canvas");

        self._loadIframe(url, actualPage);

        self._initDragdrop();

        self._initBox();

        self.dragElement = null;
    },

    /* controls */
    loadControlGroups: function() {
        //console.log('Vvveb.editorType', Vvveb.editorType);
        componentsList = $("#components-list");
        componentsList.empty();
        var item = {},
            component = {};

        for (group in Vvveb.ComponentsGroup) {
            switch (Vvveb.editorType) {
                case "models":
                    if (group == "Dymer Template")
                        continue;
                    break;
                case "templates":
                    if (group == "Dymer Model")
                        continue;
                    break;
                default:

            }
            componentsList.append('<li class="header" data-section="' + group + '" aria-expanded="false" data-search=""><label class="header" for="comphead_' + group + '">' + group + '  <div class="header-arrow"></div>\
								   </label><input class="header_check" type="checkbox"  id="comphead_' + group + '">  <ol></ol></li>');

            componentsSubList = componentsList.find('li[data-section="' + group + '"]  ol');

            components = Vvveb.ComponentsGroup[group];

            for (i in components) {
                componentType = components[i];
                component = Vvveb.Components.get(componentType);

                if (component) {
                    item = $('<li data-section="' + group + '" data-drag-type=component data-type="' + componentType + '" data-search="' + component.name.toLowerCase() + '"><a href="#">' + component.name + "</a></li>");

                    if (component.image) {

                        item.css({
                            backgroundImage: "url(" + 'public/assets/wsbuilder/libs/builder/' + component.image + ")",
                            backgroundRepeat: "no-repeat"
                        })
                    }

                    componentsSubList.append(item)
                }
            }
        }
    },

    loadBlockGroups: function() {

        blocksList = $("#blocks-list");
        blocksList.empty();
        var item = {};

        for (group in Vvveb.BlocksGroup) {
            blocksList.append('<li class="header" data-section="' + group + '"  data-search=""><label class="header" for="blockhead_' + group + '">' + group + '  <div class="header-arrow"></div>\
								   </label><input class="header_check" type="checkbox"  id="blockhead_' + group + '">  <ol></ol></li>');

            blocksSubList = blocksList.find('li[data-section="' + group + '"]  ol');
            blocks = Vvveb.BlocksGroup[group];

            for (i in blocks) {
                blockType = blocks[i];
                block = Vvveb.Blocks.get(blockType);

                if (block) {
                    item = $('<li data-section="' + group + '" data-drag-type=block data-type="' + blockType + '" data-search="' + block.name.toLowerCase() + '"><a href="#">' + block.name + "</a></li>");

                    if (block.image) {

                        item.css({
                            backgroundImage: "url(" + ((block.image.indexOf('//') == -1) ? 'libs/builder/' : '') + block.image + ")",
                            backgroundRepeat: "no-repeat"
                        })
                    }

                    blocksSubList.append(item)
                }
            }
        }
    },

    /*  loadUrl: function(url, callback, pagedetail) {
          jQuery("#select-box").hide();
          console.log('loadUrl', url, callback, pagedetail);
          self.initCallback = callback;
          Vvveb.Builder.pagedetail = pagedetail;
          $(Vvveb.Builder.iframe).hide();
          if (Vvveb.Builder.iframe.src != url) {
              Vvveb.Builder.iframe.src = url
              $(Vvveb.Builder.iframe).show();
          };
      },*/
    loadUrl: function(url, callback) {
        var self = this;
        jQuery("#select-box").hide();

        self.initCallback = callback;
        if (Vvveb.Builder.iframe.src != url) Vvveb.Builder.iframe.src = url;
    },
    /* iframe */
    _loadIframe: function(url, actualPage) {

        var self = this;
        self.iframe = this.documentFrame.get(0);
        self.iframe.src = url;
        return this.documentFrame.on("load", function() {

            window.FrameWindow = self.iframe.contentWindow;
            //		console.log("window.FrameWindow", window.FrameWindow); 
            //	console.log("window.FrameDocument", self.iframe.contentWindow.document);
            //	window.FrameDocument = self.iframe.contentDocument ? self.iframe.contentDocument : self.iframe.contentWindow.document;
            //		console.log("window.FrameDocument", window.FrameDocument);
            //	console.log("window.FrameDocument", self.iframe.contentWindow.document);
            window.FrameDocument = self.iframe.contentWindow.document;
            /*	 var myFrame = $("#myframe").contents().find('body');
        var textareaValue = $("textarea").val();*/
            $(window.FrameWindow).on("beforeunload", function(event) {
                event.preventDefault();
                if (Vvveb.Undo.undoIndex <= 0) {
                    var dialogText = "You have unsaved changes  ";
                    event.returnValue = dialogText;
                    /*	console.log("secondo",event,event.returnValue);
                        $('#confirm-modal').modal().find(".modal-body").html("File saved! ");
                	
                        $('#confirm-modal').on('show.bs.modal', function (e) {
                            if (!data) return e.preventDefault() // stops modal from being shown
                            console.log("data",data);
                        })*/
                    event.returnValue = '';
                    //	return dialogText;
                }

            });

            jQuery(window.FrameWindow).on("scroll resize", function(event) {

                if (self.selectedEl) {
                    var offset = self.selectedEl.offset();

                    jQuery("#select-box").css({
                        "top": offset.top - self.frameDoc.scrollTop(),
                        "left": offset.left - self.frameDoc.scrollLeft(),
                        "width": self.selectedEl.outerWidth(),
                        "height": self.selectedEl.outerHeight(),
                        //"display": "block"
                    });

                }

                if (self.highlightEl) {
                    var offset = self.highlightEl.offset();

                    jQuery("#highlight-box").css({
                        "top": offset.top - self.frameDoc.scrollTop(),
                        "left": offset.left - self.frameDoc.scrollLeft(),
                        "width": self.highlightEl.outerWidth(),
                        "height": self.highlightEl.outerHeight(),
                        //"display": "block"
                    });
                }
            });
            var htmlHead =
                '\n<meta charset="utf-8">' +
                '\n<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">' +
                '\n<meta name="description" content="">' +
                '\n<meta name="author" content="">' +
                '\n<link href="' + site_prefix + '/public/assets/wsbuilder/css/editor.css" rel="stylesheet">';

            if (Vvveb.FileManager.pagedetail != undefined) {
                if (Vvveb.FileManager.pagedetail.hasOwnProperty('assets')) {
                    if (Vvveb.FileManager.pagedetail.assets.length > 0) {
                        Vvveb.FileManager.pagedetail.assets.forEach(element => {
                            //  console.log("elementX", element);
                            if (element.name.includes(".css"))
                                htmlHead += '<link href="' + element.url + element.id + '" rel="stylesheet">\n';
                            else
                                htmlHead += '<script src="' + element.url + element.id + '"></script>\n';

                        });
                    }
                }
            }

            //	self.frameHead = htmlHead;
            $(window.FrameDocument).find("head").html(htmlHead);

            Vvveb.WysiwygEditor.init(window.FrameDocument);
            if (self.initCallback) self.initCallback();

            return self._frameLoaded();
        });

    },

    _frameLoaded: function() {

        var self = Vvveb.Builder;
        //		console.log("_frameLoaded", self, window);
        //		console.log("_frameLoaded FrameDocument", $(window.FrameDocument));
        //		console.log("_frameLoaded html", $(window.FrameDocument).find("html"), $(window.FrameDocument).find("html").html());
        //		console.log("_frameLoaded body", $(window.FrameDocument).find("body"), $(window.FrameDocument).find("body").html());
        //		console.log("_frameLoaded head", $(window.FrameDocument).find("head"), $(window.FrameDocument).find("head").html());

        //var	mod = $(window.FrameDocument).find("body");
        //		mod.append("<div>CIAOOOOOOOOO</div>");

        self.frameDoc = $(window.FrameDocument);
        self.frameHtml = $(window.FrameDocument).find("html");
        self.frameBody = $(window.FrameDocument).find("body");


        //	self.frameHead = htmlHead;
        //	$(window.FrameDocument).find("head").html(htmlHead);
        self.frameHead = $(window.FrameDocument).find("head");
        //	console.log("vveb _frameLoaded2", self);
        //insert editor helpers like non editable areas
        self.frameHead.append('<link data-vvveb-helpers href="' + Vvveb.baseUrl + '../../css/vvvebjs-editor-helpers.css" rel="stylesheet">');

        self._initHighlight();
    },

    _getElementType: function(el) {

        //search for component attribute
        componentName = '';

        if (el.attributes)
            for (var j = 0; j < el.attributes.length; j++) {

                if (el.attributes[j].nodeName.indexOf('data-component') > -1) {
                    componentName = el.attributes[j].nodeName.replace('data-component-', '');
                }
            }

        if (componentName != '') return componentName;

        return el.tagName;
    },

    loadNodeComponent: function(node) {
        data = Vvveb.Components.matchNode(node);
        var component;

        if (data)
            component = data.type;
        else
            component = Vvveb.defaultComponent;

        Vvveb.Components.render(component);

    },

    selectNode: function(node) {
        var self = this;

        if (!node) {
            jQuery("#select-box").hide();
            return;
        }

        if (self.texteditEl && self.selectedEl.get(0) != node) {
            Vvveb.WysiwygEditor.destroy(self.texteditEl);
            jQuery("#select-box").removeClass("text-edit").find("#select-actions").show();
            self.texteditEl = null;
        }

        var target = jQuery(node);

        if (target) {
            self.selectedEl = target;

            try {
                var offset = target.offset();

                jQuery("#select-box").css({
                    "top": offset.top - self.frameDoc.scrollTop(),
                    "left": offset.left - self.frameDoc.scrollLeft(),
                    "width": target.outerWidth(),
                    "height": target.outerHeight(),
                    "display": "block",
                });
            } catch (err) {
                console.log(err);
                return false;
            }
        }

        jQuery("#highlight-name").html(this._getElementType(node));

    },

    /* iframe highlight */
    _initHighlight: function() {

        var self = Vvveb.Builder;

        self.frameHtml.on("mousemove touchmove", function(event) {

            if (event.target && isElement(event.target) && event.originalEvent) {
                self.highlightEl = target = jQuery(event.target);
                var offset = target.offset();
                var height = target.outerHeight();
                var halfHeight = Math.max(height / 2, 50);
                var width = target.outerWidth();
                var halfWidth = Math.max(width / 2, 50);

                var x = (event.clientX || event.originalEvent.clientX);
                var y = (event.clientY || event.originalEvent.clientY);

                if (self.isDragging) {
                    var parent = self.highlightEl;
                    var parentOffset = { left: 0, top: 0 };
                    if (parent.css("position") == "relative") parentOffset = parent.offset();

                    try {
                        if (event.originalEvent) {
                            if ((offset.top < (y - halfHeight)) || (offset.left < (x - halfWidth))) {
                                if (isIE11)
                                    self.highlightEl.append(self.dragElement);
                                else
                                    self.dragElement.appendTo(parent);
                            } else {
                                if (isIE11)
                                    self.highlightEl.prepend(self.dragElement);
                                else
                                    self.dragElement.prependTo(parent);
                            };

                            if (self.designerMode) {
                                self.dragElement.css({
                                    "position": "absolute",
                                    'left': x - (parentOffset.left - self.frameDoc.scrollLeft()),
                                    'top': y - (parentOffset.top - self.frameDoc.scrollTop()),
                                });
                            }
                        }

                    } catch (err) {
                        console.log(err);
                        return false;
                    }

                    if (!self.designerMode && self.iconDrag) self.iconDrag.css({ 'left': x + 275 /*left panel width*/ , 'top': y - 30 });
                } // else //uncomment else to disable parent highlighting when dragging
                {

                    jQuery("#highlight-box").css({
                        "top": offset.top - self.frameDoc.scrollTop(),
                        "left": offset.left - self.frameDoc.scrollLeft(),
                        "width": width,
                        "height": height,
                        "display": event.target.hasAttribute('contenteditable') ? "none" : "block",
                        "border": self.isDragging ? "1px dashed aqua" : "", //when dragging highlight parent with green
                    });

                    jQuery("#highlight-name").html(self._getElementType(event.target));
                    if (self.isDragging) jQuery("#highlight-name").hide();
                    else jQuery("#highlight-name").show(); //hide tag name when dragging
                }
            }

        });

        self.frameHtml.on("mouseup touchend", function(event) {
            if (self.isDragging) {
                self.isDragging = false;
                if (self.iconDrag) self.iconDrag.remove();
                $("#component-clone").remove();

                if (self.component.dragHtml) //if dragHtml is set for dragging then set real component html
                {
                    newElement = $(self.component.html);
                    self.dragElement.replaceWith(newElement);
                    self.dragElement = newElement;
                }
                if (self.component.afterDrop) self.dragElement = self.component.afterDrop(self.dragElement);

                self.dragElement.css("border", "");

                node = self.dragElement.get(0);
                self.selectNode(node);
                self.loadNodeComponent(node);

                if (self.dragMoveMutation === false) {
                    Vvveb.Undo.addMutation({
                        type: 'childList',
                        target: node.parentNode,
                        addedNodes: [node],
                        nextSibling: node.nextSibling
                    });
                } else {
                    self.dragMoveMutation.newParent = node.parentNode;
                    self.dragMoveMutation.newNextSibling = node.nextSibling;

                    Vvveb.Undo.addMutation(self.dragMoveMutation);
                    self.dragMoveMutation = false;
                }
            }
        });

        self.frameHtml.on("dblclick", function(event) {

            if (Vvveb.Builder.isPreview == false) {
                self.texteditEl = target = jQuery(event.target);

                Vvveb.WysiwygEditor.edit(self.texteditEl);

                self.texteditEl.attr({ 'contenteditable': true, 'spellcheckker': false });

                self.texteditEl.on("blur keyup paste input", function(event) {

                    jQuery("#select-box").css({
                        "width": self.texteditEl.outerWidth(),
                        "height": self.texteditEl.outerHeight()
                    });
                });

                jQuery("#select-box").addClass("text-edit").find("#select-actions").hide();
                jQuery("#highlight-box").hide();
            }
        });


        self.frameHtml.on("click", function(event) {

            if (Vvveb.Builder.isPreview == false) {
                if (event.target) {
                    //if component properties is loaded in left panel tab instead of right panel show tab
                    if ($(".component-properties-tab").is(":visible")) //if properites tab is enabled/visible 
                        $('.component-properties-tab a').show().tab('show');

                    self.selectNode(event.target);
                    self.loadNodeComponent(event.target);
                }

                event.preventDefault();
                return false;
            }

        });

    },

    _initBox: function() {
        var self = this;

        $("#drag-btn").on("mousedown", function(event) {
            jQuery("#select-box").hide();
            self.dragElement = self.selectedEl;
            self.isDragging = true;

            node = self.dragElement.get(0);


            self.dragMoveMutation = {
                type: 'move',
                target: node,
                oldParent: node.parentNode,
                oldNextSibling: node.nextSibling
            };

            //self.selectNode(false);
            event.preventDefault();
            return false;
        });

        $("#down-btn").on("click", function(event) {
            jQuery("#select-box").hide();

            node = self.selectedEl.get(0);
            oldParent = node.parentNode;
            oldNextSibling = node.nextSibling;

            next = self.selectedEl.next();

            if (next.length > 0) {
                next.after(self.selectedEl);
            } else {
                self.selectedEl.parent().after(self.selectedEl);
            }

            newParent = node.parentNode;
            newNextSibling = node.nextSibling;

            Vvveb.Undo.addMutation({
                type: 'move',
                target: node,
                oldParent: oldParent,
                newParent: newParent,
                oldNextSibling: oldNextSibling,
                newNextSibling: newNextSibling
            });

            event.preventDefault();
            return false;
        });

        $("#up-btn").on("click", function(event) {
            jQuery("#select-box").hide();

            node = self.selectedEl.get(0);
            oldParent = node.parentNode;
            oldNextSibling = node.nextSibling;

            next = self.selectedEl.prev();

            if (next.length > 0) {
                next.before(self.selectedEl);
            } else {
                self.selectedEl.parent().before(self.selectedEl);
            }

            newParent = node.parentNode;
            newNextSibling = node.nextSibling;

            Vvveb.Undo.addMutation({
                type: 'move',
                target: node,
                oldParent: oldParent,
                newParent: newParent,
                oldNextSibling: oldNextSibling,
                newNextSibling: newNextSibling
            });

            event.preventDefault();
            return false;
        });

        $("#clone-btn").on("click", function(event) {

            clone = self.selectedEl.clone();

            self.selectedEl.after(clone);

            self.selectedEl = clone.click();

            node = clone.get(0);
            Vvveb.Undo.addMutation({
                type: 'childList',
                target: node.parentNode,
                addedNodes: [node],
                nextSibling: node.nextSibling
            });

            event.preventDefault();
            return false;
        });

        $("#parent-btn").on("click", function(event) {

            node = self.selectedEl.parent().get(0);

            self.selectNode(node);

            self.loadNodeComponent(node);

            event.preventDefault();
            return false;
        });

        $("#delete-btn").on("click", function(event) {
            jQuery("#select-box").hide();

            node = self.selectedEl.get(0);

            Vvveb.Undo.addMutation({
                type: 'childList',
                target: node.parentNode,
                removedNodes: [node],
                nextSibling: node.nextSibling
            });

            self.selectedEl.remove();

            event.preventDefault();
            return false;
        });

        $("#add-section-btn").on("click", function(event) {

            var offset = jQuery(this).offset();
            var addSectionBox = jQuery("#add-section-box");

            addSectionBox.css({
                "top": offset.top - self.frameDoc.scrollTop() - $(this).outerHeight(),
                "left": offset.left - (addSectionBox.outerWidth() / 2) - (275) - self.frameDoc.scrollLeft(),
                //"display": "block"
            });

            event.preventDefault();
            return false;
        });



    },

    /* drag and drop */
    _initDragdrop: function() {

        var self = this;
        self.isDragging = false;

        $('.drag-elements-sidepane ul > li > ol > li').on("mousedown touchstart", function(event) {

            $this = jQuery(this);

            $("#component-clone").remove();

            if ($this.data("drag-type") == "component")
                self.component = Vvveb.Components.get($this.data("type"));
            else
                self.component = Vvveb.Blocks.get($this.data("type"));

            if (self.component.dragHtml) {
                html = self.component.dragHtml;
            } else {
                html = self.component.html;
            }

            self.dragElement = $(html);
            self.dragElement.css("border", "1px dashed #4285f4");

            if (self.component.dragStart) self.dragElement = self.component.dragStart(self.dragElement);

            self.isDragging = true;
            if (Vvveb.dragIcon == 'html') {
                self.iconDrag = $(html).attr("id", "dragElement-clone").css('position', 'absolute');
            } else if (self.designerMode == false) {
                self.iconDrag = $('<img src=""/>').attr({ "id": "dragElement-clone", 'src': $this.css("background-image").replace(/^url\(['"](.+)['"]\)/, '$1') }).
                css({ 'z-index': 100, 'position': 'absolute', 'width': '64px', 'height': '64px', 'top': event.originalEvent.y, 'left': event.originalEvent.x });
            }

            $('body').append(self.iconDrag);

            event.preventDefault();
            return false;
        });

        $('body').on('mouseup touchend', function(event) {
            if (self.iconDrag && self.isDragging == true) {
                self.isDragging = false;
                $("#component-clone").remove();
                self.iconDrag.remove();
                if (self.dragElement) {
                    self.dragElement.remove();
                }
            }
        });

        $('body').on('mousemove touchmove', function(event) {
            if (self.iconDrag && self.isDragging == true) {
                var x = (event.clientX || event.originalEvent.clientX);
                var y = (event.clientY || event.originalEvent.clientY);

                self.iconDrag.css({ 'left': x - 60, 'top': y - 30 });

                elementMouseIsOver = document.elementFromPoint(x - 60, y - 40);

                //if drag elements hovers over iframe switch to iframe mouseover handler	
                if (elementMouseIsOver && elementMouseIsOver.tagName == 'IFRAME') {
                    self.frameBody.trigger("mousemove", event);
                    event.stopPropagation();
                    self.selectNode(false);
                }
            }
        });

        $('.drag-elements-sidepane ul > ol > li > li').on("mouseup touchend", function(event) {
            self.isDragging = false;
            $("#component-clone").remove();
        });

    },

    removeHelpers: function(html, keepHelperAttributes = false) {
        //tags like stylesheets or scripts 
        html = html.replace(/<.*?data-vvveb-helpers.*?>/gi, "");
        //attributes
        if (!keepHelperAttributes) {
            html = html.replace(/\s*data-vvveb-\w+(=["'].*?["'])?\s*/gi, "");
        }

        return html;
    },

    getHtml: function(keepHelperAttributes = true) {

        var doc = window.FrameDocument;
        var hasDoctpe = (doc.doctype !== null);
        var html = "";

        //	console.log("getHtml", doc, hasDoctpe);
        /*	if (hasDoctpe){ html =
        "<!DOCTYPE "
         + doc.doctype.name
         + (doc.doctype.publicId ? ' PUBLIC "' + doc.doctype.publicId + '"' : '')
         + (!doc.doctype.publicId && doc.doctype.systemId ? ' SYSTEM' : '') 
         + (doc.doctype.systemId ? ' "' + doc.doctype.systemId + '"' : '')
                 + ">\n";
            var htmlHead ="";
            Vvveb.Builder.pagedetail.assets.forEach(element => {
                console.log("aggiungo__22_" + element);
            //	$(doc.documentElement).find("head").html(htmlHead);
                htmlHead += '\n<link href="' + element + '" rel="stylesheet">';
            }); 
            doc.documentElement.head = doc.documentElement.head + htmlHead;
    	
        	
        }else{*/
        html = "<!DOCTYPE html>\n";
        var htmlHead =
            '\n	<meta charset="utf-8">\n' +
            '	<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">\n' +
            '	<meta name="description" content="">\n' +
            '	<meta name="author" content="">\n' +
            ' <link href="' + site_prefix + '/public/assets/wsbuilder/css/editor.css" rel="stylesheet">\n';
        //var actpage=Vvveb.FileManager.getCurrentPage();
        if (Vvveb.FileManager.pagedetail != undefined) {
            if (Vvveb.FileManager.pagedetail.hasOwnProperty('assets')) {
                if (Vvveb.FileManager.pagedetail.assets.length > 0) {
                    Vvveb.FileManager.pagedetail.assets.forEach(element => {
                        //console.log("elel",element,element.url+Vvveb.FileManager.pagedetail.name+'/' + element.id );
                        if (element.name.includes(".css"))
                            htmlHead += '<link href="' + element.url + element.id + '" rel="stylesheet">\n';
                        else
                            htmlHead += '<script src="' + element.url + element.id + '"></script>\n';

                    });
                }
            }
        }

        //	self.frameHead = htmlHead;
        $(doc.documentElement).find("head").html(htmlHead);

        //		 }

        html += doc.documentElement.innerHTML + " \n</html>";

        return this.removeHelpers(html, keepHelperAttributes);
    },
    getBody: function(keepHelperAttributes = true) {

        var doc = window.FrameDocument;
        var hasDoctpe = (doc.doctype !== null);
        var html = "";

        /*	Vvveb.Builder.pagedetail.assets.forEach(element => {
                if (element.includes(".css"))
                    htmlHead += ' <link href="' + element + '" rel="stylesheet">\n';
                else
                    htmlHead += ' <script src="' + element + '"></script>\n';
            });*/
        //	self.frameHead = htmlHead;

        //		 }

        html = $(doc.documentElement).find("body").html();

        return html;
    },
    setHtml: function(html) {

        //update only body to avoid breaking iframe css/js relative paths
        start = html.indexOf("<body");
        end = html.indexOf("</body");

        if (start >= 0 && end >= 0) {
            body = html.slice(html.indexOf(">", start) + 1, end);
        } else {
            body = html
        }

        if (this.runJsOnSetHtml)
            self.frameBody.html(body);
        else
            window.FrameDocument.body.innerHTML = body;


        //below methods brake document relative css and js paths
        //return self.iframe.outerHTML = html;
        //return self.documentFrame.html(html);
        //return self.documentFrame.attr("srcdoc", html);
    },
    //saveAjax: function(action,fileName, startTemplateUrl, callback) {
    saveAjax: function(action, infodata, callback) {
        var pageId = Vvveb.FileManager.getCurrentPage();
        //  console.log('pageId', pageId, Vvveb.FileManager);
        //  console.log('action, infodata, callback', action, infodata, callback);
        var postData = {};
        var url = "";
        var callType = "POST";
        var show_message_modal = true;
        //var addform=false;
        var serializedata = true;
        var temp_config_call = {
            url: url,
            type: callType,
            serializedata: serializedata,
            processData: false,
            enctype: "multipart/form-data; boundary=----------------------------4ebf00fbcf09",
            contentType: false,
            cache: false
        };
        if (action == "delete")
            temp_config_call.enctype = undefined;
        var ajax_temp_call = new Ajaxcall(temp_config_call);
        //    console.log("ajax action", action);
        switch (action) {
            case "create":
                serializedata = false;
                pageId = null;
                var s = infodata.file.src;
                var filename = infodata.file.originalname;
                var ctype = infodata.file.ctype;
                delete delete infodata.file;
                var elformdata = { "data": infodata };
                var postData = new FormData();
                appendFormdata(postData, elformdata);
                postData.append('data[file]', new File([new Blob([s])], filename, { type: ctype }));

                /* var html2 = Vvveb.Builder.getBody();
                 var html3 = "";
                 $(html2).find("[dymer-model-element]").each(function() {
                     // console.log(this.outerHTML);
                     html3 += this.outerHTML;
                 });
                 var json_struct = html2json(html3);
                 var json_struct_filname = filename.split('.')[0] + ".json";
                 postData.append('data[file]', new File([new Blob([s])], json_struct_filname, { type: "application/javascript" }));
 */
                url = Vvveb.pathservice + "";
                ajax_temp_call.setdatapost(postData);
                break;
            case "update":
                //  postData = { "data": { pageId: pageId, newhtml: this.getBody(),assetId: Vvveb.FileManager.pages[pageId].html.id } };
                //console.log('postData',postData); 
                if (infodata) {
                    //      console.log("uno");
                    postData = { "data": infodata };
                    ajax_temp_call.addparams(postData);
                    url = Vvveb.pathservice + "update";
                } else {
                    console.log("due");
                    url = Vvveb.pathservice + "updateAsset";
                    serializedata = false;
                    var s = this.getBody();
                    var filename = Vvveb.FileManager.pages[pageId].html.name;
                    var postData = new FormData();
                    postData.append('data[file]', new File([new Blob([s])], filename, { type: "text/html" }));
                    postData.append('data[pageId]', Vvveb.FileManager.getCurrentPage());
                    postData.append('data[assetId]', Vvveb.FileManager.pages[pageId].html.id);

                    var html2 = Vvveb.Builder.getBody();
                    var html3 = "";
                    $(html2).find("[dymer-model-element]").each(function() {
                        // console.log(this.outerHTML);
                        html3 += this.outerHTML;
                    });
                    var json_struct = JSON.stringify(html2json(html3));
                    let ajax_temp_call_str = new Ajaxcall(temp_config_call);

                    var postData_str = new FormData();

                    postData_str.append('data[pageId]', Vvveb.FileManager.getCurrentPage());
                    postData_str.append('data[structure]', json_struct);
                    ajax_temp_call_str.setserializedata(false);
                    ajax_temp_call_str.setdatapost(postData_str);
                    ajax_temp_call_str.seturl(Vvveb.pathservice + "updatestructure");
                    let ret_str = ajax_temp_call_str.send();
                    console.log('ret_str', ret_str);



                    ajax_temp_call.setdatapost(postData);
                }


                break;
            case "updateAsset":
                show_message_modal = false;
                serializedata = false;
                //  postData = { "data": { pageId: pageId, newhtml: this.getBody(),assetId: Vvveb.FileManager.pages[pageId].html.id } }; 
                //	if(infodata)
                //		postData = { "data": infodata };
                url = Vvveb.pathservice + "updateAsset";
                var s = infodata.newContAsset;
                var filename = infodata.filename;

                var postData = new FormData();
                postData.append('data[file]', new File([new Blob([s])], filename, { type: infodata.ctype }));
                postData.append('data[pageId]', infodata.pageId);
                postData.append('data[assetId]', infodata.assetId);
                ajax_temp_call.setdatapost(postData);
                /*	$.ajax({
                        url: url,
                        data: formData,
                        processData: false,
                        contentType: false,
                        type: 'POST',
                        success: function () {
                            console.log('ok');
                        },
                        error: function () {
                            console.log('err'); // replace with proper error handling
                        }
                    });
                        */
                break;
            case "addAsset":
                url = Vvveb.pathservice + "addAsset";
                //addform=true;
                show_message_modal = false;
                if (infodata.idform)
                    ajax_temp_call.addcontainer_ids(infodata.idform);
                else {
                    serializedata = false;
                    var s = infodata.newContAsset;
                    var filename = infodata.filename;
                    var postData = new FormData();
                    postData.append('data[file]', new File([new Blob([s])], filename, { type: infodata.ctype }));
                    postData.append('data[pageId]', infodata.pageId);
                    ajax_temp_call.setdatapost(postData);
                }
                break;
            case "deleteAsset":
                ajax_temp_call.setcalltype("DELETE");
                pageId = infodata.pageId;
                url = Vvveb.pathservice + pageId + '/' + infodata.assetId;
                show_message_modal = false;
                //   console.log('deleteAsset', url);
                break;
            case "delete":
                ajax_temp_call.setcalltype("DELETE");
                pageId = infodata.pageId;
                url = Vvveb.pathservice + pageId;
                show_message_modal = false;
                break;
            default:
                alert('Default case');
        }
        //    console.log('infodata', infodata);
        //    console.log('postData', postData);


        //var fileName = (fileName && fileName != "") ? fileName : Vvveb.FileManager.getCurrentUrl();
        // data["startTemplateUrl"] = startTemplateUrl;

        //  console.log('startTemplateUrl', data["startTemplateUrl"]);

        /*if (!startTemplateUrl || startTemplateUrl == null) {
            data["html"] = this.getBody() ;//this.getHtml();
        }*/
        ajax_temp_call.seturl(url);
        ajax_temp_call.setserializedata(serializedata);




        //ajax_temp_call.flush();
        //ajax_temp_call.setdatapost(postData);
        var ret = ajax_temp_call.send();
        //   console.log('ret', ret);

        if (ret.success) {
            if (show_message_modal)
                $('#message-modal').modal().find(".modal-body").html("File saved! ");
            if (callback) callback(ret);
        } else {
            $('#message-modal').modal().find(".modal-body").html("Error on save :(");
        }

        /*	$.ajax({
                type: "POST",
                url: Vvveb.pathsavefile,//set your server side save script url
                data: data,
                cache: false,
                success: function (data) {
                    console.log("ajax vvb",data);
                    if (callback) callback(data);
                	
                },
                error: function (data) {
                    console.log("ajax error vvb",data);
                    alert(data.responseText);
                }
            });	*/
    },
    setDesignerMode: function(designerMode = false) {
        this.designerMode = designerMode;
    }

};

Vvveb.CodeEditor = {

    isActive: false,
    oldValue: '',
    doc: false,

    init: function(doc) {

        $("#vvveb-code-editor textarea").val(Vvveb.Builder.getHtml());
        //console.log("vveb CodeEditor getHtml", Vvveb.Builder.getHtml());
        //	console.log("vveb CodeEditor this.value", this.value);
        $("#vvveb-code-editor textarea").keyup(function() {
            delay(Vvveb.Builder.setHtml(this.value), 1000);
        });

        //load code on document changes
        Vvveb.Builder.frameBody.on("vvveb.undo.add vvveb.undo.restore", function(e) { Vvveb.CodeEditor.setValue(); });
        //load code when a new url is loaded
        Vvveb.Builder.documentFrame.on("load", function(e) { Vvveb.CodeEditor.setValue(); });

        this.isActive = true;
    },

    setValue: function(value) {
        if (this.isActive) {
            $("#vvveb-code-editor textarea").val(Vvveb.Builder.getHtml());
        }
    },

    destroy: function(element) {
        this.isActive = false;
    },

    toggle: function() {
        if (this.isActive != true) {
            this.isActive = true;
            return this.init();
        }
        this.isActive = false;
        this.destroy();
    }
}

Vvveb.Gui = {

    init: function() {
        $("[data-vvveb-action]").each(function() {
            on = "click";
            if (this.dataset.vvvebOn) on = this.dataset.vvvebOn;

            $(this).unbind(on).on(on, Vvveb.Gui[this.dataset.vvvebAction]);
            if (this.dataset.vvvebShortcut) {
                $(document).bind('keydown', this.dataset.vvvebShortcut, Vvveb.Gui[this.dataset.vvvebAction]);
                $(window.FrameDocument, window.FrameWindow).bind('keydown', this.dataset.vvvebShortcut, Vvveb.Gui[this.dataset.vvvebAction]);
            }
        });
    },

    undo: function() {
        if (Vvveb.WysiwygEditor.isActive) {
            Vvveb.WysiwygEditor.undo();
        } else {
            Vvveb.Undo.undo();
        }
        Vvveb.Builder.selectNode();
    },

    redo: function() {
        if (Vvveb.WysiwygEditor.isActive) {
            Vvveb.WysiwygEditor.redo();
        } else {
            Vvveb.Undo.redo();
        }
        Vvveb.Builder.selectNode();
    },

    //show modal with html content
    save: function() {
        $('#textarea-modal textarea').val(Vvveb.Builder.getHtml());
        $('#textarea-modal').modal();
    },

    //post html content through ajax to save to filesystem/db
    saveAjax: function() {
        //marco controllare
        var url = Vvveb.FileManager.getCurrentUrl();

        return Vvveb.Builder.saveAjax("update", undefined, function(data) {
            var pageId = Vvveb.FileManager.getCurrentPage();
            var new_id_ContentAssett = data.extraData.newAssetId;
            var assetid = Vvveb.FileManager.pages[pageId].html.id;
            Vvveb.FileManager.pages[pageId].html.id = new_id_ContentAssett;


            //  $('#filemanager .listmodels [data-page="'+name+'"]').attr("data-url",new_id_ContentAssett);
            var ex_url = $('#filemanager .listmodels [data-page="' + pageId + '"]').attr('data-url');

            var new_url = ex_url.replace(assetid, new_id_ContentAssett);
            $('#filemanager .listmodels [data-page="' + pageId + '"]').attr("data-url", new_url);
            Vvveb.FileManager.pages[pageId].url = (Vvveb.FileManager.pages[pageId].url).replace(assetid, new_id_ContentAssett);
            $('#message-modal').modal().find(".modal-body").html("File saved : " + data.message);
            Vvveb.FileManager.reloadCurrentPage();
            // console.log('datadatadata', data);
        });
    },
    /*
        download: function() {
            //filename = /[^\/]+$/.exec(Vvveb.Builder.iframe.src)[0];
            //  filename = filename.split("?")[0];
            //   filename = filename[filename.length - 1];

            filename = Vvveb.FileManager.pages[Vvveb.FileManager.getCurrentPage()].title + ".html"
            uriContent = "data:application/octet-stream," + encodeURIComponent(Vvveb.Builder.getBody());

            var link = document.createElement('a');
            if ('download' in link) {
                link.download = Vvveb.editorType + '_' + filename;
                //	 link.download = Vvveb.FileManager.pages[filename].title + ".html" ;
                link.href = uriContent;
                link.target = "_blank";

                document.body.appendChild(link);
                result = link.click();
                document.body.removeChild(link);
                link.remove();

            } else {
                location.href = uriContent;
            }


        },*/
    download: function() {

        var Promise = window.Promise;
        if (!Promise) {
            Promise = JSZip.external.Promise;
        }
        var zip = new JSZip();
        //  var listZip=[];


        filename = Vvveb.FileManager.pages[Vvveb.FileManager.getCurrentPage()].title + ".html"
            //uriContent = "data:application/octet-stream," + encodeURIComponent(Vvveb.Builder.getBody());
            //  var objzip={'url':uriContent,'filename':filename};

        var myPage = Vvveb.FileManager.pages[Vvveb.FileManager.getCurrentPage()];
        zip.file(filename, urlToPromiseZip(myPage.url), { binary: true });
        var d = new Date();
        let date = d.toISOString().split('T')[0].replace(/-/g, '_');
        let time = d.toTimeString().split(' ')[0].replace(/:/g, '_');
        var zipName = uuidfile + "_" + Vvveb.editorType + '_' + myPage.title + "_" + date + "_" + time + ".zip";
        (myPage.assets).forEach(element => {
            var urlfile = element.url + element.id;
            var unamefile = element.name;
            zip.file(unamefile, urlToPromiseZip(urlfile), { binary: true });
        });
        var ltTileType = "Template";
        if (Vvveb.editorType == 'models')
            ltTileType = 'Model';
        var content_readme = ltTileType + ' Name: ' + myPage.title + '\n';
        if (Vvveb.editorType == 'templates')
            content_readme += 'Template Type: ' + Vvveb.listResources.getTitleTemplate(myPage.viewtype[0]) + '\n';
        content_readme += 'Model (index) Type: ' + myPage.instance + '\n';
        content_readme += 'Description: ' + myPage.description + '\n';
        zip.file("Properties.txt", content_readme);

        zip.generateAsync({ type: "blob" }, function updateCallback(metadata) {
                /*  var msg = "progression : " + metadata.percent.toFixed(2) + " %";
                  if(metadata.currentFile) {
                      msg += ", current file = " + metadata.currentFile;
                  }
                  showMessage(msg);
                  updatePercent(metadata.percent|0);*/
            })
            .then(function callback(blob) {

                // see FileSaver.js
                saveAs(blob, zipName);

                //  showMessage("done !");
            }, function(e) {
                console.error(e);
            });



    },
    viewport: function() {
        $("#canvas").attr("class", this.dataset.view);
    },

    toggleEditor: function() {
        $("#vvveb-builder").toggleClass("bottom-panel-expand");
        $("#toggleEditorJsExecute").toggle();
        Vvveb.CodeEditor.toggle();
    },

    toggleEditorJsExecute: function() {
        Vvveb.Builder.runJsOnSetHtml = this.checked;
    },

    preview: function() {
        (Vvveb.Builder.isPreview == true) ? Vvveb.Builder.isPreview = false: Vvveb.Builder.isPreview = true;
        $("#iframe-layer").toggle();
        $("#vvveb-builder").toggleClass("preview");
    },

    fullscreen: function() {
        launchFullScreen(document); // the whole page
    },

    componentSearch: function() {
        searchText = this.value;

        $("#components-list li ol li").each(function() {
            $this = $(this);

            $this.hide();
            if ($this.data("search").indexOf(searchText) > -1) $this.show();
        });
    },

    clearComponentSearch: function() {
        $("#component-search").val("").keyup();
    },
    modelSearch: function() {
        searchText = this.value;
        $("#filemanager   ol.listmodels  .elmodel").each(function() {
            $this = $(this);
            $this.hide();
            if (($this.data("title").indexOf(searchText) > -1) || ($this.data("entitytype").indexOf(searchText) > -1)) $this.show();
        });
    },

    clearModelSearch: function() {
        $("#model-search").val("").keyup();
    },
    blockSearch: function() {
        searchText = this.value;

        $("#blocks-list li ol li").each(function() {
            $this = $(this);

            $this.hide();
            if ($this.data("search").indexOf(searchText) > -1) $this.show();
        });
    },

    clearBlockSearch: function() {
        $("#block-search").val("").keyup();
    },

    //Pages, file/components tree 
    newPage: function() {

        var newPageModal = $('#new-page-modal');

        newPageModal.modal("show").find("form").off("submit").submit(function(event) {
            event.preventDefault();
            var startTemplateUrl = "";
            var title = $("input[name=title]", newPageModal).val();
            var entitytype = $("[name=entitytype]", newPageModal).val();

            entitytype = (entitytype.replace(/[^a-zA-Z]/g, "")).toLowerCase();



            var description = $("[name=description]", newPageModal).val();
            var name = title.replace(/\W+/g, '-').toLowerCase();
            var viewtype = undefined;
            var path_basetemplate = "";
            if (Vvveb.editorType == "templates") {
                viewtype = $("[name=viewtype]", newPageModal).val();
                path_basetemplate = Vvveb.listResources.getCaseTemplatesPath(viewtype);
            }
            if (Vvveb.editorType == "models") {
                if (Vvveb.FileManager.listIndexExsist.includes(entitytype)) {
                    var strnotify = '<strong>This model type/index already exsist!</strong> ';
                    $.notify(strnotify, { type: 'warning', clickToHide: true });
                    return false;
                }
                path_basetemplate = Vvveb.listResources.getCaseTemplatesPath("standard");

            }
            $.get(path_basetemplate, function(html_string) {
                startTemplateUrl = html_string;

                startTemplateUrl = replaceAll(startTemplateUrl, "{{titolo}}", title);

                //allow only alphanumeric, dot char for extension (eg .html) and / to allow typing full path including folders
                fileName = name;
                fileName = fileName.replace(/[^A-Za-z0-9\.\/]+/g, '-').toLowerCase();

                //add your server url/prefix/path if needed
                //var url = Vvveb.pathservice + "create"; // + fileName;
                startTemplateUrl = replaceAll(startTemplateUrl, "{{instance}}", entitytype);
                console.log('startTemplateUrl', startTemplateUrl);
                var datapost = {
                    title: title,
                    description: description,
                    name: fileName,
                    author: "Dymer Administrator",
                    instance: [{
                        "_index": entitytype,
                        "_type": entitytype
                    }],
                    file: {
                        originalname: fileName + ".html",
                        src: startTemplateUrl,
                        ctype: "text/html"
                    },
                    // url: "",
                    posturl: "",
                };
                //console.log('Vvveb.editorType', Vvveb.editorType);
                if (Vvveb.editorType == "templates") {
                    datapost.viewtype = [{
                        rendertype: viewtype
                    }]

                }


                return Vvveb.Builder.saveAjax("create", datapost, function(dat) {
                    newPageModal.modal("hide");
                    newPageModal.find('form')[0].reset();
                    var data = dat.data;
                    data.forEach(element => {

                        var singlePage = {
                            name: element._id,
                            title: element.title,
                            html: {
                                id: "",
                                name: "",
                                content: "",
                                url: Vvveb.pathservice + "content/"
                            },
                            instance: element.instance[0]._index,
                            url: Vvveb.pathservice + "content/" + element._id,
                            assets: [],
                            description: element.description,
                            viewtype: []
                        };
                        console.log('crete element', element);
                        if (Vvveb.editorType == "templates") {
                            element.viewtype.forEach(vw => {
                                singlePage.viewtype.push(vw.rendertype);
                            });
                        } else {
                            Vvveb.FileManager.listIndexExsist.push(element.instance[0]._index);
                        }
                        element.files.forEach(elfiles => {
                            if (elfiles.contentType == "text/html") {
                                singlePage.url = Vvveb.pathservice + "content/" + elfiles._id
                                singlePage.html.id = elfiles._id;
                                singlePage.html.name = elfiles._id + ".html";
                                singlePage.html.content = elfiles.data;
                                //  singlePage.url = serviceurl + "/content/" + elfiles._id + ".html";
                            }
                            //singlePage.url = "/api/forms/api/v1/form/" + elfiles.path;
                            else {
                                var newFile = {
                                    id: "",
                                    name: "",
                                    type: "",
                                    content: "",
                                    url: Vvveb.pathservice + "content/"
                                };
                                newFile.id = elfiles._id;
                                newFile.name = elfiles.filename;
                                newFile.type = elfiles.contentType;
                                newFile.content = elfiles.data;
                                singlePage.assets.push(newFile);
                            }

                            //singlePage.assets.push("/api/forms/api/v1/form/" + elfiles.path);
                        });
                        console.log('newsinglePage', singlePage);
                        //  listpages.push(singlePage);
                        // Vvveb.FileManager.addPage(singlePage.name, singlePage.title, singlePage.url, singlePage.assets);
                        Vvveb.FileManager.addPage(singlePage.name, singlePage);
                        Vvveb.FileManager.loadPage(singlePage.name);


                        // Vvveb.FileManager.loadPage(name);
                        //  Vvveb.FileManager.addPage(name, title, url);
                        Vvveb.FileManager.scrollBottom();

                    });
                });



            }, 'html');

        });
    },

    deletePage: function() {

    },
    editPage: function() {


    },
    setDesignerMode: function() {
        //aria-pressed attribute is updated after action is called and we check for false instead of true
        var designerMode = this.attributes["aria-pressed"].value != "true";
        Vvveb.Builder.setDesignerMode(designerMode);
    },

}

Vvveb.FileManager = {
    tree: false,
    pages: {},
    currentPage: false,
    pagedetail: {},
    init: function() {
        this.tree = $("#filemanager .tree > ol").html("");

        $(this.tree).on("click", "a", function(e) {
            e.preventDefault();
            return false;
        });
        $(this.tree).on("click", "i[data-vvveb-action]", function(e) {

            e.preventDefault();
            var page = $(this).data("page");
            var act = $(this).data("vvveb-action");
            var asset = $(this).data("asset");
            //  console.log("accccccct", act);
            if (page) {
                if (act == 'editPage')
                    Vvveb.FileManager.editPage(page);
                if (act == 'deletePage')
                    Vvveb.FileManager.deletePage(page);
                if (act == 'editAssetsPage')
                    Vvveb.FileManager.editAssetsPage(page);
                if (act == 'editAsset')
                    Vvveb.FileManager.editAsset(page, asset);
                if (act == 'deleteAsset')
                    Vvveb.FileManager.deleteAsset(page, asset);
                if (act == 'addAsset')
                    Vvveb.FileManager.addAsset(page, asset);

                if (act == 'showModelAssetsPage')
                    Vvveb.FileManager.showModelAssetsPage(page);
            }
            //(act=='editPage')?Vvveb.FileManager.editPage(page):Vvveb.FileManager.deletePage(page);

            return false;
        })
        $(this.tree).on("click", "li[data-page] label", function(e) {

            var page = $(this.parentNode).data("page");
            //console.log("FileManager page", page);
            if (page) {
                Vvveb.FileManager.loadPage(page);

            }
            return true;
        })

        $(this.tree).on("click", "li[data-component] label ", function(e) {
            node = $(e.currentTarget.parentNode).data("node");

            Vvveb.Builder.frameHtml.animate({
                scrollTop: $(node).offset().top
            }, 1000);

            $(".subtree li label.active").each(function(index) {
                $(this).removeClass('active');
            });
            $(this).addClass('active');



            Vvveb.Builder.selectNode(node);
            Vvveb.Builder.loadNodeComponent(node);

            //e.preventDefault();
            //return false;
        }).on("mouseenter", "li[data-component] label", function(e) {

            node = $(e.currentTarget).data("node");
            $(node).trigger("mousemove");

        });
    },
    addPage: function(name, data) {

        this.pages[name] = data;
        data['name'] = name;

        this.tree.append(
            tmpl("vvveb-filemanager-page", data));
    },

    addPages: function(pages) {
        for (page in pages) {
            this.addPage(pages[page]['name'], pages[page]);
        }
    },
    /* addPage: function(name, title, url, assets) {

        this.pages[name] = { title: title, url: url, assets: assets };

        this.tree.append(
            tmpl("vvveb-filemanager-page", { name: name, title: title, url: url, assets: assets }));

    },

    addPages: function(pages) {

        for (let index = 0; index < pages.length; index++) {
            var page = pages[index];

            this.addPage(page.name, page.title, page.url, page.assets);
        }
        
    },
*/
    addComponent: function(name, url, title, page) {
        $("[data-page='" + page + "'] > ol", this.tree).append(
            tmpl("vvveb-filemanager-component", { name: name, url: url, title: title }));
    },

    getComponents: function(allowedComponents = {}) {

        var tree = [];

        function getNodeTree(node, parent) {
            if (node.hasChildNodes()) {
                for (var j = 0; j < node.childNodes.length; j++) {
                    child = node.childNodes[j];

                    if (child && child["attributes"] != undefined &&
                        (matchChild = Vvveb.Components.matchNode(child))) {
                        if (Array.isArray(allowedComponents) &&
                            allowedComponents.indexOf(matchChild.type) == -1)
                            continue;

                        element = {
                            name: matchChild.name,
                            image: matchChild.image,
                            type: matchChild.type,
                            node: child,
                            children: []
                        };
                        element.children = [];
                        parent.push(element);
                        element = getNodeTree(child, element.children);
                    } else {
                        element = getNodeTree(child, parent);
                    }
                }
            }

            return false;
        }

        getNodeTree(window.FrameDocument.body, tree);

        return tree;
    },

    loadComponents: function(allowedComponents = {}) {

        var tree = this.getComponents(allowedComponents);
        var html = drawComponentsTree(tree);
        var j = 0;

        function drawComponentsTree(tree) {
            var html = $("<ol class='subtree'></ol>");
            j++;
            for (i in tree) {
                var node = tree[i];

                if (tree[i].children.length > 0) {
                    var li = $('<li data-component="' + node.name + '">\
					<label for="id' + j + '" style="background-image:url(public/assets/wsbuilder/libs/builder/' + node.image + ')"><span>' + node.name + '</span></label>\
					<input type="checkbox" id="id' + j + '">\
					</li>');
                    li.data("node", node.node);
                    li.append(drawComponentsTree(node.children));
                    html.append(li);
                } else {
                    var li = $('<li data-component="' + node.name + '" class="file">\
							<label for="id' + j + '" style="background-image:url(public/assets/wsbuilder/libs/builder/' + node.image + ')"><span>' + node.name + '</span></label>\
							<input type="checkbox" id="id' + j + '"></li>');
                    li.data("node", node.node);
                    html.append(li);
                }
            }

            return html;
        }

        $("[data-page='" + this.currentPage + "'] > ol", this.tree).replaceWith(html);
    },

    getCurrentUrl: function() {
        if (this.currentPage)
            return this.pages[this.currentPage]['url'];
    },
    getCurrentPage: function() {

        return this.currentPage;
    },
    reloadCurrentPage: function() {
        if (this.currentPage)
            return this.loadPage(this.currentPage);
    },

    loadPage: function(name, allowedComponents = false, disableCache = true) {

        $("[data-page]", this.tree).removeClass("active");
        $("[data-page='" + name + "']", this.tree).addClass("active");
        this.pagedetail = this.pages[name];
        this.currentPage = name;
        //console.log("ssssss", Vvveb.FileManager.pages[page].title);

        $("#pageTitleActualmanage").html(this.pagedetail.title);
        var url = this.pages[name]['url'];
        //  console.log('url', url);
        Vvveb.Builder.loadUrl(url + (disableCache ? (url.indexOf('?') > -1 ? '&' : '?') + Math.random() : ''),
            function() {
                Vvveb.FileManager.loadComponents(allowedComponents);
            }, this.pages[name]);
    },

    scrollBottom: function() {
        var scroll = this.tree.parent();
        scroll.scrollTop(scroll.prop("scrollHeight"));
    },
    deletePage: function(name) {
        var deletePageModal = $('#delete-page-modal');
        var dataedit = this.pages[name];
        var datapost = { pageId: name };
        deletePageModal.find('#nametodelete').text(dataedit.title);
        deletePageModal.find('#typetodelete').text(dataedit.instance);
        deletePageModal.find('#desctodelete').text(dataedit.description);
        deletePageModal.modal("show").find("form").off("submit").submit(function(event) {
            return Vvveb.Builder.saveAjax("delete", datapost, function(data) {
                deletePageModal.modal("hide");
                if (data.success) {
                    delete Vvveb.FileManager.pages[name];
                    $('#filemanager .tree li[data-page="' + name + '"]').remove();
                    $('#message-modal').modal().find(".modal-body").html("Delete successfully! ");
                    if (name == Vvveb.FileManager.getCurrentPage())
                        $('#iframe-wrapper iframe').attr('src', 'about:blank');
                } else
                    $('#message-modal').modal().find(".modal-body").html("Error: Delete without success! ");

            });
        });
    },
    addAsset: function(el) {
        var editPageModal = $(el).closest('form'); //$('#editAssets-page-modal');
        var datapost = {};
        var pageId = $(el).data('asset-page');
        var type = $(el).data('asset');
        var actiontype = $(el).data('actiontype');
        //createfile - upload

        var exten = (type == "attachmentCss") ? ".css" : ".js";
        var ctype = (type == "attachmentCss") ? "text/css" : "text/javascript";
        console.log('ctype', ctype);
        if (actiontype == 'createfile') {
            var newContAsset = editPageModal.find('[name="contentAttach-new"]').val();
            var filename = editPageModal.find('[name="data[newfilename]"]').val();
            filename = filename.replace(/\s+/, "");
            filename = filename.split(".")[0] + exten;
            datapost.pageId = pageId;
            datapost.ctype = ctype;
            datapost.filename = filename;
            datapost.newContAsset = newContAsset;
        } else {
            datapost.idform = "#" + $(el).closest('form').attr("id");
        }


        /*if(type=="attachmentCss")
        {
             datapost.idform="#"+$(el).closest('form').attr("id");
             
            //  var newContAsset=editPageModal.find('[name="contentAttach-'+asset+'"]').val();
        }
        else if(type=="attachmentJs"){
            datapost.idform="#uploadAssetJs";
        }*/

        return Vvveb.Builder.saveAjax("addAsset", datapost, function(data) {
            console.log('return addAsset', data);
            //deletePageModal.modal("hide");
            if (data.success) {
                /*  Vvveb.FileManager.pages[name].assets.forEach(element => {
                     if(element.id==asset)
                     element.content=newContAsset;
                 });*/
                //$('#filemanager .tree li[data-page="'+name+'"]').remove();
                $.notify('<strong>Attachment created!</strong> ');
                //window.location.reload() ;
                setTimeout(function() {
                    window.reloadMe();
                }, 2000);
            } else {
                $.notify('<strong>Attachment  Do not updated!</strong> ', { type: 'warning' });
            }

        });

    },
    deleteAsset: function(name, assetId) {
        var datapost = {
            pageId: name,
            assetId: assetId
        };
        console.log('deleteAsset', datapost);
        var domanda = confirm("Do you want to delete the file?");
        if (domanda === true) {
            return Vvveb.Builder.saveAjax("deleteAsset", datapost, function(data) {
                //deletePageModal.modal("hide");
                console.log('return deleteAsset', data);
                if (data.success) {
                    Vvveb.FileManager.pages[name].assets.forEach(function(element, index, object) {
                        if (element.id == assetId) {
                            Vvveb.FileManager.pages[name].assets.splice(index, index);
                            $("#assetli_" + assetId).remove();
                            return false;
                        }
                    });

                    /*	  element => {
                     if(element.id==assetId)
                     delete  Vvveb.FileManager.pages[name].assets;
                 }); */
                    //$('#filemanager .tree li[data-page="'+name+'"]').remove();
                    $.notify('<strong>Attachment deleted!</strong> ');
                } else {
                    $.notify('<strong>Attachment  Do not deleted!</strong> ', { type: 'warning' });
                }

            });
        } else {

        }

        /* var deletePageModal = $('#delete-page-modal');
      var dataedit=this.pages[name];
         var datapost = {pageId: name };	
         deletePageModal.find('#nametodelete').text(dataedit.title);
         deletePageModal.find('#typetodelete').text(dataedit.instance);
          deletePageModal.find('#desctodelete').text(dataedit.description);
        deletePageModal.modal("show").find("form").off("submit").submit(function(event) { 
        return Vvveb.Builder.saveAjax("delete", datapost, function(data) {
                deletePageModal.modal("hide");
                if(data.success){
                    delete Vvveb.FileManager.pages[name];
                    $('#filemanager .tree li[data-page="'+name+'"]').remove();
                    $('#message-modal').modal().find(".modal-body").html("Delete successfully! ");
                }else
                    $('#message-modal').modal().find(".modal-body").html("Error: Delete without success! ");
            	
            });
            }); */
    },
    editAsset: function(name, assetid, filename, type) {
        console.log('editAsset', name, assetid);
        var editPageModal = $('#editAssets-page-modal');
        var dataedit = this.pages[name];
        var newContAsset = editPageModal.find('[name="contentAttach-' + assetid + '"]').val();

        var datapost = { pageId: name, newContAsset: newContAsset, assetId: assetid, filename: filename, ctype: type };
        return Vvveb.Builder.saveAjax("updateAsset", datapost, function(data) {
            console.log('return updateAsset');
            //deletePageModal.modal("hide");
            if (data.success) {
                Vvveb.FileManager.pages[name].assets.forEach(element => {
                    if (element.id == assetid)
                        element.content = newContAsset;
                });
                //$('#filemanager .tree li[data-page="'+name+'"]').remove();
                $.notify('<strong>Attachment updated!</strong> ');
            } else {
                $.notify('<strong>Attachment  Do not updated!</strong> ', { type: 'warning' });
            }

        });


    },
    showModelAssetsPage: function(name) {
        var editPageModal = $('#showModelAssets-page-modal');
        var typeStructure = this.pages[name].instance;
        console.log('dataedit', typeStructure);
        console.log('Vvveb.listResources.getStructure', Vvveb.listResources.getStructures());
        var str = Vvveb.listResources.getStructure(typeStructure);
        var strTmpl = convertStructToTemplate(str);
        console.log('strTmpl', strTmpl);
        editPageModal.find('#contentModelEntity').empty();
        editPageModal.find('#contentModelEntity').html(strTmpl);
        //  editPageModal.find('#contentModelEntity').html(JSON.stringify(strTmpl, undefined, 2));

        editPageModal.modal("show");
    },
    editAssetsPage: function(name) {
        var editPageModal = $('#editAssets-page-modal');
        var dataedit = this.pages[name];
        console.log('dataedit', dataedit);
        editPageModal.find('[name="pageId"]').val(dataedit.name);
        editPageModal.find('[data-asset-page]').attr('data-asset-page', dataedit.name);
        editPageModal.find('#listCssAssets').empty();
        editPageModal.find('#listJsAssets').empty();
        editPageModal.find('[name="data[pageId]"]').val(dataedit.name);
        var cCss = 0,
            cJs = 0;
        dataedit.assets.forEach(element => {
            console.log("elel", element, element.url + Vvveb.FileManager.pagedetail.name + '/' + element.id);
            var listEl = '<li id="assetli_' + element.id + '">' + element.name;
            listEl += '<span class="content-action-edit-page">';
            listEl += '<i class="fa fa-pencil  " onclick="$(this).toggleClass(\'active\').closest(\'li\').find(\'.row\').toggleClass(\'d-none\');"></i>  ';
            listEl += '<i class="fa fa-trash  "  onclick="Vvveb.FileManager.deleteAsset(\'' + dataedit.name + '\',\'' + element.id + '\');" ></i>   </span>';

            listEl += '<div class="row d-none">' +
                '<div class="col-md-12">' +
                '<div class=" ">' +
                '<label>Content</label>' +
                '<textarea class="form-control textarea fsize11 contasset"  name="contentAttach-' + element.id + '"> ' + element.content + '</textarea>' +
                '</div>' +
                '<button class="btn btn-primary btn-sm float-right" onclick="Vvveb.FileManager.editAsset(\'' + dataedit.name + '\',\'' + element.id + '\',\'' + element.name + '\',\'' + element.type + '\');"><i class="la la-check"></i> Save</button>' +
                '</div>' +
                '</div>';
            listEl += '</li>';
            if (element.type.includes("text/css")) {
                cCss++;
                editPageModal.find('#listCssAssets').append(listEl);
                //  editPageModal.find('#listCssAssets').append(listEl);
                //  editPageModal.find('#listCssAssets').append(listEl);
            } else {
                cJs++;
                editPageModal.find('#listJsAssets').append(listEl);
            }
            // console.log("a");
        });
        (cCss == 0) ? $('#cssLIst .alert-info').removeClass('d-none'): $('#cssLIst .alert-info').addClass('d-none');
        (cJs == 0) ? $('#jsLIst .alert-info').removeClass('d-none'): $('#jsLIst .alert-info').addClass('d-none');



        //	editPageModal.find('#listCssAssets').html();
        editPageModal.modal("show");
    },
    editPage: function(name) {

        var editPageModal = $('#edit-page-modal');
        var dataedit = this.pages[name];
        editPageModal.find('[name="title"]').val(dataedit.title);
        editPageModal.find('#editentitytype').val(dataedit.instance);
        if (Vvveb.editorType == "templates") {
            editPageModal.find('#editviewtype').val(dataedit.viewtype[0]);
        }
        editPageModal.find('[name="description"]').val(dataedit.description);


        editPageModal.modal("show").find("form").off("submit").submit(function(event) {
            var title = editPageModal.find('[name="title"]').val();
            var description = editPageModal.find('[name="description"]').val();
            var datapost = {
                pageId: name,
                title: title,
                description: description
            };
            var viewtype = $("#editviewtype", editPageModal).val();
            if (Vvveb.editorType == "templates") {
                datapost.viewtype = [{
                    rendertype: viewtype
                }];
                var entitytype = $("#editentitytype", editPageModal).val();
                datapost.instance = [{
                    "_index": entitytype,
                    "_type": entitytype
                }];
            }
            return Vvveb.Builder.saveAjax("update", datapost, function(data) {
                editPageModal.modal("hide");
                if (data.success) {
                    var updateData = data.data[0];
                    Vvveb.FileManager.pages[name].title = updateData.title;
                    Vvveb.FileManager.pages[name].description = updateData.description;
                    $('#filemanager .tree [data-page="' + name + '"] label[for="' + name + '"] span.txt_title').text(updateData.title);
                    $('#filemanager .tree [data-page="' + name + '"]').attr("data-title", updateData.title);
                    Vvveb.FileManager.pages[name].instance = updateData.instance[0]._index;
                    $('#filemanager .tree [data-page="' + name + '"]').attr("data-entitytype", updateData.instance[0]._index);
                    $('#filemanager .tree [data-page="' + name + '"] .txtinsta').text(" (" + updateData.instance[0]._index + ")");

                    if (Vvveb.editorType == "templates") {

                        Vvveb.FileManager.pages[name].viewtype = [];
                        updateData.viewtype.forEach(vw => {
                            Vvveb.FileManager.pages[name].viewtype.push(vw.rendertype);

                        });
                        var tmplview = Vvveb.listResources.getTitleTemplate(Vvveb.FileManager.pages[name].viewtype[0]);
                        $('#filemanager .tree [data-page="' + name + '"] .txtviewtype').text("[" + tmplview + "]");

                    }
                    editPageModal.find('form')[0].reset();
                }
                $('#message-modal').modal().find(".modal-body").html("File saved : " + data.message);
            });
        });
    }
}

// Toggle fullscreen
function launchFullScreen(document) {


    if (document.documentElement.requestFullScreen) {

        if (document.FullScreenElement) {
            $("#contfullp").removeClass("full-page");
            document.exitFullScreen();
        } else {
            $("#contfullp").addClass("full-page");
            document.documentElement.requestFullScreen();
        }
        //mozilla		
    } else if (document.documentElement.mozRequestFullScreen) {

        if (document.mozFullScreenElement) {
            $("#contfullp").removeClass("full-page");
            document.mozCancelFullScreen();
        } else {
            $("#contfullp").addClass("full-page");
            document.documentElement.mozRequestFullScreen();
        }
        //webkit	  
    } else if (document.documentElement.webkitRequestFullScreen) {

        if (document.webkitFullscreenElement) {
            $("#contfullp").removeClass("full-page");
            document.webkitExitFullscreen();
        } else {
            $("#contfullp").addClass("full-page");
            document.documentElement.webkitRequestFullScreen();
        }
        //ie	  
    } else if (document.documentElement.msRequestFullscreen) {

        if (document.msFullScreenElement) {
            $("#contfullp").removeClass("full-page");
            document.msExitFullscreen();
        } else {
            $("#contfullp").addClass("full-page");
            document.documentElement.msRequestFullscreen();
        }
    }
}

function createCORSRequest(method, url) {
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {
        // XHR has 'withCredentials' property only if it supports CORS
        xhr.open(method, url, true);
    } else if (typeof XDomainRequest != "undefined") { // if IE use XDR
        xhr = new XDomainRequest();
        xhr.open(method, url);
    } else {
        xhr = null;
    }
    return xhr;
}