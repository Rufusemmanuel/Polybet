const sampleNumericSide = {
  tradeMode: 'market',
  execution: 'FOK',
  tokenId: '5863',
  side: 0,
  signatureType: 2,
  funderAddress: '0x0000000000000000000000000000000000000000',
  order: {
    salt: '1',
    maker: '0x0000000000000000000000000000000000000000',
    signer: '0x0000000000000000000000000000000000000000',
    taker: '0x0000000000000000000000000000000000000000',
    tokenId: '5863',
    makerAmount: '1',
    takerAmount: '1',
    expiration: '0',
    nonce: '1',
    feeRateBps: '0',
    side: 0,
    signatureType: 2,
    signature: '0x' + '0'.repeat(130),
  },
};

const url = process.env.ORDER_TEST_URL ?? 'http://localhost:3000/api/polymarket/order';

try {
  const variants = [
    { label: 'numeric-side', payload: sampleNumericSide },
    {
      label: 'string-side',
      payload: {
        ...sampleNumericSide,
        side: 'BUY',
        order: { ...sampleNumericSide.order, side: 'BUY' },
      },
    },
  ];

  for (const variant of variants) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(variant.payload),
    });
    const text = await res.text();
    console.log('Variant:', variant.label);
    console.log('Status:', res.status);
    console.log('Response:', text || '<empty>');
  }
} catch (error) {
  console.warn('Order payload test skipped (server unreachable).', error);
}
