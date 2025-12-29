import TradeClient from './trade-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function TradePage() {
  return <TradeClient />;
}
