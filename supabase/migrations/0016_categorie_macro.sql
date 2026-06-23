-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0016 — Macro-categorie + nuove categorie di capo
-- ════════════════════════════════════════════════════════════════
-- Amplia il catalogo `categorie_item` con i tipi di capo dei cataloghi dei
-- top-5 brand teamwear (Givova, Joma, Macron, Legea, Erreà) e raggruppa tutte
-- le categorie per MACRO-CATEGORIA (usata dal picker in Upload.tsx).
--
-- Aggiunte (granularità moderata):
--   • Polo                                  (mancava del tutto)
--   • T-shirt tecnica / T-shirt (cotone)    (split dalla vecchia "maglia")
--   • Canotta / smanicato                   (Calcio + Pallavolo)
--   • Felpa con cappuccio / Felpa full-zip  (oltre alla girocollo)
--   • Leggings / tights
--   • Giacca / maglia in pile (polar fleece), Gilet / smanicato
-- L'abbigliamento "da rappresentanza" è CONDIVISO tra i tre sport; resta
-- sport-specifico solo il gamewear (maglia gara, canotta basket, pantaloncini).
--
-- Materiale (modello a livelli L0/L0+1/L2 di 0015): le nuove categorie tessili
-- hanno peso, profilo L0 e opzioni tap. Aggiungiamo l'opzione "Riciclato / ECO"
-- (poliestere riciclato rPET) ai capi tecnici, MA legata a un indizio LEGGIBILE
-- (scritta «riciclato/ECO/recycled»), non al riconoscimento tattile: virgin e
-- riciclato sono indistinguibili al tatto. Se non è dichiarato, il default
-- prudenziale resta il poliestere vergine → un mancato riconoscimento sottostima.
-- ════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. Nuova colonna macro_categoria
-- ─────────────────────────────────────────────
alter table public.categorie_item
  add column if not exists macro_categoria text;

comment on column public.categorie_item.macro_categoria is
  'Gruppo del picker in upload (Maglie e t-shirt, Polo, Felpe, …).';

-- ─────────────────────────────────────────────
-- 2. Rinomine per chiarezza (gli articoli usano id_categoria: nessun impatto)
-- ─────────────────────────────────────────────
update public.categorie_item set nome = 'Maglia da gara / tecnica'
  where nome = 'Maglia / t-shirt tecnica';
update public.categorie_item set nome = 'Felpa girocollo'
  where nome = 'Felpa sportiva';

-- ─────────────────────────────────────────────
-- 3. Inserimento nuove categorie
--    co2/acqua iniziali = 0 (placeholder): ricalcolate al passo 6.
-- ─────────────────────────────────────────────

-- 3a. Set condiviso tra i tre sport
insert into public.categorie_item
  (sport, nome, tipo, macro_categoria, default_ha_logo, richiede_prezzo, tipo_taglia,
   co2_min, co2_tipico, co2_max, acqua_min, acqua_tipico, acqua_max, valore_min, valore_max)
select s.sport, t.nome, 'individuale', t.macro, t.logo, false, 'abbigliamento',
       0, 0, 0, 0, 0, 0, t.vmin, t.vmax
from (values
  ('Polo',                                   'Polo',                     true,  12, 30),
  ('T-shirt tecnica',                        'Maglie e t-shirt',         true,   8, 25),
  ('T-shirt (cotone)',                       'Maglie e t-shirt',         false,  5, 20),
  ('Felpa con cappuccio',                    'Felpe',                    true,  20, 55),
  ('Felpa full-zip',                         'Felpe',                    true,  20, 55),
  ('Leggings / tights',                      'Pantaloni e pantaloncini', true,  10, 35),
  ('Giacca / maglia in pile (polar fleece)', 'Giacche e tute',           true,  20, 55),
  ('Gilet / smanicato',                      'Giacche e tute',           true,  15, 45)
) as t(nome, macro, logo, vmin, vmax)
cross join (values
  ('Calcio'::public.sport), ('Pallavolo'::public.sport), ('Basket'::public.sport)
) as s(sport)
on conflict (sport, nome) do nothing;

-- 3b. Canotta / smanicato: solo Calcio e Pallavolo (Basket ha già la canotta gara)
insert into public.categorie_item
  (sport, nome, tipo, macro_categoria, default_ha_logo, richiede_prezzo, tipo_taglia,
   co2_min, co2_tipico, co2_max, acqua_min, acqua_tipico, acqua_max, valore_min, valore_max)
