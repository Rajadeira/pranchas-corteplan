/**
 * Gera os ícones do PWA (PNG 192/512, maskable 192/512, apple-touch 180 e
 * favicon.ico 48) a partir do logo oficial da Corteplan em src/assets/.
 *
 * Uso: node pwa-icons-plugin.mjs
 *
 * Os PNGs gerados são commitados em public/icons/ — a geração não roda no
 * build (package.json é gerenciado pela plataforma), então regenere com
 * este comando se o logo mudar.
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { decodeJpegToRgba } from './pwa-jpeg-decode.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))

const ASSETS_DIR = path.join(HERE, 'src', 'assets')
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

const LOGO_FILE = path.join(ASSETS_DIR, 'logo-novo-corteplan-ffd51.jpg')

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
// Redimensionamento (box filter / média de área)
// ---------------------------------------------------------------------------

function resizeRGBA(src, sw, sh, dw, dh) {
  const dst = Buffer.alloc(dw * dh * 4)
  const xRatio = sw / dw
  const yRatio = sh / dh
  for (let dy = 0; dy < dh; dy++) {
    const y0 = Math.floor(dy * yRatio)
    const y1 = Math.min(sh, Math.max(y0 + 1, Math.floor((dy + 1) * yRatio)))
    for (let dx = 0; dx < dw; dx++) {
      const x0 = Math.floor(dx * xRatio)
      const x1 = Math.min(sw, Math.max(x0 + 1, Math.floor((dx + 1) * xRatio)))
      let r = 0,
        g = 0,
        b = 0,
        count = 0
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * sw + x) * 4
          r += src[i]
          g += src[i + 1]
          b += src[i + 2]
          count++
        }
      }
      const o = (dy * dw + dx) * 4
      dst[o] = Math.round(r / count)
      dst[o + 1] = Math.round(g / count)
      dst[o + 2] = Math.round(b / count)
      dst[o + 3] = 255
    }
  }
  return dst
}

// ---------------------------------------------------------------------------
// Composição: quadrado branco + logo centralizado
// ---------------------------------------------------------------------------

function composeIcon(logoRgba, lw, lh, size, innerRatio) {
  // innerRatio: fração do lado ocupada pelo logo (1 = sem margem).
  const bg = Buffer.alloc(size * size * 4, 255) // fundo branco opaco
  const inner = Math.round(size * innerRatio)
  const scale = inner / Math.max(lw, lh)
  const dw = Math.max(1, Math.round(lw * scale))
  const dh = Math.max(1, Math.round(lh * scale))
  const resized = resizeRGBA(logoRgba, lw, lh, dw, dh)
  const ox = Math.round((size - dw) / 2)
  const oy = Math.round((size - dh) / 2)
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const src = (y * dw + x) * 4
      const dst = ((oy + y) * size + (ox + x)) * 4
      // O logo é JPEG (sem alpha), mas respeita alpha se houver.
      const alpha = resized[src + 3] / 255
      bg[dst] = Math.round(resized[src] * alpha + bg[dst] * (1 - alpha))
      bg[dst + 1] = Math.round(resized[src + 1] * alpha + bg[dst + 1] * (1 - alpha))
      bg[dst + 2] = Math.round(resized[src + 2] * alpha + bg[dst + 2] * (1 - alpha))
      bg[dst + 3] = 255
    }
  }
  return bg
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
  const logoBuf = fs.readFileSync(LOGO_FILE)
  const { width: lw, height: lh, data: logoRgba } = decodeJpegToRgba(logoBuf)

  for (const size of SIZES) {
    const rgba = composeIcon(logoRgba, lw, lh, size, 0.92)
    fs.writeFileSync(path.join(ICONS_DIR, `icon-${size}.png`), encodePng(size, size, rgba))
  }
  // Ícone 1024 (App Store/lojas que pedem ícone grande) — mesmo tratamento.
  {
    const rgba = composeIcon(logoRgba, lw, lh, 1024, 0.92)
    fs.writeFileSync(path.join(ICONS_DIR, 'icon-1024.png'), encodePng(1024, 1024, rgba))
  }
  for (const size of MASKABLE_SIZES) {
    // Maskable: logo em 80% do lado (safe zone do Chrome), resto fundo branco.
    const rgba = composeIcon(logoRgba, lw, lh, size, 0.8)
    fs.writeFileSync(path.join(ICONS_DIR, `maskable-icon-${size}.png`), encodePng(size, size, rgba))
  }
  const apple = composeIcon(logoRgba, lw, lh, APPLE_TOUCH_SIZE, 0.96)
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
