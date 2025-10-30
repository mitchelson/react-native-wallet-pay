#import <React/RCTBridgeModule.h>
#import <PassKit/PassKit.h>
#import "RNReactNativeWalletPay.h"

@interface RCT_EXTERN_MODULE(WalletPayModule, NSObject)


RCT_EXTERN_METHOD(canMakeApplePayments:(RCTPromiseResolveBlock)resolver rejecter:(RCTPromiseRejectBlock)rejecter)
RCT_EXTERN_METHOD(requestApplePayment:(NSDictionary *)paramsJSON resolver:(RCTPromiseResolveBlock)resolver rejecter:(RCTPromiseRejectBlock)rejecter)
RCT_EXTERN_METHOD(completeApplePayment:(BOOL)success)

@end

@implementation RNReactNativeWalletPay

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(isWalletAvailable:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    BOOL applePayAvailable = NO;
    BOOL googlePayAvailable = NO;
    
    #if TARGET_OS_IOS
    applePayAvailable = [PKPaymentAuthorizationController canMakePayments];
    #endif
    
    NSDictionary *result = @{
        @"applePay": @(applePayAvailable),
        @"googlePay": @(googlePayAvailable)
    };
    
    resolve(result);
}

@end