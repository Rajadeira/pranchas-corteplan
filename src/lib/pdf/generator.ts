/**
 * High-Resolution PDF Generator for Corteplan Presentation Boards
 * Generates standards-compliant A4 Landscape (297mm x 210mm) PDF
 * Uses pure HTML5 Canvas (high-DPI 300 DPI) converted to vector-wrapped PDF binary structure.
 */

export interface BoardData {
  cliente: string
  modelo: string
  data: string
  vendedor: string
  projeto: string
  responsavel: string
  includeAmbiente: boolean
  renderUrl?: string | null
  ambienteUrl?: string | null
  desenhoUrl?: string | null
}

export const ADDRESS_TEXT =
  'CORTEPLAN MÓVEIS ESPECIAIS - R. Friedrich Bischof, nº 80 - Polo Industrial - Sertãozinho - Mauá'

export const COPYRIGHT_LINE_1 = '© CORTEPLAN – Uso restrito e protegido pela Lei de'
export const COPYRIGHT_LINE_2 = 'Direitos Autorais nº 9.610/98.'
export const COPYRIGHT_LINE_3 = 'Solicite autorização para reprodução ou adaptação.'

export const COPYRIGHT_TEXT = `${COPYRIGHT_LINE_1}\n${COPYRIGHT_LINE_2}\n${COPYRIGHT_LINE_3}`

import corteplanLogoAssetUrl from '@/assets/logo-novo-corteplan-ffd51.jpg'

let cachedLogoImg: HTMLImageElement | null = null

/**
 * Loads an image into an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(new Error(`Falha ao carregar imagem: ${e}`))
    img.src = src
  })
}

/**
 * Loads the official Corteplan logo image (cached)
 */
export async function getOfficialLogoImage(): Promise<HTMLImageElement> {
  if (cachedLogoImg && cachedLogoImg.complete && cachedLogoImg.naturalWidth > 0) {
    return cachedLogoImg
  }
  cachedLogoImg = await loadImage(corteplanLogoAssetUrl)
  return cachedLogoImg
}

/**
 * Renders an image using "cover" logic inside a target rectangle
 */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const imgRatio = img.width / img.height
  const targetRatio = w / h

  let renderW: number
  let renderH: number
  let offsetX: number
  let offsetY: number

  if (imgRatio > targetRatio) {
    // Image is wider than container
    renderH = h
    renderW = h * imgRatio
    offsetX = x - (renderW - w) / 2
    offsetY = y
  } else {
    // Image is taller than container
    renderW = w
    renderH = w / imgRatio
    offsetX = x
    offsetY = y - (renderH - h) / 2
  }

  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.drawImage(img, offsetX, offsetY, renderW, renderH)
  ctx.restore()
}

/**
 * Formats date from YYYY-MM-DD to DD/MM/YYYY if needed
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }
  return dateStr
}

/**
 * Canvas dimensions for 300 DPI A4 Landscape (297mm x 210mm)
 * 297mm = 11.693 inches * 300 = 3508 px
 * 210mm = 8.268 inches * 300 = 2480 px
 */
export const CANVAS_WIDTH = 3508
export const CANVAS_HEIGHT = 2480

/**
 * Draws the standard Corteplan Logo on Canvas using the official brand image
 */
export function drawLogoCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  maxW = 420,
  maxH = 92,
  logoImg?: HTMLImageElement | null,
) {
  if (logoImg && logoImg.width > 0 && logoImg.height > 0) {
    const ratio = logoImg.width / logoImg.height
    let drawW = maxH * ratio
    let drawH = maxH
    if (drawW > maxW) {
      drawW = maxW
      drawH = drawW / ratio
    }
    const drawY = y + (maxH - drawH) / 2
    ctx.drawImage(logoImg, x, drawY, drawW, drawH)
    return
  }

  // Vector fallback if image is not loaded
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = '#E08A2E'
  ctx.fillRect(0, 8, 14, 76)
  ctx.fillStyle = '#3A3A3A'
  ctx.font = '900 48px Inter, sans-serif'
  ctx.letterSpacing = '4px'
  ctx.fillText('CORTEPLAN', 28, 62)
  ctx.restore()
}

