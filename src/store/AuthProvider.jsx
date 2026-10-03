import { useMemo, useState } from 'react'
import { AuthContext } from './auth'

const MEMBER_KEY = 'aleos_member_token'
const ADMIN_KEY = 'aleos_admin_token'

function read(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key, value) {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {
    // Storage unavailable (e.g. private mode) — login just won't survive a refresh
  }
}

// Keeps the member and admin login tokens, saved in the browser so a refresh keeps you logged in
export default function AuthProvider({ children }) {
  const [memberToken, setMemberToken] = useState(() => read(MEMBER_KEY))
  const [adminToken, setAdminToken] = useState(() => read(ADMIN_KEY))

  // Stable functions, so pages can safely list them as useEffect dependencies
  const actions = useMemo(() => {
    const setMember = (token) => {
      write(MEMBER_KEY, token)
      setMemberToken(token)
    }
    const setAdmin = (token) => {
      write(ADMIN_KEY, token)
      setAdminToken(token)
    }
    return {
      signInMember: (token) => setMember(token),
      signOutMember: () => setMember(null),
      signInAdmin: (token) => setAdmin(token),
      signOutAdmin: () => setAdmin(null),
    }
  }, [])

  const value = useMemo(() => ({ memberToken, adminToken, ...actions }), [memberToken, adminToken, actions])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
