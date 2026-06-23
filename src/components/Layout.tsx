import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Logo } from './Logo'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { ConversazioneConArticolo } from '../lib/database.types'
import { isNonLetta } from '../pages/Chat'

/**
 * Icona della bottom-nav, stile 2A: quando la tab è attiva l'icona è PIENA
 * (fill), altrimenti è a contorno (stroke). Riproduce esattamente le icone
 * del design Press 2A (griglia, foglia, fumetto, persona).
 */
function TabIcon({
  name,
  active = false,
}: {
  name: 'feed' | 'impatto' | 'chat' | 'profilo'
  active?: boolean
}) {
  const stroke = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    stroke: 'currentColor',
  }
  if (name === 'feed')
    return active ? (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="3" width="7" height="7" rx="1.4" />
        <rect x="14" y="3" width="7" height="7" rx="1.4" />
        <rect x="3" y="14" width="7" height="7" rx="1.4" />
        <rect x="14" y="14" width="7" height="7" rx="1.4" />
      </svg>
    ) : (
      <svg {...stroke}>
        <rect x="3" y="3" width="7" height="7" rx="1.4" />
        <rect x="14" y="3" width="7" height="7" rx="1.4" />
        <rect x="3" y="14" width="7" height="7" rx="1.4" />
        <rect x="14" y="14" width="7" height="7" rx="1.4" />
      </svg>
    )
  if (name === 'impatto')
    return active ? (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 19c0-8 6-13 14-13 0 8-5 14-14 13Z" />
      </svg>
    ) : (
      <svg {...stroke}>
        <path d="M5 19c0-8 6-13 14-13 0 8-5 14-14 13Z" />
        <path d="M5 19c2-5 5-7 9-8" />
      </svg>
    )
  if (name === 'chat')
    return (
      <svg {...stroke}>
        <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12Z" />
      </svg>
    )
  return (
    <svg {...stroke}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  )
}

/** Tab editoriale 2A: icona + etichetta MAIUSCOLA 9px; attiva = nera piena. */
function Tab({
  to,
  label,
  name,
  badge = 0,
}: {
  to: string
  label: string
  name: 'feed' | 'impatto' | 'chat' | 'profilo'
  badge?: number
}) {
  return (
    <NavLink
      to={to}
      end
      aria-label={label}
      className={({ isActive }) =>
        [
          'flex flex-1 flex-col items-center justify-center gap-[3px] transition',
          isActive ? 'text-ink' : 'text-ink-faint hover:text-ink-soft',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span className="relative">
            <TabIcon name={name} active={isActive} />
            {badge > 0 && (
              <span className="absolute -right-2.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-eco px-1 text-[10px] font-bold text-white ring-2 ring-paper">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </span>
          <span
            className={`text-[9px] uppercase tracking-[0.04em] ${
              isActive ? 'font-bold' : 'font-semibold'
            }`}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}

/** FAB centrale "Aggiungi" (croce), rialzato sopra la barra come nel 2A. */
function AddFab() {
  return (
    <NavLink
      to="/aggiungi"
      end
      aria-label="Aggiungi un articolo"
      className="absolute left-1/2 top-0 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-eco shadow-[0_8px_20px_rgba(22,162,89,0.40)] ring-4 ring-paper transition active:scale-95"
    >
      <svg
        width={26}
        height={26}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth={2.6}
        strokeLinecap="round"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    </NavLink>
  )
}

/** Conta le conversazioni con messaggi non letti per l'utente loggato. */
function useChatNonLette(userId: string | undefined): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!userId) {
      setCount(0)
      return
    }
    let active = true
    async function load() {
      const { data, error } = await supabase
        .from('conversazioni')
        .select(
          `id, id_proprietario, id_acquirente, letto_proprietario,
           letto_acquirente, updated_at`,
        )
      if (!active || error) return
      const righe = (data ?? []) as unknown as ConversazioneConArticolo[]
      setCount(righe.filter((c) => isNonLetta(c, userId)).length)
    }
    load()
    // Tempo reale + fallback: ricarica anche quando la finestra torna in primo
    // piano, così il badge resta corretto anche se il realtime non è attivo.
    const channel = supabase
      .channel('chat-badge')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversazioni' },
        () => load(),
      )
      .subscribe()
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      active = false
      supabase.removeChannel(channel)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [userId])

  return count
}

/** Shell mobile-first: header sticky + contenuto + bottom navigation. */
export function Layout() {
  const { profilo, session } = useAuth()
  const chatNonLette = useChatNonLette(session?.user.id)

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col bg-paper">
      {/* Header — regola nera netta in fondo (taglio editoriale 2A) */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b-[1.5px] border-ink bg-paper/95 px-4 py-3 backdrop-blur">
        <Logo className="text-[21px]" />
        {profilo && (
          <span className="max-w-[55%] truncate rounded-md border border-edge px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
            {profilo.societa.nome}
          </span>
        )}
      </header>

      {/* Contenuto scrollabile */}
      <main className="flex-1 px-4 pb-28 pt-4">
        <Outlet />
      </main>

      {/* Bottom navigation — regola nera netta in cima + FAB verde centrale */}
      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-2xl border-t-[1.5px] border-ink bg-paper">
        <div className="relative flex items-stretch px-5 pb-[env(safe-area-inset-bottom)] pt-2.5">
          <Tab to="/feed" label="Market" name="feed" />
          <Tab to="/impatto" label="Impatto" name="impatto" />
          {/* spazio per il FAB centrale */}
          <div className="w-14 shrink-0" aria-hidden="true" />
          <Tab to="/chat" label="Chat" name="chat" badge={chatNonLette} />
          <Tab to="/profilo" label="Profilo" name="profilo" />
          <AddFab />
        </div>
      </nav>
    </div>
  )
}
