const VNPAYGateway = require('./VNPAYGateway');
const MoMoGateway = require('./MoMoGateway');
const BankTransferGateway = require('./BankTransferGateway');

/**
 * Payment Factory - Factory Pattern
 * Returns appropriate payment gateway based on type
 */
class PaymentFactory {
    static gateways = {
        vnpay: VNPAYGateway,
        momo: MoMoGateway,
        bank_transfer: BankTransferGateway
    };

    /**
     * Get payment gateway instance
     * @param {string} type - Gateway type (vnpay, momo)
     * @returns {PaymentGateway} - Payment gateway instance
     */
    static getGateway(type) {
        const GatewayClass = this.gateways[type.toLowerCase()];

        if (!GatewayClass) {
            throw new Error(`Unknown payment gateway: ${type}. Supported: ${Object.keys(this.gateways).join(', ')}`);
        }

        return new GatewayClass();
    }

    /**
     * Register a new payment gateway
     * @param {string} type - Gateway type identifier
     * @param {class} gatewayClass - Gateway class
     */
    static registerGateway(type, gatewayClass) {
        this.gateways[type.toLowerCase()] = gatewayClass;
    }

    /**
     * Get list of available gateways
     * @returns {string[]} - List of gateway types
     */
    static getAvailableGateways() {
        return Object.keys(this.gateways);
    }
}

module.exports = PaymentFactory;
