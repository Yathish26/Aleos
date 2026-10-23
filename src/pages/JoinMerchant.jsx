import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import Layout from '../components/Layout'
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

const RESEND_SECONDS = 30

// Icons for the categories the server sends; unknown categories get a generic tag
const categoryIcons = {
  'Restaurant & Cafe': '🍽️',
  'Grocery & Supermarket': '🛒',
  'Fashion & Apparel': '👗',
  Electronics: '📱',
  'Health & Pharmacy': '💊',
  'Clinic & Healthcare': '🩺',
  'Salon & Beauty': '💇',
  'Fitness & Gym': '🏋️',
  'Home & Furniture': '🛋️',
  'Education & Coaching': '🎓',
  'Travel & Hotels': '🏨',
  Other: '🏷️',
}

const emptyForm = {
  businessName: '',
  ownerName: '',
  email: '',
  mobile: '',
  address: '',
  city: '',
  googleBusinessLink: '',
  tradeLicense: '',
  bankName: '',
  accountHolderName: '',
  ifsc: '',
  accountNumber: '',
}

// Fields that only take digits, or are always upper case
const digitsOnly = ['mobile', 'accountNumber']
const upperCase = ['ifsc']
// Editing any of these means the ₹1 bank check has to be done again
const bankCheckFields = ['accountHolderName', 'ifsc', 'accountNumber']
const BANK_POLL_MS = 3000

// Must match MIN_RECHARGE / CONVENIENCE_FEE_RATE on the server: ₹1 = 1 point, at least ₹1,000, plus a 3% fee
const MIN_RECHARGE = 1000
const CONVENIENCE_FEE_RATE = 0.03
const FEE_PERCENT = `${CONVENIENCE_FEE_RATE * 100}%`
const rupees = (n) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

