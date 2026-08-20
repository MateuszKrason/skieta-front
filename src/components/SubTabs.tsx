import { NavLink } from 'react-router-dom'

export interface SubTab {
  to: string
  label: string
  end?: boolean
}

export default function SubTabs({ tabs }: { tabs: SubTab[] }) {
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-slate-200 dark:border-slate-700">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${
              isActive
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  )
}
