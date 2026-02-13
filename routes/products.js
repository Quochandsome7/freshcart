const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');

// Product listing
router.get('/', ProductController.index);

// Search products
router.get('/search', ProductController.search);

// Filter by category
router.get('/category/:categoryId', ProductController.filterByCategory);

// Product detail
router.get('/:id', ProductController.show);

// API: Get product stock
router.get('/:id/stock', ProductController.getStock);

module.exports = router;
