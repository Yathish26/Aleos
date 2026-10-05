import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { containerClass } from '../components/ui'

// Outline icons (Lucide-style paths), drawn with currentColor so they take the text color
const iconPaths = {
  user: (
    <>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  userPlus: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </>
  ),
  store: (
    <>
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
      <path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7" />
    </>
  ),
  bag: (
    <>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </>
  ),
  gift: (
    <>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C9.5 3 11 5 12 8c1-3 2.5-5 4.5-5a2.5 2.5 0 0 1 0 5" />
    </>
  ),
  zap: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
  repeat: (
    <>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </>
  ),
  mapPin: (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  coins: (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
}

function Icon({ name, className = 'h-6 w-6', strokeWidth = 2 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  )
}

const joinOptions = [
  {
    to: '/join/member',
    icon: 'user',
    title: 'As Member',
    description: 'Earn reward points every time you shop at our partner stores.',
  },
  {
    to: '/join/merchant',
    icon: 'store',
    title: 'As Merchant',
    description: 'Are you a merchant? Bring new customers to your business.',
  },
]

const steps = [
  { icon: 'userPlus', title: 'Join in a minute', text: 'Sign up with your email and a referral code from a friend.' },
  { icon: 'bag', title: 'Shop at partners', text: 'Buy from any participating merchant near you.' },
  { icon: 'gift', title: 'Collect points', text: 'Points land in your account automatically with every purchase.' },
]

const benefits = [
  { icon: 'zap', title: 'Free & instant setup', text: 'Takes less than 2 minutes on your phone.' },
  {
    icon: 'bag',
    title: 'Rewards on everyday spending',
    text: 'Get instant points at local cafes, salons, mobile shops, and stores.',
  },
  { icon: 'repeat', title: 'Use anywhere', text: 'Earn points at a cafe, spend them at a salon or retail shop!' },
  { icon: 'mapPin', title: 'Discover local', text: 'Find nearby plumbers, job openings, and local events.' },
  {
    icon: 'coins',
    title: 'Get paid when friends shop',
    text: 'When you invite friends, you earn a % bonus on their purchases!',
  },
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
        <Icon name="chevronDown" className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={2.5} />
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
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Icon name={option.icon} className="h-5 w-5" />
              </span>
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
          <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" strokeWidth={2.5} />
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
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide">
              <Icon name="gift" className="h-3.5 w-3.5" />
              ALEOS Rewards Network
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
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Icon name={step.icon} className="h-7 w-7" />
              </div>
              <div className="mb-1 text-xs font-bold tracking-widest text-blue-600 uppercase">Step {i + 1}</div>
              <h3 className="m-0 mb-2 text-lg font-bold text-slate-900">{step.title}</h3>
              <p className="m-0 text-[15px] leading-relaxed text-slate-500">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why ALEOS */}
      <section className="border-t border-slate-100">
        <div className={`${containerClass} py-16 sm:py-20`}>
          <h2 className="m-0 text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Why people love ALEOS
          </h2>
          <p className="mt-3 mb-12 text-center text-slate-500">
            A local rewards app that pays you every time you shop at neighborhood stores.
          </p>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon name={benefit.icon} />
                </div>
                <h3 className="m-0 mb-2 text-lg font-bold text-slate-900">{benefit.title}</h3>
                <p className="m-0 text-[15px] leading-relaxed text-slate-500">{benefit.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Members & merchants */}
      <section className="bg-slate-50">
        <div className={`${containerClass} grid gap-14 py-16 sm:py-20 md:grid-cols-2 md:gap-16`}>
          <div>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <Icon name="user" className="h-7 w-7" />
            </div>
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
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-slate-900">
              <Icon name="store" className="h-7 w-7" />
            </div>
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
