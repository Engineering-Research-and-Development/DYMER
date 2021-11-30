const mongoose = require("mongoose");

mongoose.model("configTool", {

    typeView: {
        type: String,
        require: true
    },
    dataSearch: {
        type: String,
        require: true
    },
    _index: {
        type: String,
        require: true
    },
    configuration: {
        type: Object,
        require: true
    }
});