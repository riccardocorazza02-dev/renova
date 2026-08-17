import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { EMAIL_PRIVACY, PRIVACY_POLICY, SitoFooter } from '../components/sito'

/* ──────────────────────────────────────────────────────────────────────────
   Pagina PUBBLICA /cookie-policy — informativa sui cookie e sugli strumenti
   di archiviazione locale, resa ai sensi dell'art. 13 GDPR e delle Linee
   guida del Garante (Provv. n. 231 del 10 giugno 2021).

   Vive fuori da `SitoLayout` (come /metodologia) perché è raggiungibile da
   TUTTI E DUE i mondi: dal footer del sito pubblico e da dentro l'app, dove
   il token di sessione viene effettivamente scritto in localStorage. Per lo
   stesso motivo il link di ritorno è «indietro» e non «torna al sito».

   ⚠️ Da completare quando renova sarà un soggetto giuridico costituito: il §2
   deve riportare denominazione, forma giuridica, sede legale e P.IVA/C.F. del
   titolare del trattamento (art. 13, par. 1, lett. a GDPR).
   ⚠️ Il §7 rimanda ora all'Informativa sulla privacy (`/privacy-policy`), che
   però ha a sua volta segnaposti da compilare: le due pagine vanno messe
   online insieme.
   ────────────────────────────────────────────────────────────────────────── */

export const ULTIMO_AGGIORNAMENTO = '16 agosto 2026'

const INDICE: Array<[string, string]> = [
  ['cosa-sono', '1. Cosa sono i cookie e gli strumenti di archiviazione locale'],
  ['titolare', '2. Titolare del trattamento'],
  ['strumenti', '3. Quali strumenti utilizza renova'],
  ['banner', '4. Perché non trovi un banner dei cookie'],
  ['fornitori', '5. Fornitori e responsabili del trattamento'],
  ['gestione', '6. Come gestire o rimuovere questi strumenti'],
  ['diritti', '7. I tuoi diritti'],
  ['modifiche', '8. Modifiche alla presente Cookie Policy'],
]

