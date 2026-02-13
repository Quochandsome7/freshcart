const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { isAuthenticated } = require('../middleware/auth');

// Login
router.get('/login', UserController.showLogin);
router.post('/login', UserController.login);

// Register
router.get('/register', UserController.showRegister);
router.post('/register', UserController.register);

// Forgot Password
router.get('/forgot-password', (req, res) => {
    res.render('user/forgot-password', { title: 'Quên mật khẩu' });
});

// Logout
router.get('/logout', UserController.logout);

// Profile (requires authentication)
router.get('/profile', isAuthenticated, UserController.profile);
router.post('/profile', isAuthenticated, UserController.updateProfile);

// Order history (requires authentication)
router.get('/orders', isAuthenticated, UserController.orderHistory);
router.get('/orders/:orderId', isAuthenticated, UserController.orderDetail);
router.post('/orders/:orderId/cancel', isAuthenticated, UserController.cancelOrder);
router.get('/orders/:orderId/payment', isAuthenticated, UserController.showOrderPayment);

module.exports = router;
