/**
 * Exemplo de componente React Native usando a biblioteca Wallet Pay
 * Demonstra integração agnóstica com diferentes gateways
 */

import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  useWalletPay,
  COUNTRIES,
  CURRENCIES,
  PAYMENT_NETWORKS,
} from "../hooks/useWalletPay";

const PaymentExample = () => {
  const {
    isLoading,
    availability,
    isChecking,
    checkAvailability,
    processApplePayment,
    showPaymentError,
    isApplePayAvailable,
    isAnyPaymentAvailable,
  } = useWalletPay({
    onPaymentSuccess: (result) => {
      console.log("Pagamento bem-sucedido:", result);
      Alert.alert("Sucesso!", "Pagamento processado com sucesso");
    },
    onPaymentError: (error) => {
      console.error("Erro no pagamento:", error);
      Alert.alert(
        "Erro",
        error.message || "Falha no processamento do pagamento"
      );
    },
    // Gateway agnóstico - pode ser Stripe, PayPal, PagSeguro, etc.
    paymentProcessor: async (paymentData) => {
      // Exemplo de integração com gateway personalizado
      console.log("Processando pagamento com gateway:", paymentData);

      // Simular chamada para seu backend
      try {
        const response = await fetch(
          "https://seu-backend.com/process-payment",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer seu-token",
            },
            body: JSON.stringify({
              provider: paymentData.provider, // 'applePay' or 'googlePay'
              token: paymentData.token,
              amount: paymentData.config.amount,
              currency: paymentData.config.currencyCode,
              merchantId: paymentData.config.merchantIdentifier,
            }),
          }
        );

        const result = await response.json();

        if (result.success) {
          return { success: true, transactionId: result.transactionId };
        } else {
          throw new Error(result.message || "Payment failed");
        }
      } catch (error) {
        console.error("Gateway error:", error);
        throw error;
      }
    },
  });

  // Verificar disponibilidade ao carregar o componente
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  // Configuração de pagamento para Apple Pay
  const applePayConfig = {
    merchantIdentifier: "merchant.com.seuapp", // Substitua pelo seu merchant ID
    amount: 99.99,
    currencyCode: CURRENCIES.USD,
    countryCode: COUNTRIES.US,
    label: "Produto Exemplo",
    supportedNetworks: [
      PAYMENT_NETWORKS.VISA,
      PAYMENT_NETWORKS.MASTERCARD,
      PAYMENT_NETWORKS.AMEX,
    ],
  };

  // Handler para pagamento com Apple Pay
  const handleApplePayPress = async () => {
    if (!isApplePayAvailable) {
      showPaymentError(
        "Apple Pay Indisponível",
        "Apple Pay não está disponível neste dispositivo"
      );
      return;
    }

    await processApplePayment(applePayConfig);
  };

  // Handler para pagamento com Google Pay (futuro)
  const handleGooglePayPress = () => {
    Alert.alert("Em Breve", "Google Pay será implementado em breve!");
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
              Apple Pay:{" "}
              {availability.applePay ? "✅ Disponível" : "❌ Indisponível"}
            </Text>
            <Text
              style={[
                styles.availabilityText,
                availability.googlePay && styles.available,
              ]}
            >
              Google Pay:{" "}
              {availability.googlePay ? "✅ Disponível" : "❌ Indisponível"}
            </Text>
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

      <TouchableOpacity
        style={styles.refreshButton}
        onPress={checkAvailability}
        disabled={isChecking}
      >
        <Text style={styles.refreshButtonText}>Verificar Novamente</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#333",
  },
  checking: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  checkingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  content: {
    flex: 1,
  },
  availabilityContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  availabilityTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  availabilityText: {
    fontSize: 16,
    marginBottom: 5,
    color: "#666",
  },
  available: {
    color: "#4CAF50",
    fontWeight: "500",
  },
  paymentContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentTitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  paymentButton: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  applePayButton: {
    backgroundColor: "#000",
  },
  googlePayButton: {
    backgroundColor: "#4285F4",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledText: {
    color: "#999",
  },
  noPaymentContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  noPaymentText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  refreshButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  refreshButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PaymentExample;
