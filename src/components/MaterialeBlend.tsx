import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react'
import type {
  Composizione,
  FonteImpatto,
  Fibra,
  MaterialeOpzione,
} from '../lib/database.types'
import {
  leggiEtichetta,
  righeAComposizione,
  sommaRighe,
  type ProgressoLettura,
  type RigaLetta,
} from '../lib/etichetta'
import { Spinner } from './Spinner'

/**
 * Box «Di cosa è fatto?» dell'upload: percorso guidato che PARTE dalla foto
 * dell'etichetta (Livello 2) e ricade, solo se serve, sulla scelta del
 * materiale (Livello 1).
 *
 *   vuota ──foto──▶ lettura ──ok──▶ letta ──«È corretto»──▶ confermata
 *                       │             └──«Correggi»──▶ manuale
 *                       └──fallita/parziale──▶ manuale ──conferma──▶ confermata
 *   manuale ──«Non conosci le percentuali?»──▶ opzioni (tap L1)
 *
 * Le percentuali inserite a mano «come da etichetta» restano Livello 2
 * (documento metodologico §6): fonte_impatto = 'etichetta'.
 * La foto è letta in locale e non viene mai caricata.
 */

/** Ciò che il box comunica alla pagina di upload. */
export interface StatoBlend {
  /** composizione da salvare; null = stima prudenziale di categoria (L0) */
  composizione: Composizione | null
  fonte: FonteImpatto
  /** false mentre l'utente sta leggendo/verificando: la pubblicazione attende */
  pronto: boolean
}

export const BLEND_INIZIALE: StatoBlend = {
  composizione: null,
  fonte: 'categoria',
  pronto: true,
}

type Fase = 'vuota' | 'lettura' | 'letta' | 'manuale' | 'opzioni' | 'confermata'

/** Come è finita la lettura: decide il messaggio sopra l'inserimento manuale. */
type Esito =
  | { tipo: 'parziale' }
  | { tipo: 'sconosciute'; nomi: string[] }
  | { tipo: 'fallita' }
  | { tipo: 'senza_foto' }
  | { tipo: 'correzione' }

interface RigaModifica {
  id: number
  codice: string
  pct: string
}

let prossimoIdRiga = 1
const nuovaRiga = (r?: RigaLetta): RigaModifica => ({
  id: prossimoIdRiga++,
  codice: r?.codice ?? '',
  pct: r ? String(r.pct) : '',
})

