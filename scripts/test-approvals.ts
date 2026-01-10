import { getApprovalStatus } from '@/lib/polymarket/approvals';
import { getPolygonPublicClient } from '@/lib/wallet/publicClient';

const [walletAddress] = process.argv.slice(2);

if (!walletAddress) {
  console.error('Usage: tsx scripts/test-approvals.ts <walletAddress>');
  process.exit(1);
}

const publicClient = getPolygonPublicClient();

getApprovalStatus({ publicClient, walletAddress: walletAddress as `0x${string}` })
  .then((status) => {
    console.log(JSON.stringify(status, null, 2));
  })
  .catch((error) => {
    console.error('Approval status check failed:', error);
    process.exit(1);
  });
