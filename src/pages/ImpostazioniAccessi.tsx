import { useAuth } from '../contexts/AuthContext'
import { TestataImpostazioni } from '../components/impostazioni'

/**
 * Pagina dedicata all'attività di login e ai dispositivi
 * (/impostazioni/sicurezza/accessi) — annunciata, non ancora attiva.
 */
export function ImpostazioniAccessi() {
  const { profilo } = useAuth()
  if (!profilo) return null

  return (
    <div className="-mt-1">
      <TestataImpostazioni
        back="/impostazioni/sicurezza"
        backLabel="Sicurezza"
        eyebrow="Impostazioni"
        titolo="Attività di login"
        descrizione="Gli accessi al tuo account e i dispositivi collegati."
      />

      <section className="rounded-lg border border-dashed border-edge bg-surface p-4">
        <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-ink-muted">
          In arrivo
        </span>
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">
          Qui vedrai lo storico degli accessi al tuo account (data,
          dispositivo e browser) e potrai disconnettere i dispositivi
          collegati.
        </p>
      </section>
    </div>
  )
}
