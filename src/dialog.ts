// Texto de caixa de diálogo, letra por letra. O texto inteiro vai já para leitores de tela.
import { sound } from './audio.ts'
import { save } from './store.ts'

const DELAY = { lenta: 45, normal: 24, rápida: 9 } as const

export class Typewriter {
  private timer: number | undefined
  private full = ''
  private done: (() => void) | undefined
  typing = false

  constructor(
    private el: HTMLElement,
    private live: HTMLElement,
  ) {}

  type(text: string, opts: { fast?: boolean } = {}): Promise<void> {
    this.cancel()
    this.full = text
    this.live.textContent = text
    this.el.textContent = ''
    this.typing = true
    const delay = opts.fast ? Math.min(12, DELAY[save.settings.textSpeed]) : DELAY[save.settings.textSpeed]
    let i = 0
    return new Promise((resolve) => {
      this.done = resolve
      this.timer = window.setInterval(() => {
        i++
        this.el.textContent = text.slice(0, i)
        if (i % 3 === 1 && text[i - 1] !== ' ') sound.text()
        if (i >= text.length) this.finish()
      }, delay)
    })
  }

  /** Mostra o texto inteiro de uma vez. */
  finish() {
    window.clearInterval(this.timer)
    this.el.textContent = this.full
    this.typing = false
    const done = this.done
    this.done = undefined
    done?.()
  }

  cancel() {
    window.clearInterval(this.timer)
    this.typing = false
    this.done = undefined
  }
}
