const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Shipping = sequelize.define('Shipping', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'orders',
            key: 'id'
        }
    },
    carrier: {
        type: DataTypes.ENUM('ghtk', 'viettelpost'),
        allowNull: false
    },
    trackingNumber: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    labelCode: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'picked_up', 'in_transit', 'delivered', 'returned', 'cancelled'),
        defaultValue: 'pending'
    },
    fee: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },
    estimatedDelivery: {
        type: DataTypes.DATE,
        allowNull: true
    },
    actualDelivery: {
        type: DataTypes.DATE,
        allowNull: true
    },
    pickupAddress: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    deliveryAddress: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    weight: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Weight in grams'
    },
    requestData: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('requestData');
            return rawValue ? JSON.parse(rawValue) : null;
        },
        set(value) {
            this.setDataValue('requestData', JSON.stringify(value));
        }
    },
    responseData: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('responseData');
            return rawValue ? JSON.parse(rawValue) : null;
        },
        set(value) {
            this.setDataValue('responseData', JSON.stringify(value));
        }
    }
}, {
    tableName: 'shippings'
});

// Instance methods
Shipping.prototype.createShippingOrder = async function () {
    // Will be handled by shipping services
    return this;
};

Shipping.prototype.trackStatus = async function () {
    return {
        trackingNumber: this.trackingNumber,
        status: this.status,
        carrier: this.carrier,
        estimatedDelivery: this.estimatedDelivery
    };
};

Shipping.prototype.calculateFee = function (weight, distance) {
    // Basic fee calculation - will be overridden by actual API
    const baseFee = 15000;
    const weightFee = Math.ceil(weight / 500) * 5000;
    return baseFee + weightFee;
};

module.exports = Shipping;
