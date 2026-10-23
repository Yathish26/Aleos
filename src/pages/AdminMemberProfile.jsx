import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { api, formatDate, formatTimeIST } from '../api'
import Layout from '../components/Layout'
import PanelTitle from '../components/PanelTitle'
import PointsLedger from '../components/PointsLedger'
import { badgePointsClass, errorBoxClass, tdClass, thClass } from '../components/ui'
import { useAuth } from '../store/auth'

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

// Admin-only: full details, referrals and points ledger of one member
export default function AdminMemberProfile() {
  const { id } = useParams()
  const { adminToken, signOutAdmin } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

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
    adminApi(`/admin/members/${id}`)
      .then(setData)
      .catch((err) => setError(err.message))
  }, [adminToken, adminApi, id])

  // The ledger loads its pages from the admin copy of the member's passbook
  const loadLedgerPage = useCallback(
    (page, limit) => adminApi(`/admin/members/${id}/passbook?page=${page}&limit=${limit}`),
    [adminApi, id],
  )
  const onLedgerError = useCallback((err) => setError(err.message), [])

  if (!adminToken) return <Navigate to="/admin" replace />

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

  const { member: m, summary, referredBy, addedBy, referrals } = data

  return (
    <Layout>
      {back}

      <div className="mb-5">
        <h2 className="m-0 text-xl font-bold text-brand-navy sm:text-2xl">
          {m.name || <span className="font-normal italic text-slate-400">No name yet</span>}
        </h2>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-brand-light px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-brand-navy">
            {m.referralCode}
          </span>
          <span className="text-xs text-slate-500">
            Joined {formatDate(m.createdAt)}, {formatTimeIST(m.createdAt)}
          </span>
        </div>
      </div>

      {error && <div className={errorBoxClass}>{error}</div>}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Points Balance" value={pts(m.totalPoints)} />
        <Stat label="Total Spent" value={rupees(m.totalSpent)} sub={`${summary.billsCount} bills`} />
        <Stat
          label="Points Earned"
          value={pts(summary.pointsEarned)}
          sub={summary.referralPoints ? `incl. ${pts(summary.referralPoints)} referral bonus` : null}
        />
        <Stat label="Points Used" value={pts(summary.pointsUsed)} sub={`${summary.redemptionsCount} times`} />
      </div>

      <Section icon="user" title="Member Details">
        <Row label="Name">{m.name}</Row>
        <Row label="Email">{m.email}</Row>
        <Row label="Mobile">{m.mobile && `+91 ${m.mobile}`}</Row>
        <Row label="Address">{m.address}</Row>
        <Row label="Pincode">{m.pincode}</Row>
        <Row label="Own Referral Code">
          <span className="font-mono">{m.referralCode}</span>
        </Row>
        <Row label="Referred By">
          {referredBy &&
            (referredBy.kind === 'member' ? (
              <Link to={`/admin/members/${referredBy.id}`} className="font-semibold text-brand-blue hover:underline">
                {referredBy.name} <span className="font-mono text-xs text-slate-500">({referredBy.code})</span>
              </Link>
            ) : referredBy.kind === 'merchant' ? (
              <Link to={`/admin/merchants/${referredBy.id}`} className="font-semibold text-brand-blue hover:underline">
                {referredBy.name} <span className="font-mono text-xs text-slate-500">({referredBy.code})</span>
                {referredBy.isMaster && <span className="ml-1 text-xs text-slate-500">· ALEOS</span>}
              </Link>
            ) : (
              <span className="font-mono">{referredBy.code}</span>
            ))}
        </Row>
        <Row label="Added By Shop">
          {addedBy && (
            <Link to={`/admin/merchants/${addedBy.id}`} className="font-semibold text-brand-blue hover:underline">
              {addedBy.name} <span className="font-mono text-xs text-slate-500">({addedBy.merchantId})</span>
            </Link>
          )}
        </Row>
        <Row label="Status">{m.isActive === false ? 'Inactive' : 'Active'}</Row>
      </Section>

      <Section icon="users" title={`Members Referred (${summary.referrals})`}>
        {referrals.length === 0 ? (
          <p className="m-0 text-[13px] text-slate-500">This member hasn't referred anyone yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead className="bg-brand-light/60">
                <tr>
                  <th className={thClass}>Member</th>
                  <th className={thClass}>Joined</th>
                  <th className={`${thClass} text-right`}>Points</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r._id} className="hover:bg-brand-light/40">
                    <td className={tdClass}>
                      <Link to={`/admin/members/${r._id}`} className="block font-bold text-brand-navy hover:underline">
                        {r.name || <span className="font-normal italic text-slate-400">No name yet</span>}
                      </Link>
                      <span className="text-xs text-slate-500">{r.email}</span>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-slate-600`}>{formatDate(r.createdAt)}</td>
                    <td className={`${tdClass} text-right`}>
                      <span className={badgePointsClass}>{pts(r.totalPoints)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <PointsLedger
        // A new member id means a fresh ledger starting from page 1
        key={id}
        loadPage={loadLedgerPage}
        balance={m.totalPoints}
        onError={onLedgerError}
        emptyText="This member has no points activity yet."
      />
    </Layout>
  )
}
