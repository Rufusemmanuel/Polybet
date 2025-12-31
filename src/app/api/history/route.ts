export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { getMarketDetails } from '@/lib/polymarket/api';
import {
  findOutcomeIndex,
  inferOutcomeFromEntryPrice,
  resolveFinalPrice,
  resolveOutcomePrice,
} from '@/lib/polymarket/settlement';

const TIMEFRAMES: Record<string, number> = {
  '1d': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

const resolveStartDate = (value: string | null) => {
  const key = value?.toLowerCase() ?? 'all';
  const days = TIMEFRAMES[key];
  if (!days) return null;
  const now = Date.now();
  return new Date(now - days * 24 * 60 * 60 * 1000);
};

const resolveYesNoOutcome = ({
  entryPrice,
  outcomeLabels,
  outcomeTokenIds,
}: {
  entryPrice: number;
  outcomeLabels: string[] | null;
  outcomeTokenIds: string[] | null;
}) => {
  if (!outcomeLabels?.length) return null;
  const yesIdx = findOutcomeIndex(outcomeLabels, 'Yes');
  const noIdx = findOutcomeIndex(outcomeLabels, 'No');
  if (yesIdx == null || noIdx == null) return null;
  const useYes = entryPrice >= 0.5;
  const idx = useYes ? yesIdx : noIdx;
  return {
    outcomeId: outcomeTokenIds?.[idx] ?? null,
    outcomeLabel: outcomeLabels[idx] ?? null,
  };
};

export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = resolveStartDate(searchParams.get('timeframe'));

    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: user.id,
        ...(startDate ? { createdAt: { gte: startDate } } : {}),
      },
      select: {
        id: true,
        marketId: true,
        title: true,
        category: true,
        marketUrl: true,
        outcomeId: true,
        outcomeLabel: true,
        entryPrice: true,
        createdAt: true,
        removedAt: true,
        lastKnownPrice: true,
        lastPriceAt: true,
        finalPrice: true,
        closedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!bookmarks.length) {
      return NextResponse.json({ bookmarks: [], total: 0 });
    }

    const marketMap = new Map<string, Awaited<ReturnType<typeof getMarketDetails>>>();
    await Promise.all(
      bookmarks.map(async (bookmark) => {
        if (marketMap.has(bookmark.marketId)) return;
        try {
          const market = await getMarketDetails(bookmark.marketId);
          marketMap.set(bookmark.marketId, market);
        } catch (error) {
          marketMap.set(bookmark.marketId, null);
        }
      }),
    );

    const now = new Date();
    const updates: Prisma.PrismaPromise<unknown>[] = [];

    const response = bookmarks.map((bookmark) => {
      const market = marketMap.get(bookmark.marketId) ?? null;
      const marketClosedAt = market?.closedTime ?? market?.endDate ?? null;
      const marketIsClosed = marketClosedAt
        ? marketClosedAt.getTime() <= now.getTime()
        : false;
      const isClosed =
        marketIsClosed || Boolean(market?.closed) || Boolean(bookmark.closedAt) || bookmark.finalPrice != null;

      const inferredOutcome =
        bookmark.outcomeId || bookmark.outcomeLabel
          ? null
          : inferOutcomeFromEntryPrice({
              entryPrice: bookmark.entryPrice,
              outcomeLabels: market?.outcomes ?? null,
              outcomePrices: market?.outcomePrices ?? null,
              outcomeTokenIds: market?.outcomeTokenIds ?? null,
            }) ??
            resolveYesNoOutcome({
              entryPrice: bookmark.entryPrice,
              outcomeLabels: market?.outcomes ?? null,
              outcomeTokenIds: market?.outcomeTokenIds ?? null,
            });
      const outcomeId = bookmark.outcomeId ?? inferredOutcome?.outcomeId ?? null;
      const outcomeLabel = bookmark.outcomeLabel ?? inferredOutcome?.outcomeLabel ?? null;
      const currentPrice =
        resolveOutcomePrice({
          outcomeId,
          outcomeLabel,
          outcomeLabels: market?.outcomes ?? null,
          outcomeTokenIds: market?.outcomeTokenIds ?? null,
          outcomePrices: market?.outcomePrices ?? null,
        }) ?? bookmark.lastKnownPrice ?? null;
      const shouldRefreshLastPrice =
        currentPrice != null &&
        (bookmark.lastKnownPrice == null || bookmark.lastKnownPrice !== currentPrice);

      const winningOutcomeId = market?.winningOutcomeId ?? null;
      const winningOutcomeLabel = market?.winningOutcome ?? null;
      const settlementPrice = resolveFinalPrice({
        bookmarkOutcomeId: outcomeId,
        bookmarkOutcomeLabel: outcomeLabel,
        winningOutcomeId,
        winningOutcomeLabel,
        outcomeLabels: market?.outcomes ?? null,
        outcomeTokenIds: market?.outcomeTokenIds ?? null,
      });
      const isResolved = settlementPrice != null && Boolean(market?.resolved);

      let finalPrice = isResolved ? settlementPrice : null;
      let closedAt = bookmark.closedAt ?? null;
      if (isResolved && (bookmark.finalPrice == null || bookmark.finalPrice !== finalPrice)) {
        closedAt = closedAt ?? marketClosedAt ?? now;
        console.log('[history] settlement persisted', {
          bookmarkId: bookmark.id,
          marketId: bookmark.marketId,
          outcomeId,
          outcomeLabel,
          finalPrice,
        });
        updates.push(
          prisma.bookmark.update({
            where: { id: bookmark.id },
            data: {
              finalPrice,
              closedAt,
              lastKnownPrice: currentPrice ?? undefined,
              lastPriceAt: currentPrice != null ? now : undefined,
              ...(outcomeId ? { outcomeId } : {}),
              ...(outcomeLabel ? { outcomeLabel } : {}),
            },
          }),
        );
      } else if (!isResolved && bookmark.finalPrice != null) {
        console.log('[history] cleared legacy finalPrice', {
          bookmarkId: bookmark.id,
          marketId: bookmark.marketId,
          finalPrice: bookmark.finalPrice,
          isClosed,
          isResolved,
        });
        updates.push(
          prisma.bookmark.update({
            where: { id: bookmark.id },
            data: {
              finalPrice: null,
            },
          }),
        );
      } else if (shouldRefreshLastPrice) {
        updates.push(
          prisma.bookmark.update({
            where: { id: bookmark.id },
            data: {
              lastKnownPrice: currentPrice,
              lastPriceAt: now,
              ...(inferredOutcome
                ? {
                    ...(outcomeId ? { outcomeId } : {}),
                    ...(outcomeLabel ? { outcomeLabel } : {}),
                  }
                : {}),
            },
          }),
        );
      } else if (inferredOutcome && (outcomeId || outcomeLabel)) {
        updates.push(
          prisma.bookmark.update({
            where: { id: bookmark.id },
            data: {
              ...(outcomeId ? { outcomeId } : {}),
              ...(outcomeLabel ? { outcomeLabel } : {}),
            },
          }),
        );
      }

      return {
        id: bookmark.id,
        marketId: bookmark.marketId,
        title: bookmark.title,
        category: bookmark.category,
        marketUrl: bookmark.marketUrl,
        outcomeId,
        outcomeLabel,
        entryPrice: bookmark.entryPrice,
        createdAt: bookmark.createdAt.toISOString(),
        removedAt: bookmark.removedAt ? bookmark.removedAt.toISOString() : null,
        lastKnownPrice: bookmark.lastKnownPrice,
        lastPriceAt: bookmark.lastPriceAt ? bookmark.lastPriceAt.toISOString() : null,
        finalPrice,
        closedAt: closedAt ? closedAt.toISOString() : null,
        currentPrice,
        isClosed,
        isResolved,
      };
    });

    if (updates.length) {
      try {
        await prisma.$transaction(updates);
      } catch (error) {
        console.error('[history] unable to persist prices', error);
      }
    }

    return NextResponse.json({
      bookmarks: response,
      total: response.length,
    });
  } catch (error) {
    console.error('[history] GET error', error);
    return NextResponse.json({ error: 'Unable to load history' }, { status: 500 });
  }
}
