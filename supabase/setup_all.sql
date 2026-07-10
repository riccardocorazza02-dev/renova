-- ════════════════════════════════════════════════════════════════
-- Loop · setup_all.sql — Schema COMPLETO (migrazioni 0001 → 0018)
-- ════════════════════════════════════════════════════════════════
-- File generato concatenando, in ordine, tutte le migrazioni di
-- `supabase/migrations/`. Eseguilo UNA volta nel SQL Editor di un
-- progetto Supabase pulito per ottenere lo schema attuale completo:
-- società/codici di accesso, categorie, articoli + due feed (RLS),
-- storage foto, chat, scambi, recensioni e impatto per fibre.
--
-- Idempotente sul fresh DB (i tipi enum sono guardati). Per ricreare
-- da zero, ripristina il progetto o esegui in un progetto vuoto.
-- Se modifichi una migrazione, rigenera questo file concatenando di
-- nuovo `migrations/*.sql` in ordine numerico.
-- ════════════════════════════════════════════════════════════════


-- ========================================================================
-- >>> migrations/0001_init.sql
-- ========================================================================

-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0001 — Schema iniziale
-- ════════════════════════════════════════════════════════════════
-- Marketplace B2B2C per lo scambio di materiale tecnico sportivo di
-- seconda mano tra utenti della stessa società, con metriche ESG.
--
-- Esegui nel SQL Editor di Supabase (o `supabase db push`) nell'ordine:
--   0001_init.sql → 0002_rls.sql → 0003_seed.sql
-- ════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. societa — l'organizzazione sportiva (il "B" del B2B2C)
-- ─────────────────────────────────────────────
create table if not exists public.societa (
  id            bigint generated always as identity primary key,
  nome          text   not null,
  provincia     text   not null,
  -- codice usato dagli utenti in fase di registrazione per associarsi
  codice_invito text   not null unique,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 2. metriche_esg — categorie di materiale con il loro impatto ambientale
--    (valori di risparmio "tipici" per un articolo di quella categoria)
-- ─────────────────────────────────────────────
create table if not exists public.metriche_esg (
  id                     bigint generated always as identity primary key,
  nome_categoria         text    not null unique,
  co2_risparmiata_kg     numeric(10,2) not null default 0,
  acqua_risparmiata_litri numeric(10,2) not null default 0
);

-- ─────────────────────────────────────────────
-- 3. catalogo_societa — quali categorie una società offre, e a che prezzo
-- ─────────────────────────────────────────────
create table if not exists public.catalogo_societa (
  id             bigint generated always as identity primary key,
  id_societa     bigint not null references public.societa(id)      on delete cascade,
  id_metrica     bigint not null references public.metriche_esg(id) on delete restrict,
  prezzo_societa numeric(10,2) not null default 0,
  unique (id_societa, id_metrica)
);

-- ─────────────────────────────────────────────
-- 4. utenti — profilo applicativo, 1:1 con auth.users
-- ─────────────────────────────────────────────
create table if not exists public.utenti (
  id            uuid primary key references auth.users(id) on delete cascade,
  nome_completo text   not null,
  id_societa    bigint not null references public.societa(id) on delete restrict,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 5. articoli — l'oggetto messo in vendita/scambio
-- ─────────────────────────────────────────────
create type public.stato_articolo as enum ('Disponibile', 'Prenotato', 'Scambiato');

create table if not exists public.articoli (
  id          bigint generated always as identity primary key,
  titolo      text   not null,
  taglia      text,
  foto_url    text,
  id_catalogo bigint not null references public.catalogo_societa(id) on delete restrict,
  stato       public.stato_articolo not null default 'Disponibile',
  id_utente   uuid   not null references public.utenti(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Indici per le query del feed
create index if not exists idx_articoli_utente   on public.articoli (id_utente);
create index if not exists idx_articoli_catalogo on public.articoli (id_catalogo);
create index if not exists idx_articoli_stato    on public.articoli (stato);
create index if not exists idx_catalogo_societa  on public.catalogo_societa (id_societa);
create index if not exists idx_utenti_societa    on public.utenti (id_societa);

-- ─────────────────────────────────────────────
-- Helper: id_societa dell'utente loggato.
-- SECURITY DEFINER così è utilizzabile dentro le RLS policy senza
-- ricorsione e senza esporre la tabella utenti.
-- ─────────────────────────────────────────────
create or replace function public.current_user_societa()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select id_societa from public.utenti where id = auth.uid();
$$;

-- ─────────────────────────────────────────────
-- Trigger di registrazione: alla creazione di un utente in auth.users
-- crea il profilo in public.utenti associandolo alla società tramite
-- il codice invito passato nei metadati di signUp.
-- ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_societa_id bigint;
  v_codice     text;
  v_nome       text;
begin
  v_codice := nullif(trim(new.raw_user_meta_data->>'codice_societa'), '');
  v_nome   := coalesce(nullif(trim(new.raw_user_meta_data->>'nome_completo'), ''), split_part(new.email, '@', 1));

  select id into v_societa_id
  from public.societa
  where upper(codice_invito) = upper(v_codice);

  if v_societa_id is null then
    raise exception 'Codice società non valido: %', coalesce(v_codice, '(vuoto)')
      using errcode = '23514';
  end if;

  insert into public.utenti (id, nome_completo, id_societa)
  values (new.id, v_nome, v_societa_id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ========================================================================
-- >>> migrations/0002_rls.sql
-- ========================================================================

-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0002 — Row Level Security
-- ════════════════════════════════════════════════════════════════
-- La REGOLA DI BUSINESS centrale ("un utente vede solo gli articoli
-- della propria società") è applicata qui a livello di database, così
-- è impossibile aggirarla dal client.
-- ════════════════════════════════════════════════════════════════

alter table public.societa         enable row level security;
alter table public.metriche_esg    enable row level security;
alter table public.catalogo_societa enable row level security;
alter table public.utenti          enable row level security;
alter table public.articoli        enable row level security;

-- ─────────────────────────────────────────────
-- societa
-- Lettura pubblica (serve a validare il codice invito PRIMA del login).
-- Nessuna scrittura dal client: le società le gestisce l'admin.
-- ─────────────────────────────────────────────
drop policy if exists "societa: lettura pubblica" on public.societa;
create policy "societa: lettura pubblica"
  on public.societa for select
  to anon, authenticated
  using (true);

-- ─────────────────────────────────────────────
-- metriche_esg — dati di riferimento, lettura per utenti autenticati
-- ─────────────────────────────────────────────
drop policy if exists "metriche: lettura autenticati" on public.metriche_esg;
create policy "metriche: lettura autenticati"
  on public.metriche_esg for select
  to authenticated
  using (true);

-- ─────────────────────────────────────────────
-- catalogo_societa — l'utente vede solo il catalogo della SUA società
-- ─────────────────────────────────────────────
drop policy if exists "catalogo: solo propria societa" on public.catalogo_societa;
create policy "catalogo: solo propria societa"
  on public.catalogo_societa for select
  to authenticated
  using (id_societa = public.current_user_societa());

-- ─────────────────────────────────────────────
-- utenti
--   • lettura: il proprio profilo + i membri della propria società
--   • update: solo il proprio profilo
--   (l'insert avviene via trigger handle_new_user, SECURITY DEFINER)
-- ─────────────────────────────────────────────
drop policy if exists "utenti: lettura stessa societa" on public.utenti;
create policy "utenti: lettura stessa societa"
  on public.utenti for select
  to authenticated
  using (id = auth.uid() or id_societa = public.current_user_societa());

drop policy if exists "utenti: update proprio profilo" on public.utenti;
create policy "utenti: update proprio profilo"
  on public.utenti for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ─────────────────────────────────────────────
-- articoli — il cuore della regola di business
--   • SELECT: visibili solo gli articoli il cui PROPRIETARIO appartiene
--             alla mia stessa società.
--   • INSERT: posso creare solo articoli a mio nome e su una voce di
--             catalogo della mia società.
--   • UPDATE/DELETE: solo i miei articoli.
-- ─────────────────────────────────────────────
drop policy if exists "articoli: lettura propria societa" on public.articoli;
create policy "articoli: lettura propria societa"
  on public.articoli for select
  to authenticated
  using (
    exists (
      select 1 from public.utenti u
      where u.id = articoli.id_utente
        and u.id_societa = public.current_user_societa()
    )
  );

drop policy if exists "articoli: inserimento proprio" on public.articoli;
create policy "articoli: inserimento proprio"
  on public.articoli for insert
  to authenticated
  with check (
    id_utente = auth.uid()
    and exists (
      select 1 from public.catalogo_societa c
      where c.id = id_catalogo
        and c.id_societa = public.current_user_societa()
    )
  );

drop policy if exists "articoli: update proprio" on public.articoli;
create policy "articoli: update proprio"
  on public.articoli for update
  to authenticated
  using (id_utente = auth.uid())
  with check (id_utente = auth.uid());

drop policy if exists "articoli: delete proprio" on public.articoli;
create policy "articoli: delete proprio"
  on public.articoli for delete
  to authenticated
  using (id_utente = auth.uid());

-- ─────────────────────────────────────────────
-- Storage: bucket pubblico in lettura per le foto degli articoli.
-- Esegui solo se hai creato il bucket "articoli" (vedi README).
-- ─────────────────────────────────────────────
-- insert into storage.buckets (id, name, public)
-- values ('articoli', 'articoli', true)
-- on conflict (id) do nothing;
--
-- drop policy if exists "articoli storage: lettura pubblica" on storage.objects;
-- create policy "articoli storage: lettura pubblica"
--   on storage.objects for select
--   using (bucket_id = 'articoli');
--
-- drop policy if exists "articoli storage: upload autenticati" on storage.objects;
-- create policy "articoli storage: upload autenticati"
--   on storage.objects for insert to authenticated
--   with check (bucket_id = 'articoli');


-- ========================================================================
-- >>> migrations/0003_seed.sql
-- ========================================================================

-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0003 — Dati di esempio (seed) [STORICO]
-- ════════════════════════════════════════════════════════════════
-- ⚠️ STORICO: questo seed appartiene al modello pre-sport. Le tabelle
-- `metriche_esg` e `catalogo_societa` vengono rimosse dalla 0004, e le
-- società/codici dell'MVP sono ora definiti nella 0006_seed_categorie.
-- Resta solo il seed delle metriche di base, per chi si ferma a 0003.
-- ════════════════════════════════════════════════════════════════

-- Metriche ESG (categorie di materiale + impatto ambientale tipico)
insert into public.metriche_esg (nome_categoria, co2_risparmiata_kg, acqua_risparmiata_litri) values
  ('Scarpe da running',  9.50,  4200),
  ('Maglia tecnica',     5.20,  2700),
  ('Pantaloncini',       3.80,  1900),
  ('Giacca antivento',  12.40,  6100),
  ('Borsa / Zaino',      7.10,  3300),
  ('Accessori (cuffia, guanti)', 1.90, 900)
on conflict (nome_categoria) do nothing;

-- NB: le società dell'MVP (Bologna FC · Fortitudo Bologna · Bologna Volley)
-- e i relativi codici di accesso sono nella migrazione 0006_seed_categorie.


-- ========================================================================
-- >>> migrations/0004_sport_feed.sql
-- ========================================================================

-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0004 — Sport, feed pubblico/societario, impatto
-- ════════════════════════════════════════════════════════════════
-- Introduce:
--   • la dimensione SPORT (Calcio/Pallavolo/Basket);
--   • il catalogo GLOBALE di riferimento `categorie_item` (impatto ESG
--     min/tipico/max + valore economico), keyed per (sport, nome);
--   • i `codici_accesso`: ogni codice porta SOCIETÀ + SPORT, così la
--     registrazione fa atterrare l'utente nel feed del proprio sport;
--   • la rifattorizzazione di `articoli`: ora puntano a `categorie_item`,
--     hanno un prezzo impostato dal venditore e un flag `ha_logo_societa`
--     che decide il feed (pubblico vs societario).
--
-- Le vecchie tabelle `metriche_esg` e `catalogo_societa` vengono rimosse
-- (articoli è ancora vuoto: nessuna perdita di dati).
-- ════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. Enum SPORT
-- ─────────────────────────────────────────────
do $$ begin
  create type public.sport as enum ('Calcio', 'Pallavolo', 'Basket');
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────
-- 2. categorie_item — catalogo di riferimento GLOBALE
--    Una riga per (sport, categoria). Contiene l'impatto ambientale
--    "risparmiato" dal riuso (min/tipico/max) e il valore economico
--    indicativo. L'articolo eredita il valore TIPICO della sua categoria.
-- ─────────────────────────────────────────────
create table if not exists public.categorie_item (
  id              bigint generated always as identity primary key,
  sport           public.sport not null,
  nome            text not null,
  tipo            text not null check (tipo in ('individuale', 'accessorio')),
  -- default proposto per il toggle "ha il logo della società?" in fase di upload
  default_ha_logo boolean not null default false,
  co2_min         numeric(10,2) not null default 0,
  co2_tipico      numeric(10,2) not null default 0,
  co2_max         numeric(10,2) not null default 0,
  acqua_min       numeric(10,2) not null default 0,
  acqua_tipico    numeric(10,2) not null default 0,
  acqua_max       numeric(10,2) not null default 0,
  valore_min      numeric(10,2) not null default 0,
  valore_max      numeric(10,2) not null default 0,
  fonte           text not null default 'Stima Loop (cradle-to-gate). Fonti: MIT (2013) per le calzature; WWF/Water Footprint Network per il cotone; fattori LCA poliestere/nylon. Vedi documento metodologico.',
  unique (sport, nome)
);

-- ─────────────────────────────────────────────
-- 3. codici_accesso — il codice porta SOCIETÀ + SPORT
--    Una società può avere più codici (es. polisportiva calcio E basket).
-- ─────────────────────────────────────────────
create table if not exists public.codici_accesso (
  id          bigint generated always as identity primary key,
  codice      text   not null unique,
  id_societa  bigint not null references public.societa(id) on delete cascade,
  sport       public.sport not null,
  created_at  timestamptz not null default now()
);

-- `societa.codice_invito` non è più il meccanismo primario: lo rendiamo
-- opzionale (i codici vivono in `codici_accesso`).
alter table public.societa alter column codice_invito drop not null;

-- ─────────────────────────────────────────────
-- 4. utenti — aggiungiamo lo SPORT (impostato dal codice in fase di signup)
-- ─────────────────────────────────────────────
alter table public.utenti add column if not exists sport public.sport;
-- backfill dell'eventuale utente di test preesistente
update public.utenti set sport = 'Calcio' where sport is null;
alter table public.utenti alter column sport set not null;

-- ─────────────────────────────────────────────
-- 5. Rifattorizzazione di `articoli`
--    Rimuoviamo il legame al vecchio catalogo_societa e aggiungiamo:
--    id_categoria (→ catalogo globale), prezzo, ha_logo_societa, e i campi
--    denormalizzati id_societa + sport (popolati da trigger, non dal client).
-- ─────────────────────────────────────────────
drop table if exists public.catalogo_societa cascade;  -- rimuove anche la FK articoli.id_catalogo
drop table if exists public.metriche_esg cascade;

alter table public.articoli drop column if exists id_catalogo;

alter table public.articoli
  add column if not exists id_categoria    bigint references public.categorie_item(id) on delete restrict,
  add column if not exists prezzo          numeric(10,2) not null default 0,
  add column if not exists ha_logo_societa boolean not null default false,
  add column if not exists id_societa      bigint references public.societa(id) on delete restrict,
  add column if not exists sport           public.sport;

-- Con 0 righe possiamo imporre i NOT NULL: i campi denormalizzati vengono
-- popolati dal trigger BEFORE INSERT (eseguito prima del controllo vincoli).
alter table public.articoli alter column id_categoria set not null;
alter table public.articoli alter column id_societa   set not null;
alter table public.articoli alter column sport        set not null;

-- ─────────────────────────────────────────────
-- 6. Helper per le RLS
-- ─────────────────────────────────────────────
create or replace function public.current_user_sport()
returns public.sport
language sql stable security definer set search_path = public
as $$
  select sport from public.utenti where id = auth.uid();
$$;

-- ─────────────────────────────────────────────
-- 7. Trigger: popola id_societa + sport dell'articolo dal profilo utente.
--    Il client invia solo titolo/taglia/foto/categoria/prezzo/logo: società
--    e sport NON sono falsificabili.
-- ─────────────────────────────────────────────
create or replace function public.set_articolo_context()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  select u.id_societa, u.sport
    into new.id_societa, new.sport
  from public.utenti u
  where u.id = new.id_utente;
  return new;
end;
$$;

drop trigger if exists trg_set_articolo_context on public.articoli;
create trigger trg_set_articolo_context
  before insert on public.articoli
  for each row execute function public.set_articolo_context();

-- ─────────────────────────────────────────────
-- 8. Registrazione: il trigger ora risolve SOCIETÀ + SPORT dal codice
--    cercando in `codici_accesso`.
-- ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_societa_id bigint;
  v_sport      public.sport;
  v_codice     text;
  v_nome       text;
begin
  v_codice := nullif(trim(new.raw_user_meta_data->>'codice_societa'), '');
  v_nome   := coalesce(nullif(trim(new.raw_user_meta_data->>'nome_completo'), ''), split_part(new.email, '@', 1));

  select c.id_societa, c.sport
    into v_societa_id, v_sport
  from public.codici_accesso c
  where upper(c.codice) = upper(v_codice);

  if v_societa_id is null then
    raise exception 'Codice di accesso non valido: %', coalesce(v_codice, '(vuoto)')
      using errcode = '23514';
  end if;

  insert into public.utenti (id, nome_completo, id_societa, sport)
  values (new.id, v_nome, v_societa_id, v_sport);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────
-- 9. Indici
-- ─────────────────────────────────────────────
create index if not exists idx_articoli_feed     on public.articoli (sport, ha_logo_societa);
create index if not exists idx_articoli_societa   on public.articoli (id_societa);
create index if not exists idx_articoli_categoria on public.articoli (id_categoria);
create index if not exists idx_articoli_utente    on public.articoli (id_utente);
create index if not exists idx_categorie_sport    on public.categorie_item (sport);
create index if not exists idx_codici_societa     on public.codici_accesso (id_societa);


-- ========================================================================
-- >>> migrations/0005_rls_feed.sql
-- ========================================================================

-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0005 — Row Level Security per i due feed
-- ════════════════════════════════════════════════════════════════
-- REGOLE DI BUSINESS (applicate nel DB, non solo lato client):
--
--   • FEED PUBBLICO: un utente vede tutti gli articoli SENZA logo
--     (ha_logo_societa = false) del PROPRIO sport, indipendentemente
--     dalla società del proprietario. (Per ora nessun filtro regionale:
--     in fase di avvio gli utenti sono tutti su Bologna; la
--     regionalizzazione si aggiungerà filtrando per provincia.)
--
--   • FEED SOCIETARIO: un utente vede gli articoli CON logo
--     (ha_logo_societa = true) solo se appartengono alla SUA società
--     e al SUO sport (non avrebbe senso vedere la maglia di un'altra
--     società).
-- ════════════════════════════════════════════════════════════════

alter table public.categorie_item enable row level security;
alter table public.codici_accesso enable row level security;

-- ─────────────────────────────────────────────
-- categorie_item — dati di riferimento, lettura per autenticati
-- ─────────────────────────────────────────────
drop policy if exists "categorie: lettura autenticati" on public.categorie_item;
create policy "categorie: lettura autenticati"
  on public.categorie_item for select
  to authenticated
  using (true);

-- ─────────────────────────────────────────────
-- codici_accesso — lettura pubblica (serve a validare il codice PRIMA
-- del signup e a mostrare lo sport associato). Nessuna scrittura dal client.
-- ─────────────────────────────────────────────
drop policy if exists "codici: lettura pubblica" on public.codici_accesso;
create policy "codici: lettura pubblica"
  on public.codici_accesso for select
  to anon, authenticated
  using (true);

-- ─────────────────────────────────────────────
-- articoli — il cuore della nuova logica a due feed
-- ─────────────────────────────────────────────
drop policy if exists "articoli: lettura propria societa" on public.articoli;
drop policy if exists "articoli: feed pubblico e societario" on public.articoli;
create policy "articoli: feed pubblico e societario"
  on public.articoli for select
  to authenticated
  using (
    -- Feed pubblico: stesso sport, senza logo
    (sport = public.current_user_sport() and ha_logo_societa = false)
    or
    -- Feed societario: stesso sport, stessa società, con logo
    (
      sport = public.current_user_sport()
      and id_societa = public.current_user_societa()
      and ha_logo_societa = true
    )
  );

-- INSERT: posso creare solo articoli a mio nome. società e sport vengono
-- impostati dal trigger set_articolo_context dal mio profilo, quindi non
-- sono falsificabili dal client.
drop policy if exists "articoli: inserimento proprio" on public.articoli;
create policy "articoli: inserimento proprio"
  on public.articoli for insert
  to authenticated
  with check (id_utente = auth.uid());

-- UPDATE / DELETE: solo i miei articoli
drop policy if exists "articoli: update proprio" on public.articoli;
create policy "articoli: update proprio"
  on public.articoli for update
  to authenticated
  using (id_utente = auth.uid())
  with check (id_utente = auth.uid());

drop policy if exists "articoli: delete proprio" on public.articoli;
create policy "articoli: delete proprio"
  on public.articoli for delete
  to authenticated
  using (id_utente = auth.uid());


-- ========================================================================
-- >>> migrations/0006_seed_categorie.sql
-- ========================================================================

-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0006 — Seed: categorie di riferimento + società BO
-- ════════════════════════════════════════════════════════════════
-- Le categorie ricalcano le tre liste del documento metodologico.
-- co2_tipico / acqua_tipico = punto medio dell'intervallo min–max.
-- `valore_min/max` = prezzo indicativo (il venditore fissa poi il suo).
-- `default_ha_logo` = true per i capi tipicamente "sociali" (maglia,
-- tuta, felpa, giacca, pantaloncini gara), false per calzature,
-- protezioni e accessori. È solo un default: l'utente può cambiarlo.
--
-- CODICI DI ACCESSO (per la registrazione, MVP su Bologna):
--   • Bologna FC        → BFC-CAL  (Calcio)
--   • Fortitudo Bologna → FORT-BSK (Basket)
--   • Bologna Volley    → BVOL-VOL (Pallavolo)
-- ════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- CATEGORIE DI RIFERIMENTO
-- col: sport, nome, tipo, default_ha_logo,
--      co2_min, co2_tipico, co2_max, acqua_min, acqua_tipico, acqua_max,
--      valore_min, valore_max
-- ─────────────────────────────────────────────
insert into public.categorie_item
  (sport, nome, tipo, default_ha_logo,
   co2_min, co2_tipico, co2_max, acqua_min, acqua_tipico, acqua_max, valore_min, valore_max)
values
  -- ══════════ CALCIO ══════════
  ('Calcio','Scarpe da calcio (tacchetti)','individuale',false,  8,11,14,  500,1250,2000,  25,80),
  ('Calcio','Parastinchi','individuale',false,                   1,1.5,2,  10,30,50,        5,20),
  ('Calcio','Calzettoni da calcio','individuale',false,          1,1.5,2,  300,500,700,     5,15),
  ('Calcio','Pantaloncini da allenamento','individuale',true,    2,3,4,    50,75,100,       8,30),
  ('Calcio','Maglia / t-shirt tecnica','individuale',true,       2,3,4,    50,75,100,       8,25),
  ('Calcio','Felpa sportiva','individuale',true,                 6,8,10,   2500,3500,4500,  18,45),
  ('Calcio','Pantaloni della tuta','individuale',true,           5,6.5,8,  2000,3000,4000,  15,35),
  ('Calcio','Giacca sportiva','individuale',true,                5,6.5,8,  100,200,300,     20,50),
  ('Calcio','K-way / giacca antipioggia','individuale',true,     3,4.5,6,  50,125,200,      12,35),
  ('Calcio','Guanti da portiere','individuale',false,            2,3,4,    100,200,300,     15,40),
  ('Calcio','Zaino sportivo','accessorio',false,                 6,9,12,   100,300,500,     15,40),
  ('Calcio','Borsone sportivo','accessorio',false,               8,11.5,15,150,375,600,     20,50),
  ('Calcio','Borraccia','accessorio',false,                      1,2,3,    50,125,200,      3,10),
  ('Calcio','Fascia tergisudore da polso','accessorio',false,    0.3,0.55,0.8, 50,100,150,  3,8),
  ('Calcio','Fascia per capelli','accessorio',false,             0.2,0.4,0.6,  30,65,100,   3,8),
  ('Calcio','Cavigliere','accessorio',false,                     1,1.5,2,  50,125,200,      6,20),
  ('Calcio','Gambali / manicotti gamba','accessorio',false,      1,1.75,2.5,50,100,150,     8,25),
  ('Calcio','Manicotti braccio','accessorio',false,              0.8,1.15,1.5,30,75,120,    6,18),
  ('Calcio','Berretto / cuffia','accessorio',false,              1,1.5,2,  200,400,600,     8,20),

  -- ══════════ PALLAVOLO ══════════
  ('Pallavolo','Scarpe da pallavolo (indoor)','individuale',false,10,12.5,15, 500,1250,2000, 35,90),
  ('Pallavolo','Ginocchiere','individuale',false,                2,3,4,    50,125,200,      10,30),
  ('Pallavolo','Maglia / t-shirt tecnica','individuale',true,    2,3,4,    50,75,100,       8,25),
  ('Pallavolo','Pantaloncini da gioco','individuale',true,       2,3,4,    50,75,100,       8,30),
  ('Pallavolo','Calzini sportivi','individuale',false,           1,1.5,2,  300,500,700,     5,15),
  ('Pallavolo','Felpa sportiva','individuale',true,              6,8,10,   2500,3500,4500,  18,45),
  ('Pallavolo','Pantaloni della tuta','individuale',true,        5,6.5,8,  2000,3000,4000,  15,35),
  ('Pallavolo','Giacca sportiva','individuale',true,             5,6.5,8,  100,200,300,     20,50),
  ('Pallavolo','K-way / giacca leggera','individuale',true,      3,4.5,6,  50,125,200,      12,35),
  ('Pallavolo','Zaino sportivo','accessorio',false,              6,9,12,   100,300,500,     15,40),
  ('Pallavolo','Borsone sportivo','accessorio',false,            8,11.5,15,150,375,600,     20,50),
  ('Pallavolo','Borraccia','accessorio',false,                   1,2,3,    50,125,200,      3,10),
  ('Pallavolo','Cavigliere','accessorio',false,                  1,1.5,2,  50,125,200,      6,20),
  ('Pallavolo','Gomitiere','accessorio',false,                   1.5,2.25,3,50,125,200,     8,25),
  ('Pallavolo','Fascia tergisudore da polso','accessorio',false, 0.3,0.55,0.8, 50,100,150,  3,8),
  ('Pallavolo','Manicotti braccio','accessorio',false,           0.8,1.15,1.5,30,75,120,    6,18),
  ('Pallavolo','Fascia per capelli','accessorio',false,          0.2,0.4,0.6,  30,65,100,   3,8),

  -- ══════════ BASKET ══════════
  ('Basket','Scarpe da basket','individuale',false,              12,14,16, 500,1250,2000,   40,110),
  ('Basket','Canotta / maglia tecnica','individuale',true,       2,3,4,    50,75,100,       10,25),
  ('Basket','Pantaloncini da basket','individuale',true,         2,3,4,    50,75,100,       12,30),
  ('Basket','Calzini da basket','individuale',false,             1,1.5,2,  300,500,700,     6,15),
  ('Basket','Felpa sportiva','individuale',true,                 6,8,10,   2500,3500,4500,  18,45),
  ('Basket','Pantaloni della tuta','individuale',true,           5,6.5,8,  2000,3000,4000,  15,35),
  ('Basket','Giacca sportiva','individuale',true,                5,6.5,8,  100,200,300,     20,50),
  ('Basket','K-way / giacca','individuale',true,                 3,4.5,6,  50,125,200,      12,35),
  ('Basket','Zaino sportivo','accessorio',false,                 6,9,12,   100,300,500,     15,40),
  ('Basket','Borsone sportivo','accessorio',false,               8,11.5,15,150,375,600,     20,50),
  ('Basket','Borraccia','accessorio',false,                      1,2,3,    50,125,200,      3,10),
  ('Basket','Ginocchiere','accessorio',false,                    2,3,4,    50,125,200,      8,30),
  ('Basket','Gomitiere','accessorio',false,                      1.5,2.25,3,50,125,200,     8,25),
  ('Basket','Cavigliere','accessorio',false,                     1,1.5,2,  50,125,200,      6,20),
  ('Basket','Gambali / manicotti gamba','accessorio',false,      1,1.75,2.5,50,100,150,     8,25),
  ('Basket','Manicotti braccio (shooting sleeve)','accessorio',false, 0.8,1.15,1.5,30,75,120, 6,18),
  ('Basket','Fascia tergisudore da polso','accessorio',false,    0.3,0.55,0.8, 50,100,150,  3,8),
  ('Basket','Fascia per capelli','accessorio',false,             0.2,0.4,0.6,  30,65,100,   3,8)
on conflict (sport, nome) do nothing;

-- ─────────────────────────────────────────────
-- SOCIETÀ (Bologna) — MVP: una società per sport
-- ─────────────────────────────────────────────
insert into public.societa (nome, provincia, codice_invito) values
  ('Bologna FC',        'BO', null),
  ('Fortitudo Bologna', 'BO', null),
  ('Bologna Volley',    'BO', null)
on conflict do nothing;

-- ─────────────────────────────────────────────
-- CODICI DI ACCESSO (codice → società + sport)
-- ─────────────────────────────────────────────
insert into public.codici_accesso (codice, id_societa, sport)
select v.codice, s.id, v.sport::public.sport
from (values
  ('BFC-CAL',  'Bologna FC',        'Calcio'),
  ('FORT-BSK', 'Fortitudo Bologna', 'Basket'),
  ('BVOL-VOL', 'Bologna Volley',    'Pallavolo')
) as v(codice, societa, sport)
join public.societa s on s.nome = v.societa
on conflict (codice) do nothing;


-- ========================================================================
-- >>> migrations/0007_harden_functions.sql
-- ========================================================================

-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0007 — Hardening delle funzioni SECURITY DEFINER
-- ════════════════════════════════════════════════════════════════
-- Le funzioni-trigger non devono essere invocabili via API REST (/rpc).
-- Vengono eseguite dai trigger a prescindere dai privilegi del chiamante,
-- quindi revocare EXECUTE non ne compromette il funzionamento ma chiude
-- la superficie d'attacco (cfr. advisor 0028/0029 del database linter).
--
-- NB: `current_user_societa()` e `current_user_sport()` NON vengono
-- revocate: sono usate DENTRO le RLS policy e il ruolo `authenticated`
-- deve poterle eseguire perché le policy funzionino. Restituiscono solo
-- società/sport dell'utente loggato → rischio nullo.
-- ════════════════════════════════════════════════════════════════

revoke execute on function public.handle_new_user()      from public, anon, authenticated;
revoke execute on function public.set_articolo_context()  from public, anon, authenticated;


-- ========================================================================
-- >>> migrations/0008_categorie_prezzo_taglia.sql
-- ========================================================================

-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0008 — Prezzo manuale e tipo di taglia per categoria
-- ════════════════════════════════════════════════════════════════
-- `richiede_prezzo`: se true, in fase di upload l'utente DEVE indicare il
--   valore d'acquisto (scarpe, guanti, parastinchi). Per le altre categorie
--   il prezzo è impostato automaticamente (per ora = valore tipico di
--   riferimento; in futuro lo definirà la società che acquista il servizio).
-- `tipo_taglia`: governa il menù a tendina delle taglie:
--   • 'calzatura'     → numeri EU
--   • 'abbigliamento' → da taglia bimbo a taglia adulto
--   • 'unica'         → taglia unica
-- ════════════════════════════════════════════════════════════════

alter table public.categorie_item
  add column if not exists richiede_prezzo boolean not null default false,
  add column if not exists tipo_taglia text not null default 'abbigliamento'
    check (tipo_taglia in ('calzatura', 'abbigliamento', 'unica'));

-- Tipo di taglia
update public.categorie_item set tipo_taglia = 'calzatura'
  where nome ilike 'Scarpe%';

update public.categorie_item set tipo_taglia = 'unica'
  where nome in (
    'Borraccia', 'Fascia per capelli', 'Fascia tergisudore da polso',
    'Zaino sportivo', 'Borsone sportivo', 'Berretto / cuffia'
  );
-- tutte le altre restano 'abbigliamento' (default)

-- Prezzo inserito manualmente dall'utente (valore d'acquisto)
update public.categorie_item set richiede_prezzo = true
  where nome ilike 'Scarpe%'
     or nome = 'Guanti da portiere'
     or nome = 'Parastinchi';


-- ========================================================================
-- >>> migrations/0009_foto_multiple_default_logo.sql
-- ========================================================================

-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0009 — Foto multiple + default logo accessori
-- ════════════════════════════════════════════════════════════════
-- 1) Un articolo può avere fino a 3 foto. `foto_url` resta la copertina
--    (prima foto) per le card; `foto_urls` contiene tutte le foto.
-- 2) Zaini, borsoni e berretti/cuffie escono col logo societario spuntato
--    di default (come maglie, pantaloncini, ecc.).
-- ════════════════════════════════════════════════════════════════

alter table public.articoli
  add column if not exists foto_urls text[] not null default '{}';

update public.categorie_item set default_ha_logo = true
  where nome in ('Zaino sportivo', 'Borsone sportivo', 'Berretto / cuffia');


-- ========================================================================
-- >>> migrations/0010_valore_unico_condizione.sql
-- ========================================================================

-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0010 — Valore unico, split canotta basket, condizione
-- ════════════════════════════════════════════════════════════════
-- 1) `categorie_item.valore`: valore economico UNICO (sostituisce min–max
--    nell'uso applicativo). NULL per gli item a prezzo manuale (l'utente
--    indica il valore d'acquisto: scarpe, guanti, parastinchi, ginocchiere).
--    I valori non specificati dall'utente = media dei vecchi min/max
--    arrotondata al multiplo di 5 più vicino. Gli item presenti in più sport
--    hanno lo stesso valore.
-- 2) Basket: la "Canotta / maglia tecnica" si separa in
--    "Maglia tecnica da allenamento" (15€) e "Canotta da gioco (double)" (20€).
-- 3) Ginocchiere (pallavolo e basket) → prezzo manuale.
-- 4) `articoli.condizione`: stato dell'oggetto (Scarso…Perfetto).
-- ════════════════════════════════════════════════════════════════

-- ── 1. Colonna valore unico ──────────────────────────────────────
alter table public.categorie_item add column if not exists valore numeric(10,2);

-- ── 2. Ginocchiere → manuale (pallavolo e basket) ────────────────
update public.categorie_item set richiede_prezzo = true
  where nome = 'Ginocchiere' and sport in ('Pallavolo', 'Basket');

-- ── 3. Split canotta basket ──────────────────────────────────────
update public.categorie_item
  set nome = 'Maglia tecnica da allenamento'
  where sport = 'Basket' and nome = 'Canotta / maglia tecnica';

insert into public.categorie_item
  (sport, nome, tipo, default_ha_logo, richiede_prezzo, tipo_taglia,
   co2_min, co2_tipico, co2_max, acqua_min, acqua_tipico, acqua_max,
   valore_min, valore_max)
values
  ('Basket', 'Canotta da gioco (double)', 'individuale', true, false, 'abbigliamento',
   2, 3, 4, 50, 75, 100, 15, 30)
on conflict (sport, nome) do nothing;

-- ── 4. Valori unici (auto). Item manuali → valore NULL ───────────
-- I valori sono identici tra sport per gli item condivisi.
update public.categorie_item set valore = case nome
    when 'Calzettoni da calcio'            then 8
    when 'Calzini sportivi'                then 5
    when 'Calzini da basket'               then 5
    when 'Maglia / t-shirt tecnica'        then 15
    when 'Maglia tecnica da allenamento'   then 15
    when 'Canotta da gioco (double)'       then 20
    when 'Pantaloncini da allenamento'     then 15
    when 'Pantaloncini da gioco'           then 15
    when 'Pantaloncini da basket'          then 15
    when 'Felpa sportiva'                  then 30
    when 'Pantaloni della tuta'            then 25
    when 'Giacca sportiva'                 then 45
    when 'K-way / giacca antipioggia'      then 20
    when 'K-way / giacca leggera'          then 20
    when 'K-way / giacca'                  then 20
    when 'Zaino sportivo'                  then 25
    when 'Borsone sportivo'                then 35
    when 'Berretto / cuffia'               then 10
    when 'Borraccia'                       then 5
    when 'Fascia tergisudore da polso'     then 5
    when 'Fascia per capelli'              then 5
    when 'Cavigliere'                      then 15
    when 'Gomitiere'                       then 15
    when 'Gambali / manicotti gamba'       then 15
    when 'Manicotti braccio'               then 10
    when 'Manicotti braccio (shooting sleeve)' then 10
    else valore
  end
  where richiede_prezzo = false;

-- Sicurezza: gli item a prezzo manuale non hanno un valore fisso
update public.categorie_item set valore = null where richiede_prezzo = true;

-- ── 5. Condizione dell'articolo ──────────────────────────────────
alter table public.articoli add column if not exists condizione text
  check (condizione in ('Scarso', 'Discreto', 'Buono', 'Ottimo', 'Perfetto'));


-- ========================================================================
-- >>> migrations/0011_storage.sql
-- ========================================================================

-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0011 — Storage bucket per le foto degli articoli
-- ════════════════════════════════════════════════════════════════
-- Senza il bucket l'upload in Upload.tsx fallisce in silenzio e l'app
-- ripiega sul placeholder: nel feed non si vede mai la foto caricata.
-- Qui creiamo il bucket pubblico `articoli` e le policy:
--   • lettura pubblica (il feed usa getPublicUrl);
--   • scrittura/aggiornamento/cancellazione SOLO nella propria cartella
--     (il path è `<auth.uid()>/<uuid>.<ext>`, vedi Upload.tsx).
-- ════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('articoli', 'articoli', true)
on conflict (id) do update set public = true;

-- Lettura pubblica delle foto
drop policy if exists "articoli storage: lettura pubblica" on storage.objects;
create policy "articoli storage: lettura pubblica"
  on storage.objects for select
  using (bucket_id = 'articoli');

-- Upload: solo utenti autenticati, e solo nella propria cartella
drop policy if exists "articoli storage: upload proprio" on storage.objects;
create policy "articoli storage: upload proprio"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'articoli'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Aggiornamento dei propri file
drop policy if exists "articoli storage: update proprio" on storage.objects;
create policy "articoli storage: update proprio"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'articoli'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'articoli'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Cancellazione dei propri file
drop policy if exists "articoli storage: delete proprio" on storage.objects;
create policy "articoli storage: delete proprio"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'articoli'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ========================================================================
-- >>> migrations/0012_chat.sql
-- ========================================================================

-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0012 — Chat tra utenti + scambio degli articoli
-- ════════════════════════════════════════════════════════════════
-- Introduce la messaggistica che organizza lo scambio:
--
--   • CONVERSAZIONI: una per coppia (articolo, utente interessato). Chi è
--     interessato a un articolo del feed avvia la chat dalla pagina di
--     dettaglio; il proprietario riceve la richiesta. I due partecipanti
--     possono appartenere a SOCIETÀ DIVERSE (feed pubblico), perciò la
--     creazione passa da una funzione SECURITY DEFINER che risolve i nomi
--     senza dipendere dalla RLS di `utenti` (che nasconde i membri di
--     altre società).
--
--   • MESSAGGI: il contenuto del thread, immutabile, leggibile/scrivibile
--     solo dai due partecipanti.
--
--   • STATO DELL'ARTICOLO: resta governato dall'enum `stato_articolo`
--     (Disponibile di default → Prenotato → Scambiato) e dalla policy
--     "articoli: update proprio" già esistente: solo il proprietario può
--     cambiarlo. La UI espone il cambio di stato dentro la chat.
--
-- I nomi dei partecipanti sono DENORMALIZZATI sulla conversazione così che
-- lista chat e thread non debbano mai fare join su `utenti` (evitando che
-- la sua RLS tagli la controparte di un'altra società).
-- ════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. conversazioni
-- ─────────────────────────────────────────────
create table if not exists public.conversazioni (
  id                 bigint generated always as identity primary key,
  id_articolo        bigint not null references public.articoli(id) on delete cascade,
  id_proprietario    uuid   not null references public.utenti(id)   on delete cascade,
  id_acquirente      uuid   not null references public.utenti(id)   on delete cascade,
  -- nomi denormalizzati al momento della creazione (vedi nota in testa)
  nome_proprietario  text   not null,
  nome_acquirente    text   not null,
  -- read-tracking: ultima volta che ciascun lato ha aperto la conversazione
  letto_proprietario timestamptz,
  letto_acquirente   timestamptz,
  created_at         timestamptz not null default now(),
  -- bump a ogni nuovo messaggio: ordina la lista chat e calcola i "non letti"
  updated_at         timestamptz not null default now(),
  unique (id_articolo, id_acquirente),
  check (id_proprietario <> id_acquirente)
);

-- ─────────────────────────────────────────────
-- 2. messaggi
-- ─────────────────────────────────────────────
create table if not exists public.messaggi (
  id               bigint generated always as identity primary key,
  id_conversazione bigint not null references public.conversazioni(id) on delete cascade,
  id_mittente      uuid   not null references public.utenti(id)        on delete cascade,
  testo            text   not null check (char_length(btrim(testo)) between 1 and 2000),
  created_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 3. Indici
-- ─────────────────────────────────────────────
create index if not exists idx_conversazioni_proprietario on public.conversazioni (id_proprietario, updated_at desc);
create index if not exists idx_conversazioni_acquirente   on public.conversazioni (id_acquirente, updated_at desc);
create index if not exists idx_conversazioni_articolo     on public.conversazioni (id_articolo);
create index if not exists idx_messaggi_conversazione     on public.messaggi (id_conversazione, created_at);

-- ─────────────────────────────────────────────
-- 4. Helper RLS: l'utente loggato partecipa alla conversazione?
--    SECURITY DEFINER per evitare ricorsione quando lo si usa nelle policy
--    di `messaggi` (che altrimenti rileggerebbe `conversazioni`).
-- ─────────────────────────────────────────────
create or replace function public.is_partecipante(p_conv bigint)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.conversazioni c
    where c.id = p_conv
      and auth.uid() in (c.id_proprietario, c.id_acquirente)
  );
$$;

-- ─────────────────────────────────────────────
-- 5. RPC: avvia (o riapre) la conversazione su un articolo.
--    Idempotente: una sola conversazione per (articolo, interessato).
--    SECURITY DEFINER per leggere il nome del proprietario anche quando
--    appartiene a un'altra società (RLS di `utenti` lo nasconderebbe).
-- ─────────────────────────────────────────────
create or replace function public.inizia_conversazione(p_id_articolo bigint)
returns bigint
language plpgsql security definer set search_path = public
as $$
declare
  v_me         uuid := auth.uid();
  v_owner      uuid;
  v_owner_nome text;
  v_me_nome    text;
  v_conv       bigint;
begin
  if v_me is null then
    raise exception 'Utente non autenticato' using errcode = '42501';
  end if;

  select id_utente into v_owner from public.articoli where id = p_id_articolo;
  if v_owner is null then
    raise exception 'Articolo inesistente' using errcode = 'P0002';
  end if;
  if v_owner = v_me then
    raise exception 'Non puoi avviare una chat sul tuo stesso articolo'
      using errcode = '42501';
  end if;

  select nome_completo into v_owner_nome from public.utenti where id = v_owner;
  select nome_completo into v_me_nome    from public.utenti where id = v_me;

  insert into public.conversazioni
    (id_articolo, id_proprietario, id_acquirente, nome_proprietario, nome_acquirente)
  values
    (p_id_articolo, v_owner, v_me, coalesce(v_owner_nome, 'Utente'), coalesce(v_me_nome, 'Utente'))
  on conflict (id_articolo, id_acquirente)
    -- no-op che però restituisce la riga esistente (idempotenza)
    do update set id_acquirente = excluded.id_acquirente
  returning id into v_conv;

  return v_conv;
end;
$$;

-- ─────────────────────────────────────────────
-- 6. RPC: segna come letta la conversazione per il lato chiamante.
-- ─────────────────────────────────────────────
create or replace function public.segna_letto(p_conv bigint)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_me uuid := auth.uid();
begin
  update public.conversazioni
     set letto_proprietario = case when id_proprietario = v_me then now() else letto_proprietario end,
         letto_acquirente   = case when id_acquirente   = v_me then now() else letto_acquirente   end
   where id = p_conv
     and v_me in (id_proprietario, id_acquirente);
end;
$$;

-- ─────────────────────────────────────────────
-- 7. Trigger: ogni nuovo messaggio "risveglia" la conversazione.
-- ─────────────────────────────────────────────
create or replace function public.bump_conversazione()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.conversazioni
     set updated_at = now()
   where id = new.id_conversazione;
  return new;
end;
$$;

drop trigger if exists trg_bump_conversazione on public.messaggi;
create trigger trg_bump_conversazione
  after insert on public.messaggi
  for each row execute function public.bump_conversazione();

-- ─────────────────────────────────────────────
-- 8. Row Level Security
-- ─────────────────────────────────────────────
alter table public.conversazioni enable row level security;
alter table public.messaggi      enable row level security;

-- conversazioni: le vede e le aggiorna solo chi vi partecipa.
drop policy if exists "conversazioni: lettura partecipanti" on public.conversazioni;
create policy "conversazioni: lettura partecipanti"
  on public.conversazioni for select
  to authenticated
  using (auth.uid() in (id_proprietario, id_acquirente));

-- L'inserimento avviene via RPC (SECURITY DEFINER); la policy resta come
-- difesa in profondità: l'unico inserimento diretto ammesso è quello in cui
-- il chiamante è l'acquirente.
drop policy if exists "conversazioni: inserimento acquirente" on public.conversazioni;
create policy "conversazioni: inserimento acquirente"
  on public.conversazioni for insert
  to authenticated
  with check (id_acquirente = auth.uid());

-- messaggi: leggibili e inviabili solo dai partecipanti; il mittente sono io.
drop policy if exists "messaggi: lettura partecipanti" on public.messaggi;
create policy "messaggi: lettura partecipanti"
  on public.messaggi for select
  to authenticated
  using (public.is_partecipante(id_conversazione));

drop policy if exists "messaggi: invio partecipanti" on public.messaggi;
create policy "messaggi: invio partecipanti"
  on public.messaggi for insert
  to authenticated
  with check (
    id_mittente = auth.uid()
    and public.is_partecipante(id_conversazione)
  );

-- ─────────────────────────────────────────────
-- 9. Hardening (cfr. 0007): le funzioni-trigger non vanno esposte via /rpc.
--    inizia_conversazione / segna_letto restano invocabili da authenticated
--    (sono RPC chiamate dal client); is_partecipante serve dentro le RLS.
-- ─────────────────────────────────────────────
revoke execute on function public.bump_conversazione() from public, anon, authenticated;

-- Riduce la superficie esterna: anon non deve poter invocare queste funzioni
-- via /rpc. `authenticated` resta (le RPC sono chiamate dal client loggato e
-- is_partecipante gira dentro le RLS di `messaggi`).
revoke execute on function public.inizia_conversazione(bigint) from public, anon;
revoke execute on function public.segna_letto(bigint)          from public, anon;
revoke execute on function public.is_partecipante(bigint)      from public, anon;

-- ─────────────────────────────────────────────
-- 10. Realtime: messaggi e conversazioni in tempo reale (rispettano la RLS).
--     Guardato perché la publication potrebbe non esistere o già contenerle.
-- ─────────────────────────────────────────────
do $$ begin
  alter publication supabase_realtime add table public.messaggi;
exception when duplicate_object then null; when undefined_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.conversazioni;
exception when duplicate_object then null; when undefined_object then null; end $$;


-- ========================================================================
-- >>> migrations/0013_chat_foto_pulizia.sql
-- ========================================================================

-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0013 — Foto nei messaggi + auto-pulizia delle chat
-- ════════════════════════════════════════════════════════════════
-- 1) I messaggi possono contenere una FOTO (oltre/anziché il testo). Le foto
--    sono caricate nel bucket `articoli` sotto `<auth.uid()>/chat/<conv>/…`,
--    coerente con le policy di storage (cartella = auth.uid()).
--
-- 2) Le conversazioni si AUTO-ELIMINANO:
--      • dopo 1 mese di inattività (nessun nuovo messaggio → updated_at);
--      • dopo 1 settimana da quando l'articolo è segnato "Scambiato".
--    Per il secondo criterio tracciamo `articoli.scambiato_at` con un trigger.
--    La pulizia gira ogni notte via pg_cron. La cancellazione di una
--    conversazione elimina a cascata i suoi messaggi.
-- ════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. Foto nei messaggi
-- ─────────────────────────────────────────────
alter table public.messaggi add column if not exists foto_url text;

