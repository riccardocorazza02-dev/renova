-- ════════════════════════════════════════════════════════════════
-- Renova · Migrazione 0019 — Rinomina identificatori Loop → Renova
-- ════════════════════════════════════════════════════════════════
-- Il progetto è stato rinominato da «Loop» a «Renova». Questa migrazione
-- riallinea gli identificatori SQL al nuovo nome:
--
--   • loop_impatto_blend → renova_impatto_blend (funzione di calcolo
--     dell'impatto di un blend di fibre per un dato peso, cfr. 0015);
--   • le funzioni che la richiamano (set_articolo_impatto) e quelle che
--     usano la variabile di sessione di guardia (set_scambiato_at,
--     registra_scambio) vengono ricreate con il prefisso `renova.scambio_ok`
--     al posto di `loop.scambio_ok`.
--
-- NB: applicata al progetto remoto il 2026-07-06 (versione 20260706123258,
-- nome remoto `rinomina_loop_renova`); questo file la porta nel repo per
-- mantenere ricostruibile lo schema da zero.
-- ════════════════════════════════════════════════════════════════

create or replace function public.renova_impatto_blend(p_blend jsonb, p_peso numeric)
returns table (co2 numeric, acqua numeric)
language sql stable set search_path = public
as $$
  select
    coalesce(round(sum((e.value)::numeric / 100 * f.co2)            * coalesce(p_peso, 0), 2), 0),
    coalesce(round(sum((e.value)::numeric / 100 * coalesce(f.acqua,0)) * coalesce(p_peso, 0), 1), 0)
  from jsonb_each_text(coalesce(p_blend, '{}'::jsonb)) e
  join public.fibre f on f.codice = e.key;
$$;

revoke execute on function public.renova_impatto_blend(jsonb, numeric) from public, anon;

create or replace function public.set_articolo_impatto()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_cat   record;
  v_blend jsonb;
  v_co2   numeric;
  v_acqua numeric;
begin
  select peso_kg, profilo_default, co2_tipico, acqua_tipico
    into v_cat
  from public.categorie_item where id = new.id_categoria;

  if v_cat.profilo_default is null or v_cat.peso_kg is null then
    new.composizione  := null;
    new.fonte_impatto := 'categoria';
    new.co2           := coalesce(v_cat.co2_tipico, 0);
    new.acqua         := coalesce(v_cat.acqua_tipico, 0);
  else
    v_blend := coalesce(new.composizione, v_cat.profilo_default);
    select co2, acqua into v_co2, v_acqua
      from public.renova_impatto_blend(v_blend, v_cat.peso_kg);
    new.co2   := v_co2;
    new.acqua := v_acqua;
    if new.composizione is null then
      new.fonte_impatto := 'categoria';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.set_scambiato_at()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if old.stato = 'Scambiato' and new.stato is distinct from old.stato then
    raise exception 'Uno scambio è definitivo: lo stato non può più cambiare'
      using errcode = '42501';
  end if;

  if new.stato = 'Scambiato' and old.stato is distinct from 'Scambiato' then
    if current_setting('renova.scambio_ok', true) is distinct from '1' then
      raise exception 'Per concludere uno scambio usa la conferma di scambio'
        using errcode = '42501';
    end if;
    new.scambiato_at := now();
  end if;

  return new;
end;
$$;

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
  v_owner_nome text;
  v_acq_nome   text;
  v_scambio    bigint;
begin
  if v_me is null then
    raise exception 'Utente non autenticato' using errcode = '42501';
  end if;

  select a.id, a.id_utente, a.id_societa, a.titolo, a.prezzo, a.stato,
         a.co2, a.acqua, coalesce(a.foto_urls[1], a.foto_url) as foto
    into v_art
  from public.articoli a
  where a.id = p_id_articolo
  for update;

  if not found then
    raise exception 'Articolo inesistente' using errcode = 'P0002';
  end if;
  if v_art.id_utente <> v_me then
    raise exception 'Solo il proprietario può concludere lo scambio' using errcode = '42501';
  end if;
  if v_art.stato = 'Scambiato' then
    raise exception 'Articolo già scambiato' using errcode = '42501';
  end if;
  if p_id_acquirente = v_me then
    raise exception 'Non puoi scambiare con te stesso' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.conversazioni c
    where c.id_articolo     = p_id_articolo
      and c.id_proprietario = v_me
      and c.id_acquirente   = p_id_acquirente
  ) then
    raise exception 'Nessuna conversazione con questo utente per l''articolo'
      using errcode = '42501';
  end if;

  select nome_completo into v_owner_nome from public.utenti where id = v_me;
  select nome_completo into v_acq_nome   from public.utenti where id = p_id_acquirente;

  perform set_config('renova.scambio_ok', '1', true);
  update public.articoli set stato = 'Scambiato' where id = p_id_articolo;
  perform set_config('renova.scambio_ok', '0', true);

  insert into public.scambi
    (id_articolo, id_venditore, id_acquirente, nome_venditore, nome_acquirente,
     titolo_articolo, foto_url, id_societa, co2, acqua, valore)
  values
    (p_id_articolo, v_me, p_id_acquirente,
     coalesce(v_owner_nome, 'Utente'), coalesce(v_acq_nome, 'Utente'),
     v_art.titolo, v_art.foto, v_art.id_societa,
     coalesce(v_art.co2, 0), coalesce(v_art.acqua, 0), coalesce(v_art.prezzo, 0))
  returning id into v_scambio;

  return v_scambio;
end;
$$;

revoke execute on function public.set_articolo_impatto()         from public, anon, authenticated;
revoke execute on function public.registra_scambio(bigint, uuid) from public, anon;

drop function if exists public.loop_impatto_blend(jsonb, numeric);
