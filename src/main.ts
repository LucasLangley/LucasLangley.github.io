import './fonts.css'
import './style.css'
import {
  EGGS,
  INTRO,
  JOURNEY,
  LANG,
  LANGS,
  LINKS,
  MENU,
  PETS,
  PROFILE,
  QUESTS,
  SECRETS,
  SECTIONS,
  SKILLS,
  UI,
  browserLang,
  fmt,
  setLang,
  type Lang,
  type Quest,
  type SecretId,
  type Section,
} from './data.ts'
import { pixelAccents } from './accents.ts'
import { setMusic, sound, unlockAudio } from './audio.ts'
import { Typewriter } from './dialog.ts'
import { toast, wipe } from './fx.ts'
import { animateCat, animateHero, icon, padSprite, spriteSrc } from './render.ts'
import { Scene } from './scene.ts'
import { LILI, NIA, PALETTE, PORTRAIT, RABBIT, TODINHO, type CatName, type IconName, type Sprite } from './sprites.ts'
import { discover, persist, resetSave, save, visit, type Settings, type TextSpeed } from './store.ts'

type Route = 'title' | 'menu' | Section | 'secrets' | 'options'
const ROUTES: Route[] = ['title', 'menu', 'status', 'skills', 'quests', 'journey', 'contact', 'secrets', 'options']

const app = document.getElementById('app')!
const hud = document.getElementById('hud')!
const scene = new Scene(document.getElementById('scene') as HTMLCanvasElement)
const touch = window.matchMedia('(pointer: coarse)').matches
const wide = () => window.matchMedia('(min-width: 900px)').matches

// Idioma: o que o visitante escolheu ou, na primeira visita, o do navegador.
setLang(save.settings.lang || browserLang())
document.documentElement.lang = LANG === 'pt' ? 'pt-BR' : 'en'

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const cursor = () => icon('cursor', 3, 'cmd__cursor')

let route: Route = 'title'
let cleanup: (() => void)[] = []
let hero: ReturnType<typeof animateHero> | null = null
let cats: ReturnType<typeof animateCat>[] = []
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

// ---------------------------------------------------------------- rotas (/menu, /status...) e transições

// Links antigos no formato /#/status viram /status.
if (location.hash.startsWith('#/')) history.replaceState(null, '', `/${location.hash.slice(2)}`)

function parse(): Route {
  const r = location.pathname.replace(/^\/|\/$/g, '').replace(/\.html$/, '')
  return (ROUTES as string[]).includes(r) ? (r as Route) : 'title'
}

