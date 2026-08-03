# Contenuti del sito Renova — brutta copia editabile

> **Come usare questo file.**
> Qui sotto trovi *tutto il testo* che compare sul sito pubblico di Renova.
> Modifica liberamente il testo **dentro le sezioni**, poi rimandami questo file:
> lo riporto io sul sito senza che tu tocchi il codice.
>
> Regole per non rompere nulla:
> - Cambia solo il testo, **non** le etichette tipo `[H1]`, `[BOTTONE]`, `### …`.
> - I valori tra `« »` (es. `«+39 370 3238359»`) sono dati/contatti: cambiali pure.
> - Dove c'è scritto `(placeholder)` è un testo provvisorio in attesa di dati reali.
> - I "mockup" (il telefonino disegnato nell'hero) contengono testo finto d'esempio:
>   lo trovi in fondo, nella sezione **MOCKUP**.
>
> **Struttura del sito (novità).** La home (`/`) ospita **solo l'hero**: è la
> schermata che si raggiunge cercando il sito su Google. Il resto del racconto
> sta su **quattro pagine dedicate**, raggiungibili dal menu in alto e dalle
> card in fondo alla home:
>
> | Voce di menu | Indirizzo | Sezione di questo file |
> |---|---|---|
> | Il progetto | `/progetto` | §3 |
> | Come funziona | `/come-funziona` | §4 |
> | Impatto | `/come-misuriamo` | §5 |
> | Collabora | `/collabora` | §6 |

---

<!-- ══════════════════════════════════════════════════════════════════════════
     ISTRUZIONI PER CLAUDE — NON CANCELLARE QUESTO BLOCCO
     ══════════════════════════════════════════════════════════════════════════

 Quando l'utente ti rimanda questo file chiedendo di "aggiornare / cambiare il
 sito", il flusso da seguire è SEMPRE questo:

 1. FONTE DI VERITÀ = questo file (CONTENUTI-SITO.md). Il sito va allineato al
    file, non viceversa. Il sito pubblico vive in cinque file di pagina più un
    guscio comune:
      • src/components/sito.tsx   → header, footer, «Continua», costanti
      • src/pages/Landing.tsx     → home (hero + indice)
      • src/pages/Progetto.tsx    → /progetto
      • src/pages/ComeFunziona.tsx→ /come-funziona
      • src/pages/ComeMisuriamo.tsx → /come-misuriamo (voce di menu «Impatto»)
      • src/pages/Collabora.tsx   → /collabora (form + contatti)
    La pagina /metodologia (documento metodologico integrale) NON è governata
    da questo file: vive in src/pages/Metodologia.tsx e va aggiornata insieme
    al PDF in public/metodologia-renova.pdf.

 2. CONFRONTA sezione per sezione il testo di questo .md con le stringhe nei
    file e applica SOLO le differenze. Non riscrivere ciò che già coincide.
    Mappa sezione .md → codice:
      • §1 HEADER            → `SitoHeader` in components/sito.tsx (voci nav, bottone, «Accedi»)
      • §2 HOME · Hero       → `Hero()` in pages/Landing.tsx
      • §2 HOME · Striscia   → array `DATI_SONDAGGIO` + nota, in pages/Landing.tsx
      • §2 HOME · Indice     → `Indice()` in Landing.tsx; i titoli e i sommari
                               delle card vengono da `PAGINE_SITO` in sito.tsx
                               (⚠️ gli stessi testi compaiono anche nel blocco
                               «Continua» in fondo a ogni pagina e nel footer)
      • §3 IL PROGETTO       → pages/Progetto.tsx: `CosaE()` (+ array `NUMERI_SISTEMA`),
                               `MissionVision()`, `Agenda2030()` (+ array `SDG`)
      • §4 COME FUNZIONA     → pages/ComeFunziona.tsx: `ComeFunziona()`,
                               `StepRow`/`Step2`, `ValorePerIlClub()`
      • §5 IMPATTO           → pages/ComeMisuriamo.tsx: array `METODO`,
                               `Equivalenze()`, `LeggiMetodologia()`
      • §6 COLLABORA         → pages/Collabora.tsx: `Invito()`, `ReteDiNodi()`
                               (array `NODI`), `FormClub()`, `FormEnte()`
                               (array `TIPI_ENTE`), `Contatti()`
      • §7 FOOTER            → `SitoFooter` in components/sito.tsx
      • §8 CONTINUA          → `ProssimaPagina` in components/sito.tsx

 3. DATI GLOBALI (§"Dati globali", valori tra « »): sono le costanti in cima a
    src/components/sito.tsx → `EMAIL`, `SITO`, `TELEFONO`, `SURVEY_URL`. Se
    cambiano nel .md, aggiorna quelle costanti (compaiono in più punti: footer,
    contatti, mailto dei form).

 4. TITOLI DELLA SCHEDA (SEO): il titolo della home sta in DUE posti che devono
    restare identici — `TITOLO_LANDING` in src/App.tsx e il <title> di
    index.html (i motori di ricerca leggono quello statico). I titoli delle
    altre pagine stanno nel campo `titolo` di `PAGINE_SITO` (sito.tsx).

 5. ATTENZIONE alle entità: nel .md compaiono apostrofi curvi (’) e accenti;
    in JSX usa la stessa forma già presente nei dintorni. Rispetta i caratteri
    speciali già usati (CO₂, H₂O, €, ≥, ·). Non toccare className, JSX, icone,
    struttura: SOLO il testo visibile.

 6. NUMERI E FONTI (regola anti-greenwashing, non negoziabile): ogni dato
    mostrato sul sito ha la sua fonte dichiarata in pagina. Se l'utente cambia
    un numero senza cambiare la fonte, segnalaglielo invece di pubblicare in
    silenzio. Non inventare dati, non gonfiare la traction: il progetto non ha
    ancora utenti reali e il sito lo dice apertamente.

 7. MOCKUP: nell'hero della home il telefonino è DISEGNATO in codice
    (`FeedMock`, `FEED_ITEMS`, `PhoneHeader`, `BottomNav` in Landing.tsx) ed è
    stato rifinito a mano; nella pagina «Come funziona» i telefonini sono
    IMMAGINI (src/assets/mockups/*.webp) e il loro contenuto non si cambia da
    qui. Tocca i mockup SOLO se l'utente lo chiede esplicitamente; in quel caso
    segnala che stai modificando testo decorativo.

 8. IMMAGINI: il sito non usa foto. Le grafiche (numeri di sistema, equivalenze,
    rete di nodi, badge SDG) sono costruite in codice/SVG nello stile del brand.
    Regola ferrea per il futuro: niente stock corporate (strette di mano, mondo
    tra le mani, foglioline verdi). Se arriveranno foto, saranno scatti reali di
    contesto sportivo.

 9. DOPO le modifiche: esegui `npm run build` (deve passare, type-check incluso)
    e, se possibile, avvia l'anteprima per verificare che le stringhe cambiate
    compaiano davvero. Poi riepiloga all'utente COSA è cambiato (elenco puntato
    vecchio→nuovo).

 10. SINCRONIZZAZIONE GITHUB (standing rule, richiesta dell'utente): ogni volta
    che aggiorni i contenuti del sito partendo da questo file, DOPO che il build
    passa devi anche PUBBLICARE le modifiche su GitHub, così il sito online resta
    sempre allineato al codice locale. In pratica:
      • commit dei soli file toccati dall'update (le pagine del sito e, se
        cambiato, `CONTENUTI-SITO.md`) — NON fare `git add -A`: non tirare
        dentro le altre modifiche non collegate presenti nel working tree;
      • messaggio di commit chiaro in italiano (es. "Sito: aggiorna copy da
        CONTENUTI-SITO.md");
      • `git push` sul branch `main` (il deploy del sito online parte da `main`).
    Il push è ATTESO di default per questi aggiornamenti di contenuto: non serve
    richiederlo ogni volta. Se però il working tree è in uno stato ambiguo o ci
    sono conflitti, fermati e chiedi conferma all'utente prima di pushare.

 ═══════════════════════════════════════════════════════════════════════════ -->

---

## Dati globali (compaiono in più punti)

- **Email:** «info@renovasport.it»
- **Telefono:** «+39 370 3238359»
- **Sito:** «renovasport.it»
- **Link sondaggio famiglie:** «https://docs.google.com/forms/d/e/1FAIpQLSdNT_K8-4KZXxYKkiOF8XfazyFLKiXhI0UqRbH6oXrYuDSowg/viewform»
- **Documento metodologico (PDF):** «/metodologia-renova.pdf»

### Titolo che appare su Google (home)

[TITOLO SCHEDA] Renova — Economia circolare per lo sport dilettantistico
[DESCRIZIONE] Renova è la piattaforma che rimette in circolo il materiale sportivo ancora buono: i tesserati di ASD e SSD se lo scambiano gratuitamente, e ogni scambio misura il risparmio economico e l'impatto ambientale evitato (CO2 e acqua).

---

## 1 · HEADER (barra in alto, uguale su tutte le pagine)

- [VOCE MENU] Il progetto
- [VOCE MENU] Come funziona
- [VOCE MENU] Impatto
- [VOCE MENU] Collabora
- [BOTTONE] Collabora con noi
- [LINK] Accedi

---

## 2 · HOME (`/`) — la schermata che si raggiunge da Google

### Hero

[OCCHIELLO] Economia circolare per lo sport dilettantistico

[H1] La piattaforma che rimette in circolo il materiale sportivo ancora buono.

[PARAGRAFO]
Renova permette ai tesserati di ASD e SSD di scambiarsi gratuitamente il materiale sportivo ancora in buone condizioni. Un gesto semplice con un doppio effetto: abbassa il costo dello sport per le famiglie ed evita un impatto ambientale che è già stato prodotto a monte. **Non un'app da vendere, ma un progetto che misura ogni beneficio che genera.**

[BOTTONE PRINCIPALE] Scopri come funziona → porta a «Come funziona»
[BOTTONE SECONDARIO] Collabora con noi → porta a «Collabora»

[RIQUADRO SECONDARIO]
Sei un **genitore o un tesserato**? La tua opinione ci serve per costruire Renova.
[LINK] Compila il sondaggio per le famiglie

[BADGE DECORATIVO sul mockup]
- Risparmio misurato
- CO₂ · Acqua · €

### Striscia dati (dal sondaggio famiglie/tesserati)

[OCCHIELLO] Cosa ci hanno detto le famiglie

- [DATO 1] **+90%** — degli intervistati è interessato a un servizio di scambio nel proprio club
- [DATO 2] **+55%** — ogni stagione si ritrova materiale in buone condizioni rimasto inutilizzato
- [DATO 3] **+55%** — spende oltre 100 € a stagione solo in materiale sportivo

[NOTA FONTE] Indagine esplorativa condotta presso i tesserati di due società di pallacanestro del territorio bolognese (106 risposte, l'89% da genitori di tesserati). Rilevazione circoscritta: indica una tendenza, non consente generalizzazione statistica.

### Indice delle pagine (card in fondo alla home)

[OCCHIELLO] Il sito

[H2] Il progetto, per intero.

[PARAGRAFO] Renova non ha ancora utenti reali: quello che possiamo mostrare è il metodo con cui è stata costruita. Ogni pagina ne racconta una parte.

> ⚠️ I quattro sommari qui sotto compaiono in **tre punti**: nelle card della
> home, nel blocco «Continua» in fondo a ogni pagina e (solo il titolo) nel
> footer. Cambiandoli qui cambiano ovunque.

**Card 01 — Il progetto**
Il costo che nessuno copre, l'impatto già pagato, la nostra missione e gli obiettivi dell'Agenda 2030 che presidiamo.

**Card 02 — Come funziona**
Dall'attivazione del club al primo scambio, in quattro passaggi. Uno solo compete alla società.

**Card 03 — Impatto**
Come stimiamo il beneficio ambientale di ogni scambio, perché lo sottostimiamo apposta e dove dichiariamo i limiti.

**Card 04 — Collabora**
Club, federazioni, amministrazioni, enti del terzo settore, aziende: la rete si costruisce un nodo alla volta.

[LINK card] Apri

---

## 3 · IL PROGETTO (`/progetto`)

### 3a · Cosa è Renova

[OCCHIELLO] Il progetto

[H1] Un costo che nessuno copre, un impatto già pagato.

[PARAGRAFO 1]
Lo sport dilettantistico italiano conta 107.804 enti e 12,3 milioni di tesserati. Per le famiglie il materiale tecnico pesa circa il 25% della spesa annua nei principali sport di squadra — ed è l'unica voce priva di qualsiasi sostegno pubblico: i voucher coprono l'iscrizione, non il corredo.

[PARAGRAFO 2]
Allo stesso tempo, ogni capo sportivo porta con sé un impatto ambientale — CO₂ e acqua — già interamente prodotto nel momento in cui viene fabbricato. Buttarlo quando è ancora buono spreca due volte: i soldi delle famiglie e le risorse spese per produrlo.

[GRAFICA NUMERI DI SISTEMA]
- **107.804** — *enti sportivi* — iscritti al Registro nazionale con almeno un tesseramento attivo (2024).
- **12,3** — *milioni di tesserati* — in Italia; nella fascia 6-14 anni la copertura arriva al 63,2% dei residenti.
- **~25%** — *della spesa annua* — è il peso del materiale tecnico nei tre principali sport di squadra: l'unica voce senza alcun sostegno pubblico.

[NOTA FONTE] Fonti: Istituto per il Credito Sportivo e Culturale & Sport e Salute, *Rapporto Sport 2025* (dati 2024) per enti e tesserati; elaborazione su Federconsumatori (2023) per l'incidenza del corredo sulla spesa annua.

[H2] Renova rimette in circolo quel materiale.

[PARAGRAFO]
I tesserati pubblicano ciò che non usano più, chi cerca un articolo lo trova nel catalogo, si accordano tramite la chat interna e se lo scambiano di persona, gratuitamente. La piattaforma non ospita denaro, non movimenta merce e non chiede alla società alcuna attività di gestione.

**Bacino 1**
- [TITOLO] Materiale col logo del club
- [TESTO] Divise, tute e abbigliamento con il marchio della società restano visibili ai soli tesserati di quel club: un capo che porta i colori di una società non ha mercato fuori da lì.

**Bacino 2**
- [TITOLO] Materiale neutro
- [TESTO] Calzature, protezioni, abbigliamento tecnico senza marchio e borse circolano fra i praticanti dello stesso sport nella stessa area geografica. È ciò che rende il servizio utile anche alla società piccola.

### 3b · Mission & Vision

[OCCHIELLO] Mission & Vision

**Blocco missione**
- [TITOLO] La nostra missione
- [TESTO] Rimettere in circolo il materiale sportivo ancora buono per abbassare la barriera economica di accesso allo sport ed evitare un impatto ambientale che è già stato prodotto.

**Blocco visione** *(banda scura — è dichiarata come direzione futura, non come funzione già attiva)*
- [ETICHETTA] Direzione futura
- [TITOLO] Il domani di Renova
- [TESTO] Renova nasce come strumento di scambio, ma guarda oltre: diventare un hub che diffonde la cultura della sostenibilità nello sport — attraverso informazione, formazione e incentivi concreti che aiutino le persone a cambiare davvero le proprie abitudini. È un obiettivo che si raggiunge in un solo modo: costruendo reti fitte di collaborazione con enti di ogni tipo.

### 3c · Renova e l'Agenda 2030

[OCCHIELLO] Renova e l'Agenda 2030

[H2] Ogni funzione, un obiettivo di sviluppo sostenibile.

[PARAGRAFO] Renova non rincorre più SDG possibile per riempire una vetrina. Ne presidia pochi, in modo diretto e difendibile — la stessa disciplina che applichiamo alla misura dell'impatto.

> ⚠️ Sono volutamente **cinque** obiettivi (12, 13, 3, 10, 17). L'SDG 6 (Acqua
> pulita) NON compare come voce autonoma: la metodologia dichiara lacune sui
> consumi idrici di alcune fibre sintetiche, e rivendicarlo contraddirebbe la
> linea anti-greenwashing. Non aggiungerlo.

**SDG 12 · Consumo e produzione responsabili**
Il cuore di Renova. Prolungare la vita utile del materiale è riuso puro (target 12.5): ogni scambio è un capo che non diventa rifiuto e un acquisto nuovo che non serve più.
→ *Funzione: Marketplace di scambio gratuito.*

**SDG 13 · Lotta al cambiamento climatico**
Ogni scambio evita la CO₂ legata alla produzione di un capo nuovo. Non lo diciamo e basta: lo misuriamo, capo per capo, con metodo tracciabile.
→ *Funzione: Stima d'impatto per articolo + dashboard.*

**SDG 3 · Salute e benessere**
Abbassare il costo del corredo abbassa una delle barriere che tengono i ragazzi lontani dallo sport. Più materiale accessibile significa più possibilità di praticare.
→ *Funzione: Scambio gratuito che riduce la spesa delle famiglie.*

**SDG 10 · Ridurre le disuguaglianze**
Il beneficio economico va dove serve di più: alle famiglie con meno risorse. Il feed pubblico territoriale allarga le occasioni di scambio anche ai club più piccoli.
→ *Funzione: Gratuità + circolazione territoriale del materiale neutro.*

**SDG 17 · Partnership per gli obiettivi**
Nessun impatto di scala si costruisce da soli. Renova è pensata come nodo di una rete di club, istituzioni ed enti che condividono l'obiettivo.
→ *Funzione: Apertura dell'ecosistema a partner di ogni tipo.*

---

## 4 · COME FUNZIONA (`/come-funziona`)

[OCCHIELLO] Come funziona

[H1] Dall'attivazione al primo scambio, in pochi tap.

[PARAGRAFO] Il club fa una cosa sola; tutto il resto lo gestiscono le famiglie in autonomia. Ecco come funziona in 4 semplici step:

**Step 1**
- [TITOLO] Il club attiva Renova
- [TESTO] Il club aderisce al servizio e riceve un codice di attivazione da distribuire ai propri tesserati. Da qui in poi gli sforzi organizzativi della società sono finiti.

**Step 2**
- [TITOLO] I tesserati entrano nel marketplace
- [TESTO] Con il codice, le famiglie accedono al marketplace e pubblicano in pochi tap il materiale che non usano più. Lo stesso feed si divide automaticamente in due viste, in base alla presenza o meno del logo della società.
- [DIDASCALIA mockup centrale] **Marketplace** — Un solo posto dove pubblicare e cercare.
- [DIDASCALIA feed societario] **Feed societario** — Articoli col logo societario, visibili solo ai tesserati del club.
- [DIDASCALIA feed pubblico] **Feed pubblico** — Articoli senza logo, aperti ai praticanti dello stesso sport nella stessa area geografica.

**Step 3**
- [TITOLO] Si accordano e scambiano, gratis
- [TESTO] Tramite la chat integrata i tesserati si organizzano in autonomia e si scambiano il materiale di persona, gratuitamente. La valutazione delle condizioni e l'accordo finale restano in capo a chi scambia, che si incontra di persona e verifica l'oggetto prima di prenderlo: il club non si fa garante dei singoli scambi.

**Step 4**
- [TITOLO] Il club vede l'impatto
- [TESTO] Una dashboard mostra al club il risparmio economico generato per le famiglie e il materiale rimesso in circolo, con le metriche ambientali (CO₂ e acqua risparmiate). Dati pronti da usare in ogni momento.

### Perché un club sceglie Renova

[OCCHIELLO] Il valore per la società

[H2] Perché un club sceglie Renova

**Leva 1**
- [TITOLO] Zero sforzo organizzativo
- [TESTO] Il club distribuisce un codice e si prende i meriti; a pubblicare, accordarsi e scambiare sono i tesserati. Nessun carico sulla segreteria.

**Leva 2**
- [TITOLO] Retention e recruiting
- [TESTO] Gli scambi avvengono di persona: ogni passaggio di materiale è un'occasione di incontro che costruisce community. Un club che fa risparmiare e crea relazioni è un club a cui ci si iscrive e in cui si resta.

---

## 5 · IMPATTO — come lo misuriamo (`/come-misuriamo`)

[OCCHIELLO] Impatto

[H1] Misuriamo il beneficio. E lo sottostimiamo apposta.

[PARAGRAFO]
Dire «riusare fa bene all'ambiente» è facile. Metterci un numero onesto è un'altra cosa. Renova stima l'impatto evitato da ogni scambio con un criterio dichiaratamente prudenziale: quando c'è un dubbio, scegliamo sempre l'ipotesi che *abbassa* il beneficio dichiarato. È il contrario del greenwashing.

**Punto 01**
- [TITOLO] Confine di sistema: cradle-to-gate a livello di fibra
- [TESTO] Contiamo l'impatto dalla materia prima alla produzione della fibra, escludendo filatura, tessitura, tintura e confezione. Significa che i nostri valori sono, per costruzione, una sottostima dell'impatto reale del capo finito.

**Punto 02**
- [TITOLO] Stima a livelli di confidenza crescente
- [TESTO] Livello 0 (profilo prudenziale di categoria) e Livello 1 (blend selezionato dall'utente) sono attivi; il Livello 2 (riconoscimento fotografico dell'etichetta) è progettato per il futuro. In mancanza di prova, assumiamo sempre la fibra a impatto più basso.

**Punto 03**
- [TITOLO] Lacune dichiarate, non colmate con numeri inventati
- [TESTO] Dove la letteratura affidabile non fornisce il consumo idrico di una fibra, lo poniamo pari a zero anziché stimarlo. Il limite resta scritto nel documento metodologico, non nascosto.

**Punto 04**
- [TITOLO] Assunzione di sostituzione, comunicata come stima
- [TESTO] L'impatto «evitato» presuppone che il capo riusato sostituisca un acquisto nuovo. È una stima documentata, non un dato certificato — e la presentiamo come tale.

### Equivalenze

[OCCHIELLO] Equivalenze

[H2] Un numero che nessuno sa leggere non serve a niente.

[PARAGRAFO] Le stime si traducono in equivalenze concrete: la CO₂ risparmiata come chilometri in auto evitati, l'acqua come numero di docce. Sono equivalenze indicative, e la fonte di ciascun fattore di conversione è sempre dichiarata nell'app.

[ETICHETTA ESEMPIO] Esempio · un paio di scarpe sportive rimesso in circolo

- **13,6 kg CO₂e** — *Carbon footprint di produzione* — **≈ 109 km in auto** — con un fattore prudenziale di ~125 g CO₂/km sul parco circolante
- **≥ 1.500 L** — *Water footprint di produzione* — **≈ 19 docce** — una doccia di circa 8 minuti a ~10 L/min

[NOTA FONTE] Impatto del paio di scarpe: analisi del ciclo di vita di una calzatura sportiva sintetica condotta dal Massachusetts Institute of Technology (Cheah et al., 2013), adottata come valore fisso di categoria nel documento metodologico. Fattore auto: le auto nuove immatricolate nell'UE emettono in media 106,4 g CO₂/km (2023, EEA); usiamo ~125 g/km, più prudente, per rappresentare il parco circolante. Le stime restano una sottostima: coprono la fibra, non il capo finito.

### Rimando al documento metodologico (banda scura)

[OCCHIELLO] Documento pubblico

[H2] Fattori d'impatto, fonti e formule: è tutto scritto.

[PARAGRAFO] Il metodo completo — impatto per fibra con la fonte di ogni valore, blend rappresentativi, pesi di categoria e formule di calcolo — è raccolto in un documento metodologico pubblico, liberamente consultabile e scaricabile. Chi vuole verificarne i fondamenti può farlo.

[BOTTONE 1] Leggi la metodologia → pagina `/metodologia`
[BOTTONE 2] Scarica il PDF

---

## 6 · COLLABORA — «Costruiamo la rete insieme» (`/collabora`)

[OCCHIELLO] Collabora

[H1] Renova cresce con chi vuole costruirla.

[PARAGRAFO]
Renova non è solo per i club. È pensata per aprirsi a chiunque possa contribuire a rimettere in circolo il materiale sportivo e a diffondere una cultura della sostenibilità nello sport: federazioni, amministrazioni locali, enti del terzo settore, produttori, aziende di software gestionali. Se vedi un punto di contatto tra la tua realtà e la nostra, parliamone: **la rete si costruisce un nodo alla volta.**

[GRAFICA RETE — etichette dei nodi attorno a «renova»]
- Club ASD e SSD
- Federazioni
- Amministrazioni
- Terzo settore
- Produttori
- Software gestionali

### I due form

[OCCHIELLO] Scrivici

[H2] Due strade, stessa porta.

**Form A**
- [OCCHIELLO] Sei un club
- [TITOLO] Porta Renova fra i tuoi tesserati
- [CAMPI]
  - Nome (obbligatorio)
  - Club / società (obbligatorio)
  - Ruolo
  - Email (obbligatorio)
  - Telefono (obbligatorio)
  - Messaggio (opzionale) — placeholder: "Domande, dubbi, curiosità…"
- [BOTTONE INVIO] Porta Renova nel tuo club

**Form B**
- [OCCHIELLO] Sei un altro tipo di ente
- [TITOLO] Proponici una collaborazione
- [CAMPI]
  - Nome (obbligatorio)
  - Ente / organizzazione (obbligatorio)
  - Tipo di ente (menu a tendina: Federazione · Pubblica amministrazione · Terzo settore · Azienda · Altro)
  - Email (obbligatorio)
  - Come vorresti collaborare — placeholder: "Raccontaci il punto di contatto che vedi con la tua realtà…"
- [BOTTONE INVIO] Proponi una collaborazione

[NOTA SOTTO I FORM] Inviando il form aprirai la tua email con i dati già compilati.

### Contatti

[OCCHIELLO] Contatti

[H2] Parliamone.

[PARAGRAFO] Raccontaci della tua realtà, porta alla luce dubbi e curiosità, o aiutaci con suggerimenti che migliorino il servizio.

[CONTATTI DIRETTI]
- Email: «info@renovasport.it»
- Telefono: «+39 370 3238359»
- Sito: «renovasport.it»

---

## 7 · FOOTER (piè di pagina, uguale su tutte le pagine)

[TITOLO] Non sei ancora pronto a parlarne?
[SOTTOTITOLO] Lascia la tua email e ti aggiorniamo sullo sviluppo del progetto.
[CAMPO] placeholder: "La tua email"
[BOTTONE] Tienimi aggiornato

[MAPPA DEL SITO] Il progetto · Come funziona · Impatto · Collabora · Metodologia d'impatto

[RECAPITI] «info@renovasport.it» · «+39 370 3238359» · «renovasport.it»

[COPYRIGHT] © 2026 Renova · Economia circolare per lo sport dilettantistico · renovasport.it

---

## 8 · «CONTINUA» (in fondo a ogni pagina, non alla home)

[ETICHETTA] Continua
[TITOLO] *(nome della pagina successiva — vedi §2, card dell'indice)*
[TESTO] *(sommario della pagina successiva — vedi §2, card dell'indice)*
[BOTTONE] Vai

L'ordine di lettura è circolare: Il progetto → Come funziona → Impatto → Collabora → Il progetto.

---

## MOCKUP (testo d'esempio dentro il telefonino disegnato nell'hero)

> Questo è testo finto illustrativo mostrato nello "screenshot" dell'app
> disegnato nella home. Modificabile, ma è testo decorativo.
>
> ⚠️ Nella pagina «Come funziona» i telefonini NON sono disegnati: sono
> immagini (`src/assets/mockups/*.webp`) e il testo al loro interno non si
> cambia da questo file — vanno rigenerate le immagini.

### Mockup feed (home, colonna destra dell'hero)

- Intestazione: marchio «renova» · pill società «Bologna FC»
- Barra ricerca: "Cerca prodotti…" · "Filtri +"
- Tab: Tutti · Disponibili · Prenotati · Scambiati
- Articolo 1: **Zaino sportivo** — Zaino · Unica · Buono — CO₂ ≥ 9 KG — H₂O ≥ 300 L — stato "Disponibile"
- Articolo 2: **Scarpe da calcio** — Scarpe · 41 · Ottimo — CO₂ ≥ 14 KG — H₂O ≥ 1,5K L — stato "Scambiato"
- Articolo 3: **Giacca sportiva** — Giacca · M · Ottimo — CO₂ ≥ 1 KG — H₂O ≥ 19 L — stato "Disponibile"
- Articolo 4: **Maglia allenamento** — Maglia · S · Perfetto — CO₂ ≥ 4 KG — H₂O ≥ 600 L — stato "Prenotato"
- Barra inferiore: Market · Impatto · (+) · Chat · Profilo
