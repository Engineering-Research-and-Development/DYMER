const mongoose = require("mongoose");

mongoose.model("FwadapterConfig", {

    servicetype: {
        type: String,
        require: true
    },
    configuration: {
        type: Object,
        require: true
    }
});