function go(r: Route) {
  const path = r === 'title' ? '/' : `/${r}`
  if (location.pathname !== path) history.pushState(null, '', path)
  void show(r)
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

// Voltar e avançar do navegador.
window.addEventListener('popstate', () => void show(parse()))

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
  cats = []
  hubTalk = null
  asleep = false
  dialogMode = false
  route = next
  document.body.dataset.route = next
  hud.hidden = next === 'title'
  updateHud()

  const entry = MENU.find((m) => m.route === next)
  document.title = entry ? `${entry.label} · Lucas Boroto` : UI.docTitle

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
      <span class="hud__stars" aria-label="${UI.hudStars}">${icon('star', 2)}<b data-stars>0</b>/${SECTIONS.length}</span>
      <span class="hud__stars" aria-label="${UI.hudSecrets}">${icon('chest', 2)}<b data-secrets>0</b>/${mySecrets().length}</span>
      <span class="hud__time"><span class="hud__label">${UI.hudTime}</span> <b data-time>00:00:00</b></span>
      <button class="hud__sound" data-sound type="button"></button>
    </div>`
  hud.querySelector('[data-sound]')!.addEventListener('click', toggleSound)
  updateHud()
}

function startClock() {
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
  btn.textContent = save.settings.sfx ? UI.soundOn : UI.soundOff
  btn.setAttribute('aria-pressed', String(save.settings.sfx))
  btn.setAttribute('aria-label', save.settings.sfx ? UI.soundOnAria : UI.soundOffAria)
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
        toast(`${icon('star', 3)}<span>${UI.allStars}</span>`, 'star')
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
  toast(`${icon('spark', 3)}<span>${UI.konami}</span>`, 'star')
  found('konami')
}

// ---------------------------------------------------------------- segredos

/** Os segredos deste aparelho: no celular, os de teclado viram gestos e o do console vira girar a tela. */
const DEVICE = touch ? 'touch' : 'pc'
const mySecrets = () => SECRETS.filter((s) => !s.only || s.only === DEVICE)
const foundCount = () => mySecrets().filter((s) => save.secrets.includes(s.id)).length

/** Registra um segredo achado: aviso, contador no HUD e festa quando acha todos. */
function found(id: SecretId) {
  if (!mySecrets().some((s) => s.id === id) || !discover(id)) return
  updateHud()
  const n = foundCount()
  const total = mySecrets().length
  const name = mySecrets().find((s) => s.id === id)!.name
  window.setTimeout(() => {
    sound.star()
    toast(`${icon('chestOpen', 3)}<span>${UI.secretFound}: ${esc(name)}</span><b>${n}/${total}</b>`, 'star')
    if (n === total) {
      window.setTimeout(() => {
        sound.fanfare()
        scene.celebrate(14)
        hero?.happy(3000)
        toast(`${icon('chestOpen', 3)}<span>${fmt(UI.allSecrets, { total })}</span>`, 'star')
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
    const line = (EGGS.poke as Record<number, string>)[pokes]
    if (line) say('LUCAS', line)
    if (pokes === 3) found('poke')
    if (pokes === 10) {
      scene.celebrate(3)
      toast(`${icon('heart', 3)}<span>${UI.pokePro}</span>`, 'star')
    }
  })
}

// A Lili e o Todinho: carinho faz miar e falar; carinho nos dois é um segredo.
const CAT_FACE: Record<CatName, Sprite> = {
  lili: padSprite(LILI, PORTRAIT[0].length, PORTRAIT.length),
  todinho: padSprite(TODINHO, PORTRAIT[0].length, PORTRAIT.length),
}
const petted = new Set<CatName>()
const pets: Record<CatName, number> = { lili: 0, todinho: 0 }

/** Anima e liga o carinho em todo canvas[data-cat] dentro de `root`. */
function mountCats(root: ParentNode, scale: number) {
  root.querySelectorAll<HTMLCanvasElement>('canvas[data-cat]').forEach((canvas) => {
    const name = canvas.dataset.cat as CatName
    const cat = animateCat(canvas, name, scale)
    cats.push(cat)
    cleanup.push(cat.stop)
    canvas.classList.add('pokeable')
    canvas.addEventListener('click', (e) => {
      e.stopPropagation()
      if (dialogMode) return
      sound.meow(name === 'lili' ? 1.15 : 0.9)
      canvas.classList.remove('hop')
      void canvas.offsetWidth
      canvas.classList.add('hop')
      const lines = PETS[name].lines
      say(PETS[name].name, lines[pets[name]++ % lines.length], CAT_FACE[name])
      petted.add(name)
      if (petted.size === 2) found('pets')
    })
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
  cats.forEach((c) => c.sleep(true))
  app.querySelector('.stage')?.classList.add('is-sleeping')
  say('LUCAS', EGGS.sleep)
  found('sleep')
}
function wake() {
  asleep = false
  hero?.sleep(false)
  cats.forEach((c) => c.sleep(false))
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

/** Lili, o rosto do Lucas e o Todinho lado a lado, com os gatos sentados na linha do queixo. */
function consoleArt(): Sprite {
  const h = PORTRAIT.length
  const sit = (cat: Sprite) => [...Array<string>(h - cat.length).fill('.'.repeat(cat[0].length)), ...cat]
  const lili = sit(LILI)
  const todinho = sit(TODINHO)
  return PORTRAIT.map((row, i) => `${lili[i]}..${row}..${todinho[i]}`)
}

// Recado para quem abrir o DevTools: o retrato em pixels coloridos e um comando para responder.
function consoleHello() {
  let fmt = ''
  const styles: string[] = []
  for (const row of consoleArt()) {
    for (const run of row.match(/(.)\1*/g) ?? []) {
      fmt += '%c' + '  '.repeat(run.length)
      styles.push(`background:${PALETTE[run[0]] ?? 'transparent'};font-size:9px;line-height:9px`)
    }
    fmt += '\n'
  }
  console.log(fmt, ...styles)
  console.log(`%c${UI.devHello}`, 'font: bold 16px monospace; color: #ffd23f')
  console.log(`%c${UI.devNote}`, 'font: 12px monospace; color: #aab2dc')
  const answer = () => {
    found('console')
    say('LUCAS', EGGS.console)
    return EGGS.console
  }
  ;(window as unknown as { lucas: Record<'oi' | 'hi', () => string> }).lucas = { oi: answer, hi: answer }
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
      <nav class="title__menu" aria-label="${UI.navStart}">
        ${save.introSeen ? `<button class="cmd" type="button" data-act="continue">${cursor()}<span>${UI.continue}</span></button>` : ''}
        <button class="cmd" type="button" data-act="new">${cursor()}<span>${UI.newGame}</span></button>
      </nav>
      <div class="title__lang" role="group" aria-label="${UI.language}">
        ${LANGS.map(
          (l) =>
            `<button class="lang ${l.id === LANG ? 'is-on' : ''}" type="button" data-lang="${l.id}" aria-pressed="${l.id === LANG}">${icon(l.flag, 2)}<span>${l.label}</span></button>`,
        ).join('')}
      </div>
      <p class="title__hint">${touch ? UI.startTouch : UI.startKeys}</p>
      <div class="title__hero"><canvas data-cat="lili" aria-hidden="true"></canvas><canvas class="title__lucas" aria-hidden="true"></canvas><canvas data-cat="todinho" aria-hidden="true"></canvas></div>
      <p class="title__foot">${UI.footer}</p>
    </section>`
  hero = animateHero(app.querySelector('.title__lucas')!, touch ? 4 : 5)
  cleanup.push(hero.stop)
  bindPoke(app.querySelector('.title__lucas')!)
  mountCats(app.querySelector('.title__hero')!, touch ? 2 : 3)
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
  const flags = [...app.querySelectorAll<HTMLButtonElement>('.title__lang .lang')]
  flags.forEach((f) => f.addEventListener('click', () => setLanguage(f.dataset.lang as Lang)))
  const items = [...buttons, ...flags]
  nav.set(items, {
    // ←/→ alterna entre as bandeiras.
    onSide: (dir, el, i) => {
      if (!el.classList.contains('lang')) return false
      if (items[i + dir]?.classList.contains('lang')) nav.select(i + dir)
      return true
    },
  })
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
        <button class="dialog__skip" type="button" hidden>${UI.skip}</button>
      </div>
    </div>`
}

function renderMenu() {
  app.innerHTML = `
    <section class="hub">
      <div class="hub__hero">
        <div class="stage"><div class="stage__row"><canvas data-cat="lili" aria-hidden="true"></canvas><canvas class="stage__hero" aria-hidden="true"></canvas><canvas data-cat="todinho" aria-hidden="true"></canvas></div><span class="stage__shadow"></span></div>
        <div class="win plate">
          <p class="plate__name">LUCAS BOROTO</p>
          <p class="plate__meta">${UI.level} ${PROFILE.level} · ${PROFILE.className}</p>
          <p class="plate__open"><span class="badge">${UI.openShort}</span></p>
          ${bar('HP', 100, 100, 'hp')}
          ${bar('MP', 100, 100, 'mp')}
        </div>
      </div>
      <nav class="win menu" aria-label="${UI.mainMenu}">
        ${MENU.map(
          (m) => `
          <button class="cmd" type="button" data-route="${m.route}">
            ${cursor()}<span class="cmd__icon">${icon(m.icon, 3)}</span>
            <span class="cmd__label">${m.label}<small lang="ja">${m.jp}</small></span>
            ${(SECTIONS as string[]).includes(m.route) ? `<span class="cmd__star ${save.visited.includes(m.route as Section) ? 'is-on' : ''}" aria-label="${save.visited.includes(m.route as Section) ? UI.visited : UI.notVisited}">★</span>` : ''}
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
  mountCats(app.querySelector('.stage')!, wide() ? 4 : 2)
  hubTalk = (name, text, portrait) => {
    who.textContent = name
    // O rosto acompanha quem fala: sem retrato próprio, volta na hora para o Lucas.
    face.show(portrait ?? null, 7000)
    if (!portrait) face.happy(900)
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
        face.show(null)
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
  const lines = (touch ? INTRO.touch : INTRO.keyboard).map((l) => l.replace('{n}', String(mySecrets().length)))
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
        <button class="win back" type="button" data-back aria-label="${UI.backAria}">◀ <span>${touch ? UI.backTouch : 'ESC'}</span></button>
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
          <p class="status__open"><span class="badge">${UI.open}</span><span>${esc(PROFILE.openTo)}</span></p>
          <dl class="kv">
            <div><dt>${UI.level}</dt><dd>${PROFILE.level} <small>${esc(PROFILE.levelNote)}</small></dd></div>
            <div><dt>${UI.location}</dt><dd>${esc(PROFILE.location)}</dd></div>
          </dl>
          ${bar('HP', 100, 100, 'hp')}
          ${bar('MP', 100, 100, 'mp')}
          <div class="exp">
            <p class="exp__label">${fmt(UI.expTo, { level: PROFILE.level + 1 })}</p>
            <div class="bar bar--exp"><i style="--v:${PROFILE.expPercent}%"></i></div>
            <p class="exp__next">${esc(PROFILE.nextLevel)}</p>
          </div>
        </div>
      </div>
      <div class="win status__stats">
        <h2 class="sub">${UI.stats}</h2>
        <ul class="stats">
          ${PROFILE.stats.map((s) => `<li><span>${s.label}</span><b>${s.value}</b><i style="--v:${s.value}%"></i></li>`).join('')}
        </ul>
        <h2 class="sub">${UI.equipment}</h2>
        <ul class="equip">
          ${PROFILE.equipment.map((e) => `<li>${icon(e.icon, 2)}<span>${e.slot}</span><b>${esc(e.item)}</b></li>`).join('')}
        </ul>
        <h2 class="sub">${UI.party}</h2>
        <ul class="party">
          ${(['lili', 'todinho'] as CatName[])
            .map((c) => `<li><canvas data-cat="${c}" aria-hidden="true"></canvas><span><b>${PETS[c].name}</b><small>${esc(PETS[c].kind)}</small></span></li>`)
            .join('')}
        </ul>
      </div>
      <div class="win status__bio">
        <h2 class="sub">${UI.about}</h2>
        ${PROFILE.bio.map((p) => `<p>${esc(p)}</p>`).join('')}
      </div>
    </div>`,
  )
  hero = animateHero(app.querySelector('.status__hero canvas')!, wide() ? 6 : 4)
  cleanup.push(hero.stop)
  bindPoke(app.querySelector('.status__hero canvas')!)
  mountCats(app.querySelector('.party')!, 2)
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
      <p class="detail__meta"><span>${UI.usedIn}</span>${esc(s.usedIn)}</p>`
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
    <p class="tag">${q.kind === 'main' ? UI.questMain : UI.questSide}</p>
    <h2 class="detail__name">${icon(q.icon, 3)}<span>${esc(q.name)}</span></h2>
    <p class="detail__status"><span class="badge ${q.status === 'done' ? 'badge--done' : 'badge--wip'}">${q.status === 'done' ? UI.done : UI.wip}</span>${esc(q.when)}</p>
    <h3 class="sub">${UI.goal}</h3>
    <p class="detail__text">${esc(q.goal)}</p>
    <h3 class="sub">${UI.party}</h3>
    <p class="detail__text">${esc(q.party)}</p>
    <h3 class="sub">${UI.loot}</h3>
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
            <span class="quest__name">${esc(q.name)}<small>${q.kind === 'main' ? UI.kindMain : UI.kindSide}</small></span>
            <span class="badge ${q.status === 'done' ? 'badge--done' : 'badge--wip'}" title="${q.status === 'done' ? UI.done : UI.wip}">${q.status === 'done' ? '✓' : '…'}</span>
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
          ${j.badge ? `<span class="badge ${j.badge === 'now' ? 'badge--wip' : 'badge--done'}">${j.badge === 'now' ? UI.badgeNow : UI.badgeNew}</span>` : ''}
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
      <div class="letter__head">${icon('letter', 5)}<h2>${UI.letterTitle}</h2></div>
      <p class="letter__text"><span class="badge">${UI.open}</span> ${esc(PROFILE.openTo)}.</p>
      <p class="letter__text">${UI.letterBody}</p>
      <ul class="contact" role="list">
        ${LINKS.map(
          (l) => `
          <li><a class="cmd cmd--sm" href="${l.href}" ${l.copy ? 'data-copy' : 'target="_blank" rel="noopener noreferrer"'}>
            ${cursor()}${icon(l.icon, 2, 'contact__icon')}<span class="contact__label">${l.label}</span><span class="contact__handle">${esc(l.handle)} ${l.copy ? `<small>${UI.copy}</small>` : '↗'}</span>
          </a></li>`,
        ).join('')}
      </ul>
      ${complete ? `<p class="letter__ps">${icon('star', 2)} ${UI.ps}</p>` : ''}
      <p class="letter__sign">— Lucas</p>
    </div>`,
  )
  const links = [...app.querySelectorAll<HTMLAnchorElement>('.contact .cmd')]
  links.forEach((a) =>
    a.addEventListener('click', (e) => {
      sound.select()
      if (!a.hasAttribute('data-copy')) return
      // Copia o e-mail; se o navegador não deixar, segue o mailto normal.
      e.preventDefault()
      const address = a.href.replace(/^mailto:/, '')
      ;(navigator.clipboard?.writeText(address) ?? Promise.reject())
        .then(() => toast(`${icon('mail', 3)}<span>${UI.copied}</span>`, 'star'))
        .catch(() => (location.href = a.href))
    }),
  )
  nav.set(links)
}