-- Un messaggio può essere di solo testo, sola foto, o entrambi.
alter table public.messaggi alter column testo drop not null;

-- Il vecchio check (lunghezza testo) resta valido: su testo NULL non vincola.
-- Aggiungiamo la regola "almeno un contenuto".
do $$ begin
  alter table public.messaggi
    add constraint messaggi_contenuto_check
    check (testo is not null or foto_url is not null);
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────
-- 2. Tracciamento del momento di "Scambiato" sull'articolo
-- ─────────────────────────────────────────────
alter table public.articoli add column if not exists scambiato_at timestamptz;

-- Backfill: articoli già scambiati ottengono una finestra di grazia da ora.
update public.articoli
   set scambiato_at = now()
 where stato = 'Scambiato' and scambiato_at is null;

create or replace function public.set_scambiato_at()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.stato = 'Scambiato' and old.stato is distinct from 'Scambiato' then
    new.scambiato_at := now();
  elsif new.stato <> 'Scambiato' then
    new.scambiato_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_scambiato_at on public.articoli;
create trigger trg_set_scambiato_at
  before update of stato on public.articoli
  for each row execute function public.set_scambiato_at();

-- ─────────────────────────────────────────────
-- 3. Funzione di pulizia delle conversazioni
-- ─────────────────────────────────────────────
create or replace function public.pulisci_conversazioni()
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_count integer;
begin
  with del as (
    delete from public.conversazioni c
    using public.articoli a
    where a.id = c.id_articolo
      and (
        -- inattività della chat
        c.updated_at < now() - interval '1 month'
        or
        -- articolo scambiato da più di una settimana
        (a.stato = 'Scambiato'
         and a.scambiato_at is not null
         and a.scambiato_at < now() - interval '7 days')
      )
    returning c.id
  )
  select count(*) into v_count from del;
  return v_count;
