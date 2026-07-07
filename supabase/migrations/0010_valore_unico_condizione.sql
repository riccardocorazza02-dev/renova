-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0010 — Valore unico, split canotta basket, condizione
-- ════════════════════════════════════════════════════════════════
-- 1) `categorie_item.valore`: valore economico UNICO (sostituisce min–max
--    nell'uso applicativo). NULL per gli item a prezzo manuale (l'utente
--    indica il valore d'acquisto: scarpe, guanti, parastinchi, ginocchiere).
--    I valori non specificati dall'utente = media dei vecchi min/max
--    arrotondata al multiplo di 5 più vicino. Gli item presenti in più sport
--    hanno lo stesso valore.
-- 2) Basket: la "Canotta / maglia tecnica" si separa in
--    "Maglia tecnica da allenamento" (15€) e "Canotta da gioco (double)" (20€).
-- 3) Ginocchiere (pallavolo e basket) → prezzo manuale.
-- 4) `articoli.condizione`: stato dell'oggetto (Scarso…Perfetto).
-- ════════════════════════════════════════════════════════════════

-- ── 1. Colonna valore unico ──────────────────────────────────────
alter table public.categorie_item add column if not exists valore numeric(10,2);

-- ── 2. Ginocchiere → manuale (pallavolo e basket) ────────────────
update public.categorie_item set richiede_prezzo = true
  where nome = 'Ginocchiere' and sport in ('Pallavolo', 'Basket');

-- ── 3. Split canotta basket ──────────────────────────────────────
update public.categorie_item
  set nome = 'Maglia tecnica da allenamento'
  where sport = 'Basket' and nome = 'Canotta / maglia tecnica';

insert into public.categorie_item
  (sport, nome, tipo, default_ha_logo, richiede_prezzo, tipo_taglia,
   co2_min, co2_tipico, co2_max, acqua_min, acqua_tipico, acqua_max,
   valore_min, valore_max)
values
  ('Basket', 'Canotta da gioco (double)', 'individuale', true, false, 'abbigliamento',
   2, 3, 4, 50, 75, 100, 15, 30)
on conflict (sport, nome) do nothing;

-- ── 4. Valori unici (auto). Item manuali → valore NULL ───────────
-- I valori sono identici tra sport per gli item condivisi.
update public.categorie_item set valore = case nome
    when 'Calzettoni da calcio'            then 8
    when 'Calzini sportivi'                then 5
    when 'Calzini da basket'               then 5
    when 'Maglia / t-shirt tecnica'        then 15
    when 'Maglia tecnica da allenamento'   then 15
    when 'Canotta da gioco (double)'       then 20
    when 'Pantaloncini da allenamento'     then 15
    when 'Pantaloncini da gioco'           then 15
    when 'Pantaloncini da basket'          then 15
    when 'Felpa sportiva'                  then 30
    when 'Pantaloni della tuta'            then 25
    when 'Giacca sportiva'                 then 45
    when 'K-way / giacca antipioggia'      then 20
    when 'K-way / giacca leggera'          then 20
    when 'K-way / giacca'                  then 20
    when 'Zaino sportivo'                  then 25
    when 'Borsone sportivo'                then 35
    when 'Berretto / cuffia'               then 10
    when 'Borraccia'                       then 5
    when 'Fascia tergisudore da polso'     then 5
    when 'Fascia per capelli'              then 5
    when 'Cavigliere'                      then 15
    when 'Gomitiere'                       then 15
    when 'Gambali / manicotti gamba'       then 15
    when 'Manicotti braccio'               then 10
    when 'Manicotti braccio (shooting sleeve)' then 10
    else valore
  end
  where richiede_prezzo = false;

-- Sicurezza: gli item a prezzo manuale non hanno un valore fisso
update public.categorie_item set valore = null where richiede_prezzo = true;

-- ── 5. Condizione dell'articolo ──────────────────────────────────
alter table public.articoli add column if not exists condizione text
  check (condizione in ('Scarso', 'Discreto', 'Buono', 'Ottimo', 'Perfetto'));
