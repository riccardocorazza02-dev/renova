import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { FullScreenSpinner } from '../components/Spinner'
import { MetodologiaFAQ } from '../components/MetodologiaFAQ'
import { formatCo2, formatAcqua, formatPrezzo } from '../lib/format'
import type { ImpattoSocieta, Scambio } from '../lib/database.types'

// Fattori di equivalenza — valori documentati, fonti citate nella scheda "Fonti"
// in fondo alla pagina. Scelti su attività quotidiane per rendere tangibile il
// risparmio. Tenuti volutamente prudenziali (coerenza anti-greenwashing).
const G_CO2_PER_KM_AUTO = 125 // auto media: EEA ~106 g/km (auto nuove UE 2023); ~125 g/km per il parco circolante
const G_CO2_PER_RICARICA = 3 // ricarica completa smartphone ≈ 12 Wh × intensità media rete UE ~0,25 kg CO₂/kWh
const LITRI_PER_DOCCIA = 80 // doccia di ~8 min a ~10 L/min
const LITRI_PER_CAFFE = 130 // acqua "nascosta" per una tazzina di caffè (Water Footprint Network)

type Vista = 'societa' | 'io'

/**
 * Sezione "Impatto": doppia dashboard del risparmio generato dal riuso.
 * - «La società»: aggregato di tutti gli scambi della società (RPC).
 * - «Il mio contributo»: impatto personale dell'utente (ricevuto + donato).
 */
