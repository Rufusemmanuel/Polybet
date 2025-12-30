import { forwardRef } from 'react';
import { EXPORT_BRAND } from './historyExportBrand';
import {
  formatDate,
  formatPct,
  formatSignedCents,
  formatTime,
  formatTimestamp,
} from './historyExportFormat';
import type { HistoryExportRow, HistoryExportSummary } from './historyExportTypes';

type Props = {
  rows: HistoryExportRow[];
  summary: HistoryExportSummary;
  userName?: string | null;
  generatedAt: string;
  periodLabel: string;
  timeZoneLabel: string;
  logoSrc?: string | null;
};

const truncate = (s: string, max = 76) => {
  const str = (s ?? '').trim();
  if (str.length <= max) return str;
  return `${str.slice(0, max - 3).trimEnd()}...`;
};

const statusStyles: Record<HistoryExportRow['status'], { bg: string; text: string }> = {
  Closed: { bg: '#effaf3', text: '#166534' },
  Removed: { bg: '#fef2f2', text: '#991b1b' },
  Active: { bg: '#eff6ff', text: '#1e40af' },
};

export const HistoryExportDom = forwardRef<HTMLDivElement, Props>(
  ({ rows, summary, userName, generatedAt, periodLabel, timeZoneLabel, logoSrc }, ref) => {
    return (
      <div
        ref={ref}
        className="w-[794px] bg-white text-slate-900"
        style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif' }}
      >
        <div className="px-10 pb-10 pt-12">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                PolyPicks
              </div>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                Trade History Report
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                <span className="font-semibold text-slate-900">
                  User: {userName ?? 'Unknown'}{' '}
                </span>
                <span className="ml-3">Exported: {formatTimestamp(generatedAt)}</span>
                <span className="ml-3">TZ: {timeZoneLabel}</span>
              </p>
              <p className="mt-1 text-sm text-slate-500">Period: {periodLabel}</p>
            </div>
            {logoSrc ? (
              <img src={logoSrc} alt="PolyPicks" className="h-7 w-7 object-contain" />
            ) : (
              <span className="text-xs font-semibold text-slate-600">PolyPicks</span>
            )}
          </div>
          <div className="mt-4 h-px w-full bg-slate-200" />

          <div className="mt-6 grid grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Trades
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {summary.count}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Win rate
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {summary.winRate == null ? 'N/A' : `${summary.winRate.toFixed(1)}%`}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Total P/L
              </p>
              <p className="mt-1 text-lg font-semibold" style={{ color: EXPORT_BRAND.accent }}>
                {formatSignedCents(summary.totalPL)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Net return
              </p>
              <p
                className="mt-1 text-lg font-semibold"
                style={{
                  color:
                    summary.netReturnPct != null && summary.netReturnPct > 0
                      ? EXPORT_BRAND.accent
                      : '#64748b',
                }}
              >
                {summary.netReturnPct == null
                  ? 'N/A'
                  : `${summary.netReturnPct.toFixed(1)}%`}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Best trade
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {summary.best?.title ?? 'N/A'}
              </p>
              <p className="text-xs text-slate-500">
                {summary.best?.returnPct != null
                  ? formatPct(summary.best.returnPct)
                  : 'N/A'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Worst trade
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {summary.worst?.title ?? 'N/A'}
              </p>
              <p className="text-xs text-slate-500">
                {summary.worst?.returnPct != null
                  ? formatPct(summary.worst.returnPct)
                  : 'N/A'}
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead style={{ backgroundColor: EXPORT_BRAND.primary }} className="text-white">
                <tr>
                  <th className="px-3 py-2 font-semibold w-[42%]">Market</th>
                  <th className="px-3 py-2 font-semibold w-[10%]">Category</th>
                  <th className="px-3 py-2 font-semibold w-[22%]">Bookmarked</th>
                  <th className="px-3 py-2 font-semibold w-[10%] text-right">P/L</th>
                  <th className="px-3 py-2 font-semibold w-[8%] text-right">Return</th>
                  <th className="px-3 py-2 font-semibold w-[8%]">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const stripe = index % 2 === 0;
                  const statusStyle = statusStyles[row.status];
                  return (
                    <tr
                      key={row.id}
                      style={{ backgroundColor: stripe ? EXPORT_BRAND.stripe : 'white' }}
                    >
                      <td className="px-3 py-2 align-top text-slate-900">
                        <div className="font-semibold break-words">
                          {truncate(row.title ?? 'Unknown market', 72)}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top text-slate-600 break-words">
                        {row.category ?? 'Unknown'}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-600">
                        <div>{formatDate(row.createdAt)}</div>
                        <div className="text-[11px] text-slate-400">
                          {formatTime(row.createdAt)}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top text-right text-slate-700">
                        {formatSignedCents(row.profitDelta)}
                      </td>
                      <td className="px-3 py-2 align-top text-right text-slate-700">
                        {formatPct(row.returnPct)}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span
                          className="inline-flex rounded-full px-2 py-1 text-[10px] font-semibold"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex items-center justify-between text-xs text-slate-400">
            <span>Generated by PolyPicks</span>
            <span>polypicks.app</span>
          </div>
        </div>
      </div>
    );
  },
);

HistoryExportDom.displayName = 'HistoryExportDom';
