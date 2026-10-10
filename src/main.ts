import './fonts.css'
import './style.css'
import { EGGS, INTRO, JOURNEY, LINKS, MENU, PROFILE, QUESTS, SECRETS, SECTIONS, SKILLS, type Quest, type SecretId, type Section } from './data.ts'
import { pixelAccents } from './accents.ts'
import { setMusic, sound, unlockAudio } from './audio.ts'
import { Typewriter } from './dialog.ts'
import { toast, wipe } from './fx.ts'
import { animateHero, icon, padSprite, spriteSrc } from './render.ts'
import { Scene } from './scene.ts'
import { NIA, PALETTE, PORTRAIT, RABBIT, type IconName, type Sprite } from './sprites.ts'
import { discover, persist, resetSave, save, visit, type Settings, type TextSpeed } from './store.ts'

type Route = 'title' | 'menu' | Section | 'secrets' | 'options'
const ROUTES: Route[] = ['title', 'menu', 'status', 'skills', 'quests', 'journey', 'contact', 'secrets', 'options']

const app = document.getElementById('app')!
const hud = document.getElementById('hud')!
const scene = new Scene(document.getElementById('scene') as HTMLCanvasElement)
const touch = window.matchMedia('(pointer: coarse)').matches
const wide = () => window.matchMedia('(min-width: 900px)').matches

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const cursor = () => icon('cursor', 3, 'cmd__cursor')

let route: Route = 'title'
let cleanup: (() => void)[] = []
let hero: ReturnType<typeof animateHero> | null = null
let lastMenuIndex = 0
let pendingIntro = false
let dialogMode = false
let advanceIntro = () => {}
let skipIntro = () => {}
/** Fala na caixa de diálogo do menu, quando ela está na tela. */
let hubTalk: ((who: string, text: string, portrait?: Sprite) => void) | null = null

// ---------------------------------------------------------------- navegação por teclado/mouse

type NavOpts = {
  columns?: number
  start?: number
  onMove?: (el: HTMLElement, i: number) => void
  /** ←/→ quando a lista tem uma coluna. Devolve true se tratou. */
  onSide?: (dir: -1 | 1, el: HTMLElement, i: number) => boolean
}

const nav = {
  items: [] as HTMLElement[],
  index: 0,
  opts: {} as NavOpts,
  stack: [] as { items: HTMLElement[]; index: number; opts: NavOpts }[],

  set(items: HTMLElement[], opts: NavOpts = {}) {
    this.items.forEach((el) => el.classList.remove('is-active'))
    this.items = items
    this.opts = opts
    this.index = Math.max(0, Math.min(opts.start ?? 0, items.length - 1))
    items.forEach((el, i) => {
      el.onpointerenter = (e) => {
        if (e.pointerType === 'mouse' && i !== this.index && this.items === items) this.select(i)
      }
      el.onfocus = () => {
        if (i !== this.index && this.items === items) this.select(i, false)
      }
    })
    if (items.length) this.select(this.index, false)
  },

  select(i: number, withSound = true) {
    this.items[this.index]?.classList.remove('is-active')
    this.index = i
    const el = this.items[i]
    el.classList.add('is-active')
    if (document.activeElement !== el) el.focus({ preventScroll: true })
    el.scrollIntoView({ block: 'nearest' })
    if (withSound) sound.move()
    this.opts.onMove?.(el, i)
  },

  move(delta: number) {
    const n = this.items.length
    if (!n) return scrollBody(delta)
    this.select((((this.index + delta) % n) + n) % n)
  },

  side(dir: -1 | 1) {
    const el = this.items[this.index]
    if (el && this.opts.onSide?.(dir, el, this.index)) return
    if ((this.opts.columns ?? 1) > 1) this.move(dir)
  },

  activate() {
    this.items[this.index]?.click()
  },

  push(items: HTMLElement[], opts: NavOpts = {}) {
    this.stack.push({ items: this.items, index: this.index, opts: this.opts })
    this.set(items, opts)
  },

  pop(): boolean {
    const prev = this.stack.pop()
    if (!prev) return false
    this.set(prev.items, { ...prev.opts, start: prev.index })
    return true
  },
}

function scrollBody(delta: number) {
  app.querySelector('.screen__body')?.scrollBy({ top: delta * 80, behavior: 'smooth' })
}

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
let konami = 0

