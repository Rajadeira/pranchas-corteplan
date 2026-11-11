/**
 * Plugin Vite que roda o gerador de ícones (pwa-icons-plugin.mjs) no build,
 * ANTES do vite copiar public/ para dist/. Também remove os ícones das versões
 * anteriores (sem sufixo e com sufixo -v2) do public/ para não subirem no dist.
 */
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { generateIcons, GENERATED_ICON_PATHS } from './pwa-icons-plugin.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))

/** Nomes dos ícones de versões anteriores a remover do public/. */
const OLD_ICON_BASENAMES = [
  // v1 (sem sufixo)
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
  // v2 (letra C deformada — figura estranha reportada pelo usuário)
  'icon-48-v2.png',
  'icon-72-v2.png',
  'icon-96-v2.png',
  'icon-144-v2.png',
  'icon-192-v2.png',
  'icon-512-v2.png',
  'icon-1024-v2.png',
  'maskable-icon-192-v2.png',
  'maskable-icon-512-v2.png',
  'apple-touch-icon-v2.png',
  'favicon-v2.ico',
]

export function pwaIconsPlugin() {
  return {
    name: 'pwa-icons-v3',
    apply: 'build',
    buildStart() {
      generateIcons()
      // Remove ícones das versões anteriores de public/icons (e os favicons
      // antigos), para que o dist só leve os arquivos da versão atual.
      const iconsDir = path.join(HERE, 'public', 'icons')
      if (fs.existsSync(iconsDir)) {
        for (const name of OLD_ICON_BASENAMES) {
          const p = path.join(iconsDir, name)
          if (fs.existsSync(p)) fs.rmSync(p)
        }
      }
      for (const oldFavicon of ['favicon.ico', 'favicon-v2.ico']) {
        const p = path.join(HERE, 'public', oldFavicon)
        if (fs.existsSync(p)) fs.rmSync(p)
      }
      // Garante que os arquivos gerados existam (fallback caso public/icons
      // não exista ainda).
      for (const rel of GENERATED_ICON_PATHS) {
        const abs = path.join(ViteRoot(), rel)
        if (!fs.existsSync(abs)) {
          throw new Error(`[pwa-icons-v3] ícone não gerado: ${rel}`)
        }
      }
    },
  }
}

function ViteRoot() {
  return HERE
}
