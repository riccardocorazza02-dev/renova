import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PAGINE_SITO } from './sito'
import { RenovaMark } from './Logo'

/* ──────────────────────────────────────────────────────────────────────────
   RAGNATELA DEL SITO — la scena interattiva che chiude la home.

   Al centro il marchio (pittogramma + logotipo) fluttua piano, e da lì
   partono quattro bracci che finiscono nelle quattro bolle delle pagine del
   sito, numerate nell'ordine narrativo di `PAGINE_SITO`. Il tasto «Scopri di
   più» al centro porta alla sezione 01, così chi vuole leggere di seguito ha
   una porta sola da spingere.

   Impianto: le posizioni dei nodi sono in PERCENTUALE della scena (due set,
   mobile e desktop); un ResizeObserver misura la scena in pixel e i bracci
   vengono disegnati in un SVG con la stessa unità, senza deformazioni. Le
   bolle sono opache e coprono la fine del braccio: così possono fluttuare
   senza staccarsi dal filo.
   ────────────────────────────────────────────────────────────────────────── */

type Punto = { x: number; y: number }

/** Posizione dei quattro nodi, in % della scena. Il centro è sempre (50,50). */
const NODI_DESKTOP: Punto[] = [
  { x: 15, y: 24 }, // 01 · in alto a sinistra
  { x: 85, y: 24 }, // 02 · in alto a destra
  { x: 15, y: 76 }, // 03 · in basso a sinistra
  { x: 85, y: 76 }, // 04 · in basso a destra
]

/** Su schermo stretto la ragnatela resta la stessa, ma si allunga in
 *  verticale: due bolle sopra il marchio e due sotto. */
const NODI_MOBILE: Punto[] = [
  { x: 24, y: 11 },
  { x: 76, y: 11 },
  { x: 24, y: 89 },
  { x: 76, y: 89 },
]

/** Ritmi di fluttuazione diversi per nodo: la scena non deve pulsare a tempo. */
const RITMI = [
  { durata: '7.5s', ritardo: '0s' },
  { durata: '8.6s', ritardo: '-2.4s' },
  { durata: '9.2s', ritardo: '-4.1s' },
  { durata: '8.1s', ritardo: '-6.3s' },
]

const BP_DESKTOP = '(min-width: 768px)'

export function RagnatelaSito() {
  const scena = useRef<HTMLDivElement>(null)
  const nucleo = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  /** Semiassi del "nucleo" centrale: i bracci partono da qui, non dal centro. */
  const [core, setCore] = useState({ rx: 120, ry: 110 })
  const [desktop, setDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(BP_DESKTOP).matches,
  )

  // Le due misure che servono al disegno: larghezza/altezza della scena…
  // (misura diretta + ResizeObserver + resize della finestra: il solo
  // observer non basta, in una scheda che non dipinge non viene consegnato)
  useLayoutEffect(() => {
    const el = scena.current
    if (!el) return
    const misura = () => {
      const r = el.getBoundingClientRect()
      setBox((p) => (p.w === r.width && p.h === r.height ? p : { w: r.width, h: r.height }))
      // …e l'ingombro del blocco centrale, da cui i bracci devono uscire:
      // partendo dal centro geometrico passerebbero sopra al marchio e alla
      // didascalia, rendendoli illeggibili.
      const c = nucleo.current
      if (c) {
        const n = c.getBoundingClientRect()
        const rx = n.width / 2 + 18
        const ry = n.height / 2 + 18
        setCore((p) => (p.rx === rx && p.ry === ry ? p : { rx, ry }))
      }
    }
    misura()
    const ro = new ResizeObserver(misura)
    ro.observe(el)
    window.addEventListener('resize', misura)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', misura)
    }
  }, [])

  // …e quale dei due set di posizioni è attivo.
  useEffect(() => {
    const mq = window.matchMedia(BP_DESKTOP)
    const aggiorna = () => setDesktop(mq.matches)
    aggiorna()
    mq.addEventListener('change', aggiorna)
    return () => mq.removeEventListener('change', aggiorna)
  }, [])

  const nodi = desktop ? NODI_DESKTOP : NODI_MOBILE
  const centro: Punto = { x: box.w / 2, y: box.h / 2 }
  const punti = nodi.map((n) => ({ x: (n.x / 100) * box.w, y: (n.y / 100) * box.h }))
  const bracci = punti.map((p) => braccio(centro, p, core))
  const disegnabile = box.w > 0 && box.h > 0

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
        <h2 className="sr-only">Il progetto, per intero: le quattro sezioni del sito</h2>

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
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-eco px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-white shadow-sm transition hover:bg-eco-600 active:scale-[.99]"
              >
                Scopri di più
                <FrecciaIcon />
              </Link>
              <span className="mt-3 max-w-[200px] text-[11px] leading-snug text-ink-muted">
                Quattro sezioni, un filo solo: parti dalla 01.
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
      <span className="text-[10px] font-bold tracking-[0.14em] text-ink-muted transition group-hover:text-eco-700">
        {String(indice + 1).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[13px] font-extrabold leading-tight tracking-[-0.02em] text-ink sm:text-[15px] lg:text-[16px]">
        {pagina.label}
      </span>
      {/* Riga sempre presente nel flusso (niente scatto al passaggio del
          cursore): cambia solo l'opacità. Dove l'hover non esiste — dito su
          touch — la dicitura è mostrata da subito. */}
      <span className="renova-vai mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.06em] text-eco-700 opacity-0 transition duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
        Vai qui
        <FrecciaIcon className="h-3 w-3" />
      </span>
    </Link>
  )
}

