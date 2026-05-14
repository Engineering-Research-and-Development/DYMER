const mongoose = require('mongoose');
const paymentConfigSchema = new mongoose.Schema({
    // Riferimento all'utente o all'organizzazione proprietaria del catalogo
    ownerId: { 
        type: String, 
        required: true, 
        unique: true, 
        index: true 
    },
    
    // Stato globale dei pagamenti per questo utente
    isEnabled: { type: Boolean, default: false },

    // Configurazione STRIPE
    stripe: {
        active: { type: Boolean, default: false },
        mode: { type: String, enum: ['test', 'live'], default: 'test' },
        publicKey: { type: String, trim: true },
        secretKey: { type: String, trim: true }, // Criptata a riposo!
        webhookSecret: { type: String, trim: true },
        currency: { type: String, default: 'EUR' }
    },

    // Configurazione PAYPAL
    paypal: {
        active: { type: Boolean, default: false },
        mode: { type: String, enum: ['sandbox', 'live'], default: 'sandbox' },
        clientId: { type: String, trim: true },
        clientSecret: { type: String, trim: true }, // Criptata a riposo!
        currency: { type: String, default: 'EUR' }
    },

    // Preferenze di sistema
    settings: {
        successUrl: { type: String }, // Opzionale: se l'utente vuole redirect custom
        cancelUrl: { type: String },
        autoInvoice: { type: Boolean, default: true }
    }
}, { timestamps: true });


const paymentConfigModel = mongoose.model('PaymentConfig', paymentConfigSchema);

module.exports = paymentConfigModel;