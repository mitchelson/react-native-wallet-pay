export const COUNTRIES = {
  AE: 'AE',
  BH: 'BH',
  KW: 'KW',
  OM: 'OM',
  QA: 'QA',
  SA: 'SA',
  US: 'US',
  GB: 'GB',
  IN: 'IN',
  CA: 'CA',
  AU: 'AU',
  DE: 'DE',
  FR: 'FR',
  SG: 'SG',
  BR: 'BR',
} as const;

export const CURRENCIES = {
  AED: 'AED',
  BHD: 'BHD',
  KWD: 'KWD',
  OMR: 'OMR',
  QAR: 'QAR',
  SAR: 'SAR',
  GBP: 'GBP',
  USD: 'USD',
  INR: 'INR',
  CAD: 'CAD',
  AUD: 'AUD',
  EUR: 'EUR',
  SGD: 'SGD',
  BRL: 'BRL',
} as const;

export const PAYMENT_NETWORKS = {
  VISA: 'visa',
  MASTERCARD: 'masterCard',
  AMEX: 'amex',
  DISCOVER: 'discover',
  JCB: 'jcb',
  MADA: 'mada',
  MAESTRO: 'maestro',
  ELECTRON: 'electron',
  VPAY: 'vPay',
  CHINA_UNION_PAY: 'chinaUnionPay',
  INTERAC: 'interac',
  ELO: 'elo',
  CARTES_BANCAIRES: 'cartesBancaires',
} as const;

export const PAYMENT_PROVIDERS = {
  APPLE_PAY: 'applePay',
  GOOGLE_PAY: 'googlePay',
} as const;

export const ERROR_CODES = {
  PAYMENT_CANCELLED: 'PAYMENT_CANCELLED',
  PAYMENT_REJECTED: 'PAYMENT_REJECTED',
  PAYMENT_NOT_AVAILABLE: 'PAYMENT_NOT_AVAILABLE',
  INVALID_PARAMS: 'INVALID_PARAMS',
  PLATFORM_NOT_SUPPORTED: 'PLATFORM_NOT_SUPPORTED',
  E_MERCHANT_ID_NOT_FOUND: 'E_MERCHANT_ID_NOT_FOUND',
  E_INVALID_PARAMS: 'E_INVALID_PARAMS',
  E_PAYMENT_ERROR: 'E_PAYMENT_ERROR',
  APPLE_PAY_PAYMENT_REJECTED: 'APPLE_PAY_PAYMENT_REJECTED',
  GOOGLE_PAY_NOT_AVAILABLE: 'GOOGLE_PAY_NOT_AVAILABLE',
  GOOGLE_PAY_CANCELLED: 'GOOGLE_PAY_CANCELLED',
} as const;

/** Canonical native module name exported by iOS and Android. */
export const NATIVE_MODULE_NAME = 'WalletPayModule' as const;
