import { Navigate, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { badgePointsClass, btnSecondary, inputClass } from '../components/ui'
import { useMembers } from '../store/MembersContext'

export default function MemberDashboard() {
  const navigate = useNavigate()
  const { activeMember, logoutMember } = useMembers()

  if (!activeMember) {
    return <Navigate to="/" replace />
  }

  const baseUrl = `${window.location.origin}${window.location.pathname}`
  const referralLink = `${baseUrl}?ref=${activeMember.mobile}`
  const shareMessage = `Join ALEOS Rewards network as a member and earn points on your purchases! Sign up using my unique link: ${referralLink}`

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
  const smsSeparator = isIOS ? '&' : '?'

  const transactions = activeMember.merchantTransactions
  const totalPoints = transactions.reduce((sum, item) => sum + item.pointsEarned, 0)

  function handleLogout() {
    logoutMember()
    navigate('/')
  }

  async function copyRefLink() {
    try {
      await navigator.clipboard.writeText(referralLink)
      alert('Member referral link copied to clipboard!')
    } catch {
      alert('Could not copy automatically — please copy the link manually.')
    }
  }

  return (
    <Layout>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="m-0 text-xl font-semibold text-slate-900">Welcome, {activeMember.name}!</h2>
          <div className="mt-0.5 text-[13px] text-slate-500">Mobile: +91 {activeMember.mobile}</div>
        </div>
        <button className={`${btnSecondary} px-3 py-1.5 text-xs`} onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-center">
        <div className="text-xs font-bold uppercase text-green-800">Total Available Reward Points</div>
        <div className="text-3xl font-extrabold text-green-700">{totalPoints} pts</div>
      </div>

      <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="mb-2 font-semibold text-slate-700">🎁 Refer New Members & Share</h4>
        <p className="mb-3 text-[13px] text-slate-500">
          Share your personal referral link to invite new members to the platform.
        </p>

        <div className="mb-3 flex items-center gap-2">
          <input type="text" readOnly value={referralLink} className={`${inputClass} mb-0 text-xs`} />
          <button className={`${btnSecondary} whitespace-nowrap`} onClick={copyRefLink}>
            Copy Link
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
      </div>

      <h3 className="mb-3 text-slate-700">Merchant Points Ledger</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr>
              <th className="border-b-2 border-slate-200 bg-slate-50 px-2.5 py-3 font-bold text-slate-600">Date</th>
              <th className="border-b-2 border-slate-200 bg-slate-50 px-2.5 py-3 font-bold text-slate-600">
                Merchant / Shop Name
              </th>
              <th className="border-b-2 border-slate-200 bg-slate-50 px-2.5 py-3 text-right font-bold text-slate-600">
                Purchased Value
              </th>
              <th className="border-b-2 border-slate-200 bg-slate-50 px-2.5 py-3 text-right font-bold text-slate-600">
                Points Issued
              </th>
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
              transactions.map((t, i) => (
                <tr key={i}>
                  <td className="border-b border-slate-200 px-2.5 py-3">
                    <span className="font-semibold text-slate-700">{t.date}</span>
                  </td>
                  <td className="border-b border-slate-200 px-2.5 py-3">
                    <span className="block font-bold text-slate-900">{t.shopName}</span>
                  </td>
                  <td className="border-b border-slate-200 px-2.5 py-3 text-right font-semibold">
                    ₹{t.purchaseAmount.toLocaleString()}
                  </td>
                  <td className="border-b border-slate-200 px-2.5 py-3 text-right">
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