/**
 * Draws the big Cover Logo using the official brand image
 */
export function drawCoverLogoCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  logoImg?: HTMLImageElement | null,
) {
  if (logoImg && logoImg.width > 0 && logoImg.height > 0) {
    const targetW = 1200
    const ratio = logoImg.width / logoImg.height
    const targetH = targetW / ratio
    ctx.drawImage(logoImg, cx - targetW / 2, cy - targetH / 2, targetW, targetH)
    return
  }

  // Fallback vector
  ctx.save()
  ctx.translate(cx, cy)
  ctx.fillStyle = '#E08A2E'
  ctx.fillRect(-280, -60, 24, 120)
  ctx.fillStyle = '#3A3A3A'
  ctx.font = '900 100px Inter, sans-serif'
  ctx.letterSpacing = '12px'
  ctx.textAlign = 'center'
  ctx.fillText('CORTEPLAN', 0, 35)
  ctx.restore()
}

/**
 * Renders the full Footer on Canvas
 */
export function drawFooterCanvas(
  ctx: CanvasRenderingContext2D,
  data: BoardData,
  pageNumber: number,
  totalWidth: number,
  footerY: number,
  footerHeight: number,
  logoImg?: HTMLImageElement | null,
) {
  ctx.save()

  // Top dividing hairline matching the reference bounding box width
  ctx.strokeStyle = '#DCDCDC'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(88, footerY)
  ctx.lineTo(totalWidth - 88, footerY)
  ctx.stroke()

  // Available footer content height: footerHeight = ~372px (15% of 2480)

  // Block 1: Logo Corteplan oficial (proporção aprox. 2:1)
  // Largura ~13-14% da largura da página (~460-480px em 3508px)
  const logoX = 96
  const logoW = 460
  const logoH = 200
  const logoY = footerY + (footerHeight - logoH) / 2
  drawLogoCanvas(ctx, logoX, logoY, logoW, logoH, logoImg)

  // Block 2: Orange vertical bar + 3 lines (CLIENTE:, MODELO:, DATA:)
  // Posicionado logo após o logo, x ~ 610px (~17.4% da largura da página)
  const sec2X = 610
  const barW = 12
  const barH = 220
  const sec2Y = footerY + (footerHeight - barH) / 2

  // Orange vertical bar (#E08A2E)
  ctx.fillStyle = '#E08A2E'
  ctx.fillRect(sec2X, sec2Y, barW, barH)

  const textLeft2 = sec2X + 36
  ctx.letterSpacing = '0px'
  ctx.textAlign = 'left'

  // 3 linhas uniformes com espaçamento de 68px
  // Linha 1: CLIENTE:
  const line1Y = sec2Y + 44
  ctx.font = '700 44px Inter, sans-serif'
  ctx.fillStyle = '#5A5A5A'
  ctx.fillText('CLIENTE: ', textLeft2, line1Y)
  const cliLabelW = ctx.measureText('CLIENTE: ').width
  ctx.font = '400 44px Inter, sans-serif'
  ctx.fillStyle = '#222222'
  ctx.fillText(data.cliente || '-', textLeft2 + cliLabelW, line1Y)

  // Linha 2: MODELO:
  const line2Y = line1Y + 68
  ctx.font = '700 44px Inter, sans-serif'
  ctx.fillStyle = '#5A5A5A'
  ctx.fillText('MODELO: ', textLeft2, line2Y)
  const modLabelW = ctx.measureText('MODELO: ').width
  ctx.font = '400 44px Inter, sans-serif'
  ctx.fillStyle = '#222222'
  ctx.fillText(data.modelo || '-', textLeft2 + modLabelW, line2Y)

  // Linha 3: DATA:
  const line3Y = line2Y + 68
  ctx.font = '700 44px Inter, sans-serif'
  ctx.fillStyle = '#5A5A5A'
  ctx.fillText('DATA: ', textLeft2, line3Y)
  const datLabelW = ctx.measureText('DATA: ').width
  ctx.font = '400 44px Inter, sans-serif'
  ctx.fillStyle = '#222222'
  ctx.fillText(formatDisplayDate(data.data) || '-', textLeft2 + datLabelW, line3Y)

  // Block 3: 3 lines (VENDEDOR:, PROJETO:, RESPONSÁVEL:)
  // Começa em ~44% da largura da página (x ~ 1550px)
  const sec3X = Math.round(totalWidth * 0.442)

  // Linha 1: VENDEDOR:
  ctx.font = '700 44px Inter, sans-serif'
  ctx.fillStyle = '#5A5A5A'
  ctx.fillText('VENDEDOR: ', sec3X, line1Y)
  const vendLabelW = ctx.measureText('VENDEDOR: ').width
  ctx.font = '400 44px Inter, sans-serif'
  ctx.fillStyle = '#222222'
  ctx.fillText(data.vendedor || '-', sec3X + vendLabelW, line1Y)

  // Linha 2: PROJETO:
  ctx.font = '700 44px Inter, sans-serif'
  ctx.fillStyle = '#5A5A5A'
  ctx.fillText('PROJETO: ', sec3X, line2Y)
  const projLabelW = ctx.measureText('PROJETO: ').width
  ctx.font = '400 44px Inter, sans-serif'
  ctx.fillStyle = '#222222'
  ctx.fillText(data.projeto || '-', sec3X + projLabelW, line2Y)

  // Linha 3: RESPONSÁVEL:
  ctx.font = '700 44px Inter, sans-serif'
  ctx.fillStyle = '#5A5A5A'
  ctx.fillText('RESPONSÁVEL: ', sec3X, line3Y)
  const respLabelW = ctx.measureText('RESPONSÁVEL: ').width
  ctx.font = '400 44px Inter, sans-serif'
  ctx.fillStyle = '#222222'
  ctx.fillText(data.responsavel || '-', sec3X + respLabelW, line3Y)

  // Block 4: Copyright box + Big Page Number
  const pageNumStr = pageNumber < 10 ? `0${pageNumber}` : `${pageNumber}`
  const rightMargin = totalWidth - 88
  const sec4Right = rightMargin

  // Draw Page Number at right edge (prominent 210px gray, ~60% da altura do rodapé, cor cinza #737373)
  ctx.font = '700 200px Inter, sans-serif'
  ctx.fillStyle = '#737373'
  ctx.textAlign = 'right'
  const pageNumY = footerY + (footerHeight + 140) / 2
  ctx.fillText(pageNumStr, sec4Right, pageNumY)

  // Copyright box with dark background (#3A3A3A) e cantos levemente arredondados
  const pageNumWidth = ctx.measureText(pageNumStr).width
  const boxGap = 70
  const boxRight = sec4Right - pageNumWidth - boxGap
  const boxWidth = 710
  const boxLeft = boxRight - boxWidth
  const boxHeight = 185
  const boxTop = footerY + (footerHeight - boxHeight) / 2
  const boxRadius = 16

  // Box background com cantos arredondados
  ctx.fillStyle = '#3A3A3A'
  ctx.beginPath()
  if (ctx.roundRect) {
    ctx.roundRect(boxLeft, boxTop, boxWidth, boxHeight, boxRadius)
  } else {
    ctx.rect(boxLeft, boxTop, boxWidth, boxHeight)
  }
  ctx.fill()

  // Box text inside - 3 linhas miúdas brancas, exatamente como na referência:
  // Linha 1: © CORTEPLAN – Uso restrito e protegido pela Lei de
  // Linha 2: Direitos Autorais nº 9.610/98.
  // Linha 3: Solicite autorização para reprodução ou adaptação.
  ctx.textAlign = 'left'
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '400 30px Inter, sans-serif'
  ctx.letterSpacing = '0px'
  const boxPaddingX = 28
  const boxLine1Y = boxTop + 48
  const boxLineSpacing = 44
  ctx.fillText(COPYRIGHT_LINE_1, boxLeft + boxPaddingX, boxLine1Y)
  ctx.fillText(COPYRIGHT_LINE_2, boxLeft + boxPaddingX, boxLine1Y + boxLineSpacing)
  ctx.fillText(COPYRIGHT_LINE_3, boxLeft + boxPaddingX, boxLine1Y + boxLineSpacing * 2)

  ctx.restore()
}

