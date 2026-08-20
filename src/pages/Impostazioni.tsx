import { useAuth } from '../contexts/AuthContext'
import {
  TestataImpostazioni,
  VoceImpostazioni,
} from '../components/impostazioni'

/**
 * Menu della sezione Impostazioni (si apre dalla voce con la rotella nel
 * profilo). Ogni voce è una sottosezione con la propria pagina.
 */
export function Impostazioni() {
  const { profilo } = useAuth()
  if (!profilo) return null

  return (
    <div className="-mt-1">
      <TestataImpostazioni
        back="/profilo"
        backLabel="Profilo"
        eyebrow="Impostazioni"
        titolo="Impostazioni"
        descrizione="Profilo, account, sicurezza e preferenze dell'app."
      />

      <div className="-mx-4 border-b border-line">
        <VoceImpostazioni
          to="/impostazioni/profilo"
          titolo="Dettaglio profilo"
          sub="Foto, nome utente, su di me, città"
          icona={<IconaProfilo />}
        />
        <VoceImpostazioni
          to="/impostazioni/account"
          titolo="Impostazioni account"
          sub="Email, telefono, anagrafiche, password"
          icona={<IconaAccount />}
        />
        <VoceImpostazioni
          to="/impostazioni/sicurezza"
          titolo="Sicurezza"
          sub="Verifica email, password, accessi"
          icona={<IconaSicurezza />}
        />
        <VoceImpostazioni
          to="/impostazioni/lingua"
          titolo="Linguaggio app"
          sub="Italiano"
          icona={<IconaLingua />}
        />
        <VoceImpostazioni
          to="/impostazioni/tema"
          titolo="Modalità chiara e scura"
          sub="Chiara"
          icona={<IconaTema />}
        />
      </div>

      <p className="pb-2 pt-5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
        renova · Sport Resale &amp; ESG
      </p>
    </div>
  )
}

function IconaProfilo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconaAccount() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 9h18" stroke="currentColor" strokeWidth="2" />
      <path d="M7 14h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconaSicurezza() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconaLingua() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9S14.5 18.5 12 21c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  )
}

function IconaTema() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 3a9 9 0 010 18V3z" fill="currentColor" />
    </svg>
  )
}
