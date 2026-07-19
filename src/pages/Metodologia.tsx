import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'

/* ──────────────────────────────────────────────────────────────────────────
   Pagina PUBBLICA /metodologia — il documento metodologico integrale di
   Renova reso come pagina web (fonte: «Metodologia impatto ambientale
   Renova», luglio 2026). Come la landing è responsive anche desktop.
   Il PDF originale è scaricabile da /metodologia-renova.pdf (in public/).
   Se il documento Word cambia: aggiornare QUESTA pagina e il PDF insieme.
   ────────────────────────────────────────────────────────────────────────── */

const PDF_URL = '/metodologia-renova.pdf'

/** Tabella 1 — fattori d'impatto per fibra (§3). */
const FIBRE: Array<[string, string, string, string]> = [
  ['Poliestere vergine (PET)', '3,12', '62', 'Carbonfact (valore indicato). Acqua: Fiber Bible p.2, Tab. 2.5 (p. 89).'],
  ['Poliestere riciclato (rPET)', '1,12', '19', 'Carbonfact: valore centrale tra 0,68 e 1,56. Acqua: Qian et al. (2021), 1,9 m³/100 kg = 19 L/kg.'],
  ['Cotone', '4,32', '4.800', 'Carbonfact: valore centrale (conv. 5,7–7,5; bio 1,2–3,2). Acqua: Fiber Bible, Fig. 10 (p. 52).'],
  ['Elastan', '19', 'n.d.', 'Carbonfact: calcolato per proporzione (0,17 kg CO₂ per capo / 8,76 g). Acqua non disponibile → esclusa.'],
  ['Poliammide / Nylon (PA)', '9,04', '424', 'CarbonCloud. Acqua: Fiber Bible, Tab. 2.6 (p. 93), centrale tra PA6 (185) e PA66 (663).'],
  ['Poliuretano (PU)', '4,83', 'n.d.', 'Fiber Bible, Tab. 2.6 (granulato → sottostima). Acqua non disponibile → esclusa.'],
  ['Acrilico', '5,4', '200', 'Fiber Bible, Fig. 9 (p. 51) per la CO₂ e Fig. 10 (p. 53) per l’acqua.'],
  ['Lana', '38,2', '500', 'MDPI Resources (2022): centrale tra vergine e riciclata. Acqua: Fiber Bible, Fig. 10 (p. 52).'],
  ['Viscosa', '3,8', '400', 'Fiber Bible, Fig. 9 (p. 50) e Fig. 10 (p. 52).'],
  ['Polipropilene (PP)', '2,0', '17', 'Fiber Bible, Fig. 9/10. Il PP compare quasi solo in accessori.'],
]