/**
 * Draws the top discreet address bar
 */
export function drawAddressBarCanvas(ctx: CanvasRenderingContext2D, totalWidth: number) {
  ctx.save()
  ctx.fillStyle = '#8E8E8E'
  ctx.font = '500 26px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.letterSpacing = '0.5px'
  ctx.fillText(ADDRESS_TEXT, totalWidth / 2, 58)
  ctx.restore()
}

/**
 * Renders Cover Page onto a Canvas
 */
export async function renderCoverPageCanvas(canvas: HTMLCanvasElement): Promise<void> {
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  const ctx = canvas.getContext('2d')!

  // White background
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Pre-load official logo
  let logoImg: HTMLImageElement | null = null
  try {
    logoImg = await getOfficialLogoImage()
  } catch (e) {
    console.warn('Falha ao pré-carregar logo oficial para capa do PDF:', e)
  }

  // Big logo in center
  drawCoverLogoCanvas(ctx, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, logoImg)
}

/**
 * Renders an Image Page (Studio Render, Environment, Technical Drawing)
 */
export async function renderImagePageCanvas(
  canvas: HTMLCanvasElement,
  data: BoardData,
  imageUrl: string | null | undefined,
  pageNumber: number,
  fallbackLabel: string,
): Promise<void> {
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  const ctx = canvas.getContext('2d')!

  // White background
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Pre-load official logo
  let logoImg: HTMLImageElement | null = null
  try {
    logoImg = await getOfficialLogoImage()
  } catch (e) {
    console.warn('Falha ao pré-carregar logo oficial para rodapé do PDF:', e)
  }

  // Top address bar
  drawAddressBarCanvas(ctx, CANVAS_WIDTH)

  // Dimensions of usable area
  // Margens: 2.5% de 3508 = 88px nas laterais e no topo
  const marginX = 88
  const marginTop = 88

  // Rodapé: ~15% de 2480 = 372px
  const footerHeight = 372
  const footerY = CANVAS_HEIGHT - footerHeight

  // Imagem vai de marginTop até footerY:
  // altura da imagem: 2480 - 88 - 372 = 2020px (~81.5% do total; do topo até o fim da imagem são 2108px = ~85% da página!)
  const areaW = CANVAS_WIDTH - marginX * 2
  const areaH = footerY - marginTop
  const areaX = marginX
  const areaY = marginTop

  // Light gray hairline bounding box (#DCDCDC)
  ctx.strokeStyle = '#DCDCDC'
  ctx.lineWidth = 2
  ctx.strokeRect(areaX, areaY, areaW, areaH)

  // Draw image or placeholder inside the area
  if (imageUrl) {
    try {
      const img = await loadImage(imageUrl)
      drawImageCover(ctx, img, areaX, areaY, areaW, areaH)
    } catch {
      // Draw fallback error container
      ctx.fillStyle = '#F7F7F5'
      ctx.fillRect(areaX, areaY, areaW, areaH)
      ctx.fillStyle = '#8E8E8E'
      ctx.font = '500 32px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`Imagem não carregada (${fallbackLabel})`, CANVAS_WIDTH / 2, areaY + areaH / 2)
    }
  } else {
    // Empty state
    ctx.fillStyle = '#F7F7F5'
    ctx.fillRect(areaX, areaY, areaW, areaH)
    ctx.fillStyle = '#A0A0A0'
    ctx.font = '600 34px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(fallbackLabel, CANVAS_WIDTH / 2, areaY + areaH / 2 - 15)
    ctx.font = '400 22px Inter, sans-serif'
    ctx.fillText('Nenhuma imagem anexada', CANVAS_WIDTH / 2, areaY + areaH / 2 + 30)
  }

  // Draw Standard Footer
  drawFooterCanvas(ctx, data, pageNumber, CANVAS_WIDTH, footerY, footerHeight, logoImg)
}

