import assert from 'node:assert/strict';
import { parseMatchupFromTitle } from '../src/lib/sports/providers/football-data';

const cases = [
  {
    title: 'Cowboys vs. Commanders',
    expected: { teamA: 'Cowboys', teamB: 'Commanders' },
  },
  {
    title: 'Will Al Hazem SC win on 2025-12-25?',
    expected: null,
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

console.log(`Matchup parse harness passed (${cases.length} cases).`);
