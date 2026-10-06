// ──────────────────────────────────────────────────────────────
// Livello 2 — lettura dell'etichetta di composizione, TUTTA nel browser.
//
// La foto non lascia mai il dispositivo: tesseract.js gira in un Web Worker
// e scarica worker, core WASM e lingue (ita + eng) dal NOSTRO dominio
// (`public/tesseract/`, popolata da scripts/copia-tesseract.mjs). La libreria
// è importata dinamicamente solo quando l'utente aggiunge la foto.
//
// Il testo letto viene ricondotto ai codici della tabella `fibre`
// (PET, rPET, CO, EA, PA, PU, AC, WO, VI, PP): l'utente poi conferma o
// corregge le righe proposte. Il calcolo dell'impatto resta al trigger.
// ──────────────────────────────────────────────────────────────

import type { Composizione } from './database.types'

/** Una coppia fibra + percentuale trovata sull'etichetta. */
export interface RigaLetta {
  codice: string
  pct: number
}

export interface EsitoLettura {
  /** coppie ricondotte ai codici `fibre` (già unite per codice) */
  righe: RigaLetta[]
  /** fibre lette ma assenti dalla tabella `fibre` (es. «seta») */
  sconosciute: string[]
  /** true se le righe sommano a 100 e non ci sono fibre sconosciute */
  completa: boolean
  /** testo grezzo restituito dall'OCR (per il debug) */
  testo: string
}

// ── 1. Sinonimi → codici della tabella `fibre` ───────────────────
// Il testo è normalizzato (minuscolo, senza accenti) prima del confronto. Le
// etichette ripetono la composizione in più lingue (it, en, fr, es, de…) e
// usano le sigle ISO 2076 / UE 1007/2011.

const FIBRE_NOTE: Array<{ codice: string; re: RegExp }> = [
  {
    codice: 'PET',
    re: /\b(?:poliestere|poliester|polyester|polyestere|polyesther|poliestre|pes)\b/,
  },
  {
    codice: 'EA',
    re: /\b(?:elastan[eo]?|elastam|elasthan|spandex|lycra|elastomultiester|ea|el)\b/,
  },
  {
    codice: 'PA',
    re: /\b(?:poliammide|poliamide|poliamida|polyamide?|nylon|nailon|pa)\b/,
  },
  {
    codice: 'CO',
    re: /\b(?:cotone|cotton|coton|algodon|baumwolle|katoen|co)\b/,
  },
  {
    codice: 'PU',
    re: /\b(?:poliuretano|polyurethane?|polyurethan|poliuretan|pu)\b/,
  },
  {
    codice: 'AC',
    re: /\b(?:acrilic[oa]|acrylic|acrylique|acrilico|acryl|pan|ac)\b/,
  },
  {
    codice: 'WO',
    re: /\b(?:lana|wool|laine|wolle|schurwolle|merino|wo|wv)\b/,
  },
  {
    codice: 'VI',
    re: /\b(?:viscosa|viscose|viskose|rayon|vi|cv)\b/,
  },
  {
    codice: 'PP',
    re: /\b(?:polipropilene|polypropylene|polipropileno|polypropylen|pp)\b/,
  },
]

/** Fibre riconosciute ma assenti dalla tabella `fibre` (nome da mostrare). */
const FIBRE_FUORI_TABELLA: Array<{ nome: string; re: RegExp }> = [
  { nome: 'seta', re: /\b(?:seta|silk|soie|seda|seide)\b/ },
  { nome: 'lino', re: /\b(?:lino|linen|leinen)\b/ },
  { nome: 'modal', re: /\b(?:modal|md)\b/ },
  { nome: 'lyocell', re: /\b(?:lyocell|tencel|cly)\b/ },
  { nome: 'cashmere', re: /\b(?:cashmere|cachemire|kaschmir|ws)\b/ },
  { nome: 'acetato', re: /\b(?:acetato|acetate|azetat)\b/ },
  { nome: 'polietilene', re: /\b(?:polietilene|polyethylene|polyethylen|pe)\b/ },
  { nome: 'canapa', re: /\b(?:canapa|hemp|chanvre|hanf)\b/ },
  { nome: 'bambù', re: /\b(?:bambu|bamboo)\b/ },
  { nome: 'fibra metallica', re: /\b(?:metallic[ao]?|metallique|metallisch|mtf)\b/ },
  { nome: 'pelle', re: /\b(?:pelle|leather|cuir|leder)\b/ },
]