document.addEventListener('keydown', (e) => {
  firstGesture()
  if (e.metaKey || e.ctrlKey || e.altKey) return
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key

  konami = key === KONAMI[konami] ? konami + 1 : key === KONAMI[0] ? 1 : 0
  if (konami === KONAMI.length) {
    konami = 0
    secret()
  }

  if (secretWord(key)) {
    e.preventDefault()
    return
  }

  if (dialogMode) {
    if (['Enter', ' ', 'z'].includes(key)) {
      e.preventDefault()
      advanceIntro()
    } else if (['Escape', 'x'].includes(key)) {
      e.preventDefault()
      skipIntro()
    }
    return
  }

  const cols = nav.opts.columns ?? 1
  switch (key) {
    case 'ArrowUp':
    case 'w':
      e.preventDefault()
      nav.move(-cols)
      break
    case 'ArrowDown':
    case 's':
      e.preventDefault()
      nav.move(cols)
      break
    case 'ArrowLeft':
    case 'a':
      e.preventDefault()
      nav.side(-1)
      break
    case 'ArrowRight':
    case 'd':
      e.preventDefault()
      nav.side(1)
      break
    case 'Enter':
    case 'z':
      e.preventDefault()
      nav.activate()
      break
    case ' ':
      if (!(document.activeElement instanceof HTMLButtonElement)) {
        e.preventDefault()
        nav.activate()
      }
      break
    case 'Escape':
    case 'x':
    case 'Backspace':
      e.preventDefault()
      back()
      break
    case 'm':
      toggleSound()
      break
  }
})

let gestured = false
function firstGesture() {
  unlockAudio()
  if (gestured) return
  gestured = true
  if (save.settings.music) setMusic(true)
}
document.addEventListener('pointerdown', firstGesture)

// ---------------------------------------------------------------- rotas (#/menu, #/status...) e transições

