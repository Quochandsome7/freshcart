const { Product } = require('../models');
const { cartHelpers } = require('../middleware/cart');

/**
 * Cart Controller
 * Handles shopping cart operations
 */
const CartController = {
    /**
     * View cart page
     */
    async viewCart(req, res) {
        try {
            const cart = req.session.cart;

            // Validate cart items against database
            for (let i = cart.items.length - 1; i >= 0; i--) {
                const item = cart.items[i];
                const product = await Product.findByPk(item.productId);

                if (!product || !product.isActive) {
                    // Remove unavailable product
                    cart.items.splice(i, 1);
                } else {
                    // Update price and stock
                    item.price = parseFloat(product.price);
                    item.stock = product.stock;
                    if (item.quantity > product.stock) {
                        item.quantity = product.stock;
                    }
                }
            }

            cartHelpers.recalculate(cart);
            req.session.save();

            res.render('cart/index', {
                title: 'Giỏ hàng',
                cart
            });
        } catch (error) {
            console.error('CartController.viewCart error:', error);
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * Add product to cart
     */
    async addToCart(req, res) {
        try {
            // Check if user is logged in
            if (!req.session || !req.session.user) {
                const isJson = req.xhr ||
                    (req.headers.accept && req.headers.accept.includes('json')) ||
                    (req.headers['content-type'] && req.headers['content-type'].includes('application/json'));

                if (isJson) {
                    return res.status(401).json({
                        requireLogin: true,
                        loginUrl: '/login',
                        error: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng'
                    });
                }
                req.session.returnTo = req.headers.referer || '/products';
                return res.redirect('/login');
            }

            const { productId, quantity = 1 } = req.body;

            // Helper function to check if request is JSON
            const isJsonRequest = () => {
                return req.xhr ||
                    (req.headers.accept && req.headers.accept.includes('json')) ||
                    (req.headers['content-type'] && req.headers['content-type'].includes('application/json'));
            };

            const product = await Product.findByPk(productId);

            if (!product || !product.isActive) {
                if (isJsonRequest()) {
                    return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
                }
                req.session.message = { type: 'error', text: 'Sản phẩm không tồn tại' };
                return res.redirect('back');
            }

            if (!product.checkAvailability(parseInt(quantity))) {
                if (isJsonRequest()) {
                    return res.status(400).json({ error: 'Sản phẩm không đủ số lượng' });
                }
                req.session.message = { type: 'error', text: 'Sản phẩm không đủ số lượng' };
                return res.redirect('back');
            }

            const cart = req.session.cart;

            // Check if adding would exceed stock
            const existingItem = cart.items.find(item => item.productId === product.id);
            const currentQty = existingItem ? existingItem.quantity : 0;

            if (currentQty + parseInt(quantity) > product.stock) {
                if (isJsonRequest()) {
                    return res.status(400).json({ error: `Chỉ còn ${product.stock} sản phẩm trong kho` });
                }
                req.session.message = { type: 'error', text: `Chỉ còn ${product.stock} sản phẩm trong kho` };
                return res.redirect('back');
            }

            cartHelpers.addItem(cart, product, parseInt(quantity));
            req.session.save();

            if (isJsonRequest()) {
                return res.json({
                    success: true,
                    message: 'Đã thêm vào giỏ hàng',
                    cart: {
                        totalItems: cart.totalItems,
                        subtotal: cart.subtotal
                    }
                });
            }

            req.session.message = { type: 'success', text: 'Đã thêm vào giỏ hàng' };
            res.redirect('/cart');
        } catch (error) {
            console.error('CartController.addToCart error:', error);
            const isJsonRequest = () => {
                return req.xhr ||
                    (req.headers.accept && req.headers.accept.includes('json')) ||
                    (req.headers['content-type'] && req.headers['content-type'].includes('application/json'));
            };
            if (isJsonRequest()) {
                return res.status(500).json({ error: error.message });
            }
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * Update cart item quantity
     */
    async updateCart(req, res) {
        try {
            const { productId, quantity } = req.body;
            const cart = req.session.cart;

            // Validate stock
            const product = await Product.findByPk(productId);
            if (!product) {
                return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
            }

            const newQty = parseInt(quantity);
            if (newQty > product.stock) {
                return res.status(400).json({
                    error: `Chỉ còn ${product.stock} sản phẩm trong kho`,
                    maxStock: product.stock
                });
            }

            cartHelpers.updateQuantity(cart, parseInt(productId), newQty);
            req.session.save();

            res.json({
                success: true,
                cart: {
                    items: cart.items,
                    totalItems: cart.totalItems,
                    subtotal: cart.subtotal
                }
            });
        } catch (error) {
            console.error('CartController.updateCart error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * Remove item from cart
     */
    async removeItem(req, res) {
        try {
            const { productId } = req.body;
            const cart = req.session.cart;

            cartHelpers.removeItem(cart, parseInt(productId));
            req.session.save();

            if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
                return res.json({
                    success: true,
                    message: 'Đã xóa sản phẩm khỏi giỏ hàng',
                    cart: {
                        items: cart.items,
                        totalItems: cart.totalItems,
                        subtotal: cart.subtotal
                    }
                });
            }

            req.session.message = { type: 'success', text: 'Đã xóa sản phẩm khỏi giỏ hàng' };
            res.redirect('/cart');
        } catch (error) {
            console.error('CartController.removeItem error:', error);
            if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
                return res.status(500).json({ error: error.message });
            }
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * Clear entire cart
     */
    async clearCart(req, res) {
        try {
            const cart = req.session.cart;
            cartHelpers.clearCart(cart);
            req.session.save();

            if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
                return res.json({
                    success: true,
                    message: 'Đã xóa tất cả sản phẩm khỏi giỏ hàng'
                });
            }

            req.session.message = { type: 'success', text: 'Đã xóa tất cả sản phẩm khỏi giỏ hàng' };
            res.redirect('/cart');
        } catch (error) {
            console.error('CartController.clearCart error:', error);
            if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
                return res.status(500).json({ error: error.message });
            }
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * Get cart data as JSON (for AJAX)
     */
    async getCart(req, res) {
        try {
            const cart = req.session.cart;
            res.json({
                success: true,
                cart: {
                    items: cart.items,
                    totalItems: cart.totalItems,
                    subtotal: cart.subtotal
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = CartController;
