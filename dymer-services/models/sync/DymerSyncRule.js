const mongoose = require("mongoose");

mongoose.model("DymerSyncRule", {
    // sourcepath: {type: String, require: true  },
    title: {
        type: String,
        require: true
    },
    active: {
        type: Boolean,
        require: true
    },
    targetpath: {
        type: String,
        require: true
    },
    apis: {
        type: Object,
        require: true
    },
    cond: {
        type: Object,
        require: true
    },
    sourceindex: {
        type: String,
        require: true
    },
    targetindex: {
        type: String,
        require: true
    },
    sendrelation: {
        type: Boolean,
        require: true
    },
    typerelations: {
        type: String,
        require: true
    }
});