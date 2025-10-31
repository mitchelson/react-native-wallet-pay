
Pod::Spec.new do |s|
  s.name         = "RNReactNativeWalletPay"
  s.version      = "1.0.0"
  s.summary      = "React Native Wallet Pay - Apple Pay integration"
  s.description  = <<-DESC
                  React Native library for Apple Pay and Google Pay integration
                   DESC
  s.homepage     = "https://github.com/mitchelson/react-native-wallet-pay"
  s.license      = "MIT"
  s.author       = { "Mitchelson" => "mitchelsonps@gmail.com" }
  s.platform     = :ios, "11.0"  # iOS 11+ required for Apple Pay
  s.source       = { :git => "https://github.com/mitchelson/react-native-wallet-pay.git", :tag => "master" }
  s.source_files = "**/*.{h,m,swift}"
  s.requires_arc = true
  s.swift_version = "5.0"

  s.dependency "React-Core"
  s.frameworks = "PassKit", "Foundation"

end

  