const DymerPaymentPlugin = {
    init: function() {
         
        const paymentButtons = document.querySelectorAll('[data-dymer-payment="stripe"]');
        
        paymentButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleCheckout(e));
        });
    },

   handleCheckout: async function(itemId) {
        const response = await fetch('/api/payments/create-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId })
        });
        const data = await response.json();
        
        if (data.success) {
            window.location.href = data.url; // Redirect diretto
        } else {
            alert(data.message);
        }
  }
};