const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

// Configurazione Ambiente PayPal
const environment = new checkoutNodeJssdk.core.LiveEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
);
const client = new checkoutNodeJssdk.core.PayPalHttpClient(environment);

/**
 * Crea l'ordine PayPal
 */
exports.createOrder = async (req, res) => {
    try {
        const { itemId } = req.body;
        const item = await dymer.getItemById(itemId);

        const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: (item.currency || 'EUR').toUpperCase(),
                    value: item.price.toString() // PayPal accetta stringhe decimali
                },
                custom_id: itemId // Salviamo l'ID Dymer qui
            }],
            application_context: {
                return_url: `${process.env.BASE_URL}/success?gateway=paypal`,
                cancel_url: `${process.env.BASE_URL}/catalog/${itemId}`
            }
        });

        const order = await client.execute(request);
        
        // Cerchiamo il link di approvazione per il redirect
        const approveLink = order.result.links.find(link => link.rel === 'approve');
        res.json({ url: approveLink.href, orderId: order.result.id });
    } catch (error) {
        console.error("PayPal Error:", error);
        res.status(500).json({ error: "Errore PayPal" });
    }
};

/**
 * Cattura il pagamento (da chiamare al ritorno sulla success_url)
 */
exports.captureOrder = async (req, res) => {
    const { orderId } = req.body;
    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    try {
        const capture = await client.execute(request);
        const itemId = capture.result.purchase_units[0].custom_id;

        if (capture.result.status === 'COMPLETED') {
            // Logica di business: aggiorna Dymer
            console.log(`Pagamento PayPal completato per item: ${itemId}`);
            res.json({ success: true });
        }
    } catch (error) {
        res.status(500).json({ error: "Errore cattura PayPal" });
    }
};