const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// 👉 Nếu có Railway URL thì dùng URL
if (process.env.MYSQL_URL) {
    console.log("🚄 Using Railway MySQL");

    sequelize = new Sequelize(process.env.MYSQL_URL, {
        dialect: 'mysql',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });

} else {
    console.log("💻 Using Local MySQL");

    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            dialect: 'mysql',
            logging: process.env.NODE_ENV === 'development' ? console.log : false
        }
    );
}

// Test connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected!');
    } catch (error) {
        console.error('❌ DB Error:', error.message);
    }
};

module.exports = { sequelize, testConnection };