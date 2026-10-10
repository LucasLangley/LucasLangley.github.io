// Cenário de fundo: céu noturno, lua, nuvens, cidade e fogos, num canvas de baixa resolução ampliado sem suavizar.
import { drawSprite, reducedMotion } from './render.ts'
import { RABBIT } from './sprites.ts'

const SKY = ['#06061a', '#09092a', '#0d0d33', '#12113d', '#181647', '#201b52', '#2a205c', '#372566', '#472a6e', '#5b3074']
const FIREWORK = ['#ffd23f', '#ff5c8a', '#59e0ff', '#6bd66b', '#b57cff', '#ffffff']
const MARGIN = 10 // folga lateral para o parallax

type Star = { x: number; y: number; phase: number; speed: number; big: boolean }
type Win = { x: number; y: number; on: boolean }
type Cloud = { x: number; y: number; w: number; speed: number }
type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string }
type Petal = { x: number; y: number; vx: number; vy: number; phase: number }

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function layer(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return { canvas: c, ctx: c.getContext('2d')! }
}

export class Scene {
  private ctx: CanvasRenderingContext2D
  private w = 0
  private h = 0
  private sky = layer(1, 1)
  private far = layer(1, 1)
  private near = layer(1, 1)
  private stars: Star[] = []
  private windows: Win[] = []
  private beacons: { x: number; y: number }[] = []
  private clouds: Cloud[] = []
  private particles: Particle[] = []
  private petals: Petal[] = []
  private sakura = true
  private pending: number[] = []
  private shooting: { x: number; y: number; life: number } | null = null
  private nextShooting = 4
  private mx = 0.5
  private time = 0
  private moon = { x: 0, y: 0, r: 6 }
  private rabbitUntil = 0
  private last = 0
  private seed = Math.floor(Math.random() * 1e9)
  private running = false

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!
    this.resize()
    let resizeTimer: number | undefined
    window.addEventListener('resize', () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => this.resize(), 120)
    })
    window.addEventListener('pointermove', (e) => (this.mx = e.clientX / window.innerWidth))
    document.addEventListener('visibilitychange', () => (document.hidden ? this.stop() : this.start()))
    this.start()
  }

  private start() {
    if (this.running || reducedMotion()) return
    this.running = true
    this.last = performance.now()
    requestAnimationFrame(this.frame)
  }

  private stop() {
    this.running = false
  }

  resize() {
    const px = window.innerWidth < 760 ? 3 : 4
    // A janela pode ter tamanho zero ao carregar escondida (aba em segundo plano, painel fechado).
    this.w = Math.max(16, Math.ceil(window.innerWidth / px))
    this.h = Math.max(16, Math.ceil(window.innerHeight / px))
    this.canvas.width = this.w
    this.canvas.height = this.h
    this.build()
    this.setSakura(this.sakura, true)
    this.draw()
  }

  /** Liga ou desliga as pétalas de sakura (recria só se mudou ou se `force`). */
  setSakura(on: boolean, force = false) {
    if (!force && on === this.sakura && (this.petals.length > 0) === on) return
    this.sakura = on
    this.petals = []
    if (on) for (let i = 0; i < Math.round(this.w / 18); i++) this.petals.push(this.newPetal(Math.random() * this.h))
    if (reducedMotion()) this.draw()
  }

  private newPetal(y = -3): Petal {
    return {
      x: Math.random() * (this.w + 60),
      y,
      vx: -(5 + Math.random() * 8),
      vy: 7 + Math.random() * 7,
      phase: Math.random() * Math.PI * 2,
    }
  }

  private build() {
    const { w, h } = this
    const rand = rng(this.seed)
    const ground = h - 3

    // Céu em faixas com pontilhado entre elas, como nos 8 bits.
    this.sky = layer(w, h)
    const s = this.sky.ctx
    const skyH = Math.floor(h * 0.78)
    const band = Math.ceil(skyH / SKY.length)
    s.fillStyle = SKY[SKY.length - 1]
    s.fillRect(0, 0, w, h)
    SKY.forEach((color, i) => {
      s.fillStyle = color
      s.fillRect(0, i * band, w, band)
    })
    for (let i = 1; i < SKY.length; i++) {
      const y0 = i * band
      s.fillStyle = SKY[i]
      for (let x = 0; x < w; x++) {
        if (x % 2 === 0) s.fillRect(x, y0 - 2, 1, 1)
        if ((x + 1) % 2 === 0) s.fillRect(x, y0 - 1, 1, 1)
      }
      s.fillStyle = SKY[i - 1]
      for (let x = 0; x < w; x += 2) s.fillRect(x + 1, y0, 1, 1)
    }
    this.moon = { x: Math.round(w * 0.14), y: Math.round(h * 0.18), r: Math.max(6, Math.round(Math.min(w, h) * 0.06)) }
    this.drawMoon(s, this.moon.x, this.moon.y, this.moon.r)

    this.stars = []
    const count = Math.round((w * h) / 110)
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.floor(rand() * w),
        y: Math.floor(rand() * h * 0.7),
        phase: rand() * Math.PI * 2,
        speed: 0.6 + rand() * 2.2,
        big: rand() < 0.08,
      })
    }

    this.clouds = []
    for (let i = 0; i < 5; i++) {
      this.clouds.push({ x: rand() * w, y: Math.floor(h * (0.08 + rand() * 0.4)), w: 18 + Math.floor(rand() * 34), speed: 1 + rand() * 2.5 })
    }

    // Cidade ao fundo (prédios altos, janelas apagadas) e na frente (prédios e casinhas).
    this.windows = []
    this.beacons = []
    this.far = layer(w + MARGIN * 2, h)
    const f = this.far.ctx
    for (let x = -4; x < w + MARGIN * 2; ) {
      const bw = 6 + Math.floor(rand() * 12)
      const bh = Math.floor(h * (0.12 + rand() * 0.2))
      f.fillStyle = '#1a1842'
      f.fillRect(x, ground - bh, bw, bh)
      f.fillStyle = '#7a6a44'
      for (let wy = ground - bh + 3; wy < ground - 3; wy += 3) {
        for (let wx = x + 2; wx < x + bw - 2; wx += 3) if (rand() < 0.16) f.fillRect(wx, wy, 1, 1)
      }
      if (rand() < 0.25) {
        f.fillStyle = '#1a1842'
        f.fillRect(x + Math.floor(bw / 2), ground - bh - 4, 1, 4)
        this.beacons.push({ x: x + Math.floor(bw / 2), y: ground - bh - 5 })
      }
      x += bw + Math.floor(rand() * 3)
    }

    this.near = layer(w + MARGIN * 2, h)
    const n = this.near.ctx
    for (let x = -4; x < w + MARGIN * 2; ) {
      const house = rand() < 0.4
      const bw = house ? 9 + Math.floor(rand() * 4) * 2 : 8 + Math.floor(rand() * 12)
      const bh = house ? Math.floor(h * (0.04 + rand() * 0.03)) + 4 : Math.floor(h * (0.07 + rand() * 0.12))
      n.fillStyle = '#100e2a'
      n.fillRect(x, ground - bh, bw, bh)
      if (house) {
        const half = Math.ceil(bw / 2)
        for (let r = 0; r <= half; r++) n.fillRect(x - 1 + r, ground - bh - r, bw + 2 - r * 2, 1)
        const lit = rand() < 0.7
        n.fillStyle = lit ? '#ffd23f' : '#2a2650'
        n.fillRect(x + 2, ground - bh + 2, 2, 2)
        this.windows.push({ x: x + 2, y: ground - bh + 2, on: lit })
        n.fillStyle = '#2a2650'
        n.fillRect(x + bw - 4, ground - 4, 2, 4)
      } else {
        for (let wy = ground - bh + 2; wy < ground - 2; wy += 3) {
          for (let wx = x + 2; wx < x + bw - 2; wx += 3) {
            const lit = rand() < 0.28
            n.fillStyle = lit ? (rand() < 0.75 ? '#ffd23f' : '#ff9f43') : '#1d1a40'
            n.fillRect(wx, wy, 1, 1)
            if (rand() < 0.3) this.windows.push({ x: wx, y: wy, on: lit })
          }
        }
      }
      x += bw + 1 + Math.floor(rand() * 3)
    }
    n.fillStyle = '#0a0920'
    n.fillRect(0, ground, w + MARGIN * 2, h - ground)
  }

  private drawMoon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
    for (let y = -r - 5; y <= r + 5; y++) {
      for (let x = -r - 5; x <= r + 5; x++) {
        const d = Math.hypot(x, y)
        if (d <= r) {
          ctx.fillStyle = x + y > r * 0.5 ? '#d9cf9f' : '#f6efcf'
          ctx.fillRect(cx + x, cy + y, 1, 1)
        } else if (d <= r + 3 && (x + y) % 2 === 0) {
          ctx.fillStyle = '#2c2662'
          ctx.fillRect(cx + x, cy + y, 1, 1)
        } else if (d <= r + 5 && x % 2 === 0 && y % 2 === 0) {
          ctx.fillStyle = '#221d52'
          ctx.fillRect(cx + x, cy + y, 1, 1)
        }
      }
    }
    ctx.fillStyle = '#e4d9aa'
    const craters: [number, number, number][] = [
      [-0.35, -0.2, 0.22],
      [0.2, 0.3, 0.16],
      [-0.1, 0.45, 0.1],
    ]
    for (const [ox, oy, cr] of craters) {
      const rr = Math.max(1, Math.round(r * cr))
      for (let y = -rr; y <= rr; y++)
        for (let x = -rr; x <= rr; x++) if (x * x + y * y <= rr * rr) ctx.fillRect(Math.round(cx + ox * r + x), Math.round(cy + oy * r + y), 1, 1)
    }
  }

  /** Fogos de artifício por alguns segundos (conquistas). */
  /** O ponto da tela (em px do navegador) está sobre a lua? */
  hitMoon(clientX: number, clientY: number): boolean {
    const k = window.innerWidth / this.w
    return Math.hypot(clientX / k - this.moon.x, clientY / k - this.moon.y) <= this.moon.r + 3
  }

  /** Easter egg: a lua cresce e mostra o coelho socando mochi por alguns segundos. */
  rabbit(seconds = 7) {
    this.rabbitUntil = this.time + seconds
    if (reducedMotion()) {
      this.rabbitUntil = Infinity
      this.draw()
      window.setTimeout(() => {
        this.rabbitUntil = 0
        this.draw()
      }, seconds * 1000)
    }
  }

  /** Easter egg: acende todas as janelas da cidade. */
  lightUp() {
    for (const win of this.windows) {
      win.on = true
      this.near.ctx.fillStyle = '#ffd23f'
      this.near.ctx.fillRect(win.x, win.y, 1, 1)
    }
    if (reducedMotion()) this.draw()
  }

  celebrate(bursts = 7) {
    if (reducedMotion()) return
    for (let i = 0; i < bursts; i++) this.pending.push(this.time + i * 0.35 + Math.random() * 0.2)
  }

  private burst() {
    const x = this.w * (0.15 + Math.random() * 0.7)
    const y = this.h * (0.12 + Math.random() * 0.3)
    const color = FIREWORK[Math.floor(Math.random() * FIREWORK.length)]
    const n = 26
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const v = 18 + Math.random() * 22
      const max = 1 + Math.random() * 0.8
      this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: max, max, color })
    }
  }

  private frame = (now: number) => {
    if (!this.running) return
    const dt = Math.min(0.1, (now - this.last) / 1000)
    if (dt >= 1 / 30) {
      this.last = now
      this.update(dt)
      this.draw()
    }
    requestAnimationFrame(this.frame)
  }

  private update(dt: number) {
    this.time += dt
    for (const c of this.clouds) {
      c.x -= c.speed * dt
      if (c.x + c.w < -4) c.x = this.w + 4
    }
    if (Math.random() < dt * 3 && this.windows.length) {
      const win = this.windows[Math.floor(Math.random() * this.windows.length)]
      win.on = !win.on
      this.near.ctx.fillStyle = win.on ? '#ffd23f' : '#1d1a40'
      this.near.ctx.fillRect(win.x, win.y, 1, 1)
    }
    this.nextShooting -= dt
    if (this.nextShooting <= 0 && !this.shooting) {
      this.shooting = { x: this.w * (0.3 + Math.random() * 0.7), y: Math.random() * this.h * 0.25, life: 0.9 }
      this.nextShooting = 7 + Math.random() * 9
    }
    if (this.shooting) {
      this.shooting.x -= 70 * dt
      this.shooting.y += 35 * dt
      this.shooting.life -= dt
      if (this.shooting.life <= 0) this.shooting = null
    }
    while (this.pending.length && this.pending[0] <= this.time) {
      this.pending.shift()
      this.burst()
    }
    for (const p of this.particles) {
      p.vy += 24 * dt
      p.vx *= 0.985
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life -= dt
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const p of this.petals) {
      p.x += (p.vx + Math.sin(this.time * 1.6 + p.phase) * 7) * dt
      p.y += p.vy * dt
      if (p.y > this.h + 2 || p.x < -4) Object.assign(p, this.newPetal())
    }
  }

  private draw() {
    const { ctx, time } = this
    const motion = !reducedMotion()
    ctx.drawImage(this.sky.canvas, 0, 0)

    if (time < this.rabbitUntil) {
      const { x, y, r } = this.moon
      const big = Math.round(r * 1.8)
      this.drawMoon(ctx, x, y + Math.round(r * 0.6), big)
      const frame = RABBIT[Math.floor(time * 3) % 2]
      const k = big >= 16 ? 2 : 1
      drawSprite(ctx, frame, k, x - Math.round((frame[0].length * k) / 2), y + Math.round(r * 0.6) - Math.round((frame.length * k) / 2))
    }

    for (const s of this.stars) {
      const b = motion ? 0.5 + 0.5 * Math.sin(time * s.speed + s.phase) : 0.7
      ctx.fillStyle = b < 0.33 ? '#3b3b72' : b < 0.7 ? '#9a9ad0' : '#ffffff'
      ctx.fillRect(s.x, s.y, 1, 1)
      if (s.big && b > 0.85) {
        ctx.fillStyle = '#9a9ad0'
        ctx.fillRect(s.x - 1, s.y, 3, 1)
        ctx.fillRect(s.x, s.y - 1, 1, 3)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(s.x, s.y, 1, 1)
      }
    }

    if (this.shooting) {
      const { x, y } = this.shooting
      const trail = ['#ffffff', '#c8c8f0', '#8a8ac0', '#5a5a94', '#3b3b72']
      trail.forEach((c, i) => {
        ctx.fillStyle = c
        ctx.fillRect(Math.round(x + i * 2), Math.round(y - i), 2, 1)
      })
    }

    for (const c of this.clouds) {
      const x = Math.round(c.x)
      ctx.fillStyle = '#231e55'
      ctx.fillRect(x, c.y, c.w, 3)
      ctx.fillRect(x + 4, c.y - 2, c.w - 10, 2)
      ctx.fillRect(x + 8, c.y - 3, Math.max(4, c.w - 22), 1)
      ctx.fillStyle = '#2f2868'
      ctx.fillRect(x + 4, c.y - 2, c.w - 10, 1)
    }

    for (const p of this.particles) {
      const fade = p.life / p.max
      ctx.fillStyle = fade > 0.35 ? p.color : '#5a5a94'
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1)
    }

    const shift = motion ? this.mx - 0.5 : 0
    ctx.drawImage(this.far.canvas, Math.round(-MARGIN - shift * 4), 0)
    const blink = Math.floor(time * 1.5) % 2 === 0
    if (blink) {
      ctx.fillStyle = '#ff5c5c'
      for (const b of this.beacons) ctx.fillRect(Math.round(b.x - MARGIN - shift * 4), b.y, 1, 1)
    }
    ctx.drawImage(this.near.canvas, Math.round(-MARGIN - shift * 9), 0)

    // Pétalas na frente da cidade, em dois quadros (de lado e de frente) para parecer que giram.
    for (const p of this.petals) {
      const x = Math.round(p.x)
      const y = Math.round(p.y)
      const turning = Math.sin(time * 4 + p.phase) > 0
      ctx.fillStyle = '#ffc4d2'
      ctx.fillRect(x, y, turning ? 1 : 2, 1)
      ctx.fillStyle = '#ff8fab'
      ctx.fillRect(turning ? x : x + 1, y + 1, 1, 1)
    }
  }
}
