import { forwardRef, useImperativeHandle, useRef, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { AmountInput } from '../components/AmountInput'
import BankNameAutocomplete from '../components/BankNameAutocomplete'
import CryptoAutocomplete from '../components/CryptoAutocomplete'
import StockAutocomplete from '../components/StockAutocomplete'
import { useLanguage } from '../i18n/LanguageContext'
import { trackEvent } from '../lib/analytics'
import { accountTypeLabel, BOND_TYPE_LABELS, formatDate, formatMoney, formatNumber, groupAccountsByBank } from '../lib/format'
import type {
  BankAccount,
  BankAccountType,
  BondType,
  CryptoAsset,
  CryptoSearchResult,
  CryptoTransaction,
  Currency,
  Market,
  Stock,
  StockSearchResult,
  StockTransaction,
  TermDeposit,
  TreasuryBond,
} from '../types'

type StepId = 'interests' | 'accounts' | 'stocks' | 'crypto' | 'deposits' | 'bonds' | 'done'

// Exposed by every step form below so the wizard can save-then-advance
// instead of silently discarding whatever someone typed but never explicitly
// submitted before clicking "Dalej".
interface StepHandle {
  /** Returns false (and blocks navigation) only when there's unsaved, invalid
   * input - e.g. a required field left empty. Returns true and fires off the
   * save (fire-and-forget; it's the same shared query client regardless of
   * which step is visible) when there's something valid to save, or when the
   * step's form was never touched at all. */
  trySubmitPending: () => boolean
}

function trySubmitForm(formEl: HTMLFormElement | null): boolean {
  if (!formEl) return true
  if (!formEl.reportValidity()) return false
  formEl.requestSubmit()
  return true
}

const STEPS: { id: StepId; label: string }[] = [
  { id: 'interests', label: 'Zainteresowania' },
  { id: 'accounts', label: 'Konta' },
  { id: 'stocks', label: 'Akcje' },
  { id: 'crypto', label: 'Krypto' },
  { id: 'deposits', label: 'Lokaty' },
  { id: 'bonds', label: 'Obligacje' },
  { id: 'done', label: 'Gotowe' },
]

const ACCOUNTS_STEP_INDEX = STEPS.findIndex((s) => s.id === 'accounts')

export default function Onboarding() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const [stepIndex, setStepIndex] = useState(0)
  const step = STEPS[stepIndex]

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await api.get<BankAccount[]>('/banking/accounts/')).data,
  })
  // Registration requires at least one bank account — the "accounts" step
  // can't be skipped or passed until one exists.
  const hasAccount = (accounts?.length ?? 0) > 0
  const accountsStepBlocked = step.id === 'accounts' && !hasAccount

  // One ref per step that has a form worth saving before navigating away from
  // it - see StepHandle. Steps without a ref here (interests/done) have
  // nothing that can be silently lost.
  const stepRefs: Partial<Record<StepId, React.RefObject<StepHandle | null>>> = {
    accounts: useRef<StepHandle>(null),
    stocks: useRef<StepHandle>(null),
    crypto: useRef<StepHandle>(null),
    deposits: useRef<StepHandle>(null),
    bonds: useRef<StepHandle>(null),
  }

  // Called before every navigation away from the current step - saves
  // whatever was typed but never explicitly submitted, or blocks navigation
  // if it's invalid (missing a required field), so "Dalej" can't silently
  // discard it.
  function tryLeaveStep(): boolean {
    return stepRefs[step.id]?.current?.trySubmitPending() ?? true
  }

  function next() {
    if (!tryLeaveStep()) return
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }
  function back() {
    if (!tryLeaveStep()) return
    setStepIndex((i) => Math.max(i - 1, 0))
  }
  function finish() {
    if (!tryLeaveStep()) return
    trackEvent('onboarding_completed')
    queryClient.invalidateQueries()
    navigate('/dashboard')
  }
  function goToStep(i: number) {
    if ((i <= ACCOUNTS_STEP_INDEX || hasAccount) && tryLeaveStep()) setStepIndex(i)
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

      <div className="flex flex-wrap items-center gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goToStep(i)}
            disabled={i > ACCOUNTS_STEP_INDEX && !hasAccount}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
              i === stepIndex
                ? 'bg-accent-600 text-white'
                : i < stepIndex
                  ? 'bg-accent-100 dark:bg-accent-900/50 text-accent-700 dark:text-accent-400'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            {i + 1}. {t(s.label)}
          </button>
        ))}
        <button
          onClick={finish}
          disabled={!hasAccount}
          title={!hasAccount ? t('Dodaj najpierw co najmniej jedno konto bankowe.') : undefined}
          className="ml-auto text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:no-underline"
        >
          {t('Zakończ teraz →')}
        </button>
      </div>
      {accountsStepBlocked && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {t('Dodaj co najmniej jedno konto bankowe, żeby przejść dalej.')}
        </p>
      )}

      {step.id === 'interests' && <InterestsStep />}
      {step.id === 'accounts' && <AccountsStep ref={stepRefs.accounts} />}
      {step.id === 'stocks' && <StocksStep ref={stepRefs.stocks} />}
      {step.id === 'crypto' && <CryptoStep ref={stepRefs.crypto} />}
      {step.id === 'deposits' && <DepositsStep ref={stepRefs.deposits} />}
      {step.id === 'bonds' && <BondsStep ref={stepRefs.bonds} />}
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
          <button onClick={next} disabled={accountsStepBlocked} className="btn-primary disabled:cursor-not-allowed disabled:opacity-40">
            {t('Dalej →')}
          </button>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  const { t } = useLanguage()
  return (
    <label className={`block text-xs font-medium text-slate-500 dark:text-slate-400 ${className ?? ''}`}>
      {t(label)}
      <div className="mt-1">{children}</div>
    </label>
  )
}

