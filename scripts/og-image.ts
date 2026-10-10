// Gera public/og.png (1200x630, prévia de link no LinkedIn/X) e public/favicon.svg a partir dos mesmos sprites do site.
// Tudo é desenhado numa grade de 200x105 "pixels" e ampliado 6x.
import { mkdirSync, writeFileSync } from 'node:fs'
import { HERO, PALETTE, PORTRAIT, hexToRGB, type Sprite } from '../src/sprites.ts'
import { encodePNG } from './png.ts'

const W = 200
const H = 105
const SCALE = 6
const grid: string[] = new Array(W * H).fill('#06061a')

const put = (x: number, y: number, c: string) => {
  if (x >= 0 && y >= 0 && x < W && y < H) grid[y * W + x] = c
}
const rect = (x: number, y: number, w: number, h: number, c: string) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c)
}

let seed = 7
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646

// Céu em faixas pontilhadas
const SKY = ['#06061a', '#09092a', '#0d0d33', '#12113d', '#181647', '#201b52', '#2a205c', '#372566', '#472a6e', '#5b3074']
const band = Math.ceil((H * 0.85) / SKY.length)
SKY.forEach((c, i) => rect(0, i * band, W, H, c))
for (let i = 1; i < SKY.length; i++) for (let x = 0; x < W; x += 2) put(x + (i % 2), i * band - 1, SKY[i])

for (let i = 0; i < 160; i++) put(Math.floor(rand() * W), Math.floor(rand() * H * 0.7), rand() < 0.3 ? '#ffffff' : '#9a9ad0')

// Lua
const [mx, my, mr] = [56, 17, 7]
for (let y = -mr - 3; y <= mr + 3; y++)
  for (let x = -mr - 3; x <= mr + 3; x++) {
    const d = Math.hypot(x, y)
    if (d <= mr) put(mx + x, my + y, x + y > mr * 0.5 ? '#d9cf9f' : '#f6efcf')
    else if (d <= mr + 3 && (x + y) % 2 === 0) put(mx + x, my + y, '#2c2662')
  }

// Cidade
for (let x = 0; x < W; ) {
  const bw = 6 + Math.floor(rand() * 10)
  const bh = 14 + Math.floor(rand() * 22)
  rect(x, H - 3 - bh, bw, bh, '#1a1842')
  for (let wy = H - bh; wy < H - 5; wy += 3) for (let wx = x + 2; wx < x + bw - 2; wx += 3) if (rand() < 0.2) put(wx, wy, '#7a6a44')
  x += bw + 1
}
for (let x = 0; x < W; ) {
  const bw = 8 + Math.floor(rand() * 10)
  const bh = 6 + Math.floor(rand() * 12)
  rect(x, H - 3 - bh, bw, bh, '#100e2a')
  for (let wy = H - bh - 1; wy < H - 4; wy += 3) for (let wx = x + 2; wx < x + bw - 2; wx += 3) if (rand() < 0.3) put(wx, wy, '#ffd23f')
  x += bw + 1
}
rect(0, H - 3, W, 3, '#0a0920')

function sprite(s: Sprite, ox: number, oy: number, k = 1) {
  s.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const c = PALETTE[ch]
      if (c) rect(ox + x * k, oy + y * k, k, k, c)
    }),
  )
}

// Personagem com sombra no chão
rect(16, H - 5, 40, 2, '#05050f')
sprite(HERO, 12, H - 3 - 64, 2)

// Janela de JRPG atrás do texto
const [wx0, wy0, wx1, wy1] = [74, 10, 197, 90]
rect(wx0 + 1, wy0 + 1, wx1 - wx0 - 1, wy1 - wy0 - 1, '#0b0b1e')
rect(wx0 + 1, wy0 + 1, wx1 - wx0 - 1, wy1 - wy0 - 1, '#f4f4f4')
rect(wx0 + 2, wy0 + 2, wx1 - wx0 - 3, wy1 - wy0 - 3, '#7f89c9')
const fills = ['#4456d8', '#3647c2', '#2b3aab', '#233093', '#1c287c']
const innerH = wy1 - wy0 - 5
fills.forEach((c, i) => {
  const off = Math.floor((i * innerH) / fills.length)
  rect(wx0 + 3, wy0 + 3 + off, wx1 - wx0 - 5, innerH - off, c)
})
rect(wx0 + 1, wy0, wx1 - wx0 - 1, 1, '#0b0b1e')
rect(wx0 + 1, wy1, wx1 - wx0 - 1, 1, '#0b0b1e')
rect(wx0, wy0 + 1, 1, wy1 - wy0 - 1, '#0b0b1e')
rect(wx1, wy0 + 1, 1, wy1 - wy0 - 1, '#0b0b1e')
rect(wx0 + 3, wy1 + 1, wx1 - wx0 - 1, 2, '#05050f')

// Fonte 5x7 só com as letras usadas
const FONT: Record<string, string[]> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
}

function text(str: string, x: number, y: number, k: number, color: string, extrude: string[] = ['#0b0b1e']) {
  const draw = (dx: number, dy: number, c: string) => {
    let cx = x
    for (const ch of str) {
      FONT[ch].forEach((row, gy) => [...row].forEach((p, gx) => p === '#' && rect(cx + gx * k + dx, y + gy * k + dy, k, k, c)))
      cx += 6 * k
    }
  }
  extrude.forEach((c, i) => draw(0, (extrude.length - i) * Math.max(1, k / 2), c))
  draw(0, 0, color)
}

text('LUCAS', 84, 18, 2, '#ffd23f', ['#0b0b1e', '#a52a3f', '#c98a1a'])
text('BOROTO', 84, 40, 2, '#ff5c8a', ['#0b0b1e', '#5e1f45', '#b8305e'])
text('PORTFOLIO RPG', 84, 64, 1, '#f4f4f4')
text('FUNDADOR DO CASAMY', 84, 76, 1, '#59e0ff')

const out = new Uint8Array(W * SCALE * H * SCALE * 4)
for (let y = 0; y < H * SCALE; y++)
  for (let x = 0; x < W * SCALE; x++) {
    const [r, g, b] = hexToRGB(grid[Math.floor(y / SCALE) * W + Math.floor(x / SCALE)])
    out.set([r, g, b, 255], (y * W * SCALE + x) * 4)
  }

mkdirSync('public', { recursive: true })
writeFileSync('public/og.png', encodePNG(W * SCALE, H * SCALE, out))

// Favicon: o rosto do personagem em SVG
const rects: string[] = []
PORTRAIT.forEach((row, y) =>
  [...row].forEach((ch, x) => {
    if (PALETTE[ch]) rects.push(`<rect x="${x}" y="${y + 3}" width="1" height="1" fill="${PALETTE[ch]}"/>`)
  }),
)
writeFileSync(
  'public/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">${rects.join('')}</svg>\n`,
)
console.log('ok: public/og.png e public/favicon.svg')
