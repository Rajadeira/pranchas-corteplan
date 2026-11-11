/**
 * Gera os ícones do PWA (PNG 192/512, maskable 192/512, apple-touch 180 e
 * favicon.ico 48): fundo branco sólido com a letra "C" da marca em laranja
 * (#F2612A) centralizada — desenhada proceduralmente em RGBA puro.
 *
 * Uso: node pwa-icons-plugin.mjs
 *
 * Os PNGs gerados são commitados em public/icons/ — a geração não roda no
 * build (package.json é gerenciado pela plataforma), então regenere com
 * este comando se o desenho mudar.
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'
// (o decodificador JPEG próprio deixou de ser usado: o novo ícone é desenhado
// proceduralmente, sem depender do arquivo do logo)
export { decodeJpegToRgba } from './pwa-jpeg-decode.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))

const PUBLIC_DIR = path.join(HERE, 'public')
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons')

/**
 * Lista dos arquivos de ícone que o gerador produz, em caminhos relativos à
 * raiz do projeto — o plugin de build usa isso para copiá-los para o dist/ e
 * o manifest/index.html referenciam exatamente esses caminhos (/icons/...).
 */
export const GENERATED_ICON_PATHS = [
  'public/icons/icon-48.png',
  'public/icons/icon-72.png',
  'public/icons/icon-96.png',
  'public/icons/icon-144.png',
  'public/icons/icon-192.png',
  'public/icons/icon-512.png',
  'public/icons/icon-1024.png',
  'public/icons/maskable-icon-192.png',
  'public/icons/maskable-icon-512.png',
  'public/icons/apple-touch-icon.png',
  'public/favicon.ico',
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
// Desenho da letra "C" (anel com abertura à direita), centralizado
// ---------------------------------------------------------------------------

/**
 * Desenha o "C": anel circular bold com abertura para a direita (boca do C),
 * sobre fundo branco opaco.
 * - size: lado do quadrado em px
 * - letterRatio: fração do lado ocupada pelo diâmetro EXTERNO do C
 * - Espessura do traço: mais grosso no topo/base (28% do raio), um pouco
 *   mais fino nas laterais (24%) — proporção de um "C" bold geométrico.
 * Retorna RGBA (Buffer) pronto para encodePng.
 */
function drawLetterCIcon(size, letterRatio) {
  const rgba = Buffer.alloc(size * size * 4, 255) // fundo branco opaco
  const cx = size / 2
  const cy = size / 2
  const outerR = (size * letterRatio) / 2
  const W_TOP = 0.28
  const W_SIDE = 0.24

  // Meia-abertura da boca do C (radianos a partir do eixo X+, à direita).
  const GAP_HALF = (34 / 2) * (Math.PI / 180)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - cx
      const dy = y + 0.5 - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > outerR) continue // fora do círculo externo
      const ang = Math.atan2(dy, dx) // -PI..PI, 0 = direita
      // Boca do C: região à direita dentro da abertura fica vazia.
      if (Math.abs(ang) < GAP_HALF && dx > 0) continue
      // Espessura local do traço: lateral (ang≈0) mais fina, topo/base mais grossa.
      const t = Math.abs(ang) / (Math.PI / 2) // 0 = lateral, 1 = topo/fundo
      const wLoc = W_SIDE + (W_TOP - W_SIDE) * t
      const innerR = outerR * (1 - wLoc)
      if (dist < innerR) continue // buraco interno do C
      const i = (y * size + x) * 4
      rgba[i] = BRAND_ORANGE.r
      rgba[i + 1] = BRAND_ORANGE.g
      rgba[i + 2] = BRAND_ORANGE.b
      rgba[i + 3] = 255
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
    fs.writeFileSync(path.join(ICONS_DIR, `icon-${size}.png`), encodePng(size, size, rgba))
  }
  // Ícone 1024 (App Store/lojas que pedem ícone grande) — mesmo tratamento.
  {
    const rgba = drawLetterCIcon(1024, 0.78)
    fs.writeFileSync(path.join(ICONS_DIR, 'icon-1024.png'), encodePng(1024, 1024, rgba))
  }
  for (const size of MASKABLE_SIZES) {
    // Maskable: letra C em 62% do lado — a área segura do Chrome é um círculo
    // de 80% do lado; assim o C fica inteiro dentro do recorte circular.
    const rgba = drawLetterCIcon(size, 0.62)
    fs.writeFileSync(path.join(ICONS_DIR, `maskable-icon-${size}.png`), encodePng(size, size, rgba))
  }
  const apple = drawLetterCIcon(APPLE_TOUCH_SIZE, 0.82)
  fs.writeFileSync(
    path.join(ICONS_DIR, 'apple-touch-icon.png'),
    encodePng(APPLE_TOUCH_SIZE, APPLE_TOUCH_SIZE, apple),
  )

  // favicon.ico com o PNG de 48x48 embutido.
  const favicon48 = fs.readFileSync(path.join(ICONS_DIR, 'icon-48.png'))
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), buildIco(favicon48, 48, 48))
}

// Execução direta (node pwa-icons-plugin.mjs)
generateIcons()
console.log('[pwa-icons] gerados com sucesso')
