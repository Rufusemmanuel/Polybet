export const cardBase = 'rounded-2xl border shadow-sm backdrop-blur';
export const cardSurfaceDark = 'border-white/10 bg-white/[0.03]';
export const cardSurfaceLight = 'border-slate-200 bg-white';
export const cardHover = 'transition hover:-translate-y-0.5 hover:bg-white/[0.05] hover:border-white/15';

export const buttonBase =
  'inline-flex items-center justify-center rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:pointer-events-none disabled:opacity-50';
export const buttonPrimary = `${buttonBase} bg-blue-600 text-white hover:bg-blue-500`;
export const buttonPrimaryEmphasis = `${buttonPrimary} shadow-sm shadow-blue-500/20 hover:shadow-blue-500/30`;
export const buttonSecondaryDark = `${buttonBase} border border-white/10 bg-white/5 text-white hover:bg-white/10`;
export const buttonSecondary = `${buttonBase} border border-white/10 bg-white/5 text-white/90 hover:bg-white/10`;
export const buttonSecondaryLight = `${buttonBase} border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100`;
export const buttonGhostDark = `${buttonBase} text-white/80 hover:bg-white/10`;
export const buttonGhostLight = `${buttonBase} text-slate-600 hover:bg-slate-100`;

export const iconButtonDark =
  'inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50';
export const iconButtonLight =
  'inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50';

export const chipBase =
  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border';
export const chipLive = `${chipBase} bg-blue-500/10 text-blue-300 border-blue-500/20`;
export const chipSuccess = `${chipBase} bg-emerald-500/10 text-emerald-300 border-emerald-500/20`;
export const chipMutedDark = `${chipBase} bg-white/5 text-white/70 border-white/10`;
export const chipMutedLight = `${chipBase} bg-slate-100 text-slate-600 border-slate-200`;

export const inputBaseDark =
  'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40';
export const inputBaseLight =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40';

export const modalBaseDark = 'rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur p-6 shadow-xl';
export const modalBaseLight = 'rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-6 shadow-xl';

export const pageTitle = 'text-4xl font-semibold';
export const sectionTitle = 'text-lg font-semibold';
export const cardLabel = 'text-xs uppercase tracking-wider';
export const bodyText = 'text-sm';
export const buttonGroup = 'flex flex-wrap items-center gap-2';
