import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api, formatDate, formatTimeIST } from '../api'
import Layout from '../components/Layout'
import {
  badgePointsClass,
  btnBase,
  btnDanger,
  btnSuccess,
  errorBoxClass,
  infoBoxAdminClass,
  inputClass,
  tdClass,
  thClass,
} from '../components/ui'
import { useAuth } from '../store/auth'

const statusBadge = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const merchantFilters = ['approved', 'pending', 'rejected', 'all']

function StatTile({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200 bg-slate-50 text-blue-600',
    green: 'border-green-200 bg-green-50 text-green-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  }
  return (
    <div className={`rounded-2xl border p-4 text-center ${tones[tone]}`}>
      <div className="text-xs font-bold uppercase text-slate-500">{label}</div>
      <div className="text-2xl font-extrabold">{value}</div>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { adminToken, signOutAdmin, signInMerchant } = useAuth()

  const [tab, setTab] = useState('merchants')
  const [stats, setStats] = useState(null)
  const [merchants, setMerchants] = useState([])
  const [merchantFilter, setMerchantFilter] = useState('approved')
  const [members, setMembers] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  // App settings (withdrawal fee %); feeDraft is what's typed in the box
  const [settings, setSettings] = useState(null)
  const [feeDraft, setFeeDraft] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  // The company's ALEOS merchant account: { merchant, summary }
  const [master, setMaster] = useState(null)
  const [openingMaster, setOpeningMaster] = useState(false)

  // Runs an admin API call; logs out if the login has expired
  const adminApi = useCallback(
    async (path, options) => {
      try {
        return await api(path, { ...options, token: adminToken })
      } catch (err) {
        if (err.status === 401) signOutAdmin()
        throw err
      }
    },
    [adminToken, signOutAdmin],
  )

  const loadStats = useCallback(() => {
    adminApi('/admin/stats').then((d) => setStats(d.stats)).catch((err) => setError(err.message))
  }, [adminApi])

  useEffect(() => {
    if (adminToken) loadStats()
  }, [adminToken, loadStats])

  useEffect(() => {
    if (!adminToken || tab !== 'master') return
    adminApi('/admin/master-merchant')
      .then(setMaster)
      .catch((err) => setError(err.message))
  }, [adminToken, adminApi, tab])

  useEffect(() => {
    if (!adminToken) return
    adminApi('/admin/settings')
      .then((d) => {
        setSettings(d.settings)
        setFeeDraft(String(d.settings.withdrawalFeePercent ?? 0))
      })
      .catch((err) => setError(err.message))
  }, [adminToken, adminApi])

  useEffect(() => {
    if (!adminToken) return
    const query = merchantFilter === 'all' ? '' : `?status=${merchantFilter}`
    adminApi(`/admin/merchants${query}`)
      .then((d) => setMerchants(d.merchants))
      .catch((err) => setError(err.message))
  }, [adminToken, adminApi, merchantFilter])

  useEffect(() => {
    if (!adminToken) return
    // Small delay so we don't search on every keystroke
    const timer = setTimeout(() => {
      const query = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : ''
      adminApi(`/admin/members?limit=100${query}`)
        .then((d) => setMembers(d.members))
        .catch((err) => setError(err.message))
    }, 300)
    return () => clearTimeout(timer)
  }, [adminToken, adminApi, search])

  if (!adminToken) {
    return <Navigate to="/admin" replace />
  }

  async function setMerchantStatus(merchant, status) {
    setError('')
    setBusyId(merchant._id)
    try {
      const { merchant: updated } = await adminApi(`/admin/merchants/${merchant._id}/status`, {
        method: 'PATCH',
        body: { status },
      })
      setMerchants((list) =>
        merchantFilter === 'all' ? list.map((m) => (m._id === updated._id ? updated : m)) : list.filter((m) => m._id !== updated._id),
      )
      loadStats()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  // Logs this browser in as the ALEOS master merchant and opens the normal merchant dashboard for it
  async function openMasterDashboard() {
    setError('')
    setOpeningMaster(true)
    try {
      const { token } = await adminApi('/admin/master-merchant/session', { method: 'POST' })
      signInMerchant(token)
      navigate('/merchant/dashboard')
    } catch (err) {
      setError(err.message)
      setOpeningMaster(false)
    }
  }

  async function saveSettings(e) {
    e.preventDefault()
    setError('')
    setSettingsSaved(false)
    const percent = Number(feeDraft)
    if (feeDraft === '' || !Number.isFinite(percent) || percent < 0 || percent > 100) {
      setError('Withdrawal fee must be between 0% and 100%.')
      return
    }
    setSavingSettings(true)
    try {
      const d = await adminApi('/admin/settings', { method: 'PATCH', body: { withdrawalFeePercent: percent } })
      setSettings(d.settings)
      setFeeDraft(String(d.settings.withdrawalFeePercent))
      setSettingsSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingSettings(false)
    }
  }

  function handleLogout() {
    signOutAdmin()
    navigate('/')
  }

  const tabClass = (active) =>
    `rounded-lg px-4 py-2 text-[13px] font-semibold ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`

  return (
    <Layout>
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="m-0 text-xl font-semibold text-indigo-600">Admin Monitoring Panel</h2>
        <button className={`${btnDanger} px-3 py-1.5 text-xs`} onClick={handleLogout}>
          Logout Admin
        </button>
      </div>

      <div className={infoBoxAdminClass}>
        📊 Review merchant applications, and view members, points issued, spending and referrals.
      </div>

      {error && <div className={errorBoxClass}>{error}</div>}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Members" value={stats?.totalMembers ?? '–'} />
        <StatTile label="Points Issued" value={stats ? `${stats.networkTotalPoints} pts` : '–'} tone="green" />
        <StatTile label="Merchants" value={stats?.totalMerchants ?? '–'} />
        <StatTile label="Pending Approval" value={stats?.pendingMerchants ?? '–'} tone="amber" />
      </div>

      <div className="mb-4 flex gap-2">
        <button className={tabClass(tab === 'merchants')} onClick={() => setTab('merchants')}>
          Merchants {stats?.pendingMerchants ? `(${stats.pendingMerchants} pending)` : ''}
        </button>
        <button className={tabClass(tab === 'members')} onClick={() => setTab('members')}>
          Members
        </button>
        <button className={tabClass(tab === 'master')} onClick={() => setTab('master')}>
          Master Merchant
        </button>
        <button className={tabClass(tab === 'settings')} onClick={() => setTab('settings')}>
          Settings
        </button>
      </div>

      {tab === 'merchants' ? (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            {merchantFilters.map((f) => (
              <button
                key={f}
                onClick={() => setMerchantFilter(f)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  merchantFilter === f ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f}
                {f === 'pending' && stats?.pendingMerchants > 0 && (
                  <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] leading-none font-bold text-white">
                    {stats.pendingMerchants}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr>
                  <th className={thClass}>Business</th>
                  <th className={thClass}>Category</th>
                  <th className={thClass}>Applied</th>
                  <th className={`${thClass} text-right`}>Wallet Points</th>
                  <th className={thClass}>Status</th>
                  <th className={`${thClass} text-right`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {merchants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-2.5 py-5 text-center text-slate-500">
                      No {merchantFilter === 'all' ? '' : merchantFilter} merchants.
                    </td>
                  </tr>
                ) : (
                  merchants.map((m) => (
                    <tr key={m._id}>
                      <td className={tdClass}>
                        <span className="block font-bold text-slate-900">
                          {m.businessName}
                          {m.isMaster && (
                            <span className="ml-1.5 rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-indigo-700">
                              Master
                            </span>
                          )}
                        </span>
                        {m.merchantId && (
                          <span className="block font-mono text-xs font-bold tracking-wider text-indigo-600">
                            {m.merchantId}
                          </span>
                        )}
                        <span className="block text-xs text-slate-500">
                          {m.ownerName}
                          {m.city ? ` · ${m.city}` : ''}
                        </span>
                        <Link
                          to={`/admin/merchants/${m._id}`}
                          className="mt-1 inline-block text-xs font-semibold text-indigo-600 hover:underline"
                        >
                          View Profile →
                        </Link>
                      </td>
                      <td className={`${tdClass} text-slate-600`}>{m.category}</td>
                      <td className={`${tdClass} text-slate-500 whitespace-nowrap`}>
                        {formatDate(m.createdAt)}
                        <span className="block text-xs">{formatTimeIST(m.createdAt)}</span>
                      </td>
                      <td className={`${tdClass} text-right whitespace-nowrap`}>
                        <span className={badgePointsClass}>{(m.walletBalance ?? 0).toLocaleString('en-IN')} pts</span>
                        <span className="mt-1 block text-xs text-slate-500">{m.discountPercent ?? 10}% discount</span>
                      </td>
                      <td className={tdClass}>
                        <span className={`rounded-md px-2 py-1 text-xs font-bold capitalize ${statusBadge[m.status]}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className={`${tdClass} text-right whitespace-nowrap`}>
                        {m.isMaster && <span className="text-xs text-slate-400">Always approved</span>}
                        {!m.isMaster && m.status !== 'approved' && (
                          <button
                            className={`${btnSuccess} px-2.5 py-1 text-xs`}
                            disabled={busyId === m._id}
                            onClick={() => setMerchantStatus(m, 'approved')}
                          >
                            Approve
                          </button>
                        )}
                        {!m.isMaster && m.status !== 'rejected' && (
                          <button
                            className={`${btnBase} ml-1.5 bg-red-100 px-2.5 py-1 text-xs text-red-700`}
                            disabled={busyId === m._id}
                            onClick={() => setMerchantStatus(m, 'rejected')}
                          >
                            Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : tab === 'members' ? (
        <>
          <input
            type="search"
            placeholder="Search by name, email or mobile"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass}
          />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr>
                  <th className={thClass}>Member</th>
                  <th className={thClass}>Contact</th>
                  <th className={thClass}>Own Code</th>
                  <th className={thClass}>Referred By</th>
                  <th className={`${thClass} text-right`}>Total Spend</th>
                  <th className={`${thClass} text-right`}>Points</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-2.5 py-5 text-center text-slate-500">
                      No members found.
                    </td>
                  </tr>
                ) : (
                  members.map((m) => (
                    <tr key={m._id}>
                      <td className={tdClass}>
                        <span className="block font-bold text-slate-900">
                          {m.name || <span className="font-normal italic text-slate-400">No name yet</span>}
                        </span>
                        <span className="text-xs text-slate-500">Joined {formatDate(m.createdAt)}</span>
                      </td>
                      <td className={`${tdClass} text-xs text-slate-600`}>
                        {m.email}
                        <br />
                        {m.mobile}
                        {(m.address || m.pincode) && (
                          <span className="block text-xs text-slate-500">
                            {[m.address, m.pincode].filter(Boolean).join(' – ')}
                          </span>
                        )}
                      </td>
                      <td className={`${tdClass} font-mono text-xs`}>{m.referralCode}</td>
                      <td className={`${tdClass} font-mono text-xs text-slate-500`}>{m.referredBy}</td>
                      <td className={`${tdClass} text-right font-semibold`}>₹{m.totalSpent.toLocaleString('en-IN')}</td>
                      <td className={`${tdClass} text-right`}>
                        <span className={badgePointsClass}>{m.totalPoints} pts</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : tab === 'master' ? (
        <div className="max-w-2xl rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
          <h4 className="mt-0 mb-1 font-semibold text-slate-700">👑 ALEOS Master Merchant</h4>
          <p className="mt-0 mb-4 text-[13px] text-slate-500">
            The company’s own merchant account. Use it like any merchant — give points to members, recharge its wallet,
            set its discount and share its referral code. Members who join with code{' '}
            <span className="font-mono font-bold">ALEOS</span> count as its referrals.
          </p>
          {!master ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="Merchant ID" value={master.merchant.merchantId} />
                <StatTile label="Wallet" value={`${(master.merchant.walletBalance ?? 0).toLocaleString('en-IN')} pts`} tone="green" />
                <StatTile label="Points Given" value={`${master.summary.pointsGiven.toLocaleString('en-IN')} pts`} />
                <StatTile label="Referrals" value={master.summary.referrals} />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`${btnBase} bg-indigo-600 text-white`}
                  disabled={openingMaster}
                  onClick={openMasterDashboard}
                >
                  {openingMaster ? 'Opening…' : 'Open Master Merchant Dashboard →'}
                </button>
                <Link
                  to={`/admin/merchants/${master.merchant._id}`}
                  className={`${btnBase} bg-white text-indigo-700 ring-1 ring-indigo-200`}
                >
                  View Profile
                </Link>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="max-w-lg rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="mt-0 mb-1 font-semibold text-slate-700">💸 Merchant Withdrawal Fee</h4>
          <p className="mt-0 mb-3 text-[13px] text-slate-500">
            % kept from every merchant withdrawal. At {settings?.withdrawalFeePercent ?? 0}%, withdrawing 1,000 points
            sends ₹{(1000 - (1000 * (settings?.withdrawalFeePercent ?? 0)) / 100).toLocaleString('en-IN')} to their bank.
            Changes apply to new withdrawals only.
          </p>
          {settingsSaved && (
            <div className={`${infoBoxAdminClass} mb-3`}>✅ Withdrawal fee set to {settings.withdrawalFeePercent}%.</div>
          )}
          <form onSubmit={saveSettings} className="flex items-stretch gap-2">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              max="100"
              step="0.01"
              value={feeDraft}
              onChange={(e) => {
                setFeeDraft(e.target.value)
                setSettingsSaved(false)
              }}
              className={`${inputClass.replace('mb-4 ', '')} min-w-0 flex-1`}
            />
            <button type="submit" className={`${btnBase} bg-indigo-600 text-white whitespace-nowrap`} disabled={savingSettings}>
              {savingSettings ? 'Saving…' : 'Save'}
            </button>
          </form>
        </div>
      )}
    </Layout>
  )
}
