-- ════════════════════════════════════════════════════════════════
-- Renova · Migrazione 0024 — La chat nasce con il PRIMO MESSAGGIO
-- ════════════════════════════════════════════════════════════════
-- Problema: `inizia_conversazione` veniva chiamata già al tocco di «Chiedi
-- informazioni» sulla scheda articolo. La conversazione nasceva quindi
-- VUOTA e il proprietario vedeva subito la chat in elenco + il badge dei
-- non letti (`letto_proprietario` null ⇒ non letta), anche se l'interessato
-- non aveva ancora scritto nulla — e magari aveva solo sbirciato.
--
-- Il client ora tiene la chat come BOZZA locale (`/chat/nuova/:idArticolo`)
-- e chiama la RPC solo al primo invio. Qui la stessa regola lato server,
-- che resta la fonte di verità:
--
--   1. `conversazioni.primo_messaggio_at` — valorizzato dal trigger di bump
--      quando arriva il primo messaggio;
--   2. RLS: una conversazione SENZA messaggi non è visibile a nessuno dei
--      due partecipanti (non compare in elenco, non conta nel badge, non
--      finisce tra gli interessati in GestioneStato). Resta comunque
--      raggiungibile dalle funzioni SECURITY DEFINER — `inizia_conversazione`
--      resta idempotente e `is_partecipante` continua ad autorizzare
--      l'invio del primo messaggio;
--   3. pulizia delle conversazioni vuote già create dal comportamento
--      precedente (nessun messaggio ⇒ nessun contenuto da perdere).
-- ════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. Momento del primo messaggio
-- ─────────────────────────────────────────────
alter table public.conversazioni
  add column if not exists primo_messaggio_at timestamptz;

-- Backfill delle conversazioni già avviate davvero.
update public.conversazioni c
   set primo_messaggio_at = m.primo
  from (
    select id_conversazione, min(created_at) as primo
      from public.messaggi
     group by id_conversazione
  ) m
 where m.id_conversazione = c.id
   and c.primo_messaggio_at is null;

-- ─────────────────────────────────────────────
-- 2. Pulizia: le conversazioni mai usate non devono restare in giro
--    (sarebbero invisibili dopo la nuova policy, ma tanto vale liberarle).
-- ─────────────────────────────────────────────
delete from public.conversazioni
 where primo_messaggio_at is null;

-- ─────────────────────────────────────────────
-- 3. Trigger di bump: segna anche il primo messaggio (una volta sola)
-- ─────────────────────────────────────────────
create or replace function public.bump_conversazione()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.conversazioni
     set updated_at         = now(),
         primo_messaggio_at = coalesce(primo_messaggio_at, now())
   where id = new.id_conversazione;
  return new;
end;
$$;

revoke execute on function public.bump_conversazione() from public, anon, authenticated;

-- ─────────────────────────────────────────────
-- 4. RLS: esiste solo la chat in cui qualcuno ha scritto
-- ─────────────────────────────────────────────
drop policy if exists "conversazioni: lettura partecipanti" on public.conversazioni;
create policy "conversazioni: lettura partecipanti"
  on public.conversazioni for select
  to authenticated
  using (
    auth.uid() in (id_proprietario, id_acquirente)
    and primo_messaggio_at is not null
  );