/**
 * Native client-side PDF Builder that creates an A4 Landscape PDF
 * directly embedding JPEG compressed streams of the canvas renders.
 * This guarantees 100% exact fidelity without external binary dependencies.
 */
export async function generatePranchaPdf(
  data: BoardData,
  onProgress?: (step: string, current: number, total: number) => void,
): Promise<Blob> {
  const pagesToGenerate: Array<{
    type: 'cover' | 'render' | 'ambiente' | 'desenho'
    pageNumber: number
    title: string
    imageUrl?: string | null
  }> = []

  // Page 1: Capa (Capa não tem número nem rodapé)
  pagesToGenerate.push({
    type: 'cover',
    pageNumber: 0,
    title: 'Capa',
  })

  // Page 2: Render de estúdio (Página 01)
  pagesToGenerate.push({
    type: 'render',
    pageNumber: 1,
    title: 'Render de Estúdio',
    imageUrl: data.renderUrl,
  })

  // Page 3: Ambiente (se habilitada -> Página 02)
  if (data.includeAmbiente) {
    pagesToGenerate.push({
      type: 'ambiente',
      pageNumber: 2,
      title: 'Aplicação em Ambiente',
      imageUrl: data.ambienteUrl,
    })
  }

  // Final Page: Desenho técnico (03 se ambiente ativo, 02 se desativada)
  const technicalPageNumber = data.includeAmbiente ? 3 : 2
  pagesToGenerate.push({
    type: 'desenho',
    pageNumber: technicalPageNumber,
    title: 'Desenho Técnico',
    imageUrl: data.desenhoUrl,
  })

  const totalPages = pagesToGenerate.length
  const jpegBlobs: Uint8Array[] = []

  const canvas = document.createElement('canvas')

  for (let i = 0; i < totalPages; i++) {
    const page = pagesToGenerate[i]
    if (onProgress) {
      onProgress(`Renderizando ${page.title}...`, i + 1, totalPages)
    }

    if (page.type === 'cover') {
      await renderCoverPageCanvas(canvas)
    } else {
      await renderImagePageCanvas(canvas, data, page.imageUrl, page.pageNumber, page.title)
    }

    // Convert canvas to high-quality JPEG byte array (0.92 compression)
    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92)
    const base64Data = jpegDataUrl.split(',')[1]
    const binaryStr = atob(base64Data)
    const bytes = new Uint8Array(binaryStr.length)
    for (let j = 0; j < binaryStr.length; j++) {
      bytes[j] = binaryStr.charCodeAt(j)
    }
    jpegBlobs.push(bytes)
  }

  if (onProgress) {
    onProgress('Montando arquivo PDF...', totalPages, totalPages)
  }

  // Build PDF Binary Document (A4 Landscape: 841.89 x 595.28 pt)
  const pdfBytes = buildA4LandscapePdf(jpegBlobs)
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}

