// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Login from './Login'

const login = vi.fn()

vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ login }) }))
vi.mock('../i18n/LanguageContext', () => ({ useLanguage: () => ({ t: (text: string) => text }) }))
vi.mock('../components/AuthTopBar', () => ({ default: () => null }))

// The second login step is the one screen where a mistake locks people out of
// their own account, so the form's behaviour is pinned down here: what it
// shows after each answer from the server, and what it sends the second time.
function refusal(code: string) {
  return { response: { status: 401, data: { code, detail: 'x' } } }
}

function type(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  setter.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('Login', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    login.mockReset()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() => {
      root.render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
      )
    })
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  const inputs = () => Array.from(container.querySelectorAll('input'))
  const codeField = () => container.querySelector<HTMLInputElement>('input[autocomplete="one-time-code"]')

  async function submit() {
    await act(async () => {
      container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
  }

  async function fillAndSubmit() {
    await act(async () => {
      type(inputs()[0], 'ola')
      type(inputs()[1], 'not-a-real-password')
    })
    await submit()
  }

  it('asks for nothing but the login and password at first', async () => {
    login.mockResolvedValue(undefined)

    await fillAndSubmit()

    expect(codeField()).toBeNull()
    expect(login).toHaveBeenCalledWith('ola', 'not-a-real-password', undefined)
  })

  it('shows the code field, without an error, when the account has a second step', async () => {
    login.mockRejectedValue(refusal('two_factor_required'))

    await fillAndSubmit()

    expect(codeField()).not.toBeNull()
    expect(container.textContent).not.toContain('Nieprawidłowy login lub hasło.')
  })

  it('sends the same login and password again, with the code', async () => {
    login.mockRejectedValueOnce(refusal('two_factor_required')).mockResolvedValueOnce(undefined)
    await fillAndSubmit()

    await act(async () => type(codeField()!, ' 123456 '))
    await submit()

    expect(login).toHaveBeenLastCalledWith('ola', 'not-a-real-password', '123456')
  })

  it('keeps the code field and says so when the code is wrong', async () => {
    login.mockRejectedValueOnce(refusal('two_factor_required')).mockRejectedValueOnce(refusal('two_factor_invalid'))
    await fillAndSubmit()
    await act(async () => type(codeField()!, '000000'))

    await submit()

    expect(codeField()).not.toBeNull()
    expect(codeField()!.value).toBe('')
    expect(container.textContent).toContain('Kod jest nieprawidłowy albo już wygasł.')
  })

  it('explains the wait after too many wrong codes', async () => {
    login.mockRejectedValue(refusal('two_factor_locked'))

    await fillAndSubmit()

    expect(container.textContent).toContain('Za dużo błędnych kodów. Spróbuj ponownie za 15 minut.')
  })

  it('still reports a wrong password the old way', async () => {
    login.mockRejectedValue({ response: { status: 401, data: { detail: 'No active account' } } })

    await fillAndSubmit()

    expect(codeField()).toBeNull()
    expect(container.textContent).toContain('Nieprawidłowy login lub hasło.')
  })
})
