const express = require('express');
const router = express.Router();
const PaymentController = require('../../controllers/PaymentController');

// Create payment
router.post('/create', PaymentController.createPayment);

// VNPAY callback/IPN
router.get('/vnpay/callback', PaymentController.handleVNPAYCallback);
router.post('/vnpay/ipn', PaymentController.handleVNPAYCallback);

// MoMo callback/IPN
router.get('/momo/return', PaymentController.handleMoMoCallback);
router.post('/momo/callback', PaymentController.handleMoMoCallback);

// Demo MoMo page
router.get('/momo/demo', PaymentController.momoDemo);

// Demo VNPay page
router.get('/vnpay/demo', PaymentController.vnpayDemo);

// Payment status
router.get('/status/:orderId', PaymentController.getPaymentStatus);

module.exports = router;
