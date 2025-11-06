# Resolução: "Module does not exist in the Haste module map"

## Problema
O erro indica que o módulo `react-native-wallet-pay` não está sendo encontrado durante o build iOS.

## Soluções por Ordem de Prioridade

### 1. Verificar instalação da biblioteca
```bash
cd /Users/mitch/Documents/Pigz/WalletLibTestApp

# Verificar se a biblioteca está instalada
ls node_modules/react-native-wallet-pay

# Se não estiver, instalar
npm install react-native-wallet-pay@1.0.10
```

### 2. Limpar cache completo
```bash
# Limpar cache do Metro
npx react-native start --reset-cache

# Limpar cache do npm/yarn
npm start -- --reset-cache
# ou
yarn start --reset-cache

# Limpar cache do Xcode
cd ios
rm -rf ~/Library/Developer/Xcode/DerivedData/WalletLibTestApp*
```

### 3. Reinstalar pods (iOS)
```bash
cd ios
rm -rf Pods/
rm Podfile.lock
pod install --repo-update
cd ..
```

### 4. Verificar autolinking
```bash
# Verificar se a biblioteca foi detectada
npx react-native config

# Deve mostrar react-native-wallet-pay na lista de dependências
```

### 5. Verificar no Podfile.lock
Depois do `pod install`, verifique se existe:
```
- RNReactNativeWalletPay (1.0.10):
```

### 6. Verificar workspace do Xcode
Certifique-se de estar abrindo o arquivo correto:
- ✅ `WalletLibTestApp.xcworkspace` (correto)
- ❌ `WalletLibTestApp.xcodeproj` (incorreto)

### 7. Se ainda não funcionar - linking manual iOS

No `ios/Podfile`, adicione:
```ruby
pod 'RNReactNativeWalletPay', :path => '../node_modules/react-native-wallet-pay'
```

### 8. Verificar importação no código
Certifique-se que a importação está correta:
```javascript
// ✅ Correto
import WalletPay, { useWalletPay } from 'react-native-wallet-pay';

// ❌ Incorreto
import WalletPay from 'react-native-wallet-pay/index';
```

## Comandos Completos para Reset Total

Se nada funcionar, execute essa sequência completa:

```bash
cd /Users/mitch/Documents/Pigz/WalletLibTestApp

# 1. Limpar instalação
rm -rf node_modules/
rm package-lock.json
# ou rm yarn.lock

# 2. Reinstalar dependências
npm install
# ou yarn install

# 3. Limpar iOS
cd ios
rm -rf Pods/
rm Podfile.lock
pod install --repo-update
cd ..

# 4. Limpar cache
npx react-native start --reset-cache

# 5. Build limpo
npx react-native run-ios
```

## Verificação Final

Depois de seguir os passos, verifique:

1. `node_modules/react-native-wallet-pay` existe
2. `ios/Pods/RNReactNativeWalletPay` existe
3. `ios/Podfile.lock` contém a biblioteca
4. Xcode está usando o `.xcworkspace`