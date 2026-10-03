import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { containerClass } from '../components/ui'

const joinOptions = [
  {
    to: '/join/member',
    icon: '🙋',
    title: 'As Member',
    description: 'Earn reward points every time you shop at our partner stores.',
  },
  {
    to: '/join/merchant',
    icon: '🏪',
    title: 'As Merchant',
    description: 'Are you a merchant? Bring new customers to your business.',
  },
]

const steps = [
  { icon: '📝', title: 'Join in a minute', text: 'Sign up with your email and a referral code from a friend.' },
  { icon: '🛍️', title: 'Shop at partners', text: 'Buy from any participating merchant near you.' },
  { icon: '🎁', title: 'Collect points', text: 'Points land in your account automatically with every purchase.' },
]

const memberPerks = [
  'Reward points on every purchase',
  'Track all your points in one place',
  'Invite friends with your own referral code',
]
const merchantPerks = [
  'Reach new customers in your area',
  'Reward loyal shoppers so they come back',
  'Pick your category and apply in minutes',
]

function JoinDropdown() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!open) return
    function onClick(e) {
      if (!menuRef.current?.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={menuRef} className="relative w-full sm:w-auto">
      <button
        type="button"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-blue-700 shadow-lg shadow-blue-900/20 transition hover:bg-blue-50 sm:w-auto"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        Join us
        <span className={`inline-block transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 z-20 mt-2 w-full overflow-hidden rounded-xl bg-white text-left shadow-2xl ring-1 ring-slate-900/5 sm:w-80"
        >
          {joinOptions.map((option) => (
            <Link
              key={option.to}
              to={option.to}
              role="menuitem"
              className="flex items-start gap-3 border-b border-slate-100 p-4 last:border-b-0 hover:bg-slate-50"
            >
              <span className="text-2xl">{option.icon}</span>
              <span>
                <span className="block font-bold text-slate-900">{option.title}</span>
                <span className="block text-[13px] leading-relaxed text-slate-500">{option.description}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function PerkList({ items }) {
  return (
    <ul className="m-0 mb-6 list-none space-y-2.5 p-0">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-[15px] text-slate-600">
          <span className="mt-0.5 font-bold text-emerald-500">✓</span>
          {item}
        </li>
      ))}
    </ul>
  )
}

export default function Home() {
  const [searchParams] = useSearchParams()

  // Old invite links pointed to "/?ref=..." — send them straight to member sign-up
  const ref = searchParams.get('ref')
  if (ref) {
    return <Navigate to={`/join/member?ref=${encodeURIComponent(ref)}`} replace />
  }

  return (
    <Layout bare>
      {/* Hero */}
      <section className="bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className={`${containerClass} py-16 sm:py-24 lg:py-28`}>
          <div className="max-w-2xl">
            <span className="mb-5 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide">
              🎁 ALEOS Rewards Network
            </span>
            <h1 className="m-0 text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Shop local. <br className="hidden sm:block" />
              Earn rewards.
            </h1>
            <p className="mt-5 mb-9 max-w-xl text-base leading-relaxed text-blue-100 sm:text-lg">
              A rewards network connecting shoppers and local businesses. Members earn points on every purchase, and
              merchants grow with loyal customers.
            </p>

            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <JoinDropdown />
              <Link to="/login" className="text-center text-sm font-semibold text-blue-100 hover:text-white">
                Already a member? Log in →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={`${containerClass} py-16 sm:py-20`}>
        <h2 className="m-0 text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          How it works
        </h2>
        <p className="mt-3 mb-12 text-center text-slate-500">Three simple steps to start earning.</p>

        <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
          {steps.map((step, i) => (
            <div key={step.title} className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
                {step.icon}
              </div>
              <div className="mb-1 text-xs font-bold tracking-widest text-blue-600 uppercase">Step {i + 1}</div>
              <h3 className="m-0 mb-2 text-lg font-bold text-slate-900">{step.title}</h3>
              <p className="m-0 text-[15px] leading-relaxed text-slate-500">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Members & merchants */}
      <section className="bg-slate-50">
        <div className={`${containerClass} grid gap-14 py-16 sm:py-20 md:grid-cols-2 md:gap-16`}>
          <div>
            <div className="mb-3 text-4xl">🙋</div>
            <h2 className="m-0 mb-3 text-2xl font-extrabold tracking-tight text-slate-900">For members</h2>
            <p className="mt-0 mb-5 leading-relaxed text-slate-500">
              Get rewarded for shopping at the places you already love.
            </p>
            <PerkList items={memberPerks} />
            <Link
              to="/join/member"
              className="inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Join as Member
            </Link>
          </div>

          <div className="border-t border-slate-200 pt-14 md:border-t-0 md:border-l md:pt-0 md:pl-16">
            <div className="mb-3 text-4xl">🏪</div>
            <h2 className="m-0 mb-3 text-2xl font-extrabold tracking-tight text-slate-900">For merchants</h2>
            <p className="mt-0 mb-5 leading-relaxed text-slate-500">
              Are you a merchant? Join the network and turn shoppers into regulars.
            </p>
            <PerkList items={merchantPerks} />
            <Link
              to="/join/merchant"
              className="inline-flex rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Join as Merchant
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  )
}
