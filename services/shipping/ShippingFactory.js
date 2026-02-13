const GHTKService = require('./GHTKService');
const ViettelPostService = require('./ViettelPostService');

/**
 * Shipping Factory - Factory Pattern
 * Returns appropriate shipping service based on carrier
 */
class ShippingFactory {
    static services = {
        ghtk: GHTKService,
        viettelpost: ViettelPostService
    };

    /**
     * Get shipping service instance
     * @param {string} carrier - Carrier type (ghtk, viettelpost)
     * @returns {ShippingService} - Shipping service instance
     */
    static getService(carrier) {
        const ServiceClass = this.services[carrier.toLowerCase()];

        if (!ServiceClass) {
            throw new Error(`Unknown shipping carrier: ${carrier}. Supported: ${Object.keys(this.services).join(', ')}`);
        }

        return new ServiceClass();
    }

    /**
     * Register a new shipping service
     * @param {string} carrier - Carrier identifier
     * @param {class} serviceClass - Service class
     */
    static registerService(carrier, serviceClass) {
        this.services[carrier.toLowerCase()] = serviceClass;
    }

    /**
     * Get list of available carriers
     * @returns {string[]} - List of carrier types
     */
    static getAvailableCarriers() {
        return Object.keys(this.services);
    }

    /**
     * Calculate fee from all carriers
     * @param {Object} params - Shipping parameters
     * @returns {Promise<Object[]>} - Array of fee results from all carriers
     */
    static async calculateAllFees(params) {
        const results = [];

        for (const carrier of Object.keys(this.services)) {
            try {
                const service = this.getService(carrier);
                const result = await service.calculateFee(params);
                results.push({
                    carrier,
                    ...result
                });
            } catch (error) {
                results.push({
                    carrier,
                    success: false,
                    message: error.message
                });
            }
        }

        return results;
    }
}

module.exports = ShippingFactory;
