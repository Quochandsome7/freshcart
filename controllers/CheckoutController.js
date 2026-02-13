const { Order, OrderItem, Product, PaymentTransaction, Shipping } = require('../models');
const { cartHelpers } = require('../middleware/cart');
const ShippingFactory = require('../services/shipping/ShippingFactory');
const PaymentFactory = require('../services/payment/PaymentFactory');

/**
 * Checkout Controller
 * Handles the 3-step checkout process
 */
const CheckoutController = {
    /**
     * Step 1: Show checkout page with shipping info form
     */
    async showCheckout(req, res) {
        try {
            const cart = req.session.cart;

            if (!cart || cart.items.length === 0) {
                req.session.message = { type: 'error', text: 'Giỏ hàng trống' };
                return res.redirect('/cart');
            }

            // Pre-fill with user info if logged in
            const shippingInfo = req.session.checkoutData?.shippingInfo || {};
            if (req.session.user && !shippingInfo.customerName) {
                shippingInfo.customerName = req.session.user.fullName;
                shippingInfo.customerEmail = req.session.user.email;
                shippingInfo.customerPhone = req.session.user.phone;
                shippingInfo.shippingAddress = req.session.user.address;
            }

            res.render('checkout/shipping', {
                title: 'Thông tin giao hàng',
                cart,
                shippingInfo,
                step: 1
            });
        } catch (error) {
            console.error('CheckoutController.showCheckout error:', error);
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * Step 1: Save shipping info and proceed to step 2
     */
    async saveShippingInfo(req, res) {
        try {
            const { customerName, customerEmail, customerPhone, shippingAddress, shippingProvince, shippingDistrict, shippingWard, notes } = req.body;

            // Validate required fields
            if (!customerName || !customerEmail || !customerPhone || !shippingAddress) {
                req.session.message = { type: 'error', text: 'Vui lòng điền đầy đủ thông tin' };
                return res.redirect('/checkout');
            }

            // Save to session
            req.session.checkoutData = req.session.checkoutData || {};
            req.session.checkoutData.shippingInfo = {
                customerName,
                customerEmail,
                customerPhone,
                shippingAddress,
                shippingProvince: shippingProvince || 'Hà Nội',
                shippingDistrict: shippingDistrict || 'Quận Ba Đình',
                shippingWard: shippingWard || '',
                notes
            };

            req.session.save(() => {
                res.redirect('/checkout/delivery');
            });
        } catch (error) {
            console.error('CheckoutController.saveShippingInfo error:', error);
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * Step 2: Show delivery options
     */
    async showDelivery(req, res) {
        try {
            const cart = req.session.cart;
            const checkoutData = req.session.checkoutData;

            if (!checkoutData?.shippingInfo) {
                return res.redirect('/checkout');
            }

            // Calculate shipping fees from all carriers
            const shippingParams = {
                pickProvince: 'Hà Nội',
                pickDistrict: 'Quận Ba Đình',
                province: checkoutData.shippingInfo.shippingProvince,
                district: checkoutData.shippingInfo.shippingDistrict,
                weight: cart.totalWeight || 500,
                value: cart.subtotal
            };

            const shippingOptions = await ShippingFactory.calculateAllFees(shippingParams);

            res.render('checkout/delivery', {
                title: 'Chọn vận chuyển',
                cart,
                shippingInfo: checkoutData.shippingInfo,
                shippingOptions,
                selectedCarrier: checkoutData.selectedCarrier,
                step: 2
            });
        } catch (error) {
            console.error('CheckoutController.showDelivery error:', error);
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * Step 2: Save delivery selection and proceed to step 3
     */
    async selectShipping(req, res) {
        try {
            const { carrier, shippingFee } = req.body;

            if (!carrier || !shippingFee) {
                req.session.message = { type: 'error', text: 'Vui lòng chọn phương thức vận chuyển' };
                return res.redirect('/checkout/delivery');
            }

            req.session.checkoutData.selectedCarrier = carrier;
            req.session.checkoutData.shippingFee = parseFloat(shippingFee);

            req.session.save(() => {
                res.redirect('/checkout/payment');
            });
        } catch (error) {
            console.error('CheckoutController.selectShipping error:', error);
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * Step 3: Show payment options
     */
    async showPayment(req, res) {
        try {
            const cart = req.session.cart;
            const checkoutData = req.session.checkoutData;

            if (!checkoutData?.selectedCarrier) {
                return res.redirect('/checkout/delivery');
            }

            const totalAmount = cart.subtotal + checkoutData.shippingFee;

            res.render('checkout/payment', {
                title: 'Thanh toán',
                cart,
                shippingInfo: checkoutData.shippingInfo,
                shippingFee: checkoutData.shippingFee,
                selectedCarrier: checkoutData.selectedCarrier,
                totalAmount,
                step: 3
            });
        } catch (error) {
            console.error('CheckoutController.showPayment error:', error);
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * Step 3: Place order
     */
    async placeOrder(req, res) {
        try {
            const { paymentMethod } = req.body;
            const cart = req.session.cart;
            const checkoutData = req.session.checkoutData;

            if (!paymentMethod) {
                req.session.message = { type: 'error', text: 'Vui lòng chọn phương thức thanh toán' };
                return res.redirect('/checkout/payment');
            }

            // Validate cart and stock
            for (const item of cart.items) {
                const product = await Product.findByPk(item.productId);
                if (!product || !product.checkAvailability(item.quantity)) {
                    req.session.message = { type: 'error', text: `Sản phẩm "${item.name}" không đủ số lượng` };
                    return res.redirect('/cart');
                }
            }

            const totalAmount = cart.subtotal + checkoutData.shippingFee;

            // Create order
            const order = await Order.create({
                userId: req.session.user?.id || null,
                customerName: checkoutData.shippingInfo.customerName,
                customerEmail: checkoutData.shippingInfo.customerEmail,
                customerPhone: checkoutData.shippingInfo.customerPhone,
                shippingAddress: checkoutData.shippingInfo.shippingAddress,
                shippingProvince: checkoutData.shippingInfo.shippingProvince,
                shippingDistrict: checkoutData.shippingInfo.shippingDistrict,
                shippingWard: checkoutData.shippingInfo.shippingWard,
                subtotal: cart.subtotal,
                shippingFee: checkoutData.shippingFee,
                totalAmount,
                paymentMethod,
                shippingCarrier: checkoutData.selectedCarrier,
                notes: checkoutData.shippingInfo.notes
            });

            // Create order items and update stock
            for (const item of cart.items) {
                await OrderItem.create({
                    orderId: order.id,
                    productId: item.productId,
                    productName: item.name,
                    productSku: item.sku,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.price * item.quantity
                });

                // Update product stock
                const product = await Product.findByPk(item.productId);
                await product.updateStock(item.quantity, 'subtract');
            }

            // Create payment transaction record
            const paymentTransaction = await PaymentTransaction.create({
                orderId: order.id,
                gateway: paymentMethod,
                amount: totalAmount,
                status: paymentMethod === 'cod' ? 'pending' : 'pending'
            });

            // Handle payment based on method
            if (paymentMethod === 'cod') {
                // COD - Mark as confirmed and redirect to confirmation
                await order.update({ status: 'confirmed', paymentStatus: 'pending' });

                // Clear cart and checkout data
                cartHelpers.clearCart(cart);
                delete req.session.checkoutData;
                req.session.save();

                return res.redirect(`/checkout/confirm/${order.id}`);
            } else if (paymentMethod === 'bank_transfer') {
                // Bank Transfer - Generate QR code and bank info
                const { selectedBank } = req.body;
                const gateway = PaymentFactory.getGateway('bank_transfer');
                const paymentResult = await gateway.createPaymentUrl(order, selectedBank);

                await order.update({ status: 'confirmed', paymentStatus: 'pending' });
                await paymentTransaction.update({
                    transactionId: paymentResult.transactionId,
                    requestData: paymentResult.requestData
                });

                // Store bank transfer info in session for confirmation page
                req.session.bankTransferInfo = paymentResult.bankTransferInfo;

                // Clear cart and checkout data
                cartHelpers.clearCart(cart);
                delete req.session.checkoutData;
                req.session.save();

                return res.redirect(`/checkout/confirm/${order.id}`);
            } else {
                // Online payment - redirect to payment gateway
                req.session.pendingOrderId = order.id;
                req.session.save();

                const gateway = PaymentFactory.getGateway(paymentMethod);
                const paymentResult = await gateway.createPaymentUrl(order);

                if (paymentResult.success) {
                    // Update transaction with request data
                    await paymentTransaction.update({
                        transactionId: paymentResult.transactionId,
                        requestData: paymentResult.requestData
                    });

                    return res.redirect(paymentResult.paymentUrl);
                } else {
                    req.session.message = { type: 'error', text: 'Không thể tạo thanh toán. Vui lòng thử lại.' };
                    return res.redirect('/checkout/payment');
                }
            }
        } catch (error) {
            console.error('CheckoutController.placeOrder error:', error);
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    },

    /**
     * Order confirmation page
     */
    async confirm(req, res) {
        try {
            const orderId = req.params.orderId;
            const order = await Order.findByPk(orderId, {
                include: [
                    { model: OrderItem, as: 'items' },
                    { model: PaymentTransaction, as: 'payment' }
                ]
            });

            if (!order) {
                return res.status(404).render('errors/404', {
                    title: 'Không tìm thấy',
                    message: 'Đơn hàng không tồn tại'
                });
            }

            // Check if user can view this order
            if (req.session.user && order.userId !== req.session.user.id && req.session.user.role !== 'admin') {
                return res.status(403).render('errors/403', {
                    title: 'Không có quyền',
                    message: 'Bạn không có quyền xem đơn hàng này'
                });
            }

            res.render('checkout/confirm', {
                title: 'Đặt hàng thành công',
                order,
                bankTransferInfo: req.session.bankTransferInfo || null
            });

            // Clear bank transfer info from session after rendering
            if (req.session.bankTransferInfo) {
                delete req.session.bankTransferInfo;
                req.session.save();
            }
        } catch (error) {
            console.error('CheckoutController.confirm error:', error);
            res.status(500).render('errors/500', {
                title: 'Lỗi',
                message: error.message
            });
        }
    }
};

module.exports = CheckoutController;