/** Tabella 2 — peso tipico, profilo L0 e opzioni L1 per categoria (§3). */
const CATEGORIE: Array<{
  macro: string
  capo: string
  peso: string
  l0: string
  opzioni: string[]
}> = [
  { macro: 'Abbigliamento', capo: 'Canotta', peso: '0,130', l0: '100% poliestere', opzioni: ['Tecnico / da gioco — 100% PET', 'Cotone — 100% CO', 'Nylon / misto elastico — 67% PA · 25% PET · 8% EA', 'Non lo so → profilo L0'] },
  { macro: 'Abbigliamento', capo: 'T-shirt', peso: '0,150', l0: '100% poliestere', opzioni: ['Tecnico / da gioco — 100% PET', 'Cotone — 100% CO', 'Misto cotone — 65% CO · 35% PET', 'Non lo so → profilo L0'] },
  { macro: 'Abbigliamento', capo: 'Polo', peso: '0,220', l0: '100% poliestere', opzioni: ['Tecnico / da gioco — 100% PET', 'Cotone — 100% CO', 'Misto cotone — 60% CO · 40% PET', 'Non lo so → profilo L0'] },
  { macro: 'Abbigliamento', capo: 'Felpa', peso: '0,480', l0: '100% poliestere', opzioni: ['Tecnico / pile — 100% PET', 'Prevalente cotone — 70% CO · 30% PET', 'Misto cotone — 50% CO · 50% PET', 'Non lo so → profilo L0'] },
  { macro: 'Abbigliamento', capo: 'Pantaloni', peso: '0,400', l0: '100% poliestere', opzioni: ['Tuta / sportivo — 100% PET', 'Cotone / felpato — 65% CO · 35% PET', 'Nylon / poliammide — 92% PA · 8% EA', 'Non lo so → profilo L0'] },
  { macro: 'Abbigliamento', capo: 'Pantaloncini', peso: '0,130', l0: '100% poliestere', opzioni: ['Tecnico / da gioco — 100% PET', 'Cotone / felpato — 65% CO · 35% PET', 'Nylon / misto elastico — 67% PA · 25% PET · 8% EA', 'Non lo so → profilo L0'] },
  { macro: 'Abbigliamento', capo: 'Giacca', peso: '0,300', l0: '100% poliestere', opzioni: ['Tecnico / pile — 100% PET', 'Tecnico elasticizzato — 88% PET · 12% EA', 'Nylon / poliammide — 100% PA', 'Non lo so → profilo L0'] },
  { macro: 'Abbigliamento', capo: 'Gilet', peso: '0,250', l0: '100% poliestere', opzioni: ['Sintetico / imbottito — 100% PET', 'Tecnico elasticizzato — 81% PET · 19% EA', 'Non lo so → profilo L0'] },
  { macro: 'Abbigliamento', capo: 'K-way', peso: '0,250', l0: '100% poliestere', opzioni: ['Poliestere — 100% PET', 'Nylon / poliammide — 100% PA', 'Non lo so → profilo L0'] },
  { macro: 'Abbigliamento', capo: 'Calzini', peso: '0,100', l0: '80% poliestere · 20% elastan', opzioni: ['Sportivi tecnici (poliestere) — 100% PET', 'Sportivi tecnici (nylon) — 90% PA · 10% EA', 'Misto tecnico — 55% PET · 30% PA · 15% EA', 'Traspiranti / polipropilene — 100% PP', 'Non lo so → profilo L0'] },
  { macro: 'Abbigliamento', capo: 'Scarpe', peso: '— (valore fisso)', l0: '13,6 kg CO₂e/paio · ≥1.500 L/paio', opzioni: ['Non tessile: valore fisso di categoria, nessun tap (vedi nota).'] },
  { macro: 'Accessori', capo: 'Accessorio', peso: '—', l0: 'impatto NON calcolato', opzioni: ['Nessun tap: materiale ignoto / non tessile. Carbon e water footprint non calcolate (0).'] },
  { macro: 'Accessori', capo: 'Zaino', peso: '0,500', l0: '100% poliestere', opzioni: ['Nessun tap: materiale assunto 100% poliestere.'] },
  { macro: 'Accessori', capo: 'Borsone', peso: '0,800', l0: '100% poliestere', opzioni: ['Nessun tap: materiale assunto 100% poliestere.'] },
]

const INDICE: Array<[string, string]> = [
  ['scopo', '1. Scopo e oggetto'],
  ['confine', '2. Confine di sistema: cradle-to-gate delle fibre'],
  ['fattori', '3. Fattori d’impatto per fibra'],
  ['blend', '4. Calcolo dell’impatto dei blend'],
  ['prodotto', '5. Calcolo dell’impatto del prodotto finito'],
  ['livelli', '6. Il metodo dell’applicazione: stima a livelli'],
  ['antigreenwashing', '7. Principi anti-greenwashing'],
  ['bibliografia', '8. Bibliografia'],
]