end;
$$;

-- ─────────────────────────────────────────────
-- 4. Hardening: queste funzioni non vanno esposte al client.
-- ─────────────────────────────────────────────
revoke execute on function public.set_scambiato_at()      from public, anon, authenticated;
revoke execute on function public.pulisci_conversazioni() from public, anon, authenticated;

-- ─────────────────────────────────────────────
-- 5. Scheduling notturno con pg_cron (idempotente sul nome del job).
-- ─────────────────────────────────────────────
create extension if not exists pg_cron;

do $$ begin
  perform cron.unschedule('pulizia-conversazioni');
exception when others then null; end $$;

select cron.schedule(
  'pulizia-conversazioni',
  '15 3 * * *',                       -- ogni notte alle 03:15
  $$ select public.pulisci_conversazioni(); $$
);


-- ========================================================================
-- >>> migrations/0014_scambi_recensioni.sql
-- ========================================================================

-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0014 — Tracciamento scambi, impatto personale,
--                          recensioni a stelle
-- ════════════════════════════════════════════════════════════════
-- Finora "Scambiato" era solo uno stato dell'articolo: non restava traccia
-- di CHI avesse ricevuto l'oggetto, né del momento. Questa migrazione rende
-- lo scambio un EVENTO tracciato:
--
--   • `scambi` — registro IMMUTABILE di ogni scambio concluso. Una riga per
--     articolo (un oggetto si scambia una volta sola). Tutto è DENORMALIZZATO
--     (nomi, titolo, foto, impatto, società) così che lo storico sia
--     auto-contenuto e non dipenda dalla RLS di `utenti`/`articoli` — che
--     nasconderebbe la controparte di un'altra società (feed pubblico).
--
--   • `recensioni` — valutazione 1–5 stelle (SENZA testo) che i due
--     partecipanti possono lasciarsi a vicenda. Una per (scambio, autore).
--
--   • Concludere uno scambio diventa IRREVERSIBILE e passa SOLO dalla RPC
--     `registra_scambio()` (che registra anche l'acquirente). Un guard sul
--     trigger di stato impedisce sia di tornare indietro da "Scambiato" sia
--     di entrarci con un UPDATE diretto dal client.
--
-- L'impatto di uno scambio = valore TIPICO della categoria dell'articolo
-- (CO₂, acqua) + il prezzo come valore economico risparmiato (coerente con la
-- metodologia già in uso nel feed e nella sezione Impatto).
-- ════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. scambi — registro immutabile degli scambi conclusi
-- ─────────────────────────────────────────────
create table if not exists public.scambi (
  id              bigint generated always as identity primary key,
  -- l'articolo può essere eliminato in seguito: manteniamo lo storico
  -- grazie ai campi denormalizzati qui sotto.
  id_articolo     bigint references public.articoli(id) on delete set null,
  id_venditore    uuid   not null references public.utenti(id) on delete cascade,
  id_acquirente   uuid   not null references public.utenti(id) on delete cascade,
  -- denormalizzati al momento dello scambio (vedi nota in testa)
  nome_venditore  text   not null,
  nome_acquirente text   not null,
  titolo_articolo text   not null,
  foto_url        text,
  -- società a cui viene attribuito l'impatto (quella del venditore/articolo)
  id_societa      bigint references public.societa(id) on delete set null,
  -- snapshot dell'impatto (valore tipico della categoria) e del valore € (prezzo)
  co2             numeric(10,2) not null default 0,
  acqua           numeric(10,2) not null default 0,
  valore          numeric(10,2) not null default 0,
  created_at      timestamptz not null default now(),
  check (id_venditore <> id_acquirente)
);

-- un articolo si scambia una sola volta (gli NULL post-eliminazione sono ammessi)
create unique index if not exists uq_scambi_articolo
  on public.scambi (id_articolo) where id_articolo is not null;
create index if not exists idx_scambi_venditore  on public.scambi (id_venditore);
create index if not exists idx_scambi_acquirente on public.scambi (id_acquirente);
create index if not exists idx_scambi_societa    on public.scambi (id_societa);

-- ─────────────────────────────────────────────
-- 2. recensioni — 1–5 stelle, senza testo; una per (scambio, autore)
-- ─────────────────────────────────────────────
create table if not exists public.recensioni (
  id              bigint generated always as identity primary key,
  id_scambio      bigint   not null references public.scambi(id) on delete cascade,
  id_autore       uuid     not null references public.utenti(id) on delete cascade,
  id_destinatario uuid     not null references public.utenti(id) on delete cascade,
  valutazione     smallint not null check (valutazione between 1 and 5),
  created_at      timestamptz not null default now(),
  unique (id_scambio, id_autore),
  check (id_autore <> id_destinatario)
);
create index if not exists idx_recensioni_destinatario on public.recensioni (id_destinatario);

-- ─────────────────────────────────────────────
-- 3. Stato dell'articolo: definitivo e blindato.
--    Ridefiniamo set_scambiato_at (cfr. 0013) aggiungendo due guardie:
--      a) "Scambiato" è IRREVERSIBILE (non si torna a Disponibile/Prenotato);
--      b) si entra in "Scambiato" SOLO tramite registra_scambio(), che
--         imposta il flag transazionale `loop.scambio_ok`.
-- ─────────────────────────────────────────────
create or replace function public.set_scambiato_at()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  -- (a) niente ripensamenti: uno scambio concluso resta concluso.
  if old.stato = 'Scambiato' and new.stato is distinct from old.stato then
    raise exception 'Uno scambio è definitivo: lo stato non può più cambiare'
      using errcode = '42501';
  end if;

  -- (b) la transizione a "Scambiato" è ammessa solo dalla RPC registra_scambio.
  if new.stato = 'Scambiato' and old.stato is distinct from 'Scambiato' then
    if current_setting('loop.scambio_ok', true) is distinct from '1' then
      raise exception 'Per concludere uno scambio usa la conferma di scambio'
        using errcode = '42501';
    end if;
    new.scambiato_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists trg_set_scambiato_at on public.articoli;
