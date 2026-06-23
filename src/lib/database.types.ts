// ──────────────────────────────────────────────────────────────
// Tipi del database Renova.
// Scritti a mano per rispecchiare le migrazioni in /supabase.
// Puoi rigenerarli dal progetto reale con:
//   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
// ──────────────────────────────────────────────────────────────

export type StatoArticolo = 'Disponibile' | 'Prenotato' | 'Scambiato'

export type Sport = 'Calcio' | 'Pallavolo' | 'Basket'

export const SPORT_LABELS: Record<Sport, string> = {
  Calcio: 'Calcio',
  Pallavolo: 'Pallavolo',
  Basket: 'Basket',
}

export type TipoCategoria = 'individuale' | 'accessorio'

export type TipoTaglia = 'calzatura' | 'abbigliamento' | 'unica'

/** Macro-gruppo di una categoria, usato per raggruppare il picker in upload. */
export type MacroCategoria =
  | 'Maglie e t-shirt'
  | 'Polo'
  | 'Felpe'
  | 'Pantaloni e pantaloncini'
  | 'Giacche e tute'
  | 'Calze'
  | 'Calzature'
  | 'Protezioni'
  | 'Accessori'

/** Ordine di visualizzazione delle macro-categorie nel menù di upload. */
export const MACRO_CATEGORIE_ORDINE: MacroCategoria[] = [
  'Maglie e t-shirt',
  'Polo',
  'Felpe',
  'Pantaloni e pantaloncini',
  'Giacche e tute',
  'Calze',
  'Calzature',
  'Protezioni',
  'Accessori',
]

export type Condizione = 'Scarso' | 'Discreto' | 'Buono' | 'Ottimo' | 'Perfetto'

export const CONDIZIONI: Condizione[] = [
  'Scarso',
  'Discreto',
  'Buono',
  'Ottimo',
  'Perfetto',
]

// ── Stima d'impatto a livelli (fibre + blend) ────────────────────

/** Provenienza della stima d'impatto di un articolo. */
export type FonteImpatto = 'categoria' | 'utente' | 'etichetta'

/** Composizione: codice fibra (PET, CO, EA…) → percentuale. */
export type Composizione = Record<string, number>

/** Fattori d'impatto cradle-to-gate di una fibra (tabella `fibre`). */
export interface Fibra {
  codice: string
  nome: string
  co2: number
  /** L/kg; null = dato non disponibile → escluso dal calcolo dell'acqua */
  acqua: number | null
}

/** Un'opzione del tap "di che materiale è?" (Livello 0+1). */
export interface MaterialeOpzione {
  /** identificatore stabile, es. 'tecnico' | 'cotone' | 'non_so' */
  chiave: string
  /** etichetta mostrata nel bottone */
  label: string
  /** micro-istruzione per il riconoscimento al tatto/vista */
  hint: string
  /** blend associato; null per "Non lo so" (→ profilo di default L0) */
  blend: Composizione | null
}

export interface Societa {
  id: number
  nome: string
  provincia: string
  codice_invito: string | null
  created_at: string
}

export interface CodiceAccesso {
  id: number
  codice: string
  id_societa: number
  sport: Sport
  created_at: string
}

/**
 * Catalogo di riferimento GLOBALE: una riga per (sport, categoria), con
 * l'impatto ambientale "risparmiato" dal riuso (min/tipico/max) e il valore
 * economico indicativo. Un articolo eredita il valore TIPICO della sua
 * categoria.
 */
export interface CategoriaItem {
  id: number
  sport: Sport
  nome: string
  tipo: TipoCategoria
  /** macro-gruppo per il raggruppamento del picker in upload */
  macro_categoria: MacroCategoria
  /** default proposto per il toggle "ha il logo della società?" in upload */
  default_ha_logo: boolean
  /** se true, l'utente deve indicare il prezzo (scarpe, guanti, parastinchi) */
  richiede_prezzo: boolean
  /** governa il menù a tendina delle taglie in fase di upload */
  tipo_taglia: TipoTaglia
  /** valore economico unico di riferimento; NULL per gli item a prezzo manuale */
  valore: number | null
  co2_min: number
  co2_tipico: number
  co2_max: number
  acqua_min: number
  acqua_tipico: number
  acqua_max: number
  valore_min: number
  valore_max: number
  fonte: string
  /** peso tipico del capo (kg); null = categoria non tessile a valore fisso */
  peso_kg: number | null
  /** blend L0 (profilo sintetico prudenziale); null = categoria a valore fisso */
  profilo_default: Composizione | null
  /** opzioni del tap L0+1; [] = nessun tap (materiale assunto/non tessile) */
  materiali: MaterialeOpzione[]
}

