import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// ---------------------------------------------------------------------
//  Proxy a TCGPlayer (solo en dev).
//
//  Las APIs internas de TCGPlayer responden `access-control-allow-origin:
//  https://www.tcgplayer.com` — sólo su propio sitio. Un navegador no puede
//  falsificar el header `Origin`, así que desde la app es imposible pegarles
//  directo. El proxy de Vite corre del lado del servidor (Node), donde CORS
//  no aplica y sí se pueden mandar esos headers.
//
//  Para que esto ande PUBLICADO hace falta el mismo reenvío en un servidor
//  propio (p. ej. un Cloudflare Worker), que no está en este repo. Ver el
//  README, sección "Precios en vivo", y `config.tcgplayer.proxyBase`.
// ---------------------------------------------------------------------
const CABECERAS_TCG = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Origin: 'https://www.tcgplayer.com',
  Referer: 'https://www.tcgplayer.com/',
  Accept: 'application/json, text/plain, */*',
}

// base: en build usamos rutas relativas para que funcione publicado en una
// subcarpeta (GitHub Pages: /usuario.github.io/<repo>/). En dev queda en '/'.
// El puerto es 5174 a propósito: 5173 lo usa ButaTCG y los dos proyectos
// suelen estar levantados al mismo tiempo.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/tcg/search': {
        target: 'https://mp-search-api.tcgplayer.com',
        changeOrigin: true,
        // conserva el ?q= que manda el cliente
        rewrite: (p) => {
          const qs = p.includes('?') ? p.slice(p.indexOf('?') + 1) : ''
          return `/v1/search/request?${qs}${qs ? '&' : ''}isList=false`
        },
        headers: CABECERAS_TCG,
      },
      '/tcg/sales': {
        target: 'https://mpapi.tcgplayer.com',
        // /tcg/sales/544442 -> /v2/product/544442/latestsales
        rewrite: (p) =>
          `/v2/product/${p.split('/').pop()}/latestsales?mpfev=3202`,
        changeOrigin: true,
        headers: CABECERAS_TCG,
      },
    },
  },
  plugins: [react(), tailwindcss()],
}))
