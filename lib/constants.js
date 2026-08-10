"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NATIVE_MODULE_NAME = exports.ERROR_CODES = exports.PAYMENT_PROVIDERS = exports.PAYMENT_NETWORKS = exports.CURRENCIES = exports.COUNTRIES = void 0;
exports.COUNTRIES = {
    AE: 'AE',
    BH: 'BH',
    KW: 'KW',
    OM: 'OM',
    QA: 'QA',
    SA: 'SA',
    US: 'US',
    GB: 'GB',
    IN: 'IN',
    CA: 'CA',
    AU: 'AU',
    DE: 'DE',
    FR: 'FR',
    SG: 'SG',
    BR: 'BR',
};
exports.CURRENCIES = {
    AED: 'AED',
    BHD: 'BHD',
    KWD: 'KWD',
    OMR: 'OMR',
    QAR: 'QAR',
    SAR: 'SAR',
    GBP: 'GBP',
    USD: 'USD',
    INR: 'INR',
    CAD: 'CAD',
    AUD: 'AUD',
    EUR: 'EUR',
    SGD: 'SGD',
    BRL: 'BRL',
};
exports.PAYMENT_NETWORKS = {
    VISA: 'visa',
    MASTERCARD: 'masterCard',
    AMEX: 'amex',
    DISCOVER: 'discover',
    JCB: 'jcb',
    MADA: 'mada',
    MAESTRO: 'maestro',
    ELECTRON: 'electron',
    VPAY: 'vPay',
    CHINA_UNION_PAY: 'chinaUnionPay',
    INTERAC: 'interac',
    ELO: 'elo',
    CARTES_BANCAIRES: 'cartesBancaires',
};
exports.PAYMENT_PROVIDERS = {
    APPLE_PAY: 'applePay',
    GOOGLE_PAY: 'googlePay',
};
exports.ERROR_CODES = {
    PAYMENT_CANCELLED: 'PAYMENT_CANCELLED',
    PAYMENT_REJECTED: 'PAYMENT_REJECTED',
    PAYMENT_NOT_AVAILABLE: 'PAYMENT_NOT_AVAILABLE',
    INVALID_PARAMS: 'INVALID_PARAMS',
    PLATFORM_NOT_SUPPORTED: 'PLATFORM_NOT_SUPPORTED',
    E_MERCHANT_ID_NOT_FOUND: 'E_MERCHANT_ID_NOT_FOUND',
    E_INVALID_PARAMS: 'E_INVALID_PARAMS',
    E_PAYMENT_ERROR: 'E_PAYMENT_ERROR',
    APPLE_PAY_PAYMENT_REJECTED: 'APPLE_PAY_PAYMENT_REJECTED',
    GOOGLE_PAY_NOT_AVAILABLE: 'GOOGLE_PAY_NOT_AVAILABLE',
    GOOGLE_PAY_CANCELLED: 'GOOGLE_PAY_CANCELLED',
};
/** Canonical native module name exported by iOS and Android. */
exports.NATIVE_MODULE_NAME = 'WalletPayModule';
//# sourceMappingURL=constants.js.map