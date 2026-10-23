import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Public address of the site — used for canonical links and link-preview URLs
const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://www.aleos.co.in').replace(/\/$/, '')
const SITE_NAME = 'ALEOS Rewards'

const DEFAULT = {
  title: 'ALEOS Rewards – Shop Local, Earn Reward Points | aleos.co.in',
  description:
    "ALEOS is India's local rewards network. Earn reward points every time you shop at partner cafes, salons, grocery and retail stores near you — and help local businesses grow with loyal customers.",
}

// Title and description for each public page. Anything not listed (dashboards, admin, unknown URLs) is
// kept out of search results with "noindex".
const PAGES = {
  '/': DEFAULT,
  '/join/member': {
    title: `Join as a Member – Earn Points on Every Purchase | ${SITE_NAME}`,
    description:
      'Sign up free with your email and a referral code. Earn ALEOS reward points every time you shop at local partner stores, and get a bonus when friends you invite shop.',
  },
  '/join/merchant': {
    title: `List Your Business – Become an ALEOS Merchant | ${SITE_NAME}`,
    description:
      'Grow your shop with loyal customers. Join ALEOS as a merchant, set your own reward %, and turn first-time shoppers into regulars. Restaurants, grocery, salons, retail and more.',
  },
  '/login': {
    title: `Member Login | ${SITE_NAME}`,
    description: 'Log in to your ALEOS member account with your email to see your reward points and referrals.',
  },
  '/merchant/login': {
    title: `Merchant Login | ${SITE_NAME}`,
    description: 'Log in to your ALEOS merchant dashboard to give reward points, recharge your wallet and track customers.',
  },
  '/terms/member': {
    title: `Member Terms & Conditions | ${SITE_NAME}`,
    description: 'Terms and conditions for ALEOS members: earning and using reward points, referrals and your account.',
  },
  '/terms/merchant': {
    title: `Merchant Terms & Conditions | ${SITE_NAME}`,
    description: 'Terms and conditions for ALEOS merchants: wallet, reward points, fees, withdrawals and approval.',
  },
}

// Finds the <meta>/<link> tag matching `selector`, creating it from `attrs` if it isn't there yet
function upsert(tag, selector, attrs) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement(tag)
    document.head.appendChild(el)
  }
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value)
}

// Keeps the page's title, description, canonical URL, link-preview tags and robots rule in step with the route
export default function Seo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const path = pathname.length > 1 ? pathname.replace(/\/$/, '') : '/'
    const page = PAGES[path]
    const { title, description } = page || DEFAULT
    const url = `${SITE_URL}${path === '/' ? '/' : path}`

    document.title = page ? title : `${SITE_NAME}`
    upsert('meta', 'meta[name="description"]', { name: 'description', content: description })
    upsert('meta', 'meta[name="robots"]', { name: 'robots', content: page ? 'index, follow' : 'noindex, nofollow' })
    upsert('link', 'link[rel="canonical"]', { rel: 'canonical', href: url })
    upsert('meta', 'meta[property="og:title"]', { property: 'og:title', content: title })
    upsert('meta', 'meta[property="og:description"]', { property: 'og:description', content: description })
    upsert('meta', 'meta[property="og:url"]', { property: 'og:url', content: url })
    upsert('meta', 'meta[name="twitter:title"]', { name: 'twitter:title', content: title })
    upsert('meta', 'meta[name="twitter:description"]', { name: 'twitter:description', content: description })
  }, [pathname])

  return null
}
