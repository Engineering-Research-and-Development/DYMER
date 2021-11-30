const mongooseBridge = require("mongoose");

mongooseBridge.model("BridgeEntitiesModel", {
    //Title, author, publisher,description
    title: { type: String },
    indexes: {
        type: [String],
        require: true
    },
    api: {
        "search": { type: Object },
        "getbyid": { type: Object },
        "delete": { type: Object },
        "create": { type: Object },
        "update": { type: Object },
        "patch": { type: Object }
    },
    "mapping": { type: Object },
    "dentity": { type: Object }
});