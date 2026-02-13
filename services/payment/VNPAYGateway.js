const PaymentGateway = require('./PaymentGateway');
const crypto = require('crypto');
const querystring = require('querystring');
require('dotenv').config();

/**
 * VNPAY Payment Gateway Implementation
 * Sandbox/Demo implementation - replace with real credentials for production
 */
class VNPAYGateway extends PaymentGateway {
    constructor() {
        super();
        this.tmnCode = process.env.VNPAY_TMN_CODE || 'DEMO_TMN';
        this.secretKey = process.env.VNPAY_SECRET_KEY || 'DEMO_SECRET_KEY';
        this.vnpUrl = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
        this.returnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:3001/api/payment/vnpay/callback';
    }

    /**
     * Sort object keys alphabetically
     */
    sortObject(obj) {
        const sorted = {};
        const keys = Object.keys(obj).sort();
        keys.forEach(key => {
            sorted[key] = obj[key];
        });
        return sorted;
    }

    /**
     * Create secure hash for VNPAY
     */
    createSecureHash(params) {
        const sortedParams = this.sortObject(params);
        const signData = querystring.stringify(sortedParams, '&', '=');
        const hmac = crypto.createHmac('sha512', this.secretKey);
        return hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    }

    /**
     * Create payment URL for VNPAY
     */
    async createPaymentUrl(order, returnUrl = null) {
        const createDate = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
        const orderId = order.orderNumber || `ORDER_${Date.now()}`;
        const amount = Math.round(parseFloat(order.totalAmount) * 100); // VNPAY uses amount in VND * 100

        const params = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: this.tmnCode,
            vnp_Locale: 'vn',
            vnp_CurrCode: 'VND',
            vnp_TxnRef: orderId,
            vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
            vnp_OrderType: 'other',
            vnp_Amount: amount,
            vnp_ReturnUrl: returnUrl || this.returnUrl,
            vnp_IpAddr: '127.0.0.1',
            vnp_CreateDate: createDate
        };

        // In demo mode, return local demo payment URL
        if (this.tmnCode === 'DEMO_TMN') {
            return {
                success: true,
                paymentUrl: `http://localhost:${process.env.PORT || 3001}/api/payment/vnpay/demo?orderId=${orderId}&amount=${amount}`,
                transactionId: orderId,
                gateway: 'vnpay',
                requestData: params,
                message: 'Demo mode - Using mock payment URL'
            };
        }

        const secureHash = this.createSecureHash(params);
        params.vnp_SecureHash = secureHash;

        const paymentUrl = `${this.vnpUrl}?${querystring.stringify(params)}`;

        return {
            success: true,
            paymentUrl,
            transactionId: orderId,
            gateway: 'vnpay',
            requestData: params
        };
    }

    /**
     * Verify callback from VNPAY
     */
    async verifyCallback(callbackData) {
        const vnpSecureHash = callbackData.vnp_SecureHash;

        // Remove hash from params to verify
        const params = { ...callbackData };
        delete params.vnp_SecureHash;
        delete params.vnp_SecureHashType;

        const checkHash = this.createSecureHash(params);

        if (vnpSecureHash !== checkHash) {
            return {
                success: false,
                message: 'Invalid signature',
                responseCode: '97'
            };
        }

        const responseCode = callbackData.vnp_ResponseCode;
        const transactionStatus = callbackData.vnp_TransactionStatus;

        if (responseCode === '00' && transactionStatus === '00') {
            return {
                success: true,
                message: 'Payment successful',
                transactionId: callbackData.vnp_TxnRef,
                vnpTransactionId: callbackData.vnp_TransactionNo,
                amount: parseInt(callbackData.vnp_Amount) / 100,
                responseCode,
                responseData: callbackData
            };
        }

        return {
            success: false,
            message: this.getResponseMessage(responseCode),
            transactionId: callbackData.vnp_TxnRef,
            responseCode,
            responseData: callbackData
        };
    }

    /**
     * Get response message based on code
     */
    getResponseMessage(code) {
        const messages = {
            '00': 'Giao dịch thành công',
            '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ',
            '09': 'Giao dịch không thành công: Thẻ/Tài khoản chưa đăng ký dịch vụ',
            '10': 'Giao dịch không thành công: Nhập sai mật khẩu quá 3 lần',
            '11': 'Giao dịch không thành công: Đã hết hạn chờ thanh toán',
            '12': 'Giao dịch không thành công: Thẻ/Tài khoản bị khóa',
            '13': 'Giao dịch không thành công: Nhập sai mật khẩu OTP',
            '24': 'Giao dịch không thành công: Khách hàng hủy giao dịch',
            '51': 'Giao dịch không thành công: Tài khoản không đủ số dư',
            '65': 'Giao dịch không thành công: Tài khoản vượt quá hạn mức giao dịch',
            '75': 'Ngân hàng thanh toán đang bảo trì',
            '79': 'Giao dịch không thành công: Nhập sai mật khẩu thanh toán quá số lần',
            '99': 'Các lỗi khác'
        };
        return messages[code] || 'Lỗi không xác định';
    }

    /**
     * Process refund (mock implementation)
     */
    async processRefund(transaction, amount) {
        // In production, implement actual VNPAY refund API
        console.log(`[VNPAY] Processing refund for transaction ${transaction.transactionId}, amount: ${amount}`);
        return {
            success: true,
            message: 'Refund processed (mock)',
            refundId: `REFUND_${Date.now()}`,
            amount
        };
    }

    /**
     * Get payment status (mock implementation)
     */
    async getPaymentStatus(transactionId) {
        // In production, implement actual VNPAY query API
        return {
            success: true,
            transactionId,
            status: 'completed',
            message: 'Payment status retrieved (mock)'
        };
    }
}

module.exports = VNPAYGateway;
