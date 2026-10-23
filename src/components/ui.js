// Shared Tailwind class names so every page looks the same

// Centered page width with side padding; pages use this inside full-width sections
export const containerClass = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'

// text-base on mobile stops iPhones zooming into the field when tapped
export const inputClass =
  'mb-4 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-800 placeholder:text-slate-400 sm:py-2.5 sm:text-sm focus:border-brand-blue focus:shadow-[0_0_0_3px_rgba(46,139,255,0.18)] focus:outline-none read-only:cursor-not-allowed read-only:bg-slate-100 read-only:text-slate-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-600'

export const labelClass = 'mb-1.5 block text-[13px] font-semibold text-slate-700'

export const btnBase =
  'inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white disabled:opacity-100 disabled:hover:opacity-100'

// Brand navy (white text stays readable on it); hover lifts to the brand's secondary blue
export const btnPrimary = `${btnBase} bg-brand-navy text-white hover:bg-brand-blue hover:opacity-100`
export const btnSecondary = `${btnBase} bg-slate-100 text-slate-700 hover:bg-slate-200 hover:opacity-100`
export const btnSuccess = `${btnBase} bg-emerald-500 text-white`
export const btnAdmin = `${btnBase} bg-brand-navy text-white`
export const btnDanger = `${btnBase} bg-red-500 text-white`

// Notices: a coloured strip on the left instead of a full box
const noticeBase = 'mb-5 border-l-4 py-2 pl-3.5 pr-2 text-[13px] leading-relaxed'
export const infoBoxClass = `${noticeBase} border-brand-blue bg-brand-light text-brand-navy`
export const infoBoxSuccessClass = `${noticeBase} border-emerald-500 bg-emerald-50/60 text-emerald-900`
export const infoBoxAdminClass = `${noticeBase} border-brand-blue bg-brand-light/60 text-brand-navy`
export const errorBoxClass = `${noticeBase} border-red-500 bg-red-50/60 font-semibold text-red-700`

export const thClass = 'border-b border-slate-200 px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-500'
export const tdClass = 'border-b border-slate-100 px-3 py-3.5'

export const badgePointsClass = 'rounded-md bg-green-100 px-2 py-1 font-bold text-green-700'
