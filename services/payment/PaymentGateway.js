/**
 * Abstract Payment Gateway class
 * Strategy Pattern for payment processing
 */
class PaymentGateway {
    constructor() {
        if (this.constructor === PaymentGateway) {
            throw new Error('PaymentGateway is an abstract class and cannot be instantiated directly');
        }
    }

    /**
     * Create payment URL to redirect user
     * @param {Object} order - Order object
     * @param {string} returnUrl - URL to return after payment
     * @returns {Promise<Object>} - Payment URL and transaction data
     */
    async createPaymentUrl(order, returnUrl) {
        throw new Error('Method createPaymentUrl() must be implemented');
    }

    /**
     * Verify callback/IPN from payment gateway
     * @param {Object} callbackData - Data from payment gateway callback
     * @returns {Promise<Object>} - Verification result
     */
    async verifyCallback(callbackData) {
        throw new Error('Method verifyCallback() must be implemented');
    }

    /**
     * Process refund for a transaction
     * @param {Object} transaction - PaymentTransaction object
     * @param {number} amount - Amount to refund
     * @returns {Promise<Object>} - Refund result
     */
    async processRefund(transaction, amount) {
        throw new Error('Method processRefund() must be implemented');
    }

    /**
     * Get payment status
     * @param {string} transactionId - Transaction ID
     * @returns {Promise<Object>} - Payment status
     */
    async getPaymentStatus(transactionId) {
        throw new Error('Method getPaymentStatus() must be implemented');
    }
}

module.exports = PaymentGateway;
