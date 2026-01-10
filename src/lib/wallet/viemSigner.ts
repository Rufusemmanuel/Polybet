import type { WalletClient } from 'viem';

type TypedDataTypes = Record<string, Array<{ name: string; type: string }>>;
type TypedDataDomain = Record<string, unknown>;
type TypedDataMessage = Record<string, unknown>;

export type ViemSigner = {
  getAddress: () => Promise<`0x${string}`>;
  _signTypedData: (
    domain: TypedDataDomain,
    types: TypedDataTypes,
    message: TypedDataMessage,
  ) => Promise<`0x${string}`>;
};

export const createViemSigner = (
  walletClient: WalletClient,
  address: `0x${string}`,
): ViemSigner => ({
  getAddress: async () => address,
  _signTypedData: async (domain, types, message) => {
    const primaryType = Object.keys(types).find((key) => key !== 'EIP712Domain');
    if (!primaryType) {
      throw new Error('Unable to resolve EIP-712 primaryType.');
    }
    return walletClient.signTypedData({
      account: address,
      domain: domain as TypedDataDomain,
      types: types as TypedDataTypes,
      primaryType,
      message: message as TypedDataMessage,
    });
  },
});
