import { NativeModules, Platform } from 'react-native';
import { renderHook, act } from './helpers/renderHook';
import { useWalletPay } from '../src/hooks/useWalletPay';

describe('useWalletPay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
  });

  it('checkAvailability updates state from native module', async () => {
    const { result } = renderHook(() => useWalletPay());

    await act(async () => {
      await result.current.checkAvailability();
    });

    expect(NativeModules.WalletPayModule.isWalletAvailable).toHaveBeenCalledTimes(
      1
    );
    expect(result.current.availability).toEqual({
      applePay: true,
      googlePay: false,
    });
    expect(result.current.isApplePayAvailable).toBe(true);
  });

  it('processPayment uses cached availability instead of re-checking', async () => {
    const { result } = renderHook(() => useWalletPay());

    await act(async () => {
      await result.current.checkAvailability();
    });

    const callsAfterCheck =
      NativeModules.WalletPayModule.isWalletAvailable.mock.calls.length;

    await act(async () => {
      await result.current.processPayment({
        applePay: {
          amount: 10,
          currencyCode: 'USD',
          countryCode: 'US',
          label: 'Item',
        },
      });
    });

    expect(
      NativeModules.WalletPayModule.isWalletAvailable.mock.calls.length
    ).toBe(callsAfterCheck);
    expect(NativeModules.WalletPayModule.requestApplePayment).toHaveBeenCalled();
  });

  it('processPayment refreshes availability when requested', async () => {
    const { result } = renderHook(() => useWalletPay());

    await act(async () => {
      await result.current.checkAvailability();
    });

    const callsAfterCheck =
      NativeModules.WalletPayModule.isWalletAvailable.mock.calls.length;

    await act(async () => {
      await result.current.processPayment(
        {
          applePay: {
            amount: 10,
            currencyCode: 'USD',
            countryCode: 'US',
            label: 'Item',
          },
        },
        { refreshAvailability: true }
      );
    });

    expect(
      NativeModules.WalletPayModule.isWalletAvailable.mock.calls.length
    ).toBeGreaterThan(callsAfterCheck);
  });
});
