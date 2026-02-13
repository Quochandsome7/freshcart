const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PaymentTransaction = sequelize.define('PaymentTransaction', {
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
    transactionId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true
    },
    gateway: {
        type: DataTypes.ENUM('vnpay', 'momo', 'cod', 'bank_transfer'),
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'success', 'failed', 'refunded'),
        defaultValue: 'pending'
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
    },
    paidAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'payment_transactions'
});

// Instance methods
PaymentTransaction.prototype.processPayment = async function () {
    // This will be handled by payment gateways
    return this;
};

PaymentTransaction.prototype.verifyCallback = async function (callbackData) {
    this.responseData = callbackData;
    return this;
};

PaymentTransaction.prototype.refund = async function () {
    if (this.status !== 'success') {
        throw new Error('Can only refund successful transactions');
    }
    this.status = 'refunded';
    return await this.save();
};

module.exports = PaymentTransaction;
