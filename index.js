import { NativeModules, Platform } from "react-native";

// Debug: Log all available native modules to help identify the correct module name
console.log(
  "[WalletPay Debug] All NativeModules keys:",
  Object.keys(NativeModules)
);

// Check each possible module name and log what's found
const moduleNames = [
  "WalletPayModule",
  "RNReactNativeWalletPay",
  "RNReactNativeWalletPayModule",
  "RNWalletPay",
  "WalletPay",
];
moduleNames.forEach((name) => {
  const module = NativeModules[name];
  if (module) {
    console.log(
      `[WalletPay Debug] Found module '${name}':`,
      Object.keys(module)
    );
  }
});

const WalletPayModule =
  NativeModules.WalletPayModule ||
  NativeModules.RNReactNativeWalletPay ||
  NativeModules.RNReactNativeWalletPayModule ||
  NativeModules.RNWalletPay ||
  NativeModules.WalletPay ||
  null;

console.log(
  "[WalletPay Debug] Final WalletPayModule:",
  !!WalletPayModule,
  WalletPayModule ? Object.keys(WalletPayModule) : "null"
);

export const COUNTRIES = {
  AE: "AE", // United Arab Emirates
  BH: "BH", // Bahrain
  KW: "KW", // Kuwait
  OM: "OM", // Oman
  QA: "QA", // Qatar
  SA: "SA", // Saudi Arabia
  US: "US", // United States
  GB: "GB", // United Kingdom
  IN: "IN", // India
  CA: "CA", // Canada
  AU: "AU", // Australia
  DE: "DE", // Germany
  FR: "FR", // France
  SG: "SG", // Singapore
  BR: "BR", // Brazil
};

export const CURRENCIES = {
  AED: "AED", // UAE Dirham
  BHD: "BHD", // Bahraini Dinar
  KWD: "KWD", // Kuwaiti Dinar
  OMR: "OMR", // Omani Rial
  QAR: "QAR", // Qatari Riyal
  SAR: "SAR", // Saudi Riyal
  GBP: "GBP", // British Pound
  USD: "USD", // US Dollar
  INR: "INR", // Indian Rupee
  CAD: "CAD", // Canadian Dollar
  AUD: "AUD", // Australian Dollar
  EUR: "EUR", // Euro
  SGD: "SGD", // Singapore Dollar
  BRL: "BRL", // Brazilian Real
};

export const PAYMENT_NETWORKS = {
  VISA: "visa",
  MASTERCARD: "masterCard",
  AMEX: "amex",
  DISCOVER: "discover",
  JCB: "jcb",
  MADA: "mada",
  MAESTRO: "maestro",
  ELECTRON: "electron",
  VPAY: "vPay",
  CHINA_UNION_PAY: "chinaUnionPay",
  INTERAC: "interac",
  ELO: "elo",
  CARTES_BANCAIRES: "cartesBancaires",
};

export const PAYMENT_PROVIDERS = {
  APPLE_PAY: "applePay",
  GOOGLE_PAY: "googlePay",
};

export const ERROR_CODES = {
  PAYMENT_CANCELLED: "PAYMENT_CANCELLED",
  PAYMENT_REJECTED: "PAYMENT_REJECTED",
  PAYMENT_NOT_AVAILABLE: "PAYMENT_NOT_AVAILABLE",
  INVALID_PARAMS: "INVALID_PARAMS",
  PLATFORM_NOT_SUPPORTED: "PLATFORM_NOT_SUPPORTED",
};

class WalletPay {
  constructor() {
    this.defaultNetworks = [
      PAYMENT_NETWORKS.VISA,
      PAYMENT_NETWORKS.MASTERCARD,
      PAYMENT_NETWORKS.AMEX,
    ];
  }