const INTEREST_OPTIONS: {
  field: 'interest_stocks' | 'interest_budget' | 'interest_planning' | 'interest_analysis' | 'interest_crypto'
  label: string
  hint: string
}[] = [
  { field: 'interest_stocks', label: 'Giełda', hint: 'Portfel akcji, dywidendy, analiza spółek' },
  { field: 'interest_crypto', label: 'Krypto', hint: 'Portfel kryptowalut i analiza' },
  { field: 'interest_budget', label: 'Budżet', hint: 'Notowanie przychodów i wydatków' },
  { field: 'interest_planning', label: 'Planowanie', hint: 'Cele oszczędnościowe i planowane wydatki' },
  { field: 'interest_analysis', label: 'Analiza', hint: 'Kalkulator inwestycyjny - obligacje, lokaty, giełda' },
]

function InterestsStep() {
  const { user, refreshUser } = useAuth()
  const { t } = useLanguage()

  const mutation = useMutation({
    mutationFn: (payload: Record<string, boolean>) => api.patch('/auth/me/', payload),
    onSuccess: refreshUser,
  })

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {t('Z czego chcesz korzystać? Odznacz to, czego nie potrzebujesz — zawsze możesz to zmienić później w ustawieniach konta.')}
      </p>
      {INTEREST_OPTIONS.map((opt) => (
        <label key={opt.field} className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={user?.profile[opt.field] ?? true}
            onChange={(e) => mutation.mutate({ [opt.field]: e.target.checked })}
          />
          <span>
            <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">{t(opt.label)}</span>
            <span className="block text-xs text-slate-400 dark:text-slate-500">{t(opt.hint)}</span>
          </span>
        </label>
      ))}
    </div>
  )
}

const AccountsStep = forwardRef<StepHandle>(function AccountsStep(_props, ref) {
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await api.get<BankAccount[]>('/banking/accounts/')).data,
  })

  const formRef = useRef<HTMLFormElement>(null)
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

  useImperativeHandle(ref, () => ({
    trySubmitPending: () => (bankName.trim() || name.trim() ? trySubmitForm(formRef.current) : true),
  }))

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
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="flex flex-wrap gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm"
      >
        <Field label="Bank" className="min-w-[160px] flex-1">
          <BankNameAutocomplete value={bankName} onChange={setBankName} required />
        </Field>
        <Field label="Nazwa konta" className="min-w-[140px] flex-1">
          <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
        </Field>
        <Field label="Typ" className="min-w-[140px] flex-1">
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
        <Field label="Waluta" className="min-w-[110px] flex-1">
          <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="input">
            <option value="PLN">PLN</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="NOK">NOK</option>
            <option value="DKK">DKK</option>
            <option value="GBP">GBP</option>
          </select>
        </Field>
        <Field label="Obecne saldo" className="min-w-[140px] flex-1">
          <AmountInput value={balance} onChange={setBalance} required className="input" />
        </Field>
        <div className="flex items-end">
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
})

