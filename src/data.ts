// Conteúdo do portfólio. Os textos ficam em i18n/pt.ts e i18n/en.ts; aqui ficam os tipos,
// o que não muda com o idioma e as exportações do idioma ativo (trocadas por setLang).
import en from './i18n/en.ts'
import pt from './i18n/pt.ts'
import type { CatName, IconName } from './sprites.ts'

export type Lang = 'pt' | 'en'

export type Profile = {
  className: string
  location: string
  level: number
  levelNote: string
  nextLevel: string
  openTo: string
  expPercent: number
  bio: string[]
  stats: { label: string; value: number }[]
  equipment: { slot: string; item: string; icon: IconName }[]
}

export type Skill = { name: string; type: string; icon: IconName; text: string; usedIn: string }

export type QuestLink = { label: string; href: string }
export type Quest = {
  id: string
  kind: 'main' | 'side'
  name: string
  status: 'done' | 'wip'
  when: string
  icon: IconName
  goal: string
  party: string
  loot: string[]
  links: QuestLink[]
}

export type JourneyEntry = { when: string; title: string; place: string; icon: IconName; badge?: 'new' | 'now' }

export type Section = 'status' | 'skills' | 'quests' | 'journey' | 'contact'
export type MenuEntry = { route: Section | 'secrets' | 'options'; label: string; jp: string; icon: IconName; hint: string }

export type SecretId = 'poke' | 'sleep' | 'rabbit' | 'nia' | 'casamy' | 'konami' | 'pets' | 'console' | 'rotate'
export type Secret = { id: SecretId; name: string; found: string; pc: string; touch: string; only?: 'pc' | 'touch' }

/** Os gatos do Lucas: nome, descrição e o que dizem ao receber carinho. */
export type Pet = { name: string; kind: string; lines: string[] }

export type ContentShape = {
  profile: Profile
  skills: Skill[]
  quests: Quest[]
  journey: JourneyEntry[]
  menu: MenuEntry[]
  intro: { keyboard: string[]; touch: string[]; back: string }
  eggs: { poke: Record<number, string>; [line: string]: string | Record<number, string> }
  secrets: Secret[]
  pets: Record<CatName, Pet>
  ui: Record<string, string>
}

const CONTENT = { pt, en }

export const LANGS: { id: Lang; label: string; flag: IconName }[] = [
  { id: 'pt', label: 'PT-BR', flag: 'flagBR' },
  { id: 'en', label: 'EN', flag: 'flagUS' },
]

/** Idioma do navegador, para a primeira visita. */
export const browserLang = (): Lang => (navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en')

// Exportações "vivas": quem importa vê o idioma novo depois de setLang.
export let PROFILE: Profile = pt.profile
export let SKILLS: Skill[] = pt.skills
export let QUESTS: Quest[] = pt.quests
export let JOURNEY: JourneyEntry[] = pt.journey
export let MENU: MenuEntry[] = pt.menu
export let INTRO: ContentShape['intro'] = pt.intro
export let EGGS: typeof pt.eggs = pt.eggs
export let SECRETS: Secret[] = pt.secrets
export let PETS: Record<CatName, Pet> = pt.pets
export let UI: Record<keyof typeof pt.ui, string> = pt.ui
export let LANG: Lang = 'pt'

export function setLang(lang: Lang) {
  const c = CONTENT[lang]
  LANG = lang
  PROFILE = c.profile
  SKILLS = c.skills
  QUESTS = c.quests
  JOURNEY = c.journey
  MENU = c.menu
  INTRO = c.intro
  EGGS = c.eggs
  SECRETS = c.secrets
  PETS = c.pets
  UI = c.ui
}

/** Troca {chave} por valores: fmt(UI.expTo, { level: 2 }). */
export const fmt = (text: string, vars: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))

export const SECTIONS: Section[] = ['status', 'skills', 'quests', 'journey', 'contact']

/** `copy`: o clique copia o texto em vez de abrir o link (e-mail sem depender de app de e-mail). */
export type ContactLink = { label: string; handle: string; href: string; icon: IconName; copy?: boolean }

export const LINKS: ContactLink[] = [
  { label: 'E-MAIL', handle: 'lucas.assistente@mail.grokbot.com', href: 'mailto:lucas.assistente@mail.grokbot.com', icon: 'mail', copy: true },
  { label: 'LINKEDIN', handle: 'Lucas Boroto', href: 'https://www.linkedin.com/in/lucas-boroto/', icon: 'linkedin' },
  { label: 'GITHUB', handle: 'LucasLangley', href: 'https://github.com/LucasLangley', icon: 'github' },
  { label: 'X', handle: '@Borotos00', href: 'https://x.com/Borotos00', icon: 'x' },
  { label: 'INSTAGRAM', handle: '@lucas_boroto04', href: 'https://instagram.com/lucas_boroto04/', icon: 'instagram' },
  { label: 'CASAMY', handle: 'casamy.com.br', href: 'https://casamy.com.br', icon: 'casamy' },
]
