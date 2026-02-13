const { User, Category, Product, syncDatabase } = require('../models');
const bcrypt = require('bcryptjs');

const seedData = async () => {
    try {
        console.log('🌱 Starting database seed...');

        // Sync database (force: true will drop existing tables)
        await syncDatabase(true);

        // Create admin user
        const adminPassword = await bcrypt.hash('admin123', 10);
        await User.create({
            email: 'admin@freshcart.vn',
            password: adminPassword,
            fullName: 'Admin FreshCart',
            phone: '0123456789',
            role: 'admin',
            address: 'Hà Nội, Việt Nam'
        }, { hooks: false });

        // Create inventory manager
        const managerPassword = await bcrypt.hash('manager123', 10);
        await User.create({
            email: 'manager@freshcart.vn',
            password: managerPassword,
            fullName: 'Inventory Manager',
            phone: '0987654321',
            role: 'inventory_manager',
            address: 'TP. Hồ Chí Minh, Việt Nam'
        }, { hooks: false });

        // Create sample customer
        const customerPassword = await bcrypt.hash('customer123', 10);
        await User.create({
            email: 'customer@example.com',
            password: customerPassword,
            fullName: 'Nguyễn Văn A',
            phone: '0912345678',
            role: 'customer',
            address: '123 Đường ABC, Quận 1, TP.HCM'
        }, { hooks: false });

        console.log('✅ Users created');

        // Create categories
        const categories = await Category.bulkCreate([
            {
                name: 'Rau củ hữu cơ',
                slug: 'rau-cu-huu-co',
                description: 'Các loại rau củ được trồng theo phương pháp hữu cơ',
                image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop&q=80'
            },
            {
                name: 'Trái cây hữu cơ',
                slug: 'trai-cay-huu-co',
                description: 'Trái cây tươi ngon, không hóa chất',
                image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=400&fit=crop&q=80'
            },
            {
                name: 'Thịt & Hải sản',
                slug: 'thit-hai-san',
                description: 'Thịt và hải sản sạch, nguồn gốc rõ ràng',
                image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop&q=80'
            },
            {
                name: 'Sữa & Trứng',
                slug: 'sua-trung',
                description: 'Sản phẩm từ sữa và trứng organic',
                image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&h=400&fit=crop&q=80'
            },
            {
                name: 'Ngũ cốc & Hạt',
                slug: 'ngu-coc-hat',
                description: 'Ngũ cốc và các loại hạt dinh dưỡng',
                image: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=400&h=400&fit=crop&q=80'
            },
            {
                name: 'Đồ uống',
                slug: 'do-uong',
                description: 'Nước ép, trà và đồ uống organic',
                image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop&q=80'
            }
        ]);

        console.log('✅ Categories created');

        // Create products
        await Product.bulkCreate([
            // Rau củ hữu cơ
            {
                sku: 'VEG001',
                name: 'Rau cải xanh',
                description: 'Rau cải xanh được trồng theo phương pháp hữu cơ, không thuốc trừ sâu. Giàu vitamin K, C và chất xơ.',
                price: 25000,
                originalPrice: 30000,
                stock: 100,
                organicType: 'USDA Organic',
                certification: 'Chứng nhận hữu cơ Việt Nam',
                images: JSON.stringify(['https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=600&fit=crop']),
                weight: 500,
                unit: 'bó',
                categoryId: categories[0].id,
                isFeatured: true
            },
            {
                sku: 'VEG002',
                name: 'Cà chua bi',
                description: 'Cà chua bi ngọt tự nhiên, giàu lycopene. Trồng trong nhà kính theo tiêu chuẩn organic.',
                price: 45000,
                originalPrice: 50000,
                stock: 80,
                organicType: 'EU Organic',
                certification: 'Chứng nhận GlobalGAP',
                images: JSON.stringify(['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&h=600&fit=crop']),
                weight: 500,
                unit: 'hộp',
                categoryId: categories[0].id,
                isFeatured: true
            },
            {
                sku: 'VEG003',
                name: 'Bông cải xanh organic',
                description: 'Bông cải xanh tươi, giàu chất chống oxy hóa và vitamin C.',
                price: 55000,
                stock: 60,
                organicType: 'USDA Organic',
                certification: 'Chứng nhận hữu cơ VN',
                images: JSON.stringify(['https://product.hstatic.net/200000460455/product/bong_20cai_20xanh_53f10b762ecf4ae3b085d034b52ecd39_18ddfaa7d5934b2ea747812942c0ee7a.jpg']),
                weight: 400,
                unit: 'bông',
                categoryId: categories[0].id
            },
            // Trái cây hữu cơ
            {
                sku: 'FRU001',
                name: 'Táo Fuji hữu cơ',
                description: 'Táo Fuji nhập khẩu từ Nhật Bản, ngọt thơm tự nhiên.',
                price: 120000,
                originalPrice: 150000,
                stock: 50,
                organicType: 'JAS Organic',
                certification: 'Chứng nhận JAS Nhật Bản',
                images: JSON.stringify(['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&h=600&fit=crop']),
                weight: 1000,
                unit: 'kg',
                categoryId: categories[1].id,
                isFeatured: true
            },
            {
                sku: 'FRU002',
                name: 'Chuối organic Đồng Nai',
                description: 'Chuối sạch từ nông trại organic Đồng Nai, chín tự nhiên.',
                price: 35000,
                stock: 120,
                organicType: 'Vietnam Organic',
                certification: 'Chứng nhận PGS Việt Nam',
                images: JSON.stringify(['https://images.unsplash.com/photo-1603833797131-3c0a18fcb6b1?w=600&h=600&fit=crop']),
                weight: 1000,
                unit: 'nải',
                categoryId: categories[1].id
            },
            {
                sku: 'FRU003',
                name: 'Cam sành Vĩnh Long',
                description: 'Cam sành ngọt từ vườn organic Vĩnh Long.',
                price: 65000,
                stock: 70,
                organicType: 'Vietnam Organic',
                certification: 'Chứng nhận VietGAP',
                images: JSON.stringify(['https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?w=600&h=600&fit=crop']),
                weight: 1000,
                unit: 'kg',
                categoryId: categories[1].id,
                isFeatured: true
            },
            // Thịt & Hải sản
            {
                sku: 'MEA001',
                name: 'Thịt heo organic',
                description: 'Thịt heo từ trang trại chăn nuôi organic, không kháng sinh.',
                price: 180000,
                stock: 30,
                organicType: 'Organic Farm',
                certification: 'Chứng nhận VietGAP',
                images: JSON.stringify(['https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=600&h=600&fit=crop']),
                weight: 500,
                unit: 'g',
                categoryId: categories[2].id
            },
            {
                sku: 'MEA002',
                name: 'Cá hồi Na Uy tươi',
                description: 'Cá hồi nhập khẩu Na Uy, giàu omega-3.',
                price: 350000,
                originalPrice: 400000,
                stock: 25,
                organicType: 'ASC Certified',
                certification: 'Chứng nhận ASC',
                images: JSON.stringify(['https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&h=600&fit=crop']),
                weight: 500,
                unit: 'g',
                categoryId: categories[2].id,
                isFeatured: true
            },
            // Sữa & Trứng
            {
                sku: 'DAI001',
                name: 'Sữa tươi organic TH True Milk',
                description: 'Sữa tươi 100% organic từ bò nuôi theo tiêu chuẩn organic.',
                price: 42000,
                stock: 200,
                organicType: 'EU Organic',
                certification: 'Chứng nhận EU Organic',
                images: JSON.stringify(['https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&h=600&fit=crop']),
                weight: 1000,
                unit: 'hộp',
                categoryId: categories[3].id,
                isFeatured: true
            },
            {
                sku: 'DAI002',
                name: 'Trứng gà ta organic',
                description: 'Trứng từ gà được nuôi thả vườn, ăn thức ăn organic.',
                price: 55000,
                stock: 150,
                organicType: 'Free Range',
                certification: 'Chứng nhận organic VN',
                images: JSON.stringify(['https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=600&h=600&fit=crop']),
                weight: 600,
                unit: 'hộp 10 quả',
                categoryId: categories[3].id
            },
            // Ngũ cốc & Hạt
            {
                sku: 'GRA001',
                name: 'Gạo lứt hữu cơ',
                description: 'Gạo lứt giữ nguyên lớp cám, giàu chất xơ và vitamin B.',
                price: 85000,
                stock: 100,
                organicType: 'Vietnam Organic',
                certification: 'Chứng nhận hữu cơ VN',
                images: JSON.stringify(['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&h=600&fit=crop']),
                weight: 2000,
                unit: 'kg',
                categoryId: categories[4].id
            },
            {
                sku: 'GRA002',
                name: 'Hạt óc chó California',
                description: 'Hạt óc chó nhập khẩu Mỹ, giàu omega-3.',
                price: 250000,
                stock: 40,
                organicType: 'USDA Organic',
                certification: 'Chứng nhận USDA',
                images: JSON.stringify(['https://suckhoedoisong.qltns.mediacdn.vn/324455921873985536/2023/8/8/qua-oc-cho-1691500231004951165640.jpg']),
                weight: 500,
                unit: 'hộp',
                categoryId: categories[4].id,
                isFeatured: true
            },
            // Đồ uống
            {
                sku: 'DRI001',
                name: 'Nước ép táo organic',
                description: 'Nước ép táo 100% nguyên chất, không đường, không phụ gia.',
                price: 65000,
                stock: 80,
                organicType: 'EU Organic',
                certification: 'Chứng nhận EU Organic',
                images: JSON.stringify(['https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&h=600&fit=crop']),
                weight: 1000,
                unit: 'chai',
                categoryId: categories[5].id
            },
            {
                sku: 'DRI002',
                name: 'Trà xanh Thái Nguyên',
                description: 'Trà xanh hữu cơ từ vùng trà Thái Nguyên.',
                price: 120000,
                stock: 60,
                organicType: 'Vietnam Organic',
                certification: 'Chứng nhận hữu cơ VN',
                images: JSON.stringify(['https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=600&fit=crop']),
                weight: 200,
                unit: 'hộp',
                categoryId: categories[5].id
            }
        ]);


        console.log('✅ Products created');
        console.log('🎉 Database seed completed successfully!');
        console.log('\n📝 Test accounts:');
        console.log('   Admin: admin@freshcart.vn / admin123');
        console.log('   Manager: manager@freshcart.vn / manager123');
        console.log('   Customer: customer@example.com / customer123');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
};

// Run if called directly
if (require.main === module) {
    const { testConnection } = require('../config/database');
    testConnection().then(() => {
        seedData().then(() => {
            process.exit(0);
        }).catch(() => {
            process.exit(1);
        });
    });
}

module.exports = seedData;
