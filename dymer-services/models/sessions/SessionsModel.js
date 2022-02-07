const mongooseSessions = require("mongoose");

mongooseSessions.model("SessionsModel", {
    _id: { type: String },
    expires: { type: Date },
    session: {
        cookie: {
            originalMaxAge: { type: String },
            expires: { type: String },
            secure: { type: Boolean },
            httpOnly: { type: Boolean },
            domain: { type: String },
            path: { type: String },
            sameSite: { type: String }
        },
        accessToken: { type: String },
        extraInfo: { type: Object }
    }
});