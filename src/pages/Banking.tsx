import { Fragment, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import BankNameAutocomplete from '../components/BankNameAutocomplete'
import { PageLoader } from '../components/Loader'
import StatementImportPanel from '../components/StatementImportPanel'
import { useLanguage } from '../i18n/LanguageContext'
import { accountTypeLabel, formatDate, formatMoney, formatNumber } from '../lib/format'
import { AddTransactionForm } from './analysis/shared'
import type {
  AccountTransfer,
  BankAccount,
  BankAccountType,
  BondType,
  Category,
  Currency,
  DashboardSummary,
  TermDeposit,
  TreasuryBond,
} from '../types'

const ACCOUNT_TYPE_ORDER: BankAccountType[] = ['checking', 'savings', 'brokerage', 'business', 'ike', 'ikze', 'crypto']
const COLLAPSED_TYPES_KEY = 'myfaj_collapsed_account_types'

const BOND_TYPE_LABELS: Record<BondType, string> = {
  OTS: 'OTS – 3-miesięczne',
  ROR: 'ROR – roczne, zmienne',
  DOR: 'DOR – 2-letnie, zmienne',
  TOS: 'TOS – 3-letnie, stałoprocentowe',
  COI: 'COI – 4-letnie, indeksowane inflacją',
  EDO: 'EDO – 10-letnie, indeksowane inflacją',
  ROS: 'ROS – rodzinne oszczędnościowe',
  ROD: 'ROD – rodzinne, indeksowane inflacją',
  OTHER: 'Inne',
}

export default function Banking() {
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const { user } = useAuth()
  const baseCurrency = user?.profile.base_currency
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [showAddDeposit, setShowAddDeposit] = useState(false)
  const [showAddBond, setShowAddBond] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [showImportStatement, setShowImportStatement] = useState(false)
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null)
  const [editingDepositId, setEditingDepositId] = useState<number | null>(null)
  const [editingBondId, setEditingBondId] = useState<number | null>(null)
  const [breakingDepositId, setBreakingDepositId] = useState<number | null>(null)
  const [redeemingBondId, setRedeemingBondId] = useState<number | null>(null)
  const [collapsedTypes, setCollapsedTypes] = useState<Set<BankAccountType>>(
    () => new Set(JSON.parse(localStorage.getItem(COLLAPSED_TYPES_KEY) ?? '[]') as BankAccountType[]),
  )

  function toggleGroup(type: BankAccountType) {
    setCollapsedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      localStorage.setItem(COLLAPSED_TYPES_KEY, JSON.stringify([...next]))
      return next
    })
  }

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await api.get<BankAccount[]>('/banking/accounts/')).data,
  })

  const { data: categories } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: async () => (await api.get<Category[]>('/budget/categories/')).data,
  })

  const [quickTxAccountId, setQuickTxAccountId] = useState<number | null>(null)

  const { data: deposits } = useQuery({
    queryKey: ['deposits'],
    queryFn: async () => (await api.get<TermDeposit[]>('/banking/deposits/')).data,
  })

  const { data: bonds } = useQuery({
    queryKey: ['bonds'],
    queryFn: async () => (await api.get<TreasuryBond[]>('/bonds/')).data,
  })

  const { data: transfers } = useQuery({
    queryKey: ['transfers'],
    queryFn: async () => (await api.get<AccountTransfer[]>('/banking/transfers/')).data,
  })

  const { data: summary } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<DashboardSummary>('/networth/dashboard/')).data,
  })

  const base = summary?.base_currency ?? 'PLN'
  const groupedAccounts = ACCOUNT_TYPE_ORDER.map((type) => ({
    type,
    items: (accounts ?? [])
      .filter((a) => a.account_type === type)
      .sort((a, b) => a.display_order - b.display_order),
  })).filter((g) => g.items.length > 0)

  function invalidateAccountsRelated() {
    queryClient.invalidateQueries({ queryKey: ['accounts'] })
    queryClient.invalidateQueries({ queryKey: ['transfers'] })
    queryClient.invalidateQueries({ queryKey: ['deposits'] })
    queryClient.invalidateQueries({ queryKey: ['bonds'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['timeline'] })
    queryClient.invalidateQueries({ queryKey: ['budget-breakdown'] })
    queryClient.invalidateQueries({ queryKey: ['budget-trend'] })
    queryClient.invalidateQueries({ queryKey: ['budget-transactions'] })
    queryClient.invalidateQueries({ queryKey: ['budget-summary'] })
  }

  const deleteAccount = useMutation({
    mutationFn: (id: number) => api.delete(`/banking/accounts/${id}/`),
    onSuccess: invalidateAccountsRelated,
  })

  function alertOnError(err: unknown) {
    const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
    if (detail) window.alert(detail)
  }

  const deleteDeposit = useMutation({
    mutationFn: (id: number) => api.delete(`/banking/deposits/${id}/`),
    onSuccess: invalidateAccountsRelated,
    onError: alertOnError,
  })

  const deleteBond = useMutation({
    mutationFn: (id: number) => api.delete(`/bonds/${id}/`),
    onSuccess: invalidateAccountsRelated,
    onError: alertOnError,
  })

  const reorderAccounts = useMutation({
    mutationFn: (order: number[]) => api.post('/banking/accounts/reorder/', { order }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  })

  function moveAccount(group: BankAccount[], index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= group.length) return
    const ids = group.map((a) => a.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    reorderAccounts.mutate(ids)
  }

  function onDeleteAccount(account: BankAccount) {
    if (window.confirm(t('Usunąć konto "{0}" ({1})? Tej operacji nie można cofnąć.', account.name, account.bank_name))) {
      deleteAccount.mutate(account.id)
    }
  }

  if (accountsLoading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label={t('Konta bankowe łącznie')} value={formatMoney(summary?.latest?.bank_balance, base)} />
        <SummaryCard label={t('Lokaty łącznie')} value={formatMoney(summary?.latest?.deposits_value, base)} />
        <SummaryCard label={t('Obligacje łącznie')} value={formatMoney(summary?.latest?.bonds_value, base)} />
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Konta bankowe')}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTransfer((v) => !v)}
              className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              disabled={(accounts?.length ?? 0) < 2}
              title={(accounts?.length ?? 0) < 2 ? t('Potrzebujesz co najmniej dwóch kont') : undefined}
            >
              {t('⇄ Przelew')}
            </button>
            <button
              onClick={() => setShowImportStatement((v) => !v)}
              className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {t('⇪ Importuj wyciąg')}
            </button>
            <button
              onClick={() => setShowAddAccount((v) => !v)}
              className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-700"
            >
              {t('+ Konto')}
            </button>
          </div>
        </div>

        {showAddAccount && (
          <div className="mt-3">
            <AccountForm
              onDone={() => {
                setShowAddAccount(false)
                invalidateAccountsRelated()
              }}
              onCancel={() => setShowAddAccount(false)}
            />
          </div>
        )}

        {showImportStatement && (
          <div className="mt-3">
            <StatementImportPanel
              accounts={accounts ?? []}
              onDone={() => {
                setShowImportStatement(false)
                invalidateAccountsRelated()
              }}
              onCancel={() => setShowImportStatement(false)}
            />
          </div>
        )}

        {showTransfer && (
          <div className="mt-3">
            <TransferForm
              accounts={accounts ?? []}
              onDone={() => {
                setShowTransfer(false)
                invalidateAccountsRelated()
              }}
              onCancel={() => setShowTransfer(false)}
            />
          </div>
        )}

        <div className="mt-4 space-y-5">
          {groupedAccounts.map((group) => {
            const collapsed = collapsedTypes.has(group.type)
            return (
            <div key={group.type}>
              <button
                onClick={() => toggleGroup(group.type)}
                className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <span className={`inline-block transition-transform ${collapsed ? '-rotate-90' : ''}`}>▾</span>
                {t(accountTypeLabel(group.type))}
                <span className="font-normal normal-case text-slate-300 dark:text-slate-600">({group.items.length})</span>
              </button>
              {!collapsed && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((a, i) =>
                  editingAccountId === a.id ? (
                    <div key={a.id} className="sm:col-span-2 lg:col-span-3">
                      <AccountForm
                        account={a}
                        onDone={() => {
                          setEditingAccountId(null)
                          invalidateAccountsRelated()
                        }}
                        onCancel={() => setEditingAccountId(null)}
                      />
                    </div>
                  ) : (
                    <div key={a.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          {a.bank_name}
                          {baseCurrency && a.currency !== baseCurrency && (
                            <span
                              title={t('Waluta inna niż domyślna ({0})', baseCurrency)}
                              className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400"
                            >
                              {t('walutowe')}
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => moveAccount(group.items, i, -1)}
                            disabled={i === 0 || reorderAccounts.isPending}
                            title={t('Przesuń w górę')}
                            className="rounded px-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveAccount(group.items, i, 1)}
                            disabled={i === group.items.length - 1 || reorderAccounts.isPending}
                            title={t('Przesuń w dół')}
                            className="rounded px-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => setEditingAccountId(a.id)}
                            className="text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline"
                          >
                            {t('Edytuj')}
                          </button>
                          <button
                            onClick={() => onDeleteAccount(a)}
                            className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                          >
                            {t('Usuń')}
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{a.name}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          {formatMoney(a.current_balance, a.currency)}
                        </p>
                        <button
                          onClick={() => setQuickTxAccountId(quickTxAccountId === a.id ? null : a.id)}
                          className="text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline"
                        >
                          {t('+ Przychód/Wydatek')}
                        </button>
                      </div>
                      {quickTxAccountId === a.id && (
                        <div className="mt-3">
                          <AddTransactionForm
                            categories={categories ?? []}
                            accounts={accounts ?? []}
                            lockedAccount={a}
                            onDone={() => {
                              setQuickTxAccountId(null)
                              invalidateAccountsRelated()
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
              )}
            </div>
            )
          })}
          {accounts?.length === 0 && <p className="text-slate-400 dark:text-slate-500">{t('Brak kont — dodaj pierwsze.')}</p>}
        </div>

        {(transfers?.length ?? 0) > 0 && (
          <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Historia przelewów')}</h3>
            <div className="space-y-2">
              {(transfers ?? []).map((t) => (
                <div key={t.id} className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-1.5 text-sm last:border-0">
                  <span>
                    {t.from_account_detail.name} → {t.to_account_detail.name}:{' '}
                    <span className="font-medium">{formatMoney(t.amount, t.from_account_detail.currency)}</span>
                    {t.note && ` — ${t.note}`}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500">{formatDate(t.date)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Lokaty')}</h2>
          <button
            onClick={() => setShowAddDeposit((v) => !v)}
            className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-700"
          >
            {t('+ Lokata')}
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {t('Suma kapitału')}: <span className="font-medium text-slate-700 dark:text-slate-300">{formatMoney(summary?.latest?.deposits_value, base)}</span>
          {' · '}
          {t('Zarobione odsetki')}:{' '}
          <span className="font-medium text-emerald-700 dark:text-emerald-400">{formatMoney(summary?.deposits_interest_earned, base)}</span>
        </p>

        {showAddDeposit && (
          <div className="mt-3">
            <AddDepositForm
              accounts={accounts ?? []}
              onDone={() => {
                setShowAddDeposit(false)
                invalidateAccountsRelated()
              }}
            />
          </div>
        )}

        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2">{t('Bank')}</th>
                <th className="px-4 py-2 text-right">{t('Kwota')}</th>
                <th className="px-4 py-2 text-right">{t('Oprocentowanie')}</th>
                <th className="px-4 py-2 text-right">{t('Koniec')}</th>
                <th className="px-4 py-2 text-right">{t('Już zarobiono')}</th>
                <th className="px-4 py-2 text-right">{t('Szac. na koniec')}</th>
                <th className="px-4 py-2 text-right">{t('Status')}</th>
                <th className="px-4 py-2 text-right">{t('Operacje')}</th>
              </tr>
            </thead>
            <tbody>
              {(deposits ?? []).map((d) => (
                <Fragment key={d.id}>
                  <tr className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <td className="px-4 py-2">
                      {d.bank_name}
                      {d.account_detail && (
                        <span className="block text-xs text-slate-400 dark:text-slate-500">{d.account_detail.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">{formatMoney(d.principal, d.currency)}</td>
                    <td className="px-4 py-2 text-right">{formatNumber(d.interest_rate, 2)}%</td>
                    <td className="px-4 py-2 text-right">{formatDate(d.end_date)}</td>
                    <td className="px-4 py-2 text-right font-medium text-emerald-700 dark:text-emerald-400">
                      {formatMoney(d.accrued_interest, d.currency)}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">{formatMoney(d.projected_total, d.currency)}</td>
                    <td className="px-4 py-2 text-right">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          d.status === 'active' ? 'bg-accent-100 dark:bg-accent-900/50 text-accent-700 dark:text-accent-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {d.status === 'active' ? t('aktywna') : t('zamknięta')}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setEditingDepositId(editingDepositId === d.id ? null : d.id)}
                          className="text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline"
                        >
                          {t('Edytuj')}
                        </button>
                        {d.status === 'active' && (
                          <button
                            onClick={() => setBreakingDepositId(breakingDepositId === d.id ? null : d.id)}
                            className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                          >
                            {t('Zerwij')}
                          </button>
                        )}
                        {d.status === 'closed' && (
                          <button
                            onClick={() => {
                              if (window.confirm(t('Czy na pewno chcesz usunąć tę lokatę?'))) {
                                deleteDeposit.mutate(d.id)
                              }
                            }}
                            disabled={deleteDeposit.isPending}
                            className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                          >
                            {t('Usuń')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {editingDepositId === d.id && (
                    <tr>
                      <td colSpan={8} className="bg-slate-50 dark:bg-slate-900 px-4 py-3">
                        <EditDepositForm
                          deposit={d}
                          accounts={accounts ?? []}
                          onDone={() => {
                            setEditingDepositId(null)
                            invalidateAccountsRelated()
                          }}
                          onCancel={() => setEditingDepositId(null)}
                        />
                      </td>
                    </tr>
                  )}
                  {breakingDepositId === d.id && (
                    <tr>
                      <td colSpan={8} className="bg-slate-50 dark:bg-slate-900 px-4 py-3">
                        <BreakDepositForm
                          deposit={d}
                          accounts={accounts ?? []}
                          onDone={() => {
                            setBreakingDepositId(null)
                            invalidateAccountsRelated()
                          }}
                          onCancel={() => setBreakingDepositId(null)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {deposits?.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                    {t('Brak lokat.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Obligacje skarbowe')}</h2>
          <button
            onClick={() => setShowAddBond((v) => !v)}
            className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-700"
          >
            {t('+ Obligacja')}
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {t('Suma wartości nominalnej')}: <span className="font-medium text-slate-700 dark:text-slate-300">{formatMoney(summary?.latest?.bonds_value, base)}</span>
          {' · '}
          {t('Zarobione odsetki')}:{' '}
          <span className="font-medium text-emerald-700 dark:text-emerald-400">{formatMoney(summary?.bonds_interest_earned, base)}</span>
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {t(
            'Odsetki liczone metodą uproszczoną (proste, wg wpisanego bieżącego oprocentowania) — nie odwzorowuje dokładnie zmiennych/indeksowanych inflacją harmonogramów kapitalizacji poszczególnych serii.',
          )}
        </p>

        {showAddBond && (
          <div className="mt-3">
            <AddBondForm
              accounts={accounts ?? []}
              onDone={() => {
                setShowAddBond(false)
                invalidateAccountsRelated()
              }}
            />
          </div>
        )}

        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2">{t('Seria')}</th>
                <th className="px-4 py-2 text-right">{t('Wartość nominalna')}</th>
                <th className="px-4 py-2 text-right">{t('Oprocentowanie')}</th>
                <th className="px-4 py-2 text-right">{t('Wykup')}</th>
                <th className="px-4 py-2 text-right">{t('Już zarobiono')}</th>
                <th className="px-4 py-2 text-right">{t('Wartość obecna')}</th>
                <th className="px-4 py-2 text-right">{t('Szac. na koniec')}</th>
                <th className="px-4 py-2 text-right">{t('Status')}</th>
                <th className="px-4 py-2 text-right">{t('Operacje')}</th>
              </tr>
            </thead>
            <tbody>
              {(bonds ?? []).map((b) => (
                <Fragment key={b.id}>
                  <tr className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <td className="px-4 py-2">
                      {t(BOND_TYPE_LABELS[b.bond_type])}
                      {b.series && <span className="block text-xs text-slate-400 dark:text-slate-500">{b.series}</span>}
                    </td>
                    <td className="px-4 py-2 text-right">{formatMoney(b.nominal_value, b.currency)}</td>
                    <td className="px-4 py-2 text-right">{formatNumber(b.interest_rate, 2)}%</td>
                    <td className="px-4 py-2 text-right">{formatDate(b.maturity_date)}</td>
                    <td className="px-4 py-2 text-right font-medium text-emerald-700 dark:text-emerald-400">
                      {formatMoney(b.accrued_interest, b.currency)}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">{formatMoney(b.current_value, b.currency)}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatMoney(b.projected_total, b.currency)}</td>
                    <td className="px-4 py-2 text-right">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          b.status === 'active' ? 'bg-accent-100 dark:bg-accent-900/50 text-accent-700 dark:text-accent-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {b.status === 'active' ? t('aktywna') : t('wykupiona')}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setEditingBondId(editingBondId === b.id ? null : b.id)}
                          className="text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline"
                        >
                          {t('Edytuj')}
                        </button>
                        {b.status === 'active' && (
                          <button
                            onClick={() => setRedeemingBondId(redeemingBondId === b.id ? null : b.id)}
                            className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                          >
                            {t('Wykup wcześniej')}
                          </button>
                        )}
                        {b.status === 'redeemed' && (
                          <button
                            onClick={() => {
                              if (window.confirm(t('Czy na pewno chcesz usunąć tę obligację?'))) {
                                deleteBond.mutate(b.id)
                              }
                            }}
                            disabled={deleteBond.isPending}
                            className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                          >
                            {t('Usuń')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {editingBondId === b.id && (
                    <tr>
                      <td colSpan={9} className="bg-slate-50 dark:bg-slate-900 px-4 py-3">
                        <EditBondForm
                          bond={b}
                          accounts={accounts ?? []}
                          onDone={() => {
                            setEditingBondId(null)
                            invalidateAccountsRelated()
                          }}
                          onCancel={() => setEditingBondId(null)}
                        />
                      </td>
                    </tr>
                  )}
                  {redeemingBondId === b.id && (
                    <tr>
                      <td colSpan={9} className="bg-slate-50 dark:bg-slate-900 px-4 py-3">
                        <RedeemBondForm
                          bond={b}
                          accounts={accounts ?? []}
                          onDone={() => {
                            setRedeemingBondId(null)
                            invalidateAccountsRelated()
                          }}
                          onCancel={() => setRedeemingBondId(null)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {bonds?.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                    {t('Brak obligacji.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function AccountForm({
  account,
  onDone,
  onCancel,
}: {
  account?: BankAccount
  onDone: () => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const isEditing = Boolean(account)
  const [bankName, setBankName] = useState(account?.bank_name ?? '')
  const [name, setName] = useState(account?.name ?? '')
  const [accountType, setAccountType] = useState<BankAccountType>(account?.account_type ?? 'checking')
  const [currency, setCurrency] = useState<Currency>(account?.currency ?? 'PLN')
  const [balance, setBalance] = useState(account?.current_balance ?? '')

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        bank_name: bankName,
        name,
        account_type: accountType,
        currency,
        current_balance: balance,
      }
      return isEditing
        ? api.patch(`/banking/accounts/${account!.id}/`, payload)
        : api.post('/banking/accounts/', payload)
    },
    onSuccess: onDone,
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm sm:grid-cols-5">
      <Field label="Bank">
        <BankNameAutocomplete value={bankName} onChange={setBankName} required />
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
      <Field label="Saldo">
        <input type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} required className="input" />
      </Field>
      <div className="col-span-2 flex items-end gap-2 sm:col-span-5">
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {isEditing ? t('Zapisz zmiany') : t('Dodaj konto')}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {t('Anuluj')}
          </button>
        )}
      </div>
    </form>
  )
}

function TransferForm({
  accounts,
  onDone,
  onCancel,
}: {
  accounts: BankAccount[]
  onDone: () => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const [fromAccount, setFromAccount] = useState<number | ''>(accounts[0]?.id ?? '')
  const [toAccount, setToAccount] = useState<number | ''>(accounts[1]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/banking/transfers/', {
        from_account: fromAccount,
        to_account: toAccount,
        amount,
        date,
        note,
      }),
    onSuccess: onDone,
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: unknown } }).response?.data
      if (data && typeof data === 'object') {
        const messages = Object.values(data as Record<string, unknown>).flat()
        setError(messages.join(' '))
      } else {
        setError(t('Nie udało się wykonać przelewu.'))
      }
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!fromAccount || !toAccount) return
    if (fromAccount === toAccount) {
      setError(t('Konto źródłowe i docelowe muszą być różne.'))
      return
    }
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm sm:grid-cols-5">
      <Field label="Z konta">
        <select value={fromAccount} onChange={(e) => setFromAccount(Number(e.target.value))} required className="input">
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.bank_name} — {a.name} ({a.currency})
            </option>
          ))}
        </select>
      </Field>
      <Field label="Na konto">
        <select value={toAccount} onChange={(e) => setToAccount(Number(e.target.value))} required className="input">
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.bank_name} — {a.name} ({a.currency})
            </option>
          ))}
        </select>
      </Field>
      <Field label="Kwota">
        <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="input" />
      </Field>
      <Field label="Data">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="input" />
      </Field>
      <Field label="Notatka">
        <input value={note} onChange={(e) => setNote(e.target.value)} className="input" />
      </Field>
      {error && <p className="col-span-2 text-sm text-red-600 dark:text-red-400 sm:col-span-5">{error}</p>}
      <div className="col-span-2 flex items-end gap-2 sm:col-span-5">
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {t('Wykonaj przelew')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 dark:border-slate-600 px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          {t('Anuluj')}
        </button>
      </div>
    </form>
  )
}

function AddDepositForm({ accounts, onDone }: { accounts: BankAccount[]; onDone: () => void }) {
  const { t } = useLanguage()
  const [bankName, setBankName] = useState('')
  const [account, setAccount] = useState<number | ''>('')
  const [alreadyOwned, setAlreadyOwned] = useState(false)
  const [principal, setPrincipal] = useState('')
  const [currency, setCurrency] = useState<Currency>('PLN')
  const [rate, setRate] = useState('')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState('')
  const [capitalization, setCapitalization] = useState<'end' | 'monthly'>('end')

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
        capitalization,
        status: 'active',
      }),
    onSuccess: onDone,
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm sm:grid-cols-4">
      <Field label="Bank">
        <BankNameAutocomplete value={bankName} onChange={setBankName} required />
      </Field>
      <Field label="Środki z konta">
        <select value={account} onChange={(e) => setAccount(e.target.value ? Number(e.target.value) : '')} className="input">
          <option value="">{t('bez powiązania')}</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.bank_name} — {a.name} ({a.currency})
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
      <Field label="Data rozpoczęcia">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="input" />
      </Field>
      <Field label="Data zakończenia">
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="input" />
      </Field>
      <Field label="Kapitalizacja">
        <select value={capitalization} onChange={(e) => setCapitalization(e.target.value as 'end' | 'monthly')} className="input">
          <option value="end">{t('Na koniec okresu')}</option>
          <option value="monthly">{t('Miesięczna')}</option>
        </select>
      </Field>
      <div className="flex items-end">
        <button type="submit" className="btn-primary w-full" disabled={mutation.isPending}>
          {t('Dodaj lokatę')}
        </button>
      </div>
      {account ? (
        <label className="col-span-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 sm:col-span-4">
          <input type="checkbox" checked={alreadyOwned} onChange={(e) => setAlreadyOwned(e.target.checked)} />
          {t('To lokata, którą już posiadam — nie odejmuj środków z konta (tylko zapisz powiązanie).')}
        </label>
      ) : (
        <p className="col-span-2 text-xs text-slate-400 dark:text-slate-500 sm:col-span-4">
          {t('Jeśli wybierzesz konto, kwota lokaty zostanie od razu odjęta z jego salda.')}
        </p>
      )}
    </form>
  )
}

function EditDepositForm({
  deposit,
  accounts,
  onDone,
  onCancel,
}: {
  deposit: TermDeposit
  accounts: BankAccount[]
  onDone: () => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const [bankName, setBankName] = useState(deposit.bank_name)
  const [account, setAccount] = useState<number | ''>(deposit.account ?? '')
  const [principal, setPrincipal] = useState(deposit.principal)
  const [currency, setCurrency] = useState<Currency>(deposit.currency)
  const [rate, setRate] = useState(deposit.interest_rate)
  const [startDate, setStartDate] = useState(deposit.start_date)
  const [endDate, setEndDate] = useState(deposit.end_date)
  const [capitalization, setCapitalization] = useState(deposit.capitalization)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/banking/deposits/${deposit.id}/`, {
        bank_name: bankName,
        account: account || null,
        principal,
        currency,
        interest_rate: rate,
        start_date: startDate,
        end_date: endDate,
        capitalization,
      }),
    onSuccess: onDone,
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: unknown } }).response?.data
      if (data && typeof data === 'object') {
        setError(Object.values(data as Record<string, unknown>).flat().join(' '))
      } else {
        setError(t('Nie udało się zapisać zmian.'))
      }
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 rounded-xl border border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-900/20 p-4 sm:grid-cols-4">
      <Field label="Bank">
        <BankNameAutocomplete value={bankName} onChange={setBankName} required />
      </Field>
      <Field label="Środki z konta">
        <select value={account} onChange={(e) => setAccount(e.target.value ? Number(e.target.value) : '')} className="input">
          <option value="">{t('bez powiązania')}</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.bank_name} — {a.name} ({a.currency})
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
      <Field label="Data rozpoczęcia">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="input" />
      </Field>
      <Field label="Data zakończenia">
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="input" />
      </Field>
      <Field label="Kapitalizacja">
        <select value={capitalization} onChange={(e) => setCapitalization(e.target.value as 'end' | 'monthly')} className="input">
          <option value="end">{t('Na koniec okresu')}</option>
          <option value="monthly">{t('Miesięczna')}</option>
        </select>
      </Field>
      {error && <p className="col-span-2 text-sm text-red-600 dark:text-red-400 sm:col-span-4">{error}</p>}
      <div className="flex items-end gap-2">
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {t('Zapisz zmiany')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 dark:border-slate-600 px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          {t('Anuluj')}
        </button>
      </div>
    </form>
  )
}

function BreakDepositForm({
  deposit,
  accounts,
  onDone,
  onCancel,
}: {
  deposit: TermDeposit
  accounts: BankAccount[]
  onDone: () => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const eligibleAccounts = accounts.filter((a) => a.currency === deposit.currency)
  const [toAccount, setToAccount] = useState<number | ''>(deposit.account ?? eligibleAccounts[0]?.id ?? '')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => api.post(`/banking/deposits/${deposit.id}/break_early/`, { to_account: toAccount || undefined }),
    onSuccess: onDone,
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      setError(detail ?? t('Nie udało się zerwać lokaty.'))
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!toAccount) {
      setError(t('Wybierz konto, na które mają wrócić środki.'))
      return
    }
    if (
      !window.confirm(
        t(
          'Zerwać lokatę i przelać {0} odsetek + kapitał na wybrane konto?',
          formatMoney(deposit.accrued_interest, deposit.currency),
        ),
      )
    ) {
      return
    }
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <div className="text-sm text-slate-600 dark:text-slate-400">
        {t('Wypłata: kapitał')} {formatMoney(deposit.principal, deposit.currency)} + {t('odsetki')}{' '}
        <span className="font-medium text-emerald-700 dark:text-emerald-400">{formatMoney(deposit.accrued_interest, deposit.currency)}</span>{' '}
        ({t('bez prowizji')})
      </div>
      <Field label="Konto docelowe">
        <select
          value={toAccount}
          onChange={(e) => setToAccount(e.target.value ? Number(e.target.value) : '')}
          className="input"
        >
          <option value="">{t('wybierz…')}</option>
          {eligibleAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.bank_name} — {a.name} ({a.currency})
            </option>
          ))}
        </select>
      </Field>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button type="submit" className="rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700" disabled={mutation.isPending}>
        {t('Potwierdź zerwanie')}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md border border-slate-300 dark:border-slate-600 px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        {t('Anuluj')}
      </button>
    </form>
  )
}

function AddBondForm({ accounts, onDone }: { accounts: BankAccount[]; onDone: () => void }) {
  const { t } = useLanguage()
  const [bondType, setBondType] = useState<BondType>('EDO')
  const [series, setSeries] = useState('')
  const [account, setAccount] = useState<number | ''>('')
  const [alreadyOwned, setAlreadyOwned] = useState(false)
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
    onSuccess: onDone,
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
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
      <Field label="Środki z konta">
        <select value={account} onChange={(e) => setAccount(e.target.value ? Number(e.target.value) : '')} className="input">
          <option value="">{t('bez powiązania')}</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.bank_name} — {a.name} ({a.currency})
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
          {t('Dodaj obligację')}
        </button>
      </div>
      {account && (
        <label className="col-span-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 sm:col-span-4">
          <input type="checkbox" checked={alreadyOwned} onChange={(e) => setAlreadyOwned(e.target.checked)} />
          {t('To obligacja, którą już posiadam — nie odejmuj środków z konta (tylko zapisz powiązanie).')}
        </label>
      )}
    </form>
  )
}

function EditBondForm({
  bond,
  accounts,
  onDone,
  onCancel,
}: {
  bond: TreasuryBond
  accounts: BankAccount[]
  onDone: () => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const [bondType, setBondType] = useState<BondType>(bond.bond_type)
  const [series, setSeries] = useState(bond.series)
  const [account, setAccount] = useState<number | ''>(bond.account ?? '')
  const [nominalValue, setNominalValue] = useState(bond.nominal_value)
  const [currency, setCurrency] = useState<Currency>(bond.currency)
  const [rate, setRate] = useState(bond.interest_rate)
  const [purchaseDate, setPurchaseDate] = useState(bond.purchase_date)
  const [maturityDate, setMaturityDate] = useState(bond.maturity_date)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/bonds/${bond.id}/`, {
        bond_type: bondType,
        series,
        account: account || null,
        nominal_value: nominalValue,
        currency,
        interest_rate: rate,
        purchase_date: purchaseDate,
        maturity_date: maturityDate,
      }),
    onSuccess: onDone,
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: unknown } }).response?.data
      if (data && typeof data === 'object') {
        setError(Object.values(data as Record<string, unknown>).flat().join(' '))
      } else {
        setError(t('Nie udało się zapisać zmian.'))
      }
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 rounded-xl border border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-900/20 p-4 sm:grid-cols-4">
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
      <Field label="Środki z konta">
        <select value={account} onChange={(e) => setAccount(e.target.value ? Number(e.target.value) : '')} className="input">
          <option value="">{t('bez powiązania')}</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.bank_name} — {a.name} ({a.currency})
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
      {error && <p className="col-span-2 text-sm text-red-600 dark:text-red-400 sm:col-span-4">{error}</p>}
      <div className="flex items-end gap-2">
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {t('Zapisz zmiany')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 dark:border-slate-600 px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          {t('Anuluj')}
        </button>
      </div>
    </form>
  )
}

function RedeemBondForm({
  bond,
  accounts,
  onDone,
  onCancel,
}: {
  bond: TreasuryBond
  accounts: BankAccount[]
  onDone: () => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const eligibleAccounts = accounts.filter((a) => a.currency === bond.currency)
  const [toAccount, setToAccount] = useState<number | ''>(bond.account ?? eligibleAccounts[0]?.id ?? '')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => api.post(`/bonds/${bond.id}/redeem_early/`, { to_account: toAccount || undefined }),
    onSuccess: onDone,
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      setError(detail ?? t('Nie udało się wykupić obligacji.'))
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!toAccount) {
      setError(t('Wybierz konto, na które mają wrócić środki.'))
      return
    }
    if (
      !window.confirm(
        t(
          'Wykupić obligację wcześniej i przelać {0} odsetek + kapitał na wybrane konto?',
          formatMoney(bond.accrued_interest, bond.currency),
        ),
      )
    ) {
      return
    }
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <div className="text-sm text-slate-600 dark:text-slate-400">
        {t('Wypłata: kapitał')} {formatMoney(bond.nominal_value, bond.currency)} + {t('odsetki')}{' '}
        <span className="font-medium text-emerald-700 dark:text-emerald-400">{formatMoney(bond.accrued_interest, bond.currency)}</span>{' '}
        ({t('bez prowizji')})
      </div>
      <Field label="Konto docelowe">
        <select
          value={toAccount}
          onChange={(e) => setToAccount(e.target.value ? Number(e.target.value) : '')}
          className="input"
        >
          <option value="">{t('wybierz…')}</option>
          {eligibleAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.bank_name} — {a.name} ({a.currency})
            </option>
          ))}
        </select>
      </Field>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button type="submit" className="rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700" disabled={mutation.isPending}>
        {t('Potwierdź wykup')}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md border border-slate-300 dark:border-slate-600 px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        {t('Anuluj')}
      </button>
    </form>
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  )
}
