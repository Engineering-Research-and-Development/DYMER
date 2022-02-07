const mongoose = require("mongoose");

mongoose.model("Form", {
    //Title, author, publisher,description
    title: {
        type: String,
        require: true
    },
    author: {
        type: String,
        require: true
    },
    description: {
        type: String,
        require: true
    },
    posturl: {
        type: String,
        require: true
    },
    instance: [{
        _index: String,
        _type: String
    }],
    structure: { type: Object },
    files: [mongoose.Schema.Types.ObjectId],
    properties: {
        created: {
            type: Date,
            default: Date.now
        },
        owner: {
            uid: {
                type: String,
                default: '0'
            },
            gid: {
                type: String,
                default: '0'
            }
        },
        changed: {
            type: Date,
            default: Date.now
        },
        grant: {
            view: {
                uid: [String],
                gid: [String]

            }
        },
        update: {
            view: {
                uid: [String],
                gid: [String]

            }
        },
        delete: {
            view: {
                uid: [String],
                gid: [String]

            }
        }
    }


});