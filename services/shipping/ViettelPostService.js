const ShippingService = require('./ShippingService');
const axios = require('axios');
require('dotenv').config();

/**
 * Viettel Post Shipping Service
 * Demo/Mock implementation - replace credentials for production
 */
class ViettelPostService extends ShippingService {
    constructor() {
        super();
        this.username = process.env.VIETTELPOST_USERNAME || 'demo_user';
        this.password = process.env.VIETTELPOST_PASSWORD || 'demo_password';
        this.baseUrl = process.env.VIETTELPOST_URL || 'https://partner.viettelpost.vn/v2';
        this.token = null;
        this.isDemo = this.username === 'demo_user';
    }

    /**
     * Login to get token
     */
    async login() {
        if (this.isDemo) {
            this.token = 'DEMO_TOKEN';
            return true;
        }

        try {
            const response = await axios.post(`${this.baseUrl}/user/Login`, {
                USERNAME: this.username,
                PASSWORD: this.password
            });

            if (response.data.status === 200) {
                this.token = response.data.data.token;
                return true;
            }
            return false;
        } catch (error) {
            console.error('[ViettelPost] Login error:', error.message);
            return false;
        }
    }

    /**
     * Get headers for API requests
     */
    async getHeaders() {
        if (!this.token) {
            await this.login();
        }
        return {
            'Content-Type': 'application/json',
            'Token': this.token
        };
    }

