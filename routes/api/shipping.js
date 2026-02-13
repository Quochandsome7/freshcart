const express = require('express');
const router = express.Router();
const ShippingController = require('../../controllers/ShippingController');

// Calculate shipping fee
router.post('/calculate-fee', ShippingController.calculateFee);

// Create shipping order
router.post('/create-order', ShippingController.createShippingOrder);

// Track shipment
router.get('/track/:tracking', ShippingController.trackShipment);

// Get shipping label
router.get('/label/:tracking', ShippingController.getLabel);

// Webhooks from carriers
router.post('/webhook/ghtk', ShippingController.ghtkWebhook);
router.post('/webhook/viettelpost', ShippingController.viettelPostWebhook);

module.exports = router;
