import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Logo } from './Logo'
import { APP_URL, HA_APP_DEDICATA } from '../lib/app-url'

/* ──────────────────────────────────────────────────────────────────────────
   SITO PUBBLICO di Renova — guscio comune (header, footer, navigazione).

   La radice `/` ospita SOLO l'hero: è la schermata che si raggiunge dai
   motori di ricerca e deve dire il progetto in un colpo d'occhio. Il resto
   del racconto vive su una pagina per voce di menu:

     /progetto · /come-funziona · /come-misuriamo · /collabora

   Diversamente dalla web-app (solo mobile), il sito è RESPONSIVE.

   ⚠️ `/impatto` è già la dashboard dell'app (rotta protetta): la pagina
   pubblica sull'impatto sta perciò su `/come-misuriamo`, pur mostrando
   «Impatto» nel menu.
   ────────────────────────────────────────────────────────────────────────── */

export const EMAIL = 'info@renovasport.it'
/** Casella dedicata a privacy e cookie policy (esercizio dei diritti GDPR). */
export const EMAIL_PRIVACY = 'privacy@renovasport.it'
export const SITO = 'renovasport.it'
/**
 * Cookie policy: raggiungibile dal footer di OGNI pagina del sito e — perché
 * è l'app a scrivere il token in localStorage — anche dalle schermate di
 * accesso e dall'Account. Vedi `pages/CookiePolicy.tsx`.
 */
export const COOKIE_POLICY = '/cookie-policy'
/**
 * Informativa sulla privacy: sta accanto alla cookie policy negli stessi tre
 * posti (footer del sito, schermate di accesso, Account) perché è l'app a
 * trattare davvero i dati. Vedi `pages/PrivacyPolicy.tsx`.
 * ⚠️ La pagina contiene ancora segnaposti `[DA COMPLETARE]` (titolare del
 * trattamento e data): finché restano tali NON è pubblicabile.
 */
export const PRIVACY_POLICY = '/privacy-policy'
export const TELEFONO: string = '+39 370 3238359'
export const SURVEY_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdNT_K8-4KZXxYKkiOF8XfazyFLKiXhI0UqRbH6oXrYuDSowg/viewform'
/** Documento metodologico integrale, scaricabile (in `public/`). */
export const PDF_METODOLOGIA = '/metodologia-renova.pdf'

export type PaginaSito = {
  /** Rotta della pagina. */
  to: string
  /** Etichetta nel menu (breve). */
  label: string
  /** Titolo della scheda del browser. */
  titolo: string
  /** Riga di sintesi usata dalle card d'ingresso in home. */
  sommario: string
}

/** Ordine narrativo del sito: menu, card della home e «pagina seguente». */
export const PAGINE_SITO: PaginaSito[] = [
  {
    to: '/progetto',
    label: 'Il progetto',
    titolo: 'Il progetto · Renova',
    sommario:
      'Il costo che nessuno copre, l’impatto già pagato, la nostra missione e gli obiettivi dell’Agenda 2030 che presidiamo.',
  },
  {
    to: '/come-funziona',
    label: 'Come funziona',
    titolo: 'Come funziona · Renova',
    sommario:
      'Dall’attivazione del club al primo scambio, in quattro passaggi. Uno solo compete alla società.',
  },
  {
    to: '/come-misuriamo',
    label: 'Impatto',
    titolo: 'Impatto: come lo misuriamo · Renova',
    sommario:
      'Come stimiamo il beneficio ambientale di ogni scambio, perché lo sottostimiamo apposta e dove dichiariamo i limiti.',
  },
  {
    to: '/collabora',
    label: 'Collabora',
    titolo: 'Costruiamo la rete insieme · Renova',
    sommario:
      'Club, federazioni, amministrazioni, ETS, aziende: la rete si costruisce un nodo alla volta.',
  },
]

/** Stile del link «Accedi» (interno o verso l'app dedicata: vedi header). */
const ACCEDI_CLASS =
  'text-[12px] font-semibold text-ink-muted underline-offset-4 transition hover:text-ink hover:underline'

/* ════════════════════════════════════════════════════════════════════════
   Guscio: header + contenuto + «pagina seguente» + footer
   ════════════════════════════════════════════════════════════════════════ */

/**
 * Guscio comune a tutte le pagine del sito pubblico.
 * `senzaProssima` serve alla home, che ha già le card d'ingresso.
 */
export function SitoLayout({
  children,
  senzaProssima = false,
}: {
  children: ReactNode
  senzaProssima?: boolean
}) {
  const { pathname } = useLocation()

  // Cambiando pagina si riparte dall'alto: senza questo, passando da una
  // sezione all'altra dal menu si resterebbe a metà scroll.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-screen w-full bg-paper text-ink">
      <SitoHeader />
      <main>{children}</main>
      {!senzaProssima && <ProssimaPagina />}
      <SitoFooter />
    </div>
  )
}

