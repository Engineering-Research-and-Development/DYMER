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
    }
});