    /**
     * Calculate shipping fee
     */
    async calculateFee(params) {
        const {
            senderProvince,
            senderDistrict,
            receiverProvince,
            receiverDistrict,
            weight = 500,
            productType = 'HH', // HH: Hàng hóa
            orderService = 'VCN' // VCN: Nhanh, VTK: Tiết kiệm
        } = params;

        // Demo mode
        if (this.isDemo) {
            const baseFee = 25000;
            const weightFee = Math.ceil(weight / 500) * 4000;
            const distanceFee = senderProvince !== receiverProvince ? 12000 : 0;
            const totalFee = baseFee + weightFee + distanceFee;

            return {
                success: true,
                fee: totalFee,
                carrier: 'viettelpost',
                estimatedDays: senderProvince === receiverProvince ? '1-2 ngày' : '2-4 ngày',
                message: 'Demo mode - Mock fee calculation'
            };
        }

        try {
            const headers = await this.getHeaders();
            const response = await axios.post(`${this.baseUrl}/order/getPrice`, {
                SENDER_PROVINCE: senderProvince,
                SENDER_DISTRICT: senderDistrict,
                RECEIVER_PROVINCE: receiverProvince,
                RECEIVER_DISTRICT: receiverDistrict,
                PRODUCT_TYPE: productType,
                PRODUCT_WEIGHT: weight,
                ORDER_SERVICE: orderService
            }, { headers });

            if (response.data.status === 200) {
                return {
                    success: true,
                    fee: response.data.data.MONEY_TOTAL,
                    carrier: 'viettelpost',
                    estimatedDays: response.data.data.EXCHANGE_TIME,
                    details: response.data.data
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to calculate fee'
            };
        } catch (error) {
            console.error('[ViettelPost] Error calculating fee:', error.message);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Create shipping order
     */
    async createOrder(orderData) {
        const {
            order,
            senderName = 'FreshCart Store',
            senderAddress = '123 Đường ABC',
            senderProvince = 'Hà Nội',
            senderDistrict = 'Quận Ba Đình',
            senderPhone = '0123456789'
        } = orderData;

        // Demo mode
        if (this.isDemo) {
            const trackingNumber = `VTP${Date.now()}`;
            return {
                success: true,
                trackingNumber,
                orderNumber: trackingNumber,
                carrier: 'viettelpost',
                estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                fee: 29000,
                message: 'Demo mode - Mock order created'
            };
        }

        try {
            const headers = await this.getHeaders();
            const requestData = {
                ORDER_NUMBER: order.orderNumber,
                SENDER_FULLNAME: senderName,
                SENDER_ADDRESS: senderAddress,
                SENDER_PHONE: senderPhone,
                SENDER_PROVINCE: senderProvince,
                SENDER_DISTRICT: senderDistrict,
                RECEIVER_FULLNAME: order.customerName,
                RECEIVER_ADDRESS: order.shippingAddress,
                RECEIVER_PHONE: order.customerPhone,
                RECEIVER_PROVINCE: order.shippingProvince,
                RECEIVER_DISTRICT: order.shippingDistrict,
                RECEIVER_WARD: order.shippingWard,
                PRODUCT_NAME: 'Thực phẩm hữu cơ',
                PRODUCT_DESCRIPTION: order.notes || 'Đơn hàng FreshCart',
                PRODUCT_QUANTITY: order.items?.length || 1,
                PRODUCT_PRICE: parseInt(order.totalAmount),
                PRODUCT_WEIGHT: 1000,
                MONEY_COLLECTION: order.paymentMethod === 'cod' ? parseInt(order.totalAmount) : 0,
                ORDER_SERVICE: 'VCN',
                ORDER_PAYMENT: 3 // 1: Không thu tiền, 2: Thu tiền gửi, 3: Thu tiền nhận
            };

            const response = await axios.post(`${this.baseUrl}/order/createOrder`, requestData, { headers });

            if (response.data.status === 200) {
                return {
                    success: true,
                    trackingNumber: response.data.data.ORDER_NUMBER,
                    orderNumber: response.data.data.ORDER_NUMBER,
                    carrier: 'viettelpost',
                    fee: response.data.data.MONEY_TOTAL,
                    responseData: response.data
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to create order'
            };
        } catch (error) {
            console.error('[ViettelPost] Error creating order:', error.message);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Track shipment
     */
    async trackShipment(trackingNumber) {
        // Demo mode
        if (this.isDemo) {
            return {
                success: true,
                trackingNumber,
                carrier: 'viettelpost',
                status: 'in_transit',
                statusText: 'Đang giao hàng',
                history: [
                    { time: new Date(Date.now() - 3 * 60 * 60 * 1000), status: 'Nhận đơn hàng' },
                    { time: new Date(Date.now() - 2 * 60 * 60 * 1000), status: 'Đang lấy hàng' },
                    { time: new Date(Date.now() - 1 * 60 * 60 * 1000), status: 'Đã lấy hàng' },
                    { time: new Date(), status: 'Đang giao hàng' }
                ],
                message: 'Demo mode - Mock tracking'
            };
        }

        try {
            const headers = await this.getHeaders();
            const response = await axios.get(`${this.baseUrl}/order/getOrderByTrackingNumber`, {
                headers,
                params: { ORDER_NUMBER: trackingNumber }
            });

            if (response.data.status === 200) {
                const order = response.data.data;
                return {
                    success: true,
                    trackingNumber,
                    carrier: 'viettelpost',
                    status: order.ORDER_STATUS,
                    statusText: this.getStatusText(order.ORDER_STATUS),
                    history: order.HISTORY || [],
                    responseData: response.data
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to track shipment'
            };
        } catch (error) {
            console.error('[ViettelPost] Error tracking:', error.message);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Cancel order
     */
    async cancelOrder(trackingNumber) {
        if (this.isDemo) {
            return {
                success: true,
                trackingNumber,
                message: 'Demo mode - Order cancelled'
            };
        }

        try {
            const headers = await this.getHeaders();
            const response = await axios.post(`${this.baseUrl}/order/UpdateOrder`, {
                ORDER_NUMBER: trackingNumber,
                TYPE: 4 // Cancel
            }, { headers });

            return {
                success: response.data.status === 200,
                message: response.data.message
            };
        } catch (error) {
            console.error('[ViettelPost] Error cancelling:', error.message);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Get label URL
     */
    async getLabel(trackingNumber) {
        if (this.isDemo) {
            return {
                success: true,
                labelUrl: `http://localhost:3000/shipping/label/${trackingNumber}`,
                message: 'Demo mode - Mock label URL'
            };
        }

        return {
            success: true,
            labelUrl: `${this.baseUrl}/order/printing/${trackingNumber}`
        };
    }

    /**
     * Get status text
     */
    getStatusText(status) {
        const statusMap = {
            '100': 'Đơn hàng mới',
            '101': 'Đã tiếp nhận',
            '102': 'Đang lấy hàng',
            '103': 'Đã lấy hàng',
            '104': 'Đang vận chuyển',
            '105': 'Đang giao hàng',
            '200': 'Giao thành công',
            '201': 'Không giao được - Đang chuyển hoàn',
            '202': 'Đã trả hàng',
            '500': 'Hủy đơn'
        };
        return statusMap[String(status)] || 'Không xác định';
    }
}

module.exports = ViettelPostService;
