const mongoose = require("mongoose");
const util = require("../../utility")

const OpnUserSchema = new mongoose.Schema({
        d_cid: {
            type: String,
            trim: true,
            required: true
        },
        d_uid: {
            type: String,
            trim: true,
            required: true
        },
        d_gid: {
            type: String,
            trim: true,
            required: true
        },
        d_mail: {
            type: String,
            trim: true,
            lowercase: true,
            match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            required: true
        },
        d_pwd: {
            type: String,
            trim: true,
            required: true
        },
        d_isEncrypted: {
            type: Boolean,
            required: true
        }
    },
    {versionKey: false})
OpnUserSchema.pre("save", function (next) {
    if (this.isModified('d_pwd') || this.isNew) {
        let encryptedPwd = util.encrypt("", this.d_pwd)
        this.d_pwd = encryptedPwd;
        this.d_isEncrypted = true;
    }
    next();
})

OpnUserSchema.pre("updateOne", function (next) {
    const update = this.getUpdate();
    if (update.d_pwd) {
        if(!update.d_isEncrypted) {
            let encryptedPwd = util.encrypt("", update.d_pwd)
            update.d_pwd = encryptedPwd
        } else {
            let decrypted = util.decrypt("", update.d_pwd)
            let encryptedPwd = util.encrypt("", decrypted)
            update.d_pwd = encryptedPwd
        }
        update.d_isEncrypted = true
    }
    next();
})

const OpnUserModel = mongoose.model("OpnUserModel", OpnUserSchema);

module.exports = OpnUserModel;