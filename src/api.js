// Talks to the AleosSR backend. VITE_API_URL comes from .env locally, and from the host's settings (e.g. Vercel) in production.
const API_URL = import.meta.env.VITE_API_URL
if (!API_URL) console.error('VITE_API_URL is not set — add it to Aleos/.env (e.g. http://localhost:5000)')

export async function api(path, { method = 'GET', body, token } = {}) {
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Cannot reach the server. Please check your connection and try again.')
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const error = new Error(data.message || `Request failed (${res.status})`)
    error.status = res.status // 401 = login expired
    throw error
  }
  return data
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
