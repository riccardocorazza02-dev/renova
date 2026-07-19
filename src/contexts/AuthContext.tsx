import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, STORAGE_BUCKET } from '../lib/supabase'
import type { Utente, Societa } from '../lib/database.types'

/** Profilo applicativo dell'utente + la sua società. */
export interface Profilo extends Utente {
  societa: Societa
}

interface AuthContextValue {
  session: Session | null
  profilo: Profilo | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (params: {
    email: string
    password: string
    nomeCompleto: string
    codiceSocieta: string
  }) => Promise<void>
  signOut: () => Promise<void>
  /** Elimina DEFINITIVAMENTE l'account (RPC `elimina_account`) e chiude la sessione. */
  deleteAccount: () => Promise<void>
  refreshProfilo: () => Promise<void>
  /** Invia l'email con il link per reimpostare la password. */
  resetPassword: (email: string) => Promise<void>
  /** Imposta una nuova password (durante la sessione di recupero). */
  updatePassword: (password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function fetchProfilo(userId: string): Promise<Profilo | null> {
  const { data, error } = await supabase
    .from('utenti')
    .select('*, societa:societa(*)')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('[Renova] Impossibile caricare il profilo:', error.message)
    return null
  }
  return data as unknown as Profilo
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profilo, setProfilo] = useState<Profilo | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfilo = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfilo(null)
      return
    }
    setProfilo(await fetchProfilo(userId))
  }, [])

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      await loadProfilo(data.session?.user.id)
      if (active) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!active) return
        setSession(newSession)
        await loadProfilo(newSession?.user.id)
      },
    )

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfilo])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(traduciErrore(error.message))
  }, [])

  const signUp = useCallback<AuthContextValue['signUp']>(
    async ({ email, password, nomeCompleto, codiceSocieta }) => {
      // Validazione anticipata del codice di accesso per un messaggio chiaro.
      // Il codice determina società E sport (lo applica poi il trigger
      // handle_new_user lato DB cercando in codici_accesso).
      const { data: codice } = await supabase
        .from('codici_accesso')
        .select('id')
        .ilike('codice', codiceSocieta.trim())
        .maybeSingle()

      if (!codice) {
        throw new Error(
          'Codice di accesso non valido. Controlla con la tua società sportiva.',
        )
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Destinazione del link nell'email di conferma: la radice del sito
          // (l'utente atterra già autenticato e viene portato al feed).
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            nome_completo: nomeCompleto.trim(),
            codice_societa: codiceSocieta.trim(),
          },
        },
      })
      if (error) throw new Error(traduciErrore(error.message))
    },
    [],
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfilo(null)
  }, [])

  const deleteAccount = useCallback(async () => {
    // Prima la pulizia delle foto (Storage API, policy "delete proprio"):
    // il DELETE SQL diretto su storage.objects è vietato da Supabase, quindi
    // la RPC non può farlo. Best-effort: un errore qui non blocca l'oblio.
    const { data } = await supabase.auth.getSession()
    const uid = data.session?.user.id
    if (uid) {
      try {
        await svuotaCartellaStorage(uid)
      } catch (err) {
        console.warn('[Renova] Pulizia storage non completata:', err)
      }
    }

    const { error } = await supabase.rpc('elimina_account')
    if (error) {
      console.error('[Renova] elimina_account error:', error.message)
      throw new Error(
        "Impossibile eliminare l'account. Riprova o contatta info@renovasport.it.",
      )
    }
    // L'utente non esiste più lato server: basta chiudere la sessione locale.
    await supabase.auth.signOut({ scope: 'local' })
    setProfilo(null)
  }, [])

  const refreshProfilo = useCallback(async () => {
    await loadProfilo(session?.user.id)
  }, [loadProfilo, session?.user.id])

  const resetPassword = useCallback(async (email: string) => {
    // Il link nell'email riporta alla pagina di aggiornamento password.
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/aggiorna-password`,
    })
    if (error) throw new Error(traduciErrore(error.message))
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw new Error(traduciErrore(error.message))
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        profilo,
        loading,
        signIn,
        signUp,
        signOut,
        deleteAccount,
        refreshProfilo,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve essere usato dentro <AuthProvider>')
  return ctx
}

/**
 * Svuota ricorsivamente la cartella dell'utente nel bucket foto
 * (articoli, etichette e foto di chat: `<uid>/…`).
 */
async function svuotaCartellaStorage(prefix: string): Promise<void> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(prefix, { limit: 1000 })
  if (error || !data) return
  const files: string[] = []
  for (const voce of data) {
    // Le sottocartelle (es. chat/) hanno id null e vanno visitate.
    if (voce.id) files.push(`${prefix}/${voce.name}`)
    else await svuotaCartellaStorage(`${prefix}/${voce.name}`)
  }
  if (files.length) {
    await supabase.storage.from(STORAGE_BUCKET).remove(files)
  }
}

/** Traduce i messaggi di errore Supabase più comuni in italiano. */
function traduciErrore(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials'))
    return 'Email o password non corretti.'
  if (m.includes('user already registered') || m.includes('already been registered'))
    return 'Esiste già un account con questa email.'
  if (m.includes('password should be at least'))
    return 'La password deve avere almeno 6 caratteri.'
  if (m.includes('codice società') || m.includes('23514'))
    return 'Codice società non valido.'
  if (m.includes('email not confirmed'))
    return 'Conferma la tua email prima di accedere.'
  return msg
}
