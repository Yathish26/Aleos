import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import Icon, { categoryIconNames, inlineIconClass } from '../components/Icon'
import Layout from '../components/Layout'
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

// The sign-up wizard, one screen per step
const STEPS = [
  { label: 'Category', title: 'Are you a merchant?', text: 'Choose the category that best describes your business.' },
  { label: 'Business', title: 'Tell us about your business', text: 'Where your shop is and any licences you have.' },
  { label: 'Owner', title: 'Owner & contact details', text: 'We’ll send a code to your email to confirm it.' },
  { label: 'Bank', title: 'Bank account', text: 'Where your withdrawals are paid. We check it with a ₹1 transfer.' },
  { label: 'Wallet', title: 'Wallet top-up & submit', text: 'Load points to give your customers, then send your application.' },
]

const emptyForm = {
  businessName: '',
  ownerName: '',
  email: '',
  mobile: '',
  address: '',
  city: '',
  googleBusinessLink: '',
  tradeLicense: '',
  fssaiNumber: '',
  aadhaarNumber: '',
  panNumber: '',
  bankName: '',
  accountHolderName: '',
  ifsc: '',
  accountNumber: '',
}

// Fields that only take digits, or are always upper case
const digitsOnly = ['mobile', 'accountNumber', 'fssaiNumber', 'aadhaarNumber']
const upperCase = ['ifsc', 'panNumber']
// Editing any of these means the ₹1 bank check has to be done again
const bankCheckFields = ['accountHolderName', 'ifsc', 'accountNumber']
const BANK_POLL_MS = 3000

// Must match SIGNUP_RECHARGE_OPTIONS / CONVENIENCE_FEE_RATE / ONBOARDING_FEE / ONBOARDING_TAX_RATE on the server:
// ₹1 = 1 point, a 3% convenience fee, and a one-time ₹249 onboarding fee + 18% GST
const RECHARGE_OPTIONS = [1000, 2000, 3000]
const CONVENIENCE_FEE_RATE = 0.03
const FEE_PERCENT = `${CONVENIENCE_FEE_RATE * 100}%`
const ONBOARDING_FEE = 249
const ONBOARDING_TAX_RATE = 0.18
const toPaise = (n) => Math.round(n * 100) / 100
const ONBOARDING_TAX = toPaise(ONBOARDING_FEE * ONBOARDING_TAX_RATE)
const rupees = (n) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

