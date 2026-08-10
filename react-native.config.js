module.exports = {
  dependency: {
    platforms: {
      android: {
        sourceDir: './android',
        packageImportPath:
          'import com.reactlibrary.RNReactNativeWalletPayPackage;',
        packageInstance: 'new RNReactNativeWalletPayPackage()',
      },
      ios: {
        // Autolinking detects the podspec under ios/
      },
    },
  },
};
