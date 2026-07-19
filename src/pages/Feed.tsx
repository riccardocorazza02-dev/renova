import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type {
  ArticoloFeed,
  StatoArticolo,
  Condizione,
} from '../lib/database.types'
import { CONDIZIONI } from '../lib/database.types'
import { ArticleCard } from '../components/ArticleCard'

const FILTRI: Array<{ value: 'Tutti' | StatoArticolo; label: string }> = [
  { value: 'Tutti', label: 'Tutti' },
  { value: 'Disponibile', label: 'Disponibili' },
  { value: 'Prenotato', label: 'Prenotati' },
  { value: 'Scambiato', label: 'Scambiati' },
]

type Tipo = 'tutti' | 'pubblico' | 'societa'
type Ordine = 'recenti' | 'prezzo-asc' | 'prezzo-desc'

/** Filtri avanzati gestiti dal pannello (oltre a stato e ricerca testuale). */
interface FiltriAvanzati {
  categoria: string | null
  condizione: Condizione | null
  tipo: Tipo
  ordine: Ordine
}

const FILTRI_INIZIALI: FiltriAvanzati = {
  categoria: null,
  condizione: null,
  tipo: 'tutti',
  ordine: 'recenti',
}

export function Feed() {
  const [articoli, setArticoli] = useState<ArticoloFeed[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState<'Tutti' | StatoArticolo>('Tutti')

  // Ricerca testuale + filtri avanzati (pannello).
  const [query, setQuery] = useState('')
  const [adv, setAdv] = useState<FiltriAvanzati>(FILTRI_INIZIALI)
  const [pannelloAperto, setPannelloAperto] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      // FEED UNICO. La RLS "articoli: feed pubblico e societario" decide cosa
      // l'utente può vedere, in modo trasparente per l'utente stesso:
      //  • articoli del suo sport SENZA logo → visibili a tutti gli utenti di
      //    quello sport (qualsiasi società);
      //  • articoli del suo sport CON logo → visibili solo a chi ha lo stesso
      //    codice di accesso (stessa società).
      // Il client mostra semplicemente tutto ciò che la RLS restituisce.
      // NB: niente join su `utenti` (la sua RLS escluderebbe i proprietari di
      // altre società presenti nel feed pubblico).
      const { data, error } = await supabase
        .from('articoli')
        .select(
          `id, titolo, taglia, condizione, foto_url, foto_urls, stato, id_categoria, prezzo,
           ha_logo_societa, id_societa, sport, id_utente, created_at,
           co2, acqua, fonte_impatto, composizione,
           categoria:categorie_item!inner ( nome, tipo )`,
        )
        .order('created_at', { ascending: false })

      if (!active) return
      if (error) {
        setError('Impossibile caricare il marketplace. Riprova.')
        console.error('[Renova] Feed error:', error.message)
      } else {
        setArticoli((data ?? []) as unknown as ArticoloFeed[])
      }
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [])

  // Categorie effettivamente presenti nel feed, per popolare il pannello.
  const categorieDisponibili = useMemo(
    () =>
      Array.from(new Set(articoli.map((a) => a.categoria.nome))).sort((a, b) =>
        a.localeCompare(b, 'it'),
      ),
    [articoli],
  )

  // Pipeline di filtraggio: stato → ricerca → filtri avanzati → ordinamento.
  const visibili = useMemo(() => {
    let r = articoli

    if (filtro !== 'Tutti') r = r.filter((a) => a.stato === filtro)

    const term = query.trim().toLowerCase()
    if (term) {
      r = r.filter(
        (a) =>
          a.titolo.toLowerCase().includes(term) ||
          a.categoria.nome.toLowerCase().includes(term) ||
          (a.taglia ?? '').toLowerCase().includes(term),
      )
    }

    if (adv.categoria) r = r.filter((a) => a.categoria.nome === adv.categoria)
    if (adv.condizione) r = r.filter((a) => a.condizione === adv.condizione)
    if (adv.tipo === 'pubblico') r = r.filter((a) => !a.ha_logo_societa)
    else if (adv.tipo === 'societa') r = r.filter((a) => a.ha_logo_societa)

    if (adv.ordine === 'prezzo-asc')
      r = [...r].sort((a, b) => Number(a.prezzo) - Number(b.prezzo))
    else if (adv.ordine === 'prezzo-desc')
      r = [...r].sort((a, b) => Number(b.prezzo) - Number(a.prezzo))

    return r
  }, [articoli, filtro, query, adv])

  // Numero di filtri avanzati attivi → badge sul bottone "Filtri".
  const filtriAttivi =
    (adv.categoria ? 1 : 0) +
    (adv.condizione ? 1 : 0) +
    (adv.tipo !== 'tutti' ? 1 : 0) +
    (adv.ordine !== 'recenti' ? 1 : 0)

  return (
    <div className="-mt-1">
      {/* Ricerca + FILTRI (full-bleed con regola sottile, stile Press 2A) */}
      <div className="-mx-4 flex items-center justify-between gap-3 border-b border-line px-5 pb-3">
        <div className="relative flex min-w-0 flex-1 items-center gap-2.5">
          <SearchIcon className="pointer-events-none h-4 w-4 shrink-0 text-ink" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca prodotti…"
            aria-label="Cerca articoli"
            className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Cancella ricerca"
              className="shrink-0 rounded-full p-1 text-ink-faint transition hover:text-ink"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setPannelloAperto(true)}
          aria-label="Imposta filtri"
          className="flex shrink-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink transition hover:text-eco-700"
        >
          Filtri
          {filtriAttivi > 0 ? (
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-eco px-1 text-[10px] font-bold text-white">
              {filtriAttivi}
            </span>
          ) : (
            <span className="text-base leading-none">+</span>
          )}
        </button>
      </div>

      {/* Filtri stato — tab MAIUSCOLE con sottolineatura verde (active) */}
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
            </button>
          )
        })}
      </div>

      {error && (
        <p className="mt-4 border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <SkeletonGrid />
      ) : visibili.length === 0 ? (
        <EmptyState
          haArticoli={articoli.length > 0}
          conRicerca={query.trim() !== '' || filtriAttivi > 0}
        />
      ) : (
        <div className="-mx-4 grid grid-cols-2 gap-px border-b border-line bg-line">
          {visibili.map((a) => (
            <ArticleCard key={a.id} articolo={a} />
          ))}
        </div>
      )}

      {pannelloAperto && (
        <FilterSheet
          valore={adv}
          categorie={categorieDisponibili}
          risultati={visibili.length}
          onChange={setAdv}
          onReset={() => setAdv(FILTRI_INIZIALI)}
          onClose={() => setPannelloAperto(false)}
        />
      )}
    </div>
  )
}

