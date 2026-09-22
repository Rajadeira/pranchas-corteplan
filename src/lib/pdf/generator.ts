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
import capaAssetUrl from '@/assets/capa-1-75e68.png'
import folhaMolduraAssetUrl from '@/assets/folha-01-1-cf7ef.png'

export { capaAssetUrl, folhaMolduraAssetUrl }

let cachedLogoImg: HTMLImageElement | null = null
let cachedGrayscaleLogoImg: HTMLCanvasElement | null = null
let cachedCapaImg: HTMLImageElement | null = null
let cachedFolhaMolduraImg: HTMLImageElement | null = null

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
 * Loads the official Cover PNG reference image (cached)
 */
export async function getOfficialCoverImage(): Promise<HTMLImageElement> {
  if (cachedCapaImg && cachedCapaImg.complete && cachedCapaImg.naturalWidth > 0) {
    return cachedCapaImg
  }
  cachedCapaImg = await loadImage(capaAssetUrl)
  return cachedCapaImg
}

/**
 * Loads the official Sheet Template PNG (locked background)
 */
export async function getOfficialSheetTemplateImage(): Promise<HTMLImageElement> {
  if (
    cachedFolhaMolduraImg &&
    cachedFolhaMolduraImg.complete &&
    cachedFolhaMolduraImg.naturalWidth > 0
  ) {
    return cachedFolhaMolduraImg
  }
  cachedFolhaMolduraImg = await loadImage(folhaMolduraAssetUrl)
  return cachedFolhaMolduraImg
}

/**
 * Generates a grayscale version of the Corteplan logo on a canvas
 */
export async function getGrayscaleLogoCanvas(): Promise<HTMLCanvasElement | null> {
  if (cachedGrayscaleLogoImg) {
    return cachedGrayscaleLogoImg
  }
  const img = await getOfficialLogoImage()
  if (!img || img.width === 0 || img.height === 0) return null

  const c = document.createElement('canvas')
  c.width = img.width
  c.height = img.height
  const ctx = c.getContext('2d')
  if (!ctx) return null

  ctx.drawImage(img, 0, 0)
  const imgData = ctx.getImageData(0, 0, c.width, c.height)
  const d = imgData.data
  for (let i = 0; i < d.length; i += 4) {
    // Standard luminance weights: 0.299 R + 0.587 G + 0.114 B
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
    d[i] = gray
    d[i + 1] = gray
    d[i + 2] = gray
  }
  ctx.putImageData(imgData, 0, 0)
  cachedGrayscaleLogoImg = c
  return cachedGrayscaleLogoImg
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
  logoSource?: HTMLImageElement | HTMLCanvasElement | null,
) {
  if (logoSource && logoSource.width > 0 && logoSource.height > 0) {
    const ratio = logoSource.width / logoSource.height
    let drawW = maxH * ratio
    let drawH = maxH
    if (drawW > maxW) {
      drawW = maxW
      drawH = drawW / ratio
    }
    const drawY = y + (maxH - drawH) / 2
    ctx.drawImage(logoSource, x, drawY, drawW, drawH)
    return
  }

  // Vector fallback if image is not loaded
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = '#737373'
  ctx.fillRect(0, 8, 14, 76)
  ctx.fillStyle = '#3A3A3A'
  ctx.font = '900 48px Inter, sans-serif'
  ctx.letterSpacing = '4px'
  ctx.fillText('CORTEPLAN', 28, 62)
  ctx.restore()
}

/**
 * Draws the Cover Logo using the official brand image (colored)
 * Width ~22-25% of sheet width (~820px), center ~45% of height
 */
export function drawCoverLogoCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  logoImg?: HTMLImageElement | null,
) {
  const targetW = 820 // ~23.4% of CANVAS_WIDTH (3508px)
  if (logoImg && logoImg.width > 0 && logoImg.height > 0) {
    const ratio = logoImg.width / logoImg.height
    const targetH = targetW / ratio
    ctx.drawImage(logoImg, cx - targetW / 2, cy - targetH / 2, targetW, targetH)
    return
  }

  // Fallback vector
  ctx.save()
  ctx.translate(cx, cy)
  ctx.fillStyle = '#E08A2E'
  ctx.fillRect(-220, -45, 18, 90)
  ctx.fillStyle = '#3A3A3A'
  ctx.font = '900 76px Inter, sans-serif'
  ctx.letterSpacing = '8px'
  ctx.textAlign = 'center'
  ctx.fillText('CORTEPLAN', 0, 25)
  ctx.restore()
}

