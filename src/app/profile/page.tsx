'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/useSession';
import { useBookmarks } from '@/lib/useBookmarks';
import { useTheme } from '@/components/theme-context';
import {
  bodyText,
  cardBase,
  cardLabel,
  cardSurfaceDark,
  cardSurfaceLight,
  pageTitle,
  sectionTitle,
} from '@/lib/ui/classes';

export default function ProfilePage() {
  const { isDark } = useTheme();
  const sessionQuery = useSession();
  const user = sessionQuery.data?.user ?? null;
  const bookmarksQuery = useBookmarks(Boolean(user));
  const router = useRouter();
  const queryClient = useQueryClient();
  type AnyRoute = Parameters<typeof router.push>[0];
  const asRoute = (href: string) => href as unknown as AnyRoute;

  useEffect(() => {
    if (sessionQuery.isLoading) return;
    if (!user) {
      router.push(asRoute('/?auth=login'));
    }
  }, [sessionQuery.isLoading, user, router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    queryClient.setQueryData(['session'], { user: null });
    queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    router.push(asRoute('/'));
  };

  if (!user) {
    return (
      <main
        className={
          isDark
            ? 'min-h-screen bg-[#0b1224] text-slate-100'
            : 'min-h-screen bg-slate-50 text-slate-900'
        }
      >
        <div className="mx-auto max-w-4xl px-4 py-12">
          <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Redirecting to login...
          </p>
        </div>
      </main>
    );
  }

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const cardSurface = isDark ? cardSurfaceDark : cardSurfaceLight;

  return (
    <main
      className={
        isDark
          ? 'min-h-screen bg-[#0b1224] text-slate-100'
          : 'min-h-screen bg-slate-50 text-slate-900'
      }
    >
      <div className="mx-auto max-w-5xl px-4 py-12 space-y-8">
        <div className="flex flex-wrap items-center gap-4">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full border text-lg font-semibold ${
              isDark
                ? 'border-white/10 bg-white/5 text-white'
                : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            {initials}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className={pageTitle}>{user.name}</h1>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  isDark
                    ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}
              >
                Active
              </span>
            </div>
            <p className={`${bodyText} ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Manage your PolyPicks account.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className={`${cardBase} ${cardSurface} p-5`}>
            <p className={`${cardLabel} ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Account
            </p>
            <p className="mt-2 text-2xl font-semibold">{user.name}</p>
            <p className={`mt-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Username
            </p>
          </div>
          <div className={`${cardBase} ${cardSurface} p-5`}>
            <p className={`${cardLabel} ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Bookmarked markets
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {bookmarksQuery.data?.bookmarks.length ?? 0}
            </p>
            <p className={`mt-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Saved opportunities
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className={sectionTitle}>Actions</p>
          <button
            type="button"
            onClick={handleLogout}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
              isDark
                ? 'border-red-500/50 text-red-200 hover:border-red-400'
                : 'border-red-300 text-red-600 hover:border-red-400'
            }`}
          >
            Log out
          </button>
        </div>
      </div>
    </main>
  );
}
