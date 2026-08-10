# react-native-wallet-pay

[![npm version](https://img.shields.io/npm/v/react-native-wallet-pay.svg)](https://www.npmjs.com/package/react-native-wallet-pay)
[![CI](https://github.com/mitchelson/react-native-wallet-pay/actions/workflows/ci.yml/badge.svg)](https://github.com/mitchelson/react-native-wallet-pay/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/react-native-wallet-pay.svg)](./LICENSE)

Gateway-agnostic **Apple Pay** and **Google Pay** for React Native.

This library only collects a wallet payment token. Your backend / PSP (Stripe, Adyen, PagSeguro, Braintree, etc.) charges the customer.

## Features

- Apple Pay (iOS) via PassKit
- Google Pay (Android) via Play Services Wallet
- Gateway-agnostic `paymentProcessor` callback
- React hook (`useWalletPay`) and imperative API
- TypeScript-first (`lib/` + generated `.d.ts`)
- Autolinking for React Native ≥ 0.60

## Requirements

| Platform | Notes |
| --- | --- |
| React Native | ≥ 0.60 (autolinking) |
| iOS | ≥ 11, Apple Pay capability + Merchant ID |
| Android | minSdk 21+, Google Play Services, Google Pay enabled in manifest |
| Expo | Bare workflow / development builds only — **not** Expo Go |

## Installation

```bash
npm install react-native-wallet-pay
# or
yarn add react-native-wallet-pay
```

### iOS

```bash
cd ios && pod install && cd ..
```

Enable Apple Pay in Xcode:

1. Target → **Signing & Capabilities** → **+ Capability** → **Apple Pay**
2. Select / create your Merchant ID (`merchant.com.yourapp`)

Optional fallback in `Info.plist` (auto-detected if entitlements are missing):

```xml
<key>ApplePayMerchantIdentifier</key>
<string>merchant.com.yourapp</string>
```

Without a Merchant ID, `isAvailable()` returns `applePay: false` and payments fail with `E_MERCHANT_ID_NOT_FOUND`.

### Android

Autolinking registers the native module. Add this inside the `<application>` tag of your app `AndroidManifest.xml`:

```xml
<meta-data
  android:name="com.google.android.gms.wallet.api.enabled"
  android:value="true" />
```

For Google Pay test cards, join the [Google Pay API Test Cards Allowlist](https://groups.google.com/g/googlepay-test-mode-stub-data).

## Quick start

```tsx
import React, { useEffect } from 'react';
import { Button } from 'react-native';
import {
  useWalletPay,
  COUNTRIES,
  CURRENCIES,
  PAYMENT_NETWORKS,
} from 'react-native-wallet-pay';

export function Checkout() {
  const {
    checkAvailability,
    processPayment,
    isApplePayAvailable,
    isGooglePayAvailable,
    isLoading,
  } = useWalletPay({
    paymentProcessor: async ({ provider, token, config }) => {
      const res = await fetch('https://api.yourapp.com/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          token,
          amount: config.amount,
        }),
      });
      const data = await res.json();
      return { success: !!data.ok, transactionId: data.id };
    },
  });

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  return (
    <Button
      title={isLoading ? 'Processing…' : 'Pay'}
      disabled={isLoading || (!isApplePayAvailable && !isGooglePayAvailable)}
      onPress={() =>
        processPayment({
          applePay: {
            amount: 29.9,
            currencyCode: CURRENCIES.BRL,
            countryCode: COUNTRIES.BR,
            label: 'Order #123',
            supportedNetworks: [
              PAYMENT_NETWORKS.VISA,
              PAYMENT_NETWORKS.MASTERCARD,
            ],
          },
          googlePay: {
            amount: 29.9,
            currencyCode: CURRENCIES.BRL,
            countryCode: COUNTRIES.BR,
            label: 'Order #123',
            environment: 'TEST',
            tokenizationSpecification: {
              type: 'PAYMENT_GATEWAY',
              gateway: 'stripe',
              gatewayMerchantId: 'acct_xxx',
            },
            merchantInfo: { merchantName: 'Your Store' },
          },
        })
      }
    />
  );
}
```

See [`example/PaymentExample.js`](./example/PaymentExample.js) for a fuller checkout UI.

## Imperative API

```ts
import WalletPay, { COUNTRIES, CURRENCIES } from 'react-native-wallet-pay';

const availability = await WalletPay.isAvailable();
// { applePay: boolean, googlePay: boolean }

await WalletPay.processPayment(
  {
    applePay: {
      amount: '10.00',
      currencyCode: CURRENCIES.USD,
      countryCode: COUNTRIES.US,
      label: 'Coffee',
    },
  },
  async ({ provider, token }) => {
    // send token to your backend
    return { success: true, transactionId: 'txn_123' };
  }
);
```

## API

| API | Description |
| --- | --- |
| `useWalletPay(options)` | Hook with loading/availability state and payment helpers |
| `WalletPay.isAvailable()` | `{ applePay, googlePay }` |
| `WalletPay.processPayment(config, processor?)` | Full flow; completes Apple Pay after the processor returns |
| `WalletPay.requestApplePayment(config)` | Low-level Apple Pay sheet |
| `WalletPay.requestGooglePayment(config)` | Low-level Google Pay sheet |
| `WalletPay.getApplePayDiagnostics(networks?)` | iOS setup diagnostics |

`useWalletPay().processPayment` uses **cached** availability. Pass `{ refreshAvailability: true }` to force a native re-check.

### `GooglePayConfig` (required fields)

```ts
{
  amount: number | string;
  currencyCode: string;
  countryCode: string;
  environment?: 'TEST' | 'PRODUCTION'; // default TEST
  tokenizationSpecification: {
    type: 'PAYMENT_GATEWAY' | 'DIRECT';
    gateway?: string;           // e.g. 'stripe'
    gatewayMerchantId?: string; // gateway account id
    publicKey?: string;         // DIRECT only
  };
  merchantInfo?: { merchantId?: string; merchantName?: string };
  allowedCardNetworks?: Array<'VISA' | 'MASTERCARD' | 'AMEX' | ...>;
}
```

Use `environment: 'TEST'` while integrating. Switch to `PRODUCTION` only after Google Pay production access is approved.

## Expo

Works with **Expo bare / prebuild / development builds** (native modules required).

```bash
npx expo install react-native-wallet-pay
npx expo prebuild
```

Then configure Apple Pay entitlements and the Google Pay manifest meta-data as above. It will **not** run inside Expo Go.

## Troubleshooting

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — autolinking / Haste map / pods
- Optional Apple Pay debug helper (not part of the public API):

```ts
import { testApplePaySetup } from 'react-native-wallet-pay/lib/diagnostics/testApplePaySetup';
```

## Example app

```bash
yarn example:ios
yarn example:android
```

## Contributing

```bash
yarn install
yarn build
yarn lint
yarn typecheck
yarn test
```

Releases are published from GitHub Actions via [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/) when a GitHub Release is created (see [CHANGELOG.md](./CHANGELOG.md)).

## License

MIT © [Mitchelson Silva](https://github.com/mitchelson)
