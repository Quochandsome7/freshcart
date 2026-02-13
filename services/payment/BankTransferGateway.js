const PaymentGateway = require('./PaymentGateway');

/**
 * Bank Transfer Gateway
 * Xử lý thanh toán chuyển khoản ngân hàng
 * Hỗ trợ QR code qua VietQR API
 */
class BankTransferGateway extends PaymentGateway {
    constructor() {
        super();
        // Thông tin tài khoản nhận thanh toán của cửa hàng
        this.storeAccount = {
            accountNumber: '0348778086',
            accountName: 'NGUYEN ANH QUOC',
            bankCode: 'MB',
            bankBin: '970422',
            bankName: 'MB Bank',
        };

        // Danh sách ngân hàng hỗ trợ (mã BIN theo VietQR)
        this.banks = [
            { code: 'VCB', bin: '970436', name: 'Vietcombank', fullName: 'Ngân hàng TMCP Ngoại thương Việt Nam', logo: 'https://api.vietqr.io/img/VCB.png', color: '#00703c' },
            { code: 'TCB', bin: '970407', name: 'Techcombank', fullName: 'Ngân hàng TMCP Kỹ thương Việt Nam', logo: 'https://api.vietqr.io/img/TCB.png', color: '#f40009' },
            { code: 'MB', bin: '970422', name: 'MB Bank', fullName: 'Ngân hàng TMCP Quân đội', logo: 'https://api.vietqr.io/img/MB.png', color: '#004a9c' },
            { code: 'BIDV', bin: '970418', name: 'BIDV', fullName: 'Ngân hàng TMCP Đầu tư và Phát triển VN', logo: 'https://api.vietqr.io/img/BIDV.png', color: '#00448b' },
            { code: 'VBA', bin: '970405', name: 'Agribank', fullName: 'Ngân hàng Nông nghiệp và PTNT Việt Nam', logo: 'https://api.vietqr.io/img/VBA.png', color: '#d71a21' },
            { code: 'VPB', bin: '970432', name: 'VPBank', fullName: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', logo: 'https://api.vietqr.io/img/VPB.png', color: '#00875a' },
            { code: 'ACB', bin: '970416', name: 'ACB', fullName: 'Ngân hàng TMCP Á Châu', logo: 'https://api.vietqr.io/img/ACB.png', color: '#1a1a6c' },
            { code: 'TPB', bin: '970423', name: 'TPBank', fullName: 'Ngân hàng TMCP Tiên Phong', logo: 'https://api.vietqr.io/img/TPB.png', color: '#7b2d8e' },
            { code: 'STB', bin: '970403', name: 'Sacombank', fullName: 'Ngân hàng TMCP Sài Gòn Thương Tín', logo: 'https://api.vietqr.io/img/STB.png', color: '#005baa' },
            { code: 'VIB', bin: '970441', name: 'VIB', fullName: 'Ngân hàng TMCP Quốc tế Việt Nam', logo: 'https://api.vietqr.io/img/VIB.png', color: '#0066b3' },
            { code: 'HDB', bin: '970437', name: 'HDBank', fullName: 'Ngân hàng TMCP Phát triển TP.HCM', logo: 'https://api.vietqr.io/img/HDB.png', color: '#e4002b' },
            { code: 'SHB', bin: '970443', name: 'SHB', fullName: 'Ngân hàng TMCP Sài Gòn - Hà Nội', logo: 'https://api.vietqr.io/img/SHB.png', color: '#003087' },
            { code: 'MSB', bin: '970426', name: 'MSB', fullName: 'Ngân hàng TMCP Hàng Hải Việt Nam', logo: 'https://api.vietqr.io/img/MSB.png', color: '#003399' },
            { code: 'OCB', bin: '970448', name: 'OCB', fullName: 'Ngân hàng TMCP Phương Đông', logo: 'https://api.vietqr.io/img/OCB.png', color: '#1a1a6c' },
            { code: 'LPB', bin: '970449', name: 'LPBank', fullName: 'Ngân hàng TMCP Bưu điện Liên Việt', logo: 'https://api.vietqr.io/img/LPB.png', color: '#002f6c' },
        ];
    }

    /**
     * Lấy danh sách ngân hàng
     */
    getBanks() {
        return this.banks;
    }

    /**
     * Lấy thông tin ngân hàng theo mã
     */
    getBankByCode(code) {
        return this.banks.find(b => b.code === code) || this.banks[0];
    }

    /**
     * Tạo URL QR code VietQR
     */
    generateQRUrl(bankCode, amount, orderNumber) {
        const content = `FreshCart ${orderNumber}`;
        // QR luôn dùng BIN ngân hàng của cửa hàng (MB Bank) - nơi nhận tiền
        const qrUrl = `https://img.vietqr.io/image/${this.storeAccount.bankBin}-${this.storeAccount.accountNumber}-compact2.png?amount=${Math.round(amount)}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(this.storeAccount.accountName)}`;
        return qrUrl;
    }

    /**
     * Tạo thông tin thanh toán chuyển khoản
     */
    async createPaymentUrl(order, selectedBank) {
        const bankCode = selectedBank || 'VCB';
        const bank = this.getBankByCode(bankCode);
        const transferContent = `FreshCart ${order.orderNumber}`;

        return {
            success: true,
            transactionId: `BT_${order.id}_${Date.now()}`,
            bankTransferInfo: {
                bank: bank,
                accountNumber: this.storeAccount.accountNumber,
                accountName: this.storeAccount.accountName,
                amount: order.totalAmount,
                transferContent: transferContent,
                qrCodeUrl: this.generateQRUrl(bankCode, order.totalAmount, order.orderNumber),
            },
            requestData: {
                bankCode,
                bankName: bank.name,
                amount: order.totalAmount,
                transferContent
            }
        };
    }

    async verifyCallback(callbackData) {
        // Chuyển khoản ngân hàng cần admin xác nhận thủ công
        return {
            success: true,
            message: 'Chờ xác nhận thanh toán từ admin'
        };
    }

    async processRefund(transaction, amount) {
        return {
            success: true,
            message: 'Hoàn tiền chuyển khoản sẽ được xử lý trong 1-3 ngày làm việc'
        };
    }

    async getPaymentStatus(transactionId) {
        return {
            status: 'pending',
            message: 'Đang chờ xác nhận chuyển khoản'
        };
    }
}

module.exports = BankTransferGateway;
