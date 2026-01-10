export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

export type InjectedConnection = {
  address: `0x${string}`;
  chainId: number;
};

const POLYGON_PARAMS = {
  chainId: '0x89',
  chainName: 'Polygon Mainnet',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: ['https://polygon-rpc.com'],
  blockExplorerUrls: ['https://polygonscan.com'],
};

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.startsWith('0x')) {
    return Number.parseInt(value, 16);
  }
  if (typeof value === 'string') {
    return Number.parseInt(value, 10);
  }
  return Number.NaN;
};

export const getInjectedProvider = (): Eip1193Provider | null => {
  if (typeof window === 'undefined') return null;
  const provider = (window as Window & { ethereum?: unknown }).ethereum;
  if (!provider || typeof provider !== 'object') return null;
  if (!('request' in provider) || typeof (provider as Eip1193Provider).request !== 'function') {
    return null;
  }
  return provider as Eip1193Provider;
};

export const getInjectedAccounts = async (provider: Eip1193Provider) => {
  const accounts = await provider.request({ method: 'eth_accounts' });
  return Array.isArray(accounts) ? (accounts as string[]) : [];
};

export const getInjectedChainId = async (provider: Eip1193Provider) => {
  const chainId = await provider.request({ method: 'eth_chainId' });
  return toNumber(chainId);
};

export const connectInjected = async (
  provider: Eip1193Provider,
): Promise<InjectedConnection> => {
  const accounts = await provider.request({ method: 'eth_requestAccounts' });
  if (!Array.isArray(accounts) || accounts.length === 0) {
    throw new Error('No wallet accounts found.');
  }
  const chainId = await getInjectedChainId(provider);
  const address = accounts[0] as `0x${string}`;
  return { address, chainId };
};

export const switchToPolygon = async (provider: Eip1193Provider) => {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: POLYGON_PARAMS.chainId }],
    });
  } catch (error) {
    const err = error as { code?: number };
    if (err?.code !== 4902) {
      throw error;
    }
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [POLYGON_PARAMS],
    });
  }
};

export const subscribeToProviderEvents = (
  provider: Eip1193Provider,
  handlers: {
    onAccountsChanged: (accounts: string[]) => void;
    onChainChanged: (chainId: number) => void;
    onDisconnect: () => void;
  },
) => {
  if (!provider.on || !provider.removeListener) {
    return () => undefined;
  }
  const handleAccounts = (accounts: unknown) => {
    handlers.onAccountsChanged(Array.isArray(accounts) ? (accounts as string[]) : []);
  };
  const handleChain = (chainId: unknown) => {
    handlers.onChainChanged(toNumber(chainId));
  };
  const handleDisconnect = () => {
    handlers.onDisconnect();
  };
  provider.on('accountsChanged', handleAccounts);
  provider.on('chainChanged', handleChain);
  provider.on('disconnect', handleDisconnect);
  return () => {
    provider.removeListener?.('accountsChanged', handleAccounts);
    provider.removeListener?.('chainChanged', handleChain);
    provider.removeListener?.('disconnect', handleDisconnect);
  };
};
