const { User, Product, Category, Order, OrderItem, PaymentTransaction, Shipping, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Admin Controller
 * Handles admin dashboard and management functions
 */
const AdminController = {
    /**
     * Dashboard
     */
    async dashboard(req, res) {
        try {
            // Get statistics
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const stats = {
                totalOrders: await Order.count(),
                todayOrders: await Order.count({
                    where: { createdAt: { [Op.gte]: today } }
                }),
                totalRevenue: await Order.sum('totalAmount', {
                    where: { paymentStatus: 'paid' }
                }) || 0,
                todayRevenue: await Order.sum('totalAmount', {
                    where: {
                        paymentStatus: 'paid',
                        createdAt: { [Op.gte]: today }
                    }
                }) || 0,
                totalProducts: await Product.count(),
                lowStockProducts: await Product.count({
                    where: { stock: { [Op.lte]: 10 } }
                }),
                totalUsers: await User.count({ where: { role: 'customer' } }),
                pendingOrders: await Order.count({
                    where: { status: 'pending' }
                })
            };

            // Recent orders
            const recentOrders = await Order.findAll({
                order: [['createdAt', 'DESC']],
                limit: 10,
                include: [{ model: User, as: 'user' }]
            });

            // Low stock products
            const lowStock = await Product.findAll({
                where: { stock: { [Op.lte]: 10 } },
                order: [['stock', 'ASC']],
                limit: 10
            });

            res.render('admin/dashboard', {
                title: 'Dashboard',
                stats,
                recentOrders,
                lowStock,
                layout: 'layouts/admin'
            });
        } catch (error) {
            console.error('AdminController.dashboard error:', error);
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * Products list
     */
    async products(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 20;
            const offset = (page - 1) * limit;

            const { count, rows: products } = await Product.findAndCountAll({
                include: [{ model: Category, as: 'category' }],
                order: [['createdAt', 'DESC']],
                limit,
                offset
            });

            const categories = await Category.findAll();

            res.render('admin/products/index', {
                title: 'Quản lý sản phẩm',
                products,
                categories,
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                layout: 'layouts/admin'
            });
        } catch (error) {
            console.error('AdminController.products error:', error);
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * Create product
     */
    async createProduct(req, res) {
        try {
            const { sku, name, description, price, originalPrice, stock, categoryId, organicType, certification, weight, unit, isFeatured } = req.body;

            await Product.create({
                sku,
                name,
                description,
                price,
                originalPrice: originalPrice || null,
                stock: stock || 0,
                categoryId,
                organicType,
                certification,
                weight,
                unit: unit || 'kg',
                isFeatured: isFeatured === 'on',
                images: req.body.images ? JSON.parse(req.body.images) : []
            });

            req.session.message = { type: 'success', text: 'Thêm sản phẩm thành công' };
            res.redirect('/admin/products');
        } catch (error) {
            console.error('AdminController.createProduct error:', error);
            req.session.message = { type: 'error', text: error.message };
            res.redirect('/admin/products');
        }
    },

    /**
     * Update product
     */
    async updateProduct(req, res) {
        try {
            const product = await Product.findByPk(req.params.id);
            if (!product) {
                return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
            }

            // Handle imageUrl field - convert to images array
            const updateData = { ...req.body };
            if (updateData.imageUrl !== undefined) {
                const imageUrl = updateData.imageUrl.trim();
                updateData.images = imageUrl ? [imageUrl] : [];
                delete updateData.imageUrl;
            }

            await product.update(updateData);

            if (req.xhr) {
                return res.json({ success: true });
            }

            req.session.message = { type: 'success', text: 'Cập nhật sản phẩm thành công' };
            res.redirect('/admin/products');
        } catch (error) {
            console.error('AdminController.updateProduct error:', error);
            if (req.xhr) {
                return res.status(500).json({ error: error.message });
            }
            req.session.message = { type: 'error', text: error.message };
            res.redirect('/admin/products');
        }
    },

    /**
     * Delete product
     */
    async deleteProduct(req, res) {
        try {
            const product = await Product.findByPk(req.params.id);
            if (!product) {
                return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
            }

            await product.destroy();

            if (req.xhr) {
                return res.json({ success: true });
            }

            req.session.message = { type: 'success', text: 'Xóa sản phẩm thành công' };
            res.redirect('/admin/products');
        } catch (error) {
            console.error('AdminController.deleteProduct error:', error);
            if (req.xhr) {
                return res.status(500).json({ error: error.message });
            }
            req.session.message = { type: 'error', text: error.message };
            res.redirect('/admin/products');
        }
    },

    /**
     * Orders list
     */
    async orders(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 20;
            const offset = (page - 1) * limit;

            const where = {};
            if (req.query.status) {
                where.status = req.query.status;
            }

            const { count, rows: orders } = await Order.findAndCountAll({
                where,
                include: [
                    { model: User, as: 'user' },
                    { model: OrderItem, as: 'items' },
                    { model: PaymentTransaction, as: 'payment' },
                    { model: Shipping, as: 'shipping' }
                ],
                order: [['createdAt', 'DESC']],
                limit,
                offset
            });

            res.render('admin/orders/index', {
                title: 'Quản lý đơn hàng',
                orders,
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                currentStatus: req.query.status || 'all',
                layout: 'layouts/admin'
            });
        } catch (error) {
            console.error('AdminController.orders error:', error);
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * View order detail
     */
    async orderDetail(req, res) {
        try {
            const order = await Order.findByPk(req.params.id, {
                include: [
                    { model: User, as: 'user' },
                    { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
                    { model: PaymentTransaction, as: 'payment' },
                    { model: Shipping, as: 'shipping' }
                ]
            });

            if (!order) {
                return res.status(404).render('errors/404', {
                    title: 'Không tìm thấy',
                    message: 'Đơn hàng không tồn tại'
                });
            }

            res.render('admin/orders/detail', {
                title: `Đơn hàng #${order.orderNumber}`,
                order,
                layout: 'layouts/admin'
            });
        } catch (error) {
            console.error('AdminController.orderDetail error:', error);
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * Update order status
     */
    async updateOrderStatus(req, res) {
        try {
            const { status } = req.body;
            const order = await Order.findByPk(req.params.id);

            if (!order) {
                return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
            }

            await order.update({ status });

            if (req.xhr) {
                return res.json({ success: true });
            }

            req.session.message = { type: 'success', text: 'Cập nhật trạng thái thành công' };
            res.redirect(`/admin/orders/${order.id}`);
        } catch (error) {
            console.error('AdminController.updateOrderStatus error:', error);
            if (req.xhr) {
                return res.status(500).json({ error: error.message });
            }
            req.session.message = { type: 'error', text: error.message };
            res.redirect('back');
        }
    },

    /**
     * Inventory management
     */
    async inventory(req, res) {
        try {
            const products = await Product.findAll({
                include: [{ model: Category, as: 'category' }],
                order: [['stock', 'ASC']]
            });

            res.render('admin/inventory/index', {
                title: 'Quản lý tồn kho',
                products,
                layout: 'layouts/admin'
            });
        } catch (error) {
            console.error('AdminController.inventory error:', error);
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * Update stock
     */
    async updateStock(req, res) {
        try {
            const { productId, quantity, operation } = req.body;
            const product = await Product.findByPk(productId);

            if (!product) {
                return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
            }

            await product.updateStock(parseInt(quantity), operation);

            res.json({
                success: true,
                newStock: product.stock
            });
        } catch (error) {
            console.error('AdminController.updateStock error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * Categories management
     */
    async categories(req, res) {
        try {
            const categories = await Category.findAll({
                include: [{ model: Product, as: 'products' }],
                order: [['name', 'ASC']]
            });

            res.render('admin/categories/index', {
                title: 'Quản lý danh mục',
                categories,
                layout: 'layouts/admin'
            });
        } catch (error) {
            console.error('AdminController.categories error:', error);
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * Users management
     */
    async users(req, res) {
        try {
            const users = await User.findAll({
                order: [['createdAt', 'DESC']],
                paranoid: false // Include soft-deleted users
            });

            res.render('admin/users/index', {
                title: 'Quản lý người dùng',
                users,
                layout: 'layouts/admin'
            });
        } catch (error) {
            console.error('AdminController.users error:', error);
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * Toggle user lock/unlock
     */
    async toggleUserLock(req, res) {
        try {
            const user = await User.findByPk(req.params.id);
            if (!user) {
                req.session.message = { type: 'error', text: 'Người dùng không tồn tại' };
                return res.redirect('/admin/users');
            }

            // Prevent locking own account
            if (user.id === req.session.user.id) {
                req.session.message = { type: 'error', text: 'Không thể khóa tài khoản của chính mình' };
                return res.redirect('/admin/users');
            }

            await user.update({ isActive: !user.isActive });

            req.session.message = {
                type: 'success',
                text: user.isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản'
            };
            res.redirect('/admin/users');
        } catch (error) {
            console.error('AdminController.toggleUserLock error:', error);
            req.session.message = { type: 'error', text: error.message };
            res.redirect('/admin/users');
        }
    },

    /**
     * Soft delete user
     */
    async deleteUser(req, res) {
        try {
            const user = await User.findByPk(req.params.id);
            if (!user) {
                req.session.message = { type: 'error', text: 'Người dùng không tồn tại' };
                return res.redirect('/admin/users');
            }

            // Prevent deleting own account
            if (user.id === req.session.user.id) {
                req.session.message = { type: 'error', text: 'Không thể xóa tài khoản của chính mình' };
                return res.redirect('/admin/users');
            }

            await user.destroy(); // Soft delete (paranoid)

            req.session.message = { type: 'success', text: 'Đã xóa người dùng (có thể khôi phục)' };
            res.redirect('/admin/users');
        } catch (error) {
            console.error('AdminController.deleteUser error:', error);
            req.session.message = { type: 'error', text: error.message };
            res.redirect('/admin/users');
        }
    },

    /**
     * Restore soft-deleted user
     */
    async restoreUser(req, res) {
        try {
            const user = await User.findByPk(req.params.id, { paranoid: false });
            if (!user) {
                req.session.message = { type: 'error', text: 'Người dùng không tồn tại' };
                return res.redirect('/admin/users');
            }

            await user.restore();

            req.session.message = { type: 'success', text: 'Đã khôi phục tài khoản' };
            res.redirect('/admin/users');
        } catch (error) {
            console.error('AdminController.restoreUser error:', error);
            req.session.message = { type: 'error', text: error.message };
            res.redirect('/admin/users');
        }
    }
};

module.exports = AdminController;
