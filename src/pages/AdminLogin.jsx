import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { btnAdmin, infoBoxAdminClass, inputClass, labelClass } from '../components/ui'
import { useMembers } from '../store/MembersContext'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { isAdminLoggedIn, adminLogin } = useMembers()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  if (isAdminLoggedIn) {
    return <Navigate to="/admin/dashboard" replace />
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (adminLogin(username, password)) {
      navigate('/admin/dashboard')
    } else {
      alert('Invalid Admin ID or Password! Use: admin / admin123')
    }
  }

  return (
    <Layout>
      <h2 className="mt-0 mb-4 text-xl font-semibold text-indigo-600">Admin Panel Login</h2>
      <div className={infoBoxAdminClass}>
        🔑 <strong>Credentials:</strong> Username: <code>admin</code> | Password: <code>admin123</code>
      </div>

      <form onSubmit={handleSubmit}>
        <label className={labelClass}>Admin Username</label>
        <input
          type="text"
          placeholder="admin"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
        />

        <label className={labelClass}>Admin Password</label>
        <input
          type="password"
          placeholder="••••••••"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />

        <button type="submit" className={`${btnAdmin} mt-2.5 w-full`}>
          Login to Admin Panel
        </button>
      </form>
    </Layout>
  )
}
