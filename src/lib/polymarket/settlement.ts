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

export const findOutcomeIndex = (labels: string[] | null | undefined, target: string | null) => {
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

export const resolveOutcomeIndex = ({
  outcomeId,
  outcomeLabel,
  outcomeLabels,
  outcomeTokenIds,
}: {
  outcomeId?: string | null;
  outcomeLabel?: string | null;
  outcomeLabels?: string[] | null;
  outcomeTokenIds?: string[] | null;
}) => {
  if (outcomeId && outcomeTokenIds?.length) {
    const idx = outcomeTokenIds.findIndex((id) => id === outcomeId);
    return idx >= 0 ? idx : null;
  }
  if (outcomeLabel && outcomeLabels?.length) {
    return findOutcomeIndex(outcomeLabels, outcomeLabel);
  }
  return null;
};

export const resolveOutcomePrice = ({
  outcomeId,
  outcomeLabel,
  outcomeLabels,
  outcomeTokenIds,
  outcomePrices,
}: {
  outcomeId?: string | null;
  outcomeLabel?: string | null;
  outcomeLabels?: string[] | null;
  outcomeTokenIds?: string[] | null;
  outcomePrices?: number[] | null;
}) => {
  const idx = resolveOutcomeIndex({
    outcomeId,
    outcomeLabel,
    outcomeLabels,
    outcomeTokenIds,
  });
  if (idx == null || !outcomePrices?.length) return null;
  const price = outcomePrices[idx];
  return typeof price === 'number' && Number.isFinite(price) ? price : null;
};

export const resolveLeadingOutcome = ({
  outcomeLabels,
  outcomePrices,
  outcomeTokenIds,
}: {
  outcomeLabels?: string[] | null;
  outcomePrices?: number[] | null;
  outcomeTokenIds?: string[] | null;
}) => {
  if (!outcomeLabels?.length || !outcomePrices?.length) {
    return { outcomeId: null, outcomeLabel: null, price: null };
  }
  const maxIdx = outcomePrices.reduce(
    (max, price, idx) => (price > outcomePrices[max] ? idx : max),
    0,
  );
  return {
    outcomeId: outcomeTokenIds?.[maxIdx] ?? null,
    outcomeLabel: outcomeLabels[maxIdx] ?? null,
    price: outcomePrices[maxIdx] ?? null,
  };
};

export const inferOutcomeFromEntryPrice = ({
  entryPrice,
  outcomeLabels,
  outcomePrices,
  outcomeTokenIds,
}: {
  entryPrice: number;
  outcomeLabels?: string[] | null;
  outcomePrices?: number[] | null;
  outcomeTokenIds?: string[] | null;
}) => {
  if (!outcomeLabels?.length || !outcomePrices?.length) return null;
  let bestIdx = 0;
  let bestDiff = Math.abs(outcomePrices[0] - entryPrice);
  for (let i = 1; i < outcomePrices.length; i += 1) {
    const diff = Math.abs(outcomePrices[i] - entryPrice);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  if (bestDiff > 0.03) return null;
  return {
    outcomeId: outcomeTokenIds?.[bestIdx] ?? null,
    outcomeLabel: outcomeLabels[bestIdx] ?? null,
  };
};
