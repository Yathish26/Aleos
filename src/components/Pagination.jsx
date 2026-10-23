// Page bar under a list: "Showing 21–40 of 134", ← Prev, page numbers (1 … 4 5 6 … 12), Next →.
// Renders nothing when everything fits on one page.

// Page numbers around the current one, with '…' for gaps
function pageList(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…')
    out.push(p)
  })
  return out
}

const arrowClass =
  'rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-navy hover:bg-white disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent'

export default function Pagination({ page, totalPages, total, limit, onChange, disabled = false, label = 'Pages' }) {
  if (!totalPages || totalPages <= 1) return null
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <nav
      aria-label={label}
      className="flex flex-col items-center justify-between gap-3 border-t border-brand-blue/20 bg-brand-light/40 px-4 py-3 sm:flex-row"
    >
      <span className="text-xs text-slate-500">
        Showing{' '}
        <span className="font-semibold text-brand-navy">
          {from.toLocaleString('en-IN')}–{to.toLocaleString('en-IN')}
        </span>{' '}
        of <span className="font-semibold text-brand-navy">{total.toLocaleString('en-IN')}</span>
      </span>
      <div className="flex flex-wrap items-center justify-center gap-1">
        <button type="button" className={arrowClass} disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}>
          ← Prev
        </button>
        {pageList(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1 text-xs text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === page ? 'page' : undefined}
              disabled={disabled}
              onClick={() => onChange(p)}
              className={`h-8 min-w-8 rounded-lg px-2 text-xs font-bold transition-colors ${
                p === page ? 'bg-brand-navy text-white' : 'text-brand-navy hover:bg-white'
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className={arrowClass}
          disabled={disabled || page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next →
        </button>
      </div>
    </nav>
  )
}
