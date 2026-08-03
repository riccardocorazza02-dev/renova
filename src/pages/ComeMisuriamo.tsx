import { Link } from 'react-router-dom'
import {
  ArrowRightIcon,
  Fonte,
  PDF_METODOLOGIA,
  SitoLayout,
  TestataPagina,
} from '../components/sito'

/* ──────────────────────────────────────────────────────────────────────────
   /come-misuriamo — la pagina «Impatto» del menu. Racconta il METODO con cui
   stimiamo il beneficio ambientale evitato, non i risultati (che non esistono
   ancora: la piattaforma non ha utenti reali).

   ⚠️ La rotta non è `/impatto`: quella è la dashboard dell'app.
   ⚠️ Questa pagina rimanda al documento metodologico, non lo riproduce.
   Concetti da non tradire: fibra ≠ capo finito (l'impatto reale è sempre
   superiore); acqua blu ≠ water footprint totale.
   ────────────────────────────────────────────────────────────────────────── */

/** I quattro pilastri del metodo (§4 del documento di packaging). */
const METODO: Array<{ titolo: string; testo: string }> = [
  {
    titolo: 'Confine di sistema: cradle-to-gate a livello di fibra',
    testo:
      'Contiamo l’impatto dalla materia prima alla produzione della fibra, escludendo filatura, tessitura, tintura e confezione. Significa che i nostri valori sono, per costruzione, una sottostima dell’impatto reale del capo finito.',
  },
  {
    titolo: 'Stima a livelli di confidenza crescente',
    testo:
      'Livello 0 (profilo prudenziale di categoria) e Livello 1 (blend selezionato dall’utente) sono attivi; il Livello 2 (riconoscimento fotografico dell’etichetta) è progettato per il futuro. In mancanza di prova, assumiamo sempre la fibra a impatto più basso.',
  },
  {
    titolo: 'Lacune dichiarate, non colmate con numeri inventati',
    testo:
      'Dove la letteratura affidabile non fornisce il consumo idrico di una fibra, lo poniamo pari a zero anziché stimarlo. Il limite resta scritto nel documento metodologico, non nascosto.',
  },
  {
    titolo: 'Assunzione di sostituzione, comunicata come stima',
    testo:
      'L’impatto «evitato» presuppone che il capo riusato sostituisca un acquisto nuovo. È una stima documentata, non un dato certificato — e la presentiamo come tale.',
  },
]