export function MaterialeBlend({
  opzioni,
  fibre,
  onChange,
}: {
  /** opzioni del tap L1 della categoria (con «Non lo so») */
  opzioni: MaterialeOpzione[]
  fibre: Record<string, Fibra>
  onChange: (stato: StatoBlend) => void
}) {
  const [fase, setFase] = useState<Fase>('vuota')
  const [foto, setFoto] = useState<string | null>(null)
  const [progresso, setProgresso] = useState<ProgressoLettura | null>(null)
  const [letta, setLetta] = useState<RigaLetta[]>([])
  const [esito, setEsito] = useState<Esito>({ tipo: 'fallita' })
  const [righe, setRighe] = useState<RigaModifica[]>([])
  const [confermata, setConfermata] = useState<Composizione | null>(null)
  const [daFoto, setDaFoto] = useState(false)
  const [opzione, setOpzione] = useState<string>('')

  // Revoca l'anteprima locale della foto quando cambia o si smonta il box.
  useEffect(() => () => void (foto && URL.revokeObjectURL(foto)), [foto])

  // Comunica alla pagina la composizione corrente e se si può pubblicare.
  useEffect(() => {
    if (fase === 'confermata' && confermata) {
      onChange({ composizione: confermata, fonte: 'etichetta', pronto: true })
    } else if (fase === 'opzioni') {
      const blend = opzioni.find((o) => o.chiave === opzione)?.blend ?? null
      onChange({ composizione: blend, fonte: blend ? 'utente' : 'categoria', pronto: true })
    } else if (fase === 'vuota') {
      onChange(BLEND_INIZIALE)
    } else {
      onChange({ composizione: null, fonte: 'categoria', pronto: false })
    }
  }, [fase, confermata, opzione, opzioni, onChange])

  const nomeFibra = (cod: string) => fibre[cod]?.nome ?? cod

  async function onFoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setFoto(URL.createObjectURL(file))
    setProgresso(null)
    setFase('lettura')
    try {
      const r = await leggiEtichetta(file, setProgresso)
      // Solo codici presenti nella tabella `fibre` (se caricata).
      const note = r.righe.filter((x) => Object.keys(fibre).length === 0 || fibre[x.codice])
      setLetta(note)
      setRighe(note.length ? note.map(nuovaRiga) : [nuovaRiga(), nuovaRiga()])
      if (r.completa && note.length === r.righe.length) {
        setFase('letta')
        return
      }
      setEsito(
        r.sconosciute.length
          ? { tipo: 'sconosciute', nomi: r.sconosciute }
          : note.length
            ? { tipo: 'parziale' }
            : { tipo: 'fallita' },
      )
    } catch (err) {
      console.warn('[Renova] Lettura etichetta non riuscita:', err)
      setLetta([])
      setRighe([nuovaRiga(), nuovaRiga()])
      setEsito({ tipo: 'fallita' })
    }
    setFase('manuale')
  }

  /** Torna al punto di partenza (solo il tasto della foto). */
  function ricomincia() {
    setFoto(null)
    setLetta([])
    setRighe([])
    setConfermata(null)
    setOpzione('')
    setFase('vuota')
  }

  function conferma(comp: Composizione, dallaFoto: boolean) {
    setConfermata(comp)
    setDaFoto(dallaFoto)
    setFase('confermata')
  }

  // ── Righe dell'inserimento manuale ──
  const righeNum = righe.map((r) => ({
    codice: r.codice,
    pct: Number(r.pct.replace(',', '.')),
  }))
  const totale = sommaRighe(righeNum)
  const codiciUsati = righe.map((r) => r.codice).filter(Boolean)
  const doppioni = new Set(codiciUsati).size !== codiciUsati.length
  const righeValide =
    righeNum.length > 0 &&
    righeNum.every((r) => !!fibre[r.codice] && r.pct > 0 && r.pct <= 100) &&
    !doppioni &&
    totale === 100

  const inputFoto = (
    <input type="file" accept="image/*" className="hidden" onChange={onFoto} />
  )

  return (
    <div className="space-y-4 rounded-lg border border-line bg-surface/60 p-4">
      <div>
        <span className="block text-[13px] font-bold uppercase tracking-[0.04em] text-ink">
          Di cosa è fatto?
        </span>
        <span className="mt-0.5 block text-xs text-ink-soft">
          Il materiale del capo decide l'impatto risparmiato: lo leggiamo
          dall'etichetta di composizione, quella cucita all'interno.
        </span>
      </div>

      {/* ── 1. Partenza: UNA sola azione, la foto dell'etichetta ── */}
      {fase === 'vuota' && (
        <div className="space-y-2.5">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-eco bg-eco-50 px-4 py-4 transition hover:bg-eco-50/70">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-eco text-xl text-ink">
              📷
            </span>
            <span>
              <span className="block text-sm font-bold uppercase tracking-[0.04em] text-ink">
                Fotografa l'etichetta
              </span>
              <span className="block text-[11px] text-ink-soft">
                La leggiamo sul tuo dispositivo: la foto non viene caricata.
              </span>
            </span>
            {inputFoto}
          </label>
          <button
            type="button"
            onClick={() => {
              setRighe([nuovaRiga(), nuovaRiga()])
              setLetta([])
              setEsito({ tipo: 'senza_foto' })
              setFase('manuale')
            }}
            className="block w-full text-center text-[11px] font-semibold text-ink-soft underline-offset-2 hover:underline"
          >
            L'etichetta non c'è o è illeggibile?
          </button>
        </div>
      )}

      {/* ── 2. Lettura in corso ── */}
      {fase === 'lettura' && (
        <div className="flex items-center gap-3 rounded-lg border border-edge bg-paper p-3">
          {foto && <Miniatura url={foto} />}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-bold text-ink">
              <Spinner className="h-4 w-4 shrink-0 text-eco-600" />
              {progresso?.fase === 'leggo'
                ? "Sto leggendo l'etichetta…"
                : 'Preparo il lettore…'}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-eco transition-all"
                style={{
                  width: `${Math.round(
                    (progresso?.fase === 'leggo' ? 0.3 + 0.7 * progresso.p : 0.3 * (progresso?.p ?? 0)) *
                      100,
                  )}%`,
                }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-ink-faint">
              La prima volta scarichiamo il lettore: può servire qualche secondo.
            </p>
          </div>
        </div>
      )}

      {/* ── 3a. Letta: il blend in primo piano, da verificare ── */}
      {fase === 'letta' && (
        <div className="space-y-3">
          <div className="rounded-lg border-2 border-eco bg-paper p-4">
            <div className="flex items-start gap-3">
              {foto && <Miniatura url={foto} />}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-eco-700">
                  ✓ Etichetta letta
                </p>
                <p className="text-xs text-ink-soft">Ecco il blend del tuo articolo:</p>
              </div>
            </div>
            <BlendGrande righe={letta} nomeFibra={nomeFibra} />
          </div>
          <p className="text-center text-sm font-semibold text-ink">
            Corrisponde all'etichetta?
          </p>
          <div className="flex gap-2">
            <Bottone primario onClick={() => conferma(righeAComposizione(letta), true)}>
              Sì, è corretto
            </Bottone>
            <Bottone
              onClick={() => {
                setRighe(letta.map(nuovaRiga))
                setEsito({ tipo: 'correzione' })
                setFase('manuale')
              }}
            >
              Correggi
            </Bottone>
          </div>
        </div>
      )}

      {/* ── 3b. Inserimento manuale (lettura fallita/parziale o correzione) ── */}
      {fase === 'manuale' && (
        <div className="space-y-3">
          <AvvisoEsito
            esito={esito}
            foto={foto}
            letta={letta}
            nomeFibra={nomeFibra}
            inputFoto={inputFoto}
          />

          <div className="space-y-2 rounded-lg border border-edge bg-paper p-3">
            <p className="text-[13px] font-bold text-ink">
              Inserisci le percentuali come sull'etichetta
            </p>
            {righe.map((r) => (
              <div key={r.id} className="flex items-center gap-2">
                <select
                  value={r.codice}
                  onChange={(e) =>
                    setRighe((p) => p.map((x) => (x.id === r.id ? { ...x, codice: e.target.value } : x)))
                  }
                  aria-label="Fibra"
                  className="min-w-0 flex-1 rounded-lg border border-edge bg-paper px-2.5 py-2 text-sm text-ink focus:border-eco focus:outline-none"
                >
                  <option value="" disabled>
                    Fibra…
                  </option>
                  {Object.values(fibre).map((f) => (
                    <option key={f.codice} value={f.codice}>
                      {f.nome}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step="any"
                    placeholder="0"
                    value={r.pct}
                    onChange={(e) =>
                      setRighe((p) => p.map((x) => (x.id === r.id ? { ...x, pct: e.target.value } : x)))
                    }
                    aria-label="Percentuale"
                    className="w-16 rounded-lg border border-edge bg-paper px-2 py-2 text-right text-sm text-ink focus:border-eco focus:outline-none"
                  />
                  <span className="text-sm text-ink-soft">%</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRighe((p) => p.filter((x) => x.id !== r.id))}
                  aria-label="Rimuovi fibra"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base text-ink-soft hover:bg-surface"
                >
                  ×
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between pt-0.5">
              <button
                type="button"
                onClick={() => setRighe((p) => [...p, nuovaRiga()])}
                className="text-xs font-semibold text-eco-700 hover:underline"
              >
                ＋ Aggiungi fibra
              </button>
              <span className={`text-xs font-bold ${totale === 100 ? 'text-eco-700' : 'text-ink-soft'}`}>
                Totale {totale}%{totale !== 100 && ' · deve fare 100'}
              </span>
            </div>
            {doppioni && (
              <p className="text-[11px] text-ink-soft">Ogni fibra va indicata una sola volta.</p>
            )}
            <div className="flex gap-2 pt-1">
              <Bottone
                primario
                disabled={!righeValide}
                onClick={() => conferma(righeAComposizione(righeNum), !!foto)}
              >
                Conferma il blend
              </Bottone>
            </div>
          </div>

          <div className="border-t border-line pt-3 text-center">
            <p className="text-xs text-ink-soft">Non conosci le percentuali?</p>
            <button
              type="button"
              onClick={() => {
                setOpzione(opzioni.find((o) => o.blend)?.chiave ?? '')
                setFase('opzioni')
              }}
              className="mt-1 text-xs font-bold uppercase tracking-[0.04em] text-eco-700 hover:underline"
            >
              Scegli il materiale più simile →
            </button>
          </div>
        </div>
      )}

      {/* ── 4. Alternativa: tap sul materiale più simile (Livello 1) ── */}
      {fase === 'opzioni' && (
        <div className="space-y-2">
          <p className="text-[13px] font-bold text-ink">Scegli il materiale più simile</p>
          <div className="space-y-1.5">
            {opzioni.map((o) => {
              const sel = o.chiave === opzione
              return (
                <button
                  key={o.chiave}
                  type="button"
                  onClick={() => setOpzione(o.chiave)}
                  className={`flex w-full flex-col items-start rounded-lg border px-3 py-2 text-left transition ${
                    sel
                      ? 'border-eco bg-eco-50 ring-1 ring-eco'
                      : 'border-edge bg-paper hover:border-eco/50'
                  }`}
                >
                  <span className="text-sm font-semibold text-ink">{o.label}</span>
                  <span className="text-[11px] text-ink-soft">{o.hint}</span>
                </button>
              )
            })}
          </div>
          <div className="flex flex-wrap justify-between gap-2 pt-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFase('manuale')}
              className="text-eco-700 hover:underline"
            >
              ← Inserisci le percentuali
            </button>
            <button type="button" onClick={ricomincia} className="text-ink-soft hover:underline">
              Riprova con la foto
            </button>
          </div>
        </div>
      )}

      {/* ── 5. Confermata: il blend resta in primo piano ── */}
      {fase === 'confermata' && confermata && (
        <div className="rounded-lg border-2 border-eco bg-paper p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-eco-700">
                ✓ Blend dell'articolo
              </p>
              <p className="text-xs text-ink-soft">
                {daFoto
                  ? "Letto dall'etichetta e confermato da te."
                  : "Inserito da te come riportato sull'etichetta."}
              </p>
            </div>
            {foto && <Miniatura url={foto} />}
          </div>
          <BlendGrande
            righe={Object.entries(confermata)
              .map(([codice, pct]) => ({ codice, pct }))
              .sort((a, b) => b.pct - a.pct)}
            nomeFibra={nomeFibra}
          />
          <div className="mt-3 flex gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setRighe(Object.entries(confermata).map(([codice, pct]) => nuovaRiga({ codice, pct })))
                setEsito({ tipo: 'correzione' })
                setFase('manuale')
              }}
              className="text-eco-700 hover:underline"
            >
              Modifica
            </button>
            <button type="button" onClick={ricomincia} className="text-ink-soft hover:underline">
              Ricomincia
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Il blend in grande: percentuale, fibra e barra proporzionale. */
function BlendGrande({
  righe,
  nomeFibra,
}: {
  righe: RigaLetta[]
  nomeFibra: (cod: string) => string
}) {
  return (
    <ul className="mt-3 space-y-2">
      {righe.map((r) => (
        <li key={r.codice}>
          <div className="flex items-baseline gap-2">
            <span className="w-14 shrink-0 text-2xl font-extrabold tracking-[-0.02em] text-ink">
              {r.pct}%
            </span>
            <span className="text-base font-semibold text-ink">{nomeFibra(r.codice)}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-eco" style={{ width: `${Math.min(r.pct, 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Perché siamo nell'inserimento manuale, con quello che si è riusciti a leggere. */
function AvvisoEsito({
  esito,
  foto,
  letta,
  nomeFibra,
  inputFoto,
}: {
  esito: Esito
  foto: string | null
  letta: RigaLetta[]
  nomeFibra: (cod: string) => string
  inputFoto: ReactNode
}) {
  if (esito.tipo === 'correzione') return null
  const titolo =
    esito.tipo === 'senza_foto'
      ? 'Nessun problema'
      : esito.tipo === 'fallita'
        ? "Non siamo riusciti a leggere l'etichetta"
        : "Abbiamo letto solo una parte dell'etichetta"
  const testo =
    esito.tipo === 'senza_foto'
      ? "Se conosci la composizione, inseriscila qui sotto; altrimenti scegli il materiale più simile."
      : esito.tipo === 'fallita'
        ? 'Prova con una foto più vicina, dritta e a fuoco, oppure inserisci tu le percentuali.'
        : esito.tipo === 'sconosciute'
          ? `${esito.nomi.join(', ')}: ${
              esito.nomi.length === 1 ? 'non è tra le fibre' : 'non sono tra le fibre'
            } del nostro metodo. Inserisci la composizione con le fibre più simili.`
          : 'Controlla le percentuali qui sotto: il totale deve fare 100.'
  return (
    <div className="flex items-start gap-3 rounded-lg bg-sun-50 p-3">
      {foto && <Miniatura url={foto} />}
      <div className="min-w-0 flex-1 text-xs text-ink-soft">
        <p className="text-sm font-bold text-ink">{titolo}</p>
        <p className="mt-0.5 leading-relaxed">{testo}</p>
        {letta.length > 0 && (
          <p className="mt-1">
            Abbiamo letto:{' '}
            <span className="font-semibold text-ink">
              {letta.map((r) => `${r.pct}% ${nomeFibra(r.codice)}`).join(' · ')}
            </span>
          </p>
        )}
        <label className="mt-1.5 inline-block cursor-pointer font-semibold text-eco-700 hover:underline">
          {esito.tipo === 'senza_foto' ? "📷 Fotografa l'etichetta" : "📷 Riprova con un'altra foto"}
          {inputFoto}
        </label>
      </div>
    </div>
  )
}

function Miniatura({ url }: { url: string }) {
  return (
    <img
      src={url}
      alt="Foto dell'etichetta"
      className="h-14 w-14 shrink-0 rounded-md border border-edge object-cover"
    />
  )
}

function Bottone({
  primario,
  disabled,
  onClick,
  children,
}: {
  primario?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-bold uppercase tracking-[0.04em] transition disabled:opacity-40 ${
        primario
          ? 'bg-ink text-white'
          : 'border border-edge bg-paper text-ink hover:border-ink/40'
      }`}
    >
      {children}
    </button>
  )
}
