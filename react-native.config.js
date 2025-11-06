module.exports = {
  dependency: {
    platforms: {
      ios: {
        podspecPath: "ios/RNReactNativeWalletPay.podspec",
        configurations: ["Debug", "Release"],
      },
      android: {
        sourceDir: "android/src/main/java",
        packageImportPath: "import com.reactlibrary.RNReactNativeWalletPayPackage;",
      },
    },
  },
};