export function ComeMisuriamo() {
  return (
    <SitoLayout>
      <section className="border-b-[1.5px] border-ink">
        <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
          <TestataPagina
            occhiello="Impatto"
            titolo={<>Misuriamo il beneficio. E lo sottostimiamo apposta.</>}
          >
            <p>
              Dire «riusare fa bene all’ambiente» è facile. Metterci un numero onesto è un’altra
              cosa. Renova stima l’impatto evitato da ogni scambio con un criterio dichiaratamente
              prudenziale: quando c’è un dubbio, scegliamo sempre l’ipotesi che{' '}
              <i>abbassa</i> il beneficio dichiarato. È il contrario del greenwashing.
            </p>
          </TestataPagina>

          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            {METODO.map((m, i) => (
              <article key={m.titolo} className="rounded-2xl border border-edge bg-paper p-5 lg:p-6">
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 className="mt-2 text-[18px] leading-snug lg:text-[19px]">{m.titolo}</h2>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-soft lg:text-[15px]">
                  {m.testo}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Equivalenze />
      <LeggiMetodologia />
    </SitoLayout>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   Equivalenze — i numeri resi tangibili, con le fonti sempre esplicitate
   ════════════════════════════════════════════════════════════════════════ */

function Equivalenze() {
  return (
    <section className="border-b-[1.5px] border-ink bg-eco-50/40">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-16">
        <div className="max-w-3xl">
          <span className="eyebrow">Equivalenze</span>
          <h2 className="mt-2 text-[28px] leading-tight sm:text-[34px]">
            Un numero che nessuno sa leggere non serve a niente.
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">
            Le stime si traducono in equivalenze concrete: la CO₂ risparmiata come chilometri in
            auto evitati, l’acqua come numero di docce. Sono equivalenze indicative, e la fonte di
            ciascun fattore di conversione è sempre dichiarata nell’app.
          </p>
        </div>

        {/* Grafica-dato: un paio di scarpe, l'articolo a più alto impatto
            unitario del catalogo, tradotto nelle due equivalenze. */}
        <div className="mt-10 overflow-hidden rounded-2xl border-[1.5px] border-ink bg-paper">
          <div className="border-b border-line px-6 py-5 lg:px-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">
              Esempio · un paio di scarpe sportive rimesso in circolo
            </p>
          </div>
          <div className="grid gap-px bg-line sm:grid-cols-2">
            <Equivalenza
              metrica="13,6 kg CO₂e"
              etichetta="Carbon footprint di produzione"
              equivale="≈ 109 km in auto"
              nota="con un fattore prudenziale di ~125 g CO₂/km sul parco circolante"
              tono="eco"
            />
            <Equivalenza
              metrica="≥ 1.500 L"
              etichetta="Water footprint di produzione"
              equivale="≈ 19 docce"
              nota="una doccia di circa 8 minuti a ~10 L/min"
              tono="water"
            />
          </div>
        </div>
        <Fonte>
          Impatto del paio di scarpe: analisi del ciclo di vita di una calzatura sportiva sintetica
          condotta dal Massachusetts Institute of Technology (Cheah et al., 2013), adottata come
          valore fisso di categoria nel documento metodologico. Fattore auto: le auto nuove
          immatricolate nell’UE emettono in media 106,4 g CO₂/km (2023, EEA); usiamo ~125 g/km,
          più prudente, per rappresentare il parco circolante. Le stime restano una sottostima:
          coprono la fibra, non il capo finito.
        </Fonte>
      </div>
    </section>
  )
}

function Equivalenza({
  metrica,
  etichetta,
  equivale,
  nota,
  tono,
}: {
  metrica: string
  etichetta: string
  equivale: string
  nota: string
  tono: 'eco' | 'water'
}) {
  return (
    <div className="bg-paper p-6 lg:p-8">
      <p
        className={`text-[34px] font-extrabold leading-none tracking-[-0.04em] lg:text-[40px] ${
          tono === 'eco' ? 'text-eco' : 'text-water-600'
        }`}
      >
        {metrica}
      </p>
      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
        {etichetta}
      </p>
      <p className="mt-5 border-t border-line pt-4 text-[20px] font-extrabold leading-tight tracking-[-0.03em] text-ink">
        {equivale}
      </p>
      <p className="mt-1.5 text-[12px] leading-snug text-ink-soft">{nota}</p>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   Rimando al documento metodologico
   ════════════════════════════════════════════════════════════════════════ */

function LeggiMetodologia() {
  return (
    <section className="border-b-[1.5px] border-ink bg-ink text-paper">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-14 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-16">
        <div className="max-w-2xl">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-eco">
            Documento pubblico
          </span>
          <h2 className="mt-2 text-[26px] leading-tight text-paper sm:text-[32px]">
            Fattori d’impatto, fonti e formule: è tutto scritto.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#c9c8c2] lg:text-[16px]">
            Il metodo completo — impatto per fibra con la fonte di ogni valore, blend
            rappresentativi, pesi di categoria e formule di calcolo — è raccolto in un documento
            metodologico pubblico, liberamente consultabile e scaricabile. Chi vuole verificarne i
            fondamenti può farlo.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
          <Link
            to="/metodologia"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-eco px-7 py-4 text-[14px] font-bold uppercase tracking-[0.06em] text-white transition hover:bg-eco-600 active:scale-[.99]"
          >
            Leggi la metodologia
            <ArrowRightIcon />
          </Link>
          <a
            href={PDF_METODOLOGIA}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center justify-center rounded-lg border border-[#4a4941] px-7 py-4 text-[14px] font-bold uppercase tracking-[0.06em] text-paper transition hover:bg-paper hover:text-ink"
          >
            Scarica il PDF
          </a>
        </div>
      </div>
    </section>
  )
}
