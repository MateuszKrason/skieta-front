export type Market = 'GPW' | 'US'
export type Currency = 'PLN' | 'USD' | 'EUR' | 'NOK' | 'DKK' | 'GBP'

export interface Stock {
  id: number
  ticker: string
  market: Market
  name: string
  currency: Currency
  display_order: number
}

export interface StockSearchResult {
  symbol: string
  name: string
  exchange: string
  market: Market
  currency: Currency
}

export interface StockTransaction {
  id: number
  stock: number
  stock_detail: Stock
  account: number | null
  account_detail: BankAccount | null
  affects_balance: boolean
  type: 'BUY' | 'SELL'
  quantity: string
  price_per_share: string
  fee: string
  currency: Currency
  executed_at: string
  notes: string
}

export interface Holding {
  stock: Stock
  quantity: string
  avg_cost: string
  cost_basis: string
  current_price: string | null
  price_fetched_at: string | null
  market_value: string | null
  unrealized_pl: string | null
  unrealized_pl_pct: string | null
  unrealized_pl_after_tax: string | null
  unrealized_pl_after_tax_pct: string | null
}

export interface PortfolioSummary {
  total_value: string
  total_cost_basis: string
  total_unrealized_pl: string
  total_unrealized_pl_pct: string | null
  total_unrealized_pl_after_tax: string
  total_unrealized_pl_after_tax_pct: string | null
}

export type BankAccountType = 'checking' | 'savings' | 'brokerage' | 'business' | 'ike' | 'ikze' | 'crypto'

export interface BankAccount {
  id: number
  bank_name: string
  name: string
  account_type: BankAccountType
  currency: Currency
  current_balance: string
  display_order: number
  created_at: string
}

export interface AccountTransfer {
  id: number
  from_account: number
  from_account_detail: BankAccount
  to_account: number
  to_account_detail: BankAccount
  amount: string
  date: string
  note: string
  created_at: string
}

export interface TermDeposit {
  id: number
  account: number | null
  account_detail: BankAccount | null
  affects_balance: boolean
  bank_name: string
  principal: string
  currency: Currency
  interest_rate: string
  start_date: string
  end_date: string
  capitalization: 'end' | 'monthly'
  status: 'active' | 'closed'
  closed_at: string | null
  accrued_interest: string
  projected_interest_at_maturity: string
  projected_total: string
  created_at: string
}

export type BondType = 'OTS' | 'ROR' | 'DOR' | 'TOS' | 'COI' | 'EDO' | 'ROS' | 'ROD' | 'OTHER'

export interface TreasuryBond {
  id: number
  account: number | null
  account_detail: BankAccount | null
  affects_balance: boolean
  bond_type: BondType
  series: string
  nominal_value: string
  currency: Currency
  interest_rate: string
  purchase_date: string
  maturity_date: string
  status: 'active' | 'redeemed'
  closed_at: string | null
  accrued_interest: string
  current_value: string
  projected_interest_at_maturity: string
  projected_total: string
  created_at: string
}

export interface Dividend {
  id: number
  stock: number
  stock_detail: Stock
  amount_per_share: string
  shares_at_payment: string
  total_amount: string
  currency: Currency
  tax_withheld: string
  payment_date: string
  status: 'paid' | 'planned'
  auto_detected: boolean
  is_confirmed: boolean
}

export interface DividendSummaryRow {
  stock: Stock
  total_received: string
  last_12m_received: string
  cost_basis: string | null
  yield_on_cost_pct: string | null
}

export interface DividendSummary {
  rows: DividendSummaryRow[]
  total_all_time: string
  projected_annual_income: string
  upcoming: Dividend[]
}

export interface CashFlow {
  id: number
  amount: string
  type: 'deposit' | 'withdrawal'
  date: string
  note: string
}

export interface NetWorthSnapshot {
  date: string
  stocks_value: string
  bank_balance: string
  deposits_value: string
  bonds_value: string
  total: string
}

