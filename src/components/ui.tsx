import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
} from 'react'
import { Spinner } from './Spinner'

/* Campo 2A: bordo netto, angoli appena ammorbiditi, focus nero/verde. */
const fieldBase =
  'w-full rounded-lg border border-edge bg-paper px-3.5 py-3 text-[15px] text-ink outline-none transition placeholder:text-ink-faint focus:border-eco focus:ring-2 focus:ring-eco/25 disabled:opacity-60'

interface FieldWrap {
  label: string
  hint?: string
  children: ReactNode
}

function Field({ label, hint, children }: FieldWrap) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  )
}

export function TextField({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} hint={hint}>
      <input className={fieldBase} {...props} />
    </Field>
  )
}

export function SelectField({
  label,
  hint,
  children,
  ...props
}: { label: string; hint?: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} hint={hint}>
      <select className={`${fieldBase} appearance-none pr-9`} {...props}>
        {children}
      </select>
    </Field>
  )
}

export function PrimaryButton({
  loading = false,
  children,
  ...props
}: { loading?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-lg bg-eco px-4 py-3 text-[13px] font-bold uppercase tracking-[0.06em] text-white shadow-sm transition hover:bg-eco-600 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-60 ${props.className ?? ''}`}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700"
    >
      {message}
    </div>
  )
}

export function SuccessBanner({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="rounded-lg border border-eco-300 bg-eco-50 px-3.5 py-2.5 text-sm font-medium text-eco-700"
    >
      {message}
    </div>
  )
}
