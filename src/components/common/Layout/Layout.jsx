import { Navbar, Footer } from '@components/common';
import Background from './Background';
//import { WalletKitProvider } from "@mysten/wallet-kit";
import {WalletProvider} from '@suiet/wallet-kit';


import Head from 'next/head';
/*import {
  WalletProvider,
  SuiWallet,
  //defineWallet*/

/*const CustomizeWallet = defineWallet({
  name: "BitKeep wallet",
  iconUrl: "/assets/images/BitKeeplogo.svg",
  downloadUrl: {
    browserExtension: 'https://chrome.google.com/webstore/detail/bitkeep-crypto-nft-wallet/jiidiaalihmmhddjgbnbgdfflelocpak'
  },
})
<WalletProvider chains={[{
        id: "dev",
        name: "devnet",
        rpcUrl: "https://explorer-rpc.devnet.sui.io/",
      }]} defaultWallets={[
        SuiWallet,
      ]}>*
*/

const Layout = ({ children }) => {
  return (
    <>
      
        <WalletProvider>
          <div>
            <Head>
              <title>Era Homi</title>
            </Head>

            <Background />
            
            <div className="relative z-10">
              <Navbar />
              <div className="container mx-auto">{children}</div>
              <Footer />
            </div>
          </div>
        </WalletProvider>
    </>
  );
};

export default Layout;
