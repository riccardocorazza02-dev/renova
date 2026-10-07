// Banco di prova della lettura etichette (solo sviluppo, non entra nella build).
// Legge ogni foto di public/__etichette/ con la STESSA pipeline dell'app
// (leggiEtichetta + regola prudenziale delle fibre ignote) e confronta il
// risultato con atteso.json. `?solo=nome1,nome2` limita il test.
import atteso from './atteso.json'
import { leggiEtichetta, conIgnoteRicondotte, fibraMinimoImpatto } from '../../src/lib/etichetta'
import type { Fibra } from '../../src/lib/database.types'

// Tabella `fibre` (0015): serve solo per la fibra a minor impatto.
const FIBRE: Record<string, Fibra> = Object.fromEntries(
  ([
    ['PET', 3.12, 62], ['rPET', 1.12, 19], ['CO', 4.32, 4800], ['EA', 19, null], ['PA', 9.04, 424],
    ['PU', 4.83, null], ['AC', 5.4, 200], ['WO', 38.2, 500], ['VI', 3.8, 400], ['PP', 2, 17],
  ] as const).map(([codice, co2, acqua]) => [codice, { codice, nome: codice, co2, acqua }]),
)

const firma = (c: Record<string, number>) =>
  Object.entries(c).sort().map(([k, v]) => `${k}:${v}`).join(' ')

interface Risultato { nome: string; atteso: string; letto: string; ok: boolean | null; s: number; testo: string; fiducie: number[] }
const risultati: Risultato[] = []
;(window as unknown as { risultati: Risultato[] }).risultati = risultati

const solo = new URLSearchParams(location.search).get('solo')?.split(',')
const voci = Object.entries(atteso as Record<string, Record<string, number> | null | string>)
  .filter(([k]) => !k.startsWith('_') && (!solo || solo.includes(k)))
const tbody = document.getElementById('righe')!
const stato = document.getElementById('stato')!
const minimo = fibraMinimoImpatto(FIBRE)

for (const [i, [nome, att]] of voci.entries()) {
  stato.textContent = `Leggo ${i + 1}/${voci.length}: ${nome}…`
  const blob = await (await fetch(`/__etichette/${nome}.jpg`)).blob()
  const t0 = performance.now()
  let letto = '—'
  let testo = ''
  let fiducie: number[] = []
  try {
    const e = await leggiEtichetta(blob)
    testo = e.testo
    fiducie = e.fiducie ?? []
    const righe = conIgnoteRicondotte(e, minimo)
    letto = e.completa ? firma(Object.fromEntries(righe.map((r) => [r.codice, r.pct]))) : `incompleta: ${firma(Object.fromEntries(righe.map((r) => [r.codice, r.pct])))}`
    if (e.dedotta) letto += ' (dedotta)'
  } catch (err) {
    letto = `errore: ${err instanceof Error ? err.message : err}`
  }
  const s = Math.round((performance.now() - t0) / 100) / 10
  const a = att && typeof att === 'object' ? firma(att) : '?'
  const ok = a === '?' ? null : letto.replace(' (dedotta)', '') === a
  risultati.push({ nome, atteso: a, letto, ok, s, testo, fiducie })
  const tr = document.createElement('tr')
  tr.innerHTML = `<td>${nome}</td><td>${a}</td><td>${letto}</td><td class="${ok ? 'ok' : 'ko'}">${ok === null ? '?' : ok ? 'OK' : 'KO'}</td><td>${s}</td><td>${fiducie.join(' · ')}</td>`
  tbody.appendChild(tr)
}
const valutate = risultati.filter((r) => r.ok !== null)
const giuste = valutate.filter((r) => r.ok).length
stato.textContent = `Fatto: ${giuste}/${valutate.length} corrette (${Math.round((100 * giuste) / Math.max(1, valutate.length))}%), tempo medio ${(risultati.reduce((s, r) => s + r.s, 0) / Math.max(1, risultati.length)).toFixed(1)} s.`
;(window as unknown as { fatto: boolean }).fatto = true
