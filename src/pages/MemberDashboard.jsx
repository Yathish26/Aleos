import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api, formatDate } from '../api'
import Layout from '../components/Layout'
import { badgePointsClass, btnSecondary, errorBoxClass, inputClass, tdClass, thClass } from '../components/ui'
import { useAuth } from '../store/auth'

export default function MemberDashboard() {
  const navigate = useNavigate()
  const { memberToken, signOutMember } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!memberToken) return
    Promise.all([
      api('/members/me', { token: memberToken }),
      api('/members/me/transactions', { token: memberToken }),
      api('/members/me/referrals', { token: memberToken }),
    ])
      .then(([me, tx, refs]) => setData({ member: me.member, transactions: tx.transactions, referrals: refs.referrals }))
      .catch((err) => {
        if (err.status === 401 || err.status === 404) signOutMember() // login expired or account removed
        else setError(err.message)
      })
  }, [memberToken, signOutMember])

  if (!memberToken) return <Navigate to="/login" replace />

  if (!data) {
    return (
      <Layout>
        {error ? <div className={errorBoxClass}>{error}</div> : <p className="text-sm text-slate-500">Loading…</p>}
      </Layout>
    )
  }

  const { member, transactions, referrals } = data
  const referralLink = `${window.location.origin}/join/member?ref=${member.referralCode}`
  const shareMessage = `Join ALEOS Rewards network as a member and earn points on your purchases! Use my referral code ${member.referralCode} or sign up here: ${referralLink}`
  const smsSeparator = /iPad|iPhone|iPod/.test(navigator.userAgent) ? '&' : '?'

  function handleLogout() {
    signOutMember()
    navigate('/')
  }

  async function copyRefLink() {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy automatically — please copy the link manually.')
    }
  }

  return (
    <Layout>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="m-0 text-xl font-semibold text-slate-900">Welcome, {member.name}!</h2>
          <div className="mt-0.5 text-[13px] text-slate-500">
            {member.email} · +91 {member.mobile}
          </div>
        </div>
        <button className={`${btnSecondary} px-3 py-1.5 text-xs`} onClick={handleLogout}>
          Logout
        </button>
      </div>

      {error && <div className={errorBoxClass}>{error}</div>}

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-center">
          <div className="text-xs font-bold uppercase text-green-800">Reward Points</div>
          <div className="text-3xl font-extrabold text-green-700">{member.totalPoints} pts</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
          <div className="text-xs font-bold uppercase text-slate-500">Members Referred</div>
          <div className="text-3xl font-extrabold text-blue-600">{referrals.length}</div>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="mt-0 mb-2 font-semibold text-slate-700">🎁 Refer New Members & Share</h4>
        <p className="mb-3 text-[13px] text-slate-500">
          Your referral code is{' '}
          <span className="rounded-md bg-white px-2 py-0.5 font-mono font-bold text-slate-900">{member.referralCode}</span>
          . New members need a referral code to join — share yours or send the link below.
        </p>

        <div className="mb-3 flex items-center gap-2">
          <input type="text" readOnly value={referralLink} className={`${inputClass} mb-0 text-xs`} />
          <button className={`${btnSecondary} whitespace-nowrap`} onClick={copyRefLink}>
            {copied ? 'Copied ✓' : 'Copy Link'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-25 flex-1 items-center justify-center rounded-lg bg-[#25D366] p-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
          >
            💬 WhatsApp
          </a>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join ALEOS Rewards as a Member!')}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-25 flex-1 items-center justify-center rounded-lg bg-[#229ED9] p-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
          >
            ✈️ Telegram
          </a>
          <a
            href={`sms:${smsSeparator}body=${encodeURIComponent(shareMessage)}`}
            className="flex min-w-25 flex-1 items-center justify-center rounded-lg bg-violet-500 p-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
          >
            📱 SMS
          </a>
        </div>

        {referrals.length > 0 && (
          <div className="mt-4 text-[13px] text-slate-600">
            <span className="font-semibold">Joined with your code:</span>{' '}
            {referrals.map((r) => r.name).join(', ')}
          </div>
        )}
      </div>

      <h3 className="mb-3 text-slate-700">Merchant Points Ledger</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr>
              <th className={thClass}>Date</th>
              <th className={thClass}>Merchant / Shop Name</th>
              <th className={`${thClass} text-right`}>Purchased Value</th>
              <th className={`${thClass} text-right`}>Points Issued</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-2.5 py-5 text-center text-slate-500">
                  No points recorded yet. Points are automatically credited when participating merchants log your
                  purchases.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t._id}>
                  <td className={`${tdClass} font-semibold text-slate-700`}>{formatDate(t.date)}</td>
                  <td className={`${tdClass} font-bold text-slate-900`}>{t.shopName}</td>
                  <td className={`${tdClass} text-right font-semibold`}>₹{t.purchaseAmount.toLocaleString('en-IN')}</td>
                  <td className={`${tdClass} text-right`}>
                    <span className={badgePointsClass}>+{t.pointsEarned} pts</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
