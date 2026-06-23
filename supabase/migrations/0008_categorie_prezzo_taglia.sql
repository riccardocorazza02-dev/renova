-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0008 — Prezzo manuale e tipo di taglia per categoria
-- ════════════════════════════════════════════════════════════════
-- `richiede_prezzo`: se true, in fase di upload l'utente DEVE indicare il
--   valore d'acquisto (scarpe, guanti, parastinchi). Per le altre categorie
--   il prezzo è impostato automaticamente (per ora = valore tipico di
--   riferimento; in futuro lo definirà la società che acquista il servizio).
-- `tipo_taglia`: governa il menù a tendina delle taglie:
--   • 'calzatura'     → numeri EU
--   • 'abbigliamento' → da taglia bimbo a taglia adulto
--   • 'unica'         → taglia unica
-- ════════════════════════════════════════════════════════════════

alter table public.categorie_item
  add column if not exists richiede_prezzo boolean not null default false,
  add column if not exists tipo_taglia text not null default 'abbigliamento'
    check (tipo_taglia in ('calzatura', 'abbigliamento', 'unica'));

-- Tipo di taglia
update public.categorie_item set tipo_taglia = 'calzatura'
  where nome ilike 'Scarpe%';

update public.categorie_item set tipo_taglia = 'unica'
  where nome in (
    'Borraccia', 'Fascia per capelli', 'Fascia tergisudore da polso',
    'Zaino sportivo', 'Borsone sportivo', 'Berretto / cuffia'
  );
-- tutte le altre restano 'abbigliamento' (default)

-- Prezzo inserito manualmente dall'utente (valore d'acquisto)
update public.categorie_item set richiede_prezzo = true
  where nome ilike 'Scarpe%'
     or nome = 'Guanti da portiere'
     or nome = 'Parastinchi';
