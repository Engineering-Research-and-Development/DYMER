const mongoose = require('mongoose');
 
const AgentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    provider: { 
        type: String, 
        enum: ['ollama', 'openai', 'custom'], 
        required: true 
    },
    model: { type: String, required: true },  
     
    settings: {
        baseUrl: { type: String },  
        apiKey: { type: String },   
        organizationId: { type: String }
    },
    systemPrompt: { 
        type: String, 
        default: 'Sei un assistente AI utile e professionale.' 
    },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});


const agentModel =  mongoose.model('Agent', AgentSchema);

module.exports = agentModel;

 

 