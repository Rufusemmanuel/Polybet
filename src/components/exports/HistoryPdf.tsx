import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { EXPORT_BRAND } from './historyExportBrand';
import {
  formatDate,
  formatPct,
  formatPrice,
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

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 42,
    paddingHorizontal: 36,
    fontSize: 10,
    color: EXPORT_BRAND.text,
    fontFamily: 'Helvetica',
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: EXPORT_BRAND.text,
  },
  metaLine: {
    fontSize: 10,
    color: EXPORT_BRAND.textMuted,
    marginTop: 6,
  },
  metaStrong: {
    color: EXPORT_BRAND.text,
  },
  badge: {
    height: 28,
    width: 28,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  logo: {
    height: 28,
    width: 28,
    objectFit: 'contain',
  },
  divider: {
    height: 1,
    backgroundColor: EXPORT_BRAND.border,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  summaryRowSplit: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  summaryCard: {
    flexGrow: 1,
    border: `1px solid ${EXPORT_BRAND.border}`,
    borderRadius: 8,
    backgroundColor: 'white',
    padding: 12,
  },
  summaryLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: EXPORT_BRAND.textMuted,
  },
  summaryValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: 700,
  },
  summaryValueAccent: {
    color: EXPORT_BRAND.accent,
  },
  summaryValueMuted: {
    color: EXPORT_BRAND.textMuted,
  },
  summarySubtle: {
    marginTop: 2,
    fontSize: 9,
    color: EXPORT_BRAND.textMuted,
  },
  table: {
    border: `1px solid ${EXPORT_BRAND.border}`,
    borderRadius: 8,
    overflow: 'hidden',
    paddingTop: 18,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: EXPORT_BRAND.primary,
    color: 'white',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottom: `1px solid ${EXPORT_BRAND.border}`,
    minHeight: 32,
  },
  cellMarket: { width: '34%' },
  cellCategory: { width: '10%' },
  cellBookmarked: { width: '18%' },
  cellEntry: { width: '8%' },
  cellFinal: { width: '8%' },
  cellPL: { width: '8%' },
  cellReturn: { width: '7%' },
  cellStatus: { width: '7%' },
  headerText: {
    fontSize: 9,
    fontWeight: 600,
  },
  bodyText: {
    fontSize: 10,
    color: '#334155',
  },
  bodyTextStrong: {
    fontWeight: 600,
  },
  bodyTextMuted: {
    fontSize: 9,
    color: '#64748b',
  },
  alignRight: {
    textAlign: 'right',
  },
  statusPill: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    fontSize: 8,
    fontWeight: 700,
    alignSelf: 'flex-start',
  },
  footer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: '#94a3b8',
    fontSize: 8,
  },
  footerRight: {
    textAlign: 'right',
  },
});

const statusColors: Record<HistoryExportRow['status'], { bg: string; text: string }> = {
  Closed: { bg: '#effaf3', text: '#166534' },
  Removed: { bg: '#fef2f2', text: '#991b1b' },
  Active: { bg: '#eff6ff', text: '#1e40af' },
};

