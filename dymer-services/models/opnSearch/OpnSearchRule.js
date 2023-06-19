const mongoose = require("mongoose");

mongoose.model("OpnSearchRule", {
    //Title, author, publisher,description
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
    },sendnotification: {
        type: Boolean,
        require: true
    },
});