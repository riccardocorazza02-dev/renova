/**
 * Elenco nazionale dei comuni italiani (dati ISTAT, via il dataset MIT
 * `matteocontrini/comuni-json`). Il JSON in `src/data/comuni.json` è in
 * forma compatta per pesare poco (~150 KB) e viene caricato SOLO quando
 * serve (import dinamico → chunk separato dal bundle principale):
 *
 *   { regioni:  string[],                  // 20 nomi
 *     province: [sigla, nome, iRegione][], // 107 voci
 *     comuni:   [nome, iProvincia][] }     // ~7.900 voci, ordinate
 *
 * Scegliendo il comune si derivano provincia (sigla) e regione: sono i tre
 * campi salvati su `utenti` per le future aree di scambio limitrofe.
 */

export interface Comune {
  nome: string
  /** sigla provincia, es. "BO" */
  provincia: string
  regione: string
}

interface DatiComuni {
  regioni: string[]
  province: [string, string, number][]
  comuni: [string, number][]
}

let cache: Comune[] | null = null

export async function caricaComuni(): Promise<Comune[]> {
  if (cache) return cache
  const dati = (await import('../data/comuni.json')).default as DatiComuni
  cache = dati.comuni.map(([nome, iProv]) => {
    const [sigla, , iReg] = dati.province[iProv]
    return { nome, provincia: sigla, regione: dati.regioni[iReg] }
  })
  return cache
}

/**
 * Ricerca per il campo di selezione: prima i comuni che INIZIANO con la
 * query, poi quelli che la contengono; accenti ignorati (Forlì = forli).
 */
export function cercaComuni(comuni: Comune[], query: string, max = 8): Comune[] {
  const q = normalizza(query.trim())
  if (q.length < 2) return []
  const iniziano: Comune[] = []
  const contengono: Comune[] = []
  for (const c of comuni) {
    const n = normalizza(c.nome)
    if (n.startsWith(q)) {
      iniziano.push(c)
      if (iniziano.length >= max) break
    } else if (contengono.length < max && n.includes(q)) {
      contengono.push(c)
    }
  }
  return [...iniziano, ...contengono].slice(0, max)
}

function normalizza(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
