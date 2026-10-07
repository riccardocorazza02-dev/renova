// ──────────────────────────────────────────────────────────────
// Livello 2 — lettura dell'etichetta di composizione, TUTTA nel browser.
//
// La foto non lascia mai il dispositivo: tesseract.js gira in un Web Worker
// e scarica worker, core WASM e lingue (ita + eng) dal NOSTRO dominio
// (`public/tesseract/`, popolata da scripts/copia-tesseract.mjs). La libreria
// è importata dinamicamente solo quando l'utente aggiunge la foto.
//
// Pipeline (tarata su foto reali di etichette, ott 2026):
//   1. ritaglio automatico sull'etichetta (fondo chiaro fitto di testo);
//   2. fino a tre passate OCR con preparazioni diverse, finché la
//      composizione non risulta completa;
//   3. riconoscimento TOLLERANTE dei nomi delle fibre (errori di lettura,
//      ~30 lingue) → codici della tabella `fibre`;
//   4. voto tra le ripetizioni multilingua: vince la composizione letta più
//      spesso; una sola fibra senza percentuale leggibile = 100%.
// L'utente poi conferma o corregge. Il calcolo dell'impatto resta al trigger.
// ──────────────────────────────────────────────────────────────

import type { Composizione, Fibra } from './database.types'

/** Una coppia fibra + percentuale trovata sull'etichetta. */
export interface RigaLetta {
  codice: string
  pct: number
}

/** Fibra letta ma non riconducibile alla tabella (o illeggibile). */
export interface FibraIgnota {
  /** nome letto (es. «seta»), o null se la parola era illeggibile */
  nome: string | null
  pct: number
}

export interface EsitoLettura {
  /** coppie ricondotte ai codici `fibre` (già unite per codice) */
  righe: RigaLetta[]
  /** fibre con percentuale ma fuori tabella o illeggibili */
  ignote: FibraIgnota[]
  /** true se righe + ignote sommano a 100 */
  completa: boolean
  /**
   * true se la percentuale NON è stata letta ma dedotta: sull'etichetta
   * compare una sola fibra, quindi è al 100% (da far verificare all'utente)
   */
  dedotta: boolean
  /** testo grezzo restituito dall'OCR (per il debug) */
  testo: string
  /** fiducia media (0–100) di ogni passata OCR, per il banco di prova */
  fiducie?: number[]
}

// ── 1. Sinonimi → codici della tabella `fibre` ───────────────────
// Confronto sul testo normalizzato (minuscolo, senza accenti né apostrofi).
// Le etichette ripetono la composizione in molte lingue: più sinonimi
// riconosciamo, più ripetizioni partecipano al voto.

const SINONIMI: Record<string, string[]> = {
  PET: [
    'poliestere', 'poliester', 'polyester', 'polyestere', 'polyesther',
    'poliestre', 'polyesteri', 'polieszter', 'polyestr', 'coolmax',
    'elastomultiestere', 'elastomultiester',
  ],
  EA: [
    'elastan', 'elastane', 'elastano', 'elastam', 'elasthan', 'elasthanne',
    'elastaan', 'elastaani', 'elasztan', 'spandex', 'lycra',
  ],
  PA: [
    'poliammide', 'poliamide', 'poliamida', 'polyamide', 'polyamid',
    'poliamid', 'polyamidi', 'nylon', 'nailon', 'nilon', 'tactel',
    'cordura', 'supplex',
  ],
  CO: [
    'cotone', 'cotton', 'coton', 'algodon', 'algodao', 'baumwolle', 'katoen',
    'pamuk', 'bombaz', 'bumbac', 'bavlna', 'pamut', 'puuvilla', 'bomull',
    'bomuld', 'medvilne', 'kokvilna', 'bawelna', 'kokvilla',
  ],
  PU: ['poliuretano', 'polyurethane', 'polyurethan', 'poliuretan', 'polyuretan'],
  AC: ['acrilico', 'acrilica', 'acrylic', 'acrylique', 'acryl', 'akryl', 'akril', 'acrilan'],
  WO: ['lana', 'wool', 'laine', 'wolle', 'schurwolle', 'merino', 'vlna'],
  VI: ['viscosa', 'viscose', 'viskose', 'viskoza', 'viscoza', 'rayon'],
  PP: ['polipropilene', 'polypropylene', 'polipropileno', 'polypropylen'],
}

/** Sigle (ISO 2076 / UE 1007/2011): solo corrispondenza esatta. */
const SIGLE: Record<string, string> = {
  pes: 'PET', pet: 'PET', ea: 'EA', el: 'EA', pa: 'PA', co: 'CO', pu: 'PU',
  ac: 'AC', pan: 'AC', wo: 'WO', wv: 'WO', vi: 'VI', cv: 'VI', pp: 'PP',
}

/** Fibre riconosciute ma ASSENTI dalla tabella `fibre` (nome da mostrare). */
const FUORI_TABELLA: Record<string, string[]> = {
  seta: ['seta', 'silk', 'soie', 'seda', 'seide', 'zijde'],
  lino: ['lino', 'linen', 'leinen', 'linho'],
  modal: ['modal'],
  lyocell: ['lyocell', 'tencel'],
  cashmere: ['cashmere', 'cachemire', 'kaschmir', 'kashmir'],
  acetato: ['acetato', 'acetate', 'azetat'],
  polietilene: ['polietilene', 'polyethylene', 'polyethylen'],
  canapa: ['canapa', 'hemp', 'chanvre', 'hanf'],
  bambù: ['bambu', 'bamboo'],
  'fibra metallica': ['metallica', 'metallico', 'metallic', 'metallisch'],
  pelle: ['pelle', 'leather', 'cuir', 'leder'],
}

