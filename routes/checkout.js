const express = require('express');
const router = express.Router();
const CheckoutController = require('../controllers/CheckoutController');

// Step 1: Shipping info
router.get('/', CheckoutController.showCheckout);
router.post('/shipping-info', CheckoutController.saveShippingInfo);

// Step 2: Delivery options
router.get('/delivery', CheckoutController.showDelivery);
router.post('/select-shipping', CheckoutController.selectShipping);

// Step 3: Payment
router.get('/payment', CheckoutController.showPayment);
router.post('/place-order', CheckoutController.placeOrder);

// Confirmation
router.get('/confirm/:orderId', CheckoutController.confirm);

module.exports = router;
