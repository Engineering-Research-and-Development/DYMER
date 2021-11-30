const mongoose = require("mongoose");

mongoose.model("EaggregationConfigRule", {

    servicetype: {
        type: String,
        require: true
    },
    configuration: {
        type: Object,
        require: true
    },
    _index: {
        type: String,
        require: true
    },
    _type: {
        type: String,
        require: true
    },
    mapping: {
        type: Object,
        require: true
    }
});