function parse(): Route {
  const r = location.hash.replace(/^#\/?/, '')
  return (ROUTES as string[]).includes(r) ? (r as Route) : 'title'
}

function go(r: Route) {
  const hash = r === 'title' ? '#/' : `#/${r}`
  if (location.hash === hash) void show(r)
  else location.hash = hash
}

let busy = false
let queued: Route | null = null

async function show(next: Route) {
  if (busy) {
    queued = next
    return
  }
  busy = true
  await wipe(() => render(next))
  busy = false
  if (queued && queued !== route) {
    const q = queued
    queued = null
    void show(q)
  }
  queued = null
}

window.addEventListener('hashchange', () => void show(parse()))

function back() {
  if (nav.pop()) {
    sound.back()
    return
  }
  if (route === 'title') return
  sound.back()
  go(route === 'menu' ? 'title' : 'menu')
}

function render(next: Route) {
  cleanup.forEach((f) => f())
  cleanup = []
  nav.stack = []
  hero = null
  hubTalk = null
  asleep = false
  dialogMode = false
  route = next
  document.body.dataset.route = next
  hud.hidden = next === 'title'
  updateHud()

  const entry = MENU.find((m) => m.route === next)
  document.title = entry ? `${entry.label} · Lucas Boroto` : 'Lucas Boroto · Portfólio RPG'

  switch (next) {
    case 'title':
      renderTitle()
      break
    case 'menu':
      renderMenu()
      break
    case 'status':
      renderStatus()
      break
    case 'skills':
      renderSkills()
      break
    case 'quests':
      renderQuests()
      break
    case 'journey':
      renderJourney()
      break
    case 'contact':
      renderContact()
      break
    case 'secrets':
      renderSecrets()
      break
    case 'options':
      renderOptions()
      break
  }
  if ((SECTIONS as Route[]).includes(next)) award(next as Section)
}

// ---------------------------------------------------------------- HUD, estrelas e segredos

function renderHud() {
  hud.innerHTML = `
    <div class="win hud">
      <span class="hud__stars" aria-label="Estrelas">${icon('star', 2)}<b data-stars>0</b>/${SECTIONS.length}</span>
      <span class="hud__stars" aria-label="Segredos">${icon('chest', 2)}<b data-secrets>0</b>/${MY_SECRETS.length}</span>
      <span class="hud__time"><span class="hud__label">TEMPO</span> <b data-time>00:00:00</b></span>
      <button class="hud__sound" data-sound type="button"></button>
    </div>`
  hud.querySelector('[data-sound]')!.addEventListener('click', toggleSound)
  window.setInterval(() => {
    if (document.hidden) return
    save.playMs += 1000
    updateHud()
    if (Math.floor(save.playMs / 1000) % 10 === 0) persist()
  }, 1000)
}

function updateHud() {
  const s = Math.floor(save.playMs / 1000)
  const t = [s / 3600, (s % 3600) / 60, s % 60].map((n) => String(Math.floor(n)).padStart(2, '0')).join(':')
  hud.querySelector('[data-time]')!.textContent = t
  hud.querySelector('[data-stars]')!.textContent = String(save.visited.length)
  hud.querySelector('[data-secrets]')!.textContent = String(foundCount())
  const btn = hud.querySelector<HTMLButtonElement>('[data-sound]')!
  btn.textContent = save.settings.sfx ? '♪ SOM' : '♪ MUDO'
  btn.setAttribute('aria-pressed', String(save.settings.sfx))
  btn.setAttribute('aria-label', save.settings.sfx ? 'Som ligado. Tecla M desliga.' : 'Som desligado. Tecla M liga.')
}

function toggleSound() {
  firstGesture()
  save.settings.sfx = !save.settings.sfx
  if (!save.settings.sfx && save.settings.music) {
    save.settings.music = false
    setMusic(false)
  }
  persist()
  updateHud()
  sound.toggle()
  if (route === 'options') renderOptions(nav.index)
}

function award(section: Section) {
  if (!visit(section)) return
  const n = save.visited.length
  updateHud()
  const label = MENU.find((m) => m.route === section)!.label
  window.setTimeout(() => {
    sound.star()
    toast(`${icon('star', 3)}<span>${esc(label)}</span><b>${n}/${SECTIONS.length}</b>`, 'star')
    if (n === SECTIONS.length) {
      window.setTimeout(() => {
        sound.fanfare()
        scene.celebrate()
        hero?.happy(2500)
        toast(`${icon('star', 3)}<span>PORTFÓLIO 100%! OBRIGADO POR JOGAR.</span>`, 'star')
      }, 1400)
    }
  }, 380)
}

function secret() {
  save.secret = true
  persist()
  sound.fanfare()
  scene.celebrate(12)
  hero?.happy(3000)
  toast(`${icon('spark', 3)}<span>CÓDIGO SECRETO ATIVADO!</span>`, 'star')
  found('konami')
}

// ---------------------------------------------------------------- segredos

/** Os segredos deste aparelho: no celular, os de teclado viram gestos e o do console vira girar a tela. */
const DEVICE = touch ? 'touch' : 'pc'
const MY_SECRETS = SECRETS.filter((s) => !s.only || s.only === DEVICE)
const foundCount = () => MY_SECRETS.filter((s) => save.secrets.includes(s.id)).length

/** Registra um segredo achado: aviso, contador no HUD e festa quando acha todos. */
function found(id: SecretId) {
  if (!MY_SECRETS.some((s) => s.id === id) || !discover(id)) return
  updateHud()
  const n = foundCount()
  const total = MY_SECRETS.length
  const name = MY_SECRETS.find((s) => s.id === id)!.name
  window.setTimeout(() => {
    sound.star()
    toast(`${icon('chestOpen', 3)}<span>SEGREDO: ${esc(name)}</span><b>${n}/${total}</b>`, 'star')
    if (n === total) {
      window.setTimeout(() => {
        sound.fanfare()
        scene.celebrate(14)
        hero?.happy(3000)
        toast(`${icon('chestOpen', 3)}<span>${total}/${total} SEGREDOS! NADA ESCAPA DE VOCÊ.</span>`, 'star')
      }, 1500)
    }
    if (route === 'secrets') renderSecrets(nav.index)
  }, 1100)
}

/** Fala de um personagem: na caixa de diálogo do menu ou num aviso com retrato. */
function say(who: string, text: string, portrait?: Sprite) {
  if (route === 'menu' && hubTalk && !dialogMode) return hubTalk(who, text, portrait)
  const face = spriteSrc(portrait ?? PORTRAIT, 2)
  toast(
    `<img class="px toast__face" src="${face}" width="48" height="38" alt=""><span class="toast__speech"><b>${esc(who)}</b>${esc(text)}</span>`,
    'speech',
    5200,
  )
}

// Cutucar o personagem.
let pokes = 0
function bindPoke(canvas: HTMLCanvasElement) {
  canvas.classList.add('pokeable')
  canvas.addEventListener('click', (e) => {
    e.stopPropagation()
    if (dialogMode) return
    pokes++
    sound.poke()
    hero?.happy(500)
    canvas.classList.remove('hop')
    void canvas.offsetWidth
    canvas.classList.add('hop')
    const line = EGGS.poke[pokes]
    if (line) say('LUCAS', line)
    if (pokes === 3) found('poke')
    if (pokes === 10) {
      scene.celebrate(3)
      toast(`${icon('heart', 3)}<span>CUTUCADOR PROFISSIONAL</span>`, 'star')
    }
  })
}

// Cochilo: um minuto parado no menu.
let asleep = false
let idleTimer: number | undefined
function resetIdle() {
  if (asleep) wake()
  window.clearTimeout(idleTimer)
  idleTimer = window.setTimeout(fallAsleep, 60_000)
}
function fallAsleep() {
  if (route !== 'menu' || dialogMode || !hero) return
  asleep = true
  hero.sleep(true)
  app.querySelector('.stage')?.classList.add('is-sleeping')
  say('LUCAS', EGGS.sleep)
  found('sleep')
}
function wake() {
  asleep = false
  hero?.sleep(false)
  hero?.happy(1200)
  app.querySelector('.stage')?.classList.remove('is-sleeping')
  if (route === 'menu') say('LUCAS', EGGS.wake)
}
for (const ev of ['keydown', 'pointerdown', 'pointermove', 'wheel']) document.addEventListener(ev, resetIdle, { passive: true })
resetIdle()

// Nia e a cidade acesa: digitando no PC, com gestos no celular.
function niaEgg() {
  sound.sparkle()
  say('NIA', EGGS.nia, NIA)
  found('nia')
}
function casamyEgg() {
  scene.lightUp()
  sound.sparkle()
  say('NIA', EGGS.casamy, NIA)
  found('casamy')
}
const WORDS: Record<string, () => void> = { casamy: casamyEgg, nia: niaEgg }
let typed = ''
/** Devolve true se a tecla faz parte de uma palavra secreta (e não deve virar atalho). */
function secretWord(key: string): boolean {
  if (!/^[a-z]$/.test(key)) return false
  typed = (typed + key).slice(-12)
  const hit = Object.keys(WORDS).find((w) => typed.endsWith(w))
  if (hit) {
    typed = ''
    WORDS[hit]()
    return true
  }
  // O "a" de "nia" ou o "m" de "casamy" não andam no menu nem desligam o som.
  return Object.keys(WORDS).some((w) => {
    for (let n = 2; n < w.length; n++) if (typed.endsWith(w.slice(0, n))) return true
    return false
  })
}

/** Segurar o retrato do Lucas na caixa de diálogo chama a Nia (o jeito de celular). */
function bindLongPress(el: HTMLElement) {
  let timer: number | undefined
  const cancel = () => window.clearTimeout(timer)
  el.addEventListener('pointerdown', () => {
    cancel()
    timer = window.setTimeout(niaEgg, 1200)
  })
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) el.addEventListener(ev, cancel)
  el.addEventListener('contextmenu', (e) => e.preventDefault())
}