function renderSecrets(start = 0) {
  const n = foundCount()
  const total = mySecrets().length
  screen(
    'secrets',
    'chest',
    `
    <div class="win secrets">
      <p class="secrets__lead">${fmt(UI.secretsLead, { total, n })}${n === total ? UI.secretsAll : ''}</p>
      <div class="bar bar--exp"><i style="--v:${Math.round((n / total) * 100)}%"></i></div>
      <ul class="secrets__list" role="list">
        ${mySecrets().map((s) => {
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
      <p class="secrets__note">${touch ? UI.secretsNoteTouch : UI.secretsNotePc}</p>
    </div>`,
  )
  nav.set([...app.querySelectorAll<HTMLElement>('.secret')], { start })
}

type OptionValue = boolean | TextSpeed | Lang
type Option = {
  key: keyof Settings
  label: string
  values: OptionValue[]
  show: (v: OptionValue) => string
}

/** As opções no idioma atual (os rótulos mudam quando o idioma muda). */
function options(): Option[] {
  const onOff = (v: OptionValue) => (v ? UI.on : UI.off)
  const onOffF = (v: OptionValue) => (v ? UI.onF : UI.offF)
  const speed: Record<TextSpeed, string> = { lenta: UI.speedSlow, normal: UI.speedNormal, rápida: UI.speedFast }
  return [
    { key: 'lang', label: UI.optLang, values: LANGS.map((l) => l.id), show: (v) => LANGS.find((l) => l.id === v)?.label ?? '' },
    { key: 'sfx', label: UI.optSfx, values: [true, false], show: onOff },
    { key: 'music', label: UI.optMusic, values: [false, true], show: onOffF },
    { key: 'crt', label: UI.optCrt, values: [true, false], show: onOff },
    { key: 'sakura', label: UI.optSakura, values: [true, false], show: onOffF },
    { key: 'textSpeed', label: UI.optText, values: ['lenta', 'normal', 'rápida'], show: (v) => speed[v as TextSpeed] },
  ]
}

