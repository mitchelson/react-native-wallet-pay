#import "RNReactNativeWalletPay.h"
#import <React/RCTLog.h>
#import <PassKit/PassKit.h>

@interface RNReactNativeWalletPay()
@property (nonatomic, strong) NSString *merchantId;
@property (nonatomic, strong) NSArray<NSString *> *supportedNetworks;
@end
        
@implementation RNReactNativeWalletPay

// Export module with explicit name - aligned with library architecture
RCT_EXPORT_MODULE(WalletPayModule);

- (instancetype)init {
    self = [super init];
    if (self) {
        // Initialize supported payment networks
        self.supportedNetworks = @[PKPaymentNetworkVisa, 
                                  PKPaymentNetworkMasterCard, 
                                  PKPaymentNetworkAmex,
                                  PKPaymentNetworkDiscover];
        
        // AUTO-DETECTION: Detect merchant ID automatically
        self.merchantId = [self detectMerchantIdentifier];
    }
    return self;
}

// NEW: Auto-detect merchant identifier from entitlements or Info.plist
- (NSString *)detectMerchantIdentifier {
    // 1. Try from Entitlements (primary method)
    NSDictionary *entitlements = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"com.apple.developer.in-app-payments"];
    if (entitlements && [entitlements isKindOfClass:[NSArray class]]) {
        NSArray *merchantIds = (NSArray *)entitlements;
        if (merchantIds.count > 0) {
            return merchantIds[0];
        }
    }
    
    // 2. Try from Info.plist (fallback)
    NSString *plistMerchantId = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"ApplePayMerchantIdentifier"];
    if (plistMerchantId && plistMerchantId.length > 0) {
        return plistMerchantId;
    }
    
    // Return nil if not found - will be handled in payment methods
    return nil;
}

// NEW: Map supported networks from string identifiers to PKPaymentNetwork enums
- (NSArray<PKPaymentNetwork> *)mapSupportedNetworks:(NSArray<NSString *> *)networkStrings {
    NSMutableArray *networks = [[NSMutableArray alloc] init];
    
    for (NSString *network in networkStrings) {
        if ([network isEqualToString:@"visa"]) {
            [networks addObject:PKPaymentNetworkVisa];
        } else if ([network isEqualToString:@"masterCard"]) {
            [networks addObject:PKPaymentNetworkMasterCard];
        } else if ([network isEqualToString:@"amex"]) {
            [networks addObject:PKPaymentNetworkAmex];
        } else if ([network isEqualToString:@"discover"]) {
            [networks addObject:PKPaymentNetworkDiscover];
        } else if ([network isEqualToString:@"mada"]) {
            if (@available(iOS 12.1.1, *)) {
                [networks addObject:PKPaymentNetworkMada];
            }
        } else if ([network isEqualToString:@"maestro"]) {
            if (@available(iOS 12.0, *)) {
                [networks addObject:PKPaymentNetworkMaestro];
            }
        } else if ([network isEqualToString:@"elo"]) {
            if (@available(iOS 12.1.1, *)) {
                [networks addObject:PKPaymentNetworkElo];
            }
        } else if ([network isEqualToString:@"jcb"]) {
            [networks addObject:PKPaymentNetworkJCB];
        } else if ([network isEqualToString:@"chinaUnionPay"]) {
            [networks addObject:PKPaymentNetworkChinaUnionPay];
        } else if ([network isEqualToString:@"interac"]) {
            if (@available(iOS 9.2, *)) {
                [networks addObject:PKPaymentNetworkInterac];
            }
        } else if ([network isEqualToString:@"cartesBancaires"]) {
            if (@available(iOS 11.2, *)) {
                [networks addObject:PKPaymentNetworkCartesBancaires];
            }
        }
    }
    
    return [networks copy];
}

+ (BOOL)requiresMainQueueSetup {
    return YES; // Apple Pay requires main queue
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"onPaymentProcessed", @"onPaymentCompleted"];
}

- (NSDictionary *)constantsToExport {
    return @{
        @"VERSION": @"1.0.0",
        @"PLATFORM": @"ios",
        @"MERCHANT_ID": self.merchantId ?: [NSNull null]
    };
}

