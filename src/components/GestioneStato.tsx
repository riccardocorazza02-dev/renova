import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { StatoArticolo } from '../lib/database.types'
import { Spinner } from './Spinner'

/** Controparte con cui concludere lo scambio (dedotta dalle conversazioni). */
interface Candidato {
  id: string
  nome: string
}

const OPZIONI: Array<{
  value: StatoArticolo
  label: string
  desc: string
  attivo: string
}> = [
  {
    value: 'Disponibile',
    label: 'Disponibile',
    desc: 'Aperto alle richieste',
    attivo: 'bg-eco text-white ring-eco',
  },
  {
    value: 'Prenotato',
    label: 'Prenotato',
    desc: 'Promesso a un utente',
    attivo: 'bg-sun text-white ring-sun',
  },
  {
    value: 'Scambiato',
    label: 'Scambiato',
    desc: 'Scambio concluso',
    attivo: 'bg-ink text-white ring-ink',
  },
]

/**
 * Controllo riservato al proprietario per impostare la disponibilità di un
 * articolo (Disponibile → Prenotato → Scambiato). La RLS "articoli: update
 * proprio" garantisce che solo il proprietario possa scrivere lo stato.
 *
 * "Scambiato" è un caso speciale: è DEFINITIVO e passa da una conferma esplicita
 * (RPC `registra_scambio`), che registra anche l'acquirente — così l'oggetto
 * entra nello storico/impatto di entrambi e i due possono recensirsi. Quando è
 * disponibile una conversazione (uso dentro la chat) la controparte è già nota
 * (`acquirentePredefinito`); altrimenti si sceglie tra chi ha scritto.
 */
