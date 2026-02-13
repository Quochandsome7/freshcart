const { User, Order, OrderItem, Shipping, PaymentTransaction } = require('../models');
const bcrypt = require('bcryptjs');

/**
 * User Controller
 * Handles user authentication and profile management
 */
const UserController = {
    /**
     * Show login page
     */
    showLogin(req, res) {
        if (req.session.user) {
            return res.redirect('/');
        }
        res.render('user/login', {
            title: 'Đăng nhập',
            returnTo: req.session.returnTo || '/'
        });
    },

    /**
     * Process login
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                req.session.message = { type: 'error', text: 'Vui lòng nhập email và mật khẩu' };
                return res.redirect('/login');
            }

            const user = await User.findOne({ where: { email } });

            if (!user || !await user.authenticate(password)) {
                req.session.message = { type: 'error', text: 'Email hoặc mật khẩu không đúng' };
                return res.redirect('/login');
            }

            if (!user.isActive) {
                req.session.message = { type: 'error', text: 'Tài khoản đã bị khóa' };
                return res.redirect('/login');
            }

            // Save user to session (without password)
            req.session.user = {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                phone: user.phone,
                address: user.address,
                role: user.role
            };

            const returnTo = req.session.returnTo || '/';
            delete req.session.returnTo;

            req.session.save(() => {
                // Redirect admin to admin panel
                if (user.role === 'admin') {
                    return res.redirect('/admin');
                }
                res.redirect(returnTo);
            });
        } catch (error) {
            console.error('UserController.login error:', error);
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * Show registration page
     */
    showRegister(req, res) {
        if (req.session.user) {
            return res.redirect('/');
        }
        res.render('user/register', {
            title: 'Đăng ký'
        });
    },

    /**
     * Process registration
     */
    async register(req, res) {
        try {
            const { fullName, email, password, confirmPassword, phone, address } = req.body;

            // Validation
            if (!fullName || !email || !password) {
                req.session.message = { type: 'error', text: 'Vui lòng điền đầy đủ thông tin' };
                return res.redirect('/register');
            }

            if (password !== confirmPassword) {
                req.session.message = { type: 'error', text: 'Mật khẩu xác nhận không khớp' };
                return res.redirect('/register');
            }

            if (password.length < 6) {
                req.session.message = { type: 'error', text: 'Mật khẩu phải có ít nhất 6 ký tự' };
                return res.redirect('/register');
            }

            // Check if email exists
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                req.session.message = { type: 'error', text: 'Email đã được sử dụng' };
                return res.redirect('/register');
            }

            // Create user
            const user = await User.create({
                fullName,
                email,
                password,
                phone,
                address,
                role: 'customer'
            });

            // Auto login
            req.session.user = {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                phone: user.phone,
                address: user.address,
                role: user.role
            };

            req.session.message = { type: 'success', text: 'Đăng ký thành công!' };
            req.session.save(() => {
                res.redirect('/');
            });
        } catch (error) {
            console.error('UserController.register error:', error);
            if (error.name === 'SequelizeValidationError') {
                req.session.message = { type: 'error', text: error.errors[0].message };
                return res.redirect('/register');
            }
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * Logout
     */
    logout(req, res) {
        req.session.destroy((err) => {
            res.redirect('/');
        });
    },

    /**
     * Show profile page
     */
    async profile(req, res) {
        try {
            const user = await User.findByPk(req.session.user.id);

            res.render('user/profile', {
                title: 'Thông tin tài khoản',
                profile: user
            });
        } catch (error) {
            console.error('UserController.profile error:', error);
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * Update profile
     */
    async updateProfile(req, res) {
        try {
            const { fullName, phone, address, currentPassword, newPassword } = req.body;
            const user = await User.findByPk(req.session.user.id);

            // Update basic info
            user.fullName = fullName || user.fullName;
            user.phone = phone || user.phone;
            user.address = address || user.address;

            // Update password if provided
            if (newPassword) {
                if (!currentPassword) {
                    req.session.message = { type: 'error', text: 'Vui lòng nhập mật khẩu hiện tại' };
                    return res.redirect('/profile');
                }

                if (!await user.authenticate(currentPassword)) {
                    req.session.message = { type: 'error', text: 'Mật khẩu hiện tại không đúng' };
                    return res.redirect('/profile');
                }

                if (newPassword.length < 6) {
                    req.session.message = { type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
                    return res.redirect('/profile');
                }

                user.password = newPassword;
            }

            await user.save();

            // Update session
            req.session.user.fullName = user.fullName;
            req.session.user.phone = user.phone;
            req.session.user.address = user.address;

            req.session.message = { type: 'success', text: 'Cập nhật thông tin thành công' };
            req.session.save(() => {
                res.redirect('/profile');
            });
        } catch (error) {
            console.error('UserController.updateProfile error:', error);
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * Show order history
     */
    async orderHistory(req, res) {
        try {
            const orders = await Order.findAll({
                where: { userId: req.session.user.id },
                include: [{ model: OrderItem, as: 'items' }],
                order: [['createdAt', 'DESC']]
            });

            res.render('user/orders', {
                title: 'Lịch sử đơn hàng',
                orders
            });
        } catch (error) {
            console.error('UserController.orderHistory error:', error);
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * Show order detail
     */
    async orderDetail(req, res) {
        try {
            const order = await Order.findOne({
                where: {
                    id: req.params.orderId,
                    userId: req.session.user.id
                },
                include: [
                    { model: OrderItem, as: 'items' }
                ]
            });

            if (!order) {
                return res.status(404).render('errors/404', {
                    title: 'Không tìm thấy',
                    message: 'Đơn hàng không tồn tại'
                });
            }

            res.render('user/order-detail', {
                title: `Đơn hàng #${order.orderNumber}`,
                order
            });
        } catch (error) {
            console.error('UserController.orderDetail error:', error);
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },
    /**
     * Cancel order - delete order and its items from database
     */
    async cancelOrder(req, res) {
        try {
            const { orderId } = req.params;
            const userId = req.session.user.id;

            const order = await Order.findOne({
                where: { id: orderId, userId }
            });

            if (!order) {
                req.session.message = { type: 'error', text: 'Không tìm thấy đơn hàng' };
                return res.redirect('/orders');
            }

            // Only allow cancelling pending or confirmed orders
            if (!['pending', 'confirmed'].includes(order.status)) {
                req.session.message = { type: 'error', text: 'Không thể hủy đơn hàng ở trạng thái này' };
                return res.redirect(`/orders/${orderId}`);
            }

            // Delete all related data, then the order
            await OrderItem.destroy({ where: { orderId: order.id } });
            await PaymentTransaction.destroy({ where: { orderId: order.id } });
            await Shipping.destroy({ where: { orderId: order.id } });
            await order.destroy();

            req.session.message = { type: 'success', text: 'Đã hủy và xóa đơn hàng thành công' };
            res.redirect('/orders');
        } catch (error) {
            console.error('UserController.cancelOrder error:', error);
            req.session.message = { type: 'error', text: 'Có lỗi xảy ra khi hủy đơn hàng' };
            res.redirect('/orders');
        }
    },
    /**
     * Show payment page for an order
     */
    async showOrderPayment(req, res) {
        try {
            const { orderId } = req.params;
            const userId = req.session.user.id;

            const order = await Order.findOne({
                where: { id: orderId, userId },
                include: [{ model: OrderItem, as: 'items' }]
            });

            if (!order) {
                req.session.message = { type: 'error', text: 'Không tìm thấy đơn hàng' };
                return res.redirect('/orders');
            }

            if (order.paymentStatus === 'paid') {
                req.session.message = { type: 'info', text: 'Đơn hàng này đã được thanh toán' };
                return res.redirect(`/orders/${orderId}`);
            }

            // Generate bank transfer info with QR code
            const BankTransferGateway = require('../services/payment/BankTransferGateway');
            const gateway = new BankTransferGateway();
            const paymentResult = await gateway.createPaymentUrl(order);

            res.render('user/order-payment', {
                title: `Thanh toán đơn hàng #${order.orderNumber}`,
                order,
                bankInfo: paymentResult.bankTransferInfo
            });
        } catch (error) {
            console.error('UserController.showOrderPayment error:', error);
            req.session.message = { type: 'error', text: 'Có lỗi xảy ra' };
            res.redirect('/orders');
        }
    }
};

module.exports = UserController;