/**
 * «Riciclato» nelle lingue delle etichette (anche dentro parole composte:
 * «gerecycleerde», «genbrugs», «kierrätetty», «resirkulert»).
 */
const RICICLATO = /ricicl|recycl|recicl|recycel|genbrug|kierratet|resirkul|rpet/

/** Errori ammessi tra la parola letta e il sinonimo, in base alla lunghezza. */
function tolleranza(lunghezza: number): number {
  if (lunghezza <= 4) return 0
  if (lunghezza <= 8) return 1
  return 2
}

/** Distanza di Levenshtein con uscita anticipata oltre `max`. */
function distanza(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prec = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let minRiga = i
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prec[j] + 1, cur[j - 1] + 1, prec[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      cur.push(v)
      if (v < minRiga) minRiga = v
    }
    if (minRiga > max) return max + 1
    prec = cur
  }
  return prec[b.length]
}

/** Dizionario piatto parola → fibra (codice in tabella o nome fuori tabella). */
const DIZIONARIO: Array<{ parola: string; codice: string | null; nome: string }> = [
  ...Object.entries(SINONIMI).flatMap(([codice, parole]) =>
    parole.map((parola) => ({ parola, codice, nome: codice })),
  ),
  ...Object.entries(FUORI_TABELLA).flatMap(([nome, parole]) =>
    parole.map((parola) => ({ parola, codice: null, nome })),
  ),
]

interface ParolaFibra {
  codice: string | null // null = fibra fuori tabella
  nome: string
  inizio: number
  fine: number
  /** true se riconosciuta da una sigla (meno affidabile di un nome) */
  sigla: boolean
}

/** Riconosce una parola come fibra (esatta, sigla o con pochi errori). */
function riconosci(parola: string): Omit<ParolaFibra, 'inizio' | 'fine'> | null {
  if (SIGLE[parola]) return { codice: SIGLE[parola], nome: SIGLE[parola], sigla: true }
  if (parola.length < 4) return null
  let migliore: { d: number; voce: (typeof DIZIONARIO)[number] } | null = null
  for (const voce of DIZIONARIO) {
    // Le fibre fuori tabella solo esatte: «model» non deve diventare «modal».
    const max = voce.codice ? tolleranza(voce.parola.length) : 0
    const d = parola === voce.parola ? 0 : distanza(parola, voce.parola, max)
    if (d <= max && (!migliore || d < migliore.d)) migliore = { d, voce }
    if (d === 0) break
  }
  return migliore ? { codice: migliore.voce.codice, nome: migliore.voce.nome, sigla: false } : null
}

// ── 2. Normalizzazione del testo OCR ─────────────────────────────

