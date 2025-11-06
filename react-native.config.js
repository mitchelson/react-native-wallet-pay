module.exports = {
  dependency: {
    platforms: {
      android: {
        sourceDir: 'android/src/main/java/',
        packageImportPath: 'import com.reactlibrary.RNReactNativeWalletPayPackage;',
      },
      ios: {
        // Deixar o autolinking detectar automaticamente o podspec
      },
    },
  },
};
