import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts'
import { api } from '../api/client'
import { AmountInput } from './AmountInput'
import { useLanguage } from '../i18n/LanguageContext'
import { useTooltipStyle } from '../lib/chartTooltip'
import { formatDate, formatMoney, formatNumber } from '../lib/format'
import type { Currency, MoneyThread, StockTransaction, ThreadEdgeOrigin, ThreadNode } from '../types'

const EPS = 0.005

function txCost(t: StockTransaction): number {
  return Number(t.quantity) * Number(t.price_per_share) + Number(t.fee)
}

interface SankeyNodeDatum {
  name: string
}
interface SankeyLinkDatum {
  source: number
  target: number
  value: number
}

function buildSankeyData(
  thread: MoneyThread,
  t: (text: string, ...args: Array<string | number>) => string,
): { nodes: SankeyNodeDatum[]; links: SankeyLinkDatum[] } {
  const nodes: SankeyNodeDatum[] = []
  const links: SankeyLinkDatum[] = []

  function addNode(name: string): number {
    nodes.push({ name })
    return nodes.length - 1
  }

  const startIdx = addNode(`${t('Start')} · ${formatMoney(thread.starting_amount, thread.currency)}`)
  let cashIdx: number | null = null
  const buyIdxByNode = new Map<number, number>()
  const sellIdxByNode = new Map<number, number>()

  thread.nodes.forEach((node) => {
    const ticker = node.buy_transaction_detail.stock_detail.ticker
    buyIdxByNode.set(node.id, addNode(`${ticker} · ${formatMoney(node.amount_in, thread.currency)}`))
  })

  thread.nodes.forEach((node) => {
    if (node.sell_transaction_detail && node.realized_amount) {
      const ticker = node.buy_transaction_detail.stock_detail.ticker
      const buyIdx = buyIdxByNode.get(node.id)!
      const sellIdx = addNode(`${t('Sprzedaż')} ${ticker} · ${formatMoney(node.realized_amount, thread.currency)}`)
      links.push({ source: buyIdx, target: sellIdx, value: Math.max(Number(node.realized_amount), 0.01) })
      sellIdxByNode.set(node.id, sellIdx)
    }
  })

  thread.nodes.forEach((node) => {
    const buyIdx = buyIdxByNode.get(node.id)!
    node.incoming_edges.forEach((edge) => {
      const value = Math.max(Number(edge.amount), 0.01)
      if (edge.origin === 'root') {
        links.push({ source: startIdx, target: buyIdx, value })
      } else if (edge.origin === 'cash') {
        if (cashIdx === null) cashIdx = addNode(t('Dodatkowa gotówka'))
        links.push({ source: cashIdx, target: buyIdx, value })
      } else if (edge.origin === 'node' && edge.source_node !== null) {
        const sourceSellIdx = sellIdxByNode.get(edge.source_node)
        if (sourceSellIdx !== undefined) {
          links.push({ source: sourceSellIdx, target: buyIdx, value })
        }
      }
    })
  })

  thread.nodes.forEach((node) => {
    const buyIdx = buyIdxByNode.get(node.id)!
    if (node.sell_transaction_detail && node.realized_amount) {
      const sellIdx = sellIdxByNode.get(node.id)!
      const leftover = Number(node.leftover)
      if (leftover > EPS) {
        const leftoverIdx = addNode(`${t('Niezainwestowane')} · ${formatMoney(node.leftover, thread.currency)}`)
        links.push({ source: sellIdx, target: leftoverIdx, value: leftover })
      }
    } else {
      const value = node.current_value ?? node.amount_in
      const currentIdx = addNode(`${t('Obecna wartość')} · ${formatMoney(value, thread.currency)}`)
      links.push({ source: buyIdx, target: currentIdx, value: Math.max(Number(value), 0.01) })
    }
  })

  const rootLeftover = Number(thread.root_leftover)
  if (rootLeftover > EPS) {
    const leftoverIdx = addNode(`${t('Niezainwestowany kapitał')} · ${formatMoney(thread.root_leftover, thread.currency)}`)
    links.push({ source: startIdx, target: leftoverIdx, value: rootLeftover })
  }

  return { nodes, links }
}

function SankeyNodeShape({ x, y, width, height, payload }: any) {
  const [label, amount] = String(payload.name).split(' · ')
  return (
    <g>
      <rect x={x} y={y} width={width} height={Math.max(height, 3)} fill="#059669" fillOpacity={0.85} rx={2} />
      <text x={x + width / 2} y={y - 20} textAnchor="middle" fontSize={11} fontWeight={600} fill="#0f172a">
        {label}
      </text>
      {amount && (
        <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={11} fill="#059669">
          {amount}
        </text>
      )}
    </g>
  )
}