/** Minuscolo, senza accenti/apostrofi, con le confusioni OCR più frequenti corrette. */
export function normalizza(testo: string): string {
  return (
    testo
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[％‰]/g, '%')
      .replace(/[‘’'`´]/g, '') // «pol'ester» → «polester»
      .replace(/[®™©]/g, ' ')
      // Lettere scambiate per cifre davanti al %: «1OO%», «l00 %», «E5%», «£5%»
      .replace(/(^|[^a-z0-9])([0-9oilse£]{1,3})(\s*%)/g, (tutto, pre: string, n: string, p: string) =>
        /\d/.test(n)
          ? pre +
            n
              .replace(/o/g, '0')
              .replace(/[il]/g, '1')
              .replace(/[e£]/g, '6')
              .replace(/s/g, '5') +
            p
          : tutto,
      )
      .replace(/ł/g, 'l') // bawełna
      .replace(/ž/g, 'z')
  )
}

// ── 3. Estrazione delle coppie percentuale + fibra ───────────────

interface Pct {
  valore: number
  inizio: number
  fine: number
}

/** Massima distanza (caratteri) tra la percentuale e la sua fibra. */
const FINESTRA = 40

/** Tutte le parole-fibra del testo normalizzato, in ordine. */
function trovaFibre(t: string): ParolaFibra[] {
  const out: ParolaFibra[] = []
  for (const m of t.matchAll(/[a-z0-9]+/g)) {
    // le cifre dentro una parola sono quasi sempre lettere lette male (bomba2)
    const parola = m[0].replace(/2/g, 'z').replace(/0/g, 'o')
    if (/^\d+$/.test(m[0])) continue
    const r = riconosci(parola)
    if (r) out.push({ ...r, inizio: m.index, fine: m.index + m[0].length })
  }
  return out
}

interface Coppia {
  pct: number
  /** null = percentuale senza nessuna fibra leggibile vicino */
  fibra: ParolaFibra | null
  riciclato: boolean
}

/**
 * Estrae le coppie dal testo normalizzato. Le etichette scrivono la fibra
 * DOPO la percentuale («80% poliestere») o PRIMA («PES 80%»): l'orientamento
 * si decide sul testo intero, contando per quale lato la fibra è più spesso
 * subito adiacente alla percentuale.
 */
function estraiCoppie(t: string, fibre: ParolaFibra[]): Coppia[] {
  const pcts: Pct[] = [...t.matchAll(/(?<!\d)(\d{1,3}(?:[.,]\d{1,2})?)\s*%/g)]
    .map((m) => ({
      // «109%» non esiste: è «10%» col segno % letto come «9%».
      valore: /^\d\d9$/.test(m[1]) ? Number(m[1].slice(0, 2)) : Number(m[1].replace(',', '.')),
      inizio: m.index,
      fine: m.index + m[0].length,
    }))
    .filter((p) => p.valore > 0 && p.valore <= 100)
  if (pcts.length === 0) return []

  const dopo = (i: number) => {
    const fine = Math.min(pcts[i + 1]?.inizio ?? t.length, pcts[i].fine + FINESTRA)
    return fibre.find((f) => f.inizio >= pcts[i].fine && f.fine <= fine)
  }
  const prima = (i: number) => {
    const inizio = Math.max(pcts[i - 1]?.fine ?? 0, pcts[i].inizio - FINESTRA)
    return fibre.filter((f) => f.inizio >= inizio && f.fine <= pcts[i].inizio).at(-1)
  }

  const adiacente = (s: string) => /^[\s:.\-–/|]*$/.test(s)
  let votiDopo = 0
  let votiPrima = 0
  pcts.forEach((p, i) => {
    const fd = dopo(i)
    if (fd && adiacente(t.slice(p.fine, fd.inizio))) votiDopo++
    const fp = prima(i)
    if (fp && adiacente(t.slice(fp.fine, p.inizio))) votiPrima++
  })
  const usaDopo = votiDopo >= votiPrima

  return pcts.map((p, i) => {
    let fibra = (usaDopo ? dopo(i) : prima(i)) ?? null
    // Una SIGLA (EL, CO, PA…) conta solo attaccata alla percentuale: lontana,
    // è quasi sempre un pezzo di parola letto male.
    if (fibra?.sigla) {
      const tra = usaDopo ? t.slice(p.fine, fibra.inizio) : t.slice(fibra.fine, p.inizio)
      if (!/^[\s:.\-–/|]{0,3}$/.test(tra)) fibra = null
    }
    // «Riciclato» conta solo se dichiarato accanto a QUESTA fibra.
    const zona = !fibra
      ? ''
      : usaDopo
        ? t.slice(p.fine, Math.min(fibra.fine + 25, pcts[i + 1]?.inizio ?? t.length))
        : t.slice(Math.max(pcts[i - 1]?.fine ?? 0, fibra.inizio - 25), p.inizio)
    return { pct: p.valore, fibra, riciclato: RICICLATO.test(zona) }
  })
}

const arrotonda = (n: number) => Math.round(n * 100) / 100

/** Chiave di una fibra per il voto: codice, nome fuori tabella o «?». */
function chiaveFibra(c: Coppia): string {
  if (!c.fibra) return '?'
  if (!c.fibra.codice) return `!${c.fibra.nome}`
  return c.fibra.codice === 'PET' && c.riciclato ? 'rPET' : c.fibra.codice
}

/** Composizione candidata: chiave fibra → percentuale. */
type Candidata = Map<string, number>

function firma(c: Candidata): string {
  return [...c.entries()].sort().map(([k, v]) => `${k}:${v}`).join('|')
}

/**
 * Interpreta il testo di un'etichetta.
 *   a) Blocchi consecutivi che sommano a 100 (le ripetizioni in più lingue):
 *      vince la composizione che compare più volte; a parità, quella con meno
 *      fibre illeggibili e poi la prima.
 *   b) Nessun blocco da 100: per ogni fibra la percentuale letta più spesso;
 *      se le mode sommano a 100, quella è la composizione.
 *   c) Nessuna percentuale utile ma UNA sola fibra nominata (per nome, non per
 *      sigla) → 100% di quella fibra, segnalato come dedotto.
 */
export function interpretaEtichetta(testoOcr: string): EsitoLettura {
  // Le passate OCR arrivano separate da SEPARATORE_PASSATE: ognuna si legge
  // per conto suo (un «50%» di una passata non deve sommarsi al «50%» della
  // successiva), poi i blocchi di tutte vanno insieme al voto.
  const segmenti = testoOcr.split(SEPARATORE_PASSATE).map(normalizza)
  const t = segmenti.join('\n')
  const fibre: ParolaFibra[] = []
  const coppie: Array<Coppia & { nuovoSegmento: boolean }> = []
  for (const seg of segmenti) {
    const f = trovaFibre(seg)
    fibre.push(...f)
    estraiCoppie(seg, f).forEach((c, i) => coppie.push({ ...c, nuovoSegmento: i === 0 }))
  }

  // (a) blocchi da 100
  const blocchi: Candidata[] = []
  let corrente: Candidata = new Map()
  let somma = 0
  for (const c of coppie) {
    if (c.nuovoSegmento || somma + c.pct > 100.5) {
      corrente = new Map()
      somma = 0
    }
    const k = chiaveFibra(c)
    corrente.set(k, arrotonda((corrente.get(k) ?? 0) + c.pct))
    somma += c.pct
    if (Math.abs(somma - 100) < 0.5) {
      blocchi.push(corrente)
      corrente = new Map()
      somma = 0
    }
  }
  // Un blocco fatto SOLO di percentuali senza fibra non dice nulla.
  const utili = blocchi.filter((b) => [...b.keys()].some((k) => k !== '?'))

  let scelta: Candidata | null = null
  if (utili.length) {
    const voti = new Map<string, { n: number; ignote: number; primo: number; c: Candidata }>()
    utili.forEach((b, i) => {
      const f = firma(b)
      const v = voti.get(f)
      if (v) v.n++
      else voti.set(f, { n: 1, ignote: [...b.keys()].filter((k) => k === '?').length, primo: i, c: b })
    })
    scelta = [...voti.values()].sort(
      (x, y) => y.n - x.n || x.ignote - y.ignote || x.primo - y.primo,
    )[0].c
  }

  // (b) mode per fibra
  if (!scelta) {
    const perFibra = new Map<string, number[]>()
    for (const c of coppie) {
      const k = chiaveFibra(c)
      if (k === '?') continue
      perFibra.set(k, [...(perFibra.get(k) ?? []), c.pct])
    }
    const mode = new Map<string, number>()
    for (const [k, valori] of perFibra) {
      const conta = new Map<number, number>()
      for (const v of valori) conta.set(v, (conta.get(v) ?? 0) + 1)
      mode.set(k, [...conta.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0])
    }
    if (mode.size) scelta = mode
  }

  // (c) una sola fibra nominata, percentuale illeggibile → 100%
  // Contano solo i NOMI (non le sigle) letti almeno due volte: sulle etichette
  // vere la fibra è ripetuta in più lingue, mentre una parola letta male
  // («LANNE» → laine) è isolata.
  const occorrenze = new Map<string, number>()
  for (const f of fibre) {
    if (f.sigla) continue
    const k = f.codice ?? `!${f.nome}`
    occorrenze.set(k, (occorrenze.get(k) ?? 0) + 1)
  }
  const nominate = new Set(occorrenze.keys())
  const ripetute = [...occorrenze.values()].some((n) => n >= 2)
  let dedotta = false
  const sommaScelta = scelta ? [...scelta.values()].reduce((s, v) => s + v, 0) : 0
  if (Math.abs(sommaScelta - 100) >= 0.5 && nominate.size === 1 && ripetute) {
    const [unica] = nominate
    const k =
      unica === 'PET' && fibre.some((f) => f.codice === 'PET') && RICICLATO.test(t) ? 'rPET' : unica
    scelta = new Map([[k, 100]])
    dedotta = true
  }

  const righe: RigaLetta[] = []
  const ignote: FibraIgnota[] = []
  for (const [k, pct] of scelta ?? []) {
    if (k === '?') ignote.push({ nome: null, pct })
    else if (k.startsWith('!')) ignote.push({ nome: k.slice(1), pct })
    else righe.push({ codice: k, pct })
  }
  righe.sort((a, b) => b.pct - a.pct)

  return {
    righe,
    ignote,
    completa: righe.length + ignote.length > 0 && sommaRighe([...righe, ...ignote]) === 100,
    dedotta,
    testo: testoOcr,
  }
}

/** Separa il testo delle passate OCR (carattere «form feed», mai nel testo letto). */
export const SEPARATORE_PASSATE = '\f'

/** Somma delle percentuali, arrotondata ai centesimi. */
export function sommaRighe(righe: Array<{ pct: number }>): number {
  return arrotonda(righe.reduce((s, r) => s + (Number.isFinite(r.pct) ? r.pct : 0), 0))
}

/** Righe confermate → oggetto composizione da salvare sull'articolo. */
export function righeAComposizione(righe: RigaLetta[]): Composizione {
  const comp: Composizione = {}
  for (const r of righe) comp[r.codice] = arrotonda((comp[r.codice] ?? 0) + r.pct)
  return comp
}

// ── 4. Criterio prudenziale per le fibre ignote ──────────────────

/**
 * Fibra a MINOR impatto della tabella, usata al posto di una fibra fuori
 * tabella o illeggibile (anti-greenwashing: senza prova si assume l'impatto
 * più basso). Punteggio = CO₂ e acqua normalizzate sui rispettivi massimi;
 * sono escluse le fibre senza dato idrico, che sembrerebbero «a zero acqua»
 * solo per mancanza di dato. Con la tabella attuale è il poliestere riciclato.
 */
export function fibraMinimoImpatto(fibre: Record<string, Fibra>): string | null {
  const conDati = Object.values(fibre).filter((f) => f.acqua != null)
  if (conDati.length === 0) return null
  const maxCo2 = Math.max(...conDati.map((f) => Number(f.co2)))
  const maxAcqua = Math.max(...conDati.map((f) => Number(f.acqua)))
  const punteggio = (f: Fibra) => Number(f.co2) / maxCo2 + Number(f.acqua) / maxAcqua
  return conDati.reduce((a, b) => (punteggio(b) < punteggio(a) ? b : a)).codice
}

/** Righe lette + fibre ignote ricondotte alla fibra a minor impatto. */
export function conIgnoteRicondotte(
  esito: Pick<EsitoLettura, 'righe' | 'ignote'>,
  codiceMinimo: string | null,
): RigaLetta[] {
  if (!codiceMinimo || esito.ignote.length === 0) return esito.righe
  const extra = sommaRighe(esito.ignote)
  const righe = esito.righe.map((r) => ({ ...r }))
  const esistente = righe.find((r) => r.codice === codiceMinimo)
  if (esistente) esistente.pct = arrotonda(esistente.pct + extra)
  else righe.push({ codice: codiceMinimo, pct: extra })
  return righe.sort((a, b) => b.pct - a.pct)
}

// ── 5. Preparazione dell'immagine ────────────────────────────────

interface Riquadro {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Come leggere l'etichetta: dove sta (riquadro), di quanto sono inclinate le
 * righe di testo (radianti) e se è scura con la scritta chiara.
 */
interface Vista {
  r: Riquadro
  angolo: number
  scura: boolean
}

/** Centri delle «lettere» trovate in una miniatura (coordinate della miniatura). */
interface Lettere {
  w: number
  h: number
  /** fattore miniatura / originale */
  scala: number
  cx: Float32Array
  cy: Float32Array
}

/**
 * Cerca nel riquadro le forme grandi come LETTERE: piccole macchie di
 * inchiostro (più scure del 20% della media locale) su CARTA chiara e poco
 * colorata. È il criterio che distingue il testo da tutto il resto della
 * foto: bordi e cuciture sono macchie lunghe, la trama del tessuto e le dita
 * stanno su sfondo scuro o colorato. Con `scura` la luminanza è invertita
 * (etichette scure con la scritta chiara).
 */
function trovaLettere(bmp: ImageBitmap, r: Riquadro, lato: number, scura: boolean): Lettere | null {
  // Mai ingrandire: nelle immagini piccole le lettere diventerebbero «troppo
  // grandi per essere lettere».
  const scala = Math.min(1, lato / Math.max(r.w, r.h))
  const w = Math.max(1, Math.round(r.w * scala))
  const h = Math.max(1, Math.round(r.h * scala))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  // Riduzione di qualità: senza, l'aliasing della trama del tessuto crea
  // finti dettagli che sembrano testo.
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bmp, r.x, r.y, r.w, r.h, 0, 0, w, h)
  const d = ctx.getImageData(0, 0, w, h).data
  const n = w * h
  const lum = new Float32Array(n)
  const sat = new Float32Array(n)
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
    lum[j] = scura ? 255 - v : v
    sat[j] = Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2])
  }

  // Medie locali (finestra ~ 3 altezze di lettera) con immagini integrali.
  const W = w + 1
  const iLum = new Float64Array(W * (h + 1))
  const iSat = new Float64Array(W * (h + 1))
  for (let y = 0; y < h; y++) {
    let rl = 0
    let rs = 0
    for (let x = 0; x < w; x++) {
      rl += lum[y * w + x]
      rs += sat[y * w + x]
      iLum[(y + 1) * W + x + 1] = iLum[y * W + x + 1] + rl
      iSat[(y + 1) * W + x + 1] = iSat[y * W + x + 1] + rs
    }
  }
  const R = Math.max(6, Math.round(Math.max(w, h) / 80))
  const inchiostro = new Uint8Array(n)
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - R)
    const y1 = Math.min(h, y + R + 1)
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - R)
      const x1 = Math.min(w, x + R + 1)
      const area = (x1 - x0) * (y1 - y0)
      const somma = (I: Float64Array) =>
        I[y1 * W + x1] - I[y0 * W + x1] - I[y1 * W + x0] + I[y0 * W + x0]
      const media = somma(iLum) / area
      // carta chiara (anche crema o grigia) e poco colorata
      if (media > 100 && somma(iSat) / area < 70 && lum[y * w + x] < media * 0.8) {
        inchiostro[y * w + x] = 1
      }
    }
  }

  // Componenti connesse dell'inchiostro: si tengono solo quelle «da lettera».
  const visto = new Uint8Array(n)
  const cx: number[] = []
  const cy: number[] = []
  const maxLato = Math.max(6, Math.max(w, h) / 15)
  const pila: number[] = []
  for (let i = 0; i < n; i++) {
    if (!inchiostro[i] || visto[i]) continue
    pila.push(i)
    visto[i] = 1
    let area = 0
    let sx = 0
    let sy = 0
    let x0 = w
    let y0 = h
    let x1 = 0
    let y1 = 0
    while (pila.length) {
      const k = pila.pop()!
      const kx = k % w
      const ky = (k / w) | 0
      area++
      sx += kx
      sy += ky
      if (kx < x0) x0 = kx
      if (kx > x1) x1 = kx
      if (ky < y0) y0 = ky
      if (ky > y1) y1 = ky
      if (kx > 0 && inchiostro[k - 1] && !visto[k - 1]) { visto[k - 1] = 1; pila.push(k - 1) }
      if (kx < w - 1 && inchiostro[k + 1] && !visto[k + 1]) { visto[k + 1] = 1; pila.push(k + 1) }
      if (ky > 0 && inchiostro[k - w] && !visto[k - w]) { visto[k - w] = 1; pila.push(k - w) }
      if (ky < h - 1 && inchiostro[k + w] && !visto[k + w]) { visto[k + w] = 1; pila.push(k + w) }
    }
    const bw = x1 - x0 + 1
    const bh = y1 - y0 + 1
    if (area >= 3 && bw <= maxLato && bh <= maxLato && Math.max(bw, bh) / Math.min(bw, bh) <= 6) {
      cx.push(sx / area)
      cy.push(sy / area)
    }
  }
  return { w, h, scala, cx: Float32Array.from(cx), cy: Float32Array.from(cy) }
}