/** «Riciclato» nelle lingue più comuni sulle etichette. */
const RICICLATO = /\b(?:ricicl\w*|recycl\w*|recicl\w*|recycel\w*|rpet)\b/

// ── 2. Normalizzazione del testo OCR ─────────────────────────────

/** Minuscolo, senza accenti, con le confusioni OCR più frequenti corrette. */
export function normalizza(testo: string): string {
  return (
    testo
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[％‰]/g, '%')
      // «1OO%», «l00 %» → «100%»: lettere scambiate per cifre accanto al %
      .replace(/\b([0-9oil]{1,3})(\s*%)/g, (_, n: string, p: string) =>
        /\d/.test(n) ? n.replace(/o/g, '0').replace(/[il]/g, '1') + p : n + p,
      )
      // «lycra®», «coolmax™»: via i simboli di marchio
      .replace(/[®™©]/g, ' ')
  )
}

// ── 3. Estrazione delle coppie percentuale + fibra ───────────────

interface Pct {
  valore: number
  inizio: number
  fine: number
}

interface FibraTrovata {
  codice: string | null // null = fibra fuori tabella
  nome: string
  inizio: number
  fine: number
}

/** Tutte le occorrenze di fibre (note e fuori tabella) in un tratto di testo. */
function fibreNelTratto(t: string, offset: number): FibraTrovata[] {
  const out: FibraTrovata[] = []
  const cerca = (re: RegExp, codice: string | null, nome: string) => {
    const g = new RegExp(re.source, 'g')
    for (const m of t.matchAll(g)) {
      out.push({ codice, nome, inizio: offset + m.index, fine: offset + m.index + m[0].length })
    }
  }
  for (const f of FIBRE_NOTE) cerca(f.re, f.codice, f.codice)
  for (const f of FIBRE_FUORI_TABELLA) cerca(f.re, null, f.nome)
  return out.sort((a, b) => a.inizio - b.inizio)
}

/** Massima distanza (caratteri) tra la percentuale e la sua fibra. */
const FINESTRA = 60

/**
 * Estrae le coppie dal testo normalizzato. Le etichette scrivono la fibra
 * DOPO la percentuale («80% poliestere») o PRIMA («PES 80%»): l'orientamento
 * si decide sul testo intero, contando per quale lato la fibra è più spesso
 * subito adiacente alla percentuale.
 */
