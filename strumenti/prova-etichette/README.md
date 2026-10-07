# Banco di prova · lettura etichette

Misura quante etichette vere la lettura (Livello 2, `src/lib/etichetta.ts`)
riconosce correttamente. Solo sviluppo: non entra nella build.

## Due test

| Comando | Cosa prova | Tempo |
| --- | --- | --- |
| `npm run prova:interprete` | Solo l'**interprete** (testo → composizione) su testi reali e sintetici. Niente OCR. | 1 s |
| `npm run dev` → `http://localhost:5173/strumenti/prova-etichette/` | L'intera **pipeline** (ritaglio, raddrizzamento, OCR, voto) sulle foto vere. | 3–5 min |

## Aggiungere foto

1. Converti le foto in JPEG dentro `public/__etichette/` (cartella esclusa da
   git: le foto restano sul tuo computer). Da HEIC su Mac:
   `sips -s format jpeg -s formatOptions 90 foto.HEIC --out public/__etichette/foto.jpg`
2. Aggiungi in `atteso.json` la composizione VERA, con la regola prudenziale
   già applicata (fibre fuori tabella → `rPET`). `null` = composizione
   sconosciuta: la foto gira ma non conta nel punteggio.
3. Apri la pagina: in fondo compare «N/M corrette». `?solo=nome1,nome2`
   limita il test a qualche foto.

Prima di cambiare la pipeline, lancia il banco e annota il punteggio; dopo,
rilancialo: una modifica che sistema un caso e ne rompe altri non va tenuta.
Una lettura «incompleta» è accettabile (l'utente inserisce a mano), una
composizione SBAGLIATA no.
