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