export function GestioneStato({
  idArticolo,
  stato,
  onChange,
  acquirentePredefinito,
  onScambioRegistrato,
}: {
  idArticolo: number
  stato: StatoArticolo
  onChange: (nuovo: StatoArticolo) => void
  acquirentePredefinito?: Candidato
  onScambioRegistrato?: (scambioId: number) => void
}) {
  const [salvando, setSalvando] = useState<StatoArticolo | null>(null)
  const [errore, setErrore] = useState('')

  // Modale di conferma scambio
  const [modaleAperta, setModaleAperta] = useState(false)
  const [candidati, setCandidati] = useState<Candidato[]>([])
  const [caricandoCandidati, setCaricandoCandidati] = useState(false)
  const [selezionato, setSelezionato] = useState<string>('')
  const [registrando, setRegistrando] = useState(false)
  const [erroreModale, setErroreModale] = useState('')

  // Una volta scambiato è definitivo: niente più controlli, solo l'esito.
  if (stato === 'Scambiato') {
    return (
      <section className="rounded-lg border border-line bg-paper p-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <h2 className="text-[13px] font-bold uppercase tracking-[0.04em] text-ink">
              Scambio concluso
            </h2>
            <p className="text-xs text-ink-soft">
              Operazione definitiva: l'articolo è stato scambiato.
            </p>
          </div>
        </div>
      </section>
    )
  }

  async function imposta(nuovo: StatoArticolo) {
    if (nuovo === stato || salvando) return
    // "Scambiato" non si imposta direttamente: apre la conferma.
    if (nuovo === 'Scambiato') {
      apriModaleScambio()
      return
    }
    setSalvando(nuovo)
    setErrore('')
    const { error } = await supabase
      .from('articoli')
      .update({ stato: nuovo })
      .eq('id', idArticolo)
    setSalvando(null)
    if (error) {
      setErrore('Impossibile aggiornare lo stato. Riprova.')
      console.error('[Renova] Update stato error:', error.message)
      return
    }
    onChange(nuovo)
  }

  async function apriModaleScambio() {
    setErroreModale('')
    setModaleAperta(true)
    if (acquirentePredefinito) {
      setSelezionato(acquirentePredefinito.id)
      setCandidati([acquirentePredefinito])
      return
    }
    // Senza controparte nota: la deduciamo da chi ha scritto sull'articolo.
    setCaricandoCandidati(true)
    setSelezionato('')
    const { data, error } = await supabase
      .from('conversazioni')
      .select('id_acquirente, nome_acquirente')
      .eq('id_articolo', idArticolo)
      .order('updated_at', { ascending: false })
    setCaricandoCandidati(false)
    if (error) {
      setErroreModale('Impossibile caricare gli interessati. Riprova.')
      console.error('[Renova] Conversazioni candidati error:', error.message)
      return
    }
    const visti = new Set<string>()
    const lista: Candidato[] = []
    for (const r of (data ?? []) as {
      id_acquirente: string
      nome_acquirente: string
    }[]) {
      if (visti.has(r.id_acquirente)) continue
      visti.add(r.id_acquirente)
      lista.push({ id: r.id_acquirente, nome: r.nome_acquirente })
    }
    setCandidati(lista)
    if (lista.length === 1) setSelezionato(lista[0].id)
  }

  function chiudiModale() {
    if (registrando) return
    setModaleAperta(false)
  }

  async function confermaScambio() {
    if (!selezionato || registrando) return
    setRegistrando(true)
    setErroreModale('')
    const { data, error } = await supabase.rpc('registra_scambio', {
      p_id_articolo: idArticolo,
      p_id_acquirente: selezionato,
    })
    setRegistrando(false)
    if (error) {
      setErroreModale('Impossibile registrare lo scambio. Riprova.')
      console.error('[Renova] registra_scambio error:', error.message)
      return
    }
    setModaleAperta(false)
    onChange('Scambiato')
    onScambioRegistrato?.(data as number)
  }

  const nomeSelezionato =
    candidati.find((c) => c.id === selezionato)?.nome ?? ''

  return (
    <section className="space-y-3 rounded-lg border border-line bg-paper p-4">
      <div>
        <h2 className="text-[13px] font-bold uppercase tracking-[0.04em] text-ink">
          Disponibilità dell'articolo
        </h2>
        <p className="mt-0.5 text-xs text-ink-soft">
          Aggiorna lo stato man mano che organizzi lo scambio.
        </p>
      </div>

      {errore && (
        <p className="border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {errore}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {OPZIONI.map((o) => {
          const isAttivo = o.value === stato
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => imposta(o.value)}
              disabled={salvando !== null}
              aria-pressed={isAttivo}
              className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2.5 text-center transition disabled:opacity-60 ${
                isAttivo
                  ? `${o.attivo} border-transparent`
                  : 'border-edge text-ink hover:border-ink'
              }`}
            >
              <span className="text-sm font-bold">
                {salvando === o.value ? '…' : o.label}
              </span>
              <span
                className={`text-[10px] leading-tight ${
                  isAttivo ? 'opacity-80' : 'text-ink-soft'
                }`}
              >
                {o.desc}
              </span>
            </button>
          )
        })}
      </div>

      {modaleAperta && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={chiudiModale}
        >
          <div
            className="w-full max-w-sm space-y-4 rounded-2xl border-t-[1.5px] border-ink bg-paper p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-lg font-extrabold tracking-[-0.02em] text-ink">
                Concludere lo scambio?
              </h3>
              <p className="mt-1 text-sm text-ink-soft">
                L'operazione è <span className="font-semibold text-ink">definitiva</span>{' '}
                e non potrà essere annullata. L'articolo verrà segnato come
                scambiato e aggiunto allo storico e all'impatto di entrambi.
              </p>
            </div>

            {erroreModale && (
              <p className="border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {erroreModale}
              </p>
            )}

            {acquirentePredefinito ? (
              <p className="rounded-lg border border-line bg-surface px-3.5 py-3 text-sm text-ink">
                Stai concludendo lo scambio con{' '}
                <span className="font-bold">{acquirentePredefinito.nome}</span>.
              </p>
            ) : caricandoCandidati ? (
              <div className="flex items-center gap-2 px-1 py-2 text-sm text-ink-soft">
                <Spinner className="h-4 w-4" /> Carico gli interessati…
              </div>
            ) : candidati.length === 0 ? (
              <p className="rounded-lg border border-sun/30 bg-sun-50 px-3.5 py-3 text-sm text-ink-soft">
                Nessun interessato ti ha ancora scritto per questo articolo. Lo
                scambio si registra dalla chat con l'acquirente.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-muted">
                  Con chi hai concluso lo scambio?
                </p>
                <div className="max-h-52 space-y-1.5 overflow-y-auto">
                  {candidati.map((c) => (
                    <label
                      key={c.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
                        selezionato === c.id
                          ? 'border-eco bg-eco-50'
                          : 'border-edge hover:border-ink'
                      }`}
                    >
                      <input
                        type="radio"
                        name="acquirente"
                        value={c.id}
                        checked={selezionato === c.id}
                        onChange={() => setSelezionato(c.id)}
                        className="accent-eco"
                      />
                      <span className="text-sm font-semibold text-ink">
                        {c.nome}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={chiudiModale}
                disabled={registrando}
                className="flex-1 rounded-lg border border-edge px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.04em] text-ink transition hover:border-ink disabled:opacity-60"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={confermaScambio}
                disabled={registrando || !selezionato}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.04em] text-white transition hover:bg-ink-strong disabled:cursor-not-allowed disabled:opacity-50"
              >
                {registrando && <Spinner className="h-4 w-4" />}
                {acquirentePredefinito || !nomeSelezionato
                  ? 'Conferma scambio'
                  : `Scambia con ${nomeSelezionato.split(' ')[0]}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
