'use client';

import { useMemo } from 'react';
import type { OrderBookLevel } from '@/lib/polymarket/marketDataService';
import { useTheme } from '@/components/theme-context';

type Props = {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  isLoading: boolean;
  error: string | null;
  onSelectLevel?: (payload: { price: number; size: number; side: 'bid' | 'ask' }) => void;
};

const formatPrice = (price: number) => `${Math.round(price * 100)}c`;
const formatSize = (size: number) => size.toFixed(2);

export function OrderBook({ bids, asks, isLoading, error, onSelectLevel }: Props) {
  const { isDark } = useTheme();
  const empty = !isLoading && !bids.length && !asks.length;

  const rows = useMemo(
    () => ({
      asks: asks.slice(0, 12),
      bids: bids.slice(0, 12),
    }),
    [asks, bids],
  );

  return (
    <div
      className={`rounded-2xl border p-4 ${isDark ? 'border-slate-800 bg-[#0f182c]' : 'border-slate-200 bg-white'}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Order Book
          </p>
          <p className="text-lg font-semibold">Live depth</p>
        </div>
        <div
          className={`h-10 w-28 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 text-xs uppercase tracking-wide">
        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Price</span>
        <span className={`text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Size</span>
        <span className={`text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total</span>
      </div>

      {isLoading && (
        <p className={`mt-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Loading order book...
        </p>
      )}
      {error && (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      )}
      {empty && (
        <p className={`mt-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          No depth available yet.
        </p>
      )}

      <div className="mt-3 space-y-2">
        {rows.asks.map((level, idx) => (
          <button
            key={`ask-${idx}`}
            type="button"
            onClick={() => onSelectLevel?.({ price: level.price, size: level.size, side: 'ask' })}
            className={`flex w-full items-center justify-between rounded-lg px-2 py-1 text-sm transition ${
              isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'
            }`}
          >
            <span className="font-semibold text-red-400">{formatPrice(level.price)}</span>
            <span className="text-right">{formatSize(level.size)}</span>
            <span className="text-right text-xs">{formatSize(level.cumulativeSize)}</span>
          </button>
        ))}
      </div>

      <div className={`my-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`} />

      <div className="space-y-2">
        {rows.bids.map((level, idx) => (
          <button
            key={`bid-${idx}`}
            type="button"
            onClick={() => onSelectLevel?.({ price: level.price, size: level.size, side: 'bid' })}
            className={`flex w-full items-center justify-between rounded-lg px-2 py-1 text-sm transition ${
              isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'
            }`}
          >
            <span className="font-semibold text-blue-400">{formatPrice(level.price)}</span>
            <span className="text-right">{formatSize(level.size)}</span>
            <span className="text-right text-xs">{formatSize(level.cumulativeSize)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
