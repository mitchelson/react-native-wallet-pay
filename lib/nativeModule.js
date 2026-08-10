"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletPayModule = void 0;
exports.getWalletPayNativeModule = getWalletPayNativeModule;
const react_native_1 = require("react-native");
const constants_1 = require("./constants");
const logger_1 = require("./logger");
/**
 * Resolves the canonical native module.
 * Both iOS (`RCT_EXPORT_MODULE(WalletPayModule)`) and Android (`getName()`)
 * expose the same name — no fallback aliases.
 */
function getWalletPayNativeModule() {
    const module = react_native_1.NativeModules[constants_1.NATIVE_MODULE_NAME];
    if (!module) {
        logger_1.logger.debug(`Native module "${constants_1.NATIVE_MODULE_NAME}" not found. ` +
            'Ensure the package is linked (autolinking / pod install).');
        return null;
    }
    return module;
}
exports.WalletPayModule = getWalletPayNativeModule();
exports.default = exports.WalletPayModule;
//# sourceMappingURL=nativeModule.js.map