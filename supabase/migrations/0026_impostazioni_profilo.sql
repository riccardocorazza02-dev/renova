-- ════════════════════════════════════════════════════════════════
-- Renova · Migrazione 0026 — Profilo utente esteso (sezione Impostazioni)
-- ════════════════════════════════════════════════════════════════
-- Introduce l'identità pubblica e i dati facoltativi del profilo:
--
--   • `nome_utente` — identità PUBBLICA e modificabile (unica, 3–30
--     caratteri). È ciò che gli altri vedono in chat, scambi e recensioni;
--     `nome_completo` resta e diventa il dato ANAGRAFICO privato
--     («Impostazioni account»), visibile solo all'interessato.
--   • `bio`, `foto_profilo_url`, `citta`/`provincia`/`regione` (Dettaglio
--     profilo — la geografia servirà per le aree di scambio limitrofe).
--   • `telefono`, `sesso`, `data_nascita` (Impostazioni account, tutti
--     facoltativi; il telefono NON è verificato: nessun provider SMS).
--
-- Le RPC che snapshottano i nomi (`inizia_conversazione`,
-- `registra_scambio`) passano a `nome_utente`. Un trigger blocca la
-- modifica dei campi non editabili dal profilo (società, sport).
-- Ogni nuovo dato è dichiarato nella privacy policy (§ dati trattati).
-- ════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. Nuove colonne su `utenti`
-- ─────────────────────────────────────────────
alter table public.utenti
  add column if not exists nome_utente      text,
  add column if not exists bio              text,
  add column if not exists foto_profilo_url text,
  add column if not exists citta            text,
  add column if not exists provincia        text,
  add column if not exists regione          text,
  add column if not exists telefono         text,
  add column if not exists sesso            text,
  add column if not exists data_nascita     date;

comment on column public.utenti.nome_utente is
  'Identità pubblica (unica, case-insensitive). nome_completo è il dato anagrafico privato.';
comment on column public.utenti.provincia is 'Sigla provincia (es. BO), derivata dal comune scelto.';
comment on column public.utenti.telefono  is 'Facoltativo e NON verificato (nessun provider SMS).';

-- ─────────────────────────────────────────────
-- 2. Backfill di nome_utente per gli account esistenti: parte locale
--    dell'email, ripulita; i duplicati ricevono un suffisso numerico.
-- ─────────────────────────────────────────────
with slug as (
  select u.id,
         coalesce(
           nullif(left(lower(regexp_replace(split_part(au.email, '@', 1),
                                            '[^a-z0-9._-]', '', 'g')), 24), ''),
           'utente'
         ) as base
  from public.utenti u
  left join auth.users au on au.id = u.id
  where u.nome_utente is null
),
numerati as (
  select id,
         case when char_length(base) < 3 then rpad(base, 3, '0') else base end as base,
         row_number() over (partition by base order by id) as rn
  from slug
)
update public.utenti u
set nome_utente = case when n.rn = 1 then n.base else n.base || n.rn end
from numerati n
where u.id = n.id;

alter table public.utenti alter column nome_utente set not null;

-- ─────────────────────────────────────────────
-- 3. Vincoli
-- ─────────────────────────────────────────────
create unique index if not exists uq_utenti_nome_utente
  on public.utenti (lower(nome_utente));

alter table public.utenti
  drop constraint if exists utenti_nome_utente_valido,
  add constraint utenti_nome_utente_valido
    check (char_length(trim(nome_utente)) between 3 and 30);

alter table public.utenti
  drop constraint if exists utenti_bio_max,
  add constraint utenti_bio_max
    check (bio is null or char_length(bio) <= 300);

alter table public.utenti
  drop constraint if exists utenti_sesso_valido,
  add constraint utenti_sesso_valido
    check (sesso is null or sesso in ('Maschio', 'Femmina', 'Altro'));

alter table public.utenti
  drop constraint if exists utenti_telefono_valido,
  add constraint utenti_telefono_valido
    check (telefono is null or telefono ~ '^\+?[0-9][0-9 ]{5,19}$');

alter table public.utenti
  drop constraint if exists utenti_data_nascita_valida,
  add constraint utenti_data_nascita_valida
    check (data_nascita is null
           or (data_nascita >= date '1900-01-01' and data_nascita <= current_date));

