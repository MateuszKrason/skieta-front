export interface TourStep {
  id: string
  /** data-tour attribute value to spotlight; omit for a centered card (welcome/finish). */
  target?: string
  /** Route to navigate to before showing this step, if not already there. */
  path?: string
  title: string
  body: string
  /** Only include this step if the user has this feature-interest toggle on. */
  interest?: 'interest_stocks' | 'interest_budget' | 'interest_planning' | 'interest_analysis'
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Witaj w skieta!',
    body: 'Krótko oprowadzimy Cię po aplikacji - kilkanaście sekund. W każdej chwili możesz pominąć przewodnik.',
  },
  {
    id: 'nav-dashboard',
    target: 'nav-dashboard',
    path: '/dashboard',
    title: 'Dashboard',
    body: 'Twój punkt startowy - szybki podgląd całego majątku, jego zmiany w czasie i bieżącego budżetu.',
  },
  {
    id: 'dashboard-chart',
    target: 'dashboard-chart',
    path: '/dashboard',
    title: 'Wartość majątku w czasie',
    body: 'Ten wykres liczy się sam, na podstawie kont, inwestycji i lokat, które dodasz w aplikacji - nie trzeba nic samemu wyliczać.',
  },
  {
    id: 'dashboard-realny-zwrot',
    target: 'dashboard-realny-zwrot',
    path: '/dashboard',
    title: 'Realny zwrot',
    body: 'Tu sprawdzisz, ile z Twojego majątku to realny zysk, a ile to pieniądze, które sam(a) wpłaciłeś(-aś) - z pełną historią wpłat/wypłat.',
  },
  {
    id: 'nav-budzet',
    target: 'nav-budzet',
    path: '/budzet/bilans',
    title: 'Budżet',
    body: 'Przychody i wydatki, podział na kategorie, trendy w czasie i ciekawe statystyki.',
    interest: 'interest_budget',
  },
  {
    id: 'budzet-add',
    target: 'budzet-add-tx',
    path: '/budzet/bilans',
    title: 'Dodawanie transakcji',
    body: 'Stąd dodasz przychód lub wydatek. Cały wyciąg z banku (PDF) zaimportujesz od razu w zakładce Kategorie.',
    interest: 'interest_budget',
  },
  {
    // Straight after "how to add a transaction", because it is the same job
    // done faster - and this button is the one thing in the app a new user is
    // least likely to find on their own, being an icon in the top bar rather
    // than something on the page they happen to be reading.
    id: 'scan-receipt',
    target: 'header-scan-receipt',
    path: '/budzet/wydatki',
    title: 'Najszybciej: zdjęcie paragonu',
    body: 'Zamiast wpisywać wydatek ręcznie, zrób paragonowi zdjęcie telefonem. skieta odczyta kwotę, datę i sklep oraz zaproponuje kategorię. Przycisk jest na górnym pasku, więc masz go pod ręką na każdej stronie.',
    interest: 'interest_budget',
  },
  {
    id: 'nav-konta',
    target: 'nav-konta',
    path: '/konta',
    title: 'Konta i lokaty',
    body: 'Konta bankowe, lokaty terminowe i obligacje skarbowe - podstawa, na której liczy się cały Twój majątek.',
  },
  {
    id: 'nav-gielda',
    target: 'nav-gielda',
    path: '/gielda/portfel',
    title: 'Giełda',
    body: 'Portfel akcji i ETF-ów z automatyczną wyceną, dywidendami, statystykami i (opcjonalnie) kryptowalutami.',
    interest: 'interest_stocks',
  },
  {
    id: 'gielda-add',
    target: 'gielda-add-tx',
    path: '/gielda/portfel',
    title: 'Dodawanie transakcji',
    body: 'Zarejestruj kupno akcji - bieżący kurs, zysk i podatek Belki policzą się same.',
    interest: 'interest_stocks',
  },
  {
    id: 'nav-planowanie',
    target: 'nav-planowanie',
    path: '/planowanie',
    title: 'Planowanie',
    body: 'Pensja, stałe koszty miesięczne, cele oszczędnościowe i nadchodzące większe wydatki - wszystko w jednym miejscu.',
    interest: 'interest_planning',
  },
  {
    id: 'nav-analiza',
    target: 'nav-analiza',
    path: '/analiza',
    title: 'Analiza',
    body: 'Kalkulator inwestycyjny - zasymuluj, jak Twój kapitał może urosnąć przy regularnym oszczędzaniu.',
    interest: 'interest_analysis',
  },
  {
    id: 'add-positions',
    target: 'header-add-positions',
    path: '/dashboard',
    title: 'Od czego zacząć',
    body: 'Kliknij tutaj, żeby dodać konto bankowe, a jeśli je masz - także akcje, lokaty i obligacje. Od razu zobaczysz swój prawdziwy stan, zamiast zaczynać od zera.',
  },
  {
    id: 'finish',
    title: 'To wszystko!',
    body: 'Do tego przewodnika zawsze wrócisz z ustawień konta. Powodzenia!',
  },
]
