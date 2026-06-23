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
