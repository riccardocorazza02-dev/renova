-- ═══════════════════════════════════════════════════════════
-- Renova · Migrazione 0021 — Tap materiale L1: criterio dello scostamento >10%
-- ═══════════════════════════════════════════════════════════
-- Ridefinisce categorie_item.materiali (tap L0+1) secondo il criterio del §3:
-- un'opzione dedicata solo per i blend che distano oltre ~10 punti percentuali
-- da una fibra pura (le varianti quasi pure sono assorbite nella fibra: es.
-- 92% PET / 8% EA = 100% PET). Sostituisce le opzioni della 0020.
-- Aggiunte rispetto alla lista base: nylon per pantaloni/pantaloncini e, per i
-- calzini, l'opzione in poliestere tecnico e in polipropilene — senza le quali
-- i calzini sintetici a bassa water footprint venivano stimati come cotone
-- (errore acqua L0+1 84%→29%). NON tocca peso_kg né profilo_default (L0).
-- ═══════════════════════════════════════════════════════════

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco','hint','Liscia, leggera, elastica; asciuga in fretta.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / piqué','hint','Morbida e opaca, trama a nido d''ape; come una polo classica.','blend','{"CO": 100}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone','hint','Un po'' di entrambi: morbida ma più resistente.','blend','{"CO": 60, "PET": 40}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Polo';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco','hint','Liscia, leggera, spesso traforata; asciuga in fretta.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone','hint','Morbida e opaca, scalda, si stropiccia.','blend','{"CO": 100}'::jsonb),
    jsonb_build_object('chiave','nylon','label','Nylon / misto elastico','hint','Leggera e setosa, molto elastica; l''etichetta indica nylon/poliammide.','blend','{"PA": 67, "PET": 25, "EA": 8}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Canotta';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco','hint','Liscia, leggera, elastica; asciuga in fretta. Spesso traforata o lucida.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone','hint','Morbida e opaca, scalda, si stropiccia (come una t-shirt di cotone).','blend','{"CO": 100}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone','hint','Un po'' di entrambi: morbida ma più resistente.','blend','{"CO": 65, "PET": 35}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'T-shirt';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / pile','hint','Interno liscio o in pile; leggera, asciuga in fretta.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Prevalente cotone','hint','Interno garzato morbido, scalda; soprattutto cotone.','blend','{"CO": 70, "PET": 30}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto cotone','hint','Metà cotone e metà sintetico: morbida ma resistente.','blend','{"CO": 50, "PET": 50}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Felpa';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tuta / sportivo','hint','Liscio, leggero; asciuga in fretta.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / felpato','hint','Più morbido e pesante, in parte cotone.','blend','{"CO": 65, "PET": 35}'::jsonb),
    jsonb_build_object('chiave','nylon','label','Nylon / poliammide','hint','Leggero e setoso, molto elastico; l''etichetta indica nylon/poliammide.','blend','{"PA": 92, "EA": 8}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Pantaloni';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco','hint','Liscio, leggero, elastico; asciuga in fretta.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / felpato','hint','Un po'' più pesante e morbido, in parte cotone.','blend','{"CO": 65, "PET": 35}'::jsonb),
    jsonb_build_object('chiave','nylon','label','Nylon / misto elastico','hint','Leggero e setoso, molto elastico; l''etichetta indica nylon/poliammide.','blend','{"PA": 67, "PET": 25, "EA": 8}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Pantaloncini';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / pile','hint','Liscia o in pile; spesso impermeabile o softshell.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','elastico','label','Tecnico elasticizzato','hint','Elastica e aderente; contiene un po'' di elastan.','blend','{"PET": 88, "EA": 12}'::jsonb),
    jsonb_build_object('chiave','nylon','label','Nylon / poliammide','hint','Molto leggera e frusciante; l''etichetta dice «nylon/PA».','blend','{"PA": 100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Giacca';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Sintetico / imbottito','hint','Leggero, liscio; spesso imbottito o in pile.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','elastico','label','Tecnico elasticizzato','hint','Elastico e aderente (con elastan).','blend','{"PET": 81, "EA": 19}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Gilet';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','poliestere','label','Poliestere','hint','Leggero, fruscia poco; l''etichetta dice «poliestere/PES».','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','nylon','label','Nylon / poliammide','hint','Molto leggero e frusciante; l''etichetta dice «nylon/poliammide/PA».','blend','{"PA": 100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'K-way';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Sportivi tecnici (poliestere)','hint','Sottili, tecnici; l''etichetta dice «poliestere/PES».','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','nylon','label','Sportivi tecnici (nylon)','hint','Sottili, elastici, lisci; l''etichetta dice «nylon/PA».','blend','{"PA": 90, "EA": 10}'::jsonb),
    jsonb_build_object('chiave','misto','label','Misto tecnico','hint','Elastici e strutturati, misti sintetici.','blend','{"PET": 55, "PA": 30, "EA": 15}'::jsonb),
    jsonb_build_object('chiave','polipropilene','label','Traspiranti / polipropilene','hint','Molto leggeri, tecnici da corsa; l''etichetta dice «polipropilene/PP».','blend','{"PP": 100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Calzini';
