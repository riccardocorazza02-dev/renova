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

        {/* Come funziona */}
        <section className="px-5 py-10">
          <span className="eyebrow">Come funziona</span>
          <div className="mt-5 flex flex-col gap-5">
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
        </section>

        {/* Due feed */}
        <section className="border-t-[1.5px] border-ink px-5 py-10">
          <span className="eyebrow">Due mondi, un'app</span>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
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

        {/* CTA finale */}
        <section className="border-t-[1.5px] border-ink bg-ink px-5 py-12 text-center">
          <h2 className="text-[28px] leading-tight text-paper">
            Pronto a far girare
            <br />
            il tuo materiale?
          </h2>
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
