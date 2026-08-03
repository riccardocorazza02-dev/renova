import { Fonte, SitoLayout, TestataPagina } from '../components/sito'

/* ──────────────────────────────────────────────────────────────────────────
   /progetto — Cosa è Renova · Mission & Vision · Renova e l'Agenda 2030.
   Lente: tutti gli stakeholder, con un occhio di riguardo a chi legge da
   istituzione (LND) o da ente no-profit (RigeneraSport): visione, impatto
   sistemico, onestà del metodo.

   Tutti i numeri di questa pagina hanno una fonte dichiarata sotto la
   grafica: nessun dato inventato, nessuna traction gonfiata.
   ────────────────────────────────────────────────────────────────────────── */

/** I numeri di sistema, resi come grafica-dato (§2a). */
const NUMERI_SISTEMA: Array<{ valore: string; unita: string; testo: string }> = [
  {
    valore: '107.804',
    unita: 'enti sportivi',
    testo: 'iscritti al Registro nazionale con almeno un tesseramento attivo (2024).',
  },
  {
    valore: '12,3',
    unita: 'milioni di tesserati',
    testo: 'in Italia; nella fascia 6-14 anni la copertura arriva al 63,2% dei residenti.',
  },
  {
    valore: '~25%',
    unita: 'della spesa annua',
    testo:
      'è il peso del materiale tecnico nei tre principali sport di squadra: l’unica voce senza alcun sostegno pubblico.',
  },
]

/** Mappatura Agenda 2030 (§2c): 5 obiettivi presidiati, non uno di più.
 *  `colore` è il colore ufficiale dell'obiettivo, usato solo come accento. */
const SDG: Array<{
  n: string
  colore: string
  titolo: string
  testo: string
  funzione: string
}> = [
  {
    n: '12',
    colore: '#BF8B2E',
    titolo: 'Consumo e produzione responsabili',
    testo:
      'Il cuore di Renova. Prolungare la vita utile del materiale è riuso puro (target 12.5): ogni scambio è un capo che non diventa rifiuto e un acquisto nuovo che non serve più.',
    funzione: 'Marketplace di scambio gratuito.',
  },
  {
    n: '13',
    colore: '#3F7E44',
    titolo: 'Lotta al cambiamento climatico',
    testo:
      'Ogni scambio evita la CO₂ legata alla produzione di un capo nuovo. Non lo diciamo e basta: lo misuriamo, capo per capo, con metodo tracciabile.',
    funzione: 'Stima d’impatto per articolo + dashboard.',
  },
  {
    n: '3',
    colore: '#4C9F38',
    titolo: 'Salute e benessere',
    testo:
      'Abbassare il costo del corredo abbassa una delle barriere che tengono i ragazzi lontani dallo sport. Più materiale accessibile significa più possibilità di praticare.',
    funzione: 'Scambio gratuito che riduce la spesa delle famiglie.',
  },
  {
    n: '10',
    colore: '#DD1367',
    titolo: 'Ridurre le disuguaglianze',
    testo:
      'Il beneficio economico va dove serve di più: alle famiglie con meno risorse. Il feed pubblico territoriale allarga le occasioni di scambio anche ai club più piccoli.',
    funzione: 'Gratuità + circolazione territoriale del materiale neutro.',
  },
  {
    n: '17',
    colore: '#19486A',
    titolo: 'Partnership per gli obiettivi',
    testo:
      'Nessun impatto di scala si costruisce da soli. Renova è pensata come nodo di una rete di club, istituzioni ed enti che condividono l’obiettivo.',
    funzione: 'Apertura dell’ecosistema a partner di ogni tipo.',
  },
]