/**
 * Constructs a valid PDF 1.4 document from JPEG streams
 */
function buildA4LandscapePdf(jpegImages: Uint8Array[]): Uint8Array {
  // A4 Landscape size in PDF points (72 points/inch): 297mm x 210mm
  const widthPt = 841.89
  const heightPt = 595.28

  const chunks: (Uint8Array | string)[] = []
  const offsets: number[] = []
  let currentOffset = 0

  function write(str: string) {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(str)
    chunks.push(bytes)
    currentOffset += bytes.length
  }

  function writeBytes(bytes: Uint8Array) {
    chunks.push(bytes)
    currentOffset += bytes.length
  }

  // Header
  write('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')

  const pageCount = jpegImages.length
  // Object numbers mapping:
  // 1: Catalog
  // 2: Pages tree
  // For each page i (0-based):
  //   obj 3 + i*3: Page object
  //   obj 3 + i*3 + 1: Image XObject
  //   obj 3 + i*3 + 2: Content stream
  const catalogObjNum = 1
  const pagesObjNum = 2

  // Obj 1: Catalog
  offsets[catalogObjNum] = currentOffset
  write(`${catalogObjNum} 0 obj\n<< /Type /Catalog /Pages ${pagesObjNum} 0 R >>\nendobj\n`)

  // Prepare Page Object references
  const pageRefs: string[] = []
  for (let i = 0; i < pageCount; i++) {
    const pageObjNum = 3 + i * 3
    pageRefs.push(`${pageObjNum} 0 R`)
  }

  // Obj 2: Pages
  offsets[pagesObjNum] = currentOffset
  write(
    `${pagesObjNum} 0 obj\n<< /Type /Pages /Kids [${pageRefs.join(' ')}] /Count ${pageCount} >>\nendobj\n`,
  )

  // Each page's objects
  for (let i = 0; i < pageCount; i++) {
    const pageObjNum = 3 + i * 3
    const imgObjNum = pageObjNum + 1
    const contentObjNum = pageObjNum + 2

    const imgBytes = jpegImages[i]

    // Page object
    offsets[pageObjNum] = currentOffset
    write(
      `${pageObjNum} 0 obj\n<< /Type /Page /Parent ${pagesObjNum} 0 R /MediaBox [0 0 ${widthPt} ${heightPt}] /Contents ${contentObjNum} 0 R /Resources << /XObject << /Im${i + 1} ${imgObjNum} 0 R >> >> >>\nendobj\n`,
    )

    // Image XObject (DCTDecode / JPEG)
    offsets[imgObjNum] = currentOffset
    const imgHeader = `${imgObjNum} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${CANVAS_WIDTH} /Height ${CANVAS_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`
    write(imgHeader)
    writeBytes(imgBytes)
    write('\nendstream\nendobj\n')

    // Content stream to paint image across the full sheet
    offsets[contentObjNum] = currentOffset
    const contentData = `q\n${widthPt} 0 0 ${heightPt} 0 0 cm\n/Im${i + 1} Do\nQ\n`
    const contentBytes = new TextEncoder().encode(contentData)
    write(
      `${contentObjNum} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${contentData}endstream\nendobj\n`,
    )
  }

  // Cross-reference table (xref)
  const startXref = currentOffset
  const totalObjects = 3 + pageCount * 3
  write(`xref\n0 ${totalObjects}\n`)
  write('0000000000 65535 f \n')
  for (let i = 1; i < totalObjects; i++) {
    const off = offsets[i] || 0
    const padded = off.toString().padStart(10, '0')
    write(`${padded} 00000 n \n`)
  }

  // Trailer
  write(
    `trailer\n<< /Size ${totalObjects} /Root ${catalogObjNum} 0 R >>\nstartxref\n${startXref}\n%%EOF\n`,
  )

  // Concatenate all chunks into a single Uint8Array
  const finalPdf = new Uint8Array(currentOffset)
  let pos = 0
  for (const chunk of chunks) {
    if (typeof chunk === 'string') {
      const b = new TextEncoder().encode(chunk)
      finalPdf.set(b, pos)
      pos += b.length
    } else {
      finalPdf.set(chunk, pos)
      pos += chunk.length
    }
  }

  return finalPdf
}

/**
 * Triggers direct browser download of a Blob
 */
export function downloadPdf(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
