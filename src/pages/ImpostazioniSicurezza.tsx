import { useAuth } from '../contexts/AuthContext'
import {
  TestataImpostazioni,
  VoceOperazione,
} from '../components/impostazioni'

/**
 * Impostazioni → Sicurezza: un elenco di voci, ognuna delle quali porta
 * alla pagina interamente dedicata all'operazione. Email e password sono
 * le stesse pagine raggiungibili da «Impostazioni account» (duplicazione
 * voluta, un solo codice). Verifica in due passaggi e attività di login
 * sono annunciate «in arrivo»: la 2FA email/SMS non è supportata da
 * Supabase senza un provider SMS e l'elenco sessioni non è esposto al
 * client.
 */
export function ImpostazioniSicurezza() {
  const { session, profilo } = useAuth()
  const email = session?.user.email ?? ''
  const emailVerificata = Boolean(session?.user.email_confirmed_at)

  if (!profilo) return null

  return (
    <div className="-mt-1">
      <TestataImpostazioni
        back="/impostazioni"
        backLabel="Impostazioni"
        eyebrow="Impostazioni"
        titolo="Sicurezza"
        descrizione="Verifica dell'email, password e protezioni dell'account."
      />

      <div className="-mt-3">
        <VoceOperazione
          to="/impostazioni/sicurezza/verifica-email"
          titolo="Verifica email"
          sub={
            email
              ? `${email} · ${emailVerificata ? 'verificata' : 'non verificata'}`
              : '—'
          }
        />
        <VoceOperazione
          to="/impostazioni/sicurezza/email"
          titolo="Cambia email"
          sub="Prima verifichiamo l'indirizzo attuale"
        />
        <VoceOperazione
          to="/impostazioni/sicurezza/password"
          titolo="Cambia la password"
          sub="Aggiornala dall'app o via email"
        />
        <VoceOperazione
          to="/impostazioni/sicurezza/2fa"
          titolo="Verifica in due passaggi"
          sub="Proteggi l'account con un secondo codice"
          inArrivo
        />
        <VoceOperazione
          to="/impostazioni/sicurezza/accessi"
          titolo="Attività di login e dispositivi"
          sub="Gli accessi al tuo account"
          inArrivo
        />
      </div>
    </div>
  )
}