#pragma mark - Payment Availability Methods

// NEW: Main availability method expected by the library
RCT_EXPORT_METHOD(isWalletAvailable:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        BOOL applePay = [PKPaymentAuthorizationViewController canMakePayments] && (self.merchantId != nil);
        BOOL googlePay = NO; // iOS não suporta Google Pay
        
        NSDictionary *result = @{
            @"applePay": @(applePay),
            @"googlePay": @(googlePay)
        };
        
        resolve(result);
    } @catch (NSException *exception) {
        reject(@"WALLET_AVAILABILITY_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(isApplePayAvailable:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        BOOL isAvailable = [PKPaymentAuthorizationViewController canMakePayments];
        resolve(@(isAvailable));
    } @catch (NSException *exception) {
        reject(@"APPLE_PAY_AVAILABILITY_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(isGooglePayAvailable:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    // Google Pay is not available on iOS
    resolve(@(NO));
}

RCT_EXPORT_METHOD(getSupportedNetworks:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        NSMutableArray *networks = [[NSMutableArray alloc] init];
        for (NSString *network in self.supportedNetworks) {
            [networks addObject:network];
        }
        resolve(networks);
    } @catch (NSException *exception) {
        reject(@"GET_SUPPORTED_NETWORKS_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(canMakePayments:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        BOOL canMake = [PKPaymentAuthorizationViewController canMakePaymentsUsingNetworks:self.supportedNetworks];
        resolve(@(canMake));
    } @catch (NSException *exception) {
        reject(@"CAN_MAKE_PAYMENTS_ERROR", exception.reason, nil);
    }
}

// Alias used by the JS API (canonical name alongside canMakePayments)
RCT_EXPORT_METHOD(canMakeApplePayments:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        BOOL canMake = [PKPaymentAuthorizationViewController canMakePayments];
        resolve(@(canMake));
    } @catch (NSException *exception) {
        reject(@"CAN_MAKE_APPLE_PAYMENTS_ERROR", exception.reason, nil);
    }
}

// NEW: Check if Apple Pay can make payments with specific networks
RCT_EXPORT_METHOD(canMakeApplePaymentsWithCards:(NSArray<NSString *> *)supportedNetworkStrings
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        NSArray<PKPaymentNetwork> *networks = [self mapSupportedNetworks:supportedNetworkStrings];
        BOOL canMake = [PKPaymentAuthorizationViewController canMakePaymentsUsingNetworks:networks];
        resolve(@(canMake));
    } @catch (NSException *exception) {
        reject(@"CAN_MAKE_APPLE_PAYMENTS_WITH_CARDS_ERROR", exception.reason, nil);
    }
}

// NEW: Apple Pay diagnostics method for debugging
RCT_EXPORT_METHOD(getApplePayDiagnostics:(NSArray<NSString *> *)supportedNetworkStrings
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        NSArray<PKPaymentNetwork> *networks = [self mapSupportedNetworks:supportedNetworkStrings];
        
        BOOL canMakePayments = [PKPaymentAuthorizationViewController canMakePayments];
        BOOL hasCardsForNetworks = [PKPaymentAuthorizationViewController canMakePaymentsUsingNetworks:networks];
        
        NSString *message = @"Apple Pay configured and ready";
        if (!self.merchantId) {
            message = @"Merchant ID not found. Configure Apple Pay in Xcode Capabilities or add ApplePayMerchantIdentifier to Info.plist";
        } else if (!canMakePayments) {
            message = @"Device does not support Apple Pay or no cards in Wallet";
        } else if (!hasCardsForNetworks) {
            message = [NSString stringWithFormat:@"Apple Pay available, but no cards for networks: %@", [supportedNetworkStrings componentsJoinedByString:@", "]];
        }
        
        NSDictionary *diagnostics = @{
            @"platform": @"ios",
            @"canMakePayments": @(canMakePayments),
            @"hasCardsForNetworks": @(hasCardsForNetworks),
            @"available": @(canMakePayments && self.merchantId != nil),
            @"merchantId": self.merchantId ?: [NSNull null],
            @"supportedNetworks": supportedNetworkStrings ?: @[],
            @"message": message
        };
        
        resolve(diagnostics);
    } @catch (NSException *exception) {
        reject(@"APPLE_PAY_DIAGNOSTICS_ERROR", exception.reason, nil);
    }
}

