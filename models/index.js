const { sequelize } = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const PaymentTransaction = require('./PaymentTransaction');
const Shipping = require('./Shipping');

// Define associations

// Category - Product (One to Many)
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// User - Order (One to Many)
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Order - OrderItem (One to Many)
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// Product - OrderItem (One to Many)
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Order - PaymentTransaction (One to One)
Order.hasOne(PaymentTransaction, { foreignKey: 'orderId', as: 'payment' });
PaymentTransaction.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// Order - Shipping (One to One)
Order.hasOne(Shipping, { foreignKey: 'orderId', as: 'shipping' });
Shipping.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// Sync database
const syncDatabase = async (force = false) => {
    try {
        await sequelize.sync({ force });
        console.log('✅ Database synchronized successfully.');
        return true;
    } catch (error) {
        console.error('❌ Error synchronizing database:', error.message);
        return false;
    }
};

module.exports = {
    sequelize,
    User,
    Category,
    Product,
    Order,
    OrderItem,
    PaymentTransaction,
    Shipping,
    syncDatabase
};
