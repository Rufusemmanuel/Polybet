'use client';

type BuilderTradesResponse = {
  ok: boolean;
  trades?: unknown;
  error?: string;
};

export const getBuilderTrades = async (params?: {
  limit?: number;
  next_cursor?: string;
}) => {
  const search = new URLSearchParams();
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.next_cursor) search.set('next_cursor', params.next_cursor);
  const res = await fetch(`/api/polymarket/builder-trades?${search.toString()}`);
  const data = (await res.json()) as BuilderTradesResponse;
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? 'Unable to load builder trades.');
  }
  return data.trades ?? [];
};
