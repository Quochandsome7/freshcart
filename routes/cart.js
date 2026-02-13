const express = require('express');
const router = express.Router();
const CartController = require('../controllers/CartController');

// View cart
router.get('/', CartController.viewCart);

// Get cart data (JSON)
router.get('/data', CartController.getCart);

// Add to cart
router.post('/add', CartController.addToCart);

// Update cart item
router.put('/update', CartController.updateCart);
router.post('/update', CartController.updateCart);

// Remove item
router.delete('/remove', CartController.removeItem);
router.post('/remove', CartController.removeItem);

// Clear cart
router.delete('/clear', CartController.clearCart);
router.post('/clear', CartController.clearCart);

module.exports = router;
