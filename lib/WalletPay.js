"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletPay = void 0;
const react_native_1 = require("react-native");
const constants_1 = require("./constants");
const logger_1 = require("./logger");
const nativeModule_1 = require("./nativeModule");
const UNAVAILABLE = {
    applePay: false,
    googlePay: false,
};
class WalletPay {
    constructor() {
        this.defaultNetworks = [
            constants_1.PAYMENT_NETWORKS.VISA,
            constants_1.PAYMENT_NETWORKS.MASTERCARD,
            constants_1.PAYMENT_NETWORKS.AMEX,
        ];
    }
    get native() {
        return (0, nativeModule_1.getWalletPayNativeModule)();
    }
    /**
     * Single public availability API for Apple Pay / Google Pay.
     */
    async isAvailable() {
        logger_1.logger.debug('isAvailable()', react_native_1.Platform.OS);
        try {
            const native = this.native;
            if (!(native === null || native === void 0 ? void 0 : native.isWalletAvailable)) {
                return UNAVAILABLE;
            }
            const result = await native.isWalletAvailable();
            logger_1.logger.debug('isAvailable result', result);
            return result !== null && result !== void 0 ? result : UNAVAILABLE;
        }
        catch (error) {
            logger_1.logger.error('isAvailable failed', error);
            return UNAVAILABLE;
        }
    }
    async canMakeApplePayments() {
        try {
            if (react_native_1.Platform.OS !== 'ios') {
                return false;
            }
            const native = this.native;
            if (!native) {
                return false;
            }
            if (typeof native.canMakeApplePayments === 'function') {
                return await native.canMakeApplePayments();
            }
            if (typeof native.canMakePayments === 'function') {
                return await native.canMakePayments();
            }
            if (typeof native.isApplePayAvailable === 'function') {
                return await native.isApplePayAvailable();
            }
            return false;
        }
        catch (error) {
            logger_1.logger.error('canMakeApplePayments failed', error);
            return false;
        }
    }
    async canMakeApplePaymentsWithCards(supportedNetworks = this.defaultNetworks) {
        try {
            if (react_native_1.Platform.OS !== 'ios') {
                return false;
            }
            const native = this.native;
            if (!(native === null || native === void 0 ? void 0 : native.canMakeApplePaymentsWithCards)) {
                logger_1.logger.warn('canMakeApplePaymentsWithCards unavailable, falling back to canMakeApplePayments');
                return await this.canMakeApplePayments();
            }
            return await native.canMakeApplePaymentsWithCards(supportedNetworks);
        }
        catch (error) {
            logger_1.logger.warn('canMakeApplePaymentsWithCards error', error instanceof Error ? error.message : error);
            return false;
        }
    }
    async getApplePayDiagnostics(supportedNetworks = this.defaultNetworks) {
        try {
            if (react_native_1.Platform.OS !== 'ios') {
                return {
                    platform: 'android',
                    canMakePayments: false,
                    hasCardsForNetworks: false,
                    available: false,
                    message: 'Apple Pay apenas disponível no iOS',
                };
            }
            const native = this.native;
            if (!native) {
                return {
                    platform: 'ios',
                    canMakePayments: false,
                    hasCardsForNetworks: false,
                    available: false,
                    message: 'Módulo WalletPayModule não encontrado',
                };
            }
            if (native.getApplePayDiagnostics) {
                return await native.getApplePayDiagnostics(supportedNetworks);
            }
            const canMakePayments = native.isApplePayAvailable
                ? await native.isApplePayAvailable()
                : await this.canMakeApplePayments();
            let hasCardsForNetworks = false;
            try {
                hasCardsForNetworks = native.canMakeApplePaymentsWithCards
                    ? await native.canMakeApplePaymentsWithCards(supportedNetworks)
                    : canMakePayments;
            }
            catch {
                hasCardsForNetworks = canMakePayments;
            }
            let message = 'Apple Pay disponível e configurado';
            if (!canMakePayments) {
                message =
                    'Apple Pay não disponível (dispositivo não suporta ou sem cartões na Wallet)';
            }
            else if (hasCardsForNetworks === false) {
                message = `Apple Pay disponível, mas sem cartões para as redes: ${supportedNetworks.join(', ')}. Tente com redes diferentes.`;
            }
            return {
                platform: 'ios',
                canMakePayments,
                hasCardsForNetworks,
                available: canMakePayments,
                supportedNetworks,
                message,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                platform: 'ios',
                canMakePayments: false,
                hasCardsForNetworks: false,
                available: false,
                error: message,
                message: 'Erro ao verificar Apple Pay: ' + message,
            };
        }
    }
    async requestApplePayment(config) {
        if (react_native_1.Platform.OS !== 'ios') {
            throw new Error('Apple Pay is only available on iOS');
        }
        const native = this.native;
        if (!(native === null || native === void 0 ? void 0 : native.requestApplePayment)) {
            throw new Error('Apple Pay module not available');
        }
        if (!config.amount || !config.currencyCode || !config.countryCode) {
            throw new Error('Missing required parameters: amount, currencyCode, countryCode');
        }
        const paymentRequest = {
            supportedNetworks: config.supportedNetworks || this.defaultNetworks,
            countryCode: config.countryCode,
            currencyCode: config.currencyCode,
            label: config.label || 'Payment',
            amount: config.amount.toString(),
        };
        logger_1.logger.debug('requestApplePayment', paymentRequest);
        const result = await native.requestApplePayment(paymentRequest);
        logger_1.logger.debug('requestApplePayment result', result);
        return result;
    }
    async completeApplePayment(success = true) {
        var _a;
        try {
            if (react_native_1.Platform.OS === 'ios' && ((_a = this.native) === null || _a === void 0 ? void 0 : _a.completeApplePayment)) {
                await this.native.completeApplePayment(success);
            }
        }
        catch (error) {
            logger_1.logger.warn('Error completing Apple Pay payment', error);
        }
    }
    async requestGooglePayment(config) {
        var _a, _b;
        if (react_native_1.Platform.OS !== 'android') {
            throw new Error('Google Pay is only available on Android');
        }
        const native = this.native;
        const requestFn = (_a = native === null || native === void 0 ? void 0 : native.requestGooglePayment) !== null && _a !== void 0 ? _a : native === null || native === void 0 ? void 0 : native.processGooglePayPayment;
        if (!native || !requestFn) {
            throw new Error('Google Pay module not available');
        }
        if (!config.amount ||
            !config.currencyCode ||
            !config.countryCode ||
            !config.tokenizationSpecification) {
            throw new Error('Missing required parameters: amount, currencyCode, countryCode, tokenizationSpecification');
        }
        const paymentRequest = {
            amount: config.amount.toString(),
            currencyCode: config.currencyCode,
            countryCode: config.countryCode,
            label: config.label || 'Payment',
            environment: config.environment || 'TEST',
            tokenizationSpecification: config.tokenizationSpecification,
            merchantInfo: config.merchantInfo || {
                merchantName: config.label || 'Merchant',
            },
            allowedCardNetworks: config.allowedCardNetworks || [
                'VISA',
                'MASTERCARD',
                'AMEX',
            ],
            allowedCardAuthMethods: config.allowedCardAuthMethods || [
                'PAN_ONLY',
                'CRYPTOGRAM_3DS',
            ],
            existingPaymentMethodRequired: (_b = config.existingPaymentMethodRequired) !== null && _b !== void 0 ? _b : false,
            paymentDataRequestOverrides: config.paymentDataRequestOverrides,
        };
        logger_1.logger.debug('requestGooglePayment', {
            ...paymentRequest,
            tokenizationSpecification: {
                type: paymentRequest.tokenizationSpecification.type,
                gateway: paymentRequest.tokenizationSpecification.gateway,
            },
        });
        const result = await requestFn.call(native, paymentRequest);
        logger_1.logger.debug('requestGooglePayment result status', result === null || result === void 0 ? void 0 : result.success);
        return result;
    }
    /**
     * Generic payment flow. Optionally accepts a precomputed availability
     * to avoid an extra native round-trip.
     */
    async processPayment(config, paymentProcessor, cachedAvailability) {
        logger_1.logger.debug('processPayment start', {
            hasApplePay: !!config.applePay,
            hasGooglePay: !!config.googlePay,
        });
        try {
            const availability = cachedAvailability !== null && cachedAvailability !== void 0 ? cachedAvailability : (await this.isAvailable());
            logger_1.logger.debug('processPayment availability', availability);
            if (!availability.applePay && !availability.googlePay) {
                if (react_native_1.Platform.OS === 'ios') {
                    try {
                        await this.getApplePayDiagnostics();
                    }
                    catch {
                        // diagnostics are best-effort
                    }
                }
                throw new Error('No wallet payment methods available');
            }
            let paymentResult;
            let provider;
            let paymentConfig;
            if (react_native_1.Platform.OS === 'ios' && availability.applePay && config.applePay) {
                provider = 'applePay';
                paymentConfig = config.applePay;
                paymentResult = await this.requestApplePayment(paymentConfig);
            }
            else if (react_native_1.Platform.OS === 'android' &&
                availability.googlePay &&
                config.googlePay) {
                provider = 'googlePay';
                paymentConfig = config.googlePay;
                paymentResult = await this.requestGooglePayment(paymentConfig);
            }
            else {
                throw new Error('No compatible payment configuration found');
            }
            if (paymentResult.cancelled || paymentResult.success === false) {
                throw new Error('Payment cancelled or rejected');
            }
            let processorResult;
            if (paymentProcessor && typeof paymentProcessor === 'function') {
                if (!paymentResult.token) {
                    throw new Error('Payment token missing from wallet response');
                }
                processorResult = await paymentProcessor({
                    provider,
                    token: paymentResult.token,
                    config: paymentConfig,
                });
            }
            else {
                processorResult = {
                    success: true,
                    transactionId: paymentResult.transactionId || 'direct_payment',
                };
            }
            if (provider === 'applePay') {
                await this.completeApplePayment(processorResult.success);
            }
            return processorResult;
        }
        catch (error) {
            logger_1.logger.error('processPayment failed', error);
            try {
                if (react_native_1.Platform.OS === 'ios') {
                    await this.completeApplePayment(false);
                }
            }
            catch (completeError) {
                logger_1.logger.warn('Failed to complete Apple Pay as failure', completeError);
            }
            throw error;
        }
    }
}
exports.WalletPay = WalletPay;
const walletPay = new WalletPay();
exports.default = walletPay;
//# sourceMappingURL=WalletPay.js.map