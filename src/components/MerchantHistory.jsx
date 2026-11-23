import { useState } from 'react'
import { formatDate, formatTimeIST } from '../api'
import Icon from './Icon'
import { badgePointsClass, tdClass, thClass } from './ui'

// A merchant's history card with tabs: Passbook (every credit in/out), Discounts Applied, Credit Purchases and
// Rebate Settlements. Shared by the merchant dashboard and the admin merchant profile so both look the same.
// UI copy avoids wallet / cash / withdrawal wording (PPI triggers); internal names still say wallet/withdrawal.

const rupees = (n) => `₹${(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
const pts = (n) => `${(n ?? 0).toLocaleString('en-IN')} pts`

// Icon for each kind of passbook entry (types come from the server)
const passbookIcons = {
  'Points given': 'gift',
  Recharge: 'coins',
  'Sign-up top-up': 'coins',
  Withdrawal: 'repeat',
  'Points used by member': 'tag',
  'Referral share': 'users',
  'ALEOS share': 'crown',
}

// Loyalty/SaaS wording shown for the server's passbook types (avoids wallet/payout terms)
const passbookLabels = {
  'Points given': 'Reward points issued',
  Recharge: 'Promotional credits purchased',
  'Sign-up top-up': 'Starter campaign quota',
  Withdrawal: 'Promotional rebate settled',
  'Points used by member': 'Reward points applied as discount',
}

function EmptyRow({ colSpan, children }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-2.5 py-5 text-center text-slate-500">
        {children}
      </td>
    </tr>
  )
}

function DateCell({ value }) {
  return (
    <td className={`${tdClass} whitespace-nowrap text-slate-700`}>
      {formatDate(value)}
      <span className="block text-xs text-slate-500">{formatTimeIST(value)}</span>
    </td>
  )
}

const tableClass = 'w-full border-collapse text-left text-[13px]'
const theadClass = 'bg-brand-light/60'
const rowClass = 'hover:bg-brand-light/40'

/**
 * passbook: entries from the passbook endpoint (null while loading)
 * redemptions, payments, withdrawals: the merchant's records, newest first
 * walletBalance: current wallet points
 * shopLabel: how the empty "points used" message refers to the shop ('your shop' / 'this shop')
 */
export default function MerchantHistory({
  passbook,
  redemptions = [],
  payments = [],
  withdrawals = [],
  walletBalance = 0,
  shopLabel = 'your shop',
}) {
  const [tab, setTab] = useState('passbook')

  const tabs = [
    { id: 'passbook', icon: 'book', label: 'Passbook', count: passbook?.length },
    { id: 'used', icon: 'tag', label: 'Discounts Applied', count: redemptions.length },
    { id: 'recharges', icon: 'coins', label: 'Credit Purchases', count: payments.length },
    { id: 'withdrawals', icon: 'repeat', label: 'Rebate Settlements', count: withdrawals.length },
  ]

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-blue/20 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-blue/20 px-4 pt-4">
        <h3 className="m-0 flex items-center gap-2 pb-3 text-base font-bold text-brand-navy">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-navy text-brand-cyan">
            <Icon name="book" className="h-4 w-4" />
          </span>
          History
        </h3>
        <div className="pb-3 text-xs text-slate-500">
          Available promotional credits <span className="font-bold text-brand-navy">{pts(walletBalance)}</span>
        </div>
        <div role="tablist" className="-mb-px flex w-full gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors ${
                tab === t.id ? 'border-brand-blue text-brand-navy' : 'border-transparent text-slate-500 hover:text-brand-navy'
              }`}
            >
              <Icon name={t.icon} className="h-4 w-4" />
              {t.label}
              {t.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] leading-none ${
                    tab === t.id ? 'bg-brand-light text-brand-navy' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === 'passbook' && (
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>Date</th>
                <th className={thClass}>Particulars</th>
                <th className={`${thClass} text-right`}>Credit (+)</th>
                <th className={`${thClass} text-right`}>Debit (−)</th>
                <th className={`${thClass} text-right`}>Credits After</th>
              </tr>
            </thead>
            <tbody>
              {passbook == null ? (
                <EmptyRow colSpan={5}>Loading…</EmptyRow>
              ) : passbook.length === 0 ? (
                <EmptyRow colSpan={5}>No promotional credit activity yet.</EmptyRow>
              ) : (
                passbook.map((e) => (
                  <tr key={e.id} className={rowClass}>
                    <DateCell value={e.date} />
                    <td className={tdClass}>
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            e.credit ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                          }`}
                        >
                          <Icon name={passbookIcons[e.type] || 'coins'} className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <span className="block font-semibold text-brand-navy">{passbookLabels[e.type] || e.type}</span>
                          <span className="text-xs text-slate-500">
                            {e.details}
                            {e.reference && ` · Ref ${e.reference}`}
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
      )}

      {tab === 'used' && (
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>Date</th>
                <th className={thClass}>Member</th>
                <th className={`${thClass} text-right`}>Points Applied</th>
                <th className={`${thClass} text-right`}>Credits After</th>
              </tr>
            </thead>
            <tbody>
              {redemptions.length === 0 ? (
                <EmptyRow colSpan={4}>No reward points applied as discounts at {shopLabel} yet.</EmptyRow>
              ) : (
                redemptions.map((r) => (
                  <tr key={r._id} className={rowClass}>
                    <DateCell value={r.createdAt} />
                    <td className={tdClass}>
                      <span className="block font-bold text-brand-navy">
                        {r.member ? r.member.name || r.member.email : 'Removed member'}
                      </span>
                      {r.member?.name && <span className="text-xs text-slate-500">{r.member.email}</span>}
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <span className={badgePointsClass}>+{pts(r.points)}</span>
                    </td>
                    <td className={`${tdClass} text-right text-slate-600`}>
                      {r.merchantWalletAfter != null ? pts(r.merchantWalletAfter) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'recharges' && (
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>Date</th>
                <th className={thClass}>Type</th>
                <th className={`${thClass} text-right`}>Paid</th>
                <th className={`${thClass} text-right`}>Credits Added</th>
                <th className={`${thClass} text-right`}>Credits After</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <EmptyRow colSpan={5}>No promotional credit purchases yet.</EmptyRow>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className={rowClass}>
                    <DateCell value={p.createdAt} />
                    <td className={tdClass}>
                      <span className="block font-bold text-brand-navy">{p.kind === 'signup' ? 'Starter quota' : 'Campaign quota top-up'}</span>
                      <span className="text-xs text-slate-500">
                        {p.mode === 'dummy' ? 'Test · ' : ''}Ref {p.reference}
                      </span>
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <span className="block font-semibold">{rupees(p.amount)}</span>
                      <span className="text-xs text-slate-500">incl. {rupees(p.convenienceFee)} convenience fee</span>
                      {p.onboardingFee > 0 && (
                        <span className="block text-xs text-slate-500">
                          + {rupees(p.onboardingFee)} onboarding + {rupees(p.onboardingTax || 0)} GST
                        </span>
                      )}
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <span className={badgePointsClass}>+{pts(p.points)}</span>
                    </td>
                    <td className={`${tdClass} text-right text-slate-600`}>
                      {p.walletBalanceAfter != null ? pts(p.walletBalanceAfter) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'withdrawals' && (
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>Date</th>
                <th className={thClass}>Settled To</th>
                <th className={`${thClass} text-right`}>Credits</th>
                <th className={`${thClass} text-right`}>Reimbursed</th>
                <th className={`${thClass} text-right`}>Credits After</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 ? (
                <EmptyRow colSpan={5}>No promotional rebates settled yet.</EmptyRow>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w._id} className={rowClass}>
                    <DateCell value={w.createdAt} />
                    <td className={tdClass}>
                      <span className="block font-bold text-brand-navy">
                        {w.bankName || 'Settlement account'} ··{w.accountLast4}
                      </span>
                      <span className="text-xs text-slate-500">
                        {w.mode === 'dummy' ? 'Test · ' : ''}Ref {w.reference}
                      </span>
                    </td>
                    <td className={`${tdClass} text-right font-semibold text-red-600`}>−{pts(w.points)}</td>
                    <td className={`${tdClass} text-right`}>
                      <span className="block font-semibold">{rupees(w.amount)}</span>
                      {w.fee > 0 && (
                        <span className="text-xs text-slate-500">
                          after {rupees(w.fee)} platform settlement & audit fee ({w.feePercent}%)
                        </span>
                      )}
                    </td>
                    <td className={`${tdClass} text-right text-slate-600`}>
                      {w.walletBalanceAfter != null ? pts(w.walletBalanceAfter) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
