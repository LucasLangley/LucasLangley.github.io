// "Save" do visitante no localStorage. Tudo tolera storage bloqueado (aba anônima, cookies desligados).
import type { Section } from './data.ts'

export type TextSpeed = 'lenta' | 'normal' | 'rápida'

export type Settings = {
  sfx: boolean
  music: boolean
  crt: boolean
  sakura: boolean
  textSpeed: TextSpeed
}

type Save = {
  visited: Section[]
  playMs: number
  introSeen: boolean
  secret: boolean
  settings: Settings
}

const KEY = 'lucas-boroto-portfolio:v1'

const DEFAULTS: Save = {
  visited: [],
  playMs: 0,
  introSeen: false,
  secret: false,
  settings: { sfx: true, music: false, crt: true, sakura: true, textSpeed: 'normal' },
}

function read(): Save {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return structuredClone(DEFAULTS)
    const data = JSON.parse(raw) as Partial<Save>
    return { ...structuredClone(DEFAULTS), ...data, settings: { ...DEFAULTS.settings, ...data.settings } }
  } catch {
    return structuredClone(DEFAULTS)
  }
}

export const save: Save = read()

/** Havia um save antes desta visita? Decide se o título oferece CONTINUAR. */
export const hadSave = save.introSeen

export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(save))
  } catch {
    // sem storage: o progresso vale só para esta aba
  }
}

/** Marca a seção como visitada. Devolve true se for a primeira vez. */
export function visit(section: Section): boolean {
  if (save.visited.includes(section)) return false
  save.visited.push(section)
  persist()
  return true
}

export function resetSave() {
  const settings = save.settings
  Object.assign(save, structuredClone(DEFAULTS), { settings })
  persist()
}