/**
 * Trova l'etichetta nella foto: conta le lettere per blocco su una miniatura
 * di 1000 px, unisce i blocchi vicini (anche i paragrafi separati da spazi)
 * e prende la regione con più lettere, con un margine. Null se non c'è
 * abbastanza testo: si leggerà la foto intera.
 */
function trovaEtichetta(bmp: ImageBitmap, scura = false): Riquadro | null {
  const intera = { x: 0, y: 0, w: bmp.width, h: bmp.height }
  const L = trovaLettere(bmp, intera, 1000, scura)
  if (!L) return null
  const B = 20
  const bw = Math.ceil(L.w / B)
  const bh = Math.ceil(L.h / B)
  const conta = new Uint16Array(bw * bh)
  for (let k = 0; k < L.cx.length; k++) conta[((L.cy[k] / B) | 0) * bw + ((L.cx[k] / B) | 0)]++
  const testo = new Uint8Array(bw * bh)
  for (let i = 0; i < testo.length; i++) testo[i] = conta[i] >= 3 ? 1 : 0

  const dil = new Uint8Array(bw * bh)
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      if (!testo[y * bw + x]) continue
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const yy = y + dy
          const xx = x + dx
          if (yy >= 0 && yy < bh && xx >= 0 && xx < bw) dil[yy * bw + xx] = 1
        }
      }
    }
  }
  const visto = new Uint8Array(bw * bh)
  let migliore: { n: number; x0: number; y0: number; x1: number; y1: number } | null = null
  for (let i = 0; i < bw * bh; i++) {
    if (!dil[i] || visto[i]) continue
    const pila = [i]
    visto[i] = 1
    const r = { n: 0, x0: Infinity, y0: Infinity, x1: -1, y1: -1 }
    while (pila.length) {
      const k = pila.pop()!
      const kx = k % bw
      const ky = (k / bw) | 0
      if (testo[k]) {
        r.n += conta[k]
        r.x0 = Math.min(r.x0, kx)
        r.x1 = Math.max(r.x1, kx)
        r.y0 = Math.min(r.y0, ky)
        r.y1 = Math.max(r.y1, ky)
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = kx + dx
        const ny = ky + dy
        if (nx < 0 || ny < 0 || nx >= bw || ny >= bh) continue
        const q = ny * bw + nx
        if (dil[q] && !visto[q]) {
          visto[q] = 1
          pila.push(q)
        }
      }
    }
    if (r.x1 >= 0 && (!migliore || r.n > migliore.n)) migliore = r
  }
  // Troppo poche lettere («100% PURE WOOL» ne ha già una ventina): meglio
  // leggere la foto intera.
  if (!migliore || migliore.n < 12) return null

  // Margine (1 blocco + 4% del lato): i titoli in corpo più grande, come
  // «100% POLYESTER», hanno meno lettere per blocco e restano ai bordi; un
  // margine più largo però porta dentro tessuto e sfondo, che disturbano.
  const inv = 1 / L.scala
  const mx = B + 0.04 * (migliore.x1 - migliore.x0 + 1) * B
  const my = B + 0.04 * (migliore.y1 - migliore.y0 + 1) * B
  const x = Math.max(0, (migliore.x0 * B - mx) * inv)
  const y = Math.max(0, (migliore.y0 * B - my) * inv)
  const x2 = Math.min(bmp.width, ((migliore.x1 + 1) * B + mx) * inv)
  const y2 = Math.min(bmp.height, ((migliore.y1 + 1) * B + my) * inv)
  return { x, y, w: x2 - x, h: y2 - y }
}

