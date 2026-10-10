// Gera uma folha de prévia dos sprites em .sprite-preview/sheet.png e avisa linhas com largura errada.
import { mkdirSync, writeFileSync } from 'node:fs'
import { HERO, HERO_BLINK, HERO_HAPPY, ICONS, NIA, PORTRAIT, RABBIT, spriteToRGBA, type Sprite } from '../src/sprites.ts'
import { encodePNG } from './png.ts'

const SCALE = 8
const GAP = 4
const BG = [58, 70, 160]

const sprites: [string, Sprite][] = [
  ['hero', HERO],
  ['blink', HERO_BLINK],
  ['happy', HERO_HAPPY],
  ['portrait', PORTRAIT],
  ['nia', NIA],
  ['rabbit-a', RABBIT[0]],
  ['rabbit-b', RABBIT[1]],
  ...Object.entries(ICONS),
]

for (const [name, s] of sprites) {
  const w = s[0].length
  s.forEach((row, i) => {
    if (row.length !== w) console.warn(`${name}: linha ${i} tem ${row.length} colunas (esperado ${w})`)
  })
}

const cells = sprites.map(([, s]) => spriteToRGBA(s, SCALE))
const width = cells.reduce((a, c) => a + c.width + GAP * SCALE, GAP * SCALE)
const height = Math.max(...cells.map((c) => c.height)) + GAP * SCALE * 2
const out = new Uint8Array(width * height * 4)
for (let i = 0; i < width * height; i++) out.set([...BG, 255], i * 4)

let ox = GAP * SCALE
for (const c of cells) {
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const si = (y * c.width + x) * 4
      if (c.data[si + 3] === 0) continue
      out.set(c.data.subarray(si, si + 4), ((y + GAP * SCALE) * width + ox + x) * 4)
    }
  }
  ox += c.width + GAP * SCALE
}

mkdirSync('.sprite-preview', { recursive: true })
writeFileSync('.sprite-preview/sheet.png', encodePNG(width, height, out))
console.log(`ok: .sprite-preview/sheet.png (${width}x${height})`)
