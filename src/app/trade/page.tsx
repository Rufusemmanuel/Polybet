'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/useSession';
import { useBookmarks } from '@/lib/useBookmarks';
import { useMarkets } from '@/lib/useMarkets';

export default function TradePage() {
  const sessionQuery = useSession();
  const user = sessionQuery.data?.user ?? null;
  const bookmarksQuery = useBookmarks(Boolean(user));
  const marketsQuery = useMarkets();
  const router = useRouter();
  type AnyRoute = Parameters<typeof router.push>[0];
  const asRoute = (href: string) => href as unknown as AnyRoute;

  useEffect(() => {
    if (sessionQuery.isLoading) return;
    if (!user) {
      router.push(asRoute('/?auth=login'));
    }
  }, [sessionQuery.isLoading, user, router]);

  const marketMap = useMemo(() => {
    const all = [
      ...(marketsQuery.data?.window24 ?? []),
      ...(marketsQuery.data?.window48 ?? []),
    ];
    return new Map(all.map((market) => [market.id, market]));
  }, [marketsQuery.data?.window24, marketsQuery.data?.window48]);

  const bookmarkedMarkets = useMemo(() => {
    const ids = bookmarksQuery.data?.marketIds ?? [];
    return ids.map((id) => marketMap.get(id)).filter(Boolean);
  }, [bookmarksQuery.data?.marketIds, marketMap]);

  if (!user) {
    return (
      <main className="min-h-screen bg-[#0b1224] text-slate-100">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <p className="text-sm text-slate-300">Redirecting to login...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b1224] text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-12 space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">Trade</p>
          <h1 className="text-3xl font-semibold">Trade</h1>
          <p className="text-sm text-slate-400">Coming soon. Start with your bookmarked markets.</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0f182c] p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
            Bookmarked markets
          </h2>
          {bookmarkedMarkets.length === 0 && (
            <p className="text-sm text-slate-400">No bookmarks yet.</p>
          )}
          {bookmarkedMarkets.length > 0 && (
            <div className="space-y-3">
              {bookmarkedMarkets.map((market) => (
                <div
                  key={market!.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-[#0b1224] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm text-slate-400">{market!.category}</p>
                    <p className="text-base font-semibold">{market!.title}</p>
                  </div>
                  <a
                    href={market!.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-[#002cff] px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    Trade on Polymarket
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