export function CookiePolicy() {
  const navigate = useNavigate()

  // Ci si arriva dal footer, cioè dal fondo di una pagina già scrollata:
  // senza questo si aprirebbe il documento a metà.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="sito min-h-screen bg-paper">
      {/* Header sticky con marchio e ritorno alla pagina di provenienza */}
      <header className="sticky top-0 z-20 border-b-[1.5px] border-ink bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <Link to="/" aria-label="Torna alla home di renova">
            <Logo className="text-[21px] lg:text-[23px]" />
          </Link>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-[11px] lg:text-[12px] font-bold uppercase tracking-[0.08em] text-ink-soft transition hover:text-ink"
          >
            ← Indietro
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-16">
        {/* Intestazione documento */}
        <div className="border-b-[1.5px] border-ink pb-6 pt-8">
          <span className="eyebrow">Informativa · renova</span>
          <h1 className="mt-1 text-[34px] font-extrabold leading-[1.02] tracking-[-0.03em] text-ink sm:text-[42px]">
            Cookie Policy
          </h1>
          <p className="mt-3 text-[15px] lg:text-[17px] leading-relaxed text-ink-soft">
            Questa Cookie Policy spiega quali cookie e strumenti analoghi di
            archiviazione sul dispositivo vengono utilizzati dai siti{' '}
            <strong className="font-semibold text-ink">renovasport.it</strong> e{' '}
            <strong className="font-semibold text-ink">app.renovasport.it</strong>{' '}
            (di seguito, il «Sito» e l'«Applicazione») e con quali finalità. Il
            documento fa parte dell'informativa sul trattamento dei dati
            personali resa ai sensi dell'art. 13 del Regolamento (UE) 2016/679
            («GDPR») e in attuazione delle <em>Linee guida cookie e altri
            strumenti di tracciamento</em> del Garante per la protezione dei dati
            personali (Provv. n. 231 del 10 giugno 2021).
          </p>

          <div className="mt-4 rounded-lg border border-eco/40 bg-eco-50 px-4 py-3 text-[14px] lg:text-[16px] leading-relaxed text-ink-soft">
            <span className="font-bold text-ink">In sintesi:</span> renova
            utilizza{' '}
            <strong className="font-semibold text-ink">
              esclusivamente strumenti tecnici, strettamente necessari
            </strong>{' '}
            al funzionamento del servizio.{' '}
            <strong className="font-semibold text-ink">Non</strong> utilizza
            cookie di profilazione, strumenti di analisi statistica, pixel di
            marketing o strumenti di tracciamento di terze parti. Per questo
            motivo{' '}
            <strong className="font-semibold text-ink">
              non viene mostrato alcun banner di consenso
            </strong>
            : nessuno degli strumenti impiegati lo richiede.
          </div>

          <p className="mt-4 text-[11px] lg:text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Ultimo aggiornamento: {ULTIMO_AGGIORNAMENTO}
          </p>
        </div>

        {/* Indice */}
        <nav aria-label="Indice" className="border-b border-line py-5">
          <p className="mb-2 text-[11px] lg:text-[12px] font-bold uppercase tracking-[0.1em] text-ink-muted">
            Indice
          </p>
          <ol className="grid gap-1.5 sm:grid-cols-2">
            {INDICE.map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="text-sm font-semibold text-eco-700 hover:underline lg:text-[16px]"
                >
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* 1 */}
        <Sezione
          id="cosa-sono"
          titolo="1. Cosa sono i cookie e gli strumenti di archiviazione locale"
        >
          <P>
            I cookie sono piccoli file di testo che un sito web salva sul
            dispositivo dell'utente per essere riletti nelle visite successive.
            Accanto ai cookie esistono altri strumenti che leggono o scrivono
            informazioni sul dispositivo — ad esempio il <em>localStorage</em>{' '}
            del browser — che la normativa considera in modo analogo ai cookie.
          </P>
          <P>Questi strumenti si distinguono in:</P>
          <ul className="mb-3 space-y-2 text-[15px] lg:text-[17px] leading-relaxed text-ink-soft">
            <Punto>
              <strong className="font-semibold text-ink">
                strumenti tecnici
              </strong>{' '}
              — necessari a fornire il servizio esplicitamente richiesto
              dall'utente (ad esempio mantenere l'accesso a un'area riservata).
              Non richiedono il consenso dell'utente;
            </Punto>
            <Punto>
              <strong className="font-semibold text-ink">
                strumenti di profilazione o tracciamento
              </strong>{' '}
              — utilizzati per analizzare il comportamento degli utenti o
              inviare messaggi pubblicitari personalizzati. Richiedono il
              consenso preventivo.
            </Punto>
          </ul>
          <P>
            renova utilizza{' '}
            <strong className="font-semibold text-ink">
              solo strumenti della prima categoria
            </strong>
            .
          </P>
        </Sezione>

        {/* 2 */}
        <Sezione id="titolare" titolo="2. Titolare del trattamento">
          <P>
            Il titolare del trattamento dei dati raccolti tramite il Sito e
            l'Applicazione è{' '}
            <strong className="font-semibold text-ink">renova</strong>.
          </P>
          <P>
            Per qualsiasi richiesta relativa alla presente Cookie Policy o
            all'esercizio dei propri diritti, è possibile scrivere a:{' '}
            <MailPrivacy />
          </P>
        </Sezione>

        {/* 3 */}
        <Sezione id="strumenti" titolo="3. Quali strumenti utilizza renova">
          <P>
            L'unico strumento di archiviazione impiegato è quello che consente
            all'utente di rimanere autenticato all'interno dell'Applicazione. Di
            seguito il dettaglio.
          </P>

          <div className="my-4 overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[720px] border-collapse text-left text-[13px] lg:text-[15px]">
              <thead>
                <tr className="border-b-[1.5px] border-ink bg-surface">
                  <Th>Strumento</Th>
                  <Th>Tipo</Th>
                  <Th>Finalità</Th>
                  <Th>Durata</Th>
                  <Th>Prima / Terza parte</Th>
                  <Th>Consenso</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td className="font-semibold text-ink">
                    <code className="text-[12px] lg:text-[13px]">sb-…-auth-token</code>{' '}
                    (localStorage)
                  </Td>
                  <Td className="text-ink-soft">
                    Tecnico (strettamente necessario)
                  </Td>
                  <Td className="text-ink-soft">
                    Mantiene la sessione di accesso dell'utente autenticato,
                    evitando di dover inserire nuovamente le credenziali a ogni
                    pagina. Contiene il token di sessione e i dati identificativi
                    dell'account.
                  </Td>
                  <Td className="text-ink-soft">
                    Permane sul dispositivo fino al logout o alla cancellazione
                    manuale dei dati del browser. Il token interno ha durata
                    limitata e viene rinnovato automaticamente durante l'uso.
                  </Td>
                  <Td className="text-ink-soft">Prima parte</Td>
                  <Td className="text-ink-soft">
                    Non richiesto (art. 122, comma 1, D.Lgs. 196/2003)
                  </Td>
                </tr>
              </tbody>
            </table>
          </div>

          <P>
            Al solo funzionamento tecnico della sessione sono connessi alcuni
            meccanismi interni{' '}
            <strong className="font-semibold text-ink">non persistenti</strong>{' '}
            (verifica di scrivibilità dello spazio di archiviazione,
            sincronizzazione dello stato di accesso tra più schede aperte): non
            memorizzano dati sul dispositivo e non rientrano tra gli strumenti
            soggetti a consenso.
          </P>

          <h3 className="mt-6 text-lg font-extrabold tracking-[-0.02em] text-ink lg:text-[21px]">
            Cosa renova NON utilizza
          </h3>
          <ul className="mt-3 space-y-2 text-[15px] lg:text-[17px] leading-relaxed text-ink-soft">
            <Punto>
              nessun cookie (all'apertura del Sito non viene installato alcun
              cookie);
            </Punto>
            <Punto>
              nessuno strumento di analisi statistica del traffico (es. Google
              Analytics);
            </Punto>
            <Punto>nessuno strumento di profilazione o pubblicità;</Punto>
            <Punto>
              nessun pixel, tag o script di tracciamento di terze parti;
            </Punto>
            <Punto>
              nessun font, video o contenuto caricato da server esterni.
            </Punto>
          </ul>
        </Sezione>

        {/* 4 */}
        <Sezione id="banner" titolo="4. Perché non trovi un banner dei cookie">
          <P>
            Il banner di consenso è obbligatorio solo quando un sito utilizza
            strumenti di profilazione o di tracciamento non tecnici. Poiché
            renova impiega{' '}
            <strong className="font-semibold text-ink">
              unicamente lo strumento tecnico
            </strong>{' '}
            descritto al punto 3, indispensabile per erogare il servizio
            richiesto dall'utente, la base giuridica del trattamento è
            l'esecuzione del servizio stesso e{' '}
            <strong className="font-semibold text-ink">
              non è richiesto alcun consenso
            </strong>{' '}
            (art. 122, comma 1, del D.Lgs. 196/2003, che recepisce la direttiva
            ePrivacy). Di conseguenza non viene mostrato alcun banner.
          </P>
        </Sezione>

        {/* 5 */}
        <Sezione id="fornitori" titolo="5. Fornitori e responsabili del trattamento">
          <P>
            L'infrastruttura tecnica dell'Applicazione (autenticazione,
            database, archiviazione dei contenuti) è fornita da{' '}
            <strong className="font-semibold text-ink">Supabase</strong>, che
            opera in qualità di{' '}
            <strong className="font-semibold text-ink">
              responsabile del trattamento
            </strong>{' '}
            ai sensi dell'art. 28 del GDPR, sulla base di un accordo che
            disciplina il trattamento dei dati per conto del titolare.
          </P>
          <P>
            I dati sono ospitati su{' '}
            <strong className="font-semibold text-ink">
              server collocati all'interno dell'Unione Europea
            </strong>
            . Supabase non installa cookie sul dispositivo dell'utente: la
            comunicazione tra l'Applicazione e i suoi server avviene tramite
            chiamate tecniche autenticate, senza strumenti di tracciamento.
          </P>
        </Sezione>

        {/* 6 */}
        <Sezione id="gestione" titolo="6. Come gestire o rimuovere questi strumenti">
          <P>
            Lo strumento descritto al punto 3 è{' '}
            <strong className="font-semibold text-ink">
              strettamente necessario
            </strong>
            : disattivandolo non è possibile mantenere l'accesso
            all'Applicazione. L'utente può comunque, in qualsiasi momento:
          </P>
          <ul className="mb-3 space-y-2 text-[15px] lg:text-[17px] leading-relaxed text-ink-soft">
            <Punto>
              <strong className="font-semibold text-ink">
                effettuare il logout
              </strong>{' '}
              dall'Applicazione, che rimuove la sessione dal dispositivo;
            </Punto>
            <Punto>
              <strong className="font-semibold text-ink">
                cancellare i dati di navigazione
              </strong>{' '}
              dalle impostazioni del proprio browser (voce «Cookie e dati dei
              siti» o equivalente), operazione che elimina anche lo spazio di
              archiviazione locale utilizzato;
            </Punto>
            <Punto>
              <strong className="font-semibold text-ink">
                configurare il browser
              </strong>{' '}
              per bloccare o limitare cookie e archiviazione locale. Si segnala
              che il blocco di tali strumenti impedirà il corretto funzionamento
              dell'area riservata.
            </Punto>
          </ul>
          <P>
            Le istruzioni per gestire questi strumenti sono disponibili nelle
            pagine di supporto dei principali browser (Chrome, Firefox, Safari,
            Edge).
          </P>
        </Sezione>

        {/* 7 */}
        <Sezione id="diritti" titolo="7. I tuoi diritti">
          <P>
            In relazione ai dati personali trattati, l'utente può esercitare i
            diritti previsti dagli artt. 15–22 del GDPR: accesso, rettifica,
            cancellazione, limitazione del trattamento, portabilità e
            opposizione. Le richieste possono essere inoltrate scrivendo a{' '}
            <MailPrivacy />. L'utente ha inoltre il diritto di proporre reclamo
            all'Autorità di controllo (Garante per la protezione dei dati
            personali,{' '}
            <a
              href="https://www.garanteprivacy.it"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-eco-700 hover:underline"
            >
              garanteprivacy.it
            </a>
            ).
          </P>
          <P>
            Le informazioni complete sul trattamento dei dati personali —
            comprese le finalità, le basi giuridiche, i tempi di conservazione e
            le tutele previste, in particolare per i minori — sono raccolte
            nell'
            <Link
              to={PRIVACY_POLICY}
              className="font-semibold text-eco-700 hover:underline"
            >
              Informativa sulla privacy
            </Link>
            .
          </P>
        </Sezione>

        {/* 8 */}
        <Sezione id="modifiche" titolo="8. Modifiche alla presente Cookie Policy">
          <P>
            renova si riserva di aggiornare la presente Cookie Policy per
            adeguarla a eventuali modifiche degli strumenti utilizzati o del
            quadro normativo. Le versioni aggiornate saranno pubblicate su
            questa pagina con indicazione della data di ultimo aggiornamento.
          </P>
        </Sezione>

        <p className="pt-6 text-[13px] lg:text-[15px] text-ink-muted">
          Ultimo aggiornamento: {ULTIMO_AGGIORNAMENTO}.
        </p>
      </main>

      {/* Footer del sito: resta visibile anche da qui (raggiungibilità delle
          informative e della mappa del sito da qualsiasi pagina). */}
      <SitoFooter />
    </div>
  )
}

/* ── Elementi tipografici del documento (gli stessi di /metodologia) ── */

function Sezione({
  id,
  titolo,
  children,
}: {
  id: string
  titolo: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20 border-b border-line py-6 last:border-0">
      <h2 className="mb-3 text-[22px] lg:text-[24px] font-extrabold tracking-[-0.02em] text-ink">
        {titolo}
      </h2>
      {children}
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[15px] lg:text-[17px] leading-relaxed text-ink-soft last:mb-0">
      {children}
    </p>
  )
}

function Punto({ children }: { children: React.ReactNode }) {
  return (
    <li className="relative pl-4 before:absolute before:left-0 before:top-[0.62em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-eco">
      {children}
    </li>
  )
}

function MailPrivacy() {
  return (
    <a
      href={`mailto:${EMAIL_PRIVACY}`}
      className="font-semibold text-eco-700 hover:underline"
    >
      {EMAIL_PRIVACY}
    </a>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink">
      {children}
    </th>
  )
}

function Td({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <td className={`px-3 py-2.5 align-top ${className}`}>{children}</td>
}
