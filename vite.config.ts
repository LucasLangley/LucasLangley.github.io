import { defineConfig, type Plugin } from 'vite'

// LinkedIn e X só mostram a imagem de prévia com URL absoluta. No deploy, o workflow passa SITE_URL.
const site = process.env.SITE_URL?.replace(/\/$/, '')

const absoluteShareImage = (): Plugin => ({
  name: 'og-absoluta',
  transformIndexHtml: (html) =>
    site
      ? html
          .replace('content="og.png"', `content="${site}/og.png"`)
          .replace('<meta property="og:type"', `<meta property="og:url" content="${site}/" />\n    <meta property="og:type"`)
      : html,
})

// Caminho relativo: o mesmo build funciona em usuario.github.io/qualquer-repo/
export default defineConfig({
  base: './',
  plugins: [absoluteShareImage()],
})
