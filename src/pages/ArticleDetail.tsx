import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase, STORAGE_BUCKET } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Articolo, CategoriaItem } from '../lib/database.types'
import { EsgBadge } from '../components/EsgBadge'
import { StatoBadge } from '../components/StatoBadge'
import { GestioneStato } from '../components/GestioneStato'
import { PLACEHOLDER_FOTO, formatComposizione } from '../lib/format'
import { FullScreenSpinner } from '../components/Spinner'

/** Articolo + categoria (nome/tipo/metodologia) per la pagina di dettaglio.
 *  L'impatto (co2/acqua), la composizione e la provenienza sono sull'articolo. */
interface ArticoloDettaglio extends Articolo {
  categoria: Pick<CategoriaItem, 'nome' | 'tipo' | 'fonte'>
}

/** Post dedicato a un singolo articolo, aperto dal feed. */
export function ArticleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()

  const [articolo, setArticolo] = useState<ArticoloDettaglio | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fotoAttiva, setFotoAttiva] = useState(0)

  // Avvio chat (solo per chi è interessato, non il proprietario)
  const [avviandoChat, setAvviandoChat] = useState(false)
  const [erroreChat, setErroreChat] = useState('')

  // Eliminazione (solo per il proprietario)
  const [confermaElimina, setConfermaElimina] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [erroreElimina, setErroreElimina] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      const { data, error } = await supabase
        .from('articoli')
        .select(
          `id, titolo, taglia, condizione, foto_url, foto_urls, stato, id_categoria,
           prezzo, ha_logo_societa, id_societa, sport, id_utente, created_at,
           co2, acqua, fonte_impatto, composizione, foto_etichetta_url,
           categoria:categorie_item!inner ( nome, tipo, fonte )`,
        )
        .eq('id', Number(id))
        .maybeSingle()

      if (!active) return
      if (error) {
        setError('Impossibile caricare l’articolo. Riprova.')
        console.error('[Renova] Dettaglio error:', error.message)
      } else if (!data) {
        setError('Articolo non trovato o non più visibile.')
      } else {
        setArticolo(data as unknown as ArticoloDettaglio)
        setFotoAttiva(0)
      }
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [id])

  // Galleria: usa foto_urls, con fallback alla copertina e poi al placeholder.
  const foto = useMemo(() => {
    if (!articolo) return [] as string[]
    if (articolo.foto_urls?.length) return articolo.foto_urls
    if (articolo.foto_url) return [articolo.foto_url]
    return [PLACEHOLDER_FOTO]
  }, [articolo])

  // Solo chi ha caricato l'articolo può eliminarlo (la RLS lo impone comunque
  // lato DB: policy "articoli: delete proprio").
  const isProprietario =
    !!session && !!articolo && session.user.id === articolo.id_utente

  // Apre (o riapre) la chat con il proprietario tramite la RPC idempotente:
  // una sola conversazione per coppia (articolo, utente interessato).
  async function handleChiediInfo() {
    if (!articolo || isProprietario) return
    setAvviandoChat(true)
    setErroreChat('')
    const { data, error } = await supabase.rpc('inizia_conversazione', {
      p_id_articolo: articolo.id,
    })
    if (error) {
      setErroreChat('Impossibile avviare la chat. Riprova.')
      console.error('[Renova] inizia_conversazione error:', error.message)
      setAvviandoChat(false)
      return
    }
    navigate(`/chat/${data as number}`)
  }

  async function handleElimina() {
    if (!articolo || !isProprietario) return
    setEliminando(true)
    setErroreElimina('')
    try {
      const { error } = await supabase
        .from('articoli')
        .delete()
        .eq('id', articolo.id)
      if (error) throw new Error(error.message)

      // Pulizia best-effort delle foto nello storage (non blocca l'esito).
      const marker = `/${STORAGE_BUCKET}/`
      const paths = (articolo.foto_urls ?? [])
        .map((u) => {
          const i = u.indexOf(marker)
          return i === -1 ? null : decodeURIComponent(u.slice(i + marker.length))
        })
        .filter((p): p is string => !!p)
      if (paths.length) {
        await supabase.storage.from(STORAGE_BUCKET).remove(paths)
      }

      navigate('/', { replace: true })
    } catch (err) {
      setErroreElimina(
        err instanceof Error
          ? `Impossibile eliminare l’articolo: ${err.message}`
          : 'Impossibile eliminare l’articolo.',
      )
      setEliminando(false)
    }
  }

  if (loading) return <FullScreenSpinner />

  if (error || !articolo) {
    return (
      <div className="space-y-4">
        <BackLink onClick={() => navigate(-1)} />
        <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error || 'Articolo non trovato.'}
        </p>
      </div>
    )
  }

  const { categoria } = articolo

  // Livello di affidabilità della stima d'impatto, con nomi pensati per
  // l'utente (L2 = c'è la foto dell'etichetta; L1 = materiale indicato dal
  // venditore; L0 = non specificato → valore minimo prudenziale «almeno»).
  const livello =
    articolo.fonte_impatto === 'etichetta' || articolo.foto_etichetta_url
      ? {
          tag: 'L2',
          nome: 'Stima verificata',
          pill: 'bg-eco-50 text-eco-700 ring-eco/30',
          dot: 'bg-eco',
          desc: "C'è la foto dell'etichetta di composizione: è l'informazione più affidabile sul materiale.",
        }
      : articolo.fonte_impatto === 'utente'
        ? {
            tag: 'L1',
            nome: 'Stima guidata',
            pill: 'bg-sun-50 text-sun-600 ring-sun/40',
            dot: 'bg-sun',
            desc: 'Il venditore ha indicato il materiale del capo.',
          }
        : {
            tag: 'L0',
            nome: 'Stima prudenziale',
            pill: 'bg-surface text-ink-soft ring-black/10',
            dot: 'bg-ink-soft/50',
            desc: 'Materiale non specificato: usiamo il valore minimo della categoria, perciò «almeno».',
          }
  // Mostriamo «≥» solo quando il numero è davvero il pavimento prudenziale (L0).
  const impattoMinimo = livello.tag === 'L0'

  return (
    <div className="space-y-4">
      <BackLink onClick={() => navigate(-1)} />

      {/* Galleria foto */}
      <div className="-mx-4 border-y border-line">
        <div className="foto-stripe relative aspect-square">
          <img
            src={foto[fotoAttiva] || PLACEHOLDER_FOTO}
            alt={articolo.titolo}
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).src = PLACEHOLDER_FOTO
            }}
            className="h-full w-full object-cover"
          />
          <div className="absolute left-3 top-3">
            <StatoBadge stato={articolo.stato} />
          </div>
        </div>

        {foto.length > 1 && (
          <div className="flex gap-2 overflow-x-auto border-t border-line px-4 py-3">
            {foto.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setFotoAttiva(i)}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  i === fotoAttiva ? 'border-eco' : 'border-line'
                }`}
              >
                <img
                  src={src}
                  alt={`Foto ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info principali */}
      <section className="space-y-3 pt-1">
        <h1 className="text-2xl font-extrabold leading-tight tracking-[-0.03em] text-ink">
          {articolo.titolo}
        </h1>

        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
          <span className="border border-edge px-2 py-1">{categoria.nome}</span>
          {articolo.taglia && (
            <span className="border border-edge px-2 py-1">
              Taglia {articolo.taglia}
            </span>
          )}
          {articolo.condizione && (
            <span className="border border-edge px-2 py-1">
              {articolo.condizione}
            </span>
          )}
          <span className="border border-edge px-2 py-1">
            {articolo.ha_logo_societa ? 'Capo societario' : 'Feed pubblico'}
          </span>
        </div>
      </section>

      {/* Azione: chi è interessato avvia la chat con il proprietario */}
      {!isProprietario && (
        <section className="space-y-2">
          {erroreChat && (
            <p className="border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {erroreChat}
            </p>
          )}
          <button
            type="button"
            onClick={handleChiediInfo}
            disabled={avviandoChat || articolo.stato === 'Scambiato'}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-eco px-4 py-3 text-[13px] font-bold uppercase tracking-[0.06em] text-white shadow-sm transition hover:bg-eco-600 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 0 1-.9-3.8A8.38 8.38 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {avviandoChat
              ? 'Apro la chat…'
              : articolo.stato === 'Scambiato'
                ? 'Articolo già scambiato'
                : 'Chiedi informazioni'}
          </button>
          {articolo.stato === 'Prenotato' && (
            <p className="text-center text-xs text-ink-soft">
              Questo articolo è già stato prenotato, ma puoi comunque scrivere al
              proprietario.
            </p>
          )}
        </section>
      )}

      {/* Gestione disponibilità — solo per il proprietario */}
      {isProprietario && (
        <GestioneStato
          idArticolo={articolo.id}
          stato={articolo.stato}
          onChange={(nuovo) =>
            setArticolo((prev) => (prev ? { ...prev, stato: nuovo } : prev))
          }
        />
      )}

      {/* Impatto del riuso */}
      <section className="space-y-3 rounded-lg border border-eco-300 bg-eco-50 p-4">
        <h2 className="eyebrow !text-eco-700">
          Impatto del riuso rispetto al nuovo
        </h2>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
          <EsgBadge variante="co2" valore={Number(articolo.co2)} minimo={impattoMinimo} />
          <EsgBadge variante="acqua" valore={Number(articolo.acqua)} minimo={impattoMinimo} />
          <EsgBadge variante="economia" valore={Number(articolo.prezzo)} />
        </div>

        {impattoMinimo && (
          <p className="text-[11px] leading-relaxed text-ink-soft">
            <span className="font-semibold text-ink">≥</span> significa{' '}
            <span className="font-semibold text-ink">«almeno»</span>: è una stima
            prudenziale, il risparmio reale è almeno questo.
          </p>
        )}

        {/* Livello di affidabilità della stima (trasparenza anti-greenwashing) */}
        <div className="rounded-lg border border-line bg-paper p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Affidabilità della stima
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${livello.pill}`}
            >
              <span className={`h-2 w-2 rounded-full ${livello.dot}`} />
              {livello.nome}
            </span>
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-ink-soft">
            {livello.desc}
            {articolo.composizione && (
              <>
                {' '}
                Materiale:{' '}
                <span className="font-medium text-ink">
                  {formatComposizione(articolo.composizione)}
                </span>
                .
              </>
            )}
          </p>
        </div>

        <p className="text-[11px] leading-relaxed text-ink-soft">
          <span className="font-medium text-ink">Come si calcola:</span> per ogni
          fibra del capo prendiamo il suo impatto (CO₂ e acqua per kg), ne facciamo
          la <span className="font-medium text-ink">media pesata</span> secondo le
          percentuali di composizione e moltiplichiamo per il peso del capo. È una
          stima <span className="font-medium text-ink">cradle-to-gate di fibra</span>:
          copre solo la produzione della fibra — dall'estrazione o coltivazione fino
          alla fibra pronta — ed esclude filatura, tessitura, tintura e confezione del
          capo, oltre a trasporto, uso e fine vita. È quindi una sottostima prudente.
          Metodo completo e criteri anti-greenwashing nella{' '}
          <Link to="/impatto" className="font-semibold text-eco-700 hover:underline">
            sezione Impatto
          </Link>
          .
        </p>
      </section>

      {/* Eliminazione — solo per il proprietario dell'articolo */}
      {isProprietario && (
        <section className="space-y-3 border-t border-line pt-4">
          {erroreElimina && (
            <p className="border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {erroreElimina}
            </p>
          )}

          {!confermaElimina ? (
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/articolo/${articolo.id}/modifica`}
                className="inline-flex items-center gap-2 rounded-lg border border-edge px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.04em] text-ink transition hover:border-ink"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Modifica
              </Link>
              <button
                type="button"
                onClick={() => setConfermaElimina(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.04em] text-red-700 transition hover:bg-red-100"
              >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
                Elimina articolo
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-ink">
                Eliminare definitivamente questo articolo dal feed?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleElimina}
                  disabled={eliminando}
                  className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.04em] text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {eliminando ? 'Elimino…' : 'Sì, elimina'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfermaElimina(false)}
                  disabled={eliminando}
                  className="inline-flex items-center justify-center rounded-lg border border-edge px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.04em] text-ink transition hover:border-ink disabled:opacity-60"
                >
                  Annulla
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex items-center gap-3">
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
      <Link to="/feed" className="text-sm font-semibold text-eco-700 hover:underline">
        Marketplace
      </Link>
    </div>
  )
}
