/**
 * Exemplo de componente React Native usando a biblioteca Wallet Pay
 * Demonstra integração agnóstica com diferentes gateways (Apple Pay + Google Pay)
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  useWalletPay,
  COUNTRIES,
  CURRENCIES,
  PAYMENT_NETWORKS,
} from '../lib';

const PaymentExample = () => {
  const {
    isLoading,
    availability,
    isChecking,
    checkAvailability,
    processPayment,
    processApplePayment,
    processGooglePayment,
    getDiagnostics,
    showPaymentError,
    isApplePayAvailable,
    isGooglePayAvailable,
    isAnyPaymentAvailable,
  } = useWalletPay({
    onPaymentSuccess: (result) => {
      Alert.alert('Sucesso!', 'Pagamento processado com sucesso');
    },
    onPaymentError: (error) => {
      Alert.alert(
        'Erro',
        error.message || 'Falha no processamento do pagamento'
      );
    },
    paymentProcessor: async (paymentData) => {
      // Substitua pela chamada ao seu backend / gateway
      const response = await fetch('https://seu-backend.com/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer seu-token',
        },
        body: JSON.stringify({
          provider: paymentData.provider,
          token: paymentData.token,
          amount: paymentData.config.amount,
          currency: paymentData.config.currencyCode,
        }),
      });

      const result = await response.json();

      if (result.success) {
        return { success: true, transactionId: result.transactionId };
      }

      throw new Error(result.message || 'Payment failed');
    },
  });

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  const applePayConfig = {
    amount: 99.99,
    currencyCode: CURRENCIES.USD,
    countryCode: COUNTRIES.US,
    label: 'Produto Exemplo',
    supportedNetworks: [
      PAYMENT_NETWORKS.VISA,
      PAYMENT_NETWORKS.MASTERCARD,
      PAYMENT_NETWORKS.AMEX,
    ],
  };

  const googlePayConfig = {
    amount: 99.99,
    currencyCode: CURRENCIES.USD,
    countryCode: COUNTRIES.US,
    label: 'Produto Exemplo',
    environment: 'TEST',
    tokenizationSpecification: {
      type: 'PAYMENT_GATEWAY',
      gateway: 'example',
      gatewayMerchantId: 'exampleGatewayMerchantId',
    },
    merchantInfo: {
      merchantName: 'Wallet Pay Example',
    },
  };

  const handleApplePayPress = async () => {
    if (!isApplePayAvailable) {
      showPaymentError(
        'Apple Pay Indisponível',
        'Apple Pay não está disponível neste dispositivo'
      );
      return;
    }

    await processApplePayment(applePayConfig);
  };

  const handleGooglePayPress = async () => {
    if (!isGooglePayAvailable) {
      showPaymentError(
        'Google Pay Indisponível',
        'Google Pay não está disponível neste dispositivo'
      );
      return;
    }

    await processGooglePayment(googlePayConfig);
  };

  const handleAutoPay = async () => {
    // Usa disponibilidade em cache (sem re-checar o nativo)
    await processPayment({
      applePay: applePayConfig,
      googlePay: googlePayConfig,
    });
  };

  const handleDiagnostics = async () => {
    const diagnostics = await getDiagnostics(applePayConfig.supportedNetworks);

    Alert.alert(
      'Diagnóstico Apple Pay',
      `Platform: ${diagnostics.platform}
Pode fazer pagamentos: ${diagnostics.canMakePayments ? 'Sim' : 'Não'}
Tem cartões para as redes: ${diagnostics.hasCardsForNetworks ? 'Sim' : 'Não'}
Redes testadas: ${diagnostics.supportedNetworks?.join(', ') || 'N/A'}

${diagnostics.message}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallet Pay - Exemplo</Text>

      {isChecking ? (
        <View style={styles.checking}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.checkingText}>
            Verificando disponibilidade...
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.availabilityContainer}>
            <Text style={styles.availabilityTitle}>Métodos Disponíveis:</Text>
            <Text
              style={[
                styles.availabilityText,
                availability.applePay && styles.available,
              ]}
            >
              Apple Pay: {availability.applePay ? 'Disponível' : 'Indisponível'}
            </Text>
            <Text
              style={[
                styles.availabilityText,
                availability.googlePay && styles.available,
              ]}
            >
              Google Pay:{' '}
              {availability.googlePay ? 'Disponível' : 'Indisponível'}
            </Text>
            <Text style={styles.platformText}>Platform: {Platform.OS}</Text>
          </View>

          {isAnyPaymentAvailable ? (
            <View style={styles.paymentContainer}>
              <Text style={styles.paymentTitle}>Pagar $99.99</Text>

              {isApplePayAvailable && (
                <TouchableOpacity
                  style={[styles.paymentButton, styles.applePayButton]}
                  onPress={handleApplePayPress}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Pagar com Apple Pay</Text>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.paymentButton,
                  styles.googlePayButton,
                  !availability.googlePay && styles.disabledButton,
                ]}
                onPress={handleGooglePayPress}
                disabled={!availability.googlePay || isLoading}
              >
                <Text
                  style={[
                    styles.buttonText,
                    !availability.googlePay && styles.disabledText,
                  ]}
                >
                  Pagar com Google Pay
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentButton, styles.autoPayButton]}
                onPress={handleAutoPay}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Pagar (auto)</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noPaymentContainer}>
              <Text style={styles.noPaymentText}>
                Nenhum método de pagamento disponível neste dispositivo
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.refreshButton, styles.halfButton]}
          onPress={checkAvailability}
          disabled={isChecking}
        >
          <Text style={styles.refreshButtonText}>Verificar Novamente</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.refreshButton,
            styles.halfButton,
            styles.diagnosticButton,
          ]}
          onPress={handleDiagnostics}
          disabled={isChecking}
        >
          <Text style={styles.refreshButtonText}>Diagnóstico</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  checking: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  availabilityContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  availabilityTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  availabilityText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
  },
  platformText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  available: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  paymentContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  paymentTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  paymentButton: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  applePayButton: {
    backgroundColor: '#000',
  },
  googlePayButton: {
    backgroundColor: '#4285F4',
  },
  autoPayButton: {
    backgroundColor: '#34C759',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    color: '#999',
  },
  noPaymentContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  noPaymentText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  halfButton: {
    flex: 1,
    marginTop: 0,
  },
  diagnosticButton: {
    backgroundColor: '#FF9500',
  },
});

export default PaymentExample;
