type MarketLike = {
  status?: unknown;
  closed?: unknown;
  isClosed?: unknown;
  active?: unknown;
  tradingEnabled?: unknown;
  endDate?: unknown;
  end_time?: unknown;
  closeTime?: unknown;
  closedTime?: unknown;
  closesAt?: unknown;
};

const CLOSED_STATUSES = new Set(['closed', 'resolved', 'finalized', 'settled']);

const parseDateValue = (value: unknown) => {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

export const isMarketClosed = (market?: MarketLike | null) => {
  if (!market || typeof market !== 'object') return false;
  const status =
    typeof market.status === 'string' ? market.status.toLowerCase() : null;
  const statusClosed = status ? CLOSED_STATUSES.has(status) : false;
  if (statusClosed) return true;
  if (market.closed === true) return true;
  if (market.isClosed === true) return true;
  if (market.active === false) return true;
  if (market.tradingEnabled === false) return true;

  const closeValue =
    market.endDate ??
    market.end_time ??
    market.closeTime ??
    market.closedTime ??
    market.closesAt;
  const closeDate = parseDateValue(closeValue);
  if (!closeDate) return false;
  return statusClosed && closeDate.getTime() <= Date.now();
};