export function Impatto() {
  const { session } = useAuth()
  const meId = session?.user.id
  const [vista, setVista] = useState<Vista>('societa')
  const [totali, setTotali] = useState({ co2: 0, acqua: 0, economia: 0 })
  const [numScambi, setNumScambi] = useState(0)
  const [scambi, setScambi] = useState<Scambio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      // Società: aggregato via RPC SECURITY DEFINER (somma tutta la società
      // senza esporre le righe `scambi`). Personale: la RLS su `scambi`
      // restituisce solo gli scambi a cui partecipo → li sommo lato client.
      const [agg, mine] = await Promise.all([
        supabase.rpc('impatto_societa'),
        supabase.from('scambi').select('*'),
      ])

      if (!active) return
      if (agg.error) {
        setError("Impossibile caricare l'impatto. Riprova.")
        console.error('[Renova] Impatto error:', agg.error.message)
      } else {
        const r = ((Array.isArray(agg.data) ? agg.data[0] : agg.data) ??
          null) as ImpattoSocieta | null
        setNumScambi(Number(r?.n_scambi ?? 0))
        setTotali({
          co2: Number(r?.co2 ?? 0),
          acqua: Number(r?.acqua ?? 0),
          economia: Number(r?.valore ?? 0),
        })
      }
      if (mine.error) {
        console.error('[Renova] Scambi personali error:', mine.error.message)
      } else {
        setScambi((mine.data ?? []) as unknown as Scambio[])
      }
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [])

  // Contributo personale: impatto ricevuto (quando compro) + dono (quando vendo).
  const contributo = useMemo(() => {
    const acc = {
      co2Ricevuta: 0,
      acquaRicevuta: 0,
      oggettiRicevuti: 0,
      oggettiDonati: 0,
      valoreDonato: 0,
    }
    for (const s of scambi) {
      if (s.id_venditore === meId) {
        acc.oggettiDonati += 1
        acc.valoreDonato += Number(s.valore)
      }
      if (s.id_acquirente === meId) {
        acc.oggettiRicevuti += 1
        acc.co2Ricevuta += Number(s.co2)
        acc.acquaRicevuta += Number(s.acqua)
      }
    }
    return acc
  }, [scambi, meId])

  if (loading) return <FullScreenSpinner />

  const grammiCo2 = totali.co2 * 1000
  const nf = new Intl.NumberFormat('it-IT')
  const co2Equivalenze = [
    `${nf.format(Math.round(grammiCo2 / G_CO2_PER_KM_AUTO))} km in auto evitati · ${nf.format(Math.round(grammiCo2 / G_CO2_PER_RICARICA))} ricariche smartphone`,
  ]
  const acquaEquivalenze = [
    `${nf.format(Math.round(totali.acqua / LITRI_PER_DOCCIA))} docce · ${nf.format(Math.round(totali.acqua / LITRI_PER_CAFFE))} caffè (acqua nascosta)`,
  ]
  const haContributo =
    contributo.oggettiRicevuti + contributo.oggettiDonati > 0

  return (
    <div className="-mt-1">
      {/* Intestazione editoriale — occhiello + titolone, regola nera netta */}
      <div className="-mx-4 flex flex-col gap-1.5 border-b-[1.5px] border-ink px-5 pb-4">
        <span className="eyebrow">Il risparmio generato dal riuso</span>
        <h1 className="text-[42px] font-extrabold leading-[0.95] tracking-[-0.03em] text-ink">
          Impatto
        </h1>
      </div>

      {/* Tab dashboard: società ↔ contributo personale (underline verde) */}
      <div className="-mx-4 flex gap-6 border-b border-line px-5 py-3">
        <SegBtn attivo={vista === 'societa'} onClick={() => setVista('societa')}>
          La società
        </SegBtn>
        <SegBtn attivo={vista === 'io'} onClick={() => setVista('io')}>
          Il mio contributo
        </SegBtn>
      </div>

      {error && (
        <p className="mt-4 border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      {vista === 'societa' ? (
        numScambi === 0 ? (
          <Vuoto
            titolo="Nessuno scambio concluso (ancora)"
            testo="Ogni scambio concluso dalla tua società fa crescere il risparmio di CO₂, acqua e denaro della community."
            cta={{ to: '/aggiungi', label: 'Aggiungi un articolo' }}
          />
        ) : (
          <>
            {/* Dashboard società — metriche incolonnate con regole sottili */}
            <div className="-mx-4">
              <MetricaBlocco
                label="CO₂ risparmiata"
                dot="bg-eco"
                valore={formatCo2(totali.co2)}
                equivalenze={co2Equivalenze}
              />
              <MetricaBlocco
                label="Acqua risparmiata"
                dot="bg-water"
                valore={formatAcqua(totali.acqua)}
                equivalenze={acquaEquivalenze}
              />
              <MetricaBlocco
                label="Valore risparmiato"
                dot="bg-sun"
                valore={formatPrezzo(totali.economia)}
              />
              <p className="border-t border-line px-5 py-3.5 text-[10.5px] leading-relaxed tracking-[0.03em] text-ink-faint">
                Equivalenze indicative · {numScambi}{' '}
                {numScambi === 1 ? 'scambio concluso' : 'scambi conclusi'} · metodo
                in fondo alla pagina
              </p>
            </div>

            <div className="mt-4">
              <Fonti />
            </div>
          </>
        )
      ) : !haContributo ? (
        <Vuoto
          titolo="Il tuo contributo parte da qui"
          testo="Quando ricevi o doni un articolo, qui vedrai il tuo impatto personale: CO₂ e acqua risparmiate e il valore rimesso in circolo."
          cta={{ to: '/', label: 'Vai al marketplace' }}
        />
      ) : (
        /* Dashboard personale — stessa veste della società, doppia sezione */
        <div className="-mx-4">
          <p className="px-5 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Ricevendo · {contributo.oggettiRicevuti}{' '}
            {contributo.oggettiRicevuti === 1 ? 'oggetto' : 'oggetti'}
          </p>
          <MetricaBlocco
            label="CO₂ risparmiata"
            dot="bg-eco"
            valore={formatCo2(contributo.co2Ricevuta)}
          />
          <MetricaBlocco
            label="Acqua risparmiata"
            dot="bg-water"
            valore={formatAcqua(contributo.acquaRicevuta)}
          />
          <p className="border-t border-line px-5 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Donando ad altre famiglie
          </p>
          <MetricaBlocco
            label="Oggetti rimessi in circolo"
            dot="bg-ink"
            valore={String(contributo.oggettiDonati)}
          />
          <MetricaBlocco
            label="Valore donato"
            dot="bg-sun"
            valore={formatPrezzo(contributo.valoreDonato)}
          />
        </div>
      )}

      {/* Metodologia: Q&A anti-greenwashing + link al documento integrale */}
      <div className="mt-5">
        <MetodologiaFAQ />
      </div>
    </div>
  )
}

