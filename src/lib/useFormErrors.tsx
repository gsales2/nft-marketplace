import { useEffect, useId, useRef } from 'react'
import { getApiError } from './api'

export function useFormErrors(error: unknown) {
  const id = useId()
  const form = useRef<HTMLFormElement>(null)
  const fields = error ? getApiError(error).fields : undefined

  useEffect(() => {
    if (!error) return
    const frame = requestAnimationFrame(() => {
      form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [error])

  const attributes = (name: string) => ({
    'aria-invalid': fields?.[name] ? true : undefined,
    'aria-describedby': fields?.[name] ? `${id}-${name}-error` : undefined,
  })
  const message = (name: string) =>
    fields?.[name] ? (
      <span id={`${id}-${name}-error`} className="mt-1 block text-xs text-catalog-accent">
        {fields[name]}
      </span>
    ) : null
  return { formRef: form, fieldAttributes: attributes, fieldError: message }
}
