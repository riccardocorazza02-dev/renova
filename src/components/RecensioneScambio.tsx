import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Recensione } from '../lib/database.types'
import { StelleInput, StelleStatiche } from './Stelle'

/**
 * Riquadro di recensione reciproca per uno scambio concluso. È auto-contenuto:
 * legge lo stato delle recensioni (la RLS espone solo quella scritta da me e
 * quella ricevuta) e permette di lasciare/aggiornare la propria valutazione a
 * stelle. Usato sia nella chat (subito dopo lo scambio) sia nello storico.
 */
export function RecensioneScambio({
  scambioId,
  controparteNome,
}: {
  scambioId: number
  controparteNome: string
}) {
  const { session } = useAuth()
  const me = session?.user.id
  const [mia, setMia] = useState<number>(0)
  const [ricevuta, setRicevuta] = useState<number | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [errore, setErrore] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      const { data, error } = await supabase
        .from('recensioni')
        .select('id_autore, id_destinatario, valutazione')
        .eq('id_scambio', scambioId)
      if (!active) return
      if (error) {
        console.error('[Renova] Recensioni error:', error.message)
        return
      }
      const righe = (data ?? []) as Pick<
        Recensione,
        'id_autore' | 'id_destinatario' | 'valutazione'
      >[]
      setMia(righe.find((r) => r.id_autore === me)?.valutazione ?? 0)
      setRicevuta(
        righe.find((r) => r.id_destinatario === me)?.valutazione ?? null,
      )
    }
    load()
    return () => {
      active = false
    }
  }, [scambioId, me])

  async function vota(n: number) {
    if (salvando) return
    const precedente = mia
    setMia(n) // ottimistico
    setSalvando(true)
    setErrore('')
    const { error } = await supabase.rpc('lascia_recensione', {
      p_id_scambio: scambioId,
      p_valutazione: n,
    })
    setSalvando(false)
    if (error) {
      setMia(precedente)
      setErrore('Impossibile salvare la valutazione. Riprova.')
      console.error('[Renova] lascia_recensione error:', error.message)
    }
  }

  return (
    <div className="space-y-2.5 rounded-lg border border-line bg-surface p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink">
          {mia > 0 ? 'La tua valutazione' : `Valuta ${controparteNome}`}
        </p>
        <StelleInput valore={mia} onVota={vota} disabled={salvando} size={26} />
      </div>

      {mia > 0 && (
        <p className="text-xs text-ink-soft">
          Hai dato {mia} {mia === 1 ? 'stella' : 'stelle'}. Puoi modificarla
          toccando un'altra stella.
        </p>
      )}

      {ricevuta !== null && (
        <div className="flex items-center gap-2 border-t border-line pt-2">
          <span className="text-xs text-ink-soft">
            {controparteNome} ti ha valutato
          </span>
          <StelleStatiche valore={ricevuta} size={14} />
        </div>
      )}

      {errore && <p className="text-xs text-red-600">{errore}</p>}
    </div>
  )
}
