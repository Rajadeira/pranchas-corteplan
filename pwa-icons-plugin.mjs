/**
 * Gera os ícones do PWA (PNG 48–1024, maskable 192/512, apple-touch 180 e
 * favicon.ico 48): fundo BRANCO puro com a LETRA "C" em laranja Corteplan
 * (#F2612A), centralizada — desenhada proceduralmente em RGBA puro.
 *
 * O desenho da letra NÃO usa path SVG, fonte nem parseamento de arcos (o
 * método anterior, com arcos concêntricos parseados à mão, produziu uma
 * figura deformada). Aqui a construção é booleana por pixel, impossível de
 * sair errada:
 *   1. círculo laranja cheio (raio R);
 *   2. círculo branco concêntrico menor (raio r) por cima → forma o ANEL;
 *   3. "mordida" branca retangular no lado direito-centro (x > bx e |y| < hy)
 *      → abre o C;
 *   4. corte vertical em x = T → terminais retos e grossos, como numa sans
 *      geométrica bold (Futura/Mont ExtraBold).
 *
 * Ao final, VALIDA os PNGs gerados lendo os pixels do arquivo: anel laranja à
 * esquerda/topo/baixo, centro branco, abertura branca à direita, cantos
 * brancos e terminais laranja. Qualquer falha QUEBRA O BUILD — o "C" nunca
 * mais sai deformado sem ninguém notar.
 *
 * Uso: node pwa-icons-plugin.mjs
 * (também roda automaticamente no build, via vite-plugin-pwa-icons.mjs)
 *
 * Nomes de arquivo com sufixo -v3: mudar o nome força o navegador/Windows a
 * invalidar o cache do ícone antigo, sem depender de headers.
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))

const PUBLIC_DIR = path.join(HERE, 'public')
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons')

// Sufixo de cache-busting nos nomes de arquivo (a arte mudou em relação à
// versão -v2, que saía deformada; novo nome ⇒ nova URL ⇒ navegador/Windows
// buscam de novo).
const V = 'v3'

/**
 * Lista dos arquivos de ícone que o gerador produz, em caminhos relativos à
 * raiz do projeto — o plugin de build usa isso para copiá-los para o dist/ e
 * o manifest/index.html referenciam exatamente esses caminhos (/icons/...).
 */
export const GENERATED_ICON_PATHS = [
  `public/icons/icon-48-${V}.png`,
  `public/icons/icon-72-${V}.png`,
  `public/icons/icon-96-${V}.png`,
  `public/icons/icon-144-${V}.png`,
  `public/icons/icon-192-${V}.png`,
  `public/icons/icon-512-${V}.png`,
  `public/icons/icon-1024-${V}.png`,
  `public/icons/maskable-icon-192-${V}.png`,
  `public/icons/maskable-icon-512-${V}.png`,
  `public/icons/apple-touch-icon-${V}.png`,
  `public/favicon-${V}.ico`,
]

// Laranja da marca Corteplan, igual ao theme_color do manifest e ao laranja
// usado em todo o app (buttons, badges, links).
const BRAND_ORANGE = { r: 0xf2, g: 0x61, b: 0x2a }

const SIZES = [48, 72, 96, 144, 192, 512]
const MASKABLE_SIZES = [192, 512]
const APPLE_TOUCH_SIZE = 180

// Fração do lado do ícone ocupada pela caixa da letra (100 unidades).
const LETTER_RATIO = 0.78
// Maskable: a área segura do Chrome é um círculo de 80% do lado (raio 40%);
// com a letra em 62% do lado, o C fica inteiro dentro do recorte circular.
const LETTER_RATIO_MASKABLE = 0.62
const LETTER_RATIO_APPLE = 0.8

// ---------------------------------------------------------------------------
// Geometria da letra "C" (viewBox 100x100, origem no CENTRO da letra)
// ---------------------------------------------------------------------------

// R: raio externo do anel; r: raio interno (furo branco) → espessura 24.
// hy: meia-altura da abertura (mordida); bx: início da mordida (x > bx);
// T: corte vertical dos terminais (face reta do braço).
const C = { R: 50, r: 26, hy: 14, bx: 18, T: 32.5 }
// Caixa da letra (bounding box) em unidades, para centralizar opticalmente.
const C_BBOX = { minX: -C.R, maxX: C.T, minY: -C.R, maxY: C.R }

/**
 * Cobertura [0..1] do pixel na silhueta do "C", em unidades da letra.
 * dx/dy relativos ao centro da letra; px = tamanho de 1 unidade em pixels.
 */
function letterCCoverage(dx, dy, px) {
  const dist = Math.sqrt(dx * dx + dy * dy)
  const dRing = Math.min(C.R - dist, dist - C.r) // >0 dentro do anel
  const dBite = Math.min(dx - C.bx, C.hy - Math.abs(dy)) // >0 dentro da mordida
  const dCut = C.T - dx // >0 à esquerda do corte vertical dos terminais
  const d = Math.min(dRing, -dBite, dCut) // >0 dentro da letra
  const aa = 0.75 / px // suavização de ~0.75px na borda
  return Math.min(1, Math.max(0, d / aa + 0.5))
}

