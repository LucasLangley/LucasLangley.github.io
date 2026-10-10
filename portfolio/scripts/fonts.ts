// Gera src/fonts.css só com os blocos de fonte que o site usa.
// O pacote da DotGothic16 tem mais de 100 blocos de japonês; o portfólio usa poucas palavras.
// Rode de novo (npm run fonts) sempre que entrar texto com caracteres novos.
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const FONTS = ['dotgothic16', 'press-start-2p']
const OUT_DIR = 'src/fonts'

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? (e.name === 'fonts' ? [] : sources(join(dir, e.name))) : /\.(ts|css|html)$/.test(e.name) ? [join(dir, e.name)] : [],
  )
}

const text = [...sources('src'), 'index.html'].map((f) => readFileSync(f, 'utf8')).join('')
const used = new Set<number>()
for (const ch of text) used.add(ch.codePointAt(0)!)
for (let c = 0x20; c < 0x7f; c++) used.add(c)

function covers(range: string): boolean {
  return range.split(',').some((part) => {
    const [a, b] = part.trim().replace(/^U\+/i, '').split('-')
    const lo = parseInt(a, 16)
    const hi = b ? parseInt(b, 16) : lo
    for (const c of used) if (c >= lo && c <= hi) return true
    return false
  })
}

rmSync(OUT_DIR, { recursive: true, force: true })
mkdirSync(OUT_DIR, { recursive: true })

let css = '/* Gerado por scripts/fonts.ts. Não edite à mão. */\n'
let kept = 0
let total = 0
for (const font of FONTS) {
  const pkg = join('node_modules', '@fontsource', font)
  // As fontes são OFL: a licença vai junto com os arquivos.
  copyFileSync(join(pkg, 'LICENSE'), join(OUT_DIR, `${font}-OFL.txt`))
  const blocks = readFileSync(join(pkg, '400.css'), 'utf8').match(/@font-face\s*{[^}]*}/g) ?? []
  for (const block of blocks) {
    total++
    const range = block.match(/unicode-range:\s*([^;]+);/)?.[1]
    if (range && !covers(range)) continue
    const file = block.match(/url\(\.\/files\/([^)]+\.woff2)\)/)?.[1]
    if (!file) continue
    copyFileSync(join(pkg, 'files', file), join(OUT_DIR, file))
    css += block.replace(/src:[^;]+;/, `src: url(./fonts/${file}) format('woff2');`) + '\n'
    kept++
  }
}

writeFileSync('src/fonts.css', css)
console.log(`fonts.css: ${kept} de ${total} blocos`)