  // Método principal para verificar disponibilidade (usado pelos hooks)
  async isAvailable() {
    console.log("[WalletPay.isAvailable] Verificando disponibilidade...");
    console.log("[WalletPay.isAvailable] Platform.OS:", Platform.OS);
    console.log(
      "[WalletPay.isAvailable] WalletPayModule exists:",
      !!WalletPayModule
    );

    try {
      if (Platform.OS === "ios" && WalletPayModule) {
        console.log(
          "[WalletPay.isAvailable] Chamando WalletPayModule.isWalletAvailable()..."
        );
        const result = await WalletPayModule.isWalletAvailable();
        console.log(
          "[WalletPay.isAvailable] Resultado do módulo nativo:",
          result
        );
        return result;
      }

      console.log(
        "[WalletPay.isAvailable] Plataforma não é iOS ou módulo não disponível"
      );
      return { applePay: false, googlePay: false };
    } catch (error) {
      console.error("[WalletPay.isAvailable] Erro capturado:", error);
      return { applePay: false, googlePay: false };
    }
  }

  // Método específico que chama o módulo nativo diretamente (usado pelos hooks)
  async isWalletAvailable() {
    try {
      if (
        Platform.OS === "ios" &&
        WalletPayModule &&
        WalletPayModule.isWalletAvailable
      ) {
        return await WalletPayModule.isWalletAvailable();
      }
      return { applePay: false, googlePay: false };
    } catch (error) {
      console.error("[WalletPay.isWalletAvailable] Erro:", error);
      return { applePay: false, googlePay: false };
    }
  }

  async canMakeApplePayments() {
    console.log(
      "[WalletPay.canMakeApplePayments] Verificando se pode fazer pagamentos Apple Pay..."
    );
    try {
      if (Platform.OS !== "ios") {
        console.log(
          "[WalletPay.canMakeApplePayments] Não é iOS, retornando false"
        );
        return false;
      }
      console.log(
        "[WalletPay.canMakeApplePayments] Chamando WalletPayModule.canMakeApplePayments()..."
      );
      const result = await WalletPayModule.canMakeApplePayments();
      console.log("[WalletPay.canMakeApplePayments] Resultado:", result);
      return result;
    } catch (error) {
      console.error("[WalletPay.canMakeApplePayments] Erro:", error);
      return false;
    }
  }

  async canMakeApplePaymentsWithCards(
    supportedNetworks = this.defaultNetworks
  ) {
    try {
      if (Platform.OS !== "ios") {
        return false;
      }

      if (!WalletPayModule || !WalletPayModule.canMakeApplePaymentsWithCards) {
        console.warn(
          "canMakeApplePaymentsWithCards método não disponível, usando fallback"
        );
        return await this.canMakeApplePayments();
      }

      return await WalletPayModule.canMakeApplePaymentsWithCards(
        supportedNetworks
      );
    } catch (error) {
      console.warn(
        "Erro ao verificar cartões para redes específicas:",
        error.message
      );
      return false;
    }
  }

  // Método para diagnóstico detalhado
  async getApplePayDiagnostics(supportedNetworks = this.defaultNetworks) {
    try {
      if (Platform.OS !== "ios") {
        return {
          platform: "android",
          canMakePayments: false,
          hasCardsForNetworks: false,
          available: false,
          message: "Apple Pay apenas disponível no iOS",
        };
      }

      if (!WalletPayModule) {
        return {
          platform: "ios",
          canMakePayments: false,
          hasCardsForNetworks: false,
          available: false,
          message: "Módulo WalletPayModule não encontrado",
        };
      }

      // Usar método de diagnóstico nativo se disponível
      if (WalletPayModule.getApplePayDiagnostics) {
        const result = await WalletPayModule.getApplePayDiagnostics(
          supportedNetworks
        );
        return result;
      }

      // Fallback para verificações manuais
      const canMakePayments = await WalletPayModule.isApplePayAvailable();
      let hasCardsForNetworks = false;

      try {
        hasCardsForNetworks =
          await WalletPayModule.canMakeApplePaymentsWithCards(
            supportedNetworks
          );
      } catch (error) {
        console.warn(
          "Erro ao verificar cartões para redes específicas:",
          error.message
        );
        hasCardsForNetworks = canMakePayments;
      }

      let message = "";
      if (!canMakePayments) {
        message =
          "Apple Pay não disponível (dispositivo não suporta ou sem cartões na Wallet)";
      } else if (hasCardsForNetworks === false) {
        message = `Apple Pay disponível, mas sem cartões para as redes: ${supportedNetworks.join(
          ", "
        )}. Tente com redes diferentes.`;
      } else {
        message = "Apple Pay disponível e configurado";
      }

      return {
        platform: "ios",
        canMakePayments,
        hasCardsForNetworks,
        available: canMakePayments,
        supportedNetworks,
        message,
      };
    } catch (error) {
      return {
        platform: "ios",
        canMakePayments: false,
        hasCardsForNetworks: false,
        available: false,
        error: error.message,
        message: "Erro ao verificar Apple Pay: " + error.message,
      };
    }
  }

