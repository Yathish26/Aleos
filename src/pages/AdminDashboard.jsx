import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api, formatDate, formatTimeIST } from '../api'
import Icon, { inlineIconClass } from '../components/Icon'
import Layout from '../components/Layout'
import Pagination from '../components/Pagination'
import PanelTitle from '../components/PanelTitle'
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
const PAGE_SIZE = 20

function StatTile({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200 bg-slate-50 text-brand-blue',
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
  // Both lists load one page at a time: { page, totalPages, total, limit } from the server
  const [merchantSearch, setMerchantSearch] = useState('')
  const [merchantPage, setMerchantPage] = useState(1)
  const [merchantPaging, setMerchantPaging] = useState(null)
  const [merchantsVersion, setMerchantsVersion] = useState(0) // bump to reload the current page
  const [loadingMerchants, setLoadingMerchants] = useState(false)
  const [memberPage, setMemberPage] = useState(1)
  const [memberPaging, setMemberPaging] = useState(null)
  const [loadingMembers, setLoadingMembers] = useState(false)

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
    let cancelled = false // ignore a slow answer for a page, filter or search the admin has already left
    // Small delay so we don't search on every keystroke
    const timer = setTimeout(() => {
      const status = merchantFilter === 'all' ? '' : `&status=${merchantFilter}`
      const query = merchantSearch.trim() ? `&search=${encodeURIComponent(merchantSearch.trim())}` : ''
      setLoadingMerchants(true)
      adminApi(`/admin/merchants?page=${merchantPage}&limit=${PAGE_SIZE}${status}${query}`)
        .then((d) => {
          if (cancelled) return
          // The last item on a page was approved/rejected away — step back to the page before
          if (d.merchants.length === 0 && merchantPage > 1) {
            setMerchantPage(merchantPage - 1)
            return
          }
          setMerchants(d.merchants)
          setMerchantPaging(d)
        })
        .catch((err) => !cancelled && setError(err.message))
        .finally(() => !cancelled && setLoadingMerchants(false))
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [adminToken, adminApi, merchantFilter, merchantSearch, merchantPage, merchantsVersion])

  useEffect(() => {
    if (!adminToken) return
    let cancelled = false
    // Small delay so we don't search on every keystroke
    const timer = setTimeout(() => {
      const query = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : ''
      setLoadingMembers(true)
      adminApi(`/admin/members?page=${memberPage}&limit=${PAGE_SIZE}${query}`)
        .then((d) => {
          if (cancelled) return
          setMembers(d.members)
          setMemberPaging(d)
        })
        .catch((err) => !cancelled && setError(err.message))
        .finally(() => !cancelled && setLoadingMembers(false))
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [adminToken, adminApi, search, memberPage])

  if (!adminToken) {
    return <Navigate to="/admin" replace />
  }

  async function setMerchantStatus(merchant, status) {
    setError('')
    setBusyId(merchant._id)
    try {
      await adminApi(`/admin/merchants/${merchant._id}/status`, { method: 'PATCH', body: { status } })
      // Reload the page so the list and its counts stay right (the merchant may have left this filter)
      setMerchantsVersion((v) => v + 1)
      loadStats()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  // Logs this browser in as the ALEOS master merchant and opens its merchant dashboard in a new tab, leaving the
  // admin panel open here. The tab is opened straight away (browsers block tabs opened after waiting on the
  // server) and pointed at the dashboard once the login is ready; the login is shared with it via localStorage.
  async function openMasterDashboard() {
    setError('')
    const tab = window.open('', '_blank')
    setOpeningMaster(true)
    try {
      const { token } = await adminApi('/admin/master-merchant/session', { method: 'POST' })
      signInMerchant(token)
      if (tab) {
        tab.opener = null // the new tab can't reach back into the admin panel
        tab.location.href = '/merchant/dashboard'
      } else {
        // Pop-ups blocked: fall back to opening it in this tab
        navigate('/merchant/dashboard')
      }
    } catch (err) {
      tab?.close()
      setError(err.message)
    } finally {
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
    `rounded-lg px-4 py-2 text-[13px] font-semibold ${active ? 'bg-brand-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`

  return (
    <Layout>
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="m-0 text-xl font-semibold text-brand-blue">Admin Monitoring Panel</h2>
        <button className={`${btnDanger} px-3 py-1.5 text-xs`} onClick={handleLogout}>
          Logout Admin
        </button>
      </div>

      <div className={infoBoxAdminClass}>
        <Icon name="chart" className={inlineIconClass} />
        Review merchant applications, and view members, points issued, spending and referrals.
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
          <input
            type="search"
            placeholder="Search by business, owner, city, email, mobile or Merchant ID"
            value={merchantSearch}
            onChange={(e) => {
              setMerchantSearch(e.target.value)
              setMerchantPage(1)
            }}
            className={`${inputClass} mb-3`}
          />

          <div className="mb-3 flex flex-wrap gap-2">
            {merchantFilters.map((f) => (
              <button
                key={f}
                onClick={() => {
                  setMerchantFilter(f)
                  setMerchantPage(1)
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  merchantFilter === f
                    ? 'bg-brand-navy text-white'
                    : 'bg-brand-light text-brand-navy hover:bg-brand-blue/20'
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

          <div className={`overflow-x-auto transition-opacity ${loadingMerchants ? 'opacity-50' : ''}`}>
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
                      {loadingMerchants
                        ? 'Loading…'
                        : merchantSearch.trim()
                          ? `No ${merchantFilter === 'all' ? '' : `${merchantFilter} `}merchants match “${merchantSearch.trim()}”.`
                          : `No ${merchantFilter === 'all' ? '' : merchantFilter} merchants.`}
                    </td>
                  </tr>
                ) : (
                  merchants.map((m) => (
                    <tr key={m._id}>
                      <td className={tdClass}>
                        <span className="block font-bold text-slate-900">
                          {m.businessName}
                          {m.isMaster && (
                            <span className="ml-1.5 rounded-md bg-brand-light px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-navy">
                              Master
                            </span>
                          )}
                        </span>
                        {m.merchantId && (
                          <span className="block font-mono text-xs font-bold tracking-wider text-brand-blue">
                            {m.merchantId}
                          </span>
                        )}
                        <span className="block text-xs text-slate-500">
                          {m.ownerName}
                          {m.city ? ` · ${m.city}` : ''}
                        </span>
                        <Link
                          to={`/admin/merchants/${m._id}`}
                          className="mt-1 inline-block text-xs font-semibold text-brand-blue hover:underline"
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
          {merchantPaging && (
            <Pagination
              label="Merchant list pages"
              page={merchantPaging.page}
              totalPages={merchantPaging.totalPages}
              total={merchantPaging.total}
              limit={merchantPaging.limit}
              disabled={loadingMerchants}
              onChange={setMerchantPage}
            />
          )}
        </>
      ) : tab === 'members' ? (
        <>
          <input
            type="search"
            placeholder="Search by name, email, mobile or referral code"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setMemberPage(1)
            }}
            className={inputClass}
          />
          <div className={`overflow-x-auto transition-opacity ${loadingMembers ? 'opacity-50' : ''}`}>
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
                      {loadingMembers
                        ? 'Loading…'
                        : search.trim()
                          ? `No members match “${search.trim()}”.`
                          : 'No members yet.'}
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
                        <Link
                          to={`/admin/members/${m._id}`}
                          className="mt-1 block text-xs font-semibold text-brand-blue hover:underline"
                        >
                          View Profile →
                        </Link>
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
          {memberPaging && (
            <Pagination
              label="Member list pages"
              page={memberPaging.page}
              totalPages={memberPaging.totalPages}
              total={memberPaging.total}
              limit={memberPaging.limit}
              disabled={loadingMembers}
              onChange={setMemberPage}
            />
          )}
        </>
      ) : tab === 'master' ? (
        <div className="max-w-2xl rounded-xl border border-brand-blue/30 bg-brand-light/50 p-4">
          <PanelTitle icon="crown" className="mt-0 mb-1">
            ALEOS Master Merchant
          </PanelTitle>
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
                  className={`${btnBase} bg-brand-navy text-white`}
                  disabled={openingMaster}
                  onClick={openMasterDashboard}
                >
                  {openingMaster ? 'Opening…' : 'Open Master Merchant Dashboard ↗'}
                </button>
                <Link
                  to={`/admin/merchants/${master.merchant._id}`}
                  className={`${btnBase} bg-white text-brand-navy ring-1 ring-brand-blue/30`}
                >
                  View Profile
                </Link>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="max-w-lg rounded-xl border border-slate-200 bg-slate-50 p-4">
          <PanelTitle icon="banknote" className="mt-0 mb-1">
            Merchant Withdrawal Fee
          </PanelTitle>
          <p className="mt-0 mb-3 text-[13px] text-slate-500">
            % kept from every merchant withdrawal. At {settings?.withdrawalFeePercent ?? 0}%, withdrawing 1,000 points
            sends ₹{(1000 - (1000 * (settings?.withdrawalFeePercent ?? 0)) / 100).toLocaleString('en-IN')} to their bank.
            Changes apply to new withdrawals only.
          </p>
          {settingsSaved && (
            <div className={`${infoBoxAdminClass} mb-3`}>
              <Icon name="checkCircle" className={inlineIconClass} />
              Withdrawal fee set to {settings.withdrawalFeePercent}%.
            </div>
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
            <button type="submit" className={`${btnBase} bg-brand-navy text-white whitespace-nowrap`} disabled={savingSettings}>
              {savingSettings ? 'Saving…' : 'Save'}
            </button>
          </form>
        </div>
      )}
    </Layout>
  )
}
