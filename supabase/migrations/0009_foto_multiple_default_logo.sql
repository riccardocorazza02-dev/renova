-- ════════════════════════════════════════════════════════════════
-- Renova · Migrazione 0009 — Foto multiple + default logo accessori
-- ════════════════════════════════════════════════════════════════
-- 1) Un articolo può avere fino a 3 foto. `foto_url` resta la copertina
--    (prima foto) per le card; `foto_urls` contiene tutte le foto.
-- 2) Zaini, borsoni e berretti/cuffie escono col logo societario spuntato
--    di default (come maglie, pantaloncini, ecc.).
-- ════════════════════════════════════════════════════════════════

alter table public.articoli
  add column if not exists foto_urls text[] not null default '{}';

update public.categorie_item set default_ha_logo = true
  where nome in ('Zaino sportivo', 'Borsone sportivo', 'Berretto / cuffia');
