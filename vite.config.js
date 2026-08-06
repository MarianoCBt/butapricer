import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: en build usamos rutas relativas para que funcione publicado en una
// subcarpeta (GitHub Pages: /usuario.github.io/<repo>/). En dev queda en '/'.
// El puerto es 5174 a propósito: 5173 lo usa ButaTCG y los dos proyectos
// suelen estar levantados al mismo tiempo.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  server: { port: 5174, strictPort: true },
  plugins: [react(), tailwindcss()],
}))
