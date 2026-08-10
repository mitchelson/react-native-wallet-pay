"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useQuickPay = exports.useWalletPay = void 0;
const react_1 = require("react");
const react_native_1 = require("react-native");
const nativeModule_1 = require("../nativeModule");
const logger_1 = require("../logger");
const UNAVAILABLE = {
    applePay: false,
    googlePay: false,
};
/**
 * Hook for digital wallet payments (Apple Pay / Google Pay).
 */
const useWalletPay = ({ onPaymentSuccess, onPaymentError, paymentProcessor, } = {}) => {
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [availability, setAvailability] = (0, react_1.useState)(UNAVAILABLE);
    const [isChecking, setIsChecking] = (0, react_1.useState)(false);
    // Keep a ref so processPayment can read the latest cached value
    // without re-subscribing when availability changes.
    const availabilityRef = (0, react_1.useRef)(availability);
    availabilityRef.current = availability;
    const checkAvailability = (0, react_1.useCallback)(async () => {
        setIsChecking(true);
        try {
            const native = (0, nativeModule_1.getWalletPayNativeModule)();
            if (native === null || native === void 0 ? void 0 : native.isWalletAvailable) {
                const result = await native.isWalletAvailable();
                setAvailability(result);
                return result;
            }
            setAvailability(UNAVAILABLE);
            return UNAVAILABLE;
        }
        catch (error) {
            logger_1.logger.warn('Erro ao verificar disponibilidade', error);
            setAvailability(UNAVAILABLE);
            return UNAVAILABLE;
        }
        finally {
            setIsChecking(false);
        }
    }, []);
    const getDiagnostics = (0, react_1.useCallback)(async (supportedNetworks) => {
        try {
            const native = (0, nativeModule_1.getWalletPayNativeModule)();
            if (react_native_1.Platform.OS === 'ios' && (native === null || native === void 0 ? void 0 : native.getApplePayDiagnostics)) {
                return await native.getApplePayDiagnostics(supportedNetworks || []);
            }
            return {
                platform: react_native_1.Platform.OS,
                canMakePayments: false,
                hasCardsForNetworks: false,
                available: false,
                message: 'Platform not supported or module not available',
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                platform: react_native_1.Platform.OS,
                canMakePayments: false,
                hasCardsForNetworks: false,
                available: false,
                error: message,
                message: 'Erro ao obter diagnósticos: ' + message,
            };
        }
    }, []);
    const processApplePayment = (0, react_1.useCallback)(async (config) => {
        var _a, _b;
        if (react_native_1.Platform.OS !== 'ios') {
            const error = new Error('Apple Pay disponível apenas no iOS');
            onPaymentError === null || onPaymentError === void 0 ? void 0 : onPaymentError(error);
            return { success: false, error };
        }
        setIsLoading(true);
        const native = (0, nativeModule_1.getWalletPayNativeModule)();
        try {
            if (!(native === null || native === void 0 ? void 0 : native.requestApplePayment)) {
                throw new Error('Módulo nativo WalletPay não disponível');
            }
            const paymentResult = await native.requestApplePayment({
                ...config,
                amount: config.amount.toString(),
            });
            if (paymentProcessor) {
                if (!paymentResult.token) {
                    throw new Error('Payment token missing from Apple Pay response');
                }
                const processorResult = await paymentProcessor({
                    provider: 'applePay',
                    token: paymentResult.token,
                    config,
                });
                if (native.completeApplePayment) {
                    await native.completeApplePayment(processorResult.success);
                }
                if (processorResult.success) {
                    onPaymentSuccess === null || onPaymentSuccess === void 0 ? void 0 : onPaymentSuccess(processorResult);
                    return { success: true, result: processorResult };
                }
                const error = new Error(processorResult.error || 'Erro no processamento');
                onPaymentError === null || onPaymentError === void 0 ? void 0 : onPaymentError(error);
                return { success: false, error };
            }
            if (native.completeApplePayment) {
                await native.completeApplePayment(true);
            }
            const result = {
                success: true,
                provider: 'applePay',
                token: paymentResult.token,
                transactionId: paymentResult.transactionId ||
                    ((_a = paymentResult.token) === null || _a === void 0 ? void 0 : _a.transactionId) ||
                    ((_b = paymentResult.token) === null || _b === void 0 ? void 0 : _b.transactionIdentifier),
            };
            onPaymentSuccess === null || onPaymentSuccess === void 0 ? void 0 : onPaymentSuccess(result);
            return { success: true, result };
        }
        catch (error) {
            logger_1.logger.error('processApplePayment failed', error);
            if (native === null || native === void 0 ? void 0 : native.completeApplePayment) {
                await native.completeApplePayment(false);
            }
            const err = error instanceof Error ? error : new Error(String(error));
            onPaymentError === null || onPaymentError === void 0 ? void 0 : onPaymentError(err);
            return { success: false, error: err };
        }
        finally {
            setIsLoading(false);
        }
    }, [paymentProcessor, onPaymentSuccess, onPaymentError]);
    const processGooglePayment = (0, react_1.useCallback)(async (config) => {
        var _a, _b, _c, _d;
        if (react_native_1.Platform.OS !== 'android') {
            const error = new Error('Google Pay disponível apenas no Android');
            onPaymentError === null || onPaymentError === void 0 ? void 0 : onPaymentError(error);
            return { success: false, error };
        }
        setIsLoading(true);
        const native = (0, nativeModule_1.getWalletPayNativeModule)();
        try {
            const requestFn = (_a = native === null || native === void 0 ? void 0 : native.requestGooglePayment) !== null && _a !== void 0 ? _a : native === null || native === void 0 ? void 0 : native.processGooglePayPayment;
            if (!native || !requestFn) {
                throw new Error('Módulo nativo WalletPay não disponível');
            }
            if (!config.tokenizationSpecification) {
                throw new Error('Google Pay requer tokenizationSpecification (gateway)');
            }
            const paymentResult = await requestFn.call(native, {
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
            });
            if (paymentResult.cancelled || paymentResult.success === false) {
                throw new Error('Pagamento Google Pay cancelado ou rejeitado');
            }
            if (paymentProcessor) {
                if (!paymentResult.token) {
                    throw new Error('Payment token missing from Google Pay response');
                }
                const processorResult = await paymentProcessor({
                    provider: 'googlePay',
                    token: paymentResult.token,
                    config,
                });
                if (processorResult.success) {
                    onPaymentSuccess === null || onPaymentSuccess === void 0 ? void 0 : onPaymentSuccess(processorResult);
                    return { success: true, result: processorResult };
                }
                const error = new Error(processorResult.error || 'Erro no processamento');
                onPaymentError === null || onPaymentError === void 0 ? void 0 : onPaymentError(error);
                return { success: false, error };
            }
            const result = {
                success: true,
                provider: 'googlePay',
                token: paymentResult.token,
                transactionId: paymentResult.transactionId ||
                    ((_c = paymentResult.token) === null || _c === void 0 ? void 0 : _c.transactionId) ||
                    ((_d = paymentResult.token) === null || _d === void 0 ? void 0 : _d.transactionIdentifier),
            };
            onPaymentSuccess === null || onPaymentSuccess === void 0 ? void 0 : onPaymentSuccess(result);
            return { success: true, result };
        }
        catch (error) {
            logger_1.logger.error('processGooglePayment failed', error);
            const err = error instanceof Error ? error : new Error(String(error));
            onPaymentError === null || onPaymentError === void 0 ? void 0 : onPaymentError(err);
            return { success: false, error: err };
        }
        finally {
            setIsLoading(false);
        }
    }, [paymentProcessor, onPaymentSuccess, onPaymentError]);
    /**
     * Uses cached availability by default.
     * Pass `{ refreshAvailability: true }` to force a native re-check.
     */
    const processPayment = (0, react_1.useCallback)(async (config, options) => {
        const currentAvailability = (options === null || options === void 0 ? void 0 : options.refreshAvailability)
            ? await checkAvailability()
            : availabilityRef.current;
        // If cache is still the initial empty state and user never called
        // checkAvailability, do a one-time fetch.
        const needsInitialCheck = !(options === null || options === void 0 ? void 0 : options.refreshAvailability) &&
            !currentAvailability.applePay &&
            !currentAvailability.googlePay;
        const availability = needsInitialCheck
            ? await checkAvailability()
            : currentAvailability;
        if (react_native_1.Platform.OS === 'ios' &&
            availability.applePay &&
            config.applePay) {
            return await processApplePayment(config.applePay);
        }
        if (react_native_1.Platform.OS === 'android' &&
            availability.googlePay &&
            config.googlePay) {
            return await processGooglePayment(config.googlePay);
        }
        // Flat Apple Pay config fallback (legacy)
        if (react_native_1.Platform.OS === 'ios' &&
            availability.applePay &&
            config &&
            ('amount' in config ||
                'currencyCode' in config ||
                'countryCode' in config)) {
            return await processApplePayment(config);
        }
        const error = new Error('Nenhum método de pagamento disponível ou configuração inválida');
        onPaymentError === null || onPaymentError === void 0 ? void 0 : onPaymentError(error);
        return { success: false, error };
    }, [
        checkAvailability,
        processApplePayment,
        processGooglePayment,
        onPaymentError,
    ]);
    const showPaymentError = (0, react_1.useCallback)((title = 'Erro no Pagamento', message = 'Algo deu errado. Tente novamente.') => {
        react_native_1.Alert.alert(title, message, [{ text: 'OK' }]);
    }, []);
    return {
        isLoading,
        availability,
        isChecking,
        checkAvailability,
        getDiagnostics,
        processPayment,
        processApplePayment,
        processGooglePayment,
        showPaymentError,
        isApplePayAvailable: availability.applePay,
        isGooglePayAvailable: availability.googlePay,
        isAnyPaymentAvailable: availability.applePay || availability.googlePay,
    };
};
exports.useWalletPay = useWalletPay;
/**
 * Simplified hook for one-shot payments.
 */
