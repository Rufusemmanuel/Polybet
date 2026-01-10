import { encodeFunctionData, maxUint256 } from 'viem';
import type { WalletClient } from 'viem';
import { getContractConfig } from '@polymarket/clob-client';
import type { getPolygonPublicClient } from '@/lib/wallet/publicClient';

const { collateral, conditionalTokens, exchange, negRiskExchange } =
  getContractConfig(137);

export const USDCe = collateral as `0x${string}`;
export const CTF = conditionalTokens as `0x${string}`;
export const CTF_EXCHANGE = exchange as `0x${string}`;
export const NEG_RISK_CTF_EXCHANGE = negRiskExchange as `0x${string}`;

const erc20AllowanceAbi = [
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: 'value', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
] as const;

const erc1155ApprovalAbi = [
  {
    type: 'function',
    name: 'isApprovedForAll',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    outputs: [{ name: 'approved', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'setApprovalForAll',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
  },
] as const;

export type ApprovalStatus = {
  usdcAllowanceOk: boolean;
  ctfExchangeOk: boolean;
  negRiskOk: boolean;
  allOk: boolean;
};

type ApprovalStep = 'usdc' | 'ctfExchange' | 'negRisk';
type ApprovalStepStatus = 'pending' | 'in_progress' | 'done' | 'error';

type PolygonPublicClient = ReturnType<typeof getPolygonPublicClient>;

export const getApprovalStatus = async ({
  publicClient,
  walletAddress,
}: {
  publicClient: PolygonPublicClient;
  walletAddress: `0x${string}`;
}): Promise<ApprovalStatus> => {
  const allowance = await publicClient.readContract({
    address: USDCe,
    abi: erc20AllowanceAbi,
    functionName: 'allowance',
    args: [walletAddress, CTF],
  });
  const ctfExchangeOk = await publicClient.readContract({
    address: CTF,
    abi: erc1155ApprovalAbi,
    functionName: 'isApprovedForAll',
    args: [walletAddress, CTF_EXCHANGE],
  });
  const negRiskOk = await publicClient.readContract({
    address: CTF,
    abi: erc1155ApprovalAbi,
    functionName: 'isApprovedForAll',
    args: [walletAddress, NEG_RISK_CTF_EXCHANGE],
  });
  const usdcAllowanceOk = typeof allowance === 'bigint' ? allowance > 0n : false;
  return {
    usdcAllowanceOk,
    ctfExchangeOk: Boolean(ctfExchangeOk),
    negRiskOk: Boolean(negRiskOk),
    allOk: usdcAllowanceOk && Boolean(ctfExchangeOk) && Boolean(negRiskOk),
  };
};

export const ensureApprovals = async ({
  walletClient,
  publicClient,
  walletAddress,
  onStep,
}: {
  walletClient: WalletClient;
  publicClient: PolygonPublicClient;
  walletAddress: `0x${string}`;
  onStep?: (step: ApprovalStep, status: ApprovalStepStatus) => void;
}) => {
  const status = await getApprovalStatus({ publicClient, walletAddress });
  if (status.allOk) return status;

  let didUpdate = false;
  const sendTransaction = async (step: ApprovalStep, to: `0x${string}`, data: `0x${string}`) => {
    onStep?.(step, 'in_progress');
    try {
      const hash = await walletClient.sendTransaction({
        account: walletAddress,
        to,
        data,
        value: 0n,
        chain: walletClient.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      onStep?.(step, 'done');
      didUpdate = true;
    } catch (error) {
      onStep?.(step, 'error');
      throw error;
    }
  };

  try {
    if (!status.usdcAllowanceOk) {
      const data = encodeFunctionData({
        abi: erc20AllowanceAbi,
        functionName: 'approve',
        args: [CTF, maxUint256],
      });
      await sendTransaction('usdc', USDCe, data);
    }
    if (!status.ctfExchangeOk) {
      const data = encodeFunctionData({
        abi: erc1155ApprovalAbi,
        functionName: 'setApprovalForAll',
        args: [CTF_EXCHANGE, true],
      });
      await sendTransaction('ctfExchange', CTF, data);
    }
    if (!status.negRiskOk) {
      const data = encodeFunctionData({
        abi: erc1155ApprovalAbi,
        functionName: 'setApprovalForAll',
        args: [NEG_RISK_CTF_EXCHANGE, true],
      });
      await sendTransaction('negRisk', CTF, data);
    }
  } catch (error) {
    throw error;
  }

  if (didUpdate) {
    const res = await fetch('/api/polymarket/allowance/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const message = await res.text().catch(() => '');
      throw new Error(message || 'Unable to refresh allowance.');
    }
  }

  return getApprovalStatus({ publicClient, walletAddress });
};
