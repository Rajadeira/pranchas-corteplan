/**
 * Decodificador JPEG baseline → RGBA, escrito aqui mesmo (sem dependências
 * externas). Suporta o que o logo da Corteplan usa: JPEG baseline (SOF0/1),
 * JFIF, 1 ou 3 canais, subamostragem de croma, marcadores de restart.
 * Não suporta JPEG progressivo nem codificação aritmética (erro claro).
 */

const ZIGZAG = [
  0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20,
  13, 6, 7, 14, 21, 28, 35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52,
  45, 38, 31, 39, 46, 53, 60, 61, 54, 47, 55, 62, 63,
]

const STD_LUMA_Q = [
  16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56,
  14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113,
  92, 49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99,
]
const STD_CHROMA_Q = [
  17, 18, 24, 47, 99, 99, 99, 99, 18, 21, 26, 66, 99, 99, 99, 99, 24, 26, 56, 99, 99, 99, 99, 99,
  47, 66, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
  99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
]

function buildHuffTable(counts, values) {
  const table = new Map()
  let code = 0
  let k = 0
  for (let len = 1; len <= 16; len++) {
    for (let i = 0; i < counts[len - 1]; i++) {
      table.set(code, { length: len, value: values[k++] })
      code++
    }
    code <<= 1
  }
  return table
}

function decodeBlock(decoder, dcTable, acTable, qTable) {
  const block = new Float32Array(64)
  const s = decoder.decodeHuff(dcTable)
  const diff = decoder.receiveExtend(s)
  block[0] = diff * qTable[0]
  let k = 1
  while (k < 64) {
    const rs = decoder.decodeHuff(acTable)
    const r = rs >> 4
    const s2 = rs & 15
    if (s2 === 0) {
      if (r === 15) {
        k += 16
        continue
      }
      break // EOB
    }
    k += r
    if (k > 63) break
    const zz = ZIGZAG[k]
    block[zz] = decoder.receiveExtend(s2) * qTable[zz]
    k++
  }
  return idct8x8(block)
}

// IDCT 2D 8x8 separável, fator 1/4 = C(u)C(v) com C(0) = 1/√2.
function idct8x8(block) {
  const out = new Float32Array(64)
  const tmp = new Float32Array(64)
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      let s = 0
      for (let u = 0; u < 8; u++) {
        const c = u === 0 ? Math.SQRT1_2 : 1
        s += c * block[y * 8 + u] * Math.cos(((2 * x + 1) * u * Math.PI) / 16)
      }
      tmp[y * 8 + x] = s * 0.5
    }
  }
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      let s = 0
      for (let v = 0; v < 8; v++) {
        const c = v === 0 ? Math.SQRT1_2 : 1
        s += c * tmp[v * 8 + x] * Math.cos(((2 * y + 1) * v * Math.PI) / 16)
      }
      out[y * 8 + x] = s * 0.5
    }
  }
  return out
}

function clamp255(v) {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v)
}

