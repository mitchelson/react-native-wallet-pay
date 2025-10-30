import { NativeModules, Platform } from "react-native";

const { RNReactNativeWalletPay, WalletPayModule } = NativeModules;

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
      if (RNReactNativeWalletPay && RNReactNativeWalletPay.isWalletAvailable) {
        return await RNReactNativeWalletPay.isWalletAvailable();
      }

      if (Platform.OS === "ios" && WalletPayModule) {
        const applePay = await WalletPayModule.canMakeApplePayments();
        return { applePay, googlePay: false };
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
        if (
          !config.merchantIdentifier ||
          !config.amount ||
          !config.currencyCode ||
          !config.countryCode
        ) {
          reject(
            new Error(
              "Missing required parameters: merchantIdentifier, amount, currencyCode, countryCode"
            )
          );
          return;
        }

        const paymentRequest = {
          merchantIdentifier: config.merchantIdentifier,
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

      let paymentResult = null;

      // Try Apple Pay first on iOS
      if (Platform.OS === "ios" && availability.applePay && config.applePay) {
        try {
          paymentResult = await this.requestApplePayment(config.applePay);

          // Process payment with the provided processor
          if (paymentProcessor && typeof paymentProcessor === "function") {
            const processingResult = await paymentProcessor({
              provider: PAYMENT_PROVIDERS.APPLE_PAY,
              token: paymentResult.token,
              config: config.applePay,
            });

            // Complete the payment
            await this.completeApplePayment(processingResult.success);
            return processingResult;
          }

          // If no processor provided, just return the token
          await this.completeApplePayment(true);
          return {
            success: true,
            provider: PAYMENT_PROVIDERS.APPLE_PAY,
            token: paymentResult.token,
          };
        } catch (error) {
          await this.completeApplePayment(false);
          throw error;
        }
      }

      // TODO: Add Google Pay support for Android
      if (
        Platform.OS === "android" &&
        availability.googlePay &&
        config.googlePay
      ) {
        throw new Error("Google Pay support coming soon");
      }

      throw new Error("No suitable payment method available");
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