const useQuickPay = (defaultConfig = {}) => {
    const [isProcessing, setIsProcessing] = (0, react_1.useState)(false);
    const quickPay = (0, react_1.useCallback)(async (paymentConfig, processor) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        setIsProcessing(true);
        const native = (0, nativeModule_1.getWalletPayNativeModule)();
        try {
            const config = { ...defaultConfig, ...paymentConfig };
            if (react_native_1.Platform.OS === 'ios') {
                if (!(native === null || native === void 0 ? void 0 : native.requestApplePayment)) {
                    throw new Error('Módulo nativo WalletPay não disponível');
                }
                const appleConfig = (config.applePay || config);
                const paymentResult = await native.requestApplePayment({
                    ...appleConfig,
                    amount: (_a = appleConfig.amount) === null || _a === void 0 ? void 0 : _a.toString(),
                });
                if (processor) {
                    if (!paymentResult.token) {
                        throw new Error('Payment token missing');
                    }
                    const result = await processor({
                        provider: 'applePay',
                        token: paymentResult.token,
                        config: appleConfig,
                    });
                    if (native.completeApplePayment) {
                        await native.completeApplePayment(result.success);
                    }
                    return result;
                }
                if (native.completeApplePayment) {
                    await native.completeApplePayment(true);
                }
                return {
                    success: true,
                    provider: 'applePay',
                    token: paymentResult.token,
                    transactionId: paymentResult.transactionId ||
                        ((_b = paymentResult.token) === null || _b === void 0 ? void 0 : _b.transactionId) ||
                        ((_c = paymentResult.token) === null || _c === void 0 ? void 0 : _c.transactionIdentifier),
                };
            }
            // Android / Google Pay
            const googleConfig = (config.googlePay || config);
            const requestFn = (_d = native === null || native === void 0 ? void 0 : native.requestGooglePayment) !== null && _d !== void 0 ? _d : native === null || native === void 0 ? void 0 : native.processGooglePayPayment;
            if (!native || !requestFn) {
                throw new Error('Módulo nativo WalletPay não disponível');
            }
            if (!googleConfig.tokenizationSpecification) {
                throw new Error('Google Pay requer tokenizationSpecification (gateway)');
            }
            const paymentResult = await requestFn.call(native, {
                amount: (_e = googleConfig.amount) === null || _e === void 0 ? void 0 : _e.toString(),
                currencyCode: googleConfig.currencyCode,
                countryCode: googleConfig.countryCode,
                label: googleConfig.label || 'Payment',
                environment: googleConfig.environment || 'TEST',
                tokenizationSpecification: googleConfig.tokenizationSpecification,
                merchantInfo: googleConfig.merchantInfo || {
                    merchantName: googleConfig.label || 'Merchant',
                },
                allowedCardNetworks: googleConfig.allowedCardNetworks || [
                    'VISA',
                    'MASTERCARD',
                    'AMEX',
                ],
                allowedCardAuthMethods: googleConfig.allowedCardAuthMethods || [
                    'PAN_ONLY',
                    'CRYPTOGRAM_3DS',
                ],
                existingPaymentMethodRequired: (_f = googleConfig.existingPaymentMethodRequired) !== null && _f !== void 0 ? _f : false,
            });
            if (processor) {
                if (!paymentResult.token) {
                    throw new Error('Payment token missing');
                }
                return await processor({
                    provider: 'googlePay',
                    token: paymentResult.token,
                    config: googleConfig,
                });
            }
            return {
                success: true,
                provider: 'googlePay',
                token: paymentResult.token,
                transactionId: paymentResult.transactionId ||
                    ((_g = paymentResult.token) === null || _g === void 0 ? void 0 : _g.transactionId) ||
                    ((_h = paymentResult.token) === null || _h === void 0 ? void 0 : _h.transactionIdentifier),
            };
        }
        catch (error) {
            logger_1.logger.error('Erro no pagamento rápido', error);
            const nativeModule = (0, nativeModule_1.getWalletPayNativeModule)();
            if (react_native_1.Platform.OS === 'ios' && (nativeModule === null || nativeModule === void 0 ? void 0 : nativeModule.completeApplePayment)) {
                await nativeModule.completeApplePayment(false);
            }
            throw error;
        }
        finally {
            setIsProcessing(false);
        }
    }, [defaultConfig]);
    return {
        quickPay,
        isProcessing,
    };
};
exports.useQuickPay = useQuickPay;
//# sourceMappingURL=useWalletPay.js.map