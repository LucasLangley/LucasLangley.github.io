// Todo o conteúdo do portfólio. Para mudar um texto, mude aqui; o layout não precisa ser tocado.
import type { IconName } from './sprites.ts'

export const PROFILE = {
  name: 'Lucas Boroto',
  className: 'DEV FUNDADOR',
  title: 'Programador júnior · fundador do Casamy',
  location: 'Taubaté, SP',
  level: 1,
  levelNote: '1 app na App Store',
  nextLevel: 'Casamy no Android e na web',
  // Do LinkedIn (Open to work): onde topa trabalhar.
  openTo: 'Presencial, híbrido ou remoto, a partir de Taubaté (SP)',
  expPercent: 35,
  bio: [
    'Sou programador júnior na Hermanos TI, em Taubaté, desde junho de 2025.',
    'Também sou fundador solo do Casamy: o app que monta a lista do que falta na casa nova. Ele chegou à App Store em outubro de 2026.',
    'Uso IA no fluxo diário de desenvolvimento para iterar rápido e lançar atualizações com frequência.',
    'Comecei por redes e segurança, com a trilha da Cisco Networking Academy (CCNA e cibersegurança).',
  ],
  stats: [
    { label: 'CÓDIGO', value: 100 },
    { label: 'PRODUTO', value: 100 },
    { label: 'DESIGN', value: 100 },
    { label: 'REDES', value: 100 },
    { label: 'IA', value: 100 },
    { label: 'FÔLEGO', value: 100 },
  ],
  equipment: [
    { slot: 'ARMA', item: 'TypeScript', icon: 'scroll' },
    { slot: 'ESCUDO', item: 'Supabase + RLS', icon: 'shield' },
    { slot: 'ACESSÓRIO', item: 'Claude (IA)', icon: 'spark' },
    { slot: 'ITEM', item: 'Figma', icon: 'pen' },
  ] satisfies { slot: string; item: string; icon: IconName }[],
}

export type Skill = { name: string; type: string; icon: IconName; text: string; usedIn: string }

export const SKILLS: Skill[] = [
  {
    name: 'React Native',
    type: 'MOBILE',
    icon: 'phone',
    text: 'O app do Casamy é Expo + React Native: Expo Router, Reanimated, login com Apple e Google, notificações e compras dentro do app.',
    usedIn: 'Casamy (iOS)',
  },
  {
    name: 'TypeScript',
    type: 'LINGUAGEM',
    icon: 'scroll',
    text: 'Tudo no Casamy é TypeScript: o app, o site e as funções do servidor. Este portfólio também.',
    usedIn: 'Casamy · este portfólio',
  },
  {
    name: 'Next.js',
    type: 'WEB',
    icon: 'globe',
    text: 'O site casamy.com.br e o link da família, que abre no navegador sem instalar nada.',
    usedIn: 'casamy.com.br',
  },
  {
    name: 'Supabase',
    type: 'BACKEND',
    icon: 'database',
    text: 'Postgres com RLS em toda tabela, Edge Functions em Deno e migrações versionadas com testes.',
    usedIn: 'Casamy',
  },
  {
    name: 'Claude API',
    type: 'IA',
    icon: 'spark',
    text: 'A Nia, assistente do Casamy: responde com a lista da casa e só muda alguma coisa depois do toque de quem usa.',
    usedIn: 'Nia, no Casamy',
  },
  {
    name: 'Dev com IA',
    type: 'IA',
    icon: 'spark',
    text: 'Desenvolvo com agentes de IA no dia a dia para iterar rápido e lançar atualizações com frequência.',
    usedIn: 'Casamy · este portfólio',
  },
  {
    name: 'Pagamentos',
    type: 'MONETIZAÇÃO',
    icon: 'coin',
    text: 'Assinaturas pela App Store com RevenueCat, e Stripe e Pix (Woovi) na web, com webhooks.',
    usedIn: 'Casamy',
  },
  {
    name: 'Métricas',
    type: 'PRODUTO',
    icon: 'chart',
    text: 'Eventos no PostHog e erros no Sentry. Toda feature nasce com o evento que prova que ela funciona.',
    usedIn: 'Casamy',
  },
  {
    name: 'Figma + CSS',
    type: 'DESIGN',
    icon: 'pen',
    text: 'Interface desenhada no Figma e CSS escrito à mão, como as janelas e os pixels deste portfólio.',
    usedIn: 'Casamy · este portfólio',
  },
  {
    name: 'Redes',
    type: 'CISCO',
    icon: 'shield',
    text: 'CCNA: Introduction to Networks, Networking Basics, Endpoint Security e Introdução à Cibersegurança.',
    usedIn: 'Cisco Networking Academy',
  },
  {
    name: 'Python',
    type: 'LINGUAGEM',
    icon: 'scroll',
    text: 'Python Essentials 1, pela Cisco Networking Academy.',
    usedIn: 'Cisco Networking Academy',
  },
  {
    name: 'Suporte de TI',
    type: 'TI',
    icon: 'gear',
    text: 'Suporte técnico, manutenção de computadores e Windows.',
    usedIn: 'Hermanos TI · SENAI',
  },
]