// ── Pannello filtri (bottom-sheet mobile-first) ──────────────────

function FilterSheet({
  valore,
  categorie,
  risultati,
  onChange,
  onReset,
  onClose,
}: {
  valore: FiltriAvanzati
  categorie: string[]
  risultati: number
  onChange: (f: FiltriAvanzati) => void
  onReset: () => void
  onClose: () => void
}) {
  // Chiude con Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = <K extends keyof FiltriAvanzati>(k: K, v: FiltriAvanzati[K]) =>
    onChange({ ...valore, [k]: v })

  const TIPI: Array<{ value: Tipo; label: string }> = [
    { value: 'tutti', label: 'Tutti' },
    { value: 'pubblico', label: 'Pubblici' },
    { value: 'societa', label: 'Società' },
  ]
  const ORDINI: Array<{ value: Ordine; label: string }> = [
    { value: 'recenti', label: 'Più recenti' },
    { value: 'prezzo-asc', label: 'Prezzo ↑' },
    { value: 'prezzo-desc', label: 'Prezzo ↓' },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Filtri del feed"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col rounded-t-2xl border-t-[1.5px] border-ink bg-paper shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="text-base font-extrabold uppercase tracking-[0.04em] text-ink">
            Filtri
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="rounded-full p-1.5 text-ink-soft transition hover:bg-black/5"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          {/* Categoria */}
          {categorie.length > 0 && (
            <Sezione titolo="Categoria">
              <div className="flex flex-wrap gap-2">
                <Chip
                  attivo={valore.categoria === null}
                  onClick={() => set('categoria', null)}
                >
                  Tutte
                </Chip>
                {categorie.map((c) => (
                  <Chip
                    key={c}
                    attivo={valore.categoria === c}
                    onClick={() =>
                      set('categoria', valore.categoria === c ? null : c)
                    }
                  >
                    {c}
                  </Chip>
                ))}
              </div>
            </Sezione>
          )}

          {/* Condizione */}
          <Sezione titolo="Condizione">
            <div className="flex flex-wrap gap-2">
              <Chip
                attivo={valore.condizione === null}
                onClick={() => set('condizione', null)}
              >
                Tutte
              </Chip>
              {CONDIZIONI.map((c) => (
                <Chip
                  key={c}
                  attivo={valore.condizione === c}
                  onClick={() =>
                    set('condizione', valore.condizione === c ? null : c)
                  }
                >
                  {c}
                </Chip>
              ))}
            </div>
          </Sezione>

          {/* Tipo (feed pubblico / società) */}
          <Sezione titolo="Tipo di articolo">
            <div className="flex flex-wrap gap-2">
              {TIPI.map((t) => (
                <Chip
                  key={t.value}
                  attivo={valore.tipo === t.value}
                  onClick={() => set('tipo', t.value)}
                >
                  {t.label}
                </Chip>
              ))}
            </div>
          </Sezione>

          {/* Ordinamento */}
          <Sezione titolo="Ordina per">
            <div className="flex flex-wrap gap-2">
              {ORDINI.map((o) => (
                <Chip
                  key={o.value}
                  attivo={valore.ordine === o.value}
                  onClick={() => set('ordine', o.value)}
                >
                  {o.label}
                </Chip>
              ))}
            </div>
          </Sezione>
        </div>

        <div className="flex items-center gap-3 border-t border-line px-4 py-3">
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-3 text-[12px] font-bold uppercase tracking-[0.06em] text-ink-soft transition hover:text-ink"
          >
            Azzera
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-eco px-4 py-3 text-[13px] font-bold uppercase tracking-[0.06em] text-white transition hover:bg-eco-600 active:scale-[.99]"
          >
            Mostra {risultati} risultat{risultati === 1 ? 'o' : 'i'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Sezione({
  titolo,
  children,
}: {
  titolo: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">
        {titolo}
      </p>
      {children}
    </div>
  )
}

function Chip({
  attivo,
  onClick,
  children,
}: {
  attivo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.04em] transition ${
        attivo
          ? 'bg-eco text-white'
          : 'border border-edge text-ink-soft hover:border-ink hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

// ── Icone inline ─────────────────────────────────────────────────

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="m20 20-3.5-3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SkeletonGrid() {
  return (
    <div className="-mx-4 grid grid-cols-2 gap-px border-b border-line bg-line">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="renova-skeleton flex flex-col gap-2.5 bg-paper p-3.5">
          <div className="aspect-[4/5] rounded-lg bg-black/5" />
          <div className="h-3.5 w-3/4 rounded bg-black/5" />
          <div className="h-2.5 w-1/2 rounded bg-black/5" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({
  haArticoli,
  conRicerca,
}: {
  haArticoli: boolean
  conRicerca: boolean
}) {
  return (
    <div className="mt-12 border-y border-line px-6 py-14 text-center">
      <span className="eyebrow">Marketplace</span>
      <h3 className="mt-2 text-xl font-extrabold tracking-[-0.03em] text-ink">
        {conRicerca
          ? 'Nessun articolo trovato'
          : haArticoli
            ? 'Nessun articolo con questo filtro'
            : 'Il marketplace è ancora vuoto'}
      </h3>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
        {conRicerca
          ? 'Prova a modificare la ricerca o i filtri per vedere altri articoli.'
          : haArticoli
            ? 'Prova a cambiare filtro per vedere altri articoli.'
            : 'Sii il primo a mettere in circolo del materiale tecnico.'}
      </p>
      {!haArticoli && !conRicerca && (
        <Link
          to="/aggiungi"
          className="mt-5 inline-flex bg-eco px-5 py-3 text-[13px] font-bold uppercase tracking-[0.06em] text-white transition active:scale-[.99]"
        >
          Aggiungi un articolo
        </Link>
      )}
    </div>
  )
}
