import { NativeModules } from 'react-native';
import { getWalletPayNativeModule } from '../src/nativeModule';
import { NATIVE_MODULE_NAME } from '../src/constants';

describe('nativeModule', () => {
  it('resolves the canonical WalletPayModule name', () => {
    expect(NATIVE_MODULE_NAME).toBe('WalletPayModule');
    const module = getWalletPayNativeModule();
    expect(module).toBe(NativeModules.WalletPayModule);
    expect(module).not.toBeNull();
  });

  it('returns null when the module is missing', () => {
    const original = NativeModules.WalletPayModule;
    // @ts-expect-error test override
    NativeModules.WalletPayModule = undefined;
    expect(getWalletPayNativeModule()).toBeNull();
    NativeModules.WalletPayModule = original;
  });
});
