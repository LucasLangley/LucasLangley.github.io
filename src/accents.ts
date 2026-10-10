// A Press Start 2P encolhe a maiúscula acentuada para o acento caber na mesma célula 8x8 ("MISSÕES" vira "MISSõES").
// Aqui a letra aparece em tamanho cheio e o acento é desenhado por cima, em pixels de 1/8 de em.
// O caractere original continua no texto para leitores de tela.

const MARKS: Record<string, [number, number][]> = {
  acute: [[4, -3], [5, -3], [3, -2], [4, -2]],
  grave: [[1, -3], [2, -3], [2, -2], [3, -2]],
  circ: [[2, -3], [3, -3], [4, -3], [1, -2], [5, -2]],
  tilde: [[2, -3], [3, -3], [6, -3], [1, -2], [4, -2], [5, -2]],
}

const LETTERS: Record<string, [string, keyof typeof MARKS]> = {
  Á: ['A', 'acute'],
  É: ['E', 'acute'],
  Í: ['I', 'acute'],
  Ó: ['O', 'acute'],
  Ú: ['U', 'acute'],
  À: ['A', 'grave'],
  Â: ['A', 'circ'],
  Ê: ['E', 'circ'],
  Ô: ['O', 'circ'],
  Ã: ['A', 'tilde'],
  Õ: ['O', 'tilde'],
}

const ACCENTED = new RegExp(`[${Object.keys(LETTERS).join('')}]`)

function css(): string {
  const px = (x: number, y: number, color: string) => `calc(${x} * var(--u)) calc(${y} * var(--u)) 0 ${color}`
  const rules = Object.entries(MARKS).map(([name, dots]) => {
    const front = dots.map(([x, y]) => px(x, y, 'currentColor'))
    const shade = dots.map(([x, y]) => px(x + 1, y + 1, 'var(--ink)'))
    return `.acc--${name}::after { box-shadow: ${[...front, ...shade].join(', ')}; }`
  })
  return `
    .acc { position: relative; --u: 0.125em; }
    .acc::after { content: ''; position: absolute; left: 0; top: 0; width: var(--u); height: var(--u); pointer-events: none; }
    .letter .acc::after, .btn .acc::after, .badge .acc::after { --ink: transparent; }
    ${rules.join('\n')}`
}

function usesPixelFont(el: Element): boolean {
  return getComputedStyle(el).fontFamily.includes('Press Start')
}

function fix(node: Text) {
  const parent = node.parentElement
  if (!parent || !ACCENTED.test(node.data) || parent.closest('.acc') || !usesPixelFont(parent)) return
  const frag = document.createDocumentFragment()
  let plain = ''
  for (const ch of node.data) {
    const hit = LETTERS[ch]
    if (!hit) {
      plain += ch
      continue
    }
    if (plain) frag.append(plain)
    plain = ''
    const span = document.createElement('span')
    span.className = `acc acc--${hit[1]}`
    const real = document.createElement('span')
    real.className = 'sr-only'
    real.textContent = ch
    const shown = document.createElement('span')
    shown.setAttribute('aria-hidden', 'true')
    shown.textContent = hit[0]
    span.append(real, shown)
    frag.append(span)
  }
  if (plain) frag.append(plain)
  node.replaceWith(frag)
}

function scan(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) return fix(root as Text)
  if (root.nodeType !== Node.ELEMENT_NODE) return
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)
  nodes.forEach(fix)
}

/** Corrige os acentos já na página e em tudo que entrar depois. */
export function pixelAccents() {
  const style = document.createElement('style')
  style.textContent = css()
  document.head.append(style)
  scan(document.body)
  new MutationObserver((changes) => {
    for (const c of changes) {
      if (c.type === 'characterData') fix(c.target as Text)
      else c.addedNodes.forEach(scan)
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true })
}
