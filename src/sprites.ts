// Pixel art desenhada como texto: cada caractere é um pixel, '.' é transparente.
// Arquivo sem DOM, para os scripts de Node (prévia e imagem OG) usarem também.

export const PALETTE: Record<string, string> = {
  K: '#1b1530', // contorno
  H: '#2d2a52', // cabelo
  h: '#5b5ea6', // brilho do cabelo
  S: '#ffd3b0', // pele
  s: '#e8a27f', // sombra da pele
  w: '#ffffff',
  I: '#2b2560', // íris escura
  j: '#5a72d8', // íris clara
  B: '#ff8f8f', // bochecha
  M: '#b03a48', // boca
  R: '#e5484d', // moletom
  r: '#a52a3f', // sombra do moletom
  W: '#f2f2f2',
  P: '#2a3060', // calça
  p: '#1a1e40',
  G: '#59e0ff',
  g: '#2a8fb8',
  Y: '#ffd23f',
  y: '#c98a1a',
  O: '#ff9f43',
  N: '#6bd66b',
  n: '#2f8f4f',
  V: '#b57cff',
  v: '#6a3fb8',
  L: '#9aa3d6',
  b: '#0a66c2', // azul do LinkedIn
  q: '#a3966a', // coelho da lua
  e: '#7a5530', // madeira do pilão
  o: '#fffaf0', // mochi
  // Bandeiras
  Q: '#1f9d55',
  u: '#2b4fb3',
  // Logo do Casamy (cores tiradas do ícone oficial do app)
  f: '#faf7f2',
  k: '#1a1916',
  A: '#f6b093',
  E: '#c5d39a',
  F: '#b3c8ec',
  J: '#a6dcd1',
  U: '#f0d67e',
  T: '#f2b632',
  D: '#4a4f7a',
  C: '#ff5c8a',
  c: '#b8305e',
}

export type Sprite = string[]

const HERO_HEAD: Sprite = [
  '..........K.....K.......',
  '.........KHK...KHK......',
  '...K....KHHK..KHHK......',
  '...KHK..KHHHKKHHHHK.KK..',
  '....KHHKHHHHHHHHHHHKHK..',
  '....KHHHHhhHHHHHHhHHHK..',
  '...KHHHHhHHHHHHHHHhHHHK.',
  '..KHHHHHHHHHHHHHHHHHHHK.',
  '..KHHHHHHHHHHHHHHHHHHHK.',
  '.KHHHHHHHHHHHHHHHHHHHHHK',
  '.KHHHHHHHHHHHHHHHHHHHHK.',
  '.KHHSHHHSSHSSSHSSHHSHHK.',
  '..KHSKKKKSSSSSSKKKKSHK..',
  '..KHSSIIwSSSSSSIIwSSHK..',
  '..KHSSjjjSSSSSSjjjSSHK..',
  '..KHSBBSSSSSSSSSSBBSHK..',
  '...KSSSSSSSMMSSSSSSSK...',
  '....KKSSSSSSSSSSSSKK....',
  '.......KKKssssKKK.......',
]

const HERO_BODY: Sprite = [
  '....KKRRRRWssWRRRRKK....',
  '...KRRRRRRWRRWRRRRRRK...',
  '..KrRRRRRRWRRWRRRRRRrK..',
  '..KrRRRRRRRRRRRRRRRRrK..',
  '.KrrKRRRRRRRRRRRRRRKrrK.',
  '.KrrKRRRrrrrrrrrRRRKrrK.',
  '.KSSKRRRRRRRRRRRRRRKSSK.',
  '..KK.KRRRRRRRRRRRRK.KK..',
  '.....KrrrrrrrrrrrrK.....',
  '.....KPPPPPPPPPPPPK.....',
  '.....KPPPPPKKPPPPPK.....',
  '....KWWWWWK..KWWWWWK....',
  '....KKKKKKK..KKKKKKK....',
]

export const HERO: Sprite = [...HERO_HEAD, ...HERO_BODY]

/** Troca linhas inteiras de um sprite (para quadros de animação). */
function withRows(base: Sprite, rows: Record<number, string>): Sprite {
  return base.map((line, i) => rows[i] ?? line)
}

