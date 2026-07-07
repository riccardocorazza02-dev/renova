-- ════════════════════════════════════════════════════════════════
-- Renova · Migrazione 0007 — Hardening delle funzioni SECURITY DEFINER
-- ════════════════════════════════════════════════════════════════
-- Le funzioni-trigger non devono essere invocabili via API REST (/rpc).
-- Vengono eseguite dai trigger a prescindere dai privilegi del chiamante,
-- quindi revocare EXECUTE non ne compromette il funzionamento ma chiude
-- la superficie d'attacco (cfr. advisor 0028/0029 del database linter).
--
-- NB: `current_user_societa()` e `current_user_sport()` NON vengono
-- revocate: sono usate DENTRO le RLS policy e il ruolo `authenticated`
-- deve poterle eseguire perché le policy funzionino. Restituiscono solo
-- società/sport dell'utente loggato → rischio nullo.
-- ════════════════════════════════════════════════════════════════

revoke execute on function public.handle_new_user()      from public, anon, authenticated;
revoke execute on function public.set_articolo_context()  from public, anon, authenticated;
