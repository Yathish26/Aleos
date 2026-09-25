import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { btnPrimary, btnSuccess, infoBoxClass, infoBoxSuccessClass, inputClass, labelClass } from '../components/ui'
import { useMembers } from '../store/MembersContext'

const DEMO_OTP = '123456'

export default function Onboarding() {
  const navigate = useNavigate()
  const { registerOrLoginMember } = useMembers()
  const [searchParams] = useSearchParams()
  const refCode = searchParams.get('ref')

  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [referredBy, setReferredBy] = useState(refCode || '')

  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpMessage, setOtpMessage] = useState('')
  const [verified, setVerified] = useState(false)
  const [verifyMessage, setVerifyMessage] = useState('')

  function sendOtp() {
    if (!mobile || mobile.length < 10) {
      alert('Please enter a valid 10-digit mobile number.')
      return
    }
    setOtpSent(true)
    setOtpMessage(`OTP sent! Verification Code: ${DEMO_OTP}`)
  }

  function verifyOtp() {
    if (otp === DEMO_OTP) {
      setVerified(true)
      setVerifyMessage('✓ Phone verified successfully!')
    } else {
      setVerifyMessage('✕ Invalid OTP. Enter 123456.')
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!verified) {
      alert('Verify mobile number via OTP first.')
      return
    }
    registerOrLoginMember(name, mobile, referredBy)
    navigate('/dashboard')
  }

  return (
    <Layout>
      <h2 className="mt-0 mb-4 text-xl font-semibold text-slate-900">Member Registration & Portal Login</h2>

      {refCode && (
        <div className={infoBoxSuccessClass}>
          🎉 <strong>You were invited!</strong> Complete registration below to claim network member benefits.
        </div>
      )}

      <div className={infoBoxClass}>
        📲 Verify mobile number via OTP. Reward points are automatically credited whenever participating merchants
        issue them.
      </div>

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

        <label className={labelClass}>Mobile Number *</label>
        <div className="mb-1.5 flex items-center gap-2">
          <input
            type="tel"
            placeholder="9876543210"
            maxLength={10}
            required
            value={mobile}
            disabled={otpSent}
            onChange={(e) => setMobile(e.target.value)}
            className={`${inputClass} mb-0`}
          />
          <button type="button" className={`${btnPrimary} whitespace-nowrap`} disabled={otpSent} onClick={sendOtp}>
            Send OTP
          </button>
        </div>
        <div className="mb-3 mt-1 text-xs font-semibold text-blue-600">{otpMessage}</div>

        {otpSent && (
          <div>
            <label className={labelClass}>Enter 6-Digit OTP *</label>
            <div className="mb-1.5 flex items-center gap-2">
              <input
                type="text"
                placeholder="123456"
                maxLength={6}
                value={otp}
                disabled={verified}
                onChange={(e) => setOtp(e.target.value)}
                className={`${inputClass} mb-0`}
              />
              <button
                type="button"
                className={`${btnSuccess} whitespace-nowrap`}
                disabled={verified}
                onClick={verifyOtp}
              >
                Verify OTP
              </button>
            </div>
            <div className={`mb-3 mt-1 text-xs font-semibold ${verified ? 'text-emerald-500' : 'text-red-500'}`}>
              {verifyMessage}
            </div>
          </div>
        )}

        <label className={`${labelClass} mt-2.5 block`}>Referred By (Member Mobile Number)</label>
        <input
          type="tel"
          placeholder="Optional referrer phone"
          maxLength={10}
          value={referredBy}
          readOnly={!!refCode}
          onChange={(e) => setReferredBy(e.target.value)}
          className={inputClass}
        />

        <button type="submit" className={`${btnPrimary} mt-2.5 w-full`} disabled={!verified}>
          Access Member Dashboard
        </button>
      </form>
    </Layout>
  )
}
