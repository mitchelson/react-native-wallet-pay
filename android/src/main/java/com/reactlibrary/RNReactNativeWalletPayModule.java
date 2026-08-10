package com.reactlibrary;

import android.app.Activity;
import android.content.Intent;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

import com.google.android.gms.common.api.Status;
import com.google.android.gms.tasks.Task;
import com.google.android.gms.wallet.AutoResolveHelper;
import com.google.android.gms.wallet.IsReadyToPayRequest;
import com.google.android.gms.wallet.PaymentData;
import com.google.android.gms.wallet.PaymentDataRequest;
import com.google.android.gms.wallet.PaymentsClient;
import com.google.android.gms.wallet.Wallet;
import com.google.android.gms.wallet.WalletConstants;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.UUID;

/**
 * Canonical native module name: WalletPayModule (must match iOS RCT_EXPORT_MODULE).
 */
public class RNReactNativeWalletPayModule extends ReactContextBaseJavaModule {

  private static final int LOAD_PAYMENT_DATA_REQUEST_CODE = 9910;
  private static final String MODULE_NAME = "WalletPayModule";

  private final ReactApplicationContext reactContext;
  private Promise paymentPromise;

  private final ActivityEventListener activityEventListener =
      new BaseActivityEventListener() {
        @Override
        public void onActivityResult(
            Activity activity, int requestCode, int resultCode, Intent data) {
          if (requestCode != LOAD_PAYMENT_DATA_REQUEST_CODE) {
            return;
          }

          Promise promise = paymentPromise;
          paymentPromise = null;

          if (promise == null) {
            return;
          }

          switch (resultCode) {
            case Activity.RESULT_OK:
              if (data == null) {
                promise.reject("GOOGLE_PAY_ERROR", "Empty payment data");
                return;
              }
              PaymentData paymentData = PaymentData.getFromIntent(data);
              if (paymentData == null) {
                promise.reject("GOOGLE_PAY_ERROR", "Unable to parse PaymentData");
                return;
              }
              try {
                promise.resolve(buildSuccessResult(paymentData));
              } catch (Exception e) {
                promise.reject("GOOGLE_PAY_ERROR", e.getMessage(), e);
              }
              break;
            case Activity.RESULT_CANCELED:
              WritableMap cancelled = Arguments.createMap();
              cancelled.putBoolean("success", false);
              cancelled.putBoolean("cancelled", true);
              promise.resolve(cancelled);
              break;
            case AutoResolveHelper.RESULT_ERROR:
              Status status = AutoResolveHelper.getStatusFromIntent(data);
              String message =
                  status != null ? status.getStatusMessage() : "Google Pay error";
              promise.reject("GOOGLE_PAY_ERROR", message != null ? message : "Google Pay error");
              break;
            default:
              promise.reject("GOOGLE_PAY_ERROR", "Unexpected Google Pay result");
          }
        }
      };

  public RNReactNativeWalletPayModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
    reactContext.addActivityEventListener(activityEventListener);
  }

  @Override
  @NonNull
  public String getName() {
    return MODULE_NAME;
  }

  private PaymentsClient createPaymentsClient(String environment) {
    int env =
        "PRODUCTION".equalsIgnoreCase(environment)
            ? WalletConstants.ENVIRONMENT_PRODUCTION
            : WalletConstants.ENVIRONMENT_TEST;

    return Wallet.getPaymentsClient(
        reactContext,
        new Wallet.WalletOptions.Builder().setEnvironment(env).build());
  }

  private JSONArray toJsonStringArray(@Nullable ReadableArray array, String[] fallback)
      throws JSONException {
    JSONArray result = new JSONArray();
    if (array == null || array.size() == 0) {
      for (String value : fallback) {
        result.put(value);
      }
      return result;
    }
    for (int i = 0; i < array.size(); i++) {
      result.put(array.getString(i));
    }
    return result;
  }

  private JSONObject buildTokenizationSpecification(ReadableMap config) throws JSONException {
    if (!config.hasKey("tokenizationSpecification")) {
      throw new IllegalArgumentException("tokenizationSpecification is required");
    }

    ReadableMap tokenSpec = config.getMap("tokenizationSpecification");
    if (tokenSpec == null) {
      throw new IllegalArgumentException("tokenizationSpecification is required");
    }

    String type =
        tokenSpec.hasKey("type") ? tokenSpec.getString("type") : "PAYMENT_GATEWAY";

    JSONObject parameters = new JSONObject();
    if ("DIRECT".equalsIgnoreCase(type)) {
      parameters.put("protocolVersion", "ECv2");
      if (!tokenSpec.hasKey("publicKey")) {
        throw new IllegalArgumentException("DIRECT tokenization requires publicKey");
      }
      parameters.put("publicKey", tokenSpec.getString("publicKey"));
    } else {
      if (!tokenSpec.hasKey("gateway") || !tokenSpec.hasKey("gatewayMerchantId")) {
        throw new IllegalArgumentException(
            "PAYMENT_GATEWAY tokenization requires gateway and gatewayMerchantId");
      }
      parameters.put("gateway", tokenSpec.getString("gateway"));
      parameters.put("gatewayMerchantId", tokenSpec.getString("gatewayMerchantId"));
    }

    return new JSONObject()
        .put("type", type)
        .put("parameters", parameters);
  }

  private JSONObject buildBaseCardPaymentMethod(ReadableMap config, boolean includeTokenization)
      throws JSONException {
    JSONArray allowedAuthMethods =
        toJsonStringArray(
            config.hasKey("allowedCardAuthMethods")
                ? config.getArray("allowedCardAuthMethods")
                : null,
            new String[] {"PAN_ONLY", "CRYPTOGRAM_3DS"});

    JSONArray allowedCardNetworks =
        toJsonStringArray(
            config.hasKey("allowedCardNetworks")
                ? config.getArray("allowedCardNetworks")
                : null,
            new String[] {"AMEX", "DISCOVER", "JCB", "MASTERCARD", "VISA"});

    JSONObject parameters =
        new JSONObject()
            .put("allowedAuthMethods", allowedAuthMethods)
            .put("allowedCardNetworks", allowedCardNetworks);

    JSONObject cardPaymentMethod =
        new JSONObject().put("type", "CARD").put("parameters", parameters);

    if (includeTokenization) {
      cardPaymentMethod.put("tokenizationSpecification", buildTokenizationSpecification(config));
    }

    return cardPaymentMethod;
  }

  private JSONObject buildIsReadyToPayRequest(ReadableMap config) throws JSONException {
    boolean existingRequired =
        config.hasKey("existingPaymentMethodRequired")
            && config.getBoolean("existingPaymentMethodRequired");

    JSONObject request =
        new JSONObject()
            .put("apiVersion", 2)
            .put("apiVersionMinor", 0)
            .put(
                "allowedPaymentMethods",
                new JSONArray().put(buildBaseCardPaymentMethod(config, false)));

    if (existingRequired) {
      request.put("existingPaymentMethodRequired", true);
    }

    return request;
  }

  private JSONObject buildPaymentDataRequest(ReadableMap config) throws JSONException {
    String amount = config.hasKey("amount") ? config.getString("amount") : null;
    String currencyCode =
        config.hasKey("currencyCode") ? config.getString("currencyCode") : null;
    String countryCode =
        config.hasKey("countryCode") ? config.getString("countryCode") : null;

    if (amount == null || currencyCode == null || countryCode == null) {
      throw new IllegalArgumentException(
          "Missing required parameters: amount, currencyCode, countryCode");
    }

    JSONObject transactionInfo =
        new JSONObject()
            .put("totalPriceStatus", "FINAL")
            .put("totalPrice", amount)
            .put("currencyCode", currencyCode)
            .put("countryCode", countryCode);

    if (config.hasKey("label") && config.getString("label") != null) {
      transactionInfo.put("transactionId", UUID.randomUUID().toString());
    }

    JSONObject merchantInfo = new JSONObject();
    if (config.hasKey("merchantInfo") && config.getMap("merchantInfo") != null) {
      ReadableMap info = config.getMap("merchantInfo");
      if (info.hasKey("merchantName")) {
        merchantInfo.put("merchantName", info.getString("merchantName"));
      }
      if (info.hasKey("merchantId")) {
        merchantInfo.put("merchantId", info.getString("merchantId"));
      }
    } else {
      String label = config.hasKey("label") ? config.getString("label") : "Merchant";
      merchantInfo.put("merchantName", label != null ? label : "Merchant");
    }

    JSONObject request =
        new JSONObject()
            .put("apiVersion", 2)
            .put("apiVersionMinor", 0)
            .put(
                "allowedPaymentMethods",
                new JSONArray().put(buildBaseCardPaymentMethod(config, true)))
            .put("transactionInfo", transactionInfo)
            .put("merchantInfo", merchantInfo);

    return request;
  }

  private WritableMap buildSuccessResult(PaymentData paymentData) throws JSONException {
    String json = paymentData.toJson();
    JSONObject paymentJson = new JSONObject(json);

    String transactionId = UUID.randomUUID().toString();
    String displayName = "";
    String network = "";
    String tokenString = json;

    JSONObject paymentMethodData = paymentJson.optJSONObject("paymentMethodData");
    if (paymentMethodData != null) {
      displayName = paymentMethodData.optString("description", "");
      JSONObject info = paymentMethodData.optJSONObject("info");
      if (info != null) {
        network = info.optString("cardNetwork", "");
      }
      JSONObject tokenizationData = paymentMethodData.optJSONObject("tokenizationData");
      if (tokenizationData != null) {
        tokenString = tokenizationData.optString("token", json);
      }
    }

    WritableMap paymentMethod = Arguments.createMap();
    paymentMethod.putString("displayName", displayName);
    paymentMethod.putString("network", network);
    paymentMethod.putString("type", "CARD");

    WritableMap token = Arguments.createMap();
    // Keep structured paymentData for gateways that need the full PaymentData JSON
    token.putString("paymentData", json);
    token.putString("transactionIdentifier", transactionId);
    token.putString("transactionId", transactionId);
    token.putString("token", tokenString);
    token.putString("paymentMethodType", "google_pay");
    token.putMap("paymentMethod", paymentMethod);
    if (network.length() > 0) {
      token.putString("brand", network);
    }

    WritableMap result = Arguments.createMap();
    result.putBoolean("success", true);
    result.putString("transactionId", transactionId);
    result.putMap("token", token);
    return result;
  }

  @ReactMethod
  public void isWalletAvailable(Promise promise) {
    try {
      // Availability without gateway config: check Play Services wallet in TEST env.
      JSONObject request =
          new JSONObject()
              .put("apiVersion", 2)
              .put("apiVersionMinor", 0)
              .put(
                  "allowedPaymentMethods",
                  new JSONArray()
                      .put(
                          new JSONObject()
                              .put("type", "CARD")
                              .put(
                                  "parameters",
                                  new JSONObject()
                                      .put(
                                          "allowedAuthMethods",
                                          new JSONArray()
                                              .put("PAN_ONLY")
                                              .put("CRYPTOGRAM_3DS"))
                                      .put(
                                          "allowedCardNetworks",
                                          new JSONArray()
                                              .put("AMEX")
                                              .put("DISCOVER")
                                              .put("JCB")
                                              .put("MASTERCARD")
                                              .put("VISA")))));

      PaymentsClient client = createPaymentsClient("TEST");
      IsReadyToPayRequest readyRequest = IsReadyToPayRequest.fromJson(request.toString());

      client
          .isReadyToPay(readyRequest)
          .addOnCompleteListener(
              task -> {
                WritableMap result = new WritableNativeMap();
                result.putBoolean("applePay", false);
                boolean ready = task.isSuccessful() && Boolean.TRUE.equals(task.getResult());
                result.putBoolean("googlePay", ready);
                promise.resolve(result);
              });
    } catch (Exception e) {
      WritableMap result = new WritableNativeMap();
      result.putBoolean("applePay", false);
      result.putBoolean("googlePay", false);
      promise.resolve(result);
    }
  }

  @ReactMethod
  public void isApplePayAvailable(Promise promise) {
    promise.resolve(false);
  }

  @ReactMethod
  public void isGooglePayAvailable(Promise promise) {
    try {
      JSONObject request =
          new JSONObject()
              .put("apiVersion", 2)
              .put("apiVersionMinor", 0)
              .put(
                  "allowedPaymentMethods",
                  new JSONArray()
                      .put(
                          new JSONObject()
                              .put("type", "CARD")
                              .put(
                                  "parameters",
                                  new JSONObject()
                                      .put(
                                          "allowedAuthMethods",
                                          new JSONArray()
                                              .put("PAN_ONLY")
                                              .put("CRYPTOGRAM_3DS"))
                                      .put(
                                          "allowedCardNetworks",
                                          new JSONArray()
                                              .put("AMEX")
                                              .put("DISCOVER")
                                              .put("JCB")
                                              .put("MASTERCARD")
                                              .put("VISA")))));

      PaymentsClient client = createPaymentsClient("TEST");
      IsReadyToPayRequest readyRequest = IsReadyToPayRequest.fromJson(request.toString());
      client
          .isReadyToPay(readyRequest)
          .addOnCompleteListener(
              task -> {
                boolean ready = task.isSuccessful() && Boolean.TRUE.equals(task.getResult());
                promise.resolve(ready);
              });
    } catch (Exception e) {
      promise.resolve(false);
    }
  }

  @ReactMethod
  public void canMakePayments(Promise promise) {
    isGooglePayAvailable(promise);
  }

  @ReactMethod
  public void getSupportedNetworks(Promise promise) {
    WritableMap networks = new WritableNativeMap();
    networks.putBoolean("VISA", true);
    networks.putBoolean("MASTERCARD", true);
    networks.putBoolean("AMEX", true);
    networks.putBoolean("DISCOVER", true);
    networks.putBoolean("JCB", true);
    promise.resolve(networks);
  }

  @ReactMethod
  public void requestApplePayment(ReadableMap config, Promise promise) {
    promise.reject("APPLE_PAY_NOT_AVAILABLE", "Apple Pay não disponível no Android");
  }

  @ReactMethod
  public void completeApplePayment(boolean success, Promise promise) {
    promise.resolve(true);
  }

  @ReactMethod
  public void processApplePayPayment(ReadableMap config, Promise promise) {
    promise.reject("APPLE_PAY_NOT_AVAILABLE", "Apple Pay não disponível no Android");
  }

  @ReactMethod
  public void requestGooglePayment(ReadableMap config, Promise promise) {
    processGooglePayPayment(config, promise);
  }

  @ReactMethod
  public void processGooglePayPayment(ReadableMap config, Promise promise) {
    Activity activity = getCurrentActivity();
    if (activity == null) {
      promise.reject("GOOGLE_PAY_NO_ACTIVITY", "Activity not available");
      return;
    }

    if (paymentPromise != null) {
      promise.reject("GOOGLE_PAY_IN_PROGRESS", "Another Google Pay request is in progress");
      return;
    }

    try {
      String environment =
          config.hasKey("environment") ? config.getString("environment") : "TEST";
      PaymentsClient client = createPaymentsClient(environment);

      JSONObject readyJson = buildIsReadyToPayRequest(config);
      IsReadyToPayRequest readyRequest = IsReadyToPayRequest.fromJson(readyJson.toString());

      client
          .isReadyToPay(readyRequest)
          .addOnCompleteListener(
              readyTask -> {
                if (!readyTask.isSuccessful()
                    || !Boolean.TRUE.equals(readyTask.getResult())) {
                  promise.reject(
                      "GOOGLE_PAY_NOT_AVAILABLE",
                      "Google Pay is not available on this device");
                  return;
                }

                try {
                  JSONObject paymentJson = buildPaymentDataRequest(config);
                  PaymentDataRequest request =
                      PaymentDataRequest.fromJson(paymentJson.toString());

                  paymentPromise = promise;
                  Task<PaymentData> task = client.loadPaymentData(request);
                  AutoResolveHelper.resolveTask(
                      task, activity, LOAD_PAYMENT_DATA_REQUEST_CODE);
                } catch (Exception e) {
                  paymentPromise = null;
                  promise.reject("GOOGLE_PAY_ERROR", e.getMessage(), e);
                }
              });
    } catch (Exception e) {
      paymentPromise = null;
      promise.reject("GOOGLE_PAY_ERROR", e.getMessage(), e);
    }
  }
}
