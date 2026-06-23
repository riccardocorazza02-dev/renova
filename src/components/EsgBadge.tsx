import { formatCo2, formatAcqua, formatPrezzo } from '../lib/format'

type Variante = 'co2' | 'acqua' | 'economia'

const META: Record<Variante, { label: string; color: string; titolo: string }> = {
  co2: { label: 'CO₂', color: 'text-eco', titolo: 'CO₂ risparmiata' },
  acqua: { label: 'H₂O', color: 'text-water-600', titolo: 'Acqua risparmiata' },
  economia: { label: 'Valore', color: 'text-sun-600', titolo: 'Risparmio economico' },
}

interface Props {
  variante: Variante
  valore: number
  /** versione compatta per le card del feed */
  compact?: boolean
  /** stima prudenziale (L0): mostra "≥" davanti al valore ("almeno X") */
  minimo?: boolean
}

/**
 * Indicatore ESG 2A: etichetta MAIUSCOLA colorata (niente pill), nello stile
 * editoriale "press" — verde CO₂, azzurro acqua, arancio valore.
 * Es. "CO₂: 9 KG".
 */
export function EsgBadge({ variante, valore, compact = false, minimo = false }: Props) {
  const m = META[variante]
  const base =
    variante === 'co2'
      ? formatCo2(valore)
      : variante === 'acqua'
        ? formatAcqua(valore)
        : formatPrezzo(valore)
  const testo = minimo ? `≥ ${base}` : base

  return (
    <span
      title={`${m.titolo}: ${testo}`}
      className={`inline-flex items-baseline gap-1 font-bold uppercase tracking-[0.04em] ${m.color} ${
        compact ? 'text-[9.5px]' : 'text-[11px]'
      }`}
    >
      <span>{m.label}:</span>
      <span>{testo}</span>
    </span>
  )
}
