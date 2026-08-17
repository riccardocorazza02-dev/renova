import { Fonte, SitoLayout, TestataPagina } from '../components/sito'

/* ──────────────────────────────────────────────────────────────────────────
   /progetto — Cosa è Renova · Mission & Vision · Renova e l'Agenda 2030.
   Lente: tutti gli stakeholder, con un occhio di riguardo a chi legge da
   istituzione (LND) o da ente no-profit (RigeneraSport): visione, impatto
   sistemico, onestà del metodo.

   Tutti i numeri di questa pagina hanno una fonte dichiarata sotto la
   grafica: nessun dato inventato, nessuna traction gonfiata.
   ────────────────────────────────────────────────────────────────────────── */

/** Linee guida ONU sull'uso del logo SDG e della ruota dei colori. */
const SDG_GUIDELINES_URL =
  'https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/01/SDG_Guidelines_AUG_2019_Final.pdf'

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

/** Mappatura Agenda 2030 (§2c): 5 obiettivi presidiati, non uno di più,
 *  presentati in ordine numerico.
 *  `colore` è il colore ufficiale dell'obiettivo, usato solo come accento;
 *  `icona` è l'icona ufficiale ONU in `public/sdg/` — va usata così com'è,
 *  senza ritagli, deformazioni o ricolorazioni (SDG Guidelines, ago. 2019:
 *  link in fondo alla sezione). */