/**
 * Inclinazione delle righe di testo nel riquadro, in [-90°, 90°): le foto
 * arrivano spesso di traverso o storte, e Tesseract legge bene solo il testo
 * orizzontale. Metodo dei VICINI PIÙ PROSSIMI («docstrum»): dentro una riga
 * le lettere sono più vicine tra loro che alla riga sopra o sotto, quindi la
 * direzione più frequente tra ogni lettera e la sua vicina più prossima è
 * quella delle righe. (Le proiezioni non bastano: sulle etichette le tante
 * righe brevi allineate a sinistra formano colonne più nette delle righe.)
 * Resta l'ambiguità «dritta / capovolta», che risolve la passata a 180°.
 */
function stimaAngolo(bmp: ImageBitmap, r: Riquadro, scura: boolean): number {
  const L = trovaLettere(bmp, r, 700, scura)
  if (!L || L.cx.length < 15) return 0
  const cella = Math.max(L.w, L.h) / 25
  const gw = Math.ceil(L.w / cella) + 1
  const griglia = new Map<number, number[]>()
  for (let k = 0; k < L.cx.length; k++) {
    const key = ((L.cy[k] / cella) | 0) * gw + ((L.cx[k] / cella) | 0)
    const lista = griglia.get(key)
    if (lista) lista.push(k)
    else griglia.set(key, [k])
  }
  const istogramma = new Float32Array(180)
  for (let k = 0; k < L.cx.length; k++) {
    const gx = (L.cx[k] / cella) | 0
    const gy = (L.cy[k] / cella) | 0
    let best = -1
    let bestD = Infinity
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (const q of griglia.get((gy + dy) * gw + gx + dx) ?? []) {
          if (q === k) continue
          const d = (L.cx[q] - L.cx[k]) ** 2 + (L.cy[q] - L.cy[k]) ** 2
          if (d < bestD) {
            bestD = d
            best = q
          }
        }
      }
    }
    if (best < 0) continue
    let g = (Math.atan2(L.cy[best] - L.cy[k], L.cx[best] - L.cx[k]) * 180) / Math.PI
    g = ((g % 180) + 180) % 180
    istogramma[Math.min(179, Math.round(g) % 180)]++
  }
  // Picco dell'istogramma circolare, lisciato su ±3°.
  let picco = 0
  let max = -1
  for (let g = 0; g < 180; g++) {
    let v = 0
    for (let t = -3; t <= 3; t++) v += istogramma[(g + t + 180) % 180] * (4 - Math.abs(t))
    if (v > max) {
      max = v
      picco = g
    }
  }
  // Media pesata attorno al picco, per la parte decimale.
  let somma = 0
  let peso = 0
  for (let t = -4; t <= 4; t++) {
    const v = istogramma[(picco + t + 180) % 180]
    somma += (picco + t) * v
    peso += v
  }
  let gradi = peso ? somma / peso : picco
  if (gradi >= 90) gradi -= 180
  return (gradi * Math.PI) / 180
}

