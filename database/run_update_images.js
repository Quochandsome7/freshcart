// Script chay cap nhat anh san pham
// Chay lenh: node database/run_update_images.js
const { Product } = require('../models');
const imageList = require('./update_images');

(async () => {
    try {
        let updated = 0;
        let skipped = 0;

        for (const item of imageList) {
            if (!item.image || item.image.trim() === '') {
                skipped++;
                continue;
            }

            const product = await Product.findByPk(item.id);
            if (!product) {
                console.log('Khong tim thay san pham ID ' + item.id + ': ' + item.name);
                skipped++;
                continue;
            }

            await product.update({ images: [item.image.trim()] });
            console.log('✅ ' + item.name + ' -> OK');
            updated++;
        }

        console.log('\n🎉 Hoan tat! Da cap nhat anh cho ' + updated + ' san pham, bo qua ' + skipped + ' san pham chua co anh.');
    } catch (err) {
        console.error('Loi:', err.message);
    }
    process.exit(0);
})();
