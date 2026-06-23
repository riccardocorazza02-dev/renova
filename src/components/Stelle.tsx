import { useState } from 'react'

function StellaSvg({
  riempita,
  size,
  className = '',
}: {
  riempita: boolean
  size: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      <path
        d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.4l-5.81 3.06 1.11-6.47-4.7-4.58 6.5-.95L12 2.5z"
        fill={riempita ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Stelle di sola lettura (es. media valutazioni). `valore` può essere
 * frazionario: l'ultima stella si riempie parzialmente.
 */
export function StelleStatiche({
  valore,
  size = 16,
  className = '',
}: {
  valore: number
  size?: number
  className?: string
}) {
  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      aria-label={`Valutazione ${valore.toFixed(1)} su 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const frazione = Math.max(0, Math.min(1, valore - (i - 1)))
        return (
          <span
            key={i}
            className="relative inline-block"
            style={{ width: size, height: size }}
          >
            <StellaSvg
              riempita={false}
              size={size}
              className="absolute inset-0 text-amber-300/40"
            />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${frazione * 100}%` }}
            >
              <StellaSvg riempita size={size} className="text-amber-400" />
            </span>
          </span>
        )
      })}
    </div>
  )
}

/**
 * Selettore di valutazione 1–5 stelle. Chiama `onVota(n)` al click.
 * `valore` è la valutazione già data (0 = nessuna).
 */
export function StelleInput({
  valore,
  onVota,
  disabled = false,
  size = 30,
}: {
  valore: number
  onVota: (n: number) => void
  disabled?: boolean
  size?: number
}) {
  const [hover, setHover] = useState(0)
  const attivo = hover || valore

  return (
    <div
      className="inline-flex items-center gap-1 text-amber-400"
      role="radiogroup"
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={valore === i}
          aria-label={`${i} ${i === 1 ? 'stella' : 'stelle'}`}
          disabled={disabled}
          onMouseEnter={() => !disabled && setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => !disabled && onVota(i)}
          className="transition enabled:hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ lineHeight: 0 }}
        >
          <StellaSvg riempita={i <= attivo} size={size} />
        </button>
      ))}
    </div>
  )
}
