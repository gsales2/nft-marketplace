import { useState } from 'react'
import type { HomeMessage } from '../../lib/catalogData'

export function NewsLetter({ onAction }: { onAction: (message: HomeMessage) => void }) {
  const [email, setEmail] = useState('')
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[18px] font-bold leading-4">Antecipe-se ao próximo lançamento</h2>
      <form
        className="flex h-10 rounded-md bg-[#38220f]"
        onSubmit={(event) => {
          event.preventDefault()
          onAction({
            title: 'Formulário validado',
            body: 'O formulário foi validado. O envio de novidades será ativado quando a newsletter estiver conectada.',
          })
          setEmail('')
        }}
      >
        <input
          aria-label="E-mail para novidades"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="digite seu e-mail..."
          className="min-w-0 flex-1 rounded-l-md px-3 text-[14px] placeholder:text-catalog-secondary"
        />
        <button
          type="submit"
          className="w-[85px] rounded-r-md bg-catalog-primary text-[18px] font-bold text-background"
        >
          Enviar
        </button>
      </form>
      <p className="text-[13px] leading-[22px] text-catalog-muted">
        Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
      </p>
    </div>
  )
}
