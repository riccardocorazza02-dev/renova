// Test dell'INTERPRETE (testo letto → composizione), senza OCR né browser.
// Casi: testi reali letti dalle foto del banco di prova + casi sintetici.
//   npm run prova:interprete
// Compila src/lib/etichetta.ts con esbuild in un file temporaneo e lo importa.
import { buildSync } from 'esbuild'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { pathToFileURL } from 'node:url'

const dir = mkdtempSync(join(tmpdir(), 'renova-etichetta-'))
const out = join(dir, 'etichetta.mjs')
buildSync({
  entryPoints: ['src/lib/etichetta.ts'],
  outfile: out,
  format: 'esm',
  bundle: true,
  external: ['tesseract.js'],
  define: { 'import.meta.env.BASE_URL': '"/"' },
  logLevel: 'error',
})
const { interpretaEtichetta: f, fibraMinimoImpatto, conIgnoteRicondotte, SEPARATORE_PASSATE } = await import(pathToFileURL(out).href)
rmSync(dir, { recursive: true, force: true })

const r3417 = `TERI: E5%Po deter 35%
HI NCLUYE LA CEZORACION.,
SHELL £5%povester 23% Cet
STERNO. ESRF ese 35M (Ln
EXTERITR: EL poster 35% Antic
AUSSENMATERIAL: 65% Pym SE Bzivrveole
CATERITYR: 5% Pelyestar 35% Colon
FAAC bb: E57. R0AKSCTRE 385% XNCICY
‘/AMJSKI MATERIAL: 65% poliester
35% pamuk
2GORNJA PLAST: 85%PCLIESTER 35% BOMBAZ
£/TFRINF RE5LE ester`
const r3417b = r3417 + `\n2GORNJA PLAST: 65%POL'ESTER 35% BOMBAZ\nCsTÉRIZIJA: E5% Pelyestar 35% Colon`
const r3416 = `fie Cottan Group. terre Richelle 16
1410 Waterloo, se gIUM
uu Clrrrog J ALGINOH LEO TON / YALMWOLLE | COTONE
£2001 | { AL60DAD J AKG. | PAMUK | BA VINA / POUVILL`
const r3416b = `CUTTOR / ALGODON / COTON / gAymMwOLLE /\no 0%\neH { ALGOBAD / AMOK | PAMUK | BAVLNA / POUALL`
const r3415 = `EXTERIOR:\n100% ALGODON\nSHELL\n\n100% COTTON\nESTERNO:\n100% COTONE\nEXTERIOR\n100% ALGODAO\nAUSSENMATERIAL:\n100% BAUMWOLLE\nEXTERIEUR:\n100% COTON\nHAPYXHOCTL\n100% XJ10TOK\nOba 100%\nVANJSKI MATERIAL\n100% PAMUK\nZGORNJA PLAST.\n100% BOMBAZ\nWH: 100% 18`
const r3418 = `WAAR\nTG. S\n100 % COTONE\n\nCOTTON-COTON\nMADE IN ITAL)\nSi consiglia di tratta`
const casi = [
 ['3415 reale', r3415, {CO:100}],
 ['3416 reale', r3416, {CO:100}],
 ['3416 reale b', r3416b, {CO:100}],
 ['3417 reale', r3417, {PET:65,CO:35}],
 ['3417 reale+bin11', r3417b, {PET:65,CO:35}],
 ['3418 reale', r3418, {CO:100}],
 ['80/20 multilingua', '80% POLIESTERE / POLYESTER / POLYESTER\n20% ELASTAN / ELASTANE / ELASTHANNE', {PET:80,EA:20}],
 ['100 cotone', '100% COTONE COTTON COTON ALGODÓN BAUMWOLLE', {CO:100}],
 ['sigle', 'PES 92% EA 8%', {PET:92,EA:8}],
 ['riciclato', '88% recycled polyester 12% spandex\n88% poliestere riciclato 12% elastan', {rPET:88,EA:12}],
 ['misto ricicl', '60% poliestere riciclato 40% poliestere', {rPET:60,PET:40}],
 ['shell/lining', 'Shell: 100% Polyamide\nLining: 100% Polyester', {PA:100}],
 ['nylon lycra', '86% Nylon 14% Lycra®', {PA:86,EA:14}],
 ['1OO', '1OO% POLYESTER', {PET:100}],
 ['seta', '70% seta 30% cotone', {CO:30}],
 ['IT EN FR ES', 'IT 95% poliestere 5% elastan EN 95% polyester 5% elastane FR 95% polyester 5% élasthanne ES 95% poliéster 5% elastano', {PET:95,EA:5}],
 ['niente', 'Made in Vietnam  RN 12345  wash 30°', {}],
 ['50/50', '50% Cotone 50% Poliestere', {CO:50,PET:50}],
 ['prima', 'Polyester 65%\nCotton 35%', {PET:65,CO:35}],
 ['parola illeggibile', '70% poliestere 30% xqzrt', {PET:70}],
 ['solo nome', 'COTONE COTTON COTON', {CO:100}],
]
let ok=0
for (const [n,t,att] of casi){const e=f(t);const got=Object.fromEntries(e.righe.map(r=>[r.codice,r.pct]));const pass=JSON.stringify(Object.entries(got).sort())===JSON.stringify(Object.entries(att).sort());ok+=pass;console.log(pass?'OK ':'KO ',n.padEnd(18),JSON.stringify(got),'ignote=',JSON.stringify(e.ignote),'completa=',e.completa,'dedotta=',e.dedotta)}
console.log(ok+'/'+casi.length)
const fibre={PET:{codice:'PET',co2:3.12,acqua:62},rPET:{codice:'rPET',co2:1.12,acqua:19},CO:{codice:'CO',co2:4.32,acqua:4800},EA:{codice:'EA',co2:19,acqua:null},PA:{codice:'PA',co2:9.04,acqua:424},PU:{codice:'PU',co2:4.83,acqua:null},AC:{codice:'AC',co2:5.4,acqua:200},WO:{codice:'WO',co2:38.2,acqua:500},VI:{codice:'VI',co2:3.8,acqua:400},PP:{codice:'PP',co2:2,acqua:17}}
const min=fibraMinimoImpatto(fibre); console.log('minimo impatto:',min, JSON.stringify(conIgnoteRicondotte(f('70% seta 30% cotone'),min)))

// Passate separate: il «50%» di una passata non si somma a quello dell'altra.
const separate = f(`S0% LANA WOOL\nKASHMIR-CACHEMIRE${SEPARATORE_PASSATE}50% LANA WOOL\n20% KASHMIR-CACHEMIRE\n20% VISCOSA-VISCOSE\n109% POLIAMMIDE-NYLON`)
const okSep = JSON.stringify(separate.righe) === JSON.stringify([{ codice: 'WO', pct: 50 }, { codice: 'VI', pct: 20 }, { codice: 'PA', pct: 10 }])
console.log(okSep ? 'OK ' : 'KO ', 'passate separate + «109%»', JSON.stringify(separate.righe), JSON.stringify(separate.ignote))
if (ok !== casi.length || !okSep) process.exit(1)
