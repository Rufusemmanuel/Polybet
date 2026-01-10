'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/components/theme-context';
import type { MarketDetailsResponse } from '@/lib/polymarket/types';
import { TradeExperience } from '@/components/trade/TradeExperience';

type Props = {
  marketId: string;
};

export default function TradePageClient({ marketId }: Props) {
  const { isDark } = useTheme();
  const [market, setMarket] = useState<MarketDetailsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    fetch(`/api/markets/${marketId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Unable to load market.');
        return (await res.json()) as MarketDetailsResponse;
      })
      .then((data) => {
        if (isMounted) setMarket(data);
      })
      .catch((err: Error) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [marketId]);

  return (
    <main className={isDark ? 'min-h-screen bg-[#0b1224] text-slate-100' : 'min-h-screen bg-slate-50 text-slate-900'}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        {loading && (
          <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Loading market...</p>
        )}
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        {!loading && !error && (
          <TradeExperience marketId={marketId} market={market} />
        )}
      </div>
    </main>
  );
}
