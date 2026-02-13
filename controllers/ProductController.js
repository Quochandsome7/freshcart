const { Product, Category } = require('../models');
const { Op } = require('sequelize');

/**
 * Helper: Parse product images from JSON string to array
 */
const parseProductImages = (products) => {
    const productArray = Array.isArray(products) ? products : [products];
    productArray.forEach(p => {
        if (p && typeof p.images === 'string') {
            console.log('Parsing images for product:', p.name, 'from:', p.images);
            try {
                p.images = JSON.parse(p.images);
                console.log('Parsed to:', p.images);
            } catch (e) {
                console.error('Failed to parse images:', e);
                p.images = [];
            }
        }
    });
    return products;
};

/**
 * Product Controller
 * Handles product listing, details, search, and filtering
 */
const ProductController = {
    /**
     * Display all products with pagination
     */
    async index(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 12;
            const offset = (page - 1) * limit;

            // Build where clause for filters
            const where = { isActive: true };

            // Filter by organic type
            if (req.query.organicType) {
                where.organicType = req.query.organicType;
            }

            // Filter by price range
            if (req.query.minPrice || req.query.maxPrice) {
                where.price = {};
                if (req.query.minPrice) where.price[Op.gte] = req.query.minPrice;
                if (req.query.maxPrice) where.price[Op.lte] = req.query.maxPrice;
            }

            // Sort options
            let order = [['createdAt', 'DESC']];
            if (req.query.sort) {
                switch (req.query.sort) {
                    case 'price_asc':
                        order = [['price', 'ASC']];
                        break;
                    case 'price_desc':
                        order = [['price', 'DESC']];
                        break;
                    case 'name_asc':
                        order = [['name', 'ASC']];
                        break;
                    case 'newest':
                        order = [['createdAt', 'DESC']];
                        break;
                }
            }

            const { count, rows: products } = await Product.findAndCountAll({
                where,
                include: [{ model: Category, as: 'category' }],
                order,
                limit,
                offset
            });

            const totalPages = Math.ceil(count / limit);
            const categories = await Category.findAll({ where: { isActive: true } });

            parseProductImages(products);

            res.render('products/index', {
                title: 'Sản phẩm',
                products,
                categories,
                currentPage: page,
                totalPages,
                totalProducts: count,
                query: req.query
            });
        } catch (error) {
            console.error('ProductController.index error:', error);
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * Show single product detail
     */
    async show(req, res) {
        try {
            const product = await Product.findByPk(req.params.id, {
                include: [{ model: Category, as: 'category' }]
            });

            if (!product || !product.isActive) {
                return res.status(404).render('errors/404', {
                    title: 'Không tìm thấy',
                    message: 'Sản phẩm không tồn tại'
                });
            }

            // Get related products from same category
            const relatedProducts = await Product.findAll({
                where: {
                    categoryId: product.categoryId,
                    id: { [Op.ne]: product.id },
                    isActive: true
                },
                limit: 4
            });

            parseProductImages(product);
            parseProductImages(relatedProducts);

            res.render('products/show', {
                title: product.name,
                product,
                relatedProducts
            });
        } catch (error) {
            console.error('ProductController.show error:', error);
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * Search products
     */
    async search(req, res) {
        try {
            const query = req.query.q || '';
            const page = parseInt(req.query.page) || 1;
            const limit = 12;
            const offset = (page - 1) * limit;

            const { count, rows: products } = await Product.findAndCountAll({
                where: {
                    isActive: true,
                    [Op.or]: [
                        { name: { [Op.like]: `%${query}%` } },
                        { description: { [Op.like]: `%${query}%` } },
                        { sku: { [Op.like]: `%${query}%` } }
                    ]
                },
                include: [{ model: Category, as: 'category' }],
                limit,
                offset
            });

            const totalPages = Math.ceil(count / limit);

            parseProductImages(products);

            res.render('products/search', {
                title: `Tìm kiếm: ${query}`,
                products,
                query,
                currentPage: page,
                totalPages,
                totalProducts: count
            });
        } catch (error) {
            console.error('ProductController.search error:', error);
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * Filter products by category
     */
    async filterByCategory(req, res) {
        try {
            const categoryId = req.params.categoryId;
            const page = parseInt(req.query.page) || 1;
            const limit = 12;
            const offset = (page - 1) * limit;

            const category = await Category.findByPk(categoryId);

            if (!category) {
                return res.status(404).render('errors/404', {
                    title: 'Không tìm thấy',
                    message: 'Danh mục không tồn tại'
                });
            }

            const { count, rows: products } = await Product.findAndCountAll({
                where: {
                    categoryId,
                    isActive: true
                },
                include: [{ model: Category, as: 'category' }],
                limit,
                offset
            });

            const totalPages = Math.ceil(count / limit);
            const categories = await Category.findAll({ where: { isActive: true } });

            parseProductImages(products);

            res.render('products/category', {
                title: category.name,
                products,
                category,
                categories,
                currentPage: page,
                totalPages,
                totalProducts: count
            });
        } catch (error) {
            console.error('ProductController.filterByCategory error:', error);
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * API: Get product stock status
     */
    async getStock(req, res) {
        try {
            const product = await Product.findByPk(req.params.id, {
                attributes: ['id', 'stock', 'isActive']
            });

            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            res.json({
                productId: product.id,
                stock: product.stock,
                available: product.stock > 0 && product.isActive
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = ProductController;
