const { sequelize } = require('../config/database');
const Product = require('../models/Product');
const Category = require('../models/Category');

const addProducts = async () => {
    try {
        console.log('🌱 Bắt đầu thêm sản phẩm mới...');

        // Lấy tất cả categories
        const categories = await Category.findAll();
        const catMap = {};
        categories.forEach(c => {
            catMap[c.name] = c.id;
        });

        console.log('📂 Danh mục hiện có:', Object.keys(catMap).join(', '));

        // Lấy tất cả sản phẩm hiện có để check trùng
        const existingProducts = await Product.findAll({ attributes: ['name'] });
        const existingNames = new Set(existingProducts.map(p => p.name.toLowerCase().trim()));
        console.log(`📦 Có ${existingNames.size} sản phẩm hiện có`);

        // Lấy SKU lớn nhất hiện tại
        const allProducts = await Product.findAll({ attributes: ['sku'] });
        let skuCounter = allProducts.length + 1;

        const generateSku = (prefix) => {
            const sku = `${prefix}${String(skuCounter).padStart(3, '0')}`;
            skuCounter++;
            return sku;
        };

        // ======= DANH SÁCH SẢN PHẨM MỚI =======

        const newProducts = [
            // 🥬 1. Rau củ hữu cơ
            { name: 'Cải bó xôi (Rau bina)', desc: 'Cải bó xôi hữu cơ, giàu sắt và vitamin A, C, K.', price: 30000, unit: 'bó', cat: 'Rau củ hữu cơ', prefix: 'VEG', weight: 300 },
            { name: 'Cải xoăn (Kale)', desc: 'Cải xoăn hữu cơ, siêu thực phẩm giàu chất chống oxy hóa.', price: 45000, unit: 'bó', cat: 'Rau củ hữu cơ', prefix: 'VEG', weight: 250 },
            { name: 'Xà lách', desc: 'Xà lách hữu cơ tươi xanh, giòn ngọt tự nhiên.', price: 20000, unit: 'bó', cat: 'Rau củ hữu cơ', prefix: 'VEG', weight: 300 },
            { name: 'Bông cải xanh (Broccoli)', desc: 'Bông cải xanh hữu cơ, giàu vitamin C và chất xơ.', price: 55000, unit: 'bông', cat: 'Rau củ hữu cơ', prefix: 'VEG', weight: 400 },
            { name: 'Súp lơ trắng', desc: 'Súp lơ trắng hữu cơ, trắng ngần, giòn ngọt.', price: 40000, unit: 'bông', cat: 'Rau củ hữu cơ', prefix: 'VEG', weight: 500 },
            { name: 'Cà rốt', desc: 'Cà rốt hữu cơ tươi, ngọt tự nhiên, giàu beta-carotene.', price: 25000, unit: 'kg', cat: 'Rau củ hữu cơ', prefix: 'VEG', weight: 1000 },
            { name: 'Khoai tây', desc: 'Khoai tây hữu cơ, vỏ mỏng, ruột vàng bở.', price: 35000, unit: 'kg', cat: 'Rau củ hữu cơ', prefix: 'VEG', weight: 1000 },
            { name: 'Khoai lang', desc: 'Khoai lang hữu cơ, ngọt bùi tự nhiên.', price: 30000, unit: 'kg', cat: 'Rau củ hữu cơ', prefix: 'VEG', weight: 1000 },
            { name: 'Cà chua', desc: 'Cà chua hữu cơ chín đỏ, mọng nước, giàu lycopene.', price: 35000, unit: 'kg', cat: 'Rau củ hữu cơ', prefix: 'VEG', weight: 1000 },
            { name: 'Dưa chuột', desc: 'Dưa chuột hữu cơ tươi mát, giòn ngon.', price: 20000, unit: 'kg', cat: 'Rau củ hữu cơ', prefix: 'VEG', weight: 1000 },
            { name: 'Ớt chuông', desc: 'Ớt chuông hữu cơ nhiều màu, giàu vitamin C.', price: 60000, unit: 'kg', cat: 'Rau củ hữu cơ', prefix: 'VEG', weight: 500 },
            { name: 'Cần tây', desc: 'Cần tây hữu cơ, thơm giòn, tốt cho sức khỏe.', price: 35000, unit: 'bó', cat: 'Rau củ hữu cơ', prefix: 'VEG', weight: 400 },
            { name: 'Bí đỏ', desc: 'Bí đỏ hữu cơ, ruột vàng đậm, ngọt bùi.', price: 25000, unit: 'kg', cat: 'Rau củ hữu cơ', prefix: 'VEG', weight: 1000 },
            { name: 'Bí xanh', desc: 'Bí xanh hữu cơ tươi ngon, dùng nấu canh hoặc xào.', price: 20000, unit: 'kg', cat: 'Rau củ hữu cơ', prefix: 'VEG', weight: 1000 },
            { name: 'Măng tây', desc: 'Măng tây hữu cơ non mềm, giàu folate và vitamin K.', price: 80000, unit: 'bó', cat: 'Rau củ hữu cơ', prefix: 'VEG', weight: 250 },
            { name: 'Củ dền', desc: 'Củ dền hữu cơ đỏ tươi, giàu sắt và chất chống oxy hóa.', price: 35000, unit: 'kg', cat: 'Rau củ hữu cơ', prefix: 'VEG', weight: 1000 },
            { name: 'Hành tây', desc: 'Hành tây hữu cơ tím hoặc trắng, thơm ngọt tự nhiên.', price: 25000, unit: 'kg', cat: 'Rau củ hữu cơ', prefix: 'VEG', weight: 1000 },
            { name: 'Tỏi', desc: 'Tỏi hữu cơ thơm nồng, tốt cho hệ miễn dịch.', price: 60000, unit: 'kg', cat: 'Rau củ hữu cơ', prefix: 'VEG', weight: 500 },
            { name: 'Đậu Hà Lan', desc: 'Đậu Hà Lan hữu cơ tươi ngọt, giàu protein thực vật.', price: 50000, unit: 'kg', cat: 'Rau củ hữu cơ', prefix: 'VEG', weight: 500 },
            { name: 'Đậu cô ve', desc: 'Đậu cô ve hữu cơ non giòn, giàu chất xơ.', price: 40000, unit: 'kg', cat: 'Rau củ hữu cơ', prefix: 'VEG', weight: 500 },

            // 🍎 2. Trái cây hữu cơ
            { name: 'Táo', desc: 'Táo hữu cơ tươi ngon, giòn ngọt tự nhiên.', price: 90000, unit: 'kg', cat: 'Trái cây hữu cơ', prefix: 'FRU', weight: 1000 },
            { name: 'Lê', desc: 'Lê hữu cơ mọng nước, ngọt thanh.', price: 85000, unit: 'kg', cat: 'Trái cây hữu cơ', prefix: 'FRU', weight: 1000 },
            { name: 'Chuối', desc: 'Chuối hữu cơ chín vàng, ngọt thơm tự nhiên.', price: 30000, unit: 'nải', cat: 'Trái cây hữu cơ', prefix: 'FRU', weight: 1000 },
            { name: 'Cam', desc: 'Cam hữu cơ mọng nước, giàu vitamin C.', price: 55000, unit: 'kg', cat: 'Trái cây hữu cơ', prefix: 'FRU', weight: 1000 },
            { name: 'Quýt', desc: 'Quýt hữu cơ ngọt thanh, dễ bóc vỏ.', price: 50000, unit: 'kg', cat: 'Trái cây hữu cơ', prefix: 'FRU', weight: 1000 },
            { name: 'Chanh', desc: 'Chanh hữu cơ tươi, vỏ mỏng nhiều nước.', price: 30000, unit: 'kg', cat: 'Trái cây hữu cơ', prefix: 'FRU', weight: 1000 },
            { name: 'Bưởi', desc: 'Bưởi hữu cơ da xanh, múi mọng, ngọt thanh.', price: 45000, unit: 'trái', cat: 'Trái cây hữu cơ', prefix: 'FRU', weight: 1500 },
            { name: 'Dâu tây', desc: 'Dâu tây hữu cơ Đà Lạt, đỏ mọng, thơm ngọt.', price: 120000, unit: 'hộp', cat: 'Trái cây hữu cơ', prefix: 'FRU', weight: 300 },
            { name: 'Việt quất', desc: 'Việt quất hữu cơ nhập khẩu, giàu chất chống oxy hóa.', price: 180000, unit: 'hộp', cat: 'Trái cây hữu cơ', prefix: 'FRU', weight: 125 },
            { name: 'Mâm xôi', desc: 'Mâm xôi hữu cơ tươi, vị chua ngọt đặc trưng.', price: 200000, unit: 'hộp', cat: 'Trái cây hữu cơ', prefix: 'FRU', weight: 125 },
            { name: 'Nho', desc: 'Nho hữu cơ không hạt, ngọt giòn.', price: 95000, unit: 'kg', cat: 'Trái cây hữu cơ', prefix: 'FRU', weight: 1000 },
            { name: 'Kiwi', desc: 'Kiwi hữu cơ nhập khẩu, giàu vitamin C và E.', price: 110000, unit: 'kg', cat: 'Trái cây hữu cơ', prefix: 'FRU', weight: 500 },
            { name: 'Xoài', desc: 'Xoài hữu cơ Cát Hòa Lộc, ngọt thơm đặc biệt.', price: 70000, unit: 'kg', cat: 'Trái cây hữu cơ', prefix: 'FRU', weight: 1000 },
            { name: 'Đu đủ', desc: 'Đu đủ hữu cơ chín vàng, mềm ngọt.', price: 30000, unit: 'trái', cat: 'Trái cây hữu cơ', prefix: 'FRU', weight: 1500 },
            { name: 'Dứa', desc: 'Dứa hữu cơ tươi ngọt, thơm lừng.', price: 25000, unit: 'trái', cat: 'Trái cây hữu cơ', prefix: 'FRU', weight: 1200 },
            { name: 'Bơ', desc: 'Bơ hữu cơ sáp Đắk Lắk, béo ngậy tự nhiên.', price: 80000, unit: 'kg', cat: 'Trái cây hữu cơ', prefix: 'FRU', weight: 1000 },
            { name: 'Đào', desc: 'Đào hữu cơ tươi mọng, vị ngọt chua nhẹ.', price: 95000, unit: 'kg', cat: 'Trái cây hữu cơ', prefix: 'FRU', weight: 1000 },
            { name: 'Xuân đào (Nectarine)', desc: 'Xuân đào hữu cơ nhập khẩu, da trơn, ngọt thơm.', price: 120000, unit: 'kg', cat: 'Trái cây hữu cơ', prefix: 'FRU', weight: 1000 },
            { name: 'Anh đào (Cherry)', desc: 'Cherry hữu cơ nhập khẩu, đỏ mọng, giòn ngọt.', price: 350000, unit: 'hộp 500g', cat: 'Trái cây hữu cơ', prefix: 'FRU', weight: 500 },

            // 🥩 3. Thịt & Hải sản hữu cơ
            { name: 'Thịt bò', desc: 'Thịt bò hữu cơ tươi, nuôi thả đồng cỏ, không kháng sinh.', price: 280000, unit: 'kg', cat: 'Thịt & Hải sản', prefix: 'MEA', weight: 500 },
            { name: 'Thịt gà', desc: 'Thịt gà hữu cơ nuôi thả vườn, thịt chắc ngọt.', price: 150000, unit: 'kg', cat: 'Thịt & Hải sản', prefix: 'MEA', weight: 1000 },
            { name: 'Thịt heo', desc: 'Thịt heo hữu cơ từ trang trại chăn nuôi sạch, không kháng sinh.', price: 180000, unit: 'kg', cat: 'Thịt & Hải sản', prefix: 'MEA', weight: 500 },
            { name: 'Thịt cừu', desc: 'Thịt cừu hữu cơ nhập khẩu, thịt mềm, ít mỡ.', price: 350000, unit: 'kg', cat: 'Thịt & Hải sản', prefix: 'MEA', weight: 500 },
            { name: 'Cá hồi', desc: 'Cá hồi hữu cơ Na Uy, giàu omega-3, thịt đỏ cam.', price: 350000, unit: 'kg', cat: 'Thịt & Hải sản', prefix: 'MEA', weight: 500 },
            { name: 'Cá thu', desc: 'Cá thu hữu cơ tươi, thịt chắc, giàu DHA.', price: 120000, unit: 'kg', cat: 'Thịt & Hải sản', prefix: 'MEA', weight: 1000 },
            { name: 'Cá basa', desc: 'Cá basa hữu cơ nuôi theo tiêu chuẩn ASC.', price: 80000, unit: 'kg', cat: 'Thịt & Hải sản', prefix: 'MEA', weight: 1000 },
            { name: 'Tôm', desc: 'Tôm hữu cơ nuôi theo tiêu chuẩn organic, tươi ngon.', price: 200000, unit: 'kg', cat: 'Thịt & Hải sản', prefix: 'MEA', weight: 500 },
            { name: 'Trứng cá hồi', desc: 'Trứng cá hồi muối organic, hạt to, tươi ngon.', price: 500000, unit: 'hũ 100g', cat: 'Thịt & Hải sản', prefix: 'MEA', weight: 100 },

            // 🥚 4. Sữa & Trứng hữu cơ
            { name: 'Sữa tươi', desc: 'Sữa tươi hữu cơ 100% từ bò ăn cỏ organic.', price: 45000, unit: 'hộp 1L', cat: 'Sữa & Trứng', prefix: 'DAI', weight: 1000 },
            { name: 'Sữa chua', desc: 'Sữa chua hữu cơ tự nhiên, giàu lợi khuẩn probiotic.', price: 35000, unit: 'hộp 4 cái', cat: 'Sữa & Trứng', prefix: 'DAI', weight: 400 },
            { name: 'Phô mai', desc: 'Phô mai hữu cơ từ sữa bò organic, thơm béo.', price: 80000, unit: 'gói 200g', cat: 'Sữa & Trứng', prefix: 'DAI', weight: 200 },
            { name: 'Bơ (Butter)', desc: 'Bơ lạt hữu cơ từ sữa bò organic, thơm ngậy.', price: 95000, unit: 'hộp 200g', cat: 'Sữa & Trứng', prefix: 'DAI', weight: 200 },
            { name: 'Kem tươi', desc: 'Kem tươi hữu cơ, vị béo ngọt tự nhiên từ sữa organic.', price: 120000, unit: 'hộp 500ml', cat: 'Sữa & Trứng', prefix: 'DAI', weight: 500 },
            { name: 'Trứng gà', desc: 'Trứng gà hữu cơ nuôi thả vườn, lòng đỏ sánh đậm.', price: 55000, unit: 'hộp 10 quả', cat: 'Sữa & Trứng', prefix: 'DAI', weight: 600 },
            { name: 'Trứng vịt', desc: 'Trứng vịt hữu cơ, lòng đỏ to, giàu dinh dưỡng.', price: 50000, unit: 'hộp 10 quả', cat: 'Sữa & Trứng', prefix: 'DAI', weight: 700 },

            // 🌾 5. Ngũ cốc & Hạt hữu cơ
            { name: 'Gạo lứt', desc: 'Gạo lứt hữu cơ nguyên cám, giàu chất xơ và vitamin B.', price: 85000, unit: 'kg', cat: 'Ngũ cốc & Hạt', prefix: 'GRA', weight: 2000 },
            { name: 'Gạo trắng hữu cơ', desc: 'Gạo trắng thơm hữu cơ, dẻo mềm, an toàn.', price: 65000, unit: 'kg', cat: 'Ngũ cốc & Hạt', prefix: 'GRA', weight: 2000 },
            { name: 'Yến mạch', desc: 'Yến mạch hữu cơ nguyên hạt, giàu beta-glucan.', price: 75000, unit: 'hộp 500g', cat: 'Ngũ cốc & Hạt', prefix: 'GRA', weight: 500 },
            { name: 'Lúa mì', desc: 'Lúa mì hữu cơ nguyên hạt, dùng làm bánh mì, mì sợi.', price: 55000, unit: 'kg', cat: 'Ngũ cốc & Hạt', prefix: 'GRA', weight: 1000 },
            { name: 'Hạt diêm mạch (Quinoa)', desc: 'Quinoa hữu cơ nhập khẩu, siêu thực phẩm giàu protein.', price: 150000, unit: 'hộp 500g', cat: 'Ngũ cốc & Hạt', prefix: 'GRA', weight: 500 },
            { name: 'Hạt kê', desc: 'Hạt kê hữu cơ, nhỏ hạt, giàu khoáng chất.', price: 60000, unit: 'gói 500g', cat: 'Ngũ cốc & Hạt', prefix: 'GRA', weight: 500 },
            { name: 'Ngô (Bắp)', desc: 'Ngô hữu cơ ngọt tự nhiên, non mềm.', price: 15000, unit: 'trái', cat: 'Ngũ cốc & Hạt', prefix: 'GRA', weight: 300 },
            { name: 'Đậu đen', desc: 'Đậu đen hữu cơ, hạt mẩy, giàu anthocyanin.', price: 50000, unit: 'kg', cat: 'Ngũ cốc & Hạt', prefix: 'GRA', weight: 500 },
            { name: 'Đậu xanh', desc: 'Đậu xanh hữu cơ nguyên vỏ, nấu chè hoặc giá đỗ.', price: 45000, unit: 'kg', cat: 'Ngũ cốc & Hạt', prefix: 'GRA', weight: 500 },
            { name: 'Đậu lăng', desc: 'Đậu lăng hữu cơ, giàu protein và chất xơ.', price: 80000, unit: 'gói 500g', cat: 'Ngũ cốc & Hạt', prefix: 'GRA', weight: 500 },
            { name: 'Đậu gà (Chickpea)', desc: 'Đậu gà hữu cơ nhập khẩu, dùng làm hummus hoặc nấu canh.', price: 85000, unit: 'gói 500g', cat: 'Ngũ cốc & Hạt', prefix: 'GRA', weight: 500 },
            { name: 'Hạt chia', desc: 'Hạt chia hữu cơ, giàu omega-3 và chất xơ.', price: 120000, unit: 'gói 300g', cat: 'Ngũ cốc & Hạt', prefix: 'GRA', weight: 300 },
            { name: 'Hạt lanh', desc: 'Hạt lanh hữu cơ, tốt cho tim mạch và tiêu hóa.', price: 90000, unit: 'gói 300g', cat: 'Ngũ cốc & Hạt', prefix: 'GRA', weight: 300 },
            { name: 'Hạt hướng dương', desc: 'Hạt hướng dương hữu cơ, giàu vitamin E.', price: 55000, unit: 'gói 500g', cat: 'Ngũ cốc & Hạt', prefix: 'GRA', weight: 500 },
            { name: 'Hạt bí', desc: 'Hạt bí hữu cơ, giàu kẽm và magie.', price: 70000, unit: 'gói 300g', cat: 'Ngũ cốc & Hạt', prefix: 'GRA', weight: 300 },
            { name: 'Hạnh nhân', desc: 'Hạnh nhân hữu cơ California, giòn béo, giàu vitamin E.', price: 200000, unit: 'hộp 500g', cat: 'Ngũ cốc & Hạt', prefix: 'GRA', weight: 500 },
            { name: 'Óc chó', desc: 'Hạt óc chó hữu cơ, giàu omega-3, tốt cho não.', price: 250000, unit: 'hộp 500g', cat: 'Ngũ cốc & Hạt', prefix: 'GRA', weight: 500 },
            { name: 'Hạt điều', desc: 'Hạt điều hữu cơ Bình Phước, bùi béo tự nhiên.', price: 180000, unit: 'hộp 500g', cat: 'Ngũ cốc & Hạt', prefix: 'GRA', weight: 500 },

            // ☕ 6. Đồ uống hữu cơ
            { name: 'Cà phê hữu cơ', desc: 'Cà phê Arabica hữu cơ rang xay, thơm nồng đậm đà.', price: 150000, unit: 'gói 500g', cat: 'Đồ uống', prefix: 'DRI', weight: 500 },
            { name: 'Trà xanh hữu cơ', desc: 'Trà xanh hữu cơ nguyên lá, thanh mát, giàu catechin.', price: 95000, unit: 'hộp 100g', cat: 'Đồ uống', prefix: 'DRI', weight: 100 },
            { name: 'Trà đen hữu cơ', desc: 'Trà đen hữu cơ đậm vị, thơm hương mộc mạc.', price: 90000, unit: 'hộp 100g', cat: 'Đồ uống', prefix: 'DRI', weight: 100 },
            { name: 'Trà thảo mộc hữu cơ', desc: 'Trà thảo mộc tổng hợp hữu cơ, thư giãn, an thần.', price: 85000, unit: 'hộp 20 túi lọc', cat: 'Đồ uống', prefix: 'DRI', weight: 40 },
            { name: 'Rượu vang hữu cơ', desc: 'Rượu vang đỏ hữu cơ nhập khẩu, không sulfite.', price: 450000, unit: 'chai 750ml', cat: 'Đồ uống', prefix: 'DRI', weight: 750 },
            { name: 'Bia hữu cơ', desc: 'Bia hữu cơ craft, nguyên liệu 100% organic.', price: 65000, unit: 'lon 330ml', cat: 'Đồ uống', prefix: 'DRI', weight: 330 },
            { name: 'Nước ép trái cây hữu cơ', desc: 'Nước ép hỗn hợp trái cây hữu cơ 100%, không đường.', price: 55000, unit: 'chai 500ml', cat: 'Đồ uống', prefix: 'DRI', weight: 500 },
            { name: 'Sữa hạt hữu cơ', desc: 'Sữa hạt hạnh nhân/yến mạch hữu cơ, thay thế sữa bò.', price: 65000, unit: 'hộp 1L', cat: 'Đồ uống', prefix: 'DRI', weight: 1000 },
            { name: 'Nước dừa hữu cơ', desc: 'Nước dừa hữu cơ 100% nguyên chất, giải khát bổ dưỡng.', price: 35000, unit: 'hộp 500ml', cat: 'Đồ uống', prefix: 'DRI', weight: 500 },
        ];

        let added = 0;
        let skipped = 0;

        for (const item of newProducts) {
            // Check trùng tên (case-insensitive and fuzzy)
            const lowerName = item.name.toLowerCase().trim();
            if (existingNames.has(lowerName)) {
                console.log(`⏭️  Bỏ qua (trùng): ${item.name}`);
                skipped++;
                continue;
            }

            const categoryId = catMap[item.cat];
            if (!categoryId) {
                console.log(`⚠️  Không tìm thấy danh mục "${item.cat}" cho sản phẩm "${item.name}"`);
                skipped++;
                continue;
            }

            try {
                await Product.create({
                    sku: generateSku(item.prefix),
                    name: item.name,
                    description: item.desc,
                    price: item.price,
                    originalPrice: item.price > 50000 ? Math.round(item.price * 1.15) : null,
                    stock: Math.floor(Math.random() * 100) + 30,
                    organicType: 'Vietnam Organic',
                    certification: 'Chứng nhận hữu cơ Việt Nam',
                    images: JSON.stringify([]),
                    weight: item.weight,
                    unit: item.unit,
                    categoryId: categoryId,
                    isFeatured: false
                });
                existingNames.add(lowerName);
                added++;
                console.log(`✅ Đã thêm: ${item.name}`);
            } catch (err) {
                console.log(`❌ Lỗi khi thêm "${item.name}": ${err.message}`);
                skipped++;
            }
        }

        console.log(`\n🎉 Hoàn tất! Đã thêm ${added} sản phẩm mới, bỏ qua ${skipped} sản phẩm trùng.`);

    } catch (error) {
        console.error('❌ Lỗi:', error);
    } finally {
        process.exit(0);
    }
};

addProducts();
