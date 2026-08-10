export interface PaymentAvailability {
  applePay: boolean;
  googlePay: boolean;
}

export interface ApplePayConfig {
  amount: number | string;
  currencyCode: string;
  countryCode: string;
  label: string;
  supportedNetworks?: string[];
}

export interface ApplePayDiagnostics {
  platform: 'ios' | 'android' | string;
  canMakePayments: boolean;
  hasCardsForNetworks: boolean;
  available: boolean;
  merchantId?: string | null;
  supportedNetworks?: string[];
  message: string;
  error?: string;
}

/**
 * Google Pay configuration passed to the native PaymentsClient.
 * Maps closely to Google Pay API PaymentDataRequest fields.
 * @see https://developers.google.com/pay/api/android/reference/request-objects
 */
export interface GooglePayConfig {
  amount: number | string;
  currencyCode: string;
  countryCode: string;
  /** Merchant / gateway display name shown on the payment sheet */
  label?: string;
  /**
   * Google Pay environment.
   * Defaults to TEST when omitted.
   */
  environment?: 'TEST' | 'PRODUCTION';
  /**
   * Gateway tokenization parameters for your payment processor.
   * Example: { gateway: 'stripe', gatewayMerchantId: 'acct_xxx' }
   */
  tokenizationSpecification: {
    type: 'PAYMENT_GATEWAY' | 'DIRECT';
    gateway?: string;
    gatewayMerchantId?: string;
    /** DIRECT tokenization public key (base64) when type is DIRECT */
    publicKey?: string;
  };
  /** Google Pay merchant info */
  merchantInfo?: {
    merchantId?: string;
    merchantName?: string;
  };
  allowedCardNetworks?: Array<
    'AMEX' | 'DISCOVER' | 'JCB' | 'MASTERCARD' | 'VISA' | 'INTERAC' | 'ELO'
  >;
  allowedCardAuthMethods?: Array<'PAN_ONLY' | 'CRYPTOGRAM_3DS'>;
  /**
   * When true, isReadyToPay requires an existing payment method.
   * Defaults to false.
   */
  existingPaymentMethodRequired?: boolean;
  /** Extra Google Pay PaymentDataRequest fields merged into the request */
  paymentDataRequestOverrides?: Record<string, unknown>;
}

/**
 * Encrypted payment payload returned by Apple Pay / Google Pay.
 * Shape differs by provider; gateways typically expect the raw paymentData.
 */
export type ApplePayPaymentData = {
  /** Base64 / UTF-8 encoded PKPaymentToken.paymentData */
  data?: string;
  version?: string;
  signature?: string;
  header?: {
    ephemeralPublicKey?: string;
    publicKeyHash?: string;
    transactionId?: string;
    applicationData?: string;
  };
  [key: string]: unknown;
};

export type GooglePayPaymentData = {
  apiVersion?: number;
  apiVersionMinor?: number;
  paymentMethodData?: {
    type?: string;
    description?: string;
    info?: {
      cardNetwork?: string;
      cardDetails?: string;
      billingAddress?: Record<string, unknown>;
    };
    tokenizationData?: {
      type?: string;
      token?: string;
    };
  };
  email?: string;
  shippingAddress?: Record<string, unknown>;
  [key: string]: unknown;
};

export interface PaymentToken {
  /**
   * Provider-specific payment payload.
   * - Apple Pay: encrypted PKPaymentToken fields / raw token string
   * - Google Pay: PaymentData JSON (incl. tokenizationData.token)
   */
  paymentData: ApplePayPaymentData | GooglePayPaymentData | string;
  transactionIdentifier: string;
  paymentMethod: {
    displayName: string;
    network: string;
    type: number | string;
  };
  /** Convenience raw token string when available */
  token?: string;
  transactionId?: string;
  paymentMethodType?: string;
  brand?: string;
  amount?: string;
  currency?: string;
}

export interface PaymentResult {
  status?: 'success' | 'failure';
  success?: boolean;
  cancelled?: boolean;
  token?: PaymentToken;
  transactionId?: string;
}

export interface PaymentProcessorData {
  provider: 'applePay' | 'googlePay' | string;
  token: PaymentToken;
  config: ApplePayConfig | GooglePayConfig;
}

export interface PaymentProcessorResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export type PaymentProcessor = (
  data: PaymentProcessorData
) => Promise<PaymentProcessorResult>;

export interface WalletPayConfig {
  applePay?: ApplePayConfig;
  googlePay?: GooglePayConfig;
}

export interface UseWalletPayOptions {
  onPaymentSuccess?: (result: PaymentProcessorResult | Record<string, unknown>) => void;
  onPaymentError?: (error: Error) => void;
  paymentProcessor?: PaymentProcessor;
}

export interface ProcessPaymentOptions {
  /**
   * Force a fresh native availability check.
   * When false/omitted, uses the cached `availability` state from the hook.
   */
  refreshAvailability?: boolean;
}

export interface UseWalletPayReturn {
  isLoading: boolean;
  availability: PaymentAvailability;
  isChecking: boolean;
  checkAvailability: () => Promise<PaymentAvailability>;
  getDiagnostics: (
    supportedNetworks?: string[]
  ) => Promise<ApplePayDiagnostics>;
  processPayment: (
    config: WalletPayConfig,
    options?: ProcessPaymentOptions
  ) => Promise<{ success: boolean; result?: unknown; error?: Error }>;
  processApplePayment: (
    config: ApplePayConfig
  ) => Promise<{ success: boolean; result?: unknown; error?: Error }>;
  processGooglePayment: (
    config: GooglePayConfig
  ) => Promise<{ success: boolean; result?: unknown; error?: Error }>;
  showPaymentError: (title?: string, message?: string) => void;
  isApplePayAvailable: boolean;
  isGooglePayAvailable: boolean;
  isAnyPaymentAvailable: boolean;
}

export interface UseQuickPayReturn {
  quickPay: (
    config: Partial<WalletPayConfig> & Partial<ApplePayConfig> & Partial<GooglePayConfig>,
    processor?: PaymentProcessor
  ) => Promise<PaymentProcessorResult | Record<string, unknown>>;
  isProcessing: boolean;
}

/** Shape of the canonical native module (WalletPayModule). */
export interface WalletPayNativeModule {
  isWalletAvailable(): Promise<PaymentAvailability>;
  isApplePayAvailable?(): Promise<boolean>;
  isGooglePayAvailable?(): Promise<boolean>;
  canMakePayments?(): Promise<boolean>;
  canMakeApplePayments?(): Promise<boolean>;
  canMakeApplePaymentsWithCards?(supportedNetworks: string[]): Promise<boolean>;
  getApplePayDiagnostics?(
    supportedNetworks: string[]
  ): Promise<ApplePayDiagnostics>;
  requestApplePayment?(config: Record<string, unknown>): Promise<PaymentResult>;
  completeApplePayment?(success: boolean): Promise<boolean | void>;
  requestGooglePayment?(config: Record<string, unknown>): Promise<PaymentResult>;
  processGooglePayPayment?(
    config: Record<string, unknown>
  ): Promise<PaymentResult>;
}
