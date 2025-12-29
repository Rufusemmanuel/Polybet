'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/useSession';
import { useAlerts } from '@/lib/useAlerts';

type EditableAlert = {
  marketId: string;
  title: string | null;
  category: string | null;
  enabled: boolean;
  profitThresholdPct: number | null;
  lossThresholdPct: number | null;
  triggerOnce: boolean;
  cooldownMinutes: number;
};

export default function AlertsPage() {
  const sessionQuery = useSession();
  const user = sessionQuery.data?.user ?? null;
  const alertsQuery = useAlerts(Boolean(user));
  const router = useRouter();
  type AnyRoute = Parameters<typeof router.push>[0];
  const asRoute = (href: string) => href as unknown as AnyRoute;
  const [drafts, setDrafts] = useState<Record<string, EditableAlert>>({});

  useEffect(() => {
    if (sessionQuery.isLoading) return;
    if (!user) {
      router.push(asRoute('/?auth=login'));
    }
  }, [sessionQuery.isLoading, user, router, asRoute]);

  const alerts = useMemo(() => alertsQuery.data?.alerts ?? [], [alertsQuery.data?.alerts]);

  useEffect(() => {
    if (!alerts.length) return;
    setDrafts((prev) => {
      const next = { ...prev };
      alerts.forEach((alert) => {
        if (next[alert.marketId]) return;
        next[alert.marketId] = {
          marketId: alert.marketId,
          title: alert.title,
          category: alert.category,
          enabled: alert.enabled,
          profitThresholdPct: alert.profitThresholdPct,
          lossThresholdPct: alert.lossThresholdPct,
          triggerOnce: alert.triggerOnce,
          cooldownMinutes: alert.cooldownMinutes,
        };
      });
      return next;
    });
  }, [alerts]);

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
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">
            Alerts
          </p>
          <h1 className="text-3xl font-semibold">My alerts</h1>
          <p className="text-sm text-slate-400">
            Manage alert thresholds for your bookmarked markets.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0f182c] p-6 space-y-4">
          {alerts.length === 0 && (
            <p className="text-sm text-slate-400">No alerts yet.</p>
          )}
          {alerts.length > 0 && (
            <div className="space-y-4">
              {alerts.map((alert) => {
                const draft = drafts[alert.marketId] ?? {
                  marketId: alert.marketId,
                  title: alert.title,
                  category: alert.category,
                  enabled: alert.enabled,
                  profitThresholdPct: alert.profitThresholdPct,
                  lossThresholdPct: alert.lossThresholdPct,
                  triggerOnce: alert.triggerOnce,
                  cooldownMinutes: alert.cooldownMinutes,
                };
                const title = draft.title ?? 'Unknown market';
                const category = draft.category ?? 'Unknown';
                return (
                  <div
                    key={alert.marketId}
                    className="rounded-xl border border-slate-800 bg-[#0b1224] p-4 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          {category}
                        </p>
                        <p className="text-base font-semibold text-slate-100">{title}</p>
                      </div>
                      <Link
                        href={`/trade?marketId=${encodeURIComponent(
                          alert.marketId,
                        )}&tab=alerts`}
                        className="inline-flex h-9 items-center justify-center rounded-full border border-slate-700 px-4 text-xs font-semibold text-slate-200 hover:border-slate-400"
                      >
                        Open in trade
                      </Link>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#0f182c] px-4 py-3 text-sm">
                        <span className="text-slate-200">Enabled</span>
                        <input
                          type="checkbox"
                          checked={draft.enabled}
                          onChange={(event) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [alert.marketId]: {
                                ...draft,
                                enabled: event.target.checked,
                              },
                            }))
                          }
                          className="h-4 w-4 accent-blue-500"
                        />
                      </label>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-400">
                          Trigger mode
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setDrafts((prev) => ({
                                ...prev,
                                [alert.marketId]: { ...draft, triggerOnce: true },
                              }))
                            }
                            className={`flex-1 rounded-full border px-3 py-2 text-xs font-semibold ${
                              draft.triggerOnce
                                ? 'border-blue-400 text-blue-100'
                                : 'border-slate-700 text-slate-300'
                            }`}
                          >
                            Notify once
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDrafts((prev) => ({
                                ...prev,
                                [alert.marketId]: { ...draft, triggerOnce: false },
                              }))
                            }
                            className={`flex-1 rounded-full border px-3 py-2 text-xs font-semibold ${
                              !draft.triggerOnce
                                ? 'border-blue-400 text-blue-100'
                                : 'border-slate-700 text-slate-300'
                            }`}
                          >
                            Notify repeatedly
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-400">
                          Profit threshold (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={draft.profitThresholdPct ?? ''}
                          onChange={(event) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [alert.marketId]: {
                                ...draft,
                                profitThresholdPct: event.target.value
                                  ? Number(event.target.value)
                                  : null,
                              },
                            }))
                          }
                          className="w-full rounded-lg border border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
                          placeholder="e.g. 25"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-400">
                          Loss threshold (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={draft.lossThresholdPct ?? ''}
                          onChange={(event) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [alert.marketId]: {
                                ...draft,
                                lossThresholdPct: event.target.value
                                  ? Number(event.target.value)
                                  : null,
                              },
                            }))
                          }
                          className="w-full rounded-lg border border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
                          placeholder="e.g. 10"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs uppercase tracking-wide text-slate-400">
                          Cooldown (minutes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={draft.cooldownMinutes}
                          onChange={(event) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [alert.marketId]: {
                                ...draft,
                                cooldownMinutes: event.target.value
                                  ? Number(event.target.value)
                                  : 60,
                              },
                            }))
                          }
                          className="w-full rounded-lg border border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
                          placeholder="60"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await alertsQuery.saveAlert({
                            marketId: alert.marketId,
                            profitThresholdPct: draft.profitThresholdPct,
                            lossThresholdPct: draft.lossThresholdPct,
                            triggerOnce: draft.triggerOnce,
                            cooldownMinutes: draft.cooldownMinutes,
                            enabled: draft.enabled,
                          });
                        }}
                        className="inline-flex h-9 items-center justify-center rounded-full border border-blue-500/60 px-4 text-xs font-semibold text-blue-100 transition hover:border-blue-400"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await alertsQuery.deleteAlert(alert.marketId);
                        }}
                        className="inline-flex h-9 items-center justify-center rounded-full border border-red-500/60 px-4 text-xs font-semibold text-red-200 transition hover:border-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
