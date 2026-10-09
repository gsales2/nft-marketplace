import { Link } from '@tanstack/react-router'
import { UserRound } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { getApiError } from '../../lib/api'
import { Button } from '../ui/Button'

export function AccountControls({ onLogin }: { onLogin: () => void }) {
  const { user, isPending, isError, refetch, logout } = useAuth()
  if (isPending)
    return (
      <span
        role="status"
        className="h-[34px] w-[100px] animate-pulse rounded-md bg-surface motion-reduce:animate-none"
      >
        <span className="sr-only">Verificando sessão…</span>
      </span>
    )
  if (isError)
    return (
      <Button variant="outline" onClick={() => void refetch()} className="h-auto py-2 text-[12px]">
        Tentar recuperar sessão
      </Button>
    )
  if (!user)
    return (
      <button
        type="button"
        onClick={onLogin}
        className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-[12px]"
      >
        <UserRound size={16} />
        Entrar
      </button>
    )
  return (
    <div className="relative flex items-center gap-2 text-[12px]">
      <Link
        to="/profile"
        aria-label={`Conta de ${user.name}`}
        className="max-w-[100px] truncate text-catalog-accent"
      >
        {user.name.split(' ')[0]}
      </Link>
      <Button
        variant="outline"
        type="button"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        className="h-auto border-border px-3 py-2 text-[12px]"
      >
        {logout.isPending ? 'Saindo…' : 'Sair'}
      </Button>
      {logout.isError && (
        <p
          role="alert"
          className="absolute right-0 top-full z-50 mt-2 w-[240px] rounded border border-border bg-surface p-3 text-[#f0805f]"
        >
          {getApiError(logout.error).message}
        </p>
      )}
    </div>
  )
}
