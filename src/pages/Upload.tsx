import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, STORAGE_BUCKET } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type {
  CategoriaItem,
  Condizione,
  Composizione,
  Fibra,
} from '../lib/database.types'
import { CONDIZIONI, MACRO_CATEGORIE_ORDINE } from '../lib/database.types'
import { TextField, SelectField, PrimaryButton, ErrorBanner } from '../components/ui'
import { EsgBadge } from '../components/EsgBadge'
import { tagliePer } from '../lib/taglie'
import { Spinner } from '../components/Spinner'

const MAX_FOTO = 3

/** Valore economico di riferimento dell'item (0 se a prezzo manuale). */
function valoreRif(c: CategoriaItem): number {
  return c.valore != null ? Number(c.valore) : 0
}

/** Chiave dell'opzione "non lo so" → ricade sul priore L0. */
const CHIAVE_NON_SO = 'non_so'

/**
 * Impatto di un blend per un dato peso (kg), coi fattori delle fibre.
 * Replica lato client `renova_impatto_blend` del DB (solo per l'anteprima).
 * L'acqua delle fibre senza dato (acqua = null) non contribuisce.
 */
function impattoBlend(
  blend: Composizione,
  pesoKg: number,
  fibre: Record<string, Fibra>,
): { co2: number; acqua: number } {
  let co2 = 0
  let acqua = 0
  for (const [cod, pct] of Object.entries(blend)) {
    const f = fibre[cod]
    if (!f) continue
    co2 += (pct / 100) * Number(f.co2)
    acqua += (pct / 100) * Number(f.acqua ?? 0)
  }
  return { co2: co2 * pesoKg, acqua: acqua * pesoKg }
}

interface FotoSel {
  file: File
  url: string
}

