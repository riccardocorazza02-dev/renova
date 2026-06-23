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
