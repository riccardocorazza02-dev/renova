-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0015 — Stima d'impatto a livelli (fibre + blend)
-- ════════════════════════════════════════════════════════════════
-- Sostituisce la stima "valore fisso di categoria" con il modello a livelli:
--   • L0  — priore di categoria (profilo sintetico) = pavimento prudenziale;
--   • L0+1 — l'utente sceglie il materiale tra opzioni rappresentative (tap);
--   • L2  — (futuro) lettura della composizione dalla foto dell'etichetta.
--
-- L'impatto di un capo tessile = Σ(%fibra × fattore) × peso del capo, coi
-- fattori CRADLE-TO-GATE del foglio «Calcolo Footprint Blend.xlsx» (10 fibre).
-- Le categorie NON tessili (calzature, parastinchi, borse, ecc.) mantengono il
-- valore fisso di categoria già presente.
--
-- Regola fibre senza dato: l'elastan e il poliuretano hanno la CO₂ (inclusa)
-- ma non l'acqua → il loro contributo idrico è zero (vedi loop_impatto_blend).
-- ════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. fibre — fattori d'impatto cradle-to-gate (dal xlsx)
-- ─────────────────────────────────────────────
create table if not exists public.fibre (
  codice text primary key,
  nome   text not null,
  co2    numeric(10,3) not null,   -- kg CO2e / kg di fibra
  acqua  numeric(10,1)             -- L / kg di fibra; NULL = dato non disponibile (escluso)
);

insert into public.fibre (codice, nome, co2, acqua) values
  ('PET',  'Poliestere vergine',    3.12, 62),
  ('rPET', 'Poliestere riciclato',  1.12, 19),
  ('CO',   'Cotone',                4.32, 4800),
  ('EA',   'Elastan',               19,   null),
  ('PA',   'Poliammide/Nylon',      9.04, 424),
  ('PU',   'Poliuretano',           4.83, null),
  ('AC',   'Acrilico',              5.4,  200),
  ('WO',   'Lana',                  38.2, 500),
  ('VI',   'Viscosa',               3.8,  400),
  ('PP',   'Polipropilene',         2.0,  17)
on conflict (codice) do update
  set nome = excluded.nome, co2 = excluded.co2, acqua = excluded.acqua;

alter table public.fibre enable row level security;
drop policy if exists "fibre: lettura pubblica" on public.fibre;
create policy "fibre: lettura pubblica" on public.fibre
  for select to anon, authenticated using (true);

-- ─────────────────────────────────────────────
-- 2. categorie_item — peso del capo, profilo L0, opzioni materiale (tap L0+1)
-- ─────────────────────────────────────────────
alter table public.categorie_item
  add column if not exists peso_kg         numeric(6,3),
  add column if not exists profilo_default jsonb,
  add column if not exists materiali       jsonb not null default '[]'::jsonb;

comment on column public.categorie_item.peso_kg is
  'Peso tipico del capo (kg). NULL = categoria non tessile a valore fisso.';
comment on column public.categorie_item.profilo_default is
  'Blend L0 (profilo sintetico prudenziale) {codice_fibra: %}. NULL = valore fisso.';
comment on column public.categorie_item.materiali is
  'Opzioni del tap L0+1: [{chiave,label,hint,blend}]. [] = nessun tap.';

-- ─────────────────────────────────────────────
-- 3. loop_impatto_blend — impatto di un blend per un dato peso (kg)
--    Acqua: le fibre con dato mancante (acqua NULL) contribuiscono 0.
-- ─────────────────────────────────────────────
create or replace function public.loop_impatto_blend(p_blend jsonb, p_peso numeric)
returns table (co2 numeric, acqua numeric)
language sql stable set search_path = public
as $$
  select
    coalesce(round(sum((e.value)::numeric / 100 * f.co2)            * coalesce(p_peso, 0), 2), 0),
    coalesce(round(sum((e.value)::numeric / 100 * coalesce(f.acqua,0)) * coalesce(p_peso, 0), 1), 0)
  from jsonb_each_text(coalesce(p_blend, '{}'::jsonb)) e
  join public.fibre f on f.codice = e.key;
$$;

