// Flat PL -> DE dictionary. Keys are the original Polish UI strings (used verbatim as
// fallback when no translation exists, and as the string shown when language === 'pl').
// Use {0}, {1}, ... placeholders for dynamic values passed as extra args to t().
export const de: Record<string, string> = {
  // Layout / nav
  'Giełda': 'Börse',
  'Konta i lokaty': 'Konten & Festgelder',
  'Analiza': 'Analyse',
  'Dodaj posiadane konta, akcje, lokaty lub obligacje': 'Füge deine Konten, Aktien, Festgelder oder Anleihen hinzu',
  '+ Dodaj pozycje': '+ Positionen hinzufügen',
  'Zmień język interfejsu': 'Sprache der Oberfläche ändern',
  'Przełącz na jasny motyw': 'Zum hellen Design wechseln',
  'Przełącz na ciemny motyw': 'Zum dunklen Design wechseln',
  'Wyloguj': 'Abmelden',
  'Menu': 'Menü',

  // Login / Register
  'Nieprawidłowy login lub hasło.': 'Ungültiger Benutzername oder ungültiges Passwort.',
  'Zaloguj się do swojego portfela finansowego': 'Melde dich bei deinem Finanzportfolio an',
  'Login': 'Benutzername',
  'Imię': 'Vorname',
  'Nazwisko': 'Nachname',
  'Hasło': 'Passwort',
  'Logowanie…': 'Anmeldung…',
  'Zaloguj się': 'Anmelden',
  'Nie masz konta?': 'Noch kein Konto?',
  'Zarejestruj się': 'Registrieren',
  'Nie udało się zarejestrować.': 'Registrierung fehlgeschlagen.',
  'Załóż konto i zacznij śledzić swój majątek': 'Erstelle ein Konto und beginne, dein Vermögen zu verfolgen',
  'Tworzenie konta…': 'Konto wird erstellt…',
  'Masz już konto?': 'Hast du schon ein Konto?',
  'Zapomniałeś hasła?': 'Passwort vergessen?',
  '← Powrót do logowania': '← Zurück zur Anmeldung',
  'Adres e-mail': 'E-Mail-Adresse',
  'Wysyłanie…': 'Wird gesendet…',
  'Podaj adres e-mail przypisany do konta — wyślemy link do resetu hasła.':
    'Gib die mit deinem Konto verknüpfte E-Mail-Adresse ein — wir senden dir einen Link zum Zurücksetzen des Passworts.',
  'Jeśli podany adres e-mail istnieje w naszej bazie, wysłaliśmy na niego link do resetu hasła.':
    'Falls diese E-Mail-Adresse in unserem System existiert, haben wir einen Link zum Zurücksetzen des Passworts dorthin gesendet.',
  'Wyślij link do resetu': 'Reset-Link senden',
  'Link resetu hasła jest niepełny — otwórz go bezpośrednio z wiadomości e-mail.':
    'Dieser Link zum Zurücksetzen des Passworts ist unvollständig — öffne ihn direkt aus der E-Mail.',
  'Hasło zostało zresetowane. Przekierowuję do logowania…': 'Passwort wurde zurückgesetzt. Du wirst zur Anmeldung weitergeleitet…',
  'Ustaw nowe hasło do swojego konta.': 'Lege ein neues Passwort für dein Konto fest.',
  'Zapisywanie…': 'Wird gespeichert…',
  'Ustaw nowe hasło': 'Neues Passwort festlegen',
  'Nie udało się zresetować hasła.': 'Das Passwort konnte nicht zurückgesetzt werden.',
  'Weryfikuję adres e-mail…': 'E-Mail-Adresse wird überprüft…',
  'Brak tokenu weryfikacyjnego w linku.': 'Diesem Link fehlt ein Verifizierungstoken.',
  'Nie udało się potwierdzić adresu e-mail.': 'Die E-Mail-Adresse konnte nicht bestätigt werden.',
  'Przejdź do aplikacji →': 'Zur App →',
  'Adres e-mail nie jest jeszcze potwierdzony': 'Deine E-Mail-Adresse ist noch nicht bestätigt',
  'Wysłano nowy link weryfikacyjny — sprawdź skrzynkę.': 'Ein neuer Bestätigungslink wurde gesendet — schau in dein Postfach.',
  'Sprawdź skrzynkę i kliknij link, który wysłaliśmy przy rejestracji.':
    'Schau in dein Postfach und klicke auf den Link, den wir dir bei der Registrierung gesendet haben.',
  'Dodaj adres e-mail poniżej, żeby móc go potwierdzić i odzyskać konto w razie potrzeby.':
    'Füge unten eine E-Mail-Adresse hinzu, damit du sie bestätigen und dein Konto bei Bedarf wiederherstellen kannst.',
  'Wyślij link ponownie': 'Link erneut senden',

  // Onboarding wizard
  'Konta': 'Konten',
  'Akcje': 'Aktien',
  'Lokaty': 'Festgelder',
  'Obligacje': 'Anleihen',
  'Gotowe': 'Fertig',
  'Dodaj posiadane rzeczy': 'Füge hinzu, was du besitzt',
  'Wprowadź to, co już posiadasz — z prawdziwą, wsteczną datą zakupu — żeby historia i zyski liczyły się poprawnie od początku.':
    'Trage ein, was du bereits besitzt — mit dem echten, rückwirkenden Kaufdatum — damit Verlauf und Gewinne von Anfang an korrekt berechnet werden.',
  'Zakończ teraz →': 'Jetzt abschließen →',
  'Gotowe!': 'Fertig!',
  'Możesz w każdej chwili dodać kolejne rzeczy z tego samego kreatora — link znajdziesz w górnym menu.':
    'Du kannst jederzeit über denselben Assistenten weitere Dinge hinzufügen — den Link findest du im oberen Menü.',
  'Przejdź do pulpitu': 'Zum Dashboard',
  '← Wstecz': '← Zurück',
  'Dalej →': 'Weiter →',
  'Bank': 'Bank',
  'Nazwa konta': 'Kontoname',
  'Typ': 'Typ',
  'Osobiste': 'Privat',
  'Oszczędnościowe': 'Sparkonto',
  'Maklerskie': 'Depot',
  'Firmowe': 'Geschäftlich',
  'Kryptowalutowe': 'Krypto',
  'osobiste': 'privat',
  'oszczędnościowe': 'Sparkonto',
  'maklerskie': 'Depot',
  'firmowe': 'geschäftlich',
  'kryptowalutowe': 'Krypto',
  'Waluta': 'Währung',
  'Obecne saldo': 'Aktueller Kontostand',
  '+ Dodaj konto': '+ Konto hinzufügen',
  'Nie masz jeszcze żadnego konta z gotówką na zakup akcji? Dodaj je tutaj z aktualnym saldem — w kolejnym kroku możesz z niego "kupić" akcje, które faktycznie posiadasz.':
    'Hast du noch kein Konto mit Bargeld für Aktienkäufe? Füge es hier mit dem aktuellen Kontostand hinzu — im nächsten Schritt kannst du damit die Aktien "kaufen", die du bereits besitzt.',
  'Wyszukaj spółkę': 'Aktie suchen',
  'Ticker': 'Ticker',
  'Rynek': 'Markt',
  'Ilość': 'Menge',
  'Cena zakupu/szt.': 'Kaufpreis/Stück',
  'Data zakupu (wstecz)': 'Kaufdatum (rückwirkend)',
  'Konto': 'Konto',
  '+ Dodaj pozycję': '+ Position hinzufügen',
  'Dla każdej posiadanej spółki podaj ilość, cenę i': 'Gib für jede Aktie, die du besitzt, die Menge, den Preis und',
  'prawdziwą datę zakupu': 'das echte Kaufdatum an',
  '— dzięki temu historia i wykresy będą liczone poprawnie.': '— so werden Verlauf und Diagramme korrekt berechnet.',
  'Nie udało się dodać pozycji.': 'Die Position konnte nicht hinzugefügt werden.',
  'Wybierz spółkę.': 'Wähle eine Aktie aus.',
  'Jeśli wybierzesz konto, kwota zostanie od razu odjęta z jego salda — zostaw puste, jeśli tylko deklarujesz akcje, które już posiadasz.':
    'Wenn du ein Konto auswählst, wird der Betrag sofort von dessen Saldo abgezogen — lass das Feld leer, wenn du nur Aktien angibst, die du bereits besitzt.',
  'To pozycja, którą już posiadam — nie odejmuj środków z konta (tylko zapisz powiązanie).':
    'Das ist eine Position, die ich bereits besitze — kein Geld vom Konto abziehen (nur die Verknüpfung speichern).',
  'To lokata, którą już posiadam — nie odejmuj środków z konta (tylko zapisz powiązanie).':
    'Das ist ein Festgeld, das ich bereits besitze — kein Geld vom Konto abziehen (nur die Verknüpfung speichern).',
  'To obligacja, którą już posiadam — nie odejmuj środków z konta (tylko zapisz powiązanie).':
    'Das ist eine Anleihe, die ich bereits besitze — kein Geld vom Konto abziehen (nur die Verknüpfung speichern).',
  'bez powiązania z kontem': 'ohne Kontoverknüpfung',
  'Nie dodano jeszcze żadnych akcji.': 'Du hast noch keine Aktien hinzugefügt.',
  'wybierz…': 'auswählen…',
  'Powiąż z kontem (opcjonalnie)': 'Mit Konto verknüpfen (optional)',
  'Kwota': 'Betrag',
  'Oprocentowanie (%)': 'Zinssatz (%)',
  'Data założenia': 'Eröffnungsdatum',
  'Data zakończenia': 'Enddatum',
  'bez powiązania': 'ohne Verknüpfung',
  '+ Dodaj lokatę': '+ Festgeld hinzufügen',
  'Masz aktywną lokatę? Dodaj ją tutaj (opcjonalnie).': 'Hast du ein aktives Festgeld? Füge es hier hinzu (optional).',
  'Seria': 'Serie',
  'Wartość nominalna': 'Nennwert',
  'Wartość obecna': 'Aktueller Wert',
  'Bieżące oprocentowanie (%)': 'Aktueller Zinssatz (%)',
  'Data zakupu': 'Kaufdatum',
  'Data wykupu': 'Fälligkeitsdatum',
  '+ Dodaj obligację': '+ Anleihe hinzufügen',
  'Masz obligacje skarbowe? Dodaj je tutaj (opcjonalnie).': 'Hast du Staatsanleihen? Füge sie hier hinzu (optional).',

  // Dashboard
  'Ładowanie…': 'Wird geladen…',
  'Gotówka': 'Bargeld',
  'Podsumowanie Twojego majątku, aktualizowane na bieżąco': 'Eine live aktualisierte Übersicht deines Vermögens',
  'Odświeżono {0}s temu (auto co 60s)': 'Aktualisiert vor {0}s (automatisch alle 60s)',
  '⟳ Odśwież teraz': '⟳ Jetzt aktualisieren',
  'Wartość majątku': 'Nettovermögen',
  'Zmiana wartości majątku': 'Änderung des Nettovermögens',
  '1 dzień': '1 Tag',
  '1 tydzień': '1 Woche',
  '1 miesiąc': '1 Monat',
  'Od początku roku': 'Seit Jahresbeginn',
  '1 rok': '1 Jahr',
  '5 lat': '5 Jahre',
  'brak danych': 'keine Daten',
  'Przychody i wydatki (ten miesiąc)': 'Einnahmen & Ausgaben (dieser Monat)',
  'Zobacz pełną analizę →': 'Vollständige Analyse ansehen →',
  'Przychody': 'Einnahmen',
  'Wydatki': 'Ausgaben',
  'Bilans': 'Bilanz',
  'Wartość majątku w czasie': 'Nettovermögen im Zeitverlauf',
  'Podział majątku': 'Vermögensaufteilung',
  'Realny zwrot': 'Reale Rendite',
  'Wpłacone środki': 'Eingezahltes Kapital',
  'Zysk / strata': 'Gewinn / Verlust',
  'Zarobione odsetki': 'Verdiente Zinsen',
  'Na lokatach': 'Auf Festgeldern',
  'Na obligacjach': 'Auf Anleihen',

  // Banking
  'OTS – 3-miesięczne': 'OTS – 3 Monate',
  'ROR – roczne, zmienne': 'ROR – 1 Jahr, variabel',
  'DOR – 2-letnie, zmienne': 'DOR – 2 Jahre, variabel',
  'TOS – 3-letnie, stałoprocentowe': 'TOS – 3 Jahre, Festzins',
  'COI – 4-letnie, indeksowane inflacją': 'COI – 4 Jahre, inflationsindexiert',
  'EDO – 10-letnie, indeksowane inflacją': 'EDO – 10 Jahre, inflationsindexiert',
  'ROS – rodzinne oszczędnościowe': 'ROS – Familiensparen',
  'ROD – rodzinne, indeksowane inflacją': 'ROD – Familie, inflationsindexiert',
  'Inne': 'Sonstige',
  'Usunąć konto "{0}" ({1})? Tej operacji nie można cofnąć.': 'Konto "{0}" ({1}) löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.',
  'Konta bankowe': 'Bankkonten',
  'Konta bankowe łącznie': 'Bankkonten gesamt',
  'Lokaty łącznie': 'Festgelder gesamt',
  'Obligacje łącznie': 'Anleihen gesamt',
  'Suma kapitału': 'Gesamtkapital',
  'Suma wartości nominalnej': 'Gesamter Nennwert',
  'Potrzebujesz co najmniej dwóch kont': 'Du brauchst mindestens zwei Konten',
  '⇄ Przelew': '⇄ Überweisung',
  '+ Konto': '+ Konto',
  'Edytuj': 'Bearbeiten',
  'Usuń': 'Löschen',
  'Brak kont — dodaj pierwsze.': 'Noch keine Konten — füge dein erstes hinzu.',
  'Historia przelewów': 'Überweisungsverlauf',
  '+ Lokata': '+ Festgeld',
  'Oprocentowanie': 'Zinssatz',
  'Koniec': 'Ende',
  'Już zarobiono': 'Bisher verdient',
  'Szac. na koniec': 'Geschätzt bei Fälligkeit',
  'Status': 'Status',
  'Operacje': 'Aktionen',
  'aktywna': 'aktiv',
  'zamknięta': 'geschlossen',
  'Zerwij': 'Auflösen',
  'Brak lokat.': 'Keine Festgelder.',
  'Obligacje skarbowe': 'Staatsanleihen',
  '+ Obligacja': '+ Anleihe',
  'Odsetki liczone metodą uproszczoną (proste, wg wpisanego bieżącego oprocentowania) — nie odwzorowuje dokładnie zmiennych/indeksowanych inflacją harmonogramów kapitalizacji poszczególnych serii.':
    'Die Zinsen werden mit einer vereinfachten Methode berechnet (einfache Verzinsung mit dem eingegebenen aktuellen Zinssatz) — dies bildet die variablen/inflationsindexierten Verzinsungspläne der einzelnen Serien nicht exakt ab.',
  'Wykup': 'Fälligkeit',
  'wykupiona': 'eingelöst',
  'Wykup wcześniej': 'Vorzeitig einlösen',
  'Brak obligacji.': 'Keine Anleihen.',
  'Zapisz zmiany': 'Änderungen speichern',
  'Dodaj konto': 'Konto hinzufügen',
  'Konto źródłowe i docelowe muszą być różne.': 'Quell- und Zielkonto müssen unterschiedlich sein.',
  'Nie udało się wykonać przelewu.': 'Die Überweisung ist fehlgeschlagen.',
  'Wykonaj przelew': 'Überweisung ausführen',
  'Zerwać lokatę i przelać {0} odsetek + kapitał na wybrane konto?': 'Festgeld auflösen und {0} Zinsen + Kapital auf das gewählte Konto überweisen?',
  'Wypłata: kapitał': 'Auszahlung: Kapital',
  'odsetki': 'Zinsen',
  'bez prowizji': 'ohne Gebühr',
  'Potwierdź zerwanie': 'Auflösung bestätigen',
  'Nie udało się zerwać lokaty.': 'Das Festgeld konnte nicht aufgelöst werden.',
  'Wybierz konto, na które mają wrócić środki.': 'Wähle das Konto, auf das die Mittel zurückfließen sollen.',
  'Na koniec okresu': 'Am Ende der Laufzeit',
  'Miesięczna': 'Monatlich',
  'Dodaj lokatę': 'Festgeld hinzufügen',
  'Jeśli wybierzesz konto, kwota lokaty zostanie od razu odjęta z jego salda.': 'Wenn du ein Konto auswählst, wird der Festgeldbetrag sofort von dessen Saldo abgezogen.',
  'Dodaj obligację': 'Anleihe hinzufügen',
  'Wykupić obligację wcześniej i przelać {0} odsetek + kapitał na wybrane konto?': 'Anleihe vorzeitig einlösen und {0} Zinsen + Kapital auf das gewählte Konto überweisen?',
  'Nie udało się wykupić obligacji.': 'Die Anleihe konnte nicht eingelöst werden.',
  'Potwierdź wykup': 'Einlösung bestätigen',

  // Timeline
  'Timeline majątku': 'Vermögens-Timeline',
  'Sprawdź, jak realnie pomnożyłeś wpłacone środki — niezależnie od tego, ile do systemu dołożyłeś':
    'Sieh, wie stark sich dein eingezahltes Kapital tatsächlich vermehrt hat — unabhängig davon, wie viel du eingezahlt hast',
  '+ Wpłata / wypłata': '+ Einzahlung / Auszahlung',
  'Obecna wartość majątku': 'Aktuelles Nettovermögen',
  'Wpłacone środki netto': 'Netto eingezahltes Kapital',
  'Realny zysk (pomnożenie)': 'Realer Gewinn (Multiplikator)',
  'Historia wpłat / wypłat': 'Einzahlungs-/Auszahlungsverlauf',
  'Wpłata': 'Einzahlung',
  'Wypłata': 'Auszahlung',
  'Brak wpłat/wypłat.': 'Keine Ein-/Auszahlungen.',
  'Data': 'Datum',
  'Notatka': 'Notiz',
  'Zapisz': 'Speichern',

  // Account
  'Moje konto': 'Mein Konto',
  'Zaloguj jako {0}': 'Angemeldet als {0}',
  'Nie udało się zapisać zmian.': 'Die Änderungen konnten nicht gespeichert werden.',
  'Dane konta': 'Kontodaten',
  'Nazwa użytkownika': 'Benutzername',
  'E-mail': 'E-Mail',
  'Zapisano zmiany.': 'Änderungen gespeichert.',
  'Zapisz dane': 'Daten speichern',
  'Nie udało się zmienić hasła.': 'Das Passwort konnte nicht geändert werden.',
  'Nowe hasła nie są takie same.': 'Die neuen Passwörter stimmen nicht überein.',
  'Zmiana hasła': 'Passwort ändern',
  'Bieżące hasło': 'Aktuelles Passwort',
  'Nowe hasło': 'Neues Passwort',
  'Powtórz nowe hasło': 'Neues Passwort wiederholen',
  'Hasło zostało zmienione.': 'Passwort wurde geändert.',
  'Zmień hasło': 'Passwort ändern',

  // Sub-nav
  'Portfel': 'Portfolio',
  'Dywidendy': 'Dividenden',
  'Analiza spółek': 'Aktienanalyse',

  // Portfel
  'Anuluj': 'Abbrechen',
  'Portfel akcji i ETF-ów': 'Aktien- & ETF-Portfolio',
  'Suma wartości akcji': 'Gesamtwert der Aktien',
  'Łączny zysk/strata': 'Gesamtgewinn/-verlust',
  'Kursy odświeżają się przy wejściu na tę stronę — kliknij "Odśwież kursy", by pobrać je ponownie':
    'Die Kurse werden beim Aufrufen dieser Seite aktualisiert — klicke auf "Kurse aktualisieren", um sie erneut abzurufen',
  '⟳ Odśwież kursy': '⟳ Kurse aktualisieren',
  'Notatki': 'Notizen',
  '(odświeżanie…)': '(wird aktualisiert…)',
  '+ Nowa spółka': '+ Neue Aktie',
  '+ Kupno': '+ Kauf',
  'Spółka': 'Aktie',
  'Śr. cena zakupu': 'Ø Kaufpreis',
  'Cena bieżąca': 'Aktueller Preis',
  'Wartość': 'Wert',
  'Zysk/strata': 'Gewinn/Verlust',
  'Aktualizacja': 'Aktualisiert',
  'Sprzedaj': 'Verkaufen',
  'Brak pozycji — dodaj pierwszą transakcję.': 'Keine Positionen — füge deine erste Transaktion hinzu.',
  'Historia transakcji': 'Transaktionsverlauf',
  'Kupno': 'Kauf',
  'Sprzedaż': 'Verkauf',
  'Brak transakcji.': 'Keine Transaktionen.',
  'Dodaj spółkę': 'Aktie hinzufügen',
  'Nie udało się zapisać transakcji.': 'Die Transaktion konnte nicht gespeichert werden.',
  'Wybierz konto, z którego pobrane zostaną środki.': 'Wähle das Konto, von dem die Mittel abgebucht werden.',
  'wybierz konto…': 'Konto auswählen…',
  'Brak konta w walucie {0} — dodaj je w zakładce Konta i lokaty.': 'Kein Konto in {0} — füge eines im Tab Konten & Festgelder hinzu.',
  'Zapisz kupno': 'Kauf speichern',
  'Nie udało się sprzedać akcji.': 'Der Verkauf der Aktie ist fehlgeschlagen.',
  'Posiadasz tylko {0} szt.': 'Du besitzt nur {0} Stück.',
  'posiadasz': 'du besitzt',
  'szt.': 'Stück',
  'Szac. wpływ:': 'Geschätzter Erlös:',
  'Potwierdź sprzedaż': 'Verkauf bestätigen',

  // ReinvestmentThreads
  'Start': 'Start',
  'Niezainwestowane': 'Nicht investiert',
  'Obecna wartość': 'Aktueller Wert',
  'Niezainwestowany kapitał': 'Nicht investiertes Kapital',
  'Ścieżki reinwestycji': 'Reinvestitionspfade',
  '+ Nowa ścieżka': '+ Neuer Pfad',
  'Śledź, do ilu pomnożyła się konkretna kwota — np. zysk ze sprzedaży jednej spółki rozdzielony na kilka kolejnych zakupów, z opcjonalną dodatkową gotówką i niezainwestowaną resztą.':
    'Verfolge, wie stark sich ein bestimmter Betrag vermehrt hat — z. B. der Erlös aus dem Verkauf einer Aktie, aufgeteilt auf mehrere Folgekäufe, mit optionalem zusätzlichem Bargeld und nicht investiertem Restbetrag.',
  'Brak ścieżek — utwórz pierwszą.': 'Noch keine Pfade — erstelle deinen ersten.',
  'Usunąć całą ścieżkę „{0}”? Tej operacji nie można cofnąć.': 'Den gesamten Pfad „{0}" löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.',
  'Start:': 'Start:',
  'Usuń ścieżkę': 'Pfad löschen',
  'Niezainwestowany kapitał początkowy:': 'Nicht investiertes Startkapital:',
  'Brak jeszcze żadnej pozycji w tej ścieżce.': 'Noch keine Position in diesem Pfad.',
  'Nie udało się usunąć pozycji.': 'Die Position konnte nicht gelöscht werden.',
  'Usunąć pozycję {0} z tej ścieżki?': 'Position {0} aus diesem Pfad löschen?',
  'wpłynęło': 'eingegangen',
  'sprzedano za': 'verkauft für',
  'niezainwestowane': 'nicht investiert',
  'obecna wartość': 'aktueller Wert',
  'Zamknij (sprzedano)': 'Schließen (verkauft)',
  'Utwórz ścieżkę': 'Pfad erstellen',
  'Kapitał początkowy ścieżki (dostępne: {0})': 'Startkapital des Pfads (verfügbar: {0})',
  'Ze sprzedaży {0} (dostępne: {1})': 'Aus dem Verkauf von {0} (verfügbar: {1})',
  'Dodatkowa gotówka': 'Zusätzliches Bargeld',
  'Dodatkowa gotówka (spoza ścieżki)': 'Zusätzliches Bargeld (außerhalb des Pfads)',
  'Wskaż co najmniej jedno źródło finansowania z kwotą większą od zera.': 'Gib mindestens eine Finanzierungsquelle mit einem Betrag größer als null an.',
  '+ Dodaj pozycję (reinwestycja)': '+ Position hinzufügen (Reinvestition)',
  'koszt': 'Kosten',
  'Źródła finansowania': 'Finanzierungsquellen',
  'Suma finansowania:': 'Gesamtfinanzierung:',
  'koszt zakupu:': 'Kaufkosten:',
  'Zapisz pozycję': 'Position speichern',
  'Nie udało się zamknąć pozycji.': 'Die Position konnte nicht geschlossen werden.',
  'auto: proporcjonalnie': 'automatisch: proportional',
  'Brak jeszcze transakcji sprzedaży tej spółki — dodaj ją najpierw w portfelu.': 'Noch keine Verkaufstransaktion für diese Aktie — füge sie zuerst im Portfolio hinzu.',
  'Zamknij pozycję': 'Position schließen',

  // Dywidendy
  'Profil dywidendowy': 'Dividendenprofil',
  'Ile zarabiasz na dywidendach i jaki to procent zainwestowanego kapitału': 'Wie viel du mit Dividenden verdienst und wie viel Prozent des investierten Kapitals das ausmacht',
  'Dywidendy wykrywane są automatycznie — nie musisz nic wpisywać ręcznie.':
    'Dividenden werden automatisch erkannt — du musst nichts manuell eintragen.',
  'wykrywam dywidendy…': 'Dividenden werden erkannt…',
  'Wykrywam…': 'Wird erkannt…',
  '⟳ Wykryj dywidendy': '⟳ Dividenden erkennen',
  'Automatyczne wykrywanie odświeża się samo przy wejściu na tę stronę — ten przycisk wymusza sprawdzenie od razu.':
    'Die automatische Erkennung aktualisiert sich beim Öffnen dieser Seite von selbst — dieser Button erzwingt eine sofortige Prüfung.',
  '+ Dywidenda': '+ Dividende',
  '+ Dodaj ręcznie': '+ Manuell hinzufügen',
  'Tylko dla wypłat, których automatyczne wykrywanie nie złapało (np. spółka spoza Yahoo Finance).':
    'Nur für Ausschüttungen, die die automatische Erkennung nicht erfasst hat (z. B. eine Aktie außerhalb von Yahoo Finance).',
  'Suma dywidend (wszystkie czasy)': 'Dividenden gesamt (alle Zeit)',
  'Projekcja rocznego dochodu (12 mies.)': 'Prognose des Jahreseinkommens (12 Mon.)',
  'Planowane dywidendy': 'Anstehende Dividenden',
  'Szacunek na podstawie historycznego rytmu wypłat tej spółki (ostatnia kwota + średni odstęp) — nie jest to oficjalna zapowiedź zarządu.':
    'Eine Schätzung basierend auf dem historischen Ausschüttungsrhythmus dieser Aktie (letzter Betrag + durchschnittlicher Abstand) — keine offizielle Ankündigung des Managements.',
  'ok.': 'ca.',
  'Dywidendy miesiąc do miesiąca': 'Dividenden Monat für Monat',
  'Udział spółek': 'Anteil je Aktie',
  'Brak danych.': 'Keine Daten.',
  'Suma dywidend narastająco (12 mies.)': 'Kumulierte Dividenden (12 Mon.)',
  'Suma dywidend narastająco ({0} mies.)': 'Kumulierte Dividenden ({0} Mon.)',
  '{0} lat': '{0} Jahre',
  'Suma dywidend': 'Dividenden gesamt',
  'Ostatnie 12 mies.': 'Letzte 12 Mon.',
  'Brak dywidend — dodaj pierwszą wypłatę.': 'Noch keine Dividenden — füge deine erste Ausschüttung hinzu.',
  'Historia wypłat': 'Ausschüttungsverlauf',
  'wykryta automatycznie': 'automatisch erkannt',
  'Brak wypłat.': 'Keine Ausschüttungen.',
  'Kwota/akcję': 'Betrag/Aktie',
  'Liczba akcji': 'Anzahl Aktien',
  'Kwota łącznie': 'Gesamtbetrag',
  'Data wypłaty': 'Auszahlungsdatum',
  'Zapisz dywidendę': 'Dividende speichern',

  // AnalizaSpolek
  'Komunikaty ESPI/EBI (GPW) i ważne newsy (USA) dla spółek z Twojego portfela — sprawdzane raz dziennie.':
    'ESPI/EBI-Meldungen (GPW) und wichtige Nachrichten (USA) für die Aktien in deinem Portfolio — einmal täglich geprüft.',
  'Sprawdzam…': 'Wird geprüft…',
  '⟳ Sprawdź teraz': '⟳ Jetzt prüfen',
  'Wszystkie spółki': 'Alle Aktien',
  'Pokaż tylko nowe': 'Nur neue anzeigen',
  'Nowe': 'Neu',
  'Brak komunikatów — kliknij „Sprawdź teraz” albo poczekaj na codzienne automatyczne sprawdzenie.':
    'Noch keine Meldungen — klicke auf „Jetzt prüfen” oder warte auf die tägliche automatische Prüfung.',

  // Budget shared
  'Ten miesiąc': 'Dieser Monat',
  'Poprzedni miesiąc': 'Letzter Monat',
  'Ten rok': 'Dieses Jahr',
  'Zakres własny': 'Eigener Zeitraum',
  'Bez kategorii': 'Ohne Kategorie',
  'Brak danych w tym okresie.': 'Keine Daten für diesen Zeitraum.',
  'wg kategorii — miesiąc do miesiąca': 'nach Kategorie — Monat für Monat',
  'Kliknij kategorię poniżej, aby zobaczyć konkretne transakcje w wybranym okresie.': 'Klicke unten auf eine Kategorie, um die zugehörigen Transaktionen im gewählten Zeitraum zu sehen.',
  'Transakcje w okresie': 'Transaktionen im Zeitraum',
  '+ Kategoria': '+ Kategorie',
  'Brak transakcji w tym okresie.': 'Keine Transaktionen in diesem Zeitraum.',
  'Wydatek': 'Ausgabe',
  'Przychód': 'Einnahme',
  'Dodaj kategorię': 'Kategorie hinzufügen',
  'Usunąć kategorię "{0}"? Powiązane transakcje zostaną oznaczone jako "Bez kategorii".': 'Kategorie "{0}" löschen? Zugehörige Transaktionen werden als "Ohne Kategorie" markiert.',
  'Kategorie': 'Kategorien',
  'Usuń kategorię': 'Kategorie löschen',
  'Brak kategorii.': 'Keine Kategorien.',
  'bez kategorii': 'ohne Kategorie',
  'bez sklepu': 'ohne Geschäft',
  'Jeśli wybierzesz konto, kwota od razu zmieni jego saldo.': 'Wenn du ein Konto auswählst, ändert sich dessen Saldo sofort um diesen Betrag.',
  'Usunąć sklep "{0}"? Powiązane transakcje zostaną oznaczone jako "Bez sklepu".': 'Geschäft "{0}" löschen? Zugehörige Transaktionen werden als "Ohne Geschäft" markiert.',
  'Sklepy': 'Geschäfte',
  '+ Dodaj sklep': '+ Geschäft hinzufügen',
  'Usuń sklep': 'Geschäft löschen',
  'Brak sklepów — dodaj pierwszy powyżej.': 'Noch keine Geschäfte — füge oben dein erstes hinzu.',
  'Wydatki wg sklepów': 'Ausgaben nach Geschäft',
  'Tylko transakcje, którym przypisano sklep. Kliknij sklep, aby zobaczyć jego transakcje.': 'Nur Transaktionen mit zugewiesenem Geschäft. Klicke auf ein Geschäft, um dessen Transaktionen zu sehen.',
  'Brak wydatków przypisanych do sklepów w tym okresie.': 'Keine Ausgaben mit zugewiesenem Geschäft in diesem Zeitraum.',
  'Bez sklepu': 'Ohne Geschäft',

  // Bilans / Przychody / Wydatki
  'Przychody i wydatki razem — podział na kategorie i trend w czasie': 'Einnahmen und Ausgaben zusammen — Aufschlüsselung nach Kategorie und Trend im Zeitverlauf',
  '+ Przychód / wydatek': '+ Einnahme / Ausgabe',
  'Przychody w okresie': 'Einnahmen im Zeitraum',
  'Wydatki w okresie': 'Ausgaben im Zeitraum',
  'Przychody i wydatki — ostatnie 12 miesięcy': 'Einnahmen & Ausgaben — letzte 12 Monate',
  'Przychody i wydatki w czasie': 'Einnahmen & Ausgaben im Zeitverlauf',
  'Słupki': 'Balken',
  'Linia': 'Linie',
  'Obszar': 'Fläche',
  '{0} mies.': '{0} Mon.',
  'Wybierz co najmniej jedną serię do wyświetlenia.': 'Wähle mindestens eine Serie zur Anzeige aus.',
  'Skumulowany bilans (oszczędności)': 'Kumulierte Bilanz (Ersparnisse)',
  'Suma miesięcznych bilansów narastająco — jak rósł Twój zaoszczędzony kapitał w tym okresie.':
    'Kumulierte Summe der monatlichen Bilanzen — wie dein Erspartes in diesem Zeitraum gewachsen ist.',
  'Wydatki wg tagów': 'Ausgaben nach Tag',
  'Przychody wg tagów': 'Einnahmen nach Tag',
  'Tylko transakcje z co najmniej jednym tagiem — transakcja z kilkoma tagami liczy się do każdego z nich.':
    'Nur Transaktionen mit mindestens einem Tag — eine Transaktion mit mehreren Tags zählt zu jedem davon.',
  'Brak transakcji z tagami w tym okresie.': 'Keine getaggten Transaktionen in diesem Zeitraum.',
  'Bez tagu': 'Ohne Tag',
  'Skąd biorą się Twoje przychody i jak zmieniają się w czasie': 'Woher deine Einnahmen kommen und wie sie sich im Zeitverlauf ändern',
  '+ Przychód': '+ Einnahme',
  'Przychody: {0}': 'Einnahmen: {0}',
  'Wydatki: {0}': 'Ausgaben: {0}',
  'Wydatki w wybranym sklepie': 'Ausgaben im gewählten Geschäft',
  'Na co wydajesz i jak zmienia się to w czasie': 'Wofür du Geld ausgibst und wie sich das im Zeitverlauf ändert',
  '+ Wydatek': '+ Ausgabe',
  'Wydatki wg kategorii': 'Ausgaben nach Kategorie',
  'Przychody wg kategorii': 'Einnahmen nach Kategorie',

  // StockAutocomplete
  'Szukaj spółki (np. Apple, CD Projekt)…': 'Aktie suchen (z. B. Apple, CD Projekt)…',
  'Szukam…': 'Wird gesucht…',
  'Brak wyników.': 'Keine Ergebnisse.',

  // Page titles
  'Logowanie': 'Anmeldung',
  'Rejestracja': 'Registrierung',

  // Form field labels (Field label="…" props, translated by the shared Field component)
  'Nazwa ścieżki': 'Pfadname',
  'Kwota początkowa': 'Startbetrag',
  'Data startu': 'Startdatum',
  'Opis (opcjonalnie)': 'Beschreibung (optional)',
  'Transakcja kupna': 'Kauftransaktion',
  'Transakcja sprzedaży': 'Verkaufstransaktion',
  'Kwota zrealizowana (opcjonalnie)': 'Realisierter Betrag (optional)',
  'Nazwa kategorii': 'Kategoriename',
  'Kategoria': 'Kategorie',
  'Sklep (opcjonalnie)': 'Geschäft (optional)',
  'Konto (opcjonalnie)': 'Konto (optional)',
  'Saldo': 'Saldo',
  'Z konta': 'Von Konto',
  'Na konto': 'Auf Konto',
  'Środki z konta': 'Mittel von Konto',
  'Data rozpoczęcia': 'Startdatum',
  'Kapitalizacja': 'Verzinsungsintervall',
  'Konto docelowe': 'Zielkonto',
  'Typ obligacji': 'Anleihetyp',
  'Seria (opcjonalnie)': 'Serie (optional)',
  'Nazwa': 'Name',
  'Cena/szt.': 'Preis/Stück',
  'Prowizja': 'Gebühr',
  'Ilość (max)': 'Menge (max.)',
  'Środki na konto': 'Mittel auf Konto',

  // Stock manager
  'Zarządzaj spółkami': 'Aktien verwalten',
  'Nie udało się usunąć spółki.': 'Die Aktie konnte nicht gelöscht werden.',
  'Usunąć spółkę {0} ({1})?': 'Aktie {0} ({1}) löschen?',
  'Przesuń w górę': 'Nach oben verschieben',
  'Przesuń w dół': 'Nach unten verschieben',
  'Brak spółek.': 'Keine Aktien.',

  // Transaction category/store/tag editing
  'Kategoria/sklep/tagi': 'Kategorie/Geschäft/Tags',
  'Tagi (opcjonalnie)': 'Tags (optional)',
  'Tagi': 'Tags',
  'Kliknij tag, aby filtrować transakcje.': 'Klicke auf einen Tag, um Transaktionen zu filtern.',
  '+ Dodaj tag': '+ Tag hinzufügen',
  'Usunąć tag "{0}"?': 'Tag "{0}" löschen?',
  'Usuń tag': 'Tag löschen',
  'Brak tagów — dodaj pierwszy powyżej.': 'Noch keine Tags — füge oben deinen ersten hinzu.',

  // Belka tax P/L
  'Po podatku od zysków kapitałowych (19%)': 'Nach Kapitalertragsteuer (19%)',
  'Zysk/strata po Belce': 'Gewinn/Verlust nach Steuer',

  // Planning
  'Planowanie': 'Planung',
  'Planowanie budżetu': 'Budgetplanung',
  'Twoja pensja, oszczędności, nadchodzące duże wydatki i cele, na które odkładasz.':
    'Dein Gehalt, deine Ersparnisse, anstehende große Ausgaben und die Ziele, auf die du sparst.',
  'Pensja miesięczna': 'Monatsgehalt',
  'Śr. wydatki (3 mies.)': 'Ø Ausgaben (3 Mon.)',
  'Wolny budżet / mies.': 'Freies Budget / Mon.',
  'Oszczędności (konta)': 'Ersparnisse (Konten)',
  'Zarezerwowano na cele': 'Für Ziele reserviert',
  'Cele oszczędnościowe': 'Sparziele',
  '+ Cel': '+ Ziel',
  'Brak celów — dodaj pierwszy.': 'Noch keine Ziele — füge dein erstes hinzu.',
  'Duże wydatki': 'Große Ausgaben',
  'Brak zaplanowanych wydatków.': 'Keine geplanten Ausgaben.',
  'Cofnij': 'Rückgängig',
  'Opłacone': 'Bezahlt',
  'Ustaw / zmień pensję miesięczną': 'Monatsgehalt festlegen / ändern',
  'Pensja miesięczna (netto)': 'Monatsgehalt (netto)',
  'Nazwa celu': 'Zielname',
  'Kwota docelowa': 'Zielbetrag',
  'Już odłożono': 'Bereits gespart',
  'Data docelowa (opcjonalnie)': 'Zieldatum (optional)',
  'Notatka (opcjonalnie)': 'Notiz (optional)',
  'Dodaj cel': 'Ziel hinzufügen',
  'do': 'bis',
  'Dołóż': 'Geld hinzufügen',
  'Kwota do dołożenia': 'Hinzuzufügender Betrag',
  'Nazwa wydatku': 'Name der Ausgabe',
  'Termin': 'Fällig am',
  'Dodaj wydatek': 'Ausgabe hinzufügen',

  // Dividend simulation
  'Symulacja przyszłych dywidend (12 mies.)': 'Simulation zukünftiger Dividenden (12 Mon.)',
  'Szacunek na podstawie obecnie posiadanych akcji i historycznego rytmu wypłat każdej spółki — nie jest to gwarancja przyszłych dywidend.':
    'Eine Schätzung basierend auf deinen aktuellen Aktien und dem historischen Ausschüttungsrhythmus jeder Aktie — keine Garantie für zukünftige Dividenden.',
  'Szacunkowe dywidendy w kolejnych latach': 'Geschätzte Dividenden in den kommenden Jahren',
  'To samo założenie co powyżej (obecne akcje i historyczny rytm wypłat), zsumowane rok do roku na dłuższym horyzoncie.':
    'Dieselbe Annahme wie oben (aktuelle Aktien und historischer Ausschüttungsrhythmus), Jahr für Jahr über einen längeren Zeithorizont summiert.',
  'Za mało historii wypłat dla posiadanych spółek, żeby oszacować przyszłość.':
    'Zu wenig Ausschüttungshistorie für deine aktuellen Aktien, um die Zukunft abzuschätzen.',
  'Szac. dywidendy': 'Gesch. Dividenden',
  'Kolor oznacza pewność: najbliższa spodziewana wypłata każdej spółki (ostatnia znana kwota) vs. dalsze miesiące (uwzględniające szacowany wzrost dywidendy).':
    'Die Farbe zeigt die Sicherheit: die nächste erwartete Ausschüttung jeder Aktie (letzter bekannter Betrag) vs. spätere Monate (inkl. geschätztem Dividendenwachstum).',
  'Najbliższa wypłata (znana kwota)': 'Nächste Ausschüttung (bekannter Betrag)',
  'Dalsza prognoza (szac. wzrost)': 'Weitere Prognose (gesch. Wachstum)',
  'ogłoszona': 'angekündigt',

  // Invite-only registration / streak / onboarding gate
  'Login lub e-mail': 'Benutzername oder E-Mail',
  'Rejestracja jest dostępna tylko na zaproszenie od innego użytkownika — poproś o link lub zeskanuj kod QR.':
    'Die Registrierung ist nur auf Einladung eines anderen Nutzers möglich — bitte um einen Link oder scanne einen QR-Code.',
  'Masz już konto? Zaloguj się': 'Hast du schon ein Konto? Anmelden',
  'Rejestracja jest dostępna tylko na zaproszenie od innego użytkownika.': 'Die Registrierung ist nur auf Einladung eines anderen Nutzers möglich.',
  'Seria logowań: {0} dni': '{0}-Tage-Anmeldeserie',
  'Zaproś znajomych': 'Freunde einladen',
  'Limit: bez ograniczeń': 'Limit: unbegrenzt',
  'Pozostało w tym tygodniu: {0} z {1}': 'Diese Woche verbleibend: {0} von {1}',
  '+ Wygeneruj zaproszenie': '+ Einladung erstellen',
  'Wykorzystano limit zaproszeń na ten tydzień — odnawia się na bieżąco, 7 dni po każdym zaproszeniu.':
    'Das Einladungslimit für diese Woche ist ausgeschöpft — es erneuert sich fortlaufend, 7 Tage nach jeder Einladung.',
  'Skopiowano!': 'Kopiert!',
  'Kopiuj link': 'Link kopieren',
  'Pokaż QR': 'QR anzeigen',
  'Ukryj QR': 'QR ausblenden',
  'Zaakceptowane przez {0} ({1})': 'Angenommen von {0} ({1})',
  'Oczekuje — wygenerowano {0}': 'Ausstehend — erstellt {0}',
  'Czy na pewno chcesz zmienić nazwę użytkownika? Można to zrobić tylko raz na 30 dni.':
    'Möchtest du deinen Benutzernamen wirklich ändern? Das ist nur einmal alle 30 Tage möglich.',
  'Dodaj co najmniej jedno konto bankowe, żeby przejść dalej.': 'Füge mindestens ein Bankkonto hinzu, um fortzufahren.',
  'Dodaj najpierw co najmniej jedno konto bankowe.': 'Füge zuerst mindestens ein Bankkonto hinzu.',

  // Color variants (theme)
  'Przełącz na lawendowy motyw': 'Zum Lavendel-Design wechseln',
  'Wygląd': 'Erscheinungsbild',
  'Domyślny kolor interfejsu': 'Standardfarbe der Oberfläche',
  'Jasny': 'Hell',
  'Ciemny': 'Dunkel',
  'Lawendowy': 'Lavendel',

  // Editor role / article CRM / admin role assignment
  'Redakcja': 'Redaktion',
  'Masz uprawnienia redaktora — możesz dodawać i edytować artykuły.':
    'Du hast Redakteursrechte — du kannst Artikel hinzufügen und bearbeiten.',
  'Przejdź do redakcji': 'Zur Redaktion',
  'Redakcja artykułów': 'Artikelredaktion',
  'Dodawaj i edytuj artykuły widoczne na stronie głównej.': 'Füge Artikel hinzu und bearbeite sie, die auf der Startseite angezeigt werden.',
  '+ Nowy artykuł': '+ Neuer Artikel',
  'Edytuj artykuł': 'Artikel bearbeiten',
  'Nowy artykuł': 'Neuer Artikel',
  'Tytuł': 'Titel',
  'Krótki opis': 'Kurzbeschreibung',
  'Treść': 'Inhalt',
  'Opublikowany': 'Veröffentlicht',
  'Kolejność': 'Reihenfolge',
  'Nie udało się zapisać artykułu.': 'Der Artikel konnte nicht gespeichert werden.',
  'szkic': 'Entwurf',
  'Autor: {0} • {1}': 'Von {0} • {1}',
  'Czy na pewno chcesz usunąć ten artykuł?': 'Möchtest du diesen Artikel wirklich löschen?',
  'Nadaj admina': 'Admin-Rechte erteilen',
  'Odbierz admina': 'Admin-Rechte entziehen',
  'Nadaj redaktora': 'Redakteursrechte erteilen',
  'Odbierz redaktora': 'Redakteursrechte entziehen',

  // Financial cleanup phase: delete closed lokaty/bonds, unified category management
  'Czy na pewno chcesz usunąć tę lokatę?': 'Möchtest du dieses Festgeld wirklich löschen?',
  'Czy na pewno chcesz usunąć tę obligację?': 'Möchtest du diese Anleihe wirklich löschen?',
  'Kategorie, sklepy i tagi': 'Kategorien, Geschäfte & Tags',
  'Zarządzaj tu wszystkimi kategoriami, sklepami i tagami używanymi w budżecie — w jednym miejscu.':
    'Verwalte hier alle im Budget verwendeten Kategorien, Geschäfte und Tags — an einem Ort.',
  'Kategorie przychodów': 'Einnahmenkategorien',
  'Kategorie wydatków': 'Ausgabenkategorien',
  'po Belce': 'nach Steuer',
  'Wykres pokazuje udział wartości każdej spółki w całym portfelu akcji. Przy każdej pozycji: pierwszy % to jej udział w portfelu, drugi (kolorowy) to zysk/strata na tej pozycji.':
    'Das Diagramm zeigt den Wertanteil jeder Aktie am gesamten Aktienportfolio. Bei jeder Position: der erste % ist ihr Anteil am Portfolio, der zweite (farbige) ist der Gewinn/Verlust dieser Position.',
  'Udział tej spółki w wartości całego portfela': 'Der Anteil dieser Aktie am Gesamtwert des Portfolios',
  'Zysk/strata (niezrealizowane) na tej pozycji': 'Nicht realisierter Gewinn/Verlust dieser Position',

  // Per-account language
  'Wygląd i język': 'Erscheinungsbild & Sprache',
  'Język interfejsu': 'Sprache der Oberfläche',

  // Feature-interest onboarding + account settings
  'Zainteresowania': 'Interessen',
  'Z czego chcesz korzystać? Odznacz to, czego nie potrzebujesz — zawsze możesz to zmienić później w ustawieniach konta.':
    'Was möchtest du nutzen? Deaktiviere, was du nicht brauchst — du kannst das jederzeit später in den Kontoeinstellungen ändern.',
  'Budżet': 'Budget',
  'Portfel akcji, dywidendy, analiza spółek': 'Aktienportfolio, Dividenden, Aktienanalyse',
  'Notowanie przychodów i wydatków': 'Erfassung von Einnahmen und Ausgaben',
  'Cele oszczędnościowe i planowane wydatki': 'Sparziele und geplante Ausgaben',
  'Kalkulator inwestycyjny - obligacje, lokaty, giełda': 'Investitionsrechner - Anleihen, Festgelder, Börse',
  'Z czego korzystasz': 'Was du nutzt',
  'Odznaczone opcje znikają z górnego menu — możesz je włączyć z powrotem w każdej chwili.':
    'Deaktivierte Optionen verschwinden aus dem oberen Menü — du kannst sie jederzeit wieder aktivieren.',

  // Chart type switcher
  'Wykres kołowy': 'Kreisdiagramm',
  'Wykres słupkowy': 'Balkendiagramm',

  // Feedback widget
  'Feedback': 'Feedback',
  'Dziękujemy za wiadomość! Przeczytamy ją wkrótce.': 'Danke für deine Nachricht! Wir lesen sie bald.',
  'Co możemy poprawić? Czego brakuje? Napisz śmiało.': 'Was können wir verbessern? Was fehlt? Schreib uns ruhig.',
  'Twoja wiadomość…': 'Deine Nachricht…',
  'Wyślij': 'Senden',
  'Zostaw feedback': 'Feedback hinterlassen',

  // Admin feedback triage tab
  'Użytkownicy': 'Nutzer',
  'Zrobione': 'Erledigt',
  'Odrzucone': 'Abgelehnt',
  'Na później': 'Später',
  'Brak zgłoszeń spełniających kryteria.': 'Keine Meldungen erfüllen die Kriterien.',
  'Oznacz jako: {0}': 'Markieren als: {0}',
  'Tylko ważne': 'Nur wichtige',
  'Ważne': 'Wichtig',
  'Oznacz jako ważne': 'Als wichtig markieren',
  'Odznacz ważne': 'Wichtig-Markierung entfernen',

  // Invite by email
  'Wygeneruj link i kod QR, albo od razu podaj e-mail znajomego, żeby wysłać mu zaproszenie.':
    'Erstelle einen Link und QR-Code, oder gib direkt die E-Mail-Adresse eines Freundes ein, um ihm die Einladung zu senden.',
  'E-mail znajomego (opcjonalnie)': 'E-Mail-Adresse des Freundes (optional)',
  '+ Wyślij zaproszenie mailem': '+ Einladung per E-Mail senden',

  // Growth summary "no data" state
  'Brak danych — zarejestruj pierwszą wpłatę, aby zobaczyć realny zwrot.':
    'Keine Daten — erfasse deine erste Einzahlung, um die reale Rendite zu sehen.',

  // Admin user detail page
  'Szczegóły': 'Details',
  '← Wróć do listy': '← Zurück zur Liste',
  'zarchiwizowane': 'archiviert',
  'brak imienia i nazwiska': 'kein Name angegeben',
  'Nie znaleziono użytkownika.': 'Nutzer nicht gefunden.',
  'E-mail zweryfikowany': 'E-Mail bestätigt',
  'tak': 'ja',
  'nie': 'nein',
  'Status konta': 'Kontostatus',
  'Wariant kolorystyczny': 'Farbvariante',
  'Język': 'Sprache',
  'Role': 'Rollen',
  'administrator': 'Admin',
  'redaktor': 'Redakteur',
  'zwykły użytkownik': 'normaler Nutzer',
  'Zarządzanie kontem': 'Kontoverwaltung',
  'Przywrócić to konto z archiwum?': 'Dieses Konto aus dem Archiv wiederherstellen?',
  'Zarchiwizować to konto? Zostanie zablokowane, ale dane pozostaną zachowane.':
    'Dieses Konto archivieren? Es wird gesperrt, aber die Daten bleiben erhalten.',
  'Przywróć z archiwum': 'Aus dem Archiv wiederherstellen',
  'Zarchiwizuj konto': 'Konto archivieren',
  'Zarchiwizowano {0}': 'Archiviert am {0}',
  'Zaproszeni użytkownicy': 'Eingeladene Nutzer',
  'Nikogo jeszcze nie zaprosił(a).': 'Hat noch niemanden eingeladen.',
  'Napisane artykuły': 'Geschriebene Artikel',
  'Nie napisał(a) jeszcze żadnego artykułu.': 'Hat noch keinen Artikel geschrieben.',
  'Statystyki aktywności': 'Aktivitätsstatistiken',
  'Aktywne dni łącznie': 'Aktive Tage gesamt',
  'Aktywność w ostatnich 30 dniach': 'Aktivität in den letzten 30 Tagen',
  'aktywny': 'aktiv',
  'nieaktywny': 'inaktiv',

  // Realny zwrot redesign, Belka tax parenthetical
  'Wpłacona kasa': 'Eingezahltes Geld',
  'Zysk': 'Gewinn',
  'po podatku Belki': 'nach Kapitalertragsteuer',
  'To, co włożyłeś: majątek na starcie + przychody + wpłaty własne.':
    'Das, was du eingebracht hast: Startvermögen + Einnahmen + eigene Einzahlungen.',
  'To, co zarobiłeś: odsetki na lokatach i obligacjach, zysk na akcjach oraz dywidendy (po podatku Belki).':
    'Das, was du verdient hast: Zinsen auf Festgelder und Anleihen, Gewinne aus Aktien sowie Dividenden (nach Kapitalertragsteuer).',

  // Zmiana wartości majątku — expandable breakdown
  'Kliknij, aby zobaczyć podział zmiany na akcje, lokaty, obligacje i gotówkę':
    'Klicke, um die Änderung nach Aktien, Festgeldern, Anleihen und Bargeld aufgeschlüsselt zu sehen',
  'Brak zmian w poszczególnych składnikach.': 'Keine Änderung bei den einzelnen Komponenten.',

  // Portfolio allocation legend + new analytics cards
  'Udział': 'Anteil',
  'Podatek Belki przy sprzedaży dziś': 'Kapitalertragsteuer bei Verkauf heute',
  'Ile fiskus zabrałby, gdybyś dziś sprzedał(a) wszystko na plusie.':
    'Wie viel das Finanzamt einbehalten würde, wenn du heute alle Gewinnpositionen verkaufen würdest.',
  'Dywidendy w tym roku': 'Dividenden dieses Jahr',
  'Łącznie od zawsze: {0}': 'Insgesamt seit Beginn: {0}',
  'Dywidendy w tym roku (po Belce)': 'Dividenden dieses Jahr (nach Steuer)',
  'Brutto: {0} · Łącznie od zawsze: {1} ({2} po Belce)': 'Brutto: {0} · Insgesamt seit Beginn: {1} ({2} nach Steuer)',

  // Stock reordering (drag & drop)
  'Przeciągnij, aby zmienić kolejność': 'Ziehen, um die Reihenfolge zu ändern',

  // Admin: Statystyki tab
  'Statystyki': 'Statistiken',
  'Zaproszenia wysłane': 'Gesendete Einladungen',
  'Zaproszenia przyjęte': 'Angenommene Einladungen',
  'Zaproszenia mailem': 'Einladungen per E-Mail',
  'Redaktorzy': 'Redakteure',
  'Zarchiwizowane konta': 'Archivierte Konten',
  'Transakcje budżetowe': 'Budgettransaktionen',
  'Transakcje giełdowe': 'Börsentransaktionen',
  'Role niestandardowe': 'Benutzerdefinierte Rollen',
  'Wariant kolorystyczny użytkowników': 'Farbvariante der Nutzer',
  'Zaproszenia wysłane mailem': 'Per E-Mail gesendete Einladungen',
  'Brak zaproszeń wysłanych mailem.': 'Keine per E-Mail gesendeten Einladungen.',
  'Zapraszający': 'Einladender',
  'Wysłano': 'Gesendet',
  'Przyjęte przez {0}': 'Angenommen von {0}',
  'Wygasłe': 'Abgelaufen',
  'Oczekuje': 'Ausstehend',
  'Wygasłe zaproszenia': 'Abgelaufene Einladungen',
  'Wysłane e-maile': 'Gesendete E-Mails',
  'Brak wygasłych zaproszeń.': 'Keine abgelaufenen Einladungen.',
  'Nie wysłano jeszcze żadnych zaproszeń mailem.': 'Es wurden noch keine Einladungen per E-Mail gesendet.',
  'Przyjęte': 'Angenommen',

  // Admin: role/permission management
  'Nazwa roli': 'Rollenname',
  'Kolor roli': 'Rollenfarbe',
  'Utwórz rolę': 'Rolle erstellen',
  '+ Nowa rola': '+ Neue Rolle',
  'Twórz role z wybranym zestawem uprawnień i nadawaj je użytkownikom w ich profilu — niezależnie od statusu administratora/redaktora.':
    'Erstelle Rollen mit einem gewählten Satz an Berechtigungen und weise sie Nutzern in deren Profil zu — unabhängig vom Admin-/Redakteursstatus.',
  '{0} uprawnień, {1} użytkowników': '{0} Berechtigungen, {1} Nutzer',
  'Usunąć rolę {0}? Zostanie odebrana wszystkim {1} przypisanym użytkownikom.':
    'Rolle {0} löschen? Sie wird allen {1} zugewiesenen Nutzern entzogen.',
  'Brak ról.': 'Noch keine Rollen.',
  'Brak ról — utwórz je w zakładce "Role".': 'Noch keine Rollen — erstelle sie im Tab "Rollen".',
  'Podgląd statystyk aplikacji': 'App-Statistiken ansehen',
  'Podgląd listy użytkowników': 'Nutzerliste ansehen',
  'Zarządzanie użytkownikami (aktywacja, archiwizacja)': 'Nutzerverwaltung (Aktivierung, Archivierung)',
  'Tworzenie i edycja artykułów': 'Artikel erstellen und bearbeiten',
  'Publikowanie artykułów': 'Artikel veröffentlichen',
  'Zarządzanie zgłoszeniami feedbacku': 'Feedback-Meldungen verwalten',
  'Tworzenie i edycja ról': 'Rollen erstellen und bearbeiten',

  // Invite friends — delete, sub-tabs, expiry
  'Oczekujące zaproszenia': 'Ausstehende Einladungen',
  'Przyjęte zaproszenia': 'Angenommene Einladungen',
  'Brak oczekujących zaproszeń.': 'Keine ausstehenden Einladungen.',
  'Brak przyjętych zaproszeń.': 'Keine angenommenen Einladungen.',
  'Usunąć ten link z zaproszeniem?': 'Diesen Einladungslink löschen?',
  'Wygasło — wygenerowano {0}': 'Abgelaufen — erstellt {0}',
  'Oczekuje — wygenerowano {0}, wygasa po 48h': 'Ausstehend — erstellt {0}, läuft nach 48h ab',

  // Login history
  'Historia logowań': 'Anmeldeverlauf',
  'Logowania ogółem': 'Anmeldungen gesamt',
  'Aktualna passa': 'Aktuelle Serie',
  'Najdłuższa passa': 'Längste Serie',
  'Najczęstsza godzina': 'Häufigste Uhrzeit',
  '{0} dni': '{0} Tage',
  '{0} logowań': '{0} Anmeldungen',

  // Username change lock
  'Można zmienić od {0}': 'Wieder änderbar ab {0}',

  // Savings goals — reserve from savings, multi-month payday reservations
  'Zarezerwuj z oszczędności': 'Aus Ersparnissen reservieren',
  'Zarezerwuj część pensji z jednego lub kilku konkretnych miesięcy naraz.':
    'Reserviere einen Teil deines Gehalts aus einem oder mehreren bestimmten Monaten gleichzeitig.',
  'Miesiąc wypłaty': 'Gehaltsmonat',
  '+ Dodaj kolejny miesiąc': '+ Weiteren Monat hinzufügen',
  'Kwota z oszczędności': 'Betrag aus Ersparnissen',

  // Privacy policy
  'Strona główna': 'Startseite',
  'Europa': 'Europa',
  'Polityka prywatności': 'Datenschutzerklärung',
  '← Powrót na stronę główną': '← Zurück zur Startseite',
  'Kim jesteśmy': 'Wer wir sind',
  'Jakie dane zbieramy': 'Welche Daten wir erheben',
  'Dane finansowe, które sam(a) wprowadzasz': 'Finanzdaten, die du selbst eingibst',
  'Dane techniczne i bezpieczeństwa': 'Technische Daten und Sicherheitsdaten',
  'Zgłoszenia i zaproszenia': 'Meldungen und Einladungen',
  'Ciasteczka i local storage': 'Cookies und lokaler Speicher',
  'Komu udostępniamy dane': 'Mit wem wir Daten teilen',
  'Jak długo przechowujemy dane': 'Wie lange wir Daten speichern',
  'Twoje prawa': 'Deine Rechte',
  'Bezpieczeństwo': 'Sicherheit',
  'Zmiany tej polityki': 'Änderungen dieser Richtlinie',
  'Kontakt': 'Kontakt',

  // Landing page
  'Dostępne wyłącznie na zaproszenie': 'Nur auf Einladung verfügbar',
  'Panuj nad': 'Behalte',
  'swoimi finansami': 'deine Finanzen im Griff',
  'Zbudowane, żeby faktycznie z tego korzystać': 'Gebaut, damit du es wirklich nutzt',
  'Nie kolejny arkusz kalkulacyjny — narzędzie, które samo liczy to, co dla Ciebie ważne.':
    'Keine weitere Tabellenkalkulation — ein Tool, das selbst berechnet, was für dich wichtig ist.',
  'Wszystko w jednym miejscu': 'Alles an einem Ort',
  'Konta bankowe, akcje, obligacje i lokaty — jeden widok na cały Twój majątek, bez przełączania się między aplikacjami banków i domów maklerskich.':
    'Bankkonten, Aktien, Anleihen und Festgelder — ein Überblick über dein gesamtes Vermögen, ohne zwischen Bank- und Broker-Apps zu wechseln.',
  'Realny zwrot z inwestycji': 'Reale Rendite deiner Investitionen',
  'Zysk liczony osobno od wpłaconego kapitału — zobaczysz dokładnie, ile realnie zarobiłeś na lokatach, obligacjach i akcjach, po podatku Belki.':
    'Gewinn getrennt vom eingezahlten Kapital berechnet — du siehst genau, wie viel du mit Festgeldern, Anleihen und Aktien nach Kapitalertragsteuer wirklich verdient hast.',
  'Budżet pod kontrolą': 'Budget unter Kontrolle',
  'Automatyczny import wyciągów, kategorie, sklepy i tagi — analiza przychodów i wydatków, która sama się aktualizuje.':
    'Automatischer Kontoauszugsimport, Kategorien, Geschäfte und Tags — eine Einnahmen-/Ausgabenanalyse, die sich selbst aktualisiert.',
  'Ustaw cel, rezerwuj kwoty z konkretnych wypłat lub z bieżących oszczędności i śledź postęp na żywo.':
    'Setze ein Ziel, reserviere Beträge aus bestimmten Gehältern oder deinen aktuellen Ersparnissen und verfolge den Fortschritt live.',
  'Dywidendy i podatki': 'Dividenden und Steuern',
  'Historia i prognoza wypłat dywidend, szacowany podatek Belki do zapłaty — żadnych niespodzianek przy rozliczeniu.':
    'Dividendenhistorie und -prognose, geschätzte fällige Kapitalertragsteuer — keine Überraschungen bei der Steuererklärung.',
  'Twoje dane, Twoja kontrola': 'Deine Daten, deine Kontrolle',
  'Dostęp wyłącznie na zaproszenie, bez reklam i bez śledzenia. Historia logowań pokazuje dokładnie, kto i kiedy wchodził na Twoje konto.':
    'Zugang nur auf Einladung, keine Werbung und kein Tracking. Der Anmeldeverlauf zeigt genau, wer wann auf dein Konto zugegriffen hat.',
  'Jak to działa': 'So funktioniert es',
  'Dostajesz zaproszenie': 'Du bekommst eine Einladung',
  'Rejestracja jest możliwa tylko na zaproszenie od kogoś, kto już korzysta ze skieta.':
    'Die Registrierung ist nur mit einer Einladung von jemandem möglich, der skieta bereits nutzt.',
  'Dodajesz swoje konta': 'Du fügst deine Konten hinzu',
  'Kilka minut wystarczy, żeby dodać konta bankowe, portfel akcji, lokaty i obligacje.':
    'Ein paar Minuten reichen, um Bankkonten, dein Aktienportfolio, Festgelder und Anleihen hinzuzufügen.',
  'Widzisz cały obraz': 'Du siehst das große Ganze',
  'Dashboard aktualizuje się na bieżąco — majątek, zwrot z inwestycji i budżet w jednym miejscu.':
    'Das Dashboard aktualisiert sich laufend — Vermögen, Anlagerendite und Budget an einem Ort.',
  'Masz już zaproszenie?': 'Hast du schon eine Einladung?',
  'Zaloguj się i zobacz cały swój majątek w jednym miejscu — od razu po pierwszym dodaniu konta.':
    'Melde dich an und sieh dein gesamtes Vermögen an einem Ort — direkt nachdem du dein erstes Konto hinzugefügt hast.',

  // Request access — landing page form + admin review
  'Nie masz zaproszenia? Poproś o dostęp →': 'Keine Einladung? Zugang anfragen →',
  'Twój adres e-mail': 'Deine E-Mail-Adresse',
  'Poproś o dostęp': 'Zugang anfragen',
  'Dziękujemy! Sprawdź skrzynkę e-mail — napiszemy, gdy administrator rozpatrzy Twoją prośbę.':
    'Danke! Schau in dein Postfach — wir melden uns, sobald ein Administrator deine Anfrage geprüft hat.',
  'Prośby o dostęp': 'Zugangsanfragen',
  'Oczekujące': 'Ausstehend',
  'Zaakceptowane': 'Angenommen',
  'Zaakceptowano': 'Angenommen',
  'Odrzucono': 'Abgelehnt',
  'Zaakceptuj losowy procent oczekujących': 'Einen zufälligen Prozentsatz der Ausstehenden annehmen',
  'Przydatne przy stopniowym otwieraniu dostępu — zamiast rozpatrywać każdą prośbę osobno.':
    'Nützlich für eine schrittweise Zugangsöffnung — statt jede Anfrage einzeln zu bearbeiten.',
  'Zaakceptuj': 'Annehmen',
  'Zaakceptowano {0} z {1} oczekujących próśb.': '{0} von {1} ausstehenden Anfragen angenommen.',
  'Brak próśb w tej kategorii.': 'Keine Anfragen in dieser Kategorie.',
  'Otrzymano {0}': 'Erhalten am {0}',
  '{0} przez {1}, {2}': '{0} von {1}, {2}',
  'Akceptuj': 'Annehmen',
  'Odrzuć': 'Ablehnen',

  // Role acceptance workflow
  'Kliknięcie oferuje rolę — zaczyna obowiązywać dopiero, gdy użytkownik ją zaakceptuje.':
    'Ein Klick bietet die Rolle an — sie tritt erst in Kraft, wenn der Nutzer sie annimmt.',
  'Oczekuje na akceptację użytkownika — kliknij, aby wycofać ofertę': 'Wartet auf die Annahme durch den Nutzer — klicke, um das Angebot zurückzuziehen',
  'Zaakceptowana — kliknij, aby odebrać': 'Angenommen — klicke, um sie zu entziehen',
  'Kliknij, aby zaoferować tę rolę': 'Klicke, um diese Rolle anzubieten',
  '(oczekuje)': '(ausstehend)',
  'Nowe role do zaakceptowania': 'Neue Rollen zur Annahme',
  'Administrator zaproponował Ci nowe uprawnienia — nie zaczną obowiązywać, dopóki ich nie zaakceptujesz.':
    'Ein Administrator hat dir neue Berechtigungen angeboten — sie treten erst in Kraft, wenn du sie annimmst.',
  'od {0}': 'von {0}',

  // Login back-link, updated budget feature card
  '← Strona główna': '← Startseite',
  'Przychody, wydatki i budżet': 'Einnahmen, Ausgaben und Budget',
  'Zarządzaj przychodami i wydatkami, monitoruj budżet miesiąc po miesiącu i sprawdzaj bilans — automatyczny import wyciągów, kategorie, sklepy i tagi robią to za Ciebie.':
    'Verwalte deine Einnahmen und Ausgaben, behalte dein Budget Monat für Monat im Blick und prüfe deine Bilanz — automatischer Kontoauszugsimport, Kategorien, Geschäfte und Tags erledigen das für dich.',

  // Translation coverage sweep — everything a distinct-strings audit found
  // with no English entry yet, across Planowanie, AdminUsers, AnalizaSpolek,
  // StatementImportPanel, PrivacyPolicy, Landing, and assorted small labels.
  '+ Przychód/Wydatek': '+ Einnahme/Ausgabe',
  '+ Stały koszt': '+ Fixkosten',
  'Administratorzy': 'Administratoren',
  'Aktywni': 'Aktiv',
  'Aktywni dzisiaj': 'Heute aktiv',
  'Aktywni użytkownicy dziennie (30 dni)': 'Täglich aktive Nutzer (30 Tage)',
  'Artykuły o finansach osobistych': 'Artikel über persönliche Finanzen',
  'Brak stałych kosztów — dodaj pierwszy.': 'Noch keine Fixkosten — füge deinen ersten hinzu.',
  'Brak użytkowników spełniających kryteria.': 'Keine Nutzer erfüllen die Filterkriterien.',
  'Brak wycenionych pozycji w portfelu.': 'Keine bewerteten Positionen im Portfolio.',
  'Brak zarezerwowanych wypłat.': 'Noch keine reservierten Gehälter.',
  'Czynsz, subskrypcje, ubezpieczenia — cykliczne opłaty co miesiąc, niezależnie od tego, czy już je zapłaciłeś w tym miesiącu.':
    'Miete, Abos, Versicherungen — wiederkehrende monatliche Zahlungen, unabhängig davon, ob du sie diesen Monat schon bezahlt hast.',
  'Czytaj więcej →': 'Weiterlesen →',
  'Dane konta przechowujemy tak długo, jak konto jest aktywne. Kiedy usuniesz konto w ustawieniach, blokujemy je od razu, a po 30 dniach trwale kasujemy wszystkie Twoje dane. Przez te 30 dni możesz cofnąć decyzję linkiem z maila, który wysyłamy przy usuwaniu. Osobno administrator może zarchiwizować konto, czyli je zdezaktywować z zachowaniem danych — takie konto czeka, aż zdecydujesz, co dalej, i nie jest kasowane automatycznie.':
    'Wir speichern deine Kontodaten, solange das Konto aktiv ist. Wenn du dein Konto in den Einstellungen löschst, sperren wir es sofort und löschen nach 30 Tagen alle deine Daten endgültig. In diesen 30 Tagen kannst du das mit dem Link aus unserer E-Mail rückgängig machen. Davon getrennt kann ein Administrator ein Konto archivieren, also deaktivieren und die Daten behalten - so ein Konto wartet auf deine Entscheidung und wird nie automatisch gelöscht.',
  'Danych nie sprzedajemy i nie udostępniamy w celach marketingowych. Współpracujemy wyłącznie z dostawcami niezbędnymi do działania serwisu:':
    'Wir verkaufen deine Daten nicht und geben sie nicht zu Marketingzwecken weiter. Wir arbeiten ausschließlich mit Anbietern zusammen, die für den Betrieb des Dienstes notwendig sind:',
  'Dashboard': 'Dashboard',
  'Dodaj': 'Hinzufügen',
  'Dodaj stały koszt': 'Fixkosten hinzufügen',
  'Domyślna waluta': 'Standardwährung',
  'Dołączył(a)': 'Beigetreten',
  'Dzień wypłaty pozwala policzyć, ile wypłat zostało do terminu każdego celu oszczędnościowego.':
    'Der Gehaltstag ermöglicht die Berechnung, wie viele Gehälter bis zum Termin jedes Sparziels noch übrig sind.',
  'dostawca analityki bez ciasteczek — zbiorcze statystyki odwiedzin (patrz sekcja wyżej),':
    'ein Analyseanbieter ohne Cookies - aggregierte Besuchsstatistiken (siehe Abschnitt oben),',
  'Hasła są haszowane, komunikacja z aplikacją odbywa się przez HTTPS, a dostęp do panelu administratora mają wyłącznie konta z uprawnieniami administratora lub odpowiednią rolą — i nawet ten panel nie pokazuje treści Twoich transakcji ani sald, tylko zbiorcze statystyki. Treść danych finansowych nie jest też dostępna przez wbudowany panel Django — do bazy danych dociera się wyłącznie bezpośrednim, świadomym dostępem administracyjnym do infrastruktury, nie jednym kliknięciem w aplikacji.':
    'Passwörter werden gehasht, die Kommunikation mit der App erfolgt über HTTPS, und nur Konten mit Administratorrechten oder einer entsprechenden Rolle haben Zugriff auf das Admin-Panel — und selbst dieses Panel zeigt niemals den Inhalt deiner Transaktionen oder Salden, sondern nur aggregierte Statistiken. Der Inhalt der Finanzdaten ist auch nicht über das integrierte Django-Admin-Panel zugänglich — die Datenbank ist nur durch bewussten, direkten administrativen Zugriff auf die Infrastruktur erreichbar, nicht mit einem einzigen Klick in der App.',
  'Historia': 'Verlauf',
  'Importuj wyciąg z konta': 'Kontoauszug importieren',
  'Kategoria widoczna tylko dla tego konta': 'Kategorie nur für dieses Konto sichtbar',
  'Koncentracja portfela': 'Portfoliokonzentration',
  'Konta bankowe i ich salda, transakcje budżetowe, kategorie/sklepy/tagi, posiadane akcje i transakcje giełdowe, lokaty, obligacje, dywidendy, cele oszczędnościowe i plany budżetowe — czyli wszystko, co wpisujesz, żeby aplikacja mogła śledzić Twój majątek. Te dane widzisz tylko Ty — inni użytkownicy nie mają do nich dostępu, a panel administratora pokazuje wyłącznie zbiorcze liczby i aktywność konta (np. liczbę transakcji), nigdy treść Twoich transakcji czy sald.':
    'Bankkonten und ihre Salden, Budgettransaktionen, Kategorien/Geschäfte/Tags, deine Aktien und Börsentransaktionen, Festgelder, Anleihen, Dividenden, Sparziele und Budgetpläne — also alles, was du einträgst, damit die App dein Vermögen verfolgen kann. Diese Daten siehst nur du — andere Nutzer haben keinen Zugriff darauf, und das Admin-Panel zeigt nur aggregierte Zahlen und Kontoaktivität (z. B. eine Transaktionsanzahl), niemals den Inhalt deiner Transaktionen oder Salden.',
  'Konta w innej walucie będą oznaczone jako walutowe — to tylko etykieta, nie wpływa na przeliczenia.':
    'Konten in einer anderen Währung werden als Fremdwährungskonten markiert — das ist nur eine Kennzeichnung, sie beeinflusst keine Umrechnungen.',
  'Logowanie działa w oparciu o tokeny JWT przechowywane w local storage przeglądarki — to samo miejsce przechowuje wybrany motyw kolorystyczny i język, zanim zostaną zapisane na koncie. Nie ma żadnych skryptów reklamowych ani śledzących w celach marketingowych.':
    'Die Anmeldung basiert auf JWT-Tokens, die im lokalen Speicher des Browsers abgelegt werden — derselbe Ort speichert auch das gewählte Farbschema und die Sprache, bevor sie im Konto gespeichert werden. Es gibt keine Werbe- oder Marketing-Tracking-Skripte.',
  'Masz prawo do wglądu w swoje dane, ich poprawienia, przeniesienia i usunięcia. Dwa z nich załatwisz sam(a) w ustawieniach konta: "Pobierz swoje dane" daje pełną kopię wszystkiego, co przechowujemy (JSON plus tabele CSV do Excela), a "Usuń konto" uruchamia trwałe skasowanie danych. Większość informacji poprawisz bezpośrednio w ustawieniach. W pozostałych sprawach napisz na adres podany niżej albo skorzystaj z widgetu "Zostaw feedback" w aplikacji.':
    'Du hast das Recht, deine Daten einzusehen, zu berichtigen, mitzunehmen und löschen zu lassen. Zwei davon erledigst du selbst in den Kontoeinstellungen: "Deine Daten herunterladen" liefert eine vollständige Kopie von allem, was wir speichern (JSON plus CSV-Tabellen für Excel), und "Konto löschen" startet die endgültige Löschung. Die meisten Angaben korrigierst du direkt in den Einstellungen. Für alles Weitere schreib an die Adresse unten oder nutze das Feedback-Widget in der App.',
  'Na plusie / na minusie / bez zmian': 'Im Plus / im Minus / unverändert',
  'Najgorsza pozycja': 'Schlechteste Position',
  'Najlepsza pozycja': 'Beste Position',
  'Największa pozycja': 'Größte Position',
  'Nazwa użytkownika, imię i nazwisko, adres e-mail (jeśli podany) i hasło (przechowywane wyłącznie w postaci zahaszowanej, nigdy jawnym tekstem). Przy rejestracji zapisujemy też, z czyjego zaproszenia założono konto.':
    'Benutzername, Vor- und Nachname, E-Mail-Adresse (falls angegeben) und Passwort (nur gehasht gespeichert, niemals im Klartext). Bei der Registrierung speichern wir außerdem, auf wessen Einladung hin das Konto erstellt wurde.',
  'Nie udało się dodać tagu.': 'Der Tag konnte nicht hinzugefügt werden.',
  'Nie udało się przetworzyć pliku.': 'Die Datei konnte nicht verarbeitet werden.',
  'Nie udało się zaimportować transakcji — spróbuj wgrać plik ponownie.': 'Die Transaktionen konnten nicht importiert werden — versuche, die Datei erneut hochzuladen.',
  'Nie znaleziono artykułu.': 'Artikel nicht gefunden.',
  'Nowi w tym tygodniu': 'Neu diese Woche',
  'Odblokuj': 'Entsperren',
  'Odznacz wszystkie': 'Alle abwählen',
  'Opis': 'Beschreibung',
  'Ostatnia aktualizacja: 4 września 2026':
    'Zuletzt aktualisiert: 4. September 2026',
  'Ostatnia aktywność': 'Letzte Aktivität',
  'Ostatnie IP': 'Letzte IP',
  'Ostatnie logowanie': 'Letzte Anmeldung',
  'Panel administratora': 'Admin-Panel',
  'Pensja i dzień wypłaty ({0}. dnia miesiąca) — zmień': 'Gehalt und Gehaltstag ({0}. des Monats) — ändern',
  'Plik PDF': 'PDF-Datei',
  'Podgląd wyciągu': 'Kontoauszugsvorschau',
  'Podział wg rynku': 'Aufteilung nach Markt',
  'Podział wg waluty': 'Aufteilung nach Währung',
  'Podział wg konta maklerskiego': 'Aufteilung nach Depot',
  'Udział wartości portfela trzymanej na każdym koncie maklerskim. Zysk to zmiana wartości względem wpłaconego kapitału.':
    'Anteil des Portfoliowerts, der auf jedem Depot gehalten wird. Der Gewinn ist die Wertänderung im Verhältnis zum eingezahlten Kapital.',
  'Udział tego konta w wartości całego portfela': 'Der Anteil dieses Kontos am Gesamtwert des Portfolios',
  'Zmiana wartości względem wpłaconego kapitału na tym koncie': 'Wertänderung im Verhältnis zum in dieses Konto eingezahlten Kapital',
  'Zainwestowano': 'Investiert',
  'Pozostałe ({0})': 'Übrige ({0})',
  'Przy każdym logowaniu zapisujemy adres IP oraz podstawowe informacje o przeglądarce/systemie (User-Agent) — to podstawa historii logowań widocznej w Twoim koncie oraz ochrony przed nieautoryzowanym dostępem. Zapisujemy też, w które dni byłeś/aś aktywny(a) (do serii logowań i statystyk).':
    'Bei jeder Anmeldung speichern wir die IP-Adresse sowie grundlegende Browser-/Systeminformationen (User-Agent) — das ist die Grundlage für den Anmeldeverlauf in deinem Konto und den Schutz vor unbefugtem Zugriff. Wir speichern auch, an welchen Tagen du aktiv warst (für Serien und Statistiken).',
  'Rola': 'Rolle',
  'Skład, koncentracja i wyniki Twoich pozycji — przeliczone do jednej waluty, żeby dało się je sensownie porównać.':
    'Zusammensetzung, Konzentration und Performance deiner Positionen — in eine Währung umgerechnet, damit sie sinnvoll vergleichbar sind.',
  'Statystyki portfela': 'Portfoliostatistiken',
  'Stałe koszty': 'Fixkosten',
  'Stałe koszty / mies.': 'Fixkosten / Mon.',
  'Suma': 'Summe',
  'Szukaj': 'Suchen',
  'Termin wypłaty minął przed celem — dodaj więcej lub przesuń termin': 'Der Gehaltstermin liegt vor dem Ziel — füge mehr hinzu oder verschiebe den Termin',
  'Transakcje akcji': 'Aktientransaktionen',
  'Transakcje budżetu': 'Budgettransaktionen',
  'Treść zgłoszeń wysłanych przez widget "Zostaw feedback" oraz historia wysłanych zaproszeń (komu, kiedy, czy zostało przyjęte).':
    'Der Inhalt von Meldungen über das Widget "Feedback hinterlassen" sowie der Verlauf gesendeter Einladungen (an wen, wann, ob angenommen).',
  'Ukryj historię': 'Verlauf ausblenden',
  'Ustaw dzień wypłaty (u góry strony), żeby zobaczyć ile wypłat zostało do celu': 'Lege deinen Gehaltstag fest (oben auf der Seite), um zu sehen, wie viele Gehälter bis zum Ziel übrig sind',
  'Ustaw pensję miesięczną i dzień wypłaty': 'Lege dein Monatsgehalt und deinen Gehaltstag fest',
  'Uwagi': 'Anmerkungen',
  'Użytkownicy aplikacji i ich aktywność': 'App-Nutzer und ihre Aktivität',
  'Użytkownicy łącznie': 'Nutzer gesamt',
  'Liczymy odwiedziny i podstawowy ruch na stronie, ale robimy to bez ciasteczek analitycznych i bez profilowania. Nasz dostawca analityki nie zapisuje niczego na Twoim urządzeniu, nie tworzy identyfikatora, po którym można Cię rozpoznać na innych stronach, i nie zbiera Twojego adresu IP w postaci pozwalającej Cię zidentyfikować. Dlatego nie prosimy Cię o zgodę na ciasteczka i nie zobaczysz tu żadnego bannera.':
    'Wir zählen Besuche und den grundlegenden Traffic, aber ohne Analyse-Cookies und ohne Profiling. Unser Analyseanbieter speichert nichts auf deinem Gerät, erstellt keine Kennung, mit der du auf anderen Seiten wiedererkannt werden könntest, und erfasst deine IP-Adresse nicht in einer Form, die dich identifiziert. Deshalb bitten wir dich nie um eine Cookie-Einwilligung und du siehst hier kein Banner.',
  'W miarę rozwoju aplikacji ta strona będzie aktualizowana, a data ostatniej zmiany widoczna jest na górze strony.':
    'Im Zuge der Weiterentwicklung der App wird diese Seite aktualisiert, das Datum der letzten Änderung steht oben auf der Seite.',
  'W sprawach dotyczących danych osobowych napisz na:': 'Bei Fragen zu personenbezogenen Daten schreib an:',
  'Waluta inna niż domyślna ({0})': 'Andere Währung als die Standardwährung ({0})',
  'Wczytywanie…': 'Wird geladen…',
  'Wgraj i pokaż podgląd': 'Hochladen und Vorschau anzeigen',
  'Wgraj wyciąg w formacie PDF (obecnie obsługiwane: PKO Bank Polski). Zanim cokolwiek zapiszemy, pokażemy podgląd transakcji do zatwierdzenia — i sprawdzimy, czy już ich kiedyś nie zaimportowano.':
    'Lade einen Kontoauszug im PDF-Format hoch (derzeit unterstützt: PKO Bank Polski). Bevor wir etwas speichern, zeigen wir dir eine Vorschau der Transaktionen zur Bestätigung — und prüfen, ob sie nicht schon einmal importiert wurden.',
  'Wkrótce pojawią się tu pierwsze artykuły.': 'Die ersten Artikel erscheinen hier bald.',
  'Wznów': 'Fortsetzen',
  'Zablokuj': 'Sperren',
  'Zacznij zarządzać swoimi finansami →': 'Beginne, deine Finanzen zu verwalten →',
  'Zaimportowano {0} transakcji, pominięto {1}.': '{0} Transaktionen importiert, {1} übersprungen.',
  'Zaloguj się do aplikacji': 'Bei der App anmelden',
  'Wejdź do aplikacji': 'Zur App',
  'Wróć do swojego majątku': 'Zurück zu deinem Vermögen',
  'Kontynuuj tam, gdzie skończyłeś/aś — Twój dashboard czeka.': 'Mach dort weiter, wo du aufgehört hast — dein Dashboard wartet.',
  'Zarezerwowano na duże wydatki': 'Für große Ausgaben reserviert',
  'Zarezerwuj z wypłaty': 'Vom Gehalt reservieren',
  'Zatrzymaj': 'Pausieren',
  'Zatwierdź import ({0})': 'Import bestätigen ({0})',
  'Zaznacz wszystkie': 'Alle auswählen',
  'Zaznaczono {0} z {1} transakcji do importu.': '{0} von {1} Transaktionen zum Import ausgewählt.',
  'Zostaje po rezerwacjach i odkładaniu': 'Übrig nach Reservierungen und Sparen',
  'Zostało {0} wypłat — odkładaj ~{1} z każdej, żeby zdążyć': 'Noch {0} Gehälter übrig — lege ~{1} von jedem zurück, um es zu schaffen',
  'Zrealizowany zysk/strata wg roku (po podatku Belki)': 'Realisierter Gewinn/Verlust nach Jahr (nach Kapitalertragsteuer)',
  'Zweryfikowany e-mail': 'Bestätigte E-Mail',
  'administratorzy': 'Administratoren',
  'aktywne': 'aktiv',
  'bardzo rozproszony': 'sehr diversifiziert',
  'dostawca poczty e-mail — do wysyłki e-maili weryfikacyjnych, resetu hasła i zaproszeń,': 'E-Mail-Anbieter — zum Versand von Bestätigungs-, Passwort-Reset- und Einladungs-E-Mails,',
  'hosting aplikacji i baza danych (Microsoft Azure),': 'App-Hosting und Datenbank (Microsoft Azure),',
  'już zaimportowano': 'bereits importiert',
  'login lub e-mail': 'Benutzername oder E-Mail',
  'mocno skoncentrowany': 'stark konzentriert',
  'możliwy duplikat': 'möglicherweise Duplikat',
  'niezweryfikowany': 'nicht bestätigt',
  'nigdy': 'nie',
  'np. mBank': 'z. B. mBank',
  'np. wakacje': 'z. B. Urlaub',
  'odświeżanie…': 'wird aktualisiert…',
  'publiczne źródła danych rynkowych (np. Stooq, Yahoo Finance) — zapytania dotyczą wyłącznie tickerów giełdowych i kursów walut, nigdy Twoich danych osobowych.':
    'öffentliche Marktdatenquellen (z. B. Stooq, Yahoo Finance) — die Abfragen betreffen ausschließlich Börsenticker und Wechselkurse, niemals deine persönlichen Daten.',
  'skieta to osobisty tracker finansowy — aplikacja dostępna wyłącznie na zaproszenie, bez reklam i bez sprzedaży danych osobom trzecim. Administratorem danych jest osoba prowadząca serwis skieta, z którą można się skontaktować pod adresem podanym na dole tej strony.':
    'skieta ist ein persönlicher Finanz-Tracker — eine nur auf Einladung zugängliche App, ohne Werbung und ohne Weitergabe von Daten an Dritte. Verantwortlicher für die Daten ist die Person, die skieta betreibt und die unter der am Ende dieser Seite angegebenen Adresse erreichbar ist.',
  'skieta łączy konta bankowe, inwestycje, lokaty i obligacje w jednym miejscu — zobacz, jak naprawdę rośnie Twój majątek, bez arkusza kalkulacyjnego i bez zgadywania.':
    'skieta bringt Bankkonten, Investitionen, Festgelder und Anleihen an einem Ort zusammen — sieh, wie dein Vermögen wirklich wächst, ohne Tabellenkalkulation und ohne Rätselraten.',
  'sprawdź — może to transfer własny': 'prüfen — könnte eine Überweisung zwischen eigenen Konten sein',
  'umiarkowanie skoncentrowany': 'mäßig konzentriert',
  'walutowe': 'Fremdwährung',
  'wszyscy': 'alle',
  'wszystkie': 'alle',
  'wszystkie konta': 'alle Konten',
  'zablokowane': 'gesperrt',
  'zdywersyfikowany': 'diversifiziert',
  'zweryfikowany': 'bestätigt',
  'zwykli użytkownicy': 'normale Nutzer',
  '{0} lat {1} mies.': '{0} J. {1} Mon.',
  '{0}. dnia miesiąca': 'am {0}. des Monats',
  'Śr. czas trzymania (ważony wartością)': 'Ø Haltedauer (wertgewichtet)',
  '← Wszystkie artykuły': '← Alle Artikel',
  '⇪ Importuj wyciąg': '⇪ Kontoauszug importieren',

  // Investment calculator (Analiza tab)
  'Kalkulator inwestycyjny': 'Investitionsrechner',
  'Podaj kwotę i horyzont czasowy, żeby zobaczyć orientacyjny wynik dla różnych instrumentów, po podatku Belki (19%). Stawki obligacji skarbowych są pobierane na bieżąco, pozostałe oprocentowania możesz dowolnie zmienić.':
    'Gib einen Betrag und einen Zeithorizont ein, um ein ungefähres Ergebnis für verschiedene Anlageformen nach Kapitalertragsteuer (19%) zu sehen. Die Zinssätze der Staatsanleihen werden live abgerufen, die übrigen Zinssätze kannst du beliebig ändern.',
  'To nie jest porada inwestycyjna ani rekomendacja - to tylko symulacja na podstawie oprocentowań, które sam(a) wybierasz lub które są historyczne. Realne wyniki mogą się różnić, szczególnie dla giełdy.':
    'Dies ist keine Anlageberatung und keine Empfehlung - es ist nur eine Simulation auf Basis von Zinssätzen, die du selbst wählst oder die historisch sind. Reale Ergebnisse können abweichen, besonders bei Aktien.',
  'Kwota do zainwestowania': 'Zu investierender Betrag',
  'Horyzont (lata)': 'Zeithorizont (Jahre)',
  'Wynik po {0} {1} (po podatku Belki)': 'Ergebnis nach {0} {1} (nach Kapitalertragsteuer)',
  'roku': 'Jahr',
  'latach': 'Jahren',
  'Wartość końcowa': 'Endwert',
  'Wartość końcowa po podatku': 'Endwert nach Steuer',
  'Ostatnia znana stawka - nie udało się pobrać bieżącej oferty.': 'Letzter bekannter Zinssatz - das aktuelle Angebot konnte nicht abgerufen werden.',
  'Aktualne oprocentowanie z pierwszego okresu odsetkowego (obligacjeskarbowe.pl).':
    'Aktueller Zinssatz der ersten Zinsperiode (obligacjeskarbowe.pl).',
  'Oprocentowanie stałe przez cały okres trwania obligacji - nie zmienia się.':
    'Fester Zinssatz für die gesamte Laufzeit der Anleihe - er ändert sich nicht.',
  'Oprocentowanie zmienne, oparte o stawkę WIBOR - resetowane co okres odsetkowy. Pokazana stawka dotyczy tylko pierwszego okresu, kolejne mogą być inne.':
    'Variabler Zinssatz auf Basis des WIBOR-Satzes - wird bei jeder Zinsperiode neu festgelegt. Der angezeigte Satz gilt nur für die erste Periode, spätere können abweichen.',
  'Pierwszy rok: stałe oprocentowanie. Kolejne lata: inflacja + marża. Pokazana stawka to tylko pierwszy okres - wynik w kolejnych latach zależy od przyszłej inflacji.':
    'Erstes Jahr: fester Zinssatz. Folgejahre: Inflation + Marge. Der angezeigte Satz gilt nur für die erste Periode - das Ergebnis in den Folgejahren hängt von der künftigen Inflation ab.',
  'Lokata bankowa': 'Bankfestgeld',
  'Przykładowe oprocentowanie roczne - zmień na stawkę z oferty swojego banku. Środki chronione gwarancją BFG do 100 000 EUR.':
    'Beispielhafter Jahreszins - ändere ihn auf das Angebot deiner Bank. Guthaben sind durch die BFG-Einlagensicherung bis 100.000 EUR geschützt.',
  'Konto oszczędnościowe': 'Sparkonto',
  'Przykładowe oprocentowanie - zwykle zmienne, bank może je zmienić w dowolnym momencie. Też objęte gwarancją BFG.':
    'Beispielhafter Zinssatz - meist variabel, die Bank kann ihn jederzeit ändern. Ebenfalls durch die BFG-Einlagensicherung abgedeckt.',
  'Giełda (średnio, szeroki rynek)': 'Aktienmarkt (Durchschnitt, breiter Markt)',
  'Średnia z 5 głównych indeksów (rozbicie i źródła niżej) - historyczna, nie gwarantowana. Realny wynik pojedynczego roku może być mocno na plusie albo na minusie.':
    'Durchschnitt von 5 wichtigen Indizes (Aufschlüsselung und Quellen unten) - historisch, nicht garantiert. Das reale Ergebnis eines einzelnen Jahres kann stark im Plus oder im Minus liegen.',
  'Instrument': 'Anlageform',
  'Ryzyko': 'Risiko',
  'Bardzo niskie': 'Sehr niedrig',
  'Niskie': 'Niedrig',
  'Wysokie': 'Hoch',
  'Zysk (brutto)': 'Gewinn (brutto)',
  'Zysk po podatku Belki': 'Gewinn nach Kapitalertragsteuer',
  'Skąd wzięło się założenie dla giełdy ({0}% rocznie)?': 'Woher kommt die Annahme für den Aktienmarkt ({0}% pro Jahr)?',
  'To średnia z historycznych, średniorocznych stóp zwrotu 5 głównych indeksów akcyjnych (z reinwestowanymi dywidendami, gdzie dostępne) - nie prognoza, tylko punkt odniesienia.':
    'Das ist der Durchschnitt der historischen, durchschnittlichen jährlichen Renditen von 5 wichtigen Aktienindizes (mit reinvestierten Dividenden, wo verfügbar) - keine Prognose, nur ein Referenzwert.',
  'Indeks': 'Index',
  'Okres': 'Zeitraum',
  'Średniorocznie': 'Durchschnitt p. a.',
  'Źródło': 'Quelle',
  'Średnia z powyższych': 'Durchschnitt der obigen Werte',
  'WIG20 i mWIG40 to indeksy warszawskiej giełdy (duże i średnie spółki), S&P 500 i Nasdaq to główne indeksy amerykańskie, a MSCI World / FTSE All-World obejmuje akcje z całego świata. Powyższe okresy to najdłuższe, dla których znalazłem wiarygodne, publicznie dostępne dane - dla WIG20/mWIG40 to karty funduszy śledzących te indeksy. Historyczne wyniki nie gwarantują przyszłych - pojedyncze lata potrafią być mocno ujemne.':
    'WIG20 und mWIG40 sind Indizes der Warschauer Börse (große und mittelgroße Unternehmen), S&P 500 und Nasdaq sind die wichtigsten US-Indizes, und MSCI World / FTSE All-World umfasst Aktien aus der ganzen Welt. Die oben genannten Zeiträume sind die längsten, für die ich verlässliche, öffentlich zugängliche Daten gefunden habe - für WIG20/mWIG40 sind das die Factsheets von Fonds, die diese Indizes nachbilden. Historische Ergebnisse garantieren keine zukünftigen - einzelne Jahre können stark negativ ausfallen.',

  // Residency / tax (Account settings)
  'Kraj rezydencji podatkowej': 'Steuerlicher Wohnsitz',
  'Nie podano': 'Nicht angegeben',
  'Na razie tylko informacyjne - w przyszłości posłuży do wyliczania podatków właściwych dla Twojego kraju.':
    'Vorerst nur informativ - wird künftig zur Berechnung länderspezifischer Steuern verwendet.',
  'Kraj rezydencji': 'Wohnsitzland',

  // Landing promotion banner (admin + public)
  'Zostało': 'Verbleibend',
  'Język zaproszenia': 'Sprache der Einladung',
  'Promocja na stronie': 'Aktion auf der Startseite',
  'Wizyty wg wariantu językowego': 'Besuche nach Sprachvariante',
  'Zaproszenia wysłane wg języka': 'Gesendete Einladungen nach Sprache',
  'Nowy baner na stronie głównej': 'Neuer Banner auf der Startseite',
  'Wskaż istniejące zaproszenie grupowe — baner pokaże jego link/kod QR i odliczanie do podanej daty. Liczba wykorzystań to liczba osób zarejestrowanych przez to zaproszenie.':
    'Wähle eine bestehende Gruppeneinladung aus - der Banner zeigt deren Link/QR-Code und einen Countdown bis zum angegebenen Datum. Die Nutzungszahl ist die Anzahl der Personen, die sich über diese Einladung registriert haben.',
  'Zaproszenie grupowe': 'Gruppeneinladung',
  'Wybierz…': 'Auswählen…',
  'Wiadomość (opcjonalnie)': 'Nachricht (optional)',
  'Koniec odliczania': 'Ende des Countdowns',
  'Nie udało się utworzyć promocji — sprawdź dane.': 'Aktion konnte nicht erstellt werden - überprüfe die Angaben.',
  'Brak promocji.': 'Keine Aktionen.',
  'Wyłączona': 'Deaktiviert',
  'Wygasła': 'Abgelaufen',
  'Aktywna': 'Aktiv',
  'Wyłącz': 'Deaktivieren',
  'Włącz': 'Aktivieren',
  'Zaproszenie {0}': 'Einladung {0}',
  'Wykorzystano {0} z {1}': '{0} von {1} genutzt',
  'Odliczanie do {0}': 'Countdown bis {0}',
  'Utwórz': 'Erstellen',

  // Residency-based tax estimate (investment calculator, dividends, portfolio)
  'Kwoty "po podatku" wyliczane w Usłudze na podstawie zadeklarowanego kraju rezydencji podatkowej (Polska, Niemcy, Hiszpania, USA, Wielka Brytania) są wyłącznie orientacyjnym szacunkiem opartym na uproszczonych, ogólnych stawkach i ulgach - nie uwzględniają indywidualnej sytuacji podatkowej Użytkownika (m.in. innych źródeł dochodu, stanu cywilnego, podatków stanowych czy lokalnych) i mogą odbiegać od rzeczywistego zobowiązania podatkowego. Usługodawca nie ponosi odpowiedzialności za błędy w tych wyliczeniach ani za decyzje podjęte na ich podstawie - w sprawach podatkowych należy skonsultować się z licencjonowanym doradcą podatkowym we właściwej jurysdykcji.':
    'Die im Dienst auf Grundlage des angegebenen steuerlichen Wohnsitzlands (Polen, Deutschland, Spanien, USA, Vereinigtes Königreich) berechneten "Nach-Steuer"-Beträge sind lediglich eine grobe Schätzung auf Basis vereinfachter, allgemeiner Sätze und Freibeträge - sie berücksichtigen nicht die individuelle steuerliche Situation des Nutzers (u. a. andere Einkommensquellen, Familienstand oder bundesstaatliche/lokale Steuern) und können von der tatsächlichen Steuerschuld abweichen. Der Diensteanbieter haftet nicht für Fehler in diesen Berechnungen oder für darauf basierende Entscheidungen - in Steuerfragen wenden Sie sich bitte an einen zugelassenen Steuerberater in der jeweiligen Jurisdiktion.',
  'Podaj kwotę i horyzont czasowy, żeby zobaczyć orientacyjny wynik dla różnych instrumentów, po podatku od zysków kapitałowych właściwym dla Twojego kraju rezydencji. Stawki obligacji skarbowych są pobierane na bieżąco, pozostałe oprocentowania możesz dowolnie zmienić.':
    'Gib einen Betrag und einen Zeithorizont ein, um ein ungefähres Ergebnis für verschiedene Anlageformen nach der für dein Wohnsitzland geltenden Kapitalertragsteuer zu sehen. Die Zinssätze der Staatsanleihen werden live abgerufen, die übrigen Zinssätze kannst du beliebig ändern.',
  'Po podatku od zysków kapitałowych (wg kraju rezydencji)': 'Nach Kapitalertragsteuer (je nach Wohnsitzland)',

  // Admin: per-user budget entry counts (no amounts)
  'Przychody wrzucone': 'Eingetragene Einnahmen',
  'Wydatki wrzucone': 'Eingetragene Ausgaben',
  'Wpisy budżetowe w ostatnich 30 dniach': 'Budgeteinträge in den letzten 30 Tagen',
  'Liczba wpisów dziennie - bez kwot.': 'Anzahl der Einträge pro Tag - ohne Beträge.',
  'skieta - Twoja wirtualna skarpeta z oszczędnościami.': 'skieta - Deine virtuelle Spar-Socke.',
  'Odśwież teraz': 'Jetzt aktualisieren',
  'Na tej podstawie szacujemy podatek od zysków kapitałowych i odsetek w całej aplikacji - to tylko orientacyjne wyliczenie, nie porada podatkowa.':
    'Auf dieser Grundlage schätzen wir die Kapitalertrag- und Zinssteuer in der gesamten App - nur eine grobe Schätzung, keine Steuerberatung.',

  // Admin: landing promotion per-language editing
  'Wiadomość': 'Nachricht',
  'Opcjonalnie - domyślnie użyty zostanie polski tekst': 'Optional - standardmäßig wird der polnische Text verwendet',
  'Tłumaczenie…': 'Übersetze…',
  '✨ Przetłumacz automatycznie': '✨ Automatisch übersetzen',
  'Wypełni EN/DE/ES na podstawie polskiego tekstu - możesz je potem dowolnie poprawić ręcznie.':
    'Füllt EN/DE/ES basierend auf dem polnischen Text aus - du kannst sie danach beliebig manuell anpassen.',
  'Usługa tłumaczenia jest chwilowo niedostępna - spróbuj ponownie później albo uzupełnij ręcznie.':
    'Der Übersetzungsdienst ist vorübergehend nicht verfügbar - versuche es später erneut oder trage den Text manuell ein.',

  // Account: delete account
  // Polityka prywatności - analityka bez ciasteczek
  'dostawca monitoringu błędów — dostaje techniczne zgłoszenie awarii (adres strony i ślad błędu w kodzie), nigdy treści Twoich danych finansowych ani zawartości formularzy,':
    'ein Anbieter für Fehler-Monitoring - erhält eine technische Fehlermeldung (Seitenadresse und Stacktrace), nie den Inhalt deiner Finanzdaten oder von Formularen,',
  'Analityka odwiedzin':
    'Besuchsanalyse',
  'Wcześniej korzystaliśmy z Google Analytics. Zrezygnowaliśmy z niego właśnie dlatego, że wymagał ciasteczek i Twojej zgody.':
    'Früher haben wir Google Analytics genutzt. Wir haben es genau deshalb abgeschafft, weil es Cookies und deine Einwilligung brauchte.',
  // Anulowanie usuwania konta
  'Zatrzymać usuwanie konta?':
    'Löschung des Kontos stoppen?',
  'Twoje konto jest w trakcie usuwania. Jeśli klikniesz poniżej, odblokujemy je razem ze wszystkimi danymi i będziesz mógł znowu się zalogować.':
    'Dein Konto wird gerade gelöscht. Klicke unten, dann entsperren wir es samt allen Daten und du kannst dich wieder anmelden.',
  'Tak, zatrzymaj usuwanie':
    'Ja, Löschung stoppen',
  'Nie, chcę usunąć konto':
    'Nein, Konto soll gelöscht werden',
  'Przywracanie…':
    'Wird wiederhergestellt…',
  'Zaloguj się →':
    'Anmelden →',
  'Ten link jest niekompletny. Otwórz go bezpośrednio z maila, który od nas dostałeś.':
    'Dieser Link ist unvollständig. Öffne ihn direkt aus unserer E-Mail.',
  'Nie udało się zatrzymać usuwania konta.':
    'Die Löschung konnte nicht gestoppt werden.',
  // Eksport danych (RODO art. 15/20)
  'Pobierz swoje dane': 'Deine Daten herunterladen',
  'Twoje dane należą do Ciebie. Pełna kopia w JSON zawiera wszystko, co przechowujemy na Twoim koncie. Pliki CSV otwierają się bezpośrednio w Excelu i arkuszach Google.':
    'Deine Daten gehören dir. Die vollständige JSON-Kopie enthält alles, was wir zu deinem Konto speichern. Die CSV-Dateien lassen sich direkt in Excel und Google Tabellen öffnen.',
  'Pełna kopia (JSON)': 'Vollständige Kopie (JSON)',
  'Transakcje (CSV)': 'Transaktionen (CSV)',
  'Portfel (CSV)': 'Portfolio (CSV)',
  'Pobieranie…': 'Wird heruntergeladen…',
  'Nie udało się pobrać pliku. Spróbuj ponownie za chwilę.': 'Die Datei konnte nicht heruntergeladen werden. Versuche es gleich noch einmal.',
  'Usuń konto': 'Konto löschen',
  'Konto zostanie zablokowane od razu, a po 30 dniach trwale usuniemy wszystkie Twoje dane: konta bankowe, transakcje, budżet, inwestycje i historię logowań. Przez te 30 dni możesz cofnąć decyzję linkiem z maila, który wyślemy. Zanim usuniesz konto, pobierz swoje dane w sekcji wyżej.':
    'Dein Konto wird sofort gesperrt, und nach 30 Tagen löschen wir alle deine Daten endgültig: Bankkonten, Transaktionen, Budget, Investitionen und Login-Verlauf. In diesen 30 Tagen kannst du das mit dem Link aus unserer E-Mail rückgängig machen. Lade deine Daten vorher im Abschnitt oben herunter.',
  'Wpisz {0}, żeby potwierdzić': 'Gib {0} ein, um zu bestätigen',
  'Wpisz dokładnie "{0}", żeby potwierdzić.': 'Gib genau "{0}" ein, um zu bestätigen.',
  'Czy na pewno chcesz usunąć konto? Zostanie zablokowane od razu, a po 30 dniach Twoje dane znikną bezpowrotnie. Link do cofnięcia wyślemy Ci mailem.':
    'Möchtest du dein Konto wirklich löschen? Es wird sofort gesperrt, und nach 30 Tagen sind deine Daten endgültig weg. Den Link zum Rückgängigmachen schicken wir dir per E-Mail.',
  'Usuwanie…': 'Wird gelöscht…',
  'Nie udało się usunąć konta.': 'Konto konnte nicht gelöscht werden.',

  // Admin: hard delete a user account
  'Trwałe usunięcie': 'Endgültige Löschung',
  'W przeciwieństwie do archiwizacji, to usuwa konto i wszystkie jego dane z bazy danych na stałe. Tej operacji nie można cofnąć.':
    'Im Gegensatz zur Archivierung wird das Konto und all seine Daten dauerhaft aus der Datenbank gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.',
  'Usuń trwale z bazy': 'Endgültig aus der Datenbank löschen',
  'Ta operacja jest nieodwracalna i trwale usunie konto oraz wszystkie dane użytkownika z bazy danych. Wpisz nazwę użytkownika "{0}", żeby potwierdzić.':
    'Diese Aktion ist unwiderruflich und löscht das Konto sowie alle Daten dieses Nutzers dauerhaft aus der Datenbank. Gib den Benutzernamen "{0}" ein, um zu bestätigen.',
  'Nazwa użytkownika się nie zgadza — anulowano.': 'Benutzername stimmt nicht überein — abgebrochen.',

  // Footer / landing mock card
  'Regulamin': 'Nutzungsbedingungen',
  'Dywidendy YTD': 'Dividenden YTD',

  // Admin: articles visibility per language
  'Artykuły': 'Artikel',
  'Widoczność artykułów': 'Sichtbarkeit der Artikel',
  'Artykuły są dziś pisane wyłącznie po polsku - wyłącz sekcję artykułów na stronie głównej dla języków, w których nie ma jeszcze tłumaczeń.':
    'Artikel werden heute ausschließlich auf Polnisch geschrieben - schalte den Artikelbereich auf der Startseite für Sprachen aus, für die es noch keine Übersetzungen gibt.',
  'widoczne': 'sichtbar',
  'ukryte': 'ausgeblendet',

  // Register: terms/privacy acceptance
  'Akceptuję': 'Ich akzeptiere',
  'Politykę prywatności': 'Datenschutzrichtlinie',
  'i': 'und',
  'Musisz zaakceptować regulamin i politykę prywatności.': 'Du musst die Nutzungsbedingungen und die Datenschutzrichtlinie akzeptieren.',
}
