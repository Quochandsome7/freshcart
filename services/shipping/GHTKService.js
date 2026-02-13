const ShippingService = require('./ShippingService');
const axios = require('axios');
require('dotenv').config();

/**
 * GHTK (Giao Hang Tiet Kiem) Shipping Service
 * Demo/Mock implementation - replace token for production
 */
class GHTKService extends ShippingService {
    constructor() {
        super();
        this.apiToken = process.env.GHTK_TOKEN || 'DEMO_GHTK_TOKEN';
        this.baseUrl = process.env.GHTK_URL || 'https://services.giaohangtietkiem.vn';
        this.isDemo = this.apiToken === 'DEMO_GHTK_TOKEN';
    }

    /**
     * Get headers for API requests
     */
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Token': this.apiToken
        };
    }

    /**
     * Calculate shipping fee
     */
    async calculateFee(params) {
        const {
            pickProvince,
            pickDistrict,
            province,
            district,
            weight = 500,
            value = 0,
            transport = 'road' // road or fly
        } = params;

        // Demo mode - return mock fee
        if (this.isDemo) {
            const baseFee = 22000;
            const weightFee = Math.ceil(weight / 500) * 5000;
            const distanceFee = pickProvince !== province ? 15000 : 0;
            const totalFee = baseFee + weightFee + distanceFee;

            return {
                success: true,
                fee: totalFee,
                carrier: 'ghtk',
                estimatedDays: pickProvince === province ? '1-2 ngày' : '3-5 ngày',
                message: 'Demo mode - Mock fee calculation'
            };
        }

        try {
            const response = await axios.get(`${this.baseUrl}/services/shipment/fee`, {
                headers: this.getHeaders(),
                params: {
                    pick_province: pickProvince,
                    pick_district: pickDistrict,
                    province,
                    district,
                    weight,
                    value,
                    transport
                }
            });

            if (response.data.success) {
                return {
                    success: true,
                    fee: response.data.fee.fee,
                    insuranceFee: response.data.fee.insurance_fee,
                    carrier: 'ghtk',
                    estimatedDays: response.data.fee.delivery
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to calculate fee'
            };
        } catch (error) {
            console.error('[GHTK] Error calculating fee:', error.message);
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
            pickName = 'FreshCart Store',
            pickAddress = '123 Đường ABC',
            pickProvince = 'Hà Nội',
            pickDistrict = 'Quận Ba Đình',
            pickTel = '0123456789'
        } = orderData;

        // Demo mode - return mock tracking
        if (this.isDemo) {
            const trackingNumber = `GHTK${Date.now()}`;
            return {
                success: true,
                trackingNumber,
                labelCode: `LBL${trackingNumber}`,
                carrier: 'ghtk',
                estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                fee: 27000,
                message: 'Demo mode - Mock order created'
            };
        }

        try {
            const requestData = {
                products: order.items?.map(item => ({
                    name: item.productName,
                    weight: 0.5,
                    quantity: item.quantity,
                    product_code: item.productSku
                })) || [],
                order: {
                    id: order.orderNumber,
                    pick_name: pickName,
                    pick_address: pickAddress,
                    pick_province: pickProvince,
                    pick_district: pickDistrict,
                    pick_tel: pickTel,
                    tel: order.customerPhone,
                    name: order.customerName,
                    address: order.shippingAddress,
                    province: order.shippingProvince,
                    district: order.shippingDistrict,
                    ward: order.shippingWard,
                    hamlet: 'Khác',
                    is_freeship: 0,
                    pick_money: order.paymentMethod === 'cod' ? parseInt(order.totalAmount) : 0,
                    note: order.notes || '',
                    value: parseInt(order.totalAmount)
                }
            };

            const response = await axios.post(`${this.baseUrl}/services/shipment/order`, requestData, {
                headers: this.getHeaders()
            });

            if (response.data.success) {
                return {
                    success: true,
                    trackingNumber: response.data.order.label,
                    labelCode: response.data.order.label,
                    carrier: 'ghtk',
                    estimatedDelivery: response.data.order.estimated_deliver_time,
                    fee: response.data.order.fee,
                    responseData: response.data
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to create order'
            };
        } catch (error) {
            console.error('[GHTK] Error creating order:', error.message);
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
                carrier: 'ghtk',
                status: 'in_transit',
                statusText: 'Đang vận chuyển',
                history: [
                    { time: new Date(Date.now() - 2 * 60 * 60 * 1000), status: 'Đã lấy hàng' },
                    { time: new Date(Date.now() - 1 * 60 * 60 * 1000), status: 'Đang vận chuyển đến kho trung chuyển' },
                    { time: new Date(), status: 'Đang vận chuyển' }
                ],
                message: 'Demo mode - Mock tracking'
            };
        }

        try {
            const response = await axios.get(`${this.baseUrl}/services/shipment/v2/${trackingNumber}`, {
                headers: this.getHeaders()
            });

            if (response.data.success) {
                return {
                    success: true,
                    trackingNumber,
                    carrier: 'ghtk',
                    status: response.data.order.status,
                    statusText: this.getStatusText(response.data.order.status),
                    history: response.data.order.logs || [],
                    responseData: response.data
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to track shipment'
            };
        } catch (error) {
            console.error('[GHTK] Error tracking:', error.message);
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
            const response = await axios.post(`${this.baseUrl}/services/shipment/cancel/${trackingNumber}`, {}, {
                headers: this.getHeaders()
            });

            return {
                success: response.data.success,
                message: response.data.message
            };
        } catch (error) {
            console.error('[GHTK] Error cancelling:', error.message);
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
            labelUrl: `${this.baseUrl}/services/label/${trackingNumber}`
        };
    }

    /**
     * Get status text from status code
     */
    getStatusText(status) {
        const statusMap = {
            '-1': 'Hủy đơn hàng',
            '1': 'Chưa tiếp nhận',
            '2': 'Đã tiếp nhận',
            '3': 'Đã lấy hàng',
            '4': 'Đã điều phối giao hàng',
            '5': 'Đã giao hàng',
            '6': 'Không giao được',
            '7': 'Đã đối soát',
            '8': 'Đã trả hàng',
            '9': 'Đã đối soát trả hàng'
        };
        return statusMap[status] || 'Không xác định';
    }
}

module.exports = GHTKService;
