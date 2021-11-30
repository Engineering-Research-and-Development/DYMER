const mongoose = require("mongoose");

mongoose.model("Template", {
    //Title, author, publisher,description,html

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
    viewtype: [{
        rendertype: String
    }],
    instance: [{
        _index: String,
        _type: String
    }],
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

/*
    files: [{
        fieldname: String,
        originalname: String,
        encoding: String,
        mimetype: String ,
        src: String,
        size: String
    }],

    */