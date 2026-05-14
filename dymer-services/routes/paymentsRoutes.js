const stripe = require('stripe');
const express = require('express');
const router = express.Router();
var util = require('../utility');


const paymentController = require('../controllers/paymentController');
// router.post('/create-session', paymentController.createCheckoutSession);

 
// router.post('/checkout/create', paymentController.createCheckoutSession);
// router.post('/webhook/stripe', express.raw({type: 'application/json'}), stripeController.webhook);

router.get('/getpayments', util.checkIsAdmin, paymentController.getPaymentConfig);
router.post('/setpayments', util.checkIsAdmin, paymentController.savePaymentConfig);

router.post('/api/payments/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
 
        event = stripe.webhooks.constructEvent(
            req.body, 
            sig, 
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error(`❌ Errore validazione Webhook: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            await handleSuccessfulPayment(session);
            break;

        case 'payment_intent.payment_failed':
            const failedIntent = event.data.object;
            console.warn(`⚠️ Pagamento fallito per l'utente: ${failedIntent.customer}`);
           
            break;

        default:
            console.log(`Evento non gestito: ${event.type}`);
    }

 
    res.json({ received: true });
});

 
async function handleSuccessfulPayment(session) {
    
    const dymerItemId = session.metadata.dymer_id;
    const customerEmail = session.customer_details.email;
    const amountPaid = session.amount_total / 100;

    console.log(`✅ Pagamento completato! Prodotto: ${dymerItemId}, Totale: ${amountPaid}€`);

    try {
        // OPERAZIONI SU DYMER / DATABASE
        
        // A. Aggiorna lo stato dell'ordine nel tuo sistema
        // await dymer.updateItem(dymerItemId, { status: 'paid', customer: customerEmail });

        // B. Decrementa lo stock (Inventory Management)
        // await dymer.decrementStock(dymerItemId, 1);

        // C. Genera licenza o invia file digitale via mail
        // await mailer.sendConfirmation(customerEmail, dymerItemId);

    } catch (error) {
        console.error(`❌ Errore durante l'aggiornamento post-vendita: ${error.message}`);
        // Nota: Stripe riproverà a inviare il webhook se non rispondi 200, 
        // quindi qui potresti voler sollevare un errore per fare un retry.
    }
}



module.exports = router;