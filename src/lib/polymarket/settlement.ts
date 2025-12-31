type SettlementInputs = {
  bookmarkOutcomeId?: string | null;
  bookmarkOutcomeLabel?: string | null;
  winningOutcomeId?: string | null;
  winningOutcomeLabel?: string | null;
  outcomeLabels?: string[] | null;
  outcomeTokenIds?: string[] | null;
};

const normalizeLabel = (value: string | null | undefined) =>
  value ? value.trim().toLowerCase() : null;

const findOutcomeIndex = (labels: string[] | null | undefined, target: string | null) => {
  if (!labels?.length || !target) return null;
  const normalized = normalizeLabel(target);
  if (!normalized) return null;
  const idx = labels.findIndex((label) => normalizeLabel(label) === normalized);
  return idx >= 0 ? idx : null;
};

const resolveOutcomeIdForLabel = (
  labels: string[] | null | undefined,
  tokenIds: string[] | null | undefined,
  label: string | null,
) => {
  if (!labels?.length || !tokenIds?.length || !label) return null;
  const idx = findOutcomeIndex(labels, label);
  if (idx == null) return null;
  return tokenIds[idx] ?? null;
};

export const resolveFinalPrice = ({
  bookmarkOutcomeId,
  bookmarkOutcomeLabel,
  winningOutcomeId,
  winningOutcomeLabel,
  outcomeLabels,
  outcomeTokenIds,
}: SettlementInputs): number | null => {
  if (!winningOutcomeId && !winningOutcomeLabel) return null;

  let winningId = winningOutcomeId ?? null;
  if (!winningId && winningOutcomeLabel) {
    winningId = resolveOutcomeIdForLabel(outcomeLabels, outcomeTokenIds, winningOutcomeLabel);
  }

  if (winningId && bookmarkOutcomeId) {
    return winningId === bookmarkOutcomeId ? 1 : 0;
  }

  let bookmarkLabel = bookmarkOutcomeLabel ?? null;
  if (!bookmarkLabel && bookmarkOutcomeId) {
    const idx = outcomeTokenIds?.findIndex((id) => id === bookmarkOutcomeId) ?? -1;
    bookmarkLabel = idx >= 0 ? outcomeLabels?.[idx] ?? null : null;
  }

  if (bookmarkLabel && winningOutcomeLabel) {
    return normalizeLabel(bookmarkLabel) === normalizeLabel(winningOutcomeLabel) ? 1 : 0;
  }

  return null;
};

export const inferBookmarkOutcome = ({
  entryPrice,
  outcomeLabels,
  outcomePrices,
  outcomeTokenIds,
  fallbackLabel,
}: {
  entryPrice: number | null;
  outcomeLabels?: string[] | null;
  outcomePrices?: number[] | null;
  outcomeTokenIds?: string[] | null;
  fallbackLabel?: string | null;
}): { outcomeId: string | null; outcomeLabel: string | null; source: 'matched' | 'fallback' | 'none' } => {
  const labels = outcomeLabels ?? [];
  const prices = outcomePrices ?? [];
  const tokenIds = outcomeTokenIds ?? [];

  if (entryPrice != null && labels.length && prices.length) {
    let bestIdx = 0;
    let bestDiff = Math.abs(prices[0] - entryPrice);
    for (let i = 1; i < prices.length; i += 1) {
      const diff = Math.abs(prices[i] - entryPrice);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
    }
    if (bestDiff <= 0.03) {
      return {
        outcomeId: tokenIds[bestIdx] ?? null,
        outcomeLabel: labels[bestIdx] ?? null,
        source: 'matched',
      };
    }
  }

  if (fallbackLabel) {
    // Fallback to the leading outcome when no close price match is available.
    return {
      outcomeId: resolveOutcomeIdForLabel(labels, tokenIds, fallbackLabel),
      outcomeLabel: fallbackLabel,
      source: 'fallback',
    };
  }

  return { outcomeId: null, outcomeLabel: null, source: 'none' };
};
