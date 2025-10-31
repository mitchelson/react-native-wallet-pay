#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WalletPayModule, NSObject)

RCT_EXTERN_METHOD(isWalletAvailable:(RCTPromiseResolveBlock)resolver rejecter:(RCTPromiseRejectBlock)rejecter)
RCT_EXTERN_METHOD(canMakeApplePayments:(RCTPromiseResolveBlock)resolver rejecter:(RCTPromiseRejectBlock)rejecter)
RCT_EXTERN_METHOD(requestApplePayment:(NSDictionary *)paramsJSON resolver:(RCTPromiseResolveBlock)resolver rejecter:(RCTPromiseRejectBlock)rejecter)
RCT_EXTERN_METHOD(completeApplePayment:(BOOL)success)

@end