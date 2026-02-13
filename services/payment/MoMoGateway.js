const PaymentGateway = require('./PaymentGateway');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

/**
 * MoMo Payment Gateway Implementation
 * Sandbox/Demo implementation - replace with real credentials for production
 */
class MoMoGateway extends PaymentGateway {
    constructor() {
        super();
        this.partnerCode = process.env.MOMO_PARTNER_CODE || 'DEMO_PARTNER';
        this.accessKey = process.env.MOMO_ACCESS_KEY || 'DEMO_ACCESS_KEY';
        this.secretKey = process.env.MOMO_SECRET_KEY || 'DEMO_SECRET_KEY';
        this.endpoint = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';
        this.returnUrl = process.env.MOMO_RETURN_URL || 'http://localhost:3001/api/payment/momo/return';
        this.notifyUrl = process.env.MOMO_NOTIFY_URL || 'http://localhost:3001/api/payment/momo/callback';
    }

    /**
     * Create HMAC SHA256 signature
     */
    createSignature(rawData) {
        return crypto.createHmac('sha256', this.secretKey)
            .update(rawData)
            .digest('hex');
    }

    /**
     * Create payment URL for MoMo
     */
    async createPaymentUrl(order, returnUrl = null) {
        const orderId = order.orderNumber || `ORDER_${Date.now()}`;
        const requestId = `REQ_${Date.now()}`;
        const amount = Math.round(parseFloat(order.totalAmount));
        const orderInfo = `Thanh toan don hang ${orderId}`;
        const extraData = Buffer.from(JSON.stringify({ orderId: order.id })).toString('base64');

        const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${this.notifyUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${returnUrl || this.returnUrl}&requestId=${requestId}&requestType=payWithMethod`;

        const signature = this.createSignature(rawSignature);

        const requestBody = {
            partnerCode: this.partnerCode,
            partnerName: 'FreshCart',
            storeId: 'FreshCart Store',
            requestId,
            amount,
            orderId,
            orderInfo,
            redirectUrl: returnUrl || this.returnUrl,
            ipnUrl: this.notifyUrl,
            lang: 'vi',
            requestType: 'payWithMethod',
            autoCapture: true,
            extraData,
            signature
        };

        try {
            // In demo mode, return mock payment URL
            if (this.partnerCode === 'DEMO_PARTNER') {
                return {
                    success: true,
                    paymentUrl: `http://localhost:${process.env.PORT || 3001}/api/payment/momo/demo?orderId=${orderId}&amount=${amount}`,
                    transactionId: orderId,
                    gateway: 'momo',
                    requestData: requestBody,
                    message: 'Demo mode - Using mock payment URL'
                };
            }

            const response = await axios.post(this.endpoint, requestBody, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.resultCode === 0) {
                return {
                    success: true,
                    paymentUrl: response.data.payUrl,
                    transactionId: orderId,
                    gateway: 'momo',
                    requestData: requestBody,
                    responseData: response.data
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to create MoMo payment',
                requestData: requestBody,
                responseData: response.data
            };
        } catch (error) {
            console.error('[MoMo] Error creating payment:', error.message);
            return {
                success: false,
                message: error.message,
                requestData: requestBody
            };
        }
    }

    /**
     * Verify callback/IPN from MoMo
     */
    async verifyCallback(callbackData) {
        const {
            partnerCode,
            orderId,
            requestId,
            amount,
            orderInfo,
            orderType,
            transId,
            resultCode,
            message,
            payType,
            responseTime,
            extraData,
            signature
        } = callbackData;

        // Create signature to verify
        const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

        const checkSignature = this.createSignature(rawSignature);

        // In demo mode, skip signature verification
        if (this.partnerCode !== 'DEMO_PARTNER' && signature !== checkSignature) {
            return {
                success: false,
                message: 'Invalid signature',
                resultCode: -1
            };
        }

        if (resultCode === 0 || resultCode === '0') {
            return {
                success: true,
                message: 'Payment successful',
                transactionId: orderId,
                momoTransactionId: transId,
                amount: parseInt(amount),
                resultCode,
                responseData: callbackData
            };
        }

        return {
            success: false,
            message: message || 'Payment failed',
            transactionId: orderId,
            resultCode,
            responseData: callbackData
        };
    }

    /**
     * Process refund (mock implementation)
     */
    async processRefund(transaction, amount) {
        console.log(`[MoMo] Processing refund for transaction ${transaction.transactionId}, amount: ${amount}`);

        // In production, implement actual MoMo refund API
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
        return {
            success: true,
            transactionId,
            status: 'completed',
            message: 'Payment status retrieved (mock)'
        };
    }
}

module.exports = MoMoGateway;
