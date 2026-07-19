-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0018 — Semplificazione categorie (2 macro + 14 item)
-- ════════════════════════════════════════════════════════════════
-- Snellisce il catalogo `categorie_item`:
--   • MACRO-CATEGORIE ridotte a DUE: «Abbigliamento» e «Accessori».
--   • ABBIGLIAMENTO → 11 capi: Canotta, T-shirt, Polo, Felpa, Pantaloni,
--     Pantaloncini, Giacca, Gilet, K-way, Calzini, Scarpe.
--   • ACCESSORI → 3 voci: Accessorio (generico, impatto NON calcolato),
--     Zaino e Borsone (100% poliestere, impatto calcolato sul peso).
--
-- La dimensione «sport» resta invariata (feed per sport): ogni sport ottiene
-- lo stesso set di 14 voci. Gli articoli già caricati vengono RIMAPPATI alle
-- nuove categorie (per nome), poi le vecchie categorie granulari sono rimosse.
--
-- Modello a livelli (0015/0016): i capi tessili mantengono peso + profilo L0 +
-- opzioni tap; avendo ridotto le categorie si ARRICCHISCONO i tap (es. la
-- canotta passa da «tecnico/riciclato» a «tecnico/riciclato/cotone»).
--
-- Scarpe: valore fisso di categoria 13,6 kg CO₂e/paio (MIT, Cheah et al. 2013,
-- news.mit.edu/2013/footwear-carbon-footprint-0522) e ≥1.500 L/paio (valore
-- prudenziale: non esiste un LCA idrico affidabile per la scarpa sportiva
-- sintetica; ≈8.000 L riguarda la PELLE ed è escluso). Confine diverso dal
-- cradle-to-fibre-gate dei capi (è un valore di letteratura per l'intera scarpa):
-- eccezione documentata nella nota metodologica.
-- ════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. Creazione/normalizzazione delle 14 categorie canoniche per ogni sport
--    (impatto = 0 placeholder: ricalcolato al passo 6)
-- ─────────────────────────────────────────────
insert into public.categorie_item
  (sport, nome, tipo, macro_categoria, default_ha_logo, richiede_prezzo, tipo_taglia,
   co2_min, co2_tipico, co2_max, acqua_min, acqua_tipico, acqua_max, valore_min, valore_max)
select s.sport, t.nome, t.tipo, t.macro, t.logo, t.prezzo, t.taglia,
       0, 0, 0, 0, 0, 0, t.vmin, t.vmax
from (values
  -- nome,          tipo,          macro,           logo,  prezzo, taglia,          vmin, vmax
  ('Canotta',       'individuale', 'Abbigliamento', true,  false,  'abbigliamento',  8,   25),
  ('T-shirt',       'individuale', 'Abbigliamento', true,  false,  'abbigliamento',  5,   25),
  ('Polo',          'individuale', 'Abbigliamento', true,  false,  'abbigliamento', 12,   30),
  ('Felpa',         'individuale', 'Abbigliamento', true,  false,  'abbigliamento', 20,   55),
  ('Pantaloni',     'individuale', 'Abbigliamento', true,  false,  'abbigliamento', 10,   35),
  ('Pantaloncini',  'individuale', 'Abbigliamento', true,  false,  'abbigliamento',  8,   30),
  ('Giacca',        'individuale', 'Abbigliamento', true,  false,  'abbigliamento', 20,   55),
  ('Gilet',         'individuale', 'Abbigliamento', true,  false,  'abbigliamento', 15,   45),
  ('K-way',         'individuale', 'Abbigliamento', true,  false,  'abbigliamento', 12,   35),
  ('Calzini',       'individuale', 'Abbigliamento', false, false,  'abbigliamento',  5,   15),
  ('Scarpe',        'individuale', 'Abbigliamento', false, true,   'calzatura',     25,  110),
  ('Accessorio',    'accessorio',  'Accessori',     false, false,  'unica',          5,   40),
  ('Zaino',         'accessorio',  'Accessori',     false, false,  'unica',         15,   40),
  ('Borsone',       'accessorio',  'Accessori',     false, false,  'unica',         20,   50)
) as t(nome, tipo, macro, logo, prezzo, taglia, vmin, vmax)
cross join (values
  ('Calcio'::public.sport), ('Pallavolo'::public.sport), ('Basket'::public.sport)
) as s(sport)
on conflict (sport, nome) do nothing;

-- Riallinea macro-categoria e tipo taglia anche su eventuali righe preesistenti
-- omonime (es. «Polo», creata in 0016 con macro «Polo»).
update public.categorie_item set macro_categoria = 'Abbigliamento'
  where nome in ('Canotta','T-shirt','Polo','Felpa','Pantaloni','Pantaloncini',
                 'Giacca','Gilet','K-way','Calzini','Scarpe');
update public.categorie_item set macro_categoria = 'Accessori'
  where nome in ('Accessorio','Zaino','Borsone');
update public.categorie_item set tipo_taglia = 'calzatura' where nome = 'Scarpe';

-- ─────────────────────────────────────────────
-- 2. Peso + profilo L0 + opzioni materiale (tap) per i CAPI di abbigliamento
--    (tap arricchiti: dove sensato si aggiungono cotone / misto / riciclato)
-- ─────────────────────────────────────────────

-- Canotta — tecnico / riciclato / cotone
update public.categorie_item set
  peso_kg = 0.130,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco',
      'hint','Liscia, leggera, elastica; asciuga in fretta. Spesso traforata o lucida.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','eco','label','Riciclato / ECO',
      'hint','Solo se sul capo o sull''etichetta c''è scritto «riciclato», «ECO» o «recycled».','blend','{"rPET":100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone',
      'hint','Morbida e opaca, scalda, si stropiccia (come una t-shirt di cotone).','blend','{"CO":100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Canotta';

-- T-shirt (accorpa maglie a maniche gara/tecniche/allenamento + t-shirt)
update public.categorie_item set
  peso_kg = 0.150,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco',
      'hint','Liscia, leggera, elastica; asciuga in fretta. Spesso traforata o lucida.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','eco','label','Riciclato / ECO',
      'hint','Solo se sul capo o sull''etichetta c''è scritto «riciclato», «ECO» o «recycled».','blend','{"rPET":100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone',
      'hint','Morbida e opaca, scalda, si stropiccia (come una t-shirt di cotone).','blend','{"CO":100}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone',
      'hint','Un po'' di entrambi: morbida ma più resistente.','blend','{"PET":50,"CO":50}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'T-shirt';

-- Polo
update public.categorie_item set
  peso_kg = 0.220,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','cotone','label','Cotone / piqué',
      'hint','Morbida e opaca, trama a nido d''ape; come una polo classica.','blend','{"CO":100}'::jsonb),
    jsonb_build_object('chiave','tecnico','label','Tecnico',
      'hint','Liscia, leggera, elastica; asciuga in fretta.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone',
      'hint','Un po'' di entrambi: morbida ma più resistente.','blend','{"PET":50,"CO":50}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Polo';

-- Felpa (accorpa cappuccio / full-zip / girocollo)
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
where nome = 'Felpa';

-- Pantaloni (accorpa pantaloni tuta + leggings/tights)
update public.categorie_item set
  peso_kg = 0.400,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tuta / sportivo',
      'hint','Liscio, leggero, elastico; asciuga in fretta.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','aderente','label','Aderente / leggings',
      'hint','Elastico e aderente alla pelle (con elastan).','blend','{"PET":90,"EA":10}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone',
      'hint','Più morbido e pesante, in parte cotone.','blend','{"PET":50,"CO":50}'::jsonb),
    jsonb_build_object('chiave','eco','label','Riciclato / ECO',
      'hint','Solo se sul capo o sull''etichetta c''è scritto «riciclato», «ECO» o «recycled».','blend','{"rPET":100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Pantaloni';

-- Pantaloncini (accorpa allenamento / gioco / basket)
update public.categorie_item set
  peso_kg = 0.130,
  profilo_default = '{"PET":100}'::jsonb,
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
where nome = 'Pantaloncini';

-- Giacca (accorpa giacca sportiva + pile/polar fleece)
update public.categorie_item set
  peso_kg = 0.300,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / pile',
      'hint','Liscia o in pile; spesso impermeabile o softshell.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / casual',
      'hint','Più morbida e pesante, in parte cotone.','blend','{"CO":65,"PET":35}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Giacca';

-- Gilet / smanicato
update public.categorie_item set
  peso_kg = 0.250,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Sintetico / imbottito',
      'hint','Leggero, liscio; spesso imbottito o in pile.','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / felpato',
      'hint','Più morbido e pesante, in parte cotone.','blend','{"CO":65,"PET":35}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Gilet';

-- K-way / giacca antivento — poliestere o nylon (impatto CO₂ molto diverso)
update public.categorie_item set
  peso_kg = 0.250,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','poliestere','label','Poliestere',
      'hint','Leggero, fruscia poco; l''etichetta dice «poliestere/PES».','blend','{"PET":100}'::jsonb),
    jsonb_build_object('chiave','nylon','label','Nylon / poliammide',
      'hint','Molto leggero e frusciante; l''etichetta dice «nylon/poliammide/PA».','blend','{"PA":100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'K-way';

-- Calzini (accorpa calzettoni / calzini basket / calzini sportivi)
update public.categorie_item set
  peso_kg = 0.100,
  profilo_default = '{"PET":80,"EA":20}'::jsonb,
  materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Sportivi tecnici',
      'hint','Sottili, elastici, lisci.','blend','{"PET":80,"EA":20}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Con cotone / spugna',
      'hint','Spessi e morbidi, tipo spugna sotto il piede.','blend','{"PET":70,"CO":15,"EA":15}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so',
      'hint','Useremo una stima prudenziale.','blend',null)
  )
