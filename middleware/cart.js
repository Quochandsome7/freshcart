/**
 * Cart Middleware
 * Loads cart from session and adds to res.locals
 */

const loadCart = (req, res, next) => {
    // Initialize cart if not exists
    if (!req.session.cart) {
        req.session.cart = {
            items: [],
            totalItems: 0,
            subtotal: 0
        };
    }

    // Calculate totals
    const cart = req.session.cart;
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Add cart to locals for views
    res.locals.cart = cart;
    next();
};

/**
 * Cart helper functions
 */
const cartHelpers = {
    /**
     * Add item to cart
     */
    addItem(cart, product, quantity = 1) {
        const existingItem = cart.items.find(item => item.productId === product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({
                productId: product.id,
                sku: product.sku,
                name: product.name,
                price: parseFloat(product.price),
                originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : null,
                quantity,
                image: product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder.jpg',
                stock: product.stock,
                weight: product.weight || 500
            });
        }

        this.recalculate(cart);
        return cart;
    },

    /**
     * Update item quantity
     */
    updateQuantity(cart, productId, quantity) {
        const item = cart.items.find(item => item.productId === productId);

        if (item) {
            if (quantity <= 0) {
                return this.removeItem(cart, productId);
            }
            item.quantity = Math.min(quantity, item.stock);
        }

        this.recalculate(cart);
        return cart;
    },

    /**
     * Remove item from cart
     */
    removeItem(cart, productId) {
        cart.items = cart.items.filter(item => item.productId !== productId);
        this.recalculate(cart);
        return cart;
    },

    /**
     * Clear cart
     */
    clearCart(cart) {
        cart.items = [];
        cart.totalItems = 0;
        cart.subtotal = 0;
        return cart;
    },

    /**
     * Recalculate cart totals
     */
    recalculate(cart) {
        cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cart.totalWeight = cart.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
        return cart;
    },

    /**
     * Get cart total with shipping
     */
    getTotal(cart, shippingFee = 0, discount = 0) {
        return cart.subtotal + shippingFee - discount;
    }
};

module.exports = {
    loadCart,
    cartHelpers
};
