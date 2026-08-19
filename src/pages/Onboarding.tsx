import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import StockAutocomplete from '../components/StockAutocomplete'
import { useLanguage } from '../i18n/LanguageContext'
import { accountTypeLabel, BOND_TYPE_LABELS, formatDate, formatMoney, formatNumber } from '../lib/format'
import type {
  BankAccount,
  BankAccountType,
  BondType,
  Currency,
  Stock,
  StockSearchResult,
  StockTransaction,
  TermDeposit,
  TreasuryBond,
} from '../types'

type StepId = 'accounts' | 'stocks' | 'deposits' | 'bonds' | 'done'

const STEPS: { id: StepId; label: string }[] = [
  { id: 'accounts', label: 'Konta' },
  { id: 'stocks', label: 'Akcje' },
  { id: 'deposits', label: 'Lokaty' },
  { id: 'bonds', label: 'Obligacje' },
  { id: 'done', label: 'Gotowe' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const [stepIndex, setStepIndex] = useState(0)
  const step = STEPS[stepIndex]

  function next() {
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }
  function back() {
    setStepIndex((i) => Math.max(i - 1, 0))
  }
  function finish() {
    queryClient.invalidateQueries()
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Dodaj posiadane rzeczy')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t(
            'Wprowadź to, co już posiadasz — z prawdziwą, wsteczną datą zakupu — żeby historia i zyski liczyły się poprawnie od początku.',
          )}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setStepIndex(i)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              i === stepIndex
                ? 'bg-emerald-600 text-white'
                : i < stepIndex
                  ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            {i + 1}. {t(s.label)}
          </button>
        ))}
        <button onClick={finish} className="ml-auto text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:underline">
          {t('Zakończ teraz →')}
        </button>
      </div>

      {step.id === 'accounts' && <AccountsStep />}
      {step.id === 'stocks' && <StocksStep />}
      {step.id === 'deposits' && <DepositsStep />}
      {step.id === 'bonds' && <BondsStep />}
      {step.id === 'done' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">{t('Gotowe!')}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('Możesz w każdej chwili dodać kolejne rzeczy z tego samego kreatora — link znajdziesz w górnym menu.')}
          </p>
          <button onClick={finish} className="btn-primary mt-4">
            {t('Przejdź do pulpitu')}
          </button>
        </div>
      )}

      {step.id !== 'done' && (
        <div className="flex justify-between">
          <button
            onClick={back}
            disabled={stepIndex === 0}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40"
          >
            {t('← Wstecz')}
          </button>
          <button onClick={next} className="btn-primary">
            {t('Dalej →')}
          </button>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { t } = useLanguage()
  return (
    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
      {t(label)}
      <div className="mt-1">{children}</div>
    </label>
  )
}

function AccountsStep() {
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await api.get<BankAccount[]>('/banking/accounts/')).data,
  })

  const [bankName, setBankName] = useState('')
  const [name, setName] = useState('')
  const [accountType, setAccountType] = useState<BankAccountType>('checking')
  const [currency, setCurrency] = useState<Currency>('PLN')
  const [balance, setBalance] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/banking/accounts/', { bank_name: bankName, name, account_type: accountType, currency, current_balance: balance }),
    onSuccess: () => {
      setBankName('')
      setName('')
      setBalance('')
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="space-y-4">
      {(accounts?.length ?? 0) > 0 && (
        <ul className="space-y-1 text-sm">
          {accounts!.map((a) => (
            <li key={a.id} className="flex justify-between rounded-md bg-slate-50 dark:bg-slate-900 px-3 py-2">
              <span>
                {a.bank_name} — {a.name} <span className="text-xs text-slate-400 dark:text-slate-500">({t(accountTypeLabel(a.account_type))})</span>
              </span>
              <span className="font-medium">{formatMoney(a.current_balance, a.currency)}</span>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm sm:grid-cols-5">
        <Field label="Bank">
          <input value={bankName} onChange={(e) => setBankName(e.target.value)} required className="input" />
        </Field>
        <Field label="Nazwa konta">
          <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
        </Field>
        <Field label="Typ">
          <select value={accountType} onChange={(e) => setAccountType(e.target.value as BankAccountType)} className="input">
            <option value="checking">{t('Osobiste')}</option>
            <option value="savings">{t('Oszczędnościowe')}</option>
            <option value="brokerage">{t('Maklerskie')}</option>
            <option value="business">{t('Firmowe')}</option>
            <option value="ike">IKE</option>
            <option value="ikze">IKZE</option>
            <option value="crypto">{t('Kryptowalutowe')}</option>
          </select>
        </Field>
        <Field label="Waluta">
          <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="input">
            <option value="PLN">PLN</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="NOK">NOK</option>
            <option value="DKK">DKK</option>
            <option value="GBP">GBP</option>
          </select>
        </Field>
        <Field label="Obecne saldo">
          <input type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} required className="input" />
        </Field>
        <div className="col-span-2 flex items-end sm:col-span-5">
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {t('+ Dodaj konto')}
          </button>
        </div>
      </form>
      <p className="text-xs text-slate-400 dark:text-slate-500">
        {t(
          'Nie masz jeszcze żadnego konta z gotówką na zakup akcji? Dodaj je tutaj z aktualnym saldem — w kolejnym kroku możesz z niego "kupić" akcje, które faktycznie posiadasz.',
        )}
      </p>
    </div>
  )
}

function StocksStep() {
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const { data: stocks } = useQuery({
    queryKey: ['stocks'],
    queryFn: async () => (await api.get<Stock[]>('/stocks/tickers/')).data,
  })
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await api.get<BankAccount[]>('/banking/accounts/')).data,
  })
  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => (await api.get<StockTransaction[]>('/stocks/transactions/')).data,
  })

  const [ticker, setTicker] = useState('')
  const [market, setMarket] = useState<'GPW' | 'US'>('GPW')
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState<Currency>('PLN')
  const [stockId, setStockId] = useState<number | ''>('')
  const [account, setAccount] = useState<number | ''>('')
  const [alreadyOwned, setAlreadyOwned] = useState(true)
  const [quantity, setQuantity] = useState('')
  const [pricePerShare, setPricePerShare] = useState('')
  const [executedAt, setExecutedAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [error, setError] = useState<string | null>(null)

  const existing = stocks?.find((s) => s.ticker === ticker && s.market === market)
  const eligibleAccounts = currency ? (accounts ?? []).filter((a) => a.currency === currency) : accounts ?? []

  function onPick(result: StockSearchResult) {
    setTicker(result.symbol)
    setMarket(result.market)
    setName(result.name)
    setCurrency(result.currency)
    setStockId('')
  }

  const mutation = useMutation({
    mutationFn: async () => {
      let id = existing?.id ?? stockId
      if (!id) {
        const { data } = await api.post<Stock>('/stocks/tickers/', { ticker, market, name, currency })
        id = data.id
      }
      return api.post('/stocks/transactions/', {
        stock: id,
        type: 'BUY',
        account: account || null,
        affects_balance: !alreadyOwned,
        quantity,
        price_per_share: pricePerShare,
        fee: '0',
        currency,
        executed_at: executedAt,
      })
    },
    onSuccess: () => {
      setTicker('')
      setName('')
      setQuantity('')
      setPricePerShare('')
      setError(null)
      queryClient.invalidateQueries({ queryKey: ['stocks'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['holdings'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: unknown } }).response?.data
      if (data && typeof data === 'object') {
        setError(Object.values(data as Record<string, unknown>).flat().join(' '))
      } else {
        setError(t('Nie udało się dodać pozycji.'))
      }
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!ticker) {
      setError(t('Wybierz spółkę.'))
      return
    }
    mutation.mutate()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {t('Dla każdej posiadanej spółki podaj ilość, cenę i')} <strong>{t('prawdziwą datę zakupu')}</strong>{' '}
        {t('— dzięki temu historia i wykresy będą liczone poprawnie.')}
      </p>
      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
        <Field label="Wyszukaj spółkę">
          <StockAutocomplete onSelect={onPick} />
        </Field>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-7">
          <Field label="Ticker">
            <input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} required className="input" />
          </Field>
          <Field label="Rynek">
            <select value={market} onChange={(e) => setMarket(e.target.value as 'GPW' | 'US')} className="input">
              <option value="GPW">GPW</option>
              <option value="US">USA</option>
            </select>
          </Field>
          <Field label="Ilość">
            <input type="number" step="0.0001" value={quantity} onChange={(e) => setQuantity(e.target.value)} required className="input" />
          </Field>
          <Field label="Cena zakupu/szt.">
            <input type="number" step="0.01" value={pricePerShare} onChange={(e) => setPricePerShare(e.target.value)} required className="input" />
          </Field>
          <Field label="Data zakupu (wstecz)">
            <input type="date" value={executedAt} onChange={(e) => setExecutedAt(e.target.value)} required className="input" />
          </Field>
          <Field label="Powiąż z kontem (opcjonalnie)">
            <select value={account} onChange={(e) => setAccount(e.target.value ? Number(e.target.value) : '')} className="input">
              <option value="">{t('bez powiązania')}</option>
              {eligibleAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.bank_name} — {a.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full" disabled={mutation.isPending}>
              {t('+ Dodaj pozycję')}
            </button>
          </div>
        </div>
        {account ? (
          <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <input type="checkbox" checked={alreadyOwned} onChange={(e) => setAlreadyOwned(e.target.checked)} />
            {t('To pozycja, którą już posiadam — nie odejmuj środków z konta (tylko zapisz powiązanie).')}
          </label>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t(
              'Jeśli wybierzesz konto, kwota zostanie od razu odjęta z jego salda — zostaw puste, jeśli tylko deklarujesz akcje, które już posiadasz.',
            )}
          </p>
        )}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </form>
      {(transactions?.length ?? 0) > 0 && (
        <ul className="space-y-1 text-sm">
          {transactions!.map((tx) => (
            <li key={tx.id} className="flex justify-between rounded-md bg-slate-50 dark:bg-slate-900 px-3 py-1.5">
              <span>
                {tx.stock_detail.ticker} ({tx.stock_detail.market}) — {formatNumber(tx.quantity, 4)} {t('szt.')} @{' '}
                {formatMoney(tx.price_per_share, tx.currency)}
                <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                  {formatDate(tx.executed_at)}
                  {tx.account_detail ? ` — ${tx.account_detail.bank_name} ${tx.account_detail.name}` : ` — ${t('bez powiązania z kontem')}`}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {(transactions?.length ?? 0) === 0 && (stocks?.length ?? 0) === 0 && (
        <p className="text-sm text-slate-400 dark:text-slate-500">{t('Nie dodano jeszcze żadnych akcji.')}</p>
      )}
    </div>
  )
}

function DepositsStep() {
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const { data: deposits } = useQuery({
    queryKey: ['deposits'],
    queryFn: async () => (await api.get<TermDeposit[]>('/banking/deposits/')).data,
  })
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await api.get<BankAccount[]>('/banking/accounts/')).data,
  })

  const [bankName, setBankName] = useState('')
  const [account, setAccount] = useState<number | ''>('')
  const [alreadyOwned, setAlreadyOwned] = useState(true)
  const [principal, setPrincipal] = useState('')
  const [currency, setCurrency] = useState<Currency>('PLN')
  const [rate, setRate] = useState('')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/banking/deposits/', {
        bank_name: bankName,
        account: account || null,
        affects_balance: !alreadyOwned,
        principal,
        currency,
        interest_rate: rate,
        start_date: startDate,
        end_date: endDate,
        capitalization: 'end',
        status: 'active',
      }),
    onSuccess: () => {
      setBankName('')
      setPrincipal('')
      setRate('')
      setEndDate('')
      queryClient.invalidateQueries({ queryKey: ['deposits'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">{t('Masz aktywną lokatę? Dodaj ją tutaj (opcjonalnie).')}</p>
      {(deposits?.length ?? 0) > 0 && (
        <ul className="space-y-1 text-sm">
          {deposits!.map((d) => (
            <li key={d.id} className="rounded-md bg-slate-50 dark:bg-slate-900 px-3 py-1.5">
              {d.bank_name} — {formatMoney(d.principal, d.currency)} @ {formatNumber(d.interest_rate, 2)}%
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm sm:grid-cols-4">
        <Field label="Bank">
          <input value={bankName} onChange={(e) => setBankName(e.target.value)} required className="input" />
        </Field>
        <Field label="Powiąż z kontem (opcjonalnie)">
          <select value={account} onChange={(e) => setAccount(e.target.value ? Number(e.target.value) : '')} className="input">
            <option value="">{t('bez powiązania')}</option>
            {(accounts ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.bank_name} — {a.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Kwota">
          <input type="number" step="0.01" value={principal} onChange={(e) => setPrincipal(e.target.value)} required className="input" />
        </Field>
        <Field label="Waluta">
          <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="input">
            <option value="PLN">PLN</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="NOK">NOK</option>
            <option value="DKK">DKK</option>
            <option value="GBP">GBP</option>
          </select>
        </Field>
        <Field label="Oprocentowanie (%)">
          <input type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} required className="input" />
        </Field>
        <Field label="Data założenia">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="input" />
        </Field>
        <Field label="Data zakończenia">
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="input" />
        </Field>
        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full" disabled={mutation.isPending}>
            {t('+ Dodaj lokatę')}
          </button>
        </div>
        {account && (
          <label className="col-span-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 sm:col-span-4">
            <input type="checkbox" checked={alreadyOwned} onChange={(e) => setAlreadyOwned(e.target.checked)} />
            {t('To lokata, którą już posiadam — nie odejmuj środków z konta (tylko zapisz powiązanie).')}
          </label>
        )}
      </form>
    </div>
  )
}

function BondsStep() {
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const { data: bonds } = useQuery({
    queryKey: ['bonds'],
    queryFn: async () => (await api.get<TreasuryBond[]>('/bonds/')).data,
  })
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await api.get<BankAccount[]>('/banking/accounts/')).data,
  })

  const [bondType, setBondType] = useState<BondType>('EDO')
  const [series, setSeries] = useState('')
  const [account, setAccount] = useState<number | ''>('')
  const [alreadyOwned, setAlreadyOwned] = useState(true)
  const [nominalValue, setNominalValue] = useState('')
  const [currency, setCurrency] = useState<Currency>('PLN')
  const [rate, setRate] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [maturityDate, setMaturityDate] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/bonds/', {
        bond_type: bondType,
        series,
        account: account || null,
        affects_balance: !alreadyOwned,
        nominal_value: nominalValue,
        currency,
        interest_rate: rate,
        purchase_date: purchaseDate,
        maturity_date: maturityDate,
        status: 'active',
      }),
    onSuccess: () => {
      setSeries('')
      setNominalValue('')
      setRate('')
      setMaturityDate('')
      queryClient.invalidateQueries({ queryKey: ['bonds'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">{t('Masz obligacje skarbowe? Dodaj je tutaj (opcjonalnie).')}</p>
      {(bonds?.length ?? 0) > 0 && (
        <ul className="space-y-1 text-sm">
          {bonds!.map((b) => (
            <li key={b.id} className="rounded-md bg-slate-50 dark:bg-slate-900 px-3 py-1.5">
              {b.series || b.bond_type} — {formatMoney(b.nominal_value, b.currency)}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm sm:grid-cols-4">
        <Field label="Typ obligacji">
          <select value={bondType} onChange={(e) => setBondType(e.target.value as BondType)} className="input">
            {Object.entries(BOND_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {t(label)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Seria (opcjonalnie)">
          <input value={series} onChange={(e) => setSeries(e.target.value)} placeholder="np. EDO0435" className="input" />
        </Field>
        <Field label="Powiąż z kontem (opcjonalnie)">
          <select value={account} onChange={(e) => setAccount(e.target.value ? Number(e.target.value) : '')} className="input">
            <option value="">{t('bez powiązania')}</option>
            {(accounts ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.bank_name} — {a.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Wartość nominalna">
          <input type="number" step="0.01" value={nominalValue} onChange={(e) => setNominalValue(e.target.value)} required className="input" />
        </Field>
        <Field label="Waluta">
          <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="input">
            <option value="PLN">PLN</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="NOK">NOK</option>
            <option value="DKK">DKK</option>
            <option value="GBP">GBP</option>
          </select>
        </Field>
        <Field label="Bieżące oprocentowanie (%)">
          <input type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} required className="input" />
        </Field>
        <Field label="Data zakupu">
          <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required className="input" />
        </Field>
        <Field label="Data wykupu">
          <input type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} required className="input" />
        </Field>
        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full" disabled={mutation.isPending}>
            {t('+ Dodaj obligację')}
          </button>
        </div>
        {account && (
          <label className="col-span-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 sm:col-span-4">
            <input type="checkbox" checked={alreadyOwned} onChange={(e) => setAlreadyOwned(e.target.checked)} />
            {t('To obligacja, którą już posiadam — nie odejmuj środków z konta (tylko zapisz powiązanie).')}
          </label>
        )}
      </form>
    </div>
  )
}