function ThreadSankey({ thread }: { thread: MoneyThread }) {
  const { t } = useLanguage()
  const tooltipStyle = useTooltipStyle()
  const { nodes, links } = buildSankeyData(thread, t)
  if (links.length === 0) return null

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={{ nodes, links }}
          nodeWidth={14}
          nodePadding={40}
          margin={{ top: 40, right: 70, bottom: 10, left: 20 }}
          node={SankeyNodeShape}
          link={{ stroke: '#059669', strokeOpacity: 0.25, fill: '#059669', fillOpacity: 0.2 }}
        >
          <Tooltip {...tooltipStyle} formatter={(value) => formatMoney(value as number, thread.currency)} />
        </Sankey>
      </ResponsiveContainer>
    </div>
  )
}

export default function ReinvestmentThreads() {
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const [showCreate, setShowCreate] = useState(false)

  const { data: threads } = useQuery({
    queryKey: ['threads'],
    queryFn: async () => (await api.get<MoneyThread[]>('/threads/')).data,
  })

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => (await api.get<StockTransaction[]>('/stocks/transactions/')).data,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['threads'] })
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    queryClient.invalidateQueries({ queryKey: ['holdings'] })
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Ścieżki reinwestycji')}</h2>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-700"
        >
          {t('+ Nowa ścieżka')}
        </button>
      </div>
      <p className="mb-4 text-xs text-slate-400 dark:text-slate-500">
        {t(
          'Śledź, do ilu pomnożyła się konkretna kwota — np. zysk ze sprzedaży jednej spółki rozdzielony na kilka kolejnych zakupów, z opcjonalną dodatkową gotówką i niezainwestowaną resztą.',
        )}
      </p>

      {showCreate && (
        <div className="mb-4">
          <CreateThreadForm
            onDone={() => {
              setShowCreate(false)
              invalidate()
            }}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      <div className="space-y-4">
        {(threads ?? []).map((thread) => (
          <ThreadCard key={thread.id} thread={thread} transactions={transactions ?? []} onChange={invalidate} />
        ))}
        {threads?.length === 0 && <p className="text-slate-400 dark:text-slate-500">{t('Brak ścieżek — utwórz pierwszą.')}</p>}
      </div>
    </div>
  )
}