export const HERO_BLINK = withRows(HERO, {
  12: '..KHSSSSSSSSSSSSSSSSHK..',
  13: '..KHSKKKKSSSSSSKKKKSHK..',
  14: '..KHSSSSSSSSSSSSSSSSHK..',
})

export const HERO_HAPPY = withRows(HERO, {
  12: '..KHSSKKSSSSSSSSKKSSHK..',
  13: '..KHSKSSKSSSSSSKSSKSHK..',
  14: '..KHSSSSSSSSSSSSSSSSHK..',
  16: '...KSSSSSSMSSMSSSSSSK...',
  17: '....KKSSSSSMMSSSSSKK....',
})

/** Quadro do "respiro": tudo desce um pixel, menos os pés. */
export function breathe(sprite: Sprite): Sprite {
  const blank = '.'.repeat(sprite[0].length)
  return [blank, ...sprite.slice(0, 28), ...sprite.slice(29)]
}

/** Nia, a assistente do Casamy (easter egg). Mesmo tamanho do retrato do Lucas. */
export const NIA: Sprite = [
  '..........KKKK..........',
  '.........KVVVVK.........',
  '.........KVVVvK.........',
  '......KKKKVVVVKKKK......',
  '.....KVVVVVVVVVVVVK.....',
  '....KVVVVVVVVVVVVVVK....',
  '...KVVVVVVVVVVVVVVVVK...',
  '...KVVVVVVVVVVVVVVYVK...',
  '..KVVVVVVVVVVVVVVYYYVK..',
  '..KVVVSVVVVVVVVSVVYVVK..',
  '..KVVSSSVVSSVVSSSVVVVK..',
  '..KVSSSSSSSSSSSSSSSSVK..',
  '..KVSKKKKSSSSSSKKKKSVK..',
  '..KVSSggwSSSSSSggwSSVK..',
  '..KVSSGGGSSSSSSGGGSSVK..',
  '..KVSBBSSSSSSSSSSBBSVK..',
  '..KvKSSSSSSMMSSSSSSKvK..',
  '..KvvKKSSSSSSSSSSKKvvK..',
  '..KKKK.KKKssssKKK.KKKK..',
]

/** Coelho da lua socando mochi (月のうさぎ), dois quadros: pilão em cima e embaixo. */
export const RABBIT: [Sprite, Sprite] = [
  [
    '.q.q.....ee...',
    '.q.q.....ee...',
    '.qqq......e...',
    'qqqqq....e....',
    'qqqqqq..e.....',
    '.qqqqqqe......',
    '.qqqqq........',
    '.qqqqq...ooo..',
    '..qqqq..eeeee.',
    '.qq.qq...eee..',
  ],
  [
    '.q.q..........',
    '.q.q..........',
    '.qqq..........',
    'qqqqq.........',
    'qqqqqq........',
    '.qqqqqqeeeee..',
    '.qqqqq..eee...',
    '.qqqqq..eee...',
    '..qqqq.eeeeee.',
    '.qq.qq...eee..',
  ],
]

/** Só a cabeça, para o retrato da caixa de diálogo. */
export const PORTRAIT: Sprite = HERO_HEAD
export const PORTRAIT_BLINK = HERO_BLINK.slice(0, HERO_HEAD.length)
export const PORTRAIT_HAPPY = HERO_HAPPY.slice(0, HERO_HEAD.length)

