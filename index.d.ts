export declare const COUNTRIES: {
  AE: 'AE';
  BH: 'BH';
  KW: 'KW';
  OM: 'OM';
  QA: 'QA';
  SA: 'SA';
  US: 'US';
  GB: 'GB';
  IN: 'IN';
  CA: 'CA';
  AU: 'AU';
  DE: 'DE';
  FR: 'FR';
  SG: 'SG';
  BR: 'BR';
};

export declare const CURRENCIES: {
  AED: 'AED';
  BHD: 'BHD';
  KWD: 'KWD';
  OMR: 'OMR';
  QAR: 'QAR';
  SAR: 'SAR';
  GBP: 'GBP';
  USD: 'USD';
  INR: 'INR';
  CAD: 'CAD';
  AUD: 'AUD';
  EUR: 'EUR';
  SGD: 'SGD';
  BRL: 'BRL';
};

export declare const PAYMENT_NETWORKS: {
  VISA: 'visa';
  MASTERCARD: 'masterCard';
  AMEX: 'amex';
  DISCOVER: 'discover';
  JCB: 'jcb';
  MADA: 'mada';
  MAESTRO: 'maestro';
  ELECTRON: 'electron';
  VPAY: 'vPay';
  CHINA_UNION_PAY: 'chinaUnionPay';
  INTERAC: 'interac';
  ELO: 'elo';
  CARTES_BANCAIRES: 'cartesBancaires';
};

export declare const PAYMENT_PROVIDERS: {
  APPLE_PAY: 'applePay';
  GOOGLE_PAY: 'googlePay';
};

export declare const ERROR_CODES: {
  PAYMENT_CANCELLED: 'PAYMENT_CANCELLED';
  PAYMENT_REJECTED: 'PAYMENT_REJECTED';
  PAYMENT_NOT_AVAILABLE: 'PAYMENT_NOT_AVAILABLE';
  INVALID_PARAMS: 'INVALID_PARAMS';
  PLATFORM_NOT_SUPPORTED: 'PLATFORM_NOT_SUPPORTED';
};

export interface PaymentAvailability {
  applePay: boolean;
  googlePay: boolean;
}

export interface ApplePayConfig {
  amount: number;
  currencyCode: string;
  countryCode: string;
  label: string;
  supportedNetworks?: string[];
}

export interface GooglePayConfig {
  // TODO: Define Google Pay configuration interface
  [key: string]: any;
}

export interface PaymentToken {
  paymentData: any;
  transactionIdentifier: string;
  paymentMethod: {
    displayName: string;
    network: string;
    type: number;
  };
}

export interface PaymentResult {
  status: 'success' | 'failure';
  token?: PaymentToken;
}

export interface PaymentProcessorData {
  provider: string;
  token: PaymentToken;
  config: ApplePayConfig | GooglePayConfig;
}

export interface PaymentProcessorResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export type PaymentProcessor = (data: PaymentProcessorData) => Promise<PaymentProcessorResult>;

export interface WalletPayConfig {
  applePay?: ApplePayConfig;
  googlePay?: GooglePayConfig;
}

export interface UseWalletPayOptions {
  onPaymentSuccess?: (result: PaymentProcessorResult) => void;
  onPaymentError?: (error: Error) => void;
  paymentProcessor?: PaymentProcessor;
}

export interface UseWalletPayReturn {
  isLoading: boolean;
  availability: PaymentAvailability;
  isChecking: boolean;
  checkAvailability: () => Promise<PaymentAvailability>;
  processPayment: (config: WalletPayConfig) => Promise<{ success: boolean; result?: any; error?: Error }>;
  processApplePayment: (config: ApplePayConfig) => Promise<{ success: boolean; result?: any; error?: Error }>;
  processGooglePayment: (config: GooglePayConfig) => Promise<{ success: boolean; result?: any; error?: Error }>;
  showPaymentError: (title?: string, message?: string) => void;
  isApplePayAvailable: boolean;
  isGooglePayAvailable: boolean;
  isAnyPaymentAvailable: boolean;
}

export interface UseQuickPayReturn {
  quickPay: (config: Partial<WalletPayConfig>, processor?: PaymentProcessor) => Promise<PaymentProcessorResult>;
  isProcessing: boolean;
}

export declare class WalletPay {
  constructor();

  isAvailable(): Promise<PaymentAvailability>;
  canMakeApplePayments(): Promise<boolean>;
  requestApplePayment(config: ApplePayConfig): Promise<PaymentResult>;
  completeApplePayment(success?: boolean): Promise<void>;
  processPayment(config: WalletPayConfig, processor?: PaymentProcessor): Promise<PaymentProcessorResult>;
}

export declare function useWalletPay(options?: UseWalletPayOptions): UseWalletPayReturn;

export declare function useQuickPay(defaultConfig?: Partial<WalletPayConfig>): UseQuickPayReturn;

declare const walletPay: WalletPay;
export default walletPay;