/** Area massima (megapixel) dell'immagine passata all'OCR. */
const MEGAPIXEL_OCR = 5
/** Ingrandimento massimo dei ritagli piccoli. */
const INGRANDIMENTO_MAX = 3

type Modo = 'contrasto' | 'soglia'

/**
 * Ritaglia, RADDRIZZA (ruota di −angolo, più `giro` per provare la versione
 * capovolta), scala per AREA (le etichette sono lunghe e strette: un limite
 * sul lato lungo le rimpicciolirebbe), porta in scala di grigi con il testo
 * sempre scuro su chiaro (le viste «scure» sono invertite) e poi:
 *  - «contrasto»: stira la luminanza tra il 2° e il 98° percentile;
 *  - «soglia»: binarizzazione locale di Bradley (media su una finestra),
 *    robusta a pieghe, ombre e stampa grigia sbiadita.
 */
function prepara(bmp: ImageBitmap, vista: Vista, modo: Modo, giro = 0): HTMLCanvasElement {
  const { r, scura } = vista
  const theta = -vista.angolo + giro
  const c = Math.abs(Math.cos(theta))
  const sn = Math.abs(Math.sin(theta))
  const larg1 = r.w * c + r.h * sn
  const alt1 = r.w * sn + r.h * c
  const s = Math.min(Math.sqrt((MEGAPIXEL_OCR * 1e6) / (larg1 * alt1)), INGRANDIMENTO_MAX)
  const w = Math.round(larg1 * s)
  const h = Math.round(alt1 * s)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas non disponibile')
  // Sfondo del colore della carta: bianco, o nero per le etichette scure
  // (che poi vengono invertite).
  ctx.fillStyle = scura ? '#000' : '#fff'
  ctx.fillRect(0, 0, w, h)
  ctx.imageSmoothingQuality = 'high'
  ctx.translate(w / 2, h / 2)
  ctx.rotate(theta)
  ctx.drawImage(bmp, r.x, r.y, r.w, r.h, (-r.w * s) / 2, (-r.h * s) / 2, r.w * s, r.h * s)
  ctx.setTransform(1, 0, 0, 1, 0, 0)

  const img = ctx.getImageData(0, 0, w, h)
  const px = img.data
  const lum = new Uint8ClampedArray(w * h)
  for (let i = 0, j = 0; i < px.length; i += 4, j++) {
    const v = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]
    lum[j] = scura ? 255 - v : v
  }

  const scrivi = (j: number, v: number) => {
    px[j * 4] = px[j * 4 + 1] = px[j * 4 + 2] = v
    px[j * 4 + 3] = 255
  }

  if (modo === 'contrasto') {
    const istogramma = new Uint32Array(256)
    for (const v of lum) istogramma[v]++
    const soglia = (q: number) => {
      let cum = 0
      for (let v = 0; v < 256; v++) {
        cum += istogramma[v]
        if (cum >= lum.length * q) return v
      }
      return 255
    }
    const basso = soglia(0.02)
    const alto = soglia(0.98)
    // Con poco inchiostro su tanta carta i due percentili coincidono: lo
    // «stiramento» annerirebbe tutto, quindi si lascia il contrasto com'è.
    const k = alto - basso >= 40 ? 255 / (alto - basso) : 1
    const zero = alto - basso >= 40 ? basso : 0
    for (let j = 0; j < lum.length; j++) scrivi(j, (lum[j] - zero) * k)
  } else {
    // Bradley–Roth: nero se più scuro del 15% rispetto alla media locale.
    const W = w + 1
    const integrale = new Uint32Array(W * (h + 1))
    for (let y = 0; y < h; y++) {
      let riga = 0
      for (let x = 0; x < w; x++) {
        riga += lum[y * w + x]
        integrale[(y + 1) * W + x + 1] = integrale[y * W + x + 1] + riga
      }
    }
    const R = Math.max(8, Math.round(Math.min(w, h) / 40))
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - R)
      const y1 = Math.min(h, y + R + 1)
      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - R)
        const x1 = Math.min(w, x + R + 1)
        const sommaLocale =
          integrale[y1 * W + x1] - integrale[y0 * W + x1] - integrale[y1 * W + x0] + integrale[y0 * W + x0]
        const media = sommaLocale / ((x1 - x0) * (y1 - y0))
        scrivi(y * w + x, lum[y * w + x] < media * 0.85 ? 0 : 255)
      }
    }
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}

