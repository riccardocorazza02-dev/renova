# Renova — istruzioni di progetto

Renova (ex «Loop») è un **marketplace B2B2C** per società sportive: gli atleti
rimettono in circolo materiale tecnico di seconda mano e ogni articolo mostra
il risparmio ambientale (metriche ESG: CO₂ e acqua). Sito: renovasport.it.

**Due feed** (lo sport dell'utente è fissato dal codice di accesso):
- **Feed pubblico** — articoli SENZA logo (scarpe, protezioni, accessori…)
  dello stesso sport, visibili a tutti i praticanti (per ora area di Bologna;
  in futuro regionalizzazione per provincia).
- **Feed societario** — articoli CON logo della società, visibili solo ai
  membri della stessa società e stesso sport.

La radice `/` è "2 in 1": landing pubblica B2B rivolta ai club per gli
anonimi, redirect al feed per gli autenticati (vedi `App.tsx`).

Stile UI: **"Sport-Tech"** — mobile-first, sfondi bianchi/grigio chiaro,
accento **Verde Eco fluorescente** (`--color-eco`, `#10e87f`); azzurro
(`--color-water`) per il badge acqua. La landing è l'unica pagina responsive
anche desktop.

## Stack

- **Vite + React 19 + TypeScript** (SPA), **Tailwind CSS v4** (config in
  `src/index.css` via `@theme`, plugin `@tailwindcss/vite` — niente
  `tailwind.config.js`).
- **Supabase** (Auth + Postgres + Storage), client in `src/lib/supabase.ts`.
- Routing: `react-router-dom` v7.
- ⚠️ TypeScript installato è **5.7** → NON usare `erasableSyntaxOnly` nei
  tsconfig (richiede 5.8+).

## Comandi

| Comando           | Cosa fa                          |
| ----------------- | -------------------------------- |
| `npm run dev`     | Dev server (http://localhost:5173) |
| `npm run build`   | Type-check + build di produzione |
| `npm run lint`    | Solo type-check (`tsc -b`)       |

Verifica sempre con `npm run build` prima di considerare un lavoro finito.

## Struttura

```
src/
├─ lib/          supabase.ts, database.types.ts (tipi manuali), format.ts,
│                taglie.ts (set taglie per tipo categoria)
├─ contexts/     AuthContext.tsx — sessione + profilo (utente+società) +
│                reset/aggiornamento password
├─ components/   Layout (bottom-nav + badge chat non lette), ArticleCard,
│                EsgBadge, StatoBadge, GestioneStato (stato + conferma
│                scambio), RecensioneScambio, Stelle, StoricoScambi,
│                MetodologiaFAQ, Logo, ui.tsx (TextField/SelectField/
│                PrimaryButton/banner), ...
├─ pages/        Landing (B2B, pubblica), Login, Register, RecuperaPassword,
│                AggiornaPassword, Feed, ArticleDetail, Upload,
│                ModificaArticolo, Chat, Conversation, MieiArticoli,
│                MieiScambi, Impatto, Profile
└─ App.tsx       routing (PublicOnly / ProtectedRoute / Home "2 in 1")
supabase/migrations/  0001_init · 0002_rls · 0003_seed (storico) →
                      0004_sport_feed · 0005_rls_feed · 0006_seed_categorie ·
                      0007_harden_functions · 0008–0010 (categorie/foto) ·
                      0011_storage · 0012/0013 (chat) · 0014_scambi_recensioni ·
                      0015_impatto_fibre · 0016_categorie_macro ·
                      0017_chat_no_pulizia_scambio ·
                      0018_semplificazione_categorie (2 macro + 14 item) ·
                      0019_rinomina_loop_renova · 0020_blend_osservati_L1 ·
                      0021_tap_scostamento_10pct ·
                      0022_rimozione_colonne_superflue ·
                      0023_eliminazione_account (modello ATTUALE).
supabase/setup_all.sql = tutte le migrazioni concatenate (setup da zero);
                      rigenerarlo quando si aggiunge una migrazione.
```

⚠️ La cronologia migrazioni del progetto REMOTO contiene alcune voci storiche
con nomi diversi dai file del repo (es. `0012_chat_revoke_anon`,
`0013_chat_pulizia_cron`, `0017_dashboard_societa` + rollback,
`rinomina_loop_renova` = 0019 del repo): lo SCHEMA risultante è allineato ai
file 0001→0022, ma non confrontare le cronologie per nome.

## Modello dati (attuale, da 0004 in poi)

- **Enum** `sport` = `'Calcio' | 'Pallavolo' | 'Basket'`. Enum `stato_articolo`
  = `'Disponibile' | 'Prenotato' | 'Scambiato'`.
- `societa` ← `codici_accesso` (`codice` → `id_societa` + `sport`: il codice
  determina società E sport; match case-insensitive).
- `categorie_item` — catalogo di riferimento **globale**: 14 voci per sport in
  2 macro-categorie (`Abbigliamento` | `Accessori`), una riga per
  `(sport, nome)`, con `tipo` (`individuale`/`accessorio`), `default_ha_logo`,
  `richiede_prezzo`, `tipo_taglia` (`calzatura`/`abbigliamento`/`unica`),
  `valore` (€, NULL se a prezzo manuale), baseline `co2_tipico`/`acqua_tipico`,
  `fonte`, e i campi del modello a fibre: `peso_kg`, `profilo_default`
  (blend L0 prudenziale) e `materiali` (opzioni del tap L0+1).
- `utenti` (1:1 con `auth.users`) → `id_societa` + `sport` (impostati dal
  trigger `handle_new_user` dal codice di accesso).
- `articoli` → `categorie_item` (`id_categoria`) e → `utenti`; campi
  `prezzo` (lo fissa il venditore), `ha_logo_societa` (decide il feed),
  `id_societa` + `sport` **denormalizzati e impostati dal trigger**
  `set_articolo_context`; `co2`/`acqua`/`fonte_impatto` impostati dal trigger
  `set_articolo_impatto` (il client NON li invia → non falsificabili);
  `composizione` (blend scelto dall'utente, NULL = stima L0),
  `foto_etichetta_url` (per la futura lettura L2), `scambiato_at`.
- **Chat** (`0012`/`0013`): `conversazioni` (una per coppia articolo+interessato)
  + `messaggi`, con RPC `inizia_conversazione`/`segna_letto` e realtime.
- **Scambi e recensioni** (`0014`): `scambi` (registrati via `registra_scambio`,
  entrano nello storico/impatto di entrambi) + `recensioni` (via
  `lascia_recensione`, media mostrata nel profilo).
- **Fibre** (`0015`): tabella `fibre` con impatto per tipo di fibra; base del
  calcolo ESG.

L'impatto di un articolo si calcola **dalle fibre del capo** (impatto di ogni
fibra × % di composizione × peso), stima **cradle-to-gate** deterministica e
tracciabile (funzione SQL `renova_impatto_blend`, richiamata dal trigger; vedi
documento metodologico). Tre livelli di affidabilità: L2 etichetta, L1
materiale indicato (tap con opzioni dai blend osservati, criterio scostamento
>10% — cfr. 0020/0021), L0 valore prudenziale («almeno»). `Upload.tsx` replica
il calcolo lato client solo per l'anteprima.

## Regole / convenzioni (IMPORTANTE)

- **Regola di business centrale (due feed)**: applicata via **RLS** in
  `0005_rls_feed.sql` (policy `articoli: feed pubblico e societario`), NON solo
  lato client. Un utente legge: (a) articoli del proprio `sport` con
  `ha_logo_societa = false` (feed pubblico, ogni società); (b) articoli del
  proprio sport e della propria società con `ha_logo_societa = true` (feed
  societario). Il client si limita a separare i due insiemi.
- La RLS è la fonte di verità per la sicurezza: il client si limita a leggere.
  Helper SQL `current_user_societa()` e `current_user_sport()`. ⚠️ Nel feed NON
  fare join su `utenti` (la sua RLS nasconde i membri di altre società e
  taglierebbe il feed pubblico): usa `societa` (lettura pubblica).
- **Registrazione**: richiede un `codice` di `codici_accesso`; il trigger
  `handle_new_user` (in `0004_sport_feed.sql`) crea la riga `utenti` con
  società + sport. Validare il codice lato client prima del signup.
- **Scambio definitivo**: lo stato `Scambiato` NON si scrive direttamente
  (trigger `set_scambiato_at` lo blocca): passa solo dalla RPC
  `registra_scambio`, che registra anche l'acquirente.
- **Eliminazione account** (`0023`, GDPR): RPC `elimina_account` — elimina
  articoli e chat, ANONIMIZZA lo storico scambi/recensioni («Utente
  eliminato», FK a NULL) e cancella l'utente da `auth.users`. Le foto le
  rimuove il CLIENT via Storage API prima della RPC (il DELETE SQL su
  storage.objects è vietato da Supabase). UI nel Profilo, logica in
  `AuthContext.deleteAccount`.
- **Conferma email**: attiva sul progetto remoto (signup → email di
  conferma; `emailRedirectTo` impostato nel signUp). ⚠️ Il servizio email
  integrato di Supabase ha un limite di poche email/ora: per l'uso reale va
  configurato un SMTP personalizzato (dashboard → Auth → SMTP).
- **Lingua**: tutta la UI e i messaggi all'utente sono in **italiano**.
- **Denominazione**: il progetto si chiama **Renova** (ex Loop). Ogni nuovo
  identificatore (funzioni SQL, classi CSS, config) usa `renova`; i riferimenti
  a «Loop» sopravvivono SOLO nei commenti delle migrazioni storiche.
- **Storage foto**: bucket pubblico `articoli`; se non configurato, l'upload
  degrada a un placeholder senza bloccare la creazione dell'articolo (vedi
  `Upload.tsx`).
- Se aggiorni lo schema, mantieni allineati `src/lib/database.types.ts`, le
  migrazioni in `supabase/` e rigenera `supabase/setup_all.sql`.

## Setup ambiente

Variabili in `.env` (vedi `.env.example`): `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_STORAGE_BUCKET`. Le istruzioni
complete di configurazione Supabase sono nel `README.md`.
Codici di accesso di test (dal seed 0006, MVP area Bologna):
`BFC-CAL` (Bologna FC · Calcio), `FORT-BSK` (Fortitudo Bologna · Basket),
`BVOL-VOL` (Bologna Volley · Pallavolo).
