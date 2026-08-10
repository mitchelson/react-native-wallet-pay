import { Platform } from 'react-native';
import { PAYMENT_NETWORKS } from './constants';
import { logger } from './logger';
import { getWalletPayNativeModule } from './nativeModule';
import type {
  ApplePayConfig,
  ApplePayDiagnostics,
  GooglePayConfig,
  PaymentAvailability,
  PaymentProcessor,
  PaymentProcessorResult,
  PaymentResult,
  WalletPayConfig,
} from './types';

const UNAVAILABLE: PaymentAvailability = {
  applePay: false,
  googlePay: false,
};

export class WalletPay {
  defaultNetworks: string[];

  constructor() {
    this.defaultNetworks = [
      PAYMENT_NETWORKS.VISA,
      PAYMENT_NETWORKS.MASTERCARD,
      PAYMENT_NETWORKS.AMEX,
    ];
  }

  private get native() {
    return getWalletPayNativeModule();
  }

  /**
   * Single public availability API for Apple Pay / Google Pay.
   */
  async isAvailable(): Promise<PaymentAvailability> {
    logger.debug('isAvailable()', Platform.OS);

    try {
      const native = this.native;
      if (!native?.isWalletAvailable) {
        return UNAVAILABLE;
      }

      const result = await native.isWalletAvailable();
      logger.debug('isAvailable result', result);
      return result ?? UNAVAILABLE;
    } catch (error) {
      logger.error('isAvailable failed', error);
      return UNAVAILABLE;
    }
  }

  async canMakeApplePayments(): Promise<boolean> {
    try {
      if (Platform.OS !== 'ios') {
        return false;
      }

      const native = this.native;
      if (!native) {
        return false;
      }

      if (typeof native.canMakeApplePayments === 'function') {
        return await native.canMakeApplePayments();
      }

      if (typeof native.canMakePayments === 'function') {
        return await native.canMakePayments();
      }

      if (typeof native.isApplePayAvailable === 'function') {
        return await native.isApplePayAvailable();
      }

      return false;
    } catch (error) {
      logger.error('canMakeApplePayments failed', error);
      return false;
    }
  }

  async canMakeApplePaymentsWithCards(
    supportedNetworks: string[] = this.defaultNetworks
  ): Promise<boolean> {
    try {
      if (Platform.OS !== 'ios') {
        return false;
      }

      const native = this.native;
      if (!native?.canMakeApplePaymentsWithCards) {
        logger.warn(
          'canMakeApplePaymentsWithCards unavailable, falling back to canMakeApplePayments'
        );
        return await this.canMakeApplePayments();
      }

      return await native.canMakeApplePaymentsWithCards(supportedNetworks);
    } catch (error) {
      logger.warn(
        'canMakeApplePaymentsWithCards error',
        error instanceof Error ? error.message : error
      );
      return false;
    }
  }

  async getApplePayDiagnostics(
    supportedNetworks: string[] = this.defaultNetworks
  ): Promise<ApplePayDiagnostics> {
    try {
      if (Platform.OS !== 'ios') {
        return {
          platform: 'android',
          canMakePayments: false,
          hasCardsForNetworks: false,
          available: false,
          message: 'Apple Pay apenas disponível no iOS',
        };
      }

      const native = this.native;
      if (!native) {
        return {
          platform: 'ios',
          canMakePayments: false,
          hasCardsForNetworks: false,
          available: false,
          message: 'Módulo WalletPayModule não encontrado',
        };
      }

      if (native.getApplePayDiagnostics) {
        return await native.getApplePayDiagnostics(supportedNetworks);
      }

      const canMakePayments = native.isApplePayAvailable
        ? await native.isApplePayAvailable()
        : await this.canMakeApplePayments();

      let hasCardsForNetworks = false;
      try {
        hasCardsForNetworks = native.canMakeApplePaymentsWithCards
          ? await native.canMakeApplePaymentsWithCards(supportedNetworks)
          : canMakePayments;
      } catch {
        hasCardsForNetworks = canMakePayments;
      }

      let message = 'Apple Pay disponível e configurado';
      if (!canMakePayments) {
        message =
          'Apple Pay não disponível (dispositivo não suporta ou sem cartões na Wallet)';
      } else if (hasCardsForNetworks === false) {
        message = `Apple Pay disponível, mas sem cartões para as redes: ${supportedNetworks.join(
          ', '
        )}. Tente com redes diferentes.`;
      }

      return {
        platform: 'ios',
        canMakePayments,
        hasCardsForNetworks,
        available: canMakePayments,
        supportedNetworks,
        message,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        platform: 'ios',
        canMakePayments: false,
        hasCardsForNetworks: false,
        available: false,
        error: message,
        message: 'Erro ao verificar Apple Pay: ' + message,
      };
    }
  }

  async requestApplePayment(config: ApplePayConfig): Promise<PaymentResult> {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Pay is only available on iOS');
    }

    const native = this.native;
    if (!native?.requestApplePayment) {
      throw new Error('Apple Pay module not available');
    }

    if (!config.amount || !config.currencyCode || !config.countryCode) {
      throw new Error(
        'Missing required parameters: amount, currencyCode, countryCode'
      );
    }