select s.sport, 'Canotta / smanicato', 'individuale', 'Maglie e t-shirt', true, false,
       'abbigliamento', 0, 0, 0, 0, 0, 0, 8, 25
from (values ('Calcio'::public.sport), ('Pallavolo'::public.sport)) as s(sport)
on conflict (sport, nome) do nothing;

-- ─────────────────────────────────────────────
-- 4. Backfill macro_categoria su TUTTE le righe (pattern sul nome, prefisso)
-- ─────────────────────────────────────────────
update public.categorie_item set macro_categoria = 'Calzature'
  where nome ilike 'Scarpe%';
update public.categorie_item set macro_categoria = 'Protezioni'
  where nome in ('Parastinchi','Ginocchiere','Gomitiere','Guanti da portiere');
update public.categorie_item set macro_categoria = 'Calze'
  where nome ilike 'Calzettoni%' or nome ilike 'Calzini%';
update public.categorie_item set macro_categoria = 'Pantaloni e pantaloncini'
  where nome ilike 'Pantaloncini%' or nome ilike 'Pantaloni%' or nome ilike 'Leggings%';
update public.categorie_item set macro_categoria = 'Maglie e t-shirt'
  where nome ilike 'Maglia%' or nome ilike 'Canotta%' or nome ilike 'T-shirt%';
update public.categorie_item set macro_categoria = 'Polo'
  where nome = 'Polo';
update public.categorie_item set macro_categoria = 'Felpe'
  where nome ilike 'Felpa%';
update public.categorie_item set macro_categoria = 'Giacche e tute'
  where nome ilike 'Giacca%' or nome ilike 'K-way%' or nome ilike 'Gilet%';
update public.categorie_item set macro_categoria = 'Accessori'
  where nome in ('Zaino sportivo','Borsone sportivo','Borraccia',
    'Fascia tergisudore da polso','Fascia per capelli','Cavigliere',
    'Gambali / manicotti gamba','Manicotti braccio',
    'Manicotti braccio (shooting sleeve)','Berretto / cuffia');

-- ─────────────────────────────────────────────
-- 5. Peso + profilo L0 + opzioni materiale (tap) per le NUOVE categorie tessili
-- ─────────────────────────────────────────────