  async requestApplePayment(config) {
    try {
      if (Platform.OS !== "ios") {
        throw new Error("Apple Pay is only available on iOS");
      }

      if (!WalletPayModule) {
        throw new Error("Apple Pay module not available");
      }

      // Validate required parameters
      if (!config.amount || !config.currencyCode || !config.countryCode) {
        throw new Error(
          "Missing required parameters: amount, currencyCode, countryCode"
        );
      }

      const paymentRequest = {
        supportedNetworks: config.supportedNetworks || this.defaultNetworks,
        countryCode: config.countryCode,
        currencyCode: config.currencyCode,
        label: config.label || "Payment",
        amount: config.amount.toString(),
      };

      console.log(
        "[WalletPay.requestApplePayment] Enviando request:",
        paymentRequest
      );
      const result = await WalletPayModule.requestApplePayment(paymentRequest);
      console.log("[WalletPay.requestApplePayment] Resultado:", result);

      return result;
    } catch (error) {
      console.error("[WalletPay.requestApplePayment] Erro:", error);
      throw error;
    }
  }

  // Complete Apple Pay payment
  async completeApplePayment(success = true) {
    try {
      if (Platform.OS === "ios" && WalletPayModule) {
        await WalletPayModule.completeApplePayment(success);
      }
    } catch (error) {
      console.warn("Error completing Apple Pay payment:", error);
    }
  }

  // Test method for debugging
  async testApplePaySetup() {
    console.log(
      "[WalletPay.testApplePaySetup] Testando configuração Apple Pay..."
    );
    try {
      console.log("[WalletPay.testApplePaySetup] 1. Verificando plataforma...");
      console.log("[WalletPay.testApplePaySetup] Platform.OS:", Platform.OS);

      console.log(
        "[WalletPay.testApplePaySetup] 2. Verificando módulo nativo..."
      );
      console.log(
        "[WalletPay.testApplePaySetup] WalletPayModule exists:",
        !!WalletPayModule
      );

      if (Platform.OS === "ios" && WalletPayModule) {
        console.log(
          "[WalletPay.testApplePaySetup] 3. Testando canMakeApplePayments..."
        );
        const canMake = await WalletPayModule.canMakeApplePayments();
        console.log(
          "[WalletPay.testApplePaySetup] canMakeApplePayments:",
          canMake
        );

        console.log(
          "[WalletPay.testApplePaySetup] 4. Testando isWalletAvailable..."
        );
        const available = await WalletPayModule.isWalletAvailable();
        console.log(
          "[WalletPay.testApplePaySetup] isWalletAvailable:",
          available
        );

        console.log(
          "[WalletPay.testApplePaySetup] 5. Testando diagnósticos..."
        );
        const diagnostics = await this.getApplePayDiagnostics();
        console.log("[WalletPay.testApplePaySetup] diagnostics:", diagnostics);

        return {
          platform: Platform.OS,
          moduleExists: !!WalletPayModule,
          canMakePayments: canMake,
          walletAvailable: available,
          diagnostics,
        };
      }

      return {
        platform: Platform.OS,
        moduleExists: !!WalletPayModule,
        error: "Não é iOS ou módulo não disponível",
      };
    } catch (error) {
      console.error("[WalletPay.testApplePaySetup] Erro:", error);
      return {
        platform: Platform.OS,
        moduleExists: !!WalletPayModule,
        error: error.message,
      };
    }
  }

