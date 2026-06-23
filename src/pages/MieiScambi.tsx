import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { FullScreenSpinner } from '../components/Spinner'
import { StoricoScambi } from '../components/StoricoScambi'
import type { Scambio } from '../lib/database.types'

/** Memoria completa degli scambi dell'utente (entrata + uscita). */
export function MieiScambi() {
  const { session } = useAuth()
  const meId = session?.user.id
  const navigate = useNavigate()
  const [scambi, setScambi] = useState<Scambio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      if (!meId) return
      setLoading(true)
      setError('')
      // La RLS su `scambi` restituisce solo gli scambi a cui partecipo.
      const { data, error } = await supabase
        .from('scambi')
        .select('*')
        .order('created_at', { ascending: false })
      if (!active) return
      if (error) {
        setError('Impossibile caricare i tuoi scambi. Riprova.')
        console.error('[Renova] MieiScambi error:', error.message)
      } else {
        setScambi((data ?? []) as unknown as Scambio[])
      }
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [meId])

  if (loading) return <FullScreenSpinner />

  return (
    <div className="-mt-1">
      <button
        type="button"
        onClick={() => navigate('/profilo')}
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

      <div className="-mx-4 mb-4 flex flex-col gap-1.5 border-b-[1.5px] border-ink px-5 pb-4">
        <span className="eyebrow">Storico</span>
        <h1 className="text-[34px] font-extrabold leading-[0.95] tracking-[-0.03em] text-ink">
          I miei scambi
        </h1>
        <p className="text-sm text-ink-soft">
          Tutti gli scambi che hai concluso, in entrata e in uscita.
        </p>
      </div>

      {error && (
        <p className="mb-4 border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      {meId && <StoricoScambi scambi={scambi} meId={meId} />}
    </div>
  )
}
