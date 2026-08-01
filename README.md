# Renova 🔄 — Sport Resale & ESG

Marketplace **B2B2C** per società sportive: gli atleti scambiano materiale tecnico di
seconda mano **all'interno della propria società**, e ogni scambio mostra il
**risparmio di CO₂ e acqua** (metriche ESG).

Stile **Sport-Tech**: mobile-first, sfondi chiari, accento **Verde Eco fluorescente**.

Stack: **Vite + React + TypeScript + Tailwind CSS v4 + Supabase**.

---

## 1. Prerequisiti

- Node.js ≥ 20
- Un progetto [Supabase](https://supabase.com) (anche il piano gratuito va bene)

## 2. Setup rapido

```bash
npm install
cp .env.example .env      # poi inserisci URL e anon key del tuo progetto
npm run dev
```

Apri http://localhost:5173. Se `.env` non è compilato, l'app mostra una
schermata guida invece di crashare.

### Variabili d'ambiente (`.env`)

| Variabile                      | Dove trovarla (Supabase → Project Settings → API) |
| ------------------------------ | ------------------------------------------------- |
| `VITE_SUPABASE_URL`            | Project URL                                       |
| `VITE_SUPABASE_ANON_KEY`       | Project API key → `anon` / `publishable`          |
| `VITE_SUPABASE_STORAGE_BUCKET` | Nome bucket foto (default `articoli`)             |
| `VITE_APP_URL`                 | *(opzionale)* dominio dell'app — vedi sotto       |

### Landing e app su due domini

La landing B2B (`renovasport.it`) e l'app per i tesserati sono lo stesso
bundle: a distinguerle è **`VITE_APP_URL`** (es. `https://app.renovasport.it`).

- **Vuota** (default, e in locale): tutto come prima — «Accedi» è la rotta
  interna `/login` e la radice è la landing «2 in 1».
- **Valorizzata**: «Accedi» sulla landing apre l'app **in una nuova scheda**
  e, sul dominio dell'app, la radice porta al login/feed invece che alla
  landing.

⚠️ GitHub Pages serve **un solo dominio custom per repository**: il
sottodominio dell'app richiede quindi un **secondo repository** che pubblica
lo stesso codice. Procedura completa qui sotto.

### Pubblicare l'app su `app.renovasport.it`

Setup: dominio su **Aruba** (DNS `dns.technorail.com` & co.), `renovasport.it`
e `www` puntano a **GitHub Pages**. Restano lì per la landing; l'app va su un
secondo repo — `renova-app` — con lo **stesso codice** e lo stesso workflow: a
distinguere i due siti sono solo le *variabili di repo*.

| Variabile di repo | `renova` (landing)          | `renova-app` (app)            |
| ----------------- | --------------------------- | ----------------------------- |
| `PAGES_DOMAIN`    | *(vuota → renovasport.it)*  | `app.renovasport.it`          |
| `VITE_APP_URL`    | `https://app.renovasport.it`| `https://app.renovasport.it`  |

1. **Crea il repo** `renova-app` su GitHub (pubblico, **vuoto**: niente
   README/licenza, altrimenti il primo push va in conflitto).
2. **Collega il repo locale a entrambi**, così un solo `git push` aggiorna i
   due siti:
   ```bash
   git remote set-url --add --push origin https://github.com/riccardocorazza02-dev/renova.git
   git remote set-url --add --push origin https://github.com/riccardocorazza02-dev/renova-app.git
   git push origin main
   ```
   (per tornare indietro: `git remote set-url --delete --push origin '.*renova-app.*'`)
3. **Secrets e variabili di `renova-app`** (Settings → *Secrets and variables*
   → *Actions*):
   - tab **Secrets**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
     `VITE_SUPABASE_STORAGE_BUCKET` — gli stessi valori del repo `renova`
     (li ritrovi nel `.env` locale);
   - tab **Variables**: `PAGES_DOMAIN` = `app.renovasport.it` e
     `VITE_APP_URL` = `https://app.renovasport.it`.
4. **Attiva Pages su `renova-app`**: Settings → *Pages* → *Source* =
   **GitHub Actions**. Poi *Actions* → *Deploy su GitHub Pages* → *Run
   workflow* per la prima pubblicazione.
   ⚠️ Nella stessa pagina compila anche **Custom domain** =
   `app.renovasport.it` → *Save*. Con il deploy via GitHub Actions il file
   `CNAME` dentro l'artefatto **non basta** a registrare il dominio: senza
   questo campo GitHub risponde `404` a chi arriva dal sottodominio (il
   `CNAME` scritto dal workflow resta utile come descrizione del build e se
   un giorno si torna al deploy da branch). Dopo il *Save* parte il DNS check
   e l'emissione del certificato; quando appare, spunta **Enforce HTTPS**.
5. **DNS su Aruba**: pannello Aruba → *Gestione DNS* di `renovasport.it` →
   nuovo record **CNAME**: host `app`, valore `riccardocorazza02-dev.github.io`
   (con il punto finale se il pannello lo richiede), TTL predefinito. **Non
   toccare** i record del dominio radice e di `www`: la landing resta dov'è.
   Verifica con `dig +short app.renovasport.it`; poi su GitHub, in *Settings →
   Pages* di `renova-app`, il dominio risulta verificato e puoi spuntare
   *Enforce HTTPS* (il certificato può richiedere qualche minuto).
6. **Supabase → Authentication → URL Configuration**: *Site URL* =
   `https://app.renovasport.it` e fra i *Redirect URLs* aggiungi
   `https://app.renovasport.it/**` (i link di conferma e di recupero password
   tornano su `window.location.origin`, cioè sul dominio dove l'utente si è
   registrato). Lascia anche `http://localhost:5173/**` per le prove locali.
7. **Solo alla fine, accendi il link sulla landing**: repo `renova` → Settings
   → *Secrets and variables* → *Actions* → **Variables** → `VITE_APP_URL` =
   `https://app.renovasport.it`, poi *Actions* → *Run workflow*. Da quel
   momento «Accedi» apre l'app in una nuova scheda; finché la variabile non
   esiste resta la rotta interna, quindi nessun link rotto nel frattempo.

> Fatto questo, ogni `git push` aggiorna **entrambi** i siti: `renova`
> ricostruisce la landing, `renova-app` l'app.

*Alternativa*: lo stesso repo può essere pubblicato da Cloudflare Pages o
Netlify (build `npm run build`, output `dist`, le stesse variabili del punto
3); il fallback SPA per quegli host è già in `public/_redirects`.

## 3. Database

**Modo rapido (consigliato):** apri il **SQL Editor** di Supabase ed esegui
**un solo file**, [`supabase/setup_all.sql`](supabase/setup_all.sql): contiene
tutte le migrazioni `0001 → 0016` concatenate in ordine, quindi crea lo schema
attuale completo (società, codici di accesso, categorie, articoli + due feed,
storage foto, chat, scambi, recensioni, impatto per fibre).

**In alternativa**, esegui le singole migrazioni di `supabase/migrations/` in
ordine numerico:

1. `0001_init.sql` · `0002_rls.sql` · `0003_seed.sql` — schema storico
2. `0004_sport_feed.sql` — sport, `categorie_item`, `codici_accesso`, refactor `articoli`
3. `0005_rls_feed.sql` — RLS dei due feed (pubblico / societario)
4. `0006_seed_categorie.sql` — catalogo di riferimento + società di Bologna (MVP)
5. `0007_harden_functions.sql` — hardening funzioni `SECURITY DEFINER`
6. `0008`…`0010` — categorie (prezzo/taglia), foto multiple, valore unico
7. `0011_storage.sql` — bucket `articoli` + policy storage (foto)
8. `0012_chat.sql` · `0013_chat_foto_pulizia.sql` — chat (conversazioni, messaggi, pulizia)
9. `0014_scambi_recensioni.sql` — scambi conclusi + recensioni tra utenti
10. `0015_impatto_fibre.sql` — impatto ESG per fibre/blend (cradle-to-gate)
11. `0016_categorie_macro.sql` — raggruppamento macro-categorie

> ⚠️ Se modifichi una migrazione, rigenera `setup_all.sql` concatenando di nuovo
> i file di `migrations/` in ordine numerico.

Dopo il seed puoi registrarti con uno di questi **codici di accesso** (il
codice determina società **e** sport del tuo feed):

| Società            | Provincia | Codice      | Sport     |
| ------------------ | --------- | ----------- | --------- |
| Bologna FC         | BO        | `BFC-CAL`   | Calcio    |
| Fortitudo Bologna  | BO        | `FORT-BSK`  | Basket    |
| Bologna Volley     | BO        | `BVOL-VOL`  | Pallavolo |

> Per l'MVP c'è una società per sport. Registrandoti con `BFC-CAL`, nel **feed
> pubblico** vedi gli articoli senza logo del tuo sport (Calcio); nel **feed
> societario** solo quelli con logo della tua società — le due regole di
> business in azione.

### Conferma email (attiva) e invio SMTP

L'account va **attivato dal link ricevuto via email** prima di poter accedere:
`Register.tsx` lo dichiara prima del signup e mostra poi la schermata
«Attiva il tuo account» con il pulsante di reinvio; il login intercetta
`email not confirmed` e offre lo stesso reinvio.

⚠️ L'invio usa per default il servizio integrato di Supabase
(`noreply@mail.app.supabase.io`): **poche email/ora**, nessun controllo sulla
deliverability e — da documentazione — la consegna può essere limitata ai soli
indirizzi membri del team del progetto (*"Email address not authorized"*).
Non è adatto alla produzione: serve un **SMTP personalizzato**.

1. Su [Resend](https://resend.com) → **Domains** → aggiungi `renovasport.it` e
   inserisci i record DNS (SPF/DKIM) forniti; attendi la verifica.
2. Resend → **API Keys** → crea una key (permesso *Sending access*).
3. Supabase → **Authentication → Emails → SMTP Settings** → *Enable custom SMTP*:
   host `smtp.resend.com`, porta `465`, user `resend`, password = la API key,
   sender `no-reply@renovasport.it`, sender name `Renova`.
4. Supabase → **Authentication → Rate Limits**: alza *Emails per hour* (di
   default il nuovo SMTP parte a 30/h).
5. Supabase → **Authentication → URL Configuration**: `Site URL`
   `https://renovasport.it` e fra i *Redirect URLs* anche
   `http://localhost:5173/**` (il link di conferma torna su
   `window.location.origin`, quindi il dominio usato in fase di test va
   autorizzato).

Alternativa solo per prove locali: **Authentication → Providers → Email** →
disattiva *"Confirm email"* (il login diventa immediato; `signUp` restituisce
`sessione-attiva` e la UI porta direttamente al feed).

> Se un account resta bloccato senza email, si attiva a mano con
> `update auth.users set email_confirmed_at = now() where email = '…';`.

⚠️ **Email già registrata**: Supabase risponde `200` con un utente "offuscato"
e **non invia nessuna email** (anti-enumerazione). `signUp` rileva il caso
(`identities` vuoto) e lo dice all'utente: senza quel controllo si resta ad
aspettare una mail che non arriverà. Se hai cancellato gli account di prova
dalle tabelle `public.*`, ricordati che le righe in `auth.users` **restano**:
va eliminato l'utente da Authentication → Users (o con la RPC
`elimina_account`).

## 4. Storage foto

La migrazione `0011_storage.sql` crea il bucket pubblico `articoli` e le policy
(lettura pubblica + upload/modifica/cancellazione nella propria cartella): dopo
averla eseguita l'upload delle foto funziona e le immagini si vedono nel feed.

Se il bucket non esiste l'upload degrada in modo controllato a un'immagine
segnaposto, senza bloccare la creazione dell'articolo.

---

## Architettura

```
src/
├─ lib/
│  ├─ supabase.ts        Client Supabase + flag di configurazione
│  ├─ database.types.ts  Tipi TS dello schema
│  └─ format.ts          Formattazione prezzi / CO₂ / acqua + placeholder
├─ contexts/
│  └─ AuthContext.tsx    Sessione + profilo (utente con società) + signIn/up/out
├─ components/           Layout, ArticleCard, EsgBadge, UI kit, ...
└─ pages/
   ├─ Login.tsx / Register.tsx   Auth (registrazione con codice di accesso)
   ├─ Feed.tsx                   Marketplace: feed Pubblico + Societario (ricerca + filtri)
   ├─ ArticleDetail.tsx          Dettaglio articolo, impatto, avvio chat / gestione stato
   ├─ Upload.tsx                 Form nuovo articolo (categorie del proprio sport)
   ├─ Chat.tsx / Conversation.tsx  Messaggistica realtime tra utenti
   ├─ MieiArticoli.tsx           Articoli caricati dall'utente + loro stato
   ├─ MieiScambi.tsx             Storico degli scambi conclusi
   ├─ Impatto.tsx                Dashboard ESG + metodologia anti-greenwashing
   └─ Profile.tsx                Dati utente, contributo ESG, recensioni, logout
```

### Modello dati

`societa` ← `codici_accesso` (codice → società + sport); `categorie_item`
(catalogo di riferimento globale per `(sport, nome)` con impatto ESG e valore);
`fibre` (impatto per tipo di fibra, base del calcolo cradle-to-gate); `utenti`
(1:1 con `auth.users`, con `sport`); `articoli` (→ `categorie_item`, → `utenti`;
`id_societa`/`sport`/impatto impostati da trigger). La messaggistica usa
`conversazioni` + `messaggi`; gli scambi conclusi `scambi` + `recensioni`. RPC
principali: `inizia_conversazione`, `registra_scambio`, `lascia_recensione`,
`impatto_societa`.

### Le regole di business (due feed)

Un utente legge **solo**: (a) gli articoli del proprio sport **senza logo**
(feed pubblico, ogni società); (b) gli articoli del proprio sport e della
propria società **con logo** (feed societario). Applicate **a livello di
database** dalla RLS policy `articoli: feed pubblico e societario`
(`0005_rls_feed.sql`): impossibile aggirarle dal client. Il feed (`Feed.tsx`)
si limita a leggere e a separare i due insiemi.

## Script

| Comando           | Cosa fa                          |
| ----------------- | -------------------------------- |
| `npm run dev`     | Dev server Vite                  |
| `npm run build`   | Type-check + build di produzione |
| `npm run preview` | Anteprima della build            |
| `npm run lint`    | Solo type-check TypeScript       |
```
