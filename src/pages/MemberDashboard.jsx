import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api } from '../api'
import Icon, { inlineIconClass } from '../components/Icon'
import Layout from '../components/Layout'
import PanelTitle from '../components/PanelTitle'
import PointsLedger from '../components/PointsLedger'
import ShareButtons from '../components/ShareButtons'
import { btnPrimary, btnSecondary, errorBoxClass, inputClass, labelClass } from '../components/ui'
import { useAuth } from '../store/auth'

export default function MemberDashboard() {
  const navigate = useNavigate()
  const { memberToken, signOutMember } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  // Name typed in the one-time "add your name" box (members a merchant added by email start with no name)
  const [nameDraft, setNameDraft] = useState(null)
  const [savingName, setSavingName] = useState(false)

  // Points ledger pages come from the member's own passbook endpoint
  const loadLedgerPage = useCallback(
    (page, limit) => api(`/members/me/passbook?page=${page}&limit=${limit}`, { token: memberToken }),
    [memberToken],
  )
  const onLedgerError = useCallback(
    (err) => (err.status === 401 ? signOutMember() : setError(err.message)),
    [signOutMember],
  )

  useEffect(() => {
    if (!memberToken) return
    Promise.all([api('/members/me', { token: memberToken }), api('/members/me/referrals', { token: memberToken })])
      .then(([me, refs]) => setData({ member: me.member, referrals: refs.referrals }))
      .catch((err) => {
        if (err.status === 401 || err.status === 404) signOutMember() // login expired or account removed
        else setError(err.message)
      })
  }, [memberToken, signOutMember])

  if (!memberToken) return <Navigate to="/login" replace />

  if (!data) {
    return (
      <Layout>
        {error ? <div className={errorBoxClass}>{error}</div> : <p className="text-sm text-slate-500">Loading…</p>}
      </Layout>
    )
  }

  const { member, referrals } = data
  const referralLink = `${window.location.origin}/join/member?ref=${member.referralCode}`
  const shareMessage = `Join ALEOS Rewards network as a member and earn points on your purchases! Use my referral code ${member.referralCode} or sign up here: ${referralLink}`
  const merchantLink = `${window.location.origin}/join/merchant`
  const merchantMessage = `Hello Sir/Madam,
Are you tired of online platforms demanding heavy discounts and huge commissions from your hard-earned profits?
Meet ALEOS — India's zero-cost customer growth app for retail shops!

Why local shops love ALEOS:

1) 100% Free Signup: No setup fee, no machine charges.

2) 2-Minute Self Setup: Download app & activate your store counter by yourself in 2 minutes.

3) No Machines Needed – Works on your existing phone with a simple QR code.

4) Your Margin, Your Rules:
* Mobile Shop? Set 2%
* Restaurant/Cafe? Set 10%
* Salon/Spa? Set 20%

5) Bring Back Old Customers: Automatic reward points so shoppers choose your store every time.

Start today in 2 minutes: ${merchantLink}`

  function handleLogout() {
    signOutMember()
    navigate('/')
  }

  async function saveName(e) {
    e.preventDefault()
    setError('')
    const name = (nameDraft ?? '').trim()
    if (!name) {
      setError('Please enter your name.')
      return
    }
    setSavingName(true)
    try {
      const res = await api('/members/me', { method: 'PATCH', token: memberToken, body: { name } })
      setData((d) => ({ ...d, member: res.member }))
      setNameDraft(null)
    } catch (err) {
      if (err.status === 401) signOutMember()
      else setError(err.message)
    } finally {
      setSavingName(false)
    }
  }

  async function copyText(text, which) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(which)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy automatically — please copy it manually.')
    }
  }

  return (
    <Layout>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="m-0 text-xl font-bold text-brand-navy sm:text-2xl">
            {member.name ? `Welcome, ${member.name}!` : 'Welcome!'}
          </h2>
          <div className="mt-0.5 text-[13px] text-slate-500">
            {member.email}
            {member.mobile && ` · +91 ${member.mobile}`}
          </div>
        </div>
        <button className={`${btnSecondary} px-3 py-1.5 text-xs`} onClick={handleLogout}>
          Logout
        </button>
      </div>

      {error && <div className={errorBoxClass}>{error}</div>}

      {/* Only shown until a name is set — after that it can't be changed */}
      {!member.name && (
        <form onSubmit={saveName} className="mb-5 rounded-xl border border-brand-blue/30 bg-brand-light p-4">
          <label className={labelClass}>
            <Icon name="user" className={inlineIconClass} />
            Add your name to complete your account
          </label>
          <p className="mt-0 mb-2.5 text-xs text-slate-500">Please check it carefully — your name can't be changed later.</p>
          <div className="flex items-stretch gap-2">
            <input
              type="text"
              placeholder="John Doe"
              value={nameDraft ?? ''}
              onChange={(e) => setNameDraft(e.target.value)}
              className={`${inputClass.replace('mb-4 ', '')} min-w-0 flex-1`}
            />
            <button type="submit" className={`${btnPrimary} whitespace-nowrap`} disabled={savingName}>
              {savingName ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-brand-navy to-[#123f8a] p-4 text-center text-white shadow-lg shadow-brand-navy/20">
          <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-brand-cyan/25 blur-2xl" />
          <div className="relative text-xs font-bold tracking-wide text-blue-100/80 uppercase">Reward Points</div>
          <div className="relative font-display text-3xl font-extrabold text-brand-cyan">
            {member.totalPoints.toLocaleString('en-IN')} pts
          </div>
        </div>
        <div className="rounded-2xl border border-brand-blue/20 bg-brand-light p-4 text-center">
          <div className="text-xs font-bold tracking-wide text-brand-navy/70 uppercase">Members Referred</div>
          <div className="font-display text-3xl font-extrabold text-brand-navy">{referrals.length}</div>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-brand-blue/20 bg-brand-light/50 p-4 sm:p-5">
        <PanelTitle icon="gift">Refer New Members & Share</PanelTitle>
        <p className="mb-3 text-[13px] text-slate-600">
          Your referral code is{' '}
          <span className="rounded-md bg-brand-navy px-2 py-0.5 font-mono font-bold tracking-wider text-brand-cyan">
            {member.referralCode}
          </span>
          . New members need a referral code to join — share yours or send the link below.
        </p>

        <div className="mb-3 flex items-stretch gap-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            // inputClass carries mb-4, which beats a trailing mb-0 and pushes the input above the button
            className={`${inputClass.replace('mb-4 ', '')} min-w-0 flex-1 text-xs`}
          />
          <button className={`${btnSecondary} whitespace-nowrap`} onClick={() => copyText(referralLink, 'member')}>
            {copied === 'member' ? (
              <>
                <Icon name="check" className="mr-1.5 h-4 w-4" strokeWidth={3} />
                Copied
              </>
            ) : (
              'Copy Link'
            )}
          </button>
        </div>

        <ShareButtons message={shareMessage} link={referralLink} telegramText="Join ALEOS Rewards as a Member!" />

        {referrals.length > 0 && (
          <div className="mt-4 text-[13px] text-slate-600">
            <span className="font-semibold text-brand-navy">Joined with your code:</span>{' '}
            {referrals.map((r) => r.name || 'New member').join(', ')}
          </div>
        )}
      </div>

      <div className="mb-5 rounded-2xl border border-brand-blue/20 bg-brand-light/50 p-4 sm:p-5">
        <PanelTitle icon="store">Invite a Shop / Merchant</PanelTitle>
        <p className="mb-3 text-[13px] text-slate-600">
          Know a local shop, cafe or salon? Send them this message — signing up is free for merchants.
        </p>

        <textarea
          readOnly
          value={merchantMessage}
          rows={8}
          className={`${inputClass} mb-2 resize-y text-xs leading-relaxed`}
        />
        <button className={`${btnSecondary} mb-3 w-full`} onClick={() => copyText(merchantMessage, 'merchant')}>
          {copied === 'merchant' ? (
            <>
              <Icon name="check" className="mr-1.5 h-4 w-4" strokeWidth={3} />
              Copied
            </>
          ) : (
            'Copy Message'
          )}
        </button>

        <ShareButtons
          message={merchantMessage}
          link={merchantLink}
          telegramText="Meet ALEOS — India's zero-cost customer growth app for retail shops!"
        />
      </div>

      <PointsLedger
        loadPage={loadLedgerPage}
        balance={member.totalPoints}
        onError={onLedgerError}
        emptyText="No points recorded yet. Points are credited when participating merchants log your purchases."
      />
    </Layout>
  )
}
