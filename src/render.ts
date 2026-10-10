// Desenha sprites no DOM: canvas animado para o personagem, <img> em cache para os ícones.
import {
  CATS,
  breathe,
  HERO,
  HERO_BLINK,
  HERO_HAPPY,
  ICONS,
  PALETTE,
  PORTRAIT,
  PORTRAIT_BLINK,
  PORTRAIT_HAPPY,
  type CatName,
  type IconName,
  type Sprite,
} from './sprites.ts'

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function drawSprite(ctx: CanvasRenderingContext2D, sprite: Sprite, scale: number, ox = 0, oy = 0) {
  for (let y = 0; y < sprite.length; y++) {
    const row = sprite[y]
    for (let x = 0; x < row.length; x++) {
      const color = PALETTE[row[x]]
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale)
    }
  }
}

const iconCache = new Map<IconName, string>()

function iconSrc(name: IconName): string {
  let src = iconCache.get(name)
  if (!src) {
    const sprite = ICONS[name]
    const c = document.createElement('canvas')
    c.width = sprite[0].length
    c.height = sprite.length
    drawSprite(c.getContext('2d')!, sprite, 1)
    src = c.toDataURL()
    iconCache.set(name, src)
  }
  return src
}

/** <img> de um ícone em pixel art; `scale` multiplica o tamanho original. */
export function icon(name: IconName, scale = 3, cls = ''): string {
  const s = ICONS[name]
  return `<img class="px ${cls}" src="${iconSrc(name)}" width="${s[0].length * scale}" height="${s.length * scale}" alt="">`
}

type Mood = 'normal' | 'happy'

/** Centraliza um sprite numa grade maior (para caber no quadro do retrato). */
export function padSprite(sprite: Sprite, w: number, h: number): Sprite {
  const top = Math.floor((h - sprite.length) / 2)
  const left = Math.floor((w - sprite[0].length) / 2)
  const blank = '.'.repeat(w)
  return Array.from({ length: h }, (_, y) => {
    const row = sprite[y - top]
    return row ? '.'.repeat(left) + row + '.'.repeat(w - left - row.length) : blank
  })
}

/** Sprite como data URL, para usar em <img> (retratos nos avisos). */
export function spriteSrc(sprite: Sprite, scale = 1): string {
  const c = document.createElement('canvas')
  c.width = sprite[0].length * scale
  c.height = sprite.length * scale
  drawSprite(c.getContext('2d')!, sprite, scale)
  return c.toDataURL()
}

/** Personagem animado (respiro, piscada, cochilo) num canvas. Devolve controles e uma função para parar. */
export function animateHero(canvas: HTMLCanvasElement, scale: number, kind: 'full' | 'portrait' = 'full') {
  const base = kind === 'full' ? { normal: HERO, blink: HERO_BLINK, happy: HERO_HAPPY } : { normal: PORTRAIT, blink: PORTRAIT_BLINK, happy: PORTRAIT_HAPPY }
  const w = base.normal[0].length
  const h = base.normal.length
  canvas.width = w * scale
  canvas.height = h * scale
  canvas.classList.add('px')
  const ctx = canvas.getContext('2d')!

  let mood: Mood = 'normal'
  let moodUntil = 0
  let blinkUntil = 0
  let nextBlink = performance.now() + 1500 + Math.random() * 2000
  let sleeping = false
  let other: Sprite | null = null
  let otherUntil = 0
  let last = ''

  const tick = () => {
    const now = performance.now()
    if (now > moodUntil) mood = 'normal'
    if (now > nextBlink) {
      blinkUntil = now + 140
      nextBlink = now + 2500 + Math.random() * 2500
    }
    const swapped = other && now < otherUntil
    const face = mood === 'happy' ? 'happy' : sleeping || now < blinkUntil ? 'blink' : 'normal'
    const period = sleeping ? 1300 : 520
    const breath = kind === 'full' && !reducedMotion() && Math.floor(now / period) % 2 === 1
    const key = swapped ? 'other' : face + breath
    if (key === last) return
    last = key
    let sprite = swapped ? other! : base[face]
    if (breath && !swapped) sprite = breathe(sprite)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawSprite(ctx, sprite, scale)
  }

  tick()
  const id = window.setInterval(tick, 60)
  return {
    stop: () => window.clearInterval(id),
    happy: (ms = 1200) => {
      mood = 'happy'
      moodUntil = performance.now() + ms
    },
    sleep: (on: boolean) => {
      sleeping = on
    },
    /** Mostra outro retrato (a Nia, um gato) por um tempo; null volta na hora para o Lucas. */
    show: (sprite: Sprite | null, ms = 0) => {
      other = sprite
      otherUntil = sprite ? performance.now() + ms : 0
      last = ''
    },
  }
}

/** Gato animado: pisca, mexe a cauda de vez em quando e dorme junto com o Lucas. */
export function animateCat(canvas: HTMLCanvasElement, cat: CatName, scale: number) {
  const frames = CATS[cat]
  canvas.width = frames.normal[0].length * scale
  canvas.height = frames.normal.length * scale
  canvas.classList.add('px')
  const ctx = canvas.getContext('2d')!
  let sleeping = false
  let blinkUntil = 0
  let tailUntil = 0
  let nextBlink = performance.now() + 800 + Math.random() * 3000
  let nextTail = performance.now() + 1500 + Math.random() * 2500
  let last = ''

  const tick = () => {
    const now = performance.now()
    if (now > nextBlink) {
      blinkUntil = now + 160
      nextBlink = now + 2200 + Math.random() * 3500
    }
    if (now > nextTail && !reducedMotion()) {
      tailUntil = now + 450
      nextTail = now + 1800 + Math.random() * 3000
    }
    const eyes = sleeping || now < blinkUntil
    const tail = !sleeping && now < tailUntil
    const key = `${eyes}${tail}`
    if (key === last) return
    last = key
    const sprite = tail ? (eyes ? frames.tailBlink : frames.tail) : eyes ? frames.blink : frames.normal
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawSprite(ctx, sprite, scale)
  }

  tick()
  const id = window.setInterval(tick, 60)
  return {
    stop: () => window.clearInterval(id),
    sleep: (on: boolean) => {
      sleeping = on
    },
  }
}
