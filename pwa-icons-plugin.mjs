/**
 * Gera os ícones do PWA (PNG 192/512, maskable 192/512, apple-touch 180 e
 * favicon.ico 48): fundo BRANCO puro com a LETRA "C" em laranja Corteplan
 * (#F2612A), centralizada — desenhada proceduralmente em RGBA puro.
 *
 * O desenho da letra é um PATH GEOMÉTRICO bold (não uma fonte, não um arco):
 * um "C" com haste superior e inferior retas e um arco suave no lado
 * esquerdo, como um C bold de fonte sans geométrica (Mont/Avenir/Futura
 * ExtraBold). Nada de anel-donut.
 *
 * Uso: node pwa-icons-plugin.mjs
 * (também roda automaticamente no build, via vite-plugin-pwa-icons.mjs)
 *
 * Nomes de arquivo com sufixo -v2: mudar o nome força o navegador/Windows a
 * invalidar o cache do ícone antigo (logo recortado), sem depender de headers.
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))

const PUBLIC_DIR = path.join(HERE, 'public')
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons')

// Sufixo de cache-busting nos nomes de arquivo (o conteúdo mudou em relação à
// versão anterior; novo nome ⇒ nova URL ⇒ navegador/Windows buscam de novo).
const V = 'v2'

/**
 * Lista dos arquivos de ícone que o gerador produz, em caminhos relativos à
 * raiz do projeto — o plugin de build usa isso para copiá-los para o dist/ e
 * o manifest/index.html referenciam exatamente esses caminhos (/icons/...).
 */
export const GENERATED_ICON_PATHS = [
  'public/icons/icon-48-v2.png',
  'public/icons/icon-72-v2.png',
  'public/icons/icon-96-v2.png',
  'public/icons/icon-144-v2.png',
  'public/icons/icon-192-v2.png',
  'public/icons/icon-512-v2.png',
  'public/icons/icon-1024-v2.png',
  'public/icons/maskable-icon-192-v2.png',
  'public/icons/maskable-icon-512-v2.png',
  'public/icons/apple-touch-icon-v2.png',
  'public/favicon-v2.ico',
]

// Laranja da marca Corteplan, igual ao theme_color do manifest e ao laranja
// usado em todo o app (buttons, badges, links).
const BRAND_ORANGE = { r: 0xf2, g: 0x61, b: 0x2a }

const SIZES = [48, 72, 96, 144, 192, 512]
const MASKABLE_SIZES = [192, 512]
const APPLE_TOUCH_SIZE = 180

// ---------------------------------------------------------------------------
// Codificador PNG (zlib puro, sem dependências)
// ---------------------------------------------------------------------------

function crc32(buf) {
  let table = crc32.table
  if (!table) {
    table = crc32.table = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      }
      table[n] = c
    }
  }
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filtro: none
    const row = rgba.subarray(y * stride, (y + 1) * stride)
    row.copy ? row.copy(raw, y * (stride + 1) + 1) : raw.set(row, y * (stride + 1) + 1)
  }
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---------------------------------------------------------------------------
// Desenho da letra "C" — path geométrico bold, centralizado
// ---------------------------------------------------------------------------

/**
 * Extrai os pontos da silhueta de um "C" bold geométrico, num viewBox de
 * referência com caixa da letra em x:4..84, y:8..92 (80 de largura, 84 de
 * altura, centro em 44,50).
 *
 * Contorno: terminal superior direito → haste superior reta → meia-volta no
 * arco externo (à esquerda) → haste inferior reta → terminal inferior direito
 * → face interna → arco interno concêntrico → face interna do terminal
 * superior → fecha.
 *
 * Espessura uniforme de 22 unidades (≈26% da altura da letra): haste superior
 * e inferior retas, arcos externo/interno CONCÊNTRICOS (mesmo centro 46,50,
 * raios 42 e 20) e terminais cortados verticalmente — como o C bold de uma
 * sans geométrica (Futura/Mont ExtraBold). Sem anel-donut, sem afunilar.
 */
