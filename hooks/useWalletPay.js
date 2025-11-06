import { useState, useCallback } from "react";
import { Alert, Platform, NativeModules } from "react-native";

// Importa o módulo nativo diretamente para evitar dependência circular
const WalletPayModule =
  NativeModules.WalletPayModule ||
  NativeModules.RNReactNativeWalletPay ||
  NativeModules.RNReactNativeWalletPayModule ||
  NativeModules.RNWalletPay ||
  NativeModules.WalletPay ||
  null;

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
      // Usar módulo nativo diretamente para evitar dependência circular
      if (Platform.OS === "ios" && WalletPayModule?.isWalletAvailable) {
        const result = await WalletPayModule.isWalletAvailable();
        setAvailability(result);
        return result;
      } else {
        const result = { applePay: false, googlePay: false };
        setAvailability(result);
        return result;
      }
    } catch (error) {
      console.warn("Erro ao verificar disponibilidade:", error);
      setAvailability({ applePay: false, googlePay: false });
      return { applePay: false, googlePay: false };
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Método para diagnóstico detalhado quando há problemas
  const getDiagnostics = useCallback(async (supportedNetworks) => {
    try {
      if (Platform.OS === "ios" && WalletPayModule?.getApplePayDiagnostics) {
        return await WalletPayModule.getApplePayDiagnostics(supportedNetworks);
      }
      return {
        platform: Platform.OS,
        available: false,
        message: "Platform not supported or module not available",
      };
    } catch (error) {
      return {
        platform: Platform.OS,
        available: false,
        error: error.message,
        message: "Erro ao obter diagnósticos: " + error.message,
      };
    }
  }, []);

  const processApplePayment = useCallback(
    async (config) => {
      console.log(
        "[processApplePayment] Iniciando processamento Apple Pay com config:",
        config
      );

      if (Platform.OS !== "ios") {
        console.log(
          "[processApplePayment] Erro: Plataforma não é iOS, plataforma atual:",
          Platform.OS
        );
        const error = new Error("Apple Pay disponível apenas no iOS");
        onPaymentError?.(error);
        return { success: false, error };
      }

      console.log(
        "[processApplePayment] Plataforma iOS confirmada, definindo loading state"
      );
      setIsLoading(true);
      try {
        // Usar módulo nativo diretamente para evitar dependência circular
        console.log(
          "[processApplePayment] Chamando WalletPayModule.requestApplePayment..."
        );

        if (!WalletPayModule?.requestApplePayment) {
          throw new Error("Módulo nativo WalletPay não disponível");
        }

        const paymentResult = await WalletPayModule.requestApplePayment(config);
        console.log(
          "[processApplePayment] requestApplePayment retornou:",
          paymentResult
        );

        if (paymentProcessor && typeof paymentProcessor === "function") {
          console.log(
            "[processApplePayment] Executando paymentProcessor personalizado"
          );

          // Estrutura de dados conforme arquitetura gateway-agnostic
          const paymentData = {
            provider: "applePay",
            token: paymentResult.token,
            config: config,
          };

          console.log(
            "[processApplePayment] Dados enviados para processor:",
            paymentData
          );
          const processorResult = await paymentProcessor(paymentData);
          console.log(
            "[processApplePayment] PaymentProcessor retornou:",
            processorResult
          );

          // Completar Apple Pay baseado no resultado do processor
          if (WalletPayModule?.completeApplePayment) {
            await WalletPayModule.completeApplePayment(processorResult.success);
          }

          if (processorResult.success) {
            onPaymentSuccess?.(processorResult);
            return { success: true, result: processorResult };
          } else {
            const error = new Error(
              processorResult.error || "Erro no processamento"
            );
            onPaymentError?.(error);
            return { success: false, error };
          }
        } else {
          // Fluxo padrão sem processor personalizado
          console.log(
            "[processApplePayment] Completando pagamento Apple Pay com sucesso..."
          );
          if (WalletPayModule?.completeApplePayment) {
            await WalletPayModule.completeApplePayment(true);
          }
          console.log("[processApplePayment] Pagamento Apple Pay completado");

          const result = {
            success: true,
            provider: "applePay",
            token: paymentResult.token,
            transactionId:
              paymentResult.transactionId || paymentResult.token?.transactionId,
          };
          console.log("[processApplePayment] Resultado final:", result);
          onPaymentSuccess?.(result);
          return { success: true, result };
        }
      } catch (error) {
        console.error("[processApplePayment] Erro capturado:", error);
        console.log(
          "[processApplePayment] Completando pagamento Apple Pay com falha..."
        );
        if (WalletPayModule?.completeApplePayment) {
          await WalletPayModule.completeApplePayment(false);
        }
        console.log(
          "[processApplePayment] Pagamento Apple Pay marcado como falhado"
        );
        onPaymentError?.(error);
        return { success: false, error };
      } finally {
        console.log(
          "[processApplePayment] Finalizando processamento, removendo loading state"
        );
        setIsLoading(false);
      }
    },
    [paymentProcessor, onPaymentSuccess, onPaymentError]
  );

  // Processar pagamento com Google Pay
  const processGooglePayment = useCallback(
    async (config) => {
      if (Platform.OS !== "android") {
        const error = new Error("Google Pay disponível apenas no Android");
        onPaymentError?.(error);
        return { success: false, error };
      }

      setIsLoading(true);
      try {
        // Google Pay implementation coming soon
        const error = new Error(
          "Google Pay em desenvolvimento - disponível em breve"
        );
        onPaymentError?.(error);
        return { success: false, error };
      } catch (error) {
        console.error("Erro no Google Pay:", error);
        onPaymentError?.(error);
        return { success: false, error };
      } finally {
        setIsLoading(false);
      }
    },
    [onPaymentError]
  );

  // Processar pagamento automaticamente (escolhe o método disponível)
  const processPayment = useCallback(
    async (config) => {
      console.log(
        "[processPayment] Iniciando processamento com config:",
        config
      );
      const currentAvailability = await checkAvailability();
      console.log("[processPayment] Disponibilidade:", currentAvailability);

      // Apple Pay disponível e configurado
      if (
        Platform.OS === "ios" &&
        currentAvailability.applePay &&
        config.applePay
      ) {
        console.log("[processPayment] Usando Apple Pay (config.applePay)");
        return await processApplePayment(config.applePay);
      }

      // Google Pay disponível e configurado (futuro)
      if (
        Platform.OS === "android" &&
        currentAvailability.googlePay &&
        config.googlePay
      ) {
        console.log("[processPayment] Usando Google Pay (config.googlePay)");
        return await processGooglePayment(config.googlePay);
      }

      // Tentar Apple Pay como fallback se config for compatível
      if (
        Platform.OS === "ios" &&
        currentAvailability.applePay &&
        config &&
        (config.amount || config.currencyCode || config.countryCode)
      ) {
        console.log("[processPayment] Usando config como Apple Pay fallback");
        return await processApplePayment(config);
      }

      const error = new Error(
        "Nenhum método de pagamento disponível ou configuração inválida"
      );
      console.error("[processPayment] Erro:", error.message);
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

    // Métodos de verificação
    checkAvailability,
    getDiagnostics,

    // Métodos de pagamento
    processPayment,
    processApplePayment,
    processGooglePayment,

    // Métodos de utilidade
    showPaymentError,

    // Atalhos convenientes
    isApplePayAvailable: availability.applePay,
    isGooglePayAvailable: availability.googlePay,
    isAnyPaymentAvailable: availability.applePay || availability.googlePay,
  };
};

/**
 * Hook simplificado para pagamentos rápidos
 * @param {Object} defaultConfig - Configuração padrão (sem merchantIdentifier)
 * @returns {Object} Método de pagamento simplificado
 */
export const useQuickPay = (defaultConfig = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const quickPay = useCallback(
    async (paymentConfig, processor) => {
      setIsProcessing(true);
      try {
        const config = { ...defaultConfig, ...paymentConfig };

        // Usar módulo nativo diretamente para pagamentos rápidos
        if (Platform.OS === "ios") {
          // Verificar se o módulo nativo está disponível
          if (!WalletPayModule?.requestApplePayment) {
            throw new Error("Módulo nativo WalletPay não disponível");
          }

          // Processar Apple Pay diretamente
          const paymentResult = await WalletPayModule.requestApplePayment(
            config
          );

          if (processor && typeof processor === "function") {
            const paymentData = {
              provider: "applePay",
              token: paymentResult.token,
              config: config,
            };

            const result = await processor(paymentData);
            if (WalletPayModule?.completeApplePayment) {
              await WalletPayModule.completeApplePayment(result.success);
            }
            return result;
          } else {
            if (WalletPayModule?.completeApplePayment) {
              await WalletPayModule.completeApplePayment(true);
            }
            return {
              success: true,
              provider: "applePay",
              token: paymentResult.token,
              transactionId:
                paymentResult.transactionId ||
                paymentResult.token?.transactionId,
            };
          }
        } else {
          throw new Error(
            "Google Pay em desenvolvimento - disponível em breve"
          );
        }
      } catch (error) {
        console.error("Erro no pagamento rápido:", error);
        if (Platform.OS === "ios" && WalletPayModule?.completeApplePayment) {
          await WalletPayModule.completeApplePayment(false);
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
