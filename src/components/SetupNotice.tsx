import { Logo } from './Logo'

/** Mostrato quando le variabili d'ambiente Supabase non sono configurate. */
export function SetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-6">
      <div className="w-full max-w-md rounded-xl border border-line border-t-[1.5px] border-t-ink bg-paper p-6 shadow-sm">
        <Logo className="text-2xl" />
        <h1 className="mt-4 text-xl font-extrabold tracking-[-0.02em] text-ink">
          Configura Supabase per iniziare
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Le variabili d'ambiente non sono ancora impostate. Per avviare Renova:
        </p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-ink-soft">
          <li>
            Copia <code className="rounded bg-surface px-1">.env.example</code> in{' '}
            <code className="rounded bg-surface px-1">.env</code>
          </li>
          <li>
            Inserisci <code className="rounded bg-surface px-1">VITE_SUPABASE_URL</code> e{' '}
            <code className="rounded bg-surface px-1">VITE_SUPABASE_ANON_KEY</code>
          </li>
          <li>
            Esegui le migrazioni in{' '}
            <code className="rounded bg-surface px-1">/supabase/migrations</code>
          </li>
          <li>Riavvia il dev server</li>
        </ol>
      </div>
    </div>
  )
}
