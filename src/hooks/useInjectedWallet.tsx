/* Hook + provider for injected EIP-1193 wallets */
'use client';

import {
  connectInjected,
  getInjectedAccounts,
  getInjectedChainId,
  getInjectedProvider,
  subscribeToProviderEvents,
  switchToPolygon,
  type Eip1193Provider,
} from '@/lib/wallet/injected';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createWalletClient, custom, type WalletClient } from 'viem';
import { polygon } from 'viem/chains';
import { getAddress } from 'viem';

type InjectedWalletState = {
  address: `0x${string}` | null;
  chainId: number | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  providerAvailable: boolean;
  provider: Eip1193Provider | null;
  walletClient: WalletClient | null;
  connect: () => Promise<{ address: `0x${string}`; chainId: number }>;
  disconnectLocal: () => void;
  ensurePolygon: () => Promise<void>;
};

const InjectedWalletContext = createContext<InjectedWalletState | null>(null);

export const InjectedWalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [provider, setProvider] = useState<Eip1193Provider | null>(null);
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  useEffect(() => {
    setProvider(getInjectedProvider());
  }, []);

  const disconnectLocal = useCallback(() => {
    setAddress(null);
    setChainId(null);
  }, []);

  const syncAccounts = useCallback(
    async (nextProvider: Eip1193Provider) => {
      const accounts = await getInjectedAccounts(nextProvider);
      if (!accounts.length) {
        disconnectLocal();
        return;
      }
      const nextAddress = getAddress(accounts[0]) as `0x${string}`;
      const nextChainId = await getInjectedChainId(nextProvider);
      setAddress(nextAddress);
      setChainId(Number.isFinite(nextChainId) ? nextChainId : null);
    },
    [disconnectLocal],
  );

  useEffect(() => {
    if (!provider) return;
    syncAccounts(provider).catch(() => null);
    const unsubscribe = subscribeToProviderEvents(provider, {
      onAccountsChanged: (accounts) => {
        if (!accounts.length) {
          disconnectLocal();
          return;
        }
        setAddress(getAddress(accounts[0]) as `0x${string}`);
      },
      onChainChanged: (nextChainId) => {
        setChainId(Number.isFinite(nextChainId) ? nextChainId : null);
      },
      onDisconnect: () => {
        disconnectLocal();
      },
    });
    return () => unsubscribe();
  }, [disconnectLocal, provider, syncAccounts]);

  const connect = useCallback(async () => {
    if (!provider) {
      throw new Error('No injected wallet found. Install MetaMask or a Web3 wallet.');
    }
    const result = await connectInjected(provider);
    setAddress(getAddress(result.address) as `0x${string}`);
    setChainId(result.chainId);
    return result;
  }, [provider]);

  const ensurePolygon = useCallback(async () => {
    if (!provider) return;
    if (chainId === 137) return;
    await switchToPolygon(provider);
    const nextChainId = await getInjectedChainId(provider);
    setChainId(Number.isFinite(nextChainId) ? nextChainId : null);
  }, [chainId, provider]);

  const walletClient = useMemo(() => {
    if (!provider || !address) return null;
    return createWalletClient({
      chain: polygon,
      account: address,
      transport: custom(provider),
    });
  }, [address, provider]);

  const state = useMemo<InjectedWalletState>(
    () => ({
      address,
      chainId,
      isConnected: Boolean(address),
      isCorrectNetwork: chainId === 137,
      providerAvailable: Boolean(provider),
      provider,
      walletClient,
      connect,
      disconnectLocal,
      ensurePolygon,
    }),
    [
      address,
      chainId,
      connect,
      disconnectLocal,
      ensurePolygon,
      provider,
      walletClient,
    ],
  );

  return (
    <InjectedWalletContext.Provider value={state}>
      {children}
    </InjectedWalletContext.Provider>
  );
};

export const useInjectedWallet = () => {
  const context = useContext(InjectedWalletContext);
  if (!context) {
    throw new Error('useInjectedWallet must be used within InjectedWalletProvider.');
  }
  return context;
};
