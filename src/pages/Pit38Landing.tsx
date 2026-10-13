import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import AuthTopBar from '../components/AuthTopBar'
import SockLogo from '../components/SockLogo'
import { useLanguage } from '../i18n/LanguageContext'
import { rememberSignupSource, trackEvent } from '../lib/analytics'

// The public page for the PIT-38 helper. The helper itself needs an account
// (it works on a person's own transactions), so this is the page a search for
// "kalkulator PIT-38" can land on: what it works out, what it does not, and
// one click into the demo, where it can be seen running on sample data.
const COUNTS = [
  'Akcje i ETF-y: przychód, koszty i dochód metodą FIFO, osobno dla każdego rachunku maklerskiego.',
  'Waluty: średni kurs NBP z ostatniego dnia roboczego przed transakcją, osobno dla kupna i dla sprzedaży.',
  'Dywidendy z zagranicy: 19% minus podatek pobrany u źródła, z kwotą do dopłaty w Polsce.',
  'Kryptowaluty: koszty zakupów z danego roku i koszty przeniesione z lat poprzednich.',
  'Każda sprzedaż rozpisana na partie zakupu, z kursem i datą tabeli NBP, do pobrania jako plik CSV.',
]

const STEPS = [
  'Wpisujesz transakcje kupna i sprzedaży. Jeśli prowadzisz portfel w skiecie, już tam są.',
  'Wybierasz rok podatkowy.',
  'Przepisujesz kwoty do zeznania i sprawdzasz je z dokumentami od brokera.',
]

const LIMITS = [
  'Nie wypełnia formularza i nie wysyła zeznania.',
  'Nie zna transakcji, których nie ma w skiecie.',
  'Nie zastępuje PIT-8C od polskiego brokera ani doradcy podatkowego.',
]

const FAQ = [
  {
    question: 'Czy muszę złożyć PIT-38, jeśli mam rachunek tylko u zagranicznego brokera?',
    answer:
      'Tak, jeśli w danym roku była sprzedaż albo dywidenda. Zagraniczny broker zwykle nie wystawia PIT-8C, więc przychód i koszty trzeba wyliczyć samodzielnie i wpisać w wierszu „Inne przychody”.',
  },
  {
    question: 'Jaki kurs waluty stosuje się w PIT-38?',
    answer:
      'Średni kurs NBP z ostatniego dnia roboczego przed dniem uzyskania przychodu albo poniesienia kosztu. Dla sprzedaży i dla każdego zakupu jest to więc inny kurs.',
  },
  {
    question: 'Co to jest FIFO?',
    answer:
      'Zasada, według której jako pierwsze sprzedawane są papiery kupione najwcześniej. Stosuje się ją osobno dla każdego rachunku maklerskiego, dlatego przy kilku zakupach w różnych cenach koszt nie jest zwykłą średnią.',
  },
  {
    question: 'Ile to kosztuje?',
    answer: 'Nic. skieta jest darmowa, bez reklam i bez planu płatnego.',
  },
]

export default function Pit38Landing() {
  const { t } = useLanguage()
  const { user, startDemo } = useAuth()
  const navigate = useNavigate()
  const [opening, setOpening] = useState(false)
  const [failed, setFailed] = useState(false)

  async function openDemo() {
    setOpening(true)
    setFailed(false)
    trackEvent('demo_opened', { source: 'calculator' })
    try {
      await startDemo()
      navigate('/gielda/pit-38')
    } catch {
      setFailed(true)
    } finally {
      setOpening(false)
    }
  }

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
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            {t('PIT-38 z zagranicznego brokera, policzony z Twoich transakcji')}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-600 dark:text-slate-400">
            {t(
              'Zagraniczny broker nie przyśle PIT-8C. Kolejność FIFO, kursy NBP z dnia przed każdą transakcją i prowizje trzeba policzyć samemu. skieta robi to za darmo i pokazuje każdy krok wyliczenia.',
            )}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {user ? (
              <Link
                to="/gielda/pit-38"
                className="inline-block rounded-full bg-accent-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-800"
              >
                {t('Otwórz pomocnik PIT-38 →')}
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={openDemo}
                  disabled={opening}
                  className="rounded-full bg-accent-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-800 disabled:opacity-60"
                >
                  {opening ? t('Otwieram demo…') : t('Zobacz na koncie demo →')}
                </button>
                <Link
                  to="/register"
                  onClick={() => {
                    trackEvent('register_clicked', { source: 'calculator' })
                    rememberSignupSource('calculator')
                  }}
                  className="inline-block rounded-full border border-accent-300 dark:border-accent-700 px-6 py-2.5 text-sm font-semibold text-accent-800 dark:text-accent-300 transition hover:bg-accent-100 dark:hover:bg-accent-900/40"
                >
                  {t('Załóż darmowe konto')}
                </Link>
              </>
            )}
          </div>
          {failed && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
              {t('Nie udało się otworzyć demo. Spróbuj ponownie za chwilę.')}
            </p>
          )}
          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
            {t('Demo otwiera się bez rejestracji, na przykładowych danych. Nic w nim nie wpisujesz.')}
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('Co liczy')}</h2>
          <ul className="max-w-2xl list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {COUNTS.map((line) => (
              <li key={line}>{t(line)}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('Jak to wygląda w praktyce')}</h2>
          <ol className="max-w-2xl list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {STEPS.map((line) => (
              <li key={line}>{t(line)}</li>
            ))}
          </ol>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('Czego nie robi')}</h2>
          <ul className="max-w-2xl list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {LIMITS.map((line) => (
              <li key={line}>{t(line)}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('Częste pytania')}</h2>
          <dl className="max-w-2xl space-y-4">
            {FAQ.map((item) => (
              <div key={item.question}>
                <dt className="font-semibold text-slate-900 dark:text-slate-100">{t(item.question)}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t(item.answer)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{t('Czytaj dalej')}</h2>
          <ul className="space-y-1.5 text-sm">
            <li>
              <Link to="/kalkulator/podatek-belki" className="font-medium text-accent-700 dark:text-accent-400 hover:underline">
                {t('Kalkulator podatku Belki')}
              </Link>
            </li>
            <li>
              <Link
                to="/artykuly/podatek-belki-ile-realnie-zostaje-z-twojego-zysku"
                className="font-medium text-accent-700 dark:text-accent-400 hover:underline"
              >
                Podatek Belki - ile realnie zostaje z Twojego zysku
              </Link>
            </li>
            <li>
              <Link
                to="/artykuly/jak-liczyc-zwrot-z-akcji-kupionych-w-obcej-walucie"
                className="font-medium text-accent-700 dark:text-accent-400 hover:underline"
              >
                Jak liczyć zwrot z akcji kupionych w obcej walucie
              </Link>
            </li>
          </ul>
        </section>

        <p className="max-w-2xl text-xs text-slate-400 dark:text-slate-500">
          {t(
            'Pomocnik przygotowuje zestawienie dla polskich rezydentów podatkowych. To wyliczenie pomocnicze, a nie porada podatkowa ani gotowe zeznanie.',
          )}
        </p>
      </main>
    </div>
  )
}
