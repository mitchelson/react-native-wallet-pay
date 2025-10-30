using ReactNative.Bridge;
using System;
using System.Collections.Generic;
using Windows.ApplicationModel.Core;
using Windows.UI.Core;

namespace React.Native.Wallet.Pay.RNReactNativeWalletPay
{
    /// <summary>
    /// A module that allows JS to share data.
    /// </summary>
    class RNReactNativeWalletPayModule : NativeModuleBase
    {
        /// <summary>
        /// Instantiates the <see cref="RNReactNativeWalletPayModule"/>.
        /// </summary>
        internal RNReactNativeWalletPayModule()
        {

        }

        /// <summary>
        /// The name of the native module.
        /// </summary>
        public override string Name
        {
            get
            {
                return "RNReactNativeWalletPay";
            }
        }
    }
}
