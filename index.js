import { NativeModules, Platform } from "react-native";

const { WalletPayModule } = NativeModules;

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

  async isAvailable() {
    try {
      if (Platform.OS === "ios" && WalletPayModule) {
        return await WalletPayModule.isWalletAvailable();
      }

      return { applePay: false, googlePay: false };
    } catch (error) {
      return { applePay: false, googlePay: false };
    }
  }

  async canMakeApplePayments() {
    try {
      if (Platform.OS !== "ios") {
        return false;
      }
      return await WalletPayModule.canMakeApplePayments();
    } catch (error) {
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
      return await WalletPayModule.canMakeApplePaymentsWithCards(
        supportedNetworks
      );
    } catch (error) {
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

      // Verificação básica (dispositivo + qualquer cartão)
      const canMakePayments = await WalletPayModule.canMakeApplePayments();

      // Verificação específica para redes suportadas
      let hasCardsForNetworks = false;
      try {
        hasCardsForNetworks =
          await WalletPayModule.canMakeApplePaymentsWithCards(
            supportedNetworks
          );
      } catch (error) {
        // Se o método específico falhar, use a verificação básica
        hasCardsForNetworks = canMakePayments;
      }

      let message = "";
      if (!canMakePayments) {
        message =
          "Apple Pay não disponível (dispositivo não suporta ou sem cartões na Wallet)";
      } else if (!hasCardsForNetworks) {
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
        available: canMakePayments, // Usar a verificação mais permissiva
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
    return new Promise(async (resolve, reject) => {
      try {
        if (Platform.OS !== "ios") {
          reject(new Error("Apple Pay is only available on iOS"));
          return;
        }

        if (!WalletPayModule) {
          reject(new Error("Apple Pay module not available"));
          return;
        }

        // Validate required parameters
        if (!config.amount || !config.currencyCode || !config.countryCode) {
          reject(
            new Error(
              "Missing required parameters: amount, currencyCode, countryCode"
            )
          );
          return;
        }

        const paymentRequest = {
          supportedNetworks: config.supportedNetworks || this.defaultNetworks,
          countryCode: config.countryCode,
          currencyCode: config.currencyCode,
          label: config.label || "Payment",
          amount: config.amount.toString(),
        };

        const result = await WalletPayModule.requestApplePayment(
          paymentRequest
        );
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
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

  // Generic payment method that works with any gateway
  async processPayment(config, paymentProcessor) {
    try {
      // Check availability
      const availability = await this.isAvailable();

      if (!availability.applePay && !availability.googlePay) {
        throw new Error("No wallet payment methods available");
      }

      // This method is not fully implemented yet
      throw new Error("processPayment method not fully implemented");
    } catch (error) {
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
