import { copyFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

// LinkedIn e X só mostram a imagem de prévia com URL absoluta. No deploy, o workflow passa SITE_URL.
const site = process.env.SITE_URL?.replace(/\/$/, '')

const absoluteShareImage = (): Plugin => ({
  name: 'og-absoluta',
  transformIndexHtml: (html) =>
    site
      ? html
          .replace('content="og.png', `content="${site}/og.png`)
          .replace('<meta property="og:type"', `<meta property="og:url" content="${site}/" />\n    <meta property="og:type"`)
      : html,
})

// Endereços limpos (/menu, /status…) no GitHub Pages: ele serve /menu a partir de menu.html.
// Cada tela ganha uma cópia da página; o site lê o endereço e abre a tela certa.
// Mantenha esta lista igual a ROUTES em src/main.ts.
const ROUTES = ['menu', 'status', 'skills', 'quests', 'journey', 'contact', 'secrets', 'options']

const routePages = (): Plugin => ({
  name: 'paginas-das-rotas',
  apply: 'build',
  writeBundle({ dir }) {
    if (!dir) return
    const index = join(dir, 'index.html')
    for (const r of ROUTES) copyFileSync(index, join(dir, `${r}.html`))
    copyFileSync(index, join(dir, '404.html'))
  },
})

export default defineConfig({
  // O site fica na raiz (LucasLangley.github.io), então os caminhos são absolutos.
  base: '/',
  plugins: [absoluteShareImage(), routePages()],
})