function letterCPath() {
  const w = 22 // espessura do traço
  const cx = 46 // centro (x) dos arcos
  const cy = 50 // centro (y) dos arcos
  const rOut = 42 // raio externo (meia-volta exata: corda = 2r)
  const rIn = rOut - w // 20 — raio interno, concêntrico
  const top = cy - rOut // 8
  const bottom = cy + rOut // 92
  const right = 84 // face direita: terminais retos, cortados na vertical
  const innerTop = cy - rIn // 30
  const innerBottom = cy + rIn // 70

  const p = []
  // Terminal superior: canto direito → início do arco externo.
  p.push(`M ${right} ${top}`)
  p.push(`L ${cx} ${top}`)
  // Arco externo: meia-volta descendo pela esquerda (anti-horário em tela).
  p.push(`A ${rOut} ${rOut} 0 0 0 ${cx} ${bottom}`)
  // Haste inferior: até o terminal direito.
  p.push(`L ${right} ${bottom}`)
  // Face interna do terminal inferior.
  p.push(`L ${right} ${innerBottom}`)
  p.push(`L ${cx} ${innerBottom}`)
  // Arco interno: meia-volta subindo pela esquerda (horário em tela).
  p.push(`A ${rIn} ${rIn} 0 0 1 ${cx} ${innerTop}`)
  // Face interna do terminal superior e fecho.
  p.push(`L ${right} ${innerTop}`)
  p.push('Z')
  return p.join(' ')
}

/** Converte o path SVG do "C" em lista de segmentos (linhas e arcos). */
function parseLetterCSegments() {
  const path = letterCPath()
  const tokens = path.match(/[MLAZ]|-?\d+(?:\.\d+)?/g) || []
  const segs = []
  let i = 0
  let cur = { x: 0, y: 0 }
  while (i < tokens.length) {
    const cmd = tokens[i++]
    if (cmd === 'M' || cmd === 'L') {
      const x = parseFloat(tokens[i++])
      const y = parseFloat(tokens[i++])
      if (cmd === 'M') cur = { x, y }
      else segs.push({ type: 'L', from: cur, to: { x, y } })
      cur = { x, y }
    } else if (cmd === 'A') {
      const rx = parseFloat(tokens[i++])
      const ry = parseFloat(tokens[i++])
      const rot = parseFloat(tokens[i++])
      const largeArc = parseFloat(tokens[i++])
      const sweep = parseFloat(tokens[i++])
      const x = parseFloat(tokens[i++])
      const y = parseFloat(tokens[i++])
      segs.push({ type: 'A', from: cur, to: { x, y }, rx, ry, rot, largeArc, sweep })
      cur = { x, y }
    } else if (cmd === 'Z') {
      segs.push({ type: 'L', from: cur, to: { x: cur.x, y: cur.y } })
    }
  }
  return segs
}

/**
 * Verifica se o ponto (px,py) está DENTRO da silhueta do "C" (viewBox 100).
 * Usa ray casting horizontal contra a poligonal: segmentos de linha contam
 * direto; arcos são aproximados por polilinhas de alta resolução antes.
 */
function pointInLetterC(px, py, segsCache) {
  const segs = segsCache
  let inside = false
  for (const seg of segs) {
    const pts = seg.type === 'A' ? approxArc(seg) : [seg.from, seg.to]
    for (let k = 0; k < pts.length - 1; k++) {
      const { x: x1, y: y1 } = pts[k]
      const { x: x2, y: y2 } = pts[k + 1]
      if (y1 === y2) continue
      const yMin = Math.min(y1, y2)
      const yMax = Math.max(y1, y2)
      if (py < yMin || py >= yMax) continue
      const t = (py - y1) / (y2 - y1)
      const xCross = x1 + t * (x2 - x1)
      if (xCross > px) inside = !inside
    }
  }
  return inside
}

function approxArc(seg, steps = 64) {
  const { from, to, rx, ry, sweep } = seg
  const dx = (to.x - from.x) / 2
  const dy = (to.y - from.y) / 2
  const rot = (seg.rot * Math.PI) / 180
  const cosR = Math.cos(rot)
  const sinR = Math.sin(rot)
  // Centro do arco (fórmula do endpoint parameterization da spec SVG).
  const x1p = (cosR * dx + sinR * dy) / (rx * rx)
  const y1p = (-sinR * dx + cosR * dy) / (ry * ry)
  const denom = x1p * x1p + y1p * y1p
  const num = Math.max(0, 1 / denom - 1)
  const coef = Math.sqrt(num) * (sweep === 1 ? 1 : -1)
  const cxp = coef * x1p
  const cyp = -coef * y1p
  const cx = cosR * cxp * rx - sinR * cyp * ry + (from.x + to.x) / 2
  const cy = sinR * cxp * rx + cosR * cyp * ry + (from.y + to.y) / 2
  // Ângulos inicial e final.
  const ang0 = Math.atan2((from.y - cy) / ry, (from.x - cx) / rx)
  const ang1 = Math.atan2((to.y - cy) / ry, (to.x - cx) / rx)
  let delta = ang1 - ang0
  if (sweep === 1 && delta < 0) delta += 2 * Math.PI
  if (sweep === 0 && delta > 0) delta -= 2 * Math.PI
  const pts = []
  for (let s = 0; s <= steps; s++) {
    const t = s / steps
    const a = ang0 + t * delta
    pts.push({
      x: cx + rx * Math.cos(a),
      y: cy + ry * Math.sin(a),
    })
  }
  return pts
}

