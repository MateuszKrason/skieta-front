import { useTheme } from '../theme/ThemeContext'

/** Shared recharts <Tooltip> styling — recharts' own defaults leave the label
 * (the date/category text) with no explicit color, so it inherits the page's
 * text color while the tooltip background stays hardcoded white, making the
 * label illegible in dark mode. Spread the result onto every <Tooltip/>. */
export function useTooltipStyle() {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  return {
    contentStyle: {
      backgroundColor: dark ? '#1e293b' : '#ffffff',
      border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
      borderRadius: 8,
      fontSize: 12,
    },
    labelStyle: {
      color: dark ? '#f1f5f9' : '#0f172a',
      fontWeight: 600,
      marginBottom: 4,
    },
    itemStyle: {
      color: dark ? '#e2e8f0' : '#1e293b',
    },
  }
}
