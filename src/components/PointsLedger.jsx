import { useEffect, useState } from 'react'
import { formatDate, formatTimeIST } from '../api'
import Icon from './Icon'
import Pagination from './Pagination'
import { tdClass, thClass } from './ui'

// A member's points ledger like a bank passbook — points earned (credit), used (debit) and the balance after each —
// loaded one page at a time. Shared by the member dashboard and the admin member profile.
//
// loadPage(page) must return the passbook endpoint's answer ({ entries, page, totalPages, total, limit }).
// Wrap it in useCallback so the ledger only reloads when it actually changes.

const PAGE_SIZE = 20

export default function PointsLedger({
  loadPage,
  balance = 0,
  onError,
  emptyText = 'No points recorded yet. Points are credited when participating merchants log purchases.',
}) {
  const [page, setPage] = useState(1)
  const [ledger, setLedger] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false // ignore a slow answer for a page that's already been left
    setLoading(true)
    loadPage(page, PAGE_SIZE)
      .then((res) => !cancelled && setLedger(res))
      .catch((err) => !cancelled && onError?.(err))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [loadPage, page, onError])

  const entries = ledger?.entries ?? []

  function goTo(p) {
    setPage(p)
    document.getElementById('points-ledger')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div id="points-ledger" className="scroll-mt-20 overflow-hidden rounded-2xl border border-brand-blue/20 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-blue/20 bg-brand-navy px-4 py-3">
        <h3 className="m-0 flex items-center gap-2 text-base font-bold text-white">
          <Icon name="book" className="h-4.5 w-4.5 text-brand-cyan" />
          Points Ledger
        </h3>
        <span className="text-xs text-blue-100/80">
          Balance <span className="font-bold text-brand-cyan">{balance.toLocaleString('en-IN')} pts</span>
        </span>
      </div>

      <div className={`overflow-x-auto transition-opacity ${loading && ledger ? 'opacity-50' : ''}`}>
        <table className="w-full border-collapse text-left text-[13px]">
          <thead className="bg-brand-light/60">
            <tr>
              <th className={thClass}>Date</th>
              <th className={thClass}>Particulars</th>
              <th className={`${thClass} text-right`}>Credit (+)</th>
              <th className={`${thClass} text-right`}>Debit (−)</th>
              <th className={`${thClass} text-right`}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {!ledger || entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-2.5 py-5 text-center text-slate-500">
                  {!ledger ? 'Loading…' : emptyText}
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className="hover:bg-brand-light/40">
                  <td className={`${tdClass} whitespace-nowrap text-slate-700`}>
                    {formatDate(e.date)}
                    <span className="block text-xs text-slate-500">{formatTimeIST(e.date)}</span>
                  </td>
                  <td className={tdClass}>
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          e.credit ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}
                      >
                        <Icon name={e.type === 'Referral bonus' ? 'users' : e.debit ? 'bag' : 'gift'} className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <span className="block font-semibold text-brand-navy">{e.shopName}</span>
                        <span className="text-xs text-slate-500">
                          {e.type} · {e.details}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className={`${tdClass} text-right font-semibold whitespace-nowrap text-emerald-600`}>
                    {e.credit ? `+${e.credit.toLocaleString('en-IN')}` : ''}
                  </td>
                  <td className={`${tdClass} text-right font-semibold whitespace-nowrap text-red-600`}>
                    {e.debit ? `−${e.debit.toLocaleString('en-IN')}` : ''}
                  </td>
                  <td className={`${tdClass} text-right font-bold whitespace-nowrap text-brand-navy`}>
                    {e.balanceAfter.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {ledger && (
        <Pagination
          label="Points ledger pages"
          page={ledger.page}
          totalPages={ledger.totalPages}
          total={ledger.total}
          limit={ledger.limit}
          disabled={loading}
          onChange={goTo}
        />
      )}
    </div>
  )
}
