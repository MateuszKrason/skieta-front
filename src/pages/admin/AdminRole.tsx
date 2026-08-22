import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { useLanguage } from '../../i18n/LanguageContext'
import type { Permission, Role } from '../../types'

function groupByCategory(permissions: Permission[]): [string, Permission[]][] {
  const groups = new Map<string, Permission[]>()
  for (const p of permissions) {
    const key = p.category || 'Inne'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(p)
  }
  return [...groups.entries()]
}

function RoleForm({
  permissions,
  initial,
  onDone,
  onCancel,
}: {
  permissions: Permission[]
  initial?: Role
  onDone: () => void
  onCancel?: () => void
}) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? '#64748b')
  const [selected, setSelected] = useState<Set<number>>(new Set(initial?.permissions.map((p) => p.id) ?? []))

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { name, color, permission_ids: [...selected] }
      return initial ? api.patch(`/auth/admin/roles/${initial.id}/`, payload) : api.post('/auth/admin/roles/', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] })
      onDone()
    },
  })

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('Nazwa roli')}
          className="input max-w-xs"
        />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-slate-300 dark:border-slate-600 bg-transparent"
          title={t('Kolor roli')}
        />
      </div>
      <div className="space-y-2">
        {groupByCategory(permissions).map(([category, perms]) => (
          <div key={category}>
            <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{t(category)}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {perms.map((p) => (
                <label key={p.id} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                  {t(p.label)}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => mutation.mutate()}
          disabled={!name.trim() || mutation.isPending}
          className="btn-primary"
        >
          {initial ? t('Zapisz zmiany') : t('Utwórz rolę')}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {t('Anuluj')}
          </button>
        )}
      </div>
    </div>
  )
}

export default function AdminRole() {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const { data: roles, isLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => (await api.get<Role[]>('/auth/admin/roles/')).data,
  })

  const { data: permissions } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: async () => (await api.get<Permission[]>('/auth/admin/permissions/')).data,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/auth/admin/roles/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-roles'] }),
  })

  function onDelete(role: Role) {
    if (window.confirm(t('Usunąć rolę {0}? Zostanie odebrana wszystkim {1} przypisanym użytkownikom.', role.name, String(role.member_count)))) {
      deleteMutation.mutate(role.id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('Role niestandardowe')}</h2>
          {!creating && (
            <button onClick={() => setCreating(true)} className="btn-primary text-sm">
              {t('+ Nowa rola')}
            </button>
          )}
        </div>
        <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
          {t('Twórz role z wybranym zestawem uprawnień i nadawaj je użytkownikom w ich profilu — niezależnie od statusu administratora/redaktora.')}
        </p>

        {creating && permissions && (
          <div className="mb-3">
            <RoleForm permissions={permissions} onDone={() => setCreating(false)} onCancel={() => setCreating(false)} />
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">{t('Ładowanie…')}</p>
        ) : (
          <div className="space-y-2">
            {(roles ?? []).map((role) =>
              editingId === role.id && permissions ? (
                <RoleForm
                  key={role.id}
                  permissions={permissions}
                  initial={role}
                  onDone={() => setEditingId(null)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div
                  key={role.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: role.color }} />
                    <span className="font-medium">{role.name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {t('{0} uprawnień, {1} użytkowników', String(role.permissions.length), String(role.member_count))}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(role.id)}
                      className="text-xs font-medium text-accent-700 dark:text-accent-400 hover:underline"
                    >
                      {t('Edytuj')}
                    </button>
                    <button
                      onClick={() => onDelete(role)}
                      disabled={deleteMutation.isPending}
                      className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                    >
                      {t('Usuń')}
                    </button>
                  </div>
                </div>
              ),
            )}
            {(roles ?? []).length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500">{t('Brak ról.')}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
