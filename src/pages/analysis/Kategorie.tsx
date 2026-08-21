import { useLanguage } from '../../i18n/LanguageContext'
import { CategoryManager, StoreManager, TagManager } from './shared'

export default function Kategorie() {
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('Kategorie, sklepy i tagi')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t('Zarządzaj tu wszystkimi kategoriami, sklepami i tagami używanymi w budżecie — w jednym miejscu.')}
        </p>
      </div>

      <CategoryManager type="income" />
      <CategoryManager type="expense" />
      <StoreManager />
      <TagManager />
    </div>
  )
}
