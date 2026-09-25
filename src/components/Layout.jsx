import { Link } from 'react-router-dom'
import { useMembers } from '../store/MembersContext'

export default function Layout({ children }) {
  const { isAdminLoggedIn } = useMembers()

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05),0_4px_6px_-2px_rgba(0,0,0,0.025)]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2.5 border-b-2 border-slate-200 pb-3.5">
          <div className="text-lg font-extrabold text-slate-900">ALEOS Rewards Networks</div>
          <div className="flex gap-2">
            <Link
              to="/"
              className="rounded-[10px] bg-slate-200 px-4 py-2.5 text-[13px] font-semibold text-slate-700 transition-opacity hover:opacity-90"
            >
              Member Portal
            </Link>
            <Link
              to={isAdminLoggedIn ? '/admin/dashboard' : '/admin'}
              className="rounded-[10px] bg-indigo-600 px-4 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Admin Dashboard 🔒
            </Link>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
