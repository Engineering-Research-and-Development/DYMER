const mongoose = require("mongoose");

mongoose.model("OpnSearchConfig", {

    servicetype: {
        type: String,
        require: true
    },
    configuration: {
        type: Object,
        require: true
    }
});