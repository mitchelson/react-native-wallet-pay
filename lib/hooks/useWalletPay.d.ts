import type { UseQuickPayReturn, UseWalletPayOptions, UseWalletPayReturn, WalletPayConfig } from '../types';
/**
 * Hook for digital wallet payments (Apple Pay / Google Pay).
 */
export declare const useWalletPay: ({ onPaymentSuccess, onPaymentError, paymentProcessor, }?: UseWalletPayOptions) => UseWalletPayReturn;
/**
 * Simplified hook for one-shot payments.
 */
export declare const useQuickPay: (defaultConfig?: Partial<WalletPayConfig>) => UseQuickPayReturn;
//# sourceMappingURL=useWalletPay.d.ts.map