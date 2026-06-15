import { defineConfig } from "vite"

export default defineConfig({
  base: "./",
  server: { open: true },
  build: {
    // бандл кладём в _app, чтобы не смешивать с игровыми ассетами из public/assets
    assetsDir: "_app",
  },
})
