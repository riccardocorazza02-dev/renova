-- ════════════════════════════════════════════════════════════════
-- Renova · Migrazione 0006 — Seed: categorie di riferimento + società BO
-- ════════════════════════════════════════════════════════════════
-- Le categorie ricalcano le tre liste del documento metodologico.
-- co2_tipico / acqua_tipico = punto medio dell'intervallo min–max.
-- `valore_min/max` = prezzo indicativo (il venditore fissa poi il suo).
-- `default_ha_logo` = true per i capi tipicamente "sociali" (maglia,
-- tuta, felpa, giacca, pantaloncini gara), false per calzature,
-- protezioni e accessori. È solo un default: l'utente può cambiarlo.
--
-- CODICI DI ACCESSO (per la registrazione, MVP su Bologna):
--   • Bologna FC        → BFC-CAL  (Calcio)
--   • Fortitudo Bologna → FORT-BSK (Basket)
--   • Bologna Volley    → BVOL-VOL (Pallavolo)
-- ════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- CATEGORIE DI RIFERIMENTO
-- col: sport, nome, tipo, default_ha_logo,
--      co2_min, co2_tipico, co2_max, acqua_min, acqua_tipico, acqua_max,
--      valore_min, valore_max
-- ─────────────────────────────────────────────
insert into public.categorie_item
  (sport, nome, tipo, default_ha_logo,
   co2_min, co2_tipico, co2_max, acqua_min, acqua_tipico, acqua_max, valore_min, valore_max)