/**
 * Desenha o ícone: fundo branco opaco + letra "C" laranja centralizada.
 * - size: lado do quadrado em px
 * - letterRatio: fração do lado ocupada pela caixa da letra
 * Retorna RGBA (Buffer) pronto para encodePng.
 */
function drawLetterCIcon(size, letterRatio) {
  const rgba = Buffer.alloc(size * size * 4, 255) // fundo branco opaco
  const segs = parseLetterCSegments()
  // Caixa da letra em unidades do viewBox: x 4..84 (80 de largura).
  const scale = (size * letterRatio) / 80
  // Centro geométrico da caixa da letra no viewBox.
  const boxCx = 44
  const boxCy = 50
  const cx = size / 2
  const cy = size / 2
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const vx = (x + 0.5 - cx) / scale + boxCx
      const vy = (y + 0.5 - cy) / scale + boxCy
      if (pointInLetterC(vx, vy, segs)) {
        const i = (y * size + x) * 4
        rgba[i] = BRAND_ORANGE.r
        rgba[i + 1] = BRAND_ORANGE.g
        rgba[i + 2] = BRAND_ORANGE.b
        rgba[i + 3] = 255
      }
    }
  }
  return rgba
}

// ---------------------------------------------------------------------------
// ICO wrapper (PNG embutido — válido em browsers modernos)
// ---------------------------------------------------------------------------

function buildIco(pngBuffer, w, h) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(1, 4) // count
  const entry = Buffer.alloc(16)
  entry[0] = w === 256 ? 0 : w
  entry[1] = h === 256 ? 0 : h
  entry.writeUInt16LE(1, 4) // planes
  entry.writeUInt32LE(pngBuffer.length, 8)
  entry.writeUInt32LE(22, 12) // offset do PNG
  entry.writeUInt16LE(32, 6) // bpp
  return Buffer.concat([header, entry, pngBuffer])
}

// ---------------------------------------------------------------------------
// Geração
// ---------------------------------------------------------------------------

export function generateIcons() {
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true })
  }
  for (const size of SIZES) {
    // Letra C em ~78% do lado (visual forte, margem nas 4 bordas).
    const rgba = drawLetterCIcon(size, 0.78)
    fs.writeFileSync(path.join(ICONS_DIR, `icon-${size}-v2.png`), encodePng(size, size, rgba))
  }
  // Ícone 1024 (App Store/lojas que pedem ícone grande) — mesmo tratamento.
  {
    const rgba = drawLetterCIcon(1024, 0.78)
    fs.writeFileSync(path.join(ICONS_DIR, 'icon-1024-v2.png'), encodePng(1024, 1024, rgba))
  }
  for (const size of MASKABLE_SIZES) {
    // Maskable: letra C em 62% do lado — a área segura do Chrome é um círculo
    // de 80% do lado; assim o C fica inteiro dentro do recorte circular.
    const rgba = drawLetterCIcon(size, 0.62)
    fs.writeFileSync(
      path.join(ICONS_DIR, `maskable-icon-${size}-v2.png`),
      encodePng(size, size, rgba),
    )
  }
  const apple = drawLetterCIcon(APPLE_TOUCH_SIZE, 0.82)
  fs.writeFileSync(
    path.join(ICONS_DIR, 'apple-touch-icon-v2.png'),
    encodePng(APPLE_TOUCH_SIZE, APPLE_TOUCH_SIZE, apple),
  )

  // favicon.ico com o PNG de 48x48 embutido.
  const favicon48 = fs.readFileSync(path.join(ICONS_DIR, 'icon-48-v2.png'))
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon-v2.ico'), buildIco(favicon48, 48, 48))
}

// Execução direta (node pwa-icons-plugin.mjs)
generateIcons()
console.log('[pwa-icons] gerados com sucesso')
