import { useState, useCallback } from "react";
import { Alert, Platform } from "react-native";
import WalletPay from "../index";

/**
 * Hook personalizado para pagamentos com carteira digital
 * @param {Object} options - Configurações do hook
 * @param {Function} options.onPaymentSuccess - Callback para pagamento bem-sucedido
 * @param {Function} options.onPaymentError - Callback para erro no pagamento
 * @param {Function} options.paymentProcessor - Função personalizada para processar o pagamento
 * @returns {Object} Métodos e estados do hook
 */
export const useWalletPay = ({
  onPaymentSuccess,
  onPaymentError,
  paymentProcessor,
} = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [availability, setAvailability] = useState({
    applePay: false,
    googlePay: false,
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkAvailability = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await WalletPay.isAvailable();
      setAvailability(result);
      return result;
    } catch (error) {
      console.warn("Erro ao verificar disponibilidade:", error);
      setAvailability({ applePay: false, googlePay: false });
      return { applePay: false, googlePay: false };
    } finally {
      setIsChecking(false);
    }
  }, []);

  const processApplePayment = useCallback(
    async (config) => {
      if (Platform.OS !== "ios") {
        const error = new Error("Apple Pay disponível apenas no iOS");
        onPaymentError?.(error);
        return { success: false, error };
      }

      setIsLoading(true);
      try {
        const result = await WalletPay.processPayment(
          { applePay: config },
          paymentProcessor
        );
        onPaymentSuccess?.(result);
        return { success: true, result };
      } catch (error) {
        console.error("Erro no Apple Pay:", error);
        onPaymentError?.(error);
        return { success: false, error };
      } finally {
        setIsLoading(false);
      }
    },
    [paymentProcessor, onPaymentSuccess, onPaymentError]
  );

  // Processar pagamento com Google Pay (placeholder para implementação futura)
  const processGooglePayment = useCallback(
    async (config) => {
      if (Platform.OS !== "android") {
        const error = new Error("Google Pay disponível apenas no Android");
        onPaymentError?.(error);
        return { success: false, error };
      }

      // TODO: Implementar Google Pay
      const error = new Error("Google Pay ainda não implementado");
      onPaymentError?.(error);
      return { success: false, error };
    },
    [onPaymentError]
  );

  // Processar pagamento automaticamente (escolhe o método disponível)
  const processPayment = useCallback(
    async (config) => {
      const currentAvailability = await checkAvailability();

      if (
        Platform.OS === "ios" &&
        currentAvailability.applePay &&
        config.applePay
      ) {
        return await processApplePayment(config.applePay);
      }

      if (
        Platform.OS === "android" &&
        currentAvailability.googlePay &&
        config.googlePay
      ) {
        return await processGooglePayment(config.googlePay);
      }

      const error = new Error("Nenhum método de pagamento disponível");
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

  // Mostrar alerta de erro personalizado
  const showPaymentError = useCallback(
    (
      title = "Erro no Pagamento",
      message = "Algo deu errado. Tente novamente."
    ) => {
      Alert.alert(title, message, [{ text: "OK" }]);
    },
    []
  );

  return {
    // Estados
    isLoading,
    availability,
    isChecking,

    // Métodos
    checkAvailability,
    processPayment,
    processApplePayment,
    processGooglePayment,
    showPaymentError,

    // Utilitários
    isApplePayAvailable: availability.applePay,
    isGooglePayAvailable: availability.googlePay,
    isAnyPaymentAvailable: availability.applePay || availability.googlePay,
  };
};

/**
 * Hook simplificado para pagamentos rápidos
 * @param {Object} defaultConfig - Configuração padrão
 * @returns {Object} Método de pagamento simplificado
 */
export const useQuickPay = (defaultConfig = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const quickPay = useCallback(
    async (paymentConfig, processor) => {
      setIsProcessing(true);
      try {
        const config = { ...defaultConfig, ...paymentConfig };
        const result = await WalletPay.processPayment(config, processor);
        return result;
      } catch (error) {
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

// Exportações nomeadas dos hooks
export { useWalletPay, useQuickPay };

// Export default
export default useWalletPay;
