-- ════════════════════════════════════════════════════════════════
-- Renova · Migrazione 0028 — registra_scambio: due regressioni corrette
-- ════════════════════════════════════════════════════════════════
-- La versione di `registra_scambio` portata da 0025/0026 aveva due errori
-- rispetto al modello consolidato:
--
--   1. Guardia di stato col nome VECCHIO. Impostava `loop.scambio_ok`,
--      mentre `set_scambiato_at` (da 0019) controlla `renova.scambio_ok`:
--      ogni conferma di scambio falliva con «Per concludere uno scambio usa
--      la conferma di scambio» (ultimo scambio riuscito: 30 lug 2026).
--
--   2. Snapshot d'impatto dalla CATEGORIA. Leggeva co2_tipico/acqua_tipico
--      di `categorie_item`, tornando al modello precedente a 0015: il blend
--      dell'articolo (Livello 1 tap / Livello 2 etichetta) non entrava né
--      nello storico individuale né in `impatto_aggregato`. Da 0015 lo
--      snapshot viene dall'ARTICOLO (`articoli.co2`/`acqua`, calcolati dal
--      trigger `set_articolo_impatto` sul blend × peso).
--
-- Il resto è invariato rispetto a 0026 (nome_utente negli snapshot, due
-- livelli del registro: individuale con retention + aggregato anonimo).
-- ════════════════════════════════════════════════════════════════

create or replace function public.registra_scambio(
  p_id_articolo   bigint,
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

  -- co2/acqua dall'ARTICOLO: riflettono il materiale indicato (L1/L2)
  select a.id, a.id_utente, a.id_categoria, a.id_societa, a.titolo, a.prezzo,
         a.stato, a.co2, a.acqua, coalesce(a.foto_urls[1], a.foto_url) as foto
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

  select nome_utente into v_owner_nome from public.utenti where id = v_me;
  select nome_utente into v_acq_nome   from public.utenti where id = p_id_acquirente;

  -- autorizza la transizione di stato per il solo update qui sotto
  -- (stesso nome controllato da set_scambiato_at, cfr. 0019)
  perform set_config('renova.scambio_ok', '1', true);
  update public.articoli set stato = 'Scambiato' where id = p_id_articolo;
  perform set_config('renova.scambio_ok', '0', true);

  -- livello INDIVIDUALE (dato personale, retention 12 mesi)
  insert into public.scambi
    (id_articolo, id_venditore, id_acquirente, nome_venditore, nome_acquirente,
     titolo_articolo, foto_url, id_societa, co2, acqua, valore)
  values
    (p_id_articolo, v_me, p_id_acquirente,
     coalesce(v_owner_nome, 'Utente'), coalesce(v_acq_nome, 'Utente'),
     v_art.titolo, v_art.foto, v_art.id_societa,
     coalesce(v_art.co2, 0), coalesce(v_art.acqua, 0), coalesce(v_art.prezzo, 0))
  returning id into v_scambio;

  -- livello AGGREGATO E ANONIMO (permanente)
  insert into public.impatto_aggregato as ia
    (mese, id_societa, id_categoria, n_scambi, co2, acqua, valore)
  values
    (date_trunc('month', now())::date, v_art.id_societa, v_art.id_categoria,
     1, coalesce(v_art.co2, 0), coalesce(v_art.acqua, 0), coalesce(v_art.prezzo, 0))
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

revoke execute on function public.registra_scambio(bigint, uuid) from public, anon;
