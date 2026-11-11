/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './main.css'
import { registerServiceWorker } from './lib/pwa'

// @skip-protected: Do not remove. Required for React rendering.
createRoot(document.getElementById('root')!).render(<App />)

// PWA: registra o service worker (produção) e captura o prompt de instalação.
registerServiceWorker()
