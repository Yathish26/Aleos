import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { api, formatDate, formatTimeIST } from '../api'
import Icon, { inlineIconClass } from '../components/Icon'
import Layout from '../components/Layout'
import MerchantHistory from '../components/MerchantHistory'
import PanelTitle from '../components/PanelTitle'
import { btnBase, btnSuccess, errorBoxClass } from '../components/ui'
import { useAuth } from '../store/auth'

const statusBadge = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const rupees = (n) => `₹${(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
const pts = (n) => `${(n ?? 0).toLocaleString('en-IN')} pts`

function Section({ icon, title, children }) {
  return (
    <div className="mb-5 rounded-2xl border border-brand-blue/20 bg-white p-4 sm:p-5">
      <PanelTitle icon={icon} className="mt-0 mb-3">
        {title}
      </PanelTitle>
      {children}
    </div>
  )
}

// One label/value row; empty values show a dash
function Row({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-2 text-[13px] last:border-0 sm:flex-row sm:gap-4">
      <div className="w-44 shrink-0 font-semibold text-slate-500">{label}</div>
      <div className="min-w-0 break-words text-slate-900">{children || <span className="text-slate-400">—</span>}</div>
    </div>
  )
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-brand-blue/20 bg-brand-light p-3.5 text-center">
      <div className="text-[11px] font-bold uppercase text-brand-navy/70">{label}</div>
      <div className="font-display text-xl font-extrabold text-brand-navy">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  )
}

// Admin-only: full details and activity of one merchant
export default function AdminMerchantProfile() {
  const { id } = useParams()
  const { adminToken, signOutAdmin } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const adminApi = useCallback(
    async (path, options) => {
      try {
        return await api(path, { ...options, token: adminToken })
      } catch (err) {
        if (err.status === 401 || err.status === 403) signOutAdmin()
        throw err
      }
    },
    [adminToken, signOutAdmin],
  )

  useEffect(() => {
    if (!adminToken) return
    adminApi(`/admin/merchants/${id}`)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [adminToken, adminApi, id])

  if (!adminToken) return <Navigate to="/admin" replace />

  async function setStatus(status) {
    setError('')
    setBusy(true)
    try {
      const { merchant } = await adminApi(`/admin/merchants/${id}/status`, { method: 'PATCH', body: { status } })
      setData((d) => ({ ...d, merchant }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const back = (
    <Link to="/admin/dashboard" className="mb-4 inline-block text-sm font-semibold text-brand-blue hover:underline">
      ← Back to Admin Panel
    </Link>
  )

  if (!data) {
    return (
      <Layout>
        {back}
        {error ? <div className={errorBoxClass}>{error}</div> : <p className="text-sm text-slate-500">Loading…</p>}
      </Layout>
    )
  }

  const { merchant: m, summary, redemptions, withdrawals, payments, passbook } = data

  return (
    <Layout>
      {back}

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-xl font-semibold text-slate-900">{m.businessName}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {m.merchantId && (
              <span className="rounded-md bg-brand-light px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-brand-navy">
                {m.merchantId}
              </span>
            )}
            <span className={`rounded-md px-2 py-0.5 text-xs font-bold capitalize ${statusBadge[m.status]}`}>{m.status}</span>
            <span className="text-xs text-slate-500">{m.category}</span>
          </div>
        </div>
        <div className="flex gap-1.5">
          {m.isMaster && (
            <span className="rounded-md bg-brand-light px-2 py-1 text-xs font-bold uppercase text-brand-navy">
              <Icon name="crown" className={inlineIconClass} />
              Master Merchant
            </span>
          )}
          {!m.isMaster && m.status !== 'approved' && (
            <button className={`${btnSuccess} px-3 py-1.5 text-xs`} disabled={busy} onClick={() => setStatus('approved')}>
              Approve
            </button>
          )}
          {!m.isMaster && m.status !== 'rejected' && (
            <button
              className={`${btnBase} bg-red-100 px-3 py-1.5 text-xs text-red-700`}
              disabled={busy}
              onClick={() => setStatus('rejected')}
            >
              Reject
            </button>
          )}
        </div>
      </div>

      {error && <div className={errorBoxClass}>{error}</div>}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Wallet" value={pts(m.walletBalance)} sub={`${m.discountPercent ?? 10}% discount`} />
        <Stat label="Points Given" value={pts(summary.pointsGiven)} sub={`${summary.billsCount} bills · ${rupees(summary.salesRecorded)}`} />
        <Stat label="Points Redeemed" value={pts(summary.pointsRedeemed)} sub={`${summary.redemptionsCount} times`} />
        <Stat label="Withdrawn" value={rupees(summary.amountWithdrawn)} sub={`${pts(summary.pointsWithdrawn)} · fees ${rupees(summary.withdrawalFees)}`} />
      </div>

      <Section icon="store" title="Business">
        <Row label="Business Name">{m.businessName}</Row>
        <Row label="Merchant ID / Referral Code">{m.merchantId && <span className="font-mono">{m.merchantId}</span>}</Row>
        <Row label="Category">{m.category}</Row>
        <Row label="Trade License">{m.tradeLicense}</Row>
        <Row label="FSSAI Licence">{m.fssaiNumber && <span className="font-mono">{m.fssaiNumber}</span>}</Row>
        <Row label="Address">{m.address}</Row>
        <Row label="City">{m.city}</Row>
        <Row label="Google Business">
          {m.googleBusinessLink && (
            <a href={m.googleBusinessLink} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-blue hover:underline">
              Open link ↗
            </a>
          )}
        </Row>
        <Row label="Discount to Members">{`${m.discountPercent ?? 10}%`}</Row>
        <Row label="Members Referred">{String(summary.referrals)}</Row>
        <Row label="Applied">{`${formatDate(m.createdAt)}, ${formatTimeIST(m.createdAt)}`}</Row>
      </Section>

      <Section icon="user" title="Owner & Contact">
        <Row label="Owner Name">{m.ownerName}</Row>
        <Row label="Email">{m.email}</Row>
        <Row label="Mobile">{m.mobile && `+91 ${m.mobile}`}</Row>
        <Row label="Aadhaar">
          {m.aadhaarNumber && <span className="font-mono">XXXX XXXX {m.aadhaarNumber.slice(-4)}</span>}
        </Row>
        <Row label="PAN">{m.panNumber && <span className="font-mono">{m.panNumber}</span>}</Row>
      </Section>

      <Section icon="bank" title="Bank Details">
        <Row label="Bank Name">{m.bankName}</Row>
        <Row label="Account Holder">{m.accountHolderName}</Row>
        <Row label="Account Number">{m.accountNumber && <span className="font-mono">{m.accountNumber}</span>}</Row>
        <Row label="IFSC">{m.ifsc && <span className="font-mono">{m.ifsc}</span>}</Row>
        <Row label="Verification">
          {m.bankVerified ? (
            <span className="font-semibold text-emerald-600">
              <Icon name="checkCircle" className={inlineIconClass} />
              Verified{m.bankRegisteredName ? ` — bank name: ${m.bankRegisteredName}` : ''}
            </span>
          ) : (
            <span className="font-semibold text-amber-600">Not verified</span>
          )}
        </Row>
      </Section>

      <div className="mb-3 text-xs text-slate-500">
        Total recharged {rupees(summary.amountRecharged)} · convenience fees {rupees(summary.rechargeFees)} · withdrawal
        fees {rupees(summary.withdrawalFees)}
      </div>
      <MerchantHistory
        passbook={passbook}
        redemptions={redemptions}
        payments={payments}
        withdrawals={withdrawals}
        walletBalance={m.walletBalance ?? 0}
        shopLabel="this shop"
      />
    </Layout>
  )
}
