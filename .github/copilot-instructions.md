# React Native Wallet Pay - AI Coding Guide

## Architecture Overview

This is a **gateway-agnostic** React Native library for Apple Pay and Google Pay integration. The core architecture separates payment method discovery, authorization, and processing:

- **Payment Detection**: Native modules check device/platform capabilities
- **Authorization Flow**: Platform-native UI (PassKit for iOS, Google Pay API for Android)
- **Processing Abstraction**: User-provided `paymentProcessor` function handles gateway integration
- **Cross-Platform Hooks**: React hooks provide unified API across platforms

## Key Components & Data Flow

### Native Bridge Architecture

- `ios/WalletPayModule.swift`: Swift implementation using PassKit framework with automatic merchant ID detection
- `android/.../RNReactNativeWalletPayModule.java`: Android implementation (stub - Google Pay not yet implemented)
- `index.js`: JavaScript bridge with platform detection, constants, and method routing

### Payment Flow Pattern

1. **Availability Check**: `WalletPay.isAvailable()` → native capability detection
2. **Payment Request**: Configuration passed to native module → platform UI presented
3. **Authorization**: Native delegates handle user interaction → token returned to JS
4. **Processing**: User's `paymentProcessor` function called with payment data
5. **Completion**: `completeApplePayment(success)` finalizes native flow

### Hook-Based Integration

- `useWalletPay()`: Main hook with lifecycle management, error handling, loading states, diagnostics
- `useQuickPay()`: Simplified hook with default configurations (referenced but not implemented)
- Gateway-agnostic design: Works with Stripe, PayPal, PagSeguro, or custom backends

## Critical Development Patterns

### Merchant ID Auto-Detection System

**CRITICAL**: No longer pass `merchantIdentifier` in config. The Swift module automatically detects it via:

1. `Entitlements` → `com.apple.developer.in-app-payments` array (primary method)
2. `Info.plist` → `ApplePayMerchantIdentifier` key (fallback)
3. Throws `E_MERCHANT_ID_NOT_FOUND` if neither found

### Payment Configuration Structure

All payment configs follow this pattern in `ios/WalletPayModule.swift`:

```swift
struct PaymentRequestParams: Codable {
    let supportedNetworks: [String] // Mapped to PKPaymentNetwork enums
    let countryCode: String
    let currencyCode: String
    let label: String        // Appears on payment sheet
    let amount: String       // Decimal string format - NO merchantIdentifier needed
}
```

### Network Mapping Pattern

`mapSupportedNetworks()` in Swift converts string identifiers to PassKit enums. When adding new networks, update both:

- `PAYMENT_NETWORKS` constants in `index.js` (13 networks supported: visa, masterCard, amex, mada, etc.)
- `mapSupportedNetworks()` switch statement in `WalletPayModule.swift`

### Error Handling Convention

- Native errors use specific codes: `"E_INVALID_PARAMS"`, `"E_PAYMENT_ERROR"`, `"E_MERCHANT_ID_NOT_FOUND"`, `"APPLE_PAY_PAYMENT_REJECTED"`
- Hook-level errors are wrapped with user-friendly messages
- Platform detection errors return graceful fallbacks (`{ applePay: false, googlePay: false }`)

## Platform-Specific Requirements

### iOS Configuration Dependencies

- Requires `ios/RNReactNativeWalletPay.podspec` with PassKit framework
- Minimum iOS 11.0+ (declared in podspec)
- Swift 5.0+ (bridging header: `RNReactNativeWalletPay-Bridging-Header.h`)
- **CRITICAL**: App must configure Apple Pay merchant ID in Xcode **Project Settings → Signing & Capabilities → Apple Pay**
- Alternative: Add `ApplePayMerchantIdentifier` key to `Info.plist` as fallback

### Android Implementation Status

- Currently stub implementation in Java (`RNReactNativeWalletPayModule.java`)
- Google Pay integration planned but not implemented
- Platform checks return `googlePay: false` consistently
- Android module exists but returns empty/false for all payment methods

## Testing & Debugging Workflows

### Diagnostic Methods

Use built-in diagnostic methods for systematic troubleshooting:

```javascript
// Get comprehensive diagnostics (in useWalletPay hook)
const diagnostics = await getDiagnostics(supportedNetworks);
// Returns: platform, canMakePayments, hasCardsForNetworks, available, message

// Direct API diagnostics
const diagnostics = await WalletPay.getApplePayDiagnostics(supportedNetworks);
```

### Example Integration Patterns

Reference `example/PaymentExample.js` for complete implementation:

- Gateway-agnostic `paymentProcessor` function structure
- Proper error handling with user feedback
- Loading states and availability checking
- Diagnostic information display for debugging

### Development Commands

```bash
npm run example:ios      # Run iOS simulator example
npm run example:android  # Run Android emulator example
npm run lint            # ESLint code checking
npm run typecheck       # TypeScript validation
```

## Gateway Integration Patterns

### Payment Processor Function Signature

```javascript
const paymentProcessor = async (paymentData) => {
  // paymentData.provider: "applePay" | "googlePay"
  // paymentData.token: Platform-specific payment token
  // paymentData.config: Original payment configuration
  // Return: { success: boolean, transactionId?: string, error?: string }
};
```

### Common Gateway Examples

- **Stripe**: Convert Apple Pay token to Stripe payment method
- **PayPal**: Map token to PayPal payment object
- **Custom Backend**: POST token + config to your payment endpoint

Gateway implementations should handle token format differences between Apple Pay and Google Pay.

## File Organization Logic

- `/hooks/`: React hooks for different use cases (`useWalletPay`, `useQuickPay`)
- `/example/`: Complete integration examples and patterns
- `/ios/`, `/android/`, `/windows/`: Platform-specific native implementations
- Root: Main exports, TypeScript definitions, constants

## Constants & Configurations

Extensive predefined constants for international markets:

- `COUNTRIES`: 15+ supported country codes
- `CURRENCIES`: Major international currencies
- `PAYMENT_NETWORKS`: Comprehensive card network support (Visa, Mastercard, regional networks)

These constants ensure consistent configuration across different market integrations.

## Constants & Configurations

Extensive predefined constants for international markets:

- `COUNTRIES`: 15+ supported country codes
- `CURRENCIES`: Major international currencies
- `PAYMENT_NETWORKS`: Comprehensive card network support (Visa, Mastercard, regional networks)

These constants ensure consistent configuration across different market integrations.
