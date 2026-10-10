// Sons 8-bit gerados com WebAudio: nenhum arquivo de áudio. O contexto só nasce no primeiro gesto do visitante.
import { save } from './store.ts'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noise: AudioBuffer | null = null

function audio(): AudioContext | null {
  if (ctx) return ctx
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = 0.5
  master.connect(ctx.destination)
  noise = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate)
  const d = noise.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return ctx
}

/** Chamar dentro de um gesto (clique/tecla) para destravar o áudio no navegador. */
export function unlockAudio() {
  const c = audio()
  if (c && c.state === 'suspended') void c.resume()
}

const midi = (n: number) => 440 * 2 ** ((n - 69) / 12)

function tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number, slideTo?: number) {
  const c = audio()
  if (!c || !master) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur)
  g.gain.setValueAtTime(vol, start)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(g).connect(master)
  osc.start(start)
  osc.stop(start + dur + 0.02)
}

function hat(start: number, vol: number) {
  const c = audio()
  if (!c || !master || !noise) return
  const src = c.createBufferSource()
  src.buffer = noise
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 7000
  const g = c.createGain()
  g.gain.setValueAtTime(vol, start)
  g.gain.exponentialRampToValueAtTime(0.0001, start + 0.05)
  src.connect(hp).connect(g).connect(master)
  src.start(start)
  src.stop(start + 0.06)
}

function sfx(play: (t: number) => void) {
  if (!save.settings.sfx) return
  const c = audio()
  if (!c || c.state !== 'running') return
  play(c.currentTime)
}

export const sound = {
  move: () => sfx((t) => tone(midi(84), t, 0.04, 'square', 0.05)),
  select: () =>
    sfx((t) => {
      tone(midi(79), t, 0.06, 'square', 0.06)
      tone(midi(86), t + 0.06, 0.09, 'square', 0.06)
    }),
  back: () =>
    sfx((t) => {
      tone(midi(76), t, 0.05, 'square', 0.05)
      tone(midi(69), t + 0.05, 0.08, 'square', 0.05)
    }),
  text: () => sfx((t) => tone(midi(81), t, 0.018, 'triangle', 0.05)),
  toggle: () => sfx((t) => tone(midi(72), t, 0.05, 'square', 0.05, midi(79))),
  star: () =>
    sfx((t) => {
      ;[72, 76, 79, 84, 88].forEach((n, i) => tone(midi(n), t + i * 0.07, 0.12, 'square', 0.05))
    }),
  poke: () => sfx((t) => tone(midi(72), t, 0.09, 'square', 0.05, midi(84))),
  /** Miado: sobe e desce. `pitch` muda o gato (Lili mais aguda). */
  meow: (pitch = 1) =>
    sfx((t) => {
      tone(620 * pitch, t, 0.12, 'triangle', 0.09, 980 * pitch)
      tone(980 * pitch, t + 0.12, 0.2, 'triangle', 0.08, 520 * pitch)
    }),
  mochi: () =>
    sfx((t) => {
      for (let i = 0; i < 4; i++) {
        tone(midi(45), t + i * 0.33, 0.08, 'triangle', 0.12, midi(38))
        hat(t + i * 0.33 + 0.01, 0.03)
      }
      tone(midi(88), t + 1.4, 0.12, 'square', 0.04)
    }),
  sparkle: () =>
    sfx((t) => {
      ;[84, 88, 91, 96, 91, 96].forEach((n, i) => tone(midi(n), t + i * 0.05, 0.09, 'triangle', 0.06))
    }),
  fanfare: () =>
    sfx((t) => {
      const notes = [67, 72, 76, 79, 76, 79, 84]
      const lens = [0.1, 0.1, 0.1, 0.25, 0.1, 0.1, 0.6]
      let at = t
      notes.forEach((n, i) => {
        tone(midi(n + 12), at, lens[i], 'square', 0.05)
        tone(midi(n), at, lens[i], 'triangle', 0.08)
        at += lens[i] + 0.02
      })
    }),
}

// ---- Música: um loop original de 8 compassos (Lá menor, vi–IV–I–V), sequenciado à frente do relógio.

const BPM = 128
const STEP = 60 / BPM / 2 // colcheia
const _ = 0
const LEAD = [
  76, _, 72, 76, 81, _, 79, 76,
  77, _, 72, 77, 81, _, 79, 77,
  76, _, 79, 84, 83, _, 79, 76,
  74, _, 79, 83, 86, _, 83, 79,
  84, 83, 81, 76, _, 81, 84, _,
  81, 79, 77, 72, _, 77, 81, _,
  79, 76, 72, 67, _, 72, 76, 79,
  83, _, 81, _, 79, _, 74, _,
]
const ROOTS = [45, 41, 48, 43, 45, 41, 48, 43] // A F C G

let musicTimer: number | undefined
let nextTime = 0
let step = 0

function schedule() {
  const c = audio()
  if (!c) return
  while (nextTime < c.currentTime + 0.12) {
    const i = step % LEAD.length
    const bar = Math.floor(i / 8)
    const note = LEAD[i]
    if (note) tone(midi(note), nextTime, STEP * 0.9, 'square', 0.022)
    const root = ROOTS[bar]
    tone(midi(i % 2 ? root + 12 : root), nextTime, STEP * 0.8, 'triangle', 0.07)
    if (i % 2) hat(nextTime, 0.025)
    nextTime += STEP
    step++
  }
}

export function setMusic(on: boolean) {
  window.clearInterval(musicTimer)
  musicTimer = undefined
  if (!on) return
  const c = audio()
  if (!c) return
  if (c.state === 'suspended') void c.resume()
  nextTime = c.currentTime + 0.05
  step = 0
  musicTimer = window.setInterval(schedule, 25)
}