where nome = 'Calzini';

-- ─────────────────────────────────────────────
-- 3. Voci a valore fisso / non tessili
-- ─────────────────────────────────────────────

-- Scarpe — valore fisso di categoria (nessun tap): CO₂ 13,6 (MIT) · acqua ≥1.500 L
update public.categorie_item set
  peso_kg = null,
  profilo_default = null,
  materiali = '[]'::jsonb,
  co2_min = 13.6, co2_tipico = 13.6, co2_max = 13.6,
  acqua_min = 1500, acqua_tipico = 1500, acqua_max = 1500
where nome = 'Scarpe';

-- Accessorio (generico) — impatto NON calcolato (materiale ignoto): 0
update public.categorie_item set
  peso_kg = null,
  profilo_default = null,
  materiali = '[]'::jsonb,
  co2_min = 0, co2_tipico = 0, co2_max = 0,
  acqua_min = 0, acqua_tipico = 0, acqua_max = 0
where nome = 'Accessorio';

-- Zaino e Borsone — 100% poliestere, impatto calcolato sul peso (no tap)
update public.categorie_item set
  peso_kg = 0.500,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = '[]'::jsonb
where nome = 'Zaino';

update public.categorie_item set
  peso_kg = 0.800,
  profilo_default = '{"PET":100}'::jsonb,
  materiali = '[]'::jsonb
