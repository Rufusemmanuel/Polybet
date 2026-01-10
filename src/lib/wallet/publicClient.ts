import { createPublicClient, http } from 'viem';
import { polygon } from 'viem/chains';

const POLYGON_RPC_URL =
  process.env.NEXT_PUBLIC_POLYGON_RPC_URL ?? 'https://polygon-rpc.com';

let cachedClient: ReturnType<typeof createPublicClient> | null = null;

export const getPolygonPublicClient = () => {
  if (!cachedClient) {
    cachedClient = createPublicClient({
      chain: polygon,
      transport: http(POLYGON_RPC_URL),
    });
  }
  return cachedClient;
};
