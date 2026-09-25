import { Navigate, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { badgePointsClass, btnDanger, infoBoxAdminClass } from '../components/ui'
import { useMembers } from '../store/MembersContext'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { members, isAdminLoggedIn, adminLogout } = useMembers()

  if (!isAdminLoggedIn) {
    return <Navigate to="/admin" replace />
  }

  const networkTotalPoints = members.reduce(
    (sum, member) => sum + member.merchantTransactions.reduce((s, t) => s + t.pointsEarned, 0),
    0,
  )

  function handleLogout() {
    adminLogout()
    navigate('/')
  }

  return (
    <Layout>
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="m-0 text-xl font-semibold text-indigo-600">Admin Monitoring Panel</h2>
        <button className={`${btnDanger} px-3 py-1.5 text-xs`} onClick={handleLogout}>
          Logout Admin
        </button>
      </div>

      <div className={infoBoxAdminClass}>
        📊 View onboarded network members, merchant-issued points, total member spending, and referral connections.
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
          <div className="text-xs font-bold uppercase text-slate-500">Total Onboarded Members</div>
          <div className="text-3xl font-extrabold text-blue-600">{members.length}</div>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-center">
          <div className="text-xs font-bold uppercase text-green-800">Merchant Points Issued</div>
          <div className="text-3xl font-extrabold text-green-700">{networkTotalPoints} pts</div>
        </div>
      </div>

      <h3 className="text-slate-900">Registered Members Directory</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr>
              <th className="border-b-2 border-slate-200 bg-slate-50 px-2.5 py-3 font-bold text-slate-600">
                Member Name
              </th>
              <th className="border-b-2 border-slate-200 bg-slate-50 px-2.5 py-3 font-bold text-slate-600">
                Mobile
              </th>
              <th className="border-b-2 border-slate-200 bg-slate-50 px-2.5 py-3 font-bold text-slate-600">
                Referred By
              </th>
              <th className="border-b-2 border-slate-200 bg-slate-50 px-2.5 py-3 text-right font-bold text-slate-600">
                Total Spend (₹)
              </th>
              <th className="border-b-2 border-slate-200 bg-slate-50 px-2.5 py-3 text-right font-bold text-slate-600">
                Current Points Balance
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const spend = member.merchantTransactions.reduce((sum, t) => sum + t.purchaseAmount, 0)
              const points = member.merchantTransactions.reduce((sum, t) => sum + t.pointsEarned, 0)
              return (
                <tr key={member.id}>
                  <td className="border-b border-slate-200 px-2.5 py-3 font-bold text-slate-900">{member.name}</td>
                  <td className="border-b border-slate-200 px-2.5 py-3 text-slate-600">{member.mobile}</td>
                  <td className="border-b border-slate-200 px-2.5 py-3 text-slate-500">{member.referredBy}</td>
                  <td className="border-b border-slate-200 px-2.5 py-3 text-right font-semibold">
                    ₹{spend.toLocaleString()}
                  </td>
                  <td className="border-b border-slate-200 px-2.5 py-3 text-right">
                    <span className={badgePointsClass}>{points} pts</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
