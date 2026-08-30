import type { Language } from './i18n/LanguageContext'

export type Market = 'GPW' | 'US' | 'EU'
export type Currency = 'PLN' | 'USD' | 'EUR' | 'NOK' | 'DKK' | 'GBP' | 'SEK' | 'CHF' | 'ALL'

export type InstrumentType = 'STOCK' | 'ETF'

export interface Stock {
  id: number
  ticker: string
  market: Market
  name: string
  currency: Currency
  instrument_type: InstrumentType
  display_order: number
}

export interface StockSearchResult {
  symbol: string
  name: string
  exchange: string
  market: Market
  currency: Currency
  instrument_type: InstrumentType
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
  exchange_rate_at_purchase: string | null
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
  cost_basis_base: string | null
  market_value_base: string | null
  unrealized_pl_base: string | null
  unrealized_pl_after_tax_base: string | null
  avg_fx_rate_paid: string | null
  current_fx_rate: string | null
  price_effect_base: string | null
  fx_effect_base: string | null
}

export interface PortfolioSummary {
  total_value: string
  total_cost_basis: string
  total_unrealized_pl: string
  total_unrealized_pl_pct: string | null
  total_unrealized_pl_after_tax: string
  total_unrealized_pl_after_tax_pct: string | null
}

export interface AllocationRow {
  stock: Stock
  value_base: string
  pct: string
  unrealized_pl_after_tax_base: string | null
  unrealized_pl_pct: string | null
}

export interface MarketBreakdownRow {
  market: Market
  value_base: string
  pct: string
}

export interface CurrencyBreakdownRow {
  currency: Currency
  value_base: string
  pct: string
}

export interface RealizedPlYearRow {
  year: number
  realized_pl: string
  realized_pl_before_tax: string
  belka_tax: string
}

export interface PortfolioAnalytics {
  total_value_base: string
  allocation: AllocationRow[]
  by_market: MarketBreakdownRow[]
  by_currency: CurrencyBreakdownRow[]
  concentration_hhi: string | null
  top_holding: AllocationRow | null
  winners_count: number
  losers_count: number
  flat_count: number
  best_performer: AllocationRow | null
  worst_performer: AllocationRow | null
  avg_days_held: number | null
  realized_pl_total: string
  realized_pl_total_before_tax: string
  realized_pl_by_year: RealizedPlYearRow[]
  realized_belka_tax_this_year: string
  belka_tax_liability: string
  dividends_ytd: string
  dividends_ytd_after_tax: string
  dividends_all_time: string
  dividends_all_time_after_tax: string
  by_account: AccountBreakdownRow[]
}

export interface ClosedPosition {
  stock: Stock
  opened_at: string
  closed_at: string
  quantity: string
  avg_buy_price: string
  avg_sell_price: string | null
  cost_base: string
  proceeds_base: string
  realized_pl_base: string
  realized_pl_after_tax_base: string
  return_pct: string | null
  holding_days: number | null
}

export interface ClosedPositions {
  count: number
  total_realized_pl_after_tax_base: string
  avg_return_pct: string | null
  win_rate: string | null
  avg_holding_days: number | null
  best_position: ClosedPosition | null
  worst_position: ClosedPosition | null
  positions: ClosedPosition[]
}

export interface AccountBreakdownRow {
  account_id: number
  account_label: string
  invested_base: string
  value_base: string
  pct: string
}

export interface CryptoAsset {
  id: number
  coingecko_id: string
  symbol: string
  name: string
  display_order: number
}

export interface CryptoSearchResult {
  coingecko_id: string
  symbol: string
  name: string
}

export interface CryptoTransaction {
  id: number
  asset: number
  asset_detail: CryptoAsset
  account: number | null
  account_detail: BankAccount | null
  affects_balance: boolean
  type: 'BUY' | 'SELL'
  quantity: string
  price_per_unit: string
  fee: string
  currency: Currency
  executed_at: string
  notes: string
  exchange_rate_at_purchase: string | null
}

