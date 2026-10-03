import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

// { memberToken, adminToken, signInMember, signOutMember, signInAdmin, signOutAdmin }
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
