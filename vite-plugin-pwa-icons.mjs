/**
 * Plugin do Vite que garante os ícones do PWA em TODOS os builds (dev e prod).
 *
 * - No buildStart, chama generateIcons() — que desenha o ícone da marca
 *   (fundo branco sólido + letra "C" laranja #F2612A) em RGBA puro e escreve
 *   os PNGs (48…1024, maskable 192/512, apple-touch, favicon) em public/icons/.
 * - No closeBundle (após o build), chama generateIcons() de novo e copia cada
 *   ícone gerado para a pasta de saída (dist/icons/…), de modo que o manifest
 *   (/icons/icon-192.png etc.) referencie arquivos que REALMENTE existem na
 *   saída servida — sem isso o Chrome/Edge não oferece o prompt de instalação.
 * - O public/icons/ gerado fica na árvore de trabalho (não é commitado: os
 *   binários são bloqueados), mas como a geração roda a cada build, os ícones
 *   sempre existem na saída — tanto em dev (dev-dist/) quanto em produção.
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
    // Roda em dev também: o servidor de desenvolvimento (dev-dist/) e a
    // pré-visualização servem os ícones a partir daqui.
    apply: 'build',
    enforce: 'post',
    buildStart() {
      // 1) Gera os PNGs no início do build (sempre regenera — barato).
      generateIcons()
    },
    closeBundle() {
      // 1) Regenera os PNGs (idempotente, garante ícones atuais).
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
