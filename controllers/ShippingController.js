const { Order, Shipping } = require('../models');
const ShippingFactory = require('../services/shipping/ShippingFactory');

/**
 * Shipping Controller
 * Handles shipping fee calculation, order creation, and webhooks
 */
const ShippingController = {
    /**
     * Calculate shipping fee
     */
    async calculateFee(req, res) {
        try {
            const { province, district, weight = 500, carrier } = req.body;

            const params = {
                pickProvince: 'Hà Nội',
                pickDistrict: 'Quận Ba Đình',
                province: province || 'Hà Nội',
                district: district || 'Quận Ba Đình',
                senderProvince: 'Hà Nội',
                senderDistrict: 'Quận Ba Đình',
                receiverProvince: province || 'Hà Nội',
                receiverDistrict: district || 'Quận Ba Đình',
                weight: parseInt(weight)
            };

            if (carrier) {
                // Calculate for specific carrier
                const service = ShippingFactory.getService(carrier);
                const result = await service.calculateFee(params);
                return res.json(result);
            }

            // Calculate for all carriers
            const results = await ShippingFactory.calculateAllFees(params);
            res.json({
                success: true,
                options: results
            });
        } catch (error) {
            console.error('ShippingController.calculateFee error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * Create shipping order
     */
    async createShippingOrder(req, res) {
        try {
            const { orderId, carrier } = req.body;

            const order = await Order.findByPk(orderId, {
                include: ['items']
            });

            if (!order) {
                return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
            }

            const shippingCarrier = carrier || order.shippingCarrier || 'ghtk';
            const service = ShippingFactory.getService(shippingCarrier);

            const result = await service.createOrder({ order });

            if (result.success) {
                // Create or update shipping record
                let shipping = await Shipping.findOne({ where: { orderId: order.id } });

                if (shipping) {
                    await shipping.update({
                        carrier: shippingCarrier,
                        trackingNumber: result.trackingNumber,
                        labelCode: result.labelCode,
                        fee: result.fee,
                        estimatedDelivery: result.estimatedDelivery,
                        deliveryAddress: order.shippingAddress,
                        responseData: result.responseData
                    });
                } else {
                    shipping = await Shipping.create({
                        orderId: order.id,
                        carrier: shippingCarrier,
                        trackingNumber: result.trackingNumber,
                        labelCode: result.labelCode,
                        fee: result.fee || order.shippingFee,
                        estimatedDelivery: result.estimatedDelivery,
                        deliveryAddress: order.shippingAddress,
                        status: 'pending',
                        responseData: result.responseData
                    });
                }

                // Update order status
                await order.update({
                    status: 'processing',
                    shippingCarrier: shippingCarrier
                });

                return res.json({
                    success: true,
                    shipping: {
                        id: shipping.id,
                        trackingNumber: shipping.trackingNumber,
                        carrier: shipping.carrier,
                        estimatedDelivery: shipping.estimatedDelivery
                    }
                });
            }

            res.status(400).json({
                success: false,
                message: result.message || 'Không thể tạo vận đơn'
            });
        } catch (error) {
            console.error('ShippingController.createShippingOrder error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * Track shipment
     */
    async trackShipment(req, res) {
        try {
            const { tracking } = req.params;

            // Find shipping record
            const shipping = await Shipping.findOne({
                where: { trackingNumber: tracking },
                include: [{ model: Order, as: 'order' }]
            });

            if (!shipping) {
                return res.status(404).json({ error: 'Không tìm thấy vận đơn' });
            }

            const service = ShippingFactory.getService(shipping.carrier);
            const result = await service.trackShipment(tracking);

            // Update local status if changed
            if (result.success && result.status !== shipping.status) {
                await shipping.update({ status: result.status });
            }

            res.json({
                success: true,
                tracking: {
                    trackingNumber: shipping.trackingNumber,
                    carrier: shipping.carrier,
                    status: result.status || shipping.status,
                    statusText: result.statusText,
                    history: result.history,
                    estimatedDelivery: shipping.estimatedDelivery
                }
            });
        } catch (error) {
            console.error('ShippingController.trackShipment error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GHTK Webhook
     */
    async ghtkWebhook(req, res) {
        try {
            const webhookData = req.body;
            console.log('[GHTK] Webhook received:', webhookData);

            const trackingNumber = webhookData.label_id;
            const status = webhookData.status_id;

            const shipping = await Shipping.findOne({
                where: { trackingNumber },
                include: [{ model: Order, as: 'order' }]
            });

            if (!shipping) {
                console.error('[GHTK] Shipping not found:', trackingNumber);
                return res.json({ success: false, message: 'Shipping not found' });
            }

            // Map GHTK status to local status
            const statusMap = {
                '-1': 'cancelled',
                '1': 'pending',
                '2': 'pending',
                '3': 'picked_up',
                '4': 'in_transit',
                '5': 'delivered',
                '6': 'returned',
                '8': 'returned'
            };

            const newStatus = statusMap[String(status)] || shipping.status;
            await shipping.update({ status: newStatus });

            // Update order status if delivered
            if (newStatus === 'delivered' && shipping.order) {
                await shipping.order.update({ status: 'delivered' });
            }

            res.json({ success: true });
        } catch (error) {
            console.error('ShippingController.ghtkWebhook error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * Viettel Post Webhook
     */
    async viettelPostWebhook(req, res) {
        try {
            const webhookData = req.body;
            console.log('[ViettelPost] Webhook received:', webhookData);

            const trackingNumber = webhookData.ORDER_NUMBER;
            const status = webhookData.ORDER_STATUS;

            const shipping = await Shipping.findOne({
                where: { trackingNumber },
                include: [{ model: Order, as: 'order' }]
            });

            if (!shipping) {
                console.error('[ViettelPost] Shipping not found:', trackingNumber);
                return res.json({ status: false, message: 'Shipping not found' });
            }

            // Map ViettelPost status
            const statusMap = {
                '100': 'pending',
                '101': 'pending',
                '102': 'picked_up',
                '103': 'picked_up',
                '104': 'in_transit',
                '105': 'in_transit',
                '200': 'delivered',
                '201': 'returned',
                '202': 'returned',
                '500': 'cancelled'
            };

            const newStatus = statusMap[String(status)] || shipping.status;
            await shipping.update({ status: newStatus });

            // Update order if delivered
            if (newStatus === 'delivered' && shipping.order) {
                await shipping.order.update({ status: 'delivered' });
            }

            res.json({ status: true });
        } catch (error) {
            console.error('ShippingController.viettelPostWebhook error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * Get shipping label URL
     */
    async getLabel(req, res) {
        try {
            const { tracking } = req.params;

            const shipping = await Shipping.findOne({
                where: { trackingNumber: tracking }
            });

            if (!shipping) {
                return res.status(404).json({ error: 'Không tìm thấy vận đơn' });
            }

            const service = ShippingFactory.getService(shipping.carrier);
            const result = await service.getLabel(tracking);

            res.json(result);
        } catch (error) {
            console.error('ShippingController.getLabel error:', error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = ShippingController;
