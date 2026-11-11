/* Service worker do Pranchas Corteplan (PWA instalável)
 *
 * Estratégias:
 * - Pre-cache do shell (index.html + /offline.html) na instalação.
 * - Navegações: network-first com fallback para /offline.html quando offline.
 * - Assets estáticos (/_assets/, /icons/, /manifest.webmanifest):
 *   cache-first com atualização em segundo plano (stale-while-revalidate).
 * - Tudo o que vai para o backend PocketBase (autenticação, coleções,
 *   arquivos) NUNCA é cacheado — evita servir sessão/pranchas obsoletas.
 */

const CACHE_NAME = 'corteplan-shell-v3'

// URLs do shell que precisam estar disponíveis para o fallback offline.
const PRECACHE_URLS = ['/', '/index.html', '/offline.html', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      // addAll falha se qualquer URL falhar; faça uma a uma para tolerar 404 de ícones.
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            await cache.add(new Request(url, { cache: 'reload' }))
          } catch (_e) {
            // ignora falha de pre-cache individual (ex.: offline.html indisponível)
          }
        }),
      )
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
      await self.clients.claim()
    })(),
  )
})

// Origem do backend PocketBase (vem do VITE_POCKETBASE_URL no build).
const POCKETBASE_URL = import.meta.env.VITE_POCKETBASE_URL || ''

function isPocketBaseRequest(url) {
  if (!POCKETBASE_URL) return false
  try {
    return new URL(url).origin === new URL(POCKETBASE_URL).origin
  } catch (_e) {
    return false
  }
}

// Extensões de asset estático gerado pelo Vite.
const STATIC_EXT_RE =
  /\.(?:js|css|png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|otf|eot|json|webmanifest|txt|pdf)$/i

const isStaticAsset = (url) => {
  const p = new URL(url).pathname
  return p.startsWith('/assets/') || p.startsWith('/icons/') || STATIC_EXT_RE.test(p)
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = request.url

  // Ignora requisições não-GET (POST/PUT/DELETE de salvar projeto, login, etc.)
  if (request.method !== 'GET') return

  // NUNCA intercepta nada do backend PocketBase — dados de sessão e pranchas
  // precisam sempre vir da rede para não ficarem obsoletos.
  if (isPocketBaseRequest(url)) return

  // Ignora qualquer coisa fora da origem do próprio app (CDNs, etc).
  if (new URL(url).origin !== self.location.origin) return

  // 1) Navegações (document): network-first com fallback offline.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request)
          // Atualiza o cache do shell com a versão mais recente do index.
          const cache = await caches.open(CACHE_NAME)
          cache.put(request, fresh.clone())
          return fresh
        } catch (_err) {
          const cached = await caches.match(request)
          if (cached) return cached
          const offline = await caches.match('/offline.html')
          if (offline) return offline
          return new Response('Sem conexão', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
        }
      })(),
    )
    return
  }

  // 2) Assets estáticos: stale-while-revalidate (sirve rápido, atualiza em bg).
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME)
        const cached = await cache.match(request)
        const network = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              cache.put(request, response.clone())
            }
            return response
          })
          .catch(() => undefined)
        return cached || (await network) || Response.error()
      })(),
    )
  }
})

// Permite que a página peça para pular a espera do SW antigo (ativação imediata
// após update do shell).
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
