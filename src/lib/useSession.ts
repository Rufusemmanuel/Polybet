'use client';

import { useQuery } from '@tanstack/react-query';

type SessionResponse = {
  user: { id: string; name: string } | null;
};

const fetchSession = async (): Promise<SessionResponse> => {
  const res = await fetch('/api/auth/me');
  if (res.status === 401) return { user: null };
  if (!res.ok) throw new Error('Unable to load session');
  return (await res.json()) as SessionResponse;
};

export const useSession = () =>
  useQuery({
    queryKey: ['session'],
    queryFn: fetchSession,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
