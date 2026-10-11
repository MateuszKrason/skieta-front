import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import AuthTopBar from './AuthTopBar'
import SockLogo from './SockLogo'
import { useLanguage } from '../i18n/LanguageContext'
import { rememberSignupSource, trackEvent } from '../lib/analytics'
import { CALCULATORS } from '../lib/calculators'

// The small public calculators answer one question each and need no account.
// They share this frame: the same header as the other public pages, the
// question as the heading, the tool, how the number is made, and then the
// way from "one number today" to the app that keeps counting.
export interface Faq {
  question: string
  answer: string
}

interface Props {
  path: string
  title: string
  lead: string
  children: ReactNode
  method: string[]
  faq: Faq[]
  articles: { slug: string; title: string }[]
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  const { t } = useLanguage()
  return (
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
      {t(label)}
      {children}
      {hint && <span className="mt-1 block text-xs font-normal text-slate-400 dark:text-slate-500">{t(hint)}</span>}
    </label>
  )
}

export function NumberInput({
  value,
  onChange,
  step = 'any',
  min = '0',
  suffix,
}: {
  value: string
  onChange: (value: string) => void
  step?: string
  min?: string
  suffix: string
}) {
  return (
    <span className="mt-1 flex items-center rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus-within:border-accent-500">
      <input
        type="number"
        inputMode="decimal"
        value={value}
        min={min}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 rounded-md bg-transparent px-3 py-2 text-base text-slate-900 dark:text-slate-100 focus:outline-none"
      />
      <span className="shrink-0 pr-3 text-sm text-slate-400 dark:text-slate-500">{suffix}</span>
    </span>
  )
}

export function ResultRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  const { t } = useLanguage()
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-sm text-slate-500 dark:text-slate-400">{t(label)}</dt>
      <dd
        className={
          strong
            ? 'text-2xl font-extrabold tabular-nums text-accent-700 dark:text-accent-400'
            : 'text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100'
        }
      >
        {value}
      </dd>
    </div>
  )
}

export default function CalculatorShell({ path, title, lead, children, method, faq, articles }: Props) {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AuthTopBar />
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-accent-700 dark:text-accent-400">
            <SockLogo className="h-7 w-7" />
            skieta
          </Link>
          <Link to="/logowanie" className="text-sm font-medium text-accent-700 dark:text-accent-400 hover:underline">
            {t('Zaloguj się')}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-10 px-4 py-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">{t(title)}</h1>
          <p className="mt-3 max-w-2xl text-base text-slate-600 dark:text-slate-400">{t(lead)}</p>
        </div>

        {children}

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('Jak to liczymy')}</h2>
          <ul className="max-w-2xl list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {method.map((line) => (
              <li key={line}>{t(line)}</li>
            ))}
          </ul>
        </section>

        <aside className="rounded-xl border border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-950/40 p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('Policz to na swoich prawdziwych liczbach')}</h2>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            {t(
              'Kalkulator daje jedną liczbę na dziś. skieta liczy to samo co miesiąc dla Twoich kont, lokat, obligacji i akcji, z zyskiem po podatku Belki. Za darmo, bez reklam i bez podpinania banku.',
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/register"
              onClick={() => {
                trackEvent('register_clicked', { source: 'calculator' })
                rememberSignupSource('calculator')
              }}
              className="inline-block rounded-full bg-accent-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-800"
            >
              {t('Załóż darmowe konto →')}
            </Link>
            <Link
              to="/"
              className="inline-block rounded-full border border-accent-300 dark:border-accent-700 px-6 py-2.5 text-sm font-semibold text-accent-800 dark:text-accent-300 transition hover:bg-accent-100 dark:hover:bg-accent-900/40"
            >
              {t('Zobacz, jak działa')}
            </Link>
          </div>
        </aside>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('Częste pytania')}</h2>
          <dl className="max-w-2xl space-y-4">
            {faq.map((item) => (
              <div key={item.question}>
                <dt className="font-semibold text-slate-900 dark:text-slate-100">{t(item.question)}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t(item.answer)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {t('Czytaj dalej')}
            </h2>
            <ul className="space-y-1.5 text-sm">
              {articles.map((article) => (
                <li key={article.slug}>
                  <Link to={`/artykuly/${article.slug}`} className="font-medium text-accent-700 dark:text-accent-400 hover:underline">
                    {article.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {t('Inne kalkulatory')}
            </h2>
            <ul className="space-y-1.5 text-sm">
              {CALCULATORS.filter((c) => c.path !== path).map((c) => (
                <li key={c.path}>
                  <Link to={c.path} className="font-medium text-accent-700 dark:text-accent-400 hover:underline">
                    {t(c.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <p className="max-w-2xl text-xs text-slate-400 dark:text-slate-500">
          {t(
            'Wynik jest symulacją na podstawie wpisanych liczb, a nie poradą inwestycyjną ani podatkową. Rzeczywiste odsetki i podatek zależą od warunków konkretnego produktu.',
          )}
        </p>
      </main>
    </div>
  )
}