/** Valor atual de uma opção (o idioma "vazio" é o do navegador, já aplicado em LANG). */
const current = (key: keyof Settings): OptionValue => (key === 'lang' ? save.settings.lang || LANG : save.settings[key])

function applySettings() {
  document.body.classList.toggle('crt-off', !save.settings.crt)
  scene.setSakura(save.settings.sakura)
}

/** Troca o idioma e redesenha a tela atual, mantendo o cursor no mesmo lugar. */
function setLanguage(lang: Lang) {
  save.settings.lang = lang
  persist()
  if (lang === LANG) return
  setLang(lang)
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en'
  sound.select()
  const keep = nav.index
  renderHud()
  render(route)
  if (keep < nav.items.length) nav.select(keep, false)
}

function renderOptions(start = 0) {
  let confirmReset = false
  const opts = options()
  screen(
    'options',
    'gear',
    `
    <div class="win options">
      <ul class="options__list" role="list">
        ${opts
          .map(
            (o) => `
          <li><button class="cmd cmd--sm option" type="button" data-key="${o.key}">
            ${cursor()}<span class="option__label">${o.label}</span>
            <span class="option__value">◀ <b>${o.show(current(o.key))}</b> ▶</span>
          </button></li>`,
          )
          .join('')}
        <li><button class="cmd cmd--sm option option--danger" type="button" data-reset>${cursor()}<span class="option__label">${UI.reset}</span><span class="option__value"><b data-reset-label>★ ${save.visited.length}/${SECTIONS.length}</b></span></button></li>
      </ul>
      <p class="options__hint">${touch ? UI.optionsHintTouch : UI.optionsHintKeys}</p>
    </div>`,
  )
  const buttons = [...app.querySelectorAll<HTMLButtonElement>('.option')]
  const cycle = (i: number, dir: -1 | 1) => {
    const o = opts[i]
    if (!o) return false
    const cur = o.values.indexOf(current(o.key))
    const next = o.values[(cur + dir + o.values.length) % o.values.length]
    if (o.key === 'lang') {
      setLanguage(next as Lang)
      return true
    }
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
      const opt = opts[j]
      if (opt) b.querySelector('.option__value b')!.textContent = opt.show(current(opt.key))
    })
    return true
  }
  buttons.forEach((b, i) =>
    b.addEventListener('click', () => {
      if (i < opts.length) return void cycle(i, 1)
      const label = b.querySelector('[data-reset-label]')!
      if (!confirmReset) {
        confirmReset = true
        sound.move()
        label.textContent = UI.resetConfirm
        return
      }
      resetSave()
      updateHud()
      sound.back()
      label.textContent = UI.resetDone
      toast(`<span>${UI.erased}</span>`)
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
startClock()
render(parse())
requestAnimationFrame(() => document.body.classList.add('is-ready'))
