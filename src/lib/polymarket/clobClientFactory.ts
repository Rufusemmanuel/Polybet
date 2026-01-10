import { ClobClient, Chain, type ApiKeyCreds } from '@polymarket/clob-client';
import type { SignatureType } from '@polymarket/order-utils';
import type { ViemSigner } from '@/lib/wallet/viemSigner';

type UserApiCreds = {
  apiKey: string;
  secret: string;
  passphrase: string;
};

type ClobClientFactoryArgs = {
  signer?: ViemSigner | null;
  userApiCreds?: UserApiCreds | null;
  signatureType?: SignatureType;
  proxyWalletAddress?: string | null;
  chainId?: Chain;
  host?: string;
};

export const createClobClient = ({
  signer,
  userApiCreds,
  signatureType,
  proxyWalletAddress,
  chainId = Chain.POLYGON,
  host = 'https://clob.polymarket.com',
}: ClobClientFactoryArgs) => {
  const creds: ApiKeyCreds | undefined = userApiCreds
    ? {
        key: userApiCreds.apiKey,
        secret: userApiCreds.secret,
        passphrase: userApiCreds.passphrase,
      }
    : undefined;

  return new ClobClient(
    host,
    chainId,
    signer ? (signer as unknown as ConstructorParameters<typeof ClobClient>[2]) : undefined,
    creds,
    signatureType,
    proxyWalletAddress ?? undefined,
    undefined,
    undefined,
  );
};
