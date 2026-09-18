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
          <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">{t('Ostatnia aktualizacja: 18 września 2026')}</p>
        </div>

        <Section title="Kim jesteśmy">
          <p>
            {t(
              'skieta to osobisty tracker finansowy - aplikacja bez reklam i bez sprzedaży danych osobom trzecim. Administratorem danych jest osoba prowadząca serwis skieta, z którą można się skontaktować pod adresem podanym na dole tej strony.',
            )}
          </p>
        </Section>

        <Section title="Jakie dane zbieramy">
          <p className="font-medium text-slate-700 dark:text-slate-300">{t('Dane konta')}</p>
          <p>
            {t(
              'Adres e-mail, hasło (przechowywane wyłącznie w postaci zahaszowanej, nigdy jawnym tekstem) i nazwa użytkownika, którą tworzymy z adresu e-mail. Imię i nazwisko tylko wtedy, gdy sam(a) je podasz. Przy rejestracji zapisujemy też, z czyjego zaproszenia założono konto oraz z której strony naszego serwisu trafiłeś/aś do formularza rejestracji (np. „artykuł" wraz z jego adresem, strona główna, kalkulator) - żebyśmy wiedzieli, które treści są naprawdę pomocne. To informacja o naszej własnej stronie, nie o Twojej historii przeglądania, i nie trafia do nikogo poza nami.',
            )}
          </p>
          <p className="font-medium text-slate-700 dark:text-slate-300">{t('Dane finansowe, które sam(a) wprowadzasz')}</p>
          <p>
            {t(
              'Konta bankowe i ich salda, transakcje budżetowe, kategorie/sklepy/tagi, posiadane akcje i transakcje giełdowe, lokaty, obligacje, dywidendy, cele oszczędnościowe i plany budżetowe - czyli wszystko, co wpisujesz, żeby aplikacja mogła śledzić Twój majątek. Te dane widzisz tylko Ty - inni użytkownicy nie mają do nich dostępu, a panel administratora pokazuje wyłącznie zbiorcze liczby i aktywność konta (np. liczbę transakcji), nigdy treść Twoich transakcji czy sald.',
            )}
          </p>
          <p className="font-medium text-slate-700 dark:text-slate-300">{t('Dane techniczne i bezpieczeństwa')}</p>
          <p>
            {t(
              'Przy każdym logowaniu zapisujemy adres IP oraz podstawowe informacje o przeglądarce/systemie (User-Agent) - to podstawa historii logowań widocznej w Twoim koncie oraz ochrony przed nieautoryzowanym dostępem. Zapisujemy też, w które dni byłeś/aś aktywny(a) (do serii logowań i statystyk).',
            )}
          </p>
          <p className="font-medium text-slate-700 dark:text-slate-300">{t('Klucz Gemini, jeśli go dodasz')}</p>
          <p>
            {t(
              'Skanowanie paragonów i analiza spółek są opcjonalne i działają w oparciu o Twój własny klucz API do Google Gemini. Klucz przechowujemy w postaci zaszyfrowanej, nie pokazujemy go z powrotem w aplikacji i używamy go wyłącznie do tych dwóch funkcji: odczytania zdjęcia, które sam(a) wysłałeś/aś, oraz przygotowania analizy spółki. Możesz go usunąć jednym kliknięciem w ustawieniach konta - wtedy znika z bazy razem z datą dodania.',
            )}
          </p>
          <p className="font-medium text-slate-700 dark:text-slate-300">{t('Analizy spółek, jeśli z nich korzystasz')}</p>
          <p>
            {t(
              'Zapisujemy przygotowane analizy - podsumowanie, najważniejsze dane i listę źródeł - razem ze spółką, okresem i datą, żeby pokazać je ponownie bez zużywania Twojego limitu. Dla każdej spółki i okresu trzymamy najwyżej 30 ostatnich analiz. Są częścią eksportu Twoich danych i znikają razem z kontem.',
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
              'Logowanie działa w oparciu o tokeny JWT przechowywane w local storage przeglądarki - to samo miejsce przechowuje wybrany motyw kolorystyczny i język, zanim zostaną zapisane na koncie. Nie ma żadnych skryptów reklamowych ani śledzących w celach marketingowych.',
            )}
          </p>
        </Section>

        <Section title="Analityka odwiedzin">
          <p>
            {t(
              'Liczymy odwiedziny i podstawowy ruch na stronie, ale robimy to bez ciasteczek analitycznych i bez profilowania. Nasz dostawca analityki nie zapisuje niczego na Twoim urządzeniu, nie tworzy identyfikatora, po którym można Cię rozpoznać na innych stronach, i nie zbiera Twojego adresu IP w postaci pozwalającej Cię zidentyfikować. Dlatego nie prosimy Cię o zgodę na ciasteczka i nie zobaczysz tu żadnego bannera.',
            )}
          </p>
          <p>
            {t(
              'Wcześniej korzystaliśmy z Google Analytics. Zrezygnowaliśmy z niego właśnie dlatego, że wymagał ciasteczek i Twojej zgody.',
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
            <li>{t('dostawca poczty e-mail - do wysyłki e-maili weryfikacyjnych, resetu hasła i zaproszeń,')}</li>
            <li>{t('dostawca analityki bez ciasteczek - zbiorcze statystyki odwiedzin (patrz sekcja wyżej),')}</li>
            <li>
              {t(
                'dostawca monitoringu błędów - dostaje techniczne zgłoszenie awarii (adres strony i ślad błędu w kodzie), nigdy treści Twoich danych finansowych ani zawartości formularzy,'
              )}
            </li>
            <li>
              {t(
                'publiczne źródła danych rynkowych i wiadomości (np. Stooq, Yahoo Finance, bankier.pl, SEC EDGAR) - zapytania dotyczą wyłącznie tickerów i nazw spółek oraz kursów walut, nigdy Twoich danych osobowych,',
              )}
            </li>
            <li>
              {t(
                'dostawca hostingu strony (Netlify) - serwuje samą aplikację w przeglądarce i obsługuje wysyłkę zdjęcia paragonu do Google, jeśli korzystasz ze skanowania,'
              )}
            </li>
            <li>
              {t(
                'Google (Gemini) - wyłącznie wtedy, gdy sam(a) dodasz swój klucz API i skorzystasz ze skanowania paragonu albo z analizy spółek. Bez klucza żadne dane nie trafiają do Google.',
              )}
            </li>
          </ul>
          <p>
            {t(
              'Aplikacja i baza danych stoją w centrum danych Microsoft Azure w Polsce (region Poland Central), a serwer pocztowy w Polsce. Zgłoszenia o awariach trafiają do europejskiego regionu dostawcy monitoringu.',
            )}
          </p>
          <p>
            {t(
              'Dane finansowe, które wpisujesz w aplikacji, nie opuszczają Europejskiego Obszaru Gospodarczego. Wyjątek jest w Twoich rękach: funkcje działające na Twoim kluczu Gemini. Jeśli z nich korzystasz, do Google Gemini trafia zdjęcie paragonu albo - przy analizie spółek - dane opisane w sekcji o analizie spółek, i są one przetwarzane na serwerach Google, także poza EOG, zgodnie z warunkami Google dla API Gemini. Paragon wysyłasz zawsze sam(a), a analiza spółki uruchamia się, gdy o nią poprosisz albo gdy pierwszy raz danego dnia otworzysz jej zakładkę. Zdjęcia nie przechowujemy - trafia prosto do Google, a u nas zostaje wyłącznie odczytany z niego tekst, który zatwierdzasz w formularzu.',
            )}
          </p>
        </Section>

        <Section title="Skanowanie paragonów">
          <p>
            {t(
              'Ta funkcja jest w całości opcjonalna i domyślnie wyłączona - włącza ją dopiero dodanie własnego klucza Google Gemini w ustawieniach. Do Google trafia wtedy samo zdjęcie paragonu i lista nazw Twoich kategorii wydatków (żeby model mógł zaproponować jedną z nich), nigdy Twoje saldo, historia transakcji, dane logowania ani cokolwiek innego z konta.',
            )}
          </p>
          <p>
            {t(
              'To, co Google robi z przesłanym zdjęciem i jak długo je przechowuje, regulują warunki Google dla API Gemini - obowiązują one między Tobą a Google, bo to Twój klucz. Usunięcie klucza w ustawieniach wyłącza funkcję natychmiast i nie zostawia po niej żadnych danych po naszej stronie.',
            )}
          </p>
        </Section>

        <Section title="Analiza spółek">
          <p>
            {t(
              'Ta funkcja też jest opcjonalna i działa tylko z Twoim kluczem Gemini. Przy analizie skieta zbiera publiczne materiały o spółce - jej komunikaty i nagłówki wiadomości - i wysyła je do Google razem z nazwą i tickerem spółki, wybranym okresem i językiem odpowiedzi. Jeśli masz w skiecie zapisaną nadchodzącą dywidendę tej spółki potwierdzoną jej komunikatem, dołączamy też kwotę na akcję i datę wypłaty. Nie wysyłamy liczby posiadanych akcji, wartości portfela, sald, historii transakcji ani danych logowania.',
            )}
          </p>
          <p>
            {t(
              'Pamiętaj, że sama nazwa analizowanej spółki mówi Google, że się nią interesujesz. Analiza nie jest rekomendacją inwestycyjną - to podsumowanie cudzych materiałów przygotowane przez model AI, który może się pomylić.',
            )}
          </p>
        </Section>

        <Section title="Jak długo przechowujemy dane">
          <p>
            {t(
              'Dane konta przechowujemy tak długo, jak konto jest aktywne. Kiedy usuniesz konto w ustawieniach, blokujemy je od razu, a po 30 dniach trwale kasujemy wszystkie Twoje dane. Przez te 30 dni możesz cofnąć decyzję linkiem z maila, który wysyłamy przy usuwaniu. Osobno administrator może zarchiwizować konto, czyli je zdezaktywować z zachowaniem danych - takie konto czeka, aż zdecydujesz, co dalej, i nie jest kasowane automatycznie.',
            )}
          </p>
        </Section>

        <Section title="Twoje prawa">
          <p>
            {t(
              'Masz prawo do wglądu w swoje dane, ich poprawienia, przeniesienia i usunięcia. Dwa z nich załatwisz sam(a) w ustawieniach konta: "Pobierz swoje dane" daje pełną kopię wszystkiego, co przechowujemy (JSON plus tabele CSV do Excela), a "Usuń konto" uruchamia trwałe skasowanie danych. Większość informacji poprawisz bezpośrednio w ustawieniach. W pozostałych sprawach napisz na adres podany niżej albo skorzystaj z widgetu "Zostaw feedback" w aplikacji.',
            )}
          </p>
        </Section>

        <Section title="Bezpieczeństwo">
          <p>
            {t(
              'Hasła są haszowane, komunikacja z aplikacją odbywa się przez HTTPS, a dostęp do panelu administratora mają wyłącznie konta z uprawnieniami administratora lub odpowiednią rolą - i nawet ten panel nie pokazuje treści Twoich transakcji ani sald, tylko zbiorcze statystyki. Treść danych finansowych nie jest też dostępna przez wbudowany panel Django - do bazy danych dociera się wyłącznie bezpośrednim, świadomym dostępem administracyjnym do infrastruktury, nie jednym kliknięciem w aplikacji.',
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
          <p>
            {t('W sprawach dotyczących danych osobowych napisz na:')}{' '}
            <a href="mailto:rejestracja@skieta.com" className="text-accent-700 dark:text-accent-400 hover:underline">
              rejestracja@skieta.com
            </a>
          </p>
        </Section>
      </div>
    </div>
  )
}
