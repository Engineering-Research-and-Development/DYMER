const mongoose = require("mongoose");

mongoose.model("DymerUser", {
    //Title, author, publisher,description
    username: {
        type: String,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    active: {
        type: Boolean,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    roles: {
        type: Object,
        require: true
    },
    prop: {
        type: Object,
        require: false
    },
    // AC MG
    salt: {
        type: String,
        require: false
    },
    //VL 8.5.25
    refreshToken: {
        type: String,
        require: false
    },
    csrfToken: {
        type: String,
        require: false
    },
    ip: {
        type: String,
        require: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});