-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0002 — Row Level Security
-- ════════════════════════════════════════════════════════════════
-- La REGOLA DI BUSINESS centrale ("un utente vede solo gli articoli
-- della propria società") è applicata qui a livello di database, così
-- è impossibile aggirarla dal client.
-- ════════════════════════════════════════════════════════════════

alter table public.societa         enable row level security;
alter table public.metriche_esg    enable row level security;
alter table public.catalogo_societa enable row level security;
alter table public.utenti          enable row level security;
alter table public.articoli        enable row level security;

-- ─────────────────────────────────────────────
-- societa
-- Lettura pubblica (serve a validare il codice invito PRIMA del login).
-- Nessuna scrittura dal client: le società le gestisce l'admin.
-- ─────────────────────────────────────────────
drop policy if exists "societa: lettura pubblica" on public.societa;
create policy "societa: lettura pubblica"
  on public.societa for select
  to anon, authenticated
  using (true);

-- ─────────────────────────────────────────────
-- metriche_esg — dati di riferimento, lettura per utenti autenticati
-- ─────────────────────────────────────────────
drop policy if exists "metriche: lettura autenticati" on public.metriche_esg;
create policy "metriche: lettura autenticati"
  on public.metriche_esg for select
  to authenticated
  using (true);

-- ─────────────────────────────────────────────
-- catalogo_societa — l'utente vede solo il catalogo della SUA società
-- ─────────────────────────────────────────────
drop policy if exists "catalogo: solo propria societa" on public.catalogo_societa;
create policy "catalogo: solo propria societa"
  on public.catalogo_societa for select
  to authenticated
  using (id_societa = public.current_user_societa());

-- ─────────────────────────────────────────────
-- utenti
--   • lettura: il proprio profilo + i membri della propria società
--   • update: solo il proprio profilo
--   (l'insert avviene via trigger handle_new_user, SECURITY DEFINER)
-- ─────────────────────────────────────────────
drop policy if exists "utenti: lettura stessa societa" on public.utenti;
create policy "utenti: lettura stessa societa"
  on public.utenti for select
  to authenticated
  using (id = auth.uid() or id_societa = public.current_user_societa());

drop policy if exists "utenti: update proprio profilo" on public.utenti;
create policy "utenti: update proprio profilo"
  on public.utenti for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ─────────────────────────────────────────────
-- articoli — il cuore della regola di business
--   • SELECT: visibili solo gli articoli il cui PROPRIETARIO appartiene
--             alla mia stessa società.
--   • INSERT: posso creare solo articoli a mio nome e su una voce di
--             catalogo della mia società.
--   • UPDATE/DELETE: solo i miei articoli.
-- ─────────────────────────────────────────────
drop policy if exists "articoli: lettura propria societa" on public.articoli;
create policy "articoli: lettura propria societa"
  on public.articoli for select
  to authenticated
  using (
    exists (
      select 1 from public.utenti u
      where u.id = articoli.id_utente
        and u.id_societa = public.current_user_societa()
    )
  );

drop policy if exists "articoli: inserimento proprio" on public.articoli;
create policy "articoli: inserimento proprio"
  on public.articoli for insert
  to authenticated
  with check (
    id_utente = auth.uid()
    and exists (
      select 1 from public.catalogo_societa c
      where c.id = id_catalogo
        and c.id_societa = public.current_user_societa()
    )
  );

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

-- ─────────────────────────────────────────────
-- Storage: bucket pubblico in lettura per le foto degli articoli.
-- Esegui solo se hai creato il bucket "articoli" (vedi README).
-- ─────────────────────────────────────────────
-- insert into storage.buckets (id, name, public)
-- values ('articoli', 'articoli', true)
-- on conflict (id) do nothing;
--
-- drop policy if exists "articoli storage: lettura pubblica" on storage.objects;
-- create policy "articoli storage: lettura pubblica"
--   on storage.objects for select
--   using (bucket_id = 'articoli');
--
-- drop policy if exists "articoli storage: upload autenticati" on storage.objects;
-- create policy "articoli storage: upload autenticati"
--   on storage.objects for insert to authenticated
--   with check (bucket_id = 'articoli');
