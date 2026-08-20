import {
  TestataImpostazioni,
  OpzionePreferenza,
} from '../components/impostazioni'

/**
 * Impostazioni → Linguaggio app. L'app oggi esiste solo in italiano: la
 * pagina predispone la scelta (l'inglese arriverà con l'infrastruttura
 * di traduzione, un lavoro dedicato).
 */
export function ImpostazioniLingua() {
  return (
    <div className="-mt-1">
      <TestataImpostazioni
        back="/impostazioni"
        backLabel="Impostazioni"
        eyebrow="Impostazioni"
        titolo="Linguaggio app"
        descrizione="La lingua dell'interfaccia di renova."
      />

      <div className="space-y-3">
        <OpzionePreferenza
          titolo="Italiano"
          descrizione="La lingua attuale dell'app."
          attiva
        />
        <OpzionePreferenza
          titolo="English"
          descrizione="La versione inglese dell'interfaccia è in preparazione."
          inArrivo
        />
      </div>
    </div>
  )
}