create trigger trg_set_scambiato_at
  before update of stato on public.articoli
  for each row execute function public.set_scambiato_at();

-- ─────────────────────────────────────────────
-- 4. RPC: conclude uno scambio registrando l'acquirente.
--    SECURITY DEFINER per leggere nome/impatto e per autorizzare la
--    transizione di stato. L'acquirente dev'essere una controparte reale:
--    deve esistere una conversazione (articolo, proprietario, acquirente).
-- ─────────────────────────────────────────────
create or replace function public.registra_scambio(
  p_id_articolo  bigint,
  p_id_acquirente uuid
)
returns bigint
language plpgsql security definer set search_path = public
as $$
declare
  v_me         uuid := auth.uid();
  v_art        record;
  v_co2        numeric(10,2);
  v_acqua      numeric(10,2);
  v_owner_nome text;
  v_acq_nome   text;
  v_scambio    bigint;
begin
  if v_me is null then
    raise exception 'Utente non autenticato' using errcode = '42501';
  end if;

  select a.id, a.id_utente, a.id_categoria, a.id_societa, a.titolo, a.prezzo,
         a.stato, coalesce(a.foto_urls[1], a.foto_url) as foto
    into v_art
  from public.articoli a
  where a.id = p_id_articolo
  for update;

  if not found then
    raise exception 'Articolo inesistente' using errcode = 'P0002';
  end if;
  if v_art.id_utente <> v_me then
    raise exception 'Solo il proprietario può concludere lo scambio'
      using errcode = '42501';
  end if;
  if v_art.stato = 'Scambiato' then
    raise exception 'Articolo già scambiato' using errcode = '42501';
  end if;
  if p_id_acquirente = v_me then
    raise exception 'Non puoi scambiare con te stesso' using errcode = '42501';
  end if;

  -- integrità: l'acquirente deve aver scritto al proprietario per quest'articolo
  if not exists (
    select 1 from public.conversazioni c
    where c.id_articolo     = p_id_articolo
      and c.id_proprietario = v_me
      and c.id_acquirente   = p_id_acquirente
  ) then
    raise exception 'Nessuna conversazione con questo utente per l''articolo'
      using errcode = '42501';
  end if;

  select co2_tipico, acqua_tipico into v_co2, v_acqua
  from public.categorie_item where id = v_art.id_categoria;

  select nome_completo into v_owner_nome from public.utenti where id = v_me;
  select nome_completo into v_acq_nome   from public.utenti where id = p_id_acquirente;

  -- autorizza la transizione di stato per il solo update qui sotto
  perform set_config('loop.scambio_ok', '1', true);
  update public.articoli set stato = 'Scambiato' where id = p_id_articolo;
  perform set_config('loop.scambio_ok', '0', true);

  insert into public.scambi
    (id_articolo, id_venditore, id_acquirente, nome_venditore, nome_acquirente,
     titolo_articolo, foto_url, id_societa, co2, acqua, valore)
  values
    (p_id_articolo, v_me, p_id_acquirente,
     coalesce(v_owner_nome, 'Utente'), coalesce(v_acq_nome, 'Utente'),
     v_art.titolo, v_art.foto, v_art.id_societa,
     coalesce(v_co2, 0), coalesce(v_acqua, 0), coalesce(v_art.prezzo, 0))
  returning id into v_scambio;

  return v_scambio;
end;
$$;

