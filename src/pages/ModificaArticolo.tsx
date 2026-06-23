import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Articolo, CategoriaItem, Condizione } from '../lib/database.types'
import { CONDIZIONI } from '../lib/database.types'
import { TextField, SelectField, PrimaryButton, ErrorBanner } from '../components/ui'
import { tagliePer } from '../lib/taglie'
import { FullScreenSpinner } from '../components/Spinner'

/** Articolo + i campi della categoria che servono al form di modifica. */
interface ArticoloModifica extends Articolo {
  categoria: Pick<CategoriaItem, 'nome' | 'richiede_prezzo' | 'tipo_taglia'>
}

/**
 * Modifica "leggera" di un articolo da parte del proprietario: titolo, prezzo
 * (solo per le categorie a prezzo manuale), taglia, condizione e flag logo.
 * Foto, categoria e impatto NON sono modificabili (per cambiarli si elimina e
 * si ricarica). La RLS "articoli: update proprio" garantisce lato DB che solo
 * il proprietario possa scrivere.
 */
export function ModificaArticolo() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()

  const [articolo, setArticolo] = useState<ArticoloModifica | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [titolo, setTitolo] = useState('')
  const [prezzo, setPrezzo] = useState('')
  const [taglia, setTaglia] = useState('')
  const [condizione, setCondizione] = useState<Condizione | ''>('')
  const [haLogo, setHaLogo] = useState(false)

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setLoadError('')
      const { data, error } = await supabase
        .from('articoli')
        .select(
          `id, titolo, taglia, condizione, prezzo, ha_logo_societa, id_categoria,
           id_utente, stato,
           categoria:categorie_item!inner ( nome, richiede_prezzo, tipo_taglia )`,
        )
        .eq('id', Number(id))
        .maybeSingle()

      if (!active) return
      if (error) {
        setLoadError('Impossibile caricare l’articolo. Riprova.')
        console.error('[Renova] Modifica load error:', error.message)
      } else if (!data) {
        setLoadError('Articolo non trovato o non più visibile.')
      } else {
        const a = data as unknown as ArticoloModifica
        setArticolo(a)
        setTitolo(a.titolo)
        setPrezzo(a.prezzo != null ? String(a.prezzo) : '')
        setTaglia(a.taglia ?? '')
        setCondizione((a.condizione ?? '') as Condizione | '')
        setHaLogo(a.ha_logo_societa)
      }
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [id])

  if (loading) return <FullScreenSpinner />

  const isProprietario =
    !!session && !!articolo && session.user.id === articolo.id_utente

  if (loadError || !articolo) {
    return (
      <div className="space-y-4">
        <BackLink onClick={() => navigate(-1)} />
        <ErrorBanner message={loadError || 'Articolo non trovato.'} />
      </div>
    )
  }

  if (!isProprietario) {
    return (
      <div className="space-y-4">
        <BackLink onClick={() => navigate(`/articolo/${articolo.id}`)} />
        <ErrorBanner message="Solo chi ha caricato l’articolo può modificarlo." />
      </div>
    )
  }

  const { categoria } = articolo
  const taglieDisponibili = tagliePer(categoria.tipo_taglia)
  const prezzoValido = !categoria.richiede_prezzo || Number(prezzo) > 0
  const formValido =
    !!titolo.trim() && !!taglia && !!condizione && prezzoValido

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!articolo || !formValido) return
    setError('')
    setSubmitting(true)

    // Aggiorniamo solo i campi modificabili. Il prezzo si tocca solo per le
    // categorie a prezzo manuale (le altre lo ereditano dalla categoria).
    const patch: Partial<Articolo> = {
      titolo: titolo.trim(),
      taglia,
      condizione: condizione as Condizione,
      ha_logo_societa: haLogo,
    }
    if (categoria.richiede_prezzo) patch.prezzo = Number(prezzo) || 0

    const { error } = await supabase
      .from('articoli')
      .update(patch)
      .eq('id', articolo.id)

    setSubmitting(false)
    if (error) {
      setError(`Errore nel salvataggio: ${error.message}`)
      console.error('[Renova] Modifica update error:', error.message)
      return
    }
    navigate(`/articolo/${articolo.id}`, { replace: true })
  }

  return (
    <div className="-mt-1">
      <div className="mb-3">
        <BackLink onClick={() => navigate(`/articolo/${articolo.id}`)} />
      </div>

      <header className="-mx-4 flex flex-col gap-1.5 border-b-[1.5px] border-ink px-5 pb-4">
        <span className="eyebrow">Modifica</span>
        <h1 className="text-[34px] font-extrabold leading-[0.95] tracking-[-0.03em] text-ink">
          Modifica articolo
        </h1>
        <p className="text-sm text-ink-soft">
          Aggiorna i dettagli di{' '}
          <span className="font-semibold text-ink">{categoria.nome}</span>. Per
          cambiare foto o categoria, elimina e ricarica l’articolo.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5 pt-5">
        {error && <ErrorBanner message={error} />}

        <TextField
          label="Titolo *"
          required
          maxLength={80}
          value={titolo}
          onChange={(e) => setTitolo(e.target.value)}
          placeholder="es. Scarpe Nike Mercurial — usate 2 volte"
        />

        {categoria.richiede_prezzo && (
          <TextField
            label="Valore d'acquisto (€) *"
            type="number"
            min={0}
            step="0.5"
            required
            value={prezzo}
            onChange={(e) => setPrezzo(e.target.value)}
            placeholder="es. 60"
            hint="Indica quanto è costato da nuovo."
          />
        )}

        <SelectField
          label="Taglia *"
          required
          value={taglia}
          onChange={(e) => setTaglia(e.target.value)}
          hint={
            categoria.tipo_taglia === 'calzatura'
              ? 'Numero EU.'
              : categoria.tipo_taglia === 'unica'
                ? 'Questo articolo ha taglia unica.'
                : 'Dalla taglia bimbo alla taglia adulto.'
          }
        >
          <option value="" disabled>
            Seleziona una taglia…
          </option>
          {taglieDisponibili.map((t) => (
            <option key={t} value={t}>
              {categoria.tipo_taglia === 'calzatura' ? `EU ${t}` : t}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Condizione *"
          required
          value={condizione}
          onChange={(e) => setCondizione(e.target.value as Condizione)}
          hint="Stato di usura dell'articolo."
        >
          <option value="" disabled>
            Seleziona la condizione…
          </option>
          {CONDIZIONI.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectField>

        <div className="rounded-lg border border-line bg-surface/60 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={haLogo}
              onChange={(e) => setHaLogo(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-eco"
            />
            <span className="text-sm">
              <span className="font-bold uppercase tracking-[0.03em] text-ink">
                Ha il logo della tua società?
              </span>
              <span className="mt-0.5 block text-xs text-ink-soft">
                {haLogo
                  ? 'Lo vedranno solo i membri della tua società.'
                  : 'Lo vedranno tutti i praticanti del tuo sport nella tua zona.'}
              </span>
            </span>
          </label>
        </div>

        <PrimaryButton type="submit" loading={submitting} disabled={!formValido}>
          Salva modifiche
        </PrimaryButton>
      </form>
    </div>
  )
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft transition hover:text-ink"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M15 18l-6-6 6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Indietro
    </button>
  )
}
