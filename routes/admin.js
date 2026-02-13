const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const { isAdmin } = require('../middleware/auth');

// Apply admin middleware to all routes
router.use(isAdmin);

// Dashboard
router.get('/', AdminController.dashboard);

// Products
router.get('/products', AdminController.products);
router.post('/products', AdminController.createProduct);
router.put('/products/:id', AdminController.updateProduct);
router.post('/products/:id/update', AdminController.updateProduct);
router.delete('/products/:id', AdminController.deleteProduct);
router.post('/products/:id/delete', AdminController.deleteProduct);

// Orders
router.get('/orders', AdminController.orders);
router.get('/orders/:id', AdminController.orderDetail);
router.put('/orders/:id/status', AdminController.updateOrderStatus);
router.post('/orders/:id/status', AdminController.updateOrderStatus);

// Inventory
router.get('/inventory', AdminController.inventory);
router.post('/inventory/update', AdminController.updateStock);

// Categories
router.get('/categories', AdminController.categories);

// Users
router.get('/users', AdminController.users);
router.post('/users/:id/toggle-lock', AdminController.toggleUserLock);
router.post('/users/:id/delete', AdminController.deleteUser);
router.post('/users/:id/restore', AdminController.restoreUser);

module.exports = router;