-- ─────────────────────────────────────────────
-- 5. RPC: lascia (o aggiorna) la propria recensione di uno scambio.
--    Il destinatario è l'altra parte dello scambio (dedotto, non falsificabile).
-- ─────────────────────────────────────────────
create or replace function public.lascia_recensione(
  p_id_scambio bigint,
  p_valutazione smallint
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_me   uuid := auth.uid();
  v_vend uuid;
  v_acq  uuid;
  v_dest uuid;
begin
  if v_me is null then
    raise exception 'Utente non autenticato' using errcode = '42501';
  end if;
  if p_valutazione < 1 or p_valutazione > 5 then
    raise exception 'La valutazione deve essere tra 1 e 5' using errcode = '23514';
  end if;

  select id_venditore, id_acquirente into v_vend, v_acq
  from public.scambi where id = p_id_scambio;
  if not found then
    raise exception 'Scambio inesistente' using errcode = 'P0002';
  end if;

  if v_me = v_vend then
    v_dest := v_acq;
  elsif v_me = v_acq then
    v_dest := v_vend;
  else
    raise exception 'Non hai partecipato a questo scambio' using errcode = '42501';
  end if;

  insert into public.recensioni (id_scambio, id_autore, id_destinatario, valutazione)
  values (p_id_scambio, v_me, v_dest, p_valutazione)
  on conflict (id_scambio, id_autore)
    do update set valutazione = excluded.valutazione, created_at = now();
end;
$$;

-- ─────────────────────────────────────────────
-- 6. RPC: impatto aggregato degli scambi della MIA società.
--    SECURITY DEFINER così aggrega tutta la società senza esporre le singole
--    righe `scambi` (che restano visibili solo ai due partecipanti, vedi RLS).
-- ─────────────────────────────────────────────
create or replace function public.impatto_societa()
returns table (n_scambi bigint, co2 numeric, acqua numeric, valore numeric)
language sql stable security definer set search_path = public
as $$
  select count(*)::bigint,
         coalesce(sum(s.co2), 0),
         coalesce(sum(s.acqua), 0),
         coalesce(sum(s.valore), 0)
  from public.scambi s
  where s.id_societa = public.current_user_societa();
$$;

-- ─────────────────────────────────────────────
-- 7. Row Level Security
-- ─────────────────────────────────────────────
alter table public.scambi     enable row level security;
alter table public.recensioni enable row level security;

-- scambi: visibili solo ai due partecipanti (storico personale). L'aggregato
-- di società passa dalla RPC impatto_societa() (SECURITY DEFINER). Nessuna
-- scrittura diretta dal client: si crea solo via registra_scambio().
drop policy if exists "scambi: lettura partecipanti" on public.scambi;
create policy "scambi: lettura partecipanti"
  on public.scambi for select
  to authenticated
  using (auth.uid() in (id_venditore, id_acquirente));

-- recensioni: leggibili da chi le ha scritte e da chi le riceve (per la media
-- in profilo e per sapere se la controparte ti ha già valutato). Scrittura via
-- RPC lascia_recensione().
drop policy if exists "recensioni: lettura interessati" on public.recensioni;
create policy "recensioni: lettura interessati"
  on public.recensioni for select
  to authenticated
  using (auth.uid() in (id_autore, id_destinatario));

-- ─────────────────────────────────────────────
-- 8. Hardening (cfr. 0007/0012/0013): superficie /rpc minima.
-- ─────────────────────────────────────────────
revoke execute on function public.set_scambiato_at()                  from public, anon, authenticated;
revoke execute on function public.registra_scambio(bigint, uuid)      from public, anon;
revoke execute on function public.lascia_recensione(bigint, smallint) from public, anon;
revoke execute on function public.impatto_societa()                   from public, anon;


-- ========================================================================
-- >>> migrations/0015_impatto_fibre.sql
-- ========================================================================

-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0015 — Stima d'impatto a livelli (fibre + blend)
-- ════════════════════════════════════════════════════════════════
-- Sostituisce la stima "valore fisso di categoria" con il modello a livelli:
--   • L0  — priore di categoria (profilo sintetico) = pavimento prudenziale;
--   • L0+1 — l'utente sceglie il materiale tra opzioni rappresentative (tap);
--   • L2  — (futuro) lettura della composizione dalla foto dell'etichetta.
--
-- L'impatto di un capo tessile = Σ(%fibra × fattore) × peso del capo, coi
-- fattori CRADLE-TO-GATE del foglio «Calcolo Footprint Blend.xlsx» (10 fibre).
-- Le categorie NON tessili (calzature, parastinchi, borse, ecc.) mantengono il
-- valore fisso di categoria già presente.
--
-- Regola fibre senza dato: l'elastan e il poliuretano hanno la CO₂ (inclusa)
-- ma non l'acqua → il loro contributo idrico è zero (vedi loop_impatto_blend).
-- ════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. fibre — fattori d'impatto cradle-to-gate (dal xlsx)
-- ─────────────────────────────────────────────
create table if not exists public.fibre (
  codice text primary key,
  nome   text not null,
  co2    numeric(10,3) not null,   -- kg CO2e / kg di fibra
  acqua  numeric(10,1)             -- L / kg di fibra; NULL = dato non disponibile (escluso)
);

insert into public.fibre (codice, nome, co2, acqua) values
  ('PET',  'Poliestere vergine',    3.12, 62),
  ('rPET', 'Poliestere riciclato',  1.12, 19),
  ('CO',   'Cotone',                4.32, 4800),
  ('EA',   'Elastan',               19,   null),
  ('PA',   'Poliammide/Nylon',      9.04, 424),
  ('PU',   'Poliuretano',           4.83, null),
  ('AC',   'Acrilico',              5.4,  200),
  ('WO',   'Lana',                  38.2, 500),
  ('VI',   'Viscosa',               3.8,  400),
  ('PP',   'Polipropilene',         2.0,  17)
on conflict (codice) do update
  set nome = excluded.nome, co2 = excluded.co2, acqua = excluded.acqua;

alter table public.fibre enable row level security;
drop policy if exists "fibre: lettura pubblica" on public.fibre;
create policy "fibre: lettura pubblica" on public.fibre
  for select to anon, authenticated using (true);

-- ─────────────────────────────────────────────
-- 2. categorie_item — peso del capo, profilo L0, opzioni materiale (tap L0+1)
-- ─────────────────────────────────────────────
alter table public.categorie_item
  add column if not exists peso_kg         numeric(6,3),
  add column if not exists profilo_default jsonb,
  add column if not exists materiali       jsonb not null default '[]'::jsonb;

comment on column public.categorie_item.peso_kg is
  'Peso tipico del capo (kg). NULL = categoria non tessile a valore fisso.';
comment on column public.categorie_item.profilo_default is
  'Blend L0 (profilo sintetico prudenziale) {codice_fibra: %}. NULL = valore fisso.';
comment on column public.categorie_item.materiali is
  'Opzioni del tap L0+1: [{chiave,label,hint,blend}]. [] = nessun tap.';

-- ─────────────────────────────────────────────
-- 3. loop_impatto_blend — impatto di un blend per un dato peso (kg)
--    Acqua: le fibre con dato mancante (acqua NULL) contribuiscono 0.
-- ─────────────────────────────────────────────
create or replace function public.loop_impatto_blend(p_blend jsonb, p_peso numeric)
returns table (co2 numeric, acqua numeric)
language sql stable set search_path = public
as $$
  select
    coalesce(round(sum((e.value)::numeric / 100 * f.co2)            * coalesce(p_peso, 0), 2), 0),
    coalesce(round(sum((e.value)::numeric / 100 * coalesce(f.acqua,0)) * coalesce(p_peso, 0), 1), 0)
  from jsonb_each_text(coalesce(p_blend, '{}'::jsonb)) e
  join public.fibre f on f.codice = e.key;
$$;

-- ─────────────────────────────────────────────
-- 4. Seed: peso + profilo L0 + opzioni materiale per i capi TESSILI.
--    (Le categorie non elencate restano a valore fisso: profilo_default NULL.)
-- ─────────────────────────────────────────────

-- Maglie / canotte / t-shirt tecniche
update public.categorie_item set
  peso_kg = 0.150,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco',
      'hint','Liscio, leggero, elastico; asciuga in fretta. Spesso traforato o lucido.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone',
      'hint','Morbido e opaco, scalda, si stropiccia (come una t-shirt di cotone).','blend','{"CO":100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome in ('Maglia / t-shirt tecnica','Maglia tecnica da allenamento','Canotta da gioco (double)');

-- Pantaloncini (allenamento / gioco / basket)
update public.categorie_item set
  peso_kg = 0.130,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco',
      'hint','Liscio, leggero, elastico; asciuga in fretta.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone',
      'hint','Tessuto un po'' più pesante e morbido, in parte cotone.','blend','{"PET":50,"CO":50}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome in ('Pantaloncini da allenamento','Pantaloncini da gioco','Pantaloncini da basket');

-- Felpa sportiva
update public.categorie_item set
  peso_kg = 0.450,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / sportivo',
      'hint','Interno liscio, leggero, elastico; asciuga in fretta.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / felpato',
      'hint','Interno garzato morbido, scalda, si stropiccia.','blend','{"CO":65,"PET":35}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Felpa sportiva';

-- Pantaloni della tuta
update public.categorie_item set
  peso_kg = 0.400,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / sportivo',
      'hint','Liscio, leggero, elastico; asciuga in fretta.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone',
      'hint','Più morbido e pesante, in parte cotone.','blend','{"PET":50,"CO":50}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Pantaloni della tuta';

-- Giacca sportiva
update public.categorie_item set
  peso_kg = 0.300,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / sportivo',
      'hint','Liscio, leggero; spesso impermeabile o softshell.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / casual',
      'hint','Più morbida e pesante, in parte cotone.','blend','{"CO":65,"PET":35}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Giacca sportiva';

-- K-way / giacca antivento (materiale ~certo: nessun tap)
update public.categorie_item set
  peso_kg = 0.250,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = '[]'::jsonb
where nome in ('K-way / giacca antipioggia','K-way / giacca leggera','K-way / giacca');

-- Calze / calzettoni
update public.categorie_item set
  peso_kg = 0.100,
  profilo_default = '{"PET":80,"EA":20}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Sportive tecniche',
      'hint','Sottili, elastiche, lisce.','blend','{"PET":80,"EA":20}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Con cotone / spugna',
      'hint','Spesse e morbide, tipo spugna sotto il piede.','blend','{"PET":70,"CO":15,"EA":15}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome in ('Calzettoni da calcio','Calzini sportivi','Calzini da basket');

-- Berretto / cuffia
update public.categorie_item set
  peso_kg = 0.100,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Sintetico',
      'hint','Leggero, liscio o elastico.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','acrilico','label','A maglia / caldo',
      'hint','Lavorato a maglia, caldo, non punge (acrilico).','blend','{"AC":100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone',
      'hint','Morbido, opaco, assorbe.','blend','{"CO":100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Berretto / cuffia';

-- ─────────────────────────────────────────────
-- 5. Ricalcolo delle baseline di categoria (solo capi tessili) col xlsx.
--    co2/acqua_tipico = profilo L0; co2/acqua_max = peggiore opzione materiale.
-- ─────────────────────────────────────────────
update public.categorie_item c set
  co2_tipico   = (select co2   from public.loop_impatto_blend(c.profilo_default, c.peso_kg)),
  acqua_tipico = (select acqua from public.loop_impatto_blend(c.profilo_default, c.peso_kg)),
  co2_min      = (select co2   from public.loop_impatto_blend(c.profilo_default, c.peso_kg)),
  acqua_min    = (select acqua from public.loop_impatto_blend(c.profilo_default, c.peso_kg)),
  co2_max      = (select co2   from public.loop_impatto_blend(c.profilo_default, c.peso_kg)),
  acqua_max    = (select acqua from public.loop_impatto_blend(c.profilo_default, c.peso_kg))
where c.profilo_default is not null;

update public.categorie_item c set
  co2_max   = greatest(c.co2_max,   sub.co2max),
  acqua_max = greatest(c.acqua_max, sub.acquamax)
from (
  select c2.id,
         max((select co2   from public.loop_impatto_blend(coalesce((m->>'blend')::jsonb, c2.profilo_default), c2.peso_kg))) as co2max,
         max((select acqua from public.loop_impatto_blend(coalesce((m->>'blend')::jsonb, c2.profilo_default), c2.peso_kg))) as acquamax
  from public.categorie_item c2, jsonb_array_elements(c2.materiali) m
  where c2.profilo_default is not null
  group by c2.id
) sub
where c.id = sub.id;

-- ─────────────────────────────────────────────
-- 6. articoli — composizione, provenienza, impatto calcolato, foto etichetta
-- ─────────────────────────────────────────────
alter table public.articoli
  add column if not exists composizione      jsonb,
  add column if not exists fonte_impatto      text not null default 'categoria'
    check (fonte_impatto in ('categoria','utente','etichetta')),
  add column if not exists co2                numeric(10,2) not null default 0,
  add column if not exists acqua              numeric(10,2) not null default 0,
  add column if not exists foto_etichetta_url text;

comment on column public.articoli.fonte_impatto is
  'Provenienza della stima: categoria (L0) | utente (L0+1) | etichetta (L2).';

-- ─────────────────────────────────────────────
-- 7. Trigger: calcola co2/acqua dell'articolo all'inserimento.
--    Capo tessile → blend (utente o profilo L0) × peso. Altrimenti valore fisso.
-- ─────────────────────────────────────────────
create or replace function public.set_articolo_impatto()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_cat   record;
  v_blend jsonb;
  v_co2   numeric;
  v_acqua numeric;
begin
  select peso_kg, profilo_default, co2_tipico, acqua_tipico
    into v_cat
  from public.categorie_item where id = new.id_categoria;

  if v_cat.profilo_default is null or v_cat.peso_kg is null then
    -- categoria non tessile: valore fisso di categoria
    new.composizione  := null;
    new.fonte_impatto := 'categoria';
    new.co2           := coalesce(v_cat.co2_tipico, 0);
    new.acqua         := coalesce(v_cat.acqua_tipico, 0);
  else
    v_blend := coalesce(new.composizione, v_cat.profilo_default);
    select co2, acqua into v_co2, v_acqua
      from public.loop_impatto_blend(v_blend, v_cat.peso_kg);
    new.co2   := v_co2;
    new.acqua := v_acqua;
    if new.composizione is null then
      new.fonte_impatto := 'categoria';
    end if;  -- se c'è composizione, rispetta fonte_impatto inviata (utente/etichetta)
  end if;

  return new;
end;
$$;

drop trigger if exists trg_set_articolo_impatto on public.articoli;
create trigger trg_set_articolo_impatto
  before insert on public.articoli
  for each row execute function public.set_articolo_impatto();

-- ─────────────────────────────────────────────
-- 8. Backfill degli articoli esistenti (snapshot col nuovo modello)
-- ─────────────────────────────────────────────
update public.articoli a set
  co2   = sub.co2,
  acqua = sub.acqua
from (
  select a2.id,
         case when c.profilo_default is null then coalesce(c.co2_tipico,0)
              else (select co2 from public.loop_impatto_blend(c.profilo_default, c.peso_kg)) end   as co2,
         case when c.profilo_default is null then coalesce(c.acqua_tipico,0)
              else (select acqua from public.loop_impatto_blend(c.profilo_default, c.peso_kg)) end as acqua
  from public.articoli a2
  join public.categorie_item c on c.id = a2.id_categoria
) sub
where a.id = sub.id;

-- ─────────────────────────────────────────────
-- 9. registra_scambio: lo snapshot d'impatto ora viene dall'ARTICOLO
--    (riflette il materiale scelto), non più dal valore tipico di categoria.
-- ─────────────────────────────────────────────
create or replace function public.registra_scambio(
  p_id_articolo  bigint,
  p_id_acquirente uuid
)
returns bigint
language plpgsql security definer set search_path = public
as $$
declare
  v_me         uuid := auth.uid();
  v_art        record;
  v_owner_nome text;
  v_acq_nome   text;
  v_scambio    bigint;
begin
  if v_me is null then
    raise exception 'Utente non autenticato' using errcode = '42501';
  end if;

  select a.id, a.id_utente, a.id_societa, a.titolo, a.prezzo, a.stato,
         a.co2, a.acqua, coalesce(a.foto_urls[1], a.foto_url) as foto
    into v_art
  from public.articoli a
  where a.id = p_id_articolo
  for update;

  if not found then
    raise exception 'Articolo inesistente' using errcode = 'P0002';
  end if;
  if v_art.id_utente <> v_me then
    raise exception 'Solo il proprietario può concludere lo scambio' using errcode = '42501';
  end if;
  if v_art.stato = 'Scambiato' then
    raise exception 'Articolo già scambiato' using errcode = '42501';
  end if;
  if p_id_acquirente = v_me then
    raise exception 'Non puoi scambiare con te stesso' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.conversazioni c
    where c.id_articolo     = p_id_articolo
      and c.id_proprietario = v_me
      and c.id_acquirente   = p_id_acquirente
  ) then
    raise exception 'Nessuna conversazione con questo utente per l''articolo'
      using errcode = '42501';
  end if;

  select nome_completo into v_owner_nome from public.utenti where id = v_me;
  select nome_completo into v_acq_nome   from public.utenti where id = p_id_acquirente;

  perform set_config('loop.scambio_ok', '1', true);
  update public.articoli set stato = 'Scambiato' where id = p_id_articolo;
  perform set_config('loop.scambio_ok', '0', true);

  insert into public.scambi
    (id_articolo, id_venditore, id_acquirente, nome_venditore, nome_acquirente,
     titolo_articolo, foto_url, id_societa, co2, acqua, valore)
  values
    (p_id_articolo, v_me, p_id_acquirente,
     coalesce(v_owner_nome, 'Utente'), coalesce(v_acq_nome, 'Utente'),
     v_art.titolo, v_art.foto, v_art.id_societa,
     coalesce(v_art.co2, 0), coalesce(v_art.acqua, 0), coalesce(v_art.prezzo, 0))
  returning id into v_scambio;

  return v_scambio;
