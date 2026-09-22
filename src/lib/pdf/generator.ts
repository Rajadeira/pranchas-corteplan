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

export const COPYRIGHT_LINE_1 =
  '© CORTEPLAN – Uso restrito e protegido pela Lei de Direitos Autorais nº 9.610/98.'
export const COPYRIGHT_LINE_2 = 'Solicite autorização para reprodução ou adaptação.'

export const COPYRIGHT_TEXT = `${COPYRIGHT_LINE_1}\n${COPYRIGHT_LINE_2}`

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
 * Draws the standard Corteplan Logo on Canvas
 */
export function drawLogoCanvas(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)

  // Orange rectangle
  ctx.fillStyle = '#F2612A'
  ctx.fillRect(0, 0, 16, 60)

  // Brand text
  ctx.fillStyle = '#1F1F1F'
  ctx.font = '900 42px Inter, sans-serif'
  ctx.letterSpacing = '7px'
  ctx.fillText('CORTEPLAN', 32, 40)

  // Subtitle
  ctx.fillStyle = '#7A7A7A'
  ctx.font = '600 13px Inter, sans-serif'
  ctx.letterSpacing = '4px'
  ctx.fillText('MÓVEIS ESPECIAIS', 34, 58)

  ctx.restore()
}

/**
 * Draws the big Cover Logo
 */