/** Tab del selettore dashboard, stile 2A: MAIUSCOLO con underline verde. */
function SegBtn({
  attivo,
  onClick,
  children,
}: {
  attivo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap pb-1 text-[11.5px] uppercase tracking-[0.06em] transition ${
        attivo
          ? 'border-b-2 border-eco font-bold text-ink'
          : 'font-semibold text-ink-faint hover:text-ink-soft'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * Blocco metrica 2A: pallino colorato + etichetta MAIUSCOLA, numero grande
 * NERO con unità più piccola, poi le equivalenze. Regola sottile sopra.
 */
function MetricaBlocco({
  label,
  valore,
  dot,
  equivalenze = [],
}: {
  label: string
  valore: string
  dot: string
  equivalenze?: string[]
}) {
  // Separa numero e unità per la gerarchia tipografica del 2A ("14" + "kg").
  const i = valore.lastIndexOf(' ')
  const num = i === -1 ? valore : valore.slice(0, i)
  const unita = i === -1 ? '' : valore.slice(i + 1)

  return (
    <div className="border-t border-line px-5 py-4">
      <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        {label}
      </p>
      <p className="mt-2 flex items-baseline gap-1.5">
        <span className="text-[52px] font-extrabold leading-[0.85] tracking-[-0.03em] text-ink">
          {num}
        </span>
        {unita && (
          <span className="text-[22px] font-bold text-ink">{unita}</span>
        )}
      </p>
      {equivalenze.length > 0 && (
        <ul className="mt-3 space-y-1">
          {equivalenze.map((e) => (
            <li key={e} className="text-[12px] leading-relaxed text-ink-soft">
              {e}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Stato vuoto editoriale con messaggio e CTA. */
function Vuoto({
  titolo,
  testo,
  cta,
}: {
  titolo: string
  testo: string
  cta: { to: string; label: string }
}) {
  return (
    <div className="mt-10 border-y border-line px-6 py-14 text-center">
      <h3 className="text-xl font-extrabold tracking-[-0.03em] text-ink">
        {titolo}
      </h3>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
        {testo}
      </p>
      <Link
        to={cta.to}
        className="mt-5 inline-flex bg-eco px-5 py-3 text-[13px] font-bold uppercase tracking-[0.06em] text-white transition active:scale-[.99]"
      >
        {cta.label}
      </Link>
    </div>
  )
}

/** Scheda collassabile con le fonti dei fattori di equivalenza. */
function Fonti() {
  return (
    <details className="group -mx-4 border-y border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-[11px] font-bold uppercase tracking-[0.08em] text-ink [&::-webkit-details-marker]:hidden">
        <span>Fonti delle equivalenze</span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="shrink-0 text-ink-soft transition-transform duration-200 group-open:rotate-180"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className="space-y-2.5 px-5 pb-4 text-[12px] leading-relaxed text-ink-soft">
        <p>
          <strong className="text-ink">🚗 Auto · ~125 g CO₂/km.</strong> Le auto
          nuove immatricolate nell'UE emettono in media 106,4 g CO₂/km (2023);
          usiamo ~125 g/km, più prudente, per rappresentare il parco circolante.{' '}
          <a
            href="https://www.eea.europa.eu/en/analysis/indicators/co2-performance-of-new-passenger"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-eco-700 hover:underline"
          >
            European Environment Agency
          </a>
          .
        </p>
        <p>
          <strong className="text-ink">🔋 Smartphone · ~3 g CO₂/ricarica.</strong>{' '}
          Una ricarica completa ≈ 12 Wh; con l'intensità media della rete
          elettrica UE (~0,25 kg CO₂/kWh,{' '}
          <a
            href="https://www.eea.europa.eu/en/analysis/indicators/greenhouse-gas-emission-intensity-of-1"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-eco-700 hover:underline"
          >
            EEA
          </a>
          ) ≈ 3 g CO₂.
        </p>
        <p>
          <strong className="text-ink">🚿 Doccia · ~80 L.</strong> Una doccia di
          circa 8 minuti a ~10 L/min (gli erogatori comuni consumano 10–15
          L/min).
        </p>
        <p>
          <strong className="text-ink">☕ Caffè · ~130 L a tazzina.</strong>{' '}
          Acqua «nascosta» (coltivazione, lavorazione) per una tazzina, secondo
          il{' '}
          <a
            href="https://www.waterfootprint.org/resources/Report14.pdf"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-eco-700 hover:underline"
          >
            Water Footprint Network
          </a>{' '}
          (~132 L).
        </p>
      </div>
    </details>
  )
}