const SDG: Array<{
  n: string
  colore: string
  icona: string
  titolo: string
  testo: string
  funzione: string
}> = [
  {
    n: '3',
    colore: '#4C9F38',
    icona: 'sdg-03.png',
    titolo: 'Salute e benessere',
    testo:
      'Abbassare il costo del corredo abbassa una delle barriere che tengono i ragazzi lontani dallo sport. Più materiale accessibile significa più possibilità di praticare.',
    funzione: 'scambio gratuito che riduce la spesa delle famiglie.',
  },
  {
    n: '10',
    colore: '#DD1367',
    icona: 'sdg-10.png',
    titolo: 'Ridurre le disuguaglianze',
    testo:
      'Il beneficio economico va dove serve di più: alle famiglie con meno risorse. Il feed pubblico territoriale allarga le occasioni di scambio anche ai club più piccoli.',
    funzione: 'gratuità + circolazione territoriale del materiale neutro.',
  },
  {
    n: '12',
    colore: '#BF8B2E',
    icona: 'sdg-12.png',
    titolo: 'Consumo e produzione responsabili',
    testo:
      'Il cuore di renova. Prolungare la vita utile del materiale è riuso puro (target 12.5): ogni scambio è un capo che non diventa rifiuto e un acquisto nuovo che non serve più.',
    funzione: 'marketplace di scambio gratuito.',
  },
  {
    n: '13',
    colore: '#3F7E44',
    icona: 'sdg-13.png',
    titolo: 'Lotta al cambiamento climatico',
    testo:
      'Ogni scambio evita la CO₂ legata alla produzione di un capo nuovo. Non lo diciamo e basta: lo misuriamo, capo per capo, con metodo tracciabile.',
    funzione: 'stima d’impatto per articolo + dashboard.',
  },
  {
    n: '17',
    colore: '#19486A',
    icona: 'sdg-17.png',
    titolo: 'Partnership per gli obiettivi',
    testo:
      'Nessun impatto di scala si costruisce da soli. renova è pensata come nodo di una rete di club, istituzioni ed enti che condividono l’obiettivo.',
    funzione: 'apertura dell’ecosistema a partner di ogni tipo.',
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
          occhiello="Perché renova"
          titolo={<>Un costo che nessuno copre, un impatto già pagato.</>}
        >
          <p>
            Lo sport dilettantistico italiano non è un fenomeno di nicchia: 107.804 enti, 12,3
            milioni di tesserati, due bambini su tre tra i 6 e i 14 anni. È una delle reti sociali
            più estese del Paese — e ogni stagione vi circola una quantità enorme di materiale
            tecnico. Per le famiglie quel materiale pesa circa il 25% della spesa annua nei
            principali sport di squadra, ed è l’unica voce priva di qualsiasi sostegno pubblico: i
            voucher coprono l’iscrizione, non il corredo.
          </p>
          <p>
            Ogni capo sportivo porta con sé un impatto ambientale — CO₂ e acqua — già interamente
            prodotto nel momento in cui è stato fabbricato. Buttarlo quando è ancora buono spreca
            due volte: i soldi delle famiglie e le risorse spese per produrlo. Su una scala come
            questa, riportare in circolo anche solo una parte di quel materiale significa un
            risparmio concreto per le famiglie e un impatto ambientale evitato che non è teorico: è
            la somma di gesti che già accadono ogni giorno — solo in modo disordinato, ristretto
            alle conoscenze di ciascuno e invisibile. renova li rende un sistema.
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
              renova rimette in circolo quel materiale.
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
              Ridurre l’impatto ambientale dello sport dilettantistico attraverso l’economia
              circolare e, nello stesso gesto, alleggerire il costo di chi lo pratica —
              intervenendo proprio dove nessun sostegno pubblico arriva: la spesa per il materiale.
              Ogni capo che torna in campo invece di restare in un armadio è una risorsa non
              sprecata e una barriera in meno all’accesso allo sport. Facciamo funzionare come
              sistema ciò che oggi accade solo per prossimità, nel raggio delle conoscenze di
              ciascuno.
            </p>
          </div>

          {/* Visione — dichiarata come direzione, non come funzione attiva */}
          <div className="rounded-2xl border-[1.5px] border-eco bg-ink p-6 text-paper lg:p-8">
            <span className="inline-flex items-center gap-2 rounded-md bg-eco px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
              Direzione futura
            </span>
            <h2 className="mt-3 text-[24px] leading-tight text-paper sm:text-[28px]">
              La nostra visione
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-[#c9c8c2] lg:text-[17px]">
              renova nasce come scambio, ma guarda a qualcosa di più ambizioso: fare della
              sostenibilità un vantaggio concreto per ogni attore che entra nella rete — non un
              dovere da assolvere, ma una convenienza.
            </p>
            <p className="mt-4 text-[16px] leading-relaxed text-[#c9c8c2] lg:text-[17px]">
              Immaginiamo una rete in cui chi rimette in circolo il proprio materiale riceve
              qualcosa in cambio: dagli sconti dei partner fino a borse che alleggeriscono il
              costo dello sport. Una rete in cui il club che si impegna sul serio trova in
              quell’impegno una leva per attrarre sponsor e sostegno; in cui l’azienda che
              collabora dà alle proprie iniziative di sostenibilità una sostanza misurabile, fatta
              di dati e non di dichiarazioni; in cui gli enti del terzo settore ampliano il
              proprio raggio d’azione digitalizzando la rete che già animano.
            </p>
            <p className="mt-4 text-[16px] leading-relaxed text-[#c9c8c2] lg:text-[17px]">
              È un obiettivo che si raggiunge in un solo modo: costruendo, un nodo alla volta,
              una rete in cui la sostenibilità conviene a chi la pratica.
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
        <span className="eyebrow">renova e l’Agenda 2030</span>

        {/* Il logo sta a fianco del blocco titolo + paragrafi, centrato
            verticalmente rispetto a quel blocco (da qui `items-center`). */}
        <div className="mt-2 lg:flex lg:items-center lg:gap-12">
          <div className="max-w-3xl">
            <h2 className="text-[28px] leading-tight sm:text-[34px]">
              Ogni funzione, un obiettivo di sviluppo sostenibile.
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">
              L’Agenda 2030 è il programma d’azione sottoscritto nel 2015 da tutti i 193 Paesi
              membri delle Nazioni Unite. Fissa 17 Obiettivi di Sviluppo Sostenibile (Sustainable
              Development Goals, SDGs) e 169 traguardi da raggiungere entro il 2030: un linguaggio
              comune e riconosciuto a livello internazionale per orientare e misurare il progresso
              verso uno sviluppo che tenga insieme ambiente, economia e società.
            </p>
            <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">
              renova non rincorre ogni SDG possibile per riempire una vetrina. Ne presidia cinque,
              in modo diretto e difendibile — la stessa disciplina che applichiamo alla misura
              dell’impatto.
            </p>
          </div>

          {/* Logo ufficiale degli SDGs — usato senza modifiche, accanto al testo */}
          <img
            src="/sdg/sdg-logo.png"
            alt="Sustainable Development Goals — Obiettivi di Sviluppo Sostenibile delle Nazioni Unite"
            width={634}
            height={330}
            className="mt-8 h-auto w-[180px] shrink-0 lg:mt-0 lg:w-[210px]"
          />
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SDG.map((s) => (
            <article
              key={s.n}
              className="flex flex-col rounded-2xl border border-edge bg-paper p-5 lg:p-6"
            >
              <div className="flex items-center gap-4">
                {/* Icona ufficiale dell'obiettivo: quadrata, integra, non
                    ritagliata — grande abbastanza da lasciar leggere numero e
                    titolo stampati al suo interno. */}
                <img
                  src={`/sdg/${s.icona}`}
                  alt={`Obiettivo di Sviluppo Sostenibile ${s.n} — ${s.titolo}`}
                  width={341}
                  height={341}
                  className="h-24 w-24 shrink-0 lg:h-28 lg:w-28"
                />
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.1em]"
                    style={{ color: s.colore }}
                  >
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

        <Fonte>
          Il logo degli Obiettivi di Sviluppo Sostenibile e le icone dei singoli obiettivi sono
          proprietà delle Nazioni Unite e sono riprodotti qui, senza modifiche, a scopo
          informativo: il loro utilizzo non costituisce alcuna forma di approvazione, sponsorizzazione
          o affiliazione di renova da parte dell’ONU. Le regole complete sono nelle{' '}
          <a
            href={SDG_GUIDELINES_URL}
            target="_blank"
            rel="noopener"
            className="font-semibold text-ink underline decoration-eco decoration-2 underline-offset-2 hover:text-eco-700"
          >
            Guidelines for the Use of the SDG Logo and the Colour Wheel
          </a>{' '}
          (Nazioni Unite, agosto 2019).
        </Fonte>
      </div>
    </section>
  )
}
