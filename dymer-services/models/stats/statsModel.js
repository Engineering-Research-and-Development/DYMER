const mongoose = require("mongoose");

const StatsSchema = new mongoose.Schema({
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
        resourceId: {
            type: String,
            trim: true
        },
        title: {
            type: String,
            trim: false
        },
        type: {
            type: String,
            trim: true
        },
        act: {
            type: String,
            trim: true,
            enum: ["views", "like", "dislike"]
        },
        timestamps: {
            type: [String],
            trim: true
        }
    },
    {versionKey: false})

const statsModel = mongoose.model("statsModel", StatsSchema);

module.exports = statsModel;