const mongoose = require("mongoose");

mongoose.model("ServiceEntityHooks", {
    //Title, author, publisher,description
    _index: {
        type: String,
        require: true
    },
    _type: {
        type: String,
        require: true
    },
    microserviceType: {
        type: String,
        require: true
    },
    eventType: {
        type: String,
        require: true
    },
    service: {
        type: Object,
        require: true
    }
});