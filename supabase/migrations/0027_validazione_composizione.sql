-- ════════════════════════════════════════════════════════════════
-- Renova · Migrazione 0027 — Validazione della composizione
-- ════════════════════════════════════════════════════════════════
-- Con il Livello 2 (lettura dell'etichetta, cfr. CLAUDE.md) l'utente può
-- confermare o correggere a mano le percentuali delle fibre: la
-- composizione non arriva più solo dai blend predefiniti del tap L1.
--
-- Finora `renova_impatto_blend` accettava qualunque JSON: un codice fibra
-- sconosciuto veniva ignorato in silenzio (contributo 0) e la somma delle
-- percentuali non era controllata. La validazione stava solo nel client.
-- Qui la portiamo nel database, che resta la fonte di verità:
--
--   • `composizione` NULL           → ammessa (stima L0 di categoria);
--   • altrimenti deve essere un oggetto JSON non vuoto in cui
--       – ogni chiave è un codice della tabella `fibre`;
--       – ogni valore è un numero > 0 e ≤ 100;
--       – la somma dei valori è 100 (tolleranza 0,01 per gli arrotondamenti
--         ai centesimi fatti dal client).
--
-- Il trigger gira su INSERT e su UPDATE della colonna, ed è chiamato
-- `trg_articoli_composizione_valida` perché i trigger BEFORE di Postgres
-- scattano in ordine alfabetico: così valida PRIMA di `trg_set_articolo_impatto`
-- (che calcola co2/acqua dal blend).
--
-- Prima di applicarla sono stati controllati i 127 blend esistenti nel
-- progetto remoto (opzioni L1, profili L0, articoli): tutti validi.
-- ════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. Funzione di validazione (riusabile, anche per le categorie)
--    Restituisce NULL se la composizione è valida, altrimenti il motivo.
-- ─────────────────────────────────────────────
create or replace function public.renova_composizione_errore(p_comp jsonb)
returns text
language plpgsql stable set search_path = public
as $$
declare
  v_somma numeric := 0;
  e       record;
begin
  if p_comp is null then
    return null;
  end if;

  if jsonb_typeof(p_comp) <> 'object' or p_comp = '{}'::jsonb then
    return 'La composizione deve indicare almeno una fibra';
  end if;

  for e in select key, value from jsonb_each(p_comp) loop
    if not exists (select 1 from public.fibre f where f.codice = e.key) then
      return format('Fibra sconosciuta nella composizione: %s', e.key);
    end if;
    if jsonb_typeof(e.value) <> 'number' then
      return format('Percentuale non numerica per la fibra %s', e.key);
    end if;
    if (e.value)::numeric <= 0 or (e.value)::numeric > 100 then
      return format('Percentuale fuori intervallo per la fibra %s', e.key);
    end if;
    v_somma := v_somma + (e.value)::numeric;
  end loop;

  if abs(v_somma - 100) > 0.01 then
    return format('Le percentuali della composizione sommano a %s invece di 100', v_somma);
  end if;

  return null;
end;
$$;

revoke execute on function public.renova_composizione_errore(jsonb) from public, anon;

-- ─────────────────────────────────────────────
-- 2. Trigger su articoli
-- ─────────────────────────────────────────────
create or replace function public.valida_composizione_articolo()
returns trigger
language plpgsql set search_path = public
as $$
declare
  v_errore text := public.renova_composizione_errore(new.composizione);
begin
  if v_errore is not null then
    raise exception '%', v_errore using errcode = '23514'; -- check_violation
  end if;
  return new;
end;
$$;

revoke execute on function public.valida_composizione_articolo() from public, anon, authenticated;

drop trigger if exists trg_articoli_composizione_valida on public.articoli;
create trigger trg_articoli_composizione_valida
  before insert or update of composizione on public.articoli
  for each row execute function public.valida_composizione_articolo();
