const stripeController = require('./stripeController');
const mongoose = require("mongoose");
const PaymentConfig = mongoose.model("PaymentConfig");

const path = require('path');
const nameFile = path.basename(__filename);
const axios = require('axios');


//const paypalController = require('./paypalController');
 
 
const { encrypt, decrypt } = require('../utility');

/**
 * Entry point unico per la creazione di sessioni di pagamento.
 * Supporta diversi gateway in modo dinamico.
 */
exports.createCheckoutSession = async (req, res) => {
    const { itemId, gateway, quantity = 1 } = req.body;

    // 1. VALIDAZIONE INPUT
    if (!itemId || !gateway) {
        return res.status(400).json({
            success: false,
            message: "Parametri mancanti: itemId e gateway sono obbligatori."
        });
    }

    try {
        // 2. VALIDAZIONE BUSINESS (Recupero oggetto da Dymer)
        // Lo facciamo qui una volta sola per evitare di ripeterlo nei controller specifici
        const item = await dymerService.getItemById(itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "L'articolo richiesto non esiste nel catalogo Dymer."
            });
        }

        // Controllo disponibilità (Stock)
        if (item.stock !== undefined && item.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: "Disponibilità insufficiente per completare l'ordine."
            });
        }

        // 3. DELEGA AL GATEWAY SPECIFICO
        // Usiamo uno switch per gestire l'estendibilità (domani potresti aggiungere Satispay o Apple Pay)
        let checkoutData;

        switch (gateway.toLowerCase()) {
            case 'stripe':
                checkoutData = await stripeController.internalCreateSession(item, quantity, req.user);
                break;
            
            case 'paypal':
                checkoutData = await paypalController.internalCreateOrder(item, quantity, req.user);
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: `Il gateway di pagamento '${gateway}' non è supportato.`
                });
        }

        // 4. RISPOSTA UNIFORME AL FRONTEND
        // Non importa quale gateway sia, il frontend riceverà sempre un URL a cui andare
        return res.status(200).json({
            success: true,
            gateway: gateway,
            checkoutUrl: checkoutData.url,
            sessionId: checkoutData.id // ID interno della transazione per log o tracking
        });

    } catch (error) {
        // LOGGING PROFESSIONALE
        console.error(`[PAYMENT_ERROR] [Gateway: ${gateway}] [Item: ${itemId}]:`, error);

        return res.status(500).json({
            success: false,
            message: "Si è verificato un errore critico durante la generazione del pagamento.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};



 
     exports.getPaymentConfig = async (req, res) => {
    try {
        // 1. Controllo UserId (Safety check)
        const ownerId = req.user ? req.user.id : null;
        
        if (!ownerId) {
            // return res.status(401).json({ 
            //     message: "Utente non autenticato o sessione scaduta." 
            // });
            console.warn("Tentativo di accesso alla config senza userId. Restituisco config vuota.");
        }

        // 2. Cerchiamo la config
        const config = await PaymentConfig.findOne({ ownerId });

        // 3. Gestione "First Access"
        // Se non esiste, restituiamo un oggetto di default "vuoto" invece di un errore
        if (!config) {
            return res.status(200).json({
                isEnabled: false,
                stripe: { active: false, mode: 'test', publicKey: '', hasSecret: false },
                paypal: { active: false, mode: 'sandbox', clientId: '', hasSecret: false }
            });
        }

        // 4. Mappatura sicura (con fallback per campi mancanti)
        const safeConfig = {
            isEnabled: config.isEnabled || false,
            stripe: {
                active: config.stripe?.active || false,
                mode: config.stripe?.mode || 'test',
                publicKey: config.stripe?.publicKey || '',
                hasSecret: !!config.stripe?.secretKey
            },
            paypal: {
                active: config.paypal?.active || false,
                mode: config.paypal?.mode || 'sandbox',
                clientId: config.paypal?.clientId || '',
                hasSecret: !!config.paypal?.clientSecret
            }
        };

        return res.status(200).json(safeConfig);

    } catch (error) {
        console.error("Errore recupero config:", error);
        return res.status(500).json({ 
            message: "Si è verificato un errore interno nel recupero delle impostazioni." 
        });
    }
};
 

/**
 * POST /api/config/payments
 * Crea o aggiorna la configurazione
 */
exports.savePaymentConfig = async (req, res) => {
    try {
        const ownerId = req.user.id;
        const data = req.body;

        // Criptiamo i segreti prima di salvarli
        const updateData = {
            ownerId,
            isEnabled: data.isEnabled,
            stripe: {
                ...data.stripe,
                secretKey: data.stripe.secretKey ? encrypt(data.stripe.secretKey) : undefined,
                webhookSecret: data.stripe.webhookSecret ? encrypt(data.stripe.webhookSecret) : undefined
            },
            paypal: {
                ...data.paypal,
                clientSecret: data.paypal.clientSecret ? encrypt(data.paypal.clientSecret) : undefined
            }
        };

        // Rimuoviamo i campi undefined per non sovrascrivere chiavi esistenti se non inviate
        if (!data.stripe.secretKey) delete updateData.stripe.secretKey;
        if (!data.paypal.clientSecret) delete updateData.paypal.clientSecret;

        const config = await PaymentConfig.findOneAndUpdate(
            { ownerId },
            { $set: updateData },
            { upsert: true, new: true }
        );

        res.status(200).json({ message: "Configurazione salvata con successo" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Errore durante il salvataggio" });
    }
};