// ── 6. OCR con tesseract.js (caricato on-demand) ─────────────────

/** Cartella da cui il worker scarica i propri file (stesso dominio dell'app). */
function cartellaTesseract(): string {
  return new URL(`${import.meta.env.BASE_URL}tesseract/`, window.location.origin).href
}

/**
 * Tempo massimo di una lettura. Se un file della libreria non arriva (rete
 * assente, file mancante) tesseract.js può restare in attesa senza errore:
 * meglio arrendersi e passare all'inserimento manuale.
 */
const TIMEOUT_LETTURA_MS = 120_000

/** Avanzamento mostrato all'utente: prima si carica il lettore, poi si legge. */
export interface ProgressoLettura {
  fase: 'carico' | 'leggo'
  /** 0–1 sull'intera lettura (tutte le passate) */
  p: number
}

/**
 * Fiducia (0–100) sotto cui una PAROLA non partecipa al voto comune: il
 * testo nel verso sbagliato o sul tessuto produce parole spazzatura a bassa
 * fiducia, che inventerebbero percentuali e «fibre».
 */
const FIDUCIA_MINIMA = 45

/** Massimo di passate OCR per una foto (le foto facili si fermano alla prima). */
const MAX_PASSATE = 8

/** Sotto questa inclinazione (≈3°) «raddrizzare» non cambia nulla. */
const ANGOLO_TRASCURABILE = (3 * Math.PI) / 180

/**
 * Legge l'etichetta e restituisce le righe proposte. `onProgresso` riceve la
 * fase (caricamento del lettore / lettura del testo) e un valore 0–1.
 */
