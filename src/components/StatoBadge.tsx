import type { StatoArticolo } from '../lib/database.types'

/* Badge di stato 2A: etichetta MAIUSCOLA squadrata (niente angoli tondi),
   colori pieni — Disponibile verde, Prenotato arancio, Scambiato nero. */
const STILI: Record<StatoArticolo, string> = {
  Disponibile: 'bg-eco text-white',
  Prenotato: 'bg-sun text-white',
  Scambiato: 'bg-ink text-white',
}

export function StatoBadge({ stato }: { stato: StatoArticolo }) {
  return (
    <span
      className={`inline-block px-[7px] py-[3px] text-[9px] font-bold uppercase leading-none tracking-[0.06em] ${STILI[stato]}`}
    >
      {stato}
    </span>
  )
}
