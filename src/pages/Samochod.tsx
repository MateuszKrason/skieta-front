import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api/client'
import { CardLoader } from '../components/Loader'
import { ScanReceiptButton } from '../components/ScanReceiptButton'
import { useLanguage } from '../i18n/LanguageContext'
import { useTooltipStyle } from '../lib/chartTooltip'
import { formatAxisValue, formatDate, formatMoney } from '../lib/format'
import type {
  BankAccount,
  Category,
  ParsedReceipt,
  Vehicle,
  VehicleCost,
  VehicleCostKind,
  VehicleDeadline,
  VehicleSummary,
  VehicleTrendRow,
} from '../types'

const COST_KINDS: { key: VehicleCostKind; label: string }[] = [
  { key: 'fuel', label: 'Paliwo' },
  { key: 'insurance', label: 'Ubezpieczenie' },
  { key: 'inspection', label: 'Przegląd techniczny' },
  { key: 'service', label: 'Serwis' },
  { key: 'repair', label: 'Naprawa' },
  { key: 'tyres', label: 'Opony' },
  { key: 'parts', label: 'Części i akcesoria' },
  { key: 'wash', label: 'Myjnia' },
  { key: 'parking', label: 'Parking i autostrady' },
  { key: 'tax', label: 'Podatki i opłaty' },
  { key: 'finance', label: 'Raty, leasing, wynajem' },
  { key: 'other', label: 'Inne' },
]
const KIND_LABELS = Object.fromEntries(COST_KINDS.map((kind) => [kind.key, kind.label])) as Record<
  VehicleCostKind,
  string
>
// Only these two buy a period of cover, so only these two ask when it ends -
// mirrors PERIOD_COST_KINDS on the backend.
const PERIOD_KINDS: VehicleCostKind[] = ['insurance', 'inspection']
const FUEL_TYPES = [
  { key: 'petrol', label: 'Benzyna' },
  { key: 'diesel', label: 'Diesel' },
  { key: 'lpg', label: 'LPG' },
  { key: 'hybrid', label: 'Hybryda' },
  { key: 'electric', label: 'Elektryczny' },
  { key: 'other', label: 'Inny' },
]
const TREND_MONTHS_OPTIONS = [6, 12, 24]

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block min-w-0">
      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
      {children}
      {hint && <span className="mt-0.5 block text-xs text-slate-400 dark:text-slate-500">{hint}</span>}
    </label>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  )
}

/** Insurance, roadworthiness and warranty across every car, with what has
 * already lapsed first. Shown above everything else because it is the one
 * thing on this page that has a deadline attached to it. */
