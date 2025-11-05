
Pod::Spec.new do |s|
  s.name         = "RNReactNativeWalletPay"
  s.version      = "1.0.5"
  s.summary      = "React Native Wallet Pay - Apple Pay integration"
  s.description  = <<-DESC
                  React Native library for Apple Pay and Google Pay integration
                   DESC
  s.homepage     = "https://github.com/mitchelson/react-native-wallet-pay"
  s.license      = "MIT"
  s.author       = { "Mitchelson" => "mitchelsonps@gmail.com" }
  s.platform     = :ios, "11.0"  # iOS 11+ required for Apple Pay
  s.ios.deployment_target = "11.0"
  s.source       = { :git => "https://github.com/mitchelson/react-native-wallet-pay.git", :tag => "master" }
  s.source_files = "*.{h,m}"
  s.public_header_files = "*.h"
  s.requires_arc = true

  s.dependency "React-Core"
  s.frameworks = "PassKit", "Foundation"
  s.compiler_flags = '-DRCT_NEW_ARCH_ENABLED=1'

end

  