function SitoHeader() {
  const [menuAperto, setMenuAperto] = useState(false)
  const { pathname } = useLocation()
  const chiudi = () => setMenuAperto(false)

  return (
    <header className="sticky top-0 z-40 border-b-[1.5px] border-ink bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
        <Link to="/" onClick={chiudi} className="shrink-0" aria-label="Renova, home">
          <Logo className="text-[22px]" />
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-7 text-[13px] font-semibold text-ink-soft lg:flex">
          {PAGINE_SITO.map((p) => (
            <Link
              key={p.to}
              to={p.to}
              className={`transition hover:text-ink ${
                pathname === p.to ? 'text-ink underline decoration-eco decoration-2 underline-offset-[6px]' : ''
              }`}
            >
              {p.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/collabora"
            className="hidden rounded-lg bg-eco px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.06em] text-white shadow-sm transition hover:bg-eco-600 active:scale-[.99] sm:inline-flex"
          >
            Collabora con noi
          </Link>
          {/* «Accedi» porta all'APP, che vive su un dominio suo
              (VITE_APP_URL): si apre in una nuova scheda così il sito resta
              aperto. Senza dominio dedicato (in locale) è la solita rotta
              interna. */}
          {HA_APP_DEDICATA ? (
            <a href={APP_URL} target="_blank" rel="noopener" className={ACCEDI_CLASS}>
              Accedi
            </a>
          ) : (
            <Link to="/login" className={ACCEDI_CLASS}>
              Accedi
            </Link>
          )}
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
            {PAGINE_SITO.map((p) => (
              <Link
                key={p.to}
                to={p.to}
                onClick={chiudi}
                className={`rounded-lg px-2 py-2.5 hover:bg-black/5 ${
                  pathname === p.to ? 'text-eco-700' : ''
                }`}
              >
                {p.label}
              </Link>
            ))}
            <Link
              to="/collabora"
              onClick={chiudi}
              className="mt-2 rounded-lg bg-eco px-4 py-3 text-center text-[13px] font-bold uppercase tracking-[0.06em] text-white"
            >
              Collabora con noi
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}

/**
 * Il racconto è spezzato su più pagine: in fondo a ciascuna si offre la
 * successiva, così la lettura di seguito resta possibile.
 */
function ProssimaPagina() {
  const { pathname } = useLocation()
  const i = PAGINE_SITO.findIndex((p) => p.to === pathname)
  if (i === -1) return null
  const prossima = PAGINE_SITO[(i + 1) % PAGINE_SITO.length]

  return (
    <section className="border-t-[1.5px] border-ink bg-eco-50/40">
      <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
        <Link
          to={prossima.to}
          className="group flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <span className="eyebrow">Continua</span>
            <p className="mt-1 text-[22px] font-extrabold leading-tight tracking-[-0.03em] text-ink sm:text-[26px]">
              {prossima.label}
            </p>
            <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-ink-soft">
              {prossima.sommario}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-lg border-[1.5px] border-ink px-5 py-3 text-[12px] font-bold uppercase tracking-[0.06em] text-ink transition group-hover:bg-ink group-hover:text-paper">
            Vai
            <ArrowRightIcon />
          </span>
        </Link>
      </div>
    </section>
  )
}

function SitoFooter() {
  return (
    <footer className="border-t-[1.5px] border-ink bg-eco-50/40">
      <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
        {/* Mappa del sito + recapiti */}
        <div className="grid gap-6 sm:grid-cols-2">
          <nav className="flex flex-col gap-2 text-[13px] font-semibold text-ink-soft">
            {PAGINE_SITO.map((p) => (
              <Link key={p.to} to={p.to} className="transition hover:text-ink">
                {p.label}
              </Link>
            ))}
            <Link to="/metodologia" className="transition hover:text-ink">
              Metodologia d’impatto
            </Link>
          </nav>
          <div className="space-y-2 text-[13px]">
            <a
              href={`mailto:${EMAIL}`}
              className="block font-semibold text-eco-700 underline-offset-4 hover:underline"
            >
              {EMAIL}
            </a>
            <a
              href={`tel:${TELEFONO.replace(/\s/g, '')}`}
              className="block font-semibold text-eco-700 underline-offset-4 hover:underline"
            >
              {TELEFONO}
            </a>
            <a
              href={`https://${SITO}`}
              className="block font-semibold text-eco-700 underline-offset-4 hover:underline"
            >
              {SITO}
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 sm:flex-row">
          <Logo className="text-[18px]" />
          <div className="flex flex-col items-center gap-2 sm:items-end">
            {/* Ultima riga del sito: le informative devono restare raggiungibili
                con un clic da qualsiasi pagina (art. 13 GDPR per la privacy,
                Linee guida Garante 231/2021 per i cookie). */}
            <div className="flex items-center gap-3">
              <Link
                to={PRIVACY_POLICY}
                className="py-1 text-[11px] font-semibold text-ink-soft underline underline-offset-4 transition hover:text-ink"
              >
                Privacy policy
              </Link>
              <span aria-hidden="true" className="text-[11px] text-ink-muted">
                ·
              </span>
              <Link
                to={COOKIE_POLICY}
                className="py-1 text-[11px] font-semibold text-ink-soft underline underline-offset-4 transition hover:text-ink"
              >
                Cookie policy
              </Link>
            </div>
            <p className="text-center text-[11px] text-ink-muted sm:text-right">
              © 2026 renova · Economia circolare per lo sport dilettantistico · {SITO}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   Elementi editoriali riusati dalle pagine
   ════════════════════════════════════════════════════════════════════════ */

/** Testata di pagina: occhiello + titolo + sommario. */
export function TestataPagina({
  occhiello,
  titolo,
  children,
}: {
  occhiello: string
  titolo: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="max-w-3xl">
      <span className="eyebrow">{occhiello}</span>
      <h1 className="mt-2 text-[30px] leading-[1.05] sm:text-[38px] lg:text-[44px]">{titolo}</h1>
      {children && (
        <div className="mt-5 space-y-4 text-[16px] leading-relaxed text-ink-soft lg:text-[17px]">
          {children}
        </div>
      )}
    </div>
  )
}

/** Nota di fonte sotto una grafica-dato: piccola, sempre esplicita. */
export function Fonte({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-[11px] leading-relaxed text-ink-muted">{children}</p>}

/* ── Icone condivise ── */

export function ArrowRightIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M5 12h13m-5-6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ArrowOutIcon() {
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

function BurgerIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      {open ? (
        <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  )
}
