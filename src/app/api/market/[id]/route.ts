import { NextResponse } from 'next/server';
import { getMarketDetailsPayload } from '@/lib/polymarket/api';
import {
  findFixtureMatch,
  getHeadToHead,
  getRecentMatches,
  getStandings,
  getTeamDetails,
  isAmericanLeagueMarket,
  isFootballDataConfigured,
  isSoccerMarket,
  parseMatchupFromTitle,
  resolveCompetitionCode,
} from '@/lib/sports/providers/football-data';
import type { MarketDetailsResponse, SportsEnrichment } from '@/lib/polymarket/types';

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params) {
  try {
    const market = await getMarketDetailsPayload(params.id);
    if (!market) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    let sports: SportsEnrichment | undefined;
    let sportsMeta: MarketDetailsResponse['sportsMeta'] = {
      enabled: false,
      reason: 'not_soccer',
    };
    const soccerLikely =
      market.categoryResolved === 'Sports' &&
      isSoccerMarket(market.title, market.slug, market.tags) &&
      !isAmericanLeagueMarket(market.title, market.slug);
    if (soccerLikely) {
      if (!isFootballDataConfigured()) {
        sportsMeta = { enabled: false, reason: 'missing_api_key' };
      } else {
        const matchup = parseMatchupFromTitle(market.title);
        const competitionCode = resolveCompetitionCode(market.slug);
        const slugDate = market.slug.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
        const closesAtDate = new Date(market.closesAt);
        const fallbackDate = Number.isNaN(closesAtDate.getTime())
          ? null
          : closesAtDate.toISOString().slice(0, 10);
        const matchDate = slugDate ?? fallbackDate;

        if (matchup && competitionCode && matchDate) {
          try {
            const fixture = await findFixtureMatch(
              competitionCode,
              matchDate,
              matchup.teamA,
              matchup.teamB,
            );

            if (fixture) {
              const [recentA, recentB, headToHead, detailsA, detailsB, standings] =
                await Promise.all([
                  getRecentMatches(fixture.homeTeamId, 5),
                  getRecentMatches(fixture.awayTeamId, 5),
                  getHeadToHead(fixture.matchId, 5),
                  getTeamDetails(fixture.homeTeamId),
                  getTeamDetails(fixture.awayTeamId),
                  getStandings(competitionCode),
                ]);

              sports = {
                matchup: {
                  teamA: fixture.homeTeamName,
                  teamB: fixture.awayTeamName,
                  teamAId: fixture.homeTeamId,
                  teamBId: fixture.awayTeamId,
                  crestA: detailsA?.crest ?? null,
                  crestB: detailsB?.crest ?? null,
                },
                recentA,
                recentB,
                headToHead,
                standings,
              };
              sportsMeta = { enabled: true };
            } else {
              sportsMeta = { enabled: false, reason: 'fixture_not_found' };
            }
          } catch (err) {
            console.warn('[PolyPicks] sports enrichment skipped', err);
            sportsMeta = { enabled: false, reason: 'fixture_not_found' };
          }
        } else {
          sportsMeta = { enabled: false, reason: 'fixture_not_found' };
        }
      }
    }

    const payload: MarketDetailsResponse = {
      ...market,
      ...(sports ? { sports } : {}),
      ...(sports ? {} : { sportsMeta }),
    };

    return NextResponse.json<MarketDetailsResponse>(payload, {
      headers: { 'Cache-Control': 's-maxage=10, stale-while-revalidate=60' },
    });
  } catch (err) {
    console.error('[PolyPicks] /api/market/[id] error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
