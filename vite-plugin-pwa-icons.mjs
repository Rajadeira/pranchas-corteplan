/**
 * Plugin Vite que roda o gerador de ícones (pwa-icons-plugin.mjs) no build,
 * ANTES do vite copiar public/ para dist/. Também remove os ícones antigos
 * (versão anterior, sem sufixo -v2) do public/ para não subirem no dist.
 */
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { generateIcons, GENERATED_ICON_PATHS } from './pwa-icons-plugin.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))

/** Nomes dos ícones da versão anterior (sem sufixo -v2) a remover do public/. */
const OLD_ICON_BASENAMES = [
  'icon-48.png',
  'icon-72.png',
  'icon-96.png',
  'icon-144.png',
  'icon-192.png',
  'icon-512.png',
  'icon-1024.png',
  'maskable-icon-192.png',
  'maskable-icon-512.png',
  'apple-touch-icon.png',
  'favicon.ico',
]

export function pwaIconsPlugin() {
  return {
    name: 'pwa-icons-v2',
    apply: 'build',
    buildStart() {
      generateIcons()
      // Remove ícones da versão anterior de public/icons (e o favicon.ico
      // antigo), para que o dist só leve os arquivos -v2.
      const iconsDir = path.join(HERE, 'public', 'icons')
      if (fs.existsSync(iconsDir)) {
        for (const name of OLD_ICON_BASENAMES) {
          const p = path.join(iconsDir, name)
          if (fs.existsSync(p)) fs.rmSync(p)
        }
      }
      const oldFavicon = path.join(HERE, 'public', 'favicon.ico')
      if (fs.existsSync(oldFavicon)) fs.rmSync(oldFavicon)
      // Garante que os arquivos gerados existam (fallback caso public/icons
      // não exista ainda).
      for (const rel of GENERATED_ICON_PATHS) {
        const abs = path.join(ViteRoot(), rel)
        if (!fs.existsSync(abs)) {
          throw new Error(`[pwa-icons-v2] ícone não gerado: ${rel}`)
        }
      }
    },
  }
}

function ViteRoot() {
  return HERE
}
