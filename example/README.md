# Example

Componente de demonstração da biblioteca (`PaymentExample.js`).

## Como usar

1. Em um app React Native (ou Expo bare), instale o pacote localmente:

```bash
yarn add file:../
# ou no monorepo / path mapping, importe de `react-native-wallet-pay`
```

2. Copie ou importe o exemplo:

```js
import PaymentExample from 'react-native-wallet-pay/example/PaymentExample';
```

Ou, neste repositório, o exemplo importa o build local:

```js
import { useWalletPay } from '../lib';
```

3. Configure:

- **iOS:** Apple Pay capability + Merchant ID
- **Android:** meta-data `com.google.android.gms.wallet.api.enabled` e um `tokenizationSpecification` real do seu gateway

4. Rode:

```bash
yarn example:ios
yarn example:android
```

O botão **Pagar (auto)** usa `processPayment` com a disponibilidade em cache (sem re-checar o nativo a cada toque).
