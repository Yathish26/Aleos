import { Route, Routes } from 'react-router-dom'
import Onboarding from './pages/Onboarding'
import MemberDashboard from './pages/MemberDashboard'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Onboarding />} />
      <Route path="/dashboard" element={<MemberDashboard />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
