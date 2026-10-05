import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import JoinMember from './pages/JoinMember'
import JoinMerchant from './pages/JoinMerchant'
import MemberLogin from './pages/MemberLogin'
import MemberDashboard from './pages/MemberDashboard'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import TermsMember from './pages/TermsMember'
import TermsMerchant from './pages/TermsMerchant'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/join/member" element={<JoinMember />} />
      <Route path="/join/merchant" element={<JoinMerchant />} />
      <Route path="/login" element={<MemberLogin />} />
      <Route path="/dashboard" element={<MemberDashboard />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/terms/member" element={<TermsMember />} />
      <Route path="/terms/merchant" element={<TermsMerchant />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
