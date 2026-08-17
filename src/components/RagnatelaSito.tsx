import { Link } from 'react-router-dom'
import { PAGINE_SITO } from './sito'
import { RenovaMark } from './Logo'
import { anello, useRagnatela, type Punto } from './ragnatela'

/* ──────────────────────────────────────────────────────────────────────────
   RAGNATELA DEL SITO — la scena interattiva che chiude la home.

   Al centro il marchio (pittogramma + logotipo) fluttua piano, e da lì
   partono quattro bracci che finiscono nelle quattro bolle delle pagine del
   sito, numerate nell'ordine narrativo di `PAGINE_SITO`. Il tasto «Scopri di
   più» al centro porta alla sezione 01, così chi vuole leggere di seguito ha
   una porta sola da spingere.

   L'impianto (misura della scena, bracci, anello) sta in `ragnatela.ts`, in
   comune con la ragnatela della rete di /collabora.
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Posizione dei quattro nodi, in % della scena. Il centro è sempre (50,50).
 * L'ordine è ORARIO, non a griglia: così l'anello percorre 01→02→03→04 senza
 * tornare indietro e la lettura resta circolare.
 */
const NODI_DESKTOP: Punto[] = [
  { x: 15, y: 24 }, // 01 · in alto a sinistra
  { x: 85, y: 24 }, // 02 · in alto a destra
  { x: 85, y: 76 }, // 03 · in basso a destra
  { x: 15, y: 76 }, // 04 · in basso a sinistra
]

/** Su schermo stretto la ragnatela resta la stessa, ma si allunga in
 *  verticale: due bolle sopra il marchio e due sotto. Stesso giro orario. */
const NODI_MOBILE: Punto[] = [
  { x: 24, y: 11 },
  { x: 76, y: 11 },
  { x: 76, y: 89 },
  { x: 24, y: 89 },
]

/** Ritmi di fluttuazione diversi per nodo: la scena non deve pulsare a tempo. */
const RITMI = [
  { durata: '7.5s', ritardo: '0s' },
  { durata: '8.6s', ritardo: '-2.4s' },
  { durata: '9.2s', ritardo: '-4.1s' },
  { durata: '8.1s', ritardo: '-6.3s' },
]

