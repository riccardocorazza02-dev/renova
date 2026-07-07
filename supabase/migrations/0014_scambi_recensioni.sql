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