  // Generic payment method that works with any gateway
  async processPayment(config, paymentProcessor) {
    console.log(
      "[WalletPay.processPayment] Iniciando processamento com config:",
      config
    );
    console.log(
      "[WalletPay.processPayment] PaymentProcessor:",
      paymentProcessor
    );

    try {
      console.log("[WalletPay.processPayment] Verificando disponibilidade...");
      // Check availability
      const availability = await this.isAvailable();
      console.log("[WalletPay.processPayment] Disponibilidade:", availability);

      if (!availability.applePay && !availability.googlePay) {
        console.log(
          "[WalletPay.processPayment] Nenhum método de pagamento disponível"
        );

        // Obter diagnósticos detalhados para Apple Pay
        if (Platform.OS === "ios") {
          console.log(
            "[WalletPay.processPayment] Obtendo diagnósticos Apple Pay..."
          );
          try {
            const diagnostics = await this.getApplePayDiagnostics();
            console.log(
              "[WalletPay.processPayment] Diagnósticos Apple Pay:",
              diagnostics
            );
          } catch (diagError) {
            console.warn(
              "[WalletPay.processPayment] Erro ao obter diagnósticos:",
              diagError
            );
          }
        }

        throw new Error("No wallet payment methods available");
      }

      let paymentResult;
      let provider;
      let paymentConfig;

      // Determine which payment method to use based on platform and availability
      if (Platform.OS === "ios" && availability.applePay && config.applePay) {
        console.log("[WalletPay.processPayment] Usando Apple Pay");
        provider = "applePay";
        paymentConfig = config.applePay;

        console.log(
          "[WalletPay.processPayment] Chamando requestApplePayment..."
        );
        paymentResult = await this.requestApplePayment(paymentConfig);
        console.log(
          "[WalletPay.processPayment] Apple Pay retornou:",
          paymentResult
        );
      } else if (
        Platform.OS === "android" &&
        availability.googlePay &&
        config.googlePay
      ) {
        console.log(
          "[WalletPay.processPayment] Google Pay ainda não implementado"
        );
        throw new Error("Google Pay not yet implemented");
      } else {
        console.log(
          "[WalletPay.processPayment] Nenhuma configuração compatível encontrada"
        );
        throw new Error("No compatible payment configuration found");
      }

      // Call the payment processor if provided
      let processorResult;
      if (paymentProcessor && typeof paymentProcessor === "function") {
        console.log("[WalletPay.processPayment] Chamando paymentProcessor...");

        const paymentData = {
          provider,
          token: paymentResult.token,
          config: paymentConfig,
        };

        console.log(
          "[WalletPay.processPayment] Dados enviados para processor:",
          paymentData
        );
        processorResult = await paymentProcessor(paymentData);
        console.log(
          "[WalletPay.processPayment] PaymentProcessor retornou:",
          processorResult
        );
      } else {
        console.log(
          "[WalletPay.processPayment] Nenhum processor fornecido, usando resultado direto"
        );
        processorResult = {
          success: true,
          transactionId: paymentResult.transactionId || "direct_payment",
        };
      }

      // Complete the payment based on processor result
      if (provider === "applePay") {
        console.log(
          "[WalletPay.processPayment] Completando Apple Pay com sucesso:",
          processorResult.success
        );
        await this.completeApplePayment(processorResult.success);
      }

      console.log(
        "[WalletPay.processPayment] Processo finalizado com sucesso:",
        processorResult
      );
      return processorResult;
    } catch (error) {
      console.error("[WalletPay.processPayment] Erro capturado:", error);

      // Try to complete payment as failed if it was started
      try {
        if (Platform.OS === "ios") {
          console.log(
            "[WalletPay.processPayment] Completando Apple Pay como falha..."
          );
          await this.completeApplePayment(false);
        }
      } catch (completeError) {
        console.warn(
          "[WalletPay.processPayment] Erro ao completar pagamento como falha:",
          completeError
        );
      }

      throw error;
    }
  }
}

const walletPay = new WalletPay();

// Import and re-export hooks
export { useWalletPay, useQuickPay } from "./hooks/useWalletPay";

// Export both the class and instance
export { WalletPay };
export default walletPay;
