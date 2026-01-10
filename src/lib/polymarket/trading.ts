import 'server-only';

type TradingStatus = {
  enabled: boolean;
  tradingFlag: boolean;
  hasBuilderKeys: boolean;
  missing: string[];
};

const isEnabledFlag = (value: string | undefined) =>
  value === '1' || value?.toLowerCase() === 'true';

export const resolveTradingStatus = (): TradingStatus => {
  const tradingFlag = isEnabledFlag(process.env.ENABLE_TRADING);
  const missing: string[] = [];

  if (!process.env.POLY_BUILDER_API_KEY) missing.push('POLY_BUILDER_API_KEY');
  if (!process.env.POLY_BUILDER_SECRET) missing.push('POLY_BUILDER_SECRET');
  if (!process.env.POLY_BUILDER_PASSPHRASE) missing.push('POLY_BUILDER_PASSPHRASE');

  const hasBuilderKeys = missing.length === 0;

  return {
    enabled: tradingFlag && hasBuilderKeys,
    tradingFlag,
    hasBuilderKeys,
    missing,
  };
};