export function Metodologia() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Header sticky con marchio e ritorno al sito */}
      <header className="sticky top-0 z-20 border-b-[1.5px] border-ink bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <Link to="/" aria-label="Torna alla home di Renova">
            <Logo className="text-[21px]" />
          </Link>
          <Link
            to="/"
            className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft transition hover:text-ink"
          >
            ← Torna al sito
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-16">
        {/* Intestazione documento */}
        <div className="border-b-[1.5px] border-ink pb-6 pt-8">
          <span className="eyebrow">Trasparenza · Renova</span>
          <h1 className="mt-1 text-[34px] font-extrabold leading-[1.02] tracking-[-0.03em] text-ink sm:text-[42px]">
            Metodologia di stima dell'impatto ambientale dei capi sportivi di
            seconda mano
          </h1>
          <p className="mt-2 text-base text-ink-soft">
            Carbon footprint e water footprint
          </p>
          <p className="mt-3 inline-block rounded-lg border border-sun/40 bg-sun-50 px-3.5 py-2 text-[13px] leading-relaxed text-ink-soft">
            Documento metodologico. Le stime descritte non costituiscono una LCA
            certificata.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href={PDF_URL}
              download
              className="inline-flex items-center gap-2 bg-eco px-5 py-3 text-[13px] font-bold uppercase tracking-[0.06em] text-white transition hover:bg-eco-600 active:scale-[.99]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Scarica il PDF
            </a>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Versione luglio 2026
            </span>
          </div>
        </div>

        {/* Indice */}
        <nav aria-label="Indice" className="border-b border-line py-5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">
            Indice
          </p>
          <ol className="grid gap-1.5 sm:grid-cols-2">
            {INDICE.map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="text-sm font-semibold text-eco-700 hover:underline"
                >
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* 1 */}
        <Sezione id="scopo" titolo="1. Scopo e oggetto">
          <P>
            Questo documento descrive, con finalità di trasparenza e
            verificabilità, il metodo con cui il progetto Renova stima l'impatto
            ambientale di produzione di ciascun capo di abbigliamento sportivo
            rimesso in circolo sulla piattaforma. L'impatto è espresso in due
            indicatori: emissioni di gas serra (carbon footprint, kg CO₂e) e
            consumo idrico (water footprint, litri).
          </P>
          <P>
            L'obiettivo è duplice: ottenere una stima per singolo capo il più
            vicina possibile alla realtà e, al tempo stesso, evitare qualsiasi
            forma di greenwashing, cioè la sovrastima del beneficio ambientale
            del riuso. I fattori d'impatto adottati provengono dalle fonti
            scientifiche e tecniche citate nel §3 e nella bibliografia (§8), e
            ogni valore è corredato della relativa fonte e della spiegazione
            della scelta.
          </P>
        </Sezione>

        {/* 2 */}
        <Sezione id="confine" titolo="2. Confine di sistema: cradle-to-gate delle fibre">
          <P>
            La stima adotta il confine di sistema «cradle-to-gate» (dalla culla
            al cancello) a livello di fibra: considera cioè gli impatti
            dall'estrazione/coltivazione della materia prima fino alla
            produzione della fibra pronta, escludendo trasporto, fase d'uso e
            fine vita.
          </P>
          <P>
            Va sottolineato un punto metodologico essenziale. I dati
            pubblicamente reperibili riguardano l'impatto della fibra, non
            quello del prodotto finito e pronto all'utilizzo del consumatore
            (che includerebbe filatura, tessitura, tintura, confezione). Poiché
            queste fasi manifatturiere aggiungono impatto ma non sono
            documentate in modo affidabile e specifico per il capo, esse non
            vengono conteggiate. Di conseguenza i valori prodotti da questo
            modello sono, per costruzione, una sottostima dell'impatto reale
            del capo.
          </P>
          <P>
            Questa sottostima è coerente con la priorità anti-greenwashing
            (§7): un risparmio ambientale calcolato su un impatto sottostimato
            non può, per definizione, esagerare il beneficio del riuso.
          </P>
        </Sezione>

        {/* 3 */}
        <Sezione id="fattori" titolo="3. Fattori d'impatto per fibra">
          <P>
            La tabella seguente riporta i fattori adottati per le dieci fibre
            individuate nei cataloghi dei principali marchi di teamwear più
            venduti in Italia, con la relativa fonte e la motivazione del valore
            scelto. Per le fibre con più valori disponibili in letteratura si è
            scelto, in modo trasparente, il valore centrale dell'intervallo.
          </P>
          <P>
            Come funziona per elastan e poliuretano, il cui valore di consumo
            idrico non è indicato? Per entrambe le fibre il valore di carbon
            footprint è disponibile (rispettivamente 19 e 4,83 kg CO₂e/kg) ed è
            quindi incluso nel calcolo. Il valore di water footprint non è
            invece disponibile: per queste due fibre il contributo idrico è
            posto pari a zero (escluso dal calcolo dell'acqua), evitando di
            inventare un dato non documentato.
          </P>

          <div className="my-4 overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b-[1.5px] border-ink bg-surface">
                  <Th>Fibra</Th>
                  <Th>CO₂ (kg CO₂e/kg)</Th>
                  <Th>Acqua (L/kg)</Th>
                  <Th>Fonte e scelta del valore</Th>
                </tr>
              </thead>
              <tbody>
                {FIBRE.map(([fibra, co2, acqua, fonte]) => (
                  <tr key={fibra} className="border-b border-line last:border-0">
                    <Td className="font-semibold text-ink">{fibra}</Td>
                    <Td>{co2}</Td>
                    <Td>{acqua}</Td>
                    <Td className="text-ink-soft">{fonte}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-6 text-lg font-extrabold tracking-[-0.02em] text-ink">
            Macro-categorie di articoli e blend rappresentativi
          </h3>
          <P>
            La tabella seguente associa a ogni voce del catalogo il peso tipico
            usato nel calcolo, il profilo prudenziale di Livello 0 (applicato
            quando il materiale non è noto) e le opzioni che l'utente può
            selezionare al Livello 1 («di che materiale è fatto?»).
          </P>
          <P>
            Le tipologie di capo che l'utente può caricare sulla piattaforma
            sono in totale 14: canotta, t-shirt, polo, felpa, pantaloni,
            pantaloncini, giacca, gilet, k-way, calzini, scarpe, accessorio
            generico, zaino, borsone. Ad ogni capo vengono assegnate delle
            opzioni tra cui l'utente può scegliere, ognuna delle quali
            corrisponde a un blend di fibre rappresentativo. La scelta «Non lo
            so» ricade sul profilo di Livello 0. Le voci non tessili (scarpe e
            accessori) hanno un trattamento dedicato.
          </P>
          <P>
            Criterio: si prevede un'opzione dedicata solo per i cluster di
            composizione che distano più di ~10 punti percentuali da una fibra
            pura; le varianti quasi pure vengono assorbite nell'opzione della
            fibra corrispondente. Motivo: una piccola frazione di una seconda
            fibra cambia poco l'impatto — soprattutto quello idrico, la metrica
            in cui si annida il rischio di greenwashing — e non è distinguibile
            dall'utente (es. un capo 92% PET / 8% elastan è trattato come 100%
            PET). Fa eccezione la CO₂ dell'elastan, il cui fattore è circa 6
            volte quello del poliestere: assorbire un 8–12% di elastan
            sottostima la CO₂ del capo del 30–45%, ma è una sottostima
            prudenziale (§7) e comunque non percepibile dall'utente. I blend con
            una seconda fibra oltre la soglia (misti cotone-poliestere,
            poliammide, polipropilene) mantengono un tap dedicato.
          </P>
          <P>
            I pesi sono valori rappresentativi di riferimento, da affinare con
            grammature reali anche in funzione della taglia. I blend riportano
            le percentuali delle fibre del §3; l'impatto di ciascuna opzione si
            ottiene applicando la formula del §4 al blend e moltiplicando per il
            peso del capo (§5).
          </P>

          <div className="my-4 overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b-[1.5px] border-ink bg-surface">
                  <Th>Macro</Th>
                  <Th>Capo</Th>
                  <Th>Peso tipico (kg)</Th>
                  <Th>Profilo L0 (prudenziale)</Th>
                  <Th>Opzioni materiale (L1) e blend</Th>
                </tr>
              </thead>
              <tbody>
                {CATEGORIE.map((r) => (
                  <tr key={r.capo} className="border-b border-line align-top last:border-0">
                    <Td className="whitespace-nowrap text-ink-soft">{r.macro}</Td>
                    <Td className="whitespace-nowrap font-semibold text-ink">{r.capo}</Td>
                    <Td className="whitespace-nowrap">{r.peso}</Td>
                    <Td>{r.l0}</Td>
                    <Td>
                      <ul className="space-y-0.5">
                        {r.opzioni.map((o) => (
                          <li key={o} className="text-ink-soft">
                            {o}
                          </li>
                        ))}
                      </ul>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <P>
            Le calzature sportive non sono tessili e non seguono il modello a
            fibre: si adotta un valore fisso di categoria pari a 13,6 kg CO₂e
            per paio, ripreso dallo studio LCA del MIT su scarpe sportive
            sintetiche (Cheah et al. 2013), e un consumo idrico prudenziale di
            1.500 L per paio. La carbon footprint di 13,6 kg CO₂e/paio è il
            valore riportato dallo studio LCA del MIT (~30 lb CO₂ per paio) su
            una scarpa sportiva sintetica, in cui oltre due terzi dell'impatto
            derivano dalla sola fase manifatturiera (circa 65 componenti e oltre
            360 fasi di lavorazione). Il valore idrico è invece una nostra stima
            cautelativa: in letteratura non esiste un dato idrico affidabile e
            specifico per la scarpa sportiva sintetica, mentre il valore spesso
            citato di ~8.000 L per paio riguarda le scarpe in pelle (allevamento
            bovino e concia, molto idro-intensivi) ed è quindi escluso perché
            non rappresentativo del nostro caso. Si è perciò assunto 1.500
            L/paio, un livello volutamente contenuto e coerente con il principio
            anti-greenwashing (§7). Il dato di CO₂ deriva da uno studio
            sull'intera scarpa (confine cradle-to-grave) ed è perciò di natura
            diversa dal cradle-to-gate di fibra usato per i capi: è un'eccezione
            dichiarata, adottata perché non disponiamo dei dati di fibra della
            calzatura.
          </P>
          <P>
            I capi racchiusi sotto l'unica voce generica di «Accessorio» sono
            tutti gli articoli di cui non conosciamo il materiale (borracce,
            fasce, manicotti, parastinchi, ginocchiere, ecc.): per essi
            l'impatto non viene calcolato (carbon e water footprint pari a
            zero), per non attribuire un beneficio ambientale non documentato.
            Fanno eccezione «Zaino» e «Borsone», assunti in 100% poliestere: il
            loro impatto è calcolato come per un capo (peso × fattore del
            poliestere), con pesi indicativi rispettivamente di 0,500 kg e
            0,800 kg, da affinare con i valori reali.
          </P>
        </Sezione>

        {/* 4 */}
        <Sezione id="blend" titolo="4. Calcolo dell'impatto dei blend (fibre miscelate)">
          <P>
            La maggior parte dei capi non è composta da un'unica fibra ma da un
            blend (miscela). L'impatto di un kg di tessuto si ottiene come media
            pesata dei fattori delle fibre che lo compongono, usando come pesi
            le percentuali di composizione:
          </P>
          <Formula>Impatto tessuto = Σ ( percentuale fibra × fattore fibra )</Formula>
          <P>Esempio (carbon footprint di un tessuto 92% poliestere – 8% elastan):</P>
          <Formula>
            0,92 × 3,12 + 0,08 × 19 = 2,87 + 1,52 = 4,39 kg CO₂e per kg di tessuto
          </Formula>
          <P>
            Per l'acqua si applica la stessa formula, con la sola differenza che
            le fibre prive di dato idrico (elastan, poliuretano) contribuiscono
            con valore zero, come stabilito al §3.
          </P>
        </Sezione>

        {/* 5 */}
        <Sezione id="prodotto" titolo="5. Calcolo dell'impatto del prodotto finito">
          <P>
            L'impatto del singolo capo si ottiene moltiplicando l'impatto per kg
            di tessuto (§4) per il peso del capo espresso in chilogrammi:
          </P>
          <Formula>Impatto capo = Impatto tessuto × Peso capo (kg)</Formula>
          <P>
            Il peso è trattato come parametro del modello: a seconda della
            categoria e della taglia gli si assegna un valore rappresentativo.
          </P>
          <P>
            Esempio: una maglia tecnica in 100% poliestere del peso di 0,15 kg
            comporta 0,15 × 3,12 = 0,47 kg CO₂e e 0,15 × 62 = 9,3 L d'acqua; la
            stessa maglia in 100% cotone comporterebbe 0,15 × 4,32 = 0,65 kg
            CO₂e ma 0,15 × 4.800 = 720 L. La differenza enorme sull'acqua
            spiega perché identificare la presenza di cotone sia il fattore
            decisivo della stima.
          </P>
        </Sezione>

        {/* 6 */}
        <Sezione id="livelli" titolo="6. Il metodo dell'applicazione: stima a livelli">
          <P>
            Nell'uso reale della piattaforma la composizione esatta del capo
            spesso non è nota all'utente (etichette sbiadite, tagliate o
            assenti). Per conciliare accuratezza e semplicità, l'applicazione
            adotta una stima «a livelli»: usa sempre la migliore informazione
            disponibile e, in mancanza, ripiega su un valore prudente. I
            livelli, in ordine di priorità, sono:
          </P>
          <Livello nome="Livello 2 — Stima verificata">
            Nella fase finale del caricamento all'utente è chiesto
            (facoltativamente) di fotografare l'etichetta di composizione. Un
            modello di riconoscimento ne legge le percentuali e l'utente
            conferma o corregge. È il livello a massima confidenza e non
            richiede di digitare nulla, risolvendo il problema delle etichette
            difficili da trascrivere. In alternativa, in caso di
            malfunzionamento della lettura dell'etichetta l'utente può inserire
            manualmente le percentuali di composizione del blend, in modo da
            mantenere il livello di confidenza massima.
          </Livello>
          <Livello nome="Livello 1 — Stima guidata">
            Se l'etichetta non è leggibile, l'utente sceglie tra poche opzioni
            rappresentative, costruite per ogni tipo di capo a partire dai blend
            realmente diffusi sul mercato (es. per una maglia: «tecnico/da
            gioco», «cotone» e «misto cotone»). Ogni opzione è accompagnata da
            microistruzioni per il riconoscimento al tatto e alla vista. È
            sempre presente l'opzione «Non lo so».
          </Livello>
          <Livello nome="Livello 0 — Stima prudenziale">
            Se l'utente sceglie «Non lo so» o non interviene, il sistema non
            prova a indovinare la fibra: applica il profilo sintetico della
            categoria (quello a impatto idrico basso, statisticamente
            prevalente) e lo comunica come valore minimo prudenziale («Almeno
            X»). È il «pavimento» onesto del risparmio; i Livelli 1 e 2 servono
            ad alzarlo solo in presenza di una prova.
          </Livello>
        </Sezione>

        {/* 7 */}
        <Sezione id="antigreenwashing" titolo="7. Principi anti-greenwashing">
          <P>
            In caso di incertezza, il sistema assume il Livello 0 di stima
            prudenziale, per cui si assume il materiale a impatto idrico più
            basso (sintetico); il cotone, che alza moltissimo il consumo
            d'acqua, viene conteggiato solo in presenza di una prova positiva
            (tap dell'utente o lettura dell'etichetta). Inoltre, nella scheda
            dell'articolo viene indicato da dove proviene la stima e a quale
            livello appartiene.
          </P>
          <P>
            Il confine viene sottostimato per scelta: il cradle-to-gate di
            fibra esclude l'impatto della manifattura e della lavorazione delle
            fibre, quindi il valore è già conservativo (§2).
          </P>
          <P>
            Niente falsa precisione: i risultati sono comunicati come stima e,
            nel default, con la formula «≥», non come dato puntuale certificato.
          </P>
        </Sezione>

        {/* 8 */}
        <Sezione id="bibliografia" titolo="8. Bibliografia">
          <ul className="space-y-2.5 text-[13px] leading-relaxed text-ink-soft">
            <Ref>
              Carbonfact (s.d.). <em>Carbon footprint knowledge base</em>:
              Polyester, Recycled polyester, Cotton, Elastane.
            </Ref>
            <Ref>
              CarbonCloud (s.d.). <em>Polyamide (nylon) — Product climate report</em>.
            </Ref>
            <Ref>
              Cheah, L., Ciceri, N. D., Olivetti, E., Matsumura, S., Forterre,
              D., Roth, R., &amp; Kirchain, R. (2013). Manufacturing-focused
              emissions reductions in footwear production.{' '}
              <em>Journal of Cleaner Production, 44</em>, 18–29.{' '}
              <RefLink href="https://doi.org/10.1016/j.jclepro.2012.11.037" />{' '}
              (sintesi divulgativa:{' '}
              <RefLink href="https://news.mit.edu/2013/footwear-carbon-footprint-0522" testo="MIT News" />
              ).
            </Ref>
            <Ref>
              Qian, W., Ji, X., Xu, P., &amp; Wang, L. (2021). Carbon footprint
              and water footprint assessment of virgin and recycled polyester
              textiles. <em>Textile Research Journal, 91</em>(21–22), 2468–2475.{' '}
              <RefLink href="https://doi.org/10.1177/00405175211006213" />
            </Ref>
            <Ref>
              Sandin, G., Roos, S., &amp; Johansson, M. (2019).{' '}
              <em>
                Environmental impact of textile fibres – what we know and what
                we don't know: The fiber bible part 2
              </em>{' '}
              (Mistra Future Fashion Report No. 2019:03). RISE Research
              Institutes of Sweden.
            </Ref>
            <Ref>
              <em>Resources</em> (2022). Articolo sulla carbon footprint della
              lana. <em>Resources, 11</em>(5), 41.{' '}
              <RefLink href="https://doi.org/10.3390/resources11050041" />
            </Ref>
          </ul>
        </Sezione>

        {/* Chiusura */}
        <div className="mt-10 border-t-[1.5px] border-ink pt-6">
          <p className="text-sm leading-relaxed text-ink-soft">
            Domande sul metodo? Scrivici a{' '}
            <a
              href="mailto:info@renovasport.it"
              className="font-semibold text-eco-700 hover:underline"
            >
              info@renovasport.it
            </a>
            . Una sintesi divulgativa in forma di domande e risposte è
            disponibile nella sezione Impatto dell'app.
          </p>
          <p className="mt-4 pb-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
            Renova · Sport Resale &amp; ESG
          </p>
        </div>
      </main>
    </div>
  )
}

// ── Piccoli mattoni tipografici della pagina ─────────────────────

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
      <h2 className="mb-3 text-[22px] font-extrabold tracking-[-0.02em] text-ink">
        {titolo}
      </h2>
      {children}
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[15px] leading-relaxed text-ink-soft last:mb-0">
      {children}
    </p>
  )
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <p className="my-3 overflow-x-auto rounded-lg border border-line bg-surface px-4 py-3 text-center text-[14px] font-semibold text-ink">
      {children}
    </p>
  )
}

function Livello({
  nome,
  children,
}: {
  nome: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-3 rounded-lg border border-line bg-paper p-4 last:mb-0">
      <h3 className="mb-1.5 text-[15px] font-extrabold tracking-[-0.01em] text-ink">
        {nome}
      </h3>
      <p className="text-[14px] leading-relaxed text-ink-soft">{children}</p>
    </div>
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

function Ref({ children }: { children: React.ReactNode }) {
  return <li className="pl-4 -indent-4">{children}</li>
}

function RefLink({ href, testo }: { href: string; testo?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="break-all font-semibold text-eco-700 hover:underline"
    >
      {testo ?? href.replace('https://', '')}
    </a>
  )
}