export type QuestLink = { label: string; href: string }
export type Quest = {
  id: string
  kind: 'PRINCIPAL' | 'SECUNDÁRIA'
  name: string
  status: 'CONCLUÍDA' | 'EM ANDAMENTO'
  when: string
  icon: IconName
  goal: string
  party: string
  loot: string[]
  links: QuestLink[]
}

export const QUESTS: Quest[] = [
  {
    id: 'casamy',
    kind: 'PRINCIPAL',
    name: 'Casamy',
    status: 'CONCLUÍDA',
    when: 'Lançado na App Store · out 2026',
    icon: 'casamy',
    goal: 'Mostrar a quem vai montar a casa nova o que ainda falta, cômodo por cômodo e com preço, e deixar a família reservar presentes sem repetir.',
    party: 'Solo: produto, código, design e lançamento',
    loot: [
      'Quiz de 3 minutos que monta a lista da casa',
      '164 itens no catálogo, 8 tipos de cômodo',
      'Link da família: abre no navegador, sem instalar',
      'Nia, a assistente com IA',
      'Orçamento por cômodo e total',
    ],
    links: [
      { label: 'SITE', href: 'https://casamy.com.br' },
      { label: 'APP STORE', href: 'https://apps.apple.com/app/id6814494833' },
    ],
  },
  {
    id: 'casamy-next',
    kind: 'SECUNDÁRIA',
    name: 'Casamy: Android e web',
    status: 'EM ANDAMENTO',
    when: 'Próxima etapa',
    icon: 'phone',
    goal: 'Levar o Casamy para quem não usa iPhone: versão para Android e versão web.',
    party: 'Solo',
    loot: ['Mais casas montadas', 'Família inteira na mesma lista, em qualquer celular'],
    links: [],
  },
  {
    id: 'portfolio',
    kind: 'SECUNDÁRIA',
    name: 'Este portfólio',
    status: 'CONCLUÍDA',
    when: 'out 2026',
    icon: 'star',
    goal: 'Transformar o portfólio num menu de JRPG em pixel art, feito do zero.',
    party: 'Solo, com IA',
    loot: [
      'Sprites desenhados como texto, pixel a pixel',
      'Cenário em canvas que muda a cada visita',
      'Sons e música 8-bit gerados no navegador',
      'Funciona no teclado, no mouse e no toque',
    ],
    links: [{ label: 'GITHUB', href: 'https://github.com/LucasLangley/LucasLangley.github.io' }],
  },
  {
    id: 'cisco',
    kind: 'SECUNDÁRIA',
    name: 'Trilha Cisco',
    status: 'CONCLUÍDA',
    when: '2024 – 2025',
    icon: 'shield',
    goal: 'Aprender redes e segurança pela Cisco Networking Academy.',
    party: 'SENAI Taubaté',
    loot: [
      'Carta de honraria da Cisco Networking Academy',
      'CCNA: Introduction to Networks',
      'Endpoint Security · Introdução à Cibersegurança',
      'Networking Basics · Introduction to IoT · Python Essentials 1',
    ],
    links: [],
  },
]

