# react-native-wallet-pay

Biblioteca agnóstica de gateway para **Apple Pay** e **Google Pay** em React Native. O pacote obtém o token da carteira; o processamento fica no seu backend / PSP (Stripe, Adyen, PagSeguro, etc.).

## Instalação

```bash
npm install react-native-wallet-pay
# ou
yarn add react-native-wallet-pay
```

### iOS

```bash
cd ios && pod install && cd ..
```

### Android

Autolinking cuida do pacote. No `AndroidManifest.xml` do app, dentro de `<application>`, adicione:

```xml
<meta-data
  android:name="com.google.android.gms.wallet.api.enabled"
  android:value="true" />
```

## Configuração do merchantIdentifier (iOS)

O módulo detecta o Merchant ID automaticamente:

1. **Preferencial:** Xcode → Target → *Signing & Capabilities* → *Apple Pay* (entitlement `com.apple.developer.in-app-payments`)
2. **Fallback:** chave `ApplePayMerchantIdentifier` no `Info.plist`

```xml
<key>ApplePayMerchantIdentifier</key>
<string>merchant.com.seuapp</string>
```

Sem Merchant ID configurado, `isAvailable()` retorna `applePay: false` e o pagamento falha com `E_MERCHANT_ID_NOT_FOUND`.

## Uso básico

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
      // Envie o token ao seu backend / gateway
      const res = await fetch('https://api.seuapp.com/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, token, amount: config.amount }),
      });
      const data = await res.json();
      return { success: data.ok, transactionId: data.id };
    },
    onPaymentSuccess: (result) => console.log('OK', result),
    onPaymentError: (error) => console.error(error),
  });

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  return (
    <Button
      title={isLoading ? 'Processando…' : 'Pagar'}
      disabled={isLoading || (!isApplePayAvailable && !isGooglePayAvailable)}
      onPress={() =>
        processPayment({
          applePay: {
            amount: 29.9,
            currencyCode: CURRENCIES.BRL,
            countryCode: COUNTRIES.BR,
            label: 'Pedido #123',
            supportedNetworks: [
              PAYMENT_NETWORKS.VISA,
              PAYMENT_NETWORKS.MASTERCARD,
            ],
          },
          googlePay: {
            amount: 29.9,
            currencyCode: CURRENCIES.BRL,
            countryCode: COUNTRIES.BR,
            label: 'Pedido #123',
            environment: 'TEST',
            tokenizationSpecification: {
              type: 'PAYMENT_GATEWAY',
              gateway: 'stripe',
              gatewayMerchantId: 'acct_xxx',
            },
            merchantInfo: { merchantName: 'Sua Loja' },
          },
        })
      }
    />
  );
}
```

### API principal

| API | Descrição |
| --- | --- |
| `isAvailable()` | `{ applePay, googlePay }` |
| `processPayment(config, processor?)` | Fluxo completo + callback de gateway |
| `useWalletPay(options)` | Hook com estado, loading e helpers |
| `requestApplePayment` / `requestGooglePayment` | Chamadas de baixo nível |

`processPayment` no hook usa a disponibilidade em cache. Passe `{ refreshAvailability: true }` para forçar uma nova checagem nativa.

## Google Pay

Requer um `tokenizationSpecification` do seu gateway (ou `DIRECT` com chave pública). Em desenvolvimento use `environment: 'TEST'`.

Consulte a [documentação do Google Pay](https://developers.google.com/pay/api/android/overview) para registrar o merchant e o gateway.

## Expo

Compatível com **Expo bare workflow** / **development builds** (CNG), porque depende de código nativo (PassKit + Play Services Wallet).

- Não funciona no **Expo Go**
- Após instalar: `npx expo prebuild` (se aplicável) e configure Apple Pay capabilities / meta-data do Google Pay como acima

## Exemplo

Veja `example/PaymentExample.js` para um componente completo de checkout (Apple Pay + Google Pay).

```bash
yarn example:ios
yarn example:android
```

## Diagnóstico (opcional)

O helper de debug **não** faz parte da API pública:

```ts
import { testApplePaySetup } from 'react-native-wallet-pay/lib/diagnostics/testApplePaySetup';
```

## Desenvolvimento

```bash
yarn install
yarn build
yarn lint
yarn typecheck
yarn test
```

## Publicação no npm (Trusted Publishing)

O workflow [`.github/workflows/publish.yml`](.github/workflows/publish.yml) publica via **npm Trusted Publishing** (OIDC) — sem `NPM_TOKEN` / Automation token.

### Setup (uma vez) no npmjs.com

1. Abra o pacote → **Settings** → **Trusted Publisher**
2. Provider: **GitHub Actions**
3. Preencha:
   - **Organization or user:** `mitchelson`
   - **Repository:** `react-native-wallet-pay`
   - **Workflow filename:** `publish.yml` (só o nome do arquivo)
   - **Environment name:** deixe vazio (não usamos GitHub Environment)
4. Allowed action: **npm publish**
5. Salve

Não é necessário criar Access Token nem secret no GitHub.

### Publicar uma versão

1. Atualize `version` no `package.json` e o `CHANGELOG.md` na `master`
2. Crie e envie a tag:

```bash
git tag v1.1.0
git push origin v1.1.0
```

3. No GitHub: **Releases → Draft a new release** → tag `v1.1.0` → **Publish release**
4. O Action autentica via OIDC, gera provenance e publica

A versão no `package.json` precisa coincidir com a tag (`v1.1.0` ↔ `1.1.0`).

## Licença

MIT
