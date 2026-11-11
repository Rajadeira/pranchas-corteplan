/**
 * Plugin do Vite que garante os ícones do PWA no build de produção.
 *
 * - No closeBundle (após o build), chama generateIcons() — que decodifica o
 *   JPEG do logo oficial (src/assets/logo-novo-corteplan-ffd51.jpg) com o
 *   decodificador próprio (pwa-jpeg-decode.mjs) e escreve os PNGs (192, 512,
 *   maskable, apple-touch, favicon etc.) em public/icons/.
 * - Em seguida copia cada ícone gerado para a pasta de saída (dist/icons/…),
 *   de modo que o manifest (/icons/icon-192.png etc.) referencie arquivos
 *   que REALMENTE existem na saída servida — sem isso o Chrome/Edge não
 *   oferece o prompt de instalação nativo.
 * - O public/icons/ gerado também fica no repositório de trabalho (não é
 *   commitado: os binários são bloqueados), mas como a geração roda a cada
 *   build, os ícones sempre existem na saída.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateIcons, GENERATED_ICON_PATHS } from './pwa-icons-plugin.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))

export function pwaIconsPlugin() {
  let outDir = 'dist'
  return {
    name: 'corteplan-pwa-icons',
    apply: 'build',
    closeBundle() {
      // 1) Gera os PNGs a partir do logo oficial (sempre regenera — barato).
      generateIcons()

      // 2) Copia cada ícone para a saída do build (dist/icons/…).
      const outIcons = path.resolve(HERE, outDir, 'icons')
      fs.mkdirSync(outIcons, { recursive: true })
      let copied = 0
      for (const rel of GENERATED_ICON_PATHS) {
        const src = path.resolve(HERE, rel)
        if (!fs.existsSync(src)) continue
        const dest = path.resolve(HERE, outDir, path.relative('public', rel))
        fs.mkdirSync(path.dirname(dest), { recursive: true })
        fs.copyFileSync(src, dest)
        copied++
      }
      console.log(`[pwa-icons] ${copied} ícones copiados para ${outDir}/icons/`)
    },
    configResolved(config) {
      outDir = config.build.outDir
    },
  }
}
