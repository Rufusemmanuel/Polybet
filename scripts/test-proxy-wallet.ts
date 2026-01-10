import { ensureRelayerProxy } from '../src/lib/polymarket/relayerService';

const address = '0x0000000000000000000000000000000000000001';
let fetchCount = 0;

global.fetch = (async (_input: RequestInfo | URL, _init?: RequestInit) => {
  fetchCount += 1;
  return new Response(
    JSON.stringify({ ok: true, proxyWalletAddress: address, deployed: true }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}) as typeof fetch;

const run = async () => {
  const [first, second] = await Promise.all([
    ensureRelayerProxy(address),
    ensureRelayerProxy(address),
  ]);

  if (first.proxyWalletAddress !== address || second.proxyWalletAddress !== address) {
    throw new Error('Proxy address mismatch.');
  }
  if (fetchCount !== 1) {
    throw new Error(`Expected 1 fetch call, got ${fetchCount}.`);
  }

  await ensureRelayerProxy(address);
  if (fetchCount !== 1) {
    throw new Error(`Expected cached call, got ${fetchCount}.`);
  }
  console.log('Proxy wallet cache test passed.');
};

run().catch((error) => {
  console.error('Proxy wallet cache test failed.', error);
  process.exit(1);
});
