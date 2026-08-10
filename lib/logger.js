"use strict";
/**
 * Conditional logger — verbose output only in __DEV__.
 * Production builds stay silent unless an explicit error handler is needed.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const isDev = typeof __DEV__ !== 'undefined'
    ? __DEV__
    : process.env.NODE_ENV !== 'production';
function formatArgs(args) {
    return args;
}
function createLogger(level) {
    return (...args) => {
        if (!isDev && level !== 'error') {
            return;
        }
        const prefix = `[WalletPay]`;
        /* eslint-disable no-console -- intentional gated logger */
        const consoleFn = level === 'debug'
            ? console.log
            : level === 'info'
                ? console.info
                : level === 'warn'
                    ? console.warn
                    : console.error;
        /* eslint-enable no-console */
        consoleFn(prefix, ...formatArgs(args));
    };
}
exports.logger = {
    debug: createLogger('debug'),
    info: createLogger('info'),
    warn: createLogger('warn'),
    /**
     * Errors are logged in production as well (short message only).
     * Prefer surfacing errors via thrown Error / callbacks.
     */
    error: createLogger('error'),
};
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map