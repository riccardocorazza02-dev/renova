import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * GitHub Pages non ha un server che riscrive le rotte SPA: un refresh su
 * /profilo darebbe 404. Copiamo index.html in 404.html così Pages ricasca
 * sempre sull'app e React Router gestisce la rotta lato client.
 */
function spaFallback(): Plugin {
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    closeBundle() {
      const dist = resolve(process.cwd(), 'dist')
      const index = resolve(dist, 'index.html')
      if (existsSync(index)) copyFileSync(index, resolve(dist, '404.html'))
    },
  }
}

// https://vite.dev/config/
// `base`: '/' va bene per dominio custom o repo "utente.github.io".
// Per un repo di progetto (utente.github.io/<repo>/) imposta VITE_BASE=/<repo>/
// (lo fa il workflow GitHub Actions) — poi serve anche il basename su BrowserRouter.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss(), spaFallback()],
})
