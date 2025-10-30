#if __has_include("RCTBridgeModule.h")
#import "RCTBridgeModule.h"
#else
#import <React/RCTBridgeModule.h>
#endif

#import <PassKit/PassKit.h>

@interface RNReactNativeWalletPay : NSObject <RCTBridgeModule>

/**
 * Check if wallet payment methods are available on device
 * @return Promise resolving to availability status for Apple Pay and Google Pay
 */
- (void)isWalletAvailable:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject;

@end
  