// Cliques no fundo: três na lua chamam o coelho; cinco na cidade acendem as casas.
const RABBIT_FACE = padSprite(RABBIT[0], PORTRAIT[0].length, PORTRAIT.length)
const onBackground = (t: EventTarget | null) => !(t as HTMLElement | null)?.closest('.win, button, a, .cmd, canvas.px')
let moonClicks = 0
let cityClicks = 0
let moonTimer: number | undefined
let cityTimer: number | undefined
document.addEventListener('click', (e) => {
  if (!onBackground(e.target)) return
  if (scene.hitMoon(e.clientX, e.clientY)) {
    moonClicks++
    sound.poke()
    window.clearTimeout(moonTimer)
    moonTimer = window.setTimeout(() => (moonClicks = 0), 1500)
    if (moonClicks < 3) return
    moonClicks = 0
    scene.rabbit()
    sound.mochi()
    say(EGGS.rabbitWho, EGGS.rabbit, RABBIT_FACE)
    found('rabbit')
    return
  }
  if (e.clientY < window.innerHeight * 0.72) return
  cityClicks++
  window.clearTimeout(cityTimer)
  cityTimer = window.setTimeout(() => (cityClicks = 0), 2000)
  if (cityClicks < 5) return
  cityClicks = 0
  casamyEgg()
})
document.addEventListener('pointermove', (e) => {
  document.body.classList.toggle('over-moon', onBackground(e.target) && scene.hitMoon(e.clientX, e.clientY))
})

// Código clássico no celular: deslizar ↑↑↓↓←→←→.
const SWIPES = KONAMI.slice(0, 8)
let swipe = 0
let start: { x: number; y: number } | null = null
document.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'touch') start = { x: e.clientX, y: e.clientY }
})
document.addEventListener('pointerup', (e) => {
  if (e.pointerType !== 'touch' || !start) return
  const dx = e.clientX - start.x
  const dy = e.clientY - start.y
  start = null
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 40) return
  const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : dy > 0 ? 'ArrowDown' : 'ArrowUp'
  swipe = dir === SWIPES[swipe] ? swipe + 1 : dir === SWIPES[0] ? 1 : 0
  if (swipe === SWIPES.length) {
    swipe = 0
    secret()
  }
})

// Virar o celular de lado.
if (touch) {
  window.matchMedia('(orientation: landscape)').addEventListener('change', (e) => {
    if (!e.matches) return
    say('LUCAS', EGGS.rotate)
    found('rotate')
  })
}

// Recado para quem abrir o DevTools: o retrato em pixels coloridos e um comando para responder.
function consoleHello() {
  let fmt = ''
  const styles: string[] = []
  for (const row of PORTRAIT) {
    for (const run of row.match(/(.)\1*/g) ?? []) {
      fmt += '%c' + '  '.repeat(run.length)
      styles.push(`background:${PALETTE[run[0]] ?? 'transparent'};font-size:9px;line-height:9px`)
    }
    fmt += '\n'
  }
  console.log(fmt, ...styles)
  console.log('%cEi, dev curioso!', 'font: bold 16px monospace; color: #ffd23f')
  console.log(
    '%cO código deste portfólio: https://github.com/LucasLangley/LucasLangley.github.io\nDigite lucas.oi() aqui para destravar um segredo.',
    'font: 12px monospace; color: #aab2dc',
  )
  ;(window as unknown as { lucas: { oi: () => string } }).lucas = {
    oi: () => {
      found('console')
      say('LUCAS', EGGS.console)
      return EGGS.console
    },
  }
}
consoleHello()

// ---------------------------------------------------------------- telas

