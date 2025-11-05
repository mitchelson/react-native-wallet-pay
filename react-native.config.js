module.exports = {
  dependency: {
    platforms: {
      ios: {
        podspecPath: "./ios/RNReactNativeWalletPay.podspec",
        configurations: [],
        scriptPhases: [],
      },
      android: {
        sourceDir: "android/",
        packageImportPath:
          "import com.reactlibrary.RNReactNativeWalletPayPackage;",
      },
    },
  },
};
