import { createContext, useContext, useMemo, useState } from 'react'

const MembersContext = createContext(null)

const initialMembers = [
  {
    id: 1,
    name: 'Rajesh Sharma',
    mobile: '9876543210',
    referredBy: 'None',
    merchantTransactions: [
      { date: '2026-09-22', shopName: 'Artisan Cafe & Bakery', purchaseAmount: 450, pointsEarned: 45 },
      { date: '2026-09-24', shopName: 'Super Market Express', purchaseAmount: 2200, pointsEarned: 220 },
    ],
  },
  {
    id: 2,
    name: 'Priya Patel',
    mobile: '9123456789',
    referredBy: 'None',
    merchantTransactions: [
      { date: '2026-09-23', shopName: 'BrightSmile Dental Clinic', purchaseAmount: 1500, pointsEarned: 150 },
    ],
  },
]

export function MembersProvider({ children }) {
  const [members, setMembers] = useState(initialMembers)
  const [activeMemberId, setActiveMemberId] = useState(null)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)

  const activeMember = useMemo(
    () => members.find((m) => m.id === activeMemberId) ?? null,
    [members, activeMemberId],
  )

  function registerOrLoginMember(name, mobile, referredBy) {
    const existing = members.find((m) => m.mobile === mobile)
    if (existing) {
      setActiveMemberId(existing.id)
      return existing
    }

    const newMember = {
      id: members.length + 1,
      name,
      mobile,
      referredBy: referredBy || 'None',
      merchantTransactions: [],
    }
    setMembers((prev) => [...prev, newMember])
    setActiveMemberId(newMember.id)
    return newMember
  }

  function logoutMember() {
    setActiveMemberId(null)
  }

  function adminLogin(username, password) {
    const ok = username === 'admin' && password === 'admin123'
    if (ok) setIsAdminLoggedIn(true)
    return ok
  }

  function adminLogout() {
    setIsAdminLoggedIn(false)
  }

  const value = {
    members,
    activeMember,
    isAdminLoggedIn,
    registerOrLoginMember,
    logoutMember,
    adminLogin,
    adminLogout,
  }

  return <MembersContext.Provider value={value}>{children}</MembersContext.Provider>
}

export function useMembers() {
  const ctx = useContext(MembersContext)
  if (!ctx) throw new Error('useMembers must be used within a MembersProvider')
  return ctx
}