function renderTitle() {
  app.innerHTML = `
    <section class="title">
      <div class="title__logo">
        <p class="title__jp" lang="ja">ポートフォリオ・クエスト</p>
        <h1 class="title__name"><span>LUCAS</span><span>BOROTO</span></h1>
        <p class="title__sub">PORTFOLIO RPG</p>
      </div>
      <nav class="title__menu" aria-label="Início">
        ${save.introSeen ? `<button class="cmd" type="button" data-act="continue">${cursor()}<span>CONTINUAR</span></button>` : ''}
        <button class="cmd" type="button" data-act="new">${cursor()}<span>NOVO JOGO</span></button>
      </nav>
      <p class="title__hint">${touch ? 'TOQUE PARA COMEÇAR' : '↑↓ ESCOLHER · ENTER COMEÇAR'}</p>
      <div class="title__hero"><canvas aria-hidden="true"></canvas></div>
      <p class="title__foot">© 2026 LUCAS BOROTO · FEITO PIXEL A PIXEL</p>
    </section>`
  hero = animateHero(app.querySelector('.title__hero canvas')!, touch ? 4 : 5)
  cleanup.push(hero.stop)
  bindPoke(app.querySelector('.title__hero canvas')!)
  const buttons = [...app.querySelectorAll<HTMLButtonElement>('.title__menu .cmd')]
  for (const b of buttons) {
    b.addEventListener('click', () => {
      firstGesture()
      sound.select()
      hero?.happy()
      pendingIntro = b.dataset.act === 'new'
      lastMenuIndex = 0
      go('menu')
    })
  }
  nav.set(buttons)
}

function bar(label: string, value: number, max: number, kind: string) {
  return `<div class="bar bar--${kind}"><span>${label}</span><i style="--v:${Math.round((value / max) * 100)}%"></i><b>${value}/${max}</b></div>`
}

function dialogHTML() {
  return `
    <div class="dialog">
      <div class="win dialog__face"><canvas aria-hidden="true"></canvas></div>
      <div class="win dialog__box">
        <p class="dialog__who">LUCAS</p>
        <p class="dialog__text" aria-hidden="true"></p>
        <p class="sr-only" aria-live="polite" data-live></p>
        <span class="dialog__more" aria-hidden="true" hidden>▼</span>
        <button class="dialog__skip" type="button" hidden>PULAR ▶▶</button>
      </div>
    </div>`
}

function renderMenu() {
  app.innerHTML = `
    <section class="hub">
      <div class="hub__hero">
        <div class="stage"><canvas class="stage__hero" aria-hidden="true"></canvas><span class="stage__shadow"></span></div>
        <div class="win plate">
          <p class="plate__name">LUCAS BOROTO</p>
          <p class="plate__meta">NV. ${PROFILE.level} · ${PROFILE.className}</p>
          ${bar('HP', 100, 100, 'hp')}
          ${bar('MP', 100, 100, 'mp')}
        </div>
      </div>
      <nav class="win menu" aria-label="Menu principal">
        ${MENU.map(
          (m) => `
          <button class="cmd" type="button" data-route="${m.route}">
            ${cursor()}<span class="cmd__icon">${icon(m.icon, 3)}</span>
            <span class="cmd__label">${m.label}<small lang="ja">${m.jp}</small></span>
            ${(SECTIONS as string[]).includes(m.route) ? `<span class="cmd__star ${save.visited.includes(m.route as Section) ? 'is-on' : ''}" aria-label="${save.visited.includes(m.route as Section) ? 'visitado' : 'não visitado'}">★</span>` : ''}
          </button>`,
        ).join('')}
      </nav>
      ${dialogHTML()}
    </section>`

  hero = animateHero(app.querySelector('.stage__hero')!, wide() ? 7 : 4)
  const face = animateHero(app.querySelector('.dialog__face canvas')!, 3, 'portrait')
  bindLongPress(app.querySelector('.dialog__face')!)
  cleanup.push(hero.stop, face.stop)

  const menu = app.querySelector<HTMLElement>('.menu')!
  const buttons = [...menu.querySelectorAll<HTMLButtonElement>('.cmd')]
  const writer = new Typewriter(app.querySelector('.dialog__text')!, app.querySelector('[data-live]')!)
  cleanup.push(() => writer.cancel())
  const more = app.querySelector<HTMLElement>('.dialog__more')!
  const skip = app.querySelector<HTMLButtonElement>('.dialog__skip')!
  const who = app.querySelector<HTMLElement>('.dialog__who')!
  bindPoke(app.querySelector('.stage__hero')!)
  hubTalk = (name, text, portrait) => {
    who.textContent = name
    if (portrait) face.show(portrait, 7000)
    else face.happy(900)
    void writer.type(text)
  }

  buttons.forEach((b, i) =>
    b.addEventListener('click', () => {
      sound.select()
      hero?.happy()
      face.happy()
      lastMenuIndex = i
      go(b.dataset.route as Route)
    }),
  )

  const startMenu = () => {
    menu.inert = false
    nav.set(buttons, {
      start: lastMenuIndex,
      onMove: (_, i) => {
        who.textContent = 'LUCAS'
        void writer.type(MENU[i].hint, { fast: true })
      },
    })
    void writer.type(MENU[nav.index].hint, { fast: true })
  }

  if (!pendingIntro) return startMenu()

  // Diálogo de abertura: Enter/clique avança, Esc pula.
  pendingIntro = false
  dialogMode = true
  menu.inert = true
  skip.hidden = false
  const lines = (touch ? INTRO.touch : INTRO.keyboard).map((l) => l.replace('{n}', String(MY_SECRETS.length)))
  let line = 0
  const say = async () => {
    more.hidden = true
    face.happy(line === 0 ? 1500 : 0)
    await writer.type(lines[line])
    more.hidden = false
  }
  const end = () => {
    dialogMode = false
    skip.hidden = true
    more.hidden = true
    save.introSeen = true
    persist()
    startMenu()
  }
  advanceIntro = () => {
    if (!dialogMode) return
    if (writer.typing) return writer.finish()
    sound.move()
    line++
    if (line < lines.length) void say()
    else end()
  }
  skipIntro = () => {
    if (!dialogMode) return
    writer.cancel()
    sound.back()
    end()
  }
  const hub = app.querySelector<HTMLElement>('.hub')!
  const onHubClick = (e: MouseEvent) => {
    if (!dialogMode || (e.target as HTMLElement).closest('.dialog__skip')) return
    advanceIntro()
  }
  hub.addEventListener('click', onHubClick)
  skip.addEventListener('click', (e) => {
    e.stopPropagation()
    skipIntro()
  })
  void say()
}

