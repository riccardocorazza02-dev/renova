import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { EMAIL_PRIVACY, COOKIE_POLICY, SitoFooter } from '../components/sito'

/* ──────────────────────────────────────────────────────────────────────────
   Pagina PUBBLICA /privacy-policy — informativa sul trattamento dei dati
   personali resa ai sensi degli artt. 13-14 del Regolamento (UE) 2016/679
   («GDPR») e del D.lgs. 196/2003 (Codice Privacy).

   Come /cookie-policy e /metodologia vive fuori da `SitoLayout`, perché è
   raggiungibile da TUTTI E DUE i mondi: dal footer del sito pubblico e da
   dentro l'app (schermate di accesso e Account), che è dove i dati vengono
   davvero trattati. Per lo stesso motivo il link di ritorno è «indietro» e
   non «torna al sito».

   ⚠️⚠️ ATTENZIONE — LA PAGINA NON È PUBBLICABILE COSÌ COM'È. ⚠️⚠️
   Restano due segnaposti `[DA COMPLETARE]`, da compilare A MANO prima del
   go-live (vedi i TODO qui sotto):
     1. §1 — identità del titolare del trattamento. Oggi renova è un progetto
        personale, non un'entità giuridica: un marchio NON può essere titolare
        del trattamento. Va indicata una persona fisica (nome, cognome,
        domicilio) o l'entità una volta costituita (denominazione, sede,
        C.F./P.IVA). Finché il segnaposto resta tale, l'informativa non è
        conforme all'art. 13 GDPR.
     2. Data di ultimo aggiornamento (costante `ULTIMO_AGGIORNAMENTO`).
   Adempimenti collegati, fuori dal codice: casella privacy@renovasport.it
   attiva e monitorata, DPA di Supabase accettato, DPIA predisposta (si
   trattano dati di minori).
   ────────────────────────────────────────────────────────────────────────── */

// TODO(go-live): sostituire con la data effettiva di pubblicazione.
export const ULTIMO_AGGIORNAMENTO = '[DA COMPLETARE alla pubblicazione]'

const INDICE: Array<[string, string]> = [
  ['titolare', '1. Chi tratta i tuoi dati (titolare del trattamento)'],
  ['dati', '2. Quali dati raccogliamo'],
  ['finalita', '3. Perché trattiamo i tuoi dati e su quale base giuridica'],
  ['destinatari', '4. A chi comunichiamo i tuoi dati'],
  ['trasferimenti', '5. Dove trattiamo i tuoi dati (trasferimenti)'],
  ['conservazione', '6. Per quanto tempo conserviamo i tuoi dati'],
  ['diritti', '7. I tuoi diritti'],
  ['minori', '8. Dati dei minori'],
  ['modifiche', '9. Modifiche a questa informativa'],
]

