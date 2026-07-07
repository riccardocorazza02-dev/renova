-- ════════════════════════════════════════════════════════════════
-- Renova · Migrazione 0012 — Chat tra utenti + scambio degli articoli
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