-- Polo — cotone/piqué (Erreà) oppure poliestere (Legea/Joma)
update public.categorie_item set
  peso_kg = 0.220,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','cotone','label','Cotone / piqué',
      'hint','Morbida e opaca, trama a nido d''ape; come una polo classica.','blend','{"CO":100}'::jsonb),
    jsonb_build_object('chiave','tecnico','label','Tecnico',
      'hint','Liscio, leggero, elastico; asciuga in fretta.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone',
      'hint','Un po'' di entrambi: morbida ma più resistente.','blend','{"PET":50,"CO":50}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Polo';

-- T-shirt tecnica (da allenamento) — tap ECO incluso
update public.categorie_item set
  peso_kg = 0.150,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco',
      'hint','Liscio, leggero, elastico; asciuga in fretta. Spesso traforato o lucido.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','eco','label','Riciclato / ECO',
      'hint','Solo se sul capo o sull''etichetta c''è scritto «riciclato», «ECO» o «recycled».','blend','{"rPET":100}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone',
      'hint','Tessuto un po'' più morbido e opaco, in parte cotone.','blend','{"PET":50,"CO":50}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'T-shirt tecnica';

-- T-shirt (cotone) — casual: di norma cotone
update public.categorie_item set
  peso_kg = 0.160,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','cotone','label','Cotone',
      'hint','Morbida e opaca, scalda, si stropiccia (come una t-shirt di cotone).','blend','{"CO":100}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone',
      'hint','In parte cotone, in parte sintetico.','blend','{"CO":50,"PET":50}'::jsonb),
    jsonb_build_object('chiave','tecnico','label','Tecnico / sintetico',
      'hint','Liscia, leggera, elastica; asciuga in fretta.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'T-shirt (cotone)';

-- Canotta / smanicato (Calcio + Pallavolo) — tap ECO incluso
update public.categorie_item set
  peso_kg = 0.130,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco',
      'hint','Liscia, leggera, elastica; asciuga in fretta.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','eco','label','Riciclato / ECO',
      'hint','Solo se sul capo o sull''etichetta c''è scritto «riciclato», «ECO» o «recycled».','blend','{"rPET":100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Canotta / smanicato';

-- Felpa con cappuccio
update public.categorie_item set
  peso_kg = 0.500,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / pile',
      'hint','Interno liscio o in pile; leggera, asciuga in fretta.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / felpato',
      'hint','Interno garzato morbido, scalda, si stropiccia.','blend','{"CO":65,"PET":35}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Felpa con cappuccio';

-- Felpa full-zip
update public.categorie_item set
  peso_kg = 0.480,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / pile',
      'hint','Interno liscio o in pile; leggera, asciuga in fretta.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / felpato',
      'hint','Interno garzato morbido, scalda, si stropiccia.','blend','{"CO":65,"PET":35}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Felpa full-zip';

-- Leggings / tights — aderenti con elastan; tap ECO con stesse percentuali
update public.categorie_item set
  peso_kg = 0.200,
  profilo_default = '{"PET":90,"EA":10}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / aderente',
      'hint','Liscio ed elastico, aderente alla pelle.','blend','{"PET":90,"EA":10}'::jsonb),
    jsonb_build_object('chiave','eco','label','Riciclato / ECO',
      'hint','Solo se sul capo o sull''etichetta c''è scritto «riciclato», «ECO» o «recycled».','blend','{"rPET":90,"EA":10}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Leggings / tights';

-- Giacca / maglia in pile (polar fleece) — materiale ~certo: nessun tap
update public.categorie_item set
  peso_kg = 0.350,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = '[]'::jsonb
where nome = 'Giacca / maglia in pile (polar fleece)';

-- Gilet / smanicato — materiale ~certo: nessun tap
update public.categorie_item set
  peso_kg = 0.250,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = '[]'::jsonb
where nome = 'Gilet / smanicato';

-- ─────────────────────────────────────────────
-- 6. Aggiunta del tap "Riciclato / ECO" ai capi tecnici GIÀ esistenti
-- ─────────────────────────────────────────────

-- Maglie / canotte da gioco tecniche
update public.categorie_item set
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco',
      'hint','Liscio, leggero, elastico; asciuga in fretta. Spesso traforato o lucido.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','eco','label','Riciclato / ECO',
      'hint','Solo se sul capo o sull''etichetta c''è scritto «riciclato», «ECO» o «recycled».','blend','{"rPET":100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone',
      'hint','Morbido e opaco, scalda, si stropiccia (come una t-shirt di cotone).','blend','{"CO":100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome in ('Maglia da gara / tecnica','Maglia tecnica da allenamento','Canotta da gioco (double)');

-- Pantaloncini (allenamento / gioco / basket)
update public.categorie_item set
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco',
      'hint','Liscio, leggero, elastico; asciuga in fretta.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','eco','label','Riciclato / ECO',
      'hint','Solo se sul capo o sull''etichetta c''è scritto «riciclato», «ECO» o «recycled».','blend','{"rPET":100}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone',
      'hint','Tessuto un po'' più pesante e morbido, in parte cotone.','blend','{"PET":50,"CO":50}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome in ('Pantaloncini da allenamento','Pantaloncini da gioco','Pantaloncini da basket');

-- ─────────────────────────────────────────────
-- 7. Ricalcolo delle baseline di categoria (solo capi tessili) col modello fibre.
--    co2/acqua_tipico = profilo L0; co2/acqua_max = peggiore opzione materiale.
--    (Stesso pattern di 0015; idempotente su righe vecchie e nuove.)
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
-- 8. Valore economico unico per le nuove categorie (prezzo automatico)
-- ─────────────────────────────────────────────
update public.categorie_item set valore = case nome
    when 'Polo'                                   then 20
    when 'T-shirt tecnica'                        then 15
    when 'T-shirt (cotone)'                       then 10
    when 'Canotta / smanicato'                    then 15
    when 'Felpa con cappuccio'                    then 35
    when 'Felpa full-zip'                         then 35
    when 'Leggings / tights'                      then 20
    when 'Giacca / maglia in pile (polar fleece)' then 35
    when 'Gilet / smanicato'                      then 30
    else valore
  end
  where richiede_prezzo = false and valore is null;
