-- ════════════════════════════════════════════════════════════════
-- Renova · Migrazione 0025 — Registro degli scambi su DUE LIVELLI
-- ════════════════════════════════════════════════════════════════
-- L'informativa sulla privacy (§6, pagina /privacy-policy) dichiara che il
-- registro degli scambi è tenuto su due livelli distinti:
--
--   • LIVELLO INDIVIDUALE (dato personale, con retention) — chi ha ceduto e
--     chi ha ricevuto cosa, e quando: la tabella `scambi` così com'è. Si
--     conserva 12 mesi (finestra allineata ai messaggi della chat) e poi si
--     RENDE ANONIMO: la riga individuale viene cancellata e sopravvive solo
--     il suo contributo statistico, già registrato nel secondo livello.
--
--   • LIVELLO AGGREGATO/ANONIMO (permanente) — la nuova tabella
--     `impatto_aggregato`: contatori di impatto per (mese × società ×
--     categoria). Non contiene né identificativi degli utenti né chiavi verso
--     `scambi`, `articoli` o `utenti`: non esiste un percorso per risalire
--     alla persona, quindi il dato esce dal campo del GDPR e si conserva a
--     tempo indeterminato.
--
-- Finora i due livelli erano UNO SOLO: `impatto_societa()` sommava le righe
-- individuali di `scambi`. Cancellarle avrebbe azzerato l'impatto della
-- società — ed è il motivo per cui nessuna retention era applicabile.
--
-- Contenuto della migrazione:
--   1. tabella `impatto_aggregato` (livello anonimo permanente)
--   2. `registra_scambio()` scrive ENTRAMBI i livelli nella stessa transazione
--   3. `impatto_societa()` legge dal livello anonimo
--   4. `recensioni.id_scambio` → ON DELETE SET NULL (la reputazione sopravvive
--      alla scadenza dello scambio che l'ha originata)
--   5. `anonimizza_scambi()` + job notturno pg_cron (retention 12 mesi)
--   6. chat: `pulisci_conversazioni()` da 1 mese a 12 mesi, per allineare il
--      codice a quanto il §6 dichiara sui messaggi
--   7. backfill del livello anonimo dagli scambi già registrati
-- ════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. impatto_aggregato — livello ANONIMO, permanente
--
--    Volutamente SENZA foreign key: questo livello deve sopravvivere alla
--    cancellazione di utenti, articoli e scambi (è il suo scopo), e non deve
--    offrire alcuna chiave di ricongiungimento. Per lo stesso motivo la grana
--    temporale è il MESE, non l'istante dello scambio.
--
--    `id_categoria` e `id_societa` sono ammessi NULL solo per il backfill di
--    scambi storici il cui articolo/società non è più determinabile: da
--    `registra_scambio()` sono sempre valorizzati.
-- ─────────────────────────────────────────────
create table if not exists public.impatto_aggregato (
  mese          date not null,           -- primo giorno del mese di riferimento
  id_societa    bigint,                  -- società a cui è attribuito l'impatto
  id_categoria  bigint,                  -- categoria dell'articolo (catalogo globale)
  n_scambi      integer       not null default 0,
  co2           numeric(12,2) not null default 0,
  acqua         numeric(12,2) not null default 0,
  valore        numeric(12,2) not null default 0,
  aggiornato_at timestamptz   not null default now()
);

comment on table public.impatto_aggregato is
  'Livello AGGREGATO E ANONIMO del registro scambi (privacy policy §6): '
  'contatori di impatto per mese × società × categoria, senza alcun '
  'riferimento a utenti, articoli o scambi. Conservazione a tempo '
  'indeterminato: non sono dati personali.';

-- Chiave di upsert. I coalesce servono perché in Postgres due NULL non
-- collidono mai: senza, il backfill creerebbe righe duplicate.
create unique index if not exists uq_impatto_aggregato
  on public.impatto_aggregato
     (mese, (coalesce(id_societa, -1)), (coalesce(id_categoria, -1)));

create index if not exists idx_impatto_aggregato_societa
  on public.impatto_aggregato (id_societa);

-- Nessun accesso diretto dal client: si legge solo via impatto_societa()
-- (SECURITY DEFINER). RLS attiva SENZA policy = negato a tutti.
alter table public.impatto_aggregato enable row level security;
revoke all on public.impatto_aggregato from anon, authenticated;

-- ─────────────────────────────────────────────
-- 2. registra_scambio() — scrive i due livelli insieme
--    Rispetto a 0014 cambia solo la coda: oltre alla riga individuale,
--    incrementa i contatori del livello anonimo. Stessa transazione: o si
--    registrano entrambi i livelli, o nessuno dei due.
-- ─────────────────────────────────────────────
create or replace function public.registra_scambio(
  p_id_articolo  bigint,
  p_id_acquirente uuid
)
returns bigint
language plpgsql security definer set search_path = public
as $$
declare
  v_me         uuid := auth.uid();
  v_art        record;
  v_co2        numeric(10,2);
  v_acqua      numeric(10,2);
  v_owner_nome text;
  v_acq_nome   text;
  v_scambio    bigint;
begin
  if v_me is null then
    raise exception 'Utente non autenticato' using errcode = '42501';
  end if;

  select a.id, a.id_utente, a.id_categoria, a.id_societa, a.titolo, a.prezzo,
         a.stato, coalesce(a.foto_urls[1], a.foto_url) as foto
    into v_art
  from public.articoli a
  where a.id = p_id_articolo
  for update;

  if not found then
    raise exception 'Articolo inesistente' using errcode = 'P0002';
  end if;
  if v_art.id_utente <> v_me then
    raise exception 'Solo il proprietario può concludere lo scambio'
      using errcode = '42501';
  end if;
  if v_art.stato = 'Scambiato' then
    raise exception 'Articolo già scambiato' using errcode = '42501';
  end if;
  if p_id_acquirente = v_me then
    raise exception 'Non puoi scambiare con te stesso' using errcode = '42501';
  end if;

  -- integrità: l'acquirente deve aver scritto al proprietario per quest'articolo
  if not exists (
    select 1 from public.conversazioni c
    where c.id_articolo     = p_id_articolo
      and c.id_proprietario = v_me
      and c.id_acquirente   = p_id_acquirente
  ) then
    raise exception 'Nessuna conversazione con questo utente per l''articolo'
      using errcode = '42501';
  end if;

  select co2_tipico, acqua_tipico into v_co2, v_acqua
  from public.categorie_item where id = v_art.id_categoria;

  select nome_completo into v_owner_nome from public.utenti where id = v_me;
  select nome_completo into v_acq_nome   from public.utenti where id = p_id_acquirente;

  -- autorizza la transizione di stato per il solo update qui sotto
  perform set_config('loop.scambio_ok', '1', true);
  update public.articoli set stato = 'Scambiato' where id = p_id_articolo;
  perform set_config('loop.scambio_ok', '0', true);

  -- livello INDIVIDUALE (dato personale, retention 12 mesi)
  insert into public.scambi
    (id_articolo, id_venditore, id_acquirente, nome_venditore, nome_acquirente,
     titolo_articolo, foto_url, id_societa, co2, acqua, valore)
  values
    (p_id_articolo, v_me, p_id_acquirente,
     coalesce(v_owner_nome, 'Utente'), coalesce(v_acq_nome, 'Utente'),
     v_art.titolo, v_art.foto, v_art.id_societa,
     coalesce(v_co2, 0), coalesce(v_acqua, 0), coalesce(v_art.prezzo, 0))
  returning id into v_scambio;

  -- livello AGGREGATO E ANONIMO (permanente)
  insert into public.impatto_aggregato as ia
    (mese, id_societa, id_categoria, n_scambi, co2, acqua, valore)
  values
    (date_trunc('month', now())::date, v_art.id_societa, v_art.id_categoria,
     1, coalesce(v_co2, 0), coalesce(v_acqua, 0), coalesce(v_art.prezzo, 0))
  on conflict (mese, (coalesce(id_societa, -1)), (coalesce(id_categoria, -1)))
  do update set
    n_scambi      = ia.n_scambi + excluded.n_scambi,
    co2           = ia.co2      + excluded.co2,
    acqua         = ia.acqua    + excluded.acqua,
    valore        = ia.valore   + excluded.valore,
    aggiornato_at = now();

  return v_scambio;
end;
$$;

-- ─────────────────────────────────────────────
-- 3. impatto_societa() — legge dal livello ANONIMO
--    Da qui in poi l'impatto della società non dipende più né dalla retention
--    né dalla cancellazione degli account: è per costruzione permanente.
-- ─────────────────────────────────────────────
create or replace function public.impatto_societa()
returns table (n_scambi bigint, co2 numeric, acqua numeric, valore numeric)
language sql stable security definer set search_path = public
as $$
  select coalesce(sum(ia.n_scambi), 0)::bigint,
         coalesce(sum(ia.co2), 0),
         coalesce(sum(ia.acqua), 0),
         coalesce(sum(ia.valore), 0)
  from public.impatto_aggregato ia
  where ia.id_societa = public.current_user_societa();
$$;

-- ─────────────────────────────────────────────
-- 4. recensioni: la reputazione sopravvive alla scadenza dello scambio.
--    Con ON DELETE CASCADE (0014) la retention avrebbe cancellato anche le
--    valutazioni, cambiando la media della controparte. Con SET NULL la
--    recensione resta e per giunta perde il legame con lo scambio.
--    NB: il vincolo unique (id_scambio, id_autore) resta valido — in Postgres
--    i NULL non collidono, quindi le righe scollegate non si ostacolano.
-- ─────────────────────────────────────────────
alter table public.recensioni
  alter column id_scambio drop not null;

alter table public.recensioni
  drop constraint recensioni_id_scambio_fkey,
  add constraint recensioni_id_scambio_fkey
    foreign key (id_scambio) references public.scambi(id) on delete set null;

-- ─────────────────────────────────────────────
-- 5. Retention del livello individuale (12 mesi)
--    «Resi anonimi» = la riga individuale sparisce; il contributo statistico
--    resta nel livello aggregato, dove è già stato scritto al momento dello
--    scambio. Nessun ricalcolo, quindi nessun rischio di doppio conteggio.
-- ─────────────────────────────────────────────
create or replace function public.anonimizza_scambi()
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_count integer;
begin
  with del as (
    delete from public.scambi s
    where s.created_at < now() - interval '12 months'
    returning s.id
  )
  select count(*) into v_count from del;
  return v_count;
end;
$$;

comment on function public.anonimizza_scambi() is
  'Retention del livello individuale del registro scambi (privacy policy §6): '
  'elimina i record che collegano uno scambio a utenti identificabili dopo 12 '
  'mesi. L''impatto resta in impatto_aggregato, in forma anonima.';

revoke execute on function public.anonimizza_scambi() from public, anon, authenticated;

-- ─────────────────────────────────────────────
-- 6. Chat: retention allineata a quanto dichiara il §6 (circa 12 mesi).
--    Il criterio resta l'inattività della conversazione (cfr. 0017), ma la
--    soglia passa da 1 mese a 12: i messaggi servono a gestire eventuali
--    contestazioni sullo scambio, che ha la stessa finestra.
-- ─────────────────────────────────────────────
create or replace function public.pulisci_conversazioni()
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_count integer;
begin
  with del as (
    delete from public.conversazioni c
    where c.updated_at < now() - interval '12 months'
    returning c.id
  )
  select count(*) into v_count from del;
  return v_count;
end;
$$;

revoke execute on function public.pulisci_conversazioni() from public, anon, authenticated;

-- Job notturno (idempotente sul nome del job, come 0013). Gira mezz'ora dopo
-- la pulizia delle chat, così le due retention non si accavallano.
create extension if not exists pg_cron;

do $$ begin
  perform cron.unschedule('anonimizza-scambi');
exception when others then null; end $$;

select cron.schedule(
  'anonimizza-scambi',
  '45 3 * * *',                       -- ogni notte alle 03:45
  $$ select public.anonimizza_scambi(); $$
);

-- ─────────────────────────────────────────────
-- 7. Backfill: gli scambi già registrati entrano nel livello anonimo.
--    La categoria si recupera dall'articolo se esiste ancora; altrimenti
--    resta NULL (impatto contato, tipologia non più determinabile).
--    Idempotente per errore di doppia esecuzione? NO: l'upsert sommerebbe di
--    nuovo. Per questo il backfill è protetto dal test di tabella vuota.
-- ─────────────────────────────────────────────
do $$
begin
  if exists (select 1 from public.impatto_aggregato) then
    raise notice 'impatto_aggregato non è vuota: backfill saltato.';
    return;
  end if;

  insert into public.impatto_aggregato
    (mese, id_societa, id_categoria, n_scambi, co2, acqua, valore)
  select date_trunc('month', s.created_at)::date,
         s.id_societa,
         a.id_categoria,
         count(*),
         sum(s.co2),
         sum(s.acqua),
         sum(s.valore)
  from public.scambi s
  left join public.articoli a on a.id = s.id_articolo
  group by 1, 2, 3;

  raise notice 'Backfill impatto_aggregato: % righe da % scambi.',
    (select count(*) from public.impatto_aggregato),
    (select count(*) from public.scambi);
end $$;
