import type { MouseEvent } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo, RenovaMark } from '../components/Logo'

/* ──────────────────────────────────────────────────────────────────────────
   Landing pubblica di Renova — versione pre-lancio, rivolta PRIMA ai CLUB
   (B2B), con CTA primario "Prenota una call" e CTA secondario "sondaggio
   famiglie". Diversamente dalla web-app (solo mobile), questo sito è
   RESPONSIVE: si adatta a desktop e mobile.

   Dati ancora da inserire (placeholder evidenti, vedi sotto):
   - SURVEY_URL   → URL del sondaggio per le famiglie
   - TELEFONO     → numero per la call
   Contatti già noti dal progetto: info@renovasport.it · renovasport.it
   ────────────────────────────────────────────────────────────────────────── */

const EMAIL = 'info@renovasport.it'
const SITO = 'renovasport.it'
const TELEFONO: string = '+39 370 3238359'
const SURVEY_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdNT_K8-4KZXxYKkiOF8XfazyFLKiXhI0UqRbH6oXrYuDSowg/viewform'

/**
 * Scroll fluido e volutamente morbido verso una sezione, tenendo conto
 * dell'header sticky. Rispetta "riduci animazioni".
 */
function scrollToSezione(e: MouseEvent<HTMLAnchorElement>, id: string) {
  e.preventDefault()
  const target = document.getElementById(id)
  if (!target) return
  const header = document.querySelector('header')
  const offset = header ? header.getBoundingClientRect().height : 0
  const destY = target.getBoundingClientRect().top + window.scrollY - offset

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo(0, destY)
    return
  }
  const startY = window.scrollY
  const distance = destY - startY
  const duration = 800
  let startTime: number | null = null
  function step(now: number) {
    if (startTime === null) startTime = now
    const elapsed = now - startTime
    const t = Math.min(1, elapsed / duration)
    const eased = 1 - Math.pow(1 - t, 3)
    window.scrollTo(0, startY + distance * eased)
    if (elapsed < duration) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

export function Landing() {
  const [menuAperto, setMenuAperto] = useState(false)

  const nav = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    setMenuAperto(false)
    scrollToSezione(e, id)
  }

  return (
    <div className="min-h-screen w-full bg-paper text-ink">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b-[1.5px] border-ink bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <a href="#top" onClick={nav('top')} className="shrink-0">
            <Logo className="text-[22px]" />
          </a>

          {/* Nav desktop */}
          <nav className="hidden items-center gap-7 text-[13px] font-semibold text-ink-soft lg:flex">
            <a href="#come-funziona" onClick={nav('come-funziona')} className="transition hover:text-ink">
              Come funziona
            </a>
            <a href="#partnership" onClick={nav('partnership')} className="transition hover:text-ink">
              Partnership
            </a>
            <a href="#faq" onClick={nav('faq')} className="transition hover:text-ink">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#contatti"
              onClick={nav('contatti')}
              className="hidden rounded-lg bg-eco px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.06em] text-white shadow-sm transition hover:bg-eco-600 active:scale-[.99] sm:inline-flex"
            >
              Prenota una call
            </a>
            <Link
              to="/login"
              className="text-[12px] font-semibold text-ink-muted underline-offset-4 transition hover:text-ink hover:underline"
            >
              Accedi
            </Link>
            {/* Hamburger mobile */}
            <button
              type="button"
              onClick={() => setMenuAperto((v) => !v)}
              aria-label="Apri menu"
              aria-expanded={menuAperto}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-edge text-ink lg:hidden"
            >
              <BurgerIcon open={menuAperto} />
            </button>
          </div>
        </div>

        {/* Menu mobile a tendina */}
        {menuAperto && (
          <div className="border-t border-line bg-paper px-5 py-4 lg:hidden">
            <nav className="flex flex-col gap-1 text-[15px] font-semibold text-ink">
              <a href="#come-funziona" onClick={nav('come-funziona')} className="rounded-lg px-2 py-2.5 hover:bg-black/5">
                Come funziona
              </a>
              <a href="#partnership" onClick={nav('partnership')} className="rounded-lg px-2 py-2.5 hover:bg-black/5">
                Partnership
              </a>
              <a href="#faq" onClick={nav('faq')} className="rounded-lg px-2 py-2.5 hover:bg-black/5">
                FAQ
              </a>
              <a
                href="#contatti"
                onClick={nav('contatti')}
                className="mt-2 rounded-lg bg-eco px-4 py-3 text-center text-[13px] font-bold uppercase tracking-[0.06em] text-white"
              >
                Prenota una call
              </a>
            </nav>
          </div>
        )}
      </header>

      <main id="top">
        <Hero />
        <ComeFunziona />
        <SocialProof />
        <FaseDiTest />
        <Faq />
        <Contatti />
      </main>

      <Footer />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   1 · HERO
   ════════════════════════════════════════════════════════════════════════ */

function Hero() {
  return (
    <section className="border-b-[1.5px] border-ink">
      <div className="mx-auto max-w-6xl px-5 py-12 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-8 lg:py-20">
        {/* Colonna sinistra: promessa + CTA */}
        <div>
          <span className="eyebrow">Per le società sportive · Pre-lancio Bologna</span>
          <h1 className="mt-3 text-[34px] leading-[1.02] sm:text-[44px] lg:text-[52px]">
            Abbatti il costo dello sport per le famiglie del tuo club.
          </h1>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-ink-soft lg:text-[17px]">
            Il servizio che le famiglie del tuo club stanno aspettando. Con Renova i tesserati
            si scambiano gratuitamente il materiale sportivo usato ancora in buone condizioni.
            Più risparmio per le famiglie, più fidelizzazione per te.{' '}
            <span className="font-semibold text-ink">Nessuno sforzo organizzativo.</span>
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#contatti"
              onClick={(e) => scrollToSezione(e, 'contatti')}
              className="inline-flex items-center justify-center rounded-lg bg-eco px-7 py-4 text-[14px] font-bold uppercase tracking-[0.06em] text-white shadow-sm transition hover:bg-eco-600 active:scale-[.99]"
            >
              Prenota una call conoscitiva
            </a>
          </div>

          {/* CTA secondario per genitori/tesserati — subordinato */}
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

      {/* Le leve */}
      <div className="border-t-[1.5px] border-ink bg-eco-50/40">
        <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
          <span className="eyebrow">Perché i club scelgono Renova</span>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            <Leva
              icon={<BoltIcon />}
              title="Zero sforzo organizzativo per il club"
              body="Tu attivi il servizio e ti prendi i meriti. Distribuisci un codice e sono i tesserati a pubblicare, accordarsi e scambiare tra loro. Nessun magazzino, nessun coordinamento, nessun carico sulla segreteria."
            />
            <Leva
              icon={<PeopleIcon />}
              title="Retention e recruiting dei tesserati"
              body="Gli scambi avvengono di persona, tra famiglie dello stesso club: ogni passaggio di materiale è un'occasione di incontro che costruisce community. Un club che fa risparmiare e crea relazioni è un club a cui ci si iscrive e in cui si resta."
            />
            <Leva
              icon={<HeartChatIcon />}
              title="Un servizio che le famiglie chiedono davvero"
              body="Non è un'ipotesi: stiamo conducendo ricerche sui genitori e tesserati e il riscontro è positivo. La domanda c'è — e portarla nel tuo club ti dà un argomento concreto al momento dell'iscrizione e del rinnovo."
            />
            <Leva
              icon={<TagIcon />}
              title="Costo dello sport più basso per le famiglie"
              body="Scarpe, divise, attrezzatura: il materiale tecnico è una spesa ricorrente. Con Renova quella spesa si abbassa, perché il materiale ancora buono torna a circolare invece di essere ricomprato da zero. Il risparmio va direttamente alle famiglie."
            />
          </div>

          {/* Leva bonus — evidenziata */}
          <div className="mt-4 rounded-2xl border-[1.5px] border-eco bg-paper p-6 lg:p-7">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-eco-50 text-eco">
                <LeafChartIcon />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-eco px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                    Bonus
                  </span>
                  <h3 className="text-[18px] lg:text-[19px]">
                    Materiale che torna a circolare, con i dati in mano
                  </h3>
                </div>
                <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-ink-soft lg:text-[15px]">
                  Ogni scambio è attrezzatura salvata dall'armadio e un dato misurato: la dashboard
                  traccia il risparmio generato per le famiglie e l'impatto ambientale evitato —
                  carbon footprint (CO₂) e water footprint (acqua). Numeri pronti da mostrare a
                  famiglie, sponsor e istituzioni.
                </p>
              </div>
            </div>
          </div>

          {/* Trust-strip */}
          <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border-[1.5px] border-ink bg-ink sm:grid-cols-2 lg:grid-cols-4">
            <Stat valore="+55%" testo="degli intervistati ha dichiarato che ogni stagione si trova in casa del materiale sportivo usato in buone condizioni che rimane inutilizzato" />
            <Stat valore="+90%" testo="degli intervistati è interessato a un servizio di scambio del materiale del proprio club" />
            <Stat valore="+55%" testo="degli intervistati spende più di 100€ ogni stagione sportiva soltanto il materiale sportivo (di cui +20% spende più di 200€)" />
            <Stat valore="Gratis" testo="la partecipazione alla fase di test per i primi club" highlight />
          </div>
        </div>
      </div>
    </section>
  )
}

function Leva({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
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

function Stat({
  valore,
  testo,
  highlight = false,
}: {
  valore: string
  testo: string
  highlight?: boolean
}) {
  return (
    <div className={`px-5 py-5 ${highlight ? 'bg-eco' : 'bg-paper'}`}>
      <div
        className={`text-[26px] font-extrabold tracking-[-0.03em] ${highlight ? 'text-white' : 'text-eco'}`}
      >
        {valore}
      </div>
      <p
        className={`mt-1 text-[12px] leading-snug ${highlight ? 'text-white/90' : 'text-ink-soft'}`}
      >
        {testo}
      </p>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   2 · COME FUNZIONA
   ════════════════════════════════════════════════════════════════════════ */

function ComeFunziona() {
  return (
    <section id="come-funziona" className="scroll-mt-24 border-b-[1.5px] border-ink">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <span className="eyebrow">Come funziona</span>
          <h2 className="mt-2 text-[28px] leading-tight sm:text-[34px]">
            Dall'attivazione al primo scambio, in pochi tap.
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">
            Il club fa una cosa sola; tutto il resto lo gestiscono le famiglie in autonomia. Ecco
            come funziona in 4 semplici step:
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-16 lg:gap-24">
          {/* Step 1 */}
          <StepRow
            n="1"
            title="Il club attiva Renova"
            body="Il club aderisce al servizio e riceve un codice di attivazione da distribuire ai propri tesserati. Da qui in poi gli sforzi organizzativi della società sono finiti."
            mock={
              <PhoneFrame>
                <CodeMock />
              </PhoneFrame>
            }
          />

          {/* Step 2 — speciale: feed che si sdoppia nei due feed */}
          <Step2 />

          {/* Step 3 */}
          <StepRow
            n="3"
            reverse
            title="Si accordano e scambiano, gratis"
            body="Tramite la chat integrata i tesserati si organizzano in autonomia e si scambiano il materiale di persona, gratuitamente. Come promesso, nessun lavoro per la società."
            mock={
              <PhoneFrame>
                <ChatMock />
              </PhoneFrame>
            }
          />

          {/* Step 4 */}
          <StepRow
            n="4"
            title="Il club vede l'impatto"
            body="Una dashboard mostra al club il risparmio economico generato per le famiglie e il materiale rimesso in circolo, con le metriche ambientali (CO₂ e acqua risparmiate). Dati pronti da usare, in ogni momento ed esportabili."
            mock={
              <PhoneFrame>
                <ImpattoMock />
              </PhoneFrame>
            }
          />
        </div>
      </div>
    </section>
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
          <h3 className="text-[22px] leading-tight sm:text-[26px]">{title}</h3>
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
            <h3 className="text-[22px] leading-tight sm:text-[26px]">
              I tesserati entrano nel marketplace
            </h3>
          </div>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-soft lg:text-[16px]">
            Con il codice, le famiglie accedono al marketplace e pubblicano in pochi tap il
            materiale che non usano più. Lo stesso feed si divide automaticamente in due viste,
            in base alla presenza del logo della società.
          </p>
        </div>
      </div>

      {/* Diagramma: feed centrale → due frecce → articolo societario / pubblico */}
      <div className="mt-10 flex flex-col items-center gap-8 lg:mt-12 lg:flex-row lg:items-center lg:justify-center lg:gap-4">
        {/* Feed sorgente */}
        <figure className="flex max-w-[220px] flex-col items-center text-center">
          <PhoneFrame className="max-w-[200px]">
            <FeedMock />
          </PhoneFrame>
          <figcaption className="mt-3 text-[13px] leading-snug text-ink-soft">
            <span className="font-bold text-ink">Marketplace</span>
            <br />
            un solo posto dove pubblicare e cercare.
          </figcaption>
        </figure>

        {/* Connettore: orizzontale su desktop, verticale su mobile */}
        <SplitConnector />

        {/* I due feed risultanti */}
        <div className="flex flex-col gap-8 sm:flex-row lg:flex-col">
          <figure className="flex max-w-[220px] flex-col items-center text-center">
            <PhoneFrame className="max-w-[190px]">
              <ArticleMock variant="societario" />
            </PhoneFrame>
            <figcaption className="mt-3 text-[13px] leading-snug text-ink-soft">
              <span className="font-bold text-eco-700">Feed societario</span>
              <br />
              articoli col logo societario, visibili solo ai tesserati del club stesso.
            </figcaption>
          </figure>

          <figure className="flex max-w-[220px] flex-col items-center text-center">
            <PhoneFrame className="max-w-[190px]">
              <ArticleMock variant="pubblico" />
            </PhoneFrame>
            <figcaption className="mt-3 text-[13px] leading-snug text-ink-soft">
              <span className="font-bold text-ink">Feed pubblico</span>
              <br />
              articoli senza logo, aperti ai praticanti dello stesso sport nella stessa area geografica.
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
        <path
          d="M0 90 H30 C45 90 45 45 60 45 H72"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M0 90 H30 C45 90 45 135 60 135 H72"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
        />
        <polygon points="80,45 70,40 70,50" fill="currentColor" />
        <polygon points="80,135 70,130 70,140" fill="currentColor" />
      </svg>

      {/* Mobile: verticale (sorgente sopra → due rami sotto) */}
      <svg
        className="h-16 w-40 shrink-0 text-eco lg:hidden"
        viewBox="0 0 160 64"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M80 0 V18 C80 30 45 30 45 44 V52"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M80 0 V18 C80 30 115 30 115 44 V52"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
        />
        <polygon points="45,64 40,52 50,52" fill="currentColor" />
        <polygon points="115,64 110,52 120,52" fill="currentColor" />
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
   3 · SOCIAL PROOF (partnership)
   ════════════════════════════════════════════════════════════════════════ */

function SocialProof() {
  return (
    <section id="partnership" className="scroll-mt-24 border-b-[1.5px] border-ink bg-eco-50/40">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <span className="eyebrow">Partnership</span>
          <h2 className="mt-2 text-[28px] leading-tight sm:text-[34px]">
            Stiamo costruendo Renova con chi lo sport lo vive ogni giorno
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">
            Renova nasce dal confronto diretto con i club. Queste sono le società che stanno
            collaborando allo sviluppo e alla fase di test.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <LogoPlaceholder key={i} />
          ))}
        </div>
        <p className="mt-6 text-[12px] text-ink-muted">
          I loghi dei club partner verranno mostrati qui una volta raccolti i consensi.
        </p>
      </div>
    </section>
  )
}

function LogoPlaceholder() {
  return (
    <div className="flex aspect-[3/2] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-edge bg-paper/60 px-3 text-center">
      <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-ink-faint text-ink-faint">
        +
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
        Inserisci qui il tuo logo
      </span>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   4 · FASE DI TEST
   ════════════════════════════════════════════════════════════════════════ */

function FaseDiTest() {
  return (
    <section className="border-b-[1.5px] border-ink bg-ink text-paper">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-14 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-16">
        <div className="max-w-2xl">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-eco">
            Fase di test · Bologna
          </span>
          <h2 className="mt-2 text-[26px] leading-tight text-paper sm:text-[32px]">
            Stiamo selezionando i primi club di Bologna
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#c9c8c2] lg:text-[16px]">
            Renova è in fase di lancio e parte dal territorio bolognese. Stiamo coinvolgendo un
            primo gruppo di club del territorio per testare il servizio sul campo:{' '}
            <span className="font-semibold text-paper">la partecipazione è gratuita</span>. È il
            momento giusto per entrare tra i primi e contribuire a costruire lo strumento.
          </p>
        </div>
        <a
          href="#contatti"
          onClick={(e) => scrollToSezione(e, 'contatti')}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-eco px-7 py-4 text-[14px] font-bold uppercase tracking-[0.06em] text-white transition hover:bg-eco-600 active:scale-[.99]"
        >
          Prenota una call conoscitiva
        </a>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   5 · FAQ (accordion)
   ════════════════════════════════════════════════════════════════════════ */

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'Quanto costa al club?',
    a: 'In questa fase la partecipazione è gratuita. Stiamo coinvolgendo i primi club per testare il servizio: nessun costo, nessun impegno economico.',
  },
  {
    q: 'È davvero gratis? E dopo la fase di test?',
    a: 'Sì: durante la fase di test il servizio è gratuito per il club e per le famiglie, senza vincoli. Il modello di revenue è ancora in corso di definizione ma in ogni caso lo scambio del materiale tra tesserati resta gratuito.',
  },
  {
    q: 'Cosa deve fare concretamente il club?',
    a: 'Pochissimo: aderire, distribuire il codice di attivazione ai tesserati e prendersi i meriti dell’iniziativa. Tutto il resto — pubblicazione del materiale, accordi, scambio — lo gestiscono le famiglie in autonomia. Nessun carico di lavoro sulla società.',
  },
  {
    q: 'Il nostro è un club piccolo: funziona lo stesso?',
    a: 'Sì. Più tesserati partecipano, più scambi avvengono, ma Renova è pensata anche per realtà piccole: oltre al feed interno del club c’è un feed pubblico che mette in contatto i praticanti dello stesso sport nella stessa area geografica, ampliando le occasioni di scambio anche per le società più piccole.',
  },
  {
    q: 'Come avviene lo scambio? È gratuito o c’è un prezzo?',
    a: 'La piattaforma fa incontrare domanda e offerta; l’accordo lo prendono le famiglie tramite la chat integrata e lo scambio avviene di persona, tra tesserati. È una scelta voluta: rafforza i rapporti dentro la community del club. Il prezzo che vedi indicato negli articoli riguarda il risparmio economico generato dallo scambio, non un importo da pagare.',
  },
  {
    q: 'Chi vede cosa? Come gestite la privacy?',
    a: 'Ogni tesserato vede due insiemi separati: il feed societario, visibile solo ai membri dello stesso club (qui finiscono gli articoli con il logo della società); e il feed pubblico, con i soli articoli senza logo, visibili a tutti gli altri praticanti dello stesso sport nella stessa area geografica. Agli altri utenti sono visibili solo le informazioni minime necessarie ad accordarsi sullo scambio; il resto dei dati personali non è esposto. La separazione è garantita a livello di sistema, non lasciata al caso.',
  },
  {
    q: 'E per i tesserati minorenni?',
    a: 'L’account di un minore è creato e gestito da un genitore o da un adulto di riferimento, che resta responsabile delle interazioni. Lo scambio avviene di persona e all’interno della community del club, in un ambiente chiuso e riconducibile a tesserati reali — non una piazza aperta a sconosciuti. Stiamo definendo strumenti dedicati per mantenere la chat un ambiente sicuro.',
  },
  {
    q: 'Chi è responsabile della qualità del materiale o di eventuali problemi nello scambio?',
    a: 'Renova mette in contatto le famiglie e fornisce gli strumenti per scambiarsi il materiale; la valutazione delle condizioni e l’accordo finale restano in capo a chi scambia, che si incontra di persona e può verificare l’oggetto prima di prenderlo. Il club non si fa garante dei singoli scambi. Bisogna immaginare Renova come uno spazio pubblico, il cui buon funzionamento è una responsabilità condivisa.',
  },
  {
    q: 'Come accedono i tesserati? Serve scaricare un’app?',
    a: 'Al momento no: si accede da web con il codice di attivazione del club, dallo smartphone come da computer. Nessuna installazione, nessuna procedura complicata.',
  },
  {
    q: 'Come fate a misurare il risparmio e l’impatto ambientale mostrati nella dashboard?',
    a: 'Il risparmio nasce dagli scambi reali registrati sulla piattaforma. L’impatto ambientale (CO₂ e acqua) è stimato con un metodo deterministico e tracciabile, calcolato dalle fibre che compongono il capo — non un numero generico, ma una stima documentata con tre livelli di affidabilità a seconda di quanto si conosce del materiale.',
  },
]

function Faq() {
  const [aperta, setAperta] = useState<number | null>(0)
  return (
    <section id="faq" className="scroll-mt-24 border-b-[1.5px] border-ink">
      <div className="mx-auto max-w-3xl px-5 py-14 lg:px-8 lg:py-20">
        <span className="eyebrow">FAQ</span>
        <h2 className="mt-2 text-[28px] leading-tight sm:text-[34px]">Domande frequenti</h2>

        <div className="mt-8 divide-y divide-line border-y border-line">
          {FAQ.map((item, i) => {
            const open = aperta === i
            return (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => setAperta(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="text-[16px] font-bold leading-snug text-ink lg:text-[17px]">
                    {item.q}
                  </span>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-edge text-ink transition ${
                      open ? 'rotate-45 bg-eco text-white' : ''
                    }`}
                  >
                    <PlusIcon />
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    open ? 'grid-rows-[1fr] pb-5 opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-2xl text-[15px] leading-relaxed text-ink-soft">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   6 · CONTATTI + CTA finale (form via mailto)
   ════════════════════════════════════════════════════════════════════════ */

function Contatti() {
  const [form, setForm] = useState({
    nome: '',
    club: '',
    ruolo: '',
    email: '',
    telefono: '',
    messaggio: '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const corpo = [
      `Nome: ${form.nome}`,
      `Club / società: ${form.club}`,
      `Ruolo: ${form.ruolo}`,
      `Email: ${form.email}`,
      `Telefono: ${form.telefono}`,
      '',
      form.messaggio,
    ].join('\n')
    const url = `mailto:${EMAIL}?subject=${encodeURIComponent(
      `Prenota una call · ${form.club || form.nome || 'Club'}`,
    )}&body=${encodeURIComponent(corpo)}`
    window.location.href = url
  }

  return (
    <section id="contatti" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:grid lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-20">
        {/* Testo + contatti diretti */}
        <div>
          <span className="eyebrow">Contatti</span>
          <h2 className="mt-2 text-[28px] leading-tight sm:text-[36px]">
            Vuoi portare Renova nel tuo club?
          </h2>
          <p className="mt-3 max-w-lg text-[16px] leading-relaxed text-ink-soft">
            Raccontaci del tuo club o facci le tue domande. Ti ricontattiamo per una call senza
            impegno.
          </p>

          <div className="mt-8 space-y-4">
            <ContattoDiretto label="Email" valore={EMAIL} href={`mailto:${EMAIL}`} />
            <ContattoDiretto
              label="Telefono"
              valore={TELEFONO || '[inserisci telefono]'}
              href={TELEFONO ? `tel:${TELEFONO.replace(/\s/g, '')}` : undefined}
              placeholder={!TELEFONO}
            />
            <ContattoDiretto
              label="Sito"
              valore={SITO}
              href={`https://${SITO}`}
            />
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={onSubmit}
          className="mt-10 rounded-2xl border-[1.5px] border-ink bg-paper p-6 shadow-sm lg:mt-0 lg:p-7"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome" value={form.nome} onChange={set('nome')} required />
            <Field label="Club / società" value={form.club} onChange={set('club')} required />
            <Field label="Ruolo" value={form.ruolo} onChange={set('ruolo')} />
            <Field label="Email" type="email" value={form.email} onChange={set('email')} required />
            <div className="sm:col-span-2">
              <Field label="Telefono" type="tel" value={form.telefono} onChange={set('telefono')} required />
            </div>
            <div className="sm:col-span-2">
              <label className="block">
                <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-ink-soft">
                  Messaggio <span className="font-normal text-ink-muted">(opzionale)</span>
                </span>
                <textarea
                  value={form.messaggio}
                  onChange={set('messaggio')}
                  rows={4}
                  placeholder="Domande, suggerimenti, richieste…"
                  className="mt-1.5 w-full resize-y rounded-lg border border-edge bg-paper px-3 py-2.5 text-[15px] text-ink outline-none transition placeholder:text-ink-faint focus:border-eco"
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-eco px-6 py-3.5 text-[14px] font-bold uppercase tracking-[0.06em] text-white transition hover:bg-eco-600 active:scale-[.99]"
          >
            Prenota una call conoscitiva
          </button>
          <p className="mt-3 text-center text-[12px] text-ink-muted">
            Inviando il form aprirai la tua email con i dati già compilati.
          </p>
        </form>
      </div>
    </section>
  )
}

function ContattoDiretto({
  label,
  valore,
  href,
  placeholder = false,
}: {
  label: string
  valore: string
  href?: string
  placeholder?: boolean
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-20 shrink-0 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
        {label}
      </span>
      {href ? (
        <a
          href={href}
          className="text-[16px] font-semibold text-eco-700 underline-offset-4 hover:underline"
        >
          {valore}
        </a>
      ) : (
        <span className={`text-[16px] font-semibold ${placeholder ? 'text-ink-faint italic' : 'text-ink'}`}>
          {valore}
        </span>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-ink-soft">
        {label}
        {required && <span className="text-eco"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="mt-1.5 w-full rounded-lg border border-edge bg-paper px-3 py-2.5 text-[15px] text-ink outline-none transition placeholder:text-ink-faint focus:border-eco"
      />
    </label>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */

function Footer() {
  const [email, setEmail] = useState('')
  return (
    <footer className="border-t-[1.5px] border-ink bg-eco-50/40">
      <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md">
            <p className="text-[14px] font-semibold text-ink">
              Non sei ancora pronto a parlarne?
            </p>
            <p className="text-[13px] text-ink-soft">
              Lascia la tua email e ti aggiorniamo sul lancio.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(
                'Tienimi aggiornato sul lancio',
              )}&body=${encodeURIComponent(`Email: ${email}`)}`
            }}
            className="flex w-full max-w-md gap-2"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="La tua email"
              className="min-w-0 flex-1 rounded-lg border border-edge bg-paper px-3 py-2.5 text-[15px] text-ink outline-none transition placeholder:text-ink-faint focus:border-eco"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg border border-ink px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.06em] text-ink transition hover:bg-ink hover:text-paper"
            >
              Tienimi aggiornato
            </button>
          </form>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 sm:flex-row">
          <Logo className="text-[18px]" />
          <p className="text-[11px] text-ink-muted">
            © 2026 Renova · Il marketplace second hand per ASD e SSD · {SITO}
          </p>
        </div>
      </div>
    </footer>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   MOCKUP APP — ricreazioni fedeli degli schermi dentro una cornice iPhone
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
function StatoBadge({ stato, big = false }: { stato: string; big?: boolean }) {
  const tone =
    stato === 'Scambiato'
      ? 'bg-ink'
      : stato === 'Prenotato'
        ? 'bg-sun'
        : 'bg-eco'
  return (
    <span
      className={`absolute font-bold uppercase leading-none text-white ${tone} ${
        big ? 'left-2 top-2 px-1.5 py-0.5 text-[6px]' : 'left-1 top-1 px-1 py-px text-[5px]'
      }`}
    >
      {stato}
    </span>
  )
}

/** Dati fittizi del feed: nomi generici, nessuna foto reale (placeholder a
 *  righe), stati e metriche ESG nel formato «≥» dell'app. */
const FEED_ITEMS = [
  { titolo: 'Zaino sportivo', meta: 'Zaino · Unica · Buono', co2: '9 KG', h2o: '300 L', stato: 'Disponibile' },
  { titolo: 'Scarpe da calcio', meta: 'Scarpe · 41 · Ottimo', co2: '14 KG', h2o: '1,3K L', stato: 'Scambiato' },
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

function ArticleMock({ variant }: { variant: 'societario' | 'pubblico' }) {
  const soc = variant === 'societario'
  const tags = soc
    ? ['Giacca sportiva', 'Taglia M', 'Ottimo', 'Capo societario']
    : ['Scarpe da calcio', 'Taglia 41', 'Ottimo', 'Feed pubblico']
  return (
    <div className="flex h-full flex-col bg-paper text-ink">
      <PhoneHeader />
      {/* breadcrumb */}
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-1.5 text-[8px] font-bold">
        <BackIcon />
        <span className="text-ink">Indietro</span>
        <span className="text-eco-700">Marketplace</span>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* foto */}
        <div className="foto-stripe relative aspect-[5/4] w-full shrink-0 overflow-hidden">
          <StatoBadge stato={soc ? 'Disponibile' : 'Scambiato'} big />
        </div>

        <div className="px-3 py-2">
          <h3 className="text-[12px] font-extrabold leading-tight text-ink">
            {soc ? 'Giacca da rappresentanza' : 'Scarpe da calcio'}
          </h3>
          {/* chips */}
          <div className="mt-1.5 flex flex-wrap gap-1">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded border border-edge px-1 py-0.5 text-[5px] font-bold uppercase tracking-[0.04em] text-ink-muted"
              >
                {t}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div
            className={`mt-2 flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[7px] font-bold uppercase tracking-[0.06em] text-white ${
              soc ? 'bg-eco' : 'bg-eco-300'
            }`}
          >
            <ChatBubbleIcon className="h-2.5 w-2.5" />
            {soc ? 'Chiedi informazioni' : 'Articolo già scambiato'}
          </div>

          {/* card impatto */}
          <div className="mt-2 rounded-lg border border-eco-100 bg-eco-50/50 px-2 py-1.5">
            <div className="text-[6px] font-bold uppercase tracking-[0.06em] text-ink">
              Impatto del riuso rispetto al nuovo
            </div>
            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[6px] font-bold uppercase">
              <span className="text-eco">CO₂: ≥ {soc ? '0,9 KG' : '14 KG'}</span>
              <span className="text-water-600">H₂O: ≥ {soc ? '18,6 L' : '1,3K L'}</span>
              <span className="text-sun-600">Valore: {soc ? '45,00 €' : '215,00 €'}</span>
            </div>
            <p className="mt-1 text-[5px] leading-snug text-ink-soft">
              <span className="font-bold">≥</span> significa «almeno»: è una stima prudenziale, il
              risparmio reale è almeno questo.
            </p>
          </div>
        </div>
      </div>
      <BottomNav active="market" />
    </div>
  )
}

function ChatMock() {
  return (
    <div className="flex h-full flex-col bg-paper text-ink">
      <PhoneHeader />
      {/* riga "Chat" */}
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-1.5 text-[8px] font-bold text-ink">
        <BackIcon />
        Chat
      </div>
      {/* contesto articolo + interlocutore */}
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <div className="foto-stripe h-7 w-7 shrink-0 overflow-hidden rounded" />
        <div className="leading-tight">
          <div className="text-[9px] font-bold text-ink">Maglia da allenamento</div>
          <div className="text-[6px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
            Con Marco B.
          </div>
        </div>
        <span className="ml-auto rounded border border-edge px-1.5 py-0.5 text-[5px] font-bold uppercase tracking-[0.06em] text-ink-soft">
          Articolo
        </span>
      </div>

      {/* messaggi */}
      <div className="flex flex-1 flex-col gap-2 overflow-hidden px-3 py-3">
        <DateDivider>22 Giugno 2026</DateDivider>
        <Bubble side="right" time="19:59">
          Ciao, è ancora disponibile la maglia?
        </Bubble>
        <DateDivider>23 Giugno 2026</DateDivider>
        <Bubble side="left" time="11:10">
          Sì, te la sto tenendo da parte. La porto mercoledì all'allenamento?
        </Bubble>
      </div>

      {/* input */}
      <div className="flex items-center gap-2 border-t border-line px-3 py-2">
        <ImageIcon />
        <div className="flex-1 rounded-full border border-edge px-2.5 py-1 text-[7px] text-ink-faint">
          Scrivi un messaggio…
        </div>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-eco-300 text-white">
          <SendIcon />
        </span>
      </div>
      <BottomNav active="chat" />
    </div>
  )
}

function DateDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center text-[5px] font-bold uppercase tracking-[0.08em] text-ink-faint">
      {children}
    </div>
  )
}

function Bubble({
  side,
  time,
  children,
}: {
  side: 'left' | 'right'
  time?: string
  children: React.ReactNode
}) {
  const right = side === 'right'
  return (
    <div className={`flex ${right ? 'justify-end' : 'justify-start'}`}>
      <span
        className={`max-w-[82%] rounded-2xl px-2.5 py-1.5 text-[8px] leading-snug ${
          right ? 'rounded-br-sm bg-eco text-white' : 'rounded-bl-sm border border-line bg-paper text-ink'
        }`}
      >
        {children}
        {time && (
          <span
            className={`mt-0.5 block text-right text-[6px] ${right ? 'text-white/70' : 'text-ink-faint'}`}
          >
            {time}
          </span>
        )}
      </span>
    </div>
  )
}

/** Ricostruzione fedele della pagina "Impatto" reale dell'app (vista "La
 *  società"): occhiello + titolone "Impatto", tab, blocchi metrica con pallino
 *  colorato, numero grande + unità e le equivalenze, riga di nota, scheda Fonti. */
function ImpattoMock() {
  return (
    <div className="flex h-full flex-col bg-paper text-ink">
      <PhoneHeader />
      {/* intestazione editoriale */}
      <div className="border-b-[1.5px] border-ink px-3 pb-2 pt-1.5">
        <div className="text-[6px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
          Il risparmio generato dal riuso
        </div>
        <div className="text-[26px] font-extrabold leading-[0.9] tracking-[-0.03em] text-ink">
          Impatto
        </div>
      </div>

      {/* tab: La società ↔ Il mio contributo */}
      <div className="flex gap-4 border-b border-line px-3 py-1.5 text-[7px] uppercase tracking-[0.06em]">
        <span className="border-b-2 border-eco pb-0.5 font-bold text-ink">La società</span>
        <span className="font-semibold text-ink-faint">Il mio contributo</span>
      </div>

      {/* blocchi metrica */}
      <div className="flex-1 overflow-hidden">
        <ImpattoMetrica
          dot="bg-eco"
          label="CO₂ risparmiata"
          num="312"
          unit="kg"
          eq="2.496 km in auto evitati · 104.000 ricariche smartphone"
        />
        <ImpattoMetrica
          dot="bg-water"
          label="Acqua risparmiata"
          num="98.000"
          unit="L"
          eq="1.225 docce · 754 caffè (acqua nascosta)"
        />
        <ImpattoMetrica dot="bg-sun" label="Valore risparmiato" num="4.300" unit="€" />
        <p className="border-t border-line px-3 py-1.5 text-[5px] leading-relaxed tracking-[0.03em] text-ink-faint">
          Equivalenze indicative · 47 scambi conclusi · metodo nel profilo
        </p>
        <div className="flex items-center justify-between border-y border-line px-3 py-2 text-[6px] font-bold uppercase tracking-[0.08em] text-ink">
          <span>Fonti delle equivalenze</span>
          <ChevronDownIcon />
        </div>
      </div>
      <BottomNav active="impatto" />
    </div>
  )
}

function ImpattoMetrica({
  dot,
  label,
  num,
  unit,
  eq,
}: {
  dot: string
  label: string
  num: string
  unit: string
  eq?: string
}) {
  return (
    <div className="border-t border-line px-3 py-2">
      <div className="flex items-center gap-1.5 text-[6px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className="text-[30px] font-extrabold leading-[0.85] tracking-[-0.03em] text-ink">
          {num}
        </span>
        <span className="text-[13px] font-bold text-ink">{unit}</span>
      </div>
      {eq && <p className="mt-1 text-[6px] leading-snug text-ink-soft">{eq}</p>}
    </div>
  )
}

function CodeMock() {
  return (
    <div className="flex h-full flex-col bg-paper text-ink">
      <div className="h-[18px]" />
      <div className="flex items-center justify-center border-b-[1.5px] border-ink px-3 py-2">
        <Logo className="text-[12px]" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-eco-50 text-eco">
          <RenovaMark className="h-7 w-7" />
        </span>
        <p className="mt-4 text-[7px] font-bold uppercase tracking-[0.1em] text-ink-muted">
          Codice di attivazione
        </p>
        <div className="mt-2 rounded-lg border-[1.5px] border-ink px-4 py-2.5">
          <span className="text-[20px] font-extrabold tracking-[0.06em] text-ink">BFC-CAL</span>
        </div>
        <p className="mt-2 text-[8px] font-semibold text-ink-soft">Bologna FC · Calcio</p>
        <p className="mt-3 max-w-[150px] text-[7px] leading-snug text-ink-muted">
          Distribuiscilo ai tesserati: con questo codice accedono al marketplace del club.
        </p>
        <div className="mt-4 w-full rounded-md bg-eco px-3 py-2 text-[8px] font-bold uppercase tracking-[0.08em] text-white">
          Condividi con i tesserati
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Icone inline
   ────────────────────────────────────────────────────────────────────────── */

function BurgerIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      {open ? (
        <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path
          d="M4 7h16M4 12h16M4 17h16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function ArrowOutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path
        d="M7 17 17 7M9 7h8v8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3 text-ink" fill="none" aria-hidden="true">
      <path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" aria-hidden="true">
      <path d="M4 12 20 4l-6 16-3-7-7-1Z" fill="currentColor" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 text-ink-soft" fill="none" aria-hidden="true">
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ── Icone della navigazione inferiore dei mockup ── */

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
      <path
        d="M4 5h16v11H9l-4 4V5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PersonIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-ink-faint" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8.5" cy="9" r="1.6" fill="currentColor" />
      <path d="m4 18 5-5 4 4 3-3 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path
        d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 11a3 3 0 1 0-1-5.8M21 20c0-2.5-1.5-4.6-3.6-5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function HeartChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path
        d="M4 5h16v11H8l-4 4V5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 13c-2-1.3-3.2-2.4-3.2-3.7 0-1 .8-1.6 1.6-1.6.6 0 1.2.3 1.6.9.4-.6 1-.9 1.6-.9.8 0 1.6.6 1.6 1.6 0 1.3-1.2 2.4-3.2 3.7Z"
        fill="currentColor"
      />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path
        d="M3 12V4h8l9 9-7 7-9-9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" />
    </svg>
  )
}

function LeafChartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="M4 20h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="5" y="12" width="3" height="6" stroke="currentColor" strokeWidth="1.6" />
      <rect x="10.5" y="8" width="3" height="10" stroke="currentColor" strokeWidth="1.6" />
      <path d="M19 6c-3 0-5 2-5 5 3 0 5-2 5-5Z" fill="currentColor" />
    </svg>
  )
}
