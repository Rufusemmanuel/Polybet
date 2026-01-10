import TradePageClient from './trade-page-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

type Props = {
  params: { id: string };
};

export default function TradeMarketPage({ params }: Props) {
  return <TradePageClient marketId={params.id} />;
}
