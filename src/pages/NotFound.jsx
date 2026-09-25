import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { btnPrimary } from '../components/ui'

export default function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="text-5xl font-extrabold text-slate-300">404</div>
        <h2 className="m-0 text-xl font-semibold text-slate-900">Page not found</h2>
        <p className="m-0 max-w-sm text-sm text-slate-500">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <Link to="/" className={`${btnPrimary} mt-2`}>
          Back to Member Portal
        </Link>
      </div>
    </Layout>
  )
}