const StocksStep = forwardRef<StepHandle>(function StocksStep(_props, ref) {
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
    queryKey: ['transactions-all'],
    queryFn: async () =>
      (await api.get<{ results: StockTransaction[] }>('/stocks/transactions/', { params: { page_size: 2000 } })).data
        .results,
  })

  const formRef = useRef<HTMLFormElement>(null)
  const [ticker, setTicker] = useState('')
  const [market, setMarket] = useState<Market>('GPW')
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
  // Every account is selectable regardless of currency - e.g. buying a US
  // stock from a PLN brokerage account - the backend converts at the
  // transaction date's exchange rate before touching the account's balance.
  const accountGroups = groupAccountsByBank(accounts ?? [])

  useImperativeHandle(ref, () => ({
    trySubmitPending: () => (ticker.trim() ? trySubmitForm(formRef.current) : true),
  }))

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
      queryClient.invalidateQueries({ queryKey: ['transactions-all'] })
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
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm"
      >
        <Field label="Wyszukaj spółkę">
          <StockAutocomplete onSelect={onPick} />
        </Field>
        <div className="flex flex-wrap gap-3">
          <Field label="Ticker" className="min-w-[110px] flex-1">
            <input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} required className="input" />
          </Field>
          <Field label="Rynek" className="min-w-[110px] flex-1">
            <select value={market} onChange={(e) => setMarket(e.target.value as Market)} className="input">
              <option value="GPW">GPW</option>
              <option value="US">USA</option>
              <option value="EU">{t('Europa')}</option>
            </select>
          </Field>
          <Field label="Ilość" className="min-w-[110px] flex-1">
            <AmountInput value={quantity} onChange={setQuantity} required className="input" />
          </Field>
          <Field label="Cena zakupu/szt." className="min-w-[130px] flex-1">
            <AmountInput value={pricePerShare} onChange={setPricePerShare} required className="input" />
          </Field>
          <Field label="Data zakupu (wstecz)" className="min-w-[160px] flex-1">
            <input type="date" value={executedAt} onChange={(e) => setExecutedAt(e.target.value)} required className="input" />
          </Field>
          <Field label="Powiąż z kontem (opcjonalnie)" className="min-w-[200px] flex-1">
            <select value={account} onChange={(e) => setAccount(e.target.value ? Number(e.target.value) : '')} className="input">
              <option value="">{t('bez powiązania')}</option>
              {accountGroups.map(([bankName, group]) => (
                <optgroup key={bankName} label={bankName}>
                  {group.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
                </optgroup>
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
})

const CryptoStep = forwardRef<StepHandle>(function CryptoStep(_props, ref) {
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const { data: cryptoAssets } = useQuery({
    queryKey: ['crypto-assets'],
    queryFn: async () => (await api.get<CryptoAsset[]>('/crypto/assets/')).data,
  })
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await api.get<BankAccount[]>('/banking/accounts/')).data,
  })
  const { data: transactions } = useQuery({
    queryKey: ['crypto-transactions-all'],
    queryFn: async () =>
      (await api.get<{ results: CryptoTransaction[] }>('/crypto/transactions/', { params: { page_size: 2000 } }))
        .data.results,
  })

  const formRef = useRef<HTMLFormElement>(null)
  const [coingeckoId, setCoingeckoId] = useState('')
  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')
  const [assetId, setAssetId] = useState<number | ''>('')
  const [account, setAccount] = useState<number | ''>('')
  const [alreadyOwned, setAlreadyOwned] = useState(true)
  const [quantity, setQuantity] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('')
  const [currency, setCurrency] = useState<Currency>('PLN')
  const [executedAt, setExecutedAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [error, setError] = useState<string | null>(null)

  const existing = cryptoAssets?.find((a) => a.coingecko_id === coingeckoId)
  const eligibleAccounts = (accounts ?? []).filter((a) => a.currency === currency)

  useImperativeHandle(ref, () => ({
    trySubmitPending: () => (coingeckoId.trim() ? trySubmitForm(formRef.current) : true),
  }))

  function onPick(result: CryptoSearchResult) {
    setCoingeckoId(result.coingecko_id)
    setSymbol(result.symbol)
    setName(result.name)
    setAssetId('')
  }

  const mutation = useMutation({
    mutationFn: async () => {
      let id = existing?.id ?? assetId
      if (!id) {
        const { data } = await api.post<CryptoAsset>('/crypto/assets/', { coingecko_id: coingeckoId, symbol, name })
        id = data.id
      }
      return api.post('/crypto/transactions/', {
        asset: id,
        type: 'BUY',
        account: account || null,
        affects_balance: !alreadyOwned,
        quantity,
        price_per_unit: pricePerUnit,
        fee: '0',
        currency,
        executed_at: executedAt,
      })
    },
    onSuccess: () => {
      setCoingeckoId('')
      setSymbol('')
      setName('')
      setQuantity('')
      setPricePerUnit('')
      setError(null)
      queryClient.invalidateQueries({ queryKey: ['crypto-assets'] })
      queryClient.invalidateQueries({ queryKey: ['crypto-transactions-all'] })
      queryClient.invalidateQueries({ queryKey: ['crypto-holdings'] })
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
    if (!coingeckoId) {
      setError(t('Wybierz monetę.'))
      return
    }
    mutation.mutate()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {t('Dla każdej posiadanej monety podaj ilość, cenę i')} <strong>{t('prawdziwą datę zakupu')}</strong>{' '}
        {t('— dzięki temu historia i wykresy będą liczone poprawnie.')}
      </p>
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm"
      >
        <Field label="Wyszukaj monetę">
          <CryptoAutocomplete onSelect={onPick} />
        </Field>
        <div className="flex flex-wrap gap-3">
          <Field label="Symbol" className="min-w-[110px] flex-1">
            <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} required className="input" />
          </Field>
          <Field label="Ilość" className="min-w-[110px] flex-1">
            <AmountInput value={quantity} onChange={setQuantity} required className="input" />
          </Field>
          <Field label="Cena zakupu/szt." className="min-w-[130px] flex-1">
            <AmountInput value={pricePerUnit} onChange={setPricePerUnit} required className="input" />
          </Field>
          <Field label="Waluta" className="min-w-[110px] flex-1">
            <select value={currency} onChange={(e) => { setCurrency(e.target.value as Currency); setAccount('') }} className="input">
              <option value="PLN">PLN</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="NOK">NOK</option>
              <option value="DKK">DKK</option>
              <option value="GBP">GBP</option>
              <option value="SEK">SEK</option>
              <option value="CHF">CHF</option>
            </select>
          </Field>
          <Field label="Data zakupu (wstecz)" className="min-w-[160px] flex-1">
            <input type="date" value={executedAt} onChange={(e) => setExecutedAt(e.target.value)} required className="input" />
          </Field>
          <Field label="Powiąż z kontem (opcjonalnie)" className="min-w-[200px] flex-1">
            <select value={account} onChange={(e) => setAccount(e.target.value ? Number(e.target.value) : '')} className="input">
              <option value="">{t('bez powiązania')}</option>
              {groupAccountsByBank(eligibleAccounts).map(([bankName, group]) => (
                <optgroup key={bankName} label={bankName}>
                  {group.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </optgroup>
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
              'Jeśli wybierzesz konto, kwota zostanie od razu odjęta z jego salda — zostaw puste, jeśli tylko deklarujesz monety, które już posiadasz.',
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
                {tx.asset_detail.symbol} — {formatNumber(tx.quantity, 6)} {t('szt.')} @{' '}
                {formatMoney(tx.price_per_unit, tx.currency)}
                <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                  {formatDate(tx.executed_at)}
                  {tx.account_detail ? ` — ${tx.account_detail.bank_name} ${tx.account_detail.name}` : ` — ${t('bez powiązania z kontem')}`}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {(transactions?.length ?? 0) === 0 && (cryptoAssets?.length ?? 0) === 0 && (
        <p className="text-sm text-slate-400 dark:text-slate-500">{t('Nie dodano jeszcze żadnych monet.')}</p>
      )}
    </div>
  )
})

const DepositsStep = forwardRef<StepHandle>(function DepositsStep(_props, ref) {
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

  const formRef = useRef<HTMLFormElement>(null)
  const [bankName, setBankName] = useState('')
  const [account, setAccount] = useState<number | ''>('')
  const [alreadyOwned, setAlreadyOwned] = useState(true)
  const [principal, setPrincipal] = useState('')
  const [currency, setCurrency] = useState<Currency>('PLN')
  const [rate, setRate] = useState('')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState('')

  useImperativeHandle(ref, () => ({
    trySubmitPending: () => (bankName.trim() || principal.trim() ? trySubmitForm(formRef.current) : true),
  }))

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
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="flex flex-wrap gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm"
      >
        <Field label="Bank" className="min-w-[160px] flex-1">
          <BankNameAutocomplete value={bankName} onChange={setBankName} required />
        </Field>
        <Field label="Powiąż z kontem (opcjonalnie)" className="min-w-[200px] flex-1">
          <select value={account} onChange={(e) => setAccount(e.target.value ? Number(e.target.value) : '')} className="input">
            <option value="">{t('bez powiązania')}</option>
            {groupAccountsByBank(accounts ?? []).map(([bankName, group]) => (
              <optgroup key={bankName} label={bankName}>
                {group.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label="Kwota" className="min-w-[120px] flex-1">
          <AmountInput value={principal} onChange={setPrincipal} required className="input" />
        </Field>
        <Field label="Waluta" className="min-w-[110px] flex-1">
          <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="input">
            <option value="PLN">PLN</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="NOK">NOK</option>
            <option value="DKK">DKK</option>
            <option value="GBP">GBP</option>
          </select>
        </Field>
        <Field label="Oprocentowanie (%)" className="min-w-[130px] flex-1">
          <AmountInput value={rate} onChange={setRate} required className="input" />
        </Field>
        <Field label="Data założenia" className="min-w-[160px] flex-1">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="input" />
        </Field>
        <Field label="Data zakończenia" className="min-w-[160px] flex-1">
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="input" />
        </Field>
        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full" disabled={mutation.isPending}>
            {t('+ Dodaj lokatę')}
          </button>
        </div>
        {account && (
          <label className="flex w-full items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <input type="checkbox" checked={alreadyOwned} onChange={(e) => setAlreadyOwned(e.target.checked)} />
            {t('To lokata, którą już posiadam — nie odejmuj środków z konta (tylko zapisz powiązanie).')}
          </label>
        )}
      </form>
    </div>
  )
})

const BondsStep = forwardRef<StepHandle>(function BondsStep(_props, ref) {
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

  const formRef = useRef<HTMLFormElement>(null)
  const [bondType, setBondType] = useState<BondType>('EDO')
  const [series, setSeries] = useState('')
  const [account, setAccount] = useState<number | ''>('')
  const [alreadyOwned, setAlreadyOwned] = useState(true)
  const [nominalValue, setNominalValue] = useState('')
  const [currency, setCurrency] = useState<Currency>('PLN')
  const [rate, setRate] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [maturityDate, setMaturityDate] = useState('')

  useImperativeHandle(ref, () => ({
    trySubmitPending: () => (nominalValue.trim() || series.trim() ? trySubmitForm(formRef.current) : true),
  }))

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
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="flex flex-wrap gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm"
      >
        <Field label="Typ obligacji" className="min-w-[160px] flex-1">
          <select value={bondType} onChange={(e) => setBondType(e.target.value as BondType)} className="input">
            {Object.entries(BOND_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {t(label)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Seria (opcjonalnie)" className="min-w-[140px] flex-1">
          <input value={series} onChange={(e) => setSeries(e.target.value)} placeholder="np. EDO0435" className="input" />
        </Field>
        <Field label="Powiąż z kontem (opcjonalnie)" className="min-w-[200px] flex-1">
          <select value={account} onChange={(e) => setAccount(e.target.value ? Number(e.target.value) : '')} className="input">
            <option value="">{t('bez powiązania')}</option>
            {groupAccountsByBank(accounts ?? []).map(([bankName, group]) => (
              <optgroup key={bankName} label={bankName}>
                {group.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label="Wartość nominalna" className="min-w-[130px] flex-1">
          <AmountInput value={nominalValue} onChange={setNominalValue} required className="input" />
        </Field>
        <Field label="Waluta" className="min-w-[110px] flex-1">
          <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="input">
            <option value="PLN">PLN</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="NOK">NOK</option>
            <option value="DKK">DKK</option>
            <option value="GBP">GBP</option>
          </select>
        </Field>
        <Field label="Bieżące oprocentowanie (%)" className="min-w-[150px] flex-1">
          <AmountInput value={rate} onChange={setRate} required className="input" />
        </Field>
        <Field label="Data zakupu" className="min-w-[160px] flex-1">
          <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required className="input" />
        </Field>
        <Field label="Data wykupu" className="min-w-[160px] flex-1">
          <input type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} required className="input" />
        </Field>
        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full" disabled={mutation.isPending}>
            {t('+ Dodaj obligację')}
          </button>
        </div>
        {account && (
          <label className="flex w-full items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <input type="checkbox" checked={alreadyOwned} onChange={(e) => setAlreadyOwned(e.target.checked)} />
            {t('To obligacja, którą już posiadam — nie odejmuj środków z konta (tylko zapisz powiązanie).')}
          </label>
        )}
      </form>
    </div>
  )
})
