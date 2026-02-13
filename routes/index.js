const express = require('express');
const router = express.Router();
const { Product, Category } = require('../models');

/**
 * Home page routes
 */

// Home page
router.get('/', async (req, res) => {
    try {
        // Get featured products
        const featuredProducts = await Product.findAll({
            where: { isFeatured: true, isActive: true },
            limit: 8,
            order: [['createdAt', 'DESC']]
        });

        // Get categories
        const categories = await Category.findAll({
            where: { isActive: true }
        });

        // Get new products
        const newProducts = await Product.findAll({
            where: { isActive: true },
            limit: 8,
            order: [['createdAt', 'DESC']]
        });

        // Parse images from JSON string to array
        featuredProducts.forEach(p => {
            if (typeof p.images === 'string') {
                try { p.images = JSON.parse(p.images); } catch (e) { p.images = []; }
            }
        });
        newProducts.forEach(p => {
            if (typeof p.images === 'string') {
                try { p.images = JSON.parse(p.images); } catch (e) { p.images = []; }
            }
        });

        res.render('home', {
            title: 'FreshCart - Thực phẩm hữu cơ',
            featuredProducts,
            categories,
            newProducts
        });
    } catch (error) {
        console.error('Home page error:', error);
        res.status(500).render('errors/500', {
            title: 'Lỗi',
            message: error.message
        });
    }
});

// About page
router.get('/about', (req, res) => {
    res.render('pages/about', { title: 'Về chúng tôi' });
});

// Contact page
router.get('/contact', (req, res) => {
    res.render('pages/contact', { title: 'Liên hệ' });
});

// Shopping Guide page
router.get('/shopping-guide', (req, res) => {
    res.render('pages/shopping-guide', { title: 'Hướng dẫn mua hàng' });
});

// Return Policy page
router.get('/return-policy', (req, res) => {
    res.render('pages/return-policy', { title: 'Chính sách đổi trả' });
});

// Shipping Policy page
router.get('/shipping-policy', (req, res) => {
    res.render('pages/shipping-policy', { title: 'Chính sách vận chuyển' });
});

module.exports = router;
