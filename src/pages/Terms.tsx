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
          <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">{t('Ostatnia aktualizacja: 23 sierpnia 2026')}</p>
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
            <li>{t('Użytkownik — osoba fizyczna posiadająca Konto w Usłudze.')}</li>
            <li>{t('Konto — indywidualne konto Użytkownika, założone po skorzystaniu z Zaproszenia.')}</li>
            <li>
              {t(
                'Zaproszenie — jednorazowy lub grupowy link/kod umożliwiający rejestrację, wygenerowany przez Użytkownika, administratora lub osobę do tego uprawnioną.',
              )}
            </li>
          </ul>
        </Section>

        <Section title="2. Charakter usługi">
          <p>
            {t(
              'skieta to osobisty tracker finansowy — narzędzie do samodzielnego zapisywania i wizualizowania własnych danych finansowych (konta, transakcje, inwestycje, budżet, plany oszczędnościowe). Usługa działa w modelu zaproszeń — rejestracja jest możliwa wyłącznie przy użyciu ważnego Zaproszenia.',
            )}
          </p>
          <p>
            {t(
              'Usługa nie jest instytucją finansową, biurem maklerskim, doradcą inwestycyjnym ani podmiotem świadczącym usługi płatnicze. Kursy walut, notowania giełdowe i inne dane rynkowe pobierane są z publicznie dostępnych źródeł zewnętrznych (np. NBP, Stooq, Yahoo Finance) wyłącznie w celach informacyjnych — Usługodawca nie gwarantuje ich aktualności ani dokładności i nie ponosi odpowiedzialności za decyzje finansowe podjęte na ich podstawie.',
            )}
          </p>
          <p>
            {t(
              'Żadna treść w Usłudze, w tym artykuły publikowane w dziale redakcyjnym ani wyniki kalkulatora inwestycyjnego, nie stanowi rekomendacji inwestycyjnej ani porady finansowej, prawnej lub podatkowej w rozumieniu obowiązujących przepisów.',
            )}
          </p>
        </Section>

        <Section title="3. Warunki korzystania i rejestracja">
          <ul className="list-disc space-y-1 pl-5">
            <li>{t('Z Usługi może korzystać wyłącznie osoba pełnoletnia, posiadająca pełną zdolność do czynności prawnych.')}</li>
            <li>{t('Rejestracja wymaga ważnego, nieużytego i nieprzeterminowanego Zaproszenia.')}</li>
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
              'Użytkownik odpowiada za prawdziwość i poprawność danych finansowych, które samodzielnie wprowadza do Usługi — Usługodawca nie weryfikuje ich zgodności ze stanem faktycznym.',
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
              'Zaproszenia osobiste są jednorazowe, imienne lub bezimienne, i tracą ważność po upływie określonego czasu od wygenerowania. Zaproszenia grupowe (link lub kod QR na określoną liczbę osób) tworzone są przez administratora lub osoby do tego uprawnione i posiadają własny limit miejsc oraz datę ważności ustaloną przy tworzeniu.',
            )}
          </p>
          <p>
            {t(
              'Zaproszeniami nie wolno handlować ani udostępniać ich publicznie bez zgody Usługodawcy. Usługodawca zastrzega sobie prawo do unieważnienia Zaproszenia przed jego wykorzystaniem.',
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

        <Section title="7. Dostępność i ograniczenie odpowiedzialności">
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

        <Section title="8. Własność intelektualna">
          <p>
            {t(
              'Kod źródłowy, wygląd, nazwa, logo i treści redakcyjne publikowane w Usłudze stanowią własność Usługodawcy lub są wykorzystywane na podstawie odpowiednich licencji i podlegają ochronie prawnoautorskiej. Dane finansowe wprowadzone przez Użytkownika pozostają jego własnością — Usługodawca wykorzystuje je wyłącznie w celu świadczenia Usługi, zgodnie z Polityką prywatności.',
            )}
          </p>
        </Section>

        <Section title="9. Zawieszenie i usunięcie konta">
          <p>
            {t(
              'Usługodawca może zawiesić (zablokować logowanie) lub zarchiwizować Konto Użytkownika w przypadku naruszenia Regulaminu, próby nieautoryzowanego dostępu lub działania na szkodę Usługi bądź innych Użytkowników. Archiwizacja oznacza dezaktywację Konta z zachowaniem danych, nie ich usunięcie.',
            )}
          </p>
          <p>
            {t(
              'Użytkownik może w każdej chwili zrezygnować z korzystania z Usługi i zażądać usunięcia swojego Konta oraz danych, kontaktując się z Usługodawcą — zgodnie z zasadami opisanymi w Polityce prywatności.',
            )}
          </p>
        </Section>

        <Section title="10. Reklamacje">
          <p>
            {t(
              'Reklamacje dotyczące działania Usługi można zgłaszać na adres e-mail podany w sekcji „Kontakt" lub za pomocą widgetu „Zostaw feedback" w aplikacji. Usługodawca rozpatruje zgłoszenia w miarę możliwości najszybciej, jak to praktycznie wykonalne.',
            )}
          </p>
        </Section>

        <Section title="11. Zmiany Regulaminu">
          <p>
            {t(
              'Usługodawca zastrzega sobie prawo do zmiany Regulaminu, w szczególności w związku z rozwojem funkcjonalności Usługi lub zmianą przepisów prawa. O istotnych zmianach Użytkownicy zostaną poinformowani odpowiednim komunikatem w Usłudze. Data ostatniej aktualizacji widoczna jest na górze tej strony.',
            )}
          </p>
        </Section>

        <Section title="12. Postanowienia końcowe">
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
