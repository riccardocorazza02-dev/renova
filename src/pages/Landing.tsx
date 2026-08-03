import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import {
  ArrowOutIcon,
  ArrowRightIcon,
  PAGINE_SITO,
  SURVEY_URL,
  SitoLayout,
} from '../components/sito'

/* ──────────────────────────────────────────────────────────────────────────
   HOME pubblica di Renova — è la schermata che si raggiunge dai motori di
   ricerca, e ospita SOLO l'hero: occhiello, promessa, dati del sondaggio,
   due porte d'azione soft e l'indice delle pagine del sito.

   Il racconto vero e proprio vive nelle pagine dedicate, raggiungibili
   dall'header e dalle card qui sotto (vedi `components/sito.tsx`):
   /progetto · /come-funziona · /come-misuriamo · /collabora

   Principio editoriale: il sito non converte, racconta. Nessuna CTA
   aggressiva; niente numeri che non vengano da una fonte dichiarata.
   ────────────────────────────────────────────────────────────────────────── */

/** Dati dell'indagine esplorativa presso famiglie e tesserati (106 risposte). */
const DATI_SONDAGGIO: Array<{ valore: string; testo: string }> = [
  {
    valore: '+90%',
    testo: 'degli intervistati è interessato a un servizio di scambio nel proprio club',
  },
  {
    valore: '+55%',
    testo: 'ogni stagione si ritrova materiale in buone condizioni rimasto inutilizzato',
  },
  {
    valore: '+55%',
    testo: 'spende oltre 100 € a stagione solo in materiale sportivo',
  },
]