/**
 * Desenha o ícone: fundo branco opaco + letra "C" laranja centralizada.
 * - size: lado do quadrado em px
 * - letterRatio: fração do lado ocupada pela caixa da letra (100 unidades)
 * Retorna RGBA (Buffer) pronto para encodePng.
 */
function drawLetterCIcon(size, letterRatio) {
  const rgba = Buffer.alloc(size * size * 4, 255) // fundo branco opaco
  const pxPerUnit = (size * letterRatio) / 100
  // Centro óptico: centro da bounding box da letra no centro do ícone.
  const boxCx = (C_BBOX.minX + C_BBOX.maxX) / 2
  const boxCy = (C_BBOX.minY + C_BBOX.maxY) / 2
  const cx = size / 2
  const cy = size / 2
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cov = letterCCoverage(
        (x + 0.5 - cx) / pxPerUnit - boxCx,
        (y + 0.5 - cy) / pxPerUnit - boxCy,
        pxPerUnit,
      )
      if (cov <= 0) continue
      const i = (y * size + x) * 4
      rgba[i] = Math.round(255 + (BRAND_ORANGE.r - 255) * cov)
      rgba[i + 1] = Math.round(255 + (BRAND_ORANGE.g - 255) * cov)
      rgba[i + 2] = Math.round(255 + (BRAND_ORANGE.b - 255) * cov)
      rgba[i + 3] = 255
    }
  }
  return rgba
}

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
// Decodificador PNG (só o que este gerador produz: filtro none, RGBA 8bit) —
// usado pela validação para conferir os pixels do ARQUIVO gerado.
// ---------------------------------------------------------------------------

function decodePngRgba(buf) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (!buf.subarray(0, 8).equals(sig)) throw new Error('assinatura PNG inválida')
  let width = 0
  let height = 0
  const idats = []
  let off = 8
  while (off < buf.length) {
    const len = buf.readUInt32BE(off)
    const type = buf.toString('ascii', off + 4, off + 8)
    const data = buf.subarray(off + 8, off + 8 + len)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      if (data[8] !== 8 || data[9] !== 6) throw new Error('PNG não é RGBA 8bit')
    } else if (type === 'IDAT') {
      idats.push(data)
    } else if (type === 'IEND') {
      break
    }
    off += 12 + len
  }
  const raw = zlib.inflateSync(Buffer.concat(idats))
  const stride = width * 4
  const rgba = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1)
    if (raw[rowStart] !== 0) throw new Error('filtro PNG inesperado')
    raw.copy(rgba, y * stride, rowStart + 1, rowStart + 1 + stride)
  }
  return { width, height, rgba }
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
// VALIDAÇÃO AUTOMÁTICA — lê o PNG gerado do disco e confere pixels-chave.
// Qualquer falha lança erro e QUEBRA O BUILD.
// ---------------------------------------------------------------------------

const isOrangeish = (r, g, b) => r > 200 && g > 40 && g < 160 && b < 110
const isWhiteish = (r, g, b) => r > 246 && g > 246 && b > 246

/** Pontos de teste em UNIDADES da letra (origem no centro da letra). */
const VALIDATION_POINTS = [
  { u: [-38, 0], expect: 'orange', label: 'anel à esquerda' },
  { u: [0, -38], expect: 'orange', label: 'anel no topo' },
  { u: [0, 38], expect: 'orange', label: 'anel na base' },
  { u: [28, 28], expect: 'orange', label: 'terminal superior' },
  { u: [28, -28], expect: 'orange', label: 'terminal inferior' },
  { u: [0, 0], expect: 'white', label: 'centro do ícone' },
  { u: [40, 0], expect: 'white', label: 'abertura à direita' },
  { u: [42, 42], expect: 'white', label: 'canto superior direito' },
  { u: [-42, 42], expect: 'white', label: 'canto superior esquerdo' },
  { u: [42, -42], expect: 'white', label: 'canto inferior direito' },
  { u: [-42, -42], expect: 'white', label: 'canto inferior esquerdo' },
]

/**
 * Confere os pixels de um PNG de ícone já gerado.
 * relPath: caminho relativo à raiz; letterRatio: fração usada na geração.
 */
