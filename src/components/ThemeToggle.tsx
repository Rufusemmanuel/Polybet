'use client';

import { useTheme } from '@/components/theme-context';

type Props = {
  variant?: 'switch' | 'icon';
  className?: string;
};

export function ThemeToggle({ variant = 'switch', className }: Props) {
  const { isDark, toggleTheme } = useTheme();

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        role="switch"
        aria-checked={isDark}
        aria-label="Toggle dark mode"
        className={className}
      >
        {isDark ? (
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="4" />
            <path
              d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
      className={`group inline-flex items-center gap-2 ${className ?? ''}`}
    >
      <span
        className={`text-[11px] font-semibold ${
          isDark ? 'text-slate-300' : 'text-slate-600'
        }`}
      >
        {isDark ? 'Dark' : 'Light'}
      </span>
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full border transition ${
          isDark
            ? 'border-slate-600 bg-[#0f1a32]'
            : 'border-slate-300 bg-white'
        } group-focus-visible:outline-none group-focus-visible:ring-2 group-focus-visible:ring-[#002cff] group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-transparent`}
      >
        <span
          className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-white shadow transition ${
            isDark
              ? 'translate-x-5 bg-[#002cff]'
              : 'translate-x-1 bg-slate-400'
          }`}
        >
          {isDark ? '☾' : '☀'}
        </span>
      </span>
    </button>
  );
}
