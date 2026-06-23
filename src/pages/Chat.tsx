import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { ConversazioneConArticolo } from '../lib/database.types'
import { StatoBadge } from '../components/StatoBadge'
import { FullScreenSpinner } from '../components/Spinner'
import { PLACEHOLDER_FOTO, formatOraChat } from '../lib/format'

/** È non letta per ME se è stata aggiornata dopo la mia ultima apertura. */
export function isNonLetta(
  c: ConversazioneConArticolo,
  userId: string | undefined,
): boolean {
  if (!userId) return false
  const sonoProprietario = c.id_proprietario === userId
  const letto = sonoProprietario ? c.letto_proprietario : c.letto_acquirente
  if (!letto) return true
  return new Date(c.updated_at).getTime() > new Date(letto).getTime()
}

/** Copertina dell'articolo legato alla conversazione. */
function copertina(c: ConversazioneConArticolo): string {
  const a = c.articolo
  if (!a) return PLACEHOLDER_FOTO
  if (a.foto_urls?.length) return a.foto_urls[0]
  return a.foto_url || PLACEHOLDER_FOTO
}

/** Sezione "Chat": elenco di tutte le conversazioni dell'utente. */
export function Chat() {
  const { session } = useAuth()
  const userId = session?.user.id

  const [conversazioni, setConversazioni] = useState<ConversazioneConArticolo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    const { data, error } = await supabase
      .from('conversazioni')
      .select(
        `id, id_articolo, id_proprietario, id_acquirente, nome_proprietario,
         nome_acquirente, letto_proprietario, letto_acquirente, created_at, updated_at,
         articolo:articoli ( id, titolo, foto_url, foto_urls, stato )`,
      )
      .order('updated_at', { ascending: false })

    if (error) {
      setError('Impossibile caricare le chat. Riprova.')
      console.error('[Renova] Chat list error:', error.message)
    } else {
      setConversazioni((data ?? []) as unknown as ConversazioneConArticolo[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    // Aggiornamento in tempo reale: una nuova chat o un nuovo messaggio
    // (che fa "bump" della conversazione) ricarica la lista.
    const channel = supabase
      .channel('chat-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversazioni' },
        () => load(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  if (loading) return <FullScreenSpinner />

  return (
    <div className="-mt-1">
      {/* Intestazione editoriale — occhiello + titolone, regola nera netta */}
      <div className="-mx-4 flex flex-col gap-1.5 border-b-[1.5px] border-ink px-5 pb-4">
        <span className="eyebrow">Le tue conversazioni</span>
        <h1 className="text-[42px] font-extrabold leading-[0.95] tracking-[-0.03em] text-ink">
          Chat
        </h1>
      </div>

      {error && (
        <p className="mt-4 border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      {conversazioni.length === 0 ? (
        <div className="mt-10 border-y border-line px-6 py-14 text-center">
          <h3 className="text-xl font-extrabold tracking-[-0.03em] text-ink">
            Nessuna chat
          </h3>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
            Apri un articolo dal marketplace e tocca “Chiedi informazioni” per
            iniziare a parlare con il proprietario.
          </p>
          <Link
            to="/feed"
            className="mt-5 inline-flex bg-eco px-5 py-3 text-[13px] font-bold uppercase tracking-[0.06em] text-white transition active:scale-[.99]"
          >
            Vai al marketplace
          </Link>
        </div>
      ) : (
        <ul className="-mx-4 border-b border-line">
          {conversazioni.map((c) => {
            const sonoProprietario = c.id_proprietario === userId
            const controparte = sonoProprietario
              ? c.nome_acquirente
              : c.nome_proprietario
            const nonLetta = isNonLetta(c, userId)
            return (
              <li key={c.id} className="border-t border-line first:border-t-0">
                <Link
                  to={`/chat/${c.id}`}
                  className="flex items-center gap-3.5 px-5 py-3.5 transition hover:bg-surface"
                >
                  <img
                    src={copertina(c)}
                    alt=""
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).src = PLACEHOLDER_FOTO
                    }}
                    className="h-14 w-14 shrink-0 rounded-lg border border-line object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-[15px] tracking-[-0.01em] text-ink ${
                          nonLetta ? 'font-extrabold' : 'font-bold'
                        }`}
                      >
                        {c.articolo?.titolo ?? 'Articolo non più disponibile'}
                      </p>
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-faint">
                        {formatOraChat(c.updated_at)}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="truncate text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
                        {sonoProprietario ? 'Da' : 'Con'} {controparte}
                      </span>
                      {c.articolo && <StatoBadge stato={c.articolo.stato} />}
                      {nonLetta && (
                        <span
                          aria-label="Non letta"
                          className="ml-auto h-2.5 w-2.5 shrink-0 rounded-full bg-eco"
                        />
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