// Progress across the top: a bar on phones, numbered circles on bigger screens
function Stepper({ step }) {
  return (
    <div className="mb-6">
      <div className="sm:hidden">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold">
          <span className="text-brand-blue">
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="text-slate-500">{STEPS[step].label}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-brand-navy transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <ol className="m-0 hidden list-none items-start p-0 sm:flex">
        {STEPS.map((s, i) => (
          <li key={s.label} className={`flex items-start ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
            <div className="flex w-16 flex-col items-center gap-1.5">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  i < step
                    ? 'bg-brand-navy text-white'
                    : i === step
                      ? 'bg-white text-brand-navy ring-2 ring-brand-blue'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {i < step ? <Icon name="check" className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </span>
              <span className={`text-xs font-semibold ${i <= step ? 'text-slate-800' : 'text-slate-400'}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mt-4.5 h-0.5 flex-1 rounded ${i < step ? 'bg-brand-navy' : 'bg-slate-200'}`} />
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

// One line of the review summary on the last step
function ReviewRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <span className="text-slate-500">{label}</span>
      <span className="min-w-0 truncate text-right font-semibold text-slate-900">{value || '—'}</span>
    </div>
  )
}

export default function JoinMerchant() {
  const [categories, setCategories] = useState([])
  // Categories that are asked for an (optional) FSSAI licence number — sent by the server
  const [fssaiCategories, setFssaiCategories] = useState([])
  const [loadError, setLoadError] = useState('')
  const [category, setCategory] = useState('')
  // 0 = category, 1 = business, 2 = owner & contact, 3 = bank, 4 = wallet & submit
  const [step, setStep] = useState(0)
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
  // Merchant picks one of RECHARGE_OPTIONS to load at sign-up
  const [rechargeValue, setRechargeValue] = useState(RECHARGE_OPTIONS[0])
  const rechargeValid = RECHARGE_OPTIONS.includes(rechargeValue)
  const rechargeFee = toPaise(rechargeValue * CONVENIENCE_FEE_RATE)
  const rechargeTotal = toPaise(rechargeValue + rechargeFee + ONBOARDING_FEE + ONBOARDING_TAX)
  // Restaurants and grocery shops may add an FSSAI licence number
  const asksFssai = fssaiCategories.includes(category)

  useEffect(() => {
    api('/merchants/categories')
      .then((data) => {
        setCategories(data.categories)
        setFssaiCategories(data.fssaiCategories || [])
      })
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

  function goTo(next) {
    setError('')
    setStep(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function pickCategory(c) {
    setCategory(c)
    goTo(1)
  }

  // What's missing on a step before Continue is allowed; '' when it's fine
  function stepProblem(n) {
    if (n === 1) {
      if (!form.businessName.trim()) return 'Please enter your business / shop name.'
      if (form.googleBusinessLink.trim() && !/^https?:\/\/\S+$/.test(form.googleBusinessLink.trim())) {
        return 'Google Business link must start with http:// or https:// — or leave it empty.'
      }
      if (asksFssai && form.fssaiNumber && !/^\d{14}$/.test(form.fssaiNumber)) {
        return 'FSSAI number must be 14 digits — or leave it empty.'
      }
    }
    if (n === 2) {
      if (!form.ownerName.trim()) return 'Please enter the owner’s name.'
      if (!otpSent) return 'Please verify your email — click "Send OTP".'
      if (otp.length !== 6) return 'Please enter the 6-digit code we emailed you.'
      if (!/^\d{10}$/.test(form.mobile)) return 'Please enter a valid 10-digit mobile number.'
      if (form.aadhaarNumber && !/^[2-9]\d{11}$/.test(form.aadhaarNumber)) {
        return 'Aadhaar number must be 12 digits — or leave it empty.'
      }
      if (form.panNumber && !/^[A-Z]{5}\d{4}[A-Z]$/.test(form.panNumber.trim())) {
        return 'PAN must look like ABCDE1234F — or leave it empty.'
      }
    }
    if (n === 3) {
      if (!form.bankName.trim()) return 'Please enter your bank name.'
      if (!form.accountHolderName.trim()) return 'Please enter the account holder name.'
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc.trim())) return 'Please enter a valid 11-character IFSC code, e.g. SBIN0001234.'
      if (!/^\d{9,18}$/.test(form.accountNumber)) return 'Account number must be 9 to 18 digits.'
      if (bankCheck?.status !== 'verified') return 'Please verify your bank account — click "Verify Bank Account".'
    }
    return ''
  }

  function handleContinue() {
    const problem = stepProblem(step)
    if (problem) {
      setError(problem)
      return
    }
    goTo(step + 1)
  }

  async function verifyBank() {
    setBankError('')
    if (!otpSent || otp.length !== 6) {
      setBankError('Please verify your email first (step 3).')
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
      setPaymentError('Please verify your email first (step 3).')
      return
    }
    if (!rechargeValid) {
      setPaymentError('Please choose a recharge amount.')
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
      setRechargeValue(data.payment.rechargeAmount)
    } catch (err) {
      setPaymentError(err.message)
    } finally {
      setPaying(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    // Re-check every step in case something was changed after moving on
    for (const n of [1, 2, 3]) {
      const problem = stepProblem(n)
      if (problem) {
        setStep(n)
        setError(problem)
        return
      }
    }
    if (!payment) {
      setError('Please complete the wallet top-up payment first.')
      return
    }
    if (!agreed) {
      setError('Please agree to the Merchant Terms & Conditions.')
      return
    }
    setSubmitting(true)
    try {
      const body = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]))
      if (!asksFssai) delete body.fssaiNumber // only food businesses send it
      const data = await api('/merchants/register', {
        method: 'POST',
        body: { ...body, category, otp: otp.trim(), bankVerificationId: bankCheck.id, signupPaymentId: payment._id },
      })
      setSubmitted(data.merchant)
      window.scrollTo({ top: 0, behavior: 'smooth' })
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
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Icon name="checkCircle" className="h-10 w-10" />
          </div>
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

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <Layout>
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 text-center sm:mb-7">
          <div className="mb-2 text-xs font-bold tracking-widest text-brand-blue uppercase">Join as Merchant</div>
          <h1 className="m-0 text-2xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {current.title}
          </h1>
          <p className="mt-2 mb-0 text-sm text-slate-500 sm:text-base">{current.text}</p>
        </div>

        <Stepper step={step} />

        <form
          onSubmit={(e) => {
            if (isLast) return handleSubmit(e)
            e.preventDefault() // Enter / Continue on earlier steps just moves to the next one
            handleContinue()
          }}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8"
        >
          {/* The chosen category stays visible on every later step */}
          {step > 0 && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-navy shadow-sm">
                  <Icon name={categoryIconNames[category] || 'tag'} className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">Category</div>
                  <div className="truncate font-bold text-slate-900">{category}</div>
                </div>
              </div>
              <button type="button" className="shrink-0 text-sm font-semibold text-brand-blue hover:underline" onClick={() => goTo(0)}>
                Change
              </button>
            </div>
          )}

          {error && <div className={errorBoxClass}>{error}</div>}

          {/* ---------- Step 1: category ---------- */}
          {step === 0 && (
            <>
              {loadError && <div className={errorBoxClass}>{loadError}</div>}
              {!loadError && categories.length === 0 && (
                <p className="text-center text-sm text-slate-500">Loading categories…</p>
              )}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => pickCategory(c)}
                    className={`group flex flex-col items-center gap-2.5 rounded-2xl border px-2 py-5 text-center transition-colors hover:border-brand-blue/30 hover:bg-brand-light focus-visible:bg-brand-light focus-visible:outline-none ${
                      c === category ? 'border-brand-blue bg-brand-light' : 'border-slate-200'
                    }`}
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light text-brand-navy transition-transform group-hover:scale-110 group-hover:bg-white">
                      <Icon name={categoryIconNames[c] || 'tag'} className="h-6 w-6" />
                    </span>
                    <span className="text-[13px] font-semibold text-slate-700 group-hover:text-brand-navy">{c}</span>
                  </button>
                ))}
              </div>
              <p className="mt-6 mb-0 text-center text-[13px] text-slate-500">
                Just want to earn rewards?{' '}
                <Link to="/join/member" className="font-semibold text-brand-blue">
                  Join as Member
                </Link>
              </p>
            </>
          )}

          {/* ---------- Step 2: business ---------- */}
          {step === 1 && (
            <>
              <label className={labelClass}>Business / Shop Name *</label>
              <input
                type="text"
                placeholder="Artisan Cafe & Bakery"
                value={form.businessName}
                onChange={update('businessName')}
                className={inputClass}
                autoFocus
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
                inputMode="url"
                placeholder="https://maps.app.goo.gl/..."
                value={form.googleBusinessLink}
                onChange={update('googleBusinessLink')}
                className={inputClass}
              />

              <div className={`grid gap-x-4 ${asksFssai ? 'sm:grid-cols-2' : ''}`}>
                <div>
                  <label className={labelClass}>Trade License Number (optional)</label>
                  <input
                    type="text"
                    placeholder="TL/2024/123456"
                    value={form.tradeLicense}
                    onChange={update('tradeLicense')}
                    className={inputClass}
                  />
                </div>
                {asksFssai && (
                  <div>
                    <label className={labelClass}>FSSAI Licence Number (optional)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="14-digit FSSAI number"
                      maxLength={14}
                      value={form.fssaiNumber}
                      onChange={update('fssaiNumber')}
                      className={inputClass}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* ---------- Step 3: owner & contact ---------- */}
          {step === 2 && (
            <>
              <label className={labelClass}>Owner Name *</label>
              <input
                type="text"
                placeholder="John Doe"
                autoComplete="name"
                value={form.ownerName}
                onChange={update('ownerName')}
                className={inputClass}
                autoFocus
              />

              <label className={labelClass}>Business Email *</label>
              <div className="flex items-stretch gap-2">
                <input
                  type="email"
                  placeholder="shop@example.com"
                  autoComplete="email"
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
              <div className="mt-1.5 mb-4 min-h-4 text-xs font-semibold text-brand-blue">{otpMessage}</div>

              {otpSent && (
                <>
                  <label className={labelClass}>Enter 6-Digit OTP *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6-digit code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className={`${inputClass} mb-1.5 tracking-[0.3em]`}
                  />
                  <div className="mb-4 text-xs text-slate-500">
                    Didn't get it?{' '}
                    <button
                      type="button"
                      className="font-semibold text-brand-blue disabled:text-slate-400"
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
                autoComplete="tel-national"
                placeholder="9876543210"
                maxLength={10}
                value={form.mobile}
                onChange={update('mobile')}
                className={inputClass}
              />

              <div className="grid gap-x-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Aadhaar Number (optional)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="12-digit Aadhaar"
                    maxLength={12}
                    autoComplete="off"
                    value={form.aadhaarNumber}
                    onChange={update('aadhaarNumber')}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>PAN Card Number (optional)</label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    autoComplete="off"
                    value={form.panNumber}
                    onChange={update('panNumber')}
                    className={`${inputClass} uppercase`}
                  />
                </div>
              </div>
            </>
          )}

          {/* ---------- Step 4: bank ---------- */}
          {step === 3 && (
            <>
              <label className={labelClass}>Bank Name *</label>
              <input
                type="text"
                placeholder="State Bank of India"
                value={form.bankName}
                onChange={update('bankName')}
                className={inputClass}
                autoFocus
              />

              <label className={labelClass}>Account Holder Name *</label>
              <input
                type="text"
                placeholder="As printed on your passbook / cheque"
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
                  <Icon name="checkCircle" className={inlineIconClass} />
                  Bank account verified
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
                  className={`${btnSecondary} mb-2 w-full py-3`}
                  disabled={bankChecking || bankCheck?.status === 'pending'}
                  onClick={verifyBank}
                >
                  {bankChecking
                    ? 'Starting check…'
                    : bankCheck?.status === 'pending'
                      ? 'Checking with your bank…'
                      : bankCheck?.status === 'failed'
                        ? 'Try Again'
                        : (
                          <>
                            <Icon name="bank" className="mr-2 h-4 w-4" />
                            Verify Bank Account (test check)
                          </>
                        )}
                </button>
              )}
              <p className="mt-0 mb-0 text-xs text-slate-500">
                We send ₹1 to this account to confirm it's active and get the account holder's name from your bank.
              </p>
            </>
          )}

          {/* ---------- Step 5: wallet & submit ---------- */}
          {step === 4 && (
            <>
              <label className={labelClass}>Choose Wallet Recharge *</label>
              <div role="radiogroup" className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
                {RECHARGE_OPTIONS.map((value) => {
                  const selected = rechargeValue === value
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={!!payment}
                      onClick={() => setRechargeValue(value)}
                      className={`rounded-xl border-2 px-2 py-3 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:py-4 ${
                        selected
                          ? 'border-brand-blue bg-brand-light text-brand-navy'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-brand-blue/30'
                      }`}
                    >
                      <span className="block text-base font-extrabold sm:text-lg">{rupees(value)}</span>
                      <span className="block text-[11px] font-semibold text-slate-500 sm:text-xs">
                        {value.toLocaleString('en-IN')} pts
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-[13px] text-slate-600">
                <div className="flex justify-between gap-3 py-0.5">
                  <span>Wallet recharge ({rechargeValue.toLocaleString('en-IN')} points)</span>
                  <span className="font-semibold whitespace-nowrap text-slate-900">{rupees(rechargeValue)}</span>
                </div>
                <div className="flex justify-between gap-3 py-0.5">
                  <span>Convenience fee ({FEE_PERCENT})</span>
                  <span className="font-semibold whitespace-nowrap text-slate-900">{rupees(rechargeFee)}</span>
                </div>
                <div className="flex justify-between gap-3 py-0.5">
                  <span>Onboarding fee (one-time)</span>
                  <span className="font-semibold whitespace-nowrap text-slate-900">{rupees(ONBOARDING_FEE)}</span>
                </div>
                <div className="flex justify-between gap-3 py-0.5">
                  <span>GST on onboarding fee ({ONBOARDING_TAX_RATE * 100}%)</span>
                  <span className="font-semibold whitespace-nowrap text-slate-900">{rupees(ONBOARDING_TAX)}</span>
                </div>
                <div className="mt-1.5 flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                  <span>Total to pay</span>
                  <span>{rupees(rechargeTotal)}</span>
                </div>
                <p className="mt-2 mb-0 text-xs text-slate-500">
                  ₹1 = 1 point in your wallet to give to members. The onboarding fee is charged once; you can recharge
                  more any time from your dashboard.
                </p>
              </div>

              {paymentError && <div className={errorBoxClass}>{paymentError}</div>}
              {payment ? (
                <div className={infoBoxSuccessClass}>
                  <Icon name="checkCircle" className={inlineIconClass} />
                  {rupees(payment.amount)} paid · {payment.points.toLocaleString('en-IN')} points will be added to your
                  wallet. Ref: {payment.reference}
                </div>
              ) : (
                <button
                  type="button"
                  className={`${btnSecondary} mb-5 w-full py-3`}
                  disabled={paying || !rechargeValid}
                  onClick={paySignupFee}
                >
                  {paying ? (
                    'Processing…'
                  ) : (
                    <>
                      <Icon name="creditCard" className="mr-2 h-4 w-4" />
                      Pay {rupees(rechargeTotal)} (test payment)
                    </>
                  )}
                </button>
              )}

              <div className="mb-5 rounded-xl border border-slate-200 p-4 text-[13px]">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Review your application</span>
                  <button type="button" className="text-xs font-semibold text-brand-blue hover:underline" onClick={() => goTo(1)}>
                    Edit
                  </button>
                </div>
                <ReviewRow label="Business" value={form.businessName} />
                <ReviewRow label="City" value={form.city} />
                <ReviewRow label="Owner" value={form.ownerName} />
                <ReviewRow label="Email" value={form.email} />
                <ReviewRow label="Mobile" value={form.mobile && `+91 ${form.mobile}`} />
                <ReviewRow
                  label="Bank"
                  value={form.accountNumber && `${form.bankName} ··${form.accountNumber.slice(-4)}`}
                />
              </div>

              <div className={infoBoxClass}>
                <Icon name="clipboard" className={inlineIconClass} />
                You'll hear from us by email once your application is reviewed.
              </div>

              <label className="mb-1 flex items-start gap-2.5 text-[13px] leading-relaxed text-slate-600">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-brand-blue"
                />
                <span>
                  I agree to the{' '}
                  <Link to="/terms/merchant" target="_blank" className="font-semibold text-brand-blue">
                    Merchant Terms &amp; Conditions
                  </Link>
                  .
                </span>
              </label>
            </>
          )}

          {/* Back / Continue — sticks to the bottom of the screen on phones */}
          {step > 0 && (
            <div className="sticky bottom-0 -mx-4 mt-6 flex gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pt-2 sm:pb-0">
              <button type="button" className={`${btnSecondary} px-5 py-3`} onClick={() => goTo(step - 1)}>
                ← Back
              </button>
              {isLast ? (
                <button
                  type="submit"
                  className={`${btnPrimary} flex-1 py-3`}
                  disabled={!payment || !agreed || submitting}
                >
                  {submitting ? 'Submitting…' : 'Submit Application'}
                </button>
              ) : (
                <button type="submit" className={`${btnPrimary} flex-1 py-3`}>
                  Continue →
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </Layout>
  )
}
