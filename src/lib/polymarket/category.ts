import type { RawMarket } from './types';

const CRYPTO_TICKERS = ['BTC', 'ETH', 'SOL', 'XRP'] as const;
const CRYPTO_KEYWORDS = ['bitcoin', 'ethereum', 'solana', 'ripple'] as const;
const UP_OR_DOWN_REGEX = /up\s*or\s*down/i;

const hasWholeWordToken = (text: string, token: string): boolean => {
  const safeToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${safeToken}\\b`, 'i').test(text);
};

const hasCryptoAsset = (text?: string): boolean => {
  if (!text) return false;
  const lower = text.toLowerCase();
  if (CRYPTO_KEYWORDS.some((keyword) => lower.includes(keyword))) return true;
  return CRYPTO_TICKERS.some((ticker) => hasWholeWordToken(text, ticker));
};

const collectTagLabels = (market: RawMarket): string[] => {
  const labels: string[] = [];
  for (const tag of market.tags ?? []) {
    if (tag.label) labels.push(tag.label);
  }
  for (const event of market.events ?? []) {
    for (const tag of event.tags ?? []) {
      if (tag.label) labels.push(tag.label);
    }
  }
  return labels;
};

const hasCryptoSignal = (market: RawMarket): boolean => {
  const title = market.question ?? market.title ?? market.slug ?? '';
  const slug = market.slug ?? '';
  const category = market.category ?? '';
  const tagLabels = collectTagLabels(market);

  if (tagLabels.some((label) => label.toLowerCase().includes('crypto'))) return true;
  if (hasCryptoAsset(category)) return true;
  if (tagLabels.some((label) => hasCryptoAsset(label))) return true;

  if (hasCryptoAsset(title) || hasCryptoAsset(slug)) return true;
  if (UP_OR_DOWN_REGEX.test(title) && hasCryptoAsset(title)) return true;

  return false;
};

// Very simple slug -> category guesser used only when Polymarket
// doesn't give us a category or tag.
const inferCategoryFromSlug = (slug?: string): string | undefined => {
  if (!slug) return undefined;
  if (hasCryptoAsset(slug)) return 'Crypto';
  const s = slug.toLowerCase();

  if (s.includes('election') || s.includes('president') || s.includes('vote')) {
    return 'Politics';
  }
  if (s.includes('gdp') || s.includes('inflation') || s.includes('rate') || s.includes('fed')) {
    return 'Economy';
  }
  if (s.includes('nfl') || s.includes('nba') || s.includes('premier-league') || s.includes('f1')) {
    return 'Sports';
  }

  return undefined;
};

export const resolveCategory = (market: RawMarket): string => {
  if (hasCryptoSignal(market)) return 'Crypto';

  const direct = market.category?.trim();
  const tagLabels = collectTagLabels(market);
  const tag = tagLabels[0]?.trim();
  const slugGuess = direct || tag ? undefined : inferCategoryFromSlug(market.slug);

  return (direct || tag || slugGuess || 'Uncategorized').replace(/-/g, ' ');
};
