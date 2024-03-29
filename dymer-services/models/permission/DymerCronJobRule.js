const mongoose = require("mongoose");

mongoose.model("DymerCronJobRule", {
    //Title, author, publisher,description
    title: {
        type: String,
        require: true
    },
    active: {
        type: Boolean,
        require: true
    },
    time: {
        type: String,
        require: true
    },
    sourcepath: {
        type: String,
        require: true
    },
    apisearchpath: {
        type: String,
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
    targetprefix: {
        type: String,
        require: true
    },
    sameid: {
        type: Boolean,
        require: true
    },
    importrelation: {
        type: Boolean,
        require: true
    },
    typerelations: {
        type: String,
        require: true
    },
    condition: {
        type: Object,
        require: true
    },
    importentities: {
        type: Boolean,
        require: true
    },
    importmodel: {
        type: Boolean,
        require: true
    },
    importtemplates: {
        type: Boolean,
        require: true
    },
    forceimportmodel: {
        type: Boolean,
        require: true
    },
    forceimporttemplates: {
        type: Boolean,
        require: true
    }
});