where nome = 'Borsone';

-- ─────────────────────────────────────────────
-- 4. Rimappa gli ARTICOLI dalle vecchie categorie granulari alle nuove.
--    Il target si ricava dal nome della categoria attuale (stesso sport).
-- ─────────────────────────────────────────────
update public.articoli a set id_categoria = tgt.id
from public.categorie_item cur
join public.categorie_item tgt
  on tgt.sport = cur.sport
 and tgt.nome = (
   case
     when cur.nome ilike 'Scarpe%'                                 then 'Scarpe'
     when cur.nome ilike 'Canotta%'                                then 'Canotta'
     when cur.nome ilike 'Maglia%'                                 then 'T-shirt'
     when cur.nome ilike 'T-shirt%'                                then 'T-shirt'
     when cur.nome = 'Polo'                                        then 'Polo'
     when cur.nome ilike 'Felpa%'                                  then 'Felpa'
     when cur.nome ilike 'Giacca%'                                 then 'Giacca'
     when cur.nome ilike 'K-way%'                                  then 'K-way'
     when cur.nome ilike 'Gilet%'                                  then 'Gilet'
     when cur.nome ilike 'Leggings%'                               then 'Pantaloni'
     when cur.nome ilike 'Pantaloncini%'                           then 'Pantaloncini'
     when cur.nome ilike 'Pantaloni%'                              then 'Pantaloni'
     when cur.nome ilike 'Calzettoni%' or cur.nome ilike 'Calzini%' then 'Calzini'
     when cur.nome ilike 'Zaino%'                                  then 'Zaino'
     when cur.nome ilike 'Borsone%'                                then 'Borsone'
     else 'Accessorio'
   end)
where a.id_categoria = cur.id
  and tgt.id <> cur.id;

-- ─────────────────────────────────────────────
-- 5. Rimuovi le vecchie categorie non più in catalogo (ora orfane di articoli)
-- ─────────────────────────────────────────────
delete from public.categorie_item
where nome not in ('Canotta','T-shirt','Polo','Felpa','Pantaloni','Pantaloncini',
                   'Giacca','Gilet','K-way','Calzini','Scarpe',
                   'Accessorio','Zaino','Borsone');

-- ─────────────────────────────────────────────
-- 6. Ricalcolo baseline di categoria (solo capi tessili) col modello fibre.
--    Scarpe/Accessorio restano ai valori fissi impostati al passo 3.
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
-- 7. Valore economico unico per le nuove categorie a prezzo automatico
-- ─────────────────────────────────────────────
update public.categorie_item set valore = case nome
    when 'Canotta'      then 15
    when 'T-shirt'      then 12
    when 'Polo'         then 20
    when 'Felpa'        then 35
    when 'Pantaloni'    then 30
    when 'Pantaloncini' then 15
    when 'Giacca'       then 35
    when 'Gilet'        then 30
    when 'K-way'        then 25
    when 'Calzini'      then 8
    when 'Accessorio'   then 10
    when 'Zaino'        then 25
    when 'Borsone'      then 35
    else valore
  end
  where richiede_prezzo = false;

-- ─────────────────────────────────────────────
-- 8. Backfill impatto degli articoli (categorie cambiate → ricalcolo snapshot)
-- ─────────────────────────────────────────────
update public.articoli a set
  co2   = sub.co2,
  acqua = sub.acqua
from (
  select a2.id,
         case when c.profilo_default is null then coalesce(c.co2_tipico,0)
              else (select co2 from public.loop_impatto_blend(coalesce(a2.composizione, c.profilo_default), c.peso_kg)) end   as co2,
         case when c.profilo_default is null then coalesce(c.acqua_tipico,0)
              else (select acqua from public.loop_impatto_blend(coalesce(a2.composizione, c.profilo_default), c.peso_kg)) end as acqua
  from public.articoli a2
  join public.categorie_item c on c.id = a2.id_categoria
) sub
where a.id = sub.id;