function screen(r: Route, ic: IconName, body: string) {
  const m = MENU.find((x) => x.route === r)!
  app.innerHTML = `
    <section class="screen screen--${r}">
      <header class="screen__head">
        <button class="win back" type="button" data-back aria-label="Voltar ao menu">◀ <span>${touch ? 'VOLTAR' : 'ESC'}</span></button>
        <h1 class="win screen__title">${icon(ic, 3)}<span>${m.label}</span><small lang="ja">${m.jp}</small></h1>
      </header>
      <div class="screen__body">${body}</div>
    </section>`
  app.querySelector('[data-back]')!.addEventListener('click', back)
}

function renderStatus() {
  screen(
    'status',
    'heart',
    `
    <div class="status">
      <div class="win status__card">
        <div class="status__hero"><canvas aria-hidden="true"></canvas><span class="stage__shadow"></span></div>
        <div class="status__id">
          <h2 class="status__name">LUCAS BOROTO</h2>
          <p class="status__class">${PROFILE.className}</p>
          <dl class="kv">
            <div><dt>NV.</dt><dd>${PROFILE.level} <small>${esc(PROFILE.levelNote)}</small></dd></div>
            <div><dt>LOCAL</dt><dd>${esc(PROFILE.location)}</dd></div>
          </dl>
          ${bar('HP', 100, 100, 'hp')}
          ${bar('MP', 100, 100, 'mp')}
          <div class="exp">
            <p class="exp__label">EXP PARA O NV. ${PROFILE.level + 1}</p>
            <div class="bar bar--exp"><i style="--v:${PROFILE.expPercent}%"></i></div>
            <p class="exp__next">${esc(PROFILE.nextLevel)}</p>
          </div>
        </div>
      </div>
      <div class="win status__stats">
        <h2 class="sub">ATRIBUTOS</h2>
        <ul class="stats">
          ${PROFILE.stats.map((s) => `<li><span>${s.label}</span><b>${s.value}</b><i style="--v:${s.value}%"></i></li>`).join('')}
        </ul>
        <h2 class="sub">EQUIPAMENTO</h2>
        <ul class="equip">
          ${PROFILE.equipment.map((e) => `<li>${icon(e.icon, 2)}<span>${e.slot}</span><b>${esc(e.item)}</b></li>`).join('')}
        </ul>
      </div>
      <div class="win status__bio">
        <h2 class="sub">SOBRE</h2>
        ${PROFILE.bio.map((p) => `<p>${esc(p)}</p>`).join('')}
      </div>
    </div>`,
  )
  hero = animateHero(app.querySelector('.status__hero canvas')!, wide() ? 6 : 4)
  cleanup.push(hero.stop)
  bindPoke(app.querySelector('.status__hero canvas')!)
  nav.set([])
}

function renderSkills() {
  screen(
    'skills',
    'spark',
    `
    <div class="split skills">
      <ul class="win list list--grid" role="list">
        ${SKILLS.map((s) => `<li><button class="cmd cmd--sm" type="button">${cursor()}${icon(s.icon, 2)}<span>${esc(s.name)}</span></button></li>`).join('')}
      </ul>
      <article class="win detail" aria-live="polite"></article>
    </div>`,
  )
  const detail = app.querySelector<HTMLElement>('.detail')!
  const show = (i: number) => {
    const s = SKILLS[i]
    detail.innerHTML = `
      <p class="tag">${esc(s.type)}</p>
      <h2 class="detail__name">${icon(s.icon, 3)}<span>${esc(s.name)}</span></h2>
      <p class="detail__text">${esc(s.text)}</p>
      <p class="detail__meta"><span>USADO EM</span>${esc(s.usedIn)}</p>`
    detail.classList.remove('pop')
    void detail.offsetWidth
    detail.classList.add('pop')
  }
  const buttons = [...app.querySelectorAll<HTMLButtonElement>('.list .cmd')]
  buttons.forEach((b) => b.addEventListener('click', () => sound.select()))
  nav.set(buttons, { columns: wide() ? 2 : 1, onMove: (_, i) => show(i) })
  show(0)
}

