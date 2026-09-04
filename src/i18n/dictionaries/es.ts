// Flat PL -> ES dictionary. Keys are the original Polish UI strings (used verbatim as
// fallback when no translation exists, and as the string shown when language === 'pl').
// Use {0}, {1}, ... placeholders for dynamic values passed as extra args to t().
export const es: Record<string, string> = {
  // Layout / nav
  'Giełda': 'Bolsa',
  'Konta i lokaty': 'Cuentas y depósitos',
  'Analiza': 'Análisis',
  'Dodaj posiadane konta, akcje, lokaty lub obligacje': 'Añade las cuentas, acciones, depósitos u obligaciones que tengas',
  '+ Dodaj pozycje': '+ Añadir posiciones',
  'Zmień język interfejsu': 'Cambiar el idioma de la interfaz',
  'Przełącz na jasny motyw': 'Cambiar al tema claro',
  'Przełącz na ciemny motyw': 'Cambiar al tema oscuro',
  'Wyloguj': 'Cerrar sesión',
  'Menu': 'Menú',

  // Login / Register
  'Nieprawidłowy login lub hasło.': 'Usuario o contraseña incorrectos.',
  'Zaloguj się do swojego portfela finansowego': 'Inicia sesión en tu portafolio financiero',
  'Login': 'Usuario',
  'Imię': 'Nombre',
  'Nazwisko': 'Apellido',
  'Hasło': 'Contraseña',
  'Logowanie…': 'Iniciando sesión…',
  'Zaloguj się': 'Iniciar sesión',
  'Nie masz konta?': '¿No tienes cuenta?',
  'Zarejestruj się': 'Regístrate',
  'Nie udało się zarejestrować.': 'No se pudo completar el registro.',
  'Załóż konto i zacznij śledzić swój majątek': 'Crea una cuenta y empieza a seguir tu patrimonio',
  'Tworzenie konta…': 'Creando la cuenta…',
  'Masz już konto?': '¿Ya tienes cuenta?',
  'Zapomniałeś hasła?': '¿Olvidaste tu contraseña?',
  '← Powrót do logowania': '← Volver al inicio de sesión',
  'Adres e-mail': 'Correo electrónico',
  'Wysyłanie…': 'Enviando…',
  'Podaj adres e-mail przypisany do konta — wyślemy link do resetu hasła.':
    'Indica el correo electrónico asociado a tu cuenta - te enviaremos un enlace para restablecer la contraseña.',
  'Jeśli podany adres e-mail istnieje w naszej bazie, wysłaliśmy na niego link do resetu hasła.':
    'Si ese correo electrónico existe en nuestra base de datos, te hemos enviado un enlace para restablecer la contraseña.',
  'Wyślij link do resetu': 'Enviar enlace de restablecimiento',
  'Link resetu hasła jest niepełny — otwórz go bezpośrednio z wiadomości e-mail.':
    'El enlace para restablecer la contraseña está incompleto - ábrelo directamente desde el correo electrónico.',
  'Hasło zostało zresetowane. Przekierowuję do logowania…': 'Contraseña restablecida. Redirigiendo al inicio de sesión…',
  'Ustaw nowe hasło do swojego konta.': 'Establece una nueva contraseña para tu cuenta.',
  'Zapisywanie…': 'Guardando…',
  'Ustaw nowe hasło': 'Establecer nueva contraseña',
  'Nie udało się zresetować hasła.': 'No se pudo restablecer la contraseña.',
  'Weryfikuję adres e-mail…': 'Verificando tu correo electrónico…',
  'Brak tokenu weryfikacyjnego w linku.': 'A este enlace le falta el token de verificación.',
  'Nie udało się potwierdzić adresu e-mail.': 'No se pudo verificar el correo electrónico.',
  'Przejdź do aplikacji →': 'Ir a la aplicación →',
  'Adres e-mail nie jest jeszcze potwierdzony': 'Tu correo electrónico aún no está verificado',
  'Wysłano nowy link weryfikacyjny — sprawdź skrzynkę.': 'Se envió un nuevo enlace de verificación - revisa tu bandeja de entrada.',
  'Sprawdź skrzynkę i kliknij link, który wysłaliśmy przy rejestracji.':
    'Revisa tu bandeja de entrada y haz clic en el enlace que te enviamos al registrarte.',
  'Dodaj adres e-mail poniżej, żeby móc go potwierdzić i odzyskać konto w razie potrzeby.':
    'Añade tu correo electrónico abajo para poder verificarlo y recuperar tu cuenta si lo necesitas.',
  'Wyślij link ponownie': 'Reenviar enlace',

  // Onboarding wizard
  'Konta': 'Cuentas',
  'Akcje': 'Acciones',
  'Lokaty': 'Depósitos',
  'Obligacje': 'Obligaciones',
  'Gotowe': 'Listo',
  'Dodaj posiadane rzeczy': 'Añade lo que ya tienes',
  'Wprowadź to, co już posiadasz — z prawdziwą, wsteczną datą zakupu — żeby historia i zyski liczyły się poprawnie od początku.':
    'Introduce lo que ya tienes - con la fecha de compra real y retroactiva - para que el historial y las ganancias se calculen correctamente desde el principio.',
  'Zakończ teraz →': 'Terminar ahora →',
  'Gotowe!': '¡Listo!',
  'Możesz w każdej chwili dodać kolejne rzeczy z tego samego kreatora — link znajdziesz w górnym menu.':
    'Puedes añadir más cosas con este mismo asistente en cualquier momento - encontrarás el enlace en el menú superior.',
  'Przejdź do pulpitu': 'Ir al panel',
  '← Wstecz': '← Atrás',
  'Dalej →': 'Siguiente →',
  'Bank': 'Banco',
  'Nazwa konta': 'Nombre de la cuenta',
  'Typ': 'Tipo',
  'Osobiste': 'Personal',
  'Oszczędnościowe': 'Ahorro',
  'Maklerskie': 'Bróker',
  'Firmowe': 'Empresarial',
  'Kryptowalutowe': 'Cripto',
  'osobiste': 'personal',
  'oszczędnościowe': 'ahorro',
  'maklerskie': 'bróker',
  'firmowe': 'empresarial',
  'kryptowalutowe': 'cripto',
  'Waluta': 'Moneda',
  'Obecne saldo': 'Saldo actual',
  '+ Dodaj konto': '+ Añadir cuenta',
  'Nie masz jeszcze żadnego konta z gotówką na zakup akcji? Dodaj je tutaj z aktualnym saldem — w kolejnym kroku możesz z niego "kupić" akcje, które faktycznie posiadasz.':
    '¿Todavía no tienes una cuenta con efectivo para comprar acciones? Añádela aquí con su saldo actual - en el siguiente paso podrás "comprar" desde ella las acciones que ya tienes.',
  'Wyszukaj spółkę': 'Buscar una empresa',
  'Ticker': 'Ticker',
  'Rynek': 'Mercado',
  'Ilość': 'Cantidad',
  'Cena zakupu/szt.': 'Precio de compra/ud.',
  'Data zakupu (wstecz)': 'Fecha de compra (retroactiva)',
  'Konto': 'Cuenta',
  '+ Dodaj pozycję': '+ Añadir posición',
  'Dla każdej posiadanej spółki podaj ilość, cenę i': 'Para cada empresa que poseas, indica la cantidad, el precio y',
  'prawdziwą datę zakupu': 'la fecha de compra real',
  '— dzięki temu historia i wykresy będą liczone poprawnie.': '- así el historial y los gráficos se calcularán correctamente.',
  'Nie udało się dodać pozycji.': 'No se pudo añadir la posición.',
  'Wybierz spółkę.': 'Selecciona una empresa.',
  'Jeśli wybierzesz konto, kwota zostanie od razu odjęta z jego salda — zostaw puste, jeśli tylko deklarujesz akcje, które już posiadasz.':
    'Si eliges una cuenta, el importe se descontará de su saldo de inmediato - déjalo en blanco si solo estás declarando acciones que ya posees.',
  'To pozycja, którą już posiadam — nie odejmuj środków z konta (tylko zapisz powiązanie).':
    'Esta es una posición que ya poseo - no descuentes fondos de la cuenta (solo guarda el vínculo).',
  'To lokata, którą już posiadam — nie odejmuj środków z konta (tylko zapisz powiązanie).':
    'Este es un depósito que ya poseo - no descuentes fondos de la cuenta (solo guarda el vínculo).',
  'To obligacja, którą już posiadam — nie odejmuj środków z konta (tylko zapisz powiązanie).':
    'Esta es una obligación que ya poseo - no descuentes fondos de la cuenta (solo guarda el vínculo).',
  'bez powiązania z kontem': 'sin vínculo con una cuenta',
  'Nie dodano jeszcze żadnych akcji.': 'Todavía no has añadido ninguna acción.',
  'wybierz…': 'selecciona…',
  'Powiąż z kontem (opcjonalnie)': 'Vincular con una cuenta (opcional)',
  'Kwota': 'Importe',
  'Oprocentowanie (%)': 'Tasa de interés (%)',
  'Data założenia': 'Fecha de apertura',
  'Data zakończenia': 'Fecha de finalización',
  'bez powiązania': 'sin vínculo',
  '+ Dodaj lokatę': '+ Añadir depósito',
  'Masz aktywną lokatę? Dodaj ją tutaj (opcjonalnie).': '¿Tienes un depósito activo? Añádelo aquí (opcional).',
  'Seria': 'Serie',
  'Wartość nominalna': 'Valor nominal',
  'Wartość obecna': 'Valor actual',
  'Bieżące oprocentowanie (%)': 'Tasa de interés actual (%)',
  'Data zakupu': 'Fecha de compra',
  'Data wykupu': 'Fecha de vencimiento',
  '+ Dodaj obligację': '+ Añadir obligación',
  'Masz obligacje skarbowe? Dodaj je tutaj (opcjonalnie).': '¿Tienes obligaciones del Tesoro? Añádelas aquí (opcional).',

  // Dashboard
  'Ładowanie…': 'Cargando…',
  'Gotówka': 'Efectivo',
  'Podsumowanie Twojego majątku, aktualizowane na bieżąco': 'Un resumen de tu patrimonio, actualizado en tiempo real',
  'Odświeżono {0}s temu (auto co 60s)': 'Actualizado hace {0}s (automático cada 60s)',
  '⟳ Odśwież teraz': '⟳ Actualizar ahora',
  'Wartość majątku': 'Patrimonio neto',
  'Zmiana wartości majątku': 'Variación del patrimonio neto',
  '1 dzień': '1 día',
  '1 tydzień': '1 semana',
  '1 miesiąc': '1 mes',
  'Od początku roku': 'Desde inicio de año',
  '1 rok': '1 año',
  '5 lat': '5 años',
  'brak danych': 'sin datos',
  'Przychody i wydatki (ten miesiąc)': 'Ingresos y gastos (este mes)',
  'Zobacz pełną analizę →': 'Ver análisis completo →',
  'Przychody': 'Ingresos',
  'Wydatki': 'Gastos',
  'Bilans': 'Balance',
  'Wartość majątku w czasie': 'Patrimonio neto a lo largo del tiempo',
  'Podział majątku': 'Distribución del patrimonio',
  'Realny zwrot': 'Rentabilidad real',
  'Wpłacone środki': 'Fondos aportados',
  'Zysk / strata': 'Ganancia / pérdida',
  'Zarobione odsetki': 'Intereses generados',
  'Na lokatach': 'En depósitos',
  'Na obligacjach': 'En obligaciones',

  // Banking
  'OTS – 3-miesięczne': 'OTS - 3 meses',
  'ROR – roczne, zmienne': 'ROR - 1 año, variable',
  'DOR – 2-letnie, zmienne': 'DOR - 2 años, variable',
  'TOS – 3-letnie, stałoprocentowe': 'TOS - 3 años, tasa fija',
  'COI – 4-letnie, indeksowane inflacją': 'COI - 4 años, indexada a la inflación',
  'EDO – 10-letnie, indeksowane inflacją': 'EDO - 10 años, indexada a la inflación',
  'ROS – rodzinne oszczędnościowe': 'ROS - ahorro familiar',
  'ROD – rodzinne, indeksowane inflacją': 'ROD - familiar, indexada a la inflación',
  'Inne': 'Otro',
  'Usunąć konto "{0}" ({1})? Tej operacji nie można cofnąć.': '¿Eliminar la cuenta "{0}" ({1})? Esta acción no se puede deshacer.',
  'Konta bankowe': 'Cuentas bancarias',
  'Konta bankowe łącznie': 'Total de cuentas bancarias',
  'Lokaty łącznie': 'Total de depósitos',
  'Obligacje łącznie': 'Total de obligaciones',
  'Suma kapitału': 'Capital total',
  'Suma wartości nominalnej': 'Valor nominal total',
  'Potrzebujesz co najmniej dwóch kont': 'Necesitas al menos dos cuentas',
  '⇄ Przelew': '⇄ Transferencia',
  '+ Konto': '+ Cuenta',
  'Edytuj': 'Editar',
  'Usuń': 'Eliminar',
  'Brak kont — dodaj pierwsze.': 'Todavía no hay cuentas - añade la primera.',
  'Historia przelewów': 'Historial de transferencias',
  '+ Lokata': '+ Depósito',
  'Oprocentowanie': 'Tasa de interés',
  'Koniec': 'Fin',
  'Już zarobiono': 'Ganado hasta ahora',
  'Szac. na koniec': 'Est. al vencimiento',
  'Status': 'Estado',
  'Operacje': 'Acciones',
  'aktywna': 'activo',
  'zamknięta': 'cerrado',
  'Zerwij': 'Cancelar',
  'Brak lokat.': 'No hay depósitos.',
  'Obligacje skarbowe': 'Obligaciones del Tesoro',
  '+ Obligacja': '+ Obligación',
  'Odsetki liczone metodą uproszczoną (proste, wg wpisanego bieżącego oprocentowania) — nie odwzorowuje dokładnie zmiennych/indeksowanych inflacją harmonogramów kapitalizacji poszczególnych serii.':
    'Los intereses se calculan con un método simplificado (interés simple, según la tasa actual que introduciste) - no reproduce con exactitud los calendarios de capitalización variables o indexados a la inflación de cada serie.',
  'Wykup': 'Vencimiento',
  'wykupiona': 'amortizada',
  'Wykup wcześniej': 'Amortizar anticipadamente',
  'Brak obligacji.': 'No hay obligaciones.',
  'Zapisz zmiany': 'Guardar cambios',
  'Dodaj konto': 'Añadir cuenta',
  'Konto źródłowe i docelowe muszą być różne.': 'La cuenta de origen y la de destino deben ser distintas.',
  'Nie udało się wykonać przelewu.': 'No se pudo realizar la transferencia.',
  'Wykonaj przelew': 'Realizar transferencia',
  'Zerwać lokatę i przelać {0} odsetek + kapitał na wybrane konto?': '¿Cancelar el depósito y transferir {0} de intereses + capital a la cuenta seleccionada?',
  'Wypłata: kapitał': 'Retiro: capital',
  'odsetki': 'intereses',
  'bez prowizji': 'sin comisión',
  'Potwierdź zerwanie': 'Confirmar cancelación',
  'Nie udało się zerwać lokaty.': 'No se pudo cancelar el depósito.',
  'Wybierz konto, na które mają wrócić środki.': 'Selecciona la cuenta a la que deben volver los fondos.',
  'Na koniec okresu': 'Al final del período',
  'Miesięczna': 'Mensual',
  'Dodaj lokatę': 'Añadir depósito',
  'Jeśli wybierzesz konto, kwota lokaty zostanie od razu odjęta z jego salda.': 'Si seleccionas una cuenta, el importe del depósito se descontará de su saldo de inmediato.',
  'Dodaj obligację': 'Añadir obligación',
  'Wykupić obligację wcześniej i przelać {0} odsetek + kapitał na wybrane konto?': '¿Amortizar la obligación anticipadamente y transferir {0} de intereses + capital a la cuenta seleccionada?',
  'Nie udało się wykupić obligacji.': 'No se pudo amortizar la obligación.',
  'Potwierdź wykup': 'Confirmar amortización',

  // Timeline
  'Timeline majątku': 'Cronología del patrimonio',
  'Sprawdź, jak realnie pomnożyłeś wpłacone środki — niezależnie od tego, ile do systemu dołożyłeś':
    'Comprueba cuánto has multiplicado realmente los fondos aportados - sin importar cuánto hayas añadido al sistema',
  '+ Wpłata / wypłata': '+ Ingreso / retiro',
  'Obecna wartość majątku': 'Patrimonio actual',
  'Wpłacone środki netto': 'Fondos netos aportados',
  'Realny zysk (pomnożenie)': 'Ganancia real (multiplicador)',
  'Historia wpłat / wypłat': 'Historial de ingresos / retiros',
  'Wpłata': 'Ingreso',
  'Wypłata': 'Retiro',
  'Brak wpłat/wypłat.': 'No hay ingresos ni retiros.',
  'Data': 'Fecha',
  'Notatka': 'Nota',
  'Zapisz': 'Guardar',

  // Account
  'Moje konto': 'Mi cuenta',
  'Zaloguj jako {0}': 'Sesión iniciada como {0}',
  'Nie udało się zapisać zmian.': 'No se pudieron guardar los cambios.',
  'Dane konta': 'Datos de la cuenta',
  'Nazwa użytkownika': 'Nombre de usuario',
  'E-mail': 'Correo electrónico',
  'Zapisano zmiany.': 'Cambios guardados.',
  'Zapisz dane': 'Guardar datos',
  'Nie udało się zmienić hasła.': 'No se pudo cambiar la contraseña.',
  'Nowe hasła nie są takie same.': 'Las nuevas contraseñas no coinciden.',
  'Zmiana hasła': 'Cambio de contraseña',
  'Bieżące hasło': 'Contraseña actual',
  'Nowe hasło': 'Nueva contraseña',
  'Powtórz nowe hasło': 'Repite la nueva contraseña',
  'Hasło zostało zmienione.': 'Contraseña cambiada.',
  'Zmień hasło': 'Cambiar contraseña',

  // Sub-nav
  'Portfel': 'Cartera',
  'Dywidendy': 'Dividendos',
  'Analiza spółek': 'Análisis de empresas',

  // Portfel
  'Anuluj': 'Cancelar',
  'Portfel akcji i ETF-ów': 'Cartera de acciones y ETF',
  'Suma wartości akcji': 'Valor total de acciones',
  'Łączny zysk/strata': 'Ganancia/pérdida total',
  'Kursy odświeżają się przy wejściu na tę stronę — kliknij "Odśwież kursy", by pobrać je ponownie':
    'Las cotizaciones se actualizan al entrar en esta página - haz clic en "Actualizar cotizaciones" para volver a obtenerlas',
  '⟳ Odśwież kursy': '⟳ Actualizar cotizaciones',
  'Notatki': 'Notas',
  '(odświeżanie…)': '(actualizando…)',
  '+ Nowa spółka': '+ Nueva empresa',
  '+ Kupno': '+ Compra',
  'Spółka': 'Empresa',
  'Śr. cena zakupu': 'Precio medio de compra',
  'Cena bieżąca': 'Precio actual',
  'Wartość': 'Valor',
  'Zysk/strata': 'Ganancia/pérdida',
  'Aktualizacja': 'Actualizado',
  'Sprzedaj': 'Vender',
  'Brak pozycji — dodaj pierwszą transakcję.': 'No hay posiciones - añade tu primera transacción.',
  'Historia transakcji': 'Historial de transacciones',
  'Kupno': 'Compra',
  'Sprzedaż': 'Venta',
  'Brak transakcji.': 'No hay transacciones.',
  'Dodaj spółkę': 'Añadir empresa',
  'Nie udało się zapisać transakcji.': 'No se pudo guardar la transacción.',
  'Wybierz konto, z którego pobrane zostaną środki.': 'Selecciona la cuenta de la que se tomarán los fondos.',
  'wybierz konto…': 'selecciona una cuenta…',
  'Brak konta w walucie {0} — dodaj je w zakładce Konta i lokaty.': 'No hay ninguna cuenta en {0} - añade una en la pestaña Cuentas y depósitos.',
  'Zapisz kupno': 'Guardar compra',
  'Nie udało się sprzedać akcji.': 'No se pudo vender la acción.',
  'Posiadasz tylko {0} szt.': 'Solo tienes {0} unidades.',
  'posiadasz': 'tienes',
  'szt.': 'ud.',
  'Szac. wpływ:': 'Ingreso estimado:',
  'Potwierdź sprzedaż': 'Confirmar venta',

  // ReinvestmentThreads
  'Start': 'Inicio',
  'Niezainwestowane': 'Sin invertir',
  'Obecna wartość': 'Valor actual',
  'Niezainwestowany kapitał': 'Capital sin invertir',
  'Ścieżki reinwestycji': 'Hilos de reinversión',
  '+ Nowa ścieżka': '+ Nuevo hilo',
  'Śledź, do ilu pomnożyła się konkretna kwota — np. zysk ze sprzedaży jednej spółki rozdzielony na kilka kolejnych zakupów, z opcjonalną dodatkową gotówką i niezainwestowaną resztą.':
    'Sigue cuánto se ha multiplicado una cantidad concreta - por ejemplo, la ganancia de la venta de una empresa repartida en varias compras posteriores, con efectivo adicional opcional y el resto sin invertir.',
  'Brak ścieżek — utwórz pierwszą.': 'Todavía no hay hilos - crea el primero.',
  'Usunąć całą ścieżkę „{0}”? Tej operacji nie można cofnąć.': '¿Eliminar todo el hilo "{0}"? Esta acción no se puede deshacer.',
  'Start:': 'Inicio:',
  'Usuń ścieżkę': 'Eliminar hilo',
  'Niezainwestowany kapitał początkowy:': 'Capital inicial sin invertir:',
  'Brak jeszcze żadnej pozycji w tej ścieżce.': 'Todavía no hay ninguna posición en este hilo.',
  'Nie udało się usunąć pozycji.': 'No se pudo eliminar la posición.',
  'Usunąć pozycję {0} z tej ścieżki?': '¿Eliminar la posición {0} de este hilo?',
  'wpłynęło': 'recibido',
  'sprzedano za': 'vendido por',
  'niezainwestowane': 'sin invertir',
  'obecna wartość': 'valor actual',
  'Zamknij (sprzedano)': 'Cerrar (vendido)',
  'Utwórz ścieżkę': 'Crear hilo',
  'Kapitał początkowy ścieżki (dostępne: {0})': 'Capital inicial del hilo (disponible: {0})',
  'Ze sprzedaży {0} (dostępne: {1})': 'De la venta de {0} (disponible: {1})',
  'Dodatkowa gotówka': 'Efectivo adicional',
  'Dodatkowa gotówka (spoza ścieżki)': 'Efectivo adicional (fuera del hilo)',
  'Wskaż co najmniej jedno źródło finansowania z kwotą większą od zera.': 'Indica al menos una fuente de financiación con un importe mayor que cero.',
  '+ Dodaj pozycję (reinwestycja)': '+ Añadir posición (reinversión)',
  'koszt': 'coste',
  'Źródła finansowania': 'Fuentes de financiación',
  'Suma finansowania:': 'Financiación total:',
  'koszt zakupu:': 'coste de compra:',
  'Zapisz pozycję': 'Guardar posición',
  'Nie udało się zamknąć pozycji.': 'No se pudo cerrar la posición.',
  'auto: proporcjonalnie': 'auto: proporcional',
  'Brak jeszcze transakcji sprzedaży tej spółki — dodaj ją najpierw w portfelu.': 'Todavía no hay ninguna venta de esta empresa - añádela primero en la cartera.',
  'Zamknij pozycję': 'Cerrar posición',

  // Dywidendy
  'Profil dywidendowy': 'Perfil de dividendos',
  'Ile zarabiasz na dywidendach i jaki to procent zainwestowanego kapitału': 'Cuánto ganas con los dividendos y qué porcentaje representa del capital invertido',
  'Dywidendy wykrywane są automatycznie — nie musisz nic wpisywać ręcznie.':
    'Los dividendos se detectan automáticamente - no tienes que introducir nada a mano.',
  'wykrywam dywidendy…': 'detectando dividendos…',
  'Wykrywam…': 'Detectando…',
  '⟳ Wykryj dywidendy': '⟳ Detectar dividendos',
  'Automatyczne wykrywanie odświeża się samo przy wejściu na tę stronę — ten przycisk wymusza sprawdzenie od razu.':
    'La detección automática se actualiza sola al entrar en esta página - este botón fuerza una comprobación inmediata.',
  '+ Dywidenda': '+ Dividendo',
  '+ Dodaj ręcznie': '+ Añadir manualmente',
  'Tylko dla wypłat, których automatyczne wykrywanie nie złapało (np. spółka spoza Yahoo Finance).':
    'Solo para los pagos que la detección automática no captó (por ejemplo, una empresa que no está en Yahoo Finance).',
  'Suma dywidend (wszystkie czasy)': 'Total de dividendos (histórico)',
  'Projekcja rocznego dochodu (12 mies.)': 'Proyección de ingresos anuales (12 meses)',
  'Planowane dywidendy': 'Próximos dividendos',
  'Szacunek na podstawie historycznego rytmu wypłat tej spółki (ostatnia kwota + średni odstęp) — nie jest to oficjalna zapowiedź zarządu.':
    'Estimación basada en el ritmo histórico de pagos de esta empresa (último importe + intervalo medio) - no es un anuncio oficial de la dirección.',
  'ok.': 'aprox.',
  'Dywidendy miesiąc do miesiąca': 'Dividendos mes a mes',
  'Udział spółek': 'Participación por empresa',
  'Brak danych.': 'No hay datos.',
  'Suma dywidend narastająco (12 mies.)': 'Dividendos acumulados (12 meses)',
  'Suma dywidend narastająco ({0} mies.)': 'Dividendos acumulados ({0} meses)',
  '{0} lat': '{0} años',
  'Suma dywidend': 'Total de dividendos',
  'Ostatnie 12 mies.': 'Últimos 12 meses',
  'Brak dywidend — dodaj pierwszą wypłatę.': 'Todavía no hay dividendos - añade el primer pago.',
  'Historia wypłat': 'Historial de pagos',
  'wykryta automatycznie': 'detectado automáticamente',
  'Brak wypłat.': 'No hay pagos.',
  'Kwota/akcję': 'Importe/acción',
  'Liczba akcji': 'Número de acciones',
  'Kwota łącznie': 'Importe total',
  'Data wypłaty': 'Fecha de pago',
  'Zapisz dywidendę': 'Guardar dividendo',

  // AnalizaSpolek
  'Komunikaty ESPI/EBI (GPW) i ważne newsy (USA) dla spółek z Twojego portfela — sprawdzane raz dziennie.':
    'Comunicados ESPI/EBI (GPW) y noticias importantes (EE. UU.) de las empresas de tu cartera - revisados una vez al día.',
  'Sprawdzam…': 'Comprobando…',
  '⟳ Sprawdź teraz': '⟳ Comprobar ahora',
  'Wszystkie spółki': 'Todas las empresas',
  'Pokaż tylko nowe': 'Mostrar solo las nuevas',
  'Nowe': 'Nuevas',
  'Brak komunikatów — kliknij „Sprawdź teraz” albo poczekaj na codzienne automatyczne sprawdzenie.':
    'Todavía no hay comunicados - haz clic en "Comprobar ahora" o espera a la comprobación automática diaria.',

  // Budget shared
  'Ten miesiąc': 'Este mes',
  'Poprzedni miesiąc': 'Mes anterior',
  'Ten rok': 'Este año',
  'Zakres własny': 'Rango personalizado',
  'Bez kategorii': 'Sin categoría',
  'Brak danych w tym okresie.': 'No hay datos en este período.',
  'wg kategorii — miesiąc do miesiąca': 'por categoría - mes a mes',
  'Kliknij kategorię poniżej, aby zobaczyć konkretne transakcje w wybranym okresie.': 'Haz clic en una categoría de abajo para ver sus transacciones concretas en el período seleccionado.',
  'Transakcje w okresie': 'Transacciones en el período',
  '+ Kategoria': '+ Categoría',
  'Brak transakcji w tym okresie.': 'No hay transacciones en este período.',
  'Wydatek': 'Gasto',
  'Przychód': 'Ingreso',
  'Dodaj kategorię': 'Añadir categoría',
  'Usunąć kategorię "{0}"? Powiązane transakcje zostaną oznaczone jako "Bez kategorii".': '¿Eliminar la categoría "{0}"? Las transacciones asociadas se marcarán como "Sin categoría".',
  'Kategorie': 'Categorías',
  'Usuń kategorię': 'Eliminar categoría',
  'Brak kategorii.': 'No hay categorías.',
  'bez kategorii': 'sin categoría',
  'bez sklepu': 'sin comercio',
  'Jeśli wybierzesz konto, kwota od razu zmieni jego saldo.': 'Si seleccionas una cuenta, el importe modificará su saldo de inmediato.',
  'Usunąć sklep "{0}"? Powiązane transakcje zostaną oznaczone jako "Bez sklepu".': '¿Eliminar el comercio "{0}"? Las transacciones asociadas se marcarán como "Sin comercio".',
  'Sklepy': 'Comercios',
  '+ Dodaj sklep': '+ Añadir comercio',
  'Usuń sklep': 'Eliminar comercio',
  'Brak sklepów — dodaj pierwszy powyżej.': 'Todavía no hay comercios - añade el primero arriba.',
  'Wydatki wg sklepów': 'Gastos por comercio',
  'Tylko transakcje, którym przypisano sklep. Kliknij sklep, aby zobaczyć jego transakcje.': 'Solo las transacciones con un comercio asignado. Haz clic en un comercio para ver sus transacciones.',
  'Brak wydatków przypisanych do sklepów w tym okresie.': 'No hay gastos asignados a comercios en este período.',
  'Bez sklepu': 'Sin comercio',

  // Bilans / Przychody / Wydatki
  'Przychody i wydatki razem — podział na kategorie i trend w czasie': 'Ingresos y gastos juntos - desglose por categoría y tendencia en el tiempo',
  '+ Przychód / wydatek': '+ Ingreso / gasto',
  'Przychody w okresie': 'Ingresos en el período',
  'Wydatki w okresie': 'Gastos en el período',
  'Przychody i wydatki — ostatnie 12 miesięcy': 'Ingresos y gastos - últimos 12 meses',
  'Przychody i wydatki w czasie': 'Ingresos y gastos a lo largo del tiempo',
  'Słupki': 'Barras',
  'Linia': 'Línea',
  'Obszar': 'Área',
  '{0} mies.': '{0} meses',
  'Wybierz co najmniej jedną serię do wyświetlenia.': 'Selecciona al menos una serie para mostrar.',
  'Skumulowany bilans (oszczędności)': 'Balance acumulado (ahorro)',
  'Suma miesięcznych bilansów narastająco — jak rósł Twój zaoszczędzony kapitał w tym okresie.':
    'Suma acumulada de los balances mensuales - cómo creció tu capital ahorrado en este período.',
  'Wydatki wg tagów': 'Gastos por etiqueta',
  'Przychody wg tagów': 'Ingresos por etiqueta',
  'Tylko transakcje z co najmniej jednym tagiem — transakcja z kilkoma tagami liczy się do każdego z nich.':
    'Solo las transacciones con al menos una etiqueta - una transacción con varias etiquetas cuenta para cada una de ellas.',
  'Brak transakcji z tagami w tym okresie.': 'No hay transacciones con etiquetas en este período.',
  'Bez tagu': 'Sin etiqueta',
  'Skąd biorą się Twoje przychody i jak zmieniają się w czasie': 'De dónde vienen tus ingresos y cómo cambian con el tiempo',
  '+ Przychód': '+ Ingreso',
  'Przychody: {0}': 'Ingresos: {0}',
  'Wydatki: {0}': 'Gastos: {0}',
  'Wydatki w wybranym sklepie': 'Gastos en el comercio seleccionado',
  'Na co wydajesz i jak zmienia się to w czasie': 'En qué gastas y cómo cambia con el tiempo',
  '+ Wydatek': '+ Gasto',
  'Wydatki wg kategorii': 'Gastos por categoría',
  'Przychody wg kategorii': 'Ingresos por categoría',

  // StockAutocomplete
  'Szukaj spółki (np. Apple, CD Projekt)…': 'Busca una empresa (p. ej. Apple, CD Projekt)…',
  'Szukam…': 'Buscando…',
  'Brak wyników.': 'Sin resultados.',

  // Page titles
  'Logowanie': 'Inicio de sesión',
  'Rejestracja': 'Registro',

  // Form field labels (Field label="…" props, translated by the shared Field component)
  'Nazwa ścieżki': 'Nombre del hilo',
  'Kwota początkowa': 'Importe inicial',
  'Data startu': 'Fecha de inicio',
  'Opis (opcjonalnie)': 'Descripción (opcional)',
  'Transakcja kupna': 'Transacción de compra',
  'Transakcja sprzedaży': 'Transacción de venta',
  'Kwota zrealizowana (opcjonalnie)': 'Importe realizado (opcional)',
  'Nazwa kategorii': 'Nombre de la categoría',
  'Kategoria': 'Categoría',
  'Sklep (opcjonalnie)': 'Comercio (opcional)',
  'Konto (opcjonalnie)': 'Cuenta (opcional)',
  'Saldo': 'Saldo',
  'Z konta': 'Desde la cuenta',
  'Na konto': 'A la cuenta',
  'Środki z konta': 'Fondos desde la cuenta',
  'Data rozpoczęcia': 'Fecha de inicio',
  'Kapitalizacja': 'Capitalización',
  'Konto docelowe': 'Cuenta de destino',
  'Typ obligacji': 'Tipo de obligación',
  'Seria (opcjonalnie)': 'Serie (opcional)',
  'Nazwa': 'Nombre',
  'Cena/szt.': 'Precio/ud.',
  'Prowizja': 'Comisión',
  'Ilość (max)': 'Cantidad (máx.)',
  'Środki na konto': 'Fondos a la cuenta',

  // Stock manager
  'Zarządzaj spółkami': 'Gestionar empresas',
  'Nie udało się usunąć spółki.': 'No se pudo eliminar la empresa.',
  'Usunąć spółkę {0} ({1})?': '¿Eliminar la empresa {0} ({1})?',
  'Przesuń w górę': 'Mover arriba',
  'Przesuń w dół': 'Mover abajo',
  'Brak spółek.': 'No hay empresas.',

  // Transaction category/store/tag editing
  'Kategoria/sklep/tagi': 'Categoría/comercio/etiquetas',
  'Tagi (opcjonalnie)': 'Etiquetas (opcional)',
  'Tagi': 'Etiquetas',
  'Kliknij tag, aby filtrować transakcje.': 'Haz clic en una etiqueta para filtrar las transacciones.',
  '+ Dodaj tag': '+ Añadir etiqueta',
  'Usunąć tag "{0}"?': '¿Eliminar la etiqueta "{0}"?',
  'Usuń tag': 'Eliminar etiqueta',
  'Brak tagów — dodaj pierwszy powyżej.': 'Todavía no hay etiquetas - añade la primera arriba.',

  // Belka tax P/L
  'Po podatku od zysków kapitałowych (19%)': 'Después del impuesto sobre ganancias de capital (19%)',
  'Zysk/strata po Belce': 'Ganancia/pérdida después de impuestos',

  // Planning
  'Planowanie': 'Planificación',
  'Planowanie budżetu': 'Planificación del presupuesto',
  'Twoja pensja, oszczędności, nadchodzące duże wydatki i cele, na które odkładasz.':
    'Tu sueldo, tus ahorros, los grandes gastos próximos y las metas para las que estás ahorrando.',
  'Pensja miesięczna': 'Sueldo mensual',
  'Śr. wydatki (3 mies.)': 'Gasto medio (3 meses)',
  'Wolny budżet / mies.': 'Presupuesto libre / mes',
  'Oszczędności (konta)': 'Ahorros (cuentas)',
  'Zarezerwowano na cele': 'Reservado para metas',
  'Cele oszczędnościowe': 'Metas de ahorro',
  '+ Cel': '+ Meta',
  'Brak celów — dodaj pierwszy.': 'Todavía no hay metas - añade la primera.',
  'Duże wydatki': 'Gastos grandes',
  'Brak zaplanowanych wydatków.': 'No hay gastos planificados.',
  'Cofnij': 'Deshacer',
  'Opłacone': 'Pagado',
  'Ustaw / zmień pensję miesięczną': 'Establecer / cambiar el sueldo mensual',
  'Pensja miesięczna (netto)': 'Sueldo mensual (neto)',
  'Nazwa celu': 'Nombre de la meta',
  'Kwota docelowa': 'Importe objetivo',
  'Już odłożono': 'Ya ahorrado',
  'Data docelowa (opcjonalnie)': 'Fecha objetivo (opcional)',
  'Notatka (opcjonalnie)': 'Nota (opcional)',
  'Dodaj cel': 'Añadir meta',
  'do': 'antes del',
  'Dołóż': 'Añadir fondos',
  'Kwota do dołożenia': 'Importe a añadir',
  'Nazwa wydatku': 'Nombre del gasto',
  'Termin': 'Fecha límite',
  'Dodaj wydatek': 'Añadir gasto',

  // Dividend simulation
  'Symulacja przyszłych dywidend (12 mies.)': 'Simulación de dividendos futuros (12 meses)',
  'Szacunek na podstawie obecnie posiadanych akcji i historycznego rytmu wypłat każdej spółki — nie jest to gwarancja przyszłych dywidend.':
    'Estimación basada en las acciones que tienes actualmente y el ritmo histórico de pagos de cada empresa - no es una garantía de dividendos futuros.',
  'Szacunkowe dywidendy w kolejnych latach': 'Dividendos estimados en los próximos años',
  'To samo założenie co powyżej (obecne akcje i historyczny rytm wypłat), zsumowane rok do roku na dłuższym horyzoncie.':
    'La misma hipótesis de arriba (acciones actuales y ritmo histórico de pagos), sumada año a año en un horizonte más largo.',
  'Za mało historii wypłat dla posiadanych spółek, żeby oszacować przyszłość.':
    'No hay suficiente historial de pagos de tus empresas para estimar el futuro.',
  'Szac. dywidendy': 'Dividendos est.',
  'Kolor oznacza pewność: najbliższa spodziewana wypłata każdej spółki (ostatnia znana kwota) vs. dalsze miesiące (uwzględniające szacowany wzrost dywidendy).':
    'El color indica la certeza: el próximo pago esperado de cada empresa (último importe conocido) frente a los meses siguientes (que incluyen el crecimiento estimado del dividendo).',
  'Najbliższa wypłata (znana kwota)': 'Próximo pago (importe conocido)',
  'Dalsza prognoza (szac. wzrost)': 'Previsión posterior (crecimiento est.)',
  'ogłoszona': 'anunciado',

  // Invite-only registration / streak / onboarding gate
  'Login lub e-mail': 'Usuario o correo electrónico',
  'Rejestracja jest dostępna tylko na zaproszenie od innego użytkownika — poproś o link lub zeskanuj kod QR.':
    'El registro es solo por invitación de otro usuario - pide un enlace o escanea un código QR.',
  'Masz już konto? Zaloguj się': '¿Ya tienes cuenta? Inicia sesión',
  'Rejestracja jest dostępna tylko na zaproszenie od innego użytkownika.': 'El registro es solo por invitación de otro usuario.',
  'Seria logowań: {0} dni': 'Racha de inicios de sesión: {0} días',
  'Zaproś znajomych': 'Invita a tus amigos',
  'Limit: bez ograniczeń': 'Límite: sin restricciones',
  'Pozostało w tym tygodniu: {0} z {1}': 'Quedan esta semana: {0} de {1}',
  '+ Wygeneruj zaproszenie': '+ Generar invitación',
  'Wykorzystano limit zaproszeń na ten tydzień — odnawia się na bieżąco, 7 dni po każdym zaproszeniu.':
    'Has agotado el límite de invitaciones de esta semana - se renueva de forma continua, 7 días después de cada invitación.',
  'Skopiowano!': '¡Copiado!',
  'Kopiuj link': 'Copiar enlace',
  'Pokaż QR': 'Mostrar QR',
  'Ukryj QR': 'Ocultar QR',
  'Zaakceptowane przez {0} ({1})': 'Aceptada por {0} ({1})',
  'Oczekuje — wygenerowano {0}': 'Pendiente - generada {0}',
  'Czy na pewno chcesz zmienić nazwę użytkownika? Można to zrobić tylko raz na 30 dni.':
    '¿Seguro que quieres cambiar tu nombre de usuario? Solo se puede hacer una vez cada 30 días.',
  'Dodaj co najmniej jedno konto bankowe, żeby przejść dalej.': 'Añade al menos una cuenta bancaria para continuar.',
  'Dodaj najpierw co najmniej jedno konto bankowe.': 'Primero añade al menos una cuenta bancaria.',

  // Color variants (theme)
  'Przełącz na lawendowy motyw': 'Cambiar al tema lavanda',
  'Wygląd': 'Apariencia',
  'Domyślny kolor interfejsu': 'Color predeterminado de la interfaz',
  'Jasny': 'Claro',
  'Ciemny': 'Oscuro',
  'Lawendowy': 'Lavanda',

  // Editor role / article CRM / admin role assignment
  'Redakcja': 'Redacción',
  'Masz uprawnienia redaktora — możesz dodawać i edytować artykuły.':
    'Tienes permisos de editor - puedes añadir y editar artículos.',
  'Przejdź do redakcji': 'Ir a la redacción',
  'Redakcja artykułów': 'Redacción de artículos',
  'Dodawaj i edytuj artykuły widoczne na stronie głównej.': 'Añade y edita los artículos que aparecen en la página principal.',
  '+ Nowy artykuł': '+ Nuevo artículo',
  'Edytuj artykuł': 'Editar artículo',
  'Nowy artykuł': 'Nuevo artículo',
  'Tytuł': 'Título',
  'Krótki opis': 'Descripción breve',
  'Treść': 'Contenido',
  'Opublikowany': 'Publicado',
  'Kolejność': 'Orden',
  'Nie udało się zapisać artykułu.': 'No se pudo guardar el artículo.',
  'szkic': 'borrador',
  'Autor: {0} • {1}': 'Autor: {0} • {1}',
  'Czy na pewno chcesz usunąć ten artykuł?': '¿Seguro que quieres eliminar este artículo?',
  'Nadaj admina': 'Otorgar administrador',
  'Odbierz admina': 'Revocar administrador',
  'Nadaj redaktora': 'Otorgar editor',
  'Odbierz redaktora': 'Revocar editor',

  // Financial cleanup phase: delete closed lokaty/bonds, unified category management
  'Czy na pewno chcesz usunąć tę lokatę?': '¿Seguro que quieres eliminar este depósito?',
  'Czy na pewno chcesz usunąć tę obligację?': '¿Seguro que quieres eliminar esta obligación?',
  'Kategorie, sklepy i tagi': 'Categorías, comercios y etiquetas',
  'Zarządzaj tu wszystkimi kategoriami, sklepami i tagami używanymi w budżecie — w jednym miejscu.':
    'Gestiona aquí todas las categorías, comercios y etiquetas usadas en tu presupuesto - en un solo lugar.',
  'Kategorie przychodów': 'Categorías de ingresos',
  'Kategorie wydatków': 'Categorías de gastos',
  'po Belce': 'después de impuestos',
  'Wykres pokazuje udział wartości każdej spółki w całym portfelu akcji. Przy każdej pozycji: pierwszy % to jej udział w portfelu, drugi (kolorowy) to zysk/strata na tej pozycji.':
    'El gráfico muestra la participación de cada empresa en el valor total de la cartera de acciones. Junto a cada posición: el primer % es su peso en la cartera, el segundo (en color) es la ganancia/pérdida de esa posición.',
  'Udział tej spółki w wartości całego portfela': 'Peso de esta empresa en el valor total de la cartera',
  'Zysk/strata (niezrealizowane) na tej pozycji': 'Ganancia/pérdida (no realizada) de esta posición',

  // Per-account language
  'Wygląd i język': 'Apariencia e idioma',
  'Język interfejsu': 'Idioma de la interfaz',

  // Feature-interest onboarding + account settings
  'Zainteresowania': 'Intereses',
  'Z czego chcesz korzystać? Odznacz to, czego nie potrzebujesz — zawsze możesz to zmienić później w ustawieniach konta.':
    '¿Qué quieres usar? Desmarca lo que no necesites - siempre puedes cambiarlo más tarde en la configuración de la cuenta.',
  'Budżet': 'Presupuesto',
  'Portfel akcji, dywidendy, analiza spółek': 'Cartera de acciones, dividendos, análisis de empresas',
  'Notowanie przychodów i wydatków': 'Registro de ingresos y gastos',
  'Cele oszczędnościowe i planowane wydatki': 'Metas de ahorro y gastos planificados',
  'Kalkulator inwestycyjny - obligacje, lokaty, giełda': 'Calculadora de inversión - obligaciones, depósitos, bolsa',
  'Z czego korzystasz': 'Lo que usas',
  'Odznaczone opcje znikają z górnego menu — możesz je włączyć z powrotem w każdej chwili.':
    'Las opciones desmarcadas desaparecen del menú superior - puedes volver a activarlas en cualquier momento.',

  // Chart type switcher
  'Wykres kołowy': 'Gráfico circular',
  'Wykres słupkowy': 'Gráfico de barras',

  // Feedback widget
  'Feedback': 'Comentarios',
  'Dziękujemy za wiadomość! Przeczytamy ją wkrótce.': '¡Gracias por tu mensaje! Lo leeremos pronto.',
  'Co możemy poprawić? Czego brakuje? Napisz śmiało.': '¿Qué podemos mejorar? ¿Qué falta? Escríbenos sin miedo.',
  'Twoja wiadomość…': 'Tu mensaje…',
  'Wyślij': 'Enviar',
  'Zostaw feedback': 'Deja un comentario',

  // Admin feedback triage tab
  'Użytkownicy': 'Usuarios',
  'Zrobione': 'Hecho',
  'Odrzucone': 'Rechazado',
  'Na później': 'Para más tarde',
  'Brak zgłoszeń spełniających kryteria.': 'No hay solicitudes que cumplan los criterios.',
  'Oznacz jako: {0}': 'Marcar como: {0}',
  'Tylko ważne': 'Solo importantes',
  'Ważne': 'Importante',
  'Oznacz jako ważne': 'Marcar como importante',
  'Odznacz ważne': 'Desmarcar como importante',

  // Invite by email
  'Wygeneruj link i kod QR, albo od razu podaj e-mail znajomego, żeby wysłać mu zaproszenie.':
    'Genera un enlace y un código QR, o indica directamente el correo de un amigo para enviarle la invitación.',
  'E-mail znajomego (opcjonalnie)': 'Correo del amigo (opcional)',
  '+ Wyślij zaproszenie mailem': '+ Enviar invitación por correo',

  // Growth summary "no data" state
  'Brak danych — zarejestruj pierwszą wpłatę, aby zobaczyć realny zwrot.':
    'No hay datos - registra tu primer ingreso para ver la rentabilidad real.',

  // Admin user detail page
  'Szczegóły': 'Detalles',
  '← Wróć do listy': '← Volver a la lista',
  'zarchiwizowane': 'archivada',
  'brak imienia i nazwiska': 'sin nombre ni apellido',
  'Nie znaleziono użytkownika.': 'Usuario no encontrado.',
  'E-mail zweryfikowany': 'Correo verificado',
  'tak': 'sí',
  'nie': 'no',
  'Status konta': 'Estado de la cuenta',
  'Wariant kolorystyczny': 'Variante de color',
  'Język': 'Idioma',
  'Role': 'Roles',
  'administrator': 'administrador',
  'redaktor': 'editor',
  'zwykły użytkownik': 'usuario normal',
  'Zarządzanie kontem': 'Gestión de la cuenta',
  'Przywrócić to konto z archiwum?': '¿Restaurar esta cuenta desde el archivo?',
  'Zarchiwizować to konto? Zostanie zablokowane, ale dane pozostaną zachowane.':
    '¿Archivar esta cuenta? Quedará bloqueada, pero sus datos se conservarán.',
  'Przywróć z archiwum': 'Restaurar desde el archivo',
  'Zarchiwizuj konto': 'Archivar cuenta',
  'Zarchiwizowano {0}': 'Archivada {0}',
  'Zaproszeni użytkownicy': 'Usuarios invitados',
  'Nikogo jeszcze nie zaprosił(a).': 'Todavía no ha invitado a nadie.',
  'Napisane artykuły': 'Artículos escritos',
  'Nie napisał(a) jeszcze żadnego artykułu.': 'Todavía no ha escrito ningún artículo.',
  'Statystyki aktywności': 'Estadísticas de actividad',
  'Aktywne dni łącznie': 'Total de días activos',
  'Aktywność w ostatnich 30 dniach': 'Actividad en los últimos 30 días',
  'aktywny': 'activo',
  'nieaktywny': 'inactivo',

  // Realny zwrot redesign, Belka tax parenthetical
  'Wpłacona kasa': 'Capital aportado',
  'Zysk': 'Ganancia',
  'po podatku Belki': 'después del impuesto sobre ganancias de capital',
  'To, co włożyłeś: majątek na starcie + przychody + wpłaty własne.':
    'Lo que aportaste: patrimonio inicial + ingresos + tus propias aportaciones.',
  'To, co zarobiłeś: odsetki na lokatach i obligacjach, zysk na akcjach oraz dywidendy (po podatku Belki).':
    'Lo que ganaste: intereses de depósitos y obligaciones, ganancias en acciones y dividendos (después del impuesto sobre ganancias de capital).',

  // Zmiana wartości majątku — expandable breakdown
  'Kliknij, aby zobaczyć podział zmiany na akcje, lokaty, obligacje i gotówkę':
    'Haz clic para ver el desglose de la variación por acciones, depósitos, obligaciones y efectivo',
  'Brak zmian w poszczególnych składnikach.': 'No hay cambios en los componentes individuales.',

  // Portfolio allocation legend + new analytics cards
  'Udział': 'Peso',
  'Podatek Belki przy sprzedaży dziś': 'Impuesto sobre ganancias de capital si vendieras hoy',
  'Ile fiskus zabrałby, gdybyś dziś sprzedał(a) wszystko na plusie.':
    'Cuánto se llevaría Hacienda si hoy vendieras todas las posiciones en ganancia.',
  'Dywidendy w tym roku': 'Dividendos este año',
  'Łącznie od zawsze: {0}': 'Total histórico: {0}',
  'Dywidendy w tym roku (po Belce)': 'Dividendos este año (después de impuestos)',
  'Brutto: {0} · Łącznie od zawsze: {1} ({2} po Belce)': 'Bruto: {0} · Total histórico: {1} ({2} después de impuestos)',

  // Stock reordering (drag & drop)
  'Przeciągnij, aby zmienić kolejność': 'Arrastra para reordenar',

  // Admin: Statystyki tab
  'Statystyki': 'Estadísticas',
  'Zaproszenia wysłane': 'Invitaciones enviadas',
  'Zaproszenia przyjęte': 'Invitaciones aceptadas',
  'Zaproszenia mailem': 'Invitaciones por correo',
  'Redaktorzy': 'Editores',
  'Zarchiwizowane konta': 'Cuentas archivadas',
  'Transakcje budżetowe': 'Transacciones del presupuesto',
  'Transakcje giełdowe': 'Transacciones bursátiles',
  'Role niestandardowe': 'Roles personalizados',
  'Wariant kolorystyczny użytkowników': 'Variante de color de los usuarios',
  'Zaproszenia wysłane mailem': 'Invitaciones enviadas por correo',
  'Brak zaproszeń wysłanych mailem.': 'No se han enviado invitaciones por correo.',
  'Zapraszający': 'Invitador',
  'Wysłano': 'Enviada',
  'Przyjęte przez {0}': 'Aceptada por {0}',
  'Wygasłe': 'Caducadas',
  'Oczekuje': 'Pendiente',
  'Wygasłe zaproszenia': 'Invitaciones caducadas',
  'Wysłane e-maile': 'Correos enviados',
  'Brak wygasłych zaproszeń.': 'No hay invitaciones caducadas.',
  'Nie wysłano jeszcze żadnych zaproszeń mailem.': 'Todavía no se ha enviado ninguna invitación por correo.',
  'Przyjęte': 'Aceptadas',

  // Admin: role/permission management
  'Nazwa roli': 'Nombre del rol',
  'Kolor roli': 'Color del rol',
  'Utwórz rolę': 'Crear rol',
  '+ Nowa rola': '+ Nuevo rol',
  'Twórz role z wybranym zestawem uprawnień i nadawaj je użytkownikom w ich profilu — niezależnie od statusu administratora/redaktora.':
    'Crea roles con el conjunto de permisos que elijas y asígnalos a los usuarios desde su perfil - de forma independiente al estado de administrador/editor.',
  '{0} uprawnień, {1} użytkowników': '{0} permisos, {1} usuarios',
  'Usunąć rolę {0}? Zostanie odebrana wszystkim {1} przypisanym użytkownikom.':
    '¿Eliminar el rol {0}? Se retirará a los {1} usuarios que lo tienen asignado.',
  'Brak ról.': 'No hay roles.',
  'Brak ról — utwórz je w zakładce "Role".': 'Todavía no hay roles - créalos en la pestaña "Roles".',
  'Podgląd statystyk aplikacji': 'Ver estadísticas de la aplicación',
  'Podgląd listy użytkowników': 'Ver lista de usuarios',
  'Zarządzanie użytkownikami (aktywacja, archiwizacja)': 'Gestionar usuarios (activación, archivado)',
  'Tworzenie i edycja artykułów': 'Crear y editar artículos',
  'Publikowanie artykułów': 'Publicar artículos',
  'Zarządzanie zgłoszeniami feedbacku': 'Gestionar solicitudes de comentarios',
  'Tworzenie i edycja ról': 'Crear y editar roles',

  // Invite friends — delete, sub-tabs, expiry
  'Oczekujące zaproszenia': 'Invitaciones pendientes',
  'Przyjęte zaproszenia': 'Invitaciones aceptadas',
  'Brak oczekujących zaproszeń.': 'No hay invitaciones pendientes.',
  'Brak przyjętych zaproszeń.': 'No hay invitaciones aceptadas.',
  'Usunąć ten link z zaproszeniem?': '¿Eliminar este enlace de invitación?',
  'Wygasło — wygenerowano {0}': 'Caducada - generada {0}',
  'Oczekuje — wygenerowano {0}, wygasa po 48h': 'Pendiente - generada {0}, caduca a las 48h',

  // Login history
  'Historia logowań': 'Historial de inicios de sesión',
  'Logowania ogółem': 'Total de inicios de sesión',
  'Aktualna passa': 'Racha actual',
  'Najdłuższa passa': 'Racha más larga',
  'Najczęstsza godzina': 'Hora más frecuente',
  '{0} dni': '{0} días',
  '{0} logowań': '{0} inicios de sesión',

  // Username change lock
  'Można zmienić od {0}': 'Se puede cambiar de nuevo a partir del {0}',

  // Savings goals — reserve from savings, multi-month payday reservations
  'Zarezerwuj z oszczędności': 'Reservar de los ahorros',
  'Zarezerwuj część pensji z jednego lub kilku konkretnych miesięcy naraz.':
    'Reserva parte de tu sueldo de uno o varios meses concretos a la vez.',
  'Miesiąc wypłaty': 'Mes de la nómina',
  '+ Dodaj kolejny miesiąc': '+ Añadir otro mes',
  'Kwota z oszczędności': 'Importe de los ahorros',

  // Privacy policy
  'Strona główna': 'Página principal',
  'Europa': 'Europa',
  'Polityka prywatności': 'Política de privacidad',
  '← Powrót na stronę główną': '← Volver a la página principal',
  'Kim jesteśmy': 'Quiénes somos',
  'Jakie dane zbieramy': 'Qué datos recopilamos',
  'Dane finansowe, które sam(a) wprowadzasz': 'Datos financieros que introduces tú mismo/a',
  'Dane techniczne i bezpieczeństwa': 'Datos técnicos y de seguridad',
  'Zgłoszenia i zaproszenia': 'Solicitudes e invitaciones',
  'Ciasteczka i local storage': 'Cookies y almacenamiento local',
  'Komu udostępniamy dane': 'Con quién compartimos los datos',
  'Jak długo przechowujemy dane': 'Cuánto tiempo conservamos los datos',
  'Twoje prawa': 'Tus derechos',
  'Bezpieczeństwo': 'Seguridad',
  'Zmiany tej polityki': 'Cambios en esta política',
  'Kontakt': 'Contacto',

  // Landing page
  'Dostępne wyłącznie na zaproszenie': 'Disponible solo por invitación',
  'Panuj nad': 'Toma el control de',
  'swoimi finansami': 'tus finanzas',
  'Zbudowane, żeby faktycznie z tego korzystać': 'Creada para que realmente la uses',
  'Nie kolejny arkusz kalkulacyjny — narzędzie, które samo liczy to, co dla Ciebie ważne.':
    'No es otra hoja de cálculo más - es una herramienta que calcula por ti lo que de verdad importa.',
  'Wszystko w jednym miejscu': 'Todo en un solo lugar',
  'Konta bankowe, akcje, obligacje i lokaty — jeden widok na cały Twój majątek, bez przełączania się między aplikacjami banków i domów maklerskich.':
    'Cuentas bancarias, acciones, obligaciones y depósitos - una sola vista de todo tu patrimonio, sin cambiar entre las apps de tu banco y tu bróker.',
  'Realny zwrot z inwestycji': 'Rentabilidad real de la inversión',
  'Zysk liczony osobno od wpłaconego kapitału — zobaczysz dokładnie, ile realnie zarobiłeś na lokatach, obligacjach i akcjach, po podatku Belki.':
    'Ganancia calculada por separado del capital aportado - verás exactamente cuánto has ganado de verdad con depósitos, obligaciones y acciones, después de impuestos.',
  'Budżet pod kontrolą': 'Presupuesto bajo control',
  'Automatyczny import wyciągów, kategorie, sklepy i tagi — analiza przychodów i wydatków, która sama się aktualizuje.':
    'Importación automática de extractos, categorías, comercios y etiquetas - un análisis de ingresos y gastos que se actualiza solo.',
  'Ustaw cel, rezerwuj kwoty z konkretnych wypłat lub z bieżących oszczędności i śledź postęp na żywo.':
    'Fija una meta, reserva importes de nóminas concretas o de tus ahorros actuales, y sigue el progreso en tiempo real.',
  'Dywidendy i podatki': 'Dividendos e impuestos',
  'Historia i prognoza wypłat dywidend, szacowany podatek Belki do zapłaty — żadnych niespodzianek przy rozliczeniu.':
    'Historial y previsión de pagos de dividendos, impuesto estimado a pagar - sin sorpresas a la hora de declarar.',
  'Twoje dane, Twoja kontrola': 'Tus datos, tu control',
  'Dostęp wyłącznie na zaproszenie, bez reklam i bez śledzenia. Historia logowań pokazuje dokładnie, kto i kiedy wchodził na Twoje konto.':
    'Acceso solo por invitación, sin anuncios y sin rastreo. El historial de inicios de sesión muestra exactamente quién entró en tu cuenta y cuándo.',
  'Jak to działa': 'Cómo funciona',
  'Dostajesz zaproszenie': 'Recibes una invitación',
  'Rejestracja jest możliwa tylko na zaproszenie od kogoś, kto już korzysta ze skieta.':
    'El registro solo es posible con una invitación de alguien que ya usa skieta.',
  'Dodajesz swoje konta': 'Añades tus cuentas',
  'Kilka minut wystarczy, żeby dodać konta bankowe, portfel akcji, lokaty i obligacje.':
    'Bastan unos minutos para añadir tus cuentas bancarias, tu cartera de acciones, depósitos y obligaciones.',
  'Widzisz cały obraz': 'Ves el panorama completo',
  'Dashboard aktualizuje się na bieżąco — majątek, zwrot z inwestycji i budżet w jednym miejscu.':
    'El panel se actualiza en tiempo real - patrimonio, rentabilidad de la inversión y presupuesto en un solo lugar.',
  'Masz już zaproszenie?': '¿Ya tienes una invitación?',
  'Zaloguj się i zobacz cały swój majątek w jednym miejscu — od razu po pierwszym dodaniu konta.':
    'Inicia sesión y ve todo tu patrimonio en un solo lugar - justo después de añadir tu primera cuenta.',

  // Request access — landing page form + admin review
  'Nie masz zaproszenia? Poproś o dostęp →': '¿No tienes invitación? Solicita acceso →',
  'Twój adres e-mail': 'Tu correo electrónico',
  'Poproś o dostęp': 'Solicitar acceso',
  'Dziękujemy! Sprawdź skrzynkę e-mail — napiszemy, gdy administrator rozpatrzy Twoją prośbę.':
    '¡Gracias! Revisa tu correo electrónico - te escribiremos en cuanto un administrador revise tu solicitud.',
  'Prośby o dostęp': 'Solicitudes de acceso',
  'Oczekujące': 'Pendientes',
  'Zaakceptowane': 'Aceptadas',
  'Zaakceptowano': 'Aceptada',
  'Odrzucono': 'Rechazada',
  'Zaakceptuj losowy procent oczekujących': 'Aceptar un porcentaje aleatorio de las pendientes',
  'Przydatne przy stopniowym otwieraniu dostępu — zamiast rozpatrywać każdą prośbę osobno.':
    'Útil para abrir el acceso de forma gradual - en lugar de revisar cada solicitud una por una.',
  'Zaakceptuj': 'Aceptar',
  'Zaakceptowano {0} z {1} oczekujących próśb.': 'Se aceptaron {0} de {1} solicitudes pendientes.',
  'Brak próśb w tej kategorii.': 'No hay solicitudes en esta categoría.',
  'Otrzymano {0}': 'Recibida {0}',
  '{0} przez {1}, {2}': '{0} por {1}, {2}',
  'Akceptuj': 'Aceptar',
  'Odrzuć': 'Rechazar',

  // Role acceptance workflow
  'Kliknięcie oferuje rolę — zaczyna obowiązywać dopiero, gdy użytkownik ją zaakceptuje.':
    'Al hacer clic se ofrece el rol - no entra en vigor hasta que el usuario lo acepta.',
  'Oczekuje na akceptację użytkownika — kliknij, aby wycofać ofertę': 'Esperando la aceptación del usuario - haz clic para retirar la oferta',
  'Zaakceptowana — kliknij, aby odebrać': 'Aceptado - haz clic para revocar',
  'Kliknij, aby zaoferować tę rolę': 'Haz clic para ofrecer este rol',
  '(oczekuje)': '(pendiente)',
  'Nowe role do zaakceptowania': 'Nuevos roles por aceptar',
  'Administrator zaproponował Ci nowe uprawnienia — nie zaczną obowiązywać, dopóki ich nie zaakceptujesz.':
    'Un administrador te ha propuesto nuevos permisos - no entrarán en vigor hasta que los aceptes.',
  'od {0}': 'de {0}',

  // Login back-link, updated budget feature card
  '← Strona główna': '← Página principal',
  'Przychody, wydatki i budżet': 'Ingresos, gastos y presupuesto',
  'Zarządzaj przychodami i wydatkami, monitoruj budżet miesiąc po miesiącu i sprawdzaj bilans — automatyczny import wyciągów, kategorie, sklepy i tagi robią to za Ciebie.':
    'Gestiona tus ingresos y gastos, controla tu presupuesto mes a mes y revisa tu balance - la importación automática de extractos, las categorías, los comercios y las etiquetas lo hacen por ti.',

  // Translation coverage sweep — everything a distinct-strings audit found
  // with no English entry yet, across Planowanie, AdminUsers, AnalizaSpolek,
  // StatementImportPanel, PrivacyPolicy, Landing, and assorted small labels.
  '+ Przychód/Wydatek': '+ Ingreso/Gasto',
  '+ Stały koszt': '+ Gasto fijo',
  'Administratorzy': 'Administradores',
  'Aktywni': 'Activos',
  'Aktywni dzisiaj': 'Activos hoy',
  'Aktywni użytkownicy dziennie (30 dni)': 'Usuarios activos diarios (30 días)',
  'Artykuły o finansach osobistych': 'Artículos sobre finanzas personales',
  'Brak stałych kosztów — dodaj pierwszy.': 'Todavía no hay gastos fijos - añade el primero.',
  'Brak użytkowników spełniających kryteria.': 'No hay usuarios que cumplan los filtros.',
  'Brak wycenionych pozycji w portfelu.': 'No hay posiciones valoradas en la cartera.',
  'Brak zarezerwowanych wypłat.': 'Todavía no hay nóminas reservadas.',
  'Czynsz, subskrypcje, ubezpieczenia — cykliczne opłaty co miesiąc, niezależnie od tego, czy już je zapłaciłeś w tym miesiącu.':
    'Alquiler, suscripciones, seguros - gastos recurrentes cada mes, los hayas pagado ya este mes o no.',
  'Czytaj więcej →': 'Leer más →',
  'Dane konta przechowujemy tak długo, jak konto jest aktywne. Kiedy usuniesz konto w ustawieniach, blokujemy je od razu, a po 30 dniach trwale kasujemy wszystkie Twoje dane. Przez te 30 dni możesz cofnąć decyzję linkiem z maila, który wysyłamy przy usuwaniu. Osobno administrator może zarchiwizować konto, czyli je zdezaktywować z zachowaniem danych — takie konto czeka, aż zdecydujesz, co dalej, i nie jest kasowane automatycznie.':
    'Conservamos los datos de tu cuenta mientras la cuenta esté activa. Cuando eliminas la cuenta desde los ajustes, la bloqueamos de inmediato y, pasados 30 días, borramos definitivamente todos tus datos. Durante esos 30 días puedes deshacerlo con el enlace del correo que te enviamos. Aparte de eso, un administrador puede archivar una cuenta, es decir, desactivarla conservando los datos: esa cuenta espera tu decisión y nunca se borra automáticamente.',
  'Danych nie sprzedajemy i nie udostępniamy w celach marketingowych. Współpracujemy wyłącznie z dostawcami niezbędnymi do działania serwisu:':
    'No vendemos tus datos ni los compartimos con fines de marketing. Solo trabajamos con los proveedores necesarios para el funcionamiento del servicio:',
  'Dashboard': 'Panel',
  'Dodaj': 'Añadir',
  'Dodaj stały koszt': 'Añadir gasto fijo',
  'Domyślna waluta': 'Moneda predeterminada',
  'Dołączył(a)': 'Se unió',
  'Dzień wypłaty pozwala policzyć, ile wypłat zostało do terminu każdego celu oszczędnościowego.':
    'El día de la nómina permite calcular cuántas nóminas quedan hasta la fecha límite de cada meta de ahorro.',
  'dostawca analityki bez ciasteczek — zbiorcze statystyki odwiedzin (patrz sekcja wyżej),':
    'un proveedor de analítica sin cookies - estadísticas agregadas de visitas (ver la sección anterior),',
  'Hasła są haszowane, komunikacja z aplikacją odbywa się przez HTTPS, a dostęp do panelu administratora mają wyłącznie konta z uprawnieniami administratora lub odpowiednią rolą — i nawet ten panel nie pokazuje treści Twoich transakcji ani sald, tylko zbiorcze statystyki. Treść danych finansowych nie jest też dostępna przez wbudowany panel Django — do bazy danych dociera się wyłącznie bezpośrednim, świadomym dostępem administracyjnym do infrastruktury, nie jednym kliknięciem w aplikacji.':
    'Las contraseñas se almacenan cifradas (hash), la comunicación con la aplicación se realiza por HTTPS, y solo las cuentas con permisos de administrador o un rol adecuado pueden acceder al panel de administración - e incluso ese panel nunca muestra el contenido de tus transacciones ni de tus saldos, solo estadísticas agregadas. El contenido de los datos financieros tampoco es accesible a través del panel integrado de Django - a la base de datos solo se llega mediante un acceso administrativo directo y deliberado a la infraestructura, no con un solo clic en la aplicación.',
  'Historia': 'Historial',
  'Importuj wyciąg z konta': 'Importar extracto de cuenta',
  'Kategoria widoczna tylko dla tego konta': 'Categoría visible solo para esta cuenta',
  'Koncentracja portfela': 'Concentración de la cartera',
  'Konta bankowe i ich salda, transakcje budżetowe, kategorie/sklepy/tagi, posiadane akcje i transakcje giełdowe, lokaty, obligacje, dywidendy, cele oszczędnościowe i plany budżetowe — czyli wszystko, co wpisujesz, żeby aplikacja mogła śledzić Twój majątek. Te dane widzisz tylko Ty — inni użytkownicy nie mają do nich dostępu, a panel administratora pokazuje wyłącznie zbiorcze liczby i aktywność konta (np. liczbę transakcji), nigdy treść Twoich transakcji czy sald.':
    'Cuentas bancarias y sus saldos, transacciones del presupuesto, categorías/comercios/etiquetas, las acciones que posees y sus transacciones bursátiles, depósitos, obligaciones, dividendos, metas de ahorro y planes de presupuesto - es decir, todo lo que introduces para que la aplicación pueda seguir tu patrimonio. Solo tú ves estos datos - otros usuarios no tienen acceso a ellos, y el panel de administración solo muestra cifras agregadas y actividad de la cuenta (por ejemplo, el número de transacciones), nunca el contenido de tus transacciones o saldos.',
  'Konta w innej walucie będą oznaczone jako walutowe — to tylko etykieta, nie wpływa na przeliczenia.':
    'Las cuentas en otra moneda se marcarán como "en moneda extranjera" - es solo una etiqueta, no afecta a las conversiones.',
  'Logowanie działa w oparciu o tokeny JWT przechowywane w local storage przeglądarki — to samo miejsce przechowuje wybrany motyw kolorystyczny i język, zanim zostaną zapisane na koncie. Nie ma żadnych skryptów reklamowych ani śledzących w celach marketingowych.':
    'El inicio de sesión funciona con tokens JWT guardados en el almacenamiento local del navegador - ese mismo lugar guarda el tema de color y el idioma elegidos antes de que se guarden en tu cuenta. No hay ningún script publicitario ni de rastreo con fines de marketing.',
  'Masz prawo do wglądu w swoje dane, ich poprawienia, przeniesienia i usunięcia. Dwa z nich załatwisz sam(a) w ustawieniach konta: "Pobierz swoje dane" daje pełną kopię wszystkiego, co przechowujemy (JSON plus tabele CSV do Excela), a "Usuń konto" uruchamia trwałe skasowanie danych. Większość informacji poprawisz bezpośrednio w ustawieniach. W pozostałych sprawach napisz na adres podany niżej albo skorzystaj z widgetu "Zostaw feedback" w aplikacji.':
    'Tienes derecho a consultar tus datos, corregirlos, llevártelos y solicitar su eliminación. Dos de esas cosas las haces tú mismo en los ajustes de la cuenta: "Descarga tus datos" te da una copia completa de todo lo que guardamos (JSON más tablas CSV para Excel) y "Eliminar cuenta" inicia el borrado definitivo. La mayoría de los datos los corriges directamente en los ajustes. Para cualquier otra cosa, escríbenos a la dirección de abajo o usa el widget de comentarios de la aplicación.',
  'Na plusie / na minusie / bez zmian': 'En ganancia / en pérdida / sin cambios',
  'Najgorsza pozycja': 'Peor posición',
  'Najlepsza pozycja': 'Mejor posición',
  'Największa pozycja': 'Posición más grande',
  'Nazwa użytkownika, imię i nazwisko, adres e-mail (jeśli podany) i hasło (przechowywane wyłącznie w postaci zahaszowanej, nigdy jawnym tekstem). Przy rejestracji zapisujemy też, z czyjego zaproszenia założono konto.':
    'Nombre de usuario, nombre y apellido, correo electrónico (si lo indicas) y contraseña (almacenada únicamente cifrada, nunca en texto plano). Al registrarte también guardamos con la invitación de quién se creó la cuenta.',
  'Nie udało się dodać tagu.': 'No se pudo añadir la etiqueta.',
  'Nie udało się przetworzyć pliku.': 'No se pudo procesar el archivo.',
  'Nie udało się zaimportować transakcji — spróbuj wgrać plik ponownie.': 'No se pudieron importar las transacciones - intenta subir el archivo de nuevo.',
  'Nie znaleziono artykułu.': 'Artículo no encontrado.',
  'Nowi w tym tygodniu': 'Nuevos esta semana',
  'Odblokuj': 'Desbloquear',
  'Odznacz wszystkie': 'Deseleccionar todo',
  'Opis': 'Descripción',
  'Ostatnia aktualizacja: 4 września 2026':
    'Última actualización: 4 de septiembre de 2026',
  'Ostatnia aktywność': 'Última actividad',
  'Ostatnie IP': 'Última IP',
  'Ostatnie logowanie': 'Último inicio de sesión',
  'Panel administratora': 'Panel de administración',
  'Pensja i dzień wypłaty ({0}. dnia miesiąca) — zmień': 'Sueldo y día de la nómina (día {0} del mes) - cambiar',
  'Plik PDF': 'Archivo PDF',
  'Podgląd wyciągu': 'Vista previa del extracto',
  'Podział wg rynku': 'Desglose por mercado',
  'Podział wg waluty': 'Desglose por moneda',
  'Podział wg konta maklerskiego': 'Desglose por cuenta de bróker',
  'Udział wartości portfela trzymanej na każdym koncie maklerskim. Zysk to zmiana wartości względem wpłaconego kapitału.':
    'Proporción del valor de la cartera en cada cuenta de bróker. La ganancia es el cambio de valor respecto al capital aportado.',
  'Udział tego konta w wartości całego portfela': 'Peso de esta cuenta en el valor total de la cartera',
  'Zmiana wartości względem wpłaconego kapitału na tym koncie': 'Cambio de valor respecto al capital aportado en esta cuenta',
  'Zainwestowano': 'Invertido',
  'Pozostałe ({0})': 'Otros ({0})',
  'Przy każdym logowaniu zapisujemy adres IP oraz podstawowe informacje o przeglądarce/systemie (User-Agent) — to podstawa historii logowań widocznej w Twoim koncie oraz ochrony przed nieautoryzowanym dostępem. Zapisujemy też, w które dni byłeś/aś aktywny(a) (do serii logowań i statystyk).':
    'En cada inicio de sesión registramos la dirección IP y datos básicos del navegador/sistema (User-Agent) - esto es la base del historial de inicios de sesión de tu cuenta y de la protección contra accesos no autorizados. También registramos en qué días estuviste activo/a (para las rachas y las estadísticas).',
  'Rola': 'Rol',
  'Skład, koncentracja i wyniki Twoich pozycji — przeliczone do jednej waluty, żeby dało się je sensownie porównać.':
    'La composición, la concentración y el rendimiento de tus posiciones - convertidos a una sola moneda para que se puedan comparar de forma coherente.',
  'Statystyki portfela': 'Estadísticas de la cartera',
  'Stałe koszty': 'Gastos fijos',
  'Stałe koszty / mies.': 'Gastos fijos / mes',
  'Suma': 'Total',
  'Szukaj': 'Buscar',
  'Termin wypłaty minął przed celem — dodaj więcej lub przesuń termin': 'La fecha de la nómina es anterior a la meta - añade más o retrasa la fecha límite',
  'Transakcje akcji': 'Transacciones de acciones',
  'Transakcje budżetu': 'Transacciones del presupuesto',
  'Treść zgłoszeń wysłanych przez widget "Zostaw feedback" oraz historia wysłanych zaproszeń (komu, kiedy, czy zostało przyjęte).':
    'El contenido de las solicitudes enviadas a través del widget "Deja un comentario" y el historial de invitaciones enviadas (a quién, cuándo, si fue aceptada).',
  'Ukryj historię': 'Ocultar historial',
  'Ustaw dzień wypłaty (u góry strony), żeby zobaczyć ile wypłat zostało do celu': 'Configura tu día de nómina (arriba de la página) para ver cuántas nóminas quedan hasta la meta',
  'Ustaw pensję miesięczną i dzień wypłaty': 'Configura tu sueldo mensual y tu día de nómina',
  'Uwagi': 'Notas',
  'Użytkownicy aplikacji i ich aktywność': 'Usuarios de la aplicación y su actividad',
  'Użytkownicy łącznie': 'Total de usuarios',

  'Liczymy odwiedziny i podstawowy ruch na stronie, ale robimy to bez ciasteczek analitycznych i bez profilowania. Nasz dostawca analityki nie zapisuje niczego na Twoim urządzeniu, nie tworzy identyfikatora, po którym można Cię rozpoznać na innych stronach, i nie zbiera Twojego adresu IP w postaci pozwalającej Cię zidentyfikować. Dlatego nie prosimy Cię o zgodę na ciasteczka i nie zobaczysz tu żadnego bannera.':
    'Contamos las visitas y el tráfico básico del sitio, pero lo hacemos sin cookies analíticas y sin perfilado. Nuestro proveedor de analítica no guarda nada en tu dispositivo, no crea ningún identificador que permita reconocerte en otros sitios y no recoge tu dirección IP de forma que te identifique. Por eso nunca te pedimos que aceptes cookies y no verás aquí ningún banner.',
  'W miarę rozwoju aplikacji ta strona będzie aktualizowana, a data ostatniej zmiany widoczna jest na górze strony.':
    'A medida que la aplicación evolucione, esta página se irá actualizando, y la fecha del último cambio se muestra en la parte superior de la página.',
  'W sprawach dotyczących danych osobowych napisz na:': 'Para asuntos relacionados con datos personales, escribe a:',
  'Waluta inna niż domyślna ({0})': 'Moneda distinta de la predeterminada ({0})',
  'Wczytywanie…': 'Cargando…',
  'Wgraj i pokaż podgląd': 'Subir y mostrar vista previa',
  'Wgraj wyciąg w formacie PDF (obecnie obsługiwane: PKO Bank Polski). Zanim cokolwiek zapiszemy, pokażemy podgląd transakcji do zatwierdzenia — i sprawdzimy, czy już ich kiedyś nie zaimportowano.':
    'Sube un extracto en formato PDF (actualmente compatible: PKO Bank Polski). Antes de guardar nada, te mostraremos una vista previa de las transacciones para que las confirmes - y comprobaremos si ya se habían importado antes.',
  'Wkrótce pojawią się tu pierwsze artykuły.': 'Pronto aparecerán aquí los primeros artículos.',
  'Wznów': 'Reanudar',
  'Zablokuj': 'Bloquear',
  'Zacznij zarządzać swoimi finansami →': 'Empieza a gestionar tus finanzas →',
  'Zaimportowano {0} transakcji, pominięto {1}.': 'Se importaron {0} transacciones, se omitieron {1}.',
  'Zaloguj się do aplikacji': 'Inicia sesión en la aplicación',
  'Wejdź do aplikacji': 'Entrar en la aplicación',
  'Wróć do swojego majątku': 'Vuelve a tu patrimonio',
  'Kontynuuj tam, gdzie skończyłeś/aś — Twój dashboard czeka.': 'Continúa donde lo dejaste - tu panel te está esperando.',
  'Zarezerwowano na duże wydatki': 'Reservado para gastos grandes',
  'Zarezerwuj z wypłaty': 'Reservar de la nómina',
  'Zatrzymaj': 'Detener',
  'Zatwierdź import ({0})': 'Confirmar importación ({0})',
  'Zaznacz wszystkie': 'Seleccionar todo',
  'Zaznaczono {0} z {1} transakcji do importu.': 'Seleccionadas {0} de {1} transacciones para importar.',
  'Zostaje po rezerwacjach i odkładaniu': 'Queda después de reservas y ahorro',
  'Zostało {0} wypłat — odkładaj ~{1} z każdej, żeby zdążyć': 'Quedan {0} nóminas - aparta ~{1} de cada una para llegar a tiempo',
  'Zrealizowany zysk/strata wg roku (po podatku Belki)': 'Ganancia/pérdida realizada por año (después de impuestos)',
  'Zweryfikowany e-mail': 'Correo verificado',
  'administratorzy': 'administradores',
  'aktywne': 'activo',
  'bardzo rozproszony': 'muy diversificado',
  'dostawca poczty e-mail — do wysyłki e-maili weryfikacyjnych, resetu hasła i zaproszeń,':
    'proveedor de correo electrónico - para enviar correos de verificación, restablecimiento de contraseña e invitaciones,',
  'hosting aplikacji i baza danych (Microsoft Azure),': 'alojamiento de la aplicación y base de datos (Microsoft Azure),',
  'już zaimportowano': 'ya importado',
  'login lub e-mail': 'usuario o correo electrónico',
  'mocno skoncentrowany': 'muy concentrado',
  'możliwy duplikat': 'posible duplicado',
  'niezweryfikowany': 'no verificado',
  'nigdy': 'nunca',
  'np. mBank': 'p. ej. mBank',
  'np. wakacje': 'p. ej. vacaciones',
  'odświeżanie…': 'actualizando…',
  'publiczne źródła danych rynkowych (np. Stooq, Yahoo Finance) — zapytania dotyczą wyłącznie tickerów giełdowych i kursów walut, nigdy Twoich danych osobowych.':
    'fuentes públicas de datos de mercado (p. ej. Stooq, Yahoo Finance) - las consultas se refieren únicamente a tickers bursátiles y tipos de cambio, nunca a tus datos personales.',
  'skieta to osobisty tracker finansowy — aplikacja dostępna wyłącznie na zaproszenie, bez reklam i bez sprzedaży danych osobom trzecim. Administratorem danych jest osoba prowadząca serwis skieta, z którą można się skontaktować pod adresem podanym na dole tej strony.':
    'skieta es un rastreador financiero personal - una aplicación disponible solo por invitación, sin anuncios y sin venta de datos a terceros. El responsable de los datos es la persona que administra skieta, con quien puedes ponerte en contacto en la dirección indicada al final de esta página.',
  'skieta łączy konta bankowe, inwestycje, lokaty i obligacje w jednym miejscu — zobacz, jak naprawdę rośnie Twój majątek, bez arkusza kalkulacyjnego i bez zgadywania.':
    'skieta reúne cuentas bancarias, inversiones, depósitos y obligaciones en un solo lugar - descubre cómo crece de verdad tu patrimonio, sin hojas de cálculo y sin adivinar.',
  'sprawdź — może to transfer własny': 'revisa - podría ser una transferencia entre tus propias cuentas',
  'umiarkowanie skoncentrowany': 'moderadamente concentrado',
  'walutowe': 'en moneda extranjera',
  'wszyscy': 'todos',
  'wszystkie': 'todas',
  'wszystkie konta': 'todas las cuentas',
  'zablokowane': 'bloqueado',
  'zdywersyfikowany': 'diversificado',
  'zweryfikowany': 'verificado',
  'zwykli użytkownicy': 'usuarios normales',
  '{0} lat {1} mies.': '{0} años {1} meses',
  '{0}. dnia miesiąca': 'el día {0} del mes',
  'Śr. czas trzymania (ważony wartością)': 'Tiempo medio de tenencia (ponderado por valor)',
  '← Wszystkie artykuły': '← Todos los artículos',
  '⇪ Importuj wyciąg': '⇪ Importar extracto',

  // Investment calculator (Analiza tab)
  'Kalkulator inwestycyjny': 'Calculadora de inversión',
  'Podaj kwotę i horyzont czasowy, żeby zobaczyć orientacyjny wynik dla różnych instrumentów, po podatku Belki (19%). Stawki obligacji skarbowych są pobierane na bieżąco, pozostałe oprocentowania możesz dowolnie zmienić.':
    'Indica un importe y un horizonte temporal para ver un resultado orientativo de distintos instrumentos, después del impuesto sobre ganancias de capital (19%). Las tasas de las obligaciones del Tesoro se obtienen en tiempo real; las demás tasas puedes cambiarlas libremente.',
  'To nie jest porada inwestycyjna ani rekomendacja - to tylko symulacja na podstawie oprocentowań, które sam(a) wybierasz lub które są historyczne. Realne wyniki mogą się różnić, szczególnie dla giełdy.':
    'Esto no es un consejo de inversión ni una recomendación - es solo una simulación basada en tasas que tú eliges o que son históricas. Los resultados reales pueden diferir, especialmente en el caso de la bolsa.',
  'Kwota do zainwestowania': 'Importe a invertir',
  'Horyzont (lata)': 'Horizonte (años)',
  'Wynik po {0} {1} (po podatku Belki)': 'Resultado tras {0} {1} (después de impuestos)',
  'roku': 'año',
  'latach': 'años',
  'Wartość końcowa': 'Valor final',
  'Wartość końcowa po podatku': 'Valor final después de impuestos',
  'Ostatnia znana stawka - nie udało się pobrać bieżącej oferty.': 'Última tasa conocida - no se pudo obtener la oferta actual.',
  'Aktualne oprocentowanie z pierwszego okresu odsetkowego (obligacjeskarbowe.pl).':
    'Tasa de interés actual del primer período (obligacjeskarbowe.pl).',
  'Oprocentowanie stałe przez cały okres trwania obligacji - nie zmienia się.':
    'Tasa fija durante toda la vida de la obligación - no cambia.',
  'Oprocentowanie zmienne, oparte o stawkę WIBOR - resetowane co okres odsetkowy. Pokazana stawka dotyczy tylko pierwszego okresu, kolejne mogą być inne.':
    'Tasa variable, basada en el índice WIBOR - se reajusta en cada período de interés. La tasa mostrada corresponde solo al primer período; los siguientes pueden ser distintos.',
  'Pierwszy rok: stałe oprocentowanie. Kolejne lata: inflacja + marża. Pokazana stawka to tylko pierwszy okres - wynik w kolejnych latach zależy od przyszłej inflacji.':
    'Primer año: tasa fija. Años siguientes: inflación + margen. La tasa mostrada es solo la del primer período - el resultado de los años siguientes depende de la inflación futura.',
  'Lokata bankowa': 'Depósito bancario',
  'Przykładowe oprocentowanie roczne - zmień na stawkę z oferty swojego banku. Środki chronione gwarancją BFG do 100 000 EUR.':
    'Tasa anual de ejemplo - cámbiala por la de la oferta de tu banco. Los fondos están protegidos por la garantía del BFG hasta 100.000 EUR.',
  'Konto oszczędnościowe': 'Cuenta de ahorro',
  'Przykładowe oprocentowanie - zwykle zmienne, bank może je zmienić w dowolnym momencie. Też objęte gwarancją BFG.':
    'Tasa de ejemplo - normalmente variable, el banco puede cambiarla en cualquier momento. También cubierta por la garantía del BFG.',
  'Giełda (średnio, szeroki rynek)': 'Bolsa (media, mercado amplio)',
  'Średnia z 5 głównych indeksów (rozbicie i źródła niżej) - historyczna, nie gwarantowana. Realny wynik pojedynczego roku może być mocno na plusie albo na minusie.':
    'Media de 5 índices principales (desglose y fuentes más abajo) - histórica, no garantizada. El resultado real de un año concreto puede ser muy positivo o muy negativo.',
  'Instrument': 'Instrumento',
  'Ryzyko': 'Riesgo',
  'Bardzo niskie': 'Muy bajo',
  'Niskie': 'Bajo',
  'Wysokie': 'Alto',
  'Zysk (brutto)': 'Ganancia (bruta)',
  'Zysk po podatku Belki': 'Ganancia después de impuestos',
  'Skąd wzięło się założenie dla giełdy ({0}% rocznie)?': '¿De dónde sale la hipótesis para la bolsa ({0}% anual)?',
  'To średnia z historycznych, średniorocznych stóp zwrotu 5 głównych indeksów akcyjnych (z reinwestowanymi dywidendami, gdzie dostępne) - nie prognoza, tylko punkt odniesienia.':
    'Es la media de las rentabilidades medias anuales históricas de 5 índices bursátiles principales (con dividendos reinvertidos cuando están disponibles) - no es una previsión, solo un punto de referencia.',
  'Indeks': 'Índice',
  'Okres': 'Período',
  'Średniorocznie': 'Media anual',
  'Źródło': 'Fuente',
  'Średnia z powyższych': 'Media de lo anterior',
  'WIG20 i mWIG40 to indeksy warszawskiej giełdy (duże i średnie spółki), S&P 500 i Nasdaq to główne indeksy amerykańskie, a MSCI World / FTSE All-World obejmuje akcje z całego świata. Powyższe okresy to najdłuższe, dla których znalazłem wiarygodne, publicznie dostępne dane - dla WIG20/mWIG40 to karty funduszy śledzących te indeksy. Historyczne wyniki nie gwarantują przyszłych - pojedyncze lata potrafią być mocno ujemne.':
    'WIG20 y mWIG40 son índices de la bolsa de Varsovia (empresas grandes y medianas), S&P 500 y Nasdaq son los principales índices estadounidenses, y MSCI World / FTSE All-World abarca acciones de todo el mundo. Los períodos anteriores son los más largos para los que encontré datos fiables y disponibles públicamente - en el caso de WIG20/mWIG40, son las fichas de los fondos que replican esos índices. Los resultados históricos no garantizan los futuros - años concretos pueden ser marcadamente negativos.',

  // Residency / tax (Account settings)
  'Kraj rezydencji podatkowej': 'País de residencia fiscal',
  'Nie podano': 'No indicado',
  'Na razie tylko informacyjne - w przyszłości posłuży do wyliczania podatków właściwych dla Twojego kraju.':
    'Por ahora es solo informativo - en el futuro se usará para calcular los impuestos correspondientes a tu país.',
  'Kraj rezydencji': 'País de residencia',

  // Landing promotion banner (admin + public)
  'Zostało': 'Restante',
  'Język zaproszenia': 'Idioma de la invitación',
  'Promocja na stronie': 'Promoción en la página de inicio',
  'Wizyty wg wariantu językowego': 'Visitas por variante de idioma',
  'Zaproszenia wysłane wg języka': 'Invitaciones enviadas por idioma',
  'Nowy baner na stronie głównej': 'Nuevo banner en la página de inicio',
  'Wskaż istniejące zaproszenie grupowe — baner pokaże jego link/kod QR i odliczanie do podanej daty. Liczba wykorzystań to liczba osób zarejestrowanych przez to zaproszenie.':
    'Selecciona una invitación grupal existente - el banner mostrará su enlace/código QR y una cuenta regresiva hasta la fecha indicada. El número de usos es la cantidad de personas que se registraron mediante esa invitación.',
  'Zaproszenie grupowe': 'Invitación grupal',
  'Wybierz…': 'Selecciona…',
  'Wiadomość (opcjonalnie)': 'Mensaje (opcional)',
  'Koniec odliczania': 'Fin de la cuenta regresiva',
  'Nie udało się utworzyć promocji — sprawdź dane.': 'No se pudo crear la promoción - comprueba los datos.',
  'Brak promocji.': 'Sin promociones.',
  'Wyłączona': 'Desactivada',
  'Wygasła': 'Caducada',
  'Aktywna': 'Activa',
  'Wyłącz': 'Desactivar',
  'Włącz': 'Activar',
  'Zaproszenie {0}': 'Invitación {0}',
  'Wykorzystano {0} z {1}': 'Usadas {0} de {1}',
  'Odliczanie do {0}': 'Cuenta regresiva hasta {0}',
  'Utwórz': 'Crear',

  // Residency-based tax estimate (investment calculator, dividends, portfolio)
  'Kwoty "po podatku" wyliczane w Usłudze na podstawie zadeklarowanego kraju rezydencji podatkowej (Polska, Niemcy, Hiszpania, USA, Wielka Brytania) są wyłącznie orientacyjnym szacunkiem opartym na uproszczonych, ogólnych stawkach i ulgach - nie uwzględniają indywidualnej sytuacji podatkowej Użytkownika (m.in. innych źródeł dochodu, stanu cywilnego, podatków stanowych czy lokalnych) i mogą odbiegać od rzeczywistego zobowiązania podatkowego. Usługodawca nie ponosi odpowiedzialności za błędy w tych wyliczeniach ani za decyzje podjęte na ich podstawie - w sprawach podatkowych należy skonsultować się z licencjonowanym doradcą podatkowym we właściwej jurysdykcji.':
    'Los importes "después de impuestos" calculados en el Servicio a partir del país de residencia fiscal declarado (Polonia, Alemania, España, EE. UU., Reino Unido) son solo una estimación orientativa basada en tasas y deducciones generales simplificadas - no tienen en cuenta la situación fiscal individual del Usuario (entre otros, otras fuentes de ingresos, estado civil o impuestos estatales/locales) y pueden diferir de la obligación fiscal real. El Proveedor del Servicio no se hace responsable de errores en estos cálculos ni de las decisiones tomadas en base a ellos - para cuestiones fiscales, consulte a un asesor fiscal autorizado en la jurisdicción correspondiente.',
  'Podaj kwotę i horyzont czasowy, żeby zobaczyć orientacyjny wynik dla różnych instrumentów, po podatku od zysków kapitałowych właściwym dla Twojego kraju rezydencji. Stawki obligacji skarbowych są pobierane na bieżąco, pozostałe oprocentowania możesz dowolnie zmienić.':
    'Indica un importe y un horizonte temporal para ver un resultado orientativo de distintos instrumentos, después del impuesto sobre ganancias de capital que corresponde a tu país de residencia. Las tasas de las obligaciones del Tesoro se obtienen en tiempo real; las demás tasas puedes cambiarlas libremente.',
  'Po podatku od zysków kapitałowych (wg kraju rezydencji)': 'Después del impuesto sobre ganancias de capital (según el país de residencia)',

  // Admin: per-user budget entry counts (no amounts)
  'Przychody wrzucone': 'Ingresos registrados',
  'Wydatki wrzucone': 'Gastos registrados',
  'Wpisy budżetowe w ostatnich 30 dniach': 'Movimientos de presupuesto en los últimos 30 días',
  'Liczba wpisów dziennie - bez kwot.': 'Número de movimientos por día - sin importes.',
  'skieta - Twoja wirtualna skarpeta z oszczędnościami.': 'skieta - Tu calcetín virtual de ahorros.',
  'Odśwież teraz': 'Actualizar ahora',
  'Na tej podstawie szacujemy podatek od zysków kapitałowych i odsetek w całej aplikacji - to tylko orientacyjne wyliczenie, nie porada podatkowa.':
    'Con esto estimamos el impuesto sobre ganancias de capital e intereses en toda la aplicación - es solo una estimación orientativa, no un asesoramiento fiscal.',

  // Admin: landing promotion per-language editing
  'Wiadomość': 'Mensaje',
  'Opcjonalnie - domyślnie użyty zostanie polski tekst': 'Opcional - por defecto se usará el texto en polaco',
  'Tłumaczenie…': 'Traduciendo…',
  '✨ Przetłumacz automatycznie': '✨ Traducir automáticamente',
  'Wypełni EN/DE/ES na podstawie polskiego tekstu - możesz je potem dowolnie poprawić ręcznie.':
    'Rellena EN/DE/ES a partir del texto en polaco - luego puedes editarlos libremente a mano.',
  'Usługa tłumaczenia jest chwilowo niedostępna - spróbuj ponownie później albo uzupełnij ręcznie.':
    'El servicio de traducción no está disponible en este momento - inténtalo más tarde o complétalo a mano.',

  // Account: delete account
  // Polityka prywatności - analityka bez ciasteczek
  'Aplikacja i baza danych stoją w centrum danych Microsoft Azure w Polsce (region Poland Central), a serwer pocztowy w Polsce. Zgłoszenia o awariach trafiają do europejskiego regionu dostawcy monitoringu. Twoje dane finansowe nie opuszczają Europejskiego Obszaru Gospodarczego.':
    'La aplicación y la base de datos están en un centro de datos de Microsoft Azure en Polonia (la región Poland Central), y el servidor de correo también está en Polonia. Los informes de fallos van a la región europea de nuestro proveedor de monitorización. Tus datos financieros no salen del Espacio Económico Europeo.',
  'dostawca monitoringu błędów — dostaje techniczne zgłoszenie awarii (adres strony i ślad błędu w kodzie), nigdy treści Twoich danych finansowych ani zawartości formularzy,':
    'un proveedor de monitorización de errores - recibe un informe técnico del fallo (la dirección de la página y la traza del error), nunca el contenido de tus datos financieros ni de los formularios,',
  'Analityka odwiedzin':
    'Analítica de visitas',
  'Wcześniej korzystaliśmy z Google Analytics. Zrezygnowaliśmy z niego właśnie dlatego, że wymagał ciasteczek i Twojej zgody.':
    'Antes usábamos Google Analytics. Lo dejamos precisamente porque necesitaba cookies y tu consentimiento.',
  // Anulowanie usuwania konta
  'Zatrzymać usuwanie konta?':
    '¿Detener la eliminación de la cuenta?',
  'Twoje konto jest w trakcie usuwania. Jeśli klikniesz poniżej, odblokujemy je razem ze wszystkimi danymi i będziesz mógł znowu się zalogować.':
    'Tu cuenta está en proceso de eliminación. Pulsa abajo y la desbloquearemos con todos tus datos para que puedas volver a entrar.',
  'Tak, zatrzymaj usuwanie':
    'Sí, detener la eliminación',
  'Nie, chcę usunąć konto':
    'No, quiero eliminar la cuenta',
  'Przywracanie…':
    'Restaurando…',
  'Zaloguj się →':
    'Iniciar sesión →',
  'Ten link jest niekompletny. Otwórz go bezpośrednio z maila, który od nas dostałeś.':
    'Este enlace está incompleto. Ábrelo directamente desde el correo que te enviamos.',
  'Nie udało się zatrzymać usuwania konta.':
    'No se pudo detener la eliminación de la cuenta.',
  // Eksport danych (RODO art. 15/20)
  'Pobierz swoje dane': 'Descarga tus datos',
  'Twoje dane należą do Ciebie. Pełna kopia w JSON zawiera wszystko, co przechowujemy na Twoim koncie. Pliki CSV otwierają się bezpośrednio w Excelu i arkuszach Google.':
    'Tus datos son tuyos. La copia completa en JSON contiene todo lo que guardamos en tu cuenta. Los archivos CSV se abren directamente en Excel y Hojas de cálculo de Google.',
  'Pełna kopia (JSON)': 'Copia completa (JSON)',
  'Transakcje (CSV)': 'Transacciones (CSV)',
  'Portfel (CSV)': 'Cartera (CSV)',
  'Pobieranie…': 'Descargando…',
  'Nie udało się pobrać pliku. Spróbuj ponownie za chwilę.': 'No se pudo descargar el archivo. Inténtalo de nuevo en un momento.',
  'Usuń konto': 'Eliminar cuenta',
  'Konto zostanie zablokowane od razu, a po 30 dniach trwale usuniemy wszystkie Twoje dane: konta bankowe, transakcje, budżet, inwestycje i historię logowań. Przez te 30 dni możesz cofnąć decyzję linkiem z maila, który wyślemy. Zanim usuniesz konto, pobierz swoje dane w sekcji wyżej.':
    'Tu cuenta se bloquea de inmediato y, pasados 30 días, borramos definitivamente todos tus datos: cuentas bancarias, transacciones, presupuesto, inversiones e historial de inicios de sesión. Durante esos 30 días puedes deshacerlo con el enlace del correo que te enviaremos. Antes de eliminarla, descarga tus datos en la sección de arriba.',
  'Wpisz {0}, żeby potwierdzić': 'Escribe {0} para confirmar',
  'Wpisz dokładnie "{0}", żeby potwierdzić.': 'Escribe exactamente "{0}" para confirmar.',
  'Czy na pewno chcesz usunąć konto? Zostanie zablokowane od razu, a po 30 dniach Twoje dane znikną bezpowrotnie. Link do cofnięcia wyślemy Ci mailem.':
    '¿Seguro que quieres eliminar tu cuenta? Se bloquea al instante y, pasados 30 días, tus datos desaparecen para siempre. Te enviaremos por correo un enlace para deshacerlo.',
  'Usuwanie…': 'Eliminando…',
  'Nie udało się usunąć konta.': 'No se pudo eliminar la cuenta.',

  // Admin: hard delete a user account
  'Trwałe usunięcie': 'Eliminación permanente',
  'W przeciwieństwie do archiwizacji, to usuwa konto i wszystkie jego dane z bazy danych na stałe. Tej operacji nie można cofnąć.':
    'A diferencia del archivado, esto elimina la cuenta y todos sus datos de la base de datos de forma permanente. Esta acción no se puede deshacer.',
  'Usuń trwale z bazy': 'Eliminar permanentemente de la base de datos',
  'Ta operacja jest nieodwracalna i trwale usunie konto oraz wszystkie dane użytkownika z bazy danych. Wpisz nazwę użytkownika "{0}", żeby potwierdzić.':
    'Esta acción es irreversible y eliminará permanentemente la cuenta y todos los datos de este usuario de la base de datos. Escribe el nombre de usuario "{0}" para confirmar.',
  'Nazwa użytkownika się nie zgadza — anulowano.': 'El nombre de usuario no coincide — cancelado.',

  // Footer / landing mock card
  'Regulamin': 'Términos de servicio',
  'Dywidendy YTD': 'Dividendos en lo que va del año',

  // Admin: articles visibility per language
  'Artykuły': 'Artículos',
  'Widoczność artykułów': 'Visibilidad de artículos',
  'Artykuły są dziś pisane wyłącznie po polsku - wyłącz sekcję artykułów na stronie głównej dla języków, w których nie ma jeszcze tłumaczeń.':
    'Los artículos hoy se escriben solo en polaco - desactiva la sección de artículos en la página principal para los idiomas que aún no tienen traducciones.',
  'widoczne': 'visible',
  'ukryte': 'oculto',

  // Register: terms/privacy acceptance
  'Akceptuję': 'Acepto',
  'Politykę prywatności': 'Política de privacidad',
  'i': 'y',
  'Musisz zaakceptować regulamin i politykę prywatności.': 'Debes aceptar los términos de servicio y la política de privacidad.',
}
