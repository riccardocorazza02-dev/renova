-- ════════════════════════════════════════════════════════════════
-- Loop · Migrazione 0011 — Storage bucket per le foto degli articoli
-- ════════════════════════════════════════════════════════════════
-- Senza il bucket l'upload in Upload.tsx fallisce in silenzio e l'app
-- ripiega sul placeholder: nel feed non si vede mai la foto caricata.
-- Qui creiamo il bucket pubblico `articoli` e le policy:
--   • lettura pubblica (il feed usa getPublicUrl);
--   • scrittura/aggiornamento/cancellazione SOLO nella propria cartella
--     (il path è `<auth.uid()>/<uuid>.<ext>`, vedi Upload.tsx).
-- ════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('articoli', 'articoli', true)
on conflict (id) do update set public = true;

-- Lettura pubblica delle foto
drop policy if exists "articoli storage: lettura pubblica" on storage.objects;
create policy "articoli storage: lettura pubblica"
  on storage.objects for select
  using (bucket_id = 'articoli');

-- Upload: solo utenti autenticati, e solo nella propria cartella
drop policy if exists "articoli storage: upload proprio" on storage.objects;
create policy "articoli storage: upload proprio"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'articoli'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Aggiornamento dei propri file
drop policy if exists "articoli storage: update proprio" on storage.objects;
create policy "articoli storage: update proprio"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'articoli'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'articoli'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Cancellazione dei propri file
drop policy if exists "articoli storage: delete proprio" on storage.objects;
create policy "articoli storage: delete proprio"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'articoli'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
