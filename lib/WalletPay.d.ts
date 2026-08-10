import type { ApplePayConfig, ApplePayDiagnostics, GooglePayConfig, PaymentAvailability, PaymentProcessor, PaymentProcessorResult, PaymentResult, WalletPayConfig } from './types';
export declare class WalletPay {
    defaultNetworks: string[];
    constructor();
    private get native();
    /**
     * Single public availability API for Apple Pay / Google Pay.
     */
    isAvailable(): Promise<PaymentAvailability>;
    canMakeApplePayments(): Promise<boolean>;
    canMakeApplePaymentsWithCards(supportedNetworks?: string[]): Promise<boolean>;
    getApplePayDiagnostics(supportedNetworks?: string[]): Promise<ApplePayDiagnostics>;
    requestApplePayment(config: ApplePayConfig): Promise<PaymentResult>;
    completeApplePayment(success?: boolean): Promise<void>;
    requestGooglePayment(config: GooglePayConfig): Promise<PaymentResult>;
    /**
     * Generic payment flow. Optionally accepts a precomputed availability
     * to avoid an extra native round-trip.
     */
    processPayment(config: WalletPayConfig, paymentProcessor?: PaymentProcessor, cachedAvailability?: PaymentAvailability): Promise<PaymentProcessorResult>;
}
declare const walletPay: WalletPay;
export default walletPay;
//# sourceMappingURL=WalletPay.d.ts.map