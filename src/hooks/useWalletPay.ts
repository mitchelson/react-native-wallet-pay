import { useState, useCallback, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { getWalletPayNativeModule } from '../nativeModule';
import { logger } from '../logger';
import type {
  ApplePayConfig,
  ApplePayDiagnostics,
  GooglePayConfig,
  PaymentAvailability,
  PaymentProcessor,
  ProcessPaymentOptions,
  UseQuickPayReturn,
  UseWalletPayOptions,
  UseWalletPayReturn,
  WalletPayConfig,
} from '../types';

const UNAVAILABLE: PaymentAvailability = {
  applePay: false,
  googlePay: false,
};

/**
 * Hook for digital wallet payments (Apple Pay / Google Pay).
 */
export const useWalletPay = ({
  onPaymentSuccess,
  onPaymentError,
  paymentProcessor,
}: UseWalletPayOptions = {}): UseWalletPayReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [availability, setAvailability] =
    useState<PaymentAvailability>(UNAVAILABLE);
  const [isChecking, setIsChecking] = useState(false);

  // Keep a ref so processPayment can read the latest cached value
  // without re-subscribing when availability changes.
  const availabilityRef = useRef(availability);
  availabilityRef.current = availability;

  const checkAvailability = useCallback(async () => {
    setIsChecking(true);
    try {
      const native = getWalletPayNativeModule();
      if (native?.isWalletAvailable) {
        const result = await native.isWalletAvailable();
        setAvailability(result);
        return result;
      }

      setAvailability(UNAVAILABLE);
      return UNAVAILABLE;
    } catch (error) {
      logger.warn('Erro ao verificar disponibilidade', error);
      setAvailability(UNAVAILABLE);
      return UNAVAILABLE;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const getDiagnostics = useCallback(
    async (supportedNetworks?: string[]): Promise<ApplePayDiagnostics> => {
      try {
        const native = getWalletPayNativeModule();
        if (Platform.OS === 'ios' && native?.getApplePayDiagnostics) {
          return await native.getApplePayDiagnostics(supportedNetworks || []);
        }
        return {
          platform: Platform.OS,
          canMakePayments: false,
          hasCardsForNetworks: false,
          available: false,
          message: 'Platform not supported or module not available',
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          platform: Platform.OS,
          canMakePayments: false,
          hasCardsForNetworks: false,
          available: false,
          error: message,
          message: 'Erro ao obter diagnósticos: ' + message,
        };
      }
    },
    []
  );

  const processApplePayment = useCallback(
    async (config: ApplePayConfig) => {
      if (Platform.OS !== 'ios') {
        const error = new Error('Apple Pay disponível apenas no iOS');
        onPaymentError?.(error);
        return { success: false, error };
      }

      setIsLoading(true);
      const native = getWalletPayNativeModule();

      try {
        if (!native?.requestApplePayment) {
          throw new Error('Módulo nativo WalletPay não disponível');
        }

        const paymentResult = await native.requestApplePayment({
          ...config,
          amount: config.amount.toString(),
        });

        if (paymentProcessor) {
          if (!paymentResult.token) {
            throw new Error('Payment token missing from Apple Pay response');
          }

          const processorResult = await paymentProcessor({
            provider: 'applePay',
            token: paymentResult.token,
            config,
          });

          if (native.completeApplePayment) {
            await native.completeApplePayment(processorResult.success);
          }

          if (processorResult.success) {
            onPaymentSuccess?.(processorResult);
            return { success: true, result: processorResult };
          }

          const error = new Error(
            processorResult.error || 'Erro no processamento'
          );
          onPaymentError?.(error);
          return { success: false, error };
        }

        if (native.completeApplePayment) {
          await native.completeApplePayment(true);
        }

        const result = {
          success: true,
          provider: 'applePay' as const,
          token: paymentResult.token,
          transactionId:
            paymentResult.transactionId ||
            paymentResult.token?.transactionId ||
            paymentResult.token?.transactionIdentifier,
        };
        onPaymentSuccess?.(result);
        return { success: true, result };
      } catch (error) {
        logger.error('processApplePayment failed', error);
        if (native?.completeApplePayment) {
          await native.completeApplePayment(false);
        }
        const err = error instanceof Error ? error : new Error(String(error));
        onPaymentError?.(err);
        return { success: false, error: err };
      } finally {
        setIsLoading(false);
      }
    },
    [paymentProcessor, onPaymentSuccess, onPaymentError]
  );

  const processGooglePayment = useCallback(
    async (config: GooglePayConfig) => {
      if (Platform.OS !== 'android') {
        const error = new Error('Google Pay disponível apenas no Android');
        onPaymentError?.(error);
        return { success: false, error };
      }

      setIsLoading(true);
      const native = getWalletPayNativeModule();

      try {
        const requestFn =
          native?.requestGooglePayment ?? native?.processGooglePayPayment;

        if (!native || !requestFn) {
          throw new Error('Módulo nativo WalletPay não disponível');
        }

        if (!config.tokenizationSpecification) {
          throw new Error(
            'Google Pay requer tokenizationSpecification (gateway)'
          );
        }

        const paymentResult = await requestFn.call(native, {
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
        });

        if (paymentResult.cancelled || paymentResult.success === false) {
          throw new Error('Pagamento Google Pay cancelado ou rejeitado');
        }

        if (paymentProcessor) {
          if (!paymentResult.token) {
            throw new Error('Payment token missing from Google Pay response');
          }

          const processorResult = await paymentProcessor({
            provider: 'googlePay',
            token: paymentResult.token,
            config,
          });

          if (processorResult.success) {
            onPaymentSuccess?.(processorResult);
            return { success: true, result: processorResult };
          }

          const error = new Error(
            processorResult.error || 'Erro no processamento'
          );
          onPaymentError?.(error);
          return { success: false, error };
        }

        const result = {
          success: true,
          provider: 'googlePay' as const,
          token: paymentResult.token,
          transactionId:
            paymentResult.transactionId ||
            paymentResult.token?.transactionId ||
            paymentResult.token?.transactionIdentifier,
        };
        onPaymentSuccess?.(result);
        return { success: true, result };
      } catch (error) {
        logger.error('processGooglePayment failed', error);
        const err = error instanceof Error ? error : new Error(String(error));
        onPaymentError?.(err);
        return { success: false, error: err };
      } finally {
        setIsLoading(false);
      }
    },
    [paymentProcessor, onPaymentSuccess, onPaymentError]
  );

  /**
   * Uses cached availability by default.
   * Pass `{ refreshAvailability: true }` to force a native re-check.
   */
  const processPayment = useCallback(
    async (config: WalletPayConfig, options?: ProcessPaymentOptions) => {
      const currentAvailability = options?.refreshAvailability
        ? await checkAvailability()
        : availabilityRef.current;

      // If cache is still the initial empty state and user never called
      // checkAvailability, do a one-time fetch.
      const needsInitialCheck =
        !options?.refreshAvailability &&
        !currentAvailability.applePay &&
        !currentAvailability.googlePay;

      const availability = needsInitialCheck
        ? await checkAvailability()
        : currentAvailability;

      if (
        Platform.OS === 'ios' &&
        availability.applePay &&
        config.applePay
      ) {
        return await processApplePayment(config.applePay);
      }

      if (
        Platform.OS === 'android' &&
        availability.googlePay &&
        config.googlePay
      ) {
        return await processGooglePayment(config.googlePay);
      }

      // Flat Apple Pay config fallback (legacy)
      if (
        Platform.OS === 'ios' &&
        availability.applePay &&
        config &&
        ('amount' in config ||
          'currencyCode' in config ||
          'countryCode' in config)
      ) {
        return await processApplePayment(config as unknown as ApplePayConfig);
      }

      const error = new Error(
        'Nenhum método de pagamento disponível ou configuração inválida'
      );
      onPaymentError?.(error);
      return { success: false, error };
    },
    [
      checkAvailability,
      processApplePayment,
      processGooglePayment,
      onPaymentError,
    ]
  );

  const showPaymentError = useCallback(
    (
      title = 'Erro no Pagamento',
      message = 'Algo deu errado. Tente novamente.'
    ) => {
      Alert.alert(title, message, [{ text: 'OK' }]);
    },
    []
  );

  return {
    isLoading,
    availability,
    isChecking,
    checkAvailability,
    getDiagnostics,
    processPayment,
    processApplePayment,
    processGooglePayment,
    showPaymentError,
    isApplePayAvailable: availability.applePay,
    isGooglePayAvailable: availability.googlePay,
    isAnyPaymentAvailable: availability.applePay || availability.googlePay,
  };
};

/**
 * Simplified hook for one-shot payments.
 */
export const useQuickPay = (
  defaultConfig: Partial<WalletPayConfig> = {}
): UseQuickPayReturn => {
  const [isProcessing, setIsProcessing] = useState(false);

  const quickPay = useCallback(
    async (
      paymentConfig: Partial<WalletPayConfig> &
        Partial<ApplePayConfig> &
        Partial<GooglePayConfig>,
      processor?: PaymentProcessor
    ) => {
      setIsProcessing(true);
      const native = getWalletPayNativeModule();

      try {
        const config = { ...defaultConfig, ...paymentConfig };

        if (Platform.OS === 'ios') {
          if (!native?.requestApplePayment) {
            throw new Error('Módulo nativo WalletPay não disponível');
          }

          const appleConfig = (config.applePay || config) as ApplePayConfig;
          const paymentResult = await native.requestApplePayment({
            ...appleConfig,
            amount: appleConfig.amount?.toString(),
          });

          if (processor) {
            if (!paymentResult.token) {
              throw new Error('Payment token missing');
            }
            const result = await processor({
              provider: 'applePay',
              token: paymentResult.token,
              config: appleConfig,
            });
            if (native.completeApplePayment) {
              await native.completeApplePayment(result.success);
            }
            return result;
          }

          if (native.completeApplePayment) {
            await native.completeApplePayment(true);
          }

          return {
            success: true,
            provider: 'applePay',
            token: paymentResult.token,
            transactionId:
              paymentResult.transactionId ||
              paymentResult.token?.transactionId ||
              paymentResult.token?.transactionIdentifier,
          };
        }

        // Android / Google Pay
        const googleConfig = (config.googlePay || config) as GooglePayConfig;
        const requestFn =
          native?.requestGooglePayment ?? native?.processGooglePayPayment;

        if (!native || !requestFn) {
          throw new Error('Módulo nativo WalletPay não disponível');
        }

        if (!googleConfig.tokenizationSpecification) {
          throw new Error(
            'Google Pay requer tokenizationSpecification (gateway)'
          );
        }

        const paymentResult = await requestFn.call(native, {
          amount: googleConfig.amount?.toString(),
          currencyCode: googleConfig.currencyCode,
          countryCode: googleConfig.countryCode,
          label: googleConfig.label || 'Payment',
          environment: googleConfig.environment || 'TEST',
          tokenizationSpecification: googleConfig.tokenizationSpecification,
          merchantInfo: googleConfig.merchantInfo || {
            merchantName: googleConfig.label || 'Merchant',
          },
          allowedCardNetworks: googleConfig.allowedCardNetworks || [
            'VISA',
            'MASTERCARD',
            'AMEX',
          ],
          allowedCardAuthMethods: googleConfig.allowedCardAuthMethods || [
            'PAN_ONLY',
            'CRYPTOGRAM_3DS',
          ],
          existingPaymentMethodRequired:
            googleConfig.existingPaymentMethodRequired ?? false,
        });

        if (processor) {
          if (!paymentResult.token) {
            throw new Error('Payment token missing');
          }
          return await processor({
            provider: 'googlePay',
            token: paymentResult.token,
            config: googleConfig,
          });
        }

        return {
          success: true,
          provider: 'googlePay',
          token: paymentResult.token,
          transactionId:
            paymentResult.transactionId ||
            paymentResult.token?.transactionId ||
            paymentResult.token?.transactionIdentifier,
        };
      } catch (error) {
        logger.error('Erro no pagamento rápido', error);
        const nativeModule = getWalletPayNativeModule();
        if (Platform.OS === 'ios' && nativeModule?.completeApplePayment) {
          await nativeModule.completeApplePayment(false);
        }
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [defaultConfig]
  );

  return {
    quickPay,
    isProcessing,
  };
};
