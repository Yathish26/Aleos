import { SUPPORT_EMAIL } from '../config'
import Layout from './Layout'

function Points({ items }) {
  return items.map(([label, text]) => (
    <p key={label} className="mt-0 mb-3 leading-relaxed text-slate-600">
      <strong className="text-slate-800">{label}:</strong> {text}
    </p>
  ))
}

// Shared layout for the terms pages.
// Each section: a heading plus, in this order, optional paragraphs, labelled points ([label, text]),
// a bullet list, a table ({ head, rows }), trailing points (`after`) and a closing note.
export default function TermsPage({ title, appliesTo, sections, contactTitle, contactText }) {
  return (
    <Layout>
      <article className="mx-auto max-w-3xl">
        <h1 className="m-0 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>

        <dl className="mt-5 mb-8 grid gap-x-4 gap-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-[13px] sm:grid-cols-[auto_1fr]">
          <dt className="font-semibold text-slate-700">Effective Date</dt>
          <dd className="m-0 text-slate-600">October 2026</dd>
          <dt className="font-semibold text-slate-700">Platform Provider</dt>
          <dd className="m-0 text-slate-600">ALEOS Hyperlocal Network ("ALEOS", "We", "Us", or "Our")</dd>
          <dt className="font-semibold text-slate-700">Applies To</dt>
          <dd className="m-0 text-slate-600">{appliesTo}</dd>
        </dl>

        {sections.map((section, i) => (
          <section key={section.title} className="mb-8">
            <h2 className="mt-0 mb-3 text-lg font-bold text-slate-900">
              {i + 1}. {section.title}
            </h2>
            {section.paragraphs?.map((p) => (
              <p key={p} className="mt-0 mb-3 leading-relaxed text-slate-600">
                {p}
              </p>
            ))}
            {section.points && <Points items={section.points} />}
            {section.list && (
              <ul className="mt-0 mb-3 list-disc space-y-1.5 pl-6 leading-relaxed text-slate-600">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {section.table && (
              <div className="mb-3 overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full border-collapse text-left text-[13px]">
                  <thead className="bg-slate-50">
                    <tr>
                      {section.table.head.map((h) => (
                        <th key={h} className="border-b border-slate-200 px-3 py-2.5 font-bold text-slate-700">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.table.rows.map((row) => (
                      <tr key={row[0]} className="border-b border-slate-100 last:border-b-0">
                        {row.map((cell, c) => (
                          <td
                            key={c}
                            className={`px-3 py-2.5 align-top ${c === 0 ? 'font-semibold text-slate-800' : 'text-slate-600'} ${c === row.length - 1 ? 'whitespace-nowrap' : ''}`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {section.after && <Points items={section.after} />}
            {section.note && <p className="mt-0 mb-3 text-[13px] leading-relaxed text-slate-500 italic">{section.note}</p>}
          </section>
        ))}

        <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-5">
          <h2 className="mt-0 mb-2 text-lg font-bold text-slate-900">{contactTitle}</h2>
          <p className="m-0 leading-relaxed text-slate-600">
            {contactText}, email us at{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-blue-600">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </section>
      </article>
    </Layout>
  )
}
