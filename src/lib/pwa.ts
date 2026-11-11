/**
 * Serviço de registro do service worker + prompt de instalação do PWA
 * (Pranchas Corteplan).
 *
 * - Registra /sw.js na inicialização, em produção.
 * - Expõe `beforeinstallprompt` capturado para o botão "Instalar app" do menu.
 * - Não altera nenhum fluxo existente (login, gerador, projetos).
 */
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
let registered = false

const listeners = new Set<() => void>()

function notify() {
  for (const fn of listeners) fn()
}

export function registerServiceWorker() {
  if (registered) return
  registered = true
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return
  // Só registra em produção (o dev server não serve /sw.js na raiz).
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* sem SW: o app segue funcionando online normalmente */
      })
    })
  }
}

export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(() => deferredPrompt !== null)

  useEffect(() => {
    const handler = () => setCanInstall(deferredPrompt !== null)
    listeners.add(handler)
    setCanInstall(deferredPrompt !== null)
    return () => {
      listeners.delete(handler)
    }
  }, [])

  const promptInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPrompt) return 'unavailable'
    const ev = deferredPrompt
    deferredPrompt = null
    notify()
    await ev.prompt()
    const choice = await ev.userChoice
    return choice.outcome
  }

  return { canInstall, promptInstall }
}

// Captura o evento de instalação o mais cedo possível, no carregamento do módulo.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
}