function questDetail(q: Quest) {
  return `
    <p class="tag">MISSÃO ${q.kind}</p>
    <h2 class="detail__name">${icon(q.icon, 3)}<span>${esc(q.name)}</span></h2>
    <p class="detail__status"><span class="badge ${q.status === 'CONCLUÍDA' ? 'badge--done' : 'badge--wip'}">${q.status}</span>${esc(q.when)}</p>
    <h3 class="sub">OBJETIVO</h3>
    <p class="detail__text">${esc(q.goal)}</p>
    <h3 class="sub">GRUPO</h3>
    <p class="detail__text">${esc(q.party)}</p>
    <h3 class="sub">RECOMPENSAS</h3>
    <ul class="loot">${q.loot.map((l) => `<li>${icon('coin', 2)}<span>${esc(l)}</span></li>`).join('')}</ul>
    ${
      q.links.length
        ? `<div class="links">${q.links.map((l) => `<a class="btn" href="${l.href}" target="_blank" rel="noopener noreferrer">${cursor()}${esc(l.label)} ↗</a>`).join('')}</div>`
        : ''
    }`
}

function renderQuests() {
  screen(
    'quests',
    'scroll',
    `
    <div class="split quests">
      <ul class="win list" role="list">
        ${QUESTS.map(
          (q) => `
          <li><button class="cmd cmd--sm quest" type="button">
            ${cursor()}${icon(q.icon, 2)}
            <span class="quest__name">${esc(q.name)}<small>${q.kind}</small></span>
            <span class="badge ${q.status === 'CONCLUÍDA' ? 'badge--done' : 'badge--wip'}" title="${q.status}">${q.status === 'CONCLUÍDA' ? '✓' : '…'}</span>
          </button></li>`,
        ).join('')}
      </ul>
      <article class="win detail" aria-live="polite"></article>
    </div>`,
  )
  const detail = app.querySelector<HTMLElement>('.detail')!
  const show = (i: number) => {
    detail.innerHTML = questDetail(QUESTS[i])
    detail.classList.remove('pop')
    void detail.offsetWidth
    detail.classList.add('pop')
  }
  const buttons = [...app.querySelectorAll<HTMLButtonElement>('.list .cmd')]
  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      // Enter numa missão com links entra no submenu dos links; Esc volta para a lista.
      const links = [...detail.querySelectorAll<HTMLAnchorElement>('.links .btn')]
      if (!links.length) return sound.select()
      sound.select()
      if (!touch) nav.push(links, { columns: links.length })
      else detail.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }),
  )
  nav.set(buttons, { onMove: (_, i) => show(i) })
  show(0)
}

function renderJourney() {
  screen(
    'journey',
    'star',
    `
    <ol class="win journey">
      ${JOURNEY.map(
        (j) => `
        <li class="journey__item" tabindex="-1">
          ${cursor()}
          <span class="journey__when">${esc(j.when)}</span>
          <span class="journey__dot">${icon(j.icon, 2)}</span>
          <span class="journey__body"><span class="journey__title">${esc(j.title)}</span><span class="journey__place">${esc(j.place)}</span></span>
          ${j.badge ? `<span class="badge ${j.badge === 'ATUAL' ? 'badge--wip' : 'badge--done'}">${esc(j.badge)}</span>` : ''}
        </li>`,
      ).join('')}
    </ol>`,
  )
  nav.set([...app.querySelectorAll<HTMLElement>('.journey__item')])
}

function renderContact() {
  // A estrela do Contato só é dada depois de renderizar, então ele conta como visitado aqui.
  const complete = SECTIONS.every((s) => s === 'contact' || save.visited.includes(s))
  screen(
    'contact',
    'letter',
    `
    <div class="win letter">
      <div class="letter__head">${icon('letter', 5)}<h2>UMA CARTA PARA VOCÊ</h2></div>
      <p class="letter__text">Quer conversar sobre um projeto, uma vaga ou o Casamy? Me chame em qualquer um destes canais.</p>
      <ul class="contact" role="list">
        ${LINKS.map(
          (l) => `
          <li><a class="cmd cmd--sm" href="${l.href}" target="_blank" rel="noopener noreferrer">
            ${cursor()}${icon(l.icon, 2, 'contact__icon')}<span class="contact__label">${l.label}</span><span class="contact__handle">${esc(l.handle)} ↗</span>
          </a></li>`,
        ).join('')}
      </ul>
      ${complete ? `<p class="letter__ps">${icon('star', 2)} P.S.: você explorou o portfólio inteiro. Obrigado por jogar!</p>` : ''}
      <p class="letter__sign">— Lucas</p>
    </div>`,
  )
  const links = [...app.querySelectorAll<HTMLAnchorElement>('.contact .cmd')]
  links.forEach((a) => a.addEventListener('click', () => sound.select()))
  nav.set(links)
}

