import type { Scambio } from '../lib/database.types'
import { PLACEHOLDER_FOTO } from '../lib/format'
import { EsgBadge } from './EsgBadge'
import { RecensioneScambio } from './RecensioneScambio'

/**
 * Card di un singolo scambio (in entrata o in uscita) con impatto registrato e
 * riquadro per la recensione reciproca. I dati sono denormalizzati sullo
 * scambio, quindi self-contained.
 */
export function ScambioCard({
  scambio: s,
  meId,
}: {
  scambio: Scambio
  meId: string
}) {
  const inUscita = s.id_venditore === meId
  const controparte = inUscita ? s.nome_acquirente : s.nome_venditore
  return (
    <article className="space-y-3 rounded-lg border border-line bg-paper p-4">
      <div className="flex items-center gap-3">
        <img
          src={s.foto_url || PLACEHOLDER_FOTO}
          alt=""
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).src = PLACEHOLDER_FOTO
          }}
          className="h-14 w-14 shrink-0 rounded-lg border border-line object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold tracking-[-0.01em] text-ink">
            {s.titolo_articolo}
          </p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
            {inUscita ? 'Donato a' : 'Ricevuto da'}{' '}
            <span className="text-ink">{controparte}</span> ·{' '}
            {new Date(s.created_at).toLocaleDateString('it-IT', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
        <span
          className={`shrink-0 px-[7px] py-[3px] text-[9px] font-bold uppercase tracking-[0.06em] text-white ${
            inUscita ? 'bg-eco' : 'bg-water'
          }`}
        >
          {inUscita ? 'In uscita' : 'In entrata'}
        </span>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
        <EsgBadge variante="co2" valore={Number(s.co2)} />
        <EsgBadge variante="acqua" valore={Number(s.acqua)} />
        <EsgBadge variante="economia" valore={Number(s.valore)} />
      </div>

      <RecensioneScambio scambioId={s.id} controparteNome={controparte} />
    </article>
  )
}

/** Lista completa degli scambi dell'utente (usata nella pagina "I miei scambi"). */
export function StoricoScambi({
  scambi,
  meId,
}: {
  scambi: Scambio[]
  meId: string
}) {
  if (scambi.length === 0) {
    return (
      <section className="border-y border-line px-5 py-12 text-center">
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-ink-soft">
          Non hai ancora concluso scambi. Quando ne completi uno comparirà qui,
          sia che tu doni sia che ricevi un articolo.
        </p>
      </section>
    )
  }

  return (
    <div className="space-y-3">
      {scambi.map((s) => (
        <ScambioCard key={s.id} scambio={s} meId={meId} />
      ))}
    </div>
  )
}
