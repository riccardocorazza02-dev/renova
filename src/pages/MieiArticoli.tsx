import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Articolo, StatoArticolo } from '../lib/database.types'
import { StatoBadge } from '../components/StatoBadge'
import { EsgBadge } from '../components/EsgBadge'
import { FullScreenSpinner } from '../components/Spinner'
import { PLACEHOLDER_FOTO, formatPrezzo } from '../lib/format'

/** Articolo dell'utente + nome categoria, per la lista "I miei articoli". */
interface MioArticolo extends Articolo {
  categoria: { nome: string }
}

const FILTRI: Array<{ value: 'Tutti' | StatoArticolo; label: string }> = [
  { value: 'Tutti', label: 'Tutti' },
  { value: 'Disponibile', label: 'Disponibili' },
  { value: 'Prenotato', label: 'Prenotati' },
  { value: 'Scambiato', label: 'Scambiati' },
]

/**
 * Lista degli articoli caricati dall'utente, con il loro stato. Ogni riga apre
 * il dettaglio dell'articolo, dove il proprietario può cambiare lo stato
 * (Disponibile / Prenotato / Scambiato) o eliminarlo. La RLS "articoli: feed
 * pubblico e societario" restituisce comunque i propri articoli.
 */
export function MieiArticoli() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const meId = session?.user.id

  const [articoli, setArticoli] = useState<MioArticolo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState<'Tutti' | StatoArticolo>('Tutti')

  useEffect(() => {
    if (!meId) return
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      const { data, error } = await supabase
        .from('articoli')
        .select(
          `id, titolo, taglia, condizione, foto_url, foto_urls, stato, id_categoria,
           prezzo, ha_logo_societa, id_societa, sport, id_utente, created_at,
           co2, acqua, fonte_impatto,
           categoria:categorie_item!inner ( nome )`,
        )
        .eq('id_utente', meId!)
        .order('created_at', { ascending: false })

      if (!active) return
      if (error) {
        setError('Impossibile caricare i tuoi articoli. Riprova.')
        console.error('[Renova] Miei articoli error:', error.message)
      } else {
        setArticoli((data ?? []) as unknown as MioArticolo[])
      }
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [meId])

  const conteggi = useMemo(() => {
    const c: Record<string, number> = {
      Tutti: articoli.length,
      Disponibile: 0,
      Prenotato: 0,
      Scambiato: 0,
    }
    for (const a of articoli) c[a.stato] = (c[a.stato] ?? 0) + 1
    return c
  }, [articoli])

  const visibili = useMemo(
    () =>
      filtro === 'Tutti'
        ? articoli
        : articoli.filter((a) => a.stato === filtro),
    [articoli, filtro],
  )

  if (loading) return <FullScreenSpinner />

  return (
    <div className="-mt-1">
      {/* Back al profilo */}
      <button
        type="button"
        onClick={() => navigate('/profilo')}
        aria-label="Torna al profilo"
        className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-ink-soft transition hover:text-ink"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M15 18l-6-6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Profilo
      </button>

      {/* Intestazione editoriale */}
      <div className="-mx-4 flex flex-col gap-1.5 border-b-[1.5px] border-ink px-5 pb-4">
        <span className="eyebrow">Gestione</span>
        <h1 className="text-[34px] font-extrabold leading-[0.95] tracking-[-0.03em] text-ink">
          I miei articoli
        </h1>
        <p className="text-sm text-ink-soft">
          Tocca un articolo per cambiarne lo stato o eliminarlo.
        </p>
      </div>

      {error && (
        <p className="mt-4 border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Filtri per stato — tab MAIUSCOLE con underline verde */}
      {articoli.length > 0 && (
        <div className="-mx-4 flex gap-5 overflow-x-auto border-b border-line px-5 py-3">
          {FILTRI.map((f) => {
            const attivo = filtro === f.value
            return (
              <button
                key={f.value}
                onClick={() => setFiltro(f.value)}
                className={`whitespace-nowrap pb-1 text-[11.5px] uppercase tracking-[0.08em] transition ${
                  attivo
                    ? 'border-b-2 border-eco font-bold text-ink'
                    : 'font-semibold text-ink-faint hover:text-ink-soft'
                }`}
              >
                {f.label}
                <span className="ml-1 opacity-60">{conteggi[f.value] ?? 0}</span>
              </button>
            )
          })}
        </div>
      )}

      {articoli.length === 0 ? (
        <div className="mt-10 border-y border-line px-6 py-14 text-center">
          <h3 className="text-xl font-extrabold tracking-[-0.03em] text-ink">
            Non hai ancora caricato articoli
          </h3>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
            Rimetti in circolo il tuo materiale tecnico: comparirà qui con il suo
            stato.
          </p>
          <Link
            to="/aggiungi"
            className="mt-5 inline-flex bg-eco px-5 py-3 text-[13px] font-bold uppercase tracking-[0.06em] text-white transition active:scale-[.99]"
          >
            Aggiungi un articolo
          </Link>
        </div>
      ) : visibili.length === 0 ? (
        <p className="mt-6 border-y border-line px-6 py-10 text-center text-sm text-ink-soft">
          Nessun articolo con questo stato.
        </p>
      ) : (
        <ul className="-mx-4 border-b border-line">
          {visibili.map((a) => (
            <li key={a.id} className="border-t border-line first:border-t-0">
              <Link
                to={`/articolo/${a.id}`}
                className="flex items-center gap-3.5 px-5 py-3.5 transition hover:bg-surface"
              >
                <div className="foto-stripe relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line">
                  <img
                    src={a.foto_url || a.foto_urls?.[0] || PLACEHOLDER_FOTO}
                    alt={a.titolo}
                    loading="lazy"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).src = PLACEHOLDER_FOTO
                    }}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-[15px] font-bold leading-tight tracking-[-0.01em] text-ink">
                      {a.titolo}
                    </h3>
                    <StatoBadge stato={a.stato} />
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
                    <span>{a.categoria.nome.split(' ')[0]}</span>
                    {a.taglia && <span>· {a.taglia}</span>}
                    <span>· {a.ha_logo_societa ? 'Società' : 'Pubblico'}</span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-sm font-extrabold text-ink">
                      {formatPrezzo(Number(a.prezzo))}
                    </span>
                    <EsgBadge
                      variante="co2"
                      valore={Number(a.co2)}
                      compact
                      minimo={a.fonte_impatto === 'categoria'}
                    />
                    <EsgBadge
                      variante="acqua"
                      valore={Number(a.acqua)}
                      compact
                      minimo={a.fonte_impatto === 'categoria'}
                    />
                  </div>
                </div>

                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                  className="shrink-0 self-center text-ink-faint"
                >
                  <path
                    d="M9 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
