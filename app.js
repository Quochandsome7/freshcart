require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

// Initialize express app
const app = express();

// Database
const { sequelize, testConnection } = require('./config/database');
const { syncDatabase } = require('./models');

// Create session store
const sessionStore = new SequelizeStore({
    db: sequelize,
    tableName: 'sessions',
    checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 min
    expiration: 24 * 60 * 60 * 1000 // Session expires in 24 hours
});

// Trust proxy for Vercel/production (needed for secure cookies behind reverse proxy)
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'freshcart_secret_key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Create session table (handle async error to prevent crash on Vercel)
sessionStore.sync().catch(err => console.error('Session store sync error:', err));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Load middleware
const { loadUser } = require('./middleware/auth');
const { loadCart } = require('./middleware/cart');

app.use(loadUser);
app.use(loadCart);

// Flash messages middleware
app.use((req, res, next) => {
    res.locals.message = req.session.message || null;
    delete req.session.message;
    res.locals.currentPath = req.path;
    next();
});

// Format currency helper
app.locals.formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
};

// Format date helper
app.locals.formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Status text helper
app.locals.getStatusText = (status) => {
    const statusMap = {
        'pending': 'Chờ xác nhận',
        'confirmed': 'Đã xác nhận',
        'processing': 'Đang xử lý',
        'shipped': 'Đang giao',
        'delivered': 'Đã giao',
        'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
};

// Payment status text helper
app.locals.getPaymentStatusText = (status) => {
    const statusMap = {
        'pending': 'Chờ thanh toán',
        'paid': 'Đã thanh toán',
        'failed': 'Thanh toán thất bại',
        'refunded': 'Đã hoàn tiền'
    };
    return statusMap[status] || status;
};

// Health check endpoint (no DB required)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// Routes
const indexRoutes = require('./routes/index');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const paymentApiRoutes = require('./routes/api/payment');
const shippingApiRoutes = require('./routes/api/shipping');

app.use('/', indexRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/checkout', checkoutRoutes);
app.use('/', userRoutes); // Login, register, profile, orders
app.use('/admin', adminRoutes);
app.use('/api/payment', paymentApiRoutes);
app.use('/api/shipping', shippingApiRoutes);

// 404 handler
app.use((req, res, next) => {
    res.status(404).render('errors/404', {
        title: 'Không tìm thấy trang',
        message: 'Trang bạn tìm kiếm không tồn tại'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    try {
        res.status(500).render('errors/500', {
            title: 'Lỗi máy chủ',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
        });
    } catch (renderErr) {
        console.error('Render error:', renderErr);
        res.status(500).json({ error: err.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Test database connection
        await testConnection();

        // Sync database (create tables if not exist)
        await syncDatabase(false);

        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🥬 FreshCart - Thực phẩm hữu cơ                          ║
║                                                            ║
║   Server running at: http://localhost:${PORT}                ║
║                                                            ║
║   📝 Test accounts:                                        ║
║      Admin: admin@freshcart.vn / admin123                  ║
║      Customer: customer@example.com / customer123          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
            `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Only start server locally, Vercel handles this via serverless functions
if (!process.env.VERCEL) {
    startServer();
}

module.exports = app;
