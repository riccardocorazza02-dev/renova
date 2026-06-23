import { Link } from 'react-router-dom'
import type { ArticoloFeed } from '../lib/database.types'
import { EsgBadge } from './EsgBadge'
import { StatoBadge } from './StatoBadge'

/**
 * Card di un articolo nel feed marketplace, stile editoriale "Press 2A":
 * niente riquadro fluttuante — la cella vive nella griglia a regole sottili
 * del Feed. Foto con trama avorio, titolo bold, metadati MAIUSCOLI spaziati e
 * indicatori ESG colorati. Apre il dettaglio al click.
 */
export function ArticleCard({ articolo }: { articolo: ArticoloFeed }) {
  const { categoria } = articolo
  // Solo il primo sostantivo della categoria (es. "Maglia tecnica" → "Maglia").
  const categoriaBreve = categoria.nome.split(' ')[0]
  const meta = [categoriaBreve, articolo.taglia, articolo.condizione]
    .filter(Boolean)
    .join(' · ')
  const haEsg = Number(articolo.co2) > 0 || Number(articolo.acqua) > 0

  return (
    <Link
      to={`/articolo/${articolo.id}`}
      className="group flex flex-col gap-2.5 bg-paper p-3.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-eco"
    >
      {/* Foto */}
      <div className="foto-stripe relative aspect-[4/5] overflow-hidden rounded-lg">
        {articolo.foto_url && (
          <img
            src={articolo.foto_url}
            alt={articolo.titolo}
            loading="lazy"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        )}
        <div className="absolute left-2 top-2">
          <StatoBadge stato={articolo.stato} />
        </div>
      </div>

      {/* Contenuto */}
      <div className="flex flex-col gap-1.5">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-[1.12] tracking-[-0.01em] text-ink">
          {articolo.titolo}
        </h3>

        <span
          title={categoria.nome}
          className="text-[9.5px] font-semibold uppercase leading-tight tracking-[0.06em] text-ink-muted"
        >
          {meta}
        </span>

        {/* Indicatori ESG: verde CO₂ + azzurro Acqua. Stima da sola categoria
            (fonte_impatto = 'categoria') → prudenziale "≥". */}
        {haEsg && (
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <EsgBadge
              variante="co2"
              valore={Number(articolo.co2)}
              compact
              minimo={articolo.fonte_impatto === 'categoria'}
            />
            <EsgBadge
              variante="acqua"
              valore={Number(articolo.acqua)}
              compact
              minimo={articolo.fonte_impatto === 'categoria'}
            />
          </div>
        )}
      </div>
    </Link>
  )
}
