import { NativeModules } from 'react-native';
import { NATIVE_MODULE_NAME } from './constants';
import type { WalletPayNativeModule } from './types';
import { logger } from './logger';

/**
 * Resolves the canonical native module.
 * Both iOS (`RCT_EXPORT_MODULE(WalletPayModule)`) and Android (`getName()`)
 * expose the same name — no fallback aliases.
 */
export function getWalletPayNativeModule(): WalletPayNativeModule | null {
  const module = NativeModules[NATIVE_MODULE_NAME] as
    | WalletPayNativeModule
    | undefined;

  if (!module) {
    logger.debug(
      `Native module "${NATIVE_MODULE_NAME}" not found. ` +
        'Ensure the package is linked (autolinking / pod install).'
    );
    return null;
  }

  return module;
}

export const WalletPayModule = getWalletPayNativeModule();

export default WalletPayModule;
