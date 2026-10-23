import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api, formatDate, formatTimeIST } from '../api'
import Layout from '../components/Layout'
import {
  btnPrimary,
  btnSecondary,
  errorBoxClass,
  inputClass,
  labelClass,
  tdClass,
  thClass,
} from '../components/ui'
import { useAuth } from '../store/auth'

const shareBtnClass =
  'flex min-w-25 flex-1 items-center justify-center rounded-lg p-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90'

function ShareButtons({ message, link, telegramText }) {
  const smsSeparator = /iPad|iPhone|iPod/.test(navigator.userAgent) ? '&' : '?'
  return (
    <div className="flex flex-wrap gap-2.5">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noreferrer"
        className={`${shareBtnClass} bg-[#25D366]`}
      >
        💬 WhatsApp
      </a>
      <a
        href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(telegramText)}`}
        target="_blank"
        rel="noreferrer"
        className={`${shareBtnClass} bg-[#229ED9]`}
      >
        ✈️ Telegram
      </a>
      <a href={`sms:${smsSeparator}body=${encodeURIComponent(message)}`} className={`${shareBtnClass} bg-violet-500`}>
        📱 SMS
      </a>
    </div>
  )
}

export default function MemberDashboard() {
  const navigate = useNavigate()
  const { memberToken, signOutMember } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  // Editing the name; null = not editing. Members a merchant added by email start with no name.
  const [nameDraft, setNameDraft] = useState(null)
  const [savingName, setSavingName] = useState(false)

  useEffect(() => {
    if (!memberToken) return
    Promise.all([
      api('/members/me', { token: memberToken }),
      api('/members/me/passbook', { token: memberToken }),
      api('/members/me/referrals', { token: memberToken }),
    ])
      .then(([me, book, refs]) => setData({ member: me.member, passbook: book.entries, referrals: refs.referrals }))
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

  const { member, passbook, referrals } = data
  const referralLink = `${window.location.origin}/join/member?ref=${member.referralCode}`
  const shareMessage = `Join ALEOS Rewards network as a member and earn points on your purchases! Use my referral code ${member.referralCode} or sign up here: ${referralLink}`
  const merchantLink = `${window.location.origin}/join/merchant`
  const merchantMessage = `Hello Sir/Madam 👋
Are you tired of online platforms demanding heavy discounts and huge commissions from your hard-earned profits?
Meet ALEOS — India's zero-cost customer growth app for retail shops!

📌 Why local shops love ALEOS:

1) 100% Free Signup: No setup fee, no machine charges.

2) 2-Minute Self Setup: Download app & activate your store counter by yourself in 2 minutes.

3) No Machines Needed – Works on your existing phone with a simple QR code.

4) Your Margin, Your Rules:
* Mobile Shop? Set 2%
* Restaurant/Cafe? Set 10%
* Salon/Spa? Set 20%

5) Bring Back Old Customers: Automatic reward points so shoppers choose your store every time.

📍 Start today in 2 minutes: ${merchantLink}`

  function handleLogout() {
    signOutMember()
    navigate('/')
  }

  async function saveName(e) {
    e.preventDefault()
    setError('')
    if (!nameDraft.trim()) {
      setError('Please enter your name.')
      return
    }
    setSavingName(true)
    try {
      const res = await api('/members/me', { method: 'PATCH', token: memberToken, body: { name: nameDraft.trim() } })
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
          <h2 className="m-0 text-xl font-semibold text-slate-900">
            {member.name ? `Welcome, ${member.name}!` : 'Welcome!'}
          </h2>
          <div className="mt-0.5 text-[13px] text-slate-500">
            {member.email}
            {member.mobile && ` · +91 ${member.mobile}`}
            {member.name && nameDraft === null && (
              <>
                {' · '}
                <button
                  type="button"
                  className="font-semibold text-blue-600 hover:underline"
                  onClick={() => setNameDraft(member.name)}
                >
                  Edit name
                </button>
              </>
            )}
          </div>
        </div>
        <button className={`${btnSecondary} px-3 py-1.5 text-xs`} onClick={handleLogout}>
          Logout
        </button>
      </div>

      {error && <div className={errorBoxClass}>{error}</div>}

      {(!member.name || nameDraft !== null) && (
        <form onSubmit={saveName} className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <label className={labelClass}>{member.name ? 'Your Name' : '👋 Add your name to complete your account'}</label>
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
            {member.name && (
              <button type="button" className={`${btnSecondary} whitespace-nowrap`} onClick={() => setNameDraft(null)}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-center">
          <div className="text-xs font-bold uppercase text-green-800">Reward Points</div>
          <div className="text-3xl font-extrabold text-green-700">{member.totalPoints} pts</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
          <div className="text-xs font-bold uppercase text-slate-500">Members Referred</div>
          <div className="text-3xl font-extrabold text-blue-600">{referrals.length}</div>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="mt-0 mb-2 font-semibold text-slate-700">🎁 Refer New Members & Share</h4>
        <p className="mb-3 text-[13px] text-slate-500">
          Your referral code is{' '}
          <span className="rounded-md bg-white px-2 py-0.5 font-mono font-bold text-slate-900">{member.referralCode}</span>
          . New members need a referral code to join — share yours or send the link below.
        </p>

        <div className="mb-3 flex items-center gap-2">
          <input type="text" readOnly value={referralLink} className={`${inputClass} mb-0 text-xs`} />
          <button className={`${btnSecondary} whitespace-nowrap`} onClick={() => copyText(referralLink, 'member')}>
            {copied === 'member' ? 'Copied ✓' : 'Copy Link'}
          </button>
        </div>

        <ShareButtons message={shareMessage} link={referralLink} telegramText="Join ALEOS Rewards as a Member!" />

        {referrals.length > 0 && (
          <div className="mt-4 text-[13px] text-slate-600">
            <span className="font-semibold">Joined with your code:</span>{' '}
            {referrals.map((r) => r.name).join(', ')}
          </div>
        )}
      </div>

      <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="mt-0 mb-2 font-semibold text-slate-700">🏪 Invite a Shop / Merchant</h4>
        <p className="mb-3 text-[13px] text-slate-500">
          Know a local shop, cafe or salon? Send them this message — signing up is free for merchants.
        </p>

        <textarea
          readOnly
          value={merchantMessage}
          rows={8}
          className={`${inputClass} mb-2 resize-y text-xs leading-relaxed`}
        />
        <button className={`${btnSecondary} mb-3 w-full`} onClick={() => copyText(merchantMessage, 'merchant')}>
          {copied === 'merchant' ? 'Copied ✓' : 'Copy Message'}
        </button>

        <ShareButtons
          message={merchantMessage}
          link={merchantLink}
          telegramText="Meet ALEOS — India's zero-cost customer growth app for retail shops!"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
          <h3 className="m-0 text-base font-semibold text-slate-800">📒 Points Ledger</h3>
          <span className="text-xs text-slate-500">
            Balance <span className="font-bold text-slate-900">{member.totalPoints.toLocaleString('en-IN')} pts</span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead className="bg-slate-50">
              <tr>
                <th className={thClass}>Date</th>
                <th className={thClass}>Particulars</th>
                <th className={`${thClass} text-right`}>Credit (+)</th>
                <th className={`${thClass} text-right`}>Debit (−)</th>
                <th className={`${thClass} text-right`}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {passbook.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2.5 py-5 text-center text-slate-500">
                    No points recorded yet. Points are credited when participating merchants log your purchases.
                  </td>
                </tr>
              ) : (
                passbook.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70">
                    <td className={`${tdClass} whitespace-nowrap text-slate-700`}>
                      {formatDate(e.date)}
                      <span className="block text-xs text-slate-500">{formatTimeIST(e.date)}</span>
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                            e.credit ? 'bg-emerald-50' : 'bg-red-50'
                          }`}
                        >
                          {e.type === 'Referral bonus' ? '🤝' : e.debit ? '🛍️' : '🎁'}
                        </span>
                        <div className="min-w-0">
                          <span className="block font-semibold text-slate-900">{e.shopName}</span>
                          <span className="text-xs text-slate-500">
                            {e.type} · {e.details}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className={`${tdClass} text-right font-semibold whitespace-nowrap text-emerald-600`}>
                      {e.credit ? `+${e.credit.toLocaleString('en-IN')}` : ''}
                    </td>
                    <td className={`${tdClass} text-right font-semibold whitespace-nowrap text-red-600`}>
                      {e.debit ? `−${e.debit.toLocaleString('en-IN')}` : ''}
                    </td>
                    <td className={`${tdClass} text-right font-bold whitespace-nowrap text-slate-900`}>
                      {e.balanceAfter.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