function Deadlines() {
  const { t } = useLanguage()
  const { data } = useQuery({
    queryKey: ['vehicle-deadlines'],
    queryFn: async () => (await api.get<VehicleDeadline[]>('/vehicles/deadlines/', { params: { days: 120 } })).data,
  })
  if (!data || data.length === 0) return null

  const labels: Record<VehicleDeadline['kind'], string> = {
    insurance: 'Ubezpieczenie',
    inspection: 'Przegląd techniczny',
    warranty: 'Gwarancja',
  }

  return (
    <div className="space-y-2">
      {data.map((row) => {
        const overdue = row.days_left < 0
        return (
          <div
            key={`${row.vehicle.id}-${row.kind}`}
            className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-2.5 text-sm ${
              overdue
                ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300'
                : 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300'
            }`}
          >
            <span className="font-medium">
              {row.vehicle.name} · {t(labels[row.kind])}
            </span>
            <span>
              {overdue
                ? t(
                    'skończyło się {0} - {1} temu',
                    formatDate(row.date),
                    t(-row.days_left === 1 ? '{0} dzień' : '{0} dni', String(-row.days_left)),
                  )
                : t(
                    'kończy się {0} - za {1}',
                    formatDate(row.date),
                    t(row.days_left === 1 ? '{0} dzień' : '{0} dni', String(row.days_left)),
                  )}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function VehicleForm({ vehicle, onDone }: { vehicle?: Vehicle; onDone: () => void }) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [name, setName] = useState(vehicle?.name ?? '')
  const [make, setMake] = useState(vehicle?.make ?? '')
  const [model, setModel] = useState(vehicle?.model ?? '')
  const [year, setYear] = useState(vehicle?.year ? String(vehicle.year) : '')
  const [registration, setRegistration] = useState(vehicle?.registration ?? '')
  const [vin, setVin] = useState(vehicle?.vin ?? '')
  const [fuelType, setFuelType] = useState(vehicle?.fuel_type ?? '')
  const [purchaseDate, setPurchaseDate] = useState(vehicle?.purchase_date ?? '')
  const [purchasePrice, setPurchasePrice] = useState(vehicle?.purchase_price ?? '')
  const [odometer, setOdometer] = useState(vehicle?.initial_odometer_km ? String(vehicle.initial_odometer_km) : '')
  const [warrantyUntil, setWarrantyUntil] = useState(vehicle?.warranty_until ?? '')
  const [notes, setNotes] = useState(vehicle?.notes ?? '')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        make,
        model,
        year: year ? Number(year) : null,
        registration,
        vin,
        fuel_type: fuelType,
        purchase_date: purchaseDate || null,
        purchase_price: purchasePrice || null,
        initial_odometer_km: odometer ? Number(odometer) : null,
        warranty_until: warrantyUntil || null,
        notes,
      }
      if (vehicle) return (await api.patch(`/vehicles/vehicles/${vehicle.id}/`, payload)).data
      return (await api.post('/vehicles/vehicles/', payload)).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['vehicle-deadlines'] })
      onDone()
    },
    onError: () => setError(t('Nie udało się zapisać samochodu.')),
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError(t('Podaj nazwę, po której rozpoznasz to auto.'))
      return
    }
    mutation.mutate()
  }

  const inputClass = 'input mt-1'

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        {vehicle ? t('Edytuj samochód') : t('Dodaj samochód')}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t('Nazwa')} hint={t('Np. "Nasza Corsa" - tak zobaczysz je na liście.')}>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t('Marka')}>
          <input className={inputClass} value={make} onChange={(e) => setMake(e.target.value)} />
        </Field>
        <Field label={t('Model')}>
          <input className={inputClass} value={model} onChange={(e) => setModel(e.target.value)} />
        </Field>
        <Field label={t('Rocznik')}>
          <input className={inputClass} inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} />
        </Field>
        <Field label={t('Numer rejestracyjny')}>
          <input className={inputClass} value={registration} onChange={(e) => setRegistration(e.target.value)} />
        </Field>
        <Field label={t('VIN')}>
          <input className={inputClass} value={vin} onChange={(e) => setVin(e.target.value)} />
        </Field>
        <Field label={t('Paliwo')}>
          <select className={inputClass} value={fuelType} onChange={(e) => setFuelType(e.target.value as Vehicle['fuel_type'])}>
            <option value="">{t('Nie podano')}</option>
            {FUEL_TYPES.map((fuel) => (
              <option key={fuel.key} value={fuel.key}>
                {t(fuel.label)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('Data zakupu')}>
          <input type="date" className={inputClass} value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
        </Field>
        <Field label={t('Cena zakupu')}>
          <input className={inputClass} inputMode="decimal" value={purchasePrice ?? ''} onChange={(e) => setPurchasePrice(e.target.value)} />
        </Field>
        <Field label={t('Przebieg przy zakupie (km)')} hint={t('Dzięki temu auto kupione jako używane nie wygląda, jakbyś przejechał je całe.')}>
          <input className={inputClass} inputMode="numeric" value={odometer} onChange={(e) => setOdometer(e.target.value)} />
        </Field>
        <Field label={t('Gwarancja do')}>
          <input type="date" className={inputClass} value={warrantyUntil} onChange={(e) => setWarrantyUntil(e.target.value)} />
        </Field>
      </div>
      <Field label={t('Notatki')}>
        <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? t('Zapisywanie…') : t('Zapisz')}
        </button>
        <button type="button" onClick={onDone} className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:underline">
          {t('Anuluj')}
        </button>
      </div>
    </form>
  )
}

function CostForm({
  vehicle,
  categories,
  accounts,
  onDone,
}: {
  vehicle: Vehicle
  categories: Category[]
  accounts: BankAccount[]
  onDone: () => void
}) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [kind, setKind] = useState<VehicleCostKind>('fuel')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [litres, setLitres] = useState('')
  const [pricePerLitre, setPricePerLitre] = useState('')
  const [odometer, setOdometer] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')
  const [note, setNote] = useState('')
  const [category, setCategory] = useState<number | ''>(categories[0]?.id ?? '')
  const [account, setAccount] = useState<number | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [scanNote, setScanNote] = useState<string | null>(null)

  const isFuel = kind === 'fuel'
  const isPeriod = PERIOD_KINDS.includes(kind)

  const mutation = useMutation({
    mutationFn: async () =>
      (
        await api.post('/vehicles/costs/', {
          vehicle: vehicle.id,
          kind,
          odometer_km: odometer ? Number(odometer) : null,
          litres: isFuel && litres ? litres : null,
          price_per_litre: isFuel && pricePerLitre ? pricePerLitre : null,
          valid_from: isPeriod && validFrom ? validFrom : null,
          valid_to: isPeriod && validTo ? validTo : null,
          note,
          transaction: {
            type: 'expense',
            amount,
            currency: 'PLN',
            date,
            category: category === '' ? null : category,
            account: account === '' ? null : account,
            description: note || t(KIND_LABELS[kind]),
          },
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-costs'] })
      queryClient.invalidateQueries({ queryKey: ['vehicle-summary'] })
      queryClient.invalidateQueries({ queryKey: ['vehicle-trend'] })
      queryClient.invalidateQueries({ queryKey: ['vehicle-deadlines'] })
      queryClient.invalidateQueries({ queryKey: ['budget-breakdown'] })
      onDone()
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: unknown } }).response?.data
      setError(
        data && typeof data === 'object'
          ? Object.values(data as Record<string, unknown>).flat().join(' ')
          : t('Nie udało się zapisać kosztu.'),
      )
    },
  })

  /** A fuel receipt fills in what it could read and leaves the rest alone.
   * Nothing is saved from here - the form is filled in and the driver still
   * presses Zapisz, because a misread litre count is much easier to spot
   * before it is in the budget than after. */
  function applyReceipt(receipt: ParsedReceipt) {
    setScanNote(null)
    if (receipt.amount) setAmount(receipt.amount)
    if (receipt.date) setDate(receipt.date)
    const fuel = receipt.fuel
    if (fuel?.litres) setLitres(fuel.litres)
    if (fuel?.price_per_litre) setPricePerLitre(fuel.price_per_litre)
    if (!fuel?.litres && !fuel?.price_per_litre) {
      setScanNote(t('Odczytaliśmy kwotę, ale nie litry - uzupełnij je ręcznie.'))
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!amount) {
      setError(t('Podaj kwotę.'))
      return
    }
    mutation.mutate()
  }

  const inputClass = 'input mt-1'

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-accent-300 dark:border-accent-800 bg-accent-50 dark:bg-accent-950/30 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {t('Dodaj koszt - {0}', vehicle.name)}
        </h2>
        {isFuel && (
          <ScanReceiptButton
            fuel
            label={t('📷 Wczytaj paragon za paliwo')}
            className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-60"
            onParsed={applyReceipt}
            onNeedsGeminiKey={() => setScanNote(t('Najpierw dodaj klucz Gemini w ustawieniach konta.'))}
            onError={(message) => setScanNote(message)}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t('Rodzaj kosztu')}>
          <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as VehicleCostKind)}>
            {COST_KINDS.map((option) => (
              <option key={option.key} value={option.key}>
                {t(option.label)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('Kwota')}>
          <input className={inputClass} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label={t('Data')}>
          <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label={t('Przebieg (km)')} hint={isFuel ? t('Potrzebny do spalania - bez niego reszta i tak się policzy.') : undefined}>
          <input className={inputClass} inputMode="numeric" value={odometer} onChange={(e) => setOdometer(e.target.value)} />
        </Field>
        {isFuel && (
          <>
            <Field label={t('Litry')}>
              <input className={inputClass} inputMode="decimal" value={litres} onChange={(e) => setLitres(e.target.value)} />
            </Field>
            <Field label={t('Cena za litr')} hint={t('Wystarczy jedno z dwóch - drugie policzymy z kwoty.')}>
              <input className={inputClass} inputMode="decimal" value={pricePerLitre} onChange={(e) => setPricePerLitre(e.target.value)} />
            </Field>
          </>
        )}
        {isPeriod && (
          <>
            <Field label={t('Ochrona od')}>
              <input type="date" className={inputClass} value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
            </Field>
            <Field label={t('Ochrona do')} hint={t('Stąd bierze się przypomnienie na górze strony.')}>
              <input type="date" className={inputClass} value={validTo} onChange={(e) => setValidTo(e.target.value)} />
            </Field>
          </>
        )}
        <Field label={t('Kategoria w budżecie')}>
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value ? Number(e.target.value) : '')}>
            <option value="">{t('Bez kategorii')}</option>
            {categories.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('Konto')} hint={t('Wybierz, jeśli kwota ma od razu zmienić saldo.')}>
          <select className={inputClass} value={account} onChange={(e) => setAccount(e.target.value ? Number(e.target.value) : '')}>
            <option value="">{t('Bez konta')}</option>
            {accounts.map((option) => (
              <option key={option.id} value={option.id}>
                {option.bank_name} · {option.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label={t('Notatka')}>
        <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>

      {scanNote && <p className="text-sm text-amber-700 dark:text-amber-400">{scanNote}</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t('Koszt zapisze się też jako wydatek w budżecie, więc nie trzeba go wpisywać drugi raz.')}
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? t('Zapisywanie…') : t('Zapisz koszt')}
        </button>
        <button type="button" onClick={onDone} className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:underline">
          {t('Anuluj')}
        </button>
      </div>
    </form>
  )
}

function VehicleDetail({ vehicle }: { vehicle: Vehicle }) {
  const { t } = useLanguage()
  const tooltipStyle = useTooltipStyle()
  const queryClient = useQueryClient()
  const [months, setMonths] = useState(12)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(false)

  const { data: summary, isLoading } = useQuery({
    queryKey: ['vehicle-summary', vehicle.id],
    queryFn: async () => (await api.get<VehicleSummary>(`/vehicles/vehicles/${vehicle.id}/summary/`)).data,
  })
  const { data: trend } = useQuery({
    queryKey: ['vehicle-trend', vehicle.id, months],
    queryFn: async () =>
      (await api.get<VehicleTrendRow[]>(`/vehicles/vehicles/${vehicle.id}/trend/`, { params: { months } })).data,
  })
  const { data: costs } = useQuery({
    queryKey: ['vehicle-costs', vehicle.id],
    queryFn: async () => (await api.get<VehicleCost[]>('/vehicles/costs/', { params: { vehicle: vehicle.id } })).data,
  })
  const { data: categories } = useQuery({
    queryKey: ['budget-categories', 'expense'],
    queryFn: async () => (await api.get<Category[]>('/budget/categories/', { params: { type: 'expense' } })).data,
  })
  const { data: accounts } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => (await api.get<BankAccount[]>('/banking/accounts/')).data,
  })

  const removeCost = useMutation({
    mutationFn: async (id: number) => api.delete(`/vehicles/costs/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-costs'] })
      queryClient.invalidateQueries({ queryKey: ['vehicle-summary'] })
      queryClient.invalidateQueries({ queryKey: ['vehicle-trend'] })
      queryClient.invalidateQueries({ queryKey: ['budget-breakdown'] })
    },
  })

  const chartData = useMemo(
    () => (trend ?? []).map((row) => ({ month: row.month, fuel: Number(row.fuel), other: Number(row.other) })),
    [trend],
  )

  if (editing) return <VehicleForm vehicle={vehicle} onDone={() => setEditing(false)} />

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{vehicle.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {[vehicle.make, vehicle.model, vehicle.year, vehicle.registration].filter(Boolean).join(' · ') ||
              t('Uzupełnij markę i model w edycji.')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setAdding((v) => !v)} className="btn-primary">
            {t('+ Koszt')}
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {t('Edytuj')}
          </button>
        </div>
      </div>

      {adding && (
        <CostForm
          vehicle={vehicle}
          categories={categories ?? []}
          accounts={accounts ?? []}
          onDone={() => setAdding(false)}
        />
      )}

      {isLoading ? (
        <CardLoader />
      ) : summary ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={t('Koszty łącznie')} value={formatMoney(summary.total, 'PLN')} hint={t('Wpisów: {0}', String(summary.entries))} />
            <Stat label={t('Paliwo')} value={formatMoney(summary.fuel_total, 'PLN')} hint={`${Number(summary.fuel_litres).toFixed(1)} l`} />
            <Stat
              label={t('Średnia cena litra')}
              value={summary.average_price_per_litre ? formatMoney(summary.average_price_per_litre, 'PLN') : '—'}
              hint={t('Ważona litrami, nie liczbą tankowań')}
            />
            <Stat
              label={t('Spalanie')}
              value={summary.litres_per_100km ? `${summary.litres_per_100km} l/100 km` : '—'}
              hint={
                summary.litres_per_100km
                  ? t('Na {0} km', String(summary.distance_km))
                  : t('Potrzebne dwa tankowania z przebiegiem')
              }
            />
            {summary.cost_per_km && (
              <Stat label={t('Koszt na kilometr')} value={`${summary.cost_per_km} zł/km`} hint={t('Wszystkie koszty, nie samo paliwo')} />
            )}
            {summary.last_odometer_km !== null && (
              <Stat label={t('Ostatni przebieg')} value={`${summary.last_odometer_km} km`} />
            )}
          </div>

          {summary.by_kind.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Na co poszły pieniądze')}</h3>
              <ul className="space-y-1.5">
                {summary.by_kind.map((row) => (
                  <li key={row.kind} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-600 dark:text-slate-400">{t(KIND_LABELS[row.kind])}</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{formatMoney(row.total, 'PLN')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : null}

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Miesiąc po miesiącu')}</h3>
          <select value={months} onChange={(e) => setMonths(Number(e.target.value))} className="input w-auto">
            {TREND_MONTHS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t('Ostatnie {0} mies.', option)}
              </option>
            ))}
          </select>
        </div>
        <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
          {t('Paliwo to stały wydatek, naprawy to skoki - dlatego są rozdzielone.')}
        </p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.15} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tickFormatter={formatAxisValue} tick={{ fontSize: 12 }} stroke="#94a3b8" width={44} />
              <Tooltip {...tooltipStyle} formatter={(value) => formatMoney(value as number, 'PLN')} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="fuel" stackId="v" name={t('Paliwo')} fill="#059669" />
              <Bar dataKey="other" stackId="v" name={t('Pozostałe')} fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Historia kosztów')}</h3>
        {!costs || costs.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">{t('Jeszcze nic tu nie ma. Dodaj pierwszy koszt przyciskiem wyżej.')}</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {costs.map((cost) => (
              <li key={cost.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {t(KIND_LABELS[cost.kind])}
                    {cost.litres && ` · ${Number(cost.litres).toFixed(2)} l`}
                    {cost.price_per_litre && ` · ${Number(cost.price_per_litre).toFixed(2)} zł/l`}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(cost.transaction.date)}
                    {cost.odometer_km !== null && ` · ${cost.odometer_km} km`}
                    {cost.note && ` · ${cost.note}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatMoney(cost.transaction.amount, cost.transaction.currency)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t('Usunąć ten koszt? Zniknie też z budżetu.'))) removeCost.mutate(cost.id)
                    }}
                    aria-label={t('Usuń')}
                    className="rounded-full px-1.5 py-0.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function Samochod() {
  const { t } = useLanguage()
  const [selected, setSelected] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => (await api.get<Vehicle[]>('/vehicles/vehicles/')).data,
  })

  const current = vehicles?.find((vehicle) => vehicle.id === selected) ?? vehicles?.[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Samochód')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('Paliwo, ubezpieczenie, naprawy i przeglądy - osobno dla każdego auta.')}
        </p>
      </div>

      <Deadlines />

      {isLoading ? (
        <CardLoader />
      ) : !vehicles || vehicles.length === 0 ? (
        adding ? (
          <VehicleForm onDone={() => setAdding(false)} />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center">
            <p className="text-slate-600 dark:text-slate-400">{t('Nie masz jeszcze żadnego auta.')}</p>
            <button type="button" onClick={() => setAdding(true)} className="btn-primary mt-3">
              {t('Dodaj samochód')}
            </button>
          </div>
        )
      ) : (
        <>
          {/* Cars as tabs rather than a dropdown: a household has two or
              three, and seeing the other one named is what reminds you it
              also costs money. */}
          <div className="flex flex-wrap items-center gap-2">
            {vehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => setSelected(vehicle.id)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                  current?.id === vehicle.id
                    ? 'border-accent-600 bg-accent-600 text-white'
                    : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {vehicle.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAdding((v) => !v)}
              className="rounded-full border border-dashed border-slate-400 dark:border-slate-500 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('+ Kolejne auto')}
            </button>
          </div>

          {adding && <VehicleForm onDone={() => setAdding(false)} />}
          {current && <VehicleDetail key={current.id} vehicle={current} />}
        </>
      )}
    </div>
  )
}
