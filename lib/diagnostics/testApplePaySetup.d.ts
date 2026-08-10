/**
 * Optional Apple Pay diagnostic helper.
 * Not part of the public package API — import explicitly when debugging:
 *
 *   import { testApplePaySetup } from 'react-native-wallet-pay/lib/diagnostics/testApplePaySetup';
 */
export declare function testApplePaySetup(): Promise<{
    platform: "ios";
    moduleExists: boolean;
    canMakePayments: boolean;
    walletAvailable: import("..").PaymentAvailability;
    diagnostics: import("..").ApplePayDiagnostics;
    error?: undefined;
} | {
    platform: "ios" | "android" | "windows" | "macos" | "web";
    moduleExists: boolean;
    error: string;
    canMakePayments?: undefined;
    walletAvailable?: undefined;
    diagnostics?: undefined;
}>;
export default testApplePaySetup;
//# sourceMappingURL=testApplePaySetup.d.ts.map