/**
 * Draws the thin light gray outer page frame (#DCDCDC)
 * Uniform inset of ~1% of page width (35px) around the whole sheet
 */
export function drawPageOuterBorder(ctx: CanvasRenderingContext2D, totalW: number, totalH: number) {
  ctx.save()
  const inset = 35 // 1% of 3508
  ctx.strokeStyle = '#DCDCDC'
  ctx.lineWidth = 2
  ctx.strokeRect(inset, inset, totalW - inset * 2, totalH - inset * 2)
  ctx.restore()
}

/**
 * Draws the cover bottom anthracite bar with diagonal orange accent and address
 */
export function drawCoverBottomBar(ctx: CanvasRenderingContext2D, totalW: number, totalH: number) {
  ctx.save()

  // Bar height ~3.5% of total height (2480 * 0.035 = ~87px)
  const barH = 88
  const orangeLineH = 6 // Fine orange fillet under the anthracite bar at the bottom
  const barY = totalH - barH - orangeLineH

  // 1. Anthracite bar (#3A3A3A) spanning full width
  ctx.fillStyle = '#3A3A3A'
  ctx.fillRect(0, barY, totalW, barH)

  // 2. Orange thin fillet (#E08A2E) at the very base, directly beneath the bar
  ctx.fillStyle = '#E08A2E'
  ctx.fillRect(0, totalH - orangeLineH, totalW, orangeLineH)

  // 3. Orange diagonal cut / parallelogram at the left corner of the anthracite bar
  // A slanted shape / parallelogram: bottom extends to x=0, top-left starts a bit in or angled
  // Reference: tilted cut slicing into the left of the bar
  // In the reference image: an orange parallelogram on the left edge:
  // left-bottom corner at (0, barY + barH), right-bottom around x=100
  // top-left around x=70, top-right around x=170 (slanted at ~45-50 degrees)
  ctx.beginPath()
  const skewW = 55
  const triW = 100
  ctx.moveTo(0, barY + barH)
  ctx.lineTo(triW, barY + barH)
  ctx.lineTo(triW + skewW, barY)
  ctx.lineTo(skewW, barY)
  ctx.closePath()
  ctx.fillStyle = '#E08A2E'
  ctx.fill()

  // 4. Centered address in white italic text:
  // "CORTEPLAN MÓVEIS ESPECIAIS - R. Friedrich Bischof, nº 80 - Polo Industrial - Sertãozinho - Mauá"
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'italic 500 29px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.letterSpacing = '0.5px'
  ctx.fillText(ADDRESS_TEXT, totalW / 2, barY + barH / 2)

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
  grayscaleLogo?: HTMLCanvasElement | HTMLImageElement | null,
) {
  ctx.save()

  // Top dividing hairline matching the image bounding box width (marginX to totalWidth - marginX)
  ctx.strokeStyle = '#DCDCDC'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(88, footerY)
  ctx.lineTo(totalWidth - 88, footerY)
  ctx.stroke()

  // Block 1: Monochromatic/dark logo Corteplan (desaturated)
  // Height ~130px, maxW ~430px, vertically centered
  const logoX = 96
  const logoW = 420
  const logoH = 150
  const logoY = footerY + (footerHeight - logoH) / 2
  drawLogoCanvas(ctx, logoX, logoY, logoW, logoH, grayscaleLogo)

  // Item 7.a: Orange vertical bar (#E08A2E) - shorter, matching the height of the 3 text lines
  // Text lines: line 1 at sec2Y + 36, line 2 at +50, line 3 at +50 -> total span ~115px
  const barH = 138
  const barW = 10
  const sec2X = 570
  const sec2Y = footerY + (footerHeight - barH) / 2

  ctx.fillStyle = '#E08A2E'
  ctx.fillRect(sec2X, sec2Y, barW, barH)

  const textLeft2 = sec2X + 28
  ctx.letterSpacing = '0px'
  ctx.textAlign = 'left'

  // Item 7.b: Labels in bold dark gray (#3A3A3A / #4A4A4A); values in regular graphite (#222222 / #2B2B2B)
  const lineSpacing = 46
  const line1Y = sec2Y + 28
  const line2Y = line1Y + lineSpacing
  const line3Y = line2Y + lineSpacing

  // Line 1: CLIENTE:
  ctx.font = '700 34px Inter, sans-serif'
  ctx.fillStyle = '#3A3A3A'
  ctx.fillText('CLIENTE:', textLeft2, line1Y)
  const cliLabelW = ctx.measureText('CLIENTE: ').width
  ctx.font = '400 34px Inter, sans-serif'
  ctx.fillStyle = '#222222'
  ctx.fillText(data.cliente || '-', textLeft2 + cliLabelW, line1Y)

  // Line 2: MODELO:
  ctx.font = '700 34px Inter, sans-serif'
  ctx.fillStyle = '#3A3A3A'
  ctx.fillText('MODELO:', textLeft2, line2Y)
  const modLabelW = ctx.measureText('MODELO: ').width
  ctx.font = '400 34px Inter, sans-serif'
  ctx.fillStyle = '#222222'
  ctx.fillText(data.modelo || '-', textLeft2 + modLabelW, line2Y)

  // Line 3: DATA:
  ctx.font = '700 34px Inter, sans-serif'
  ctx.fillStyle = '#3A3A3A'
  ctx.fillText('DATA:', textLeft2, line3Y)
  const datLabelW = ctx.measureText('DATA: ').width
  ctx.font = '400 34px Inter, sans-serif'
  ctx.fillStyle = '#222222'
  ctx.fillText(formatDisplayDate(data.data) || '-', textLeft2 + datLabelW, line3Y)

  // Block 3: 3 lines (VENDEDOR:, PROJETO:, RESPONSÁVEL:) at ~44% of page width
  const sec3X = Math.round(totalWidth * 0.442)

  // Line 1: VENDEDOR:
  ctx.font = '700 34px Inter, sans-serif'
  ctx.fillStyle = '#3A3A3A'
  ctx.fillText('VENDEDOR:', sec3X, line1Y)
  const vendLabelW = ctx.measureText('VENDEDOR: ').width
  ctx.font = '400 34px Inter, sans-serif'
  ctx.fillStyle = '#222222'
  ctx.fillText(data.vendedor || '-', sec3X + vendLabelW, line1Y)

  // Line 2: PROJETO:
  ctx.font = '700 34px Inter, sans-serif'
  ctx.fillStyle = '#3A3A3A'
  ctx.fillText('PROJETO:', sec3X, line2Y)
  const projLabelW = ctx.measureText('PROJETO: ').width
  ctx.font = '400 34px Inter, sans-serif'
  ctx.fillStyle = '#222222'
  ctx.fillText(data.projeto || '-', sec3X + projLabelW, line2Y)

  // Line 3: RESPONSÁVEL:
  ctx.font = '700 34px Inter, sans-serif'
  ctx.fillStyle = '#3A3A3A'
  ctx.fillText('RESPONSÁVEL:', sec3X, line3Y)
  const respLabelW = ctx.measureText('RESPONSÁVEL: ').width
  ctx.font = '400 34px Inter, sans-serif'
  ctx.fillStyle = '#222222'
  ctx.fillText(data.responsavel || '-', sec3X + respLabelW, line3Y)

  // Block 4: Copyright box + Big Page Number
  const pageNumStr = pageNumber < 10 ? `0${pageNumber}` : `${pageNumber}`
  const rightMargin = totalWidth - 88
  const sec4Right = rightMargin

  // Item 7.d: Page number digits ("01", "02", "03"): big medium gray (#737373), weight 900
  ctx.font = '900 135px Inter, sans-serif'
  ctx.fillStyle = '#737373'
  ctx.textAlign = 'right'
  const pageNumY = 2356
  ctx.fillText(pageNumStr, sec4Right, pageNumY)

  // Item 7.c: Copyright box: anthracite (#3A3A3A) rounded small radius (x=2490, y=2270, w=685, h=125)
  const boxLeft = 2490
  const boxTop = 2270
  const boxWidth = 685
  const boxHeight = 125
  const boxRadius = 10

  ctx.fillStyle = '#3A3A3A'
  ctx.beginPath()
  if (ctx.roundRect) {
    ctx.roundRect(boxLeft, boxTop, boxWidth, boxHeight, boxRadius)
  } else {
    ctx.rect(boxLeft, boxTop, boxWidth, boxHeight)
  }
  ctx.fill()

  // 3 small white lines in copyright box
  ctx.textAlign = 'left'
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '400 22px Inter, sans-serif'
  ctx.letterSpacing = '0px'
  const boxPaddingX = 26
  const boxLine1Y = boxTop + 38
  const boxLineSpacing = 32
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
 * Renders Cover Page onto a Canvas.
 * Uses the user's official cover PNG directly across the full A4 landscape sheet.
 * Falls back to programmatic render if image load fails.
 */
export async function renderCoverPageCanvas(canvas: HTMLCanvasElement): Promise<void> {
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  const ctx = canvas.getContext('2d')!

  try {
    const capaImg = await getOfficialCoverImage()
    if (capaImg && capaImg.width > 0 && capaImg.height > 0) {
      // Draw official PNG across full A4 sheet (3508 x 2480, 300 DPI)
      ctx.drawImage(capaImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      return
    }
  } catch (err) {
    console.warn('Falha ao carregar imagem PNG da capa, usando fallback vetorial:', err)
  }

  // Fallback programmatic cover if image load fails
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  drawPageOuterBorder(ctx, CANVAS_WIDTH, CANVAS_HEIGHT)

  let logoImg: HTMLImageElement | null = null
  try {
    logoImg = await getOfficialLogoImage()
  } catch (e) {
    console.warn('Falha ao pré-carregar logo oficial para capa do PDF:', e)
  }

  drawCoverLogoCanvas(ctx, CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.45, logoImg)
  drawCoverBottomBar(ctx, CANVAS_WIDTH, CANVAS_HEIGHT)
}

/**
 * Deterministic layout positions for Locked Presentation Sheet:
 * The template has fixed/locked elements:
 * - Outer light gray frame (#DCDCDC) inset at 35px
 * - Inner photo box from x=88, y=88 to totalWidth-88, y=2200
 * - Locked footer template:
 *   - Logo monochromatic/desaturated on left
 *   - Orange vertical divider bar
 *   - Labels: CLIENTE:, MODELO:, DATA:, VENDEDOR:, PROJETO:, RESPONSÁVEL:
 *   - Anthracite copyright box with exact 2-line legal text
 *   - Big page number digits in gray
 */

// Usable inner photo area (3332 x 2112 px)
export const SHEET_IMAGE_X = 88
export const SHEET_IMAGE_Y = 88
export const SHEET_IMAGE_WIDTH = CANVAS_WIDTH - SHEET_IMAGE_X * 2 // 3332px (88 to 3420)
export const SHEET_FOOTER_Y = 2200 // dividing hairline
export const SHEET_IMAGE_HEIGHT = SHEET_FOOTER_Y - SHEET_IMAGE_Y // 2112px

// Locked footer positions
export const FOOTER_LINE1_Y = 2270
export const FOOTER_LINE2_Y = 2322
export const FOOTER_LINE3_Y = 2374

export const COL1_LABEL_X = 600 // to the right of the vertical orange line (which ends at x ~580)
export const COL2_LABEL_X = 1550 // Column 2 (~44% of sheet width)

/**
 * Draws all dynamic footer overlays over the sheet template:
 * - Col 1: CLIENTE, MODELO, DATA (labels in bold dark gray + values in regular graphite)
 * - Col 2: VENDEDOR, PROJETO, RESPONSÁVEL (labels in bold dark gray + values in regular graphite)
 * - Copyright box: rounded dark anthracite box with the 3 lines of legal notice
 * - Big Page Number: high-impact gray digits ("01", "02", etc.) aligned with right edge
 */
export function drawSheetFooterOverlays(
  ctx: CanvasRenderingContext2D,
  data: BoardData,
  pageNumber: number,
) {
  ctx.save()
  ctx.letterSpacing = '0px'
  ctx.textAlign = 'left'

  // --- Column 1 (CLIENTE, MODELO, DATA) ---
  // Line 1: CLIENTE:
  ctx.font = '700 32px Inter, sans-serif'
  ctx.fillStyle = '#3A3A3A'
  ctx.fillText('CLIENTE:', COL1_LABEL_X, FOOTER_LINE1_Y)
  const cliW = ctx.measureText('CLIENTE: ').width
  ctx.font = '400 32px Inter, sans-serif'
  ctx.fillStyle = '#222222'
  ctx.fillText(data.cliente || '-', COL1_LABEL_X + cliW, FOOTER_LINE1_Y)

  // Line 2: MODELO:
  ctx.font = '700 32px Inter, sans-serif'
  ctx.fillStyle = '#3A3A3A'
  ctx.fillText('MODELO:', COL1_LABEL_X, FOOTER_LINE2_Y)
  const modW = ctx.measureText('MODELO: ').width
  ctx.font = '400 32px Inter, sans-serif'
  ctx.fillStyle = '#222222'
  ctx.fillText(data.modelo || '-', COL1_LABEL_X + modW, FOOTER_LINE2_Y)

  // Line 3: DATA:
  ctx.font = '700 32px Inter, sans-serif'
  ctx.fillStyle = '#3A3A3A'
  ctx.fillText('DATA:', COL1_LABEL_X, FOOTER_LINE3_Y)
  const datW = ctx.measureText('DATA: ').width
  ctx.font = '400 32px Inter, sans-serif'
  ctx.fillStyle = '#222222'
  ctx.fillText(formatDisplayDate(data.data) || '-', COL1_LABEL_X + datW, FOOTER_LINE3_Y)

  // --- Column 2 (VENDEDOR, PROJETO, RESPONSÁVEL) ---
  // Line 1: VENDEDOR:
  ctx.font = '700 32px Inter, sans-serif'
  ctx.fillStyle = '#3A3A3A'
  ctx.fillText('VENDEDOR:', COL2_LABEL_X, FOOTER_LINE1_Y)
  const vendW = ctx.measureText('VENDEDOR: ').width
  ctx.font = '400 32px Inter, sans-serif'
  ctx.fillStyle = '#222222'
  ctx.fillText(data.vendedor || '-', COL2_LABEL_X + vendW, FOOTER_LINE1_Y)

  // Line 2: PROJETO:
  ctx.font = '700 32px Inter, sans-serif'
  ctx.fillStyle = '#3A3A3A'
  ctx.fillText('PROJETO:', COL2_LABEL_X, FOOTER_LINE2_Y)
  const projW = ctx.measureText('PROJETO: ').width
  ctx.font = '400 32px Inter, sans-serif'
  ctx.fillStyle = '#222222'
  ctx.fillText(data.projeto || '-', COL2_LABEL_X + projW, FOOTER_LINE2_Y)

  // Line 3: RESPONSÁVEL:
  ctx.font = '700 32px Inter, sans-serif'
  ctx.fillStyle = '#3A3A3A'
  ctx.fillText('RESPONSÁVEL:', COL2_LABEL_X, FOOTER_LINE3_Y)
  const respW = ctx.measureText('RESPONSÁVEL: ').width
  ctx.font = '400 32px Inter, sans-serif'
  ctx.fillStyle = '#222222'
  ctx.fillText(data.responsavel || '-', COL2_LABEL_X + respW, FOOTER_LINE3_Y)

  // --- Big Page Number ("01", "02", "03", etc.) ---
  const pageNumStr = pageNumber < 10 ? `0${pageNumber}` : `${pageNumber}`
  ctx.font = '900 135px Inter, sans-serif'
  ctx.fillStyle = '#737373'
  ctx.textAlign = 'right'
  ctx.fillText(pageNumStr, CANVAS_WIDTH - SHEET_IMAGE_X, 2356)

  // --- Copyright box (Anthracite #3A3A3A with rounded corners) ---
  const boxLeft = 2490
  const boxTop = 2266
  const boxWidth = 685
  const boxHeight = 125
  const boxRadius = 10

  ctx.fillStyle = '#3A3A3A'
  ctx.beginPath()
  if (ctx.roundRect) {
    ctx.roundRect(boxLeft, boxTop, boxWidth, boxHeight, boxRadius)
  } else {
    ctx.rect(boxLeft, boxTop, boxWidth, boxHeight)
  }
  ctx.fill()

  // 3 lines inside copyright box in white
  ctx.textAlign = 'left'
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '400 22px Inter, sans-serif'
  ctx.letterSpacing = '0px'
  const boxPaddingX = 26
  const boxLine1Y = boxTop + 38
  const boxLineSpacing = 32
  ctx.fillText(COPYRIGHT_LINE_1, boxLeft + boxPaddingX, boxLine1Y)
  ctx.fillText(COPYRIGHT_LINE_2, boxLeft + boxPaddingX, boxLine1Y + boxLineSpacing)
  ctx.fillText(COPYRIGHT_LINE_3, boxLeft + boxPaddingX, boxLine1Y + boxLineSpacing * 2)

  ctx.restore()
}

/**
 * Renders an Image Page (Studio Render, Environment, Technical Drawing)
 * using the locked sheet template PNG as the fixed deterministic background,
 * with the uploaded photo clipped into the fixed image box,
 * and dynamic project text + page number rendered in fixed positions.
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

  // 1. Draw base white
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // 2. Draw user image inside the deterministic photo area
  if (imageUrl) {
    try {
      const img = await loadImage(imageUrl)
      drawImageCover(ctx, img, SHEET_IMAGE_X, SHEET_IMAGE_Y, SHEET_IMAGE_WIDTH, SHEET_IMAGE_HEIGHT)
    } catch {
      ctx.fillStyle = '#F7F7F5'
      ctx.fillRect(SHEET_IMAGE_X, SHEET_IMAGE_Y, SHEET_IMAGE_WIDTH, SHEET_IMAGE_HEIGHT)
      ctx.fillStyle = '#8E8E8E'
      ctx.font = '500 32px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(
        `Imagem não carregada (${fallbackLabel})`,
        CANVAS_WIDTH / 2,
        SHEET_IMAGE_Y + SHEET_IMAGE_HEIGHT / 2,
      )
    }
  } else {
    ctx.fillStyle = '#F7F7F5'
    ctx.fillRect(SHEET_IMAGE_X, SHEET_IMAGE_Y, SHEET_IMAGE_WIDTH, SHEET_IMAGE_HEIGHT)
    ctx.fillStyle = '#A0A0A0'
    ctx.font = '600 34px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(fallbackLabel, CANVAS_WIDTH / 2, SHEET_IMAGE_Y + SHEET_IMAGE_HEIGHT / 2 - 15)
    ctx.font = '400 22px Inter, sans-serif'
    ctx.fillText(
      'Nenhuma imagem anexada',
      CANVAS_WIDTH / 2,
      SHEET_IMAGE_Y + SHEET_IMAGE_HEIGHT / 2 + 30,
    )
  }

  // 3. Draw the locked template overlay (moldura, divider, footer labels, logo, copyright box)
  let drewTemplate = false
  try {
    const templateImg = await getOfficialSheetTemplateImage()
    if (templateImg && templateImg.width > 0 && templateImg.height > 0) {
      // The locked template PNG has transparent/black image area.
      // We only want the frame and footer locked.
      // Notice: the template PNG has the entire border and footer.
      // Draw the footer and borders directly from the locked template image:
      // Outer border top & sides:
      // In fact, the template PNG is 3508 x 2480. We can draw the footer strip:
      // From y=2198 to 2480:
      ctx.drawImage(
        templateImg,
        0,
        SHEET_FOOTER_Y - 2,
        CANVAS_WIDTH,
        CANVAS_HEIGHT - SHEET_FOOTER_Y + 2,
        0,
        SHEET_FOOTER_Y - 2,
        CANVAS_WIDTH,
        CANVAS_HEIGHT - SHEET_FOOTER_Y + 2,
      )
      // And outer border:
      drawPageOuterBorder(ctx, CANVAS_WIDTH, CANVAS_HEIGHT)
      // And image bounding box border:
      ctx.save()
      ctx.strokeStyle = '#DCDCDC'
      ctx.lineWidth = 2
      ctx.strokeRect(SHEET_IMAGE_X, SHEET_IMAGE_Y, SHEET_IMAGE_WIDTH, SHEET_IMAGE_HEIGHT)
      ctx.restore()
      drewTemplate = true
    }
  } catch (err) {
    console.warn('Falha ao usar folha-01 PNG como template travado:', err)
  }

  // Fallback to programmatic footer if template PNG could not be loaded
  if (!drewTemplate) {
    drawPageOuterBorder(ctx, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.strokeStyle = '#DCDCDC'
    ctx.lineWidth = 2
    ctx.strokeRect(SHEET_IMAGE_X, SHEET_IMAGE_Y, SHEET_IMAGE_WIDTH, SHEET_IMAGE_HEIGHT)
    let grayscaleLogo: HTMLCanvasElement | null = null
    try {
      grayscaleLogo = await getGrayscaleLogoCanvas()
    } catch {
      /* intentionally ignored */
    }
    drawFooterCanvas(
      ctx,
      data,
      pageNumber,
      CANVAS_WIDTH,
      SHEET_FOOTER_Y,
      CANVAS_HEIGHT - SHEET_FOOTER_Y,
      grayscaleLogo,
    )
    return
  }

  // 4. Render labels, values, copyright box and page number over the template
  // The new blank sheet contains: outer frame, photo separator line, logo Corteplan and vertical orange line.
  // The dynamic overlays to draw are:
  // - Col 1 labels (CLIENTE:, MODELO:, DATA:) + values (aligned immediately to the right of the orange line, textLeft = 600)
  // - Col 2 labels (VENDEDOR:, PROJETO:, RESPONSÁVEL:) + values
  // - Copyright box (anthracite box + 3 white lines)
  // - Big page number (e.g. "01", "02")
  drawSheetFooterOverlays(ctx, data, pageNumber)
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