-- ─────────────────────────────────────────────
-- 4. Seed: peso + profilo L0 + opzioni materiale per i capi TESSILI.
--    (Le categorie non elencate restano a valore fisso: profilo_default NULL.)
-- ─────────────────────────────────────────────

-- Maglie / canotte / t-shirt tecniche
update public.categorie_item set
  peso_kg = 0.150,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco',
      'hint','Liscio, leggero, elastico; asciuga in fretta. Spesso traforato o lucido.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone',
      'hint','Morbido e opaco, scalda, si stropiccia (come una t-shirt di cotone).','blend','{"CO":100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome in ('Maglia / t-shirt tecnica','Maglia tecnica da allenamento','Canotta da gioco (double)');

-- Pantaloncini (allenamento / gioco / basket)
update public.categorie_item set
  peso_kg = 0.130,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco',
      'hint','Liscio, leggero, elastico; asciuga in fretta.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone',
      'hint','Tessuto un po'' più pesante e morbido, in parte cotone.','blend','{"PET":50,"CO":50}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome in ('Pantaloncini da allenamento','Pantaloncini da gioco','Pantaloncini da basket');

-- Felpa sportiva
update public.categorie_item set
  peso_kg = 0.450,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / sportivo',
      'hint','Interno liscio, leggero, elastico; asciuga in fretta.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / felpato',
      'hint','Interno garzato morbido, scalda, si stropiccia.','blend','{"CO":65,"PET":35}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Felpa sportiva';

-- Pantaloni della tuta
update public.categorie_item set
  peso_kg = 0.400,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / sportivo',
      'hint','Liscio, leggero, elastico; asciuga in fretta.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone',
      'hint','Più morbido e pesante, in parte cotone.','blend','{"PET":50,"CO":50}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Pantaloni della tuta';

-- Giacca sportiva
update public.categorie_item set
  peso_kg = 0.300,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / sportivo',
      'hint','Liscio, leggero; spesso impermeabile o softshell.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / casual',
      'hint','Più morbida e pesante, in parte cotone.','blend','{"CO":65,"PET":35}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Giacca sportiva';

-- K-way / giacca antivento (materiale ~certo: nessun tap)
update public.categorie_item set
  peso_kg = 0.250,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = '[]'::jsonb
where nome in ('K-way / giacca antipioggia','K-way / giacca leggera','K-way / giacca');

-- Calze / calzettoni
update public.categorie_item set
  peso_kg = 0.100,
  profilo_default = '{"PET":80,"EA":20}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Sportive tecniche',
      'hint','Sottili, elastiche, lisce.','blend','{"PET":80,"EA":20}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Con cotone / spugna',
      'hint','Spesse e morbide, tipo spugna sotto il piede.','blend','{"PET":70,"CO":15,"EA":15}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome in ('Calzettoni da calcio','Calzini sportivi','Calzini da basket');

-- Berretto / cuffia
update public.categorie_item set
  peso_kg = 0.100,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Sintetico',
      'hint','Leggero, liscio o elastico.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','acrilico','label','A maglia / caldo',
      'hint','Lavorato a maglia, caldo, non punge (acrilico).','blend','{"AC":100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone',
      'hint','Morbido, opaco, assorbe.','blend','{"CO":100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Berretto / cuffia';

-- ─────────────────────────────────────────────
-- 5. Ricalcolo delle baseline di categoria (solo capi tessili) col xlsx.
--    co2/acqua_tipico = profilo L0; co2/acqua_max = peggiore opzione materiale.
-- ─────────────────────────────────────────────
update public.categorie_item c set
  co2_tipico   = (select co2   from public.loop_impatto_blend(c.profilo_default, c.peso_kg)),
  acqua_tipico = (select acqua from public.loop_impatto_blend(c.profilo_default, c.peso_kg)),
  co2_min      = (select co2   from public.loop_impatto_blend(c.profilo_default, c.peso_kg)),
  acqua_min    = (select acqua from public.loop_impatto_blend(c.profilo_default, c.peso_kg)),
  co2_max      = (select co2   from public.loop_impatto_blend(c.profilo_default, c.peso_kg)),
  acqua_max    = (select acqua from public.loop_impatto_blend(c.profilo_default, c.peso_kg))
