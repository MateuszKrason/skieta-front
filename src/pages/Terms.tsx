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

export default function Terms() {
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('Regulamin usługi')}</h1>
          <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">{t('Ostatnia aktualizacja: 14 września 2026')}</p>
        </div>

        <Section title="1. Postanowienia ogólne">
          <p>
            {t(
              'Usługodawcą i administratorem serwisu skieta (dalej: „Usługa") jest Mateusz Krasoń Software (dalej: „Usługodawca"). Niniejszy regulamin (dalej: „Regulamin") określa zasady korzystania z Usługi dostępnej pod adresem skieta.com.',
            )}
          </p>
          <p>
            {t(
              'Korzystanie z Usługi oznacza akceptację niniejszego Regulaminu w całości. Osoba niezgadzająca się z którymkolwiek postanowieniem Regulaminu powinna zaprzestać korzystania z Usługi.',
            )}
          </p>
          <p className="font-medium text-slate-700 dark:text-slate-300">{t('Definicje')}</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t('Użytkownik - osoba fizyczna posiadająca Konto w Usłudze.')}</li>
            <li>{t('Konto - indywidualne konto Użytkownika w Usłudze.')}</li>
            <li>
              {t(
                'Konto demonstracyjne - konto z przykładowymi danymi, udostępniane bez rejestracji, żeby można było obejrzeć Usługę. Każdy odwiedzający dostaje jego własną, tymczasową kopię. Gdy kopii nie da się utworzyć, odwiedzający ogląda wspólne konto, na którym zmiany nie są zapisywane.',
              )}
            </li>
            <li>
              {t(
                'Zaproszenie - link lub kod polecający Usługę, wygenerowany przez Użytkownika, administratora lub osobę do tego uprawnioną. Zaproszenie nie jest warunkiem rejestracji.',
              )}
            </li>
          </ul>
        </Section>

        <Section title="2. Charakter usługi">
          <p>
            {t(
              'skieta to osobisty tracker finansowy - narzędzie do samodzielnego zapisywania i wizualizowania własnych danych finansowych (konta, transakcje, inwestycje, budżet, plany oszczędnościowe). Rejestracja w Usłudze jest otwarta i bezpłatna.',
            )}
          </p>
          <p>
            {t(
              'Usługa nie jest instytucją finansową, biurem maklerskim, doradcą inwestycyjnym ani podmiotem świadczącym usługi płatnicze. Kursy walut, notowania giełdowe, komunikaty spółek i inne dane rynkowe pobierane są z publicznie dostępnych źródeł zewnętrznych (np. NBP, Stooq, Yahoo Finance, bankier.pl, SEC EDGAR) wyłącznie w celach informacyjnych - Usługodawca nie gwarantuje ich aktualności ani dokładności i nie ponosi odpowiedzialności za decyzje finansowe podjęte na ich podstawie.',
            )}
          </p>
          <p>
            {t(
              'Żadna treść w Usłudze, w tym artykuły publikowane w dziale redakcyjnym, wyniki kalkulatora inwestycyjnego ani analizy spółek, nie stanowi rekomendacji inwestycyjnej ani porady finansowej, prawnej lub podatkowej w rozumieniu obowiązujących przepisów.',
            )}
          </p>
          <p>
            {t(
              'Kwoty "po podatku" wyliczane w Usłudze na podstawie zadeklarowanego kraju rezydencji podatkowej (Polska, Niemcy, Hiszpania, USA, Wielka Brytania) są wyłącznie orientacyjnym szacunkiem opartym na uproszczonych, ogólnych stawkach i ulgach - nie uwzględniają indywidualnej sytuacji podatkowej Użytkownika (m.in. innych źródeł dochodu, stanu cywilnego, podatków stanowych czy lokalnych) i mogą odbiegać od rzeczywistego zobowiązania podatkowego. Usługodawca nie ponosi odpowiedzialności za błędy w tych wyliczeniach ani za decyzje podjęte na ich podstawie - w sprawach podatkowych należy skonsultować się z licencjonowanym doradcą podatkowym we właściwej jurysdykcji.',
            )}
          </p>
        </Section>

        <Section title="3. Warunki korzystania i rejestracja">
          <ul className="list-disc space-y-1 pl-5">
            <li>{t('Z Usługi może korzystać wyłącznie osoba pełnoletnia, posiadająca pełną zdolność do czynności prawnych.')}</li>
            <li>
              {t(
                'Rejestracja jest otwarta - Konto zakłada się samodzielnie w formularzu rejestracji, akceptując Regulamin. Zaproszenie nie jest do tego potrzebne.',
              )}
            </li>
            <li>
              {t(
                'Przed rejestracją można obejrzeć Usługę na Koncie demonstracyjnym. Jego dane są przykładowe. Kopia Konta demonstracyjnego, razem ze wszystkim, co zostanie w niej wpisane, jest usuwana przy wyjściu z demo, a najpóźniej po 24 godzinach - nie należy wpisywać tam żadnych własnych danych. Część funkcji, m.in. wysyłanie wiadomości e-mail i zaproszeń, zmiana hasła, zapis klucza Gemini i import wyciągów, jest w demo wyłączona.',
              )}
            </li>
            <li>
              {t(
                'Użytkownik zobowiązany jest podać prawdziwe dane przy rejestracji (imię, nazwisko, opcjonalnie adres e-mail) oraz aktualizować je w razie zmiany.',
              )}
            </li>
            <li>{t('Jedna osoba fizyczna może posiadać jedno Konto, chyba że Usługodawca postanowi inaczej.')}</li>
          </ul>
        </Section>

        <Section title="4. Konto i odpowiedzialność Użytkownika">
          <p>
            {t(
              'Użytkownik jest zobowiązany zachować poufność hasła do Konta i nie udostępniać go osobom trzecim. Użytkownik ponosi odpowiedzialność za wszystkie działania wykonane przy użyciu jego Konta, chyba że wynikły one z winy Usługodawcy.',
            )}
          </p>
          <p>
            {t(
              'Użytkownik odpowiada za prawdziwość i poprawność danych finansowych, które samodzielnie wprowadza do Usługi - Usługodawca nie weryfikuje ich zgodności ze stanem faktycznym.',
            )}
          </p>
          <p>
            {t(
              'O każdym podejrzeniu nieautoryzowanego dostępu do Konta Użytkownik powinien niezwłocznie poinformować Usługodawcę na adres podany w sekcji „Kontakt".',
            )}
          </p>
        </Section>

        <Section title="5. Zaproszenia">
          <p>
            {t(
              'Zaproszenia służą do polecania Usługi innym osobom - dzięki nim Usługa odnotowuje, z czyjego polecenia założono Konto. Skorzystanie z Zaproszenia jest dobrowolne i nie jest warunkiem rejestracji. Zaproszenia osobiste tracą ważność po upływie określonego czasu od wygenerowania, a Zaproszenia grupowe (link lub kod QR) tworzone przez administratora lub osoby do tego uprawnione mają własny limit osób i datę ważności.',
            )}
          </p>
          <p>
            {t(
              'Zaproszeniami nie wolno handlować ani rozsyłać ich jako niezamówionych informacji handlowych (spamu). Usługodawca zastrzega sobie prawo do unieważnienia Zaproszenia.',
            )}
          </p>
        </Section>

        <Section title="6. Zasady korzystania">
          <p>{t('Zabronione jest w szczególności:')}</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t('podejmowanie prób nieautoryzowanego dostępu do Kont innych Użytkowników lub infrastruktury Usługi,')}</li>
            <li>{t('wprowadzanie treści niezgodnych z prawem, obraźliwych lub naruszających prawa osób trzecich,')}</li>
            <li>{t('wykorzystywanie Usługi do działań automatycznych (boty, scraping) bez zgody Usługodawcy,')}</li>
            <li>{t('podejmowanie działań zakłócających działanie Usługi lub obciążających ją w sposób nieproporcjonalny.')}</li>
          </ul>
        </Section>

        <Section title="7. Własny klucz Gemini: skanowanie paragonów i analiza spółek">
          <p>
            {t(
              'Skanowanie paragonów i analiza spółek są opcjonalne i działają w oparciu o Twój własny klucz API do Google Gemini - to Ty decydujesz, czy w ogóle z nich korzystać. Dzięki temu zapytania trafiają do Google w ramach Twojej własnej umowy z Google, a Usługodawca nie pośredniczy w rozliczeniach ani nie ma wglądu w Twoje zużycie.',
            )}
          </p>
          <p>
            {t(
              'Klucz pochodzi od Google i to Google ustala zasady korzystania z niego: darmowy poziom, dzienne limity zapytań, ewentualne opłaty po jego przekroczeniu oraz warunki przetwarzania przesłanych danych. Zasady te mogą się zmienić bez udziału Usługodawcy. Usługodawca nie jest stroną Twojej umowy z Google i nie odpowiada za wyczerpanie darmowego limitu, naliczone przez Google opłaty, zawieszenie klucza ani za zmianę warunków po stronie Google.',
            )}
          </p>
          <p>
            {t(
              'Analiza spółek to automatyczne podsumowanie publicznych komunikatów i wiadomości przygotowane przez model AI. Nie jest rekomendacją inwestycyjną ani poradą finansową, może zawierać błędy, pominięcia i nieaktualne informacje, a Usługodawca nie odpowiada za decyzje podjęte na jej podstawie. Przy każdym punkcie jest odnośnik do źródła - sprawdź informację u źródła, zanim cokolwiek zrobisz.',
            )}
          </p>
          <p>
            {t(
              'W praktyce: przy typowym korzystaniu z aplikacji darmowy poziom zwykle wystarcza, a limity i ewentualne koszty sprawdzisz w każdej chwili na swoim koncie Google. Jeśli chcesz mieć pewność, że nic się nie naliczy, nie dodawaj klucza z aktywnym rozliczeniem - wydatki możesz wpisywać ręcznie, a wszystkie pozostałe funkcje działają tak samo.',
            )}
          </p>
          <p>
            {t(
              'Wynik odczytu paragonu jest propozycją generowaną przez model AI - przed zapisaniem widzisz go w formularzu i to Ty potwierdzasz kwoty, daty i kategorie. Usługodawca nie gwarantuje poprawności odczytu i nie odpowiada za dane zapisane bez sprawdzenia.',
            )}
          </p>
          <p>
            {t(
              'Klucz przechowujemy w postaci zaszyfrowanej i możesz go usunąć jednym kliknięciem w ustawieniach konta - szczegóły w Polityce prywatności.',
            )}
          </p>
        </Section>

        <Section title="8. Dostępność i ograniczenie odpowiedzialności">
          <p>
            {t(
              'Usługa znajduje się w aktywnym rozwoju i jest udostępniana w modelu „tak jak jest" (as is), bez gwarancji nieprzerwanego, bezbłędnego działania. Usługodawca dokłada starań, aby Usługa działała poprawnie, ale nie gwarantuje jej stałej dostępności i zastrzega sobie prawo do przerw technicznych, w tym bez wcześniejszego powiadomienia.',
            )}
          </p>
          <p>
            {t(
              'W granicach dopuszczalnych przez prawo Usługodawca nie ponosi odpowiedzialności za szkody wynikające z utraty danych, przerw w działaniu Usługi lub decyzji finansowych podjętych przez Użytkownika na podstawie danych zgromadzonych lub wyświetlanych w Usłudze.',
            )}
          </p>
        </Section>

        <Section title="9. Własność intelektualna">
          <p>
            {t(
              'Kod źródłowy, wygląd, nazwa, logo i treści redakcyjne publikowane w Usłudze stanowią własność Usługodawcy lub są wykorzystywane na podstawie odpowiednich licencji i podlegają ochronie prawnoautorskiej. Dane finansowe wprowadzone przez Użytkownika pozostają jego własnością - Usługodawca wykorzystuje je wyłącznie w celu świadczenia Usługi, zgodnie z Polityką prywatności.',
            )}
          </p>
        </Section>

        <Section title="10. Zawieszenie i usunięcie konta">
          <p>
            {t(
              'Usługodawca może zawiesić (zablokować logowanie) lub zarchiwizować Konto Użytkownika w przypadku naruszenia Regulaminu, próby nieautoryzowanego dostępu lub działania na szkodę Usługi bądź innych Użytkowników. Archiwizacja oznacza dezaktywację Konta z zachowaniem danych, nie ich usunięcie.',
            )}
          </p>
          <p>
            {t(
              'Użytkownik może w każdej chwili samodzielnie usunąć Konto w ustawieniach konta. Konto jest od razu blokowane, a po 30 dniach wszystkie jego dane są trwale usuwane - do tego czasu decyzję można cofnąć linkiem wysłanym e-mailem. Szczegóły opisuje Polityka prywatności.',
            )}
          </p>
        </Section>

        <Section title="11. Reklamacje">
          <p>
            {t(
              'Reklamacje dotyczące działania Usługi można zgłaszać na adres e-mail podany w sekcji „Kontakt" lub za pomocą widgetu „Zostaw feedback" w aplikacji. Usługodawca rozpatruje zgłoszenia w miarę możliwości najszybciej, jak to praktycznie wykonalne.',
            )}
          </p>
        </Section>

        <Section title="12. Zmiany Regulaminu">
          <p>
            {t(
              'Usługodawca zastrzega sobie prawo do zmiany Regulaminu, w szczególności w związku z rozwojem funkcjonalności Usługi lub zmianą przepisów prawa. O istotnych zmianach Użytkownicy zostaną poinformowani odpowiednim komunikatem w Usłudze. Data ostatniej aktualizacji widoczna jest na górze tej strony.',
            )}
          </p>
        </Section>

        <Section title="13. Postanowienia końcowe">
          <p>
            {t(
              'W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają przepisy prawa polskiego. Regulamin obowiązuje wraz z Polityką prywatności, dostępną pod adresem',
            )}{' '}
            <Link to="/polityka-prywatnosci" className="text-accent-700 dark:text-accent-400 hover:underline">
              skieta.com/polityka-prywatnosci
            </Link>
            .
          </p>
        </Section>

        <Section title="Kontakt">
          <p>
            {t('W sprawach dotyczących Regulaminu napisz na:')}{' '}
            <a href="mailto:rejestracja@skieta.com" className="text-accent-700 dark:text-accent-400 hover:underline">
              rejestracja@skieta.com
            </a>
          </p>
        </Section>
      </div>
    </div>
  )
}