    const paymentRequest = {
      supportedNetworks: config.supportedNetworks || this.defaultNetworks,
      countryCode: config.countryCode,
      currencyCode: config.currencyCode,
      label: config.label || 'Payment',
      amount: config.amount.toString(),
    };

    logger.debug('requestApplePayment', paymentRequest);
    const result = await native.requestApplePayment(paymentRequest);
    logger.debug('requestApplePayment result', result);
    return result;
  }

  async completeApplePayment(success = true): Promise<void> {
    try {
      if (Platform.OS === 'ios' && this.native?.completeApplePayment) {
        await this.native.completeApplePayment(success);
      }
    } catch (error) {
      logger.warn('Error completing Apple Pay payment', error);
    }
  }

  async requestGooglePayment(config: GooglePayConfig): Promise<PaymentResult> {
    if (Platform.OS !== 'android') {
      throw new Error('Google Pay is only available on Android');
    }

    const native = this.native;
    const requestFn =
      native?.requestGooglePayment ?? native?.processGooglePayPayment;

    if (!native || !requestFn) {
      throw new Error('Google Pay module not available');
    }

    if (
      !config.amount ||
      !config.currencyCode ||
      !config.countryCode ||
      !config.tokenizationSpecification
    ) {
      throw new Error(
        'Missing required parameters: amount, currencyCode, countryCode, tokenizationSpecification'
      );
    }

    const paymentRequest = {
      amount: config.amount.toString(),
      currencyCode: config.currencyCode,
      countryCode: config.countryCode,
      label: config.label || 'Payment',
      environment: config.environment || 'TEST',
      tokenizationSpecification: config.tokenizationSpecification,
      merchantInfo: config.merchantInfo || {
        merchantName: config.label || 'Merchant',
      },
      allowedCardNetworks: config.allowedCardNetworks || [
        'VISA',
        'MASTERCARD',
        'AMEX',
      ],
      allowedCardAuthMethods: config.allowedCardAuthMethods || [
        'PAN_ONLY',
        'CRYPTOGRAM_3DS',
      ],
      existingPaymentMethodRequired:
        config.existingPaymentMethodRequired ?? false,
      paymentDataRequestOverrides: config.paymentDataRequestOverrides,
    };

    logger.debug('requestGooglePayment', {
      ...paymentRequest,
      tokenizationSpecification: {
        type: paymentRequest.tokenizationSpecification.type,
        gateway: paymentRequest.tokenizationSpecification.gateway,
      },
    });

    const result = await requestFn.call(native, paymentRequest);
    logger.debug('requestGooglePayment result status', result?.success);
    return result;
  }

  /**
   * Generic payment flow. Optionally accepts a precomputed availability
   * to avoid an extra native round-trip.
   */
  async processPayment(
    config: WalletPayConfig,
    paymentProcessor?: PaymentProcessor,
    cachedAvailability?: PaymentAvailability
  ): Promise<PaymentProcessorResult> {
    logger.debug('processPayment start', {
      hasApplePay: !!config.applePay,
      hasGooglePay: !!config.googlePay,
    });

    try {
      const availability = cachedAvailability ?? (await this.isAvailable());
      logger.debug('processPayment availability', availability);

      if (!availability.applePay && !availability.googlePay) {
        if (Platform.OS === 'ios') {
          try {
            await this.getApplePayDiagnostics();
          } catch {
            // diagnostics are best-effort
          }
        }
        throw new Error('No wallet payment methods available');
      }

      let paymentResult: PaymentResult;
      let provider: 'applePay' | 'googlePay';
      let paymentConfig: ApplePayConfig | GooglePayConfig;

      if (Platform.OS === 'ios' && availability.applePay && config.applePay) {
        provider = 'applePay';
        paymentConfig = config.applePay;
        paymentResult = await this.requestApplePayment(paymentConfig);
      } else if (
        Platform.OS === 'android' &&
        availability.googlePay &&
        config.googlePay
      ) {
        provider = 'googlePay';
        paymentConfig = config.googlePay;
        paymentResult = await this.requestGooglePayment(paymentConfig);
      } else {
        throw new Error('No compatible payment configuration found');
      }

      if (paymentResult.cancelled || paymentResult.success === false) {
        throw new Error('Payment cancelled or rejected');
      }

      let processorResult: PaymentProcessorResult;
      if (paymentProcessor && typeof paymentProcessor === 'function') {
        if (!paymentResult.token) {
          throw new Error('Payment token missing from wallet response');
        }

        processorResult = await paymentProcessor({
          provider,
          token: paymentResult.token,
          config: paymentConfig,
        });
      } else {
        processorResult = {
          success: true,
          transactionId: paymentResult.transactionId || 'direct_payment',
        };
      }

      if (provider === 'applePay') {
        await this.completeApplePayment(processorResult.success);
      }

      return processorResult;
    } catch (error) {
      logger.error('processPayment failed', error);

      try {
        if (Platform.OS === 'ios') {
          await this.completeApplePayment(false);
        }
      } catch (completeError) {
        logger.warn('Failed to complete Apple Pay as failure', completeError);
      }

      throw error;
    }
  }
}

const walletPay = new WalletPay();
export default walletPay;
