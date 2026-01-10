import 'server-only';

import { buildPolyHmacSignature } from '@polymarket/clob-client/dist/signing/hmac.js';
import type { PolymarketSessionData } from './session';

type L2HeaderArgs = {
  method: string;
  requestPath: string;
  body?: string;
};

export const buildL2Headers = async (
  session: PolymarketSessionData,
  args: L2HeaderArgs,
) => {
  if (!session.l2 || !session.walletAddress) {
    throw new Error('Missing Polymarket session.');
  }
  // requestPath must match the exact upstream path + query string.
  const ts = Math.floor(Date.now() / 1000);
  const body = args.body ?? '';
  const signature = await buildPolyHmacSignature(
    session.l2.secret,
    ts,
    args.method,
    args.requestPath,
    body,
  );
  return {
    POLY_ADDRESS: session.walletAddress,
    POLY_SIGNATURE: signature,
    POLY_TIMESTAMP: `${ts}`,
    POLY_API_KEY: session.l2.apiKey,
    POLY_PASSPHRASE: session.l2.passphrase,
  };
};