export default function JoinMerchant() {
  const [categories, setCategories] = useState([])
  const [loadError, setLoadError] = useState('')
  const [category, setCategory] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(null)

  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpMessage, setOtpMessage] = useState('')
  const [resendIn, setResendIn] = useState(0)
  const [sending, setSending] = useState(false)

  // { id, status: 'pending' | 'verified' | 'failed', registeredName, failureReason } from the server
  const [bankCheck, setBankCheck] = useState(null)
  const [bankChecking, setBankChecking] = useState(false)
  const [bankError, setBankError] = useState('')

  const [payment, setPayment] = useState(null)
  const [paying, setPaying] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  // Merchant picks how much to load at sign-up: at least ₹1,000, no upper limit
  const [rechargeAmount, setRechargeAmount] = useState(String(MIN_RECHARGE))
  const rechargeValue = Number(rechargeAmount) || 0
  const rechargeValid = Number.isInteger(rechargeValue) && rechargeValue >= MIN_RECHARGE
  const rechargeFee = Math.round(rechargeValue * CONVENIENCE_FEE_RATE * 100) / 100
  const rechargeTotal = rechargeValue + rechargeFee

  useEffect(() => {
    api('/merchants/categories')
      .then((data) => setCategories(data.categories))
      .catch((err) => setLoadError(err.message))
  }, [])

  // Countdown before "Resend OTP" is allowed again
  useEffect(() => {
    if (resendIn <= 0) return
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendIn])

  // While the bank is still answering, ask the server again every few seconds
  const pendingCheckId = bankCheck?.status === 'pending' ? bankCheck.id : null
  useEffect(() => {
    if (!pendingCheckId) return
    const timer = setTimeout(() => {
      api(`/merchants/bank-verification/${pendingCheckId}?email=${encodeURIComponent(form.email.trim())}`)
        .then((data) => setBankCheck(data.verification))
        .catch((err) => {
          setBankError(err.message)
          setBankCheck(null)
        })
    }, BANK_POLL_MS)
    return () => clearTimeout(timer)
  }, [pendingCheckId, bankCheck, form.email])

  function update(field) {
    return (e) => {
      let value = e.target.value
      if (digitsOnly.includes(field)) value = value.replace(/\D/g, '')
      if (upperCase.includes(field)) value = value.toUpperCase()
      setForm((f) => ({ ...f, [field]: value }))
      if (bankCheckFields.includes(field)) {
        setBankCheck(null)
        setBankError('')
      }
    }
  }

  async function verifyBank() {
    setBankError('')
    if (!otpSent || otp.length !== 6) {
      setBankError('Please verify your email first — send the OTP and enter the 6-digit code above.')
      return
    }
    if (!form.accountHolderName.trim()) {
      setBankError('Please enter the account holder name.')
      return
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc.trim())) {
      setBankError('Please enter a valid 11-character IFSC code, e.g. SBIN0001234.')
      return
    }
    if (!/^\d{9,18}$/.test(form.accountNumber)) {
      setBankError('Account number must be 9 to 18 digits.')
      return
    }
    setBankChecking(true)
    try {
      const data = await api('/merchants/bank-verification', {
        method: 'POST',
        body: {
          email: form.email.trim(),
          otp: otp.trim(),
          mobile: form.mobile,
          accountHolderName: form.accountHolderName.trim(),
          ifsc: form.ifsc.trim(),
          accountNumber: form.accountNumber,
        },
      })
      setBankCheck(data.verification)
    } catch (err) {
      setBankError(err.message)
    } finally {
      setBankChecking(false)
    }
  }

  async function sendOtp() {
    setError('')
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    setSending(true)
    try {
      const data = await api('/auth/otp/send', {
        method: 'POST',
        body: { email: form.email.trim(), purpose: 'merchant-join' },
      })
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
    // A bank check and payment belong to the email they were done with
    setBankCheck(null)
    setBankError('')
    setPayment(null)
    setPaymentError('')
  }

  // DUMMY payment for now — the server records it as paid without charging anything
  async function paySignupFee() {
    setPaymentError('')
    if (!otpSent || otp.length !== 6) {
      setPaymentError('Please verify your email first — send the OTP and enter the 6-digit code above.')
      return
    }
    if (!rechargeValid) {
      setPaymentError(`Please enter a whole amount of at least ${rupees(MIN_RECHARGE)}.`)
      return
    }
    setPaying(true)
    try {
      const data = await api('/merchants/signup-payment', {
        method: 'POST',
        body: { email: form.email.trim(), otp: otp.trim(), rechargeAmount: rechargeValue },
      })
      setPayment(data.payment)
      // If this email had already paid earlier, the server returns that payment — show what was actually paid
      setRechargeAmount(String(data.payment.rechargeAmount))
    } catch (err) {
      setPaymentError(err.message)
    } finally {
      setPaying(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!otpSent) {
      setError('Please verify your email first — click "Send OTP".')
      return
    }
    if (!/^\d{10}$/.test(form.mobile)) {
      setError('Please enter a valid 10-digit mobile number.')
      return
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc.trim())) {
      setError('Please enter a valid 11-character IFSC code, e.g. SBIN0001234.')
      return
    }
    if (!/^\d{9,18}$/.test(form.accountNumber)) {
      setError('Account number must be 9 to 18 digits.')
      return
    }
    if (bankCheck?.status !== 'verified') {
      setError('Please verify your bank account first — click "Verify Bank Account".')
      return
    }
    if (!payment) {
      setError('Please complete the wallet top-up payment first.')
      return
    }
    setSubmitting(true)
    try {
      const body = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]))
      const data = await api('/merchants/register', {
        method: 'POST',
        body: { ...body, category, otp: otp.trim(), bankVerificationId: bankCheck.id, signupPaymentId: payment._id },
      })
      setSubmitted(data.merchant)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ---------- After submitting ----------
  if (submitted) {
    return (
      <Layout>
        <div className="mx-auto flex max-w-lg flex-col items-center py-10 text-center sm:py-16">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-4xl">✅</div>
          <h1 className="m-0 text-3xl font-extrabold tracking-tight text-slate-900">Application received!</h1>
          <p className="mt-4 mb-8 text-base leading-relaxed text-slate-500">
            Thanks, {submitted.ownerName}. <strong className="text-slate-700">{submitted.businessName}</strong> (
            {submitted.category}) is now waiting for approval. We'll contact you at{' '}
            <strong className="text-slate-700">{submitted.email}</strong> once it's reviewed.
          </p>
          {submitted.merchantId && (
            <div className="-mt-4 mb-8 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
              <div className="text-xs font-bold uppercase text-slate-500">Your Merchant ID</div>
              <div className="font-mono text-xl font-bold tracking-wider text-slate-900">{submitted.merchantId}</div>
            </div>
          )}
          <Link to="/" className={`${btnPrimary} px-6 py-3`}>
            Back to Home
          </Link>
        </div>
      </Layout>
    )
  }

  // ---------- Step 1: pick a category ----------
  if (!category) {
    return (
      <Layout>
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <div className="mb-3 text-xs font-bold tracking-widest text-blue-600 uppercase">Join as Merchant · Step 1 of 2</div>
          <h1 className="m-0 text-3xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Are you a merchant?
          </h1>
          <p className="mt-4 mb-0 text-base text-slate-500">Choose the category that best describes your business.</p>
        </div>

        {loadError && <div className={`${errorBoxClass} mx-auto max-w-2xl`}>{loadError}</div>}
        {!loadError && categories.length === 0 && <p className="text-center text-sm text-slate-500">Loading categories…</p>}

        <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className="group flex flex-col items-center gap-3 rounded-2xl px-3 py-6 text-center transition-colors hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-none"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl transition-transform group-hover:scale-110 group-hover:bg-white">
                {categoryIcons[c] || '🏷️'}
              </span>
              <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">{c}</span>
            </button>
          ))}
        </div>

        <p className="mt-10 mb-0 text-center text-[13px] text-slate-500">
          Just want to earn rewards?{' '}
          <Link to="/join/member" className="font-semibold text-blue-600">
            Join as Member
          </Link>
        </p>
      </Layout>
    )
  }

  // ---------- Step 2: business details ----------
  return (
    <SplitPage
      eyebrow="Join as Merchant · Step 2 of 2"
      title="Tell us about your business"
      description="Our team reviews every application. Once approved, you can start issuing reward points to members."
    >
      <div className="mb-6 flex items-center justify-between gap-3 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-2xl">
            {categoryIcons[category] || '🏷️'}
          </span>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase">Category</div>
            <div className="font-bold text-slate-900">{category}</div>
          </div>
        </div>
        <button type="button" className="text-sm font-semibold text-blue-600 hover:underline" onClick={() => setCategory('')}>
          Change
        </button>
      </div>

      {error && <div className={errorBoxClass}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <label className={labelClass}>Business / Shop Name *</label>
        <input
          type="text"
          placeholder="Artisan Cafe & Bakery"
          required
          value={form.businessName}
          onChange={update('businessName')}
          className={inputClass}
        />

        <label className={labelClass}>Owner Name *</label>
        <input
          type="text"
          placeholder="John Doe"
          required
          value={form.ownerName}
          onChange={update('ownerName')}
          className={inputClass}
        />

        <label className={labelClass}>Business Email *</label>
        <div className="flex items-stretch gap-2">
          <input
            type="email"
            placeholder="shop@example.com"
            required
            value={form.email}
            disabled={otpSent}
            onChange={update('email')}
            // inputClass carries mb-4, which beats a trailing mb-0 and pushes the input above the button
            className={`${inputClass.replace('mb-4 ', '')} min-w-0 flex-1`}
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
          value={form.mobile}
          onChange={update('mobile')}
          className={inputClass}
        />

        <label className={labelClass}>Address Line</label>
        <input
          type="text"
          placeholder="Shop no. 12, MG Road"
          autoComplete="street-address"
          value={form.address}
          onChange={update('address')}
          className={inputClass}
        />

        <label className={labelClass}>City</label>
        <input type="text" placeholder="Bengaluru" value={form.city} onChange={update('city')} className={inputClass} />

        <label className={labelClass}>Google Business Link (optional)</label>
        <input
          type="url"
          placeholder="https://maps.app.goo.gl/..."
          value={form.googleBusinessLink}
          onChange={update('googleBusinessLink')}
          className={inputClass}
        />

        <label className={labelClass}>Trade License Number *</label>
        <input
          type="text"
          placeholder="TL/2024/123456"
          required
          value={form.tradeLicense}
          onChange={update('tradeLicense')}
          className={inputClass}
        />

        <h4 className="mt-2 mb-3 border-t border-slate-200 pt-5 font-semibold text-slate-700">🏦 Bank Details</h4>

        <label className={labelClass}>Bank Name *</label>
        <input
          type="text"
          placeholder="State Bank of India"
          required
          value={form.bankName}
          onChange={update('bankName')}
          className={inputClass}
        />

        <label className={labelClass}>Account Holder Name *</label>
        <input
          type="text"
          placeholder="As printed on your passbook / cheque"
          required
          value={form.accountHolderName}
          onChange={update('accountHolderName')}
          className={inputClass}
        />

        <div className="grid gap-x-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>IFSC Code *</label>
            <input
              type="text"
              placeholder="SBIN0001234"
              maxLength={11}
              required
              value={form.ifsc}
              onChange={update('ifsc')}
              className={`${inputClass} uppercase`}
            />
          </div>
          <div>
            <label className={labelClass}>Account Number *</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="123456789012"
              maxLength={18}
              required
              autoComplete="off"
              value={form.accountNumber}
              onChange={update('accountNumber')}
              className={inputClass}
            />
          </div>
        </div>

        {bankError && <div className={errorBoxClass}>{bankError}</div>}
        {bankCheck?.status === 'verified' ? (
          <div className={infoBoxSuccessClass}>
            ✅ Bank account verified
            {bankCheck.registeredName && (
              <>
                {' '}
                — registered to <strong>{bankCheck.registeredName}</strong>
              </>
            )}
            .
          </div>
        ) : bankCheck?.status === 'failed' ? (
          <div className={errorBoxClass}>
            {bankCheck.failureReason || 'The bank account could not be verified.'} Check the details and try again.
          </div>
        ) : null}

        {bankCheck?.status !== 'verified' && (
          <button
            type="button"
            className={`${btnSecondary} mb-5 w-full`}
            disabled={bankChecking || bankCheck?.status === 'pending'}
            onClick={verifyBank}
          >
            {bankChecking
              ? 'Starting check…'
              : bankCheck?.status === 'pending'
                ? 'Checking with your bank…'
                : bankCheck?.status === 'failed'
                  ? 'Try Again'
                  : 'Verify Bank Account (test check)'}
          </button>
        )}
        <p className="-mt-3 mb-5 text-xs text-slate-500">
          We send ₹1 to this account to confirm it's active and get the account holder's name from your bank.
        </p>

        <h4 className="mt-2 mb-3 border-t border-slate-200 pt-5 font-semibold text-slate-700">👛 Wallet Top-up</h4>
        <label className={labelClass}>Recharge Amount (₹) * — minimum {rupees(MIN_RECHARGE)}</label>
        <input
          type="number"
          inputMode="numeric"
          min={MIN_RECHARGE}
          step="1"
          required
          value={rechargeAmount}
          disabled={!!payment}
          onChange={(e) => setRechargeAmount(e.target.value)}
          className={inputClass}
        />

        <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-[13px] text-slate-600">
          {rechargeValid ? (
            <>
              <div className="flex justify-between py-0.5">
                <span>Wallet recharge ({rechargeValue.toLocaleString('en-IN')} points)</span>
                <span className="font-semibold text-slate-900">{rupees(rechargeValue)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span>Convenience fee ({FEE_PERCENT})</span>
                <span className="font-semibold text-slate-900">{rupees(rechargeFee)}</span>
              </div>
              <div className="mt-1.5 flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                <span>Total to pay</span>
                <span>{rupees(rechargeTotal)}</span>
              </div>
            </>
          ) : (
            <div className="font-semibold text-red-600">Enter a whole amount of at least {rupees(MIN_RECHARGE)}.</div>
          )}
          <p className="mt-2 mb-0 text-xs text-slate-500">
            ₹1 = 1 point in your wallet to give to members, plus a {FEE_PERCENT} convenience fee. Points you give are
            taken from your wallet; you can recharge more any time from your dashboard.
          </p>
        </div>

        {paymentError && <div className={errorBoxClass}>{paymentError}</div>}
        {payment ? (
          <div className={infoBoxSuccessClass}>
            ✅ {rupees(payment.amount)} paid · {payment.points.toLocaleString('en-IN')} points will be added to your
            wallet. Ref:{' '}
            {payment.reference}
          </div>
        ) : (
          <button
            type="button"
            className={`${btnSecondary} mb-5 w-full`}
            disabled={paying || !rechargeValid}
            onClick={paySignupFee}
          >
            {paying ? 'Processing…' : rechargeValid ? `Pay ${rupees(rechargeTotal)} (test payment)` : 'Pay'}
          </button>
        )}

        <div className={infoBoxClass}>📋 You'll hear from us by email once your application is reviewed.</div>

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
            <Link to="/terms/merchant" target="_blank" className="font-semibold text-blue-600">
              Merchant Terms &amp; Conditions
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          className={`${btnPrimary} w-full py-3`}
          disabled={
            !otpSent || otp.length !== 6 || bankCheck?.status !== 'verified' || !payment || !agreed || submitting
          }
        >
          {submitting ? 'Submitting…' : 'Verify OTP & Submit Application'}
        </button>
      </form>
    </SplitPage>
  )
}