function estraiCoppie(t: string): Array<{ pct: number; fibra: FibraTrovata; riciclato: boolean }> {
  const pcts: Pct[] = [...t.matchAll(/(?<!\d)(\d{1,3}(?:[.,]\d{1,2})?)\s*%/g)]
    .map((m) => ({
      valore: Number(m[1].replace(',', '.')),
      inizio: m.index,
      fine: m.index + m[0].length,
    }))
    .filter((p) => p.valore > 0 && p.valore <= 100)
  if (pcts.length === 0) return []

  // Tratto «dopo» e «prima» di ogni percentuale, senza scavalcare le vicine.
  const dopo = pcts.map((p, i) => {
    const fine = Math.min(pcts[i + 1]?.inizio ?? t.length, p.fine + FINESTRA)
    return { inizio: p.fine, testo: t.slice(p.fine, fine) }
  })
  const prima = pcts.map((p, i) => {
    const inizio = Math.max(pcts[i - 1]?.fine ?? 0, p.inizio - FINESTRA)
    return { inizio, testo: t.slice(inizio, p.inizio) }
  })

  const adiacente = (s: string) => /^[\s:.\-–/|]*$/.test(s)
  let votiDopo = 0
  let votiPrima = 0
  pcts.forEach((_, i) => {
    const fd = fibreNelTratto(dopo[i].testo, dopo[i].inizio)[0]
    if (fd && adiacente(t.slice(pcts[i].fine, fd.inizio))) votiDopo++
    const fp = fibreNelTratto(prima[i].testo, prima[i].inizio).at(-1)
    if (fp && adiacente(t.slice(fp.fine, pcts[i].inizio))) votiPrima++
  })
  const usaDopo = votiDopo >= votiPrima

  const coppie: Array<{ pct: number; fibra: FibraTrovata; riciclato: boolean }> = []
  pcts.forEach((p, i) => {
    const tratto = usaDopo ? dopo[i] : prima[i]
    const trovate = fibreNelTratto(tratto.testo, tratto.inizio)
    // La fibra più vicina alla percentuale (le traduzioni seguono).
    const fibra = usaDopo ? trovate[0] : trovate.at(-1)
    if (!fibra) return
    // «Riciclato» conta solo se dichiarato accanto a QUESTA fibra: tra la
    // percentuale e la fibra, o subito dopo il nome della fibra.
    const zona = usaDopo
      ? t.slice(p.fine, Math.min(fibra.fine + 25, tratto.inizio + tratto.testo.length))
      : t.slice(Math.max(tratto.inizio, fibra.inizio - 25), p.inizio)
    coppie.push({ pct: p.valore, fibra, riciclato: RICICLATO.test(zona) })
  })
  return coppie
}

/**
 * Interpreta il testo di un'etichetta. Le composizioni ripetute in più lingue
 * (o per parti diverse del capo: «Tessuto principale», «Fodera»…) vengono
 * spezzate in blocchi che sommano a 100: si tiene il PRIMO blocco completo,
 * cioè il corpo principale del capo.
 */
export function interpretaEtichetta(testoOcr: string): EsitoLettura {
  const coppie = estraiCoppie(normalizza(testoOcr))

  // Blocchi consecutivi che arrivano a 100.
  type Blocco = typeof coppie
  const blocchi: Blocco[] = []
  let corrente: Blocco = []
  let somma = 0
  for (const c of coppie) {
    if (somma + c.pct > 100.5) {
      if (corrente.length) blocchi.push(corrente)
      corrente = []
      somma = 0
    }
    corrente.push(c)
    somma += c.pct
    if (Math.abs(somma - 100) < 0.5) {
      blocchi.push(corrente)
      corrente = []
      somma = 0
    }
  }
  if (corrente.length) blocchi.push(corrente)

  const somma100 = (b: Blocco) => Math.abs(b.reduce((s, c) => s + c.pct, 0) - 100) < 0.5
  const scelto =
    blocchi.find((b) => somma100(b) && b.every((c) => c.fibra.codice)) ??
    blocchi.find(somma100) ??
    blocchi[0] ??
    []

  // Unisce le righe con lo stesso codice (es. due voci di poliestere).
  const perCodice = new Map<string, number>()
  const sconosciute: string[] = []
  for (const c of scelto) {
    if (!c.fibra.codice) {
      if (!sconosciute.includes(c.fibra.nome)) sconosciute.push(c.fibra.nome)
      continue
    }
    const codice = c.fibra.codice === 'PET' && c.riciclato ? 'rPET' : c.fibra.codice
    perCodice.set(codice, arrotonda((perCodice.get(codice) ?? 0) + c.pct))
  }
  const righe = [...perCodice.entries()]
    .map(([codice, pct]) => ({ codice, pct }))
    .sort((a, b) => b.pct - a.pct)

  return {
    righe,
    sconosciute,
    completa: righe.length > 0 && sconosciute.length === 0 && sommaRighe(righe) === 100,
    testo: testoOcr,
  }
}

