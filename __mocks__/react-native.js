const walletPayModule = {
  isWalletAvailable: jest.fn(async () => ({
    applePay: true,
    googlePay: false,
  })),
  canMakeApplePayments: jest.fn(async () => true),
  canMakePayments: jest.fn(async () => true),
  canMakeApplePaymentsWithCards: jest.fn(async () => true),
  getApplePayDiagnostics: jest.fn(async () => ({
    platform: 'ios',
    canMakePayments: true,
    hasCardsForNetworks: true,
    available: true,
    message: 'ok',
  })),
  requestApplePayment: jest.fn(async () => ({
    success: true,
    token: {
      paymentData: { data: 'encrypted' },
      transactionIdentifier: 'tx-1',
      paymentMethod: {
        displayName: 'Visa 1234',
        network: 'Visa',
        type: 0,
      },
    },
  })),
  completeApplePayment: jest.fn(async () => true),
  requestGooglePayment: jest.fn(async () => ({
    success: true,
    token: {
      paymentData: '{"apiVersion":2}',
      transactionIdentifier: 'gpay-1',
      paymentMethod: {
        displayName: 'Visa 4242',
        network: 'VISA',
        type: 'CARD',
      },
    },
  })),
  processGooglePayPayment: jest.fn(async () => ({
    success: true,
    token: {
      paymentData: '{"apiVersion":2}',
      transactionIdentifier: 'gpay-1',
      paymentMethod: {
        displayName: 'Visa 4242',
        network: 'VISA',
        type: 'CARD',
      },
    },
  })),
};

const NativeModules = {
  WalletPayModule: walletPayModule,
};

const Platform = {
  OS: 'ios',
  select: (spec) => (spec[Platform.OS] !== undefined ? spec[Platform.OS] : spec.default),
};

const Alert = {
  alert: jest.fn(),
};

module.exports = {
  NativeModules,
  Platform,
  Alert,
};
