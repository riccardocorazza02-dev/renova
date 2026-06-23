import type { TipoTaglia } from './database.types'

// ── Set di taglie selezionabili in base al tipo di categoria ──
// Condiviso tra il form di caricamento (Upload) e quello di modifica
// (ModificaArticolo) per non duplicare gli elenchi.

export const TAGLIE_ABBIGLIAMENTO = [
  '5-6 anni',
  '7-8 anni',
  '9-10 anni',
  '11-12 anni',
  '13-14 anni',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
]

// Numeri EU, dalla taglia bimbo alla taglia adulto
export const TAGLIE_CALZATURA = Array.from({ length: 47 - 28 + 1 }, (_, i) =>
  String(28 + i),
)

export const TAGLIE_UNICA = ['Unica']

/** Elenco delle taglie ammesse per un dato tipo di categoria. */
export function tagliePer(tipo: TipoTaglia): string[] {
  if (tipo === 'calzatura') return TAGLIE_CALZATURA
  if (tipo === 'unica') return TAGLIE_UNICA
  return TAGLIE_ABBIGLIAMENTO
}
