import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/* ──────────────────────────────────────────────────────────────────────────
   IMPIANTO CONDIVISO DELLE RAGNATELE del sito — la scena interattiva usata
   dalla home (`RagnatelaSito`: le quattro pagine) e da /collabora
   (`RagnatelaRete`: gli attori della rete).

   Le posizioni dei nodi sono in PERCENTUALE della scena (due set, mobile e
   desktop); un ResizeObserver misura la scena in pixel e i bracci vengono
   disegnati in un SVG con la stessa unità, senza deformazioni. Le bolle sono
   opache e coprono la fine del braccio: così possono fluttuare senza
   staccarsi dal filo.
   ────────────────────────────────────────────────────────────────────────── */

export type Punto = { x: number; y: number }

const BP_DESKTOP = '(min-width: 768px)'

/**
 * Misura la scena e restituisce tutto ciò che serve a disegnarla: i nodi
 * attivi (set desktop o mobile), i loro punti in pixel e i bracci che li
 * legano al nucleo centrale.
 *
 * I due `ref` vanno appesi rispettivamente alla scena (il riquadro che
 * contiene tutto) e al nucleo (il blocco centrale col marchio).
 */
export function useRagnatela(nodiDesktop: Punto[], nodiMobile: Punto[]) {
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

  const nodi = desktop ? nodiDesktop : nodiMobile
  const centro: Punto = { x: box.w / 2, y: box.h / 2 }
  const punti = nodi.map((n) => ({ x: (n.x / 100) * box.w, y: (n.y / 100) * box.h }))
  const bracci = punti.map((p) => braccio(centro, p, core))

  return { scena, nucleo, box, nodi, punti, bracci, disegnabile: box.w > 0 && box.h > 0 }
}

/* ── Geometria ── */

/**
 * Dispone `n` nodi su un'ellisse centrata in (50,50), in senso ORARIO a
 * partire dall'alto: l'anello li percorre senza tornare indietro e la lettura
 * resta circolare. `rx`/`ry` sono semiassi in % della scena.
 */
export function nodiInCerchio(n: number, rx: number, ry: number, avvio = -90): Punto[] {
  return Array.from({ length: n }, (_, i) => {
    const a = ((avvio + (360 / n) * i) * Math.PI) / 180
    return { x: 50 + rx * Math.cos(a), y: 50 + ry * Math.sin(a) }
  })
}

/**
 * Braccio dal nucleo al nodo.
 *
 * Non parte dal centro geometrico ma dal punto in cui il raggio esce
 * dall'ellisse del blocco centrale (`core`): così il filo non attraversa
 * marchio, tasto e didascalia.
 *
 * L'inarcatura è appena accennata e ha lo STESSO verso di rotazione su tutti
 * i bracci: curvature alternate si incrociavano sotto al logo.
 */
export function braccio(centro: Punto, nodo: Punto, core: { rx: number; ry: number }) {
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

/** Anello che unisce i nodi, con gli archi spinti verso l'esterno. */
export function anello(giro: Punto[], k = 0.22) {
  if (giro.length < 3) return ''
  // i nodi sono già in ordine orario: l'anello li segue senza incroci
  const bx = giro.reduce((s, n) => s + n.x, 0) / giro.length
  const by = giro.reduce((s, n) => s + n.y, 0) / giro.length

  return giro
    .map((n, i) => {
      const succ = giro[(i + 1) % giro.length]
      const mx = (n.x + succ.x) / 2
      const my = (n.y + succ.y) / 2
      const cx = mx + (mx - bx) * k // quanto l'arco si allontana dal baricentro
      const cy = my + (my - by) * k
      return `${i === 0 ? `M ${n.x} ${n.y} ` : ''}Q ${cx} ${cy} ${succ.x} ${succ.y}`
    })
    .join(' ')
}
