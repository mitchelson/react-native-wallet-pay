# Guia de Debug do Autolinking - React Native Wallet Pay

## Problemas Corrigidos na Biblioteca

1. **package.json**: Removido campo `react-native` incorreto
2. **react-native.config.js**: Corrigido paths e configurações
3. **podspec**: Atualizado para versão correta e melhor compatibilidade com autolinking

## Passos para Testar no Projeto WalletLibTestApp

### 1. Reinstalar a biblioteca
```bash
cd /Users/mitch/Documents/Pigz/WalletLibTestApp
npm uninstall react-native-wallet-pay
npm install react-native-wallet-pay@latest
```

### 2. Limpar cache e reinstalar pods (iOS)
```bash
# Limpar cache do React Native
npx react-native start --reset-cache

# Para iOS - limpar e reinstalar pods
cd ios
rm -rf Pods/
rm Podfile.lock
pod install
cd ..
```

### 3. Para Android - limpar build
```bash
cd android
./gradlew clean
cd ..
```

### 4. Verificar se o autolinking funcionou

#### iOS - Verificar no Podfile.lock
Depois do `pod install`, procure por:
```
- RNReactNativeWalletPay (x.x.x):
```

#### Android - Verificar no MainApplication.java/kt
O autolinking deve adicionar automaticamente o package. Se não funcionar, adicione manualmente:

```java
import com.reactlibrary.RNReactNativeWalletPayPackage;

// No método getPackages():
@Override
protected List<ReactPackage> getPackages() {
    return Arrays.asList(
        new MainReactPackage(),
        new RNReactNativeWalletPayPackage() // Adicione esta linha se necessário
    );
}
```

### 5. Testar a importação
```javascript
import WalletPay, { useWalletPay, PAYMENT_NETWORKS, COUNTRIES } from 'react-native-wallet-pay';

// Teste básico
WalletPay.isWalletAvailable()
  .then(result => console.log('Wallet availability:', result))
  .catch(error => console.error('Error:', error));
```

## Configuração do Apple Pay (iOS)

### No Xcode do seu projeto de teste:
1. Abra `WalletLibTestApp.xcworkspace`
2. Selecione o target do projeto
3. Vá para "Signing & Capabilities"
4. Clique em "+ Capability"
5. Adicione "Apple Pay"
6. Configure seu Merchant ID

### Ou adicione no Info.plist:
```xml
<key>ApplePayMerchantIdentifier</key>
<string>merchant.com.seudominio.app</string>
```

## Comandos de Debug

Se ainda não funcionar, execute estes comandos para diagnosticar:

```bash
# Verificar se a biblioteca foi linkada
npx react-native config

# Para iOS - verificar se o pod foi instalado
cd ios && pod list | grep RNReactNativeWalletPay

# Verificar logs durante o build
npx react-native run-ios --verbose
```

## Problemas Comuns e Soluções

### 1. "Module not found"
- Verifique se o `node_modules/react-native-wallet-pay` existe
- Reinstale com `npm install react-native-wallet-pay`
- Limpe o cache: `npx react-native start --reset-cache`

### 2. "Native module not found" (iOS)
- Execute `cd ios && pod install`
- Verifique se o `.xcworkspace` está sendo usado, não o `.xcodeproj`

### 3. "Class not found" (Android)
- Verifique se o package foi adicionado em `MainApplication.java`
- Execute `cd android && ./gradlew clean`

### 4. Apple Pay não funciona
- Verifique se o Merchant ID está configurado
- Confirme que está testando em dispositivo físico (simulador tem limitações)
- Verifique se há cartões configurados no Wallet do dispositivo