where c.profilo_default is not null;

update public.categorie_item c set
  co2_max   = greatest(c.co2_max,   sub.co2max),
  acqua_max = greatest(c.acqua_max, sub.acquamax)
from (
  select c2.id,
         max((select co2   from public.loop_impatto_blend(coalesce((m->>'blend')::jsonb, c2.profilo_default), c2.peso_kg))) as co2max,
         max((select acqua from public.loop_impatto_blend(coalesce((m->>'blend')::jsonb, c2.profilo_default), c2.peso_kg))) as acquamax
  from public.categorie_item c2, jsonb_array_elements(c2.materiali) m
  where c2.profilo_default is not null
  group by c2.id
) sub
where c.id = sub.id;

-- ─────────────────────────────────────────────
-- 6. articoli — composizione, provenienza, impatto calcolato, foto etichetta
-- ─────────────────────────────────────────────
alter table public.articoli
  add column if not exists composizione      jsonb,
  add column if not exists fonte_impatto      text not null default 'categoria'
    check (fonte_impatto in ('categoria','utente','etichetta')),
  add column if not exists co2                numeric(10,2) not null default 0,
  add column if not exists acqua              numeric(10,2) not null default 0,
  add column if not exists foto_etichetta_url text;

comment on column public.articoli.fonte_impatto is
  'Provenienza della stima: categoria (L0) | utente (L0+1) | etichetta (L2).';

-- ─────────────────────────────────────────────
-- 7. Trigger: calcola co2/acqua dell'articolo all'inserimento.
--    Capo tessile → blend (utente o profilo L0) × peso. Altrimenti valore fisso.
-- ─────────────────────────────────────────────
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
    -- categoria non tessile: valore fisso di categoria
    new.composizione  := null;
    new.fonte_impatto := 'categoria';
    new.co2           := coalesce(v_cat.co2_tipico, 0);
    new.acqua         := coalesce(v_cat.acqua_tipico, 0);
  else
    v_blend := coalesce(new.composizione, v_cat.profilo_default);
    select co2, acqua into v_co2, v_acqua
      from public.loop_impatto_blend(v_blend, v_cat.peso_kg);
    new.co2   := v_co2;
    new.acqua := v_acqua;
    if new.composizione is null then
      new.fonte_impatto := 'categoria';
    end if;  -- se c'è composizione, rispetta fonte_impatto inviata (utente/etichetta)
  end if;

  return new;
end;
$$;

drop trigger if exists trg_set_articolo_impatto on public.articoli;
create trigger trg_set_articolo_impatto
  before insert on public.articoli
  for each row execute function public.set_articolo_impatto();

-- ─────────────────────────────────────────────
-- 8. Backfill degli articoli esistenti (snapshot col nuovo modello)
-- ─────────────────────────────────────────────
update public.articoli a set
  co2   = sub.co2,
  acqua = sub.acqua
from (
  select a2.id,
         case when c.profilo_default is null then coalesce(c.co2_tipico,0)
              else (select co2 from public.loop_impatto_blend(c.profilo_default, c.peso_kg)) end   as co2,
         case when c.profilo_default is null then coalesce(c.acqua_tipico,0)
              else (select acqua from public.loop_impatto_blend(c.profilo_default, c.peso_kg)) end as acqua
  from public.articoli a2
  join public.categorie_item c on c.id = a2.id_categoria
) sub
where a.id = sub.id;

-- ─────────────────────────────────────────────
-- 9. registra_scambio: lo snapshot d'impatto ora viene dall'ARTICOLO
--    (riflette il materiale scelto), non più dal valore tipico di categoria.
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
     coalesce(v_art.co2, 0), coalesce(v_art.acqua, 0), coalesce(v_art.prezzo, 0))
  returning id into v_scambio;

  return v_scambio;
end;
$$;

-- Hardening coerente con le migrazioni precedenti
revoke execute on function public.set_articolo_impatto()              from public, anon, authenticated;
revoke execute on function public.registra_scambio(bigint, uuid)      from public, anon;
