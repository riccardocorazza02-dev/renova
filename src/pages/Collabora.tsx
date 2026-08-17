import { useState } from 'react'
import { RagnatelaRete } from '../components/RagnatelaRete'
import { EMAIL, SITO, TELEFONO, SitoLayout, TestataPagina } from '../components/sito'

/* ──────────────────────────────────────────────────────────────────────────
   /collabora — «Costruiamo la rete insieme»: la porta d'ingresso aperta a
   qualsiasi ente, non solo ai club. Due form affiancati (club · altro ente)
   e i contatti diretti in chiusura.

   I form non hanno backend: aprono il client di posta con i dati già
   compilati (mailto), come il resto del sito.
   ────────────────────────────────────────────────────────────────────────── */

/** Tipi di ente proposti nel form B. */
const TIPI_ENTE = ['Federazione', 'Pubblica amministrazione', 'Terzo settore', 'Azienda', 'Altro']

export function Collabora() {
  return (
    <SitoLayout>
      <Invito />
      <Form />
      <Contatti />
    </SitoLayout>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   1 · L'INVITO + la rete
   ════════════════════════════════════════════════════════════════════════ */

function Invito() {
  return (
    <section className="border-b-[1.5px] border-ink">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
        <TestataPagina occhiello="Collabora" titolo={<>renova cresce con chi vuole costruirla.</>}>
          <p>
            renova non è solo per i club. È pensata per aprirsi a chiunque possa contribuire a
            rimettere in circolo il materiale sportivo e a diffondere una cultura della
            sostenibilità nello sport: federazioni, amministrazioni locali, enti del terzo settore,
            produttori, aziende di software gestionali. Se vedi un punto di contatto tra la tua
            realtà e la nostra, parliamone:{' '}
            <span className="font-semibold text-ink">la rete si costruisce un nodo alla volta.</span>
          </p>
        </TestataPagina>

        <RagnatelaRete />
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   2 · DOPPIO FORM — club / altro ente
   ════════════════════════════════════════════════════════════════════════ */

function Form() {
  return (
    <section className="border-b-[1.5px] border-ink bg-eco-50/40">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
        <span className="eyebrow">Scrivici</span>
        <h2 className="mt-2 text-[28px] leading-tight sm:text-[34px]">Due strade, stessa porta.</h2>

        <div className="mt-9 grid gap-4 lg:grid-cols-2 lg:gap-6">
          <FormClub />
          <FormEnte />
        </div>

        <p className="mt-5 text-center text-[12px] lg:text-[13px] text-ink-muted">
          Inviando il form aprirai la tua email con i dati già compilati.
        </p>
      </div>
    </section>
  )
}

function FormClub() {
  const [form, setForm] = useState({
    nome: '',
    club: '',
    ruolo: '',
    email: '',
    telefono: '',
    messaggio: '',
  })
  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    apriEmail(`renova nel club · ${form.club || form.nome || 'Club'}`, [
      `Nome: ${form.nome}`,
      `Club / società: ${form.club}`,
      `Ruolo: ${form.ruolo}`,
      `Email: ${form.email}`,
      `Telefono: ${form.telefono}`,
      '',
      form.messaggio,
    ])
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col rounded-2xl border-[1.5px] border-ink bg-paper p-6 shadow-sm lg:p-7"
    >
      <span className="eyebrow">Sei un club</span>
      <h3 className="mt-1 text-[20px] lg:text-[22px] leading-tight">Porta renova fra i tuoi tesserati</h3>

      <div className="mt-6 grid flex-1 content-start gap-4 sm:grid-cols-2">
        <Field label="Nome" value={form.nome} onChange={set('nome')} required />
        <Field label="Club / società" value={form.club} onChange={set('club')} required />
        <Field label="Ruolo" value={form.ruolo} onChange={set('ruolo')} />
        <Field label="Email" type="email" value={form.email} onChange={set('email')} required />
        <div className="sm:col-span-2">
          <Field label="Telefono" type="tel" value={form.telefono} onChange={set('telefono')} required />
        </div>
        <div className="sm:col-span-2">
          <TextArea
            label="Messaggio"
            opzionale
            value={form.messaggio}
            onChange={set('messaggio')}
            placeholder="Domande, dubbi, curiosità…"
          />
        </div>
      </div>

      <Submit>Porta renova nel tuo club</Submit>
    </form>
  )
}

function FormEnte() {
  const [form, setForm] = useState({
    nome: '',
    ente: '',
    tipo: TIPI_ENTE[0],
    email: '',
    come: '',
  })
  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    apriEmail(`Proposta di collaborazione · ${form.ente || form.nome || 'Ente'}`, [
      `Nome: ${form.nome}`,
      `Ente / organizzazione: ${form.ente}`,
      `Tipo di ente: ${form.tipo}`,
      `Email: ${form.email}`,
      '',
      form.come,
    ])
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col rounded-2xl border-[1.5px] border-ink bg-paper p-6 shadow-sm lg:p-7"
    >
      <span className="eyebrow">Sei un altro tipo di ente</span>
      <h3 className="mt-1 text-[20px] lg:text-[22px] leading-tight">Proponici una collaborazione</h3>

      <div className="mt-6 grid flex-1 content-start gap-4 sm:grid-cols-2">
        <Field label="Nome" value={form.nome} onChange={set('nome')} required />
        <Field label="Ente / organizzazione" value={form.ente} onChange={set('ente')} required />
        <label className="block">
          <span className="text-[12px] lg:text-[13px] font-bold uppercase tracking-[0.06em] text-ink-soft">
            Tipo di ente
          </span>
          <select
            value={form.tipo}
            onChange={set('tipo')}
            className="mt-1.5 w-full rounded-lg border border-edge bg-paper px-3 py-2.5 text-[15px] lg:text-[17px] text-ink outline-none transition focus:border-eco"
          >
            {TIPI_ENTE.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <Field label="Email" type="email" value={form.email} onChange={set('email')} required />
        <div className="sm:col-span-2">
          <TextArea
            label="Come vorresti collaborare"
            value={form.come}
            onChange={set('come')}
            placeholder="Raccontaci il punto di contatto che vedi con la tua realtà…"
          />
        </div>
      </div>

      <Submit>Proponi una collaborazione</Submit>
    </form>
  )
}

/** Apre il client di posta con oggetto e corpo già compilati. */
function apriEmail(oggetto: string, righe: string[]) {
  window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(
    oggetto,
  )}&body=${encodeURIComponent(righe.join('\n'))}`
}

/* ════════════════════════════════════════════════════════════════════════
   3 · CONTATTI
   ════════════════════════════════════════════════════════════════════════ */

function Contatti() {
  return (
    <section className="border-b-[1.5px] border-ink">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:grid lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-20">
        <div>
          <span className="eyebrow">Contatti</span>
          <h2 className="mt-2 text-[28px] leading-tight sm:text-[36px]">Parliamone.</h2>
          <p className="mt-3 max-w-lg text-[16px] lg:text-[18px] leading-relaxed text-ink-soft">
            Raccontaci della tua realtà, porta alla luce dubbi e curiosità, o aiutaci con
            suggerimenti che migliorino il servizio.
          </p>
        </div>

        <div className="mt-8 space-y-4 lg:mt-0">
          <ContattoDiretto label="Email" valore={EMAIL} href={`mailto:${EMAIL}`} />
          <ContattoDiretto
            label="Telefono"
            valore={TELEFONO}
            href={`tel:${TELEFONO.replace(/\s/g, '')}`}
          />
          <ContattoDiretto label="Sito" valore={SITO} href={`https://${SITO}`} />
        </div>
      </div>
    </section>
  )
}

function ContattoDiretto({ label, valore, href }: { label: string; valore: string; href: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-20 shrink-0 text-[11px] lg:text-[12px] font-bold uppercase tracking-[0.08em] text-ink-muted">
        {label}
      </span>
      <a href={href} className="text-[16px] lg:text-[18px] font-semibold text-eco-700 underline-offset-4 hover:underline">
        {valore}
      </a>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */

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
      <span className="text-[12px] lg:text-[13px] font-bold uppercase tracking-[0.06em] text-ink-soft">
        {label}
        {required && <span className="text-eco"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="mt-1.5 w-full rounded-lg border border-edge bg-paper px-3 py-2.5 text-[15px] lg:text-[17px] text-ink outline-none transition placeholder:text-ink-faint focus:border-eco"
      />
    </label>
  )
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  opzionale = false,
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  opzionale?: boolean
}) {
  return (
    <label className="block">
      <span className="text-[12px] lg:text-[13px] font-bold uppercase tracking-[0.06em] text-ink-soft">
        {label} {opzionale && <span className="font-normal text-ink-muted">(opzionale)</span>}
      </span>
      <textarea
        value={value}
        onChange={onChange}
        rows={4}
        placeholder={placeholder}
        className="mt-1.5 w-full resize-y rounded-lg border border-edge bg-paper px-3 py-2.5 text-[15px] lg:text-[17px] text-ink outline-none transition placeholder:text-ink-faint focus:border-eco"
      />
    </label>
  )
}

function Submit({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-eco px-6 py-3.5 text-[14px] lg:text-[16px] font-bold uppercase tracking-[0.06em] text-white transition hover:bg-eco-600 active:scale-[.99]"
    >
      {children}
    </button>
  )
}
