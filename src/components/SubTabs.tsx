import { NavLink } from 'react-router-dom'

export interface SubTab {
  to: string
  label: string
  end?: boolean
  badge?: number
}

export default function SubTabs({ tabs }: { tabs: SubTab[] }) {
  return (
    <div className="mb-6 flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-700">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${
              isActive
                ? 'border-accent-600 text-accent-700 dark:text-accent-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`
          }
        >
          {tab.label}
          {!!tab.badge && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white">
              {tab.badge}
            </span>
          )}
        </NavLink>
      ))}
    </div>
  )
}
