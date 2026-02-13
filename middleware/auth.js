/**
 * Authentication Middleware
 */

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }

    // Store the original URL to redirect after login
    req.session.returnTo = req.originalUrl;
    req.session.save(() => {
        res.redirect('/login');
    });
};

// Check if user is admin
const isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    }

    res.status(403).render('errors/403', {
        title: 'Không có quyền truy cập',
        message: 'Bạn không có quyền truy cập trang này'
    });
};

// Check if user is inventory manager or admin
const isInventoryManager = (req, res, next) => {
    if (req.session && req.session.user &&
        (req.session.user.role === 'admin' || req.session.user.role === 'inventory_manager')) {
        return next();
    }

    res.status(403).render('errors/403', {
        title: 'Không có quyền truy cập',
        message: 'Bạn không có quyền truy cập trang này'
    });
};

// Add user to res.locals
const loadUser = (req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.isAuthenticated = !!req.session.user;
    res.locals.isAdmin = req.session.user?.role === 'admin';
    next();
};

module.exports = {
    isAuthenticated,
    isAdmin,
    isInventoryManager,
    loadUser
};
