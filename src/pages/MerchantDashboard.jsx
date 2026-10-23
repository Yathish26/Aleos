import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api, formatDate, formatTimeIST } from '../api'
import Layout from '../components/Layout'
import {
  badgePointsClass,
  btnPrimary,
  btnSecondary,
  errorBoxClass,
  infoBoxSuccessClass,
  inputClass,
  labelClass,
  tdClass,
  thClass,
} from '../components/ui'
import { useAuth } from '../store/auth'

// Same numbers the server uses — only for the previews, the server does the real calculation.
// Members get the merchant's discount % of the bill as points; the merchant's wallet holds points
// (₹1 recharged = 1 point, plus a 3% fee).
const MIN_RECHARGE = 1000
const CONVENIENCE_FEE_RATE = 0.03
const FEE_PERCENT = `${CONVENIENCE_FEE_RATE * 100}%`
const rupees = (n) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
const pts = (n) => `${n.toLocaleString('en-IN')} pts`

export default function MerchantDashboard() {
  const navigate = useNavigate()
  const { merchantToken, signOutMerchant } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const [customerEmail, setCustomerEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [issuing, setIssuing] = useState(false)
  const [issueError, setIssueError] = useState('')
  const [issued, setIssued] = useState(null)
  // Set when the email isn't registered yet and a code was emailed to the customer: { message }
  const [customerOtpSent, setCustomerOtpSent] = useState(null)
  const [customerOtp, setCustomerOtp] = useState('')
  // Editing the merchant's main discount %; null = not editing
  const [discountDraft, setDiscountDraft] = useState(null)
  const [savingDiscount, setSavingDiscount] = useState(false)
  const [discountError, setDiscountError] = useState('')
  const [discountSaved, setDiscountSaved] = useState(false)

  const [rechargeAmount, setRechargeAmount] = useState(String(MIN_RECHARGE))
  const [recharging, setRecharging] = useState(false)
  const [rechargeError, setRechargeError] = useState('')
  const [recharged, setRecharged] = useState(null)

  // 'code' | 'link' while the "Copied ✓" label shows
  const [copied, setCopied] = useState(null)

  // Use member points: look the member up by email, then redeem with the code they're emailed
  const [redeemEmail, setRedeemEmail] = useState('')
  const [redeemCustomer, setRedeemCustomer] = useState(null) // { name, email, totalPoints }
  const [lookingUp, setLookingUp] = useState(false)
  const [redeemAmount, setRedeemAmount] = useState('')
  const [redeemOtpSent, setRedeemOtpSent] = useState(null) // { message }
  const [redeemOtp, setRedeemOtp] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [redeemError, setRedeemError] = useState('')
  const [redeemed, setRedeemed] = useState(null)

  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')
  const [withdrawn, setWithdrawn] = useState(null)

  useEffect(() => {
    if (!merchantToken) return
    Promise.all([
      api('/merchants/me', { token: merchantToken }),
      api('/merchants/me/transactions', { token: merchantToken }),
      api('/merchants/me/wallet/payments', { token: merchantToken }),
      api('/merchants/me/wallet/withdrawals', { token: merchantToken }),
      api('/merchants/me/redemptions', { token: merchantToken }),
      api('/merchants/me/referrals', { token: merchantToken }),
    ])
      .then(([me, tx, wallet, out, used, refs]) =>
        setData({
          merchant: me.merchant,
          referrals: refs.referrals,
          transactions: tx.transactions,
          redemptions: used.redemptions,
          payments: wallet.payments,
          withdrawals: out.withdrawals,
          withdrawnToday: out.withdrawnToday,
          dailyWithdrawalLimit: out.dailyLimit,
          withdrawalFeePercent: out.feePercent ?? 0,
        }),
      )
      .catch((err) => {
        if (err.status === 401 || err.status === 404) signOutMerchant() // login expired or account removed
        else setError(err.message)
      })
  }, [merchantToken, signOutMerchant])

  if (!merchantToken) return <Navigate to="/merchant/login" replace />

  if (!data) {
    return (
      <Layout>
        {error ? <div className={errorBoxClass}>{error}</div> : <p className="text-sm text-slate-500">Loading…</p>}
      </Layout>
    )
  }

  const { merchant, transactions, payments } = data
  const walletBalance = merchant.walletBalance ?? 0
  const totalPoints = transactions.reduce((sum, t) => sum + t.pointsEarned, 0)
  const totalSales = transactions.reduce((sum, t) => sum + t.purchaseAmount, 0)

  const mainDiscount = merchant.discountPercent ?? 10
  const previewPoints = Math.floor(((Number(amount) || 0) * mainDiscount) / 100)
  const notEnoughPoints = previewPoints > walletBalance

  const rechargeValue = Number(rechargeAmount) || 0
  const rechargeValid = Number.isInteger(rechargeValue) && rechargeValue >= MIN_RECHARGE
  const rechargeFee = Math.round(rechargeValue * CONVENIENCE_FEE_RATE * 100) / 100

  // Withdrawals: 1 point = ₹1 to the bank minus the admin's fee %, capped per day (the server enforces both)
  const { withdrawals, withdrawnToday, dailyWithdrawalLimit, withdrawalFeePercent } = data
  const withdrawLeftToday = Math.max(0, dailyWithdrawalLimit - withdrawnToday)
  const withdrawMax = Math.min(withdrawLeftToday, walletBalance)
  const withdrawValue = Number(withdrawAmount) || 0
  const withdrawValid = Number.isInteger(withdrawValue) && withdrawValue >= 1 && withdrawValue <= withdrawMax
  const bankLast4 = merchant.accountNumber ? merchant.accountNumber.slice(-4) : null

  // The Merchant ID doubles as a referral code new members can sign up with
  const referralCode = merchant.merchantId
  const referralLink = referralCode ? `${window.location.origin}/join/member?ref=${referralCode}` : ''
  const referralMessage = `Join ALEOS Rewards and earn points every time you shop at ${merchant.businessName}! Use referral code ${referralCode} or sign up here: ${referralLink}`
  const withdrawFee = Math.round(withdrawValue * withdrawalFeePercent) / 100
  const withdrawNet = Math.round((withdrawValue - withdrawFee) * 100) / 100

  function handleLogout() {
    signOutMerchant()
    navigate('/')
  }

  // Changing the customer or the bill means any code already sent no longer applies
  function resetCustomerOtp() {
    setCustomerOtpSent(null)
    setCustomerOtp('')
  }

  // withOtp = false sends (or re-sends) the code for a new customer instead of submitting it
  async function issuePoints({ withOtp }) {
    setIssueError('')
    setIssued(null)
    if (!/^\S+@\S+\.\S+$/.test(customerEmail.trim())) {
      setIssueError('Please enter the customer’s email address.')
      return
    }
    if (!(Number(amount) > 0)) {
      setIssueError('Please enter the purchase amount.')
      return
    }
    if (withOtp && customerOtp.length !== 6) {
      setIssueError('Please enter the 6-digit code the customer received.')
      return
    }
    setIssuing(true)
    try {
      const res = await api('/merchants/me/transactions', {
        method: 'POST',
        token: merchantToken,
        body: {
          email: customerEmail.trim(),
          purchaseAmount: Number(amount),
          ...(withOtp && { otp: customerOtp }),
        },
      })
      if (res.otpRequired) {
        // New customer — they've been emailed a code to read out to the merchant
        setCustomerOtpSent({ message: res.otp ? `${res.message}. Dev code: ${res.otp}` : res.message })
        setCustomerOtp('')
        return
      }
      setData((d) => ({
        ...d,
        merchant: { ...d.merchant, walletBalance: res.walletBalance },
        transactions: [res.transaction, ...d.transactions],
      }))
      setIssued({ ...res.transaction, newMember: res.newMember })
      setCustomerEmail('')
      setAmount('')
      resetCustomerOtp()
    } catch (err) {
      if (err.status === 401) signOutMerchant()
      else setIssueError(err.message)
    } finally {
      setIssuing(false)
    }
  }

  function handleIssue(e) {
    e.preventDefault()
    issuePoints({ withOtp: Boolean(customerOtpSent) })
  }

  async function saveDiscount(e) {
    e.preventDefault()
    setDiscountError('')
    setDiscountSaved(false)
    const value = Number(discountDraft)
    if (!Number.isFinite(value) || value <= 0 || value > 100) {
      setDiscountError('Discount must be more than 0% and at most 100%.')
      return
    }
    setSavingDiscount(true)
    try {
      const res = await api('/merchants/me', {
        method: 'PATCH',
        token: merchantToken,
        body: { discountPercent: value },
      })
      setData((d) => ({ ...d, merchant: res.merchant }))
      setDiscountDraft(null)
      setDiscountSaved(true)
    } catch (err) {
      if (err.status === 401) signOutMerchant()
      else setDiscountError(err.message)
    } finally {
      setSavingDiscount(false)
    }
  }

  // DUMMY payment for now — the server credits the points without charging anything
  async function copyText(text, which) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(which)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      setError('Could not copy automatically — please copy it manually.')
    }
  }

  async function lookupRedeemCustomer(e) {
    e.preventDefault()
    setRedeemError('')
    setRedeemed(null)
    setRedeemCustomer(null)
    setRedeemOtpSent(null)
    setRedeemOtp('')
    if (!/^\S+@\S+\.\S+$/.test(redeemEmail.trim())) {
      setRedeemError('Please enter the member’s email address.')
      return
    }
    setLookingUp(true)
    try {
      const res = await api(`/merchants/me/customers?email=${encodeURIComponent(redeemEmail.trim())}`, {
        token: merchantToken,
      })
      setRedeemCustomer(res.customer)
      setRedeemAmount('')
    } catch (err) {
      if (err.status === 401) signOutMerchant()
      else setRedeemError(err.message)
    } finally {
      setLookingUp(false)
    }
  }

  // withOtp = false sends (or re-sends) the approval code to the member instead of submitting it
  async function redeemCustomerPoints({ withOtp }) {
    setRedeemError('')
    const value = Number(redeemAmount)
    if (!Number.isInteger(value) || value < 1 || value > redeemCustomer.totalPoints) {
      setRedeemError(`Enter a whole number of points from 1 to ${redeemCustomer.totalPoints.toLocaleString('en-IN')}.`)
      return
    }
    if (withOtp && redeemOtp.length !== 6) {
      setRedeemError('Please enter the 6-digit code the member received.')
      return
    }
    setRedeeming(true)
    try {
      const res = await api('/merchants/me/redemptions', {
        method: 'POST',
        token: merchantToken,
        body: { email: redeemCustomer.email, points: value, ...(withOtp && { otp: redeemOtp }) },
      })
      if (res.otpRequired) {
        setRedeemOtpSent({ message: res.otp ? `${res.message}. Dev code: ${res.otp}` : res.message })
        setRedeemOtp('')
        return
      }
      setData((d) => ({
        ...d,
        merchant: { ...d.merchant, walletBalance: res.walletBalance },
        redemptions: [res.redemption, ...d.redemptions],
      }))
      setRedeemed(res.redemption)
      setRedeemCustomer(null)
      setRedeemEmail('')
      setRedeemAmount('')
      setRedeemOtpSent(null)
      setRedeemOtp('')
    } catch (err) {
      if (err.status === 401) signOutMerchant()
      else setRedeemError(err.message)
    } finally {
      setRedeeming(false)
    }
  }

  // DUMMY payout for now — the server takes the points and records the payout without sending money
  async function handleWithdraw(e) {
    e.preventDefault()
    setWithdrawError('')
    setWithdrawn(null)
    if (!withdrawValid) {
      setWithdrawError(
        withdrawMax === 0
          ? withdrawLeftToday === 0
            ? `You've reached today's limit of ${pts(dailyWithdrawalLimit)}.`
            : 'No points in your wallet to withdraw.'
          : `Enter a whole number of points from 1 to ${withdrawMax.toLocaleString('en-IN')}.`,
      )
      return
    }
    setWithdrawing(true)
    try {
      const res = await api('/merchants/me/wallet/withdraw', {
        method: 'POST',
        token: merchantToken,
        body: { points: withdrawValue },
      })
      setData((d) => ({
        ...d,
        merchant: { ...d.merchant, walletBalance: res.walletBalance },
        withdrawals: [res.withdrawal, ...d.withdrawals],
        withdrawnToday: res.withdrawnToday,
        withdrawalFeePercent: res.feePercent ?? d.withdrawalFeePercent,
      }))
      setWithdrawn(res.withdrawal)
      setWithdrawAmount('')
    } catch (err) {
      if (err.status === 401) signOutMerchant()
      else setWithdrawError(err.message)
    } finally {
      setWithdrawing(false)
    }
  }

  async function handleRecharge(e) {
    e.preventDefault()
    setRechargeError('')
    setRecharged(null)
    if (!rechargeValid) {
      setRechargeError(`Recharge must be a whole amount of at least ${rupees(MIN_RECHARGE)}.`)
      return
    }
    setRecharging(true)
    try {
      const res = await api('/merchants/me/wallet/recharge', {
        method: 'POST',
        token: merchantToken,
        body: { rechargeAmount: rechargeValue },
      })
      setData((d) => ({
        ...d,
        merchant: { ...d.merchant, walletBalance: res.walletBalance },
        payments: [res.payment, ...d.payments],
      }))
      setRecharged(res.payment)
      setRechargeAmount(String(MIN_RECHARGE))
    } catch (err) {
      if (err.status === 401) signOutMerchant()
      else setRechargeError(err.message)
    } finally {
      setRecharging(false)
    }
  }

  return (
    <Layout>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-xl font-semibold text-slate-900">{merchant.businessName}</h2>
          {merchant.merchantId && (
            <div className="mt-1">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-slate-700">
                ID: {merchant.merchantId}
              </span>
            </div>
          )}
          <div className="mt-0.5 text-[13px] text-slate-500">
            {merchant.category} · {merchant.ownerName} · {merchant.email} · +91 {merchant.mobile}
          </div>
          {(merchant.address || merchant.city) && (
            <div className="mt-0.5 text-[13px] text-slate-500">
              {[merchant.address, merchant.city].filter(Boolean).join(', ')}
            </div>
          )}
        </div>
        <button className={`${btnSecondary} px-3 py-1.5 text-xs`} onClick={handleLogout}>
          Logout
        </button>
      </div>

      {error && <div className={errorBoxClass}>{error}</div>}

      <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <div className="text-xs font-bold uppercase text-blue-800">👛 Wallet Points</div>
        <div className="text-3xl font-extrabold text-blue-700">{pts(walletBalance)}</div>
        <div className="mt-0.5 text-xs text-blue-900/70">
          Points you can still give to members. ₹1 recharge = 1 point, plus a {FEE_PERCENT} convenience fee.
        </div>

        <form onSubmit={handleRecharge} className="mt-4 border-t border-blue-200 pt-4">
          {rechargeError && <div className={errorBoxClass}>{rechargeError}</div>}
          {recharged && (
            <div className={infoBoxSuccessClass}>
              ✅ {pts(recharged.points)} added for {rupees(recharged.amount)}. Ref: {recharged.reference}
            </div>
          )}
          <label className={labelClass}>Recharge Amount (₹, minimum {rupees(MIN_RECHARGE)})</label>
          <div className="flex items-stretch gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={MIN_RECHARGE}
              step="1"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(e.target.value)}
              className={`${inputClass.replace('mb-4 ', '')} min-w-0 flex-1`}
            />
            <button type="submit" className={`${btnPrimary} whitespace-nowrap`} disabled={recharging || !rechargeValid}>
              {recharging ? 'Processing…' : 'Recharge'}
            </button>
          </div>
          <div className="mt-1.5 text-xs text-blue-900/70">
            {rechargeValid
              ? `You get ${pts(rechargeValue)} · ${rupees(rechargeValue)} + ${rupees(rechargeFee)} convenience fee (${FEE_PERCENT}) = ${rupees(rechargeValue + rechargeFee)} (test payment)`
              : `Enter at least ${rupees(MIN_RECHARGE)}.`}
          </div>
        </form>

        <form onSubmit={handleWithdraw} className="mt-4 border-t border-blue-200 pt-4">
          {withdrawError && <div className={errorBoxClass}>{withdrawError}</div>}
          {withdrawn && (
            <div className={infoBoxSuccessClass}>
              ✅ {pts(withdrawn.points)} withdrawn · {rupees(withdrawn.amount)} sent to {withdrawn.bankName || 'your bank'}{' '}
              ··{withdrawn.accountLast4}
              {withdrawn.fee > 0 && ` (after ${rupees(withdrawn.fee)} fee)`}. Ref: {withdrawn.reference}
            </div>
          )}
          <label className={labelClass}>
            Withdraw Points to Bank (1 pt = ₹1{withdrawalFeePercent > 0 ? `, ${withdrawalFeePercent}% withdrawal fee` : ''})
          </label>
          <div className="flex items-stretch gap-2">
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max={withdrawMax || undefined}
              step="1"
              placeholder={withdrawMax > 0 ? `Up to ${withdrawMax.toLocaleString('en-IN')}` : '0'}
              value={withdrawAmount}
              disabled={!bankLast4 || withdrawMax === 0}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className={`${inputClass.replace('mb-4 ', '')} min-w-0 flex-1`}
            />
            <button
              type="button"
              className={`${btnSecondary} whitespace-nowrap`}
              disabled={!bankLast4 || withdrawMax === 0}
              onClick={() => setWithdrawAmount(String(withdrawMax))}
            >
              Max
            </button>
            <button
              type="submit"
              className={`${btnPrimary} whitespace-nowrap`}
              disabled={withdrawing || !withdrawValid || !bankLast4}
            >
              {withdrawing ? 'Processing…' : 'Withdraw'}
            </button>
          </div>
          <div className="mt-1.5 text-xs text-blue-900/70">
            {!bankLast4
              ? 'No bank account on file — contact support to add your bank details.'
              : withdrawValid
                ? withdrawFee > 0
                  ? `${rupees(withdrawValue)} − ${rupees(withdrawFee)} fee (${withdrawalFeePercent}%) = you get ${rupees(withdrawNet)} in ${merchant.bankName || 'your bank'} ··${bankLast4} (test payout).`
                  : `You get ${rupees(withdrawValue)} in ${merchant.bankName || 'your bank'} ··${bankLast4} (test payout).`
                : `Paid to ${merchant.bankName || 'your bank'} ··${bankLast4}.`}{' '}
            Today: {withdrawnToday.toLocaleString('en-IN')} / {dailyWithdrawalLimit.toLocaleString('en-IN')} pts used
            {withdrawLeftToday === 0 && ' — daily limit reached, try again tomorrow'}.
          </div>
        </form>
      </div>

      <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="m-0 font-semibold text-slate-700">🏷️ Your Discount %</h4>
            <p className="mt-1 mb-0 text-[13px] text-slate-500">
              Members get this % of their bill as reward points. A ₹500 bill at {mainDiscount}% earns{' '}
              {pts(Math.floor((500 * mainDiscount) / 100))}.
            </p>
          </div>
          {discountDraft === null && (
            <div className="text-right">
              <div className="text-2xl font-extrabold text-slate-900">{mainDiscount}%</div>
              <button
                type="button"
                className="text-xs font-semibold text-blue-600 hover:underline"
                onClick={() => {
                  setDiscountDraft(String(mainDiscount))
                  setDiscountSaved(false)
                }}
              >
                Change
              </button>
            </div>
          )}
        </div>

        {discountSaved && <div className={`${infoBoxSuccessClass} mt-3 mb-0`}>✅ Discount updated to {mainDiscount}%.</div>}

        {discountDraft !== null && (
          <form onSubmit={saveDiscount} className="mt-3">
            {discountError && <div className={errorBoxClass}>{discountError}</div>}
            <div className="flex items-stretch gap-2">
              <input
                type="number"
                inputMode="decimal"
                min="0.01"
                max="100"
                step="0.01"
                value={discountDraft}
                onChange={(e) => setDiscountDraft(e.target.value)}
                className={`${inputClass.replace('mb-4 ', '')} min-w-0 flex-1`}
                autoFocus
              />
              <button type="submit" className={`${btnPrimary} whitespace-nowrap`} disabled={savingDiscount}>
                {savingDiscount ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                className={`${btnSecondary} whitespace-nowrap`}
                onClick={() => {
                  setDiscountDraft(null)
                  setDiscountError('')
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {referralCode && (
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="mt-0 mb-2 font-semibold text-slate-700">🎟️ Your Referral Code</h4>
          <p className="mb-3 text-[13px] text-slate-500">
            Share this with your customers — they can use it to sign up as ALEOS members.
          </p>

          <div className="mb-3 flex items-stretch gap-2">
            <div className="flex min-w-0 flex-1 items-center rounded-lg border border-slate-300 bg-white px-3.5 font-mono text-lg font-bold tracking-wider text-slate-900">
              {referralCode}
            </div>
            <button type="button" className={`${btnSecondary} whitespace-nowrap`} onClick={() => copyText(referralCode, 'code')}>
              {copied === 'code' ? 'Copied ✓' : 'Copy Code'}
            </button>
          </div>

          <div className="mb-3 flex items-stretch gap-2">
            <input
              type="text"
              readOnly
              value={referralLink}
              className={`${inputClass.replace('mb-4 ', '')} min-w-0 flex-1 text-xs`}
            />
            <button type="button" className={`${btnSecondary} whitespace-nowrap`} onClick={() => copyText(referralLink, 'link')}>
              {copied === 'link' ? 'Copied ✓' : 'Copy Link'}
            </button>
          </div>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(referralMessage)}`}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center rounded-lg bg-[#25D366] p-2.5 text-[13px] font-bold text-white hover:opacity-90"
          >
            💬 Share on WhatsApp
          </a>

          <div className="mt-4 text-[13px] text-slate-600">
            <span className="font-semibold">Members joined with your code: {data.referrals.length}</span>
            {data.referrals.length > 0 && (
              <span className="text-slate-500"> — {data.referrals.map((r) => r.name || r.email).join(', ')}</span>
            )}
          </div>
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-center">
          <div className="text-xs font-bold uppercase text-green-800">Points Given</div>
          <div className="text-3xl font-extrabold text-green-700">{pts(totalPoints)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
          <div className="text-xs font-bold uppercase text-slate-500">Sales Recorded</div>
          <div className="text-3xl font-extrabold text-blue-600">{rupees(totalSales)}</div>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="mt-0 mb-2 font-semibold text-slate-700">🎁 Give Reward Points</h4>
        <p className="mb-3 text-[13px] text-slate-500">
          Enter the customer’s email and the bill amount. They earn your discount % of the bill as points, taken from
          your wallet points, and get an email about it. If they aren’t an ALEOS member yet, they get a code by email
          — enter it here and their account is created for them.
        </p>

        {issueError && <div className={errorBoxClass}>{issueError}</div>}
        {issued && (
          <div className={infoBoxSuccessClass}>
            ✅ {pts(issued.pointsEarned)} given to {issued.member?.name || issued.member?.email || 'the customer'}
            {issued.newMember && ' (new member account created)'}. They’ve been emailed. Wallet now has{' '}
            {pts(issued.walletBalanceAfter ?? walletBalance)}.
          </div>
        )}
        {previewPoints > 0 && notEnoughPoints && (
          <div className={errorBoxClass}>
            This needs {pts(previewPoints)}, but your wallet has {pts(walletBalance)}. Please recharge above.
          </div>
        )}

        <form onSubmit={handleIssue}>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Customer Email</label>
              <input
                type="email"
                placeholder="customer@example.com"
                required
                value={customerEmail}
                onChange={(e) => {
                  setCustomerEmail(e.target.value)
                  resetCustomerOtp()
                }}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Purchase Amount (₹)</label>
              <input
                type="number"
                inputMode="decimal"
                min="1"
                step="any"
                placeholder="500"
                required
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  resetCustomerOtp()
                }}
                className={inputClass}
              />
            </div>
          </div>
          <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm">
            <span className="text-slate-600">Applied Discount</span>
            <span className="font-bold text-slate-900">{mainDiscount}%</span>
          </div>

          {customerOtpSent && (
            <>
              <div className="mb-3 border-l-4 border-amber-500 bg-amber-50/60 py-2 pr-2 pl-3.5 text-[13px] leading-relaxed text-amber-900">
                This email isn’t an ALEOS member yet. {customerOtpSent.message} — ask the customer for the code to
                create their account and add the points.
              </div>
              <label className={labelClass}>Customer’s 6-Digit Code</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="6-digit code"
                maxLength={6}
                value={customerOtp}
                onChange={(e) => setCustomerOtp(e.target.value.replace(/\D/g, ''))}
                className={`${inputClass} mb-1.5`}
                autoFocus
              />
              <div className="mb-4 text-xs text-slate-500">
                Didn’t get it?{' '}
                <button
                  type="button"
                  className="font-semibold text-blue-600 disabled:text-slate-400"
                  disabled={issuing}
                  onClick={() => issuePoints({ withOtp: false })}
                >
                  Resend code
                </button>
              </div>
            </>
          )}

          <button
            type="submit"
            className={`${btnPrimary} w-full`}
            disabled={issuing || notEnoughPoints || (customerOtpSent && customerOtp.length !== 6)}
          >
            {issuing
              ? 'Adding…'
              : customerOtpSent
                ? `Verify Code & Give ${pts(previewPoints)}`
                : previewPoints > 0
                  ? `Give ${pts(previewPoints)}`
                  : 'Give Points'}
          </button>
        </form>
      </div>

      <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="mt-0 mb-2 font-semibold text-slate-700">🔁 Use Member Points</h4>
        <p className="mb-3 text-[13px] text-slate-500">
          When a member wants to pay with their points, enter their email to see their points. They get a code by
          email to approve it, and the points they use are added to your wallet.
        </p>

        {redeemError && <div className={errorBoxClass}>{redeemError}</div>}
        {redeemed && (
          <div className={infoBoxSuccessClass}>
            ✅ {pts(redeemed.points)} used by {redeemed.member?.name || redeemed.member?.email || 'the member'}. They now
            have {pts(redeemed.memberPointsAfter ?? 0)}. Added to your wallet.
          </div>
        )}

        <form onSubmit={lookupRedeemCustomer}>
          <label className={labelClass}>Member Email</label>
          <div className="mb-4 flex items-stretch gap-2">
            <input
              type="email"
              placeholder="member@example.com"
              value={redeemEmail}
              onChange={(e) => {
                setRedeemEmail(e.target.value)
                setRedeemCustomer(null)
                setRedeemOtpSent(null)
                setRedeemOtp('')
              }}
              className={`${inputClass.replace('mb-4 ', '')} min-w-0 flex-1`}
            />
            <button type="submit" className={`${btnSecondary} whitespace-nowrap`} disabled={lookingUp}>
              {lookingUp ? 'Fetching…' : 'Fetch'}
            </button>
          </div>
        </form>

        {redeemCustomer && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              redeemCustomerPoints({ withOtp: Boolean(redeemOtpSent) })
            }}
          >
            <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-3">
              <div>
                <div className="font-bold text-slate-900">{redeemCustomer.name || 'No name yet'}</div>
                <div className="text-xs text-slate-500">{redeemCustomer.email}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold uppercase text-slate-500">Available</div>
                <span className={badgePointsClass}>{pts(redeemCustomer.totalPoints)}</span>
              </div>
            </div>

            {redeemCustomer.totalPoints < 1 ? (
              <p className="mb-0 text-[13px] text-slate-500">This member has no points to use yet.</p>
            ) : (
              <>
                <label className={labelClass}>Points to Use</label>
                <div className="mb-4 flex items-stretch gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max={redeemCustomer.totalPoints}
                    step="1"
                    placeholder={`Up to ${redeemCustomer.totalPoints.toLocaleString('en-IN')}`}
                    value={redeemAmount}
                    disabled={Boolean(redeemOtpSent)}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    className={`${inputClass.replace('mb-4 ', '')} min-w-0 flex-1`}
                  />
                  <button
                    type="button"
                    className={`${btnSecondary} whitespace-nowrap`}
                    disabled={Boolean(redeemOtpSent)}
                    onClick={() => setRedeemAmount(String(redeemCustomer.totalPoints))}
                  >
                    Max
                  </button>
                </div>

                {redeemOtpSent && (
                  <>
                    <div className="mb-3 border-l-4 border-amber-500 bg-amber-50/60 py-2 pr-2 pl-3.5 text-[13px] leading-relaxed text-amber-900">
                      {redeemOtpSent.message} — ask the member for the code to approve using {pts(Number(redeemAmount))}.{' '}
                      <button
                        type="button"
                        className="font-semibold text-blue-600"
                        onClick={() => {
                          setRedeemOtpSent(null)
                          setRedeemOtp('')
                        }}
                      >
                        Change points
                      </button>
                    </div>
                    <label className={labelClass}>Member’s 6-Digit Code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="6-digit code"
                      maxLength={6}
                      value={redeemOtp}
                      onChange={(e) => setRedeemOtp(e.target.value.replace(/\D/g, ''))}
                      className={`${inputClass} mb-1.5`}
                      autoFocus
                    />
                    <div className="mb-4 text-xs text-slate-500">
                      Didn’t get it?{' '}
                      <button
                        type="button"
                        className="font-semibold text-blue-600 disabled:text-slate-400"
                        disabled={redeeming}
                        onClick={() => redeemCustomerPoints({ withOtp: false })}
                      >
                        Resend code
                      </button>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className={`${btnPrimary} w-full`}
                  disabled={redeeming || !redeemAmount || (redeemOtpSent && redeemOtp.length !== 6)}
                >
                  {redeeming
                    ? 'Processing…'
                    : redeemOtpSent
                      ? `Verify Code & Use ${pts(Number(redeemAmount))}`
                      : 'Send Approval Code to Member'}
                </button>
              </>
            )}
          </form>
        )}
      </div>

      <h3 className="mb-3 text-slate-700">Points History</h3>
      <div className="mb-8 overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr>
              <th className={thClass}>Date</th>
              <th className={thClass}>Customer</th>
              <th className={`${thClass} text-right`}>Purchase Value</th>
              <th className={`${thClass} text-right`}>Discount</th>
              <th className={`${thClass} text-right`}>Points Given</th>
              <th className={`${thClass} text-right`}>Wallet Left</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2.5 py-5 text-center text-slate-500">
                  No points given yet. Use the form above when a member shops with you.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t._id}>
                  <td className={`${tdClass} font-semibold text-slate-700`}>{formatDate(t.date)}</td>
                  <td className={tdClass}>
                    <span className="block font-bold text-slate-900">
                      {t.member ? t.member.name || t.member.email : 'Removed member'}
                    </span>
                    {t.member?.name && t.member.email && <span className="text-xs text-slate-500">{t.member.email}</span>}
                  </td>
                  <td className={`${tdClass} text-right font-semibold`}>{rupees(t.purchaseAmount)}</td>
                  <td className={`${tdClass} text-right text-slate-600`}>
                    {t.discountPercent != null ? `${t.discountPercent}%` : '—'}
                  </td>
                  <td className={`${tdClass} text-right`}>
                    <span className={badgePointsClass}>+{t.pointsEarned} pts</span>
                    {t.walletDebit != null && (
                      <span className="mt-1 block text-xs font-semibold text-red-600">−{pts(t.walletDebit)} wallet</span>
                    )}
                  </td>
                  <td className={`${tdClass} text-right text-slate-600`}>
                    {t.walletBalanceAfter != null ? pts(t.walletBalanceAfter) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h3 className="mb-3 text-slate-700">Points Used by Members</h3>
      <div className="mb-8 overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr>
              <th className={thClass}>Date</th>
              <th className={thClass}>Member</th>
              <th className={`${thClass} text-right`}>Points Used</th>
              <th className={`${thClass} text-right`}>Wallet After</th>
            </tr>
          </thead>
          <tbody>
            {data.redemptions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-2.5 py-5 text-center text-slate-500">
                  No points used at your shop yet.
                </td>
              </tr>
            ) : (
              data.redemptions.map((r) => (
                <tr key={r._id}>
                  <td className={`${tdClass} font-semibold text-slate-700`}>
                    {formatDate(r.createdAt)}
                    <span className="block text-xs font-normal text-slate-500">{formatTimeIST(r.createdAt)}</span>
                  </td>
                  <td className={tdClass}>
                    <span className="block font-bold text-slate-900">
                      {r.member ? r.member.name || r.member.email : 'Removed member'}
                    </span>
                    {r.member?.name && <span className="text-xs text-slate-500">{r.member.email}</span>}
                  </td>
                  <td className={`${tdClass} text-right`}>
                    <span className={badgePointsClass}>+{pts(r.points)}</span>
                  </td>
                  <td className={`${tdClass} text-right text-slate-600`}>
                    {r.merchantWalletAfter != null ? pts(r.merchantWalletAfter) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h3 className="mb-3 text-slate-700">Recharge History</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr>
              <th className={thClass}>Date</th>
              <th className={thClass}>Type</th>
              <th className={`${thClass} text-right`}>Paid</th>
              <th className={`${thClass} text-right`}>Points Added</th>
              <th className={`${thClass} text-right`}>Wallet After</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-2.5 py-5 text-center text-slate-500">
                  No recharges yet.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p._id}>
                  <td className={`${tdClass} font-semibold text-slate-700`}>{formatDate(p.createdAt)}</td>
                  <td className={tdClass}>
                    <span className="block font-bold text-slate-900">{p.kind === 'signup' ? 'Sign-up' : 'Recharge'}</span>
                    <span className="text-xs text-slate-500">Ref {p.reference}</span>
                  </td>
                  <td className={`${tdClass} text-right`}>
                    <span className="block font-semibold">{rupees(p.amount)}</span>
                    <span className="text-xs text-slate-500">
                      incl. {rupees(p.convenienceFee)} fee ({FEE_PERCENT})
                    </span>
                  </td>
                  <td className={`${tdClass} text-right`}>
                    <span className={badgePointsClass}>+{p.points.toLocaleString('en-IN')} pts</span>
                  </td>
                  <td className={`${tdClass} text-right text-slate-600`}>
                    {p.walletBalanceAfter != null ? pts(p.walletBalanceAfter) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h3 className="mt-8 mb-3 text-slate-700">Withdrawal History</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr>
              <th className={thClass}>Date</th>
              <th className={thClass}>Sent To</th>
              <th className={`${thClass} text-right`}>Points</th>
              <th className={`${thClass} text-right`}>Amount Sent</th>
              <th className={`${thClass} text-right`}>Wallet After</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-2.5 py-5 text-center text-slate-500">
                  No withdrawals yet.
                </td>
              </tr>
            ) : (
              withdrawals.map((w) => (
                <tr key={w._id}>
                  <td className={`${tdClass} font-semibold text-slate-700`}>
                    {formatDate(w.createdAt)}
                    <span className="block text-xs font-normal text-slate-500">{formatTimeIST(w.createdAt)}</span>
                  </td>
                  <td className={tdClass}>
                    <span className="block font-bold text-slate-900">
                      {w.bankName || 'Bank'} ··{w.accountLast4}
                    </span>
                    <span className="text-xs text-slate-500">Ref {w.reference}</span>
                  </td>
                  <td className={`${tdClass} text-right font-semibold text-red-600`}>−{pts(w.points)}</td>
                  <td className={`${tdClass} text-right`}>
                    <span className="block font-semibold">{rupees(w.amount)}</span>
                    {w.fee > 0 && (
                      <span className="text-xs text-slate-500">
                        after {rupees(w.fee)} fee ({w.feePercent}%)
                      </span>
                    )}
                  </td>
                  <td className={`${tdClass} text-right text-slate-600`}>
                    {w.walletBalanceAfter != null ? pts(w.walletBalanceAfter) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
