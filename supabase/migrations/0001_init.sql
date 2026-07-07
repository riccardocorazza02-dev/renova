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