export interface CryptoHolding {
  asset: CryptoAsset
  quantity: string
  avg_cost_base: string
  cost_basis_base: string
  current_price_usd: string | null
  price_fetched_at: string | null
  market_value_base: string | null
  unrealized_pl_base: string | null
  unrealized_pl_pct: string | null
  unrealized_pl_after_tax_base: string | null
  unrealized_pl_after_tax_pct: string | null
}

export interface CryptoPortfolioSummary {
  total_value: string
  total_cost_basis: string
  total_unrealized_pl: string
  total_unrealized_pl_pct: string | null
  total_unrealized_pl_after_tax: string
  total_unrealized_pl_after_tax_pct: string | null
}

export interface CryptoAllocationRow {
  asset: CryptoAsset
  value_base: string
  pct: string
  unrealized_pl_after_tax_base: string | null
  unrealized_pl_pct: string | null
}

export interface CryptoPortfolioAnalytics {
  total_value_base: string
  allocation: CryptoAllocationRow[]
  by_currency: CurrencyBreakdownRow[]
  concentration_hhi: string | null
  top_holding: CryptoAllocationRow | null
  winners_count: number
  losers_count: number
  flat_count: number
  best_performer: CryptoAllocationRow | null
  worst_performer: CryptoAllocationRow | null
  avg_days_held: number | null
  realized_pl_total: string
  realized_pl_by_year: RealizedPlYearRow[]
  belka_tax_liability: string
  by_account: AccountBreakdownRow[]
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
  accrued_interest_after_tax: string
  projected_interest_at_maturity: string
  projected_interest_at_maturity_after_tax: string
  projected_total: string
  projected_total_after_tax: string
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
  accrued_interest_after_tax: string
  current_value: string
  current_value_after_tax: string
  projected_interest_at_maturity: string
  projected_interest_at_maturity_after_tax: string
  projected_total: string
  projected_total_after_tax: string
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
  after_tax_amount: string | null
}

export interface DividendSummaryRow {
  stock: Stock
  total_received: string
  total_received_after_tax: string
  last_12m_received: string
  last_12m_received_after_tax: string
  cost_basis: string | null
  yield_on_cost_pct: string | null
}

export interface DividendSummary {
  rows: DividendSummaryRow[]
  total_all_time: string
  total_all_time_after_tax: string
  projected_annual_income: string
  projected_annual_income_after_tax: string
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
  crypto_value: string
  bank_balance: string
  deposits_value: string
  bonds_value: string
  total: string
}

export interface GrowthSummary {
  current_total: string
  net_contributed: string
  growth_amount: string | null
  growth_pct: string | null
}

export interface PeriodReturnBreakdown {
  stocks_value: string
  crypto_value: string
  bank_balance: string
  deposits_value: string
  bonds_value: string
}

export interface PeriodReturn {
  from_date: string
  from_total: string
  change_amount: string
  change_pct: string | null
  breakdown: PeriodReturnBreakdown
}

export type PeriodKey = '1d' | '1w' | '1m' | 'ytd' | '1y' | '5y'

export interface DashboardSummary {
  latest: NetWorthSnapshot | null
  growth: GrowthSummary
  base_currency: Currency
  period_returns: Record<PeriodKey, PeriodReturn | null>
  deposits_interest_earned: string
  bonds_interest_earned: string
  deposits_interest_earned_after_tax: string
  bonds_interest_earned_after_tax: string
}

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
  profile: {
    base_currency: Currency
    residency_country: string
    email_verified: boolean
    login_streak: number
    color_variant: 'light' | 'dark' | 'pink'
    is_editor: boolean
    language: Language
    interest_stocks: boolean
    interest_budget: boolean
    interest_planning: boolean
    interest_analysis: boolean
    interest_crypto: boolean
    permissions: string[]
    username_changed_at: string | null
    nav_order: string[]
    has_seen_tour: boolean
    calculator_presets: { name: string; keys: string[] }[]
  }
}