export function PrivacyPolicy() {
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
            Informativa sulla privacy
          </h1>
          <p className="mt-3 text-[15px] lg:text-[17px] leading-relaxed text-ink-soft">
            renova è un servizio che consente ai tesserati delle società
            sportive dilettantistiche di scambiarsi gratuitamente materiale
            sportivo usato. Perché il servizio funzioni trattiamo alcuni dati
            personali tuoi e, se sei un genitore, di tuo figlio minore. Questa
            informativa spiega{' '}
            <strong className="font-semibold text-ink">
              quali dati raccogliamo, perché, per quanto tempo li conserviamo e
              quali diritti hai
            </strong>
            , ai sensi del Regolamento (UE) 2016/679 («GDPR») e del D.lgs.
            196/2003 (Codice Privacy).
          </p>

          <div className="mt-4 rounded-lg border border-eco/40 bg-eco-50 px-4 py-3 text-[14px] lg:text-[16px] leading-relaxed text-ink-soft">
            L'abbiamo scritta nel modo più semplice possibile. Se qualcosa non è
            chiaro, puoi scriverci ai contatti indicati sotto:{' '}
            <MailPrivacy />
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
          id="titolare"
          titolo="1. Chi tratta i tuoi dati (titolare del trattamento)"
        >
          <P>Il titolare del trattamento è:</P>
          {/* TODO(go-live): sostituire il segnaposto con i dati identificativi
              del titolare (persona fisica o entità costituita). Senza questo
              dato l'informativa NON è conforme all'art. 13, par. 1, lett. a
              GDPR e la pagina non va messa online. */}
          <blockquote className="my-4 rounded-lg border-l-[3px] border-eco bg-surface px-4 py-3 text-[15px] lg:text-[17px] leading-relaxed text-ink-soft">
            <strong className="font-semibold text-ink">
              [DA COMPLETARE al go-live: forma giuridica e dati identificativi
              del titolare — persona fisica con nome, cognome e domicilio,
              oppure denominazione dell'entità con sede e codice fiscale/P.IVA
              una volta costituita]
            </strong>
            <span className="mt-3 block">
              Servizio: <strong className="font-semibold text-ink">renova</strong>
              <br />
              Contatto per la privacy: <MailPrivacy />
            </span>
          </blockquote>
          <P>
            Per qualunque richiesta relativa ai tuoi dati o per esercitare i
            tuoi diritti puoi scrivere all'indirizzo email indicato sopra.
          </P>
        </Sezione>

        {/* 2 */}
        <Sezione id="dati" titolo="2. Quali dati raccogliamo">
          <P>A seconda di come usi il servizio, trattiamo:</P>
          <ul className="mb-3 space-y-2 text-[15px] lg:text-[17px] leading-relaxed text-ink-soft">
            <Punto>
              <strong className="font-semibold text-ink">
                Dati di registrazione e account:
              </strong>{' '}
              indirizzo email, eventuale nome, società sportiva di appartenenza
              (tramite il codice di attivazione fornito dal club). Se l'account
              riguarda un atleta minorenne, raccogliamo anche i dati necessari a
              collegarlo al genitore (vedi{' '}
              <a href="#minori" className="font-semibold text-eco-700 hover:underline">
                sezione 8
              </a>
              ).
            </Punto>
            <Punto>
              <strong className="font-semibold text-ink">
                Contenuti che pubblichi:
              </strong>{' '}
              fotografie e descrizioni degli articoli che metti a disposizione
              (tipologia, taglia, condizione, composizione del tessuto).
            </Punto>
            <Punto>
              <strong className="font-semibold text-ink">Messaggi:</strong> i
              contenuti scambiati con altri utenti tramite la messaggistica
              interna, necessari per accordare la consegna del materiale.
            </Punto>
            <Punto>
              <strong className="font-semibold text-ink">
                Dato di area geografica:
              </strong>{' '}
              la zona di appartenenza, usata per far circolare il materiale
              «neutro» tra praticanti della stessa disciplina nella stessa area.
            </Punto>
            <Punto>
              <strong className="font-semibold text-ink">
                Dati tecnici e di utilizzo:
              </strong>{' '}
              dati di accesso e log tecnici generati automaticamente durante
              l'uso della piattaforma (per i cookie e strumenti simili
              rimandiamo alla{' '}
              <Link
                to={COOKIE_POLICY}
                className="font-semibold text-eco-700 hover:underline"
              >
                Cookie Policy
              </Link>
              ).
            </Punto>
            <Punto>
              <strong className="font-semibold text-ink">
                Dati relativi agli scambi:
              </strong>{' '}
              registro degli articoli tornati in circolo, del valore economico
              risparmiato e dell'impatto ambientale stimato.
            </Punto>
          </ul>
          <P>
            Non raccogliamo dati che rivelano origine razziale o etnica,
            opinioni politiche, convinzioni religiose, dati sulla salute, sulla
            vita sessuale o altri dati particolari ai sensi dell'art. 9 GDPR.{' '}
            <strong className="font-semibold text-ink">
              Ti chiediamo di non pubblicare fotografie che ritraggano persone
              identificabili
            </strong>{' '}
            — in particolare minori — e di limitare le immagini al solo
            articolo.
          </P>
        </Sezione>

        {/* 3 */}
        <Sezione
          id="finalita"
          titolo="3. Perché trattiamo i tuoi dati e su quale base giuridica"
        >
          <P>Trattiamo i tuoi dati per le seguenti finalità:</P>

          <div className="my-4 overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[560px] border-collapse text-left text-[13px] lg:text-[15px]">
              <thead>
                <tr className="border-b-[1.5px] border-ink bg-surface">
                  <Th>Finalità</Th>
                  <Th>Base giuridica</Th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-line last:border-0">
                  <Td className="text-ink-soft">
                    Creare e gestire il tuo account, permetterti di pubblicare e
                    cercare materiale, farti scambiare beni con altri utenti
                  </Td>
                  <Td className="text-ink-soft">
                    Esecuzione del contratto (art. 6.1.b GDPR) — sono le
                    funzioni del servizio che ci chiedi
                  </Td>
                </tr>
                <tr className="border-b border-line last:border-0">
                  <Td className="text-ink-soft">
                    Farti comunicare con gli altri utenti tramite la
                    messaggistica interna
                  </Td>
                  <Td className="text-ink-soft">
                    Esecuzione del contratto (art. 6.1.b GDPR)
                  </Td>
                </tr>
                <tr className="border-b border-line last:border-0">
                  <Td className="text-ink-soft">
                    Mostrarti la stima dell'impatto ambientale ed economico dei
                    tuoi scambi
                  </Td>
                  <Td className="text-ink-soft">
                    Esecuzione del contratto (art. 6.1.b GDPR)
                  </Td>
                </tr>
                <tr className="border-b border-line last:border-0">
                  <Td className="text-ink-soft">
                    Garantire la sicurezza della piattaforma e prevenire abusi o
                    usi impropri
                  </Td>
                  <Td className="text-ink-soft">
                    Legittimo interesse (art. 6.1.f GDPR)
                  </Td>
                </tr>
                <tr className="border-b border-line last:border-0">
                  <Td className="text-ink-soft">
                    Produrre statistiche aggregate e anonime sull'impatto
                    complessivo generato dalla comunità
                  </Td>
                  <Td className="text-ink-soft">
                    Legittimo interesse (art. 6.1.f GDPR)
                  </Td>
                </tr>
              </tbody>
            </table>
          </div>

          <P>
            Al momento{' '}
            <strong className="font-semibold text-ink">
              non trattiamo i tuoi dati per finalità di marketing
            </strong>{' '}
            e non ti inviamo comunicazioni promozionali. Se in futuro
            introdurremo attività di questo tipo, te lo chiederemo con un
            consenso specifico e separato, e aggiorneremo questa informativa.
          </P>
          <P>
            Il conferimento dei dati necessari alla creazione dell'account e
            all'uso del servizio è{' '}
            <strong className="font-semibold text-ink">facoltativo</strong>, ma
            senza di essi non è possibile utilizzare renova.
          </P>
        </Sezione>

        {/* 4 */}
        <Sezione id="destinatari" titolo="4. A chi comunichiamo i tuoi dati">
          <P>I tuoi dati possono essere trattati da:</P>
          <ul className="mb-3 space-y-2 text-[15px] lg:text-[17px] leading-relaxed text-ink-soft">
            <Punto>
              <strong className="font-semibold text-ink">
                Fornitori tecnici che agiscono per nostro conto (responsabili
                del trattamento, art. 28 GDPR).
              </strong>{' '}
              In particolare utilizziamo{' '}
              <strong className="font-semibold text-ink">Supabase</strong> come
              fornitore del database su cui la piattaforma si appoggia. Il
              rapporto è regolato da un apposito accordo sul trattamento dei
              dati (DPA).
            </Punto>
            <Punto>
              <strong className="font-semibold text-ink">
                Altri utenti della piattaforma.
              </strong>{' '}
              Ciò che pubblichi è, per sua natura, visibile ad altri utenti: il
              materiale personalizzato (con il marchio del club) è visibile ai
              soli tesserati della tua società; il materiale neutro è visibile
              ai praticanti della stessa disciplina nella tua area geografica. I
              messaggi che invii sono visibili al destinatario con cui stai
              organizzando lo scambio.
            </Punto>
          </ul>
          <P>
            <strong className="font-semibold text-ink">
              Non vendiamo i tuoi dati e non li cediamo a terzi per finalità
              commerciali.
            </strong>
          </P>
        </Sezione>

        {/* 5 */}
        <Sezione
          id="trasferimenti"
          titolo="5. Dove trattiamo i tuoi dati (trasferimenti)"
        >
          <P>
            I tuoi dati sono ospitati su server situati{' '}
            <strong className="font-semibold text-ink">
              all'interno dell'Unione Europea
            </strong>
            . Non effettuiamo trasferimenti di dati verso Paesi al di fuori
            dello Spazio Economico Europeo. Qualora ciò dovesse cambiare,
            adotteremo le garanzie previste dagli artt. 44 e seguenti del GDPR e
            ne daremo conto in questa informativa.
          </P>
        </Sezione>

        {/* 6 */}
        <Sezione
          id="conservazione"
          titolo="6. Per quanto tempo conserviamo i tuoi dati"
        >
          <P>
            Conserviamo i dati solo per il tempo necessario alle finalità per
            cui sono stati raccolti:
          </P>
          <ul className="mb-3 space-y-2 text-[15px] lg:text-[17px] leading-relaxed text-ink-soft">
            <Punto>
              <strong className="font-semibold text-ink">Account attivo:</strong>{' '}
              i dati sono conservati finché il tuo account è in essere.
            </Punto>
            <Punto>
              <strong className="font-semibold text-ink">
                Account cancellato o inattivo:
              </strong>{' '}
              in caso di cancellazione dell'account, o dopo un periodo di
              inattività prolungata (circa 24 mesi), i dati personali associati
              vengono cancellati entro un termine breve (circa 30 giorni).
            </Punto>
            <Punto>
              <strong className="font-semibold text-ink">
                Messaggi della messaggistica interna:
              </strong>{' '}
              conservati per la durata dello scambio e per un periodo limitato
              successivo (circa 12 mesi), utile a gestire eventuali
              contestazioni, poi cancellati.
            </Punto>
            <Punto>
              <strong className="font-semibold text-ink">
                Registro individuale degli scambi:
              </strong>{' '}
              i dati che collegano uno scambio a un utente identificabile sono
              conservati per un periodo limitato (allineato ai messaggi) e
              successivamente{' '}
              <strong className="font-semibold text-ink">resi anonimi</strong>.
            </Punto>
            <Punto>
              <strong className="font-semibold text-ink">
                Dati statistici aggregati e anonimi
              </strong>{' '}
              (impatto ambientale ed economico complessivo, numero di articoli
              tornati in circolo): una volta resi anonimi non sono più riferibili
              ad alcuna persona e possono essere conservati{' '}
              <strong className="font-semibold text-ink">
                a tempo indeterminato
              </strong>
              , poiché non costituiscono dati personali.
            </Punto>
            <Punto>
              <strong className="font-semibold text-ink">Log tecnici:</strong>{' '}
              conservati per un periodo compreso tra 6 e 12 mesi.
            </Punto>
          </ul>
        </Sezione>

        {/* 7 */}
        <Sezione id="diritti" titolo="7. I tuoi diritti">
          <P>
            In qualunque momento puoi esercitare i diritti previsti dagli artt.
            15-22 del GDPR:
          </P>
          <ul className="mb-3 space-y-2 text-[15px] lg:text-[17px] leading-relaxed text-ink-soft">
            <Punto>
              <strong className="font-semibold text-ink">accesso</strong> ai
              tuoi dati e alle informazioni sul loro trattamento;
            </Punto>
            <Punto>
              <strong className="font-semibold text-ink">rettifica</strong> dei
              dati inesatti o incompleti;
            </Punto>
            <Punto>
              <strong className="font-semibold text-ink">cancellazione</strong>{' '}
              dei dati («diritto all'oblio»), nei casi previsti dalla legge;
            </Punto>
            <Punto>
              <strong className="font-semibold text-ink">limitazione</strong>{' '}
              del trattamento;
            </Punto>
            <Punto>
              <strong className="font-semibold text-ink">portabilità</strong>{' '}
              dei dati che ci hai fornito, in un formato leggibile;
            </Punto>
            <Punto>
              <strong className="font-semibold text-ink">opposizione</strong> al
              trattamento fondato sul legittimo interesse.
            </Punto>
          </ul>
          <P>
            Per esercitare questi diritti scrivi a <MailPrivacy />. Ti
            risponderemo senza ingiustificato ritardo e comunque entro i termini
            di legge.
          </P>
          <P>
            Hai inoltre il diritto di proporre{' '}
            <strong className="font-semibold text-ink">
              reclamo al Garante per la protezione dei dati personali
            </strong>{' '}
            (
            <a
              href="https://www.garanteprivacy.it"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-eco-700 hover:underline"
            >
              garanteprivacy.it
            </a>
            ) se ritieni che il trattamento dei tuoi dati violi la normativa.
          </P>
        </Sezione>

        {/* 8 */}
        <Sezione id="minori" titolo="8. Dati dei minori">
          <P>
            Una parte rilevante degli sportivi tesserati è minorenne. Per questo
            trattiamo i dati dei minori con particolare attenzione e secondo le
            regole seguenti.
          </P>
          <P>
            <strong className="font-semibold text-ink">
              L'account di un atleta minorenne è intestato a un genitore
            </strong>{' '}
            (o a chi esercita la responsabilità genitoriale), che utilizza il
            servizio nell'interesse del figlio. In fase di registrazione:
          </P>
          <ul className="mb-3 space-y-2 text-[15px] lg:text-[17px] leading-relaxed text-ink-soft">
            <Punto>
              viene richiesto l'indirizzo email del genitore, a cui l'account
              del minore viene collegato;
            </Punto>
            <Punto>
              il genitore{' '}
              <strong className="font-semibold text-ink">
                accetta i Termini di Servizio
              </strong>{' '}
              in nome e per conto del minore,{' '}
              <strong className="font-semibold text-ink">prende visione</strong>{' '}
              della presente informativa e presta gli eventuali consensi
              (attualmente non è richiesto alcun consenso, poiché non svolgiamo
              attività di marketing);
            </Punto>
            <Punto>
              per verificare che a registrarsi sia effettivamente un adulto,
              inviamo all'email del genitore un{' '}
              <strong className="font-semibold text-ink">
                messaggio di conferma con un link da cliccare
              </strong>{' '}
              (doppia conferma): l'account del minore si attiva solo dopo questa
              conferma.
            </Punto>
          </ul>
          <P>
            Ai sensi dell'art. 2-quinquies del Codice Privacy, in Italia un
            minore può prestare autonomamente il consenso al trattamento nei
            servizi online a partire dai{' '}
            <strong className="font-semibold text-ink">14 anni</strong>; al di
            sotto di tale età il consenso è espresso da chi esercita la
            responsabilità genitoriale. Per semplicità e maggiore tutela, renova
            adotta comunque il modello dell'account intestato al genitore per
            tutti gli atleti minorenni.
          </P>
          <P>
            Per i minori{' '}
            <strong className="font-semibold text-ink">
              non svolgiamo alcuna profilazione né attività di marketing diretto
            </strong>
            .
          </P>
          <P>
            I diritti descritti alla{' '}
            <a href="#diritti" className="font-semibold text-eco-700 hover:underline">
              sezione 7
            </a>{' '}
            relativi ai dati del minore sono esercitati dal genitore.{' '}
            <strong className="font-semibold text-ink">
              Al compimento della maggiore età
            </strong>
            , l'account potrà essere intestato direttamente all'ex-minore,
            previa nuova presa visione e accettazione a suo nome.
          </P>
        </Sezione>

        {/* 9 */}
        <Sezione id="modifiche" titolo="9. Modifiche a questa informativa">
          <P>
            Possiamo aggiornare questa informativa per adeguarla a modifiche del
            servizio o della normativa. La versione aggiornata sarà sempre
            pubblicata su questa pagina, con l'indicazione della data di ultimo
            aggiornamento. Ti invitiamo a consultarla periodicamente.
          </P>
        </Sezione>

        <p className="pt-6 text-[13px] lg:text-[15px] italic text-ink-muted">
          Documento redatto ai sensi degli artt. 13 e 14 del Regolamento (UE)
          2016/679.
        </p>
        <p className="pt-2 text-[13px] lg:text-[15px] text-ink-muted">
          Ultimo aggiornamento: {ULTIMO_AGGIORNAMENTO}.
        </p>
      </main>

      {/* Footer del sito: resta visibile anche da qui (raggiungibilità delle
          informative e della mappa del sito da qualsiasi pagina). */}
      <SitoFooter />
    </div>
  )
}

/* ── Elementi tipografici del documento (gli stessi di /cookie-policy) ── */

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