function validateIconFile(relPath, letterRatio) {
  const abs = path.join(HERE, relPath)
  const { width, height, rgba } = decodePngRgba(fs.readFileSync(abs))
  if (width !== height) throw new Error(`[${relPath}] não é quadrado: ${width}x${height}`)
  const size = width
  const pxPerUnit = (size * letterRatio) / 100
  const boxCx = (C_BBOX.minX + C_BBOX.maxX) / 2
  const boxCy = (C_BBOX.minY + C_BBOX.maxY) / 2
  const errors = []
  let orangeCount = 0
  for (let i = 0; i < size * size; i++) {
    if (isOrangeish(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2])) orangeCount++
  }
  const orangeFrac = orangeCount / (size * size)
  if (orangeFrac < 0.12 || orangeFrac > 0.45) {
    errors.push(`proporção de laranja ${Math.round(orangeFrac * 100)}% fora de 12–45%`)
  }
  for (const { u, expect, label } of VALIDATION_POINTS) {
    // Centro do ícone → centro da bounding box da letra. É o inverso exato do
    // mapeamento do desenho: unidade u → pixel cx + (u + boxCx) * pxPerUnit.
    const x = Math.round(size / 2 + (u[0] + boxCx) * pxPerUnit)
    const y = Math.round(size / 2 + (u[1] + boxCy) * pxPerUnit)
    const xi = Math.min(size - 1, Math.max(0, x))
    const yi = Math.min(size - 1, Math.max(0, y))
    const i = (yi * size + xi) * 4
    const r = rgba[i]
    const g = rgba[i + 1]
    const b = rgba[i + 2]
    const ok = expect === 'orange' ? isOrangeish(r, g, b) : isWhiteish(r, g, b)
    if (!ok) {
      errors.push(`${label} (${xi},${yi}) esperado ${expect}, veio rgb(${r},${g},${b})`)
    }
  }
  if (errors.length) {
    throw new Error(`[pwa-icons] VALIDAÇÃO FALHOU em ${relPath}:\n  - ${errors.join('\n  - ')}`)
  }
}

function validateIcons() {
  for (const size of SIZES) validateIconFile(`public/icons/icon-${size}-${V}.png`, LETTER_RATIO)
  validateIconFile(`public/icons/icon-1024-${V}.png`, LETTER_RATIO)
  for (const size of MASKABLE_SIZES) {
    validateIconFile(`public/icons/maskable-icon-${size}-${V}.png`, LETTER_RATIO_MASKABLE)
  }
  validateIconFile(`public/icons/apple-touch-icon-${V}.png`, LETTER_RATIO_APPLE)
  // favicon.ico: header ICO válido + PNG de 48 embutido no offset 22.
  const ico = fs.readFileSync(path.join(HERE, `public/favicon-${V}.ico`))
  if (!(ico[0] === 0 && ico[1] === 0 && ico[2] === 1 && ico[3] === 0 && ico[4] === 1)) {
    throw new Error('[pwa-icons] favicon-v3.ico com header ICO inválido')
  }
  if (!ico.subarray(22, 30).equals(encodePng(0, 0, Buffer.alloc(0)).subarray(0, 8))) {
    throw new Error('[pwa-icons] favicon-v3.ico sem PNG embutido na posição esperada')
  }
  console.log(
    `[pwa-icons] validação OK: letra "C" confirmada por pixels em ${GENERATED_ICON_PATHS.length} arquivos`,
  )
}

// ---------------------------------------------------------------------------
// Geração
// ---------------------------------------------------------------------------

export function generateIcons() {
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true })
  }
  for (const size of SIZES) {
    const rgba = drawLetterCIcon(size, LETTER_RATIO)
    fs.writeFileSync(path.join(ICONS_DIR, `icon-${size}-${V}.png`), encodePng(size, size, rgba))
  }
  // Ícone 1024 (lojas que pedem ícone grande) — mesmo tratamento.
  {
    const rgba = drawLetterCIcon(1024, LETTER_RATIO)
    fs.writeFileSync(path.join(ICONS_DIR, `icon-1024-${V}.png`), encodePng(1024, 1024, rgba))
  }
  for (const size of MASKABLE_SIZES) {
    const rgba = drawLetterCIcon(size, LETTER_RATIO_MASKABLE)
    fs.writeFileSync(
      path.join(ICONS_DIR, `maskable-icon-${size}-${V}.png`),
      encodePng(size, size, rgba),
    )
  }
  const apple = drawLetterCIcon(APPLE_TOUCH_SIZE, LETTER_RATIO_APPLE)
  fs.writeFileSync(
    path.join(ICONS_DIR, `apple-touch-icon-${V}.png`),
    encodePng(APPLE_TOUCH_SIZE, APPLE_TOUCH_SIZE, apple),
  )

  // favicon.ico com o PNG de 48x48 embutido.
  const favicon48 = fs.readFileSync(path.join(ICONS_DIR, `icon-48-${V}.png`))
  fs.writeFileSync(path.join(PUBLIC_DIR, `favicon-${V}.ico`), buildIco(favicon48, 48, 48))

  // Validação automática: lê os PNGs de volta e confere os pixels do "C".
  validateIcons()
}

// Execução direta (node pwa-icons-plugin.mjs)
generateIcons()
console.log('[pwa-icons] gerados com sucesso')