export async function leggiEtichetta(
  file: Blob,
  onProgresso?: (stato: ProgressoLettura) => void,
): Promise<EsitoLettura> {
  let worker: import('tesseract.js').Worker | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  const scaduto = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error("Lettura dell'etichetta scaduta")),
      TIMEOUT_LETTURA_MS,
    )
  })

  const lettura = async (): Promise<EsitoLettura> => {
    const [{ createWorker }, bmp] = await Promise.all([
      import('tesseract.js'),
      createImageBitmap(file, { imageOrientation: 'from-image' }),
    ])
    const intera: Riquadro = { x: 0, y: 0, w: bmp.width, h: bmp.height }
    const rChiara = trovaEtichetta(bmp) ?? intera
    const rScura = trovaEtichetta(bmp, true)
    const chiara: Vista = { r: rChiara, angolo: stimaAngolo(bmp, rChiara, false), scura: false }
    const scura: Vista | null = rScura
      ? { r: rScura, angolo: stimaAngolo(bmp, rScura, true), scura: true }
      : null
    const dritta = Math.abs(chiara.angolo) < ANGOLO_TRASCURABILE

    let passata = 0
    const base = cartellaTesseract()
    worker = await createWorker(['ita', 'eng'], 1, {
      workerPath: `${base}worker.min.js`,
      corePath: base,
      langPath: base,
      // Niente cache IndexedDB delle lingue: i file arrivano già dalla cache HTTP.
      cacheMethod: 'none',
      logger: (m) => {
        if (m.status === 'recognizing text') {
          onProgresso?.({ fase: 'leggo', p: Math.min(1, (passata + m.progress) / MAX_PASSATE) })
        } else {
          onProgresso?.({ fase: 'carico', p: m.progress })
        }
      },
    })
    const w = worker

    const letture: Array<{ testo: string; buono: string; fiducia: number }> = []
    let esito = interpretaEtichetta('')
    /**
     * Una passata OCR; `fatto` se la composizione è ormai trovata. Una
     * passata che DA SOLA dà una composizione completa vince subito;
     * altrimenti votano insieme le passate lette con fiducia sufficiente:
     * quelle nel verso sbagliato danno testo spazzatura, che inquinerebbe
     * il voto con percentuali e «fibre» inventate.
     */
    const leggi = async (v: Vista, giro: number, modo: Modo, psm: '3' | '4' | '11') => {
      await w.setParameters({ tessedit_pageseg_mode: psm as never })
      const { data } = await w.recognize(prepara(bmp, v, modo, giro), {}, { text: true, tsv: true })
      passata++
      // Dal TSV (una riga per parola: livello … fiducia testo) ricaviamo il
      // testo «buono», fatto solo delle parole lette con fiducia sufficiente,
      // e il numero di parole SICURE, che dice se il verso è quello giusto.
      const righe = new Map<string, string[]>()
      let sicure = 0
      for (const riga of (data.tsv ?? '').split('\n')) {
        const c = riga.split('\t')
        if (c[0] !== '5' || c.length < 12) continue // 5 = parola
        const conf = Number(c[10])
        const parola = c[11].trim()
        if (!parola || conf < FIDUCIA_MINIMA) continue
        if (conf >= 70 && /[\p{L}\d]{3}/u.test(parola)) sicure++
        const chiave = `${c[2]}.${c[3]}.${c[4]}` // blocco.paragrafo.riga
        righe.set(chiave, [...(righe.get(chiave) ?? []), parola])
      }
      const buono = [...righe.values()].map((r) => r.join(' ')).join('\n')
      letture.push({ testo: data.text, buono, fiducia: data.confidence })
      const fiducie = letture.map((l) => Math.round(l.fiducia))
      const sola = interpretaEtichetta(buono)
      if (sola.completa && !sola.dedotta) {
        esito = { ...sola, fiducie }
      } else {
        esito = {
          ...interpretaEtichetta(letture.map((l) => l.buono).join(SEPARATORE_PASSATE)),
          testo: letture.map((l) => l.testo).join(SEPARATORE_PASSATE),
          fiducie,
        }
      }
      return { sicure, fatto: esito.completa && !esito.dedotta }
    }

    // Ordine delle passate, dalla più probabile; ci si ferma appena la
    // composizione è completa. Il testo di TUTTE le passate va insieme al
    // voto, ma ogni passata è letta per conto suo (SEPARATORE_PASSATE).
    try {
      // 1. Foto dritta e nitida, impaginazione automatica (Tesseract regge
      //    anche un po' di testo verticale): il caso più comune.
      if ((await leggi({ ...chiara, angolo: 0 }, 0, 'contrasto', '3')).fatto) return esito

      // 2. Raddrizzata nei due versi possibili (l'angolo stimato non dice se
      //    il testo è dritto o capovolto): vince il verso con più parole
      //    lette con sicurezza (capovolto, il testo non ne dà quasi mai).
      let verso = 0
      if (!dritta) {
        const a = await leggi(chiara, 0, 'contrasto', '3')
        if (a.fatto) return esito
        const b = await leggi(chiara, Math.PI, 'contrasto', '3')
        if (b.fatto) return esito
        verso = b.sicure > a.sicure ? Math.PI : 0
      } else {
        // dritta ma forse capovolta
        const b = await leggi(chiara, Math.PI, 'contrasto', '3')
        if (b.fatto) return esito
      }

      // 3. Nel verso migliore: colonna singola (l'impaginazione naturale di
      //    un'etichetta) e soglia locale (stampa grigia, pieghe, ombre).
      if ((await leggi(chiara, verso, 'contrasto', '4')).fatto) return esito
      if ((await leggi(chiara, verso, 'soglia', '3')).fatto) return esito
      // Fibra letta senza percentuale: altre passate non la aggiungerebbero.
      if (esito.dedotta) return esito

      // 4. Etichetta scura con la scritta chiara, nei due versi.
      if (scura) {
        if ((await leggi(scura, 0, 'contrasto', '4')).fatto) return esito
        if ((await leggi(scura, Math.PI, 'contrasto', '4')).fatto) return esito
      }

      // 5. Ritaglio sbagliato: tutta la foto, testo sparso.
      await leggi({ r: intera, angolo: 0, scura: false }, 0, 'soglia', '11')
    } finally {
      bmp.close()
    }
    return esito
  }

  try {
    return await Promise.race([lettura(), scaduto])
  } finally {
    clearTimeout(timer)
    // Se createWorker è ancora in corso il worker non è assegnato: verrà
    // comunque raccolto alla chiusura della pagina.
    const w = worker as import('tesseract.js').Worker | null
    if (w) await w.terminate().catch(() => {})
  }
}

/** Solo per il banco di prova (strumenti/prova-etichette): diagnosi dei passaggi interni. */
export const interniPerProve = { trovaEtichetta, stimaAngolo, prepara }
