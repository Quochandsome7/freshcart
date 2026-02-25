// Global error handlers to prevent silent crashes on Vercel
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});

let app;

try {
    require('dotenv').config();
    const express = require('express');
    const path = require('path');
    const session = require('express-session');
    const expressLayouts = require('express-ejs-layouts');
    // Explicitly require mysql2 so Vercel's bundler includes it
    // (Sequelize dynamically requires it, which Vercel can't detect)
    require('mysql2');
    const SequelizeStore = require('connect-session-sequelize')(session.Store);
    const { DataTypes } = require('sequelize');

    // Initialize express app
    app = express();

    // Database
    const { sequelize, testConnection } = require('./config/database');
    const { syncDatabase } = require('./models');

    // Define Session model explicitly to disable timestamps
    const SessionModel = sequelize.define('Session', {
        sid: {
            type: DataTypes.STRING(36),
            primaryKey: true
        },
        expires: DataTypes.DATE,
        data: DataTypes.TEXT
    }, {
        tableName: 'sessions',
        timestamps: false
    });

    // Create session store using the explicit model
    const sessionStore = new SequelizeStore({
        db: sequelize,
        table: 'Session',
        checkExpirationInterval: 15 * 60 * 1000,
        expiration: 24 * 60 * 60 * 1000
    });

    // Trust proxy for Vercel/production
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
            maxAge: 24 * 60 * 60 * 1000
        }
    }));

    // Sync session table (handle async error)
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

    // Debug endpoint to test DB and rendering
    app.get('/debug', async (req, res) => {
        const fs = require('fs');
        const results = { dbConnection: false, dbQuery: false };
        results.__dirname = __dirname;
        results.viewsPath = path.join(__dirname, 'views');
        results.viewsExists = fs.existsSync(path.join(__dirname, 'views'));
        results.layoutExists = fs.existsSync(path.join(__dirname, 'views', 'layouts', 'main.ejs'));
        results.homeExists = fs.existsSync(path.join(__dirname, 'views', 'home.ejs'));
        results.error404Exists = fs.existsSync(path.join(__dirname, 'views', 'errors', '404.ejs'));
        try {
            const viewFiles = fs.readdirSync(path.join(__dirname, 'views'));
            results.viewFiles = viewFiles;
        } catch (e) {
            results.viewFilesError = e.message;
        }
        try {
            await sequelize.authenticate();
            results.dbConnection = true;
        } catch (e) {
            results.dbConnectionError = e.message;
        }
        try {
            const { Product } = require('./models');
            const count = await Product.count();
            results.dbQuery = true;
            results.productCount = count;
        } catch (e) {
            results.dbQueryError = e.message;
        }
        // Test EJS rendering
        try {
            const ejs = require('ejs');
            const rendered = await ejs.renderFile(path.join(__dirname, 'views', 'errors', '404.ejs'), {
                title: 'Test', message: 'Test'
            });
            results.ejsRender = true;
            results.ejsLength = rendered.length;
        } catch (e) {
            results.ejsRenderError = e.message;
        }
        // Test layout rendering (callback mode - does NOT send response)
        try {
            await new Promise((resolve, reject) => {
                res.render('errors/404', { title: 'Test', message: 'Test' }, (err, html) => {
                    if (err) {
                        results.layoutRenderError = err.message;
                        reject(err);
                    } else {
                        results.layoutRender = true;
                        results.htmlLength = html.length;
                        resolve(html);
                    }
                });
            });
        } catch (e) {
            // Error already captured above
        }
        if (!res.headersSent) {
            res.json(results);
        }
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
    app.use('/', userRoutes);
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
        if (res.headersSent) {
            return next(err);
        }
        try {
            res.status(500).render('errors/500', {
                title: 'Lỗi máy chủ',
                message: process.env.NODE_ENV === 'development' ? err.message : 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
            });
        } catch (renderErr) {
            console.error('Render error:', renderErr);
            if (!res.headersSent) {
                res.status(500).json({ error: err.message });
            }
        }
    });

    // Start server (only locally, not on Vercel)
    const PORT = process.env.PORT || 3000;

    const startServer = async () => {
        try {
            await testConnection();
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

    if (!process.env.VERCEL) {
        startServer();
    }

} catch (initError) {
    // If app initialization fails, create a minimal express app that reports the error
    console.error('❌ App initialization failed:', initError);
    const express = require('express');
    app = express();
    app.use((req, res) => {
        res.status(500).json({
            error: 'App initialization failed',
            message: initError.message,
            stack: initError.stack
        });
    });
}

module.exports = app;