function renderSecrets(start = 0) {
  const n = foundCount()
  const total = MY_SECRETS.length
  screen(
    'secrets',
    'chest',
    `
    <div class="win secrets">
      <p class="secrets__lead">Este portfólio esconde <b>${total} segredos</b>. Você achou <b>${n}</b>.${n === total ? ' Nada escapa de você!' : ''}</p>
      <div class="bar bar--exp"><i style="--v:${Math.round((n / total) * 100)}%"></i></div>
      <ul class="secrets__list" role="list">
        ${MY_SECRETS.map((s) => {
          const ok = save.secrets.includes(s.id)
          return `
          <li class="secret ${ok ? 'is-found' : ''}" tabindex="-1">
            ${cursor()}${icon(ok ? 'chestOpen' : 'chest', 3)}
            <span class="secret__body">
              <span class="secret__name">${ok ? esc(s.name) : '???'}</span>
              <span class="secret__hint">${esc(ok ? s.found : s[DEVICE])}</span>
            </span>
          </li>`
        }).join('')}
      </ul>
      <p class="secrets__note">${touch ? 'Pistas para celular. No computador, alguns segredos são diferentes.' : 'Pistas para computador. No celular, alguns segredos são diferentes.'}</p>
    </div>`,
  )
  nav.set([...app.querySelectorAll<HTMLElement>('.secret')], { start })
}

type Option = {
  key: keyof Settings
  label: string
  values: (boolean | TextSpeed)[]
  show: (v: boolean | TextSpeed) => string
}

const OPTIONS: Option[] = [
  { key: 'sfx', label: 'EFEITOS SONOROS', values: [true, false], show: (v) => (v ? 'LIGADO' : 'DESLIGADO') },
  { key: 'music', label: 'MÚSICA', values: [false, true], show: (v) => (v ? 'LIGADA' : 'DESLIGADA') },
  { key: 'crt', label: 'EFEITO CRT', values: [true, false], show: (v) => (v ? 'LIGADO' : 'DESLIGADO') },
  { key: 'sakura', label: 'SAKURA', values: [true, false], show: (v) => (v ? 'LIGADA' : 'DESLIGADA') },
  { key: 'textSpeed', label: 'TEXTO', values: ['lenta', 'normal', 'rápida'], show: (v) => String(v).toUpperCase() },
]

function applySettings() {
  document.body.classList.toggle('crt-off', !save.settings.crt)
  scene.setSakura(save.settings.sakura)
}

function renderOptions(start = 0) {
  let confirmReset = false
  screen(
    'options',
    'gear',
    `
    <div class="win options">
      <ul class="options__list" role="list">
        ${OPTIONS.map(
          (o) => `
          <li><button class="cmd cmd--sm option" type="button" data-key="${o.key}">
            ${cursor()}<span class="option__label">${o.label}</span>
            <span class="option__value">◀ <b>${o.show(save.settings[o.key])}</b> ▶</span>
          </button></li>`,
        ).join('')}
        <li><button class="cmd cmd--sm option option--danger" type="button" data-reset>${cursor()}<span class="option__label">APAGAR PROGRESSO</span><span class="option__value"><b data-reset-label>★ ${save.visited.length}/${SECTIONS.length}</b></span></button></li>
      </ul>
      <p class="options__hint">${touch ? 'Toque para trocar.' : '←→ ou Enter para trocar · M liga/desliga o som'}</p>
    </div>`,
  )
  const buttons = [...app.querySelectorAll<HTMLButtonElement>('.option')]
  const cycle = (i: number, dir: -1 | 1) => {
    const o = OPTIONS[i]
    if (!o) return false
    const cur = o.values.indexOf(save.settings[o.key])
    const next = o.values[(cur + dir + o.values.length) % o.values.length]
    ;(save.settings as Record<string, unknown>)[o.key] = next
    if (o.key === 'music') setMusic(next as boolean)
    if (o.key === 'sfx' && !next && save.settings.music) {
      save.settings.music = false
      setMusic(false)
    }
    persist()
    applySettings()
    updateHud()
    sound.toggle()
    buttons.forEach((b, j) => {
      const opt = OPTIONS[j]
      if (opt) b.querySelector('.option__value b')!.textContent = opt.show(save.settings[opt.key])
    })
    return true
  }
  buttons.forEach((b, i) =>
    b.addEventListener('click', () => {
      if (i < OPTIONS.length) return void cycle(i, 1)
      const label = b.querySelector('[data-reset-label]')!
      if (!confirmReset) {
        confirmReset = true
        sound.move()
        label.textContent = 'CONFIRMAR?'
        return
      }
      resetSave()
      updateHud()
      sound.back()
      label.textContent = 'APAGADO'
      toast('<span>PROGRESSO APAGADO</span>')
    }),
  )
  nav.set(buttons, {
    start,
    onSide: (dir, _, i) => cycle(i, dir),
    onMove: () => {
      if (confirmReset) {
        confirmReset = false
        app.querySelector('[data-reset-label]')!.textContent = `★ ${save.visited.length}/${SECTIONS.length}`
      }
    },
  })
}

// ---------------------------------------------------------------- início

applySettings()
pixelAccents()
renderHud()
render(parse())
requestAnimationFrame(() => document.body.classList.add('is-ready'))
