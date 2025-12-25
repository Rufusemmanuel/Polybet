import assert from 'node:assert/strict';
import {
  isAmericanLeagueMarket,
  isSoccerMarket,
  parseMatchupFromTitle,
} from '../src/lib/sports/providers/football-data';

const cases = [
  {
    title: 'Cowboys vs. Commanders',
    expected: { teamA: 'Cowboys', teamB: 'Commanders' },
  },
  {
    title: 'Manchester United FC vs. Newcastle United FC: O/U 1.5',
    expected: { teamA: 'Manchester United FC', teamB: 'Newcastle United FC' },
  },
  {
    title: 'Will Al Hazem SC win on 2025-12-25?',
    expected: null,
  },
  {
    title: 'Team A vs. Team B (International Friendly)',
    expected: { teamA: 'Team A', teamB: 'Team B' },
  },
];

for (const testCase of cases) {
  const actual = parseMatchupFromTitle(testCase.title);
  if (testCase.expected === null) {
    assert.equal(actual, null, testCase.title);
  } else {
    assert.ok(actual, testCase.title);
    assert.equal(actual?.teamA, testCase.expected.teamA, testCase.title);
    assert.equal(actual?.teamB, testCase.expected.teamB, testCase.title);
  }
}

const soccerGateCases = [
  {
    title: 'Manchester United FC vs. Newcastle United FC: O/U 1.5',
    slug: 'epl-mun-new-2025-12-26-total-1pt5',
    expectSoccer: true,
    expectAmerican: false,
  },
  {
    title: 'Dallas Cowboys vs. Washington Commanders',
    slug: 'nfl-dal-was-2025-12-25',
    expectSoccer: false,
    expectAmerican: true,
  },
];

for (const testCase of soccerGateCases) {
  const soccer = isSoccerMarket(testCase.title, testCase.slug, []);
  const american = isAmericanLeagueMarket(testCase.title, testCase.slug);
  assert.equal(soccer, testCase.expectSoccer, `${testCase.title} soccer gate`);
  assert.equal(american, testCase.expectAmerican, `${testCase.title} american gate`);
}

console.log(
  `Matchup parse harness passed (${cases.length + soccerGateCases.length} cases).`,
);
