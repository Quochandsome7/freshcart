// Migration: Add bank_transfer to ENUM columns
// Run: node database/migrate_bank_transfer.js
const { sequelize } = require('../config/database');

(async () => {
    try {
        console.log('🔄 Đang cập nhật ENUM cho bảng orders...');
        await sequelize.query(
            "ALTER TABLE orders MODIFY COLUMN payment_method ENUM('cod','vnpay','momo','bank_transfer') NOT NULL"
        );
        console.log('✅ orders.payment_method OK');

        console.log('🔄 Đang cập nhật ENUM cho bảng payment_transactions...');
        await sequelize.query(
            "ALTER TABLE payment_transactions MODIFY COLUMN gateway ENUM('vnpay','momo','cod','bank_transfer') NOT NULL"
        );
        console.log('✅ payment_transactions.gateway OK');

        console.log('\n🎉 Migration hoàn tất!');
    } catch (err) {
        console.error('❌ Lỗi:', err.message);
    }
    process.exit(0);
})();
