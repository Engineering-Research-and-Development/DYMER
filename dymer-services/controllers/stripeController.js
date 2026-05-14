const Stripe = require('stripe');
const { encrypt, decrypt } = require('../utility');
 
const PaymentConfig = require('../models/payments/payments');

exports.internalCreateSession = async (item, quantity, ownerId) => {
    const config = await PaymentConfig.findOne({ ownerId });
    if (!config || !config.stripe.secretKey) throw new Error("Configurazione Stripe incompleta.");

    const stripe = new Stripe(decrypt(config.stripe.secretKey));
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: item.currency || 'eur',
                unit_amount: Math.round(item.price * 100),
                product_data: { name: item.title },
            },
            quantity: quantity,
        }],
        mode: 'payment',
        success_url: `${process.env.BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.BASE_URL}/cancel`,
        metadata: { dymer_id: item._id.toString() }
    });
    return { url: session.url, id: session.id };
};