const arrotonda = (n: number) => Math.round(n * 100) / 100

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

// ── 4. Preparazione dell'immagine ────────────────────────────────

/** Lato lungo dell'immagine passata all'OCR (le etichette sono piccole). */
const LATO_OCR = 2000

/**
 * Ridimensiona (anche ingrandendo), porta in scala di grigi e stira il
 * contrasto tra il 2° e il 98° percentile della luminanza: le etichette sono
 * piccole, sbiadite e fotografate con poca luce.
 */
export async function preparaImmagine(file: Blob): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scala = LATO_OCR / Math.max(bmp.width, bmp.height)
  const w = Math.round(bmp.width * scala)
  const h = Math.round(bmp.height * scala)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas non disponibile')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bmp, 0, 0, w, h)
  bmp.close()

  const img = ctx.getImageData(0, 0, w, h)
  const px = img.data
  const lum = new Uint8ClampedArray(w * h)
  const istogramma = new Uint32Array(256)
  for (let i = 0, j = 0; i < px.length; i += 4, j++) {
    const y = Math.round(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2])
    lum[j] = y
    istogramma[y]++
  }

  // Percentili 2% e 98% → nuovi nero e bianco.
  const soglia = (q: number) => {
    const obiettivo = lum.length * q
    let cum = 0
    for (let v = 0; v < 256; v++) {
      cum += istogramma[v]
      if (cum >= obiettivo) return v
    }
    return 255
  }
  const basso = soglia(0.02)
  const alto = Math.max(soglia(0.98), basso + 1)
  const k = 255 / (alto - basso)

  for (let i = 0, j = 0; i < px.length; i += 4, j++) {
    const v = (lum[j] - basso) * k
    px[i] = px[i + 1] = px[i + 2] = v
    px[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}

// ── 5. OCR con tesseract.js (caricato on-demand) ─────────────────

/** Cartella da cui il worker scarica i propri file (stesso dominio dell'app). */
function cartellaTesseract(): string {
  return new URL(`${import.meta.env.BASE_URL}tesseract/`, window.location.origin).href
}

/**
 * Tempo massimo di una lettura. Se un file della libreria non arriva (rete
 * assente, file mancante) tesseract.js può restare in attesa senza errore:
 * meglio arrendersi e passare all'inserimento manuale.
 */
const TIMEOUT_LETTURA_MS = 90_000

/**
 * Legge l'etichetta e restituisce le righe proposte. `onProgresso` riceve un
 * valore 0–1 durante il riconoscimento. Se la prima passata (impaginazione
 * automatica) non trova coppie, ne tenta una seconda come blocco unico di
 * testo, più adatta alle etichette strette.
 */
export async function leggiEtichetta(
  file: Blob,
  onProgresso?: (p: number) => void,
): Promise<EsitoLettura> {
  let worker: import('tesseract.js').Worker | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  const scaduto = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error('Lettura dell\'etichetta scaduta')),
      TIMEOUT_LETTURA_MS,
    )
  })

  const lettura = async (): Promise<EsitoLettura> => {
    const [{ createWorker, PSM }, canvas] = await Promise.all([
      import('tesseract.js'),
      preparaImmagine(file),
    ])
    const base = cartellaTesseract()
    worker = await createWorker(['ita', 'eng'], 1, {
      workerPath: `${base}worker.min.js`,
      corePath: base,
      langPath: base,
      // Niente cache IndexedDB delle lingue: i file arrivano già dalla cache HTTP.
      cacheMethod: 'none',
      logger: (m) => {
        if (m.status === 'recognizing text') onProgresso?.(m.progress)
      },
    })
    let { data } = await worker.recognize(canvas)
    let esito = interpretaEtichetta(data.text)
    if (esito.righe.length === 0 && esito.sconosciute.length === 0) {
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK })
      ;({ data } = await worker.recognize(canvas))
      esito = interpretaEtichetta(data.text)
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