export function Upload() {
  const { session, profilo } = useAuth()
  const navigate = useNavigate()

  const [categorie, setCategorie] = useState<CategoriaItem[]>([])
  const [fibre, setFibre] = useState<Record<string, Fibra>>({})
  const [loadingCat, setLoadingCat] = useState(true)

  const [titolo, setTitolo] = useState('')
  const [taglia, setTaglia] = useState('')
  const [idCategoria, setIdCategoria] = useState<string>('')
  const [prezzo, setPrezzo] = useState<string>('')
  const [condizione, setCondizione] = useState<Condizione | ''>('')
  const [haLogo, setHaLogo] = useState(false)
  const [foto, setFoto] = useState<FotoSel[]>([])
  // Materiale scelto dall'utente (tap L0+1); '' quando la categoria non chiede il tap.
  const [materialeChiave, setMaterialeChiave] = useState<string>('')
  // Foto facoltativa dell'etichetta di composizione (per la futura lettura L2).
  const [fotoEtichetta, setFotoEtichetta] = useState<FotoSel | null>(null)

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Carica SOLO le categorie del proprio sport (derivato dal codice di
  // accesso → profilo.sport). L'utente non sceglie lo sport.
  useEffect(() => {
    if (!profilo) return
    let active = true
    async function load() {
      const [cat, fib] = await Promise.all([
        supabase.from('categorie_item').select('*').eq('sport', profilo!.sport),
        supabase.from('fibre').select('*'),
      ])

      if (!active) return
      if (cat.error) {
        setError('Impossibile caricare le categorie.')
        console.error('[Renova] Categorie error:', cat.error.message)
      } else {
        // L'ordinamento del picker è per macro-categoria (vedi `gruppiCategorie`).
        const ordinate = (cat.data ?? [])
          .slice()
          .sort((a, b) => a.nome.localeCompare(b.nome, 'it')) as CategoriaItem[]
        setCategorie(ordinate)
      }
      if (fib.error) {
        // L'anteprima d'impatto userà comunque i valori salvati dal trigger.
        console.warn('[Renova] Fibre error:', fib.error.message)
      } else {
        const map: Record<string, Fibra> = {}
        for (const f of (fib.data ?? []) as Fibra[]) map[f.codice] = f
        setFibre(map)
      }
      setLoadingCat(false)
    }
    load()
    return () => {
      active = false
    }
  }, [profilo])

  const selezionata = categorie.find((c) => String(c.id) === idCategoria)
  const taglieDisponibili = selezionata ? tagliePer(selezionata.tipo_taglia) : []

  // ── Stima d'impatto a livelli ──────────────────────────────────
  const opzioniMateriale = selezionata?.materiali ?? []
  const opzSelezionata =
    opzioniMateriale.find((o) => o.chiave === materialeChiave) ?? null
  const isTessile =
    !!selezionata?.profilo_default && selezionata?.peso_kg != null
  // Blend usato per la stima: scelta esplicita dell'utente, altrimenti il
  // profilo prudenziale L0 della categoria.
  const blendStima: Composizione | null =
    opzSelezionata?.blend ?? selezionata?.profilo_default ?? null
  const haFibre = Object.keys(fibre).length > 0
  const impattoPreview =
    isTessile && blendStima && haFibre && selezionata?.peso_kg != null
      ? impattoBlend(blendStima, Number(selezionata.peso_kg), fibre)
      : {
          co2: Number(selezionata?.co2_tipico ?? 0),
          acqua: Number(selezionata?.acqua_tipico ?? 0),
        }
  // "Almeno X" finché l'utente non sceglie un materiale specifico (capi tessili).
  const impattoMinimo = isTessile && !opzSelezionata?.blend

  // Al cambio categoria: imposta default logo, prezzo e taglia coerenti.
  function onCategoriaChange(e: ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    setIdCategoria(id)
    const cat = categorie.find((c) => String(c.id) === id)
    if (!cat) return
    setHaLogo(cat.default_ha_logo)
    setPrezzo(cat.richiede_prezzo ? '' : String(valoreRif(cat)))
    setTaglia(cat.tipo_taglia === 'unica' ? 'Unica' : '')
    // Se la categoria chiede il materiale (tap L0+1), parte da "Non lo so" (L0).
    setMaterialeChiave(cat.materiali?.length ? CHIAVE_NON_SO : '')
  }

  // ── Gestione foto multiple (max 3) ──
  function onAddFiles(e: ChangeEvent<HTMLInputElement>) {
    const nuovi = Array.from(e.target.files ?? [])
    if (nuovi.length === 0) return
    setFoto((prev) => {
      const spazio = MAX_FOTO - prev.length
      const daAggiungere = nuovi.slice(0, spazio).map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }))
      return [...prev, ...daAggiungere]
    })
    e.target.value = '' // consente di ricaricare lo stesso file
  }

  function removeFoto(i: number) {
    setFoto((prev) => {
      URL.revokeObjectURL(prev[i].url)
      return prev.filter((_, j) => j !== i)
    })
  }

  // ── Foto etichetta (facoltativa, una sola) ──
  function onAddEtichetta(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoEtichetta((prev) => {
      if (prev) URL.revokeObjectURL(prev.url)
      return { file, url: URL.createObjectURL(file) }
    })
    e.target.value = ''
  }

  function removeEtichetta() {
    setFotoEtichetta((prev) => {
      if (prev) URL.revokeObjectURL(prev.url)
      return null
    })
  }

  async function uploadUna(file: File): Promise<string | null> {
    if (!session) return null
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${session.user.id}/${crypto.randomUUID()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false })
    if (upErr) {
      console.warn('[Renova] Upload foto non riuscito, uso placeholder:', upErr.message)
      return null
    }
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
    return data.publicUrl
  }

  // Tutti i campi sono obbligatori; il prezzo solo per le categorie che lo
  // richiedono (le altre lo impostano automaticamente).
  const prezzoValido = selezionata
    ? !selezionata.richiede_prezzo || Number(prezzo) > 0
    : false
  const formValido =
    foto.length > 0 &&
    !!titolo.trim() &&
    !!idCategoria &&
    !!taglia &&
    !!condizione &&
    prezzoValido

  // Valore economico risparmiato: input utente se manuale, altrimenti valore rif.
  const risparmioEconomico = selezionata
    ? selezionata.richiede_prezzo
      ? Number(prezzo) || 0
      : valoreRif(selezionata)
    : 0

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!session || !selezionata || !formValido) return
    setError('')
    setSubmitting(true)
    try {
      const urls = (await Promise.all(foto.map((f) => uploadUna(f.file)))).filter(
        (u): u is string => !!u,
      )

      // Foto etichetta (facoltativa) — best-effort, non blocca la creazione.
      const etichettaUrl = fotoEtichetta
        ? await uploadUna(fotoEtichetta.file)
        : null

      const prezzoFinale = selezionata.richiede_prezzo
        ? Number(prezzo) || 0
        : valoreRif(selezionata)

      // Materiale: inviamo la composizione SOLO se l'utente ha scelto un
      // materiale specifico (L0+1). Con "Non lo so" o categoria non tessile la
      // lasciamo null → il trigger applica il profilo prudenziale (L0).
      const composizione = opzSelezionata?.blend ?? null
      const fonteImpatto = composizione ? 'utente' : 'categoria'

      // id_societa, sport, co2 e acqua NON vengono inviati: li impostano i
      // trigger lato DB (contesto utente + calcolo dell'impatto).
      const { error: insErr } = await supabase.from('articoli').insert({
        titolo: titolo.trim(),
        taglia,
        condizione,
        foto_url: urls[0] ?? null, // copertina
        foto_urls: urls,
        foto_etichetta_url: etichettaUrl,
        id_categoria: Number(idCategoria),
        prezzo: prezzoFinale,
        ha_logo_societa: haLogo,
        composizione,
        fonte_impatto: fonteImpatto,
        id_utente: session.user.id,
        stato: 'Disponibile',
      })
      if (insErr) throw new Error(insErr.message)

      navigate('/', { replace: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? `Errore nel salvataggio: ${err.message}`
          : 'Errore nel salvataggio',
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Categorie raggruppate per macro-categoria, nell'ordine del picker. Le voci
  // dentro ogni gruppo sono già ordinate per nome (vedi caricamento sopra).
  const gruppiCategorie = MACRO_CATEGORIE_ORDINE.map((macro) => ({
    macro,
    items: categorie.filter((c) => c.macro_categoria === macro),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="-mt-1">
      {/* Intestazione editoriale — occhiello + titolone, regola nera netta */}
      <header className="-mx-4 flex flex-col gap-1.5 border-b-[1.5px] border-ink px-5 pb-4">
        <span className="eyebrow">Rimetti in circolo</span>
        <h1 className="text-[34px] font-extrabold leading-[0.95] tracking-[-0.03em] text-ink">
          Aggiungi un articolo
        </h1>
        <p className="text-sm text-ink-soft">
          Materiale di <span className="font-semibold text-ink">{profilo?.sport}</span>{' '}
          · {profilo?.societa.nome}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5 pt-5">
        {error && <ErrorBanner message={error} />}

        {/* Foto (obbligatoria, fino a 3) */}
        <div>
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
            Foto * <span className="font-semibold text-ink-faint">(fino a 3)</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {foto.map((f, i) => (
              <div
                key={f.url}
                className="relative h-20 w-20 overflow-hidden rounded-lg border border-edge"
              >
                <img src={f.url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-ink py-0.5 text-center text-[9px] font-bold uppercase tracking-[0.06em] text-white">
                    Copertina
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeFoto(i)}
                  aria-label="Rimuovi foto"
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-xs font-bold text-white"
                >
                  ×
                </button>
              </div>
            ))}

            {foto.length < MAX_FOTO && (
              <label className="foto-stripe flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-ink/25 text-center transition hover:border-eco">
                <span className="text-lg leading-none text-eco-700">＋</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.04em] text-eco-700">
                  {foto.length === 0 ? 'Carica' : 'Aggiungi'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={onAddFiles}
                />
              </label>
            )}
          </div>
          <p className="mt-1.5 text-xs text-ink-soft">
            JPG o PNG. Almeno una foto è obbligatoria; la prima è la copertina.
          </p>
        </div>

        <TextField
          label="Titolo *"
          required
          maxLength={80}
          value={titolo}
          onChange={(e) => setTitolo(e.target.value)}
          placeholder="es. Scarpe Nike Mercurial — usate 2 volte"
        />

        {/* Categoria del proprio sport (individuali + accessori) */}
        {loadingCat ? (
          <div className="flex items-center gap-2 text-sm text-ink-soft">
            <Spinner className="h-4 w-4 text-eco-600" /> Carico le categorie…
          </div>
        ) : categorie.length === 0 ? (
          <p className="rounded-lg border border-sun/30 bg-sun-50 px-3.5 py-2.5 text-sm text-ink-soft">
            Nessuna categoria disponibile per il tuo sport.
          </p>
        ) : (
          <SelectField
            label="Categoria *"
            required
            value={idCategoria}
            onChange={onCategoriaChange}
            hint="L'impatto ambientale ed economico è assegnato in base alla categoria."
          >
            <option value="" disabled>
              Seleziona una categoria…
            </option>
            {gruppiCategorie.map((g) => (
              <optgroup key={g.macro} label={g.macro}>
                {g.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </optgroup>
            ))}
          </SelectField>
        )}

        {/* Prezzo: solo se la categoria lo richiede (scarpe/guanti/parastinchi).
            Per le altre è impostato automaticamente e non viene mostrato. */}
        {selezionata?.richiede_prezzo && (
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

        {/* Taglia: menù a tendina coerente col tipo di categoria */}
        {selezionata && (
          <SelectField
            label="Taglia *"
            required
            value={taglia}
            onChange={(e) => setTaglia(e.target.value)}
            hint={
              selezionata.tipo_taglia === 'calzatura'
                ? 'Numero EU.'
                : selezionata.tipo_taglia === 'unica'
                  ? 'Questo articolo ha taglia unica.'
                  : 'Dalla taglia bimbo alla taglia adulto.'
            }
          >
            <option value="" disabled>
              Seleziona una taglia…
            </option>
            {taglieDisponibili.map((t) => (
              <option key={t} value={t}>
                {selezionata.tipo_taglia === 'calzatura' ? `EU ${t}` : t}
              </option>
            ))}
          </SelectField>
        )}

        {/* Condizione dell'oggetto */}
        {selezionata && (
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
        )}

        {/* Materiale del capo — alimenta la stima d'impatto (L2 etichetta + L0+1 tap) */}
        {selezionata && opzioniMateriale.length > 0 && (
          <div className="space-y-3 rounded-lg border border-line bg-surface/60 p-4">
            <div>
              <span className="block text-[13px] font-bold uppercase tracking-[0.04em] text-ink">
                Di cosa è fatto?{' '}
                <span className="font-semibold normal-case text-ink-faint">
                  (facoltativo)
                </span>
              </span>
              <span className="mt-0.5 block text-xs text-ink-soft">
                Ci aiuta a stimare meglio l'impatto. Se non lo sai, useremo una
                stima prudenziale.
              </span>
            </div>

            {/* L2 — foto dell'etichetta (facoltativa) */}
            <div className="flex items-center gap-3">
              {fotoEtichetta ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-edge">
                  <img
                    src={fotoEtichetta.url}
                    alt="Etichetta"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeEtichetta}
                    aria-label="Rimuovi foto etichetta"
                    className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="flex h-16 w-16 shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-ink/25 bg-paper text-center transition hover:border-eco">
                  <span className="text-lg leading-none text-eco-700">＋</span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.04em] text-eco-700">
                    Etichetta
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onAddEtichetta}
                  />
                </label>
              )}
              <p className="flex-1 text-xs text-ink-soft">
                Fotografa l'etichetta di composizione: in futuro ci permetterà di
                leggere il materiale con precisione.
              </p>
            </div>

            {/* L0+1 — selezione guidata del materiale */}
            <div className="space-y-1.5">
              {opzioniMateriale.map((o) => {
                const sel = o.chiave === materialeChiave
                return (
                  <button
                    key={o.chiave}
                    type="button"
                    onClick={() => setMaterialeChiave(o.chiave)}
                    className={`flex w-full flex-col items-start rounded-lg border px-3 py-2 text-left transition ${
                      sel
                        ? 'border-eco bg-eco-50 ring-1 ring-eco'
                        : 'border-edge bg-paper hover:border-eco/50'
                    }`}
                  >
                    <span className="text-sm font-semibold text-ink">
                      {o.label}
                    </span>
                    <span className="text-[11px] text-ink-soft">{o.hint}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Toggle logo → decide la visibilità. Default dalla categoria. */}
        {selezionata && (
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
                  {haLogo ? (
                    <>
                      Lo vedranno <strong>solo i membri di {profilo?.societa.nome}</strong>{' '}
                      (stesso codice di accesso).
                    </>
                  ) : (
                    <>
                      Lo vedranno <strong>tutti i praticanti di {profilo?.sport}</strong>{' '}
                      nella tua zona.
                    </>
                  )}
                </span>
              </span>
            </label>
          </div>
        )}

        {/* Riepilogo impatto risparmiato dal riuso: ambiente + economia */}
        {selezionata && (
          <div className="rounded-lg border border-eco-300 bg-eco-50 p-4">
            <p className="eyebrow !text-eco-700">Risparmio vs. acquisto nuovo</p>
            <p className="mb-3 mt-1 text-[11px] text-ink-soft">
              {impattoMinimo
                ? 'Stima prudenziale: il risparmio reale è almeno questo.'
                : 'Stima sul materiale indicato (vedi metodologia).'}
            </p>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
              <EsgBadge
                variante="co2"
                valore={impattoPreview.co2}
                minimo={impattoMinimo}
              />
              <EsgBadge
                variante="acqua"
                valore={impattoPreview.acqua}
                minimo={impattoMinimo}
              />
              <EsgBadge variante="economia" valore={risparmioEconomico} />
            </div>
          </div>
        )}

        <PrimaryButton type="submit" loading={submitting} disabled={!formValido}>
          Pubblica articolo
        </PrimaryButton>
      </form>
    </div>
  )
}
