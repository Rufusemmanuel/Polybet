import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { getMarketDetails } from '@/lib/polymarket/api';
import { resolveFinalPrice } from '@/lib/polymarket/settlement';

export const runtime = 'nodejs';

type OutcomePayload = {
  outcomeId?: string | null;
  outcomeLabel?: string | null;
};

const normalizeLabel = (value: string | null | undefined) =>
  value ? value.trim().toLowerCase() : null;

const resolveOutcomeSelection = ({
  outcomeId,
  outcomeLabel,
  market,
}: {
  outcomeId: string | null;
  outcomeLabel: string | null;
  market: Awaited<ReturnType<typeof getMarketDetails>> | null;
}) => {
  const labels = market?.outcomes ?? [];
  const tokenIds = market?.outcomeTokenIds ?? [];
  let resolvedOutcomeId = outcomeId;
  let resolvedOutcomeLabel = outcomeLabel;

  if (!resolvedOutcomeLabel && resolvedOutcomeId && tokenIds.length && labels.length) {
    const idx = tokenIds.findIndex((id) => id === resolvedOutcomeId);
    resolvedOutcomeLabel = idx >= 0 ? labels[idx] ?? null : null;
  }

  if (!resolvedOutcomeId && resolvedOutcomeLabel && tokenIds.length && labels.length) {
    const normalized = normalizeLabel(resolvedOutcomeLabel);
    const idx = labels.findIndex((label) => normalizeLabel(label) === normalized);
    resolvedOutcomeId = idx >= 0 ? tokenIds[idx] ?? null : null;
  }

  if (!resolvedOutcomeId && !resolvedOutcomeLabel) return { outcomeId: null, outcomeLabel: null };

  if (resolvedOutcomeLabel && !resolvedOutcomeId && tokenIds.length && labels.length) {
    const normalized = normalizeLabel(resolvedOutcomeLabel);
    const idx = labels.findIndex((label) => normalizeLabel(label) === normalized);
    resolvedOutcomeId = idx >= 0 ? tokenIds[idx] ?? null : null;
  }

  return { outcomeId: resolvedOutcomeId, outcomeLabel: resolvedOutcomeLabel };
};

const resolveOutcomeEntryPrice = ({
  outcomeId,
  outcomeLabel,
  market,
  fallbackEntryPrice,
}: {
  outcomeId: string | null;
  outcomeLabel: string | null;
  market: Awaited<ReturnType<typeof getMarketDetails>> | null;
  fallbackEntryPrice: number;
}) => {
  const labels = market?.outcomes ?? [];
  const prices = market?.outcomePrices ?? [];
  const tokenIds = market?.outcomeTokenIds ?? [];
  if (labels.length && prices.length) {
    if (outcomeId && tokenIds.length) {
      const idx = tokenIds.findIndex((id) => id === outcomeId);
      const price = idx >= 0 ? prices[idx] : null;
      if (typeof price === 'number' && Number.isFinite(price)) return price;
    }
    if (outcomeLabel) {
      const normalized = normalizeLabel(outcomeLabel);
      const idx = labels.findIndex((label) => normalizeLabel(label) === normalized);
      const price = idx >= 0 ? prices[idx] : null;
      if (typeof price === 'number' && Number.isFinite(price)) return price;
    }
  }
  return fallbackEntryPrice;
};

export async function PATCH(request: NextRequest, { params }: { params: { marketId: string } }) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const marketId = params.marketId?.trim();
    if (!marketId) {
      return NextResponse.json({ error: 'marketId is required' }, { status: 400 });
    }

    const body = (await request.json()) as OutcomePayload;
    const requestedOutcomeId = body.outcomeId?.trim() || null;
    const requestedOutcomeLabel = body.outcomeLabel?.trim() || null;
    if (!requestedOutcomeId && !requestedOutcomeLabel) {
      return NextResponse.json({ error: 'outcomeId or outcomeLabel is required' }, { status: 400 });
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: { userId_marketId: { userId: user.id, marketId } },
      select: {
        id: true,
        entryPrice: true,
        finalPrice: true,
        closedAt: true,
      },
    });
    if (!bookmark) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
    }

    let market = null;
    try {
      market = await getMarketDetails(marketId);
    } catch {
      market = null;
    }

    const resolved = resolveOutcomeSelection({
      outcomeId: requestedOutcomeId,
      outcomeLabel: requestedOutcomeLabel,
      market,
    });
    if (!resolved.outcomeId && !resolved.outcomeLabel) {
      return NextResponse.json({ error: 'Outcome not found for market' }, { status: 400 });
    }

    const resolvedEntryPrice = resolveOutcomeEntryPrice({
      outcomeId: resolved.outcomeId,
      outcomeLabel: resolved.outcomeLabel,
      market,
      fallbackEntryPrice: bookmark.entryPrice,
    });

    const settlementPrice = resolveFinalPrice({
      bookmarkOutcomeId: resolved.outcomeId,
      bookmarkOutcomeLabel: resolved.outcomeLabel,
      winningOutcomeId: market?.winningOutcomeId ?? null,
      winningOutcomeLabel: market?.winningOutcome ?? null,
      outcomeLabels: market?.outcomes ?? null,
      outcomeTokenIds: market?.outcomeTokenIds ?? null,
    });
    const isResolved = settlementPrice != null && Boolean(market?.resolved);
    const finalPrice = isResolved ? settlementPrice : null;
    const closedAt = isResolved
      ? bookmark.closedAt ?? market?.closedTime ?? market?.endDate ?? new Date()
      : bookmark.closedAt ?? null;

    const updates: Prisma.PrismaPromise<unknown>[] = [
      prisma.bookmark.update({
        where: { id: bookmark.id },
        data: {
          outcomeId: resolved.outcomeId,
          outcomeLabel: resolved.outcomeLabel,
          entryPrice: resolvedEntryPrice,
          finalPrice,
          closedAt,
        },
      }),
    ];

    await prisma.$transaction(updates);

    return NextResponse.json({
      ok: true,
      outcomeId: resolved.outcomeId,
      outcomeLabel: resolved.outcomeLabel,
      entryPrice: resolvedEntryPrice,
      finalPrice,
      closedAt: closedAt ? closedAt.toISOString() : null,
    });
  } catch (error) {
    console.error('[bookmarks/outcome] PATCH error', error);
    return NextResponse.json({ error: 'Unable to update outcome' }, { status: 500 });
  }
}
