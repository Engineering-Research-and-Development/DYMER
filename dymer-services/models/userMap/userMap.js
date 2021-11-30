const mongoose = require("mongoose");

mongoose.model("userMap", {

    username: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    extrainfo: {
        type: Object,
        require: true
    },
    roles: {
        type: Object,
        require: true
    }
});