end;
$$;

-- Hardening coerente con le migrazioni precedenti
revoke execute on function public.set_articolo_impatto()              from public, anon, authenticated;
revoke execute on function public.registra_scambio(bigint, uuid)      from public, anon;


-- ========================================================================
-- >>> migrations/0016_categorie_macro.sql
-- ========================================================================

-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0016 — Macro-categorie + nuove categorie di capo
-- ════════════════════════════════════════════════════════════════
-- Amplia il catalogo `categorie_item` con i tipi di capo dei cataloghi dei
-- top-5 brand teamwear (Givova, Joma, Macron, Legea, Erreà) e raggruppa tutte
-- le categorie per MACRO-CATEGORIA (usata dal picker in Upload.tsx).
--
-- Aggiunte (granularità moderata):
--   • Polo                                  (mancava del tutto)
--   • T-shirt tecnica / T-shirt (cotone)    (split dalla vecchia "maglia")
--   • Canotta / smanicato                   (Calcio + Pallavolo)
--   • Felpa con cappuccio / Felpa full-zip  (oltre alla girocollo)
--   • Leggings / tights
--   • Giacca / maglia in pile (polar fleece), Gilet / smanicato
-- L'abbigliamento "da rappresentanza" è CONDIVISO tra i tre sport; resta
-- sport-specifico solo il gamewear (maglia gara, canotta basket, pantaloncini).
--
-- Materiale (modello a livelli L0/L0+1/L2 di 0015): le nuove categorie tessili
-- hanno peso, profilo L0 e opzioni tap. Aggiungiamo l'opzione "Riciclato / ECO"
-- (poliestere riciclato rPET) ai capi tecnici, MA legata a un indizio LEGGIBILE
-- (scritta «riciclato/ECO/recycled»), non al riconoscimento tattile: virgin e
-- riciclato sono indistinguibili al tatto. Se non è dichiarato, il default
-- prudenziale resta il poliestere vergine → un mancato riconoscimento sottostima.
-- ════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. Nuova colonna macro_categoria
-- ─────────────────────────────────────────────
alter table public.categorie_item
  add column if not exists macro_categoria text;

comment on column public.categorie_item.macro_categoria is
  'Gruppo del picker in upload (Maglie e t-shirt, Polo, Felpe, …).';

-- ─────────────────────────────────────────────
-- 2. Rinomine per chiarezza (gli articoli usano id_categoria: nessun impatto)
-- ─────────────────────────────────────────────
update public.categorie_item set nome = 'Maglia da gara / tecnica'
  where nome = 'Maglia / t-shirt tecnica';
update public.categorie_item set nome = 'Felpa girocollo'
  where nome = 'Felpa sportiva';

-- ─────────────────────────────────────────────
-- 3. Inserimento nuove categorie
--    co2/acqua iniziali = 0 (placeholder): ricalcolate al passo 6.
-- ─────────────────────────────────────────────

-- 3a. Set condiviso tra i tre sport
insert into public.categorie_item
  (sport, nome, tipo, macro_categoria, default_ha_logo, richiede_prezzo, tipo_taglia,
   co2_min, co2_tipico, co2_max, acqua_min, acqua_tipico, acqua_max, valore_min, valore_max)
select s.sport, t.nome, 'individuale', t.macro, t.logo, false, 'abbigliamento',
       0, 0, 0, 0, 0, 0, t.vmin, t.vmax
from (values
  ('Polo',                                   'Polo',                     true,  12, 30),
  ('T-shirt tecnica',                        'Maglie e t-shirt',         true,   8, 25),
  ('T-shirt (cotone)',                       'Maglie e t-shirt',         false,  5, 20),
  ('Felpa con cappuccio',                    'Felpe',                    true,  20, 55),
  ('Felpa full-zip',                         'Felpe',                    true,  20, 55),
  ('Leggings / tights',                      'Pantaloni e pantaloncini', true,  10, 35),
  ('Giacca / maglia in pile (polar fleece)', 'Giacche e tute',           true,  20, 55),
  ('Gilet / smanicato',                      'Giacche e tute',           true,  15, 45)
) as t(nome, macro, logo, vmin, vmax)
cross join (values
  ('Calcio'::public.sport), ('Pallavolo'::public.sport), ('Basket'::public.sport)
) as s(sport)
on conflict (sport, nome) do nothing;

-- 3b. Canotta / smanicato: solo Calcio e Pallavolo (Basket ha già la canotta gara)
insert into public.categorie_item
  (sport, nome, tipo, macro_categoria, default_ha_logo, richiede_prezzo, tipo_taglia,
   co2_min, co2_tipico, co2_max, acqua_min, acqua_tipico, acqua_max, valore_min, valore_max)
select s.sport, 'Canotta / smanicato', 'individuale', 'Maglie e t-shirt', true, false,
       'abbigliamento', 0, 0, 0, 0, 0, 0, 8, 25
from (values ('Calcio'::public.sport), ('Pallavolo'::public.sport)) as s(sport)
on conflict (sport, nome) do nothing;

-- ─────────────────────────────────────────────
-- 4. Backfill macro_categoria su TUTTE le righe (pattern sul nome, prefisso)
-- ─────────────────────────────────────────────
update public.categorie_item set macro_categoria = 'Calzature'
  where nome ilike 'Scarpe%';
update public.categorie_item set macro_categoria = 'Protezioni'
  where nome in ('Parastinchi','Ginocchiere','Gomitiere','Guanti da portiere');
update public.categorie_item set macro_categoria = 'Calze'
  where nome ilike 'Calzettoni%' or nome ilike 'Calzini%';
update public.categorie_item set macro_categoria = 'Pantaloni e pantaloncini'
  where nome ilike 'Pantaloncini%' or nome ilike 'Pantaloni%' or nome ilike 'Leggings%';
update public.categorie_item set macro_categoria = 'Maglie e t-shirt'
  where nome ilike 'Maglia%' or nome ilike 'Canotta%' or nome ilike 'T-shirt%';
update public.categorie_item set macro_categoria = 'Polo'
  where nome = 'Polo';
update public.categorie_item set macro_categoria = 'Felpe'
  where nome ilike 'Felpa%';
update public.categorie_item set macro_categoria = 'Giacche e tute'
  where nome ilike 'Giacca%' or nome ilike 'K-way%' or nome ilike 'Gilet%';
update public.categorie_item set macro_categoria = 'Accessori'
  where nome in ('Zaino sportivo','Borsone sportivo','Borraccia',
    'Fascia tergisudore da polso','Fascia per capelli','Cavigliere',
    'Gambali / manicotti gamba','Manicotti braccio',
    'Manicotti braccio (shooting sleeve)','Berretto / cuffia');

-- ─────────────────────────────────────────────
-- 5. Peso + profilo L0 + opzioni materiale (tap) per le NUOVE categorie tessili
-- ─────────────────────────────────────────────