export type JourneyEntry = { when: string; title: string; place: string; icon: IconName; badge?: string }

export const JOURNEY: JourneyEntry[] = [
  { when: 'OUT 2026', title: 'Lança o Casamy na App Store', place: 'Fundador solo', icon: 'casamy', badge: 'NOVO!' },
  { when: 'JUN 2025', title: 'Programador Júnior', place: 'Hermanos TI · contrato · Taubaté', icon: 'phone', badge: 'ATUAL' },
  { when: 'FEV 2025', title: 'Introduction to IoT', place: 'Cisco', icon: 'shield' },
  { when: 'JUN 2024', title: 'CCNA: Introduction to Networks', place: 'Cisco · com carta de honraria', icon: 'shield' },
  { when: 'ABR 2024', title: 'Networking Basics', place: 'Cisco', icon: 'shield' },
  { when: 'MAR 2024', title: 'Cibersegurança, Endpoint Security e Python', place: 'Cisco', icon: 'shield' },
  { when: 'FORMAÇÃO', title: 'SENAI Taubaté', place: 'Escola e Faculdade SENAI Félix Guisard', icon: 'scroll' },
]

/** `copy`: o clique copia o texto em vez de abrir o link (e-mail sem depender de app de e-mail). */
export type ContactLink = { label: string; handle: string; href: string; icon: IconName; copy?: boolean }

export const LINKS: ContactLink[] = [
  { label: 'E-MAIL', handle: 'lucasgrok@mail.grokbot.com', href: 'mailto:lucasgrok@mail.grokbot.com', icon: 'mail', copy: true },
  { label: 'LINKEDIN', handle: 'Lucas Boroto', href: 'https://www.linkedin.com/in/lucas-boroto/', icon: 'linkedin' },
  { label: 'GITHUB', handle: 'LucasLangley', href: 'https://github.com/LucasLangley', icon: 'github' },
  { label: 'X', handle: '@Borotos00', href: 'https://x.com/Borotos00', icon: 'x' },
  { label: 'INSTAGRAM', handle: '@lucas_boroto04', href: 'https://instagram.com/lucas_boroto04/', icon: 'instagram' },
  { label: 'CASAMY', handle: 'casamy.com.br', href: 'https://casamy.com.br', icon: 'casamy' },
]

export type Section = 'status' | 'skills' | 'quests' | 'journey' | 'contact'
export type MenuEntry = { route: Section | 'secrets' | 'options'; label: string; jp: string; icon: IconName; hint: string }

export const MENU: MenuEntry[] = [
  { route: 'status', label: 'STATUS', jp: 'ステータス', icon: 'heart', hint: 'Quem eu sou, em poucas linhas.' },
  { route: 'skills', label: 'HABILIDADES', jp: 'スキル', icon: 'spark', hint: 'O que eu sei usar, e onde já usei.' },
  { route: 'quests', label: 'MISSÕES', jp: 'クエスト', icon: 'scroll', hint: 'Projetos concluídos e em andamento.' },
  { route: 'journey', label: 'JORNADA', jp: 'ぼうけんのきろく', icon: 'star', hint: 'Trabalho, estudos e certificações.' },
  { route: 'contact', label: 'CONTATO', jp: 'れんらく', icon: 'letter', hint: 'Me chame para conversar.' },
  { route: 'secrets', label: 'SEGREDOS', jp: 'ひみつ', icon: 'chest', hint: 'Este portfólio esconde segredos. Quantos você já achou?' },
  { route: 'options', label: 'OPÇÕES', jp: 'せってい', icon: 'gear', hint: 'Som, música, efeito CRT e velocidade do texto.' },
]

export const SECTIONS: Section[] = ['status', 'skills', 'quests', 'journey', 'contact']

