/**
 * Logo Renova — marchio (due frecce semicircolari che si rincorrono, dal file
 * brand identity Figma) + wordmark "renova" in Bricolage Grotesque 800.
 * Geometria del marchio ripresa 1:1 dall'SVG ufficiale (`renova-logo.svg`):
 * due archi r=12 centrati in (20,20) con punta a freccia, senza disco di sfondo.
 * Scala con la `font-size` ereditata; il marchio usa `currentColor`.
 */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span
      aria-label="Renova"
      className={`inline-flex select-none items-center gap-[0.22em] font-display text-ink ${className}`}
    >
      <RenovaMark className="h-[1.25em] w-[1.25em] shrink-0 text-eco" />
      <span className="font-extrabold leading-none tracking-[-0.035em]">renova</span>
    </span>
  )
}

/** Marchio circolare: due frecce semicircolari (ciclo del riuso). */
export function RenovaMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      role="img"
      aria-hidden="true"
    >
      {/* freccia superiore (oraria) — banda spessa + punta a triangolo tangente */}
      <path
        d="M 7.784 15.554 A 13 13 0 0 1 32.216 15.554"
        stroke="currentColor"
        strokeWidth="4.8"
        strokeLinecap="butt"
      />
      <polygon points="34.268,21.192 34.471,14.733 29.961,16.375" fill="currentColor" />
      {/* freccia inferiore (in rincorsa) */}
      <path
        d="M 32.216 24.446 A 13 13 0 0 1 7.784 24.446"
        stroke="currentColor"
        strokeWidth="4.8"
        strokeLinecap="butt"
      />
      <polygon points="5.732,18.808 5.529,25.267 10.039,23.626" fill="currentColor" />
    </svg>
  )
}
