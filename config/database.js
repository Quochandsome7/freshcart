const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// Support Railway env var names (MYSQLHOST, MYSQLDATABASE, etc.)
// as well as custom names (DB_HOST, DB_NAME, etc.) and MYSQL_URL
const dbHost = process.env.MYSQLHOST || process.env.DB_HOST;
const dbPort = process.env.MYSQLPORT || process.env.DB_PORT;
const dbName = process.env.MYSQLDATABASE || process.env.DB_NAME;
const dbUser = process.env.MYSQLUSER || process.env.DB_USER;
const dbPassword = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD;
const mysqlUrl = process.env.MYSQL_URL;

if (mysqlUrl) {
    console.log("🚄 Using MYSQL_URL");

    sequelize = new Sequelize(mysqlUrl, {
        dialect: 'mysql',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });

} else if (dbHost) {
    console.log("🚄 Using MySQL:", dbHost + ":" + dbPort);

    sequelize = new Sequelize(dbName, dbUser, dbPassword, {
        host: dbHost,
        port: dbPort,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        dialectOptions: process.env.NODE_ENV === 'production' ? {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        } : {}
    });

} else {
    console.error("❌ No database configuration found!");
    process.exit(1);
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