#pragma mark - Payment Processing Methods

// NEW: Main payment method expected by the library
RCT_EXPORT_METHOD(requestApplePayment:(NSDictionary *)paymentRequest
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        // Check if merchant ID was detected
        if (!self.merchantId) {
            reject(@"E_MERCHANT_ID_NOT_FOUND", 
                  @"Merchant ID not found. Configure Apple Pay in Xcode Capabilities or add ApplePayMerchantIdentifier to Info.plist", 
                  nil);
            return;
        }
        
        // Store promise callbacks
        self.paymentResolve = resolve;
        self.paymentReject = reject;
        
        // Extract payment details using new structure
        NSArray<NSString *> *supportedNetworkStrings = paymentRequest[@"supportedNetworks"];
        NSString *countryCode = paymentRequest[@"countryCode"];
        NSString *currencyCode = paymentRequest[@"currencyCode"];
        NSString *label = paymentRequest[@"label"];
        NSString *amount = paymentRequest[@"amount"];
        
        // Validate required parameters
        if (!supportedNetworkStrings || !countryCode || !currencyCode || !label || !amount) {
            reject(@"E_INVALID_PARAMS", @"Missing required parameters: supportedNetworks, countryCode, currencyCode, label, amount", nil);
            return;
        }
        
        // Map supported networks
        NSArray<PKPaymentNetwork> *networks = [self mapSupportedNetworks:supportedNetworkStrings];
        
        // Create payment request
        PKPaymentRequest *request = [[PKPaymentRequest alloc] init];
        request.merchantIdentifier = self.merchantId;
        request.supportedNetworks = networks;
        request.merchantCapabilities = PKMerchantCapability3DS;
        request.countryCode = countryCode;
        request.currencyCode = currencyCode;
        
        // Create payment item
        PKPaymentSummaryItem *paymentItem = [PKPaymentSummaryItem summaryItemWithLabel:label 
                                                                                amount:[NSDecimalNumber decimalNumberWithString:amount]];
        request.paymentSummaryItems = @[paymentItem];
        
        // Present Apple Pay
        PKPaymentAuthorizationViewController *paymentViewController = 
            [[PKPaymentAuthorizationViewController alloc] initWithPaymentRequest:request];
        
        if (paymentViewController) {
            paymentViewController.delegate = self;
            
            dispatch_async(dispatch_get_main_queue(), ^{
                UIViewController *rootViewController = [UIApplication sharedApplication].keyWindow.rootViewController;
                [rootViewController presentViewController:paymentViewController animated:YES completion:nil];
            });
        } else {
            reject(@"APPLE_PAY_NOT_AVAILABLE", @"Apple Pay is not available", nil);
        }
        
    } @catch (NSException *exception) {
        reject(@"E_PAYMENT_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(processApplePayPayment:(NSDictionary *)paymentRequest
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        // Store promise callbacks
        self.paymentResolve = resolve;
        self.paymentReject = reject;
        
        // Extract payment details
        NSNumber *amountNumber = paymentRequest[@"amount"];
        NSString *currency = paymentRequest[@"currency"];
        NSString *countryCode = paymentRequest[@"countryCode"];
        NSString *description = paymentRequest[@"description"];
        
        // Create payment request
        PKPaymentRequest *request = [[PKPaymentRequest alloc] init];
        request.merchantIdentifier = self.merchantId;
        request.supportedNetworks = self.supportedNetworks;
        request.merchantCapabilities = PKMerchantCapability3DS;
        request.countryCode = countryCode;
        request.currencyCode = currency;
        
        // Create payment item
        PKPaymentSummaryItem *paymentItem = [PKPaymentSummaryItem summaryItemWithLabel:description 
                                                                                amount:[NSDecimalNumber decimalNumberWithString:[amountNumber stringValue]]];
        request.paymentSummaryItems = @[paymentItem];
        
        // Present Apple Pay
        PKPaymentAuthorizationViewController *paymentViewController = 
            [[PKPaymentAuthorizationViewController alloc] initWithPaymentRequest:request];
        
        if (paymentViewController) {
            paymentViewController.delegate = self;
            
            dispatch_async(dispatch_get_main_queue(), ^{
                UIViewController *rootViewController = [UIApplication sharedApplication].keyWindow.rootViewController;
                [rootViewController presentViewController:paymentViewController animated:YES completion:nil];
            });
        } else {
            reject(@"APPLE_PAY_NOT_AVAILABLE", @"Apple Pay is not available", nil);
        }
        
    } @catch (NSException *exception) {
        reject(@"PROCESS_APPLE_PAY_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(processGooglePayPayment:(NSDictionary *)paymentRequest
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    // Google Pay is not available on iOS
    NSDictionary *result = @{
        @"success": @(NO),
        @"error": @"Google Pay is not available on iOS"
    };
    resolve(result);
}

// NEW: Complete Apple Pay method expected by the library
RCT_EXPORT_METHOD(completeApplePayment:(BOOL)success
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        // This method is called after payment processing to indicate success/failure
        // The actual completion is handled in the delegate methods
        resolve(@(YES));
    } @catch (NSException *exception) {
        reject(@"COMPLETE_APPLE_PAYMENT_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(completePayment:(NSString *)transactionId
                  success:(BOOL)success
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        // Emit completion event
        NSDictionary *eventData = @{
            @"transactionId": transactionId,
            @"success": @(success)
        };
        [self sendEventWithName:@"onPaymentCompleted" body:eventData];
        
        resolve(@(YES));
    } @catch (NSException *exception) {
        reject(@"COMPLETE_PAYMENT_ERROR", exception.reason, nil);
    }
}

#pragma mark - PKPaymentAuthorizationViewControllerDelegate

- (void)paymentAuthorizationViewController:(PKPaymentAuthorizationViewController *)controller
                       didAuthorizePayment:(PKPayment *)payment
                                   handler:(void (^)(PKPaymentAuthorizationResult * _Nonnull))completion {
    
    // Extract payment token
    NSData *tokenData = payment.token.paymentData;
    NSString *tokenString = [[NSString alloc] initWithData:tokenData encoding:NSUTF8StringEncoding];
    
    // Create transaction ID
    NSString *transactionId = [[NSUUID UUID] UUIDString];
    
    // Create payment token object
    NSMutableDictionary *paymentToken = [[NSMutableDictionary alloc] init];
    paymentToken[@"token"] = tokenString;
    paymentToken[@"paymentMethod"] = @"apple_pay";
    paymentToken[@"transactionId"] = transactionId;
    paymentToken[@"amount"] = payment.token.paymentMethod.displayName ?: @"";
    paymentToken[@"currency"] = @"BRL"; // Default to BRL
    
    // Add card information if available
    if (payment.token.paymentMethod.network) {
        paymentToken[@"brand"] = payment.token.paymentMethod.network;
    }
    
    // Create success result
    NSDictionary *result = @{
        @"success": @(YES),
        @"token": paymentToken
    };
    
    // Emit payment event
    [self sendEventWithName:@"onPaymentProcessed" body:paymentToken];
    
    // Complete with success
    PKPaymentAuthorizationResult *authResult = [[PKPaymentAuthorizationResult alloc] initWithStatus:PKPaymentAuthorizationStatusSuccess errors:nil];
    completion(authResult);
    
    // Resolve promise
    if (self.paymentResolve) {
        self.paymentResolve(result);
        self.paymentResolve = nil;
        self.paymentReject = nil;
    }
}

- (void)paymentAuthorizationViewControllerDidFinish:(PKPaymentAuthorizationViewController *)controller {
    dispatch_async(dispatch_get_main_queue(), ^{
        [controller dismissViewControllerAnimated:YES completion:^{
            // If payment wasn't processed, it means it was cancelled
            if (self.paymentResolve) {
                NSDictionary *result = @{
                    @"success": @(NO),
                    @"cancelled": @(YES)
                };
                self.paymentResolve(result);
                self.paymentResolve = nil;
                self.paymentReject = nil;
            }
        }];
    });
}

@end
