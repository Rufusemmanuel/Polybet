import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

type Props = {
  isOpen: boolean;
  isDark: boolean;
  onClose: () => void;
  onSuccess: (user: { id: string; name: string }) => void;
};

type Errors = {
  name?: string;
  password?: string;
  form?: string;
};

export function LoginModal({ isOpen, isDark, onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setPassword('');
      setErrors({});
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const next: Errors = {};
    if (!name.trim()) next.name = 'Name is required.';
    if (!password) next.password = 'Password is required.';
    return next;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next = validate();
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), password }),
      });
      const body = (await res.json()) as { user?: { id: string; name: string }; error?: string };
      if (!res.ok || !body.user) {
        setErrors({ form: body.error ?? 'Unable to log in.' });
        return;
      }
      onSuccess(body.user);
    } catch (error) {
      console.error('[login] error', error);
      setErrors({ form: 'Unable to log in.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close login"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
          isDark
            ? 'border-slate-800 bg-[#0b1224] text-slate-100'
            : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">
              PolyPicks
            </p>
            <h2 className="text-2xl font-semibold">Welcome back</h2>
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              Log in to view your saved markets.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              isDark
                ? 'border-slate-600 text-slate-200 hover:border-slate-400'
                : 'border-slate-300 text-slate-700 hover:border-slate-500'
            }`}
          >
            Close
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-semibold">Name</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="username"
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${
                isDark
                  ? 'border-slate-700 bg-[#101a32] text-slate-100 focus:border-blue-500'
                  : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500'
              }`}
              placeholder="Your name"
            />
            {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${
                isDark
                  ? 'border-slate-700 bg-[#101a32] text-slate-100 focus:border-blue-500'
                  : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500'
              }`}
              placeholder="Your password"
            />
            {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
          </div>

          {errors.form && <p className="text-xs text-red-400">{errors.form}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-full px-4 py-2 text-sm font-semibold text-white transition ${
              loading ? 'bg-blue-300' : 'bg-[#002cff] hover:bg-blue-700'
            }`}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}
