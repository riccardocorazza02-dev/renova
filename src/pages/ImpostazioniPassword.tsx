import { Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  TestataImpostazioni,
  SezionePassword,
} from '../components/impostazioni'
import { SEZIONI_MADRI } from './ImpostazioniEmail'

/**
 * Pagina dedicata al cambio della password, raggiungibile sia da
 * «Impostazioni account» sia da «Sicurezza»
 * (/impostazioni/:sezione/password). Le due strade: aggiornamento
 * dall'app (con password attuale) o link via email.
 */
export function ImpostazioniPassword() {
  const { sezione } = useParams()
  const { profilo } = useAuth()

  if (!profilo) return null
  if (sezione !== 'account' && sezione !== 'sicurezza') {
    return <Navigate to="/impostazioni" replace />
  }

  return (
    <div className="-mt-1">
      <TestataImpostazioni
        back={`/impostazioni/${sezione}`}
        backLabel={SEZIONI_MADRI[sezione]}
        eyebrow="Impostazioni"
        titolo="Cambia la password"
        descrizione="Aggiornala dall'app oppure con un link via email."
      />
      <div className="-mt-4">
        <SezionePassword />
      </div>
    </div>
  )
}
