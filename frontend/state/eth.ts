import { ethers } from "ethers"; // Ethers
import Onboard from "bnc-onboard"; // Onboard.js
import { useEffect, useState } from "react"; // React
import { createContainer } from "unstated-next"; // State management

import type {
  API,
  WalletInitOptions,
  WalletModule,
} from "bnc-onboard/dist/src/interfaces";
import type { Web3Provider } from "@ethersproject/providers";

const wallets: (WalletModule | WalletInitOptions)[] = [
  { walletName: "metamask" },
  {
    walletName: "walletConnect",
    infuraKey: process.env.NEXT_PUBLIC_INFURA_RPC ?? "",
  },
];

function useEth() {
  const [address, setAddress] = useState<string | null>(null); // User address
  const [onboard, setOnboard] = useState<API | null>(null); // Onboard provider
  const [provider, setProvider] = useState<Web3Provider | null>(null); // Ethers provider


  const unlock = async () => {
    await onboard.walletSelect();
    await onboard.walletCheck();
  };

  useEffect(() => {
    const onboard = Onboard({
      networkId: 4,
      hideBranding: true,
      walletSelect: {
        heading: "Connect to P2P Lending",
        description: "Please select a wallet to authenticate",
        wallets: wallets,
      },
      subscriptions: {
        wallet: async (wallet) => {
          if (wallet.provider) {
            const provider = new ethers.providers.Web3Provider(wallet.provider);
            const signer = await provider.getSigner();
            const address: string = await signer.getAddress();
            setProvider(provider);
            setAddress(address);
          } else {
            setProvider(null);
            setAddress(null);
          }
        },
      },
      walletCheck: [{ checkName: "network" }, { checkName: "connect" }],
    });
    setOnboard(onboard);
  }, []);

  return { address, provider, unlock };
}

export const eth = createContainer(useEth);
