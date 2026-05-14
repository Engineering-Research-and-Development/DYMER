const mongoose = require("mongoose");

mongoose.model("ServiceEntityHooks", {
    //Title, author, publisher,description
    _index: {
        type: String,
        require: true
    },
    _type: {
        type: String,
        require: true
    },
    microserviceType: {
        type: String,
        require: true
    },
    eventType: {
        type: String,
        require: true
    },
    service: {
        type: Object,
        require: true
    },
    expertMode: {
        type: Boolean,
        require: true
    },
    webhookUrl: {
        type: String,
        require: true,
        description: "The URL endpoint to which the webhook payload will be sent."
    },
    httpMethod: {
        type: String,
        require: true,
        enum: ["POST", "PUT", "GET", "DELETE"],
        default: "POST",
        description: "The HTTP method to use for the webhook request."
    },
    headers: {
        type: Map,
        of: String,
        default: {},
        description: "Custom HTTP headers to include with the webhook request (e.g., Authorization, Content-Type )."
    },
    payloadTemplate: {
        type: String,
        default: "",
        description: "Optional Handlebars template for custom webhook payload. If empty, the full entity data will be sent."
    },
    isActive: {
        type: Boolean,
        default: true,
        description: "Whether the webhook is currently active."
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});