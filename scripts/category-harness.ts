import assert from 'node:assert/strict';
import { resolveCategory } from '../src/lib/polymarket/category';
import type { RawMarket } from '../src/lib/polymarket/types';

const baseMarket: RawMarket = {
  id: 'test-market',
  question: 'Placeholder',
  slug: 'placeholder',
  endDate: new Date().toISOString(),
};

const makeMarket = (overrides: Partial<RawMarket>): RawMarket => ({
  ...baseMarket,
  ...overrides,
});

const cases = [
  {
    name: 'Bitcoin Up or Down is crypto',
    market: makeMarket({
      question: 'Bitcoin Up or Down',
      slug: 'bitcoin-up-or-down',
      category: 'World',
    }),
    expected: 'Crypto',
  },
  {
    name: 'XRP market is crypto',
    market: makeMarket({
      question: 'Will XRP reach $1?',
      slug: 'xrp-price-target',
      category: 'World',
    }),
    expected: 'Crypto',
  },
  {
    name: 'Non-crypto up or down stays world',
    market: makeMarket({
      question: 'Oil Up or Down',
      slug: 'oil-up-or-down',
      category: 'World',
    }),
    expected: 'World',
  },
];

for (const testCase of cases) {
  const actual = resolveCategory(testCase.market);
  assert.equal(actual, testCase.expected, testCase.name);
}

console.log(`Category harness passed (${cases.length} cases).`);