export interface Utente {
  id: string
  nome_completo: string
  id_societa: number
  sport: Sport
  created_at: string
}

export interface Articolo {
  id: number
  titolo: string
  taglia: string | null
  foto_url: string | null
  /** tutte le foto dell'articolo (max 3); foto_url è la copertina */
  foto_urls: string[]
  id_categoria: number
  prezzo: number
  /** true → visibile solo alla società (capo con logo); false → tutti, stesso sport */
  ha_logo_societa: boolean
  condizione: Condizione | null
  id_societa: number
  sport: Sport
  stato: StatoArticolo
  /** composizione stimata {codice fibra: %}; null se non indicata (stima da categoria) */
  composizione: Composizione | null
  /** provenienza della stima d'impatto */
  fonte_impatto: FonteImpatto
  /** impatto del singolo capo, calcolato dal trigger (blend × peso) o fisso */
  co2: number
  acqua: number
  /** foto dell'etichetta di composizione (per la futura lettura L2); null se assente */
  foto_etichetta_url: string | null
  /** istante in cui lo stato è diventato 'Scambiato' (impostato dal trigger) */
  scambiato_at: string | null
  id_utente: string
  created_at: string
}

// ── Forme "arricchite" restituite dalle query con join embedded ──

/**
 * Articolo con la sua categoria (impatto ESG), per le card del feed.
 * NB: nel feed NON si fa join su `utenti`, perché la RLS su `utenti` non
 * espone i membri di altre società e taglierebbe gli articoli pubblici di
 * società diverse dello stesso sport.
 */
export interface ArticoloFeed extends Articolo {
  // L'impatto (co2/acqua) e la sua provenienza (fonte_impatto) sono ora sul
  // singolo articolo: la categoria serve solo per nome e tipo.
  categoria: Pick<CategoriaItem, 'nome' | 'tipo'>
}

// ── Chat tra utenti ──────────────────────────────────────────────

/**
 * Una conversazione per coppia (articolo, utente interessato). I nomi dei
 * partecipanti sono denormalizzati così la chat non deve fare join su
 * `utenti` (la cui RLS nasconderebbe la controparte di un'altra società).
 */
export interface Conversazione {
  id: number
  id_articolo: number
  id_proprietario: string
  id_acquirente: string
  nome_proprietario: string
  nome_acquirente: string
  /** ultima apertura del proprietario (read-tracking) */
  letto_proprietario: string | null
  /** ultima apertura dell'acquirente (read-tracking) */
  letto_acquirente: string | null
  created_at: string
  /** aggiornato a ogni nuovo messaggio: ordina la lista e calcola i non letti */
  updated_at: string
}

export interface Messaggio {
  id: number
  id_conversazione: number
  id_mittente: string
  /** testo del messaggio; null se è un messaggio di sola foto */
  testo: string | null
  /** URL pubblico della foto allegata; null se è un messaggio di solo testo */
  foto_url: string | null
  created_at: string
}

/** Riga della lista chat: conversazione + anteprima dell'articolo. */
export interface ConversazioneConArticolo extends Conversazione {
  articolo: Pick<
    Articolo,
    'id' | 'titolo' | 'foto_url' | 'foto_urls' | 'stato'
  > | null
}

// ── Scambi conclusi e recensioni ─────────────────────────────────

/**
 * Registro IMMUTABILE di uno scambio concluso (una riga per articolo). Tutti i
 * campi sono denormalizzati al momento dello scambio, così lo storico è
 * auto-contenuto e non dipende dalla RLS di `utenti`/`articoli` (che
 * nasconderebbe la controparte di un'altra società nel feed pubblico).
 */
export interface Scambio {
  id: number
  /** null se l'articolo è stato eliminato dopo lo scambio */
  id_articolo: number | null
  id_venditore: string
  id_acquirente: string
  nome_venditore: string
  nome_acquirente: string
  titolo_articolo: string
  foto_url: string | null
  id_societa: number | null
  /** impatto = valore tipico della categoria al momento dello scambio */
  co2: number | string
  acqua: number | string
  /** valore economico risparmiato all'acquirente (prezzo dell'articolo) */
  valore: number | string
  created_at: string
}

/** Valutazione 1–5 stelle (senza testo) tra i due partecipanti a uno scambio. */
export interface Recensione {
  id: number
  id_scambio: number
  id_autore: string
  id_destinatario: string
  valutazione: number
  created_at: string
}

/** Aggregato restituito dalla RPC `impatto_societa()`. */
export interface ImpattoSocieta {
  n_scambi: number
  co2: number | string
  acqua: number | string
  valore: number | string
}
