const mongoose = require("mongoose");

mongoose.model("DymerAuthenticationRule", {
    //Title, author, publisher,description
    authtype: {
        type: String,
        require: true
    },
    host: {
        type: String,
        require: true
    },
    active: {
        type: Boolean,
        require: true
    },
    prop: {
        type: Object,
        require: true
    }
});