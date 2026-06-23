import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase, STORAGE_BUCKET } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type {
  ConversazioneConArticolo,
  Messaggio,
  StatoArticolo,
} from '../lib/database.types'
import { GestioneStato } from '../components/GestioneStato'
import { RecensioneScambio } from '../components/RecensioneScambio'
import { FullScreenSpinner, Spinner } from '../components/Spinner'
import {
  PLACEHOLDER_FOTO,
  formatOraMessaggio,
  formatGiornoMessaggio,
} from '../lib/format'

/** Thread di una singola conversazione + gestione stato per il proprietario. */
export function Conversation() {
  const { id } = useParams<{ id: string }>()
  const convId = Number(id)
  const navigate = useNavigate()
  const { session } = useAuth()
  const userId = session?.user.id

  const [conv, setConv] = useState<ConversazioneConArticolo | null>(null)
  const [messaggi, setMessaggi] = useState<Messaggio[]>([])
  const [scambioId, setScambioId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [bozza, setBozza] = useState('')
  const [inviando, setInviando] = useState(false)
  const [caricandoFoto, setCaricandoFoto] = useState(false)
  const [erroreInvio, setErroreInvio] = useState('')

  const fondoRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const sonoProprietario = !!conv && conv.id_proprietario === userId
  const controparte = conv
    ? sonoProprietario
      ? conv.nome_acquirente
      : conv.nome_proprietario
    : ''

  // Segna la conversazione come letta per il lato corrente.
  // NB: il builder di supabase-js è "lazy" → serve .then() (o await) perché
  // la richiesta parta davvero.
  const segnaLetto = useCallback(() => {
    if (!Number.isFinite(convId)) return
    supabase.rpc('segna_letto', { p_conv: convId }).then(({ error }) => {
      if (error) console.error('[Renova] segna_letto error:', error.message)
    })
  }, [convId])

  // Caricamento iniziale: conversazione (+ articolo) e messaggi.
  useEffect(() => {
    if (!Number.isFinite(convId)) {
      setError('Conversazione non valida.')
      setLoading(false)
      return
    }
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      const [{ data: c, error: ec }, { data: m, error: em }] = await Promise.all([
        supabase
          .from('conversazioni')
          .select(
            `id, id_articolo, id_proprietario, id_acquirente, nome_proprietario,
             nome_acquirente, letto_proprietario, letto_acquirente, created_at, updated_at,
             articolo:articoli ( id, titolo, foto_url, foto_urls, stato )`,
          )
          .eq('id', convId)
          .maybeSingle(),
        supabase
          .from('messaggi')
          .select('id, id_conversazione, id_mittente, testo, foto_url, created_at')
          .eq('id_conversazione', convId)
          .order('created_at', { ascending: true }),
      ])

      if (!active) return
      if (ec || em) {
        setError('Impossibile caricare la conversazione. Riprova.')
        console.error('[Renova] Conversazione error:', ec?.message || em?.message)
      } else if (!c) {
        setError('Conversazione non trovata.')
      } else {
        setConv(c as unknown as ConversazioneConArticolo)
        setMessaggi((m ?? []) as unknown as Messaggio[])
        segnaLetto()
      }
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [convId, segnaLetto])

  // Se l'articolo è già scambiato, recupera lo scambio per abilitare la
  // recensione reciproca — ma solo se lo scambio riguarda QUESTA controparte
  // (il proprietario potrebbe averlo concluso con un altro interessato).
  useEffect(() => {
    const idArticolo = conv?.id_articolo
    const idAcquirente = conv?.id_acquirente
    if (!idArticolo || conv?.articolo?.stato !== 'Scambiato') {
      setScambioId(null)
      return
    }
    let active = true
    supabase
      .from('scambi')
      .select('id, id_acquirente')
      .eq('id_articolo', idArticolo)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          console.error('[Renova] scambio chat error:', error.message)
          return
        }
        setScambioId(data && data.id_acquirente === idAcquirente ? data.id : null)
      })
    return () => {
      active = false
    }
  }, [conv?.id_articolo, conv?.id_acquirente, conv?.articolo?.stato])

  // Realtime: nuovi messaggi della conversazione.
  useEffect(() => {
    if (!Number.isFinite(convId)) return
    const channel = supabase
      .channel(`conv-${convId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messaggi',
          filter: `id_conversazione=eq.${convId}`,
        },
        (payload) => {
          const nuovo = payload.new as Messaggio
          setMessaggi((prev) =>
            prev.some((x) => x.id === nuovo.id) ? prev : [...prev, nuovo],
          )
          segnaLetto()
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [convId, segnaLetto])

  // Scrolla in fondo a ogni nuovo messaggio.
  useEffect(() => {
    fondoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messaggi.length])

  async function invia(e: React.FormEvent) {
    e.preventDefault()
    const testo = bozza.trim()
    if (!testo || inviando || !userId) return
    setInviando(true)
    setErroreInvio('')
    const { data, error } = await supabase
      .from('messaggi')
      .insert({ id_conversazione: convId, id_mittente: userId, testo })
      .select('id, id_conversazione, id_mittente, testo, foto_url, created_at')
      .single()
    setInviando(false)
    if (error) {
      setErroreInvio('Messaggio non inviato. Riprova.')
      console.error('[Renova] Invio messaggio error:', error.message)
      return
    }
    setBozza('')
    aggiungiMessaggio(data as unknown as Messaggio)
  }

  // Aggiunge un messaggio in coda (deduplicando) e rimarca letto per me:
  // il mio stesso invio fa "bump" della conversazione.
  function aggiungiMessaggio(nuovo: Messaggio) {
    setMessaggi((prev) =>
      prev.some((x) => x.id === nuovo.id) ? prev : [...prev, nuovo],
    )
    segnaLetto()
  }

  // Invio di una foto: upload nel bucket (cartella dell'utente, come da policy
  // storage) e poi inserimento del messaggio con `foto_url`.
  async function onFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // consente di reinviare lo stesso file
    if (!file || !userId || caricandoFoto) return
    setCaricandoFoto(true)
    setErroreInvio('')
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${userId}/chat/${convId}/${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (upErr) throw new Error(upErr.message)

      const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
      const { data, error } = await supabase
        .from('messaggi')
        .insert({
          id_conversazione: convId,
          id_mittente: userId,
          foto_url: pub.publicUrl,
        })
        .select('id, id_conversazione, id_mittente, testo, foto_url, created_at')
        .single()
      if (error) throw new Error(error.message)
      aggiungiMessaggio(data as unknown as Messaggio)
    } catch (err) {
      setErroreInvio('Foto non inviata. Riprova.')
      console.error(
        '[Renova] Invio foto error:',
        err instanceof Error ? err.message : err,
      )
    } finally {
      setCaricandoFoto(false)
    }
  }

  // Raggruppa i messaggi per giornata, per i separatori.
  const gruppi = useMemo(() => {
    const out: Array<{ giorno: string; voci: Messaggio[] }> = []
    for (const m of messaggi) {
      const giorno = formatGiornoMessaggio(m.created_at)
      const ultimo = out[out.length - 1]
      if (ultimo && ultimo.giorno === giorno) ultimo.voci.push(m)
      else out.push({ giorno, voci: [m] })
    }
    return out
  }, [messaggi])

  if (loading) return <FullScreenSpinner />

  if (error || !conv) {
    return (
      <div className="space-y-4">
        <BackLink onClick={() => navigate('/chat')} />
        <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error || 'Conversazione non trovata.'}
        </p>
      </div>
    )
  }

  const articolo = conv.articolo
  const cover = articolo?.foto_urls?.[0] || articolo?.foto_url || PLACEHOLDER_FOTO

  return (
    // pb extra: lascia spazio sotto all'ultimo messaggio per la barra di invio
    // fissa (vedi sotto), così non resta nascosto dietro di essa.
    <div className="space-y-4 pb-9">
      <BackLink onClick={() => navigate('/chat')} />

      {/* Intestazione: articolo + controparte. L'intera card è cliccabile e
          rimanda alla scheda dell'articolo (se ancora disponibile). */}
      {(() => {
        const intestazione = (
          <>
            <img
              src={cover}
              alt=""
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).src = PLACEHOLDER_FOTO
              }}
              className="h-12 w-12 shrink-0 rounded-lg border border-line object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold tracking-[-0.01em] text-ink">
                {articolo?.titolo ?? 'Articolo non più disponibile'}
              </p>
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
                {sonoProprietario ? 'Richiesta da' : 'Con'} {controparte}
              </p>
            </div>
            {articolo && (
              <span className="shrink-0 border border-edge px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-ink-soft transition group-hover:border-ink group-hover:text-ink">
                Articolo
              </span>
            )}
          </>
        )
        return articolo ? (
          <Link
            to={`/articolo/${articolo.id}`}
            className="group -mx-4 flex items-center gap-3 border-b border-line px-5 py-3 transition hover:bg-surface"
          >
            {intestazione}
          </Link>
        ) : (
          <div className="-mx-4 flex items-center gap-3 border-b border-line px-5 py-3">
            {intestazione}
          </div>
        )
      })()}

      {/* Gestione stato (solo proprietario) */}
      {sonoProprietario && articolo && (
        <GestioneStato
          idArticolo={articolo.id}
          stato={articolo.stato}
          acquirentePredefinito={{
            id: conv.id_acquirente,
            nome: conv.nome_acquirente,
          }}
          onChange={(nuovo: StatoArticolo) =>
            setConv((prev) =>
              prev && prev.articolo
                ? { ...prev, articolo: { ...prev.articolo, stato: nuovo } }
                : prev,
            )
          }
          onScambioRegistrato={(id) => setScambioId(id)}
        />
      )}

      {/* Recensione reciproca dopo uno scambio concluso con questa controparte */}
      {scambioId !== null && (
        <div className="rounded-lg border border-line bg-paper p-4">
          <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[0.04em] text-ink">
            Com'è andato lo scambio?
          </h2>
          <RecensioneScambio
            scambioId={scambioId}
            controparteNome={controparte}
          />
        </div>
      )}

      {/* Thread */}
      <div className="space-y-3">
        {messaggi.length === 0 ? (
          <p className="border border-line bg-paper px-4 py-6 text-center text-sm leading-relaxed text-ink-soft">
            {sonoProprietario
              ? `${controparte} è interessato a questo articolo. Rispondi per organizzare lo scambio.`
              : 'Scrivi un messaggio per chiedere informazioni al proprietario.'}
          </p>
        ) : (
          gruppi.map((g) => (
            <div key={g.giorno} className="space-y-1.5">
              <div className="flex justify-center">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-faint">
                  {g.giorno}
                </span>
              </div>
              {g.voci.map((m) => {
                const mio = m.id_mittente === userId
                return (
                  <div
                    key={m.id}
                    className={`flex ${mio ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[78%] overflow-hidden rounded-2xl text-sm ${
                        mio
                          ? 'rounded-br-sm bg-eco text-white'
                          : 'rounded-bl-sm border border-line bg-paper text-ink'
                      }`}
                    >
                      {m.foto_url && (
                        <a
                          href={m.foto_url}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          <img
                            src={m.foto_url}
                            alt="Foto"
                            loading="lazy"
                            className="max-h-64 w-full object-cover"
                          />
                        </a>
                      )}
                      <div className="px-3.5 py-2">
                        {m.testo && (
                          <p className="whitespace-pre-wrap break-words">{m.testo}</p>
                        )}
                        <p
                          className={`text-right text-[10px] ${
                            m.testo ? 'mt-0.5' : ''
                          } ${mio ? 'text-white/70' : 'text-ink-faint'}`}
                        >
                          {formatOraMessaggio(m.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={fondoRef} />
      </div>

      {/* Barra di invio: FISSA subito sopra la bottom-nav, sempre a fondo schermo
          a prescindere dalla lunghezza della conversazione. Il pb (nav + safe-area)
          la solleva appena sopra il bottone "+" flottante; lo sfondo opaco copre lo
          spazio fino alla nav così i messaggi non si intravedono mentre si scorre. */}
      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-2xl bg-surface px-4 pt-2 pb-[calc(72px+env(safe-area-inset-bottom))]">
        {erroreInvio && (
          <p className="mb-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {erroreInvio}
          </p>
        )}
        <form
          onSubmit={invia}
          className="flex items-end gap-2 rounded-xl border border-edge bg-paper p-2"
        >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFoto}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={caricandoFoto}
          aria-label="Allega una foto"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-ink-soft transition hover:bg-black/5 hover:text-ink disabled:opacity-40"
        >
          {caricandoFoto ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
              <circle cx="8.5" cy="10" r="1.5" fill="currentColor" />
              <path
                d="m4 17 4.5-4.5a2 2 0 0 1 2.8 0L16 17m-2-3 1.5-1.5a2 2 0 0 1 2.8 0L21 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
        <textarea
          value={bozza}
          onChange={(e) => setBozza(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              invia(e)
            }
          }}
          rows={1}
          placeholder="Scrivi un messaggio…"
          aria-label="Scrivi un messaggio"
          className="max-h-32 flex-1 resize-none rounded-lg bg-surface px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-eco/30"
        />
        <button
          type="submit"
          disabled={inviando || bozza.trim() === ''}
          aria-label="Invia"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-eco text-white transition hover:bg-eco-600 disabled:opacity-40"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 12l14-7-7 14-2-5-5-2z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </button>
        </form>
      </div>
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
      Chat
    </button>
  )
}