function ThreadCard({
  thread,
  transactions,
  onChange,
}: {
  thread: MoneyThread
  transactions: StockTransaction[]
  onChange: () => void
}) {
  const { t } = useLanguage()
  const multiplier = thread.multiplier_pct !== null ? Number(thread.multiplier_pct) / 100 : null
  const openNodes = thread.nodes.filter((n) => n.sell_transaction === null)

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/threads/${thread.id}/`),
    onSuccess: onChange,
  })

  function handleDelete() {
    if (window.confirm(t('Usunąć całą ścieżkę „{0}”? Tej operacji nie można cofnąć.', thread.name))) {
      deleteMutation.mutate()
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-200">{thread.name}</p>
          {thread.source_description && <p className="text-xs text-slate-400 dark:text-slate-500">{thread.source_description}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('Start:')} {formatMoney(thread.starting_amount, thread.currency)} ({formatDate(thread.start_date)})
            </p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
              {formatMoney(thread.current_value, thread.currency)}{' '}
              {multiplier !== null && (
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">(x{multiplier.toFixed(2)})</span>
              )}
            </p>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            title={t('Usuń ścieżkę')}
            className="rounded-md border border-red-200 dark:border-red-900 px-2 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
          >
            {t('Usuń')}
          </button>
        </div>
      </div>

      {thread.nodes.length > 0 && (
        <div className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-3">
          <ThreadSankey thread={thread} />
        </div>
      )}

      {thread.nodes.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
          {thread.nodes.map((node) => (
            <NodeRow key={node.id} thread={thread} node={node} transactions={transactions} onChange={onChange} />
          ))}
        </div>
      )}

      <div className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-3">
        <AddNodeForm thread={thread} transactions={transactions} onDone={onChange} />
      </div>

      {Number(thread.root_leftover) > EPS && (
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          {t('Niezainwestowany kapitał początkowy:')} {formatMoney(thread.root_leftover, thread.currency)}
        </p>
      )}
      {openNodes.length === 0 && thread.nodes.length === 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500">{t('Brak jeszcze żadnej pozycji w tej ścieżce.')}</p>
      )}
    </div>
  )
}

function NodeRow({
  thread,
  node,
  transactions,
  onChange,
}: {
  thread: MoneyThread
  node: ThreadNode
  transactions: StockTransaction[]
  onChange: () => void
}) {
  const { t } = useLanguage()
  const ticker = node.buy_transaction_detail.stock_detail.ticker
  const isOpen = node.sell_transaction === null
  const leftover = Number(node.leftover)
  const [closing, setClosing] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/threads/nodes/${node.id}/`),
    onSuccess: onChange,
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: unknown } }).response?.data
      const message =
        data && typeof data === 'object' ? Object.values(data as Record<string, unknown>).flat().join(' ') : null
      window.alert(message || t('Nie udało się usunąć pozycji.'))
    },
  })

  function handleDelete() {
    if (window.confirm(t('Usunąć pozycję {0} z tej ścieżki?', ticker))) {
      deleteMutation.mutate()
    }
  }

  return (
    <div className="rounded-md bg-slate-50 dark:bg-slate-900 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">{ticker}</span>{' '}
          <span className="text-slate-400 dark:text-slate-500">· {t('wpłynęło')} {formatMoney(node.amount_in, thread.currency)}</span>
          {!isOpen && (
            <span className="text-slate-400 dark:text-slate-500">
              {' '}
              · {t('sprzedano za')} {formatMoney(node.realized_amount ?? '0', thread.currency)}
              {leftover > EPS && <> · {t('niezainwestowane')} {formatMoney(node.leftover, thread.currency)}</>}
            </span>
          )}
          {isOpen && (
            <span className="text-slate-400 dark:text-slate-500">
              {' '}
              · {t('obecna wartość')} {node.current_value ? formatMoney(node.current_value, thread.currency) : '—'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isOpen && !closing && (
            <button onClick={() => setClosing(true)} className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline">
              {t('Zamknij (sprzedano)')}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="text-xs font-medium text-slate-400 hover:text-red-600 dark:hover:text-red-400"
          >
            {t('Usuń')}
          </button>
        </div>
      </div>
      {closing && (
        <div className="mt-2">
          <CloseNodeForm
            thread={thread}
            node={node}
            transactions={transactions}
            onDone={() => {
              setClosing(false)
              onChange()
            }}
            onCancel={() => setClosing(false)}
          />
        </div>
      )}
    </div>
  )
}

function CreateThreadForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [startingAmount, setStartingAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('PLN')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [sourceDescription, setSourceDescription] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/threads/', {
        name,
        starting_amount: startingAmount,
        currency,
        start_date: startDate,
        source_description: sourceDescription,
      }),
    onSuccess: onDone,
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 sm:grid-cols-5">
      <Field label="Nazwa ścieżki">
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="np. Zysk z CDR" className="input" />
      </Field>
      <Field label="Kwota początkowa">
        <AmountInput value={startingAmount} onChange={setStartingAmount} required className="input" />
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
      <Field label="Data startu">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="input" />
      </Field>
      <Field label="Opis (opcjonalnie)">
        <input value={sourceDescription} onChange={(e) => setSourceDescription(e.target.value)} className="input" />
      </Field>
      <div className="col-span-2 flex items-end gap-2 sm:col-span-5">
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {t('Utwórz ścieżkę')}
        </button>
        <button type="button" onClick={onCancel} className="rounded-md border border-slate-300 dark:border-slate-600 px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
          {t('Anuluj')}
        </button>
      </div>
    </form>
  )
}

interface FundingSource {
  key: string
  label: string
  origin: ThreadEdgeOrigin
  sourceNode: number | null
  available: number | null
}

