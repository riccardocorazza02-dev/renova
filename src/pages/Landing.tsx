import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'

/**
 * Landing pubblica di Renova — porta d'ingresso "marketing" mostrata ai
 * visitatori non autenticati su `/`. Da qui si accede alla web-app
 * (login / registrazione). Stile editoriale "Press 2A": superfici avorio,
 * regole nere nette, accento verde eco.
 */
export function Landing() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col bg-paper">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b-[1.5px] border-ink bg-paper/95 px-4 py-3 backdrop-blur">
        <Logo className="text-[21px]" />
        <nav className="hidden items-center gap-7 text-[13px] font-semibold text-ink-soft sm:flex">
          <a href="#chi-siamo" className="transition hover:text-ink">
            Chi siamo
          </a>
          <a href="#come-funziona" className="transition hover:text-ink">
            Come funziona
          </a>
          <a href="#contatti" className="transition hover:text-ink">
            Contatti
          </a>
        </nav>
        <Link
          to="/login"
          className="rounded-lg border border-ink px-3.5 py-2 text-[12px] font-bold uppercase tracking-[0.06em] text-ink transition hover:bg-ink hover:text-paper"
        >
          Accedi
        </Link>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="px-5 pb-10 pt-12">
          <span className="eyebrow">Marketplace sportivo · Seconda mano</span>
          <h1 className="mt-3 text-[40px] leading-[0.98] text-ink">
            Rimetti in gioco
            <br />
            il tuo materiale
            <br />
            <span className="text-eco">tecnico.</span>
          </h1>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-ink-soft">
            Renova è il marketplace delle società sportive: gli atleti scambiano
            attrezzatura usata e ogni articolo mostra quanta{' '}
            <span className="font-semibold text-ink">CO₂ e acqua</span> hai
            risparmiato riusando invece di comprare nuovo.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/registrazione"
              className="inline-flex items-center justify-center rounded-lg bg-eco px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-white shadow-sm transition hover:bg-eco-600 active:scale-[.99]"
            >
              Inizia ora
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg border border-ink px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-ink transition hover:bg-ink hover:text-paper"
            >
              Ho già un account
            </Link>
          </div>
          <p className="mt-3 text-[12px] text-ink-muted">
            Ti serve il <span className="font-semibold">codice di accesso</span>{' '}
            della tua società sportiva.
          </p>
        </section>

        {/* Metriche ESG */}
        <section className="border-y-[1.5px] border-ink bg-eco-50 px-5 py-7">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Metric value="CO₂" label="risparmiata" />
            <Metric value="Acqua" label="risparmiata" tone="water" />
            <Metric value="€" label="valore riuso" tone="sun" />
          </div>
          <p className="mt-4 text-center text-[12px] leading-relaxed text-ink-soft">
            Stima cradle-to-gate calcolata dalle fibre del capo —
            deterministica e tracciabile.
          </p>
        </section>

        {/* Chi siamo — Mission / Vision */}
        <section
          id="chi-siamo"
          className="scroll-mt-20 border-t-[1.5px] border-ink px-5 py-10"
        >
          <span className="eyebrow">Chi siamo</span>
          <h2 className="mt-2 text-[26px] leading-tight text-ink">
            Lo sport che non si butta via.
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            Renova nasce dentro il mondo delle società sportive, dove ogni
            stagione tonnellate di materiale ancora valido finiscono in fondo a
            un armadietto. La nostra idea è semplice: far circolare quel
            materiale tra chi ne ha bisogno, rendendo visibile il valore
            ambientale di ogni riuso.
          </p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <MvCard
              tag="Mission"
              title="Dare una seconda vita al materiale tecnico"
              body="Mettiamo in contatto gli atleti delle stesse società e dello stesso sport per scambiare attrezzatura usata in modo semplice, sicuro e tracciabile — riducendo sprechi e costi per le famiglie."
            />
            <MvCard
              tag="Vision"
              title="Rendere il riuso lo standard nello sport"
              body="Immaginiamo una rete di società sportive in cui comprare usato è la prima scelta, non il ripiego: dove ogni scambio si traduce in CO₂ e acqua risparmiate, misurate e condivise dalla comunità."
            />
          </div>
        </section>

        {/* Come funziona + due feed */}
        <section
          id="come-funziona"
          className="scroll-mt-20 border-t-[1.5px] border-ink px-5 py-10"
        >
          <span className="eyebrow">Come funziona</span>
          <h2 className="mt-2 text-[26px] leading-tight text-ink">
            Dal codice società allo scambio.
          </h2>
          <div className="mt-6 flex flex-col gap-5">
            <Step
              n="1"
              title="Entra con il codice società"
              body="Il codice di accesso ti assegna automaticamente sport e società. Niente configurazioni."
            />
            <Step
              n="2"
              title="Pubblica o scopri articoli"
              body="Due feed: quello pubblico del tuo sport e quello riservato ai membri della tua società."
            />
            <Step
              n="3"
              title="Scambia e misura l'impatto"
              body="Chatti, concludi lo scambio e vedi crescere il tuo risparmio ambientale."
            />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Card
              title="Feed pubblico"
              body="Scarpe, protezioni e accessori senza logo, visibili a tutti i praticanti del tuo sport nella tua zona."
            />
            <Card
              title="Feed societario"
              body="Materiale con il logo della tua società, visibile solo ai membri della stessa squadra."
            />
          </div>
        </section>

        {/* Contatti */}
        <section
          id="contatti"
          className="scroll-mt-20 border-t-[1.5px] border-ink px-5 py-10"
        >
          <span className="eyebrow">Contatti</span>
          <h2 className="mt-2 text-[26px] leading-tight text-ink">Parliamone.</h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            Hai bisogno di informazioni o rappresenti una società sportiva
            interessata al servizio? Scrivici: ti rispondiamo il prima possibile.
          </p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <ContactCard
              title="Informazioni generali"
              body="Per qualsiasi domanda su Renova, sul funzionamento dell'app o sul tuo account."
              email="info@renovasport.it"
            />
            <ContactCard
              title="Società sportive"
              body="Vuoi portare Renova nella tua società e dare ai tuoi atleti un codice di accesso dedicato? Contattaci."
              email="info@renovasport.it"
              subject="Richiesta società sportiva"
            />
          </div>
        </section>

        {/* CTA finale */}
        <section className="border-t-[1.5px] border-ink bg-ink px-5 py-12 text-center">
          <h2 className="text-[28px] leading-tight text-paper">
            Pronto a far girare
            <br />
            il tuo materiale?
          </h2>
          <p className="mt-3 text-[15px] text-[#c9c8c2]">
            Bastano il codice della tua società e un minuto per registrarti.
          </p>
          <Link
            to="/registrazione"
            className="mt-7 inline-flex items-center justify-center rounded-lg bg-eco px-8 py-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-white transition hover:bg-eco-600 active:scale-[.99]"
          >
            Crea il tuo account
          </Link>
        </section>
      </main>

      <footer className="px-5 py-6 text-center text-[11px] text-ink-muted">
        © 2026 Renova · Marketplace sportivo di seconda mano
      </footer>
    </div>
  )
}

