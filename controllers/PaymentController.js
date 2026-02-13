const { Order, PaymentTransaction } = require('../models');
const PaymentFactory = require('../services/payment/PaymentFactory');
const { cartHelpers } = require('../middleware/cart');

/**
 * Payment Controller
 * Handles payment processing and callbacks
 */
const PaymentController = {
    /**
     * Create payment request
     */
    async createPayment(req, res) {
        try {
            const { orderId, gateway } = req.body;

            const order = await Order.findByPk(orderId);
            if (!order) {
                return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
            }

            const paymentGateway = PaymentFactory.getGateway(gateway);
            const result = await paymentGateway.createPaymentUrl(order);

            if (result.success) {
                // Update or create payment transaction
                let transaction = await PaymentTransaction.findOne({
                    where: { orderId: order.id }
                });

                if (transaction) {
                    await transaction.update({
                        gateway,
                        transactionId: result.transactionId,
                        requestData: result.requestData
                    });
                } else {
                    transaction = await PaymentTransaction.create({
                        orderId: order.id,
                        gateway,
                        amount: order.totalAmount,
                        transactionId: result.transactionId,
                        requestData: result.requestData
                    });
                }

                return res.json({
                    success: true,
                    paymentUrl: result.paymentUrl,
                    transactionId: result.transactionId
                });
            }

            res.status(400).json({
                success: false,
                message: result.message || 'Không thể tạo thanh toán'
            });
        } catch (error) {
            console.error('PaymentController.createPayment error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * Handle VNPAY callback/IPN
     */
    async handleVNPAYCallback(req, res) {
        try {
            const callbackData = req.query;
            console.log('[VNPAY] Callback received:', callbackData);

            const gateway = PaymentFactory.getGateway('vnpay');

            // In demo mode, skip signature verification
            let result;
            if (callbackData.vnp_SecureHash === 'DEMO') {
                const responseCode = callbackData.vnp_ResponseCode;
                result = {
                    success: responseCode === '00',
                    message: responseCode === '00' ? 'Payment successful' : 'Payment cancelled',
                    transactionId: callbackData.vnp_TxnRef,
                    vnpTransactionId: callbackData.vnp_TransactionNo,
                    amount: parseInt(callbackData.vnp_Amount) / 100,
                    responseCode,
                    responseData: callbackData
                };
            } else {
                result = await gateway.verifyCallback(callbackData);
            }

            // Find the order and transaction
            const orderNumber = callbackData.vnp_TxnRef;
            const order = await Order.findOne({ where: { orderNumber } });

            if (!order) {
                console.error('[VNPAY] Order not found:', orderNumber);
                // Return for IPN
                if (req.path.includes('ipn')) {
                    return res.json({ RspCode: '01', Message: 'Order not found' });
                }
                return res.redirect('/checkout?error=order_not_found');
            }

            const transaction = await PaymentTransaction.findOne({
                where: { orderId: order.id }
            });

            if (result.success) {
                // Update transaction
                if (transaction) {
                    await transaction.update({
                        status: 'success',
                        responseData: result.responseData,
                        paidAt: new Date()
                    });
                }

                // Update order
                await order.update({
                    status: 'confirmed',
                    paymentStatus: 'paid'
                });

                // Clear cart
                if (req.session.cart) {
                    cartHelpers.clearCart(req.session.cart);
                    delete req.session.checkoutData;
                    req.session.save();
                }

                // Return for IPN
                if (req.path.includes('ipn')) {
                    return res.json({ RspCode: '00', Message: 'Success' });
                }

                return res.redirect(`/checkout/confirm/${order.id}`);
            } else {
                // Payment failed
                if (transaction) {
                    await transaction.update({
                        status: 'failed',
                        responseData: result.responseData
                    });
                }

                await order.update({
                    paymentStatus: 'failed'
                });

                // Return for IPN
                if (req.path.includes('ipn')) {
                    return res.json({ RspCode: '00', Message: 'Confirmed' });
                }

                return res.redirect(`/checkout/payment?error=${encodeURIComponent(result.message)}`);
            }
        } catch (error) {
            console.error('PaymentController.handleVNPAYCallback error:', error);
            if (req.path.includes('ipn')) {
                return res.json({ RspCode: '99', Message: 'Unknown error' });
            }
            res.redirect('/checkout/payment?error=payment_error');
        }
    },

    /**
     * Handle MoMo callback/IPN
     */
    async handleMoMoCallback(req, res) {
        try {
            const callbackData = req.body || req.query;
            console.log('[MoMo] Callback received:', callbackData);

            const gateway = PaymentFactory.getGateway('momo');
            const result = await gateway.verifyCallback(callbackData);

            // Find order
            const orderNumber = callbackData.orderId;
            const order = await Order.findOne({ where: { orderNumber } });

            if (!order) {
                console.error('[MoMo] Order not found:', orderNumber);
                return res.json({ status: 1, message: 'Order not found' });
            }

            const transaction = await PaymentTransaction.findOne({
                where: { orderId: order.id }
            });

            if (result.success) {
                // Update transaction
                if (transaction) {
                    await transaction.update({
                        status: 'success',
                        transactionId: result.momoTransactionId || transaction.transactionId,
                        responseData: result.responseData,
                        paidAt: new Date()
                    });
                }

                // Update order
                await order.update({
                    status: 'confirmed',
                    paymentStatus: 'paid'
                });

                // Clear cart
                if (req.session && req.session.cart) {
                    cartHelpers.clearCart(req.session.cart);
                    delete req.session.checkoutData;
                    req.session.save();
                }

                // Check if IPN or redirect
                if (req.method === 'POST') {
                    return res.json({ status: 0, message: 'Success' });
                }

                return res.redirect(`/checkout/confirm/${order.id}`);
            } else {
                if (transaction) {
                    await transaction.update({
                        status: 'failed',
                        responseData: result.responseData
                    });
                }

                await order.update({
                    paymentStatus: 'failed'
                });

                if (req.method === 'POST') {
                    return res.json({ status: 0, message: 'Confirmed' });
                }

                return res.redirect(`/checkout/payment?error=${encodeURIComponent(result.message)}`);
            }
        } catch (error) {
            console.error('PaymentController.handleMoMoCallback error:', error);
            if (req.method === 'POST') {
                return res.json({ status: 1, message: 'Error' });
            }
            res.redirect('/checkout/payment?error=payment_error');
        }
    },

    /**
     * Get payment status
     */
    async getPaymentStatus(req, res) {
        try {
            const { orderId } = req.params;

            const order = await Order.findByPk(orderId, {
                include: [{ model: PaymentTransaction, as: 'payment' }]
            });

            if (!order) {
                return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
            }

            res.json({
                success: true,
                orderId: order.id,
                orderNumber: order.orderNumber,
                paymentStatus: order.paymentStatus,
                transaction: order.payment ? {
                    gateway: order.payment.gateway,
                    status: order.payment.status,
                    paidAt: order.payment.paidAt
                } : null
            });
        } catch (error) {
            console.error('PaymentController.getPaymentStatus error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * Demo MoMo payment page (for testing)
     */
    async momoDemo(req, res) {
        const { orderId, amount } = req.query;
        res.render('payment/momo-demo', {
            title: 'Demo MoMo Payment',
            orderId,
            amount,
            layout: false
        });
    },

    /**
     * Demo VNPay payment page (for testing)
     */
    async vnpayDemo(req, res) {
        const { orderId, amount } = req.query;
        res.render('payment/vnpay-demo', {
            title: 'Demo VNPay Payment',
            orderId,
            amount,
            layout: false
        });
    }
};

module.exports = PaymentController;
