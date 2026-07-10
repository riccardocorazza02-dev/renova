-- ═══════════════════════════════════════════════════════════
-- Renova · Migrazione 0020 — Opzioni materiale L1 dai blend osservati
-- ═══════════════════════════════════════════════════════════
-- Riallinea il tap L0+1 (categorie_item.materiali) ai blend REALMENTE
-- osservati nei 5 cataloghi teamwear (Legea, Givova, Joma, Macron, Erreà),
-- cfr. §3/§8 del documento metodologico. Le opzioni sono un sottoinsieme
-- RICONOSCIBILE dei blend rappresentativi: ogni voce corrisponde a un
-- cluster che l'utente può distinguere a vista/tatto (tecnico PET, cotone,
-- misto/felpato, elasticizzato PET+EA, nylon PA, polipropilene), con blend
-- pari alla composizione modale osservata del cluster.
--
-- NON modifica peso_kg né profilo_default (profilo L0): restano quelli del §3.
-- Le percentuali dei blend usano i codici fibra della tabella `fibre`.
-- ═══════════════════════════════════════════════════════════

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco','hint','Liscia, leggera, elastica; asciuga in fretta.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / piqué','hint','Morbida e opaca, trama a nido d''ape; come una polo classica.','blend','{"CO": 100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Polo';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco','hint','Liscia, leggera, spesso traforata; asciuga in fretta.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','elastico','label','Tecnico elasticizzato','hint','Elastica e aderente; contiene un po'' di elastan.','blend','{"PET": 92, "EA": 8}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone','hint','Morbida e opaca, scalda, si stropiccia.','blend','{"CO": 100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Canotta';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco','hint','Liscia, leggera, elastica; asciuga in fretta. Spesso traforata o lucida.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','elastico','label','Tecnico elasticizzato','hint','Elastica e aderente; contiene un po'' di elastan.','blend','{"PET": 92, "EA": 8}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone','hint','Morbida e opaca, scalda, si stropiccia (come una t-shirt di cotone).','blend','{"CO": 100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'T-shirt';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / pile','hint','Interno liscio o in pile; leggera, asciuga in fretta.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / felpato','hint','Interno garzato morbido, scalda, si stropiccia.','blend','{"CO": 65, "PET": 35}'::jsonb),
    jsonb_build_object('chiave','elastico','label','Tecnico elasticizzato','hint','Aderente, con un po'' di elastan.','blend','{"PET": 92, "EA": 8}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Felpa';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tuta / sportivo','hint','Liscio, leggero; asciuga in fretta.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','elastico','label','Aderente / elasticizzato','hint','Elastico e aderente alla pelle (con elastan).','blend','{"PET": 92, "EA": 8}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / felpato','hint','Più morbido e pesante, in parte cotone.','blend','{"CO": 65, "PET": 35}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Pantaloni';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / da gioco','hint','Liscio, leggero, elastico; asciuga in fretta.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','elastico','label','Tecnico elasticizzato','hint','Aderente, con un po'' di elastan.','blend','{"PET": 92, "EA": 8}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Cotone / felpato','hint','Un po'' più pesante e morbido, in parte cotone.','blend','{"CO": 65, "PET": 35}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Pantaloncini';

update public.categorie_item set materiali = jsonb_build_array(
    jsonb_build_object('chiave','tecnico','label','Tecnico / pile','hint','Liscia o in pile; spesso impermeabile o softshell.','blend','{"PET": 100}'::jsonb),
    jsonb_build_object('chiave','elastico','label','Tecnico elasticizzato','hint','Elastica, con un po'' di elastan.','blend','{"PET": 88, "EA": 12}'::jsonb),
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
    jsonb_build_object('chiave','tecnico','label','Sportivi tecnici','hint','Sottili, elastici, lisci; spesso in nylon.','blend','{"PA": 90, "EA": 10}'::jsonb),
    jsonb_build_object('chiave','cotone','label','Con cotone / spugna','hint','Spessi e morbidi, tipo spugna sotto il piede.','blend','{"PET": 70, "CO": 15, "EA": 15}'::jsonb),
    jsonb_build_object('chiave','polipropilene','label','Traspiranti / polipropilene','hint','Molto leggeri, tecnici da corsa; l''etichetta dice «polipropilene/PP».','blend','{"PP": 100}'::jsonb),
    jsonb_build_object('chiave','non_so','label','Non lo so','hint','Useremo una stima prudenziale.','blend',null)
  ) where nome = 'Calzini';
