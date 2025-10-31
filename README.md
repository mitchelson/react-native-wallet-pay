# React Native Wallet Pay

Uma biblioteca agnóstica e robusta para integração de pagamentos com Apple Pay e Google Pay em aplicativos React Native, compatível com qualquer gateway de pagamento.

## 🚀 Características

- ✅ **Agnóstico ao Gateway**: Funciona com Stripe, PayPal, PagSeguro, ou qualquer outro processador
- ✅ **Apple Pay nativo**: Implementação completa usando PassKit
- 🔄 **Google Pay**: Em desenvolvimento
- 🎯 **TypeScript ready**: Totalmente tipado
- 🪝 **React Hooks**: Hooks personalizados para fácil integração
- 🔒 **Seguro**: Segue as melhores práticas de segurança da Apple e Google
- 📱 **Cross-platform**: iOS e Android (em desenvolvimento)

## 📦 Instalação

```bash
npm install react-native-wallet-pay --save
```

### Configuração iOS

1. **Adicione o framework PassKit** ao seu projeto iOS
2. **Configure seu Merchant ID** no Apple Developer Portal
3. **Configure Apple Pay no Xcode**:
   - Abra seu projeto no Xcode
   - Vá para **Signing & Capabilities**
   - Adicione a capability **Apple Pay**
   - Selecione seu Merchant ID

> ⚠️ **Importante**: A partir desta versão, o `merchantIdentifier` é obtido automaticamente das configurações do Xcode (arquivo .entitlements) e não precisa mais ser passado como parâmetro na configuração do pagamento.

### Configuração automática (React Native 0.60+)

```bash
cd ios && pod install
```

## 🎯 Uso Básico

### Hook Personalizado

```javascript
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useWalletPay, COUNTRIES, CURRENCIES } from "react-native-wallet-pay";

const PaymentScreen = () => {
  const { isLoading, processApplePayment, isApplePayAvailable } = useWalletPay({
    onPaymentSuccess: (result) => {
      console.log("Pagamento aprovado:", result);
    },
    onPaymentError: (error) => {
      console.error("Erro:", error);
    },
    paymentProcessor: async (paymentData) => {
      // Integração com seu gateway
      const response = await fetch("/api/process-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });
      return response.json();
    },
  });

  const handlePayment = () => {
    processApplePayment({
      amount: 99.99,
      currencyCode: CURRENCIES.USD,
      countryCode: COUNTRIES.US,
      label: "Produto Premium",
    });
  };

  return (
    <View>
      {isApplePayAvailable && (
        <TouchableOpacity onPress={handlePayment} disabled={isLoading}>
          <Text>Pagar com Apple Pay</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
```

### API Direta

```javascript
import WalletPay, { PAYMENT_NETWORKS } from "react-native-wallet-pay";

// Verificar disponibilidade
const availability = await WalletPay.isAvailable();
console.log(availability); // { applePay: true, googlePay: false }

// Processar pagamento
const result = await WalletPay.processPayment(
  {
    applePay: {
      amount: 29.99,
      currencyCode: "USD",
      countryCode: "US",
      label: "Assinatura Premium",
      supportedNetworks: [PAYMENT_NETWORKS.VISA, PAYMENT_NETWORKS.MASTERCARD],
    },
  },
  async (paymentData) => {
    // Seu processador de pagamento customizado
    return await processWithStripe(paymentData);
  }
);
```

## 🔧 Configuração Avançada

### Integração com Stripe

```javascript
const stripeProcessor = async (paymentData) => {
  const { token, provider, config } = paymentData;

  try {
    const response = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `amount=${config.amount * 100}&currency=${
        config.currencyCode
      }&payment_method_data[type]=card&payment_method_data[card][token]=${token}`,
    });

    const result = await response.json();
    return { success: true, transactionId: result.id };
  } catch (error) {
    throw new Error("Falha no processamento Stripe");
  }
};
```

### Integração com PayPal

```javascript
const paypalProcessor = async (paymentData) => {
  // Implementação PayPal
  const response = await PayPalAPI.processPayment({
    token: paymentData.token,
    amount: paymentData.config.amount,
    currency: paymentData.config.currencyCode,
  });

  return { success: response.success, transactionId: response.id };
};
```

## 📋 API Reference

### WalletPay

#### Métodos

| Método                              | Descrição                                         | Retorno                                            |
| ----------------------------------- | ------------------------------------------------- | -------------------------------------------------- |
| `isAvailable()`                     | Verifica disponibilidade dos métodos de pagamento | `Promise<{applePay: boolean, googlePay: boolean}>` |
| `canMakeApplePayments()`            | Verifica se Apple Pay está disponível             | `Promise<boolean>`                                 |
| `requestApplePayment(config)`       | Solicita pagamento via Apple Pay                  | `Promise<PaymentResult>`                           |
| `completeApplePayment(success)`     | Completa o fluxo de pagamento                     | `Promise<void>`                                    |
| `processPayment(config, processor)` | Processa pagamento com gateway customizado        | `Promise<ProcessResult>`                           |

#### Configuração do Apple Pay

```javascript
const applePayConfig = {
  amount: 99.99, // Obrigatório
  currencyCode: "USD", // Obrigatório
  countryCode: "US", // Obrigatório
  label: "Nome do produto", // Obrigatório
  supportedNetworks: [
    // Opcional
    PAYMENT_NETWORKS.VISA,
    PAYMENT_NETWORKS.MASTERCARD,
    PAYMENT_NETWORKS.AMEX,
  ],
};
```

### Hooks

#### useWalletPay(options)

```javascript
const {
  isLoading, // Estado de carregamento
  availability, // Disponibilidade dos métodos
  isChecking, // Verificando disponibilidade
  checkAvailability, // Função para verificar
  processPayment, // Processar pagamento automático
  processApplePayment, // Processar Apple Pay específico
  showPaymentError, // Mostrar erro customizado
  isApplePayAvailable, // Atalho para availability.applePay
  isAnyPaymentAvailable, // Qualquer método disponível
} = useWalletPay({
  onPaymentSuccess: (result) => {}, // Callback de sucesso
  onPaymentError: (error) => {}, // Callback de erro
  paymentProcessor: async (data) => {}, // Processador customizado
});
```

#### useQuickPay(defaultConfig)

```javascript
const { quickPay, isProcessing } = useQuickPay({
  currencyCode: "USD",
  countryCode: "US",
});

// Uso
await quickPay({ amount: 19.99, label: "Produto" }, myProcessor);
```

## 🔒 Segurança

- ✅ Tokens de pagamento nunca são armazenados localmente
- ✅ Comunicação criptografada com gateways
- ✅ Validação de parâmetros obrigatórios
- ✅ Tratamento seguro de erros

## 📱 Requisitos

### iOS

- iOS 11.0+
- Xcode 12+
- React Native 0.60+

### Android (em desenvolvimento)

- Android 5.0+ (API level 21)
- Google Play Services

## 🛠️ Desenvolvimento

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/react-native-wallet-pay.git

# Instalar dependências
npm install

# iOS
cd ios && pod install

# Executar exemplo
npm run example:ios
```

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia nosso [guia de contribuição](CONTRIBUTING.md).

## 📞 Suporte

- 📧 Email: suporte@seuapp.com
- 🐛 Issues: [GitHub Issues](https://github.com/seu-usuario/react-native-wallet-pay/issues)
- 📖 Documentação: [Wiki](https://github.com/seu-usuario/react-native-wallet-pay/wiki)

---

Feito com ❤️ para a comunidade React Native
