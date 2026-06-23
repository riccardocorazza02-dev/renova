-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0005 — Row Level Security per i due feed
-- ════════════════════════════════════════════════════════════════
-- REGOLE DI BUSINESS (applicate nel DB, non solo lato client):
--
--   • FEED PUBBLICO: un utente vede tutti gli articoli SENZA logo
--     (ha_logo_societa = false) del PROPRIO sport, indipendentemente
--     dalla società del proprietario. (Per ora nessun filtro regionale:
--     in fase di avvio gli utenti sono tutti su Bologna; la
--     regionalizzazione si aggiungerà filtrando per provincia.)
--
--   • FEED SOCIETARIO: un utente vede gli articoli CON logo
--     (ha_logo_societa = true) solo se appartengono alla SUA società
--     e al SUO sport (non avrebbe senso vedere la maglia di un'altra
--     società).
-- ════════════════════════════════════════════════════════════════

alter table public.categorie_item enable row level security;
alter table public.codici_accesso enable row level security;

-- ─────────────────────────────────────────────
-- categorie_item — dati di riferimento, lettura per autenticati
-- ─────────────────────────────────────────────
drop policy if exists "categorie: lettura autenticati" on public.categorie_item;
create policy "categorie: lettura autenticati"
  on public.categorie_item for select
  to authenticated
  using (true);

-- ─────────────────────────────────────────────
-- codici_accesso — lettura pubblica (serve a validare il codice PRIMA
-- del signup e a mostrare lo sport associato). Nessuna scrittura dal client.
-- ─────────────────────────────────────────────
drop policy if exists "codici: lettura pubblica" on public.codici_accesso;
create policy "codici: lettura pubblica"
  on public.codici_accesso for select
  to anon, authenticated
  using (true);

-- ─────────────────────────────────────────────
-- articoli — il cuore della nuova logica a due feed
-- ─────────────────────────────────────────────
drop policy if exists "articoli: lettura propria societa" on public.articoli;
drop policy if exists "articoli: feed pubblico e societario" on public.articoli;
create policy "articoli: feed pubblico e societario"
  on public.articoli for select
  to authenticated
  using (
    -- Feed pubblico: stesso sport, senza logo
    (sport = public.current_user_sport() and ha_logo_societa = false)
    or
    -- Feed societario: stesso sport, stessa società, con logo
    (
      sport = public.current_user_sport()
      and id_societa = public.current_user_societa()
      and ha_logo_societa = true
    )
  );

-- INSERT: posso creare solo articoli a mio nome. società e sport vengono
-- impostati dal trigger set_articolo_context dal mio profilo, quindi non
-- sono falsificabili dal client.
drop policy if exists "articoli: inserimento proprio" on public.articoli;
create policy "articoli: inserimento proprio"
  on public.articoli for insert
  to authenticated
  with check (id_utente = auth.uid());

-- UPDATE / DELETE: solo i miei articoli
drop policy if exists "articoli: update proprio" on public.articoli;
create policy "articoli: update proprio"
  on public.articoli for update
  to authenticated
  using (id_utente = auth.uid())
  with check (id_utente = auth.uid());

drop policy if exists "articoli: delete proprio" on public.articoli;
create policy "articoli: delete proprio"
  on public.articoli for delete
  to authenticated
  using (id_utente = auth.uid());
