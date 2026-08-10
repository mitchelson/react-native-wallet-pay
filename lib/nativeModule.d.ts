import type { WalletPayNativeModule } from './types';
/**
 * Resolves the canonical native module.
 * Both iOS (`RCT_EXPORT_MODULE(WalletPayModule)`) and Android (`getName()`)
 * expose the same name — no fallback aliases.
 */
export declare function getWalletPayNativeModule(): WalletPayNativeModule | null;
export declare const WalletPayModule: WalletPayNativeModule | null;
export default WalletPayModule;
//# sourceMappingURL=nativeModule.d.ts.map