import Icon from './Icon'
import Layout from './Layout'

// Two-column page for forms: intro on the left, form on the right. Stacks into one column on mobile.
// points: [{ icon (an Icon name), title, text }]
export default function SplitPage({ eyebrow, title, description, points = [], children }) {
  return (
    <Layout>
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_minmax(0,28rem)] lg:gap-20">
        <div className="lg:sticky lg:top-28">
          {eyebrow && (
            <div className="mb-3 text-xs font-bold tracking-widest text-brand-blue uppercase">{eyebrow}</div>
          )}
          <h1 className="m-0 text-3xl leading-tight font-extrabold tracking-tight text-brand-navy sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-4 mb-0 max-w-lg text-base leading-relaxed text-slate-500">{description}</p>
          )}

          {points.length > 0 && (
            <ul className="mt-8 mb-0 hidden list-none space-y-5 p-0 lg:block">
              {points.map((p) => (
                <li key={p.title} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-brand-cyan">
                    <Icon name={p.icon} className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-bold text-brand-navy">{p.title}</span>
                    <span className="block text-sm leading-relaxed text-slate-500">{p.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="w-full">{children}</div>
      </div>
    </Layout>
  )
}