export function HistoryPdf({
  rows,
  summary,
  userName,
  generatedAt,
  periodLabel,
  timeZoneLabel,
  logoSrc,
}: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <View>
            <Text style={{ letterSpacing: 2, fontSize: 9, color: EXPORT_BRAND.textMuted }}>
              POLYPICKS
            </Text>
            <Text style={styles.title}>Trade History Report</Text>
            <Text style={styles.metaLine}>
              <Text style={styles.metaStrong}>
                User: {userName ?? 'Unknown'}{'  '}
              </Text>
              Exported: {formatTimestamp(generatedAt)}{'  '}TZ: {timeZoneLabel}
            </Text>
            <Text style={styles.metaLine}>Period: {periodLabel}</Text>
          </View>
          <View style={styles.badge}>
            {logoSrc ? (
              <Image src={logoSrc} style={styles.logo} />
            ) : (
              <Text style={styles.metaLine}>PolyPicks</Text>
            )}
          </View>
        </View>
        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Trades</Text>
            <Text style={styles.summaryValue}>{summary.count}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Win rate</Text>
            <Text style={styles.summaryValue}>
              {summary.winRate == null ? 'N/A' : `${summary.winRate.toFixed(1)}%`}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total P/L</Text>
            <Text style={[styles.summaryValue, styles.summaryValueAccent]}>
              {formatSignedCents(summary.totalPL)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Net return</Text>
            <Text
              style={[
                styles.summaryValue,
                summary.netReturnPct != null && summary.netReturnPct > 0
                  ? styles.summaryValueAccent
                  : styles.summaryValueMuted,
              ]}
            >
              {summary.netReturnPct == null
                ? 'N/A'
                : `${summary.netReturnPct.toFixed(1)}%`}
            </Text>
          </View>
        </View>
        <View style={styles.summaryRowSplit}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Best trade</Text>
            <Text style={[styles.summaryValue, { fontSize: 12 }]}>
              {summary.best?.title ?? 'N/A'}
            </Text>
            <Text style={styles.summarySubtle}>
              {summary.best?.returnPct != null
                ? formatPct(summary.best.returnPct)
                : 'N/A'}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Worst trade</Text>
            <Text style={[styles.summaryValue, { fontSize: 12 }]}>
              {summary.worst?.title ?? 'N/A'}
            </Text>
            <Text style={styles.summarySubtle}>
              {summary.worst?.returnPct != null
                ? formatPct(summary.worst.returnPct)
                : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            <Text style={[styles.headerText, styles.cellMarket]}>Market</Text>
            <Text style={[styles.headerText, styles.cellCategory]}>Category</Text>
            <Text style={[styles.headerText, styles.cellBookmarked]}>Bookmarked</Text>
            <Text style={[styles.headerText, styles.cellEntry, styles.alignRight]}>
              Entry
            </Text>
            <Text style={[styles.headerText, styles.cellFinal, styles.alignRight]}>Final</Text>
            <Text style={[styles.headerText, styles.cellPL, styles.alignRight]}>P/L</Text>
            <Text style={[styles.headerText, styles.cellReturn, styles.alignRight]}>
              Return
            </Text>
            <Text style={[styles.headerText, styles.cellStatus]}>Status</Text>
          </View>

          {rows.map((row, index) => {
            const stripe = index % 2 === 0 ? EXPORT_BRAND.stripe : 'white';
            const statusStyle = statusColors[row.status];
            return (
              <View key={row.id} style={[styles.tableRow, { backgroundColor: stripe }]}>
                <Text style={[styles.bodyText, styles.bodyTextStrong, styles.cellMarket]}>
                  {truncate(row.title ?? 'Unknown market', 72)}
                </Text>
                <Text style={[styles.bodyTextMuted, styles.cellCategory]}>
                  {row.category ?? 'Unknown'}
                </Text>
                <View style={styles.cellBookmarked}>
                  <Text style={styles.bodyText}>{formatDate(row.createdAt)}</Text>
                  <Text style={styles.bodyTextMuted}>{formatTime(row.createdAt)}</Text>
                </View>
                <Text style={[styles.bodyText, styles.cellEntry, styles.alignRight]}>
                  {formatPrice(row.entryPrice)}
                </Text>
                <Text style={[styles.bodyText, styles.cellFinal, styles.alignRight]}>
                  {formatPrice(row.latestPrice)}
                </Text>
                <Text style={[styles.bodyText, styles.cellPL, styles.alignRight]}>
                  {formatSignedCents(row.profitDelta)}
                </Text>
                <Text style={[styles.bodyText, styles.cellReturn, styles.alignRight]}>
                  {formatPct(row.returnPct)}
                </Text>
                <View style={[styles.cellStatus, { alignItems: 'flex-start' }]}>
                  <Text
                    style={[
                      styles.statusPill,
                      { backgroundColor: statusStyle.bg, color: statusStyle.text },
                    ]}
                  >
                    {row.status}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.footer} fixed>
          <Text>Generated by PolyPicks</Text>
          <Text
            style={styles.footerRight}
            render={({ pageNumber, totalPages }) =>
              `polypicks.app - Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
