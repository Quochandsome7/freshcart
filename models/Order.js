const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orderNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        defaultValue: function () {
            const timestamp = Date.now().toString(36).toUpperCase();
            const random = Math.random().toString(36).substring(2, 6).toUpperCase();
            return `FC${timestamp}${random}`;
        }
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    customerName: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    customerEmail: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    customerPhone: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    shippingAddress: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    shippingProvince: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    shippingDistrict: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    shippingWard: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },
    shippingFee: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },
    discount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },
    totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'),
        defaultValue: 'pending'
    },
    paymentMethod: {
        type: DataTypes.ENUM('cod', 'vnpay', 'momo', 'bank_transfer'),
        allowNull: false
    },
    paymentStatus: {
        type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
        defaultValue: 'pending'
    },
    shippingCarrier: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'orders',
    hooks: {
        beforeValidate: (order) => {
            if (!order.orderNumber) {
                // Generate order number
                const timestamp = Date.now().toString(36).toUpperCase();
                const random = Math.random().toString(36).substring(2, 6).toUpperCase();
                order.orderNumber = `FC${timestamp}${random}`;
            }
        }
    }
});

// Instance methods
Order.prototype.calculateTotal = function () {
    this.totalAmount = parseFloat(this.subtotal) + parseFloat(this.shippingFee) - parseFloat(this.discount);
    return this.totalAmount;
};

Order.prototype.updateStatus = async function (newStatus) {
    const validTransitions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['processing', 'cancelled'],
        'processing': ['shipped', 'cancelled'],
        'shipped': ['delivered'],
        'delivered': [],
        'cancelled': []
    };

    if (!validTransitions[this.status].includes(newStatus)) {
        throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
    }

    this.status = newStatus;
    return await this.save();
};

Order.prototype.generateInvoice = function () {
    return {
        orderNumber: this.orderNumber,
        customerName: this.customerName,
        customerEmail: this.customerEmail,
        shippingAddress: this.shippingAddress,
        subtotal: this.subtotal,
        shippingFee: this.shippingFee,
        discount: this.discount,
        totalAmount: this.totalAmount,
        status: this.status,
        paymentMethod: this.paymentMethod,
        createdAt: this.createdAt
    };
};

module.exports = Order;
