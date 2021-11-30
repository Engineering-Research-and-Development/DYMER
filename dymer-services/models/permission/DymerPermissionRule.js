const mongoose = require("mongoose");

mongoose.model("DymerPermissionRule", {
    //Title, author, publisher,description
    role: {
        type: String,
        require: true
    },
    perms: {
        type: Object,
        require: true
    }
});