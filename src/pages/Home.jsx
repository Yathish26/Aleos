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
  arrowRight: <path d="M5 12h14M12 5l7 7-7 7" />,
  trending: (
    <>
      <path d="m22 7-8.5 8.5-5-5L2 17" />
      <path d="M16 7h6v6" />
    </>
  ),
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

const pillars = ['All', 'Live', 'Events', 'Offers', 'Services']

const steps = [
  { icon: 'userPlus', title: 'Join in a minute', text: 'Sign up with your email and a referral code from a friend.' },
  { icon: 'bag', title: 'Shop at partners', text: 'Buy from any participating merchant near you.' },
  { icon: 'gift', title: 'Collect points', text: 'Points land in your account automatically with every purchase.' },
]

// How every bill's points are shared
const split = [
  { value: '80%', label: 'goes to you', text: 'of the points on every bill', tone: 'text-brand-cyan' },
  { value: '10%', label: 'to your referrer', text: 'the friend or shop that invited you', tone: 'text-brand-blue' },
  { value: '₹0', label: 'to join', text: 'free for members, always', tone: 'text-white' },
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
  { icon: 'trending', title: 'Grow with your city', text: 'More shops join every week — more places to earn and spend.' },
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

// Example activity shown on the hero card (illustration only)
const sampleActivity = [
  { emoji: '☕', shop: 'Artisan Cafe', note: '₹1,000 bill', points: '+80' },
  { emoji: '💇', shop: 'Glow Salon', note: '₹600 bill', points: '+48' },
  { emoji: '🤝', shop: 'Referral bonus', note: 'A friend shopped', points: '+10' },
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
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-cyan px-8 py-3.5 text-base font-bold text-brand-navy shadow-lg shadow-brand-cyan/30 transition hover:bg-white sm:w-auto"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        Join us — it's free
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
              className="flex items-start gap-3 border-b border-slate-100 p-4 last:border-b-0 hover:bg-brand-light"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-blue">
                <Icon name={option.icon} className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-bold text-brand-navy">{option.title}</span>
                <span className="block text-[13px] leading-relaxed text-slate-500">{option.description}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function PerkList({ items, dark = false }) {
  return (
    <ul className="m-0 mb-6 list-none space-y-3 p-0 sm:mb-7">
      {items.map((item) => (
        <li
          key={item}
          className={`flex items-start gap-2.5 text-sm sm:text-[15px] ${dark ? 'text-blue-100' : 'text-slate-600'}`}
        >
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              dark ? 'bg-brand-cyan/20 text-brand-cyan' : 'bg-brand-light text-brand-blue'
            }`}
          >
            <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
          {item}
        </li>
      ))}
    </ul>
  )
}

function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-12">
      <div className="mb-2 text-[11px] font-bold tracking-[0.2em] text-brand-blue uppercase sm:mb-3 sm:text-xs">
        {eyebrow}
      </div>
      <h2 className="m-0 text-2xl leading-tight font-extrabold tracking-tight text-brand-navy sm:text-4xl">{title}</h2>
      {text && <p className="mt-3 mb-0 text-sm leading-relaxed text-slate-500 sm:mt-4 sm:text-base">{text}</p>}
    </div>
  )
}

// Decorative preview of a member's points (not real data)
function HeroCard() {
  return (
    <div className="relative mx-auto w-full max-w-sm" aria-hidden="true">
      <div className="absolute -inset-4 rounded-4xl bg-linear-to-br from-brand-cyan/40 to-brand-blue/40 blur-2xl" />
      <div className="relative rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <div>
            <div className="text-xs font-semibold tracking-wide text-blue-100/80 uppercase">Your points</div>
            <div className="font-display text-3xl font-extrabold text-white sm:text-4xl">1,250</div>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-cyan text-brand-navy">
            <Icon name="gift" className="h-6 w-6" />
          </span>
        </div>
        <div className="space-y-2.5">
          {sampleActivity.map((a) => (
            <div key={a.shop} className="flex items-center gap-3 rounded-2xl bg-white/95 px-3 py-2.5 sm:px-3.5 sm:py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-lg">{a.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-brand-navy">{a.shop}</div>
                <div className="text-xs text-slate-500">{a.note}</div>
              </div>
              <span className="text-sm font-extrabold text-emerald-600">{a.points}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
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
      <section className="relative overflow-hidden bg-brand-navy text-white">
        {/* Soft brand glows */}
        <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-brand-blue/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-brand-cyan/25 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] bg-size-[24px_24px]" />

        <div
          className={`${containerClass} relative grid items-center gap-10 pt-10 pb-20 sm:gap-12 sm:py-20 lg:grid-cols-2 lg:py-28`}
        >
          {/* Centred on phones, left-aligned from tablets up */}
          <div className="text-center sm:text-left">
            <div className="mb-5 inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold tracking-widest text-blue-100 uppercase sm:mb-6 sm:gap-x-2 sm:px-4 sm:text-xs sm:tracking-[0.15em]">
              {pillars.map((p, i) => (
                <span key={p} className="flex items-center gap-1.5 sm:gap-2">
                  {i > 0 && <span className="text-brand-cyan">|</span>}
                  {p}
                </span>
              ))}
            </div>

            <h1 className="m-0 text-[2.5rem] leading-[1.1] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Shop local.
              <br />
              <span className="bg-linear-to-r from-brand-cyan to-brand-blue bg-clip-text text-transparent">
                Earn rewards.
              </span>
            </h1>
            <p className="mx-auto mt-4 mb-7 max-w-xl text-[15px] leading-relaxed text-blue-100/90 sm:mx-0 sm:mt-6 sm:mb-9 sm:text-lg">
              A rewards network connecting shoppers and local businesses. Members earn points on every purchase, and
              merchants grow with loyal customers.
            </p>

            <div className="mx-auto flex max-w-sm flex-col items-stretch gap-3 sm:mx-0 sm:max-w-none sm:flex-row sm:items-center sm:gap-4">
              <JoinDropdown />
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Member login
                <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[13px] text-blue-100/80 sm:mt-8 sm:justify-start sm:gap-x-6 sm:text-sm">
              {['Free to join', 'Points on every bill', 'Works at local shops'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <Icon name="check" className="h-4 w-4 text-brand-cyan" strokeWidth={3} />
                  {t}
                </span>
              ))}
            </div>
          </div>

          <HeroCard />
        </div>
      </section>

      {/* How the points are shared */}
      {/* A compact row of three on phones too, instead of three tall stacked boxes */}
      <section className="relative z-10 -mt-10 px-4 sm:-mt-12">
        <div className="mx-auto grid max-w-5xl grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/10 shadow-xl shadow-brand-navy/20 sm:rounded-3xl">
          {split.map((s) => (
            <div key={s.label} className="bg-linear-to-br from-brand-navy to-[#123f8a] px-2 py-4 text-center sm:px-6 sm:py-7">
              <div className={`font-display text-2xl font-extrabold sm:text-4xl ${s.tone}`}>{s.value}</div>
              <div className="mt-0.5 text-xs font-semibold text-white sm:mt-1 sm:text-base">{s.label}</div>
              <div className="mt-0.5 hidden text-[13px] text-blue-100/70 sm:block">{s.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className={`${containerClass} py-14 sm:py-24`}>
        <SectionHeading eyebrow="How it works" title="Three simple steps to start earning" />

        <div className="relative grid gap-3 sm:grid-cols-3 sm:gap-6">
          {/* Connecting line behind the step numbers */}
          <div className="absolute top-7 right-[16%] left-[16%] hidden h-0.5 bg-linear-to-r from-brand-cyan via-brand-blue to-brand-navy sm:block" />
          {steps.map((step, i) => (
            // Icon beside the text on phones, stacked and centred from tablets up
            <div
              key={step.title}
              className="relative flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:block sm:rounded-3xl sm:p-6 sm:text-center"
            >
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-navy text-brand-cyan shadow-lg shadow-brand-navy/25 sm:mx-auto sm:mb-5 sm:h-14 sm:w-14">
                <Icon name={step.icon} className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-cyan text-xs font-extrabold text-brand-navy ring-4 ring-white">
                  {i + 1}
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="m-0 mb-1 text-base font-bold text-brand-navy sm:mb-2 sm:text-lg">{step.title}</h3>
                <p className="m-0 text-sm leading-relaxed text-slate-500 sm:text-[15px]">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why ALEOS */}
      <section className="bg-brand-light/60">
        <div className={`${containerClass} py-14 sm:py-24`}>
          <SectionHeading
            eyebrow="Why ALEOS"
            title="Why people love ALEOS"
            text="A local rewards app that pays you every time you shop at neighbourhood stores."
          />

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {benefits.map((benefit) => (
              // Icon beside the text on phones so six cards don't make a very long page
              <div
                key={benefit.title}
                className="group flex items-start gap-4 rounded-2xl border border-white bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-blue/10 sm:block sm:rounded-3xl sm:p-6"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-light text-brand-blue transition-colors group-hover:bg-brand-navy group-hover:text-brand-cyan sm:mb-5 sm:h-12 sm:w-12">
                  <Icon name={benefit.icon} className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="m-0 mb-1 text-base font-bold text-brand-navy sm:mb-2 sm:text-lg">{benefit.title}</h3>
                  <p className="m-0 text-sm leading-relaxed text-slate-500 sm:text-[15px]">{benefit.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Members & merchants */}
      <section className={`${containerClass} py-14 sm:py-24`}>
        <SectionHeading eyebrow="Join the network" title="Built for shoppers and shops" />

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-9">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-light text-brand-blue sm:mb-5 sm:h-14 sm:w-14">
              <Icon name="user" className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <h3 className="m-0 mb-2 text-xl font-extrabold tracking-tight text-brand-navy sm:text-2xl">For members</h3>
            <p className="mt-0 mb-5 text-sm leading-relaxed text-slate-500 sm:mb-6 sm:text-base">
              Get rewarded for shopping at the places you already love.
            </p>
            <PerkList items={memberPerks} />
            <Link
              to="/join/member"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-navy px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-blue sm:inline-flex sm:w-auto"
            >
              Join as Member
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-brand-navy p-5 text-white shadow-xl shadow-brand-navy/20 sm:p-9">
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-brand-cyan/20 blur-3xl" />
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-brand-cyan sm:mb-5 sm:h-14 sm:w-14">
                <Icon name="store" className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <h3 className="m-0 mb-2 text-xl font-extrabold tracking-tight sm:text-2xl">For merchants</h3>
              <p className="mt-0 mb-5 text-sm leading-relaxed text-blue-100/80 sm:mb-6 sm:text-base">
                Are you a merchant? Join the network and turn shoppers into regulars.
              </p>
              <PerkList items={merchantPerks} dark />
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <Link
                  to="/join/merchant"
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand-cyan px-6 py-3 text-sm font-bold text-brand-navy transition-colors hover:bg-white sm:inline-flex"
                >
                  Join as Merchant
                  <Icon name="arrowRight" className="h-4 w-4" />
                </Link>
                <Link to="/merchant/login" className="text-center text-sm font-semibold text-blue-100 hover:text-white">
                  Merchant login →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section className="px-4 pb-14 sm:pb-24">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-linear-to-r from-brand-navy via-[#123f8a] to-brand-blue px-5 py-10 text-center text-white sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-size-[22px_22px]" />
          <div className="relative">
            <h2 className="m-0 text-xl leading-snug font-extrabold tracking-tight sm:text-4xl">
              More than a website — it's a world of opportunities.
            </h2>
            <p className="mx-auto mt-3 mb-6 max-w-xl text-sm text-blue-100/90 sm:mt-4 sm:mb-8 sm:text-base">
              Join the shoppers and local businesses growing together on ALEOS.
            </p>
            <div className="mx-auto flex max-w-sm flex-col justify-center gap-3 sm:max-w-none sm:flex-row">
              <Link
                to="/join/member"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-cyan px-7 py-3.5 text-sm font-bold text-brand-navy transition-colors hover:bg-white"
              >
                Start earning
                <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
              <Link
                to="/join/merchant"
                className="inline-flex items-center justify-center rounded-xl border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                List your business
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
