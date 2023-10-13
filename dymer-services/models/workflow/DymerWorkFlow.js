const mongoose = require("mongoose");

const DymerWorkflowSchema = new mongoose.Schema({    
    title: {
        type: String,
        required: true
    },
    indexes: [{ 
        type: String,
        required: true
    }],
    action : {
        type: String,
        required: true
    },
    cond: {
        type: Object,
        required: true
    },
    active: {
        type: Boolean,
        required: true
    },
    workflow: {
        type: String,
        required: true
    },
    emailinfo: [{
        from: String,
        to: String,
        object: String,
        body: String
    }]
});

const DymerWorkflow = mongoose.model("DymerWorkflow", DymerWorkflowSchema);

module.exports = DymerWorkflow;