"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testApplePaySetup = testApplePaySetup;
const react_native_1 = require("react-native");
const nativeModule_1 = require("../nativeModule");
const WalletPay_1 = __importDefault(require("../WalletPay"));
const logger_1 = require("../logger");
/**
 * Optional Apple Pay diagnostic helper.
 * Not part of the public package API — import explicitly when debugging:
 *
 *   import { testApplePaySetup } from 'react-native-wallet-pay/lib/diagnostics/testApplePaySetup';
 */
async function testApplePaySetup() {
    logger_1.logger.debug('testApplePaySetup start');
    const WalletPayModule = (0, nativeModule_1.getWalletPayNativeModule)();
    try {
        if (react_native_1.Platform.OS === 'ios' && WalletPayModule) {
            const canMake = typeof WalletPayModule.canMakeApplePayments === 'function'
                ? await WalletPayModule.canMakeApplePayments()
                : typeof WalletPayModule.canMakePayments === 'function'
                    ? await WalletPayModule.canMakePayments()
                    : false;
            const available = await WalletPayModule.isWalletAvailable();
            const diagnostics = await WalletPay_1.default.getApplePayDiagnostics();
            return {
                platform: react_native_1.Platform.OS,
                moduleExists: true,
                canMakePayments: canMake,
                walletAvailable: available,
                diagnostics,
            };
        }
        return {
            platform: react_native_1.Platform.OS,
            moduleExists: !!WalletPayModule,
            error: 'Não é iOS ou módulo não disponível',
        };
    }
    catch (error) {
        logger_1.logger.error('testApplePaySetup failed', error);
        return {
            platform: react_native_1.Platform.OS,
            moduleExists: !!WalletPayModule,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
exports.default = testApplePaySetup;
//# sourceMappingURL=testApplePaySetup.js.map