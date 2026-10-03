import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api } from '../api'
import Layout from '../components/Layout'
import { btnPrimary, btnSecondary, errorBoxClass, infoBoxClass, inputClass, labelClass } from '../components/ui'
import { useAuth } from '../store/auth'

const RESEND_SECONDS = 30

export default function MemberLogin() {
  const navigate = useNavigate()
  const { memberToken, signInMember } = useAuth()

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpMessage, setOtpMessage] = useState('')
  const [resendIn, setResendIn] = useState(0)
  const [sending, setSending] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendIn])

  if (memberToken) return <Navigate to="/dashboard" replace />

  async function sendOtp() {
    setError('')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    setSending(true)
    try {
      const data = await api('/auth/otp/send', { method: 'POST', body: { email: email.trim(), purpose: 'login' } })
      setOtpSent(true)
      setOtp('')
      setResendIn(RESEND_SECONDS)
      setOtpMessage(data.otp ? `${data.message}. Dev code: ${data.otp}` : `${data.message}. Check your inbox.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoggingIn(true)
    try {
      const data = await api('/auth/member/login', { method: 'POST', body: { email: email.trim(), otp: otp.trim() } })
      signInMember(data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoggingIn(false)
    }
  }

  return (
    <Layout>
      <h2 className="mt-0 mb-4 text-xl font-semibold text-slate-900">Member Login</h2>
      <div className={infoBoxClass}>📧 Enter the email you joined with. We'll send you a one-time code.</div>

      {error && <div className={errorBoxClass}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <label className={labelClass}>Email ID</label>
        <div className="mb-1.5 flex items-center gap-2">
          <input
            type="email"
            placeholder="you@example.com"
            required
            value={email}
            disabled={otpSent}
            onChange={(e) => setEmail(e.target.value)}
            className={`${inputClass} mb-0`}
          />
          {otpSent ? (
            <button
              type="button"
              className={`${btnSecondary} whitespace-nowrap`}
              onClick={() => {
                setOtpSent(false)
                setOtpMessage('')
                setResendIn(0)
              }}
            >
              Change
            </button>
          ) : (
            <button type="button" className={`${btnPrimary} whitespace-nowrap`} disabled={sending} onClick={sendOtp}>
              {sending ? 'Sending…' : 'Send OTP'}
            </button>
          )}
        </div>
        <div className="mb-3 mt-1 text-xs font-semibold text-blue-600">{otpMessage}</div>

        {otpSent && (
          <>
            <label className={labelClass}>Enter 6-Digit OTP</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className={`${inputClass} mb-1.5`}
            />
            <div className="mb-4 text-xs text-slate-500">
              Didn't get it?{' '}
              <button
                type="button"
                className="font-semibold text-blue-600 disabled:text-slate-400"
                disabled={resendIn > 0 || sending}
                onClick={sendOtp}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
              </button>
            </div>
          </>
        )}

        <button type="submit" className={`${btnPrimary} w-full`} disabled={!otpSent || otp.length !== 6 || loggingIn}>
          {loggingIn ? 'Logging in…' : 'Verify OTP & Log in'}
        </button>
      </form>

      <p className="mt-4 mb-0 text-center text-xs text-slate-500">
        Not a member yet?{' '}
        <Link to="/join/member" className="font-semibold text-blue-600">
          Join now
        </Link>
      </p>
    </Layout>
  )
}
