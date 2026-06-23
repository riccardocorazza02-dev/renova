import { useState } from 'react'

// ── Area Q&A: come si calcola l'impatto + criteri anti-greenwashing ──────
// Sintesi divulgativa della nota metodologica di Renova (giugno 2026).
// Vive nella pagina Profilo come sotto-sezione collassabile: l'utente apre la
// scheda e trova le domande/risposte all'interno.

function QA({
  domanda,
  children,
}: {
  domanda: string
  children: React.ReactNode
}) {
  return (
    <details className="group border-b border-line last:border-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
        <span>{domanda}</span>
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
      <div className="space-y-2 pb-4 text-sm leading-relaxed text-ink-soft">
        {children}
      </div>
    </details>
  )
}

/**
 * Scheda collassabile «Come calcoliamo l'impatto»: chiusa di default, si apre
 * con un tap rivelando le Q&A su metodo di stima e anti-greenwashing.
 */
export function MetodologiaFAQ() {
  const [aperta, setAperta] = useState(false)

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-paper">
      <button
        type="button"
        onClick={() => setAperta((v) => !v)}
        aria-expanded={aperta}
        className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-surface"
      >
        <div>
          <h2 className="text-[15px] font-extrabold uppercase tracking-[0.02em] text-ink">
            Come calcoliamo l'impatto
          </h2>
          <p className="mt-0.5 text-sm text-ink-soft">
            Metodo di stima e criteri anti-greenwashing.
          </p>
        </div>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={`shrink-0 text-ink-soft transition-transform duration-200 ${
            aperta ? 'rotate-180' : ''
          }`}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {aperta && (
        <div className="px-4 pb-4">
          <div className="-mb-1 border-t border-line pt-1">
            <QA domanda="Come calcola Renova l'impatto di un articolo?">
              <p>
                Partiamo dalle <strong>fibre</strong> con cui è fatto il capo. Ogni
                fibra ha un fattore d'impatto (CO₂ in kg CO₂e e acqua in litri per
                ogni kg di fibra). L'impatto di un tessuto è la{' '}
                <strong>media pesata</strong> dei fattori delle sue fibre, secondo
                le percentuali di composizione; il risultato si moltiplica poi per
                il <strong>peso del capo</strong>.
              </p>
              <p className="rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink">
                Esempio: una maglia tecnica in 100% poliestere da 0,15 kg →
                0,15 × 3,12 = <strong>0,47 kg CO₂e</strong> e 0,15 × 62 ={' '}
                <strong>9,3 L d'acqua</strong>.
              </p>
              <p>
                Il numero che vedi è il <strong>risparmio</strong>: l'impatto di
                produzione che eviti riusando il capo invece di comprarne uno
                identico nuovo.
              </p>
            </QA>

            <QA domanda="Da dove vengono i dati delle fibre?">
              <p>
                Consideriamo le <strong>10 fibre</strong> più diffuse nei capi
                sportivi (poliestere vergine e riciclato, cotone, elastan,
                poliammide, poliuretano, acrilico, lana, viscosa, polipropilene).
              </p>
              <p>
                I fattori d'impatto di ciascuna fibra provengono da{' '}
                <strong>fonti scientifiche e tecniche riconosciute</strong> —
                Carbonfact, CarbonCloud, la <em>Fiber Bible</em> (RISE), Qian et al.
                (2021) e <em>Resources</em> (MDPI, 2022). Quando in letteratura
                esistono più valori, scegliamo in modo trasparente il{' '}
                <strong>valore centrale</strong> dell'intervallo.
              </p>
            </QA>

            <QA domanda="Cosa significa «Almeno X»?">
              <p>
                Spesso la composizione esatta non è nota (etichette sbiadite,
                tagliate o assenti). Per questo usiamo una{' '}
                <strong>stima a livelli</strong>, sempre con la migliore
                informazione disponibile:
              </p>
              <ul className="space-y-1.5">
                <li>
                  <strong>Stima prudenziale:</strong> se non hai indicato il
                  materiale, applichiamo il profilo prudente della categoria e lo
                  comunichiamo come minimo («Almeno X»).
                </li>
                <li>
                  <strong>Stima guidata:</strong> scegli tra poche opzioni di
                  materiale (es. «tecnico» o «cotone»), con istruzioni per
                  riconoscerlo al tatto e alla vista.
                </li>
                <li>
                  <strong>Stima verificata:</strong> c'è la foto dell'etichetta, da
                  cui leggere la composizione reale — la massima affidabilità.
                </li>
              </ul>
              <p>
                La <strong>stima guidata</strong> e la{' '}
                <strong>stima verificata</strong> alzano il valore{' '}
                <strong>solo se c'è una prova</strong>: la stima prudenziale è il
                pavimento onesto del risparmio.
              </p>
            </QA>

            <QA domanda="Perché il cotone cambia così tanto la stima dell'acqua?">
              <p>
                Perché le fibre hanno impatti idrici molto diversi: il cotone
                consuma circa <strong>4.800 L/kg</strong>, il poliestere solo{' '}
                <strong>62 L/kg</strong>.
              </p>
              <p>
                La stessa maglia da 0,15 kg consuma ~9 L d'acqua se è in poliestere
                ma ~<strong>720 L</strong> se è in cotone. Ecco perché capire se è
                presente il cotone è il fattore decisivo della stima — ed è proprio
                qui che si annida il rischio di greenwashing.
              </p>
            </QA>

            <QA domanda="Come fate a evitare il greenwashing?">
              <p>Il metodo segue quattro principi:</p>
              <ul className="space-y-1.5">
                <li>
                  <strong>Asimmetria prudenziale:</strong> in caso di dubbio
                  assumiamo il materiale a impatto idrico più basso (sintetico); il
                  cotone si conta solo con una prova (tua indicazione o etichetta).
                </li>
                <li>
                  <strong>Confine sottostimato per scelta:</strong> consideriamo
                  solo la produzione della fibra (cradle-to-gate), escludendo la
                  manifattura del capo → il valore è già conservativo.
                </li>
                <li>
                  <strong>Niente falsa precisione:</strong> i risultati sono
                  comunicati come stima, nel default con la formula «Almeno X», non
                  come dato certificato.
                </li>
                <li>
                  <strong>Tracciabilità della provenienza:</strong> indichiamo
                  sempre da dove arriva la stima (categoria, tua indicazione o
                  etichetta).
                </li>
              </ul>
            </QA>

            <QA domanda="Quanto sono accurate le stime?">
              <p>
                Dipende da quanto sappiamo del materiale del capo:{' '}
                <strong>più informazioni abbiamo, più la stima è precisa.</strong>
              </p>
              <ul className="space-y-1.5">
                <li>
                  📷 Se c'è la <strong>foto dell'etichetta</strong>, sappiamo
                  esattamente di cosa è fatto: la stima è precisa.
                </li>
                <li>
                  👉 Se il venditore <strong>indica il materiale</strong> (es.
                  «tecnico» o «cotone»), la stima è buona.
                </li>
                <li>
                  🛡️ Se <strong>non lo sappiamo</strong>, restiamo prudenti e
                  mostriamo un valore minimo («almeno»).
                </li>
              </ul>
              <p>
                In pratica non gonfiamo mai i numeri: li alziamo solo quando c'è una
                prova. Così il risparmio dichiarato è sempre reale o sottostimato,
                mai esagerato.
              </p>
            </QA>

            <QA domanda="Cosa NON è incluso nel calcolo?">
              <p>
                Il confine è <strong>cradle-to-gate di fibra</strong>: copre
                l'impatto dall'estrazione/coltivazione fino alla fibra pronta.
                Restano <strong>esclusi</strong> filatura, tessitura, tintura e
                confezione del capo, oltre a trasporto, fase d'uso e fine vita.
              </p>
              <p>
                Di conseguenza i valori sono — per costruzione — una{' '}
                <strong>sottostima</strong> dell'impatto reale: una scelta coerente
                con la priorità anti-greenwashing. Alcuni dati restano da verificare
                (il polipropilene) o non disponibili (l'acqua di elastan e
                poliuretano, esclusa dal calcolo idrico).
              </p>
            </QA>
          </div>

          <p className="mt-3 rounded-lg border border-line bg-surface px-3.5 py-2.5 text-[11px] leading-relaxed text-ink-soft">
            Nota: le stime descritte non costituiscono una LCA certificata e vanno
            validate prima di qualsiasi dichiarazione ambientale rivolta al mercato.
            Sintesi della nota metodologica di Renova (versione giugno 2026).
          </p>
        </div>
      )}
    </section>
  )
}
