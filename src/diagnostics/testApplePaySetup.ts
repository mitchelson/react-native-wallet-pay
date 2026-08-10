import { Platform } from 'react-native';
import { getWalletPayNativeModule } from '../nativeModule';
import walletPay from '../WalletPay';
import { logger } from '../logger';

/**
 * Optional Apple Pay diagnostic helper.
 * Not part of the public package API — import explicitly when debugging:
 *
 *   import { testApplePaySetup } from 'react-native-wallet-pay/lib/diagnostics/testApplePaySetup';
 */
export async function testApplePaySetup() {
  logger.debug('testApplePaySetup start');

  const WalletPayModule = getWalletPayNativeModule();

  try {
    if (Platform.OS === 'ios' && WalletPayModule) {
      const canMake =
        typeof WalletPayModule.canMakeApplePayments === 'function'
          ? await WalletPayModule.canMakeApplePayments()
          : typeof WalletPayModule.canMakePayments === 'function'
            ? await WalletPayModule.canMakePayments()
            : false;

      const available = await WalletPayModule.isWalletAvailable();
      const diagnostics = await walletPay.getApplePayDiagnostics();

      return {
        platform: Platform.OS,
        moduleExists: true,
        canMakePayments: canMake,
        walletAvailable: available,
        diagnostics,
      };
    }

    return {
      platform: Platform.OS,
      moduleExists: !!WalletPayModule,
      error: 'Não é iOS ou módulo não disponível',
    };
  } catch (error) {
    logger.error('testApplePaySetup failed', error);
    return {
      platform: Platform.OS,
      moduleExists: !!WalletPayModule,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export default testApplePaySetup;
