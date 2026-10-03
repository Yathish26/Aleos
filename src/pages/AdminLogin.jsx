import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api } from '../api'
import Layout from '../components/Layout'
import { btnAdmin, errorBoxClass, infoBoxAdminClass, inputClass, labelClass } from '../components/ui'
import { useAuth } from '../store/auth'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { adminToken, signInAdmin } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (adminToken) {
    return <Navigate to="/admin/dashboard" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api('/auth/admin/login', { method: 'POST', body: { username: username.trim(), password } })
      signInAdmin(data.token)
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <h2 className="mt-0 mb-4 text-xl font-semibold text-indigo-600">Admin Panel Login</h2>
      <div className={infoBoxAdminClass}>🔑 Restricted area. Log in with your admin account.</div>

      {error && <div className={errorBoxClass}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <label className={labelClass}>Admin Username</label>
        <input
          type="text"
          placeholder="admin"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
        />

        <label className={labelClass}>Admin Password</label>
        <input
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />

        <button type="submit" className={`${btnAdmin} mt-2.5 w-full`} disabled={loading}>
          {loading ? 'Logging in…' : 'Login to Admin Panel'}
        </button>
      </form>
    </Layout>
  )
}
