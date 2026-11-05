import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import Icon from '../components/Icon'
import { containerClass } from '../components/ui'

// Who ALEOS is built for
const audiences = [
  { icon: 'store', title: 'Local retail stores' },
  { icon: 'users', title: 'Service providers' },
  { icon: 'trending', title: 'Regional distributors' },
]

const purpose = [
  {
    icon: 'eye',
    title: 'Our vision',
    text: 'To create a fully connected hyperlocal commerce ecosystem where every neighborhood business thrives digitally and every consumer can instantly discover and support local commerce.',
  },
  {
    icon: 'target',
    title: 'Our mission',
    text: 'To empower local retailers, service providers, and regional distributors with low-friction, automated digital tools and a cost-effective platform that seamlessly connects them with nearby consumers and trade partners.',
  },
]

export default function About() {
  // Open the page at the top instead of keeping the previous page's scroll position
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <Layout bare>
      {/* Header */}
      <section className="relative overflow-hidden bg-brand-navy text-white">
        <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-brand-blue/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-brand-cyan/25 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] bg-size-[24px_24px]" />

        <div className={`${containerClass} relative py-14 text-center sm:py-20 lg:py-24`}>
          <div className="mb-3 text-[11px] font-bold tracking-[0.2em] text-brand-cyan uppercase sm:mb-4 sm:text-xs">
            About us
          </div>
          <h1 className="m-0 text-[2.25rem] leading-[1.1] font-extrabold tracking-tight sm:text-5xl">
            Local commerce,{' '}
            <span className="bg-linear-to-r from-brand-cyan to-brand-blue bg-clip-text text-transparent">
              made digital.
            </span>
          </h1>
        </div>
      </section>

      {/* Who we are */}
      <section className={`${containerClass} py-14 sm:py-24`}>
        <div className="grid items-center gap-8 lg:grid-cols-[3fr_2fr] lg:gap-14">
          <div>
            <div className="mb-2 text-[11px] font-bold tracking-[0.2em] text-brand-blue uppercase sm:mb-3 sm:text-xs">
              Who we are
            </div>
            <h2 className="m-0 mb-4 text-2xl leading-tight font-extrabold tracking-tight text-brand-navy sm:mb-6 sm:text-4xl">
              A level digital playing field for neighborhood businesses
            </h2>
            <p className="m-0 mb-4 text-[15px] leading-relaxed text-slate-600 sm:text-lg">
              ALEOS is a hyperlocal digital platform built to bridge the gap between neighborhood commerce and modern
              digital convenience.
            </p>
            <p className="m-0 text-[15px] leading-relaxed text-slate-600 sm:text-lg">
              Founded with a deep understanding of the operational realities faced by local retail stores, service
              providers, and regional distributors, we are dedicated to creating a level digital playing field for
              neighborhood businesses.
            </p>
          </div>

          <div className="space-y-3">
            {audiences.map((a) => (
              <div
                key={a.title}
                className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-light text-brand-blue sm:h-12 sm:w-12">
                  <Icon name={a.icon} className="h-5 w-5 sm:h-6 sm:w-6" />
                </span>
                <span className="text-base font-bold text-brand-navy sm:text-lg">{a.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision & mission */}
      <section className="bg-brand-light/60">
        <div className={`${containerClass} py-14 sm:py-24`}>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {purpose.map((p) => (
              <div key={p.title} className="rounded-3xl border border-white bg-white p-5 shadow-sm sm:p-9">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-navy text-brand-cyan shadow-lg shadow-brand-navy/25 sm:mb-5 sm:h-14 sm:w-14">
                  <Icon name={p.icon} className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <h3 className="m-0 mb-2 text-xl font-extrabold tracking-tight text-brand-navy sm:mb-3 sm:text-2xl">
                  {p.title}
                </h3>
                <p className="m-0 text-sm leading-relaxed text-slate-600 sm:text-base">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="px-4 py-14 sm:py-24">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-linear-to-r from-brand-navy via-[#123f8a] to-brand-blue px-5 py-10 text-center text-white sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-size-[22px_22px]" />
          <div className="relative">
            <h2 className="m-0 text-xl leading-snug font-extrabold tracking-tight sm:text-4xl">
              Be part of your neighborhood's digital future.
            </h2>
            <div className="mx-auto mt-6 flex max-w-sm flex-col justify-center gap-3 sm:mt-8 sm:max-w-none sm:flex-row">
              <Link
                to="/join/member"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-cyan px-7 py-3.5 text-sm font-bold text-brand-navy transition-colors hover:bg-white"
              >
                Join as Member
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
