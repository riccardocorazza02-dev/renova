-- ════════════════════════════════════════════════════════════════
-- Renova · Migrazione 0003 — Dati di esempio (seed) [STORICO]
-- ════════════════════════════════════════════════════════════════
-- ⚠️ STORICO: questo seed appartiene al modello pre-sport. Le tabelle
-- `metriche_esg` e `catalogo_societa` vengono rimosse dalla 0004, e le
-- società/codici dell'MVP sono ora definiti nella 0006_seed_categorie.
-- Resta solo il seed delle metriche di base, per chi si ferma a 0003.
-- ════════════════════════════════════════════════════════════════

-- Metriche ESG (categorie di materiale + impatto ambientale tipico)
insert into public.metriche_esg (nome_categoria, co2_risparmiata_kg, acqua_risparmiata_litri) values
  ('Scarpe da running',  9.50,  4200),
  ('Maglia tecnica',     5.20,  2700),
  ('Pantaloncini',       3.80,  1900),
  ('Giacca antivento',  12.40,  6100),
  ('Borsa / Zaino',      7.10,  3300),
  ('Accessori (cuffia, guanti)', 1.90, 900)
on conflict (nome_categoria) do nothing;

-- NB: le società dell'MVP (Bologna FC · Fortitudo Bologna · Bologna Volley)
-- e i relativi codici di accesso sono nella migrazione 0006_seed_categorie.