function Metric({
  value,
  label,
  tone = 'eco',
}: {
  value: string
  label: string
  tone?: 'eco' | 'water' | 'sun'
}) {
  const color =
    tone === 'water' ? 'text-water' : tone === 'sun' ? 'text-sun' : 'text-eco'
  return (
    <div>
      <div className={`text-[26px] font-extrabold tracking-[-0.03em] ${color}`}>
        {value}
      </div>
      <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
        {label}
      </div>
    </div>
  )
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="flex gap-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink text-[15px] font-extrabold text-ink">
        {n}
      </span>
      <div>
        <h3 className="text-[17px] text-ink">{title}</h3>
        <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{body}</p>
      </div>
    </div>
  )
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-edge bg-paper p-5">
      <h3 className="text-[17px] text-ink">{title}</h3>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{body}</p>
    </div>
  )
}

function MvCard({
  tag,
  title,
  body,
}: {
  tag: string
  title: string
  body: string
}) {
  return (
    <div className="rounded-xl border border-edge bg-paper p-6">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-eco">
        {tag}
      </span>
      <h3 className="mt-2 text-[19px] text-ink">{title}</h3>
      <p className="mt-2.5 text-[15px] leading-relaxed text-ink-soft">{body}</p>
    </div>
  )
}

function ContactCard({
  title,
  body,
  email,
  subject,
}: {
  title: string
  body: string
  email: string
  subject?: string
}) {
  const href = subject
    ? `mailto:${email}?subject=${encodeURIComponent(subject)}`
    : `mailto:${email}`
  return (
    <div className="rounded-xl border border-edge bg-paper p-6">
      <h3 className="text-[18px] text-ink">{title}</h3>
      <p className="mt-2.5 text-[15px] leading-relaxed text-ink-soft">{body}</p>
      <a
        href={href}
        className="mt-4 inline-block border-b-2 border-eco-50 font-bold text-eco-700 transition hover:border-eco"
      >
        {email}
      </a>
    </div>
  )
}
