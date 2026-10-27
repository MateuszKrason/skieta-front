import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import AuthTopBar from '../components/AuthTopBar'
import SockLogo from '../components/SockLogo'
import { useLanguage } from '../i18n/LanguageContext'
import { rememberSignupSource, trackEvent } from '../lib/analytics'
import { rememberReturnTo } from '../lib/returnTo'

// The public page for shared expenses. The feature itself needs an account
// (every member signs in, see splits/views.py), so this is what a search for
// "rozliczenie wyjazdu" or "aplikacja do dzielenia wydatków" can land on, and
// where the reels about splitting a trip send people. As of 25.10.2026 a
// shared-expense link was the only thing that had brought anyone in from
// outside, and each group pulls in the friends it is shared with - this is
// the part of skieta that spreads by itself.
//
// Every claim below is checked against the code: currencies and NBP rates
// (splits/models.py CURRENCY_CHOICES, rate_source), split modes, the limits
// (MAX_MEMBERS, MAX_EXPENSES) and what a visitor who has not joined can see.
const STEPS = [
  'Zakładasz rozliczenie: wyjazd, wspólne mieszkanie, wyjście albo inną okazję, i wpisujesz imiona.',
  'Wysyłasz link na grupę, na Messengerze albo WhatsAppie. Znajomi logują się, wybierają swoje imię z listy i dołączają.',
  'Każdy dopisuje swoje wydatki: kto płacił, ile i za kogo.',
  'skieta pokazuje, kto komu ile oddaje, najmniejszą liczbą przelewów. Oddane przelewy odhaczasz jednym kliknięciem.',
]

const FEATURES = [
  'Podział po równo, procentowo albo kwotowo, także tylko między część osób.',
  'Wydatki w 14 walutach, przeliczane po średnim kursie NBP z dnia wydatku albo po kursie, który wpiszesz.',
  'Podsumowanie do skopiowania na czat: kto komu i ile.',
  'Swoją część przeniesiesz do własnego budżetu w skiecie, żeby wyjazd nie zniknął z wydatków miesiąca.',
  'Paragon dodasz ze zdjęcia (odczyt wymaga własnego, darmowego klucza Google Gemini).',
  'Do 10 osób i 1000 wydatków w jednym rozliczeniu.',
]

const FAQ = [
  {
    question: 'Czy wszyscy muszą mieć konto?',
    answer:
      'Żeby zobaczyć rozliczenie i dopisywać wydatki, tak: darmowe konto zakłada się w minutę, e-mailem i hasłem. Osoby, które jeszcze go nie mają, możesz dopisać po imieniu i wpisywać wydatki za nie. Dołączą później z linku, wybierając swoje imię.',
  },
  {
    question: 'Ile to kosztuje?',
    answer: 'Nic. skieta jest dziś w całości bezpłatna: bez reklam, bez abonamentu i bez dziennego limitu wpisów.',
  },
  {
    question: 'Czym to się różni od Splitwise?',
    answer:
      'To ten sam pomysł: wspólna lista wydatków i wyliczenie, kto komu ile oddaje. skieta jest po polsku, przelicza waluty po kursie NBP, nie ma reklam, abonamentu ani dziennego limitu wpisów, a swoją część wydatków przeniesiesz do budżetu domowego w tej samej aplikacji.',
  },
  {
    question: 'Co z walutami na wyjeździe za granicą?',
    answer:
      'Każdy wydatek wpisujesz w walucie, w której był: euro, korony, funty i 11 innych. skieta przelicza go na walutę rozliczenia po średnim kursie NBP z dnia wydatku, a jeśli bank przeliczył po innym kursie, wpiszesz własny.',
  },
  {
    question: 'Kto widzi wydatki?',
    answer:
      'Tylko osoby, które dołączyły do rozliczenia swoim kontem. Ktoś z linkiem, kto jeszcze nie dołączył, widzi wyłącznie imiona uczestników.',
  },
  {
    question: 'Czy to działa na telefonie?',
    answer:
      'Tak, w przeglądarce, bez instalowania. Możesz też dodać skietę do ekranu głównego, wtedy otwiera się jak zwykła aplikacja.',
  },
]

const SPLITS_PATH = '/budzet/wspolne'

export default function RozliczeniaLanding() {
  const { t } = useLanguage()
  const { user } = useAuth()

  function goingToSignUp() {
    rememberReturnTo(SPLITS_PATH)
    trackEvent('register_clicked', { source: 'split_page' })
    rememberSignupSource('split_page')
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
          {!user && (
            <Link
              to="/logowanie"
              onClick={() => rememberReturnTo(SPLITS_PATH)}
              className="text-sm font-medium text-accent-700 dark:text-accent-400 hover:underline"
            >
              {t('Zaloguj się')}
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-10 px-4 py-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            {t('Kto komu ile? Rozlicz wyjazd ze znajomymi za darmo')}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-600 dark:text-slate-400">
            {t(
              'Wspólne wydatki z wyjazdu, mieszkania albo składki na prezent w jednym miejscu. Każdy dopisuje swoje z telefonu, a skieta liczy, kto komu oddaje, najmniejszą liczbą przelewów. Bez reklam i bez dziennego limitu wpisów.',
            )}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {user ? (
              <Link
                to={SPLITS_PATH}
                className="inline-block rounded-full bg-accent-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-800"
              >
                {t('Otwórz wspólne rozliczenia →')}
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  onClick={goingToSignUp}
                  className="inline-block rounded-full bg-accent-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-800"
                >
                  {t('Załóż darmowe rozliczenie →')}
                </Link>
                <Link
                  to="/logowanie"
                  onClick={() => rememberReturnTo(SPLITS_PATH)}
                  className="text-sm font-medium text-accent-700 dark:text-accent-400 hover:underline"
                >
                  {t('Mam już konto - zaloguj się')}
                </Link>
              </>
            )}
          </div>
          {!user && (
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
              {t('Konto zakładasz w minutę, wystarczy e-mail i hasło.')}
            </p>
          )}
        </div>

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('Jak to działa')}</h2>
          <ol className="max-w-2xl list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {STEPS.map((line) => (
              <li key={line}>{t(line)}</li>
            ))}
          </ol>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('Co potrafi')}</h2>
          <ul className="max-w-2xl list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {FEATURES.map((line) => (
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
              <Link to="/" className="font-medium text-accent-700 dark:text-accent-400 hover:underline">
                {t('skieta - darmowa aplikacja do budżetu domowego')}
              </Link>
            </li>
            <li>
              <Link
                to="/artykuly/jak-rozliczyc-wyjazd-ze-znajomymi"
                className="font-medium text-accent-700 dark:text-accent-400 hover:underline"
              >
                Jak rozliczyć wyjazd ze znajomymi: kto komu ile
              </Link>
            </li>
            <li>
              <Link
                to="/artykuly/budzet-pary-wspolne-konto-osobne-czy-mieszane"
                className="font-medium text-accent-700 dark:text-accent-400 hover:underline"
              >
                Budżet pary: wspólne konto, osobne czy mieszane?
              </Link>
            </li>
          </ul>
        </section>
      </main>
    </div>
  )
}
