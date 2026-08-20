import {
  TestataImpostazioni,
  OpzionePreferenza,
} from '../components/impostazioni'

/**
 * Impostazioni → Modalità chiara e scura. Lo stile Sport-Tech oggi è
 * disegnato solo chiaro: la pagina predispone la scelta (il tema scuro
 * richiede la revisione visiva di tutta l'app, un lavoro dedicato).
 */
export function ImpostazioniTema() {
  return (
    <div className="-mt-1">
      <TestataImpostazioni
        back="/impostazioni"
        backLabel="Impostazioni"
        eyebrow="Impostazioni"
        titolo="Modalità chiara e scura"
        descrizione="L'aspetto dell'interfaccia di renova."
      />

      <div className="space-y-3">
        <OpzionePreferenza
          titolo="Chiara"
          descrizione="Il tema attuale dell'app: sfondi bianchi e accento Verde Eco."
          attiva
        />
        <OpzionePreferenza
          titolo="Scura"
          descrizione="Il tema scuro è in preparazione."
          inArrivo
        />
      </div>
    </div>
  )
}
