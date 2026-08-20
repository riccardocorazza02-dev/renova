import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Spinner } from '../components/Spinner'
import {
  TestataImpostazioni,
  RigaDato,
  BadgeEmailVerificata,
  FlussoCambioEmail,
  useRitornoDaVerificaEmail,
  SezioneEspandibile,
  SezionePassword,
} from '../components/impostazioni'
import {
  TextField,
  SelectField,
  PrimaryButton,
  ErrorBanner,
  SuccessBanner,
} from '../components/ui'
import type { Sesso } from '../lib/database.types'

/**
 * Impostazioni → Impostazioni account: i dati PRIVATI dell'account.
 *  - email di accesso con stato di verifica e cambio in due passi
 *    (prima si riverifica la casella attuale, poi si inserisce la nuova);
 *  - telefono facoltativo (in futuro solo per l'accesso, mai marketing);
 *  - anagrafiche facoltative, visibili solo all'interessato;
 *  - gestione password (sottosezione espandibile);
 *  - eliminazione definitiva dell'account (diritto all'oblio).
 */
export function ImpostazioniAccount() {
  const { session, profilo, refreshProfilo, deleteAccount } = useAuth()
  const uid = session?.user.id
  const email = session?.user.email ?? ''

  // Cambio email: il pannello si apre col bottone «Cambia» (o al ritorno
  // dal link di verifica della casella attuale).
  const emailVerificata = useRitornoDaVerificaEmail()
  const [mostraCambioEmail, setMostraCambioEmail] = useState(emailVerificata)

  // Telefono (box a sé, salvataggio indipendente)
  const [telefono, setTelefono] = useState(profilo?.telefono ?? '')
  const [salvandoTel, setSalvandoTel] = useState(false)
  const [erroreTel, setErroreTel] = useState('')
  const [fattoTel, setFattoTel] = useState(false)

  // Anagrafiche
  const [nomeCompleto, setNomeCompleto] = useState(profilo?.nome_completo ?? '')
  const [sesso, setSesso] = useState<'' | Sesso>(profilo?.sesso ?? '')
  const [dataNascita, setDataNascita] = useState(profilo?.data_nascita ?? '')
  const [salvando, setSalvando] = useState(false)
  const [errore, setErrore] = useState('')
  const [fatto, setFatto] = useState(false)

  // Eliminazione account (definitiva, con doppia conferma)
  const [confermaElimina, setConfermaElimina] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [erroreElimina, setErroreElimina] = useState('')

  if (!profilo || !uid) return null

  async function handleSalvaTelefono(e: FormEvent) {
    e.preventDefault()
    setErroreTel('')
    setFattoTel(false)
    setSalvandoTel(true)
    const { error } = await supabase
      .from('utenti')
      .update({ telefono: telefono.trim() || null })
      .eq('id', uid)
    if (error) {
      setErroreTel(
        error.code === '23514'
          ? 'Numero non valido: usa solo cifre e spazi (es. +39 333 1234567).'
          : 'Impossibile salvare il numero. Riprova.',
      )
      setSalvandoTel(false)
      return
    }
    await refreshProfilo()
    setSalvandoTel(false)
    setFattoTel(true)
  }

  async function handleSalva(e: FormEvent) {
    e.preventDefault()
    setErrore('')
    setFatto(false)
    if (!nomeCompleto.trim()) {
      setErrore('Nome e cognome non possono restare vuoti.')
      return
    }
    setSalvando(true)
    const { error } = await supabase
      .from('utenti')
      .update({
        nome_completo: nomeCompleto.trim(),
        sesso: sesso || null,
        data_nascita: dataNascita || null,
      })
      .eq('id', uid)
    if (error) {
      setErrore(
        error.code === '23514'
          ? 'Controlla i dati inseriti: data di nascita non valida.'
          : 'Impossibile salvare le modifiche. Riprova.',
      )
      setSalvando(false)
      return
    }
    await refreshProfilo()
    setSalvando(false)
    setFatto(true)
  }

  async function handleEliminaAccount() {
    setEliminando(true)
    setErroreElimina('')
    try {
      await deleteAccount()
      // Sessione azzerata → le rotte protette reindirizzano fuori dall'app.
    } catch (err) {
      setErroreElimina(
        err instanceof Error ? err.message : "Impossibile eliminare l'account.",
      )
      setEliminando(false)
    }
  }

  return (
    <div className="-mt-1">
      <TestataImpostazioni
        back="/impostazioni"
        backLabel="Impostazioni"
        eyebrow="Impostazioni"
        titolo="Impostazioni account"
        descrizione="Email, telefono, anagrafiche e password. Questi dati restano privati."
      />

      {/* Email di accesso: indirizzo + stato di verifica + cambio in due passi */}
      <section className="rounded-lg border border-edge bg-paper p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Email
            </span>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="truncate text-sm font-bold text-ink">
                {email || '—'}
              </span>
              <BadgeEmailVerificata />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMostraCambioEmail((m) => !m)}
            className="shrink-0 rounded-lg border border-edge bg-paper px-3.5 py-2 text-[12px] font-bold uppercase tracking-[0.06em] text-ink transition hover:border-ink"
          >
            {mostraCambioEmail ? 'Annulla' : 'Cambia'}
          </button>
        </div>
        {mostraCambioEmail && (
          <FlussoCambioEmail
            pagina="/impostazioni/account"
            emailVerificata={emailVerificata}
          />
        )}
      </section>

      {/* Società e sport (sola lettura: li fissa il codice di accesso) */}
      <section className="mt-4">
        <RigaDato etichetta="Società" valore={profilo.societa.nome} />
        <RigaDato etichetta="Sport" valore={profilo.sport} />
      </section>

      {/* Numero di cellulare */}
      <section className="mt-4 rounded-lg border border-edge bg-paper p-4">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.04em] text-ink">
          Numero di cellulare
        </h2>
        <p className="mb-4 mt-0.5 text-xs leading-relaxed text-ink-soft">
          Facoltativo e non verificato. In futuro servirà solo per l'accesso
          all'account: non verrà mai usato per fini di marketing e non compare
          mai agli altri utenti.
        </p>

        <form onSubmit={handleSalvaTelefono} className="space-y-4">
          {erroreTel && <ErrorBanner message={erroreTel} />}
          {fattoTel && <SuccessBanner message="Numero aggiornato." />}
          <TextField
            label="Numero di cellulare"
            type="tel"
            autoComplete="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+39 333 1234567"
          />
          <PrimaryButton type="submit" loading={salvandoTel}>
            {salvandoTel ? 'Salvo…' : 'Salva numero'}
          </PrimaryButton>
        </form>
      </section>

      {/* Anagrafiche — solo titolo e campi */}
      <section className="mt-4 rounded-lg border border-edge bg-paper p-4">
        <h2 className="mb-4 text-[13px] font-bold uppercase tracking-[0.04em] text-ink">
          Anagrafiche
        </h2>

        <form onSubmit={handleSalva} className="space-y-4">
          {errore && <ErrorBanner message={errore} />}
          {fatto && <SuccessBanner message="Dati aggiornati." />}
          <TextField
            label="Nome e cognome"
            autoComplete="name"
            required
            value={nomeCompleto}
            onChange={(e) => setNomeCompleto(e.target.value)}
            placeholder="Nome e cognome"
          />
          <SelectField
            label="Sesso"
            value={sesso}
            onChange={(e) => setSesso(e.target.value as '' | Sesso)}
          >
            <option value="">Preferisco non dirlo</option>
            <option value="Maschio">Maschio</option>
            <option value="Femmina">Femmina</option>
            <option value="Altro">Altro</option>
          </SelectField>
          <TextField
            label="Data di nascita"
            type="date"
            autoComplete="bday"
            value={dataNascita}
            onChange={(e) => setDataNascita(e.target.value)}
            min="1900-01-01"
            max={new Date().toISOString().slice(0, 10)}
          />
          <PrimaryButton type="submit" loading={salvando}>
            {salvando ? 'Salvo…' : 'Salva modifiche'}
          </PrimaryButton>
        </form>
      </section>

      {/* Password — sottosezione espandibile */}
      <SezioneEspandibile
        titolo="Cambia la password"
        sub="Aggiornala dall'app o via email"
      >
        <SezionePassword />
      </SezioneEspandibile>

      {/* Eliminazione account — definitiva (diritto all'oblio) */}
      <section className="mt-6 border-t border-line pt-4">
        {erroreElimina && (
          <p className="mb-3 border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {erroreElimina}
          </p>
        )}
        {!confermaElimina ? (
          <button
            type="button"
            onClick={() => setConfermaElimina(true)}
            className="w-full text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint transition hover:text-red-600"
          >
            Elimina il mio account
          </button>
        ) : (
          <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-ink">
              Eliminare definitivamente il tuo account?
            </p>
            <p className="text-xs leading-relaxed text-ink-soft">
              L'operazione è irreversibile: verranno cancellati il tuo profilo,
              i tuoi articoli con le foto e tutte le tue chat. Gli scambi già
              conclusi restano nello storico delle altre persone in forma
              anonima («Utente eliminato»).
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleEliminaAccount}
                disabled={eliminando}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.04em] text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {eliminando && <Spinner className="h-4 w-4" />}
                {eliminando ? 'Elimino…' : 'Sì, elimina tutto'}
              </button>
              <button
                type="button"
                onClick={() => setConfermaElimina(false)}
                disabled={eliminando}
                className="rounded-lg border border-edge bg-paper px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.04em] text-ink transition hover:border-ink disabled:opacity-60"
              >
                Annulla
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
