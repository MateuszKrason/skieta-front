import type { ChangeEvent, InputHTMLAttributes } from 'react'

type AmountInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> & {
  value: string
  onChange: (value: string) => void
}

/** Drop-in replacement for `<input type="number" step="0.01">` on money/quantity
 * fields: native number inputs reject a "," decimal separator outright (per the
 * HTML spec, their value must parse as a JS float), which blocks the comma
 * notation used in Polish (and most European) locales. Renders as text so any
 * digits are accepted, then normalizes a typed "," to "." before handing the
 * string back to the caller - callers keep treating the value as a plain
 * period-decimal string, same as before. */
export function AmountInput({ value, onChange, inputMode = 'decimal', ...rest }: AmountInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value.replace(',', '.'))
  }

  return <input type="text" inputMode={inputMode} value={value} onChange={handleChange} {...rest} />
}
