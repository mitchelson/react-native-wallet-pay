import Foundation
import PassKit
import React

struct PaymentRequestParams: Codable {
    let merchantIdentifier: String
    let supportedNetworks: [String]
    let countryCode: String
    let currencyCode: String
    let label: String
    let amount: String
}

@objc(WalletPayModule)
class WalletPayModule: NSObject {
    private var paymentResolver: RCTPromiseResolveBlock?
    private var paymentRejecter: RCTPromiseRejectBlock?
    private var completionHandler: ((PKPaymentAuthorizationResult) -> Void)?

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }

    @objc
    func canMakeApplePayments(_ resolver: RCTPromiseResolveBlock, rejecter: RCTPromiseRejectBlock) {
        resolver(PKPaymentAuthorizationController.canMakePayments())
    }

    @objc
    func requestApplePayment(_ paramsJSON: NSDictionary, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        guard let jsonData = try? JSONSerialization.data(withJSONObject: paramsJSON, options: []),
              let params = try? JSONDecoder().decode(PaymentRequestParams.self, from: jsonData) else {
            rejecter("E_INVALID_PARAMS", "Invalid payment request parameters", nil)
            return
        }

        let paymentRequest = PKPaymentRequest()
        paymentRequest.merchantIdentifier = params.merchantIdentifier
        paymentRequest.supportedNetworks = mapSupportedNetworks(params.supportedNetworks)
        paymentRequest.merchantCapabilities = .capability3DS
        paymentRequest.countryCode = params.countryCode
        paymentRequest.currencyCode = params.currencyCode
        paymentRequest.paymentSummaryItems = [
            PKPaymentSummaryItem(label: params.label, amount: NSDecimalNumber(string: params.amount))
        ]

        let paymentAuthorizationController = PKPaymentAuthorizationController(paymentRequest: paymentRequest)
        paymentAuthorizationController.delegate = self
        
        DispatchQueue.main.async {
            paymentAuthorizationController.present { (presented: Bool) in
                if !presented {
                    rejecter("E_PAYMENT_ERROR", "Unable to present Apple Pay authorization.", nil)
                } else {
                    self.paymentResolver = resolver
                    self.paymentRejecter = rejecter
                }
            }
        }
    }

    @objc
    func completeApplePayment(_ success: Bool) {
        guard let completionHandler = self.completionHandler else {
            return
        }
        let status: PKPaymentAuthorizationStatus = success ? .success : .failure
        let result = PKPaymentAuthorizationResult(status: status, errors: nil)
        completionHandler(result)
        self.completionHandler = nil
    }

    private func mapSupportedNetworks(_ networks: [String]) -> [PKPaymentNetwork] {
        return networks.compactMap { network in
            switch network.lowercased() {
            case "visa":
                return .visa
            case "mastercard", "masterCard":
                return .masterCard
            case "mada":
                return .mada
            case "amex":
                return .amex
            case "discover":
                return .discover
            case "jcb":
                return .JCB
            case "maestro":
                return .maestro
            case "electron":
                return .electron
            case "vpay", "vPay":
                return .vPay
            case "chinaUnionPay":
                return .chinaUnionPay
            case "interac":
                return .interac
            case "elo":
                return .elo
            case "cartesBancaires":
                return .cartesBancaires
            default:
                return nil
            }
        }
    }
}

extension WalletPayModule: PKPaymentAuthorizationControllerDelegate {
    func paymentAuthorizationController(_ controller: PKPaymentAuthorizationController, didAuthorizePayment payment: PKPayment, handler completion: @escaping (PKPaymentAuthorizationResult) -> Void) {

        self.completionHandler = completion

        if let resolver = self.paymentResolver {
            do {
                let paymentData = try JSONSerialization.jsonObject(with: payment.token.paymentData, options: []) as? [String: Any] ?? [:]
                
                let tokenData = [
                    "paymentData": paymentData,
                    "transactionIdentifier": payment.token.transactionIdentifier,
                    "paymentMethod": [
                        "displayName": payment.token.paymentMethod.displayName ?? "",
                        "network": payment.token.paymentMethod.network?.rawValue ?? "",
                        "type": payment.token.paymentMethod.type.rawValue
                    ]
                ]
                
                resolver(["status": "success", "token": tokenData])
            } catch {
                if let rejecter = self.paymentRejecter {
                    rejecter("APPLE_PAY_PAYMENT_REJECTED", "Payment token processing failed", error)
                }
                completion(PKPaymentAuthorizationResult(status: .failure, errors: nil))
                return
            }
            self.paymentResolver = nil
            self.paymentRejecter = nil
        } else {
            if let rejecter = self.paymentRejecter {
                rejecter("APPLE_PAY_PAYMENT_REJECTED", "Payment was rejected", nil)
                self.paymentResolver = nil
                self.paymentRejecter = nil
            }
            completion(PKPaymentAuthorizationResult(status: .failure, errors: nil))
        }
    }

    func paymentAuthorizationControllerDidFinish(_ controller: PKPaymentAuthorizationController) {
        controller.dismiss {
            if let rejecter = self.paymentRejecter {
                rejecter("APPLE_PAY_PAYMENT_CANCELLED", "Payment was cancelled", nil)
                self.paymentResolver = nil
                self.paymentRejecter = nil
            }
        }
    }
}