values
  -- ══════════ CALCIO ══════════
  ('Calcio','Scarpe da calcio (tacchetti)','individuale',false,  8,11,14,  500,1250,2000,  25,80),
  ('Calcio','Parastinchi','individuale',false,                   1,1.5,2,  10,30,50,        5,20),
  ('Calcio','Calzettoni da calcio','individuale',false,          1,1.5,2,  300,500,700,     5,15),
  ('Calcio','Pantaloncini da allenamento','individuale',true,    2,3,4,    50,75,100,       8,30),
  ('Calcio','Maglia / t-shirt tecnica','individuale',true,       2,3,4,    50,75,100,       8,25),
  ('Calcio','Felpa sportiva','individuale',true,                 6,8,10,   2500,3500,4500,  18,45),
  ('Calcio','Pantaloni della tuta','individuale',true,           5,6.5,8,  2000,3000,4000,  15,35),
  ('Calcio','Giacca sportiva','individuale',true,                5,6.5,8,  100,200,300,     20,50),
  ('Calcio','K-way / giacca antipioggia','individuale',true,     3,4.5,6,  50,125,200,      12,35),
  ('Calcio','Guanti da portiere','individuale',false,            2,3,4,    100,200,300,     15,40),
  ('Calcio','Zaino sportivo','accessorio',false,                 6,9,12,   100,300,500,     15,40),
  ('Calcio','Borsone sportivo','accessorio',false,               8,11.5,15,150,375,600,     20,50),
  ('Calcio','Borraccia','accessorio',false,                      1,2,3,    50,125,200,      3,10),
  ('Calcio','Fascia tergisudore da polso','accessorio',false,    0.3,0.55,0.8, 50,100,150,  3,8),
  ('Calcio','Fascia per capelli','accessorio',false,             0.2,0.4,0.6,  30,65,100,   3,8),
  ('Calcio','Cavigliere','accessorio',false,                     1,1.5,2,  50,125,200,      6,20),
  ('Calcio','Gambali / manicotti gamba','accessorio',false,      1,1.75,2.5,50,100,150,     8,25),
  ('Calcio','Manicotti braccio','accessorio',false,              0.8,1.15,1.5,30,75,120,    6,18),
  ('Calcio','Berretto / cuffia','accessorio',false,              1,1.5,2,  200,400,600,     8,20),

  -- ══════════ PALLAVOLO ══════════
  ('Pallavolo','Scarpe da pallavolo (indoor)','individuale',false,10,12.5,15, 500,1250,2000, 35,90),
  ('Pallavolo','Ginocchiere','individuale',false,                2,3,4,    50,125,200,      10,30),
  ('Pallavolo','Maglia / t-shirt tecnica','individuale',true,    2,3,4,    50,75,100,       8,25),
  ('Pallavolo','Pantaloncini da gioco','individuale',true,       2,3,4,    50,75,100,       8,30),
  ('Pallavolo','Calzini sportivi','individuale',false,           1,1.5,2,  300,500,700,     5,15),
  ('Pallavolo','Felpa sportiva','individuale',true,              6,8,10,   2500,3500,4500,  18,45),
  ('Pallavolo','Pantaloni della tuta','individuale',true,        5,6.5,8,  2000,3000,4000,  15,35),
  ('Pallavolo','Giacca sportiva','individuale',true,             5,6.5,8,  100,200,300,     20,50),
  ('Pallavolo','K-way / giacca leggera','individuale',true,      3,4.5,6,  50,125,200,      12,35),
  ('Pallavolo','Zaino sportivo','accessorio',false,              6,9,12,   100,300,500,     15,40),
  ('Pallavolo','Borsone sportivo','accessorio',false,            8,11.5,15,150,375,600,     20,50),
  ('Pallavolo','Borraccia','accessorio',false,                   1,2,3,    50,125,200,      3,10),
  ('Pallavolo','Cavigliere','accessorio',false,                  1,1.5,2,  50,125,200,      6,20),
  ('Pallavolo','Gomitiere','accessorio',false,                   1.5,2.25,3,50,125,200,     8,25),
  ('Pallavolo','Fascia tergisudore da polso','accessorio',false, 0.3,0.55,0.8, 50,100,150,  3,8),
  ('Pallavolo','Manicotti braccio','accessorio',false,           0.8,1.15,1.5,30,75,120,    6,18),
  ('Pallavolo','Fascia per capelli','accessorio',false,          0.2,0.4,0.6,  30,65,100,   3,8),

  -- ══════════ BASKET ══════════
  ('Basket','Scarpe da basket','individuale',false,              12,14,16, 500,1250,2000,   40,110),
  ('Basket','Canotta / maglia tecnica','individuale',true,       2,3,4,    50,75,100,       10,25),
  ('Basket','Pantaloncini da basket','individuale',true,         2,3,4,    50,75,100,       12,30),
  ('Basket','Calzini da basket','individuale',false,             1,1.5,2,  300,500,700,     6,15),
  ('Basket','Felpa sportiva','individuale',true,                 6,8,10,   2500,3500,4500,  18,45),
  ('Basket','Pantaloni della tuta','individuale',true,           5,6.5,8,  2000,3000,4000,  15,35),
  ('Basket','Giacca sportiva','individuale',true,                5,6.5,8,  100,200,300,     20,50),
  ('Basket','K-way / giacca','individuale',true,                 3,4.5,6,  50,125,200,      12,35),
  ('Basket','Zaino sportivo','accessorio',false,                 6,9,12,   100,300,500,     15,40),
  ('Basket','Borsone sportivo','accessorio',false,               8,11.5,15,150,375,600,     20,50),
  ('Basket','Borraccia','accessorio',false,                      1,2,3,    50,125,200,      3,10),
  ('Basket','Ginocchiere','accessorio',false,                    2,3,4,    50,125,200,      8,30),
  ('Basket','Gomitiere','accessorio',false,                      1.5,2.25,3,50,125,200,     8,25),
  ('Basket','Cavigliere','accessorio',false,                     1,1.5,2,  50,125,200,      6,20),
  ('Basket','Gambali / manicotti gamba','accessorio',false,      1,1.75,2.5,50,100,150,     8,25),
  ('Basket','Manicotti braccio (shooting sleeve)','accessorio',false, 0.8,1.15,1.5,30,75,120, 6,18),
  ('Basket','Fascia tergisudore da polso','accessorio',false,    0.3,0.55,0.8, 50,100,150,  3,8),
  ('Basket','Fascia per capelli','accessorio',false,             0.2,0.4,0.6,  30,65,100,   3,8)
on conflict (sport, nome) do nothing;

-- ─────────────────────────────────────────────
-- SOCIETÀ (Bologna) — MVP: una società per sport
-- ─────────────────────────────────────────────
insert into public.societa (nome, provincia, codice_invito) values
  ('Bologna FC',        'BO', null),
  ('Fortitudo Bologna', 'BO', null),
  ('Bologna Volley',    'BO', null)
on conflict do nothing;

-- ─────────────────────────────────────────────
-- CODICI DI ACCESSO (codice → società + sport)
-- ─────────────────────────────────────────────
insert into public.codici_accesso (codice, id_societa, sport)
select v.codice, s.id, v.sport::public.sport
from (values
  ('BFC-CAL',  'Bologna FC',        'Calcio'),
  ('FORT-BSK', 'Fortitudo Bologna', 'Basket'),
  ('BVOL-VOL', 'Bologna Volley',    'Pallavolo')
) as v(codice, societa, sport)
join public.societa s on s.nome = v.societa
on conflict (codice) do nothing;
