/**
 * Abstract Shipping Service class
 * Factory Pattern for shipping providers
 */
class ShippingService {
    constructor() {
        if (this.constructor === ShippingService) {
            throw new Error('ShippingService is an abstract class and cannot be instantiated directly');
        }
    }

    /**
     * Calculate shipping fee
     * @param {Object} params - Shipping parameters (from, to, weight, etc.)
     * @returns {Promise<Object>} - Fee calculation result
     */
    async calculateFee(params) {
        throw new Error('Method calculateFee() must be implemented');
    }

    /**
     * Create shipping order
     * @param {Object} orderData - Order and shipping data
     * @returns {Promise<Object>} - Shipping order result with tracking number
     */
    async createOrder(orderData) {
        throw new Error('Method createOrder() must be implemented');
    }

    /**
     * Track shipment status
     * @param {string} trackingNumber - Tracking number
     * @returns {Promise<Object>} - Tracking information
     */
    async trackShipment(trackingNumber) {
        throw new Error('Method trackShipment() must be implemented');
    }

    /**
     * Cancel shipping order
     * @param {string} trackingNumber - Tracking number
     * @returns {Promise<Object>} - Cancellation result
     */
    async cancelOrder(trackingNumber) {
        throw new Error('Method cancelOrder() must be implemented');
    }

    /**
     * Get shipping label/print URL
     * @param {string} trackingNumber - Tracking number
     * @returns {Promise<Object>} - Label URL
     */
    async getLabel(trackingNumber) {
        throw new Error('Method getLabel() must be implemented');
    }
}

module.exports = ShippingService;