export interface GrowthSummary {
  current_total: string
  net_contributed: string
  growth_amount: string
  growth_pct: string | null
}

export interface PeriodReturn {
  from_date: string
  from_total: string
  change_amount: string
  change_pct: string | null
}

export type PeriodKey = '1d' | '1w' | '1m' | 'ytd' | '1y' | '5y'

export interface DashboardSummary {
  latest: NetWorthSnapshot | null
  growth: GrowthSummary
  base_currency: Currency
  period_returns: Record<PeriodKey, PeriodReturn | null>
  deposits_interest_earned: string
  bonds_interest_earned: string
}

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  profile: { base_currency: Currency; email_verified: boolean }
}

export type BudgetType = 'income' | 'expense'

export interface Category {
  id: number
  name: string
  type: BudgetType
  created_at: string
}

export interface Store {
  id: number
  name: string
  created_at: string
}

export interface Tag {
  id: number
  name: string
  created_at: string
}

export interface BudgetTransaction {
  id: number
  type: BudgetType
  category: number | null
  category_detail: Category | null
  store: number | null
  store_detail: Store | null
  tags: number[]
  tags_detail: Tag[]
  account: number | null
  account_detail: BankAccount | null
  amount: string
  currency: Currency
  date: string
  description: string
  created_at: string
}

export interface StoreBreakdownRow {
  store: Store | null
  total: string
  pct: string | null
}

export interface StoreBreakdown {
  date_from: string
  date_to: string
  total: string
  rows: StoreBreakdownRow[]
}

export interface TagBreakdownRow {
  tag: Tag | null
  total: string
  pct: string | null
}

export interface TagBreakdown {
  date_from: string
  date_to: string
  total: string
  rows: TagBreakdownRow[]
}

export interface CategoryBreakdownRow {
  type: BudgetType
  category: Category | null
  total: string
  pct: string | null
}

export interface CategoryBreakdown {
  date_from: string
  date_to: string
  income_total: string
  expense_total: string
  net: string
  rows: CategoryBreakdownRow[]
}

export interface MonthlyTrendRow {
  month: string
  income: string
  expense: string
  net: string
}

export type ThreadEdgeOrigin = 'root' | 'cash' | 'node'

export interface ThreadEdge {
  id: number
  origin: ThreadEdgeOrigin
  source_node: number | null
  source_node_ticker: string | null
  amount: string
}

export interface ThreadNode {
  id: number
  thread: number
  buy_transaction: number
  buy_transaction_detail: StockTransaction
  sell_transaction: number | null
  sell_transaction_detail: StockTransaction | null
  realized_amount: string | null
  incoming_edges: ThreadEdge[]
  amount_in: string
  current_value: string | null
  leftover: string
  created_at: string
}

export interface CompanyNews {
  id: number
  stock: number
  stock_detail: Stock
  title: string
  url: string
  source: string
  published_at: string
  fetched_at: string
  is_new: boolean
}

export interface MoneyThread {
  id: number
  name: string
  starting_amount: string
  currency: Currency
  start_date: string
  source_description: string
  notes: string
  nodes: ThreadNode[]
  current_value: string
  multiplier_pct: string | null
  is_open: boolean
  root_leftover: string
  created_at: string
}

export interface BudgetPlan {
  id: number
  monthly_salary: string
  currency: Currency
  updated_at: string
}

export interface SavingsGoal {
  id: number
  name: string
  target_amount: string
  current_amount: string
  currency: Currency
  target_date: string | null
  notes: string
  progress_pct: string | null
  created_at: string
}

export interface PlannedExpense {
  id: number
  name: string
  amount: string
  currency: Currency
  due_date: string
  is_paid: boolean
  notes: string
  created_at: string
}

export interface PlanningSummary {
  monthly_salary: string
  avg_monthly_expense: string
  free_monthly_budget: string
  current_savings: string
  total_reserved_for_goals: string
  base_currency: Currency
}
