const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    fullName: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    role: {
        type: DataTypes.ENUM('customer', 'admin', 'inventory_manager'),
        defaultValue: 'customer'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'users',
    paranoid: true,
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

// Instance methods
User.prototype.authenticate = async function (password) {
    return await bcrypt.compare(password, this.password);
};

User.prototype.getOrderHistory = async function () {
    const Order = require('./Order');
    return await Order.findAll({
        where: { userId: this.id },
        order: [['createdAt', 'DESC']]
    });
};

User.prototype.updateProfile = async function (data) {
    const allowedFields = ['fullName', 'phone', 'address'];
    allowedFields.forEach(field => {
        if (data[field] !== undefined) {
            this[field] = data[field];
        }
    });
    return await this.save();
};

module.exports = User;
