import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * `true` quando le variabili d'ambiente Supabase sono configurate.
 * L'app lo usa per mostrare un messaggio chiaro invece di crashare
 * se `.env` non è ancora stato compilato.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  // Avviso non bloccante: la UI mostra comunque una schermata di setup.
  console.warn(
    '[Renova] Supabase non configurato. Copia .env.example in .env e ' +
      'inserisci VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
  )
}

// Se non configurato usiamo placeholder così l'import non lancia eccezioni;
// le chiamate falliranno in modo controllato e la UI lo gestisce.
export const supabase = createClient(
  url ?? 'http://localhost:54321',
  anonKey ?? 'public-anon-key-placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

/** Nome del bucket Storage per le foto degli articoli. */
export const STORAGE_BUCKET =
  import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'articoli'
