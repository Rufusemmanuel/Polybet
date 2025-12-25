type TeamSearchResponse = {
  teams: {
    id: number;
    name: string;
    shortName?: string;
    tla?: string;
    crest?: string;
    runningCompetitions?: { id: number; name: string }[];
  }[];
};

type TeamDetailsResponse = {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
  runningCompetitions?: { id: number; name: string }[];
};

type MatchResponse = {
  matches: {
    utcDate: string;
    competition?: { name?: string };
    score?: { fullTime?: { home?: number | null; away?: number | null } };
    homeTeam: { id: number; name: string };
    awayTeam: { id: number; name: string };
  }[];
};

type StandingsResponse = {
  competition?: { name?: string };
  standings?: {
    type?: string;
    table?: {
      position?: number;
      team?: { name?: string };
      playedGames?: number;
      points?: number;
    }[];
  }[];
};

export type FootballTeam = {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
  runningCompetitions?: { id: number; name: string }[];
};

export type FootballMatch = {
  utcDate: string;
  competition?: string | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
};

export type FootballStandings = {
  competition: string;
  table: {
    position: number;
    team: string;
    playedGames: number;
    points: number;
  }[];
};

const FOOTBALL_DATA_BASE = 'https://api.football-data.org/v4';
const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const CACHE_REVALIDATE_SECONDS = 6 * 60 * 60;

type QueryParams = Record<string, string | number | undefined>;

const buildQuery = (params: QueryParams): string => {
  const entries = Object.entries(params).filter(([, value]) => value != null);
  if (!entries.length) return '';
  const search = new URLSearchParams();
  for (const [key, value] of entries) {
    search.set(key, String(value));
  }
  return `?${search.toString()}`;
};

const fetchFootballData = async <T>(
  path: string,
  params: QueryParams = {},
): Promise<T | null> => {
  if (!API_KEY) return null;
  try {
    const url = `${FOOTBALL_DATA_BASE}${path}${buildQuery(params)}`;
    const res = await fetch(url, {
      headers: {
        'X-Auth-Token': API_KEY,
      },
      next: { revalidate: CACHE_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
};

const normalizeName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const parseMatchupFromTitle = (
  title: string,
): { teamA: string; teamB: string } | null => {
  if (!title || /^will\s/i.test(title)) return null;
  const match = title.match(/(.+?)\s+(?:vs\.?|v|@)\s+(.+)/i);
  if (!match) return null;
  const teamA = match[1]?.trim().replace(/[?)]$/, '');
  const teamB = match[2]?.trim().replace(/[?)]$/, '');
  if (!teamA || !teamB) return null;
  if (teamA.length < 2 || teamB.length < 2) return null;
  return { teamA, teamB };
};

const pickBestTeam = (teams: TeamSearchResponse['teams'], query: string) => {
  if (!teams.length) return null;
  const normalizedQuery = normalizeName(query);
  const exact = teams.find((team) => normalizeName(team.name) === normalizedQuery);
  if (exact) return exact;
  const contains = teams.find((team) => normalizeName(team.name).includes(normalizedQuery));
  if (contains) return contains;
  return teams[0];
};

export const searchTeamByName = async (name: string): Promise<FootballTeam | null> => {
  const response = await fetchFootballData<TeamSearchResponse>('/teams', { name });
  if (!response?.teams?.length) return null;
  const match = pickBestTeam(response.teams, name);
  if (!match) return null;
  return {
    id: match.id,
    name: match.name,
    shortName: match.shortName,
    tla: match.tla,
    crest: match.crest,
    runningCompetitions: match.runningCompetitions,
  };
};

export const getTeamDetails = async (teamId: number): Promise<FootballTeam | null> => {
  const response = await fetchFootballData<TeamDetailsResponse>(`/teams/${teamId}`);
  if (!response) return null;
  return {
    id: response.id,
    name: response.name,
    shortName: response.shortName,
    tla: response.tla,
    crest: response.crest,
    runningCompetitions: response.runningCompetitions,
  };
};

const toFootballMatch = (match: MatchResponse['matches'][number]): FootballMatch => ({
  utcDate: match.utcDate,
  competition: match.competition?.name ?? null,
  homeTeam: match.homeTeam.name,
  awayTeam: match.awayTeam.name,
  homeScore: match.score?.fullTime?.home ?? null,
  awayScore: match.score?.fullTime?.away ?? null,
});

export const getRecentMatches = async (
  teamId: number,
  limit = 5,
): Promise<FootballMatch[]> => {
  const response = await fetchFootballData<MatchResponse>(`/teams/${teamId}/matches`, {
    status: 'FINISHED',
    limit,
  });
  if (!response?.matches) return [];
  return response.matches.map(toFootballMatch);
};

export const getHeadToHead = async (
  teamAId: number,
  teamBId: number,
  limit = 5,
): Promise<FootballMatch[]> => {
  const response = await fetchFootballData<MatchResponse>(`/teams/${teamAId}/matches`, {
    status: 'FINISHED',
    limit: 40,
  });
  if (!response?.matches) return [];
  const filtered = response.matches.filter(
    (match) => match.homeTeam.id === teamBId || match.awayTeam.id === teamBId,
  );
  return filtered.slice(0, limit).map(toFootballMatch);
};

export const getStandings = async (
  competitionId: number,
): Promise<FootballStandings | null> => {
  const response = await fetchFootballData<StandingsResponse>(`/competitions/${competitionId}/standings`);
  if (!response) return null;
  const tables = response.standings ?? [];
  const table = tables.find((standing) => standing.type === 'TOTAL') ?? tables[0];
  const rows = table?.table ?? [];
  if (!rows.length) return null;

  return {
    competition: response.competition?.name ?? 'League standings',
    table: rows.map((row) => ({
      position: row.position ?? 0,
      team: row.team?.name ?? 'Unknown',
      playedGames: row.playedGames ?? 0,
      points: row.points ?? 0,
    })),
  };
};
