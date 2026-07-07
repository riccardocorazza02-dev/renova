# Contenuti del sito Renova — brutta copia editabile

> **Come usare questo file.**
> Qui sotto trovi *tutto il testo* che compare sulla landing pubblica del sito
> (`src/pages/Landing.tsx`). Modifica liberamente il testo **dentro le sezioni**,
> poi rimandami questo file: lo riporto io sul sito senza che tu tocchi il codice.
>
> Regole per non rompere nulla:
> - Cambia solo il testo, **non** le etichette tipo `[H1]`, `[BOTTONE]`, `### …`.
> - I valori tra `« »` (es. `«+39 370 3238359»`) sono dati/contatti: cambiali pure.
> - Dove c'è scritto `(placeholder)` è un testo provvisorio in attesa di dati reali.
> - I "mockup" (telefonini disegnati) contengono testo finto d'esempio: lo trovi
>   in fondo, nella sezione **MOCKUP**.

---

<!-- ══════════════════════════════════════════════════════════════════════════
     ISTRUZIONI PER CLAUDE — NON CANCELLARE QUESTO BLOCCO
     ══════════════════════════════════════════════════════════════════════════

 Quando l'utente ti rimanda questo file chiedendo di "aggiornare / cambiare il
 sito", il flusso da seguire è SEMPRE questo:

 1. FONTE DI VERITÀ = questo file (CONTENUTI-SITO.md). Il sito va allineato al
    file, non viceversa. L'unico file da modificare è `src/pages/Landing.tsx`
    (tutta la landing pubblica vive lì: testo + mockup + icone).

 2. CONFRONTA sezione per sezione il testo di questo .md con le stringhe in
    `Landing.tsx` e applica SOLO le differenze. Non riscrivere ciò che già
    coincide. Mappa sezione .md → componente/blocco in Landing.tsx:
      • §1 HEADER            → <header> in `Landing()` (voci nav + "Prenota una call" + "Accedi")
      • §2 HERO              → funzione `Hero()`  (eyebrow, <h1>, paragrafo, CTA, riquadro sondaggio, badge)
      • §2 Le leve           → chiamate a <Leva …>  dentro `Hero()`  (title/body)
      • §2 Leva bonus        → blocco "Leva bonus — evidenziata" in `Hero()`
      • §2 Trust-strip       → chiamate a <Stat …>  in `Hero()`  (valore/testo)
      • §3 COME FUNZIONA     → funzione `ComeFunziona()` + `StepRow`/`Step2` (eyebrow, <h2>, paragrafo, 4 step, didascalie feed)
      • §4 PARTNERSHIP       → funzione `SocialProof()`  (eyebrow, <h2>, paragrafo, nota)
      • §5 FASE DI TEST      → funzione `FaseDiTest()`  (eyebrow, <h2>, paragrafo, CTA)
      • §6 FAQ              → array `FAQ` (coppie q/a) sopra la funzione `Faq()`
      • §7 CONTATTI          → funzione `Contatti()` (eyebrow, <h2>, paragrafo, campi form, bottone, nota)
      • §8 FOOTER            → funzione `Footer()`  (titolo, sottotitolo, placeholder email, bottone, copyright)

 3. DATI GLOBALI (§"Dati globali", valori tra « »): sono le costanti in cima a
    `Landing.tsx` → `EMAIL`, `SITO`, `TELEFONO`, `SURVEY_URL`. Se cambiano nel
    .md, aggiorna quelle costanti (compaiono in più punti: header, contatti,
    footer, mailto).

 4. ATTENZIONE alle entità: nel .md compaiono apostrofi curvi (’) e accenti;
    in JSX usa la stessa forma già presente nei dintorni. Rispetta i caratteri
    speciali già usati (CO₂, H₂O, €, ≥, ·). Non toccare className, JSX, icone,
    struttura: SOLO il testo visibile.

 5. MOCKUP (§"MOCKUP", i telefonini disegnati): è testo DECORATIVO d'esempio.
    Di default NON allinearlo automaticamente — le funzioni `FeedMock`,
    `ArticleMock`, `ChatMock`, `ImpattoMock`, `CodeMock`, `FEED_ITEMS`,
    `PhoneHeader` in `Landing.tsx` sono state rifinite a mano per assomigliare
    agli schermi reali dell'app e possono divergere da questa sezione del .md.
    Tocca i mockup SOLO se l'utente lo chiede esplicitamente; in quel caso
    segnala che stai modificando testo decorativo.

 6. DOPO le modifiche: esegui `npm run build` (deve passare, type-check incluso)
    e, se possibile, avvia l'anteprima per verificare che le stringhe cambiate
    compaiano davvero. Poi riepiloga all'utente COSA è cambiato (elenco puntato
    vecchio→nuovo).

 7. SINCRONIZZAZIONE GITHUB (standing rule, richiesta dell'utente): ogni volta
    che aggiorni i contenuti del sito partendo da questo file, DOPO che il build
    passa devi anche PUBBLICARE le modifiche su GitHub, così il sito online resta
    sempre allineato al codice locale. In pratica:
      • commit dei soli file toccati dall'update (di norma `src/pages/Landing.tsx`
        e, se cambiato, `CONTENUTI-SITO.md`) — NON fare `git add -A`: non tirare
        dentro le altre modifiche non collegate presenti nel working tree;
      • messaggio di commit chiaro in italiano (es. "Landing: aggiorna copy da
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

---

## 1 · HEADER (barra in alto)

- [VOCE MENU] Come funziona
- [VOCE MENU] Partnership
- [VOCE MENU] FAQ
- [BOTTONE] Prenota una call
- [LINK] Accedi

---

## 2 · HERO (prima schermata)

[OCCHIELLO] Servizio attivabile da ASD/SSD di Bologna

[H1] Abbatti il costo dello sport per le famiglie del tuo club.

[PARAGRAFO]
Il servizio che le famiglie del tuo club stanno aspettando. Con Renova i tesserati si scambiano gratuitamente il materiale sportivo usato ancora in buone condizioni. Più risparmio per le famiglie, più fidelizzazione per te. **Nessuno sforzo organizzativo.**

[BOTTONE PRINCIPALE] Prenota una call conoscitiva

[RIQUADRO SECONDARIO]
Sei un **genitore o un tesserato**? La tua opinione ci serve per costruire Renova.
[LINK] Compila il sondaggio per le famiglie

[BADGE DECORATIVO sul mockup]
- Risparmio misurato
- CO₂ · Acqua · €

### Le leve — "Perché i club scelgono Renova"

[OCCHIELLO] Perché i club scelgono Renova

**Leva 1**
- [TITOLO] Zero sforzo organizzativo per il club
- [TESTO] Tu attivi il servizio e ti prendi i meriti. Distribuisci un codice e sono i tesserati a pubblicare, accordarsi e scambiarsi gli articoli tra loro. Nessun magazzino, nessun coordinamento, nessun carico sulla segreteria.

**Leva 2**
- [TITOLO] Retention e recruiting dei tesserati
- [TESTO] Gli scambi avvengono di persona, tra famiglie dello stesso club: ogni passaggio di materiale è un'occasione di incontro che costruisce community. Un club che fa risparmiare e crea relazioni è un club a cui ci si iscrive e in cui si resta.

**Leva 3**
- [TITOLO] Un servizio che le famiglie chiedono davvero
- [TESTO] Non è un'ipotesi: stiamo conducendo ricerche sui genitori e tesserati e il riscontro è positivo. La domanda c'è — e portarla nel tuo club ti dà un argomento concreto al momento dell'iscrizione e del rinnovo.

**Leva 4**
- [TITOLO] Costo dello sport più basso per le famiglie
- [TESTO] Scarpe, divise, attrezzatura: il materiale tecnico è una spesa ricorrente. Con Renova quella spesa si abbassa, perché il materiale ancora buono torna a circolare invece di essere ricomprato da zero. Il risparmio va direttamente alle famiglie.

**Leva bonus (evidenziata)**
- [ETICHETTA] Bonus
- [TITOLO] Materiale che torna a circolare, con i dati in mano
- [TESTO] Ogni scambio è attrezzatura salvata dall'armadio e un dato misurato: la dashboard traccia il risparmio generato per le famiglie e l'impatto ambientale evitato — carbon footprint (CO₂) e water footprint (acqua). Numeri pronti da mostrare a famiglie, sponsor e istituzioni.

### Trust-strip (4 statistiche)

**Stat 1**
- [VALORE] +55%
- [TESTO] degli intervistati ha dichiarato che ogni stagione ha in casa del materiale sportivo usato in buone condizioni che rimane inutilizzato 

**Stat 2**
- [VALORE] +90%
- [TESTO] degli intervistati è interessato a un servizio di scambio del materiale del proprio club

**Stat 3**
- [VALORE] +55%
- [TESTO] degli intervistati spende più di 100€ ogni stagione sportiva soltanto il materiale sportivo (di cui +20% spende più di 200€)

**Stat 4 (evidenziata)**
- [VALORE] Gratis
- [TESTO] la partecipazione alla fase di test per i primi club

---

## 3 · COME FUNZIONA

[OCCHIELLO] Come funziona

[H2] Dall'attivazione al primo scambio, in pochi tap.

[PARAGRAFO] Il club fa una cosa sola; tutto il resto lo gestiscono le famiglie in autonomia. Ecco come funziona in 4 semplici step:

**Step 1**
- [TITOLO] Il club attiva Renova
- [TESTO] Il club aderisce al servizio e riceve un codice di attivazione da distribuire ai propri tesserati. Da qui in poi gli sforzi organizzativi della società sono finiti.

**Step 2**
- [TITOLO] I tesserati entrano nel marketplace
- [TESTO] Con il codice, le famiglie accedono al marketplace e pubblicano in pochi tap il materiale che non usano più. Lo stesso feed si divide automaticamente in due viste, in base alla presenza del logo della società.
- [DIDASCALIA mockup centrale] **Marketplace** — un solo posto dove pubblicare e cercare.
- [DIDASCALIA feed societario] **Feed societario** — articoli col logo societario, visibili solo ai tesserati del club stesso.
- [DIDASCALIA feed pubblico] **Feed pubblico** — articoli senza logo, aperti ai praticanti dello stesso sport nella stessa area geografica.

**Step 3**
- [TITOLO] Si accordano e scambiano, gratis
- [TESTO] Tramite la chat integrata i tesserati si organizzano in autonomia e si scambiano il materiale di persona, gratuitamente. Come promesso, nessun lavoro per la società.

**Step 4**
- [TITOLO] Il club vede l'impatto
- [TESTO] Una dashboard mostra al club il risparmio economico generato per le famiglie e il materiale rimesso in circolo, con le metriche ambientali (CO₂ e acqua risparmiate). Dati pronti da usare, in ogni momento ed esportabili.

---

## 4 · PARTNERSHIP (social proof)

[OCCHIELLO] Partnership

[H2] Stiamo costruendo Renova con chi lo sport lo vive ogni giorno

[PARAGRAFO] Renova nasce dal confronto diretto con i club. Queste sono le società che stanno collaborando allo sviluppo.

[GRIGLIA LOGHI] (placeholder) 8 caselle vuote "Inserisci qui il tuo logo"

[NOTA] I loghi dei club partner verranno mostrati qui una volta raccolti i consensi.

---

## 5 · FASE DI TEST (banda scura)

[OCCHIELLO] Fase di sviluppo · Bologna

[H2] Stiamo cercando club di Bologna interessati a collaborare.

[PARAGRAFO]
Renova è in fase di sviluppo e parte dal territorio bolognese. Stiamo cercando di coinvolgere quanti più club del territorio per testare il servizio sul campo: **la partecipazione è gratuita**. È il momento giusto per entrare tra i primi e contribuire a costruire la piattaforma.

[BOTTONE] Prenota una call conoscitiva

---

## 6 · FAQ (domande frequenti)

[OCCHIELLO] FAQ

[H2] Domande frequenti

**D1.** Quanto costa al club?
**R1.** In questa fase la partecipazione è gratuita. Stiamo coinvolgendo i primi club per testare il servizio: nessun costo, nessun impegno economico. 

**D2.** È davvero gratis? E dopo la fase di test?
**R2.** Sì: durante la fase di test il servizio è gratuito per il club e per le famiglie, senza vincoli. Il modello di revenue è ancora in corso di definizione ma in ogni caso lo scambio del materiale tra tesserati resta gratuito.

**D3.** Cosa deve fare concretamente il club?
**R3.** Pochissimo: aderire, distribuire il codice di attivazione ai tesserati e prendersi i meriti dell'iniziativa. Tutto il resto — pubblicazione del materiale, accordi, scambio — lo gestiscono le famiglie in autonomia. Nessun carico di lavoro sulla società.

**D4.** Il nostro è un club piccolo: funziona lo stesso?
**R4.** Sì. Più tesserati partecipano, più scambi avvengono, ma Renova è pensata anche per realtà piccole: oltre al feed interno del club c'è un feed pubblico che mette in contatto i praticanti dello stesso sport nella stessa area geografica, ampliando le occasioni di scambio anche per le società più piccole.

**D5.** Come avviene lo scambio? È gratuito o c'è un prezzo?
**R5.** La piattaforma fa incontrare domanda e offerta; l'accordo lo prendono le famiglie tramite la chat integrata e lo scambio avviene di persona, tra tesserati. È una scelta voluta: rafforza i rapporti dentro la community del club. Il prezzo che vedi indicato negli articoli riguarda il risparmio economico generato dallo scambio, non un importo da pagare.

**D6.** Chi vede cosa? Come gestite la privacy?
**R6.** Ogni tesserato vede due insiemi separati: il feed societario, visibile solo ai membri dello stesso club (qui finiscono gli articoli con il logo della società); e il feed pubblico, con i soli articoli senza logo, visibili a tutti gli altri praticanti dello stesso sport nella stessa area geografica. Agli altri utenti sono visibili solo le informazioni minime necessarie ad accordarsi sullo scambio; il resto dei dati personali non è esposto. La separazione è garantita a livello di sistema, non lasciata al caso.

**D7.** E per i tesserati minorenni?
**R7.** L'account di un minore è creato e gestito da un genitore o da un adulto di riferimento, che resta responsabile delle interazioni. Lo scambio avviene di persona e all'interno della community del club, in un ambiente chiuso e riconducibile a tesserati reali — non una piazza aperta a sconosciuti. Stiamo definendo strumenti dedicati per mantenere la chat un ambiente sicuro.

**D8.** Chi è responsabile della qualità del materiale o di eventuali problemi nello scambio?
**R8.** Renova mette in contatto le famiglie e fornisce gli strumenti per scambiarsi il materiale; la valutazione delle condizioni e l'accordo finale restano in capo a chi scambia, che si incontra di persona e può verificare l'oggetto prima di prenderlo. Il club non si fa garante dei singoli scambi. Bisogna immaginare Renova come uno spazio pubblico, il cui buon funzionamento è una responsabilità condivisa.

**D9.** Come accedono i tesserati? Serve scaricare un'app?
**R9.** Al momento no: si accede da web con il codice di attivazione del club, dallo smartphone come da computer. Nessuna installazione, nessuna procedura complicata.

**D10.** Come fate a misurare il risparmio e l'impatto ambientale mostrati nella dashboard?
**R10.** Il risparmio nasce dagli scambi reali registrati sulla piattaforma. L'impatto ambientale (CO₂ e acqua) è stimato con un metodo deterministico e tracciabile, calcolato dalle fibre che compongono il capo — non un numero generico, ma una stima documentata con tre livelli di affidabilità a seconda di quanto si conosce del materiale.

---

## 7 · CONTATTI (sezione finale con form)

[OCCHIELLO] Contatti

[H2] Vuoi portare Renova nel tuo club?

[PARAGRAFO] Raccontaci del tuo club o facci le tue domande. Ti ricontattiamo per una call senza impegno.

[CONTATTI DIRETTI]
- Email: «info@renovasport.it»
- Telefono: «+39 370 3238359»
- Sito: «renovasport.it»

### Form "Prenota una call"

[CAMPI]
- Nome (obbligatorio)
- Club / società (obbligatorio)
- Ruolo
- Email (obbligatorio)
- Telefono (obbligatorio)
- Messaggio (opzionale) — placeholder: "Domande, suggerimenti, richieste…"

[BOTTONE INVIO] Prenota una call conoscitiva

[NOTA SOTTO IL BOTTONE] Inviando il form aprirai la tua email con i dati già compilati.

---

## 8 · FOOTER (piè di pagina)

[TITOLO] Non sei ancora pronto a parlarne?
[SOTTOTITOLO] Lascia la tua email e ti aggiorniamo sul lancio.
[CAMPO] placeholder: "La tua email"
[BOTTONE] Tienimi aggiornato

[COPYRIGHT] © 2026 Renova · Il marketplace second hand per ASD e SSD · renovasport.it

---

## MOCKUP (testo d'esempio dentro i telefonini disegnati)

> Questi sono testi finti illustrativi mostrati negli "screenshot" dell'app
> disegnati sulla pagina. Modificabili, ma è testo decorativo.

### Mockup feed (lista articoli)

- Barra ricerca: "Cerca prodotti…" · "Filtri +"
- Tab: Tutti · Disponibili · Prenotati
- Articolo 1: **Scarpe da calcio** — Scarpe · 42 · Buone — CO₂ 6 kg — H₂O 2.8k L
- Articolo 2: **Divisa Bologna FC** — Maglia · M · Ottime — CO₂ 9 kg — H₂O 3.1k L *(con logo società)*
- Articolo 3: **Parastinchi** — Protez. · Uni · Buone — CO₂ 2 kg — H₂O 0.6k L
- Articolo 4: **Borsone sportivo** — Access. · Uni · Discr. — CO₂ 4 kg — H₂O 1.2k L
- Badge stato: "Disp."

### Mockup articolo — Feed societario

- Intestazione: "Feed societario" · "Bologna FC"
- Stato: "Disponibile"
- Titolo: Divisa ufficiale Bologna FC
- Sottotitolo: Maglia · Taglia M · Ottime
- Prezzo: 28 € — "risparmio stimato"
- ESG: CO₂: 9 kg · H₂O: 3.1k L
- Composizione: 100% poliestere riciclato
- CTA: Contatta venditore

### Mockup articolo — Feed pubblico

- Intestazione: "Feed pubblico" · "Pubblico"
- Stato: "Disponibile"
- Titolo: Scarpe da calcio Nike
- Sottotitolo: Scarpe · Taglia 42 · Buone
- Prezzo: 35 € — "risparmio stimato"
- ESG: CO₂: 6 kg · H₂O: 2.8k L
- Composizione: Tomaia sintetica · suola in gomma
- CTA: Contatta venditore

### Mockup chat

- Contatto: Giulia M. — Divisa Bologna FC
- Messaggio (sinistra): Ciao! La divisa è ancora disponibile?
- Messaggio (destra): Sì! Taglia M, ottime condizioni 👍
- Messaggio (sinistra): Perfetto. Ci vediamo agli allenamenti di giovedì?
- Messaggio (destra): Va benissimo, te la porto in campo.
- Input: "Scrivi un messaggio…"

### Mockup impatto (dashboard)

- Occhiello: Il risparmio generato dal riuso
- Titolo: Impatto
- Tab: La società · Il mio contributo
- Metrica 1: **CO₂ risparmiata** — 312 kg — 2.496 km in auto evitati · 104.000 ricariche smartphone
- Metrica 2: **Acqua risparmiata** — 98.000 L — 1.225 docce · 754 caffè (acqua nascosta)
- Metrica 3: **Valore risparmiato** — 1.240 €
- Nota: Equivalenze indicative · 47 scambi conclusi · metodo nel profilo
- Riga: Fonti delle equivalenze

### Mockup codice di attivazione

- Etichetta: Codice di attivazione
- Codice: DEMO-CAL (fittizio: non è un codice di accesso attivo)
- Sottotitolo: La tua società · Calcio
- Testo: Distribuiscilo ai tesserati: con questo codice accedono al marketplace del club.
- CTA: Condividi con i tesserati