export function Progetto() {
  return (
    <SitoLayout>
      <CosaE />
      <MissionVision />
      <Agenda2030 />
    </SitoLayout>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   1 · COSA È RENOVA
   ════════════════════════════════════════════════════════════════════════ */

function CosaE() {
  return (
    <section className="border-b-[1.5px] border-ink">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
        <TestataPagina
          occhiello="Il progetto"
          titolo={<>Un costo che nessuno copre, un impatto già pagato.</>}
        >
          <p>
            Lo sport dilettantistico italiano conta 107.804 enti e 12,3 milioni di tesserati. Per
            le famiglie il materiale tecnico pesa circa il 25% della spesa annua nei principali
            sport di squadra — ed è l’unica voce priva di qualsiasi sostegno pubblico: i voucher
            coprono l’iscrizione, non il corredo.
          </p>
          <p>
            Allo stesso tempo, ogni capo sportivo porta con sé un impatto ambientale — CO₂ e acqua
            — già interamente prodotto nel momento in cui viene fabbricato. Buttarlo quando è
            ancora buono spreca due volte: i soldi delle famiglie e le risorse spese per produrlo.
          </p>
        </TestataPagina>

        {/* Grafica-dato: i numeri di sistema */}
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border-[1.5px] border-ink bg-ink sm:grid-cols-3">
          {NUMERI_SISTEMA.map((n) => (
            <div key={n.valore} className="bg-paper p-6 lg:p-7">
              <p className="text-[38px] font-extrabold leading-none tracking-[-0.04em] text-ink lg:text-[44px]">
                {n.valore}
              </p>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-eco">
                {n.unita}
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">{n.testo}</p>
            </div>
          ))}
        </div>
        <Fonte>
          Fonti: Istituto per il Credito Sportivo e Culturale &amp; Sport e Salute,{' '}
          <i>Rapporto Sport 2025</i> (dati 2024) per enti e tesserati; elaborazione su
          Federconsumatori (2023) per l’incidenza del corredo sulla spesa annua.
        </Fonte>

        {/* La soluzione + i due bacini di circolazione */}
        <div className="mt-16 lg:grid lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-12">
          <div className="max-w-xl">
            <h2 className="text-[26px] leading-tight sm:text-[30px]">
              Renova rimette in circolo quel materiale.
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-ink-soft">
              I tesserati pubblicano ciò che non usano più, chi cerca un articolo lo trova nel
              catalogo, si accordano tramite la chat interna e se lo scambiano di persona,
              gratuitamente. La piattaforma non ospita denaro, non movimenta merce e non chiede
              alla società alcuna attività di gestione.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-0">
            <Bacino
              titolo="Materiale col logo del club"
              testo="Divise, tute e abbigliamento con il marchio della società restano visibili ai soli tesserati di quel club: un capo che porta i colori di una società non ha mercato fuori da lì."
              accento="eco"
            />
            <Bacino
              titolo="Materiale neutro"
              testo="Calzature, protezioni, abbigliamento tecnico senza marchio e borse circolano fra i praticanti dello stesso sport nella stessa area geografica. È ciò che rende il servizio utile anche alla società piccola."
              accento="ink"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function Bacino({
  titolo,
  testo,
  accento,
}: {
  titolo: string
  testo: string
  accento: 'eco' | 'ink'
}) {
  return (
    <div
      className={`rounded-2xl border bg-paper p-5 lg:p-6 ${
        accento === 'eco' ? 'border-eco' : 'border-edge'
      }`}
    >
      <h3
        className={`text-[17px] leading-snug ${accento === 'eco' ? 'text-eco-700' : 'text-ink'}`}
      >
        {titolo}
      </h3>
      <p className="mt-2.5 text-[14px] leading-relaxed text-ink-soft">{testo}</p>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   2 · MISSION & VISION
   ════════════════════════════════════════════════════════════════════════ */

function MissionVision() {
  return (
    <section className="border-b-[1.5px] border-ink bg-eco-50/40">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
        <span className="eyebrow">Mission &amp; Vision</span>

        <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:gap-6">
          {/* Missione — ciò che il servizio fa già */}
          <div className="flex flex-col justify-center rounded-2xl border-[1.5px] border-ink bg-paper p-6 lg:p-8">
            <h2 className="text-[24px] leading-tight sm:text-[28px]">La nostra missione</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-ink-soft lg:text-[17px]">
              Rimettere in circolo il materiale sportivo ancora buono per abbassare la barriera
              economica di accesso allo sport ed evitare un impatto ambientale che è già stato
              prodotto.
            </p>
          </div>

          {/* Visione — dichiarata come direzione, non come funzione attiva */}
          <div className="rounded-2xl border-[1.5px] border-eco bg-ink p-6 text-paper lg:p-8">
            <span className="inline-flex items-center gap-2 rounded-md bg-eco px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
              Direzione futura
            </span>
            <h2 className="mt-3 text-[24px] leading-tight text-paper sm:text-[28px]">
              Il domani di Renova
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-[#c9c8c2] lg:text-[17px]">
              Renova nasce come strumento di scambio, ma guarda oltre: diventare un hub che
              diffonde la cultura della sostenibilità nello sport — attraverso informazione,
              formazione e incentivi concreti che aiutino le persone a cambiare davvero le proprie
              abitudini. È un obiettivo che si raggiunge in un solo modo: costruendo reti fitte di
              collaborazione con enti di ogni tipo.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   3 · RENOVA E L'AGENDA 2030
   ════════════════════════════════════════════════════════════════════════ */

function Agenda2030() {
  return (
    <section className="border-b-[1.5px] border-ink">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <span className="eyebrow">Renova e l’Agenda 2030</span>
          <h2 className="mt-2 text-[28px] leading-tight sm:text-[34px]">
            Ogni funzione, un obiettivo di sviluppo sostenibile.
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">
            Renova non rincorre più SDG possibile per riempire una vetrina. Ne presidia pochi, in
            modo diretto e difendibile — la stessa disciplina che applichiamo alla misura
            dell’impatto.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SDG.map((s) => (
            <article
              key={s.n}
              className="flex flex-col rounded-2xl border border-edge bg-paper p-5 lg:p-6"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-[22px] font-extrabold leading-none tracking-[-0.04em] text-white"
                  style={{ backgroundColor: s.colore }}
                  aria-hidden="true"
                >
                  {s.n}
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-muted">
                    SDG {s.n}
                  </p>
                  <h3 className="text-[15px] leading-snug">{s.titolo}</h3>
                </div>
              </div>
              <p className="mt-4 flex-1 text-[14px] leading-relaxed text-ink-soft">{s.testo}</p>
              <p className="mt-4 border-t border-line pt-3 text-[12px] leading-snug text-ink-muted">
                <span className="font-bold uppercase tracking-[0.06em] text-ink">Funzione</span>{' '}
                — {s.funzione}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
