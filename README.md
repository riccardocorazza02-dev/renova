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

### Conferma email

Per provare velocemente, su Supabase → **Authentication → Providers → Email**
disattiva *"Confirm email"*: il login è immediato dopo la registrazione.

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
