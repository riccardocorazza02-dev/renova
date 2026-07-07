# Loop — istruzioni di progetto

Loop è un **marketplace B2B2C** per società sportive: gli atleti rimettono in
circolo materiale tecnico di seconda mano e ogni articolo mostra il risparmio
ambientale (metriche ESG: CO₂ e acqua).

**Due feed** (lo sport dell'utente è fissato dal codice di accesso):
- **Feed pubblico** — articoli SENZA logo (scarpe, protezioni, accessori…)
  dello stesso sport, visibili a tutti i praticanti (per ora area di Bologna;
  in futuro regionalizzazione per provincia).
- **Feed societario** — articoli CON logo della società, visibili solo ai
  membri della stessa società e stesso sport.

Stile UI: **"Sport-Tech"** — mobile-first, sfondi bianchi/grigio chiaro,
accento **Verde Eco fluorescente** (`--color-eco`, `#10e87f`); azzurro
(`--color-water`) per il badge acqua.

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
├─ lib/          supabase.ts, database.types.ts (tipi manuali), format.ts
├─ contexts/     AuthContext.tsx — sessione + profilo (utente+società)
├─ components/   Layout (bottom-nav), ArticleCard, EsgBadge, StatoBadge,
│                ui.tsx (TextField/SelectField/PrimaryButton/banner), ...
├─ pages/        Login, Register, Feed, ArticleDetail, Upload, Chat,
│                Conversation, MieiArticoli, MieiScambi, Impatto, Profile
└─ App.tsx       routing (PublicOnly / ProtectedRoute)
supabase/migrations/  0001_init · 0002_rls · 0003_seed (storico) →
                      0004_sport_feed · 0005_rls_feed · 0006_seed_categorie ·
                      0007_harden_functions · 0008–0010 (categorie/foto) ·
                      0011_storage · 0012/0013 (chat) · 0014_scambi_recensioni ·
                      0015_impatto_fibre · 0016_categorie_macro ·
                      0017_chat_no_pulizia_scambio (modello ATTUALE).
                      setup_all.sql = tutte le migrazioni concatenate (setup da zero).
```

## Modello dati (attuale, da 0004 in poi)

- **Enum** `sport` = `'Calcio' | 'Pallavolo' | 'Basket'`. Enum `stato_articolo`
  = `'Disponibile' | 'Prenotato' | 'Scambiato'`.
- `societa` (`codice_invito` ora nullable, non più usato) ← `codici_accesso`
  (`codice` → `id_societa` + `sport`: il codice determina società E sport).
- `categorie_item` — catalogo di riferimento **globale**, una riga per
  `(sport, nome)`, con `tipo` (`individuale`/`accessorio`), `default_ha_logo`,
  impatto `co2_*`/`acqua_*` (min/tipico/max), `valore_*` (€) e `fonte`.
- `utenti` (1:1 con `auth.users`) → `id_societa` + `sport` (impostati dal
  trigger `handle_new_user` dal codice di accesso).
- `articoli` → `categorie_item` (`id_categoria`) e → `utenti`; campi
  `prezzo` (lo fissa il venditore), `ha_logo_societa` (decide il feed),
  `id_societa` + `sport` **denormalizzati e impostati dal trigger**
  `set_articolo_context`; `co2`/`acqua`/`fonte_impatto` impostati dal trigger
  `set_articolo_impatto` (il client NON li invia → non falsificabili).
- **Chat** (`0012`/`0013`): `conversazioni` (una per coppia articolo+interessato)
  + `messaggi`, con RPC `inizia_conversazione`/`segna_letto` e realtime.
- **Scambi e recensioni** (`0014`): `scambi` (registrati via `registra_scambio`,
  entrano nello storico/impatto di entrambi) + `recensioni` (via
  `lascia_recensione`, media mostrata nel profilo).
- **Fibre** (`0015`): tabella `fibre` con impatto per tipo di fibra; base del
  calcolo ESG.

L'impatto di un articolo si calcola **dalle fibre del capo** (impatto di ogni
fibra × % di composizione × peso), stima **cradle-to-gate** deterministica e
tracciabile (RPC `loop_impatto_blend`; vedi documento metodologico). Tre livelli
di affidabilità: L2 etichetta, L1 materiale indicato, L0 valore prudenziale.

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
- **Lingua**: tutta la UI e i messaggi all'utente sono in **italiano**.
- **Storage foto**: se il bucket non è configurato, l'upload degrada a un
  placeholder senza bloccare la creazione dell'articolo (vedi `Upload.tsx`).
- Se aggiorni lo schema, mantieni allineati `src/lib/database.types.ts` e le
  migrazioni in `supabase/`.

## Setup ambiente

Variabili in `.env` (vedi `.env.example`): `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_STORAGE_BUCKET`. Le istruzioni
complete di configurazione Supabase sono nel `README.md`.
Codici di accesso di test (dal seed 0006, MVP area Bologna):
`BFC-CAL` (Bologna FC · Calcio), `FORT-BSK` (Fortitudo Bologna · Basket),
`BVOL-VOL` (Bologna Volley · Pallavolo).
```
