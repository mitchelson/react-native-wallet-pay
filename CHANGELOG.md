# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- GitHub Actions workflow to publish to npm on GitHub Release (`NPM_TOKEN` secret)

## [1.1.0] - 2026-08-10

### Added
- Google Pay support on Android via Play Services Wallet (`isReadyToPay` + `loadPaymentData`)
- Typed `GooglePayConfig`, `ApplePayPaymentData`, `GooglePayPaymentData`, and `PaymentToken.paymentData`
- Conditional `logger` gated by `__DEV__` (no verbose production console noise)
- Shared `src/nativeModule.ts` resolving the canonical `WalletPayModule`
- Optional diagnostics entry `lib/diagnostics/testApplePaySetup` (not part of the public API)
- GitHub Actions CI (lint, typecheck, tests)
- Jest unit tests for hooks and core helpers
- `CHANGELOG.md` and a complete `README.md`
- Expo bare / development-build compatibility notes

### Changed
- Migrated JavaScript source to TypeScript (`src/` → `lib/`)
- Unified availability API to `isAvailable()` only
- `useWalletPay().processPayment` uses cached availability (optional `refreshAvailability`)
- Canonical native module name is `WalletPayModule` on both iOS and Android
- Modernized Android `build.gradle` (Play Services Wallet dependency)
- Fixed iOS podspec `source_files` and Android autolinking `sourceDir`

### Removed
- Production `console.log` debug dumps of NativeModules / payment payloads
- Public export of `testApplePaySetup`
- Duplicate `isWalletAvailable()` JS wrapper (native method remains internal)
- Multi-name native module fallbacks (`RNReactNativeWalletPay`, `RNWalletPay`, …)

## [1.0.11] - previous

- Autolinking path fixes and troubleshooting guide
- Apple Pay native flow and hooks (pre-TypeScript)