export function RagnatelaSito() {
  const { scena, nucleo, box, nodi, punti, bracci, disegnabile } = useRagnatela(
    NODI_DESKTOP,
    NODI_MOBILE,
  )

  return (
    <section className="relative overflow-hidden border-b-[1.5px] border-ink bg-paper">
      {/* Alone verde dietro al marchio: dà profondità senza introdurre un
          fondo scuro estraneo al resto del sito. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            'radial-gradient(circle at center, var(--color-eco-50) 0%, transparent 62%)',
        }}
      />

      <div className="relative mx-auto max-w-5xl px-5 py-10 lg:px-8 lg:py-14">
        {/* Il titolo resta per lettori di schermo e motori di ricerca: a
            video il suo posto lo prende la scena. */}
        <h2 className="sr-only">renova, per intero: le quattro sezioni del sito</h2>

        <div
          ref={scena}
          className="relative h-[560px] w-full sm:h-[600px] lg:h-[620px]"
        >
          {/* ── Bracci ── */}
          {disegnabile && (
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full"
              width={box.w}
              height={box.h}
              viewBox={`0 0 ${box.w} ${box.h}`}
            >
              {/* Anello della ragnatela: unisce i quattro nodi, appena
                  accennato, ed è ciò che fa leggere la scena come una rete. */}
              <path
                d={anello(punti)}
                fill="none"
                stroke="var(--color-eco)"
                strokeWidth="1"
                strokeDasharray="3 7"
                strokeLinecap="round"
                opacity="0.28"
              />

              {bracci.map((b, i) => (
                <g key={i}>
                  <path d={b.d} fill="none" stroke="var(--color-edge)" strokeWidth="1.5" />
                  {/* Nodo di partenza: il filo non nasce dal nulla. */}
                  <circle cx={b.da.x} cy={b.da.y} r="2.5" fill="var(--color-eco)" opacity="0.45" />
                  {/* Impulso che corre verso la bolla. */}
                  <path
                    d={b.d}
                    className="renova-impulso"
                    fill="none"
                    stroke="var(--color-eco)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="30 4000"
                    style={
                      {
                        '--corsa': `${b.len * 1.1 + 30}px`,
                        animationDelay: `${i * 1.1}s`,
                      } as React.CSSProperties
                    }
                  />
                </g>
              ))}
            </svg>
          )}

          {/* ── Centro: marchio + porta d'ingresso al racconto ── */}
          <div
            ref={nucleo}
            className="absolute left-1/2 top-1/2 z-20 w-[220px] -translate-x-1/2 -translate-y-1/2 sm:w-[260px]"
          >
            <div className="renova-fluttua flex flex-col items-center text-center">
              <RenovaMark className="renova-orbita h-14 w-14 text-eco sm:h-16 sm:w-16" />
              <span className="mt-3 font-display text-[30px] font-extrabold leading-none tracking-[-0.035em] text-ink sm:text-[36px]">
                renova
              </span>
              <Link
                to={PAGINE_SITO[0].to}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-eco px-6 py-3.5 text-[13px] lg:text-[15px] font-bold uppercase tracking-[0.06em] text-white shadow-sm transition hover:bg-eco-600 active:scale-[.99]"
              >
                Scopri di più
                <FrecciaIcon />
              </Link>
              <span className="mt-3 text-[11px] lg:text-[12px] leading-snug text-ink-muted">
                Quattro sezioni, un solo filo
              </span>
            </div>
          </div>

          {/* ── Bolle ── */}
          {nodi.map((n, i) => (
            <div
              key={PAGINE_SITO[i].to}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
            >
              <div
                className="renova-fluttua"
                style={{ animationDuration: RITMI[i].durata, animationDelay: RITMI[i].ritardo }}
              >
                <Bolla indice={i} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   Bolla: numero, nome della sezione e la dicitura «Vai qui →», che compare
   al passaggio del cursore (e resta sempre visibile dove non c'è hover).
   ════════════════════════════════════════════════════════════════════════ */

function Bolla({ indice }: { indice: number }) {
  const pagina = PAGINE_SITO[indice]
  return (
    <Link
      to={pagina.to}
      aria-label={`${pagina.label} — ${pagina.sommario}`}
      className="group flex h-[132px] w-[132px] flex-col items-center justify-center rounded-full border-[1.5px] border-ink bg-paper px-4 text-center shadow-[0_10px_30px_-18px_rgba(0,0,0,0.55)] transition duration-300 hover:-translate-y-1 hover:border-eco hover:shadow-[0_18px_38px_-18px_rgba(22,162,89,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco focus-visible:ring-offset-2 sm:h-[156px] sm:w-[156px] lg:h-[176px] lg:w-[176px]"
    >
      <span className="text-[10px] lg:text-[11px] font-bold tracking-[0.14em] text-ink-muted transition group-hover:text-eco-700">
        {String(indice + 1).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[13px] font-extrabold leading-tight tracking-[-0.02em] text-ink sm:text-[15px] lg:text-[18px]">
        {pagina.label}
      </span>
      {/* Riga sempre presente nel flusso (niente scatto al passaggio del
          cursore): cambia solo l'opacità. Dove l'hover non esiste — dito su
          touch — la dicitura è mostrata da subito. */}
      <span className="renova-vai mt-2 inline-flex items-center gap-1 text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.06em] text-eco-700 opacity-0 transition duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
        Vai qui
        <FrecciaIcon className="h-3 w-3" />
      </span>
    </Link>
  )
}

function FrecciaIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M5 12h13m-5-6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
