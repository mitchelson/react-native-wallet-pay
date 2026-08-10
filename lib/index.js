"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.WalletPayModule = exports.getWalletPayNativeModule = exports.useQuickPay = exports.useWalletPay = exports.default = exports.WalletPay = exports.NATIVE_MODULE_NAME = exports.ERROR_CODES = exports.PAYMENT_PROVIDERS = exports.PAYMENT_NETWORKS = exports.CURRENCIES = exports.COUNTRIES = void 0;
var constants_1 = require("./constants");
Object.defineProperty(exports, "COUNTRIES", { enumerable: true, get: function () { return constants_1.COUNTRIES; } });
Object.defineProperty(exports, "CURRENCIES", { enumerable: true, get: function () { return constants_1.CURRENCIES; } });
Object.defineProperty(exports, "PAYMENT_NETWORKS", { enumerable: true, get: function () { return constants_1.PAYMENT_NETWORKS; } });
Object.defineProperty(exports, "PAYMENT_PROVIDERS", { enumerable: true, get: function () { return constants_1.PAYMENT_PROVIDERS; } });
Object.defineProperty(exports, "ERROR_CODES", { enumerable: true, get: function () { return constants_1.ERROR_CODES; } });
Object.defineProperty(exports, "NATIVE_MODULE_NAME", { enumerable: true, get: function () { return constants_1.NATIVE_MODULE_NAME; } });
var WalletPay_1 = require("./WalletPay");
Object.defineProperty(exports, "WalletPay", { enumerable: true, get: function () { return WalletPay_1.WalletPay; } });
var WalletPay_2 = require("./WalletPay");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return __importDefault(WalletPay_2).default; } });
var useWalletPay_1 = require("./hooks/useWalletPay");
Object.defineProperty(exports, "useWalletPay", { enumerable: true, get: function () { return useWalletPay_1.useWalletPay; } });
Object.defineProperty(exports, "useQuickPay", { enumerable: true, get: function () { return useWalletPay_1.useQuickPay; } });
var nativeModule_1 = require("./nativeModule");
Object.defineProperty(exports, "getWalletPayNativeModule", { enumerable: true, get: function () { return nativeModule_1.getWalletPayNativeModule; } });
Object.defineProperty(exports, "WalletPayModule", { enumerable: true, get: function () { return nativeModule_1.WalletPayModule; } });
var logger_1 = require("./logger");
Object.defineProperty(exports, "logger", { enumerable: true, get: function () { return logger_1.logger; } });
//# sourceMappingURL=index.js.map