// ========================================================
// ANH SAN PHAM - TAT CA DUNG UNSPLASH (LINK ON DINH)
// ========================================================

const imageList = [

    // ==========================================
    // Rau cu huu co
    // ==========================================
    { id: 1, name: "Rau cải xanh", image: "https://images.baodantoc.vn/uploads/2023/Th%C3%A1ng%202/Ng%C3%A0y_17/Thanh/20210528_145200_370993_rau-cai.max-1800x1800.jpg" },
    { id: 2, name: "Cà chua bi", image: "https://images.unsplash.com/photo-1594975620064-bad38e1c9e30?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YyVDMyVBMCUyMGNodWElMjBiaXxlbnwwfHwwfHx8MA%3D%3D" },
    { id: 3, name: "Bông cải xanh organic", image: "https://images.unsplash.com/photo-1757332334626-8dadb145540d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8QiVDMyVCNG5nJTIwYyVFMSVCQSVBM2klMjB4YW5oJTIwb3JnYW5pY3xlbnwwfHwwfHx8MA%3D%3D" },
    { id: 15, name: "Cải bó xôi (Rau bina)", image: "https://images.unsplash.com/photo-1653842648037-2e449847a78d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fEMlRTElQkElQTNpJTIwYiVDMyVCMyUyMHglQzMlQjRpJTIwKFJhdSUyMGJpbmEpfGVufDB8fDB8fHww" },
    { id: 16, name: "Cải xoăn (Kale)", image: "https://plus.unsplash.com/premium_photo-1702400311478-4645cf150426?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8QyVFMSVCQSVBM2klMjB4byVDNCU4M24lMjAoS2FsZSl8ZW58MHx8MHx8fDA%3D" },
    { id: 17, name: "Xà lách", image: "https://images.unsplash.com/photo-1566842600175-97dca489844f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8UyVDMyVCQXAlMjBsJUM2JUExJTIwdHIlRTElQkElQUZuZ3xlbnwwfHwwfHx8MA%3D%3D" },
    { id: 18, name: "Bông cải xanh (Broccoli)", image: "https://images.unsplash.com/photo-1628773822503-930a7eaecf80?auto=format&fit=crop&w=500&q=80" },
    { id: 19, name: "Súp lơ trắng", image: "https://nongsandalat.vn/wp-content/uploads/2021/10/12.jpg" },
    { id: 20, name: "Cà rốt", image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=500&q=80" },
    { id: 21, name: "Khoai tây", image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8S2hvYWklMjB0JUMzJUEyeXxlbnwwfHwwfHx8MA%3D%3D" },
    { id: 22, name: "Khoai lang", image: "https://plus.unsplash.com/premium_photo-1675365780148-a00379c54123?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8S2hvYWklMjBsYW5nfGVufDB8fDB8fHww" },
    { id: 23, name: "Cà chua", image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80" },
    { id: 24, name: "Dưa chuột", image: "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=500&q=80" },
    { id: 25, name: "Ớt chuông", image: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=500&q=80" },
    { id: 26, name: "Cần tây", image: "https://plus.unsplash.com/premium_photo-1723485646947-c73bf14ccdb7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8QyVFMSVCQSVBN24lMjB0JUMzJUEyeXxlbnwwfHwwfHx8MA%3D%3D" },
    { id: 27, name: "Bí đỏ", image: "https://images.unsplash.com/photo-1506917728037-b6af01a7d403?auto=format&fit=crop&w=500&q=80" },
    { id: 28, name: "Bí xanh", image: "https://images.unsplash.com/photo-1563252722-6434563a985d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8QiVDMyVBRCUyMHhhbmh8ZW58MHx8MHx8fDA%3D" },
    { id: 29, name: "Măng tây", image: "https://images.unsplash.com/photo-1515471209610-dae1c92d8777?auto=format&fit=crop&w=500&q=80" },
    { id: 30, name: "Củ dền", image: "https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?auto=format&fit=crop&w=500&q=80" },
    { id: 31, name: "Hành tây", image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=500&q=80" },
    { id: 32, name: "Tỏi", image: "https://images.unsplash.com/photo-1639119677984-b6c9ed1b0ca8?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8VCVFMSVCQiU4Rml8ZW58MHx8MHx8fDA%3D" },
    { id: 33, name: "Đậu Hà Lan", image: "https://images.unsplash.com/photo-1592394533824-9440e5d68530?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8JUM0JTkwJUUxJUJBJUFEdSUyMEglQzMlQTAlMjBMYW58ZW58MHx8MHx8fDA%3D" },
    { id: 34, name: "Đậu cô ve", image: "https://images.unsplash.com/photo-1560252030-9fc63cb78dac?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8aGFyaWNvdHN8ZW58MHx8MHx8fDA%3D" },

    // ==========================================
    // Trai cay huu co
    // ==========================================
    { id: 4, name: "Táo Fuji hữu cơ", image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=500&q=80" },
    { id: 5, name: "Chuối organic Đồng Nai", image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=500&q=80" },
    { id: 6, name: "Cam sành Vĩnh Long", image: "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=500&q=80" },
    { id: 35, name: "Táo", image: "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?auto=format&fit=crop&w=500&q=80" },
    { id: 36, name: "Lê", image: "https://images.unsplash.com/photo-1631160299919-6a175aa6d189?auto=format&fit=crop&w=500&q=80" },
    { id: 37, name: "Chuối", image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=500&q=80" },
    { id: 38, name: "Cam", image: "https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?auto=format&fit=crop&w=500&q=80" },
    { id: 39, name: "Quýt", image: "https://suckhoedoisong.qltns.mediacdn.vn/324455921873985536/2025/4/13/quyt-sim-7-1744539608592227907836-1744585952930-1744585953033894859687.jpg" },
    { id: 40, name: "Chanh", image: "https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=500&q=80" },
    { id: 41, name: "Bưởi", image: "https://cayxanhdaiviet.vn/wp-content/uploads/2020/03/cay-buoi.jpg" },
    { id: 42, name: "Dâu tây", image: "https://cdn.tgdd.vn/2021/05/CookProduct/0-1200x676-8.jpg" },
    { id: 43, name: "Việt quất", image: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=500&q=80" },
    { id: 44, name: "Mâm xôi", image: "https://images.unsplash.com/photo-1577069861033-55d04cec4ef5?auto=format&fit=crop&w=500&q=80" },
    { id: 45, name: "Nho", image: "https://suckhoeviet.org.vn/stores/news_dataimages/2025/082025/19/10/nho-ninh-thuan-120250819102844.7069360.jpeg?rt=20250819102900" },
    { id: 46, name: "Kiwi", image: "https://hoaquafuji.com/storage/app/media/uploaded-files/kiwi-vang-trong-o-dau-1-9.jpg" },
    { id: 47, name: "Xoài", image: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=500&q=80" },
    { id: 48, name: "Đu đủ", image: "https://media.vov.vn/sites/default/files/styles/large/public/2025-09/du_du.jpg" },
    { id: 49, name: "Dứa", image: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=500&q=80" },
    { id: 50, name: "Bơ", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPR2cQKNpolQMXh2q9F7CDC-GsNUYxxk_wWA&s" },
    { id: 51, name: "Đào", image: "https://cdn.tgdd.vn/Files/2020/06/13/1262832/hoc-cach-phan-biet-cac-loai-dao-tuoi-dang-ban-tren-thi-truong-202006202149081661.jpg" },
    { id: 52, name: "Xuân đào (Nectarine)", image: "https://traicayvuongtron.vn/resources/cache/original_xxxxx/WEBSITE%202023/tim%20hieu%20them/blog/kinh%20nghiem%2Cmeo%20vat/trai%20cay/trai%20cay%20dac%20san/daosapa/daosapa2.jpg.webp" },
    { id: 53, name: "Anh đào (Cherry)", image: "https://360fruit.vn/uploads/file/baiviet/cherry-va-anh-dao.jpg" },

    // ==========================================
    // Thit & Hai san
    // ==========================================
    { id: 7, name: "Thịt heo organic", image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=500&q=80" },
    { id: 8, name: "Cá hồi Na Uy tươi", image: "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?auto=format&fit=crop&w=500&q=80" },
    { id: 54, name: "Thịt bò", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNjmyHCygvFVZYbUdvKJKJc62AERZeZDWg3Q&s" },
    { id: 55, name: "Thịt gà", image: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=500&q=80" },
    { id: 56, name: "Thịt heo", image: "https://vavc.edu.vn/uploads/images/255420380_4438273872886334_6849360604609483408_n.jpg" },
    { id: 57, name: "Thịt cừu", image: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=500&q=80" },
    { id: 58, name: "Cá hồi", image: "https://nguyenhafood.vn/uploads/2023/06/15/1cd740b40d1eaa98c8d7634e2db3a459.jpg" },
    { id: 59, name: "Cá thu", image: "https://haisansachgiasi.com/wp-content/uploads/2023/06/4-9.jpg" },
    { id: 60, name: "Cá basa", image: "https://vinafood.vn/wp-content/uploads/2021/10/ca-basa-cat-khuc.jpg" },
    { id: 61, name: "Tôm", image: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=500&q=80" },
    { id: 62, name: "Trứng cá hồi", image: "https://sushiworld.com.vn/wp-content/uploads/2024/07/trung-ca-hoi.jpg" },

    // ==========================================
    // Sua & Trung
    // ==========================================
    { id: 9, name: "Sữa tươi organic TH True Milk", image: "https://suachobeyeu.vn/upload/images/sua-tuoi-huu-co-th-true-milk-organic-hop-500ml-1.jpg" },
    { id: 10, name: "Trứng gà ta organic", image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=500&q=80" },
    { id: 63, name: "Sữa tươi", image: "https://img.websosanh.vn/v2/users/review/images/6tge9w7rdgnr0.jpg?compress=85" },
    { id: 64, name: "Sữa chua", image: "https://product.hstatic.net/200000405233/product/suachuana_cbc78fd927b94412890583c7b42fa003_grande.jpg" },
    { id: 65, name: "Phô mai", image: "https://data-service.pharmacity.io/pmc-upload-media/production/pmc-ecm-asm/blog/pho-mai-co-nhieu-dinh-duong.webp" },
    { id: 66, name: "Bơ (Butter)", image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=500&q=80" },
    { id: 67, name: "Kem tươi", image: "https://news.vio.vn/wp-content/uploads/2022/08/cach-lam-kem-tuoi-pho-mai-8.jpg" },
    { id: 68, name: "Trứng gà", image: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=500&q=80" },
    { id: 69, name: "Trứng vịt", image: "https://nongsandungha.com/wp-content/uploads/2021/05/Cach-luoc-trung-vit-lon-ngon-mem-khong-bi-nut.jpg" },

    // ==========================================
    // Ngu coc & Hat
    // ==========================================
    { id: 11, name: "Gạo lứt hữu cơ", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80" },
    { id: 12, name: "Hạt óc chó California", image: "https://wowmart.vn/wp-content/uploads/2015/08/hinh2-1.jpg" },
    { id: 70, name: "Gạo lứt", image: "https://suckhoedoisong.qltns.mediacdn.vn/324455921873985536/2022/12/16/a-va-nguoi-benh-dai-thao-duong-an-gao-lut-the-nao-16711647068152070374816.jpg" },
    { id: 71, name: "Gạo trắng hữu cơ", image: "https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=500&q=80" },
    { id: 72, name: "Yến mạch", image: "https://thanhanfood.com.vn/wp-content/uploads/2024/08/nhung-ai-khong-nen-an-yen-mach-1.jpg" },
    { id: 73, name: "Lúa mì", image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=500&q=80" },
    { id: 74, name: "Hạt diêm mạch (Quinoa)", image: "https://www.vinmec.com/static/uploads/20210312_065602_248439_hat_quinoa_do_max_1800x1800_jpg_e43ba70666.jpg" },
    { id: 75, name: "Hạt kê", image: "https://phuongnamfarm.vn/uploads/images/2024/05/540x405-1715670618-single_product1-hk1.jpg" },
    { id: 76, name: "Ngô (Bắp)", image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=500&q=80" },
    { id: 77, name: "Đậu đen", image: "https://file.hstatic.net/200000069234/file/dau_den_xanh_long_co_tac_dung_gi_eb7b0ef719b64e3eae83f469670957ca_grande.jpg" },
    { id: 78, name: "Đậu xanh", image: "https://suckhoedoisong.qltns.mediacdn.vn/324455921873985536/2025/1/14/photo-1736829040783-1736829041120101757243.jpeg" },
    { id: 79, name: "Đậu lăng", image: "https://images2.thanhnien.vn/528068263637045248/2024/1/20/red-lentils-17057189675691676524001.jpg" },
    { id: 80, name: "Đậu gà (Chickpea)", image: "https://cdn.tgdd.vn/Files/2018/05/26/1091133/dau-ga-chickpeas-la-gi-nhung-loi-ich-cua-dau-ga-voi-suc-khoe-202202141344179878.jpg" },
    { id: 81, name: "Hạt chia", image: "https://images.unsplash.com/photo-1505575967455-40e256f73376?auto=format&fit=crop&w=500&q=80" },
    { id: 82, name: "Hạt lanh", image: "https://suckhoeviet.org.vn/stores/news_dataimages/2025/042025/22/15/bat-mi-tac-dung-cua-hat-lanh-doi-voi-suc-khoe-1-3fcd9f817420250422155611.8551240.jpg?rt=20250422155627" },
    { id: 83, name: "Hạt hướng dương", image: "https://thanhnien.mediacdn.vn/Uploaded/congthang/2022_07_29/sunflower-seeds-4057.jpg" },
    { id: 84, name: "Hạt bí", image: "https://thanhnien.mediacdn.vn/Uploaded/minhnguyet/2022_07_12/an-hat-bi-do-3239.jpg" },
    { id: 85, name: "Hạnh nhân", image: "https://login.medlatec.vn//ImagePath/images/20220808/20220808_Duong-chat-trong-hanh-nhan-giup-han-che-ty-le-ung-thu.jpg" },
    { id: 86, name: "Óc chó", image: "https://production-cdn.pharmacity.io/digital/original/plain/blog/qua-oc-cho-hinh-3.jpg" },
    { id: 87, name: "Hạt điều", image: "https://cdn.shopify.com/s/files/1/0586/6268/2802/files/hat-dieu-a-co-la-gi_1024x1024.webp?v=1672124892" },

    // ==========================================
    // Do uong
    // ==========================================
    { id: 13, name: "Nước ép táo organic", image: "https://hoaquamongoi.com/wp-content/uploads/2025/11/Nuoc-ep24.png" },
    { id: 14, name: "Trà xanh Thái Nguyên", image: "https://cozy.vn/wp-content/uploads/2023/06/352231789_245514158112637_2157438755187208291_n.jpeg" },
    { id: 88, name: "Cà phê hữu cơ", image: "https://images.unsplash.com/photo-1559496417-e7f25cb247f3?auto=format&fit=crop&w=500&q=80" },
    { id: 89, name: "Trà xanh hữu cơ", image: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&w=500&q=80" },
    { id: 90, name: "Trà đen hữu cơ", image: "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=500&q=80" },
    { id: 91, name: "Trà thảo mộc hữu cơ", image: "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lo13sx4u0q997d" },
    { id: 92, name: "Rượu vang hữu cơ", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=500&q=80" },
    { id: 93, name: "Bia hữu cơ", image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=500&q=80" },
    { id: 94, name: "Nước ép trái cây hữu cơ", image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=80" },
    { id: 95, name: "Sữa hạt hữu cơ", image: "https://solomonorganic.com/wp-content/uploads/2025/11/unnamed-150.jpg" },
    { id: 96, name: "Nước dừa hữu cơ", image: "https://www.betrimex.com.vn/uploads/betrimex-media/betrimex-ra-mat-san-pham-nuoc-dua-cocoxim-organic-dat-chuan.jpg" },
];

module.exports = imageList;
