# Proxy Wallet Load/Refresh Debug Notes

Date: 2026-01-09

## Environment
- CLI-only environment (no browser wallet / MetaMask available).
- No interactive UI session to capture browser console/network logs.

## Reproduction Attempt
1) Attempted to reproduce proxy wallet init via local CLI environment without a wallet provider.
2) Observed expected client-side guard path when `window.ethereum` is unavailable.

## Observed Errors
- Client guard: `Wallet provider not available.` (triggered by `usePolymarketSession` when `window.ethereum` is missing).
- Reported production error: ethers v5 "missing response" during `eth_getCode` for `deployed?address=...` (chainId 137, RPC host `https://rpc.ankr.com/polygon`).

## Reported Network Failures
- `GET /deployed?address=0x…`
  - Response: 502 (before fix), `error: "RPC error"` / `"missing response"`
  - Observed bursty retries when upstream RPC flakes.

## Reported Server Logs
- `eth_getCode` failures reported as `"missing response"` during high-frequency deploy checks.

## Missing Captures (Constraints)
- Browser console stack trace: not available in CLI-only environment.
- Network traces: not available without a running browser session.
- Server logs: no proxy wallet requests were made without a browser wallet session.

## Fixes Applied
- Single-flight init with retry/backoff and SSR guard in `usePolymarketSession`.
- Deduped balance reads to avoid request storms.
- Relayer deploy dedupe on client and server; cache to avoid repeated deploy calls on refresh.
- Session status now reports `expired` and clears expired session on server.
- Deployed check now uses fallback Polygon RPCs, caching, and deduped single-flight.
- Deployed API now returns stable JSON errors (`RPC_UNAVAILABLE`) with HTTP 200 to avoid retry storms.

## Additional Diagnostics
- Dev log on successful session init: `[wallet] session ready`.
- Proxy wallet cache test: `npm run test:proxy-wallet`.

## Next Recommended Capture (when UI available)
1) Start `npm run dev` and open the app in a browser with wallet installed.
2) Capture:
   - Console stack trace on hard refresh.
   - Network calls to `/api/polymarket/auth/status`, `/api/polymarket/auth/init`,
     `/api/polymarket/relayer/deploy`, and any RPC failures.
   - Server logs around relayer deployment and session init.
