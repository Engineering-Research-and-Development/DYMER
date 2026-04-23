const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
        email: {
            type: String,
            required: [true, 'email is mandatory'],
            trim: true,
            match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        },
        roles: {
            type: [String],
            trim: true,
            lowercase: true
        },
        ip: {
            type: String,
            trim: true
        },
        streamId: {
            type: String,
            trim: true
        },
        message: {
            type: String,
            trim: false
        },
        timestamps: {
            type: [String],
            trim: true
        }
    },
    {versionKey: false})

const messageModel = mongoose.model("messageModel", MessageSchema);

module.exports = messageModel;