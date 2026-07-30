/**
 * Indirizzi pubblici di Renova.
 *
 * La LANDING (renovasport.it) e l'APP vera e propria vivono su due domini
 * distinti: la prima è la vetrina B2B per i club, la seconda è il marketplace
 * per i tesserati. Il bundle è lo stesso — cambia solo dove viene pubblicato —
 * quindi la distinzione si fa a runtime, dal dominio.
 *
 * `VITE_APP_URL` (es. `https://app.renovasport.it`) dice alla landing dove
 * vive l'app:
 *   • valorizzata → «Accedi» apre l'app in una NUOVA SCHEDA e, sul dominio
 *     dell'app, la radice non mostra mai la landing (va a login/feed);
 *   • vuota (default, es. in locale) → tutto resta com'era: «Accedi» è una
 *     normale rotta interna e la radice è la landing «2 in 1».
 */
const CONFIG = (import.meta.env.VITE_APP_URL ?? '').trim().replace(/\/+$/, '')

/** URL dell'app dedicata; stringa vuota se non è configurata. */
export const APP_URL = CONFIG

/** true se l'app ha un dominio proprio (e quindi la landing deve linkarlo). */
export const HA_APP_DEDICATA = APP_URL !== ''

function hostnameDi(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

const HOST = typeof window === 'undefined' ? '' : window.location.hostname

/**
 * Stiamo girando sul dominio dell'app? In locale (o su qualsiasi altro host)
 * è false, così lo sviluppo continua a vedere la radice «2 in 1».
 */
export const IS_APP_HOST = HA_APP_DEDICATA && HOST !== '' && HOST === hostnameDi(APP_URL)
