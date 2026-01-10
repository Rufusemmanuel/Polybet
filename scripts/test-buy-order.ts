import { createOrderHandler } from '../src/lib/server/polymarketOrderHandler';

const handler = createOrderHandler({
  getSession: async () => ({
    l2: {
      apiKey: 'test-api-key',
      secret: 'test-secret',
      passphrase: 'test-passphrase',
    },
    walletAddress: '0x0000000000000000000000000000000000000001',
    createdAt: Date.now(),
  }),
  isSessionExpired: () => false,
  buildL2Headers: async () => ({
    POLY_ADDRESS: '0x0000000000000000000000000000000000000001',
    POLY_SIGNATURE: 'test-signature',
    POLY_TIMESTAMP: '0',
    POLY_API_KEY: 'test-api-key',
    POLY_PASSPHRASE: 'test-passphrase',
  }),
  getBuilderHeaders: async () => undefined,
  clobHost: 'https://clob.polymarket.com',
  fetchImpl: async (_url, init) => {
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : null;
    if (body?.order?.side !== '0' || body?.orderType !== 'FOK') {
      return new Response(JSON.stringify({ success: false, errorMsg: 'Unexpected payload' }), {
        status: 400,
      });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  },
  logger: {
    info: () => {},
    error: console.error,
  },
});

const payload = {
  tradeMode: 'market',
  execution: 'FOK',
  tokenId: '5863',
  side: 'BUY',
  order: {
    salt: '1',
    maker: '0x0000000000000000000000000000000000000001',
    signer: '0x0000000000000000000000000000000000000001',
    taker: '0x0000000000000000000000000000000000000000',
    tokenId: '5863',
    makerAmount: '1000000',
    takerAmount: '1000000',
    expiration: '0',
    nonce: '1',
    feeRateBps: '0',
    side: 'BUY',
    signatureType: 2,
    signature: `0x${'0'.repeat(130)}`,
  },
};

const run = async () => {
  const request = new Request('http://localhost/api/polymarket/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const response = await handler(request);
  const data = await response.json();

  if (!response.ok || !data?.ok) {
    console.error('BUY order handler test failed.', {
      status: response.status,
      data,
    });
    process.exit(1);
  }

  console.log('BUY order handler test passed.');
};

run().catch((error) => {
  console.error('BUY order handler test failed.', error);
  process.exit(1);
});
