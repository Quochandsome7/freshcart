const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    sku: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    originalPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    organicType: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Type of organic certification'
    },
    certification: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Organic certification details'
    },
    images: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('images');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('images', JSON.stringify(value));
        }
    },
    weight: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Weight in grams'
    },
    unit: {
        type: DataTypes.STRING(50),
        defaultValue: 'kg'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'categories',
            key: 'id'
        }
    }
}, {
    tableName: 'products'
});

// Instance methods
Product.prototype.checkAvailability = function (quantity = 1) {
    return this.stock >= quantity && this.isActive;
};

Product.prototype.updateStock = async function (quantity, operation = 'subtract') {
    if (operation === 'subtract') {
        if (this.stock < quantity) {
            throw new Error('Insufficient stock');
        }
        this.stock -= quantity;
    } else if (operation === 'add') {
        this.stock += quantity;
    }
    return await this.save();
};

Product.prototype.getOrganicCertification = function () {
    return {
        type: this.organicType,
        certification: this.certification,
        verified: !!this.certification
    };
};

module.exports = Product;
