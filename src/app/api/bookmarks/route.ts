import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { getMarketDetails } from '@/lib/polymarket/api';
import { inferBookmarkOutcome } from '@/lib/polymarket/settlement';

type BookmarkPayload = {
  marketId?: string;
  entryPrice?: number;
  title?: string;
  category?: string;
  marketUrl?: string;
  outcomeId?: string | null;
  outcomeLabel?: string | null;
};

const normalizeLabel = (value: string | null | undefined) =>
  value ? value.trim().toLowerCase() : null;

const resolveSelectedOutcome = ({
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

  if (!resolvedOutcomeLabel && market?.price.leadingOutcome) {
    resolvedOutcomeLabel = market.price.leadingOutcome;
  }

  if (!resolvedOutcomeId && resolvedOutcomeLabel && tokenIds.length && labels.length) {
    const normalized = normalizeLabel(resolvedOutcomeLabel);
    const idx = labels.findIndex((label) => normalizeLabel(label) === normalized);
    resolvedOutcomeId = idx >= 0 ? tokenIds[idx] ?? null : null;
  }

  return { outcomeId: resolvedOutcomeId, outcomeLabel: resolvedOutcomeLabel };
};

const resolveOutcomeEntryPrice = ({
  entryPrice,
  outcomeId,
  outcomeLabel,
  market,
}: {
  entryPrice: number;
  outcomeId: string | null;
  outcomeLabel: string | null;
  market: Awaited<ReturnType<typeof getMarketDetails>> | null;
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
  return entryPrice;
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

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id, removedAt: null },
      select: {
        marketId: true,
        createdAt: true,
        entryPrice: true,
        title: true,
        category: true,
        marketUrl: true,
        outcomeId: true,
        outcomeLabel: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const missingOutcome = bookmarks.filter(
      (bookmark) => !bookmark.outcomeId && !bookmark.outcomeLabel,
    );
    const marketMap = new Map<string, Awaited<ReturnType<typeof getMarketDetails>>>();

    if (missingOutcome.length) {
      await Promise.all(
        missingOutcome.map(async (bookmark) => {
          if (marketMap.has(bookmark.marketId)) return;
          try {
            const market = await getMarketDetails(bookmark.marketId);
            marketMap.set(bookmark.marketId, market);
          } catch {
            marketMap.set(bookmark.marketId, null);
          }
        }),
      );
    }

    const updates: Prisma.PrismaPromise<unknown>[] = [];
    const response = NextResponse.json({
      bookmarks: bookmarks.map((b) => {
        const market = marketMap.get(b.marketId) ?? null;
        const inferred =
          b.outcomeId || b.outcomeLabel
            ? null
            : inferBookmarkOutcome({
                entryPrice: b.entryPrice,
                outcomeLabels: market?.outcomes ?? null,
                outcomePrices: market?.outcomePrices ?? null,
                outcomeTokenIds: market?.outcomeTokenIds ?? null,
                fallbackLabel: market?.price.leadingOutcome ?? null,
              });
        const outcomeId = b.outcomeId ?? inferred?.outcomeId ?? null;
        const outcomeLabel = b.outcomeLabel ?? inferred?.outcomeLabel ?? null;
        if (!b.outcomeId && !b.outcomeLabel && (outcomeId || outcomeLabel)) {
          updates.push(
            prisma.bookmark.update({
              where: { userId_marketId: { userId: user.id, marketId: b.marketId } },
              data: {
                ...(outcomeId ? { outcomeId } : {}),
                ...(outcomeLabel ? { outcomeLabel } : {}),
              },
            }),
          );
        }
        return {
          marketId: b.marketId,
          createdAt: b.createdAt.toISOString(),
          entryPrice: b.entryPrice,
          title: b.title,
          category: b.category,
          marketUrl: b.marketUrl,
          outcomeId,
          outcomeLabel,
        };
      }),
    });
    if (updates.length) {
      try {
        await prisma.$transaction(updates);
      } catch (error) {
        console.error('[bookmarks] outcome backfill error', error);
      }
    }
    return response;
  } catch (error) {
    console.error('[bookmarks] GET error', error);
    return NextResponse.json({ error: 'Unable to load bookmarks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as BookmarkPayload;
    const marketId = body.marketId?.trim();
    const entryPrice =
      typeof body.entryPrice === 'number' && Number.isFinite(body.entryPrice)
        ? body.entryPrice
        : null;
    const title = body.title?.trim() || null;
    const category = body.category?.trim() || null;
    const marketUrl = body.marketUrl?.trim() || null;
    const rawOutcomeId = body.outcomeId?.trim() || null;
    const rawOutcomeLabel = body.outcomeLabel?.trim() || null;
    if (!marketId) {
      return NextResponse.json({ error: 'marketId is required' }, { status: 400 });
    }
    if (entryPrice == null) {
      return NextResponse.json({ error: 'entryPrice is required' }, { status: 400 });
    }

    let market = null;
    try {
      market = await getMarketDetails(marketId);
    } catch {
      market = null;
    }
    const resolvedOutcome = resolveSelectedOutcome({
      outcomeId: rawOutcomeId,
      outcomeLabel: rawOutcomeLabel,
      market,
    });
    const resolvedEntryPrice = resolveOutcomeEntryPrice({
      entryPrice,
      outcomeId: resolvedOutcome.outcomeId,
      outcomeLabel: resolvedOutcome.outcomeLabel,
      market,
    });

    const updateData = {
      entryPrice: resolvedEntryPrice,
      createdAt: new Date(),
      removedAt: null,
      ...(title ? { title } : {}),
      ...(category ? { category } : {}),
      ...(marketUrl ? { marketUrl } : {}),
      ...(resolvedOutcome.outcomeId ? { outcomeId: resolvedOutcome.outcomeId } : {}),
      ...(resolvedOutcome.outcomeLabel ? { outcomeLabel: resolvedOutcome.outcomeLabel } : {}),
    };
    await prisma.bookmark.upsert({
      where: {
        userId_marketId: {
          userId: user.id,
          marketId,
        },
      },
      create: {
        userId: user.id,
        marketId,
        entryPrice: resolvedEntryPrice,
        ...(title ? { title } : {}),
        ...(category ? { category } : {}),
        ...(marketUrl ? { marketUrl } : {}),
        ...(resolvedOutcome.outcomeId ? { outcomeId: resolvedOutcome.outcomeId } : {}),
        ...(resolvedOutcome.outcomeLabel ? { outcomeLabel: resolvedOutcome.outcomeLabel } : {}),
      },
      update: updateData,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[bookmarks] POST error', error);
    return NextResponse.json({ error: 'Unable to add bookmark' }, { status: 500 });
  }
}