export function decodeJpegToRgba(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) {
    throw new Error('Arquivo não é um JPEG (SOI ausente)')
  }
  let pos = 2
  let width = 0
  let height = 0
  let componentCount = 0
  const components = [] // { id, h, v, tq }
  const qTables = {}
  const huffDC = []
  const huffAC = []
  let restartInterval = 0

  const readU16 = () => {
    const v = (buf[pos] << 8) | buf[pos + 1]
    pos += 2
    return v
  }
  const readU8 = () => buf[pos++]

  // ---- Passo 1: segmentos até o início do scan (SOS) ----
  while (pos < buf.length) {
    if (buf[pos] !== 0xff) {
      pos++
      continue
    }
    const marker = buf[pos + 1]
    if (marker === 0xff) {
      pos++
      continue
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      pos += 2
      continue
    }
    if (marker === 0xda) {
      pos += 2
      break
    }
    if (marker === 0xd9) {
      throw new Error('EOI inesperado antes do scan')
    }
    const segStart = pos + 2
    const segLen = (buf[segStart] << 8) | buf[segStart + 1]
    const segEnd = segStart + segLen // 1º byte após o segmento
    if (marker === 0xdb) {
      // Tabelas de quantização
      pos = segStart + 2
      while (pos < segEnd) {
        const pqTq = readU8()
        const pq = pqTq >> 4
        const tq = pqTq & 15
        const table = new Int32Array(64)
        for (let i = 0; i < 64; i++) table[i] = pq === 0 ? readU8() : readU16()
        qTables[tq] = table
      }
    } else if (marker === 0xc4) {
      // Tabelas Huffman
      pos = segStart + 2
      while (pos < segEnd) {
        const tcTh = readU8()
        const tc = tcTh >> 4
        const th = tcTh & 15
        const counts = []
        let total = 0
        for (let i = 0; i < 16; i++) {
          counts.push(readU8())
          total += counts[i]
        }
        const values = []
        for (let i = 0; i < total; i++) values.push(readU8())
        const table = buildHuffTable(counts, values)
        if (tc === 0) huffDC[th] = table
        else huffAC[th] = table
      }
    } else if (marker === 0xc0 || marker === 0xc1) {
      // SOF0/SOF1: baseline
      pos = segStart + 2
      height = readU16()
      width = readU16()
      componentCount = readU8()
      for (let i = 0; i < componentCount; i++) {
        const id = readU8()
        const hv = readU8()
        const tq = readU8()
        components.push({ id, h: hv >> 4, v: hv & 15, tq })
      }
    } else if (marker === 0xc2) {
      throw new Error('JPEG progressivo não suportado pelo gerador de ícones')
    } else if (marker === 0xc3 || marker >= 0xc5) {
      if (marker >= 0xc5 && marker <= 0xc7) {
        throw new Error('JPEG progressivo/sem perdas não suportado')
      }
      if (marker >= 0xc9 && marker <= 0xcb) {
        throw new Error('Codificação JPEG aritmética não suportada')
      }
    } else if (marker === 0xdd) {
      pos = segStart + 2
      restartInterval = readU16()
    }
    pos = segEnd
  }

  if (!width || !height || !componentCount) {
    throw new Error('JPEG sem SOF válido')
  }

  // ---- Passo 2: decodifica o scan ----
  const decoder = {}
  let bytePos = pos
  let bitsBuf = 0
  let bitsCount = 0

  const nextByte = () => {
    let b = buf[bytePos++]
    if (b === 0xff) {
      const n = buf[bytePos]
      if (n === 0x00) {
        bytePos++ // stuffing
      } else if (n >= 0xd0 && n <= 0xd7) {
        throw { restart: true }
      } else {
        throw new Error('Marcador inesperado no scan: 0x' + n.toString(16))
      }
    }
    return b
  }
  const nextBit = () => {
    if (bitsCount === 0) {
      bitsBuf = nextByte()
      bitsCount = 8
    }
    const bit = (bitsBuf >> (bitsCount - 1)) & 1
    bitsCount--
    return bit
  }
  const readBits = (n) => {
    let v = 0
    for (let i = 0; i < n; i++) v = (v << 1) | nextBit()
    return v
  }
  const receiveExtend = (s) => {
    if (s === 0) return 0
    let v = readBits(s)
    if (v < 1 << (s - 1)) v -= (1 << s) - 1
    return v
  }
  const decodeHuff = (table) => {
    let code = 0
    for (let len = 1; len <= 16; len++) {
      code = (code << 1) | nextBit()
      if (table.has(code)) {
        const item = table.get(code)
        if (item.length === len) return item.value
      }
    }
    throw new Error('Símbolo Huffman inválido')
  }
  decoder.receiveExtend = receiveExtend
  decoder.decodeHuff = decodeHuff

  // Cabeçalho do scan (SOS) — pula os 2 bytes de comprimento do segmento
  pos += 2
  const ns = readU8()
  const scanComponents = []
  for (let i = 0; i < ns; i++) {
    const cs = readU8()
    const tdTa = readU8()
    const comp = components.find((c) => c.id === cs)
    if (!comp) throw new Error('Componente do scan não encontrado no SOF')
    scanComponents.push({ comp, td: tdTa >> 4, ta: tdTa & 15 })
  }
  pos += 3 // ignora Ss, Se, Ah/Al (baseline: sempre 0, 63, 0)

  const hMax = Math.max(...components.map((c) => c.h))
  const vMax = Math.max(...components.map((c) => c.v))
  const mcuW = hMax * 8
  const mcuH = vMax * 8
  const mcusX = Math.ceil(width / mcuW)
  const mcusY = Math.ceil(height / mcuH)

  const planes = components.map((c) => ({
    c,
    w: mcusX * c.h * 8,
    h: mcusY * c.v * 8,
    data: new Float32Array(mcusX * c.h * 8 * mcusY * c.v * 8),
    dcPred: 0,
  }))

  const decodeMcu = (mx, my) => {
    for (const sc of scanComponents) {
      const plane = planes[components.indexOf(sc.comp)]
      const dcTable = huffDC[sc.td]
      const acTable = huffAC[sc.ta]
      const qTable = qTables[sc.comp.tq] || (sc.comp.tq === 0 ? STD_LUMA_Q : STD_CHROMA_Q)
      for (let by = 0; by < sc.comp.v; by++) {
        for (let bx = 0; bx < sc.comp.h; bx++) {
          const block = decodeBlock(decoder, dcTable, acTable, qTable)
          const ox = mx * sc.comp.h * 8 + bx * 8
          const oy = my * sc.comp.v * 8 + by * 8
          for (let yy = 0; yy < 8; yy++) {
            const di = (oy + yy) * plane.w + ox
            for (let xx = 0; xx < 8; xx++) {
              plane.data[di + xx] = block[yy * 8 + xx]
            }
          }
        }
      }
    }
  }

  let restartCountdown = restartInterval
  for (let my = 0; my < mcusY; my++) {
    for (let mx = 0; mx < mcusX; mx++) {
      if (restartInterval > 0 && restartCountdown === 0) {
        // Consome o marcador RSTn e zera os preditores DC.
        while (bytePos < buf.length && buf[bytePos] !== 0xff) bytePos++
        bytePos += 2 // 0xFF RSTn
        for (const plane of planes) plane.dcPred = 0
        bitsCount = 0
        restartCountdown = restartInterval
      }
      try {
        decodeMcu(mx, my)
      } catch (e) {
        if (e && e.restart) {
          // Restart no meio do MCU: realinha e decodifica de novo.
          while (bytePos < buf.length && buf[bytePos] !== 0xff) bytePos++
          bytePos += 2
          for (const plane of planes) plane.dcPred = 0
          bitsCount = 0
          restartCountdown = restartInterval
          decodeMcu(mx, my)
        } else {
          throw e
        }
      }
      if (restartInterval > 0) restartCountdown--
    }
  }

  // ---- Passo 3: componentes → RGBA (YCbCr ou escala de cinza) ----
  // Amostragem nearest-neighbour correta para subamostragem de croma:
  // mapeia o pixel de saída para o plano de cada componente.
  const sampX = planes.map((plane) => {
    const arr = new Int32Array(width)
    for (let x = 0; x < width; x++) {
      arr[x] = Math.min(plane.w - 1, Math.floor((x * plane.w) / width))
    }
    return arr
  })
  const sampY = planes.map((plane) => {
    const arr = new Int32Array(height)
    for (let y = 0; y < height; y++) {
      arr[y] = Math.min(plane.h - 1, Math.floor((y * plane.h) / height))
    }
    return arr
  })

  const out = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) {
    const row = y * width
    if (componentCount === 1) {
      const p = planes[0]
      const sy = sampY[0][y]
      for (let x = 0; x < width; x++) {
        const v = clamp255(p.data[sy * p.w + sampX[0][x]] + 128)
        const o = (row + x) * 4
        out[o] = v
        out[o + 1] = v
        out[o + 2] = v
        out[o + 3] = 255
      }
    } else {
      const p0 = planes[0]
      const p1 = planes[1]
      const p2 = planes[2]
      const sy0 = sampY[0][y]
      const sy1 = sampY[1][y]
      const sy2 = sampY[2][y]
      for (let x = 0; x < width; x++) {
        const Y = p0.data[sy0 * p0.w + sampX[0][x]] + 128
        const cb = p1.data[sy1 * p1.w + sampX[1][x]] + 128
        const cr = p2.data[sy2 * p2.w + sampX[2][x]] + 128
        const o = (row + x) * 4
        out[o] = clamp255(Y + 1.402 * (cr - 128))
        out[o + 1] = clamp255(Y - 0.344136 * (cb - 128) - 0.714136 * (cr - 128))
        out[o + 2] = clamp255(Y + 1.772 * (cb - 128))
        out[o + 3] = 255
      }
    }
  }
  return { width, height, data: out }
}
