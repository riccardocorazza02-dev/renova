-- ════════════════════════════════════════════════════════════════
-- Renova · Migrazione 0023 — Eliminazione account (diritto all'oblio)
-- ════════════════════════════════════════════════════════════════
-- Introduce la RPC `elimina_account()` con cui l'utente autenticato cancella
-- definitivamente il proprio account (GDPR, art. 17). Cosa succede ai dati:
--
--   • articoli dell'utente → ELIMINATI (le foto nello storage le rimuove il
--     CLIENT prima di chiamare la RPC: Supabase vieta il DELETE SQL diretto
--     su storage.objects — trigger storage.protect_delete — e la policy
--     «articoli storage: delete proprio» già consente all'utente di
--     cancellare la propria cartella via Storage API);
--   • chat (conversazioni + messaggi) a cui partecipa → ELIMINATE per
--     entrambi i lati (i messaggi sono dati personali di chi li ha scritti);
--   • scambi → CONSERVATI ma ANONIMIZZATI: lo storico è il registro
--     dell'impatto della società e della controparte, quindi la riga resta,
--     ma il riferimento all'utente diventa NULL e il nome denormalizzato
--     diventa «Utente eliminato»;
--   • recensioni → CONSERVATE (la media della controparte non deve
--     cambiare) ma scollegate dall'utente (riferimento NULL);
--   • riga `utenti` + account `auth.users` → ELIMINATI.
--
-- Per permettere la conservazione anonima, le FK di `scambi` e `recensioni`
-- verso `utenti` passano da ON DELETE CASCADE a ON DELETE SET NULL (con
-- colonne rese nullable). I CHECK esistenti (<>) restano validi coi NULL.
-- ════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. FK: lo storico sopravvive all'utente (SET NULL, non CASCADE)
-- ─────────────────────────────────────────────
alter table public.scambi
  alter column id_venditore  drop not null,
  alter column id_acquirente drop not null;

alter table public.scambi
  drop constraint scambi_id_venditore_fkey,
  add constraint scambi_id_venditore_fkey
    foreign key (id_venditore) references public.utenti(id) on delete set null;

alter table public.scambi
  drop constraint scambi_id_acquirente_fkey,
  add constraint scambi_id_acquirente_fkey
    foreign key (id_acquirente) references public.utenti(id) on delete set null;

alter table public.recensioni
  alter column id_autore       drop not null,
  alter column id_destinatario drop not null;

alter table public.recensioni
  drop constraint recensioni_id_autore_fkey,
  add constraint recensioni_id_autore_fkey
    foreign key (id_autore) references public.utenti(id) on delete set null;

alter table public.recensioni
  drop constraint recensioni_id_destinatario_fkey,
  add constraint recensioni_id_destinatario_fkey
    foreign key (id_destinatario) references public.utenti(id) on delete set null;

-- ─────────────────────────────────────────────
-- 2. RPC elimina_account — cancella l'utente corrente
-- ─────────────────────────────────────────────
create or replace function public.elimina_account()
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'Utente non autenticato' using errcode = '42501';
  end if;

  -- Anonimizza i nomi denormalizzati nello storico scambi PRIMA della
  -- cancellazione (le FK poi azzerano i riferimenti uuid).
  update public.scambi
     set nome_venditore = 'Utente eliminato'
   where id_venditore = v_me;
  update public.scambi
     set nome_acquirente = 'Utente eliminato'
   where id_acquirente = v_me;

  -- NB: le foto nello storage (cartella <uid>/…) vengono rimosse dal client
  -- via Storage API prima di questa chiamata (vedi AuthContext.deleteAccount).

  -- Cancella l'account: la cascata elimina `utenti`, quindi `articoli`,
  -- `conversazioni` (per entrambe le FK partecipante) e `messaggi`;
  -- `scambi`/`recensioni` restano con i riferimenti a NULL (punto 1).
  delete from auth.users where id = v_me;
end;
$$;

revoke execute on function public.elimina_account() from public, anon;
grant  execute on function public.elimina_account() to authenticated;
