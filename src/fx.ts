// Transição de tela em blocos (cobre, troca, descobre) e avisos de conquista.
import { reducedMotion } from './render.ts'

const CELL = 28
const COVER_MS = 240
const UNCOVER_MS = 260

const wipeCanvas = document.getElementById('wipe') as HTMLCanvasElement
const wctx = wipeCanvas.getContext('2d')!

function animate(ms: number, step: (p: number) => void): Promise<void> {
  return new Promise((resolve) => {
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms)
      step(p)
      if (p < 1) requestAnimationFrame(tick)
      else resolve()
    }
    requestAnimationFrame(tick)
  })
}

/** Cobre a tela com blocos na diagonal, chama `swap` e descobre. */
export async function wipe(swap: () => void) {
  if (reducedMotion()) {
    swap()
    return
  }
  const cols = Math.ceil(window.innerWidth / CELL)
  const rows = Math.ceil(window.innerHeight / CELL)
  wipeCanvas.width = cols
  wipeCanvas.height = rows
  wipeCanvas.style.width = `${cols * CELL}px`
  wipeCanvas.style.height = `${rows * CELL}px`
  wipeCanvas.hidden = false

  const order: number[] = []
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) order.push((x + y) / (cols + rows - 2 || 1) * 0.9 + Math.random() * 0.1)

  const paint = (p: number, covering: boolean) => {
    wctx.clearRect(0, 0, cols, rows)
    for (let i = 0; i < order.length; i++) {
      const o = order[i]
      const filled = covering ? o <= p : o > p
      if (!filled) continue
      const edge = covering ? p - o < 0.06 : o - p < 0.06
      wctx.fillStyle = edge ? (i % 3 ? '#ffd23f' : '#ff5c8a') : '#0b0b1e'
      wctx.fillRect(i % cols, Math.floor(i / cols), 1, 1)
    }
  }

  await animate(COVER_MS, (p) => paint(p, true))
  swap()
  await animate(UNCOVER_MS, (p) => paint(p, false))
  wipeCanvas.hidden = true
}

const toasts = document.getElementById('toasts')!

export function toast(html: string, kind: 'star' | 'info' | 'speech' = 'info', ms = 2600) {
  const el = document.createElement('div')
  el.className = `win toast toast--${kind}`
  el.setAttribute('role', 'status')
  el.innerHTML = html
  toasts.append(el)
  window.setTimeout(() => el.classList.add('toast--out'), ms)
  window.setTimeout(() => el.remove(), ms + 400)
}
