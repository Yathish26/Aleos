import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import SplitPage from '../components/SplitPage'
import {
  btnPrimary,
  btnSecondary,
  errorBoxClass,
  infoBoxClass,
  infoBoxSuccessClass,
  inputClass,
  labelClass,
} from '../components/ui'
import { useAuth } from '../store/auth'

const RESEND_SECONDS = 30

const memberPoints = [
  { icon: '🛍️', title: 'Earn on every purchase', text: 'Points are credited automatically at partner stores.' },
  { icon: '📊', title: 'One place for all points', text: 'See every purchase and point in your dashboard.' },
  { icon: '🤝', title: 'Invite friends', text: 'Get your own referral code to share once you join.' },
]

export default function JoinMember() {
  const navigate = useNavigate()
  const { signInMember } = useAuth()
  const [searchParams] = useSearchParams()
  const refCode = searchParams.get('ref')?.toUpperCase() || ''

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [referralCode, setReferralCode] = useState(refCode)
  const [otp, setOtp] = useState('')
  const [agreed, setAgreed] = useState(false)

  const [otpSent, setOtpSent] = useState(false)
  const [otpMessage, setOtpMessage] = useState('')
  const [resendIn, setResendIn] = useState(0)
  const [sending, setSending] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  // Countdown before "Resend OTP" is allowed again
  useEffect(() => {
    if (resendIn <= 0) return
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendIn])

  async function sendOtp() {
    setError('')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    setSending(true)
    try {
      const data = await api('/auth/otp/send', { method: 'POST', body: { email: email.trim(), purpose: 'join' } })
      setOtpSent(true)
      setOtp('')
      setResendIn(RESEND_SECONDS)
      // In development without an email provider the server returns the code so it can be tested
      setOtpMessage(data.otp ? `${data.message}. Dev code: ${data.otp}` : `${data.message}. Check your inbox.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  function changeEmail() {
    setOtpSent(false)
    setOtp('')
    setOtpMessage('')
    setResendIn(0)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!otpSent) {
      setError('Please verify your email first — click "Send OTP".')
      return
    }
    if (!/^\d{10}$/.test(mobile)) {
      setError('Please enter a valid 10-digit mobile number.')
      return
    }
    setJoining(true)
    try {
      const data = await api('/auth/member/join', {
        method: 'POST',
        body: { name: name.trim(), email: email.trim(), mobile, referralCode: referralCode.trim(), otp: otp.trim() },
      })
      signInMember(data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setJoining(false)
    }
  }

  return (
    <SplitPage
      eyebrow="Join as Member"
      title="Start earning rewards"
      description="Create your free account in a minute. You'll need your email and a referral code from an existing member."
      points={memberPoints}
    >
      {refCode ? (
        <div className={infoBoxSuccessClass}>
          🎉 <strong>You were invited!</strong> Complete registration below to claim network member benefits.
        </div>
      ) : (
        <div className={infoBoxClass}>📧 We'll send a 6-digit code to your email to confirm it.</div>
      )}

      {error && <div className={errorBoxClass}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <label className={labelClass}>Full Name *</label>
        <input
          type="text"
          placeholder="John Doe"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />

        <label className={labelClass}>Email ID *</label>
        <div className="flex items-stretch gap-2">
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
            <button type="button" className={`${btnSecondary} whitespace-nowrap`} onClick={changeEmail}>
              Change
            </button>
          ) : (
            <button type="button" className={`${btnPrimary} whitespace-nowrap`} disabled={sending} onClick={sendOtp}>
              {sending ? 'Sending…' : 'Send OTP'}
            </button>
          )}
        </div>
        <div className="mt-1.5 mb-4 min-h-4 text-xs font-semibold text-blue-600">{otpMessage}</div>

        {otpSent && (
          <>
            <label className={labelClass}>Enter 6-Digit OTP *</label>
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

        <label className={labelClass}>Mobile Number *</label>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="9876543210"
          maxLength={10}
          required
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
          className={inputClass}
        />

        <label className={labelClass}>Referral Code *</label>
        <input
          type="text"
          placeholder="e.g. ALE7K3QX"
          required
          value={referralCode}
          readOnly={!!refCode}
          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
          className={`${inputClass} uppercase`}
        />

        <label className="mb-4 flex items-start gap-2.5 text-[13px] leading-relaxed text-slate-600">
          <input
            type="checkbox"
            required
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
          />
          <span>
            I agree to the{' '}
            <Link to="/terms/member" target="_blank" className="font-semibold text-blue-600">
              Member Terms &amp; Conditions
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          className={`${btnPrimary} mt-2 w-full py-3`}
          disabled={!otpSent || otp.length !== 6 || !agreed || joining}
        >
          {joining ? 'Joining…' : 'Verify OTP & Join'}
        </button>
      </form>

      <div className="mt-6 space-y-1.5 border-t border-slate-200 pt-5 text-center text-[13px] text-slate-500">
        <p className="m-0">
          Already a member?{' '}
          <Link to="/login" className="font-semibold text-blue-600">
            Log in
          </Link>
        </p>
        <p className="m-0">
          Own a business?{' '}
          <Link to="/join/merchant" className="font-semibold text-blue-600">
            Join as Merchant
          </Link>
        </p>
      </div>
    </SplitPage>
  )
}