function AddNodeForm({
  thread,
  transactions,
  onDone,
}: {
  thread: MoneyThread
  transactions: StockTransaction[]
  onDone: () => void
}) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(thread.nodes.length === 0)
  const usedTxIds = new Set(thread.nodes.map((n) => n.buy_transaction))
  const eligibleBuys = transactions.filter(
    (t) => t.type === 'BUY' && t.currency === thread.currency && !usedTxIds.has(t.id),
  )
  const [buyTransaction, setBuyTransaction] = useState<number | ''>('')
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const sources: FundingSource[] = []
  if (Number(thread.root_leftover) > EPS) {
    sources.push({
      key: 'root',
      label: t('Kapitał początkowy ścieżki (dostępne: {0})', formatMoney(thread.root_leftover, thread.currency)),
      origin: 'root',
      sourceNode: null,
      available: Number(thread.root_leftover),
    })
  }
  thread.nodes
    .filter((n) => n.sell_transaction !== null && Number(n.leftover) > EPS)
    .forEach((n) => {
      sources.push({
        key: `node:${n.id}`,
        label: t(
          'Ze sprzedaży {0} (dostępne: {1})',
          n.buy_transaction_detail.stock_detail.ticker,
          formatMoney(n.leftover, thread.currency),
        ),
        origin: 'node',
        sourceNode: n.id,
        available: Number(n.leftover),
      })
    })
  sources.push({ key: 'cash', label: t('Dodatkowa gotówka (spoza ścieżki)'), origin: 'cash', sourceNode: null, available: null })

  const selectedBuyTx = transactions.find((t) => t.id === buyTransaction)
  const cost = selectedBuyTx ? txCost(selectedBuyTx) : null
  const total = sources.reduce((sum, s) => sum + (Number(amounts[s.key]) || 0), 0)

  const mutation = useMutation({
    mutationFn: () => {
      const funding = sources
        .map((s) => ({ origin: s.origin, source_node: s.sourceNode, amount: amounts[s.key] }))
        .filter((f) => f.amount && Number(f.amount) > 0)
      return api.post('/threads/nodes/', { thread: thread.id, buy_transaction: buyTransaction, funding })
    },
    onSuccess: () => {
      setOpen(false)
      setBuyTransaction('')
      setAmounts({})
      onDone()
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
    if (!buyTransaction) return
    if (total <= 0) {
      setError(t('Wskaż co najmniej jedno źródło finansowania z kwotą większą od zera.'))
      return
    }
    mutation.mutate()
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline">
        {t('+ Dodaj pozycję (reinwestycja)')}
      </button>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field label="Transakcja kupna">
        <select value={buyTransaction} onChange={(e) => setBuyTransaction(Number(e.target.value))} required className="input">
          <option value="">{t('wybierz…')}</option>
          {eligibleBuys.map((tx) => (
            <option key={tx.id} value={tx.id}>
              {tx.stock_detail.ticker} — {formatNumber(tx.quantity, 4)}x @ {tx.price_per_share} ({formatDate(tx.executed_at)}) · {t('koszt')}{' '}
              {formatMoney(txCost(tx), tx.currency)}
            </option>
          ))}
        </select>
      </Field>

      <div>
        <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{t('Źródła finansowania')}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sources.map((s) => (
            <Field key={s.key} label={s.label}>
              <AmountInput
                min="0"
                value={amounts[s.key] ?? ''}
                onChange={(value) => setAmounts((prev) => ({ ...prev, [s.key]: value }))}
                className="input"
                placeholder="0.00"
              />
            </Field>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t('Suma finansowania:')} {formatMoney(total.toFixed(2), thread.currency)}
        {cost !== null && <> / {t('koszt zakupu:')} {formatMoney(cost.toFixed(2), thread.currency)}</>}
      </p>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex items-center gap-2">
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {t('Zapisz pozycję')}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-slate-300 dark:border-slate-600 px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          {t('Anuluj')}
        </button>
      </div>
    </form>
  )
}

function CloseNodeForm({
  thread,
  node,
  transactions,
  onDone,
  onCancel,
}: {
  thread: MoneyThread
  node: ThreadNode
  transactions: StockTransaction[]
  onDone: () => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const eligibleSells = transactions.filter(
    (tx) => tx.type === 'SELL' && tx.currency === thread.currency && tx.stock === node.buy_transaction_detail.stock,
  )
  const [sellTransaction, setSellTransaction] = useState<number | ''>('')
  const [realizedAmount, setRealizedAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/threads/nodes/${node.id}/close/`, {
        sell_transaction: sellTransaction,
        ...(realizedAmount ? { realized_amount: realizedAmount } : {}),
      }),
    onSuccess: onDone,
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: unknown } }).response?.data
      if (data && typeof data === 'object') {
        setError(Object.values(data as Record<string, unknown>).flat().join(' '))
      } else {
        setError(t('Nie udało się zamknąć pozycji.'))
      }
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!sellTransaction) return
    mutation.mutate()
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Field label="Transakcja sprzedaży">
        <select value={sellTransaction} onChange={(e) => setSellTransaction(Number(e.target.value))} required className="input">
          <option value="">{t('wybierz…')}</option>
          {eligibleSells.map((tx) => (
            <option key={tx.id} value={tx.id}>
              {formatNumber(tx.quantity, 4)}x @ {tx.price_per_share} ({formatDate(tx.executed_at)})
            </option>
          ))}
        </select>
      </Field>
      <Field label="Kwota zrealizowana (opcjonalnie)">
        <AmountInput
          value={realizedAmount}
          onChange={setRealizedAmount}
          placeholder={t('auto: proporcjonalnie')}
          className="input"
        />
      </Field>
      {eligibleSells.length === 0 && (
        <p className="col-span-2 text-xs text-amber-600 dark:text-amber-400 sm:col-span-4">
          {t('Brak jeszcze transakcji sprzedaży tej spółki — dodaj ją najpierw w portfelu.')}
        </p>
      )}
      {error && <p className="col-span-2 text-sm text-red-600 dark:text-red-400 sm:col-span-4">{error}</p>}
      <div className="flex items-end gap-2">
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {t('Zamknij pozycję')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          {t('Anuluj')}
        </button>
      </div>
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
