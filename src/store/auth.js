import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

// { memberToken, merchantToken, adminToken, signInMember, signOutMember, signInMerchant, signOutMerchant, signInAdmin, signOutAdmin }
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
