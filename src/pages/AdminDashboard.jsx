import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api, formatDate } from '../api'
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

const merchantFilters = ['pending', 'approved', 'rejected', 'all']

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
  const { adminToken, signOutAdmin } = useAuth()

  const [tab, setTab] = useState('merchants')
  const [stats, setStats] = useState(null)
  const [merchants, setMerchants] = useState([])
  const [merchantFilter, setMerchantFilter] = useState('pending')
  const [members, setMembers] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

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
      </div>

      {tab === 'merchants' ? (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            {merchantFilters.map((f) => (
              <button
                key={f}
                onClick={() => setMerchantFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  merchantFilter === f ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr>
                  <th className={thClass}>Business</th>
                  <th className={thClass}>Category</th>
                  <th className={thClass}>Contact</th>
                  <th className={thClass}>Applied</th>
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
                        <span className="block font-bold text-slate-900">{m.businessName}</span>
                        <span className="text-xs text-slate-500">
                          {m.ownerName}
                          {m.city ? ` · ${m.city}` : ''}
                        </span>
                      </td>
                      <td className={`${tdClass} text-slate-600`}>{m.category}</td>
                      <td className={`${tdClass} text-xs text-slate-600`}>
                        {m.email}
                        <br />
                        {m.mobile}
                      </td>
                      <td className={`${tdClass} text-slate-500`}>{formatDate(m.createdAt)}</td>
                      <td className={tdClass}>
                        <span className={`rounded-md px-2 py-1 text-xs font-bold capitalize ${statusBadge[m.status]}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className={`${tdClass} text-right whitespace-nowrap`}>
                        {m.status !== 'approved' && (
                          <button
                            className={`${btnSuccess} px-2.5 py-1 text-xs`}
                            disabled={busyId === m._id}
                            onClick={() => setMerchantStatus(m, 'approved')}
                          >
                            Approve
                          </button>
                        )}
                        {m.status !== 'rejected' && (
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
      ) : (
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
                        <span className="block font-bold text-slate-900">{m.name}</span>
                        <span className="text-xs text-slate-500">Joined {formatDate(m.createdAt)}</span>
                      </td>
                      <td className={`${tdClass} text-xs text-slate-600`}>
                        {m.email}
                        <br />
                        {m.mobile}
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
      )}
    </Layout>
  )
}