-- Polo — cotone/piqué (Erreà) oppure poliestere (Legea/Joma)
update public.categorie_item set
  peso_kg = 0.220,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','cotone','label','Cotone / piqué',
      'hint','Morbida e opaca, trama a nido d''ape; come una polo classica.','blend','{"CO":100}'::jsonb),
    jsonb_build_object('chiave','tecnico','label','Tecnico',
      'hint','Liscio, leggero, elastico; asciuga in fretta.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone',
      'hint','Un po'' di entrambi: morbida ma più resistente.','blend','{"PET":50,"CO":50}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Polo';

-- T-shirt tecnica (da allenamento) — tap ECO incluso
update public.categorie_item set
  peso_kg = 0.150,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco',
      'hint','Liscio, leggero, elastico; asciuga in fretta. Spesso traforato o lucido.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','eco','label','Riciclato / ECO',
      'hint','Solo se sul capo o sull''etichetta c''è scritto «riciclato», «ECO» o «recycled».','blend','{"rPET":100}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone',
      'hint','Tessuto un po'' più morbido e opaco, in parte cotone.','blend','{"PET":50,"CO":50}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'T-shirt tecnica';

-- T-shirt (cotone) — casual: di norma cotone
update public.categorie_item set
  peso_kg = 0.160,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','cotone','label','Cotone',
      'hint','Morbida e opaca, scalda, si stropiccia (come una t-shirt di cotone).','blend','{"CO":100}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone',
      'hint','In parte cotone, in parte sintetico.','blend','{"CO":50,"PET":50}'::jsonb),
    jsonb_build_object('chiave','tecnico','label','Tecnico / sintetico',
      'hint','Liscia, leggera, elastica; asciuga in fretta.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'T-shirt (cotone)';

-- Canotta / smanicato (Calcio + Pallavolo) — tap ECO incluso
update public.categorie_item set
  peso_kg = 0.130,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco',
      'hint','Liscia, leggera, elastica; asciuga in fretta.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','eco','label','Riciclato / ECO',
      'hint','Solo se sul capo o sull''etichetta c''è scritto «riciclato», «ECO» o «recycled».','blend','{"rPET":100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Canotta / smanicato';

-- Felpa con cappuccio
update public.categorie_item set
  peso_kg = 0.500,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / pile',
      'hint','Interno liscio o in pile; leggera, asciuga in fretta.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / felpato',
      'hint','Interno garzato morbido, scalda, si stropiccia.','blend','{"CO":65,"PET":35}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Felpa con cappuccio';

-- Felpa full-zip
update public.categorie_item set
  peso_kg = 0.480,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / pile',
      'hint','Interno liscio o in pile; leggera, asciuga in fretta.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / felpato',
      'hint','Interno garzato morbido, scalda, si stropiccia.','blend','{"CO":65,"PET":35}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Felpa full-zip';

-- Leggings / tights — aderenti con elastan; tap ECO con stesse percentuali
update public.categorie_item set
  peso_kg = 0.200,
  profilo_default = '{"PET":90,"EA":10}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / aderente',
      'hint','Liscio ed elastico, aderente alla pelle.','blend','{"PET":90,"EA":10}'::jsonb),
    jsonb_build_object('chiave','eco','label','Riciclato / ECO',
      'hint','Solo se sul capo o sull''etichetta c''è scritto «riciclato», «ECO» o «recycled».','blend','{"rPET":90,"EA":10}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Leggings / tights';

-- Giacca / maglia in pile (polar fleece) — materiale ~certo: nessun tap
update public.categorie_item set
  peso_kg = 0.350,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = '[]'::jsonb
where nome = 'Giacca / maglia in pile (polar fleece)';

-- Gilet / smanicato — materiale ~certo: nessun tap
update public.categorie_item set
  peso_kg = 0.250,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = '[]'::jsonb
where nome = 'Gilet / smanicato';

-- ─────────────────────────────────────────────
-- 6. Aggiunta del tap "Riciclato / ECO" ai capi tecnici GIÀ esistenti
-- ─────────────────────────────────────────────

-- Maglie / canotte da gioco tecniche
update public.categorie_item set
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco',
      'hint','Liscio, leggero, elastico; asciuga in fretta. Spesso traforato o lucido.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','eco','label','Riciclato / ECO',
      'hint','Solo se sul capo o sull''etichetta c''è scritto «riciclato», «ECO» o «recycled».','blend','{"rPET":100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone',
      'hint','Morbido e opaco, scalda, si stropiccia (come una t-shirt di cotone).','blend','{"CO":100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome in ('Maglia da gara / tecnica','Maglia tecnica da allenamento','Canotta da gioco (double)');

-- Pantaloncini (allenamento / gioco / basket)
update public.categorie_item set
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco',
      'hint','Liscio, leggero, elastico; asciuga in fretta.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','eco','label','Riciclato / ECO',
      'hint','Solo se sul capo o sull''etichetta c''è scritto «riciclato», «ECO» o «recycled».','blend','{"rPET":100}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone',
      'hint','Tessuto un po'' più pesante e morbido, in parte cotone.','blend','{"PET":50,"CO":50}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome in ('Pantaloncini da allenamento','Pantaloncini da gioco','Pantaloncini da basket');

-- ─────────────────────────────────────────────
-- 7. Ricalcolo delle baseline di categoria (solo capi tessili) col modello fibre.
--    co2/acqua_tipico = profilo L0; co2/acqua_max = peggiore opzione materiale.
--    (Stesso pattern di 0015; idempotente su righe vecchie e nuove.)
-- ─────────────────────────────────────────────
update public.categorie_item c set
  co2_tipico   = (select co2   from public.loop_impatto_blend(c.profilo_default, c.peso_kg)),
  acqua_tipico = (select acqua from public.loop_impatto_blend(c.profilo_default, c.peso_kg)),
  co2_min      = (select co2   from public.loop_impatto_blend(c.profilo_default, c.peso_kg)),
  acqua_min    = (select acqua from public.loop_impatto_blend(c.profilo_default, c.peso_kg)),
  co2_max      = (select co2   from public.loop_impatto_blend(c.profilo_default, c.peso_kg)),
  acqua_max    = (select acqua from public.loop_impatto_blend(c.profilo_default, c.peso_kg))
where c.profilo_default is not null;

update public.categorie_item c set
  co2_max   = greatest(c.co2_max,   sub.co2max),
  acqua_max = greatest(c.acqua_max, sub.acquamax)
from (
  select c2.id,
         max((select co2   from public.loop_impatto_blend(coalesce((m->>'blend')::jsonb, c2.profilo_default), c2.peso_kg))) as co2max,
         max((select acqua from public.loop_impatto_blend(coalesce((m->>'blend')::jsonb, c2.profilo_default), c2.peso_kg))) as acquamax
  from public.categorie_item c2, jsonb_array_elements(c2.materiali) m
  where c2.profilo_default is not null
  group by c2.id
) sub
where c.id = sub.id;

-- ─────────────────────────────────────────────
-- 8. Valore economico unico per le nuove categorie (prezzo automatico)
-- ─────────────────────────────────────────────
update public.categorie_item set valore = case nome
    when 'Polo'                                   then 20
    when 'T-shirt tecnica'                        then 15
    when 'T-shirt (cotone)'                       then 10
    when 'Canotta / smanicato'                    then 15
    when 'Felpa con cappuccio'                    then 35
    when 'Felpa full-zip'                         then 35
    when 'Leggings / tights'                      then 20
    when 'Giacca / maglia in pile (polar fleece)' then 35
    when 'Gilet / smanicato'                      then 30
    else valore
  end
  where richiede_prezzo = false and valore is null;


-- ========================================================================
-- >>> migrations/0017_chat_no_pulizia_scambio.sql
-- ========================================================================

-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0017 — La chat NON si elimina dopo lo scambio
-- ════════════════════════════════════════════════════════════════
-- Rimuoviamo il criterio di auto-pulizia "articolo scambiato da più di una
-- settimana" introdotto in 0013: dopo uno scambio gli utenti devono poter
-- continuare a scriversi (accordi su consegna, resi, recensioni…).
--
-- Resta attivo SOLO il criterio di inattività (nessun nuovo messaggio da
-- oltre 1 mese). La colonna `articoli.scambiato_at` e il trigger
-- `set_scambiato_at` NON vengono toccati: fanno parte della macchina a stati
-- dello scambio (cfr. 0014) e sono usati altrove.
-- ════════════════════════════════════════════════════════════════

create or replace function public.pulisci_conversazioni()
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_count integer;
begin
  with del as (
    delete from public.conversazioni c
    -- solo inattività della chat: nessun nuovo messaggio da oltre 1 mese.
    where c.updated_at < now() - interval '1 month'
    returning c.id
  )
  select count(*) into v_count from del;
  return v_count;
end;
$$;

revoke execute on function public.pulisci_conversazioni() from public, anon, authenticated;


-- ========================================================================
-- >>> migrations/0018_semplificazione_categorie.sql
-- ========================================================================

-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0018 — Semplificazione categorie (2 macro + 14 item)
-- ════════════════════════════════════════════════════════════════
-- Snellisce il catalogo `categorie_item`:
--   • MACRO-CATEGORIE ridotte a DUE: «Abbigliamento» e «Accessori».
--   • ABBIGLIAMENTO → 11 capi: Canotta, T-shirt, Polo, Felpa, Pantaloni,
--     Pantaloncini, Giacca, Gilet, K-way, Calzini, Scarpe.
--   • ACCESSORI → 3 voci: Accessorio (generico, impatto NON calcolato),
--     Zaino e Borsone (100% poliestere, impatto calcolato sul peso).
--
-- La dimensione «sport» resta invariata (feed per sport): ogni sport ottiene
-- lo stesso set di 14 voci. Gli articoli già caricati vengono RIMAPPATI alle
-- nuove categorie (per nome), poi le vecchie categorie granulari sono rimosse.
--
-- Modello a livelli (0015/0016): i capi tessili mantengono peso + profilo L0 +
-- opzioni tap; avendo ridotto le categorie si ARRICCHISCONO i tap (es. la
-- canotta passa da «tecnico/riciclato» a «tecnico/riciclato/cotone»).
--
-- Scarpe: valore fisso di categoria 13,6 kg CO₂e/paio (MIT, Cheah et al. 2013,
-- news.mit.edu/2013/footwear-carbon-footprint-0522) e ≥1.300 L/paio (valore
-- prudenziale: non esiste un LCA idrico affidabile per la scarpa sportiva
-- sintetica; ≈8.000 L riguarda la PELLE ed è escluso). Confine diverso dal
-- cradle-to-fibre-gate dei capi (è un valore di letteratura per l'intera scarpa):
-- eccezione documentata nella nota metodologica.
-- ════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. Creazione/normalizzazione delle 14 categorie canoniche per ogni sport
--    (impatto = 0 placeholder: ricalcolato al passo 6)
-- ─────────────────────────────────────────────
insert into public.categorie_item
  (sport, nome, tipo, macro_categoria, default_ha_logo, richiede_prezzo, tipo_taglia,
   co2_min, co2_tipico, co2_max, acqua_min, acqua_tipico, acqua_max, valore_min, valore_max)
select s.sport, t.nome, t.tipo, t.macro, t.logo, t.prezzo, t.taglia,
       0, 0, 0, 0, 0, 0, t.vmin, t.vmax
from (values
  -- nome,          tipo,          macro,           logo,  prezzo, taglia,          vmin, vmax
  ('Canotta',       'individuale', 'Abbigliamento', true,  false,  'abbigliamento',  8,   25),
  ('T-shirt',       'individuale', 'Abbigliamento', true,  false,  'abbigliamento',  5,   25),
  ('Polo',          'individuale', 'Abbigliamento', true,  false,  'abbigliamento', 12,   30),
  ('Felpa',         'individuale', 'Abbigliamento', true,  false,  'abbigliamento', 20,   55),
  ('Pantaloni',     'individuale', 'Abbigliamento', true,  false,  'abbigliamento', 10,   35),
  ('Pantaloncini',  'individuale', 'Abbigliamento', true,  false,  'abbigliamento',  8,   30),
  ('Giacca',        'individuale', 'Abbigliamento', true,  false,  'abbigliamento', 20,   55),
  ('Gilet',         'individuale', 'Abbigliamento', true,  false,  'abbigliamento', 15,   45),
  ('K-way',         'individuale', 'Abbigliamento', true,  false,  'abbigliamento', 12,   35),
  ('Calzini',       'individuale', 'Abbigliamento', false, false,  'abbigliamento',  5,   15),
  ('Scarpe',        'individuale', 'Abbigliamento', false, true,   'calzatura',     25,  110),
  ('Accessorio',    'accessorio',  'Accessori',     false, false,  'unica',          5,   40),
  ('Zaino',         'accessorio',  'Accessori',     false, false,  'unica',         15,   40),
  ('Borsone',       'accessorio',  'Accessori',     false, false,  'unica',         20,   50)
) as t(nome, tipo, macro, logo, prezzo, taglia, vmin, vmax)
cross join (values
  ('Calcio'::public.sport), ('Pallavolo'::public.sport), ('Basket'::public.sport)
) as s(sport)
on conflict (sport, nome) do nothing;

-- Riallinea macro-categoria e tipo taglia anche su eventuali righe preesistenti
-- omonime (es. «Polo», creata in 0016 con macro «Polo»).
update public.categorie_item set macro_categoria = 'Abbigliamento'
  where nome in ('Canotta','T-shirt','Polo','Felpa','Pantaloni','Pantaloncini',
                 'Giacca','Gilet','K-way','Calzini','Scarpe');
update public.categorie_item set macro_categoria = 'Accessori'
  where nome in ('Accessorio','Zaino','Borsone');
update public.categorie_item set tipo_taglia = 'calzatura' where nome = 'Scarpe';

-- ─────────────────────────────────────────────
-- 2. Peso + profilo L0 + opzioni materiale (tap) per i CAPI di abbigliamento
--    (tap arricchiti: dove sensato si aggiungono cotone / misto / riciclato)
-- ─────────────────────────────────────────────

-- Canotta — tecnico / riciclato / cotone
update public.categorie_item set
  peso_kg = 0.130,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco',
      'hint','Liscia, leggera, elastica; asciuga in fretta. Spesso traforata o lucida.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','eco','label','Riciclato / ECO',
      'hint','Solo se sul capo o sull''etichetta c''è scritto «riciclato», «ECO» o «recycled».','blend','{"rPET":100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone',
      'hint','Morbida e opaca, scalda, si stropiccia (come una t-shirt di cotone).','blend','{"CO":100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Canotta';

-- T-shirt (accorpa maglie a maniche gara/tecniche/allenamento + t-shirt)
update public.categorie_item set
  peso_kg = 0.150,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco',
      'hint','Liscia, leggera, elastica; asciuga in fretta. Spesso traforata o lucida.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','eco','label','Riciclato / ECO',
      'hint','Solo se sul capo o sull''etichetta c''è scritto «riciclato», «ECO» o «recycled».','blend','{"rPET":100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone',
      'hint','Morbida e opaca, scalda, si stropiccia (come una t-shirt di cotone).','blend','{"CO":100}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone',
      'hint','Un po'' di entrambi: morbida ma più resistente.','blend','{"PET":50,"CO":50}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'T-shirt';

-- Polo
update public.categorie_item set
  peso_kg = 0.220,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','cotone','label','Cotone / piqué',
      'hint','Morbida e opaca, trama a nido d''ape; come una polo classica.','blend','{"CO":100}'::jsonb),
    jsonb_build_object('chiave','tecnico','label','Tecnico',
      'hint','Liscia, leggera, elastica; asciuga in fretta.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone',
      'hint','Un po'' di entrambi: morbida ma più resistente.','blend','{"PET":50,"CO":50}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Polo';

-- Felpa (accorpa cappuccio / full-zip / girocollo)
update public.categorie_item set
  peso_kg = 0.480,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / pile',
      'hint','Interno liscio o in pile; leggera, asciuga in fretta.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / felpato',
      'hint','Interno garzato morbido, scalda, si stropiccia.','blend','{"CO":65,"PET":35}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Felpa';

-- Pantaloni (accorpa pantaloni tuta + leggings/tights)
update public.categorie_item set
  peso_kg = 0.400,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tuta / sportivo',
      'hint','Liscio, leggero, elastico; asciuga in fretta.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','aderente','label','Aderente / leggings',
      'hint','Elastico e aderente alla pelle (con elastan).','blend','{"PET":90,"EA":10}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone',
      'hint','Più morbido e pesante, in parte cotone.','blend','{"PET":50,"CO":50}'::jsonb),
    jsonb_build_object('chiave','eco','label','Riciclato / ECO',
      'hint','Solo se sul capo o sull''etichetta c''è scritto «riciclato», «ECO» o «recycled».','blend','{"rPET":100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Pantaloni';

-- Pantaloncini (accorpa allenamento / gioco / basket)
update public.categorie_item set
  peso_kg = 0.130,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco',
      'hint','Liscio, leggero, elastico; asciuga in fretta.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','eco','label','Riciclato / ECO',
      'hint','Solo se sul capo o sull''etichetta c''è scritto «riciclato», «ECO» o «recycled».','blend','{"rPET":100}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone',
      'hint','Tessuto un po'' più pesante e morbido, in parte cotone.','blend','{"PET":50,"CO":50}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Pantaloncini';

-- Giacca (accorpa giacca sportiva + pile/polar fleece)
update public.categorie_item set
  peso_kg = 0.300,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / pile',
      'hint','Liscia o in pile; spesso impermeabile o softshell.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / casual',
      'hint','Più morbida e pesante, in parte cotone.','blend','{"CO":65,"PET":35}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Giacca';

-- Gilet / smanicato
update public.categorie_item set
  peso_kg = 0.250,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Sintetico / imbottito',
      'hint','Leggero, liscio; spesso imbottito o in pile.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / felpato',
      'hint','Più morbido e pesante, in parte cotone.','blend','{"CO":65,"PET":35}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Gilet';

-- K-way / giacca antivento — poliestere o nylon (impatto CO₂ molto diverso)
update public.categorie_item set
  peso_kg = 0.250,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','poliestere','label','Poliestere',
      'hint','Leggero, fruscia poco; l''etichetta dice «poliestere/PES».','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','nylon','label','Nylon / poliammide',
      'hint','Molto leggero e frusciante; l''etichetta dice «nylon/poliammide/PA».','blend','{"PA":100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'K-way';

-- Calzini (accorpa calzettoni / calzini basket / calzini sportivi)
update public.categorie_item set
  peso_kg = 0.100,
  profilo_default = '{"PET":80,"EA":20}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Sportivi tecnici',
      'hint','Sottili, elastici, lisci.','blend','{"PET":80,"EA":20}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Con cotone / spugna',
      'hint','Spessi e morbidi, tipo spugna sotto il piede.','blend','{"PET":70,"CO":15,"EA":15}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Calzini';

-- ─────────────────────────────────────────────
-- 3. Voci a valore fisso / non tessili
-- ─────────────────────────────────────────────

-- Scarpe — valore fisso di categoria (nessun tap): CO₂ 13,6 (MIT) · acqua ≥1.500 L
update public.categorie_item set
  peso_kg = null,
  profilo_default = null,
  materiali = '[]'::jsonb,
  co2_min = 13.6, co2_tipico = 13.6, co2_max = 13.6,
  acqua_min = 1500, acqua_tipico = 1500, acqua_max = 1500
where nome = 'Scarpe';

-- Accessorio (generico) — impatto NON calcolato (materiale ignoto): 0
update public.categorie_item set
  peso_kg = null,
  profilo_default = null,
  materiali = '[]'::jsonb,
  co2_min = 0, co2_tipico = 0, co2_max = 0,
  acqua_min = 0, acqua_tipico = 0, acqua_max = 0
where nome = 'Accessorio';

-- Zaino e Borsone — 100% poliestere, impatto calcolato sul peso (no tap)
update public.categorie_item set
  peso_kg = 0.500,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = '[]'::jsonb
where nome = 'Zaino';

update public.categorie_item set
  peso_kg = 0.800,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = '[]'::jsonb
where nome = 'Borsone';

-- ─────────────────────────────────────────────
-- 4. Rimappa gli ARTICOLI dalle vecchie categorie granulari alle nuove.
--    Il target si ricava dal nome della categoria attuale (stesso sport).
-- ─────────────────────────────────────────────
update public.articoli a set id_categoria = tgt.id
from public.categorie_item cur
join public.categorie_item tgt
  on tgt.sport = cur.sport
 and tgt.nome = (
   case
     when cur.nome ilike 'Scarpe%'                                 then 'Scarpe'
     when cur.nome ilike 'Canotta%'                                then 'Canotta'
     when cur.nome ilike 'Maglia%'                                 then 'T-shirt'
     when cur.nome ilike 'T-shirt%'                                then 'T-shirt'
     when cur.nome = 'Polo'                                        then 'Polo'
     when cur.nome ilike 'Felpa%'                                  then 'Felpa'
     when cur.nome ilike 'Giacca%'                                 then 'Giacca'
     when cur.nome ilike 'K-way%'                                  then 'K-way'
     when cur.nome ilike 'Gilet%'                                  then 'Gilet'
     when cur.nome ilike 'Leggings%'                               then 'Pantaloni'
     when cur.nome ilike 'Pantaloncini%'                           then 'Pantaloncini'
     when cur.nome ilike 'Pantaloni%'                              then 'Pantaloni'
     when cur.nome ilike 'Calzettoni%' or cur.nome ilike 'Calzini%' then 'Calzini'
     when cur.nome ilike 'Zaino%'                                  then 'Zaino'
     when cur.nome ilike 'Borsone%'                                then 'Borsone'
     else 'Accessorio'
   end)
where a.id_categoria = cur.id
  and tgt.id <> cur.id;

-- ─────────────────────────────────────────────
-- 5. Rimuovi le vecchie categorie non più in catalogo (ora orfane di articoli)
-- ─────────────────────────────────────────────
delete from public.categorie_item
where nome not in ('Canotta','T-shirt','Polo','Felpa','Pantaloni','Pantaloncini',
                   'Giacca','Gilet','K-way','Calzini','Scarpe',
                   'Accessorio','Zaino','Borsone');

-- ─────────────────────────────────────────────
-- 6. Ricalcolo baseline di categoria (solo capi tessili) col modello fibre.
--    Scarpe/Accessorio restano ai valori fissi impostati al passo 3.
-- ─────────────────────────────────────────────
update public.categorie_item c set
  co2_tipico   = (select co2   from public.loop_impatto_blend(c.profilo_default, c.peso_kg)),
  acqua_tipico = (select acqua from public.loop_impatto_blend(c.profilo_default, c.peso_kg)),
  co2_min      = (select co2   from public.loop_impatto_blend(c.profilo_default, c.peso_kg)),
  acqua_min    = (select acqua from public.loop_impatto_blend(c.profilo_default, c.peso_kg)),
  co2_max      = (select co2   from public.loop_impatto_blend(c.profilo_default, c.peso_kg)),
  acqua_max    = (select acqua from public.loop_impatto_blend(c.profilo_default, c.peso_kg))
where c.profilo_default is not null;

update public.categorie_item c set
  co2_max   = greatest(c.co2_max,   sub.co2max),
  acqua_max = greatest(c.acqua_max, sub.acquamax)
from (
  select c2.id,
         max((select co2   from public.loop_impatto_blend(coalesce((m->>'blend')::jsonb, c2.profilo_default), c2.peso_kg))) as co2max,
         max((select acqua from public.loop_impatto_blend(coalesce((m->>'blend')::jsonb, c2.profilo_default), c2.peso_kg))) as acquamax
  from public.categorie_item c2, jsonb_array_elements(c2.materiali) m
  where c2.profilo_default is not null
  group by c2.id
) sub
where c.id = sub.id;

-- ─────────────────────────────────────────────
-- 7. Valore economico unico per le nuove categorie a prezzo automatico
-- ─────────────────────────────────────────────
update public.categorie_item set valore = case nome
    when 'Canotta'      then 15
    when 'T-shirt'      then 12
    when 'Polo'         then 20
    when 'Felpa'        then 35
    when 'Pantaloni'    then 30
    when 'Pantaloncini' then 15
    when 'Giacca'       then 35
    when 'Gilet'        then 30
    when 'K-way'        then 25
    when 'Calzini'      then 8
    when 'Accessorio'   then 10
    when 'Zaino'        then 25
    when 'Borsone'      then 35
    else valore
  end
  where richiede_prezzo = false;

-- ─────────────────────────────────────────────
-- 8. Backfill impatto degli articoli (categorie cambiate → ricalcolo snapshot)
-- ─────────────────────────────────────────────
update public.articoli a set
  co2   = sub.co2,
  acqua = sub.acqua
from (
  select a2.id,
         case when c.profilo_default is null then coalesce(c.co2_tipico,0)
              else (select co2 from public.loop_impatto_blend(coalesce(a2.composizione, c.profilo_default), c.peso_kg)) end   as co2,
         case when c.profilo_default is null then coalesce(c.acqua_tipico,0)
              else (select acqua from public.loop_impatto_blend(coalesce(a2.composizione, c.profilo_default), c.peso_kg)) end as acqua
  from public.articoli a2
  join public.categorie_item c on c.id = a2.id_categoria
) sub
where a.id = sub.id;



-- ========================================================================
-- >>> migrations/0019_rimozione_colonne_superflue.sql
-- ========================================================================

-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0019 — Rimozione colonne superflue
-- ════════════════════════════════════════════════════════════════
-- Colonne scritte dalle migrazioni storiche ma mai lette da nessuna parte
-- (né dal client, né da funzioni/trigger/policy lato DB):
--
--   • categorie_item.co2_min / co2_max / acqua_min / acqua_max — il modello a
--     fibre (0015) calcola l'impatto sul singolo articolo; le baseline di
--     categoria usano solo co2_tipico / acqua_tipico (trigger
--     set_articolo_impatto e preview in Upload). I min/max venivano ricalcolati
--     a ogni seed ma nessuno li leggeva.
--   • categorie_item.valore_min / valore_max — il valore economico di
--     riferimento è la colonna unica `valore` (0010); i range non sono mai
--     stati mostrati.
--   • societa.codice_invito — meccanismo di invito legacy (0001), sostituito
--     da `codici_accesso` in 0004 (dove era già stato reso nullable).
--
-- Restano invece: categorie_item.fonte (mostrata in ArticleDetail),
-- articoli.foto_url (copertina), articoli.scambiato_at (macchina a stati
-- dello scambio, cfr. 0013/0014).
-- ════════════════════════════════════════════════════════════════

alter table public.categorie_item
  drop column if exists co2_min,
  drop column if exists co2_max,
  drop column if exists acqua_min,
  drop column if exists acqua_max,
  drop column if exists valore_min,
  drop column if exists valore_max;

alter table public.societa
  drop column if exists codice_invito;


-- ═══════════════════════════════════════════════════════════
-- Renova · Migrazione 0020 — Opzioni materiale L1 dai blend osservati
-- ═══════════════════════════════════════════════════════════
-- Riallinea il tap L0+1 (categorie_item.materiali) ai blend REALMENTE
-- osservati nei 5 cataloghi teamwear (Legea, Givova, Joma, Macron, Erreà),
-- cfr. §3/§8 del documento metodologico. Le opzioni sono un sottoinsieme
-- RICONOSCIBILE dei blend rappresentativi: ogni voce corrisponde a un
-- cluster che l'utente può distinguere a vista/tatto (tecnico PET, cotone,
-- misto/felpato, elasticizzato PET+EA, nylon PA, polipropilene), con blend
-- pari alla composizione modale osservata del cluster.
--
-- NON modifica peso_kg né profilo_default (profilo L0): restano quelli del §3.
-- Le percentuali dei blend usano i codici fibra della tabella `fibre`.
-- ═══════════════════════════════════════════════════════════

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco','hint','Liscia, leggera, elastica; asciuga in fretta.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / piqué','hint','Morbida e opaca, trama a nido d''ape; come una polo classica.','blend','{"CO": 100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Polo';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco','hint','Liscia, leggera, spesso traforata; asciuga in fretta.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','elastico','label','Tecnico elasticizzato','hint','Elastica e aderente; contiene un po'' di elastan.','blend','{"PET": 92, "EA": 8}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone','hint','Morbida e opaca, scalda, si stropiccia.','blend','{"CO": 100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Canotta';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco','hint','Liscia, leggera, elastica; asciuga in fretta. Spesso traforata o lucida.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','elastico','label','Tecnico elasticizzato','hint','Elastica e aderente; contiene un po'' di elastan.','blend','{"PET": 92, "EA": 8}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone','hint','Morbida e opaca, scalda, si stropiccia (come una t-shirt di cotone).','blend','{"CO": 100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'T-shirt';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / pile','hint','Interno liscio o in pile; leggera, asciuga in fretta.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / felpato','hint','Interno garzato morbido, scalda, si stropiccia.','blend','{"CO": 65, "PET": 35}'::jsonb),
    jsonb_build_object('chiave','elastico','label','Tecnico elasticizzato','hint','Aderente, con un po'' di elastan.','blend','{"PET": 92, "EA": 8}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Felpa';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tuta / sportivo','hint','Liscio, leggero; asciuga in fretta.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','elastico','label','Aderente / elasticizzato','hint','Elastico e aderente alla pelle (con elastan).','blend','{"PET": 92, "EA": 8}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / felpato','hint','Più morbido e pesante, in parte cotone.','blend','{"CO": 65, "PET": 35}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Pantaloni';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco','hint','Liscio, leggero, elastico; asciuga in fretta.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','elastico','label','Tecnico elasticizzato','hint','Aderente, con un po'' di elastan.','blend','{"PET": 92, "EA": 8}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / felpato','hint','Un po'' più pesante e morbido, in parte cotone.','blend','{"CO": 65, "PET": 35}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Pantaloncini';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / pile','hint','Liscia o in pile; spesso impermeabile o softshell.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','elastico','label','Tecnico elasticizzato','hint','Elastica, con un po'' di elastan.','blend','{"PET": 88, "EA": 12}'::jsonb),
    jsonb_build_object('chiave','nylon','label','Nylon / poliammide','hint','Molto leggera e frusciante; l''etichetta dice «nylon/PA».','blend','{"PA": 100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Giacca';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Sintetico / imbottito','hint','Leggero, liscio; spesso imbottito o in pile.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','elastico','label','Tecnico elasticizzato','hint','Elastico e aderente (con elastan).','blend','{"PET": 81, "EA": 19}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Gilet';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','poliestere','label','Poliestere','hint','Leggero, fruscia poco; l''etichetta dice «poliestere/PES».','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','nylon','label','Nylon / poliammide','hint','Molto leggero e frusciante; l''etichetta dice «nylon/poliammide/PA».','blend','{"PA": 100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'K-way';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Sportivi tecnici','hint','Sottili, elastici, lisci; spesso in nylon.','blend','{"PA": 90, "EA": 10}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Con cotone / spugna','hint','Spessi e morbidi, tipo spugna sotto il piede.','blend','{"PET": 70, "CO": 15, "EA": 15}'::jsonb),
    jsonb_build_object('chiave','polipropilene','label','Traspiranti / polipropilene','hint','Molto leggeri, tecnici da corsa; l''etichetta dice «polipropilene/PP».','blend','{"PP": 100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Calzini';


-- ═══════════════════════════════════════════════════════════
-- Renova · Migrazione 0021 — Tap materiale L1: criterio dello scostamento >10%
-- ═══════════════════════════════════════════════════════════
-- Ridefinisce categorie_item.materiali (tap L0+1) secondo il criterio del §3:
-- un'opzione dedicata solo per i blend che distano oltre ~10 punti percentuali
-- da una fibra pura (le varianti quasi pure sono assorbite nella fibra: es.
-- 92% PET / 8% EA = 100% PET). Sostituisce le opzioni della 0020.
-- Aggiunte rispetto alla lista base: nylon per pantaloni/pantaloncini e, per i
-- calzini, l'opzione in poliestere tecnico e in polipropilene — senza le quali
-- i calzini sintetici a bassa water footprint venivano stimati come cotone
-- (errore acqua L0+1 84%→29%). NON tocca peso_kg né profilo_default (L0).
-- ═══════════════════════════════════════════════════════════

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco','hint','Liscia, leggera, elastica; asciuga in fretta.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / piqué','hint','Morbida e opaca, trama a nido d''ape; come una polo classica.','blend','{"CO": 100}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone','hint','Un po'' di entrambi: morbida ma più resistente.','blend','{"CO": 60, "PET": 40}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Polo';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco','hint','Liscia, leggera, spesso traforata; asciuga in fretta.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone','hint','Morbida e opaca, scalda, si stropiccia.','blend','{"CO": 100}'::jsonb),
    jsonb_build_object('chiave','nylon','label','Nylon / misto elastico','hint','Leggera e setosa, molto elastica; l''etichetta indica nylon/poliammide.','blend','{"PA": 67, "PET": 25, "EA": 8}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Canotta';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco','hint','Liscia, leggera, elastica; asciuga in fretta. Spesso traforata o lucida.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone','hint','Morbida e opaca, scalda, si stropiccia (come una t-shirt di cotone).','blend','{"CO": 100}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone','hint','Un po'' di entrambi: morbida ma più resistente.','blend','{"CO": 65, "PET": 35}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'T-shirt';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / pile','hint','Interno liscio o in pile; leggera, asciuga in fretta.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Prevalente cotone','hint','Interno garzato morbido, scalda; soprattutto cotone.','blend','{"CO": 70, "PET": 30}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone','hint','Metà cotone e metà sintetico: morbida ma resistente.','blend','{"CO": 50, "PET": 50}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Felpa';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tuta / sportivo','hint','Liscio, leggero; asciuga in fretta.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / felpato','hint','Più morbido e pesante, in parte cotone.','blend','{"CO": 65, "PET": 35}'::jsonb),
    jsonb_build_object('chiave','nylon','label','Nylon / poliammide','hint','Leggero e setoso, molto elastico; l''etichetta indica nylon/poliammide.','blend','{"PA": 92, "EA": 8}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Pantaloni';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco','hint','Liscio, leggero, elastico; asciuga in fretta.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / felpato','hint','Un po'' più pesante e morbido, in parte cotone.','blend','{"CO": 65, "PET": 35}'::jsonb),
    jsonb_build_object('chiave','nylon','label','Nylon / misto elastico','hint','Leggero e setoso, molto elastico; l''etichetta indica nylon/poliammide.','blend','{"PA": 67, "PET": 25, "EA": 8}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Pantaloncini';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / pile','hint','Liscia o in pile; spesso impermeabile o softshell.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','elastico','label','Tecnico elasticizzato','hint','Elastica e aderente; contiene un po'' di elastan.','blend','{"PET": 88, "EA": 12}'::jsonb),
    jsonb_build_object('chiave','nylon','label','Nylon / poliammide','hint','Molto leggera e frusciante; l''etichetta dice «nylon/PA».','blend','{"PA": 100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Giacca';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Sintetico / imbottito','hint','Leggero, liscio; spesso imbottito o in pile.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','elastico','label','Tecnico elasticizzato','hint','Elastico e aderente (con elastan).','blend','{"PET": 81, "EA": 19}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Gilet';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','poliestere','label','Poliestere','hint','Leggero, fruscia poco; l''etichetta dice «poliestere/PES».','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','nylon','label','Nylon / poliammide','hint','Molto leggero e frusciante; l''etichetta dice «nylon/poliammide/PA».','blend','{"PA": 100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'K-way';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Sportivi tecnici (poliestere)','hint','Sottili, tecnici; l''etichetta dice «poliestere/PES».','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','nylon','label','Sportivi tecnici (nylon)','hint','Sottili, elastici, lisci; l''etichetta dice «nylon/PA».','blend','{"PA": 90, "EA": 10}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto tecnico','hint','Elastici e strutturati, misti sintetici.','blend','{"PET": 55, "PA": 30, "EA": 15}'::jsonb),
    jsonb_build_object('chiave','polipropilene','label','Traspiranti / polipropilene','hint','Molto leggeri, tecnici da corsa; l''etichetta dice «polipropilene/PP».','blend','{"PP": 100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Calzini';