export interface Invitation {
  id: number
  token: string
  email: string | null
  language: Language
  invite_url: string
  created_at: string
  accepted_by: string | null
  accepted_at: string | null
  is_expired: boolean
  expires_at: string
}

export interface InviteBatchRedemption {
  username: string
  created_at: string
}

export interface InviteBatch {
  id: number
  token: string
  invite_url: string
  label: string
  capacity: number
  used_count: number
  remaining: number
  expires_at: string
  language: Language
  is_expired: boolean
  created_by: string
  created_at: string
  redemptions: InviteBatchRedemption[]
}

export interface AdminInvitedEmail {
  id: number
  email: string
  inviter: string
  inviter_id: number
  created_at: string
  accepted_by: string | null
  accepted_at: string | null
  is_expired: boolean
}

export interface AccessRequest {
  id: number
  email: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  decided_at: string | null
  decided_by: string | null
}

export interface Permission {
  id: number
  codename: string
  label: string
  category: string
}

export interface Role {
  id: number
  name: string
  color: string
  permissions: Permission[]
  member_count: number
  created_at: string
}

export interface RoleAssignment {
  id: number
  role: Role
  status: 'pending' | 'accepted' | 'declined'
  assigned_by: string | null
  created_at: string
  decided_at: string | null
}

export interface AdminAppStats {
  invitations_sent: number
  invitations_accepted: number
  invitation_emails_sent: number
  editor_count: number
  archived_count: number
  color_variant_counts: Record<string, number>
  budget_transaction_count: number
  stock_transaction_count: number
  bank_account_count: number
  role_count: number
  avg_session_duration_seconds: number
  signups_daily: { date: string; count: number }[]
  language_visit_counts: Record<string, number>
  invitations_by_language: Record<string, number>
}

export interface LandingPromotion {
  id: number
  batch: InviteBatch
  title_pl: string
  title_en: string
  title_de: string
  title_es: string
  message_pl: string
  message_en: string
  message_de: string
  message_es: string
  countdown_ends_at: string
  is_active: boolean
  created_by: string
  created_at: string
}

// What the public landing page actually fetches — title/message already
// resolved server-side to the visitor's language (see
// ActiveLandingPromotionSerializer).
export interface ActiveLandingPromotion {
  id: number
  title: string
  message: string
  countdown_ends_at: string
  invite_url: string
}

export interface InvitationFunnelRow {
  invitation_id: number
  inviter: string
  inviter_id: number
  email: string | null
  visit_count: number
  first_visited_at: string
  last_visited_at: string
}

export interface InvitationFunnelStats {
  visited_count: number
  not_registered_count: number
  registered_count: number
  avg_visits_to_register: number
  not_registered: InvitationFunnelRow[]
}

export interface LoginHistoryEntry {
  id: number
  ip: string | null
  device: string
  created_at: string
}

export interface LoginHistoryStats {
  total_logins: number
  current_streak: number
  longest_streak: number
  peak_hour: number | null
}

export interface LoginHistoryResponse {
  results: LoginHistoryEntry[]
  stats: LoginHistoryStats
}

export interface InvitationList {
  results: Invitation[]
  weekly_limit: number
  remaining: number | null
}

export interface AdminUser {
  id: number
  username: string
  email: string
  date_joined: string
  last_login: string | null
  last_login_ip: string | null
  last_seen: string | null
  is_active: boolean
  is_staff: boolean
  is_editor: boolean
  is_archived: boolean
  email_verified: boolean
  accounts_count: number
  stock_transactions_count: number
  budget_transactions_count: number
  budget_income_count: number
  budget_expense_count: number
}

export interface AdminInvitedUser {
  username: string
  accepted_at: string
}

export interface AdminUserArticle {
  id: number
  title: string
  slug: string
  is_published: boolean
  published_at: string
}

export interface AdminUserActivityDay {
  date: string
  active: boolean
}

export interface AdminUserBudgetEntryDay {
  date: string
  income: number
  expense: number
}

