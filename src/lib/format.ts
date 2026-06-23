// Piccoli helper di formattazione condivisi dalla UI.

const eur = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
})

export const formatPrezzo = (v: number): string => eur.format(v)

/** CO2 in kg, con una cifra decimale, es. "9.5 kg". */
export const formatCo2 = (kg: number): string =>
  `${new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 }).format(kg)} kg`

/** Nomi leggibili delle fibre, per codice (allineati alla tabella `fibre`). */
export const FIBRA_LABELS: Record<string, string> = {
  PET: 'poliestere',
  rPET: 'poliestere riciclato',
  CO: 'cotone',
  EA: 'elastan',
  PA: 'poliammide',
  PU: 'poliuretano',
  AC: 'acrilico',
  WO: 'lana',
  VI: 'viscosa',
  PP: 'polipropilene',
}

/**
 * Composizione leggibile, es. {PET:65, CO:35} → "65% poliestere · 35% cotone".
 * Ordina per percentuale decrescente. Ritorna stringa vuota se non disponibile.
 */
export const formatComposizione = (
  comp: Record<string, number> | null | undefined,
): string => {
  if (!comp) return ''
  return Object.entries(comp)
    .sort((a, b) => b[1] - a[1])
    .map(([cod, pct]) => `${pct}% ${FIBRA_LABELS[cod] ?? cod}`)
    .join(' · ')
}

/** Litri d'acqua, abbreviati in "L"/"k L", es. "4.2k L". */
export const formatAcqua = (litri: number): string => {
  if (litri >= 1000) {
    const k = new Intl.NumberFormat('it-IT', {
      maximumFractionDigits: 1,
    }).format(litri / 1000)
    return `${k}k L`
  }
  return `${new Intl.NumberFormat('it-IT').format(litri)} L`
}

/**
 * Etichetta compatta per la lista chat: "Adesso", "12:30", "Ieri",
 * "lun", oppure la data breve per i messaggi più vecchi.
 */
export const formatOraChat = (iso: string): string => {
  const d = new Date(iso)
  const ora = new Date()
  const msDiff = ora.getTime() - d.getTime()
  const minuti = Math.floor(msDiff / 60000)
  if (minuti < 1) return 'Adesso'

  const sameDay = d.toDateString() === ora.toDateString()
  if (sameDay)
    return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

  const ieri = new Date(ora)
  ieri.setDate(ora.getDate() - 1)
  if (d.toDateString() === ieri.toDateString()) return 'Ieri'

  if (msDiff < 7 * 86400000)
    return d.toLocaleDateString('it-IT', { weekday: 'short' })

  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
}

/** Orario di un messaggio nel thread, es. "12:30". */
export const formatOraMessaggio = (iso: string): string =>
  new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

/** Separatore di giornata nel thread, es. "Oggi", "Ieri", "5 giugno 2026". */
export const formatGiornoMessaggio = (iso: string): string => {
  const d = new Date(iso)
  const ora = new Date()
  if (d.toDateString() === ora.toDateString()) return 'Oggi'
  const ieri = new Date(ora)
  ieri.setDate(ora.getDate() - 1)
  if (d.toDateString() === ieri.toDateString()) return 'Ieri'
  return d.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Placeholder per articoli senza foto — trama diagonale avorio del design
 * Press 2A (repeating-linear-gradient avorio chiaro). Niente immagine: lo
 * sfondo a righe è applicato direttamente nelle card (classe `.foto-stripe`).
 */
export const PLACEHOLDER_FOTO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <defs>
        <pattern id="d" width="36" height="36" patternTransform="rotate(135)" patternUnits="userSpaceOnUse">
          <rect width="36" height="36" fill="#f4f3ec"/>
          <rect width="18" height="36" fill="#eceae3"/>
        </pattern>
      </defs>
      <rect width="400" height="400" fill="url(#d)"/>
    </svg>`,
  )
