import { SitoLayout, TestataPagina } from '../components/sito'
import mockCodice from '../assets/mockups/06-codice.webp'
import mockMarketplace from '../assets/mockups/01-marketplace.webp'
import mockSocietario from '../assets/mockups/02-societario.webp'
import mockPubblico from '../assets/mockups/03-pubblico.webp'
import mockChat from '../assets/mockups/04-chat.webp'
import mockImpatto from '../assets/mockups/05-impatto.webp'

/* ──────────────────────────────────────────────────────────────────────────
   /come-funziona — i quattro passaggi del servizio, dal codice di
   attivazione alla dashboard d'impatto. Lente: il club.
   Chiude con le due leve che spiegano perché un club sceglie Renova.
   ────────────────────────────────────────────────────────────────────────── */

export function ComeFunziona() {
  return (
    <SitoLayout>
      <section className="border-b-[1.5px] border-ink">
        <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
          <TestataPagina
            occhiello="Come funziona"
            titolo={<>Dall’attivazione al primo scambio, in pochi tap.</>}
          >
            <p>
              Il club fa una cosa sola; tutto il resto lo gestiscono le famiglie in autonomia. Ecco
              come funziona in 4 semplici step:
            </p>
          </TestataPagina>

          <div className="mt-12 flex flex-col gap-16 lg:gap-24">
            {/* Step 1 */}
            <StepRow
              n="1"
              title="Il club attiva Renova"
              body="Il club aderisce al servizio e riceve un codice di attivazione da distribuire ai propri tesserati. Da qui in poi gli sforzi organizzativi della società sono finiti."
              mock={
                <MockupPhone
                  src={mockCodice}
                  alt="Schermata dell'app Renova con il codice di attivazione del club"
                  className="max-w-[230px]"
                />
              }
            />

            {/* Step 2 — speciale: il feed che si sdoppia nei due feed */}
            <Step2 />

            {/* Step 3 */}
            <StepRow
              n="3"
              reverse
              title="Si accordano e scambiano, gratis"
              body="Tramite la chat integrata i tesserati si organizzano in autonomia e si scambiano il materiale di persona, gratuitamente. La valutazione delle condizioni e l’accordo finale restano in capo a chi scambia, che si incontra di persona e verifica l’oggetto prima di prenderlo: il club non si fa garante dei singoli scambi."
              mock={
                <MockupPhone
                  src={mockChat}
                  alt="Schermata della chat integrata dell'app Renova"
                  className="max-w-[230px]"
                />
              }
            />

            {/* Step 4 */}
            <StepRow
              n="4"
              title="Il club vede l’impatto"
              body="Una dashboard mostra al club il risparmio economico generato per le famiglie e il materiale rimesso in circolo, con le metriche ambientali (CO₂ e acqua risparmiate). Dati pronti da usare in ogni momento."
              mock={
                <MockupPhone
                  src={mockImpatto}
                  alt="Dashboard d'impatto dell'app Renova con metriche ambientali ed economiche"
                  className="max-w-[230px]"
                />
              }
            />
          </div>
        </div>
      </section>

      <ValorePerIlClub />
    </SitoLayout>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   Step
   ════════════════════════════════════════════════════════════════════════ */

/** Mockup fotografico dell'app dentro un iPhone Air (render pre-composto, con
 *  cornice e ombra già incluse nell'immagine su sfondo avorio). */
function MockupPhone({
  src,
  alt,
  className = '',
}: {
  src: string
  alt: string
  className?: string
}) {
  return (
    <img src={src} alt={alt} loading="lazy" className={`mx-auto h-auto w-full select-none ${className}`} />
  )
}

/** Riga step generica: testo + mockup, alternati su desktop. */
function StepRow({
  n,
  title,
  body,
  mock,
  reverse = false,
}: {
  n: string
  title: string
  body: string
  mock: React.ReactNode
  reverse?: boolean
}) {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <div className={reverse ? 'lg:order-2' : ''}>
        <div className="flex items-center gap-4">
          <StepNumber n={n} />
          <h2 className="text-[22px] leading-tight sm:text-[26px]">{title}</h2>
        </div>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-soft lg:text-[16px]">
          {body}
        </p>
      </div>
      <div className={`flex justify-center ${reverse ? 'lg:order-1' : ''}`}>{mock}</div>
    </div>
  )
}

/** Step 2: il feed del marketplace si sdoppia in feed societario + pubblico. */
function Step2() {
  return (
    <div>
      <div className="lg:grid lg:grid-cols-2 lg:gap-14">
        <div>
          <div className="flex items-center gap-4">
            <StepNumber n="2" />
            <h2 className="text-[22px] leading-tight sm:text-[26px]">
              I tesserati entrano nel marketplace
            </h2>
          </div>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-soft lg:text-[16px]">
            Con il codice, le famiglie accedono al marketplace e pubblicano in pochi tap il
            materiale che non usano più. Lo stesso feed si divide automaticamente in due viste, in
            base alla presenza o meno del logo della società.
          </p>
        </div>
      </div>

      {/* Diagramma: feed centrale → due frecce → articolo societario / pubblico */}
      <div className="mt-10 flex flex-col items-center gap-8 lg:mt-12 lg:flex-row lg:items-center lg:justify-center lg:gap-4">
        {/* Feed sorgente */}
        <figure className="flex max-w-[240px] flex-col items-center text-center">
          <MockupPhone
            src={mockMarketplace}
            alt="Feed del marketplace nell'app Renova"
            className="max-w-[230px]"
          />
          <figcaption className="mt-3 text-[13px] leading-snug text-ink-soft">
            <span className="font-bold text-ink">Marketplace</span>
            <br />
            Un solo posto dove pubblicare e cercare.
          </figcaption>
        </figure>

        {/* Connettore: orizzontale su desktop, verticale su mobile */}
        <SplitConnector />

        {/* I due feed risultanti: affiancati sotto la Y su mobile, in colonna su desktop */}
        <div className="flex w-full flex-row justify-center gap-3 sm:gap-8 lg:w-auto lg:flex-col">
          <figure className="flex min-w-0 max-w-[240px] flex-1 flex-col items-center text-center">
            <MockupPhone
              src={mockSocietario}
              alt="Articolo nel feed societario dell'app Renova"
              className="max-w-[230px]"
            />
            <figcaption className="mt-3 text-[13px] leading-snug text-ink-soft">
              <span className="font-bold text-eco-700">Feed societario</span>
              <br />
              Articoli col logo societario, visibili solo ai tesserati del club.
            </figcaption>
          </figure>

          <figure className="flex min-w-0 max-w-[240px] flex-1 flex-col items-center text-center">
            <MockupPhone
              src={mockPubblico}
              alt="Articolo nel feed pubblico dell'app Renova"
              className="max-w-[230px]"
            />
            <figcaption className="mt-3 text-[13px] leading-snug text-ink-soft">
              <span className="font-bold text-ink">Feed pubblico</span>
              <br />
              Articoli senza logo, aperti ai praticanti dello stesso sport nella stessa area
              geografica.
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
  )
}

/** Connettore a "Y": linea che si sdoppia in due frecce. */
function SplitConnector() {
  return (
    <>
      {/* Desktop: orizzontale (sorgente a sinistra → due rami a destra) */}
      <svg
        className="hidden h-44 w-20 shrink-0 text-eco lg:block"
        viewBox="0 0 80 180"
        fill="none"
        aria-hidden="true"
      >
        <path d="M0 90 H30 C45 90 45 45 60 45 H72" stroke="currentColor" strokeWidth="2.5" fill="none" />
        <path d="M0 90 H30 C45 90 45 135 60 135 H72" stroke="currentColor" strokeWidth="2.5" fill="none" />
        <polygon points="80,45 70,40 70,50" fill="currentColor" />
        <polygon points="80,135 70,130 70,140" fill="currentColor" />
      </svg>

      {/* Mobile: verticale (sorgente sopra → due rami sotto, larghi quanto i
          due mockup affiancati così ogni freccia indica il proprio telefono) */}
      <svg
        className="h-16 w-[240px] max-w-full shrink-0 text-eco sm:w-80 lg:hidden"
        viewBox="0 0 240 64"
        fill="none"
        aria-hidden="true"
      >
        <path d="M120 0 V16 C120 32 36 28 36 44 V52" stroke="currentColor" strokeWidth="2.5" fill="none" />
        <path d="M120 0 V16 C120 32 204 28 204 44 V52" stroke="currentColor" strokeWidth="2.5" fill="none" />
        <polygon points="36,64 31,52 41,52" fill="currentColor" />
        <polygon points="204,64 199,52 209,52" fill="currentColor" />
      </svg>
    </>
  )
}

function StepNumber({ n }: { n: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-eco text-[16px] font-extrabold text-white">
      {n}
    </span>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   Perché un club sceglie Renova — le due leve, ridotte all'osso
   ════════════════════════════════════════════════════════════════════════ */

function ValorePerIlClub() {
  return (
    <section className="border-b-[1.5px] border-ink bg-eco-50/40">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-16">
        <span className="eyebrow">Il valore per la società</span>
        <h2 className="mt-2 text-[28px] leading-tight sm:text-[34px]">
          Perché un club sceglie Renova
        </h2>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Leva
            icon={<BoltIcon />}
            title="Zero sforzo organizzativo"
            body="Il club distribuisce un codice e si prende i meriti; a pubblicare, accordarsi e scambiare sono i tesserati. Nessun carico sulla segreteria."
          />
          <Leva
            icon={<PeopleIcon />}
            title="Retention e recruiting"
            body="Gli scambi avvengono di persona: ogni passaggio di materiale è un’occasione di incontro che costruisce community. Un club che fa risparmiare e crea relazioni è un club a cui ci si iscrive e in cui si resta."
          />
        </div>
      </div>
    </section>
  )
}

function Leva({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-edge bg-paper p-5 lg:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-eco-50 text-eco">
          {icon}
        </span>
        <h3 className="text-[17px] leading-snug lg:text-[18px]">{title}</h3>
      </div>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">{body}</p>
    </div>
  )
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M16 11a3 3 0 1 0-1-5.8M21 20c0-2.5-1.5-4.6-3.6-5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
