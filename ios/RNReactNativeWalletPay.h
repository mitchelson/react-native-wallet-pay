#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <PassKit/PassKit.h>

@interface RNReactNativeWalletPay : RCTEventEmitter <RCTBridgeModule, PKPaymentAuthorizationViewControllerDelegate>

@property (nonatomic, strong) RCTPromiseResolveBlock paymentResolve;
@property (nonatomic, strong) RCTPromiseRejectBlock paymentReject;

@end