export function Landing() {
  return (
    <SitoLayout senzaProssima>
      <Hero />
      <Indice />
    </SitoLayout>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   1 · HERO
   ════════════════════════════════════════════════════════════════════════ */

function Hero() {
  return (
    <section className="border-b-[1.5px] border-ink">
      <div className="mx-auto max-w-6xl px-5 py-12 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-8 lg:py-20">
        {/* Colonna sinistra: promessa + porte d'azione */}
        <div>
          <span className="eyebrow">Economia circolare per lo sport dilettantistico</span>
          <h1 className="mt-3 text-[34px] leading-[1.02] sm:text-[44px] lg:text-[52px]">
            La piattaforma che rimette in circolo il materiale sportivo ancora buono.
          </h1>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-ink-soft lg:text-[17px]">
            Renova permette ai tesserati di ASD e SSD di scambiarsi gratuitamente il materiale
            sportivo ancora in buone condizioni. Un gesto semplice con un doppio effetto: abbassa
            il costo dello sport per le famiglie ed evita un impatto ambientale che è già stato
            prodotto a monte.{' '}
            <span className="font-semibold text-ink">
              Non un’app da vendere, ma un progetto che misura ogni beneficio che genera.
            </span>
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/come-funziona"
              className="inline-flex items-center justify-center rounded-lg bg-eco px-7 py-4 text-[14px] font-bold uppercase tracking-[0.06em] text-white shadow-sm transition hover:bg-eco-600 active:scale-[.99]"
            >
              Scopri come funziona
            </Link>
            <Link
              to="/collabora"
              className="inline-flex items-center justify-center rounded-lg border-[1.5px] border-ink px-7 py-4 text-[14px] font-bold uppercase tracking-[0.06em] text-ink transition hover:bg-ink hover:text-paper active:scale-[.99]"
            >
              Collabora con noi
            </Link>
          </div>

          {/* Porta secondaria per genitori/tesserati — subordinata */}
          <div className="mt-5 rounded-xl border border-edge bg-eco-50/60 px-4 py-3.5 sm:max-w-md">
            <p className="text-[13px] text-ink-soft">
              Sei un <span className="font-semibold text-ink">genitore o un tesserato</span>? La
              tua opinione ci serve per costruire Renova.
            </p>
            <a
              href={SURVEY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-bold text-eco-700 underline-offset-4 hover:underline"
            >
              Compila il sondaggio per le famiglie
              <ArrowOutIcon />
            </a>
          </div>
        </div>

        {/* Colonna destra: mockup app */}
        <div className="mt-12 flex items-center justify-center lg:mt-0">
          <div className="relative">
            <PhoneFrame className="max-w-[260px]">
              <FeedMock />
            </PhoneFrame>
            {/* badge ESG fluttuante decorativo */}
            <div className="absolute -left-3 bottom-10 hidden rotate-[-4deg] rounded-xl border-[1.5px] border-ink bg-paper px-3 py-2 shadow-lg sm:block">
              <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-ink-muted">
                Risparmio misurato
              </p>
              <p className="text-[15px] font-extrabold text-eco">CO₂ · Acqua · €</p>
            </div>
          </div>
        </div>
      </div>

      {/* Striscia dati — indagine presso famiglie e tesserati */}
      <div className="border-t-[1.5px] border-ink bg-eco-50/40">
        <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-12">
          <span className="eyebrow">Cosa ci hanno detto le famiglie</span>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {DATI_SONDAGGIO.map((d) => (
              <div key={d.testo} className="rounded-2xl border border-edge bg-paper p-5">
                <p className="text-[40px] font-extrabold leading-none tracking-[-0.04em] text-eco">
                  {d.valore}
                </p>
                <p className="mt-3 text-[14px] leading-snug text-ink-soft">{d.testo}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-ink-muted">
            Indagine esplorativa condotta presso i tesserati di due società di pallacanestro del
            territorio bolognese (106 risposte, l’89% da genitori di tesserati). Rilevazione
            circoscritta: indica una tendenza, non consente generalizzazione statistica.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   2 · INDICE DEL SITO — le card che aprono le pagine dedicate
   ════════════════════════════════════════════════════════════════════════ */

function Indice() {
  return (
    <section className="border-b-[1.5px] border-ink">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-16">
        <div className="max-w-3xl">
          <span className="eyebrow">Il sito</span>
          <h2 className="mt-2 text-[28px] leading-tight sm:text-[34px]">
            Il progetto, per intero.
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">
            Renova non ha ancora utenti reali: quello che possiamo mostrare è il metodo con cui è
            stata costruita. Ogni pagina ne racconta una parte.
          </p>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          {PAGINE_SITO.map((p, i) => (
            <Link
              key={p.to}
              to={p.to}
              className="group flex flex-col rounded-2xl border border-edge bg-paper p-5 transition hover:border-eco hover:shadow-sm lg:p-6"
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 text-[20px] leading-tight lg:text-[22px]">{p.label}</h3>
              <p className="mt-2 flex-1 text-[14px] leading-relaxed text-ink-soft">{p.sommario}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.06em] text-eco-700">
                Apri
                <ArrowRightIcon />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   MOCKUP APP — ricreazione fedele dello schermo dentro una cornice iPhone
   ════════════════════════════════════════════════════════════════════════ */

function PhoneFrame({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`relative mx-auto w-full max-w-[250px] ${className}`}>
      <div className="relative aspect-[9/19] overflow-hidden rounded-[2.2rem] border-[3px] border-ink bg-paper shadow-[0_24px_50px_-20px_rgba(0,0,0,0.45)]">
        {/* notch */}
        <div className="absolute left-1/2 top-0 z-20 h-[18px] w-[90px] -translate-x-1/2 rounded-b-2xl bg-ink" />
        <div className="h-full w-full overflow-hidden">{children}</div>
      </div>
    </div>
  )
}

/** Barra superiore comune a tutti gli schermi: marchio + pill della società. */
function PhoneHeader() {
  return (
    <>
      <div className="h-[18px]" />
      <div className="flex items-center justify-between border-b-[1.5px] border-ink px-3 py-2">
        <Logo className="text-[12px]" />
        <span className="rounded-md border border-edge px-1.5 py-0.5 text-[6px] font-bold uppercase tracking-[0.06em] text-ink-soft">
          Bologna FC
        </span>
      </div>
    </>
  )
}

type NavKey = 'market' | 'impatto' | 'chat' | 'profilo'

/** Navigazione inferiore dell'app (Market · Impatto · Chat · Profilo) con il
 *  bottone "+" centrale rialzato, come negli schermi reali. */
function BottomNav({ active }: { active: NavKey }) {
  const Item = ({ k, label, icon }: { k: NavKey; label: string; icon: React.ReactNode }) => (
    <div
      className={`flex flex-1 flex-col items-center gap-0.5 ${
        active === k ? 'text-eco' : 'text-ink-faint'
      }`}
    >
      {icon}
      <span className="text-[5px] font-bold uppercase tracking-[0.08em]">{label}</span>
    </div>
  )
  return (
    <div className="relative mt-auto border-t border-line bg-paper px-2 pb-1.5 pt-2">
      <div className="flex items-end">
        <Item k="market" label="Market" icon={<GridIcon />} />
        <Item k="impatto" label="Impatto" icon={<LeafNavIcon />} />
        <div className="w-7 shrink-0" />
        <Item k="chat" label="Chat" icon={<ChatBubbleIcon />} />
        <Item k="profilo" label="Profilo" icon={<PersonIcon />} />
      </div>
      <span className="absolute left-1/2 top-0 flex h-7 w-7 -translate-x-1/2 -translate-y-1/3 items-center justify-center rounded-full bg-eco text-white shadow-md">
        <PlusIcon />
      </span>
    </div>
  )
}

/** Badge di stato (Disponibile · Prenotato · Scambiato) sovrapposto alla foto. */
function StatoBadge({ stato }: { stato: string }) {
  const tone = stato === 'Scambiato' ? 'bg-ink' : stato === 'Prenotato' ? 'bg-sun' : 'bg-eco'
  return (
    <span
      className={`absolute left-1 top-1 px-1 py-px text-[5px] font-bold uppercase leading-none text-white ${tone}`}
    >
      {stato}
    </span>
  )
}

/** Dati fittizi del feed: nomi generici, nessuna foto reale (placeholder a
 *  righe), stati e metriche ESG nel formato «≥» dell'app. */
const FEED_ITEMS = [
  { titolo: 'Zaino sportivo', meta: 'Zaino · Unica · Buono', co2: '9 KG', h2o: '300 L', stato: 'Disponibile' },
  { titolo: 'Scarpe da calcio', meta: 'Scarpe · 41 · Ottimo', co2: '14 KG', h2o: '1,5K L', stato: 'Scambiato' },
  { titolo: 'Giacca sportiva', meta: 'Giacca · M · Ottimo', co2: '1 KG', h2o: '19 L', stato: 'Disponibile' },
  { titolo: 'Maglia allenamento', meta: 'Maglia · S · Perfetto', co2: '4 KG', h2o: '600 L', stato: 'Prenotato' },
]

function FeedMock() {
  return (
    <div className="flex h-full flex-col bg-paper text-ink">
      <PhoneHeader />
      {/* search */}
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-1.5">
        <MiniSearchIcon />
        <span className="text-[8px] text-ink-faint">Cerca prodotti…</span>
        <span className="ml-auto text-[7px] font-bold uppercase tracking-[0.08em] text-ink">
          Filtri +
        </span>
      </div>
      {/* tabs */}
      <div className="flex gap-2.5 border-b border-line px-3 py-1.5 text-[7px] font-bold uppercase tracking-[0.06em]">
        <span className="border-b-2 border-eco pb-0.5 text-ink">Tutti</span>
        <span className="text-ink-faint">Disponibili</span>
        <span className="text-ink-faint">Prenotati</span>
        <span className="text-ink-faint">Scambiati</span>
      </div>
      {/* grid */}
      <div className="grid flex-1 grid-cols-2 content-start gap-px overflow-hidden bg-line">
        {FEED_ITEMS.map((it, i) => (
          <div key={i} className="flex flex-col gap-1 bg-paper p-2">
            <div className="foto-stripe relative aspect-[4/5] overflow-hidden rounded">
              <StatoBadge stato={it.stato} />
            </div>
            <div className="text-[8px] font-bold leading-tight text-ink">{it.titolo}</div>
            <div className="text-[6px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
              {it.meta}
            </div>
            <div className="flex flex-wrap gap-x-1.5 text-[6px] font-bold uppercase">
              <span className="text-eco">CO₂: ≥ {it.co2}</span>
              <span className="text-water-600">H₂O: ≥ {it.h2o}</span>
            </div>
          </div>
        ))}
      </div>
      <BottomNav active="market" />
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Icone dei mockup
   ────────────────────────────────────────────────────────────────────────── */

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function MiniSearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 text-ink" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.5" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function GridIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function LeafNavIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M20 4C9 4 4 9 4 18c0 0 0 2 0 2M5 17C5 9 12 6 20 4c0 8-3 15-11 15-2 0-4-2-4-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChatBubbleIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M4 5h16v11H9l-4 4V5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function PersonIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
