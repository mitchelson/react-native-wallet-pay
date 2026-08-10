/**
 * Conditional logger — verbose output only in __DEV__.
 * Production builds stay silent unless an explicit error handler is needed.
 */
export declare const logger: {
    debug: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    /**
     * Errors are logged in production as well (short message only).
     * Prefer surfacing errors via thrown Error / callbacks.
     */
    error: (...args: unknown[]) => void;
};
export default logger;
//# sourceMappingURL=logger.d.ts.map