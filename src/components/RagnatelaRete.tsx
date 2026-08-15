import { RenovaMark } from './Logo'
import { anello, nodiInCerchio, useRagnatela } from './ragnatela'

/* ──────────────────────────────────────────────────────────────────────────
   RAGNATELA DELLA RETE — la scena di /collabora.

   Stessa lingua visiva della ragnatela della home (`RagnatelaSito.tsx`, con
   cui condivide l'impianto in `ragnatela.ts`): al centro il marchio
   (pittogramma + logotipo) che fluttua e gira piano, e da lì i bracci verso
   le bolle dei possibili interlocutori — anch'esse fluttuanti, ognuna col
   proprio ritmo.

   Cinque nodi e non sei: produttori e software gestionali stanno insieme
   nella bolla «Imprese private», che li dichiara nella didascalia.

   A differenza della home le bolle NON sono link (non c'è una pagina per
   ogni attore): la porta d'ingresso è il form qui sotto.
   ────────────────────────────────────────────────────────────────────────── */

/** I nodi della rete, in ordine ORARIO a partire dall'alto. */
const NODI = [
  { nome: 'Club ASD e SSD', nota: 'dove la rete comincia' },
  { nome: 'Federazioni', nota: 'regole e diffusione' },
  { nome: 'Imprese private', nota: 'produttori e software gestionali' },
  { nome: 'Terzo settore', nota: 'accesso e inclusione' },
  { nome: 'Amministrazioni', nota: 'territorio e impianti' },
]

/** Su desktop il giro è un cerchio pieno; su mobile si allunga in verticale,
 *  perché la larghezza è l'unica misura che manca davvero. */
const NODI_DESKTOP = nodiInCerchio(NODI.length, 36, 36)
const NODI_MOBILE = nodiInCerchio(NODI.length, 33, 40)

/** Ritmi di fluttuazione diversi per nodo: la scena non deve pulsare a tempo. */
const RITMI = [
  { durata: '7.5s', ritardo: '0s' },
  { durata: '8.6s', ritardo: '-2.4s' },
  { durata: '9.2s', ritardo: '-4.1s' },
  { durata: '8.1s', ritardo: '-6.3s' },
  { durata: '7.9s', ritardo: '-3.2s' },
]

export function RagnatelaRete() {
  const { scena, nucleo, box, nodi, punti, bracci, disegnabile } = useRagnatela(
    NODI_DESKTOP,
    NODI_MOBILE,
  )

  return (
    <div className="relative mt-8 lg:mt-10">
      {/* Alone verde dietro al marchio: dà profondità senza introdurre un
          fondo scuro estraneo al resto del sito. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, var(--color-eco-50) 0%, transparent 62%)',
        }}
      />

      {/* L'elenco per i lettori di schermo: sul disegno le didascalie sono
          nascoste sotto `sm`, qui la rete resta completa. */}
      <p className="sr-only">
        La rete di renova: {NODI.map((n) => `${n.nome} (${n.nota})`).join(', ')}.
      </p>

      <div ref={scena} className="relative h-[560px] w-full sm:h-[620px] lg:h-[640px]">
        {/* ── Bracci ── */}
        {disegnabile && (
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
            width={box.w}
            height={box.h}
            viewBox={`0 0 ${box.w} ${box.h}`}
          >
            {/* Anello della ragnatela: unisce i nodi fra loro, appena
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
                      animationDelay: `${i * 0.9}s`,
                    } as React.CSSProperties
                  }
                />
              </g>
            ))}
          </svg>
        )}

        {/* ── Centro: pittogramma + logotipo ── */}
        <div
          ref={nucleo}
          className="absolute left-1/2 top-1/2 z-20 w-[88px] -translate-x-1/2 -translate-y-1/2 sm:w-[132px] lg:w-[148px]"
        >
          <div className="renova-fluttua flex flex-col items-center text-center">
            <RenovaMark className="renova-orbita h-10 w-10 text-eco sm:h-14 sm:w-14 lg:h-16 lg:w-16" />
            <span className="mt-2 font-display text-[22px] font-extrabold leading-none tracking-[-0.035em] text-ink sm:mt-3 sm:text-[30px] lg:text-[34px]">
              renova
            </span>
          </div>
        </div>

        {/* ── Bolle ── */}
        {nodi.map((n, i) => (
          <div
            key={NODI[i].nome}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
          >
            <div
              className="renova-fluttua"
              style={{ animationDuration: RITMI[i].durata, animationDelay: RITMI[i].ritardo }}
            >
              <Bolla nome={NODI[i].nome} nota={NODI[i].nota} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Bolla di un attore della rete: nome e, da `sm` in su, cosa porta. */
function Bolla({ nome, nota }: { nome: string; nota: string }) {
  return (
    <div
      aria-hidden="true"
      className="flex h-[96px] w-[96px] flex-col items-center justify-center rounded-full border-[1.5px] border-ink bg-paper px-2 text-center shadow-[0_10px_30px_-18px_rgba(0,0,0,0.55)] sm:h-[136px] sm:w-[136px] sm:px-4 lg:h-[160px] lg:w-[160px]"
    >
      <span className="text-[10px] font-extrabold leading-tight tracking-[-0.02em] text-ink sm:text-[14px] lg:text-[15px]">
        {nome}
      </span>
      <span className="mt-1.5 hidden text-[10px] leading-snug text-ink-muted sm:block lg:text-[11px]">
        {nota}
      </span>
    </div>
  )
}
