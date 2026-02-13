// Script to generate the image update template
process.env.NODE_ENV = 'production';
const { Product, Category } = require('../models');
const fs = require('fs');

(async () => {
    try {
        const products = await Product.findAll({
            attributes: ['id', 'name', 'images', 'categoryId'],
            include: [{ model: Category, as: 'category', attributes: ['name'] }],
            order: [['categoryId', 'ASC'], ['id', 'ASC']]
        });

        let lines = [];
        lines.push('// ========================================================');
        lines.push('// HUONG DAN THEM ANH CHO SAN PHAM');
        lines.push('// ========================================================');
        lines.push('// 1. Tim anh tren unsplash.com (tim bang tieng Anh)');
        lines.push('// 2. Click phai vao anh -> Copy image address');
        lines.push('// 3. Dan link anh vao cho trong "" ben duoi');
        lines.push('// 4. Luu file va chay: node database/run_update_images.js');
        lines.push('// ========================================================');
        lines.push('');
        lines.push('const imageList = [');

        let lastCat = '';
        products.forEach(p => {
            const catName = p.category ? p.category.name : 'Khac';
            if (catName !== lastCat) {
                lines.push('');
                lines.push('    // ==========================================');
                lines.push('    // ' + catName);
                lines.push('    // ==========================================');
                lastCat = catName;
            }
            const img = (p.images && p.images.length > 0) ? p.images[0] : '';
            const status = img ? ' // DA CO ANH' : '';
            lines.push('    { id: ' + p.id + ', name: "' + p.name.replace(/"/g, '\\"') + '", image: "' + img.replace(/"/g, '\\"') + '" },' + status);
        });

        lines.push('];');
        lines.push('');
        lines.push('module.exports = imageList;');
        lines.push('');

        fs.writeFileSync(__dirname + '/update_images.js', lines.join('\n'), 'utf8');
        console.log('Da tao file: database/update_images.js');
        console.log('Tong so san pham: ' + products.length);
        const noImage = products.filter(p => !p.images || p.images.length === 0 || !p.images[0]).length;
        console.log('San pham CHUA co anh: ' + noImage);
        console.log('San pham DA co anh: ' + (products.length - noImage));
    } catch (err) {
        console.error('Loi:', err.message);
    }
    process.exit(0);
})();
