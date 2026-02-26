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
    const cookieSession = require('cookie-session');
    const expressLayouts = require('express-ejs-layouts');
    // Explicitly require mysql2 so Vercel's bundler includes it
    require('mysql2');

    // Initialize express app
    app = express();

    // Database
    const { sequelize, testConnection } = require('./config/database');
    const { syncDatabase } = require('./models');

    // Trust proxy for Vercel/production
    app.set('trust proxy', 1);

    // Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, 'public')));

    // Cookie-session: stores session data directly in encrypted cookie
    // No database needed - works reliably on Vercel serverless
    const isProduction = process.env.NODE_ENV === 'production';
    app.use(cookieSession({
        name: 'freshcart.session',
        keys: [
            process.env.SESSION_SECRET || 'freshcart_secret_key_1',
            process.env.SESSION_SECRET_2 || 'freshcart_secret_key_2'
        ],
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        httpOnly: true
    }));

    // Patch cookie-session to support req.session.save() and req.session.destroy()
    // (express-session API compatibility)
    app.use((req, res, next) => {
        if (req.session && !req.session.save) {
            req.session.save = (cb) => { if (cb) cb(); };
        }
        if (req.session && !req.session.destroy) {
            req.session.destroy = (cb) => {
                req.session = null;
                if (cb) cb();
            };
        }
        next();
    });

    // Sync all database tables
    syncDatabase(false).catch(err => console.error('Database sync error:', err));

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

    // Quick env check
    app.get('/env-check', (req, res) => {
        res.json({
            NODE_ENV: process.env.NODE_ENV,
            hasDbHost: !!(process.env.MYSQLHOST || process.env.DB_HOST),
            hasDbName: !!(process.env.MYSQLDATABASE || process.env.DB_NAME),
            hasDbUser: !!(process.env.MYSQLUSER || process.env.DB_USER),
            hasDbPass: !!(process.env.MYSQLPASSWORD || process.env.DB_PASSWORD),
            hasMysqlUrl: !!process.env.MYSQL_URL,
            hasSessionSecret: !!process.env.SESSION_SECRET,
            hasVercel: !!process.env.VERCEL,
            sessionCookieConfig: {
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
            }
        });
    });

    // Login test endpoint - tests DB + password directly (no session involved)
    app.post('/login-test', async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.json({ ok: false, error: 'Missing email or password' });
            }
            const { User } = require('./models');
            const bcrypt = require('bcryptjs');
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.json({ ok: false, error: 'User not found', email });
            }
            const passwordMatch = await bcrypt.compare(password, user.password);
            return res.json({
                ok: true,
                passwordMatch,
                userId: user.id,
                role: user.role,
                isActive: user.isActive
            });
        } catch (error) {
            return res.status(500).json({ ok: false, error: error.message });
        }
    });

    // Session test endpoint
    app.get('/session-test', async (req, res) => {
        const results = { timestamp: new Date().toISOString() };
        try {
            // Check if Session model exists
            results.modelExists = !!sequelize.models.Session;
            results.modelTimestamps = sequelize.models.Session?.options?.timestamps;
            results.modelTableName = sequelize.models.Session?.getTableName?.();
            results.modelAttributes = Object.keys(sequelize.models.Session?.rawAttributes || {});
        } catch (e) {
            results.modelError = e.message;
        }
        try {
            // Test a raw query on the sessions table
            const [tableInfo] = await sequelize.query("DESCRIBE sessions");
            results.tableColumns = tableInfo.map(c => c.Field);
        } catch (e) {
            results.tableError = e.message;
        }
        try {
            // Test session store get
            await new Promise((resolve, reject) => {
                sessionStore.get('test-sid', (err, session) => {
                    if (err) {
                        results.storeGetError = err.message;
                        results.storeGetSql = err.sql || err.parent?.sql;
                        reject(err);
                    } else {
                        results.storeGetOk = true;
                        resolve(session);
                    }
                });
            });
        } catch (e) {
            // Error already captured
        }
        res.json(results);
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

    // Seed endpoint - creates default users if none exist
    app.get('/seed', async (req, res) => {
        try {
            const { User } = require('./models');
            const bcrypt = require('bcryptjs');

            const userCount = await User.count();
            if (userCount > 0) {
                return res.json({ message: 'Database already has ' + userCount + ' users. Seed skipped.' });
            }

            const adminPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                email: 'admin@freshcart.vn',
                password: adminPassword,
                fullName: 'Admin FreshCart',
                phone: '0123456789',
                role: 'admin',
                address: 'Hà Nội, Việt Nam'
            }, { hooks: false });

            const managerPassword = await bcrypt.hash('manager123', 10);
            await User.create({
                email: 'manager@freshcart.vn',
                password: managerPassword,
                fullName: 'Inventory Manager',
                phone: '0987654321',
                role: 'inventory_manager',
                address: 'TP. Hồ Chí Minh, Việt Nam'
            }, { hooks: false });

            const customerPassword = await bcrypt.hash('customer123', 10);
            await User.create({
                email: 'customer@example.com',
                password: customerPassword,
                fullName: 'Nguyễn Văn A',
                phone: '0912345678',
                role: 'customer',
                address: '123 Đường ABC, Quận 1, TP.HCM'
            }, { hooks: false });

            res.json({
                message: 'Seed completed!',
                accounts: [
                    { email: 'admin@freshcart.vn', password: 'admin123', role: 'admin' },
                    { email: 'manager@freshcart.vn', password: 'manager123', role: 'inventory_manager' },
                    { email: 'customer@example.com', password: 'customer123', role: 'customer' }
                ]
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Fix admin - forcefully create/update admin account
    app.get('/fix-admin', async (req, res) => {
        try {
            const { User } = require('./models');
            const bcrypt = require('bcryptjs');

            // List all existing users first
            const allUsers = await User.findAll({ attributes: ['id', 'email', 'role', 'isActive', 'createdAt'] });

            // Upsert admin account
            const adminPassword = await bcrypt.hash('admin123', 10);
            const [admin, created] = await User.findOrCreate({
                where: { email: 'admin@freshcart.vn' },
                defaults: {
                    email: 'admin@freshcart.vn',
                    password: adminPassword,
                    fullName: 'Admin FreshCart',
                    phone: '0123456789',
                    role: 'admin',
                    isActive: true,
                    address: 'Hà Nội, Việt Nam'
                },
                hooks: false
            });

            if (!created) {
                // Update existing admin's password
                await admin.update({ password: adminPassword, role: 'admin', isActive: true }, { hooks: false });
            }

            res.json({
                existingUsersBefore: allUsers.map(u => ({ id: u.id, email: u.email, role: u.role, isActive: u.isActive })),
                adminAction: created ? 'CREATED' : 'PASSWORD RESET',
                loginWith: { email: 'admin@freshcart.vn', password: 'admin123' }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
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
