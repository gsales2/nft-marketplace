import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../../lib/auth'
import { getApiError, sessionExpiredEvent } from '../../lib/api'
import type { ApiError } from '../../lib/authContracts'
import { Input } from './Input'
import { Button } from './Button'

function GoogleMark() {
  const positions = [
    'left-[7.11%] top-[57.68%]',
    'left-1/2 top-[71.33%]',
    'left-0 top-[24.69%]',
    'left-[47.07%] top-[38.28%]',
    'left-1/2 top-[38.28%]',
    'left-[7.11%] top-0',
    'left-1/2 top-0',
  ]
  return (
    <span className="relative size-5 shrink-0 overflow-hidden" aria-hidden="true">
      {positions.map((position, index) => (
        <img
          key={position}
          src={`/images/auth/google-${index + 1}.svg`}
          alt=""
          className={`absolute max-w-none ${position}`}
        />
      ))}
    </span>
  )
}

export function LoginModal({ onClose, notice }: { onClose: () => void; notice?: string }) {
  const { user, login, register, logout } = useAuth()
  const busy = login.isPending || register.isPending
  const [fieldErrors, setFieldErrors] = useState<ApiError['fields']>({})
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const feedbackId = useId()
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login')
  const [name, setName] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const confirmationRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [confirmationVisible, setConfirmationVisible] = useState(false)
  const [feedback, setFeedback] = useState('')
  const submitting = useRef(false)
  useEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    element?.showModal()
    element?.querySelector<HTMLInputElement>('input[type="email"]')?.focus()
    document.body.style.overflow = 'hidden'
    const notifyExpiry = () =>
      setFeedback('Sua sessão expirou. Entre novamente para retomar de onde parou.')
    window.addEventListener(sessionExpiredEvent, notifyExpiry)
    return () => {
      element?.close()
      document.body.style.overflow = overflow
      window.removeEventListener(sessionExpiredEvent, notifyExpiry)
      previousFocus?.focus()
    }
  }, [])
  const changeMode = (next: typeof mode) => {
    if (busy) return
    setMode(next)
    setFeedback('')
    setFieldErrors({})
    setPassword('')
    setConfirmation('')
    setVisible(false)
    setConfirmationVisible(false)
  }
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy || submitting.current) return
    setFeedback('')
    setFieldErrors({})
    if (mode === 'register' && password !== confirmation) {
      confirmationRef.current?.setCustomValidity('As senhas devem ser iguais.')
      confirmationRef.current?.reportValidity()
      return
    }
    if (mode === 'reset') {
      setFeedback('A recuperação por e-mail não está disponível nesta simulação.')
      return
    }
    submitting.current = true
    try {
      if (mode === 'register')
        await register.mutateAsync({ name, email: email.trim(), password, confirmation })
      else await login.mutateAsync({ email: email.trim(), password })
      setPassword('')
      setConfirmation('')
      onClose()
    } catch (error) {
      const failure = getApiError(error)
      setFieldErrors(failure.fields ?? {})
      setFeedback(failure.message)
    } finally {
      submitting.current = false
    }
  }
  return (
    <dialog
      data-auth-dialog
      data-mode={mode}
      ref={dialog}
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const controls = [
          ...event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), a[href], [tabindex="0"]',
          ),
        ].filter((control) => control.getClientRects().length)
        const first = controls[0],
          last = controls.at(-1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect()
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            onClose()
        }
      }}
      className={`fixed inset-0 m-auto ${mode === 'register' ? 'h-[656px] rounded-[8px]' : 'h-[600px]'} max-h-[calc(100dvh-32px)] w-[500px] max-w-[calc(100vw-32px)] overflow-y-auto border-0 bg-surface p-0 text-[#f5f1eb] shadow-xl backdrop:bg-transparent`}
    >
      <div
        data-auth-content
        className={`relative ${mode === 'register' ? 'min-h-[646px]' : 'min-h-[590px]'} pb-6 pt-12`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar login"
          className={`absolute ${mode === 'register' ? 'right-[13px] top-[13px]' : 'right-[12px] top-[11px]'} flex size-[18px] items-center justify-center`}
        >
          <img src="/images/auth/close.svg" alt="" />
        </button>
        <h2 id={titleId} className="sr-only">
          {user
            ? 'Minha conta'
            : mode === 'reset'
              ? 'Recuperar senha'
              : mode === 'register'
                ? 'Criar conta'
                : 'Entrar na Kurio'}
        </h2>
        <div data-auth-logo className="hidden" aria-hidden="true">
          KURIO
        </div>
        <p data-auth-mobile-title className="hidden" aria-hidden="true">
          {mode === 'register'
            ? 'Criar perfil de colecionador'
            : mode === 'reset'
              ? 'Recuperar senha'
              : 'Entrar'}
        </p>
        {user && (
          <p className="text-center text-[20px] font-medium leading-4 text-catalog-accent">
            Minha conta
          </p>
        )}
        <div
          data-auth-tabs
          className={`${user ? 'hidden' : 'flex'} items-center justify-center gap-2 text-[20px] font-medium leading-4`}
        >
          <button
            type="button"
            disabled={busy}
            onClick={() => changeMode('login')}
            aria-pressed={mode === 'login'}
            className={mode === 'login' ? 'text-catalog-accent' : ''}
          >
            Entrar
          </button>
          <span className="h-4 w-px bg-[#f0805f]" aria-hidden="true" />
          <button
            type="button"
            disabled={busy}
            onClick={() => changeMode('register')}
            aria-pressed={mode === 'register'}
            className={mode === 'register' ? 'text-catalog-accent' : ''}
          >
            Criar conta
          </button>
        </div>
        <p data-auth-description className="mt-10 px-6 text-center text-[13px] leading-4 sm:px-12">
          {mode === 'reset'
            ? 'Informe seu e-mail para recuperar o acesso à sua conta.'
            : mode === 'register'
              ? 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'
              : 'Entre para gerenciar sua carteira, coleção e perfil de criador.'}
        </p>
        {user ? (
          <div className="mt-10 px-6 sm:px-20">
            <p className="text-center text-catalog-accent">{user.name}</p>
            <p className="mt-3 break-all text-center text-[14px]">{user.email}</p>
            <Button
              type="button"
              className="mt-6 w-full"
              disabled={logout.isPending}
              onClick={() => {
                void logout
                  .mutateAsync()
                  .then(onClose)
                  .catch((error) => setFeedback(getApiError(error).message))
              }}
            >
              {logout.isPending ? 'Saindo…' : 'Sair'}
            </Button>
          </div>
        ) : (
          <>
            <form data-auth-form onSubmit={submit} aria-busy={busy} className="px-6 pt-6 sm:px-20">
              {mode === 'register' && (
                <>
                  <label htmlFor={`${titleId}-name`} className="sr-only">
                    Nome
                  </label>
                  <Input
                    disabled={busy}
                    aria-invalid={!!fieldErrors?.name}
                    aria-describedby={fieldErrors?.name ? `${titleId}-name-error` : undefined}
                    id={`${titleId}-name`}
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value)
                      setFieldErrors((errors) => ({ ...errors, name: undefined }))
                      setFeedback('')
                    }}
                    placeholder="Nome de usuário"
                    className="mb-3 h-10 w-full rounded-[5px] border border-catalog-border bg-transparent px-4 text-[14px] leading-4 placeholder:text-catalog-secondary focus:border-catalog-primary focus:outline-none"
                  />
                </>
              )}
              <label htmlFor={`${titleId}-email`} className="sr-only">
                E-mail
              </label>
              <Input
                disabled={busy}
                aria-invalid={!!fieldErrors?.email}
                aria-describedby={fieldErrors?.email ? `${titleId}-email-error` : undefined}
                id={`${titleId}-email`}
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setFieldErrors((errors) => ({ ...errors, email: undefined }))
                  setFeedback('')
                }}
                placeholder={mode === 'register' ? 'Digite seu e-mail' : 'contato@email.com'}
                className="h-10 w-full rounded-[5px] border border-catalog-border bg-transparent px-4 text-[14px] leading-4 placeholder:text-catalog-secondary focus:border-catalog-primary focus:outline-none"
              />
              {mode !== 'reset' && (
                <div className="relative mt-3">
                  <label htmlFor={`${titleId}-password`} className="sr-only">
                    Senha
                  </label>
                  <Input
                    disabled={busy}
                    aria-invalid={!!fieldErrors?.password}
                    aria-describedby={
                      fieldErrors?.password ? `${titleId}-password-error` : undefined
                    }
                    id={`${titleId}-password`}
                    type={visible ? 'text' : 'password'}
                    required
                    minLength={mode === 'register' ? 8 : undefined}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      setFieldErrors((errors) => ({ ...errors, password: undefined }))
                      confirmationRef.current?.setCustomValidity('')
                      setFeedback('')
                    }}
                    placeholder={mode === 'register' ? 'Senha' : '***********'}
                    className={`h-10 w-full rounded-[5px] border bg-transparent pl-4 pr-12 leading-4 focus:outline-none focus:ring-1 focus:ring-catalog-primary ${mode === 'register' ? 'border-catalog-border text-[14px] placeholder:text-catalog-secondary' : 'border-catalog-primary text-[16px] placeholder:text-[#f5f1eb]'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setVisible((value) => !value)}
                    aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={visible}
                    className="absolute inset-y-0 right-2 flex w-8 items-center justify-center"
                  >
                    <img src="/images/auth/hide.svg" alt="" />
                  </button>
                </div>
              )}
              {mode === 'register' && (
                <>
                  <label htmlFor={`${titleId}-confirmation`} className="sr-only">
                    Confirmar senha
                  </label>
                  <div className="relative mt-3">
                    <Input
                      ref={confirmationRef}
                      disabled={busy}
                      aria-invalid={!!fieldErrors?.confirmation}
                      aria-describedby={
                        fieldErrors?.confirmation ? `${titleId}-confirmation-error` : undefined
                      }
                      id={`${titleId}-confirmation`}
                      type={confirmationVisible ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={confirmation}
                      onChange={(event) => {
                        setConfirmation(event.target.value)
                        setFieldErrors((errors) => ({ ...errors, confirmation: undefined }))
                        event.target.setCustomValidity('')
                        setFeedback('')
                      }}
                      placeholder="Confirmar senha"
                      className="h-10 w-full rounded-[5px] border border-catalog-border bg-transparent pl-4 pr-12 text-[14px] leading-4 placeholder:text-catalog-secondary focus:border-catalog-primary focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setConfirmationVisible((value) => !value)}
                      aria-label={
                        confirmationVisible
                          ? 'Ocultar confirmação da senha'
                          : 'Mostrar confirmação da senha'
                      }
                      aria-pressed={confirmationVisible}
                      className="absolute inset-y-0 right-2 flex w-8 items-center justify-center"
                    >
                      <img src="/images/auth/hide.svg" alt="" />
                    </button>
                  </div>
                </>
              )}
              {mode !== 'register' && (
                <div className="mt-3 flex justify-end text-[14px] leading-4 text-catalog-accent">
                  <button
                    type="button"
                    onClick={() => changeMode(mode === 'reset' ? 'login' : 'reset')}
                  >
                    {mode === 'reset' ? 'Voltar para entrar' : 'Esqueceu a senha?'}
                  </button>
                </div>
              )}
              <Button type="submit" size="lg" disabled={busy} className="mt-6 w-full leading-4">
                {busy ? (
                  'Aguarde…'
                ) : mode === 'register' ? (
                  <>
                    <span className="md:hidden">Criar perfil</span>
                    <span className="hidden md:inline">Criar conta</span>
                  </>
                ) : mode === 'reset' ? (
                  'Recuperar senha'
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
            <div data-auth-social className="pt-6">
              <div className="flex items-center gap-3 text-[13px] leading-4">
                <span className="h-px flex-1 bg-catalog-border" />
                <span>Ou continue com</span>
                <span className="h-px flex-1 bg-catalog-border" />
              </div>
              <div
                className={`flex flex-col px-6 sm:px-20 ${mode === 'register' ? 'gap-4 pt-4' : 'gap-3 pt-3'}`}
              >
                {(['Google', 'Facebook'] as const).map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() =>
                      setFeedback(
                        `O login com ${provider} não está disponível nesta simulação. Use seu e-mail.`,
                      )
                    }
                    className="flex h-10 w-full items-center justify-center gap-3 rounded-[5px] border border-catalog-border text-[13px] font-medium leading-4 text-catalog-muted hover:border-catalog-primary"
                  >
                    {provider === 'Google' ? (
                      <GoogleMark />
                    ) : (
                      <img src="/images/auth/facebook.svg" alt="" />
                    )}
                    Continuar com {provider}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        {!user && (
          <div data-auth-switch className="hidden">
            <button
              type="button"
              disabled={busy}
              onClick={() => changeMode(mode === 'register' ? 'login' : 'register')}
            >
              {mode === 'register' ? 'Já tem uma conta? Entre' : 'Novo na Kurio? Crie uma conta'}
            </button>
          </div>
        )}
        {notice && !user && (
          <p
            role="status"
            className="mt-4 px-6 text-center text-[12px] leading-4 text-catalog-accent"
          >
            {notice}
          </p>
        )}
        {Object.entries(fieldErrors ?? {}).map(([field, text]) => (
          <p
            key={field}
            id={`${titleId}-${field}-error`}
            className="mt-2 px-6 text-center text-[12px] leading-4 text-[#f0805f]"
          >
            {text}
          </p>
        ))}
        {feedback && (
          <p
            id={feedbackId}
            role="alert"
            className="mt-4 px-6 text-center text-[12px] leading-4 text-catalog-accent sm:px-12"
          >
            {feedback}
          </p>
        )}
      </div>
      <div className="sticky bottom-0 h-[10px] w-full bg-catalog-primary" />
    </dialog>
  )
}
