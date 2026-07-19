import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Spinner } from '../components/Spinner'
import { StelleStatiche } from '../components/Stelle'
import { ScambioCard } from '../components/StoricoScambi'
import { MetodologiaFAQ } from '../components/MetodologiaFAQ'
import type { Scambio } from '../lib/database.types'

export function Profile() {
  const { session, profilo, signOut, deleteAccount } = useAuth()
  const meId = session?.user.id
  const [conteggio, setConteggio] = useState<number | null>(null)
  const [scambi, setScambi] = useState<Scambio[]>([])
  const [valutazioni, setValutazioni] = useState<number[]>([])
  const [signingOut, setSigningOut] = useState(false)

  // Eliminazione account (definitiva, con doppia conferma)
  const [confermaElimina, setConfermaElimina] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [erroreElimina, setErroreElimina] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      if (!meId) return
      const [{ count }, { data: sc }, { data: rec }] = await Promise.all([
        supabase
          .from('articoli')
          .select('id', { count: 'exact', head: true })
          .eq('id_utente', meId),
        // La RLS su `scambi` restituisce solo gli scambi a cui partecipo.
        supabase
          .from('scambi')
          .select('*')
          .order('created_at', { ascending: false }),
        // Recensioni RICEVUTE (per la media in profilo).
        supabase
          .from('recensioni')
          .select('valutazione')
          .eq('id_destinatario', meId),
      ])
      if (!active) return
      setConteggio(count ?? 0)
      setScambi((sc ?? []) as unknown as Scambio[])
      setValutazioni(
        ((rec ?? []) as { valutazione: number }[]).map((r) => r.valutazione),
      )
    }
    load()
    return () => {
      active = false
    }
  }, [meId])

  const media =
    valutazioni.length > 0
      ? valutazioni.reduce((a, b) => a + b, 0) / valutazioni.length
      : 0

  async function handleLogout() {
    setSigningOut(true)
    await signOut()
    // L'AuthProvider azzera la sessione → le rotte protette reindirizzano a /login.
  }

  async function handleEliminaAccount() {
    setEliminando(true)
    setErroreElimina('')
    try {
      await deleteAccount()
      // Sessione azzerata → le rotte protette reindirizzano fuori dall'app.
    } catch (err) {
      setErroreElimina(
        err instanceof Error ? err.message : "Impossibile eliminare l'account.",
      )
      setEliminando(false)
    }
  }

  if (!profilo) return null

  const iniziali = profilo.nome_completo
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="-mt-1">
      {/* Intestazione profilo — editoriale, regola nera netta in fondo */}
      <section className="-mx-4 flex items-center gap-4 border-b-[1.5px] border-ink px-5 pb-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-eco text-xl font-extrabold text-white">
          {iniziali || '👤'}
        </div>
        <div className="min-w-0">
          <span className="eyebrow">{profilo.sport} · {profilo.societa.nome}</span>
          <h1 className="truncate text-[26px] font-extrabold leading-tight tracking-[-0.03em] text-ink">
            {profilo.nome_completo}
          </h1>
          <p className="truncate text-xs text-ink-soft">{session?.user.email}</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            {valutazioni.length > 0 ? (
              <>
                <StelleStatiche valore={media} size={15} />
                <span className="text-xs font-bold text-ink">
                  {media.toFixed(1)}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
                  ({valutazioni.length}{' '}
                  {valutazioni.length === 1 ? 'recensione' : 'recensioni'})
                </span>
              </>
            ) : (
              <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
                Ancora nessuna recensione
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Voci di navigazione — righe editoriali a regole sottili */}
      <div className="-mx-4 border-b border-line">
        <NavRow
          to="/miei-articoli"
          titolo="I miei articoli"
          sub={
            conteggio === null
              ? 'Vedi e gestisci ciò che hai caricato'
              : conteggio === 0
                ? 'Non hai ancora caricato articoli'
                : `${conteggio} ${
                    conteggio === 1 ? 'articolo caricato' : 'articoli caricati'
                  } · vedi stato e modifica`
          }
        />
        {meId && (
          <NavRow
            to="/scambi"
            titolo="I miei scambi"
            sub={
              scambi.length === 0
                ? 'Nessuno scambio ancora'
                : `${scambi.length} ${
                    scambi.length === 1 ? 'scambio concluso' : 'scambi conclusi'
                  } · vedi tutti`
            }
          />
        )}
      </div>

      {/* Anteprima ultimo scambio */}
      {meId && scambi.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
            Ultimo scambio
          </p>
          <ScambioCard scambio={scambi[0]} meId={meId} />
        </div>
      )}

      {/* Dati società */}
      <section className="mt-5">
        <h2 className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
          La tua società
        </h2>
        <Riga etichetta="Società" valore={profilo.societa.nome} />
        <Riga etichetta="Sport" valore={profilo.sport} />
        <Riga etichetta="Provincia" valore={profilo.societa.provincia} />
        <Riga
          etichetta="Articoli pubblicati"
          valore={conteggio === null ? '—' : String(conteggio)}
        />
      </section>

      {/* Metodologia dell'impatto — scheda collassabile (Q&A anti-greenwashing) */}
      <div className="mt-5">
        <MetodologiaFAQ />
      </div>

      {/* Azioni */}
      <button
        onClick={handleLogout}
        disabled={signingOut}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-paper px-4 py-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-red-600 transition hover:bg-red-50 disabled:opacity-60"
      >
        {signingOut && <Spinner className="h-4 w-4" />}
        Esci dall'account
      </button>

      {/* Eliminazione account — definitiva (diritto all'oblio) */}
      <section className="mt-6 border-t border-line pt-4">
        {erroreElimina && (
          <p className="mb-3 border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {erroreElimina}
          </p>
        )}
        {!confermaElimina ? (
          <button
            type="button"
            onClick={() => setConfermaElimina(true)}
            className="w-full text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint transition hover:text-red-600"
          >
            Elimina il mio account
          </button>
        ) : (
          <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-ink">
              Eliminare definitivamente il tuo account?
            </p>
            <p className="text-xs leading-relaxed text-ink-soft">
              L'operazione è irreversibile: verranno cancellati il tuo profilo,
              i tuoi articoli con le foto e tutte le tue chat. Gli scambi già
              conclusi restano nello storico delle altre persone in forma
              anonima («Utente eliminato»).
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleEliminaAccount}
                disabled={eliminando}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.04em] text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {eliminando && <Spinner className="h-4 w-4" />}
                {eliminando ? 'Elimino…' : 'Sì, elimina tutto'}
              </button>
              <button
                type="button"
                onClick={() => setConfermaElimina(false)}
                disabled={eliminando}
                className="rounded-lg border border-edge bg-paper px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.04em] text-ink transition hover:border-ink disabled:opacity-60"
              >
                Annulla
              </button>
            </div>
          </div>
        )}
      </section>

      <p className="pb-2 pt-5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
        Renova · Sport Resale &amp; ESG
      </p>
    </div>
  )
}

/** Riga di navigazione editoriale (titolo MAIUSCOLO + sottotitolo + chevron). */
function NavRow({ to, titolo, sub }: { to: string; titolo: string; sub: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between border-t border-line px-5 py-4 transition first:border-t-0 hover:bg-surface"
    >
      <div className="min-w-0">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.04em] text-ink">
          {titolo}
        </h2>
        <p className="mt-0.5 text-xs text-ink-soft">{sub}</p>
      </div>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="shrink-0 text-ink-faint"
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
  )
}

function Riga({
  etichetta,
  valore,
  mono = false,
}: {
  etichetta: string
  valore: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2.5 last:border-0">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
        {etichetta}
      </span>
      <span
        className={`text-sm font-bold text-ink ${mono ? 'tracking-wider' : ''}`}
      >
        {valore}
      </span>
    </div>
  )
}
