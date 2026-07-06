-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0019 — Rimozione colonne superflue
-- ════════════════════════════════════════════════════════════════
-- Colonne scritte dalle migrazioni storiche ma mai lette da nessuna parte
-- (né dal client, né da funzioni/trigger/policy lato DB):
--
--   • categorie_item.co2_min / co2_max / acqua_min / acqua_max — il modello a
--     fibre (0015) calcola l'impatto sul singolo articolo; le baseline di
--     categoria usano solo co2_tipico / acqua_tipico (trigger
--     set_articolo_impatto e preview in Upload). I min/max venivano ricalcolati
--     a ogni seed ma nessuno li leggeva.
--   • categorie_item.valore_min / valore_max — il valore economico di
--     riferimento è la colonna unica `valore` (0010); i range non sono mai
--     stati mostrati.
--   • societa.codice_invito — meccanismo di invito legacy (0001), sostituito
--     da `codici_accesso` in 0004 (dove era già stato reso nullable).
--
-- Restano invece: categorie_item.fonte (mostrata in ArticleDetail),
-- articoli.foto_url (copertina), articoli.scambiato_at (macchina a stati
-- dello scambio, cfr. 0013/0014).
-- ════════════════════════════════════════════════════════════════

alter table public.categorie_item
  drop column if exists co2_min,
  drop column if exists co2_max,
  drop column if exists acqua_min,
  drop column if exists acqua_max,
  drop column if exists valore_min,
  drop column if exists valore_max;

alter table public.societa
  drop column if exists codice_invito;