export const ICONS = {
  phone: [
    '..KKKK..',
    '.KDDDDK.',
    '.KGGGGK.',
    '.KGwGGK.',
    '.KGGGgK.',
    '.KGGggK.',
    '.KDDWDK.',
    '..KKKK..',
  ],
  globe: [
    '..KKKK..',
    '.KGNNGK.',
    'KGNNGGGK',
    'KGGNNNGK',
    'KGGGNNGK',
    'KGNGGNGK',
    '.KGGNGK.',
    '..KKKK..',
  ],
  database: [
    '.KKKKKK.',
    'KLWWWWLK',
    'KDLLLLDK',
    'KLDDDDLK',
    'KDLLLLDK',
    'KLDDDDLK',
    'KDLLLLDK',
    '.KKKKKK.',
  ],
  spark: [
    '....K....',
    '...KYK...',
    '...KYK...',
    '.KKYYYKK.',
    'KYYYwYYYK',
    '.KKYYYKK.',
    '...KYK...',
    '...KYK...',
    '....K....',
  ],
  coin: [
    '..KKKK..',
    '.KYYYYK.',
    'KYwYYYyK',
    'KYYKyYyK',
    'KYYKyYyK',
    'KYYYYyyK',
    '.KyyyyK.',
    '..KKKK..',
  ],
  chart: [
    'K.......',
    'K.....N.',
    'K....NN.',
    'K.N..NN.',
    'K.NN.NN.',
    'K.NNNNN.',
    'K.NNNNN.',
    'KKKKKKKK',
  ],
  shield: [
    'KKKKKKKK',
    'KGGGGggK',
    'KGwGGggK',
    'KGGGGggK',
    '.KGGGgK.',
    '.KGGggK.',
    '..KGgK..',
    '...KK...',
  ],
  pen: [
    '......KK',
    '.....KCK',
    '....KCcK',
    '...KCcK.',
    '..KCcK..',
    '.KYYK...',
    'KYyK....',
    'KKK.....',
  ],
  house: [
    '...KK...',
    '..KRRK..',
    '.KRRRRK.',
    'KRRRRRRK',
    '.KWWWWK.',
    '.KWKKWK.',
    '.KWKYWK.',
    '.KKKKKK.',
  ],
  linkedin: [
    '.KKKKKKKKKK.',
    'KbbbbbbbbbbK',
    'KbwwbbbbbbbK',
    'KbwwbbbbbbbK',
    'KbbbbbbbbbbK',
    'KbwwbwwwwbbK',
    'KbwwbwwbwwbK',
    'KbwwbwwbwwbK',
    'KbwwbwwbwwbK',
    'KbwwbwwbwwbK',
    'KbbbbbbbbbbK',
    '.KKKKKKKKKK.',
  ],
  x: [
    '.KKKKKKKKKK.',
    'KwwKKKKKKKwK',
    'KKwwKKKKKwKK',
    'KKKwwKKKwKKK',
    'KKKKwwKwKKKK',
    'KKKKKwwKKKKK',
    'KKKKKwwwKKKK',
    'KKKKwKKwwKKK',
    'KKKwKKKKwwKK',
    'KKwKKKKKKwwK',
    'KwKKKKKKKKwK',
    '.KKKKKKKKKK.',
  ],
  flagBR: [
    '.KKKKKKKKKKKK.',
    'KQQQQQYYQQQQQK',
    'KQQQYYYYYYQQQK',
    'KQYYYuuuuYYYQK',
    'KYYYuuuuuuYYYK',
    'KYYYwwwwwwYYYK',
    'KYYYuuuuuuYYYK',
    'KQYYYuuuuYYYQK',
    'KQQQYYYYYYQQQK',
    'KQQQQQYYQQQQQK',
    '.KKKKKKKKKKKK.',
  ],
  flagUS: [
    '.KKKKKKKKKKKK.',
    'KuuuuuuRRRRRRK',
    'KuwuwuuWWWWWWK',
    'KuuwuwuRRRRRRK',
    'KuwuwuuWWWWWWK',
    'KuuuuuuRRRRRRK',
    'KWWWWWWWWWWWWK',
    'KRRRRRRRRRRRRK',
    'KWWWWWWWWWWWWK',
    'KRRRRRRRRRRRRK',
    '.KKKKKKKKKKKK.',
  ],
  mail: [
    'KKKKKKKKKKKK',
    'KWKWWWWWWKWK',
    'KWWKWWWWKWWK',
    'KWWWKWWKWWWK',
    'KWWWWKKWWWWK',
    'KWWWWWWWWWWK',
    'KWWWWWWWWWWK',
    'KKKKKKKKKKKK',
  ],
  chest: [
    '.KKKKKKKK.',
    'KeeeeeeeeK',
    'KYeeeeeeYK',
    'KKKKYYKKKK',
    'KYeeYyeeYK',
    'KYeeeeeeYK',
    'KYeeeeeeYK',
    'KKKKKKKKKK',
  ],
  chestOpen: [
    '.KKKKKKKK.',
    'KeeeeeeeeK',
    'KKYYwYYYKK',
    'KYYwYYwYYK',
    'KKKKKKKKKK',
    'KYeeeeeeYK',
    'KYeeeeeeYK',
    'KKKKKKKKKK',
  ],
  casamy: [
    '.KKKKKKKKKK.',
    'KffffffffffK',
    'KffffkkffffK',
    'KfffkkkkfffK',
    'KffkkkkkkffK',
    'KfkkkkkkkkfK',
    'KfAAfEEfFFfK',
    'KfAAfEEfFFfK',
    'KffffffffffK',
    'KfJJfkkfUUfK',
    'KfJJfkTfUUfK',
    'KffffkkffffK',
    '.KKKKKKKKKK.',
  ],
  github: [
    '...KKKKKK...',
    '.KKKKKKKKKK.',
    '.KwKKKKKKwK.',
    'KKwwKKKKwwKK',
    'KKwwwwwwwwKK',
    'KKwwwwwwwwKK',
    'KKwwwwwwwwKK',
    'KKKwwwwwwKKK',
    'KwKKwwwwKKKK',
    '.KwwwwwwKKK.',
    '.KKKwKKwKKK.',
    '...KKKKKK...',
  ],
  instagram: [
    '.KKKKKKKKKK.',
    'KvvVVVVVVVVK',
    'KvVwwwwwwVVK',
    'KVwVVVVwVwVK',
    'KCwCCwwCCwCK',
    'KCwCwCCwCwCK',
    'KCwCwCCwCwCK',
    'KCwCCwwCCwCK',
    'KOwOOOOOOwOK',
    'KYOwwwwwwOOK',
    'KYYOOOOOOOOK',
    '.KKKKKKKKKK.',
  ],
  letter: [
    'KKKKKKKKK',
    'KWKWWWKWK',
    'KWWKWKWWK',
    'KWWWKWWWK',
    'KWWWWWWWK',
    'KKKKKKKKK',
  ],
  star: [
    '....K....',
    '...KYK...',
    '...KYK...',
    'KKKYYYKKK',
    'KYYYwYYYK',
    '.KYYYYYK.',
    '.KYYKYYK.',
    'KYYK.KYYK',
    'KKK...KKK',
  ],
  heart: [
    '.KK.KK.',
    'KCCKCCK',
    'KCwCCCK',
    'KCCCCCK',
    '.KCCCK.',
    '..KCK..',
    '...K...',
  ],
  cursor: [
    '...KKKK.....',
    '..KWWWWKKKK.',
    '.KWWWWWWWWWK',
    'KWWWWLKKKKK.',
    'KWWWWWWK....',
    'KWWWWLK.....',
    '.KWWWWK.....',
    '..KKKK......',
  ],
  gear: [
    '...KK...',
    '.KKLLKK.',
    '.KLLLLK.',
    'KLLKKLLK',
    'KLLKKLLK',
    '.KLLLLK.',
    '.KKLLKK.',
    '...KK...',
  ],
  scroll: [
    '.KKKKKKK.',
    'KWLKWWWWK',
    '.KKWWWWK.',
    '..KWLLWK.',
    '..KWWWWK.',
    '..KWLLWK.',
    '.KWWWWKK.',
    'KWWWWKWLK',
    '.KKKKKKK.',
  ],
} satisfies Record<string, Sprite>

export type IconName = keyof typeof ICONS

/** Converte um sprite em pixels RGBA, um pixel de sprite por `scale` pixels. */
export function spriteToRGBA(sprite: Sprite, scale = 1): { width: number; height: number; data: Uint8Array } {
  const w = Math.max(...sprite.map((r) => r.length))
  const h = sprite.length
  const width = w * scale
  const height = h * scale
  const data = new Uint8Array(width * height * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const hex = PALETTE[sprite[y][x] ?? '.']
      if (!hex) continue
      const [r, g, b] = hexToRGB(hex)
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const i = ((y * scale + dy) * width + (x * scale + dx)) * 4
          data[i] = r
          data[i + 1] = g
          data[i + 2] = b
          data[i + 3] = 255
        }
      }
    }
  }
  return { width, height, data }
}

export function hexToRGB(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
