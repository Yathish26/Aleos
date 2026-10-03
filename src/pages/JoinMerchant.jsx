import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import Layout from '../components/Layout'
import SplitPage from '../components/SplitPage'
import { btnPrimary, errorBoxClass, infoBoxClass, inputClass, labelClass } from '../components/ui'

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

const emptyForm = { businessName: '', ownerName: '', email: '', mobile: '', city: '' }

export default function JoinMerchant() {
  const [categories, setCategories] = useState([])
  const [loadError, setLoadError] = useState('')
  const [category, setCategory] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(null)

  useEffect(() => {
    api('/merchants/categories')
      .then((data) => setCategories(data.categories))
      .catch((err) => setLoadError(err.message))
  }, [])

  function update(field) {
    return (e) => {
      const value = field === 'mobile' ? e.target.value.replace(/\D/g, '') : e.target.value
      setForm((f) => ({ ...f, [field]: value }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!/^\d{10}$/.test(form.mobile)) {
      setError('Please enter a valid 10-digit mobile number.')
      return
    }
    setSubmitting(true)
    try {
      const body = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]))
      const data = await api('/merchants/register', { method: 'POST', body: { ...body, category } })
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

        <div className="grid gap-x-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Business Email *</label>
            <input
              type="email"
              placeholder="shop@example.com"
              required
              value={form.email}
              onChange={update('email')}
              className={inputClass}
            />
          </div>
          <div>
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
          </div>
        </div>

        <label className={labelClass}>City</label>
        <input type="text" placeholder="Bengaluru" value={form.city} onChange={update('city')} className={inputClass} />

        <div className={infoBoxClass}>📋 You'll hear from us by email once your application is reviewed.</div>

        <button type="submit" className={`${btnPrimary} w-full py-3`} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Application'}
        </button>
      </form>
    </SplitPage>
  )
}