export interface AdminUserDetail {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  date_joined: string
  last_login: string | null
  last_login_ip: string | null
  last_seen: string | null
  is_active: boolean
  is_staff: boolean
  is_editor: boolean
  is_archived: boolean
  archived_at: string | null
  email_verified: boolean
  color_variant: 'light' | 'dark' | 'pink'
  language: Language
  residency_country: string
  login_streak: number
  accounts_count: number
  stock_transactions_count: number
  budget_transactions_count: number
  budget_income_count: number
  budget_expense_count: number
  invited_count: number
  invitations_generated_count: number
  invited_users: AdminInvitedUser[]
  articles: AdminUserArticle[]
  activity_last_30_days: AdminUserActivityDay[]
  total_active_days: number
  budget_entries_last_30_days: AdminUserBudgetEntryDay[]
  role_assignments: RoleAssignment[]
  avg_session_duration_seconds: number
}

export interface AdminActivityStats {
  active_today: number
  total_users: number
  staff_users: number
  verified_users: number
  new_this_week: number
  daily: { date: string; count: number }[]
}

export interface Article {
  id: number
  title: string
  slug: string
  summary: string
  body: string
  is_published: boolean
  order: number
  author_name: string | null
  published_at: string
  updated_at: string
}

export interface StatementPreviewRow {
  import_hash: string
  date: string
  amount: string
  currency: Currency
  type: BudgetType
  raw_type: string
  description: string
  counterparty: string | null
  category_id: number | null
  category_name_hint: string | null
  needs_review: boolean
  is_duplicate: boolean
  is_possible_duplicate: boolean
  default_selected: boolean
}

export interface StatementPreview {
  preview_id: string
  bank: string
  account_number: string | null
  period_from: string | null
  period_to: string | null
  rows: StatementPreviewRow[]
}

export type BudgetType = 'income' | 'expense'

export interface Category {
  id: number
  name: string
  type: BudgetType
  account: number | null
  account_detail: BankAccount | null
  display_order: number
  created_at: string
}

export interface Store {
  id: number
  name: string
  display_order: number
  created_at: string
}

export interface Tag {
  id: number
  name: string
  display_order: number
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

export interface TransactionHighlight {
  amount: string
  currency: Currency
  amount_base: string
  category: Category | null
  store: Store | null
  date: string
  description: string
}

export interface WeekdayStat {
  weekday: number
  total: string
  count: number
}

export interface StoreStat {
  store: Store | null
  total: string
  count: number
}

export interface TagStat {
  tag: Tag | null
  count: number
}

export interface InterestingStats {
  total_transactions: number
  avg_expense_amount: string | null
  avg_income_amount: string | null
  biggest_expense: TransactionHighlight | null
  biggest_income: TransactionHighlight | null
  weekday_breakdown: WeekdayStat[]
  best_month: MonthlyTrendRow | null
  worst_month: MonthlyTrendRow | null
  top_store_by_spend: StoreStat | null
  most_frequent_store: StoreStat | null
  most_used_tag: TagStat | null
  longest_no_spend_streak_days: number | null
  base_currency: Currency
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
  payday_day: number | null
  updated_at: string
}

export interface SavingsGoal {
  id: number
  category: number | null
  category_detail: Category | null
  name: string
  target_amount: string
  current_amount: string
  currency: Currency
  target_date: string | null
  notes: string
  progress_pct: string | null
  remaining_amount: string
  paydays_remaining: number | null
  suggested_contribution_per_payday: string | null
  created_at: string
}

export interface SavingsGoalContribution {
  id: number
  goal: number
  amount: string
  date: string
  note: string
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

export interface RecurringExpense {
  id: number
  category: number | null
  category_detail: Category | null
  name: string
  amount: string
  currency: Currency
  billing_day: number | null
  is_active: boolean
  notes: string
  created_at: string
}

export interface PlanningSummary {
  monthly_salary: string
  avg_monthly_expense: string
  total_monthly_fixed_costs: string
  free_monthly_budget: string
  current_savings: string
  total_reserved_for_goals: string
  total_unpaid_planned_expenses: string
  remaining_after_commitments: string
  base_currency: Currency
}