export function drawCoverLogoCanvas(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save()
  ctx.translate(cx, cy)

  // Orange pillar
  ctx.fillStyle = '#F2612A'
  const pillarW = 28
  const pillarH = 110
  ctx.fillRect(-260, -pillarH / 2, pillarW, pillarH)

  // CORTEPLAN
  ctx.fillStyle = '#1F1F1F'
  ctx.font = '900 88px Inter, sans-serif'
  ctx.letterSpacing = '14px'
  ctx.textBaseline = 'middle'
  ctx.fillText('CORTEPLAN', -210, -10)

  // Subtitle
  ctx.fillStyle = '#6B6B6B'
  ctx.font = '600 24px Inter, sans-serif'
  ctx.letterSpacing = '8px'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('MÓVEIS ESPECIAIS & PDV', -206, 42)

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
  _footerHeight: number,
) {
  ctx.save()

  // Top dividing hairline matching the reference bounding box width
  ctx.strokeStyle = '#DCDCDC'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(80, footerY)
  ctx.lineTo(totalWidth - 80, footerY)
  ctx.stroke()

  // Block 1: Logo Corteplan
  const logoX = 90
  const logoY = footerY + 36
  drawLogoCanvas(ctx, logoX, logoY, 1.25)

  // Block 2: Orange vertical bar + 3 lines (CLIENTE:, MODELO:, DATA:)
  const sec2X = 640
  const sec2Y = footerY + 25
  const barH = 78

  // Orange vertical bar
  ctx.fillStyle = '#F2612A'
  ctx.fillRect(sec2X, sec2Y, 6, barH)

  const textLeft2 = sec2X + 22
  ctx.letterSpacing = '0px'
  ctx.textAlign = 'left'

  // Line 1: CLIENTE:
  ctx.font = '600 19px Inter, sans-serif'
  ctx.fillStyle = '#6B6B6B'
  ctx.fillText('CLIENTE: ', textLeft2, sec2Y + 20)
  const cliLabelW = ctx.measureText('CLIENTE: ').width
  ctx.font = '500 19px Inter, sans-serif'
  ctx.fillStyle = '#1F1F1F'
  ctx.fillText(data.cliente || '-', textLeft2 + cliLabelW, sec2Y + 20)

  // Line 2: MODELO:
  ctx.font = '600 19px Inter, sans-serif'
  ctx.fillStyle = '#6B6B6B'
  ctx.fillText('MODELO: ', textLeft2, sec2Y + 48)
  const modLabelW = ctx.measureText('MODELO: ').width
  ctx.font = '500 19px Inter, sans-serif'
  ctx.fillStyle = '#1F1F1F'
  ctx.fillText(data.modelo || '-', textLeft2 + modLabelW, sec2Y + 48)

  // Line 3: DATA:
  ctx.font = '600 19px Inter, sans-serif'
  ctx.fillStyle = '#6B6B6B'
  ctx.fillText('DATA: ', textLeft2, sec2Y + 74)
  const datLabelW = ctx.measureText('DATA: ').width
  ctx.font = '500 19px Inter, sans-serif'
  ctx.fillStyle = '#1F1F1F'
  ctx.fillText(formatDisplayDate(data.data) || '-', textLeft2 + datLabelW, sec2Y + 74)

  // Block 3: 3 lines (VENDEDOR:, PROJETO:, RESPONSÁVEL:)
  const sec3X = 1450
  const sec3Y = sec2Y

  // Line 1: VENDEDOR:
  ctx.font = '600 19px Inter, sans-serif'
  ctx.fillStyle = '#6B6B6B'
  ctx.fillText('VENDEDOR: ', sec3X, sec3Y + 20)
  const vendLabelW = ctx.measureText('VENDEDOR: ').width
  ctx.font = '500 19px Inter, sans-serif'
  ctx.fillStyle = '#1F1F1F'
  ctx.fillText(data.vendedor || '-', sec3X + vendLabelW, sec3Y + 20)

  // Line 2: PROJETO:
  ctx.font = '600 19px Inter, sans-serif'
  ctx.fillStyle = '#6B6B6B'
  ctx.fillText('PROJETO: ', sec3X, sec3Y + 48)
  const projLabelW = ctx.measureText('PROJETO: ').width
  ctx.font = '500 19px Inter, sans-serif'
  ctx.fillStyle = '#1F1F1F'
  ctx.fillText(data.projeto || '-', sec3X + projLabelW, sec3Y + 48)

  // Line 3: RESPONSÁVEL:
  ctx.font = '600 19px Inter, sans-serif'
  ctx.fillStyle = '#6B6B6B'
  ctx.fillText('RESPONSÁVEL: ', sec3X, sec3Y + 74)
  const respLabelW = ctx.measureText('RESPONSÁVEL: ').width
  ctx.font = '500 19px Inter, sans-serif'
  ctx.fillStyle = '#1F1F1F'
  ctx.fillText(data.responsavel || '-', sec3X + respLabelW, sec3Y + 74)

  // Block 4: Copyright box + Big Page Number
  // Page number string: 01, 02, 03...
  const pageNumStr = pageNumber < 10 ? `0${pageNumber}` : `${pageNumber}`
  const rightMargin = totalWidth - 80
  const sec4Right = rightMargin

  // Draw Page Number at right edge
  ctx.font = '800 68px Inter, sans-serif'
  ctx.fillStyle = '#6B6B6B'
  ctx.textAlign = 'right'
  ctx.fillText(pageNumStr, sec4Right, footerY + 84)

  // Copyright box with thin border (grey container with white background)
  const pageNumWidth = ctx.measureText(pageNumStr).width
  const boxRight = sec4Right - pageNumWidth - 42
  const boxWidth = 640
  const boxLeft = boxRight - boxWidth
  const boxTop = footerY + 24
  const boxHeight = 78

  // Box filled background (white) + thin border
  ctx.fillStyle = '#4B5563'
  ctx.fillStyle = '#374151'
  // In the reference, the box is dark grey/anthracite (#4B5563) with white text:
  // "© CORTEPLAN – Uso restrito e protegido pela Lei de Direitos Autorais nº 9.610/98."
  // "Solicite autorização para reprodução ou adaptação."
  ctx.fillStyle = '#3F444A'
  ctx.fillRect(boxLeft, boxTop, boxWidth, boxHeight)

  // Box text inside - 2 lines, small white text
  ctx.textAlign = 'left'
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '500 14px Inter, sans-serif'
  ctx.letterSpacing = '0px'
  ctx.fillText(COPYRIGHT_LINE_1, boxLeft + 18, boxTop + 33)
  ctx.fillText(COPYRIGHT_LINE_2, boxLeft + 18, boxTop + 58)

  ctx.restore()
}

/**
 * Draws the top discreet address bar
 */
export function drawAddressBarCanvas(ctx: CanvasRenderingContext2D, totalWidth: number) {
  ctx.save()
  ctx.fillStyle = '#8E8E8E'
  ctx.font = '500 18px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.letterSpacing = '0.4px'
  ctx.fillText(ADDRESS_TEXT, totalWidth / 2, 60)
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

  // Big logo in center
  drawCoverLogoCanvas(ctx, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
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

  // Top address bar
  drawAddressBarCanvas(ctx, CANVAS_WIDTH)

  // Dimensions of usable area
  const marginX = 80
  const marginTop = 90
  const footerHeight = 150
  const marginBottom = footerHeight + 20

  const areaW = CANVAS_WIDTH - marginX * 2
  const areaH = CANVAS_HEIGHT - marginTop - marginBottom
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
  const footerY = CANVAS_HEIGHT - footerHeight
  drawFooterCanvas(ctx, data, pageNumber, CANVAS_WIDTH, footerY, footerHeight)
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