// {n} vira o número de segredos do aparelho.
export const INTRO = {
  keyboard: [
    'Ah, um visitante! Bem-vindo ao meu portfólio.',
    'Eu sou o Lucas: programador em Taubaté e fundador solo do Casamy.',
    'Cada seção que você abrir vale uma ★. Junte as 5!',
    'E tem {n} segredos escondidos por aqui. Consegue achar todos?',
    'Setas para escolher, Enter para abrir, Esc para voltar. Boa aventura!',
  ],
  touch: [
    'Ah, um visitante! Bem-vindo ao meu portfólio.',
    'Eu sou o Lucas: programador em Taubaté e fundador solo do Casamy.',
    'Cada seção que você abrir vale uma ★. Junte as 5!',
    'E tem {n} segredos escondidos por aqui. Consegue achar todos?',
    'Toque numa opção para abrir. Boa aventura!',
  ],
  back: 'Bem-vindo de volta! Continue de onde parou.',
}

// Segredos. Shh.
export const EGGS = {
  poke: {
    3: 'Ei! Isso faz cócegas.',
    6: 'Tô tentando trabalhar aqui…',
    10: 'Tá bom, você venceu. Toma um sorriso.',
    20: 'Vinte cutucadas. Isso já é um projeto paralelo.',
  } as Record<number, string>,
  sleep: 'Zzz… (o Lucas cochilou esperando você)',
  wake: 'Opa! Eu não tava dormindo, juro.',
  nia: 'Oi! Eu sou a Nia, a assistente do Casamy. Pergunte o que falta na sua casa nova e eu respondo com a sua lista.',
  casamy: 'Todas as casas da cidade acenderam! A sua começa em casamy.com.br.',
  rabbitWho: 'うさぎ',
  rabbit: 'ぺったん、ぺったん！ Diz a lenda japonesa que um coelho mora na lua socando mochi. Olha ele aí.',
  rotate: 'Opa, o mundo virou!',
  console: 'Oi! Você achou o recado. Valeu por fuçar o código.',
}

export type SecretId = 'poke' | 'sleep' | 'rabbit' | 'nia' | 'casamy' | 'konami' | 'console' | 'rotate'

/**
 * Cada aparelho tem 7 segredos. Os que dependem de teclado ganham um jeito de tocar no celular,
 * e o do console (só no PC) troca de lugar com o de virar o celular (só no celular).
 */
export type Secret = { id: SecretId; name: string; found: string; pc: string; touch: string; only?: 'pc' | 'touch' }

export const SECRETS: Secret[] = [
  {
    id: 'poke',
    name: 'CÓCEGAS',
    pc: 'O Lucas não gosta de ser cutucado.',
    touch: 'O Lucas não gosta de ser cutucado.',
    found: 'Você cutucou o Lucas até ele reclamar.',
  },
  {
    id: 'sleep',
    name: 'COCHILO',
    pc: 'Às vezes, é só esperar no menu.',
    touch: 'Às vezes, é só esperar no menu.',
    found: 'O Lucas dormiu esperando você.',
  },
  {
    id: 'rabbit',
    name: 'COELHO DA LUA',
    pc: 'Olhe para o céu e clique três vezes.',
    touch: 'Olhe para o céu e toque três vezes.',
    found: 'O coelho da lua socando mochi.',
  },
  {
    id: 'nia',
    name: 'NIA',
    pc: 'Escreva o nome da assistente do Casamy.',
    touch: 'Segure o rosto do Lucas na caixa de diálogo.',
    found: 'A Nia apareceu para dar oi.',
  },
  {
    id: 'casamy',
    name: 'CIDADE ACESA',
    pc: 'Escreva o nome do app.',
    touch: 'A cidade está dormindo. Acorde-a com cinco toques.',
    found: 'Todas as casas da cidade acenderam.',
  },
  {
    id: 'konami',
    name: 'CÓDIGO CLÁSSICO',
    pc: 'Um código que todo gamer conhece.',
    touch: 'Um código que todo gamer conhece, deslizando o dedo.',
    found: 'Fogos no céu.',
  },
  {
    id: 'console',
    name: 'RECADO PARA DEVS',
    pc: 'Devs curiosos olham por trás da tela.',
    touch: '',
    found: 'Você respondeu ao recado no console.',
    only: 'pc',
  },
  {
    id: 'rotate',
    name: 'MUNDO DE LADO',
    pc: '',
    touch: 'Nem todo jogo se joga em pé.',
    found: 'Você virou o celular.',
    only: 'touch',
  },
]
