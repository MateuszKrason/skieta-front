import { Link } from 'react-router-dom'
import SockLogo from '../components/SockLogo'
import { useLanguage } from '../i18n/LanguageContext'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = useLanguage()
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t(title)}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{children}</div>
    </section>
  )
}

export default function PrivacyPolicy() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-accent-700 dark:text-accent-400">
            <SockLogo className="h-7 w-7" />
            skieta
          </Link>
          <Link to="/" className="text-sm font-medium text-accent-700 dark:text-accent-400 hover:underline">
            {t('← Powrót na stronę główną')}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('Polityka prywatności')}</h1>
          <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">{t('Ostatnia aktualizacja: 22 sierpnia 2026')}</p>
        </div>

        <Section title="Kim jesteśmy">
          <p>
            {t(
              'skieta to osobisty tracker finansowy — aplikacja dostępna wyłącznie na zaproszenie, bez reklam i bez sprzedaży danych osobom trzecim. Administratorem danych jest osoba prowadząca serwis skieta, z którą można się skontaktować pod adresem podanym na dole tej strony.',
            )}
          </p>
        </Section>

        <Section title="Jakie dane zbieramy">
          <p className="font-medium text-slate-700 dark:text-slate-300">{t('Dane konta')}</p>
          <p>
            {t(
              'Nazwa użytkownika, imię i nazwisko, adres e-mail (jeśli podany) i hasło (przechowywane wyłącznie w postaci zahaszowanej, nigdy jawnym tekstem). Przy rejestracji zapisujemy też, z czyjego zaproszenia założono konto.',
            )}
          </p>
          <p className="font-medium text-slate-700 dark:text-slate-300">{t('Dane finansowe, które sam(a) wprowadzasz')}</p>
          <p>
            {t(
              'Konta bankowe i ich salda, transakcje budżetowe, kategorie/sklepy/tagi, posiadane akcje i transakcje giełdowe, lokaty, obligacje, dywidendy, cele oszczędnościowe i plany budżetowe — czyli wszystko, co wpisujesz, żeby aplikacja mogła śledzić Twój majątek. Te dane widzisz tylko Ty — inni użytkownicy nie mają do nich dostępu, a panel administratora pokazuje wyłącznie zbiorcze liczby i aktywność konta (np. liczbę transakcji), nigdy treść Twoich transakcji czy sald.',
            )}
          </p>
          <p className="font-medium text-slate-700 dark:text-slate-300">{t('Dane techniczne i bezpieczeństwa')}</p>
          <p>
            {t(
              'Przy każdym logowaniu zapisujemy adres IP oraz podstawowe informacje o przeglądarce/systemie (User-Agent) — to podstawa historii logowań widocznej w Twoim koncie oraz ochrony przed nieautoryzowanym dostępem. Zapisujemy też, w które dni byłeś/aś aktywny(a) (do serii logowań i statystyk).',
            )}
          </p>
          <p className="font-medium text-slate-700 dark:text-slate-300">{t('Zgłoszenia i zaproszenia')}</p>
          <p>
            {t(
              'Treść zgłoszeń wysłanych przez widget "Zostaw feedback" oraz historia wysłanych zaproszeń (komu, kiedy, czy zostało przyjęte).',
            )}
          </p>
        </Section>

        <Section title="Ciasteczka i local storage">
          <p>
            {t(
              'Logowanie działa w oparciu o tokeny JWT przechowywane w local storage przeglądarki — to samo miejsce przechowuje wybrany motyw kolorystyczny i język, zanim zostaną zapisane na koncie. Nie ma żadnych skryptów reklamowych ani śledzących w celach marketingowych.',
            )}
          </p>
        </Section>

        <Section title="Google Analytics">
          <p>
            {t(
              'Używamy Google Analytics do liczenia odwiedzin i podstawowej analityki ruchu na stronie — Google ustawia w tym celu własne ciasteczka i przetwarza dane takie jak adres IP, rodzaj urządzenia i przeglądarki oraz odwiedzane podstrony. Więcej o tym, jak Google przetwarza te dane, znajdziesz w polityce prywatności Google.',
            )}
          </p>
        </Section>

        <Section title="Komu udostępniamy dane">
          <p>
            {t(
              'Danych nie sprzedajemy i nie udostępniamy w celach marketingowych. Współpracujemy wyłącznie z dostawcami niezbędnymi do działania serwisu:',
            )}
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t('hosting aplikacji i baza danych (Microsoft Azure),')}</li>
            <li>{t('dostawca poczty e-mail — do wysyłki e-maili weryfikacyjnych, resetu hasła i zaproszeń,')}</li>
            <li>{t('Google Analytics — statystyki odwiedzin strony (patrz sekcja wyżej),')}</li>
            <li>
              {t(
                'publiczne źródła danych rynkowych (np. Stooq, Yahoo Finance) — zapytania dotyczą wyłącznie tickerów giełdowych i kursów walut, nigdy Twoich danych osobowych.',
              )}
            </li>
          </ul>
        </Section>

        <Section title="Jak długo przechowujemy dane">
          <p>
            {t(
              'Dane konta przechowujemy tak długo, jak konto jest aktywne. Administrator może zarchiwizować konto (dezaktywacja z zachowaniem danych) zamiast je usuwać. Obecnie usunięcie danych na stałe odbywa się na indywidualną prośbę, wysłaną administratorowi — w aplikacji nie ma jeszcze samoobsługowego przycisku "usuń konto".',
            )}
          </p>
        </Section>

        <Section title="Twoje prawa">
          <p>
            {t(
              'Masz prawo do wglądu w swoje dane, ich poprawienia (większość — bezpośrednio w ustawieniach konta) oraz do żądania ich usunięcia. W tym celu napisz do nas na adres podany niżej albo skorzystaj z widgetu "Zostaw feedback" w aplikacji.',
            )}
          </p>
        </Section>

        <Section title="Bezpieczeństwo">
          <p>
            {t(
              'Hasła są haszowane, komunikacja z aplikacją odbywa się przez HTTPS, a dostęp do panelu administratora mają wyłącznie konta z uprawnieniami administratora lub odpowiednią rolą — i nawet ten panel nie pokazuje treści Twoich transakcji ani sald, tylko zbiorcze statystyki. Treść danych finansowych nie jest też dostępna przez wbudowany panel Django — do bazy danych dociera się wyłącznie bezpośrednim, świadomym dostępem administracyjnym do infrastruktury, nie jednym kliknięciem w aplikacji.',
            )}
          </p>
        </Section>

        <Section title="Zmiany tej polityki">
          <p>
            {t(
              'W miarę rozwoju aplikacji ta strona będzie aktualizowana, a data ostatniej zmiany widoczna jest na górze strony.',
            )}
          </p>
        </Section>

        <Section title="Kontakt">
          <p>{t('W sprawach dotyczących danych osobowych napisz na: rejestracja@skieta.com')}</p>
        </Section>
      </div>
    </div>
  )
}
