import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { supabase, STORAGE_BUCKET } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { caricaComuni, cercaComuni, type Comune } from '../lib/comuni'
import { Spinner } from '../components/Spinner'
import { TestataImpostazioni } from '../components/impostazioni'
import {
  TextField,
  PrimaryButton,
  ErrorBanner,
  SuccessBanner,
} from '../components/ui'

const BIO_MAX = 300

/**
 * Impostazioni → Dettaglio profilo: l'identità PUBBLICA dell'utente.
 *  - foto del profilo (ridimensionata lato client, bucket `articoli`);
 *  - nome utente (unico: è ciò che gli altri vedono in chat e scambi);
 *  - «Su di me» facoltativo;
 *  - città di appartenenza dall'elenco nazionale dei comuni (provincia e
 *    regione derivate), per le future aree di scambio limitrofe.
 */
export function ImpostazioniProfilo() {
  const { session, profilo, refreshProfilo } = useAuth()
  const uid = session?.user.id

  const [nomeUtente, setNomeUtente] = useState(profilo?.nome_utente ?? '')
  const [bio, setBio] = useState(profilo?.bio ?? '')
  const [comune, setComune] = useState<Comune | null>(
    profilo?.citta && profilo.provincia && profilo.regione
      ? { nome: profilo.citta, provincia: profilo.provincia, regione: profilo.regione }
      : null,
  )

  // Ricerca comune (elenco caricato in lazy al primo utilizzo)
  const [query, setQuery] = useState('')
  const [risultati, setRisultati] = useState<Comune[]>([])
  const comuniRef = useRef<Comune[] | null>(null)

  const [salvando, setSalvando] = useState(false)
  const [errore, setErrore] = useState('')
  const [fatto, setFatto] = useState(false)

  // Foto profilo (si salva subito, indipendentemente dal form)
  const [caricandoFoto, setCaricandoFoto] = useState(false)
  const [erroreFoto, setErroreFoto] = useState('')

  if (!profilo || !uid) return null

  async function onQueryChange(e: ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    if (!comuniRef.current) comuniRef.current = await caricaComuni()
    setRisultati(cercaComuni(comuniRef.current, q))
  }

  function scegliComune(c: Comune) {
    setComune(c)
    setQuery('')
    setRisultati([])
  }

  async function onFotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !uid) return
    setErroreFoto('')
    setCaricandoFoto(true)
    try {
      const blob = await ridimensionaAvatar(file)
      const path = `${uid}/profilo/avatar-${crypto.randomUUID()}.jpg`
      const { error: upErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, blob, { cacheControl: '3600', contentType: 'image/jpeg' })
      if (upErr) throw new Error(upErr.message)

      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
      const vecchia = profilo?.foto_profilo_url ?? null
      const { error: dbErr } = await supabase
        .from('utenti')
        .update({ foto_profilo_url: data.publicUrl })
        .eq('id', uid)
      if (dbErr) throw new Error(dbErr.message)

      // Best-effort: la vecchia foto non serve più a nessuno.
      const vecchioPath = pathDaUrl(vecchia)
      if (vecchioPath) {
        await supabase.storage.from(STORAGE_BUCKET).remove([vecchioPath])
      }
      await refreshProfilo()
    } catch (err) {
      console.warn('[Renova] Foto profilo non aggiornata:', err)
      setErroreFoto(
        'Impossibile caricare la foto. Riprova con un altro file (JPG o PNG).',
      )
    } finally {
      setCaricandoFoto(false)
    }
  }

  async function handleSalva(e: FormEvent) {
    e.preventDefault()
    setErrore('')
    setFatto(false)
    const nome = nomeUtente.trim()
    if (nome.length < 3 || nome.length > 30) {
      setErrore('Il nome utente deve avere tra 3 e 30 caratteri.')
      return
    }
    setSalvando(true)
    const { error } = await supabase
      .from('utenti')
      .update({
        nome_utente: nome,
        bio: bio.trim() || null,
        citta: comune?.nome ?? null,
        provincia: comune?.provincia ?? null,
        regione: comune?.regione ?? null,
      })
      .eq('id', uid)
    if (error) {
      setErrore(
        error.code === '23505'
          ? 'Questo nome utente è già in uso: scegline un altro.'
          : 'Impossibile salvare le modifiche. Riprova.',
      )
      setSalvando(false)
      return
    }
    await refreshProfilo()
    setSalvando(false)
    setFatto(true)
  }

  const iniziali = (profilo.nome_utente || '?')
    .split(/[\s._-]+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="-mt-1">
      <TestataImpostazioni
        back="/impostazioni"
        backLabel="Impostazioni"
        eyebrow="Impostazioni"
        titolo="Dettaglio profilo"
        descrizione="Come ti presenti agli altri: foto, nome utente, chi sei e dove scambi."
      />

      {/* Foto del profilo */}
      <section className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          {profilo.foto_profilo_url ? (
            <img
              src={profilo.foto_profilo_url}
              alt="Foto del profilo"
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-eco text-2xl font-extrabold text-white">
              {iniziali}
            </div>
          )}
          {caricandoFoto && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/40">
              <Spinner className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <label className="inline-flex cursor-pointer items-center rounded-lg border border-edge bg-paper px-3.5 py-2 text-[12px] font-bold uppercase tracking-[0.06em] text-ink transition hover:border-ink">
            {profilo.foto_profilo_url ? 'Cambia foto' : 'Aggiungi foto'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={caricandoFoto}
              onChange={onFotoChange}
            />
          </label>
          <p className="mt-1.5 text-xs text-ink-soft">
            JPG o PNG. La ritagliamo in tondo e la ridimensioniamo noi.
          </p>
        </div>
      </section>
      {erroreFoto && (
        <div className="mt-3">
          <ErrorBanner message={erroreFoto} />
        </div>
      )}

      {/* Dati pubblici */}
      <form onSubmit={handleSalva} className="mt-6 space-y-4">
        {errore && <ErrorBanner message={errore} />}
        {fatto && <SuccessBanner message="Profilo aggiornato." />}

        <TextField
          label="Nome utente"
          required
          minLength={3}
          maxLength={30}
          value={nomeUtente}
          onChange={(e) => setNomeUtente(e.target.value)}
          placeholder="Come ti vedranno gli altri"
          hint="È il nome che compare in chat, scambi e recensioni. Deve essere unico."
        />

        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
            Su di me
          </span>
          <textarea
            rows={4}
            maxLength={BIO_MAX}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Facoltativo: raccontati in poche righe, per farti conoscere da chi scambia con te."
            className="w-full resize-none rounded-lg border border-edge bg-paper px-3.5 py-3 text-[15px] text-ink outline-none transition placeholder:text-ink-faint focus:border-eco focus:ring-2 focus:ring-eco/25"
          />
          <span className="mt-1 block text-right text-xs text-ink-faint">
            {bio.length}/{BIO_MAX}
          </span>
        </label>

        {/* Città di appartenenza */}
        <div>
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
            Città di appartenenza
          </span>
          {comune ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-edge bg-paper px-3.5 py-3">
              <span className="min-w-0 truncate text-[15px] text-ink">
                <strong className="font-bold">{comune.nome}</strong> ({comune.provincia}) ·{' '}
                {comune.regione}
              </span>
              <button
                type="button"
                onClick={() => setComune(null)}
                className="shrink-0 text-[11px] font-bold uppercase tracking-[0.06em] text-ink-soft transition hover:text-red-600"
              >
                Rimuovi
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={onQueryChange}
                placeholder="Cerca il tuo comune (es. Bologna)"
                className="w-full rounded-lg border border-edge bg-paper px-3.5 py-3 text-[15px] text-ink outline-none transition placeholder:text-ink-faint focus:border-eco focus:ring-2 focus:ring-eco/25"
              />
              {risultati.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-edge bg-paper shadow-lg">
                  {risultati.map((c) => (
                    <li key={`${c.nome}-${c.provincia}`}>
                      <button
                        type="button"
                        onClick={() => scegliComune(c)}
                        className="flex w-full items-baseline justify-between gap-3 px-3.5 py-2.5 text-left transition hover:bg-surface"
                      >
                        <span className="min-w-0 truncate text-[15px] font-semibold text-ink">
                          {c.nome}
                        </span>
                        <span className="shrink-0 text-xs text-ink-soft">
                          {c.provincia} · {c.regione}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <span className="mt-1 block text-xs text-ink-soft">
            Facoltativa: servirà a proporti scambi nella tua zona.
          </span>
        </div>

        <PrimaryButton type="submit" loading={salvando}>
          {salvando ? 'Salvo…' : 'Salva modifiche'}
        </PrimaryButton>
      </form>
    </div>
  )
}

/** Ridimensiona la foto a un quadrato max 512px e la converte in JPEG. */
async function ridimensionaAvatar(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Immagine non leggibile'))
      el.src = url
    })
    const lato = Math.min(img.width, img.height, 512)
    const minOrig = Math.min(img.width, img.height)
    const sx = (img.width - minOrig) / 2
    const sy = (img.height - minOrig) / 2
    const canvas = document.createElement('canvas')
    canvas.width = lato
    canvas.height = lato
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas non disponibile')
    ctx.drawImage(img, sx, sy, minOrig, minOrig, 0, 0, lato, lato)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Conversione fallita'))),
        'image/jpeg',
        0.85,
      )
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Ricava il path nel bucket dalla public URL di Storage (null se estraneo). */
function pathDaUrl(url: string | null): string | null {
  if (!url) return null
  const marcatore = `/object/public/${STORAGE_BUCKET}/`
  const i = url.indexOf(marcatore)
  return i === -1 ? null : decodeURIComponent(url.slice(i + marcatore.length))
}