-- ─────────────────────────────────────────────
-- 4. Campi immutabili: la policy di UPDATE (0002) consente all'utente di
--    modificare la propria riga, ma società, sport e identità restano
--    fissati dal codice di accesso — il client non deve poterli cambiare.
-- ─────────────────────────────────────────────
create or replace function public.utenti_blocca_campi_immutabili()
returns trigger
language plpgsql
as $$
begin
  if new.id         <> old.id
     or new.id_societa <> old.id_societa
     or new.sport      <> old.sport
     or new.created_at <> old.created_at then
    raise exception 'Società, sport e identità non sono modificabili dal profilo'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_utenti_campi_immutabili on public.utenti;
create trigger trg_utenti_campi_immutabili
  before update on public.utenti
  for each row execute function public.utenti_blocca_campi_immutabili();

-- ─────────────────────────────────────────────
-- 5. Registrazione: handle_new_user genera anche il nome utente di
--    default (parte locale dell'email, con suffisso in caso di conflitto).
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
  v_slug       text;
  v_username   text;
  v_n          int := 1;
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

  -- Nome utente di default: parte locale dell'email, ripulita e resa unica.
  v_slug := coalesce(
    nullif(left(lower(regexp_replace(split_part(new.email, '@', 1),
                                     '[^a-z0-9._-]', '', 'g')), 24), ''),
    'utente'
  );
  if char_length(v_slug) < 3 then
    v_slug := rpad(v_slug, 3, '0');
  end if;
  v_username := v_slug;
  while exists (select 1 from public.utenti where lower(nome_utente) = lower(v_username)) loop
    v_n := v_n + 1;
    v_username := v_slug || v_n;
  end loop;

  insert into public.utenti (id, nome_completo, nome_utente, id_societa, sport)
  values (new.id, v_nome, v_username, v_societa_id, v_sport);

  return new;
end;
$$;

-- ─────────────────────────────────────────────
-- 6. inizia_conversazione: lo snapshot dei nomi usa l'identità pubblica.
--    (Identica a 0012 salvo `nome_utente` al posto di `nome_completo`.)
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

  select nome_utente into v_owner_nome from public.utenti where id = v_owner;
  select nome_utente into v_me_nome    from public.utenti where id = v_me;

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
-- 7. registra_scambio: idem — lo snapshot dei nomi usa l'identità
--    pubblica. (Identica a 0025 salvo `nome_utente`.)
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

  select nome_utente into v_owner_nome from public.utenti where id = v_me;
  select nome_utente into v_acq_nome   from public.utenti where id = p_id_acquirente;

  -- autorizza la transizione di stato per il solo update qui sotto
  perform set_config('loop.scambio_ok', '1', true);
  update public.articoli set stato = 'Scambiato' where id = p_id_articolo;
  perform set_config('loop.scambio_ok', '0', true);

  -- livello INDIVIDUALE (dato personale, retention 12 mesi)
  insert into public.scambi
    (id_articolo, id_venditore, id_acquirente, nome_venditore, nome_acquirente,
     titolo_articolo, foto_url, id_societa, co2, acqua, valore)
  values
    (p_id_articolo, v_me, p_id_acquirente,
     coalesce(v_owner_nome, 'Utente'), coalesce(v_acq_nome, 'Utente'),
     v_art.titolo, v_art.foto, v_art.id_societa,
     coalesce(v_co2, 0), coalesce(v_acqua, 0), coalesce(v_art.prezzo, 0))
  returning id into v_scambio;

  -- livello AGGREGATO E ANONIMO (permanente)
  insert into public.impatto_aggregato as ia
    (mese, id_societa, id_categoria, n_scambi, co2, acqua, valore)
  values
    (date_trunc('month', now())::date, v_art.id_societa, v_art.id_categoria,
     1, coalesce(v_co2, 0), coalesce(v_acqua, 0), coalesce(v_art.prezzo, 0))
  on conflict (mese, (coalesce(id_societa, -1)), (coalesce(id_categoria, -1)))
  do update set
    n_scambi      = ia.n_scambi + excluded.n_scambi,
    co2           = ia.co2      + excluded.co2,
    acqua         = ia.acqua    + excluded.acqua,
    valore        = ia.valore   + excluded.valore,
    aggiornato_at = now();

  return v_scambio;
end;
$$;
