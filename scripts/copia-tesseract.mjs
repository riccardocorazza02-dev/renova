// Copia in public/tesseract/ i file che tesseract.js scarica a runtime
// (worker, core WASM, lingue ita+eng), così la lettura dell'etichetta li
// prende dal NOSTRO dominio e non da una CDN esterna. Gira prima di `dev` e
// `build` (vedi package.json); la cartella di destinazione non è versionata.
import { copyFileSync, mkdirSync } from 'node:fs'
import { resolve, basename } from 'node:path'

const nm = resolve(process.cwd(), 'node_modules')
const dest = resolve(process.cwd(), 'public', 'tesseract')
mkdirSync(dest, { recursive: true })

const file = [
  'tesseract.js/dist/worker.min.js',
  // Solo le varianti LSTM (motore di default): il .wasm è incorporato nel .js.
  'tesseract.js-core/tesseract-core-lstm.wasm.js',
  'tesseract.js-core/tesseract-core-simd-lstm.wasm.js',
  'tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js',
  '@tesseract.js-data/ita/4.0.0_best_int/ita.traineddata.gz',
  '@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz',
]

for (const f of file) copyFileSync(resolve(nm, f), resolve(dest, basename(f)))
console.log(`[renova] tesseract: ${file.length} file copiati in public/tesseract/`)
