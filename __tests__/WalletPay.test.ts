import { NativeModules, Platform } from 'react-native';
import { WalletPay } from '../src/WalletPay';

describe('WalletPay', () => {
  const walletPay = new WalletPay();

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
  });

  it('isAvailable delegates to the native module', async () => {
    const result = await walletPay.isAvailable();
    expect(NativeModules.WalletPayModule.isWalletAvailable).toHaveBeenCalled();
    expect(result).toEqual({ applePay: true, googlePay: false });
  });

  it('does not expose isWalletAvailable on the JS class', () => {
    expect((walletPay as unknown as { isWalletAvailable?: unknown }).isWalletAvailable).toBeUndefined();
  });

  it('does not expose testApplePaySetup on the JS class', () => {
    expect((walletPay as unknown as { testApplePaySetup?: unknown }).testApplePaySetup).toBeUndefined();
  });

  it('requestApplePayment validates required fields', async () => {
    await expect(
      walletPay.requestApplePayment({
        amount: '',
        currencyCode: 'USD',
        countryCode: 'US',
        label: 'Test',
      })
    ).rejects.toThrow(/Missing required parameters/);
  });

  it('processPayment uses cached availability when provided', async () => {
    const isAvailableSpy = jest.spyOn(walletPay, 'isAvailable');
    const requestSpy = jest.spyOn(walletPay, 'requestApplePayment');

    await walletPay.processPayment(
      {
        applePay: {
          amount: 10,
          currencyCode: 'USD',
          countryCode: 'US',
          label: 'Item',
        },
      },
      undefined,
      { applePay: true, googlePay: false }
    );

    expect(isAvailableSpy).not.toHaveBeenCalled();
    expect(requestSpy).toHaveBeenCalled();
  });
});
