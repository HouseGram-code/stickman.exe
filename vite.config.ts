import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  base: "./",
  server: { open: true },
  build: {
    // бандл кладём в _app, чтобы не смешивать с игровыми ассетами из public/assets
    assetsDir: "_app",
  },
  plugins: [
    VitePWA({
      // ВРЕМЕННО: самоуничтожающийся service worker. Он вычищает старый PWA-кэш,
      // из-за которого на части устройств игра падала (битый/устаревший кэш),
      // и отписывает сам себя. Офлайн временно отключён — страница грузится из сети.
      // Вернём офлайн отдельно, проверив сборку через headless-тест.
      selfDestroying: true,
      // service worker обновляется сам, когда выходит новая сборка
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["favicon.svg"],
      manifest: {
        id: "./",
        name: "STICKMAN.EXE",
        short_name: "STICKMAN.EXE",
        description: "Хоррор-платформер про стикмена по мотивам Sonic.exe.",
        lang: "ru",
        theme_color: "#000000",
        background_color: "#000000",
        display: "fullscreen",
        orientation: "landscape",
        start_url: "./",
        scope: "./",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          {
            src: "icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          { src: "favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
        ],
      },
      workbox: {
        // что класть в офлайн-кэш (precache) при установке SW:
        // код, разметка, картинки и ВСЕ звуки игры
        globPatterns: [
          "**/*.{js,css,html,svg,png,jpg,jpeg,gif,webp,ico,wav,mp3,ogg,woff2}",
        ],
        // без минификации бандл больше (~5МБ) — поднимаем лимит precache с запасом
        maximumFileSizeToCacheInBytes: 16 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        // одностраничное приложение: любые навигации отдаём index.html из кэша
        navigateFallback: "index.html",
      },
      // включить SW в режиме разработки не нужно (мешает HMR);
      // офлайн проверяем на собранной версии (npm run build + npm run preview)
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