/* ── Geometria ── */

/**
 * Braccio dal nucleo al nodo.
 *
 * Non parte dal centro geometrico ma dal punto in cui il raggio esce
 * dall'ellisse del blocco centrale (`core`): così il filo non attraversa
 * marchio, tasto e didascalia.
 *
 * L'inarcatura è appena accennata e ha lo STESSO verso di rotazione su tutti
 * e quattro i bracci: curvature alternate si incrociavano sotto al logo.
 */
function braccio(centro: Punto, nodo: Punto, core: { rx: number; ry: number }) {
  const dx = nodo.x - centro.x
  const dy = nodo.y - centro.y

  // t = frazione del raggio a cui si trova il bordo dell'ellisse del nucleo
  const t = Math.min(0.85, 1 / (Math.hypot(dx / core.rx, dy / core.ry) || 1))
  const da: Punto = { x: centro.x + dx * t, y: centro.y + dy * t }

  const vx = nodo.x - da.x
  const vy = nodo.y - da.y
  const vlen = Math.hypot(vx, vy) || 1
  const arco = vlen * 0.09
  const cx = (da.x + nodo.x) / 2 + (-vy / vlen) * arco
  const cy = (da.y + nodo.y) / 2 + (vx / vlen) * arco

  return { da, len: vlen, d: `M ${da.x} ${da.y} Q ${cx} ${cy} ${nodo.x} ${nodo.y}` }
}

/** Anello che unisce i quattro nodi, con gli archi spinti verso l'esterno. */
function anello(p: Punto[]) {
  if (p.length < 4) return ''
  // ordine perimetrale: 01 → 02 → 04 → 03 → 01 (i nodi stanno in griglia)
  const giro = [p[0], p[1], p[3], p[2]]
  const bx = giro.reduce((s, n) => s + n.x, 0) / 4
  const by = giro.reduce((s, n) => s + n.y, 0) / 4
  const k = 0.22 // quanto l'arco si allontana dal baricentro

  return giro
    .map((n, i) => {
      const succ = giro[(i + 1) % giro.length]
      const mx = (n.x + succ.x) / 2
      const my = (n.y + succ.y) / 2
      const cx = mx + (mx - bx) * k
      const cy = my + (my - by) * k
      return `${i === 0 ? `M ${n.x} ${n.y} ` : ''}Q ${cx} ${cy} ${succ.x} ${succ.y}`
    })
    .join(' ')
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
